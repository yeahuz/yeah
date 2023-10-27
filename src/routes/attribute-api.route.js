import * as AttributeApiController from "../controllers/attribute-api.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";

export let attribute_api = (fastify, opts, done) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: AttributeApiController.get_many,
    onRequest: policy_guard((ability) => ability.can("read", "Attribute"))
  });
  fastify.route({
    method: "POST",
    url: "/",
    handler: AttributeApiController.create_one,
    onRequest: policy_guard((ability) => ability.can("create", "Attribute"))
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: AttributeApiController.delete_one,
    onRequest: policy_guard((ability) => ability.can("delete", "Attribute"))
  });
  fastify.route({
    method: "GET",
    url: "/:id/translations",
    handler: AttributeApiController.get_translations,
    onRequest: policy_guard((ability) => ability.can("read", "Attribute"))
  });

  done();
};
