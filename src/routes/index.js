import fastify_etag from "@fastify/etag";
import fastify_accepts from "@fastify/accepts";
import { i18next } from "../utils/i18n.js";
import { home } from "./home.route.js";
import { auth } from "./auth.route.js";
import { settings } from "./settings.route.js";
import { user } from "./user.route.js";
import { posting } from "./posting.route.js";
import { attachment } from "./attachment.route.js";
import { geo } from "./geo.route.js";
import { search } from "./search.route.js";
import { category } from "./category.route.js";
import { payment } from "./payment.route.js";
import { billing } from "./billing.route.js";
import { cfimg } from "./cfimg.route.js";
import { cfr2 } from "./cfr2.route.js";
import { chat } from "./chat.route.js";

// API routes
import { auth_api } from "./auth-api.route.js";
import { user_api } from "./user-api.route.js";
import { posting_api } from "./posting-api.route.js";
import { chat_api } from "./chat-api.route.js";

// Plugins
import { attach_user } from "../plugins/attach-user.js";
import { is_xhr } from "../plugins/is-xhr.js";
import { is_partial } from "../plugins/is-partial.js";
import { chunk_view } from "../plugins/chunk-view.js";
import { init_stream } from "../plugins/init-stream.js";
import { DomainError, ValidationError, InternalError } from "../utils/errors.js";

export const routes = async (fastify) => {
  // Plugins
  fastify.register(fastify_accepts);
  fastify.register(fastify_etag);
  fastify.register(is_xhr);
  fastify.register(is_partial);
  fastify.register(chunk_view);
  fastify.register(init_stream);
  fastify.register(attach_user);

  // Routes
  fastify.register(home);
  fastify.register(auth, { prefix: "/auth" });
  fastify.register(settings, { prefix: "/settings" });
  fastify.register(user, { prefix: "/users" });
  fastify.register(posting, { prefix: "/postings" });
  fastify.register(attachment, { prefix: "/attachments" });
  fastify.register(geo, { prefix: "/geo" });
  fastify.register(search, { prefix: "/search" });
  fastify.register(category, { prefix: "/categories" });
  fastify.register(category, { prefix: "/c" });
  fastify.register(payment, { prefix: "/payments" });
  fastify.register(cfimg, { prefix: "/cloudflare/images" });
  fastify.register(cfr2, { prefix: "/cloudflare/r2" });
  fastify.register(billing, { prefix: "/billing" });
  fastify.register(chat, { prefix: "/chats" });
};

export const api_routes = async (fastify) => {
  fastify.register(attach_user);
  fastify.register(auth_api, { prefix: "/auth" });
  fastify.register(user_api, { prefix: "/users" });
  fastify.register(posting_api, { prefix: "/postings" });
  fastify.register(chat_api, { prefix: "/chats" });

  fastify.setErrorHandler((err, req, reply) => {
    const lang = req.language;
    const t = i18next.getFixedT(lang);
    if (err.validation) {
      reply.code(422).send(new ValidationError({ errors: err.validation }).build(t));
      return reply;
    }

    if (err instanceof DomainError) {
      reply.code(err.status_code).send(err.build(t));
      return reply;
    }

    reply.code(500).send(new InternalError().build(t));
    return reply;
  });
};
