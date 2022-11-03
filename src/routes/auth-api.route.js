import * as AuthApiController from "../controllers/auth-api.controller.js";
import { auth_api_schema } from "../schemas/auth-api.schema.js";
import { guest_user, own_session, external_client } from "../utils/roles.js";

export const auth_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthApiController.login,
    schema: auth_api_schema.login,
    onRequest: fastify.can_api([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/admin/login",
    handler: AuthApiController.admin_login,
    onRequest: fastify.can_api([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/external/login",
    handler: AuthApiController.external_client_login,
    onRequest: fastify.can_api([guest_user]),
  });
  fastify.route({
    method: "GET",
    url: "/requests",
    handler: AuthApiController.generate_request,
  });

  fastify.route({
    method: "POST",
    url: "/assertions",
    handler: AuthApiController.verify_assertion,
  });
  fastify.route({
    method: "GET",
    url: "/sessions/:id",
    handler: AuthApiController.get_session,
    onRequest: fastify.can_api([own_session, external_client]),
  });
  fastify.route({
    method: "DELETE",
    url: "/sessions/:id",
    handler: AuthApiController.delete_session,
    onRequest: fastify.can_api([own_session, external_client]),
  });
};
