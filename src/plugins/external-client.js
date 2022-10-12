import * as ExternalClientService from "../services/external-client.service.js";
import fp from "fastify-plugin";
import { AuthenticationError } from "../utils/errors.js";

export const external_client = fp(function external_client(fastify, opts = {}, done) {
  fastify.decorateRequest("xclient", null);
  fastify.addHook("onRequest", external_client_impl);
  done();
});

function get_bearer_token(auth_header) {
  const [type, credential] = auth_header?.trim()?.split(" ");
  if (type === "Bearer") return credential;
}

async function external_client_impl(req, reply) {
  const token = get_bearer_token(req.headers["authorization"]);
  if (!token) {
    throw new AuthenticationError();
  }

  const client = await ExternalClientService.get_by_token(token);

  if (!client.active) {
    throw new AuthenticationError();
  }

  req.xclient = client.toJSON();
}
