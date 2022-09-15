import * as AttachmentController from "../controllers/attachment.controller.js";
import { guest_user } from "../utils/roles.js";

export const attachment = async (fastify) => {
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: AttachmentController.delete_one,
    onRequest: fastify.can(guest_user),
  });
};
