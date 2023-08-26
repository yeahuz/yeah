import * as SearchController from "../controllers/search.controller.js";

export const search = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: SearchController.get_search,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/completions",
    handler: SearchController.get_completions,
    config: { public: true }
  });
};
