import { User } from "../models/index.js";
import { ConflictError, InternalError, ValidationError } from "../utils/errors.js";
import { parse_unique_error } from "../utils/index.js";
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
    email,
    phone,
    password = crypto.randomBytes(12).toString("hex"),
    name,
    profile_photo_url,
  }) => {
    return await User.query(trx).insert({
      email,
      phone,
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
      throw new ValidationError({
        errors: [{ message: "user_exists", instancePath: err.columns[0] }],
        params: { user: update[err.columns[0]] },
      });
    }
    throw new InternalError();
  }
}

export async function get_by_email_phone(identifier) {
  const field_name = email_regex.test(identifier) ? "email" : "phone";
  return await User.query().findOne({ [field_name]: identifier });
}

export async function get_one(id) {
  if (!id) return;
  return await User.query().findById(id);
}

export async function get_by_username(username) {
  if (!username) return;
  return await User.query().findOne({ username });
}

export async function get_by_hashid(hash_id) {
  if (hash_id) return;
  return await User.query().findOne({ hash_id });
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
