import * as HomeController from "../controllers/home.controller.js";

export const home = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: HomeController.get_index,
  });

  fastify.route({
    method: "GET",
    url: "/:username",
    handler: HomeController.get_profile,
  });
};
