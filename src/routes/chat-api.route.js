import * as ChatApiController from "../controllers/chat-api.controller.js";

export const chat_api = (fastify, opts, done) => {
  fastify.route({
    method: "POST",
    url: "/:id/messages",
    handler: ChatApiController.create_message,
  });

  fastify.route({
    method: "PATCH",
    url: "/:id/messages/:message_id",
    handler: ChatApiController.update_message
  });

  done();
};
