import * as ChatController from "../controllers/chat.controller.js";

export const chat = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ChatController.get_many,
  });
  fastify.route({
    method: "GET",
    url: "/:hash_id",
    handler: ChatController.get_one,
  });
};
