import { get_time } from "../utils/index.js";
import * as AccountService from "../services/account.service.js";

export async function update_one(req, reply) {
  const { id } = req.params;
  const { redirect_uri } = req.query;
  const { name, email_phone, website_url, username } = req.body;
  await AccountService.update_one(id, { name, email_phone, website_url, username });
  return reply.redirect(`${redirect_uri}?t=${get_time()}`);
}
