import * as SettingsController from "../controllers/settings.controller.js";

export const settings = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: SettingsController.get_settings,
  });
  fastify.route({
    method: "GET",
    url: "/details",
    handler: SettingsController.get_details,
  });
  fastify.route({
    method: "GET",
    url: "/privacy",
    handler: SettingsController.get_privacy,
  });
  fastify.route({
    method: "GET",
    url: "/billing",
    handler: SettingsController.get_billing,
  });
  fastify.route({
    method: "GET",
    url: "/appearance",
    handler: SettingsController.get_appearance,
  });
  fastify.route({
    method: "POST",
    url: "/appearance",
    handler: SettingsController.update_appearance,
  });
  fastify.route({
    method: "GET",
    url: "/:tab",
    handler: SettingsController.get_tab,
  });
};
