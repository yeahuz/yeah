import * as BillingService from "./billing.service.js";
import { createHash, randomBytes } from "crypto";
import { query, ROLES } from "./db.service.js";
import * as argon2 from "argon2";
import { hashids } from "../utils/hashids.js";
import config from "../config/index.js";

let email_regex =
  /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@(([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{2,})$/i;

function gravatar(email, url) {
  if (!email || url) return url;
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
    let { rows: [user] } = await trx.query(`insert into users
      (email, phone, password, name, profile_photo_url, phone_verified, email_verified)
      values ($1, $2, $3, $4, $5, $6, $7) returning id`,
      [email, phone, hash, name, gravatar(email, profile_photo_url), phone_verified, email_verified]
    );

    let profile_url = new URL(`u/${hashids.encode([user.id])}`, config.origin).href;
    await Promise.all([
      trx.query(`update users set profile_url = $1 where id = $2`, [profile_url, user.id]),
      trx.query(`insert into user_roles (user_id, role_id) values ($1, $2)`, [user.id, ROLES.user]),
      BillingService.create_one_trx(trx)(user.id)
    ]);
    return user;
  };
}

export async function update_one(id, update = {}) {
  let sql = '';
  let params = [id];
  let keys = Object.keys(update);
  for (let i = 0, len = keys.length; i < len; i++) {
    params.push(update[keys[i]]);
    sql += keys[i] + " = " + `$${params.length}`;
    let is_last = i === len - 1;
    if (!is_last) sql += ", ";
  }

  let { rows, rowCount } = await query(`update users set ${sql} where id = $1`, params);
  if (rowCount == 0) {
    // TODO: user does not exist.handle somehow ??
  }

  return rows[0];
}

export async function exists(identifier) {
  let field_name = email_regex.test(identifier) ? "email" : "phone";
  let { rows } = await query(`select 1 from users where ${field_name} = $1`, [identifier]);
  return rows.length > 0;
}

export async function get_by_email_phone(identifier, relation = {}) {
  let field_name = email_regex.test(identifier) ? "email" : "phone";
  let sql = `select
      u.id, u.name, u.website_url, u.password, u.username, u.profile_photo_url, u.phone, u.phone_verified, u.email, u.email_verified, u.profile_url
      ${relation.roles ? `, coalesce(array_agg(row_to_json(r)) filter (where r.id is not null), '{}') as roles` : ''} from users u
      ${relation.roles ? `left join user_roles ur on ur.user_id = u.id left join roles r on r.id = ur.role_id` : ''}
      where ${field_name} = $1
      ${relation.roles ? 'group by u.id, ur.user_id, ur.role_id, r.id' : ''}`;

  let { rows } = await query(sql, [identifier]);

  return rows[0];
}

export async function get_by_id(id, relation = {}) {
  //TODO: some API to select columns;
  if (!id) return;
  let sql = `select u.id, u.name, u.website_url, u.username,
    u.phone, u.phone_verified, u.email, u.email_verified, u.profile_photo_url, u.email,
    u.profile_url
    ${relation.roles ? `, coalesce(array_agg(row_to_json(r)) filter (where r.id is not null), '{}') as roles` : ''}
    ${relation.permissions ? `, coalesce(array_agg(row_to_json(p)) filter (where p.id is not null), '{}') as permissions` : ''}
    from users u
    ${relation.roles ? `left join user_roles ur on ur.user_id = u.id left join roles r on r.id = ur.role_id` : ''}
    ${relation.permissions ? `
      left join user_roles ur on ur.user_id = u.id
      left join role_permissions rp on rp.role_id = ur.role_id left join permissions p on p.id = rp.permission_id` : ''}
    where u.id = $1 group by u.id`;
  let { rows } = await query(sql, [id]);
  if (rows.length) return rows[0];
}

export async function get_permissions(id) {
  if (!id) return [];
  let { rows } = await query(`
    select p.* from user_roles ur
    left join role_permissions rp on rp.role_id = ur.role_id
    left join permissions p on p.id = rp.permission_id
    where user_id = $1`, [id]);

  return rows;
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
  let sql = `select * from users`;
  let params = [];

  let excluded_ids = [excludes].flat().filter(Boolean);

  if (excludes) {
    params.push(excluded_ids);
    sql += ` where id != any($${params.length})`;
  }

  if (id) {
    params.push(id);
    sql += ` where id = $${params.length}`;
    let { rows } = await query(sql, params);
    return { list: rows, has_next: false, has_prev: false };
  }

  if (username) {
    params.push(username);
    sql += ` where username = $${params.length}`;
    let { rows } = await query(sql, params);
    return { list: rows, has_next: false, has_prev: false };
  }

  if (phone) {
    params.push(phone);
    sql += ` where phone = $${params.length}`;
    let { rows } = await query(sql, params);
    return { list: rows, has_next: false, has_prev: false };
  }

  if (email) {
    params.push(phone);
    sql += ` where email = $${params.length}`;
    let { rows } = await query(sql, params);
    return { list: rows, has_next: false, has_prev: false };
  }

  if (after) {
    params.push(after);
    sql += ` where id < $${params.length}`;
  }

  if (before) {
    params.push(before);
    sql += ` where id > $${params.length}`;
  }

  params.push(limit);
  sql += 'order by id desc limit $${params.length}';

  let { rows } = await query(sql, params);

  return { list: rows };
}

export async function get_by_username(username) {
  let { rows } = await query(`select * from users where username = $1`, [username]);
  return rows[0];
}

export async function get_by_hashid(hash_id) {
  let { rows } = await query(`select * from users where hash_id = $1`, [hash_id]);
  return rows[0];
}

export async function get_preferences(id) {
  let { rows } = await query(`select * from user_preferences where user_id = $1`, [id]);
  return rows;
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from users where id = $1`, [id]);
  if (rowCount == 0) {
    //TODO: user not found, throw some error or something??
    console.log("User not found");
  }

  return id;
}

export let create_one = create_one_impl();
export let create_one_trx = (trx) => create_one_impl(trx);
