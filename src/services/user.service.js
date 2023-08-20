import * as BillingService from "./billing.service.js";
import { User } from "../models/index.js";
import { InternalError, ValidationError } from "../utils/errors.js";
import { createHash, randomBytes } from "crypto";
import pkg from "objection";
import { format_relations } from "../utils/index.js";
import { query } from "./db.service.js";
import * as argon2 from "argon2";
let { UniqueViolationError } = pkg;

let email_regex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

export async function start_transaction() {
  return await User.startTransaction();
}

function gravatar(email, url) {
  if (!email || url) return;
  let hash = createHash("md5").update(email).digest("hex");
  return `https://gravatar.com/avatar/${hash}?d=retro`;
}

function create_one_impl(trx = { query }) {
  return async ({
    email,
    phone,
    password = randomBytes(12).toString("hex"),
    name,
    profile_photo_url,
    phone_verified,
    email_verified,
  }) => {
    let hash = await argon2.hash(password);
    let user = await trx.query(`insert into users
      (email, phone, password, name, profile_photo_url, phone_verified, email_verified)
      values ($1, $2, $3, $4, $5, $6, $7)`,
      [email, phone, hash, name, gravatar(email, profile_photo_url), phone_verified, email_verified]
    );

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

export async function get_by_email_phone(identifier, params = {}) {
  let field_name = email_regex.test(identifier) ? "email" : "phone";
  let sql = `select *${params.roles ? `, coalesce(array_agg(row_to_json(r)) filter (where r.id is not null), '{}') as roles` : ''} from users u
      ${params.roles ? `left join user_roles ur on ur.user_id = u.id left join roles r on r.id = ur.role_id` : ''}
      where ${field_name} = $1
      ${params.roles ? 'group by u.id, ur.user_id, ur.role_id, r.id' : ''}`;

  let { rows } = await query(sql, [identifier]);

  return rows[0];
}

export async function get_by_id(id, params = {}) {
  //TODO: some API to select columns;
  if (!id) return;
  let sql = `select *${params.roles ? `, coalesce(array_agg(row_to_json(r)) filter (where r.id is not null), '{}') as roles` : ''} from users u
      ${params.roles ? `left join user_roles ur on ur.user_id = u.id left join roles r on r.id = ur.role_id` : ''}
      where u.id = $1
      ${params.roles ? 'group by u.id, ur.user_id, ur.role_id, r.id' : ''}`;

  let { rows } = await query(sql, [id]);
  if (rows.length) return rows[0];
}

export async function get_by_ids({ ids, relations = [], modify } = {}) {
  return await User.query().findByIds(ids).modify(modify).withGraphFetched(format_relations(relations))
}

async function cursor_paginate(model, list = [], excludes) {
  let first = list[0];
  let last = list[list.length - 1];

  let has_next = !!(await model.query().findOne("id", "<", last.id).whereNotIn("id", excludes));
  let has_prev = !!(await model.query().findOne("id", ">", first.id).whereNotIn("id", excludes));

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
  let query = User.query().orderBy("id", "desc").limit(limit);

  let excluded_ids = [excludes].flat().filter(Boolean);

  if (excludes) {
    query.whereNotIn("id", excluded_ids);
  }

  if (id) {
    let list = await query.where({ id });
    return { list, has_next: false, has_prev: false };
  }

  if (username) {
    let list = await query.where({ username });
    return { list, has_next: false, has_prev: false };
  }

  if (phone) {
    let list = await query.where({ phone });
    return { list, has_next: false, has_prev: false };
  }

  if (email) {
    let list = await query.where({ email });
    return { list, has_next: false, has_prev: false };
  }

  if (after) {
    query.where("id", "<", after);
  }

  if (before) {
    query.where("id", ">", before);
  }

  let list = await query;

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
  let { rows } = await query(`select * from user_preferences where user_id = $1`, [id]);
  return rows;
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from users where id = $1`, [id]);
  if (rowCount == 0) {
    //TODO: user not found, throw some error or something??
    console.log("User not found")
  }

  return id;
}

export let create_one = create_one_impl();

export let create_one_trx = (trx) => create_one_impl(trx);
