import * as PaymentController from "../controllers/payment.controller.js";
import { authenticated_user } from "../utils/roles.js";

export const payment = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/new",
    handler: PaymentController.get_new,
  });
  fastify.route({
    method: "POST",
    url: "/new",
    handler: PaymentController.create_new_payment,
  });
};
