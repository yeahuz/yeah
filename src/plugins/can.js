import fp from "fastify-plugin";
import { AuthorizationError } from "../utils/errors.js";

export const can = fp(function can(fastify, opts = {}, done) {
  fastify.decorate("can", can_impl);
  done();
});

async function async_some(arr, ...params) {
  for (const item of arr) {
    if (await item(...params)) return true;
    return false;
  }
}

function can_impl(...validation_fns) {
  return async (req, reply) => {
    const user = req.user;
    const can_access = await async_some(validation_fns, user, req.params);
    if (!can_access) {
      if (req.xhr) {
        throw new AuthorizationError();
      }
      const referer = req.headers["referer"];
      reply.code(404).render("404.html", { referer });
      return reply;
    }
  };
}
