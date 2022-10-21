import * as ChatApiController from "../controllers/chat-api.controller.js";

export const chat_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id/messages",
    handler: ChatApiController.create_message,
  });
  fastify.route({
    method: "POST",
    url: "/:id/files",
    handler: ChatApiController.link_files,
  });
  fastify.route({
    method: "POST",
    url: "/:id/photos",
    handler: ChatApiController.link_photos,
  });
};
