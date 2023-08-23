import * as ProfileController from "../controllers/profile.controller.js";
import { authenticated_user } from "../utils/roles.js";

export let profile = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ProfileController.get_profile,
    onRequest: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "GET",
    url: "/overview",
    handler: ProfileController.get_overview,
    onRequest: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "GET",
    url: "/rv",
    handler: ProfileController.get_recently_viewed,
    onRequest: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "GET",
    url: "/watchlist",
    handler: ProfileController.get_watchlist,
    onRequest: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "GET",
    url: "/purchases",
    handler: ProfileController.get_purchases,
    onRequest: fastify.can([authenticated_user])
  });
};
