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
//import os from "os";
import ajv_errors from "ajv-errors";
import { routes, api_routes } from "./routes/index.js";
import { DomainError, FloodError, InternalError, ValidationError } from "./utils/errors.js";
import { can } from "./plugins/can.js";
import { add_t } from "./utils/index.js";
import { i18next_plugin, i18next } from "./utils/i18n.js";
import { redis_client } from "./services/redis.service.js";
import { pg_to_es } from "./jobs.js";
import { render_file, eta } from "./utils/eta.js";

import qs from "qs";
import cors from "@fastify/cors";
import { load_constants } from "./constants/index.js";

// process.env.UV_THREADPOOL_SIZE = os.cpus().length;

export async function start() {
  let app = fastify({
    maxParamLength: 1000,
    ignoreTrailingSlash: true,
    trustProxy: true,
    logger: true,
    ajv: {
      customOptions: { allErrors: true, messages: true, useDefaults: true },
      plugins: [ajv_errors],
    },
  });

  try {
    app.register(form_body, {
      parser: (str) => qs.parse(str, { allowDots: true })
    });
    app.register(multipart);
    app.register(i18next_plugin);
    app.register(fastify_rate_limit, {
      global: false,
      max: 100,
      timeWindow: 1000,
      ban: 2,
      redis: redis_client,
      errorResponseBuilder: (req, ctx) => {
        let rtf = new Intl.RelativeTimeFormat("ru", { numeric: "always", style: "long" });
        return new FloodError({
          params: { after: rtf.format(Math.floor(ctx.ttl / (1000 * 60 * 60)), "hour") },
        });
      },
    });

    app.register(fastify_session, {
      secret: config.session_cookie_secret,
      cookieName: config.session_cookie_name,
      cookie: {
        httpOnly: true,
        secure: config.node_env === "production" || config.node_env === "staging",
        sameSite: "lax",
        path: "/",
        maxAge: 31556926,
        domain: new URL(config.origin).hostname
      },
    });

    app.register(can);
    app.register(fastify_flash);

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

    app.register(cors, {
      origin: config.origin_cors.split(","),
      credentials: true
    });

    app.setErrorHandler((err, req, reply) => {
      console.log({ err });
      let accept_lang = req.headers["accept-language"]
      let t = req.t || i18next.getFixedT(accept_lang ? accept_lang : [])
      let { err_to = "/" } = req.query;

      if (err.validation) {
        if (req.xhr) {
          reply.code(422).send(new ValidationError({ errors: err.validation }).build(t));
          return reply;
        }
        req.flash(
          "validation_errors",
          new ValidationError({ errors: err.validation }).errors_as_object().build(t).errors
        );
        return reply.code(302).redirect(add_t(err_to || req.url));
      }

      if (err instanceof DomainError) {
        if (req.xhr) {
          reply.code(err.status_code).send(err.build(t));
          return reply;
        }

        req.flash("err", err.build(t));
        reply.code(302).redirect(add_t(err_to || req.url));
        return reply;
      }

      reply.code(500).send(new InternalError().build(t));
      return reply;
    });

    app.setNotFoundHandler(async (req, reply) => {
      let accept_lang = req.headers["accept-language"]
      let t = req.t || i18next.getFixedT(accept_lang ? accept_lang : [])
      let referer = req.headers["referer"];
      let theme = req.session.get("theme");
      let is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
      let is_partial_content = req.headers["x-content-mode"] === "partial";
      let partial = is_navigation_preload || is_partial_content;
      let html = await render_file("/404.html", {
        meta: { lang: req.language },
        referer,
        theme,
        partial,
        t,
      });
      reply.code(404).type("text/html").send(html);
      return reply;
    });

    let accept_strategy = {
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

    await load_constants();
    app.addConstraintStrategy(accept_strategy);
    pg_to_es.start();
    app.register(routes);
    app.register(api_routes, { prefix: "/api" });

    await app.listen({ port: config.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
