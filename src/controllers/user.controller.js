import { option, add_t, transform_object } from "../utils/index.js";
import * as ConfirmationCodeService from "../services/confirmation-code.service.js";
import * as UserService from "../services/user.service.js";
import { events } from "../utils/events.js";

export async function update_one(req, reply) {
  const { id } = req.params;
  const { return_to = "/" } = req.query;
  const { name, email, phone, website_url, username } = req.body;
  const t = req.i18n.t;

  const [result, err] = await option(
    UserService.update_one(id, {
      name,
      email,
      phone,
      website_url,
      username,
    })
  );

  if (err) {
    if (req.xhr) {
      reply.code(err.status_code).send(err.build(t));
      return reply;
    }

    req.flash("err", err.build(t));
    reply.redirect(add_t(return_to));
    return reply;
  }
  reply.redirect(add_t(return_to));
  return reply;
}

export async function update_phone(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { return_to = "/settings/details" } = req.query;
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
    req.flash("err", update_err.build(t));
    reply.redirect(add_t(return_to));
    return reply;
  }

  const [code, err] = await option(ConfirmationCodeService.generate_auth_code(identifier));

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(add_t(return_to));
    return reply;
  }

  events.emit("create_otp", {
    tmpl_name: "verify",
    method,
    vars: { code, t },
    to: identifier,
    country_code,
  });

  reply.redirect(add_t(return_to));
  return reply;
}

// export async function update_phone(req, reply) {
//   const t = req.i18n.t;
//   const { id } = req.params;
//   const { return_to = "/settings/details" } = req.query;
//   const { phone, otp } = transform_object(req.body, {
//     phone: (v) => v.replace(/\s/g, ""),
//     otp: (v) => (Array.isArray(v) ? v.join("") : v),
//   });

//   const is_valid = await ConfirmationCodeService.verify(phone, otp);

//   if (!is_valid) {
//     req.flash("err", new GoneError({ key: "otp_expired" }).build(t));
//     reply.redirect(add(return_to));
//     return reply;
//   }

//   const [result, err] = await option(UserService.update_one(id, { phone }));

//   if (err) {
//     req.flash("err", err.build(t));
//     reply.redirect(add_t(return_to));
//     return reply;
//   }

//   reply.redirect(add_t(return_to));
//   return reply;
// }

// export async function create_otp(req, reply) {
//   const t = req.i18n.t;
//   const { method = "email", return_to = "/settings/details" } = req.query;
//   const { identifier, country_code = "998" } = transform_object(req.body, {
//     identifier: (v) => v.replace(/\s/g, ""),
//   });

//   const [code, err] = await option(ConfirmationCodeService.generate_auth_code(identifier));

//   if (err) {
//     req.flash("err", err.build(t));
//     reply.redirect(add_t(return_to));
//     return reply;
//   }

//   events.emit("create_otp", {
//     tmpl_name: "verify",
//     method,
//     vars: { code, t },
//     to: identifier,
//     country_code,
//   });

//   req.session.set(`new_${method}`, identifier);
//   req.session.options({ maxAge: 1000 * 60 * 60 });
//   reply.redirect(add_t(return_to));
// }
