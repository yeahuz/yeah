import * as HomeController from "../controllers/home.controller.js";
import * as PostingController from "../controllers/posting.controller.js";

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
    url: "/:username",
    handler: HomeController.get_profile,
  });
};
