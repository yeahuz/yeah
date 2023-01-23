import * as CategoryApiController from "../controllers/category-api.controller.js";
import { authenticated_user, admin_user } from "../utils/roles.js";

export const category_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: CategoryApiController.get_many,
    onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "POST",
    url: "/",
    handler: CategoryApiController.create_one,
    onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
};
