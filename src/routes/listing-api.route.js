import * as ListingController from "../controllers/listing-api.controller.js";
import { external_client, admin_user } from "../utils/roles.js";

export const listing_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ListingController.get_many,
  });
  fastify.route({
    method: "GET",
    url: "/filters",
    handler: ListingController.get_filters,
  });
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: ListingController.get_one,
  });
  fastify.route({
    method: "PATCH",
    url: "/:id",
    handler: ListingController.update_one,
    onRequest: fastify.can_api([external_client, admin_user]),
  });
  fastify.route({
    method: "POST",
    url: "/:id/attachments",
    handler: ListingController.link_attachments
  });
  fastify.route({
    method: "DELETE",
    url: "/:id/attachments/:attachment_id",
    handler: ListingController.unlink_attachment
  });
};
