import * as UserApiController from "../controllers/user-api.controller.js";

export const user_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: UserApiController.get_one,
  });
};
