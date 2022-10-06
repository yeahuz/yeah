import * as AuthService from "../services/auth.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as UserService from "../services/user.service.js";
import * as SessionService from "../services/session.service.js";
import * as jwt from "../utils/jwt.js";
import { ResourceNotFoundError } from "../utils/errors.js";
import { option } from "../utils/index.js";
import { AssertionRequest, CredentialRequest } from "../utils/webauthn.js";

export async function login(req, reply) {
  const { email, password } = req.body;

  const user = await AuthService.verify_password({ identifier: email, password });

  const has_credential = await CredentialService.exists_for(user.id);

  if (!has_credential) {
    throw new ResourceNotFoundError({ key: "credential_not_found" });
  }

  const token = jwt.sign({ id: user.id }, { expiresIn: 120 });
  reply.send({ token });
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
