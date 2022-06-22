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
import { i18next } from "./utils/i18n.js";
// import Negotiator from "negotiator";
import * as eta from "eta";
import { routes } from "./routes/index.js";
import { is_xhr } from "./plugins/is-xhr.js";
import { chunk_view } from "./plugins/chunk-view.js";
import { init_stream } from "./plugins/init-stream.js";
import { DomainError, InternalError } from "./utils/errors.js";
import { authenticate } from "./plugins/authenticate.js";

process.env.UV_THREADPOOL_SIZE = os.cpus().length;

export async function start() {
  const app = fastify({
    logger: true,
    ignoreTrailingSlash: true,
  });

  try {
    app.register(is_xhr);
    app.register(chunk_view);
    app.register(init_stream);
    app.register(form_body);
    app.register(multipart, { attachFieldsToBody: true });
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
      console.log(err);
      const t = req.i18n.t;
      if (err instanceof DomainError) {
        reply.code(err.status_code).send(err.translated(t));
        return reply;
      }
      const internal = new InternalError();
      reply.code(internal.status_code).send(internal.translated(t));
      return reply;
    });

    app.setNotFoundHandler((req, res) => {
      res.code(404).render("404.html");
    });

    app.register(fastify_accepts);
    app.register(fastify_etag);

    // const customResponseTypeStrategy = {
    //   name: "accept",
    //   storage: function () {
    //     let handlers = {};
    //     return {
    //       get: (type) => {
    //         const negotiator = new Negotiator({ headers: { accept: type } });
    //         const accepted = negotiator.mediaType([type]);
    //         console.log(accepted);
    //         return handlers[accepted] || null;
    //       },
    //       set: (type, handler, ...otherStuff) => {
    //         console.log({ type, handler, otherStuff });
    //         handlers[type] = handler;
    //       },
    //     };
    //   },
    //   deriveConstraint: (req, ctx) => {
    //     return req.headers.accept;
    //   },
    //   mustMatchWhenDerived: true,
    // };

    // app.addConstraintStrategy(customResponseTypeStrategy);
    app.register(authenticate);
    app.register(routes);

    await app.listen({ port: config.port });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}
