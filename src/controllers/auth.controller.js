import * as AuthService from "../services/auth.service.js";
import * as SessionService from "../services/session.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as UserService from "../services/user.service.js";
import * as ConfirmationCodeService from "../services/confirmation-code.service.js";
import config from "../config/index.js";
import * as jwt from "../utils/jwt.js";
import { redis_client } from "../services/redis.service.js";
import { render_file } from "../utils/eta.js";
import {
  decrypt,
  encrypt,
  option,
  get_time,
  add_t,
  transform_object,
} from "../utils/index.js";
import { AuthenticationError, GoneError } from "../utils/errors.js";
import { google_oauth_client } from "../utils/google-oauth.js";
import { CredentialRequest, AssertionRequest } from "../utils/webauthn.js";
import { randomBytes } from "crypto";
import { events } from "../utils/events.js";

export async function get_qr_login(req, reply) {
  const { token } = req.params;
  const { name, profile_photo_url } = req.user || {};
  const stream = reply.init_stream();
  const t = req.i18n.t;
  const user = req.user;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: "Confirm qr code", lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const [decoded, err] = await option(jwt.verify(token));

  if (err) {
    stream.push(`<h1>${err.build(t).message}</h1>`);
  } else {
    redis_client.publish("auth/qr", JSON.stringify({ topic: decoded.data, name, profile_photo_url, op: "auth_scan" }))
    const qr_confirmation = await render_file("/auth/qr-login-confirmation.html", { token, t });
    stream.push(qr_confirmation);
  }

  stream.push(null);
  return reply;
}

export async function qr_login_confirm(req, reply) {
  const { return_to = "/", err_to = "/" } = req.query;
  const { token } = req.params;
  const { _action } = req.body;
  const user = req.user;
  const t = req.i18n.t;

  const [decoded, err] = await option(jwt.verify(token));
  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(req.url);
    return reply;
  }

  switch (_action) {
    case "confirm": {
      const auth_token = jwt.sign({ user_id: user.id }, { expiresIn: 120 });
      redis_client.publish("auth/qr", JSON.stringify({ topic: decoded.data, token: auth_token, op: "auth_confirmed" }))
      reply.redirect(return_to);
      return reply;
    }
    case "deny": {
      redis_client.publish("auth/qr", JSON.stringify({ topic: decoded.data, op: "auth_denied" }))
      reply.redirect(return_to);
      return reply;
    }
  }

  return reply;
}

export async function qr_login(req, reply) {
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const { token } = req.body;

  const decoded = await jwt.verify(token);
  const session = await SessionService.create_one({ user_id: decoded.user_id, user_agent, ip });

  req.session.set("sid", session.id);
  reply.redirect("/");
  return reply;
}

export async function get_login(req, reply) {
  const { return_to = "/", method = "phone" } = req.query;
  const flash = reply.flash();

  const nonce = req.session.get("nonce") || randomBytes(4).readUInt32LE();
  const oauth_state = encrypt(JSON.stringify({ came_from: req.url, return_to }));

  req.session.set("oauth_state", oauth_state);
  req.session.set("nonce", nonce);

  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "login" }), lang: req.language },
      t,
      user,
      env: { WS_URI_PUBLIC: config.ws_uri_public }
    });
    stream.push(top);
  }

  const login = await render_file("/auth/login.html", {
    t,
    flash,
    google_oauth_client_id: config.google_oauth_client_id,
    google_oauth_redirect_uri: config.google_oauth_redirect_uri,
    oauth_state,
    nonce,
    method,
    return_to
  });
  stream.push(login);
  redis_client.setex(nonce, 86400, 1);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", {
      t,
      user
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_signup(req, reply) {
  const { return_to = "/", method = "phone", step = "1" } = req.query;
  const flash = reply.flash();

  const nonce = req.session.get("nonce") || randomBytes(4).readUInt32LE();
  const identifier = req.session.get("identifier");
  const oauth_state = encrypt(JSON.stringify({ came_from: req.url, return_to }));

  req.session.set("oauth_state", oauth_state);
  req.session.set("nonce", nonce);

  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "signup" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let rendered_step;
  switch (step) {
    case "1": {
      rendered_step = await render_file("/auth/signup/step-1.html", {
        t,
        flash,
        google_oauth_client_id: config.google_oauth_client_id,
        google_oauth_redirect_uri: config.google_oauth_redirect_uri,
        oauth_state,
        nonce,
        method,
        return_to
      });
      break;
    }
    case "2": {
      if (!identifier) {
        rendered_step = await render_file("/partials/404.html", { t });
        break;
      }
      rendered_step = await render_file("/auth/signup/step-2.html", { t, flash, nonce, method, return_to });
      break;
    }
    case "3": {
      rendered_step = await render_file("/auth/signup/step-3.html", {
        t,
        flash,
        nonce,
        method,
        identifier,
        return_to
      });
      break;
    }
    default:
      break;
  }

  stream.push(rendered_step);
  redis_client.setex(nonce, 86400, 1);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", {
      t,
      user
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function create_otp(req, reply) {
  const t = req.i18n.t;
  const { method, err_to = "/auth/signup", return_to = "/auth/signup" } = req.query;
  const { identifier, country_code } = transform_object(req.body, {
    identifier: (v) => v.replace(/\s/g, ""),
  });

  const has_expired_code = await ConfirmationCodeService.has_expired_code(identifier);
  if (has_expired_code) {
    const [code, err] = await option(ConfirmationCodeService.generate_auth_code(identifier));

    if (err) {
      req.flash("err", err.build(t));
      reply.redirect(add_t(err_to));
      return reply;
    }

    events.emit("create_otp", {
      tmpl_name: "verify",
      method,
      vars: { code, t },
      to: identifier,
      country_code,
    });
  }

  req.session.set("identifier", identifier);
  reply.redirect(return_to);
  return reply;
}

export async function confirm_otp(req, reply) {
  const { err_to = "/auth/signup", return_to = "/auth/signup" } = req.query;
  const { otp } = transform_object(req.body, {
    otp: (v) => (Array.isArray(v) ? v.join("") : v),
  });
  const t = req.i18n.t;
  const identifier = req.session.get("identifier");

  const is_valid = await ConfirmationCodeService.verify(identifier, otp);

  if (!is_valid) {
    req.flash("err", new GoneError({ key: "otp_expired" }).build(t));
    return reply.redirect(add_t(err_to));
  }

  const otp_token = jwt.sign({ otp }, { expiresIn: 1000 * 60 * 15 });
  req.session.set("otp_token", otp_token);
  reply.redirect(return_to);
  return reply;
}

export async function signup(req, reply) {
  const { return_to = "/", err_to = "/" } = req.query;
  const { identifier, password, name } = transform_object(req.body, {
    identifier: (v) => v.replace(/\s/g, ""),
  });

  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const t = req.i18n.t;
  const otp_token = req.session.get("otp_token");

  const [_, decoding_err] = await option(jwt.verify(otp_token));

  if (decoding_err) {
    req.flash("err", decoding_err.build(t));
    return reply.redirect(add_t(err_to));
  }

  const [result, err] = await option(
    AuthService.signup({
      identifier,
      password,
      user_agent,
      ip,
      name,
    })
  );

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(err_to);
  }

  req.session.set("sid", result.session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  req.session.set("otp_token", null);
  reply.redirect(add_t(return_to));
  return reply;
}

export async function login(req, reply) {
  const { return_to = "/", err_to = "/" } = req.query;
  const { identifier, password } = req.body;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const t = req.i18n.t;

  const [user, user_err] = await option(AuthService.verify_password({ identifier, password }));

  if (user_err) {
    if (req.xhr) {
      reply.code(user_err.status_code).send(user_err.build(t));
      return reply;
    }
    req.flash("err", user_err.build(t));
    return reply.redirect(err_to);
  }

  const has_credential = await CredentialService.exists_for(user.id);

  if (has_credential) {
    req.session.set("user_id", user.id);
    reply.redirect(`/auth/webauthn?return_to=${return_to}`);
    return reply;
  }

  const [session, err] = await option(
    SessionService.create_one({ user_id: user.id, user_agent, ip })
  );

  if (err) {
    if (req.xhr) {
      reply.code(err.status_code).send(err.build(t));
      return reply;
    }
    req.flash("err", err.build(t));
    return reply.redirect(err_to);
  }

  req.session.set("sid", session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  reply.redirect(add_t(return_to));
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
  reply.redirect(add_t("/"));
}

export async function google_callback(req, reply) {
  const { state, code } = req.query;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const original_state = req.session.get("oauth_state");
  const decrypted = JSON.parse(decrypt(state));
  const t = req.i18n.t;

  if (state !== original_state) {
    req.flash("err", new AuthenticationError({ key: "!oauth_state_match" }).build(t));
    reply.redirect(decrypted.came_from);
    return reply;
  }

  const data = await google_oauth_client.getToken(code);
  google_oauth_client.setCredentials(data.tokens);

  const user_info = await google_oauth_client.request({
    url: "https://www.googleapis.com/oauth2/v3/userinfo",
  });

  const [result, err] = await option(
    AuthService.google_auth({ ...user_info.data, user_agent, ip })
  );

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(decrypted.came_from);
  }

  req.session.set("sid", result.session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);
  reply.redirect(add_t(decrypted.return_to));
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
  const { return_to = "/" } = req.query;
  const { user } = req.body;

  const { session } = await AuthService.telegram_auth({
    ...user,
    user_agent,
    ip,
  });

  req.session.set("sid", session.id);
  req.session.set("oauth_state", null);
  req.session.set("nonce", null);

  reply.redirect(add_t(return_to));
  return reply;
}

export async function update_sessions(req, reply) {
  const user = req.user;
  const sid = req.session.get("sid");
  const { _action } = req.body;
  const { return_to = "/", err_to = "/" } = req.query;

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
  const { id } = req.params;
  const { _action } = req.body;
  const { return_to = "/", err_to = "/" } = req.query;

  switch (_action) {
    case "delete_one":
      await SessionService.update_one(id, { active: false });
      break;
    default:
      break;
  }

  reply.redirect(`${return_to}?t=${get_time()}`);
}

export async function generate_request(req, reply) {
  const { type } = req.query;
  const user_id = req.session.get("user_id");
  const user = req.user || (await UserService.get_by_id(user_id));
  let request;

  switch (type) {
    case "create": {
      request = CredentialRequest.from(user);
      break;
    }
    case "get": {
      const credentials = await CredentialService.get_many({ user_id });
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

export async function update_credentials(req, reply) {
  const credential = req.body;
  const challenge = req.session.get("challenge");
  const user = req.user;
  const { return_to } = req.query;
  const { _action } = req.body;

  switch (_action) {
    case "delete_credentials":
      await CredentialService.delete_many(user.id)
      break;
    default:
      CredentialRequest.validate_client_data(credential, challenge);
      const response_result = CredentialRequest.validate_response(credential);
      await CredentialService.create_one({
        public_key: response_result.public_key,
        counter: response_result.counter,
        credential_id: response_result.cred_id,
        transports: credential.transports,
        title: credential.title,
        user_id: user.id,
      });
      break;
  }

  reply.redirect(add_t(return_to));
}

export async function verify_assertion(req, reply) {
  const user_id = req.session.get("user_id");
  const challenge = req.session.get("challenge");
  const assertion = req.body;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const { return_to = "/" } = req.query;

  AssertionRequest.validate_client_data(assertion, challenge);

  const credential = await CredentialService.get_one(assertion.id);
  const auth_data = AssertionRequest.validate_response(assertion, credential);

  await credential.$query().patch({ counter: auth_data.counter });

  const session = await SessionService.create_one({ user_id, user_agent, ip });

  req.session.set("sid", session.id);
  req.session.set("nonce", null);
  req.session.set("oauth_state", null);
  req.session.set("user_id", null);

  reply.redirect(add_t(return_to));
}

export async function update_credential(req, reply) {
  const { id } = req.params;
  const { _action } = req.body;
  const { return_to } = req.query;

  switch (_action) {
    case "delete_one":
      await CredentialService.delete_one(id);
      break;
    default:
      break;
  }

  reply.redirect(add_t(return_to));
}

export async function delete_credential(req, reply) {
  const { id } = req.params;

  const [result, err] = await option(CredentialService.delete_one(id));

  if (err) {
    reply.code(err.status_code).send(err.build(t));
    return reply;
  }

  return result;
}

export async function delete_credentials(req, reply) {
  const user = req.user;
  const t = req.i18n.t;
  const [result, err] = await option(CredentialService.delete_many(user.id));

  if (err) {
    reply.code(err.status_code).send(err.build(t));
    return reply;
  }

  return result;
}

export async function get_webauthn(req, reply) {
  const user_id = req.session.get("user_id");
  const { err_to = "/", return_to = "/" } = req.query;

  if (!user_id) {
    reply.redirect(err_to);
    return reply;
  }

  const stream = reply.init_stream();
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "2fa" }), lang: req.language },
      t,
    });
    stream.push(top);
  }

  const webauthn = await render_file("/auth/webauthn.html", { t, return_to });
  stream.push(webauthn);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
