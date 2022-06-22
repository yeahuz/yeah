import * as SettingsController from "../controllers/settings.controller.js";

export const settings = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/:tab",
    handler: SettingsController.get_tab,
  });
};
