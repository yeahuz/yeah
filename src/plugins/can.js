import fp from "fastify-plugin";
import { AuthorizationError } from "../utils/errors.js";
import { i18next } from "../utils/i18n.js";
import { add_t } from "../utils/index.js";

export let can = fp(function can(fastify, opts = {}, done) {
  fastify.decorate("can", can_impl);
  fastify.decorate("can_api", can_api_impl);
  done();
});

async function some(fns, ...params) {
  for (let fn of fns) {
    if (await fn(...params)) return true;
    continue;
  }
}

async function every(fns, ...params) {
  for (let fn of fns) {
    if (!(await fn(...params))) return false;
  }
  return true;
}

function can_api_impl(validations_fns = [], options = { relation: "or" }) {
  return async (req, reply) => {
    let user = req.user;
    let validate = options.relation === "or" ? some : every;
    let can_access = await validate(validations_fns, user, req.params);
    if (!can_access) throw new AuthorizationError();
  };
}

function can_impl(validation_fns = [], options = { relation: "or" }) {
  return async (req, reply) => {
    let accept_lang = req.headers["accept-language"]
    let t = req.t || i18next.getFixedT(accept_lang ? accept_lang : []);
    let user = req.user;
    let validate = options.relation === "or" ? some : every;
    let can_access = await validate(validation_fns, user, req.params);
    if (!can_access) {
      if (req.xhr) {
        throw new AuthorizationError();
      }

      let params = new URLSearchParams({ return_to: req.url + "?" + new URLSearchParams(Object.assign(req.query, req.body)) });
      if (!user) return reply.redirect(`/auth/login?${params.toString()}`);
      return reply.redirect(add_t("/"));
    }
  };
}
