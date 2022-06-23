import { Account, GoogleAccount, TelegramAccount } from "../models/index.js";
import { ConflictError, InternalError } from "../utils/errors.js";
import crypto from "crypto";

import pkg from "objection";
const { UniqueViolationError } = pkg;

const email_regex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export async function start_transaction() {
  return await Account.startTransaction();
}

function create_one_impl(trx) {
  return async ({
    email_phone,
    password = crypto.randomBytes(12).toString("hex"),
    name,
    profile_photo_url,
    telegram_id,
  }) => {
    const field_name = email_regex.test(email_phone) ? "email" : "phone";
    return await Account.query(trx).insert({
      [field_name]: email_phone,
      password,
      name,
      profile_photo_url,
      telegram_id,
    });
  };
}

export async function update_one(id, update) {
  try {
    await Account.query().findById(id).patch(update);
  } catch (err) {
    if (err instanceof UniqueViolationError) {
      // TODO: Need to find out which unique field user is violating
      throw new ConflictError({ key: "user_exists", params: { user: update.username } });
    }
    throw new InternalError();
  }
}

export async function get_by_email_phone(email_phone) {
  const field_name = email_regex.test(email_phone) ? "email" : "phone";
  return await Account.query().findOne({ [field_name]: email_phone });
}

export async function get_by_telegram_id(telegram_id) {
  return await TelegramAccount.query().findOne({ telegram_id });
}

export async function get_by_google_id(google_id) {
  return await GoogleAccount.query().findOne({ google_id });
}

function link_account_impl(trx) {
  return (Model) => {
    return async (payload) => await Model.query(trx).insert(payload);
  };
}

export const link_google_trx = (trx) => link_account_impl(trx)(GoogleAccount);
export const link_telegram_trx = (trx) => link_account_impl(trx)(TelegramAccount);
export const link_google = link_account_impl()(GoogleAccount);
export const link_telegram = link_account_impl()(TelegramAccount);

export async function get_one(id) {
  if (!id) return;
  return await Account.query().findById(id);
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
