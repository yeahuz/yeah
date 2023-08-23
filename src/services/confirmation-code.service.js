import * as UserService from "./user.service.js";
import * as argon2 from "argon2";
import { ConflictError } from "../utils/errors.js";
import { add_minutes_to_now } from "../utils/index.js";
import { query } from "./db.service.js";
import crypto from "crypto";

export async function generate(identifier, exp_time = 15) {
  let expires_at = add_minutes_to_now(exp_time);
  let code = crypto.randomInt(100000, 999999);
  let hash = await argon2.hash(String(code));
  await query(`insert into confirmation_codes (code, identifier, expires_at) values ($1, $2, $3) on conflict (identifier) do update set expires_at = $3, code = $1`, [hash, identifier, expires_at]);
  return code;
}

export async function has_expired_code(identifier) {
  let { rows: [code] } = await query(`select id, verified, case when now() > expires_at then 1 else 0 end as expired from confirmation_codes where identifier = $1`, [identifier]);

  // TODO: do I care if it gets deleted or not?
  if (code?.expired) await query(`delete from confirmation_codes where identifier = $1`, [identifier]);

  return code?.verified || code?.expired || !code;
}

export async function generate_auth_code(identifier, mins = 15) {
  let exists = await UserService.exists(identifier);
  if (exists) {
    throw new ConflictError({
      key: "user_exists",
      params: { user: identifier },
    });
  }

  return generate(identifier, mins);
}

export async function verify(identifier, code) {
  let { rows: [existing] } = await query(`select id, code, case when now() > expires_at then 1 else 0 end as expired from confirmation_codes where identifier = $1`, [identifier]);
  // TODO: do I care if it gets deleted or not?
  if (existing?.expired) await query(`delete from confirmation_codes where identifier = $1`, [identifier]);

  let is_valid = await argon2.verify(existing.code, String(code));
  if (is_valid) await query(`update confirmation_codes set verified = true where id = $1`, [existing.id])

  return !existing?.expired && is_valid;
}
