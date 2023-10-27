import * as SellingController from "../controllers/selling.controller.js";

export let selling = (fastify, opts, done) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: SellingController.get_selling,
  });
  fastify.route({
    method: "GET",
    url: "/overview",
    handler: SellingController.get_overview,
  });

  done();
};
