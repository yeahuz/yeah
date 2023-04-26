import fp from "fastify-plugin";
import * as SessionService from "../services/session.service.js";
import * as UserService from "../services/user.service.js";

export const attach_user = fp(function attach_user(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("onRequest", attach_user_impl);
  done();
});

async function attach_user_impl(req, reply) {
  const sid = req.session.get("sid") || req.headers["authorization"];
  const session = await SessionService.get_one(sid);

  if (sid && !session) {
    req.session.delete();
  }

  const user = await UserService.get_one(session?.user_id, ["roles"]);
  req.user = user?.toJSON();
}
