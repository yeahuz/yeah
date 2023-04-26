import * as AttributeApiController from "../controllers/attribute-api.controller.js";
import { authenticated_user, admin_user } from "../utils/roles.js";

export const attribute_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: AttributeApiController.get_many,
    onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "POST",
    url: "/",
    handler: AttributeApiController.create_one,
    onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: AttributeApiController.delete_one,
    onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  });
  fastify.route({
    method: "GET",
    url: "/:id/translations",
    handler: AttributeApiController.get_translations,
    onRequest: fastify.can_api([authenticated_user, admin_user], { relation: "and" }),
  })
};
