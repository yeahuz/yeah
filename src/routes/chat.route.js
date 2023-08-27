import * as ChatController from "../controllers/chat.controller.js";

export let chat = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ChatController.get_many,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    handler: ChatController.get_one,
  });

  fastify.route({
    method: "POST",
    url: "/:id/messages",
    handler: ChatController.create_message,
  });
};
