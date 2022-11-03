import * as AuthApiController from "../controllers/auth-api.controller.js";
import { auth_api_schema } from "../schemas/auth-api.schema.js";

export const auth_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthApiController.login,
    schema: auth_api_schema.login,
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
  });
  fastify.route({
    method: "DELETE",
    url: "/sessions/:id",
    handler: AuthApiController.delete_session,
  });
};
