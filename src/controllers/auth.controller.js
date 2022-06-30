import * as AuthService from "../services/auth.service.js";
import * as SessionService from "../services/session.service.js";
import { render_file } from "../utils/eta.js";
import { decrypt, encrypt, option, get_time } from "../utils/index.js";
import { AuthenticationError } from "../utils/errors.js";
import { google_oauth_client } from "../utils/google-oauth.js";
import config from "../config/index.js";

export async function get_login(req, reply) {
  const { return_to = "/" } = req.query;
  const flash = reply.flash();

  const oauth_state = encrypt(
    JSON.stringify({ came_from: req.url, return_to })
  );

  req.session.set("oauth_state", oauth_state);

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
  });
  stream.push(login);

  const bottom = await render_file("/partials/bottom.html");
  stream.push(bottom);

  stream.push(null);
  return reply;
}

export async function get_signup(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: t("title", { ns: "signup" }), lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", { t, user: user });
  stream.push(header);

  const signup = await render_file("/auth/signup.html", { t, flash });
  stream.push(signup);

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
  reply.redirect(`${return_to}?t=${get_time()}`);
  return reply;
}

export async function login(req, reply) {
  const { return_to = "/" } = req.query;
  const { email_phone, password } = req.body;
  const user_agent = req.headers["user-agent"];
  const ip = req.ip;
  const t = req.i18n.t;

  const [result, err] = await option(
    AuthService.login({ email_phone, password, user_agent, ip })
  );

  if (err) {
    req.flash("err", err.build(t));
    return reply.redirect(req.url);
  }

  req.session.set("sid", result.session.id);
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
  return { status: "oke" };
}

export async function update_sessions(req, reply) {
  const user = req.user;
  const sid = req.session.get("sid");
  const { _action } = req.body;
  const { redirect_uri } = req.query;

  switch (_action) {
    case "terminate_other_sessions":
      await SessionService.delete_many_for(user.id, [sid]);
      break;
    default:
      break;
  }

  reply.redirect(`${redirect_uri}?t=${get_time()}`);
}
