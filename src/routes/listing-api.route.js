import * as ListingApiController from "../controllers/listing-api.controller.js";
import { external_client, admin_user } from "../utils/roles.js";

export const listing_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ListingApiController.get_many,
  });
  fastify.route({
    method: "GET",
    url: "/filters",
    handler: ListingApiController.get_filters,
  });
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: ListingApiController.get_one,
  });
  fastify.route({
    method: "PATCH",
    url: "/:id",
    handler: ListingApiController.update_one,
    onRequest: fastify.can_api([external_client, admin_user]),
  });
};
