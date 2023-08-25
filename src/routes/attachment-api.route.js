import * as AttachmentController from "../controllers/attachment-api.controller.js";

export const attachment_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/",
    handler: AttachmentController.create_one
  });
};
