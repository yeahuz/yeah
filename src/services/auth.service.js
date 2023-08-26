import * as SessionService from "../services/session.service.js";
import * as AccountService from "../services/account.service.js";
import * as UserService from "../services/user.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import {
  InternalError,
  ConflictError,
  ResourceNotFoundError,
  BadRequestError,
  ValidationError,
} from "../utils/errors.js";
import config from "../config/index.js";
import crypto from "crypto";
import { commit_trx, rollback_trx, start_trx } from "./db.service.js";
import * as argon2 from "argon2";

let email_regex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export async function signup({
  identifier,
  password,
  user_agent,
  name,
  profile_photo_url = new URL(`avatars?name=${name}`, config.origin).href,
  ip,
} = {}) {
  let trx = await start_trx();
  let field_name = email_regex.test(identifier) ? "email" : "phone";
  try {
    let user = await UserService.create_one_trx(trx)({
      [field_name]: identifier,
      email_verified: field_name === "email",
      phone_verified: field_name === "phone",
      password,
      name,
      profile_photo_url,
    });
    let session = await SessionService.create_one_trx(trx)({
      user_id: user.id,
      user_agent,
      ip,
    });

    await commit_trx(trx);
    return { session, user };
  } catch (err) {
    rollback_trx(trx);
    console.log({ err });
    //TODO: handle unique violation err
    // if (err instanceof UniqueViolationError) {
    //   throw new ConflictError({
    //     key: "user_exists",
    //     params: { user: identifier },
    //   });
    // }
    throw new InternalError();
  }
}

export async function verify_password({ identifier, password }) {
  let user = await UserService.get_by_email_phone(identifier);
  if (!user)
    throw new ResourceNotFoundError({
      key: "!user_exists",
      params: { user: identifier },
    });

  let is_valid = await argon2.verify(user.password, password);

  if (!is_valid) throw new BadRequestError({ key: "invalid_password" });

  return user;
}

export async function login({ email_phone, password, user_agent, ip }) {
  let user = await UserService.get_by_email_phone(email_phone);
  if (!user)
    throw new ResourceNotFoundError({
      key: "!user_exists",
      params: { user: email_phone },
    });

  let is_valid = await argon2.verify(user.password, password);

  if (!is_valid) throw new BadRequestError({ key: "invalid_password" });

  let session = await SessionService.create_one({
    user_id: user.id,
    user_agent,
    ip,
  });

  return { user, session };
}

export async function google_auth(payload) {
  let { email, name, given_name, user_agent, picture, sub, ip } = payload;
  let account = await AccountService.get_by_provider_id(sub);
  if (account) {
    let session = await SessionService.create_one({
      user_agent,
      user_id: account.user_id,
      ip,
    });

    return { session, user: account };
  }

  let trx = await start_trx();
  try {
    let existing_user = await UserService.get_by_email_phone(email)
    if (existing_user) {
      let session = await SessionService.create_one_trx(trx)({
        user_agent,
        user_id: existing_user.id,
        ip
      })

      await AccountService.link_google_trx(trx)({
        user_id: existing_user.id,
        provider_account_id: sub
      })

      await commit_trx(trx);
      return { session, user: existing_user }
    }

    let user = await UserService.create_one_trx(trx)({
      email,
      name: name || given_name,
      email_verified: true,
    });

    // To speed up the process of login, update profile picture after upload. Until picture is patched, profile_photo_url
    // will be gravatar;
    CFImageService.upload_url(picture).then(({ id }) => UserService.update_one(user.id, { profile_photo_url: CFImageService.get_cf_image_url(id) }))

    let session = await SessionService.create_one_trx(trx)({
      user_agent,
      user_id: user.id,
      ip,
    });

    await AccountService.link_google_trx(trx)({
      user_id: user.id,
      provider_account_id: sub,
    });

    await commit_trx(trx);
    return { session, user };
  } catch (err) {
    console.log({ err })
    rollback_trx(trx);
    //TODO: handle unique violation err
    // if (err instanceof UniqueViolationError) {
    //   throw new ConflictError({ key: "user_exists", params: { user: email } });
    // }
    throw new InternalError();
  }
}

let tg_bot_secret = crypto.createHash("sha256").update(config.telegram_bot_token).digest();

let verify_signature = ({ hash, ...data }) => {
  let checkString = Object.keys(data)
    .sort()
    .map((k) => `${k}=${data[k]}`)
    .join("\n");
  let hmac = crypto.createHmac("sha256", tg_bot_secret).update(checkString).digest("hex");

  return hmac === hash;
};

export async function telegram_auth(payload) {
  let { user_agent, ip, ...tg_user } = payload;
  let is_valid = verify_signature(tg_user);

  if (!is_valid) throw new ValidationError({ key: "tg_data_integrity_compromised" });

  let account = await AccountService.get_by_provider_id(tg_user.id);

  if (account) {
    let session = await SessionService.create_one({
      user_agent,
      user_id: account.user_id,
      ip,
    });
    return { session, user: account };
  }

  let trx = await start_trx();
  try {
    let user = await UserService.create_one_trx(trx)({
      name: tg_user.first_name || tg_user.username,
    });

    CFImageService.upload_url(tg_user.photo_url).then(({ id }) => UserService.update_one(user.id, { profile_photo_url: CFImageService.get_cf_image_url(id) }));

    let session = await SessionService.create_one_trx(trx)({
      user_agent,
      user_id: user.id,
      ip,
    });

    await AccountService.link_telegram_trx(trx)({
      user_id: user.id,
      provider_account_id: tg_user.id,
    });

    await commit_trx(trx);
    return { session, user };
  } catch (err) {
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function logout(sid) {
  return await SessionService.delete_one(sid);
}
