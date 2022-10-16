import * as ChatController from "../controllers/chat.controller.js";
import { chat_member, authenticated_user } from "../utils/roles.js";

export const chat = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: ChatController.get_many,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "GET",
    url: "/:hash_id",
    handler: ChatController.get_one,
    onRequest: fastify.can(authenticated_user, chat_member),
  });
};
