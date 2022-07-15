import * as PostingController from '../controllers/posting.controller.js';

export const posting = async (fastify) => {
  fastify.route({
    method: "GET",
    url: "/new",
    handler: PostingController.get_new,
  });
  fastify.route({
    method: "POST",
    url: "/new",
    handler: PostingController.submit_step,
    schema: {
      body: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 5, errorMessage: { minLength: "!posting_title_minlength" } },
          category: { type: "string" },
          step: { type: "string", enum: ["1", "2", "3", "4"] }
        },
        if: {
          properties: {
            step: {
              const: "1",
            }
          }
        },
        then: {
          required: ["title", "category"]
        }
      }
    }
  })
}
