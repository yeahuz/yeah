import * as CategoryApiController from "../controllers/category-api.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";

export let category_api = (fastify, opts, done) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: CategoryApiController.get_many,
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/",
    handler: CategoryApiController.create_one,
    onRequest: policy_guard((ability) => ability.can("manage", "Category"))
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: CategoryApiController.delete_one,
    onRequest: policy_guard((ability) => ability.can("manage", "Category"))
  });

  done();
};
