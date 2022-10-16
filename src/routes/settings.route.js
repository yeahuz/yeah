import * as SettingsController from "../controllers/settings.controller.js";
import { authenticated_user } from "../utils/roles.js";

export const settings = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: SettingsController.get_settings,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/details",
    handler: SettingsController.get_details,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/privacy",
    handler: SettingsController.get_privacy,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/billing",
    handler: SettingsController.get_billing,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/appearance",
    handler: SettingsController.get_appearance,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "POST",
    url: "/appearance",
    handler: SettingsController.update_appearance,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/:tab",
    handler: SettingsController.get_tab,
    onRequest: fastify.can([authenticated_user]),
  });
};
