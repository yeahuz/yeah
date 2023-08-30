import * as AttachmentController from "../controllers/attachment-api.controller.js";

export let attachment_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/",
    handler: AttachmentController.create_one
  });
};