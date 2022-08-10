import * as SearchController from "../controllers/search.controller.js"
import { guest_user } from '../utils/roles.js'

export const search = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: SearchController.get_search,
  });
};
