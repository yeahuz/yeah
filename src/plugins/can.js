import fp from "fastify-plugin";
import { AuthorizationError } from "../utils/errors.js";

export const can = fp(function can(fastify, opts = {}, done) {
  fastify.decorate("can", can_impl);
  done();
});

async function asyncSome(arr, ...params) {
  for (const item of arr) {
    if (await item(...params)) return true;
    return false;
  }
}

function can_impl(...validationFns) {
  return async (req, reply) => {
    const user = req.user;
    const can_access = await asyncSome(validationFns, user, req.params);
    if (!can_access) {
      if (req.xhr) {
        const err = new AuthorizationError();
        reply.code(err.status_code).send(err);
        return reply;
      }
      const referer = req.headers["referer"];
      reply.code(404).render("404.html", { referer });
      return reply;
    }
  };
}
