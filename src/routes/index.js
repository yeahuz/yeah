import fastify_etag from "@fastify/etag";
import fastify_accepts from "@fastify/accepts";
import { home } from "./home.route.js";
import { auth } from "./auth.route.js";
import { settings } from "./settings.route.js";
import { user } from "./user.route.js";
import { listing } from "./listing.route.js";
import { attachment } from "./attachment.route.js";
import { geo } from "./geo.route.js";
import { search } from "./search.route.js";
import { category } from "./category.route.js";
import { payment } from "./payment.route.js";
import { billing } from "./billing.route.js";
import { cf } from "./cf.route.js";
import { chat } from "./chat.route.js";
import { profile } from "./profile.route.js";
import { selling } from "./selling.route.js";
import { i18next } from "../utils/i18n.js";

// API routes
import { auth_api } from "./auth-api.route.js";
import { user_api } from "./user-api.route.js";
import { listing_api } from "./listing-api.route.js";
import { chat_api } from "./chat-api.route.js";
import { category_api } from "./category-api.route.js";
import { attribute_api } from "./attribute-api.route.js";
import { attachment_api } from "./attachment-api.route.js";
import { shipping_service_api } from "./shipping-service-api.route.js";

// Plugins
import { is_xhr } from "../plugins/is-xhr.js";
import { is_partial } from "../plugins/is-partial.js";
import { chunk_view } from "../plugins/chunk-view.js";
import { init_stream } from "../plugins/init-stream.js";
import { DomainError, ValidationError, InternalError } from "../utils/errors.js";
import { api_auth_guard, auth_guard } from "../plugins/auth-guard.js";

export let routes = (fastify, opts, done) => {
  // Plugins
  fastify.register(fastify_accepts);
  fastify.register(fastify_etag);
  fastify.register(is_xhr);
  fastify.register(is_partial);
  fastify.register(chunk_view);
  fastify.register(init_stream);
  fastify.register(auth_guard);

  // Routes
  fastify.register(home);
  fastify.register(auth, { prefix: "/auth" });
  fastify.register(settings, { prefix: "/settings" });
  fastify.register(user, { prefix: "/users" });
  fastify.register(user, { prefix: "/u" });
  fastify.register(listing, { prefix: "/listings" });
  fastify.register(listing, { prefix: "/l" });
  fastify.register(attachment, { prefix: "/attachments" });
  fastify.register(geo, { prefix: "/geo" });
  fastify.register(search, { prefix: "/search" });
  fastify.register(category, { prefix: "/categories" });
  fastify.register(category, { prefix: "/c" });
  fastify.register(payment, { prefix: "/payments" });
  fastify.register(cf, { prefix: "/cf" });
  fastify.register(billing, { prefix: "/billing" });
  fastify.register(profile, { prefix: "/myp" });
  fastify.register(selling, { prefix: "/mys" });
  fastify.register(chat, { prefix: "/chats" });

  done();
};

export let api_routes = (fastify, opts, done) => {
  fastify.register(api_auth_guard);
  fastify.register(auth_api, { prefix: "/auth" });
  fastify.register(user_api, { prefix: "/users" });
  fastify.register(listing_api, { prefix: "/listings" });
  fastify.register(chat_api, { prefix: "/chats" });
  fastify.register(category_api, { prefix: "/categories" });
  fastify.register(attribute_api, { prefix: "/attributes" });
  fastify.register(attachment_api, { prefix: "/attachments" });
  fastify.register(shipping_service_api, { prefix: "/shipping-services" });

  fastify.setErrorHandler(function errorHandler(err, req, reply) {
    let accept_lang = req.headers["accept-language"]
    let t = req.t || i18next.getFixedT(accept_lang ? accept_lang : [])
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

  done();
};
