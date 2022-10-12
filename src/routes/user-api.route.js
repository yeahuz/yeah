import * as UserApiController from "../controllers/user-api.controller.js";

export const user_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: UserApiController.get_one,
  });
  fastify.route({
    method: "GET",
    url: "/",
    handler: UserApiController.get_many,
  });
  fastify.route({
    method: "DELETE",
    url: "/:id",
    handler: UserApiController.delete_one,
  });
};
