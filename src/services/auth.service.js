import * as SessionService from "../services/session.service.js";
import * as AccountService from "../services/account.service.js";
import {
  InternalError,
  ConflictError,
  ResourceNotFoundError,
  BadRequestError,
  ValidationError,
} from "../utils/errors.js";
import config from "../config/index.js";
import crypto from "crypto";

import objection from "objection";
const { UniqueViolationError } = objection;

export async function signup({ email_phone, password, user_agent, name, profile_photo_url }) {
  const trx = await AccountService.start_transaction();
  try {
    const account = await AccountService.create_one_trx(trx)({
      email_phone,
      password,
      name,
      profile_photo_url,
    });
    const session = await SessionService.create_one_trx(trx)({
      account_id: account.id,
      user_agent,
    });

    await trx.commit();

    return { session, account: account.toJSON() };
  } catch (err) {
    trx.rollback();
    if (err instanceof UniqueViolationError) {
      throw new ConflictError({ key: "user_exists", params: { user: email_phone } });
    }
    throw new InternalError();
  }
}

export async function login({ email_phone, password, user_agent }) {
  const account = await AccountService.get_by_email_phone(email_phone);
  if (!account)
    throw new ResourceNotFoundError({ key: "!user_exists", params: { user: email_phone } });

  const is_valid = await account.verify_password(password);

  if (!is_valid) throw new BadRequestError({ key: "invalid_password" });

  const session = await SessionService.create_one({ account_id: account.id, user_agent });

  return { account: account.toJSON(), session };
}

export async function google_auth(payload) {
  const { email, name, given_name, user_agent, picture, sub } = payload;
  const account = await AccountService.get_by_google_id(sub);

  if (account) {
    const session = await SessionService.create_one({ user_agent, account_id: account.account_id });
    return { session, account };
  }

  const trx = await AccountService.start_transaction();
  try {
    const account = await AccountService.create_one_trx(trx)({
      email_phone: email,
      name: name || given_name,
      profile_photo_url: picture,
    });

    const session = await SessionService.create_one_trx(trx)({
      user_agent,
      account_id: account.id,
    });

    await AccountService.link_google_trx(trx)({ account_id: account.id, google_id: sub });
    await trx.commit();

    return { session, account };
  } catch (err) {
    console.log(err);
    trx.rollback();
    if (err instanceof UniqueViolationError) {
      throw new ConflictError({ key: "user_exists", params: { user: email } });
    }
    throw new InternalError();
  }
}

const tg_bot_secret = crypto.createHash("sha256").update(config.telegram_bot_token).digest();

const verify_signature = ({ hash, ...data }) => {
  const checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");
  const hmac = crypto.createHmac("sha256", tg_bot_secret).update(checkString).digest("hex");

  return hmac === hash;
};

export async function telegram_auth(payload) {
  const { user_agent, ...user } = payload;
  const is_valid = verify_signature(user);

  if (!is_valid) throw new ValidationError({ key: "tg_data_integrity_compromised" });

  const account = await AccountService.get_by_telegram_id(user.id);

  if (account) {
    const session = await SessionService.create_one({ user_agent, account_id: account.account_id });
    return { session, account };
  }

  const trx = await AccountService.start_transaction();

  try {
    const account = await AccountService.create_one_trx(trx)({
      name: user.first_name || user.username,
      profile_photo_url: user.photo_url,
    });

    const session = await SessionService.create_one_trx(trx)({
      user_agent,
      account_id: account.id,
    });

    await AccountService.link_telegram_trx(trx)({ account_id: account.id, telegram_id: user.id });

    await trx.commit();
    return { session, account };
  } catch (err) {
    console.log(err);
    trx.rollback();
    if (err instanceof UniqueViolationError) {
      throw new ConflictError({ key: "user_exists", params: { user: email_phone } });
    }
    throw new InternalError();
  }
}

export async function logout(sid) {
  return await SessionService.delete_one(sid);
}
