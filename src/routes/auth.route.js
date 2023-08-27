import * as AuthController from "../controllers/auth.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";
import { auth_schema } from "../schemas/auth.schema.js";

export let auth = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/login",
    handler: AuthController.get_login,
    config: { public: true },
  });
  fastify.route({
    method: "GET",
    url: "/signup",
    handler: AuthController.get_signup,
    config: { public: true },
  });
  fastify.route({
    method: "POST",
    url: "/signup",
    handler: AuthController.signup,
    config: { public: true },
  });
  fastify.route({
    method: "POST",
    url: "/otp",
    handler: AuthController.create_otp,
    schema: auth_schema.create_otp,
    config: {
      public: true,
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
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/qr/:token",
    handler: AuthController.get_qr_login,
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/qr/:token/confirmation",
    handler: AuthController.qr_login_confirm,
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/qr",
    handler: AuthController.qr_login,
    constraints: { accept: "application/json" },
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthController.login,
    schema: auth_schema.login,
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/logout",
    handler: AuthController.logout
  });
  fastify.route({
    method: "GET",
    url: "/google",
    handler: AuthController.google_callback,
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/google",
    handler: AuthController.google_one_tap,
    schema: auth_schema.google_one_tap,
    config: { public: true },
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/telegram",
    handler: AuthController.telegram_callback,
    schema: auth_schema.telegram,
    config: { public: true },
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
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/credentials",
    handler: AuthController.update_credentials,
  });
  fastify.route({
    method: "DELETE",
    url: "/credentials",
    handler: AuthController.delete_credentials,
    constraints: { accept: "application/json" },
  });
  fastify.route({
    method: "POST",
    url: "/credentials/:id",
    handler: AuthController.update_credential,
    onRequest: policy_guard((ability) => ability.can("manage", "Credential"))
  });
  fastify.route({
    method: "DELETE",
    url: "/credentials/:id",
    handler: AuthController.delete_credential,
    constraints: { accept: "application/json" },
    onRequest: policy_guard((ability) => ability.can("manage", "Credential")),
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
    onRequest: policy_guard((ability) => ability.can("manage", "Session"))
  });
  fastify.route({
    method: "POST",
    url: "/sessions/:id",
    handler: AuthController.update_session,
    onRequest: policy_guard((ability) => ability.can("manage", "Session"))
  });
};
