import * as CategoryController from "../controllers/category.controller.js";

export let category = (fastify, opts, done) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: CategoryController.get_many,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/:category_id",
    handler: CategoryController.get_many,
    config: { public: true }
  });

  done();
};
