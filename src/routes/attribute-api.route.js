import * as AttributeApiController from "../controllers/attribute-api.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";
import { authenticated_user, admin_user } from "../utils/roles.js";

export let attribute_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: AttributeApiController.get_many,
    onRequest: policy_guard((ability) => ability.can("read", "Attribute"))
    //onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "POST",
    url: "/",
    handler: AttributeApiController.create_one,
    onRequest: policy_guard((ability) => ability.can("create", "Attribute"))
    //onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: AttributeApiController.delete_one,
    onRequest: policy_guard((ability) => ability.can("delete", "Attribute"))
    //onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "GET",
    url: "/:id/translations",
    handler: AttributeApiController.get_translations,
    onRequest: policy_guard((ability) => ability.can("read", "Attribute"))
    //onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  })
};
