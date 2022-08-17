import * as CategoryController from "../controllers/category.controller.js"

export const category = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: CategoryController.get_many,
  });
  fastify.route({
    method: "GET",
    url: "/:category_id",
    handler: CategoryController.get_many,
  })
};
