import * as SearchController from "../controllers/search.controller.js";

export let search = (fastify, opts, done) => {
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

  done();
};
