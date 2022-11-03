import * as UserApiController from "../controllers/user-api.controller.js";
import { current_user, admin_user, external_client, chat_member } from "../utils/roles.js";

export const user_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: UserApiController.get_one,
    onRequest: fastify.can_api([current_user, admin_user, external_client]),
  });
  fastify.route({
    method: "GET",
    url: "/:id/chats",
    handler: UserApiController.get_chats,
    onRequest: fastify.can_api([chat_member, admin_user, external_client]),
  });
  fastify.route({
    method: "GET",
    url: "/",
    handler: UserApiController.get_many,
    onRequest: fastify.can_api([admin_user, external_client]),
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: UserApiController.delete_one,
    onRequest: fastify.can_api([admin_user, external_client]),
  });
};
