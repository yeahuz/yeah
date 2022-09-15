import { new_posting_schema } from "../schemas/new-posting.schema.js";
import * as PostingController from "../controllers/posting.controller.js";

export const posting = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/new",
    handler: PostingController.get_new,
  });
  fastify.route({
    method: "GET",
    url: "/wizard/:id/:step",
    handler: PostingController.get_step,
    schema: {
      params: {
        type: "object",
        properties: {
          id: { type: "string" },
          step: { type: "number" },
        },
      },
    },
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/1",
    handler: PostingController.submit_first_step,
    schema: {
      body: new_posting_schema.essential,
    },
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/2",
    handler: PostingController.submit_second_step,
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/3",
    handler: PostingController.submit_third_step,
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/4",
    handler: PostingController.submit_fourth_step,
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/2/attachments/:attachment_id",
    handler: PostingController.update_attachment,
  });
  fastify.route({
    method: "POST",
    url: "/wizard/:id/2/attachments",
    handler: PostingController.upload_attachments,
  });
  fastify.route({
    method: "PATCH",
    url: "/wizard/:id/2/attachments",
    handler: PostingController.sync_attachments,
  });
  fastify.route({
    method: "DELETE",
    url: "/wizard/:id/2/attachments/:attachment_id",
    handler: PostingController.delete_attachment,
  });
  fastify.route({
    method: "POST",
    url: "/new",
    handler: PostingController.submit_step,
    schema: {
      body: {
        type: "object",
        properties: {
          title: {
            type: "string",
            minLength: 5,
            errorMessage: { minLength: "!posting_title_minlength" },
          },
          category_id: { type: "string" },
          step: { type: "string", enum: ["1", "2", "3", "4"] },
        },
        // if: {
        //   properties: {
        //     step: {
        //       const: "2"<
        //     }
        //   }
        // }
        if: {
          properties: {
            step: {
              const: "1",
            },
          },
        },
        then: {
          required: ["title", "category_id"],
        },
      },
    },
  });
};
