import * as AuthController from "../controllers/auth.controller.js";
import { auth_schema } from "../schemas/auth.schema.js";
import { authenticated_user, guest_user, own_credential, own_session } from "../utils/roles.js";

export const auth = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/login",
    handler: AuthController.get_login,
    onRequest: fastify.can([guest_user]),
  });
  fastify.route({
    method: "GET",
    url: "/signup",
    handler: AuthController.get_signup,
    onRequest: fastify.can([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/signup",
    handler: AuthController.signup,
    onRequest: fastify.can([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/otp",
    handler: AuthController.create_otp,
    schema: auth_schema.create_otp,
    config: {
      rateLimit: {
        max: 5,
        timeWindow: 43200000,
      },
    },
  });
  fastify.route({
    method: "POST",
    url: "/otp/confirmation",
    handler: AuthController.confirm_otp,
    schema: auth_schema.confirm_otp,
  });
  fastify.route({
    method: "GET",
    url: "/qr/:token",
    handler: AuthController.get_qr_login,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "POST",
    url: "/qr/:token/confirmation",
    handler: AuthController.qr_login_confirm,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "POST",
    url: "/qr",
    handler: AuthController.qr_login,
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthController.login,
    schema: auth_schema.login,
    onRequest: fastify.can([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/logout",
    handler: AuthController.logout,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/google",
    handler: AuthController.google_callback,
    onRequest: fastify.can([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/google",
    handler: AuthController.google_one_tap,
    schema: auth_schema.google_one_tap,
    onRequest: fastify.can([guest_user]),
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/telegram",
    handler: AuthController.telegram_callback,
    schema: auth_schema.telegram,
    onRequest: fastify.can([guest_user]),
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "GET",
    url: "/requests",
    handler: AuthController.generate_request,
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "GET",
    url: "/webauthn",
    handler: AuthController.get_webauthn,
    onRequest: fastify.can([guest_user]),
  });
  fastify.route({
    method: "POST",
    url: "/credentials",
    handler: AuthController.update_credentials,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "DELETE",
    url: "/credentials",
    handler: AuthController.delete_credentials,
    onRequest: fastify.can([authenticated_user]),
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/credentials/:id",
    handler: AuthController.update_credential,
    onRequest: fastify.can([authenticated_user, own_credential], { relation: "and" }),
  });
  fastify.route({
    method: "DELETE",
    url: "/credentials/:id",
    handler: AuthController.delete_credential,
    onRequest: fastify.can([authenticated_user, own_credential], { relation: "and" }),
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/assertions",
    handler: AuthController.verify_assertion,
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/sessions",
    handler: AuthController.update_sessions,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "POST",
    url: "/sessions/:id",
    handler: AuthController.update_session,
    onRequest: fastify.can([authenticated_user, own_session], { relation: "and" }),
  });
};
