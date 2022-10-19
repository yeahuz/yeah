import * as CFR2Controller from "../controllers/cfr2.controller.js";
import { authenticated_user } from "../utils/roles.js";

export const cfr2 = async (fastify) => {
  fastify.route({
    method: "POST",
    url: "/direct_upload",
    handler: CFR2Controller.direct_upload,
    onRequest: fastify.can([authenticated_user]),
  });
  fastify.route({
    method: "GET",
    url: "/cors",
    handler: CFR2Controller.update_bucket_cors,
  });
  fastify.route({
    method: "GET",
    url: "/rules",
    handler: CFR2Controller.get_bucket_cors,
  });
};
