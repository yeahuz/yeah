import { User } from "../models/index.js";
import { ConflictError, InternalError } from "../utils/errors.js";
import crypto from "crypto";

import pkg from "objection";
const { UniqueViolationError } = pkg;

const email_regex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export async function start_transaction() {
  return await User.startTransaction();
}

function create_one_impl(trx) {
  return async ({
    email_phone,
    password = crypto.randomBytes(12).toString("hex"),
    name,
    profile_photo_url,
  }) => {
    const field_name = email_regex.test(email_phone) ? "email" : "phone";
    return await User.query(trx).insert({
      [field_name]: email_phone,
      password,
      name,
      profile_photo_url,
    });
  };
}

export async function update_one(id, update) {
  try {
    await User.query().findById(id).patch(update);
  } catch (err) {
    if (err instanceof UniqueViolationError) {
      // TODO: Need to find out which unique field user is violating
      throw new ConflictError({
        key: "user_exists",
        params: { user: update.username },
      });
    }
    throw new InternalError();
  }
}

export async function get_by_email_phone(email_phone) {
  const field_name = email_regex.test(email_phone) ? "email" : "phone";
  return await User.query().findOne({ [field_name]: email_phone });
}

export async function get_one(id) {
  if (!id) return;
  return await User.query().findById(id);
}

export async function get_by_username(username) {
  if (!username) return;
  return await User.query().findOne({ username });
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
