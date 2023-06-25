import * as ConfirmationCodeService from "../services/confirmation-code.service.js";
import * as UserService from "../services/user.service.js";
import * as jwt from "../utils/jwt.js";
import * as CFImageService from "../services/cfimg.service.js";
import config from "../config/index.js";
import { events } from "../utils/events.js";
import { option, add_t, transform_object, generate_srcset } from "../utils/index.js";
import { render_file } from "../utils/eta.js";

export async function get_one(req, reply) {
  const { username } = req.params;
  const { ps = "active" } = req.query;
  const stream = reply.init_stream();
  const current_user = req.user;
  const t = req.t;

  const profile = current_user.username === username ? current_user : UserService.get_by_username(username);

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: (await profile)?.name, lang: req.language },
      t,
    })

    stream.push(top)
  }

  if (!profile) {
    const not_found = await render_file("/partials/404.html", { t });
    stream.push(not_found);
  } else {
    const profile_html = await render_file("/profile.html", {
      t,
      profile: await profile,
      current_user,
      ps,
      generate_srcset,
    });
    stream.push(profile_html);
  }

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", {
      t,
      user: current_user
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function update_one(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { id } = req.params;
  const { return_to = "/", err_to = "/" } = req.query;
  const { name, website_url, username, photo_id } = req.body;

  const [result, err] = await option(
    UserService.update_one(id, {
      name,
      website_url,
      username,
      profile_photo_url: photo_id
        ? CFImageService.get_cf_image_url(photo_id)
        : user.profile_photo_url,
    })
  );

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(add_t(err_to));
    return reply;
  }

  req.flash("success", { message: t("update_success", { ns: "success" }) });
  reply.redirect(add_t(return_to));
  return reply;
}

export async function send_phone_code(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { return_to = "/settings/details", err_to = "/settings/details" } = req.query;
  const { id } = req.params;
  const { phone, country_code = "998" } = transform_object(req.body, {
    phone: (v) => v.replace(/\s/g, ""),
  });

  if (phone === user.phone) {
    reply.redirect(return_to);
    return reply;
  }

  const [result, update_err] = await option(
    UserService.update_one(id, { phone, phone_verified: user.phone === phone })
  );

  if (update_err) {
    req.flash("validation_errors", update_err.errors_as_object().build(t).errors);
    reply.redirect(add_t(err_to));
    return reply;
  }

  const has_expired_code = await ConfirmationCodeService.has_expired_code(phone);

  if (has_expired_code) {
    const [code, err] = await option(ConfirmationCodeService.generate(phone));

    if (err) {
      req.flash("err", err.build(t));
      reply.redirect(add_t(err_to));
      return reply;
    }

    events.emit("create_otp", {
      tmpl_name: "verify",
      method: "phone",
      vars: { code, t },
      to: phone,
      country_code,
    });
  }

  reply.redirect(add_t(return_to));
  return reply;
}

export async function send_email_link(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { return_to = "/settings/details", err_to = "/settings/details" } = req.query;
  const { id } = req.params;
  const { email } = req.body;

  if (user.email === email) {
    reply.redirect(return_to);
    return reply;
  }

  const [result, update_err] = await option(
    UserService.update_one(id, { email, email_verified: user.email === email })
  );

  if (update_err) {
    req.flash("validation_errors", update_err.errors_as_object().build(t).errors);
    reply.redirect(add_t(err_to));
    return reply;
  }

  const token = jwt.sign(
    { new_email: email, old_email: user.email },
    { expiresIn: 1000 * 60 * 60 }
  ); // 60 minutes;
  const verification_link = `${config.origin}/users/${id}/emails?token=${token}&return_to=${return_to}`;

  events.emit("send_email", {
    tmpl_name: !user.email ? "new_email" : "update_email",
    vars: {
      t,
      verification_link,
      old_email: user.email,
      new_email: email,
    },
    to: email,
  });
  reply.redirect(add_t(return_to));
  return reply;
}

export async function update_email(req, reply) {
  const t = req.i18n.t;
  const { return_to = "/settings/details", token, err_to = "/settings/details" } = req.query;
  const { id } = req.params;

  const [decoded, err] = await option(jwt.verify(token));

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(err_to);
    return reply;
  }

  const [result, update_err] = await option(UserService.update_one(id, { email_verified: true }));

  if (update_err) {
    req.flash("err", err.build(t));
    reply.redirect(add_t(err_to));
    return reply;
  }

  reply.redirect(add_t(return_to));
  return reply;
}

export async function update_phone(req, reply) {
  const t = req.i18n.t;
  const { return_to = "/settings/details", err_to = "/settings/details" } = req.query;
  const { id } = req.params;
  const { phone, otp } = transform_object(req.body, {
    phone: (v) => v.replace(/\s/g, ""),
  });

  const is_valid = await ConfirmationCodeService.verify(phone, otp);

  if (!is_valid) {
    req.flash("err", new GoneError({ key: "otp_expired" }).build(t));
    reply.redirect(add_t(err_to));
    return reply;
  }

  const [result, err] = await option(UserService.update_one(id, { phone_verified: is_valid }));

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(add_t(err_to));
    return reply;
  }

  req.flash("success", { message: t("phone_verified", { ns: "success" }) });
  reply.redirect(add_t(return_to));
  return reply;
}

export async function get_email_form(req, reply) {
  const stream = reply.init_stream();
  const t = req.i18n.t;
  const { tmpl_name = "new-email-form", token } = req.query;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "2fa" }), lang: req.language },
      t,
    });
    stream.push(top);
  }

  const [decoded, err] = await option(jwt.verify(token));

  const email_form = await render_file(`/users/${tmpl_name}`, {
    t,
    action: req.url,
    old_email: decoded?.old_email,
    new_email: decoded?.new_email,
    flash: { err: [err].filter(Boolean) },
  });

  stream.push(email_form);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
