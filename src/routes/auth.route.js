import * as AuthController from "../controllers/auth.controller.js";
import { auth_schema } from "../schemas/auth.schema.js";

export const auth = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/login",
    handler: AuthController.get_login,
  });
  fastify.route({
    method: "GET",
    url: "/signup",
    handler: AuthController.get_signup,
  });
  fastify.route({
    method: "POST",
    url: "/signup",
    handler: AuthController.signup,
    schema: {
      body: auth_schema.common,
    },
  });
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthController.login,
    schema: {
      body: auth_schema.common,
    },
  });
  fastify.route({
    method: "POST",
    url: "/logout",
    handler: AuthController.logout,
  });
  fastify.route({
    method: "GET",
    url: "/google",
    handler: AuthController.google_callback,
  });
  fastify.route({
    method: "POST",
    url: "/google",
    handler: AuthController.google_one_tap,
    schema: {
      body: auth_schema.google_one_tap,
    },
  });
  fastify.route({
    method: "POST",
    url: "/telegram",
    handler: AuthController.telegram_callback,
    schema: {
      body: auth_schema.telegram,
    },
  });
};
