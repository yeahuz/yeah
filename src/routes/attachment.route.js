import * as AttachmentController from "../controllers/attachment.controller.js";

export let attachment = async (fastify) => {
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: AttachmentController.delete_one,
    config: { public: true }
  });
};
