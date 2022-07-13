import * as PostingController from '../controllers/posting.controller.js';

export const posting = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/new",
    handler: PostingController.get_new,
  });
}
