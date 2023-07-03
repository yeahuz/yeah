import * as HomeController from "../controllers/home.controller.js";
import { authenticated_user } from "../utils/roles.js";

export const home = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: HomeController.get_index,
  });
  fastify.route({
    method: "GET",
    url: "/partials/:partial",
    handler: HomeController.get_partial,
  });
  fastify.route({
    method: "GET",
    url: "/me",
    handler: HomeController.get_me,
    onRequest: fastify.can([authenticated_user])
  });
  fastify.route({
    method: "GET",
    url: "/avatars",
    handler: HomeController.get_avatar,
  });
  fastify.route({
    method: "GET",
    url: "/clock",
    handler: HomeController.get_time,
  });
};
