import * as GeoController from "../controllers/geo.controller.js";

export const geo = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/predictions",
    handler: GeoController.get_predictions,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/geocode",
    handler: GeoController.geocode,
    config: { public: true }
  });
};
