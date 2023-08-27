import * as UserApiController from "../controllers/user-api.controller.js";
import { policy_guard } from "../plugins/policy-guard.js";

export let user_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: UserApiController.get_one,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
  });
  fastify.route({
    method: "GET",
    url: "/:id/chats",
    handler: UserApiController.get_chats,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
  });
  fastify.route({
    method: "GET",
    url: "/",
    handler: UserApiController.get_many,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: UserApiController.delete_one,
    onRequest: policy_guard((ability) => ability.can("manage", "User")),
  });
};
