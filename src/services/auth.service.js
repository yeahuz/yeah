import * as SessionService from "../services/session.service.js";
import * as AccountService from "../services/account.service.js";
import * as UserService from "../services/user.service.js";
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
  const trx = await UserService.start_transaction();
  try {
    const user = await UserService.create_one_trx(trx)({
      email_phone,
      password,
      name,
      profile_photo_url,
    });
    const session = await SessionService.create_one_trx(trx)({
      user_id: user.id,
      user_agent,
    });

    await trx.commit();

    return { session, user: user.toJSON() };
  } catch (err) {
    trx.rollback();
    if (err instanceof UniqueViolationError) {
      throw new ConflictError({ key: "user_exists", params: { user: email_phone } });
    }
    throw new InternalError();
  }
}

export async function login({ email_phone, password, user_agent }) {
  const user = await UserService.get_by_email_phone(email_phone);
  if (!user)
    throw new ResourceNotFoundError({ key: "!user_exists", params: { user: email_phone } });

  const is_valid = await user.verify_password(password);

  if (!is_valid) throw new BadRequestError({ key: "invalid_password" });

  const session = await SessionService.create_one({ user_id: user.id, user_agent });

  return { user: user.toJSON(), session };
}

export async function google_auth(payload) {
  const { email, name, given_name, user_agent, picture, sub } = payload;
  const account = await AccountService.get_by_provider_id(sub);

  if (account) {
    const session = await SessionService.create_one({ user_agent, user_id: account.user_id });
    return { session, user: account };
  }

  const trx = await UserService.start_transaction();
  try {
    const user = await UserService.create_one_trx(trx)({
      email_phone: email,
      name: name || given_name,
      profile_photo_url: picture,
    });
    console.log(user);

    const session = await SessionService.create_one_trx(trx)({
      user_agent,
      user_id: user.id,
    });

    await AccountService.link_google_trx(trx)({ user_id: user.id, provider_account_id: sub });

    await trx.commit();

    return { session, user };
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
  const { user_agent, ...tg_user } = payload;
  const is_valid = verify_signature(user);

  if (!is_valid) throw new ValidationError({ key: "tg_data_integrity_compromised" });

  const account = await AccountService.get_by_provider_id(tg_user.id);

  if (account) {
    const session = await SessionService.create_one({ user_agent, user_id: account.user_id });
    return { session, user: account };
  }

  const trx = await UserService.start_transaction();

  try {
    const user = await UserService.create_one_trx(trx)({
      name: tg_user.first_name || tg_user.username,
      profile_photo_url: tg_user.photo_url,
    });

    const session = await SessionService.create_one_trx(trx)({
      user_agent,
      user_id: user.id,
    });

    await AccountService.link_telegram_trx(trx)({ user_id: user.id, provider_account_id: user.id });

    await trx.commit();
    return { session, user };
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
