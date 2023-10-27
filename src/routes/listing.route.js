import { new_listing_schema } from "../schemas/new-listing.schema.js";
import * as ListingController from "../controllers/listing.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";

export let listing = (fastify, opts, done) => {
  fastify.route({
    method: "GET",
    url: "/:hash_id",
    handler: ListingController.get_one,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/:hash_id/contact",
    handler: ListingController.get_contact,
    config: { public: true }
  });
  fastify.route({
    method: "POST",
    url: "/:hash_id/contact",
    handler: ListingController.contact,
  });
  fastify.route({
    method: "GET",
    url: "/wizard",
    handler: ListingController.get_step,
    config: { public: true }
  });
  fastify.route({
    method: "GET",
    url: "/wizard/:id",
    handler: ListingController.get_step
  });
  fastify.route({
    method: "GET",
    url: "/wizard/:id/attrs",
    handler: ListingController.get_attrs,
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/attrs",
    handler: ListingController.save_attrs,
    onRequest: policy_guard(),
  });
  fastify.route({
    method: "GET",
    url: "/wizard/:id/combos",
    handler: ListingController.get_combos,
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/combos",
    handler: ListingController.save_combos,
    onRequest: policy_guard(),
  });
  fastify.route({
    method: "POST",
    url: "/wizard",
    handler: ListingController.submit_step
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id",
    handler: ListingController.submit_step,
    onRequest: policy_guard(),
  });

  done();
};
