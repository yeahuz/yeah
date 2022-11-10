import * as UserService from "./user.service.js";
import { ConflictError } from "../utils/errors.js";
import { ConfirmationCode } from "../models/index.js";
import { add_minutes_to_now } from "../utils/index.js";
import pkg from "objection";
import crypto from "crypto";

const { raw } = pkg;

export async function generate(identifier, exp_time = 15) {
  const expires_at = add_minutes_to_now(exp_time);
  const code = crypto.randomInt(100000, 999999);
  await ConfirmationCode.query()
    .insert({ code, identifier, expires_at })
    .onConflict("identifier")
    .merge();

  return code;
}

export async function has_expired_code(identifier) {
  const code = await ConfirmationCode.query()
    .select(raw("case when now() > expires_at then 1 else 0 end as expired"))
    .findOne({ identifier });

  if (code?.expired) await code.$query().delete();

  return code?.expired || !code;
}

export async function generate_auth_code(identifier, mins = 15) {
  const existing = await UserService.get_by_email_phone(identifier);
  if (existing) {
    throw new ConflictError({
      key: "user_exists",
      params: { user: identifier },
    });
  }

  return generate(identifier, mins);
}

export async function verify(identifier, code) {
  const confirmation_code = await ConfirmationCode.query()
    .select("id", "code", raw("case when now() > expires_at then 1 else 0 end as expired"))
    .findOne({ identifier });

  if (confirmation_code?.expired) await confirmation_code.$query().delete();

  return !confirmation_code?.expired && confirmation_code?.verify_code(code);
}
