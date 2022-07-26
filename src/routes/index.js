import { home } from "./home.route.js";
import { auth } from "./auth.route.js";
import { settings } from "./settings.route.js";
import { user } from "./user.route.js";
import { posting } from "./posting.route.js";
import { attachment } from "./attachment.route.js";

export const routes = async (fastify) => {
  fastify.register(home);
  fastify.register(auth, { prefix: "/auth" });
  fastify.register(settings, { prefix: "/settings" });
  fastify.register(user, { prefix: "/users" });
  fastify.register(posting, { prefix: "/postings" });
  fastify.register(attachment, { prefix: "/attachments" });
};
