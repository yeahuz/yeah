import fp from "fastify-plugin";
import * as SessionService from "../services/session.service.js";
import * as UserService from "../services/user.service.js";

export let attach_user = fp(function attach_user(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("onRequest", attach_user_impl);
  done();
});

async function attach_user_impl(req, reply) {
  let sid = req.session.get("sid") || req.headers["authorization"];
  let session = await SessionService.get_one(sid);

  if (sid && !session) {
    req.session.set("sid", null)
  }

  console.log("==================================")
  console.log({ CONFIG: reply.context.config });
  console.log("==================================")

  let user = await UserService.get_by_id(session?.user_id, { roles: true });
  req.user = user;
}
