import * as ListingController from "../controllers/listing-api.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";

export let listing_api = (fastify, opts, done) => {
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
    onRequest: policy_guard()
  });
  fastify.route({
    method: "POST",
    url: "/:id/attachments",
    handler: ListingController.link_attachments,
    onRequest: policy_guard()
  });
  fastify.route({
    method: "DELETE",
    url: "/:id/attachments/:attachment_id",
    handler: ListingController.unlink_attachment,
    onRequest: policy_guard()
  });

  done();
};
