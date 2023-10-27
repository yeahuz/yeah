import * as AttachmentController from "../controllers/attachment.controller.js";

export let attachment = (fastify, opts, done) => {
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: AttachmentController.delete_one,
    config: { public: true }
  });

  done();
};
