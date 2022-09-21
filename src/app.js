import fastify from "fastify";
import fastify_static from "@fastify/static";
import fastify_session from "@fastify/secure-session";
import fastify_flash from "@fastify/flash";
import fastify_etag from "@fastify/etag";
import view from "@fastify/view";
import path from "path";
import config from "./config/index.js";
import form_body from "@fastify/formbody";
import multipart from "@fastify/multipart";
import fastify_accepts from "@fastify/accepts";
import fastify_rate_limit from "@fastify/rate-limit";
import os from "os";
import i18n_http_middleware from "i18next-http-middleware";
import ajv_errors from "ajv-errors";
import * as eta from "eta";
import { elastic_client } from "./services/es.service.js";
import { i18next } from "./utils/i18n.js";
import { routes } from "./routes/index.js";
import { is_xhr } from "./plugins/is-xhr.js";
import { chunk_view } from "./plugins/chunk-view.js";
import { init_stream } from "./plugins/init-stream.js";
import { DomainError, InternalError, ValidationError } from "./utils/errors.js";
import { attach_user } from "./plugins/attach-user.js";
import { can } from "./plugins/can.js";
import { ws } from "./plugins/ws.js";
import { add_t } from "./utils/index.js";
import { redis_client } from "./services/redis.service.js";
import * as RegionService from "./services/region.service.js";
import { pg_to_es } from "./jobs.js";
import { render_file } from "./utils/eta.js";
import fs from "fs";

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
    app.register(is_xhr);
    app.register(chunk_view);
    app.register(init_stream);
    app.register(form_body);
    app.register(multipart);
    app.register(fastify_rate_limit, {
      max: 100,
      timeWindow: 1000,
      ban: 2,
      redis: redis_client,
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
      const accept_lang = [
        req.language instanceof Function ? req.language() : req.language,
        "en",
      ].flat();

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
        reply.code(err.status_code).send(err.build(t));
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
      const html = await render_file("/404.html", {
        meta: { lang: req.language },
        referer,
        theme,
        is_navigation_preload,
        t,
      });
      reply.code(404).type("text/html").send(html);
      return reply;
    });

    app.register(fastify_accepts);
    app.register(fastify_etag);

    app.register(attach_user);
    app.register(can);

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

    app.get("/elastic/regions/search", async (req, reply) => {
      const { q, lang = "en" } = req.query;
      const accept = req.accepts();

      const languages = accept.languages().slice(0, 3);
      let boosts = [];

      for (let i = languages.length - 1; i >= 0; i--) {
        boosts.push({
          [`regions_${languages[i]}`]: languages.length - i,
        });
      }

      // Search only in one index, index should contain translation for all languages in one field (raw), formatted_address should contain translation for that index;

      console.log(boosts);

      console.time("Hits");
      const response = await elastic_client.search({
        index: `regions_${lang}`,
        body: {
          query: {
            multi_match: {
              query: q,
              type: "bool_prefix",
              fields: ["combined_address", "combined_address._2gram", "combined_address._3gram"],
            },
          },
          collapse: { field: "district_id" },
          _source: ["formatted_address", "district_id", "region_id", "coords"],
        },
      });
      console.timeEnd("Hits");

      console.log(response);
      return response.body.hits.hits;
    });

    // app.get("/yerelektron", async (req, reply) => {
    //   const response = await fetch("https://api-admin.yerelektron.uz/v1/city");
    //   const data = await response.json().catch(() => {});
    //   for (let i = 0; i < data.cities.length; i++) {
    //     const city = data.cities[i];
    //     const response = await fetch(`https://api-admin.yerelektron.uz/v1/regions/${city.id}`);
    //     const { regions: districts } = await response.json().catch(() => {});
    //     data.cities[i].districts = districts.map(({ city, ...district }) => district);
    //   }

    //   fs.writeFileSync("src/data/soato.json", JSON.stringify(data));
    //   return data;
    // });

    app.get("/parse-location", async (req, reply) => {
      const { cities } = JSON.parse(
        fs.readFileSync(process.cwd() + "/src/data/soato.json", "utf-8")
      );
      for (let i = 0; i < cities.length; i++) {
        const region = cities[i];
        const response = await fetch(`https://geocode.maps.co/search?q=${region.ru_name}`);
        const json = await response.json().catch(() => []);
        const administrative = json.find(
          (item) => item.type === "administrative" && item.class === "boundary"
        );
        console.log({ administrative });
        cities[i].lat = administrative?.lat;
        cities[i].lon = administrative?.lon;
        for (let j = 0; j < region.districts.length; j++) {
          const district = region.districts[j];
          const response = await fetch(`https://geocode.maps.co/search?q=${district.ru_name}`);
          const json = await response.json().catch(() => []);
          const administrative = json.find(
            (item) => item.type === "administrative" && item.class === "boundary"
          );
          console.log({ administrative });
          cities[i].districts[j].lat = administrative?.lat;
          cities[i].districts[j].lon = administrative?.lon;
        }
      }

      fs.writeFileSync("src/data/soato-v2.json", JSON.stringify({ cities, count: 14 }, null, 2));

      return cities;
    });
    // app.get("/parse-soato", async (req, reply) => {
    //   const COUNTRY_LENGTH = 2;
    //   const REGION_LENGTH = 4;
    //   const DISTRICT_LENGTH = 7;
    //   const CITY_LENGTH = 10;
    //   let data = JSON.parse(fs.readFileSync(process.cwd() + "/src/raw-soato.json", "utf-8"));
    //   data.shift();
    //   data.shift();
    //   data.shift();

    //   const parent_child = () => {
    //     for (const item of data) {
    //       const id = item.field1;
    //       item.soato_id = id;
    //       if (id.length === COUNTRY_LENGTH) {
    //         item.parent_id = null;
    //         item.id = id;
    //       }
    //       if (id.length === REGION_LENGTH) {
    //         item.parent_id = id.slice(0, COUNTRY_LENGTH - REGION_LENGTH);
    //         item.id = id.slice(0, REGION_LENGTH);
    //       }

    //       if (id.length === DISTRICT_LENGTH) {
    //         if (id.endsWith("200")) {
    //           item.skip = true;
    //         }
    //         item.parent_id = id.slice(0, REGION_LENGTH);
    //         item.id = id.slice(0, DISTRICT_LENGTH);
    //       }
    //       if (id.length === CITY_LENGTH) {
    //         item.parent_id = id.slice(0, DISTRICT_LENGTH);
    //         item.id = id.slice(0, CITY_LENGTH);
    //       }
    //     }
    //   };

    //   parent_child();

    //   function array_to_tree(arr, parent_id = null) {
    //     return arr
    //       .filter((item) => !item.skip && item.parent_id === parent_id)
    //       .map((child) => ({
    //         name: child.field2,
    //         id: child.soato_id,
    //         children: array_to_tree(arr, child.id),
    //       }));
    //   }

    //   reply.send(array_to_tree(data));
    //   return reply;

    //   // for (let i = 3; i < data.length; i++) {
    //   //   const item = data[i];
    //   //   const id = item.field1;
    //   //   const name = item.field2;
    //   // }

    //   // reply.send({ status: "oke" });
    //   // return reply;
    // });

    pg_to_es.start();
    app.register(routes);

    await app.listen({ port: config.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
