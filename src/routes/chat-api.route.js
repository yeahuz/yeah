import * as ChatApiController from "../controllers/chat-api.controller.js";
import { external_client, chat_member, authenticated_user } from "../utils/roles.js";

export const chat_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id/messages",
    handler: ChatApiController.create_message,
    onRequest: fastify.can_api([chat_member]),
  });

  fastify.route({
    method: "PATCH",
    url: "/:id/messages/:message_id",
    handler: ChatApiController.update_message,
    onRequest: fastify.can_api([chat_member]),
  });
};
