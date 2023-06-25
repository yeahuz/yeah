import * as UserController from "../controllers/user.controller.js";
import { current_user, authenticated_user } from "../utils/roles.js";

export const user = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id/phones/otp",
    handler: UserController.send_phone_code,
    onRequest: fastify.can([authenticated_user, current_user], { relation: "and" }),
    // config: {
    //   rateLimit: {
    //     max: 3,
    //     timeWindow: 43200000,
    //   },
    // },
  });
  fastify.route({
    method: "POST",
    url: "/:id/phones",
    handler: UserController.update_phone,
    onRequest: fastify.can([authenticated_user, current_user], { relation: "and" }),
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
    onRequest: fastify.can([authenticated_user, current_user], { relation: "and" }),
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
    onRequest: fastify.can([authenticated_user, current_user], { relation: "and" }),
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
    onRequest: fastify.can([authenticated_user, current_user], { relation: "and" }),
  });
  fastify.route({
    method: "POST",
    url: "/:id",
    handler: UserController.update_one,
    onRequest: fastify.can([authenticated_user, current_user], { relation: "and" }),
  });
  fastify.route({
    method: "GET",
    url: "/:username",
    handler: UserController.get_one,
  })
};
