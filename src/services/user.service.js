import * as BillingService from "./billing.service.js";
import { User } from "../models/index.js";
import { InternalError, ValidationError } from "../utils/errors.js";
import crypto from "crypto";

import pkg from "objection";
import { format_relations } from "../utils/index.js";
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
    phone_verified,
    email_verified,
  }) => {
    const user = await User.query(trx).insert({
      email,
      phone,
      password,
      name,
      profile_photo_url,
      phone_verified,
      email_verified,
    });
    await BillingService.create_one_trx(trx)(user.id);
    return user;
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

export async function get_by_email_phone(identifier, relations = []) {
  const field_name = email_regex.test(identifier) ? "email" : "phone";
  return await User.query()
    .findOne({ [field_name]: identifier })
    .withGraphFetched(format_relations(relations));
}

export async function get_one(id, relations = []) {
  if (!id) return;
  return await User.query().modify("public_selects").findById(id).withGraphFetched(format_relations(relations));
}

async function cursor_paginate(model, list = [], excludes) {
  const first = list[0];
  const last = list[list.length - 1];

  const has_next = !!(await model.query().findOne("id", "<", last.id).whereNotIn("id", excludes));
  const has_prev = !!(await model.query().findOne("id", ">", first.id).whereNotIn("id", excludes));

  return { list, has_next, has_prev };
}

export async function get_many({
  before,
  after,
  id,
  username,
  email,
  phone,
  limit,
  excludes,
} = {}) {
  const query = User.query().orderBy("id", "desc").limit(limit);

  const excluded_ids = [excludes].flat().filter(Boolean);

  if (excludes) {
    query.whereNotIn("id", excluded_ids);
  }

  if (id) {
    const list = await query.where({ id });
    return { list, has_next: false, has_prev: false };
  }

  if (username) {
    const list = await query.where({ username });
    return { list, has_next: false, has_prev: false };
  }

  if (phone) {
    const list = await query.where({ phone });
    return { list, has_next: false, has_prev: false };
  }

  if (email) {
    const list = await query.where({ email });
    return { list, has_next: false, has_prev: false };
  }

  if (after) {
    query.where("id", "<", after);
  }

  if (before) {
    query.where("id", ">", before);
  }

  const list = await query;

  return await cursor_paginate(User, list, excluded_ids);
}

export async function get_by_username(username, relations = []) {
  if (!username) return;
  return await User.query().findOne({ username }).withGraphFetched(format_relations(relations));
}

export async function get_by_hashid(hash_id, relations = []) {
  if (hash_id) return;
  return await User.query().findOne({ hash_id }).withGraphFetched(format_relations(relations));
}

export async function get_preferences(id) {
  const user = await get_one(id);
  return await user?.$relatedQuery("preferences");
}

export async function delete_one(id) {
  return await User.query().deleteById(id);
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
