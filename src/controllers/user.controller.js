import * as ConfirmationCodeService from "../services/confirmation-code.service.js";
import * as UserService from "../services/user.service.js";
import * as jwt from "../utils/jwt.js";
import config from "../config/index.js";
import { events } from "../utils/events.js";
import { option, add_t, transform_object } from "../utils/index.js";

export async function update_one(req, reply) {
  const t = req.i18n.t;
  const { id } = req.params;
  const { return_to = "/" } = req.query;
  const { name, website_url, username } = req.body;

  const [result, err] = await option(
    UserService.update_one(id, {
      name,
      website_url,
      username,
    })
  );

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(add_t(return_to));
    return reply;
  }

  req.flash("success", { message: t("update_success", { ns: "success" }) });
  reply.redirect(add_t(return_to));
  return reply;
}

export async function update_email(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { return_to = "/settings/details", token } = req.query;
  const { id } = req.params;
  const { intent, email } = req.body;

  switch (intent) {
    case "update_email": {
      if (user.email === email) {
        reply.redirect(return_to);
        return reply;
      }

      const [result, update_err] = await option(
        UserService.update_one(id, { email, email_verified: user.email === email })
      );

      if (update_err) {
        req.flash("validation_errors", update_err.errors_as_object().build(t).errors);
        reply.redirect(add_t(return_to));
        return reply;
      }

      const token = jwt.sign({ email }, { expiresIn: 1000 * 60 * 60 }); // 60 minutes;
      const verification_link = `${config.origin}/users/${id}/emails?token=${token}`;

      events.emit("send_email", {
        tmpl_name: "update_email",
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

    case "verify_email": {
      const [decoded, err] = await option(jwt.verify(token));
      if (err) {
        reply.redirect(return_to);
        return reply;
      }

      const [result, update_err] = await option(
        UserService.update_one(id, { email_verified: true })
      );

      if (update_err) {
        req.flash("err", err.build(t));
        reply.redirect(add_t(return_to));
        return reply;
      }

      reply.redirect(add_t(return_to));
      return reply;
    }
    default:
      break;
  }

  reply.redirect(add_t(return_to));
  return reply;
}

export async function update_phone(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { return_to = "/settings/details" } = req.query;
  const { id } = req.params;
  const {
    phone,
    country_code = "998",
    intent,
    otp,
  } = transform_object(req.body, {
    phone: (v) => v.replace(/\s/g, ""),
  });

  switch (intent) {
    case "send_otp": {
      if (phone === user.phone) {
        reply.redirect(return_to);
        return reply;
      }
      const [result, update_err] = await option(
        UserService.update_one(id, { phone, phone_verified: user.phone === phone })
      );

      if (update_err) {
        req.flash("validation_errors", update_err.errors_as_object().build(t).errors);
        reply.redirect(add_t(return_to));
        return reply;
      }

      const [code, err] = await option(ConfirmationCodeService.generate(phone));

      if (err) {
        req.flash("err", err.build(t));
        reply.redirect(add_t(return_to));
        return reply;
      }

      events.emit("create_otp", {
        tmpl_name: "verify",
        method: "phone",
        vars: { code, t },
        to: phone,
        country_code,
      });

      reply.redirect(add_t(return_to));
      return reply;
    }

    case "verify_otp": {
      const is_valid = await ConfirmationCodeService.verify(phone, otp);
      if (!is_valid) {
        req.flash("err", new GoneError({ key: "otp_expired" }).build(t));
        reply.redirect(add_t(return_to));
        return reply;
      }

      const [result, err] = await option(UserService.update_one(id, { phone_verified: is_valid }));

      if (err) {
        req.flash("err", err.build(t));
        reply.redirect(add_t(return_to));
        return reply;
      }

      req.flash("success", { message: t("phone_verified", { ns: "success" }) });
      reply.redirect(add_t(return_to));
      return reply;
    }

    default:
      break;
  }

  reply.redirect(add_t(return_to));
  return reply;
}
