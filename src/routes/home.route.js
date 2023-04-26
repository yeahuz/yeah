import * as HomeController from "../controllers/home.controller.js";

export const home = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: HomeController.get_index,
  });
  fastify.route({
    method: "GET",
    url: "/partials/:partial",
    handler: HomeController.get_partial,
  });
  fastify.route({
    method: "GET",
    url: "/me",
    handler: HomeController.get_me,
  });
  fastify.route({
    method: "GET",
    url: "/avatars",
    handler: HomeController.get_avatar,
  });
  fastify.route({
    method: "GET",
    url: "/clock",
    handler: HomeController.get_time,
  });
  // fastify.route({
  //   method: "GET",
  //   url: "/:username",
  //   handler: HomeController.get_profile,
  // });
};
