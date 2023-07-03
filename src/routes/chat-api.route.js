import * as ChatApiController from "../controllers/chat-api.controller.js";
import { external_client, chat_member } from "../utils/roles.js";

export const chat_api = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id/messages",
    handler: ChatApiController.create_message,
    onRequest: fastify.can_api([external_client, chat_member]),
  });
};
