import * as AuthService from "../services/auth.service.js";
import * as SessionService from "../services/session.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as UserService from "../services/user.service.js";
import { redis_client } from '../services/redis.service.js'
import { render_file } from "../utils/eta.js";
import { decrypt, encrypt, option, get_time } from "../utils/index.js";
import { AuthenticationError } from "../utils/errors.js";
import { google_oauth_client } from "../utils/google-oauth.js";
import { CredentialRequest, AssertionRequest } from '../utils/webauthn.js'
import { randomBytes } from "crypto";
import config from "../config/index.js";


export async function get_login(req, reply) {
  const { return_to = "/" } = req.query;
  const flash = reply.flash();

  const nonce = req.session.get("nonce") || randomBytes(4).readUInt32LE();
  const oauth_state = encrypt(
    JSON.stringify({ came_from: req.url, return_to })
  );

  req.session.set("oauth_state", oauth_state);
  req.session.set("nonce", nonce);

  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: t("title", { ns: "login" }), lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", {
    user,
    t,
  });
  stream.push(header);

  const login = await render_file("/auth/login.html", {
    t,
    flash,
    google_oauth_client_id: config.google_oauth_client_id,
    oauth_state,
    nonce
  });
  stream.push(login);
  redis_client.setex(nonce, 86400, 1);

  const bottom = await render_file("/partials/bottom.html");
  stream.push(bottom);

  stream.push(null);
  return reply;
}

export async function get_signup(req, reply) {
  const { return_to = "/" } = req.query
  const flash = reply.flash();

  const nonce = req.session.get("nonce") || randomBytes(4).readUInt32LE();
  const oauth_state = encrypt(
    JSON.stringify({ came_from: req.url, return_to })
  );

  req.session.set("oauth_state", oauth_state);
  req.session.set("nonce", nonce);

  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: t("title", { ns: "signup" }), lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", { t, user: user });
  stream.push(header);

  const signup = await render_file("/auth/signup.html", {
    t,
    flash,
    google_oauth_client_id: config.google_oauth_client_id,
    oauth_state,
    nonce
  });
  stream.push(signup);
  redis_client.setex(nonce, 86400, 1);

  const bottom = await render_file("/partials/bottom.html");
  stream.push(bottom);

  stream.push(null);
  return reply;
}

export async function signup(req, reply) {
  const { return_to = "/" } = req.query;
  const { email_phone, password } = req.body;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const t = req.i18n.t;

  const [result, err] = await option(
    AuthService.signup({ email_phone, password, user_agent, ip })
  );

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(req.url);
  }

  req.session.set("sid", result.session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  reply.redirect(`${return_to}?t=${get_time()}`);
  return reply;
}

export async function login(req, reply) {
  const { return_to = "/" } = req.query;
  const { email_phone, password } = req.body;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const t = req.i18n.t;

  const [ user, user_err ] = await option(AuthService.verify_password({ email_phone, password }));
  if (user_err) {
    req.flash("err", user_err.build(t));
    return reply.redirect(req.url);
  }

  const has_credential = await CredentialService.exists_for(user.id);

  if (has_credential) {
    req.session.set("user_id", user.id);
    reply.redirect(`/auth/webauthn?return_to=${return_to}`)
    return reply;
  }

  const [session, err] = await option(SessionService.create_one({ user_id: user.id, user_agent, ip }))

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(req.url);
  }

  req.session.set("sid", session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  reply.redirect(`${return_to}?t=${get_time()}`);
  return reply;
}

export async function logout(req, reply) {
  const sid = req.session.get("sid");
  const t = req.i18n.t;

  const [result, err] = await option(AuthService.logout(sid));

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(req.url);
  }

  req.session.delete();
  reply.redirect(`/?t=${get_time()}`);
}

export async function google_callback(req, reply) {
  const { state, code } = req.query;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const originalState = req.session.get("oauth_state");
  const decrypted = JSON.parse(decrypt(state));
  const t = req.i18n.t;

  if (state !== originalState) {
    req.flash(
      "err",
      new AuthenticationError({ key: "!oauth_state_match" }).build(t)
    );
    return reply.redirect(decrypted.came_from);
  }

  const data = await google_oauth_client.getToken(code);
  google_oauth_client.setCredentials(data.tokens);

  const userInfo = await google_oauth_client.request({
    url: "https://www.googleapis.com/oauth2/v3/userinfo",
  });

  const [result, err] = await option(
    AuthService.google_auth({ ...userInfo.data, user_agent, ip })
  );

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(decrypted.came_from);
  }

  req.session.set("sid", result.session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  reply.redirect(`${decrypted.return_to}?t=${get_time()}`);
}

export async function google_one_tap(req, reply) {
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const { credential } = req.body;

  const ticket = await google_oauth_client.verifyIdToken({
    idToken: credential,
    audience: config.google_oauth_client_id,
  });

  const payload = ticket.getPayload();

  const { session } = await AuthService.google_auth({
    ...payload,
    user_agent,
    ip,
  });

  req.session.set("sid", session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  return { status: "oke" };
}

export async function telegram_callback(req, reply) {
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const { user } = req.body;

  const { session } = await AuthService.telegram_auth({
    ...user,
    user_agent,
    ip,
  });

  req.session.set("sid", session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  return { status: "oke" };
}

export async function update_sessions(req, reply) {
  const user = req.user;
  const sid = req.session.get("sid");
  const { _action } = req.body;
  const { return_to } = req.query;

  switch (_action) {
    case "terminate_other_sessions":
      await SessionService.delete_many_for(user.id, [sid]);
      break;
    default:
      break;
  }

  reply.redirect(`${return_to}?t=${get_time()}`);
}

export async function update_session(req, reply) {
  const { id } = req.params
  const { _action } = req.body
  const { return_to } = req.query

  switch(_action) {
    case "delete_one":
      await SessionService.delete_one(id);
      break;
    default:
      break;
  }

  reply.redirect(`${return_to}?t=${get_time()}`)
}

export async function generate_request(req, reply) {
  const { type } = req.query
  const user_id = req.session.get("user_id")
  const user = req.user || await UserService.get_one(user_id);
  let request

  switch(type) {
    case "create": {
      request = CredentialRequest.from(user)
      break
    }
    case "get": {
      const credentials = await CredentialService.get_many().for(user.id)
      request = AssertionRequest.from(credentials)
      break
    }
    default:
      break
  }

  req.session.set("challenge", request.challenge);
  reply.send(request)

  return reply
}

export async function add_credential(req, reply) {
  const credential = req.body
  const challenge = req.session.get("challenge");
  const user = req.user;
  const { return_to } = req.query

  CredentialRequest.validate_client_data(credential, challenge)
  const response_result = CredentialRequest.validate_response(credential);

  await CredentialService.create_one({
    public_key: response_result.public_key,
    counter: response_result.counter,
    credential_id: response_result.cred_id,
    transports: credential.transports,
    title: credential.title,
    user_id: user.id
  })

  reply.redirect(`${return_to}?t=${get_time()}`)
}

export async function verify_assertion(req, reply) {
  const user_id = req.session.get("user_id");
  const challenge = req.session.get("challenge");
  const assertion = req.body;
  const user_agent = req.headers['user-agent'];
  const ip = req.ip;
  const { return_to = "/" } = req.query;

  AssertionRequest.validate_client_data(assertion, challenge)

  const credential = await CredentialService.get_one(assertion.id);
  const auth_data = await AssertionRequest.validate_response(assertion, credential);

  await credential.$query().patch({ counter: auth_data.counter });

  const [session, err] = await option(SessionService.create_one({ user_id, user_agent, ip }))

  req.session.set("sid", session.id);
  req.session.set("nonce", null);
  req.session.set("oauth_state", null);
  req.session.set("user_id", null);

  return reply.redirect(`${return_to}?t=${get_time()}`);
}

export async function update_credential(req, reply) {
  const { id } = req.params
  const { _action } = req.body
  const { return_to } = req.query

  switch(_action) {
    case "delete_one":
      await CredentialService.delete_one(id);
      break;
    default:
      break;
  }

  reply.redirect(`${return_to}?t=${get_time()}`)
}


export async function get_webauthn(req, reply) {
  const user_id = req.session.get("user_id");
  const { return_to = "/" } = req.query;

  if (!user_id) {
    reply.redirect(`/auth/login?return_to=${return_to}`);
    return reply;
  }

  const stream = reply.init_stream();
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: t("title", { ns: "signup" }), lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", { t });
  stream.push(header);

  const webauthn = await render_file("/auth/webauthn.html", { t })
  stream.push(webauthn);

  const bottom = await render_file("/partials/bottom.html", {
    scripts: ["/public/js/webauthn.js"]
  });
  stream.push(bottom);

  stream.push(null);

  return reply;
}
