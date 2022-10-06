import * as AuthApiController from "../controllers/auth-api.controller.js";
import { guest_user } from "../utils/roles.js";
import { auth_api_schema } from "../schemas/auth-api.schema.js";

export const auth_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthApiController.login,
    schema: auth_api_schema.login,
    onRequest: fastify.can(guest_user),
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
};
