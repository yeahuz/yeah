import fastify from "fastify";
import fastify_static from "@fastify/static";
import fastify_session from "@fastify/secure-session";
import fastify_flash from "@fastify/flash";
import view from "@fastify/view";
import path from "path";
import config from "./config/index.js";
import form_body from "@fastify/formbody";
import multipart from "@fastify/multipart";
import fastify_rate_limit from "@fastify/rate-limit";
import os from "os";
import i18n_http_middleware from "i18next-http-middleware";
import ajv_errors from "ajv-errors";
import * as eta from "eta";

import { elastic_client } from "./services/es.service.js";
import { i18next } from "./utils/i18n.js";
import { routes, api_routes } from "./routes/index.js";
import { DomainError, FloodError, InternalError, ValidationError } from "./utils/errors.js";
import { ws } from "./plugins/ws.js";
import { can } from "./plugins/can.js";
import { add_t } from "./utils/index.js";
import { redis_client } from "./services/redis.service.js";
import * as RegionService from "./services/region.service.js";
import { pg_to_es } from "./jobs.js";
import { render_file } from "./utils/eta.js";
import qs from "qs";

process.env.UV_THREADPOOL_SIZE = os.cpus().length;

export async function start() {
  const app = fastify({
    maxParamLength: 1000,
    logger: true,
    ignoreTrailingSlash: true,
    trustProxy: true,
    ajv: {
      customOptions: { allErrors: true, messages: true, useDefaults: true },
      plugins: [ajv_errors],
    },
  });

  try {
    app.register(form_body, {
      parser: (str) => qs.parse(str, { allowDots: true }),
    });
    app.register(multipart);
    app.register(fastify_rate_limit, {
      global: false,
      max: 100,
      timeWindow: 1000,
      ban: 2,
      redis: redis_client,
      errorResponseBuilder: (req, ctx) => {
        const rtf = new Intl.RelativeTimeFormat("ru", { numeric: "always", style: "long" });
        return new FloodError({
          params: { after: rtf.format(Math.floor(ctx.ttl / (1000 * 60 * 60)), "hour") },
        });
      },
    });

    app.register(i18n_http_middleware.plugin, {
      i18next,
    });

    app.register(fastify_session, {
      secret: config.session_cookie_secret,
      cookieName: config.session_cookie_name,
      cookie: {
        httpOnly: true,
        secure: config.node_env === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 31556926,
      },
    });

    app.register(can);
    app.register(fastify_flash);

    app.register(ws);

    app.register(view, {
      engine: {
        eta,
      },
      root: path.join(process.cwd(), "src/views"),
      viewExt: "html",
      propertyName: "render",
    });

    app.register(fastify_static, {
      root: path.join(process.cwd(), "src/public"),
      prefix: "/public",
      decorateReply: false,
      setHeaders: (res) => {
        res.setHeader("Service-Worker-Allowed", "/");
      },
    });

    app.register(fastify_static, {
      root: path.join(process.cwd(), "node_modules"),
      prefix: "/node_modules",
      decorateReply: false,
      setHeaders: (res) => {
        res.setHeader("Service-Worker-Allowed", "/");
      },
    });

    app.setErrorHandler((err, req, reply) => {
      console.log({ err });
      const accept_lang = [req.language instanceof Function ? req.language() : req.language, "en"]
        .filter(Boolean)
        .flat();

      const t = i18next.getFixedT(accept_lang);
      const { return_to } = req.query;

      if (err.validation) {
        if (req.xhr) {
          reply.code(422).send(new ValidationError({ errors: err.validation }).build(t));
          return reply;
        }
        req.flash(
          "validation_errors",
          new ValidationError({ errors: err.validation }).errors_as_object().build(t).errors
        );
        return reply.code(302).redirect(add_t(return_to || req.url));
      }

      if (err instanceof DomainError) {
        if (req.xhr) {
          reply.code(err.status_code).send(err.build(t));
          return reply;
        }

        req.flash("err", err.build(t));
        reply.code(302).redirect(add_t(return_to || req.url));
        return reply;
      }

      reply.code(500).send(new InternalError().build(t));
      return reply;
    });

    app.setNotFoundHandler(async (req, reply) => {
      const accept_lang = [
        req.language instanceof Function ? req.language() : req.language,
        "en",
      ].flat();
      const t = i18next.getFixedT(accept_lang);
      const referer = req.headers["referer"];
      const theme = req.session.get("theme");
      const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
      const is_partial_content = req.headers["x-content-mode"] === "partial";
      const partial = is_navigation_preload || is_partial_content;
      const html = await render_file("/404.html", {
        meta: { lang: req.language },
        referer,
        theme,
        partial,
        t,
      });
      reply.code(404).type("text/html").send(html);
      return reply;
    });

    const accept_strategy = {
      name: "accept",
      storage: function () {
        let handlers = {};
        return {
          get: (type) => {
            return handlers[type] || null;
          },
          set: (type, store) => {
            handlers[type] = store;
          },
        };
      },
      deriveConstraint: (req, ctx) => {
        return req.headers["accept"];
      },
    };

    app.addConstraintStrategy(accept_strategy);
    app.get("/elastic/regions", async (req, reply) => {
      const LANGS = ["en", "uz", "ru"];

      for (const lang of LANGS) {
        const regions = await RegionService.get_regions({ lang });
        for (const region of regions) {
          const other_langs = LANGS.filter((l) => l !== lang);
          const districts = await RegionService.get_districts({ region_id: region.id, lang });

          for (const district of districts) {
            let combined = `${district.long_name}, ${region.long_name}`;
            for (const other_lang of other_langs) {
              const sibling = await RegionService.get_region({ id: region.id, lang: other_lang });
              const sibling_district = await RegionService.get_district({
                id: district.id,
                lang: other_lang,
              });
              combined += `; ${sibling_district.long_name}, ${sibling.long_name}`;
            }

            await elastic_client.index({
              index: `regions_${lang}`,
              body: {
                region_id: region.id,
                district_id: district.id,
                formatted_address: `${district.long_name}, ${region.long_name}`,
                combined_address: combined,
                ...(district.coords && {
                  coords: { lat: district.coords.x, lon: district.coords.y },
                }),
              },
            });
          }
        }
      }

      reply.send({ status: "oke" });
      return reply;
    });

    pg_to_es.start();
    app.register(routes);
    app.register(api_routes, { prefix: "/api" });

    await app.listen({ port: config.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
