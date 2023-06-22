import fp from "fastify-plugin";
import { AuthorizationError } from "../utils/errors.js";
import { i18next } from "../utils/i18n.js";
import { render_file } from "../utils/eta.js";
import { add_t } from "../utils/index.js";

export const can = fp(function can(fastify, opts = {}, done) {
  fastify.decorate("can", can_impl);
  fastify.decorate("can_api", can_api_impl);
  done();
});

async function some(fns, ...params) {
  for (const fn of fns) {
    if (await fn(...params)) return true;
    continue;
  }
}

async function every(fns, ...params) {
  for (const fn of fns) {
    if (!(await fn(...params))) return false;
  }
  return true;
}

function can_api_impl(validations_fns = [], options = { relation: "or" }) {
  return async (req, reply) => {
    const user = req.user;
    const validate = options.relation === "or" ? some : every;
    const can_access = await validate(validations_fns, user, req.params);
    if (!can_access) throw new AuthorizationError();
  };
}

function can_impl(validation_fns = [], options = { relation: "or" }) {
  return async (req, reply) => {
    const accept_lang = req.headers["accept-language"]
    const t = req.t || i18next.getFixedT(accept_lang ? accept_lang : []);
    const user = req.user;
    const validate = options.relation === "or" ? some : every;
    const can_access = await validate(validation_fns, user, req.params);
    if (!can_access) {
      if (req.xhr) {
        throw new AuthorizationError();
      }
      reply.redirect(add_t(req.url))
      return reply;
    }
  };
}
