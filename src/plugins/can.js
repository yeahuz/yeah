import fp from "fastify-plugin";
import { AuthorizationError } from "../utils/errors.js";
import { i18next } from "../utils/i18n.js";

export const can = fp(function can(fastify, opts = {}, done) {
  fastify.decorate("can", can_impl);
  done();
});

async function some(fns, ...params) {
  for (const fn of fns) {
    if (await fn(...params)) return true;
    return false;
  }
}

async function every(fns, ...params) {
  for (const fn of fns) {
    if (!(await fn(...params))) return false;
  }
  return true;
}

function can_impl(validation_fns = [], options = { relation: "or" }) {
  return async (req, reply) => {
    const accept_lang = [
      req.language instanceof Function ? req.language() : req.language,
      "en",
    ].flat();

    const t = i18next.getFixedT(accept_lang);
    const user = req.user;
    const validate = options.relation === "or" ? some : every;
    const can_access = await validate(validation_fns, user, req.params);
    if (!can_access) {
      if (req.xhr) {
        throw new AuthorizationError();
      }
      const referer = req.headers["referer"];
      reply.code(404).render("404.html", { referer, t });
      return reply;
    }
  };
}
