import fp from "fastify-plugin";
import * as SessionService from "../services/session.service.js";
import * as UserService from "../services/user.service.js";

export const attach_user = fp(function attach_user(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("onRequest", attach_user_impl);
  done();
});

async function attach_user_impl(req, reply) {
  // TODO: accept `Bearer` token in Authorization header;
  const authorization = req.headers["Authorization"];
  const sid = req.session.get("sid");
  const session = await SessionService.get_one(sid);
  const user = await UserService.get_one(session?.user_id);
  req.user = user?.toJSON();
}
