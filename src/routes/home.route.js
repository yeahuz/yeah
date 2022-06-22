import * as HomeController from "../controllers/home.controller.js";

export const home = async (fastify) => {
  fastify.get("/", HomeController.get_index);
};
