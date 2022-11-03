import * as AuthService from "../services/auth.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as UserService from "../services/user.service.js";
import * as SessionService from "../services/session.service.js";
import * as jwt from "../utils/jwt.js";
import { AuthorizationError, ResourceNotFoundError } from "../utils/errors.js";
import { AssertionRequest, CredentialRequest } from "../utils/webauthn.js";
import { admin_user, external_client } from "../utils/roles.js";

export async function admin_login(req, reply) {
  const { identifier, password } = req.body;

  const user = await AuthService.verify_password({ identifier, password });

  if (!admin_user(user)) throw new AuthorizationError();

  const has_credential = await CredentialService.exists_for(user.id);

  if (!has_credential) {
    throw new ResourceNotFoundError({ key: "credential_not_found" });
  }

  const token = jwt.sign({ id: user.id }, { expiresIn: 120 });
  reply.send({ token });
  return reply;
}

export async function external_client_login(req, reply) {
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const { identifier, password } = req.body;
  const user = await AuthService.verify_password({ identifier, password });
  if (!external_client(user)) throw new AuthorizationError();
  const session = await SessionService.create_one({ user_id: user.id, user_agent, ip });
  reply.send(session);
  return reply;
}

export async function login(req, reply) {
  const { identifier, password } = req.body;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;

  const user = await AuthService.verify_password({ identifier, password });

  const has_credential = await CredentialService.exists_for(user.id);

  if (has_credential) {
    const token = jwt.sign({ id: user.id }, { expiresIn: 120 });
    reply.send({ has_credential, token });
    return reply;
  }

  const session = await SessionService.create_one({ user_id: user.id, user_agent, ip });
  reply.send(session);
  return reply;
}

export async function verify_assertion(req, reply) {
  const { token, assertion, challenge } = req.body;
  const decoded = await jwt.verify(token);
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;

  AssertionRequest.validate_client_data(assertion, challenge);

  const credential = await CredentialService.get_one(assertion.id);

  const auth_data = AssertionRequest.validate_response(assertion, credential);

  await credential.$query().patch({ counter: auth_data.counter });

  const session = await SessionService.create_one({ user_id: decoded.id, user_agent, ip });
  reply.send(session);
  return reply;
}

export async function generate_request(req, reply) {
  const { type, token } = req.query;
  const decoded = await jwt.verify(token);
  const user = await UserService.get_one(decoded.id);

  let request;

  switch (type) {
    case "create": {
      request = CredentialRequest.from(user);
      break;
    }
    case "get": {
      const credentials = await CredentialService.get_many().for(user.id);
      request = AssertionRequest.from(credentials);
      break;
    }
    default:
      break;
  }

  reply.send(request);
  return reply;
}

export async function get_session(req, reply) {
  const { id } = req.params;
  const session = await SessionService.get_one(id);
  reply.send(session);
  return reply;
}

export async function delete_session(req, reply) {
  const { id } = req.params;
  const result = await SessionService.delete_one(id);
  reply.send(result);
  return reply;
}
