import * as CFImagesController from "../controllers/cfimg.controller.js";

export const cfimg = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/direct_upload",
    handler: CFImagesController.direct_upload,
    response: {
      200: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            uploadURL: { type: "string" },
          },
        },
      },
    },
  });
};
