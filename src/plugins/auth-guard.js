import fp from "fastify-plugin";
import * as SessionService from "../services/session.service.js";
import * as UserService from "../services/user.service.js";
import { AuthenticationError, AuthorizationError } from "../utils/errors.js";

export let auth_guard = fp(function auth_guard(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("onRequest", auth_guard_impl);
  done();
});

export let api_auth_guard = fp(function api_auth_guard(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("onRequest", api_auth_guard_impl);
  done();
});

async function api_auth_guard_impl(req, reply) {
  let is_public = reply.context.config.public;
  let sid = req.session.get("sid") || req.headers["authorization"];
  let session = await SessionService.get_one(sid);
  let user = await UserService.get_by_id(session?.user_id, { roles: true });

  if (is_public) {
    req.user = user;
    return;
  }

  if (!sid || !user) throw new AuthenticationError();
  req.user = user;
}

async function auth_guard_impl(req, reply) {
  let is_public = reply.context.config.public;
  let sid = req.session.get("sid") || req.headers["authorization"];
  let session = await SessionService.get_one(sid);

  let user = await UserService.get_by_id(session?.user_id);

  if (is_public) {
    req.user = user;
    return;
  }

  if (sid && !user) {
    if (req.xhr) throw new AuthorizationError();
    let params = new URLSearchParams({ return_to: req.url + "?" + new URLSearchParams(Object.assign(req.query, req.body)) });
    return reply.redirect(`/auth/login?${params.toString()}`);
  }

  req.user = user;
}
