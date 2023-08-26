import * as ChatController from "../controllers/chat.controller.js";
import { chat_member, authenticated_user } from "../utils/roles.js";

export const chat = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ChatController.get_many,
  });

  fastify.route({
    method: "GET",
    url: "/:id",
    handler: ChatController.get_one,
    //onRequest: fastify.can([authenticated_user, chat_member], { relation: "and" }),
  });

  fastify.route({
    method: "POST",
    url: "/:id/messages",
    handler: ChatController.create_message,
    //onRequest: fastify.can([authenticated_user, chat_member], { relation: "and" }),
  });
};
