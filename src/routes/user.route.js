import * as UserController from "../controllers/user.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";

export let user = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id/phones/otp",
    handler: UserController.send_phone_code,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
    config: {
      rateLimit: {
        max: 3,
        timeWindow: 43200000,
      },
    },
  });
  fastify.route({
    method: "POST",
    url: "/:id/phones",
    handler: UserController.update_phone,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 43200000,
      },
    },
  });
  fastify.route({
    method: "POST",
    url: "/:id/emails",
    handler: UserController.update_email,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
    config: {
      rateLimit: {
        max: 10,
        timeWindow: 43200000,
      },
    },
  });
  fastify.route({
    method: "POST",
    url: "/:id/emails/otp",
    handler: UserController.send_email_link,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
    config: {
      rateLimit: {
        max: 3,
        timeWindow: 43200000,
      },
    },
  });
  fastify.route({
    method: "GET",
    url: "/:id/emails",
    handler: UserController.get_email_form,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
  });
  fastify.route({
    method: "POST",
    url: "/:id",
    handler: UserController.update_one,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
  });
  fastify.route({
    method: "GET",
    url: "/:username",
    handler: UserController.get_one,
    config: { public: true }
  })
};
