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
import os from "os";
import i18n_http_middleware from "i18next-http-middleware";
import ajv_errors from "ajv-errors";
import * as S3Service from './services/s3.service.js'
import * as RegionService from './services/region.service.js'
import { elastic_client } from './services/es.service.js'
import { i18next } from "./utils/i18n.js";
import * as eta from "eta";
import { routes } from "./routes/index.js";
import { is_xhr } from "./plugins/is-xhr.js";
import { chunk_view } from "./plugins/chunk-view.js";
import { init_stream } from "./plugins/init-stream.js";
import { DomainError, InternalError, ValidationError } from "./utils/errors.js";
import { attach_user } from "./plugins/attach-user.js";
import { can } from "./plugins/can.js";
import { add_t } from "./utils/index.js";

process.env.UV_THREADPOOL_SIZE = os.cpus().length;

export async function start() {
  const app = fastify({
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
    });

    app.register(fastify_static, {
      root: path.join(process.cwd(), "node_modules"),
      prefix: "/node_modules",
      decorateReply: false,
    });

    app.setErrorHandler((err, req, reply) => {
      console.log({ err });
      const t = i18next.getFixedT(
        (req.language instanceof Function ? req.language() : req.language) ||
          "en"
      );
      const { return_to } = req.query;

      if (err.validation) {
        if (req.xhr) {
          reply
            .code(422)
            .send(new ValidationError({ errors: err.validation }).build(t));
          return reply;
        }

        req.flash(
          "validation_errors",
          new ValidationError({ errors: err.validation })
            .errors_as_object()
            .build(t).errors
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

    app.setNotFoundHandler((req, res) => {
      const referer = req.headers["referer"];
      res.code(404).render("404.html", { referer });
    });

    app.register(fastify_accepts);
    app.register(fastify_etag);

    app.register(attach_user);
    app.register(can);
    // app.get("/elastic/regions", async (req, reply) => {
    //   const { lang = "en" } = req.query;
    //   const regions = await RegionService.get_many({ lang });

    //   let reduced = regions.reduce((acc, cur) => {
    //     acc[cur.lang] = cur;
    //     acc[cur.lang].districts = cur.districts.reduce((a, c) => {
    //       if(!(a[c.lang])) a[c.lang] = []
    //       a[c.lang].push(c)
    //       return a;
    //     }, {})
    //     return acc;
    //   }, {});

    //   for (const lng in reduced) {
    //     const region = reduced[lng];
    //     const districts = region.districts[lng];
    //     const keys = Object.keys(region.districts).filter(k => k !== lng);

    //     for (const district of districts) {
    //       let combined = `${district.long_name}, ${region.long_name}`
    //       for (const key of keys) {
    //         const siblings_districts = region.districts[key];
    //         const sibling_region = reduced[key];
    //         const friend = siblings_districts.find(d => d.id === district.id);
    //         combined += `; ${friend.long_name}, ${sibling_region.long_name}`;
    //       }

    //       await elastic_client.index({
    //         index: `regions_${lng}`,
    //         body: {
    //           region_id: region.id,
    //           district_id: district.id,
    //           formatted_address: `${district.long_name}, ${region.long_name}`,
    //           combined_address: combined,
    //           coords: {
    //             lat: district.coords.x,
    //             lon: district.coords.y
    //           }
    //         }
    //       })
    //     }
    //   }

    //   // for( const region of regions ) {
    //   //   for (const district of region.districts) {
    //   //       console.log( {district} );
    //   //   }
    //   // }
    //   // const languages = ["ru", "uz", "en"];

    //   // for (const region of regions) {
    //   //   for (const district of region.districts) {
    //   //     await elastic_client.index({
    //   //       index: `reg_v2_${lang}`,
    //   //       body: {
    //   //         region_id: region.id,
    //   //         district_id: district.id,
    //   //         formatted_address: `${district.long_name}, ${region.long_name}`,
    //   //         coords: [district.coords.x, district.coords.y],
    //   //       }
    //   //     })
    //   //   }
    //   // }

    //   return { status: "oke" }
    // });

    app.get("/elastic/regions/search", async (req, reply) => {
      const { q, lang = "en" } = req.query;
      const accept = req.accepts();

      const languages = accept.languages().slice(0, 3);
      console.log(languages);
      let boosts = []

      for (let i = languages.length - 1; i >= 0; i--) {
        boosts.push({
          [`regions_${languages[i]}`]: languages.length - i
        })
      }

      // Search only in one index, index should contain translation for all languages in one field (raw), formatted_address should contain translation for that index;

      console.log(boosts);

      console.time("Hits");
      const response = await elastic_client.search({ index: `regions_${lang}`, body: {
                                        query: { multi_match: { query: q, type: "bool_prefix", fields: ["combined_address", "combined_address._2gram", "combined_address._3gram"] } },
                                        collapse: { field: "district_id" }, _source: ["formatted_address", "district_id", "region_id", "coords"] }});
      console.timeEnd("Hits");

      console.log(response)
      return response.body.hits.hits;
    });

    app.register(routes);

    await app.listen({ port: config.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
