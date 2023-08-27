import * as BillingController from "../controllers/billing.controller.js";

export let billing = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/payme",
    handler: BillingController.payme,
  });
  fastify.route({
    method: "GET",
    url: "/click",
    handler: BillingController.click,
  });
  fastify.route({
    method: "POST",
    url: "/octo",
    handler: BillingController.octo,
  });
  fastify.route({
    method: "GET",
    url: "/octo",
    handler: BillingController.octo,
  });
};
