import { new_listing_schema } from "../schemas/new-listing.schema.js";
import * as ListingController from "../controllers/listing.controller.js";
import { authenticated_user } from "../utils/roles.js";

export let listing = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/new",
    handler: ListingController.get_new,
  });
  fastify.route({
    method: "GET",
    url: "/:hash_id",
    handler: ListingController.get_one,
  });
  fastify.route({
    method: "GET",
    url: "/:hash_id/contact",
    handler: ListingController.get_contact,
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
  });

  fastify.route({
    method: "GET",
    url: "/wizard/:id",
    handler: ListingController.get_step
  });
  fastify.route({
    method: "POST",
    url: "/wizard",
    handler: ListingController.submit_step,
    preHandler: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id",
    handler: ListingController.submit_step,
    preHandler: fastify.can([authenticated_user])
  });
  // fastify.route({
  //   method: "GET",
  //   url: "/wizard/:id/:step",
  //   handler: ListingController.get_step,
  //   schema: {
  //     params: {
  //       type: "object",
  //       properties: {
  //         id: { type: "string" },
  //         step: { type: "number" },
  //       },
  //     },
  //   },
  // });
  // fastify.route({
  //   method: "POST",
  //   url: "/wizard/:id/1",
  //   handler: ListingController.submit_first_step,
  //   schema: new_listing_schema.essential,
  // });
  // fastify.route({
  //   method: "POST",
  //   url: "/wizard/:id/2",
  //   handler: ListingController.submit_second_step,
  //   schema: new_listing_schema.general,
  // });
  // fastify.route({
  //   method: "POST",
  //   url: "/wizard/:id/3",
  //   handler: ListingController.submit_third_step,
  //   schema: new_listing_schema.contact,
  // });
  // fastify.route({
  //   method: "POST", url: "/wizard/:id/4", handler: ListingController.submit_fourth_step,
  //   onRequest: fastify.can([authenticated_user])
  // });
  // fastify.route({
  //   method: "POST",
  //   url: "/wizard/:id/2/attachments/:attachment_id",
  //   handler: ListingController.update_attachment,
  // });
  // fastify.route({
  //   method: "POST",
  //   url: "/wizard/:id/2/attachments",
  //   handler: ListingController.upload_attachments,
  // });
  // fastify.route({
  //   method: "PATCH",
  //   url: "/wizard/:id/2/attachments",
  //   handler: ListingController.sync_attachments,
  // });
  // fastify.route({
  //   method: "DELETE",
  //   url: "/wizard/:id/2/attachments/:attachment_id",
  //   handler: ListingController.delete_attachment,
  // });
  // fastify.route({
  //   method: "POST",
  //   url: "/new",
  //   handler: ListingController.submit_step,
  //   schema: {
  //     body: {
  //       type: "object",
  //       properties: {
  //         title: {
  //           type: "string",
  //           minLength: 5,
  //           errorMessage: { minLength: "!listing_title_minlength" },
  //         },
  //         category_id: { type: "string" },
  //         step: { type: "string", enum: ["1", "2", "3", "4"] },
  //       },
  //       // if: {
  //       //   properties: {
  //       //     step: {
  //       //       let: "2"<
  //       //     }
  //       //   }
  //       // }
  //       if: {
  //         properties: {
  //           step: {
  //             const: "1",
  //           },
  //         },
  //       },
  //       then: {
  //         required: ["title", "category_id"],
  //       },
  //     },
  //   },
  // });
};
