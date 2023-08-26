import * as ProfileController from "../controllers/profile.controller.js";

export let profile = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ProfileController.get_profile,
  });
  fastify.route({
    method: "GET",
    url: "/overview",
    handler: ProfileController.get_overview,
  });
  fastify.route({
    method: "GET",
    url: "/rv",
    handler: ProfileController.get_recently_viewed,
  });
  fastify.route({
    method: "GET",
    url: "/watchlist",
    handler: ProfileController.get_watchlist,
  });
  fastify.route({
    method: "GET",
    url: "/purchases",
    handler: ProfileController.get_purchases,
  });
};
