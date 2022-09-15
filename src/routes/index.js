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
import { cfimg } from "./cfimg.route.js";

export const routes = async (fastify) => {
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
};
