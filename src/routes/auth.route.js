import * as AuthController from "../controllers/auth.controller.js";
import { auth_schema } from "../schemas/auth.schema.js";
import { authenticated_user, guest_user } from '../utils/roles.js'

export const auth = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/login",
    handler: AuthController.get_login,
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "GET",
    url: "/signup",
    handler: AuthController.get_signup,
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "POST",
    url: "/signup",
    handler: AuthController.signup,
    schema: {
      body: auth_schema.common,
    },
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthController.login,
    schema: {
      body: auth_schema.common,
    },
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "POST",
    url: "/logout",
    handler: AuthController.logout,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "GET",
    url: "/google",
    handler: AuthController.google_callback,
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "POST",
    url: "/google",
    handler: AuthController.google_one_tap,
    schema: {
      body: auth_schema.google_one_tap,
    },
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "POST",
    url: "/telegram",
    handler: AuthController.telegram_callback,
    schema: {
      body: auth_schema.telegram,
    },
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "GET",
    url: "/requests",
    handler: AuthController.generate_request,
  });
  fastify.route({
    method: "GET",
    url: "/webauthn",
    handler: AuthController.get_webauthn,
    onRequest: fastify.can(guest_user),
  });
  fastify.route({
    method: "POST",
    url: "/credentials",
    handler: AuthController.add_credential,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "POST",
    url: "/credentials/:id",
    handler: AuthController.update_credential,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "POST",
    url: "/assertions",
    handler: AuthController.verify_assertion,
  });
  fastify.route({
    method: "POST",
    url: "/sessions",
    handler: AuthController.update_sessions,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "POST",
    url: "/sessions/:id",
    handler: AuthController.update_session,
    onRequest: fastify.can(authenticated_user),
  })
};
