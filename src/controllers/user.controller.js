import { get_time, option } from "../utils/index.js";
import * as UserService from "../services/user.service.js";

export async function update_one(req, reply) {
  const { id } = req.params;
  const { redirect_uri } = req.query;
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
      reply.code(err.status_code).send(err.build(t))
      return reply
    }
    req.flash("err", err.build(t));
    return reply.redirect(redirect_uri);
  }

  return reply.redirect(`${redirect_uri}?t=${get_time()}`);
}
