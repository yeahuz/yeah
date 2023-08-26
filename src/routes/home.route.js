import * as HomeController from "../controllers/home.controller.js";

export let home = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: HomeController.get_index,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/partials/:partial",
    handler: HomeController.get_partial,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/me",
    handler: HomeController.get_me
  });
  fastify.route({
    method: "GET",
    url: "/avatars",
    handler: HomeController.get_avatar,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/clock",
    handler: HomeController.get_time,
    config: { public: true }
  });
};
