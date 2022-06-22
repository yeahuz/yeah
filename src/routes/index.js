import { home } from "./home.route.js";
import { auth } from "./auth.route.js";
import { settings } from "./settings.route.js";
import { account } from "./account.route.js";

export const routes = async (fastify) => {
  fastify.register(home);
  fastify.register(auth, { prefix: "/auth" });
  fastify.register(settings, { prefix: "/settings" });
  fastify.register(account, { prefix: "/accounts" });
};
