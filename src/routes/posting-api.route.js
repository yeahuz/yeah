import * as PostingApiController from "../controllers/posting-api.controller.js";

export const posting_api = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/",
    handler: PostingApiController.get_many,
  });
  fastify.route({
    method: "GET",
    url: "/filters",
    handler: PostingApiController.get_filters,
  });
  fastify.route({
    method: "GET",
    url: "/:id",
    handler: PostingApiController.get_one,
  });
};
