import * as SettingsController from "../controllers/settings.controller.js";
import { authenticated_user } from "../utils/roles.js";

export const settings = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/details",
    handler: SettingsController.get_details,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "GET",
    url: "/privacy",
    handler: SettingsController.get_privacy,
    onRequest: fastify.can(authenticated_user),
  });
  fastify.route({
    method: "GET",
    url: "/:tab",
    handler: SettingsController.get_tab,
    onRequest: fastify.can(authenticated_user),
  });
};
