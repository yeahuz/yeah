import * as CFController from "../controllers/cf.controller.js";

export let cf = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/direct_upload",
    handler: CFController.direct_upload
  });
};
