import fp from "fastify-plugin";
import * as SessionService from "../services/session.service.js";
import * as AccountService from "../services/account.service.js";

export const authenticate = fp(function authenticate(fastify, opts = {}, done) {
  fastify.decorateRequest("user", null);
  fastify.addHook("preHandler", authenticateImpl);
  done();
});

async function authenticateImpl(req, reply) {
  const sid = req.session.get("sid");
  const session = await SessionService.get_one(sid);
  const user = await AccountService.get_one(session?.account_id);
  req.user = user?.toJSON();
}
