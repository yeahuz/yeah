import * as AuthService from "../services/auth.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as UserService from "../services/user.service.js";
import * as SessionService from "../services/session.service.js";
import * as jwt from "../utils/jwt.js";
import { AssertionRequest, CredentialRequest } from "../utils/webauthn.js";
import { transform_object } from "../utils/index.js";

export async function login(req, reply) {
  let { identifier, password } = req.body;
  let user_agent = req.headers["user-agent"];
  let ip = req.ip;

  let user = await AuthService.verify_password({ identifier, password });

  let has_credential = await CredentialService.exists_for(user.id);

  if (has_credential) {
    let token = jwt.sign({ id: user.id }, { expiresIn: 120 });
    req.session.set("token", token);
    reply.send({ has_credential, token });
    return reply;
  }

  let session = await SessionService.create_one({ user_id: user.id, user_agent, ip });
  req.session.set("sid", session.id);
  reply.send({ session, user });
  return reply;
}

export async function verify_assertion(req, reply) {
  let { token, assertion, challenge } = transform_object(req.body, {
    token: (v) => !v ? req.session.get("token") : v
  });

  let decoded = await jwt.verify(token);
  let user_agent = req.headers["user-agent"];
  let ip = req.ip;

  AssertionRequest.validate_client_data(assertion, challenge);

  let credential = await CredentialService.get_one(assertion.id);

  let auth_data = AssertionRequest.validate_response(assertion, credential);

  await CredentialService.update_one(credential.id, { counter: auth_data.counter });

  let session = await SessionService.create_one({ user_id: decoded.id, user_agent, ip });
  let user = await UserService.get_by_id(decoded.id, ["roles"]);
  req.session.set("sid", session.id);
  req.session.set("token", null);
  req.session.set("challenge", null);
  reply.send({ user, session });
  return reply;
}

export async function generate_request(req, reply) {
  let { type, token } = transform_object(req.query, {
    token: (v) => !v ? req.session.get("token") : v
  });

  let decoded = await jwt.verify(token);
  let user = await UserService.get_by_id(decoded.id);

  let request;

  switch (type) {
    case "create": {
      request = CredentialRequest.from(user);
      break;
    }
    case "get": {
      let credentials = await CredentialService.get_many({ user_id });
      request = AssertionRequest.from(credentials);
      break;
    }
    default:
      break;
  }

  req.session.set("challenge", request.challenge);
  reply.send(request);
  return reply;
}

export async function get_session(req, reply) {
  let { id } = req.params;
  let session = await SessionService.get_one(id);
  reply.send(session);
  return reply;
}

export async function delete_session(req, reply) {
  let { id } = req.params;
  let result = await SessionService.delete_one(id);
  reply.send(result);
  return reply;
}

export async function get_me(req, reply) {
  let user = req.user;
  return user;
}

export async function logout(req, reply) {
  let sid = req.session.get("sid");
  let result = await AuthService.logout(sid);
  req.session.delete();
  reply.send(result);
  return reply;
}
