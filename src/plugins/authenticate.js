import fp from "fastify-plugin";
import * as SessionService from "../services/session.service.js";
import * as UserService from "../services/user.service.js";

export const authenticate = fp(function authenticate(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("preHandler", authenticateImpl);
  done();
});

async function authenticateImpl(req, reply) {
  const sid = req.session.get("sid");
  const session = await SessionService.get_one(sid);
  const user = await UserService.get_one(session?.user_id);
  req.user = user?.toJSON();
}
