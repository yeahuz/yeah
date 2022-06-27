import * as UserController from "../controllers/user.controller.js";

export const user = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id",
    handler: UserController.update_one,
    schema: {
      body: {
        type: "object",
        properties: {
          email: {
            type: "string",
            format: "email",
            errorMessage: { format: "!email", type: "!email" },
          },
          phone: {
            type: "string",
            pattern: "^\\+998[0-9]{9}",
            errorMessage: { pattern: "!phone_number", type: "!phone_number" },
          },
        },
      },
      response: {
        422: {
          type: "object",
          properties: {
            status_code: { type: "number" },
            message: { type: "string" },
            errors: {
              type: "array",
              items: {
                type: "object",
                properties: { message: { type: "string" }, field: { type: "string" } },
              },
            },
          },
        },
      },
    },
  });
};
