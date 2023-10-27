import * as ShippingServiceController from "../controllers/shipping-service-api.controller.js"

export let shipping_service_api = (fastify, opts, done) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ShippingServiceController.get_many,
  });

  done();
};
