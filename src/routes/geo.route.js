import * as GeoController from "../controllers/geo.controller.js"
import { guest_user } from '../utils/roles.js'

export const geo = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/predictions",
    handler: GeoController.get_predictions,
  });
  fastify.route({
    method: "GET",
    url: "/geocode",
    handler: GeoController.geocode
  })
};
