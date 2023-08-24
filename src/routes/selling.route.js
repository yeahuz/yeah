import * as SellingController from "../controllers/selling.controller.js";
import { authenticated_user } from "../utils/roles.js";

export let selling = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: SellingController.get_selling,
    onRequest: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "GET",
    url: "/overview",
    handler: SellingController.get_overview,
    onRequest: fastify.can([authenticated_user])
  });
};
