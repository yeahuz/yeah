import * as AccountController from "../controllers/account.controller.js";

export const account = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id",
    handler: AccountController.update_one,
  });
};
