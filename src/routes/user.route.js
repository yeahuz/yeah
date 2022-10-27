import * as UserController from "../controllers/user.controller.js";

export const user = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/:id/phones",
    handler: UserController.update_phone,
  });
  fastify.route({
    method: "POST",
    url: "/:id/emails",
    handler: UserController.update_email,
  });
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
            pattern: "^(33|55|77|88|90|91|93|94|95|97|98|99)(\\d{7})$",
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
