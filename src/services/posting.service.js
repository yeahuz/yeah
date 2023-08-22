import * as AttachmentService from "./attachment.service.js";
import * as CategoryService from "./category.service.js";
import objection from "objection";
import { InternalError } from "../utils/errors.js";
import { commit_trx, start_trx, rollback_trx } from "./db.service.js";
import { query } from "./db.service.js";

let { raw } = objection;

function create_one_impl(trx = { query }) {
  return async ({ title, description, cover_url, status_id, created_by, attribute_set }) => {
    let { rows } = await trx.query(`insert into postings (title, description, cover_url, status_id, created_by, attribute_set)
      values ($1, $2, $3, $4, $5, $6)`, [title, description, cover_url, status_id, created_by, attribute_set]);

    return rows[0];
  }
}

export let create_one = create_one_impl();
export let create_one_trx = (trx) => create_one_impl(trx);

export async function create_posting(payload) {
  let trx = start_trx();
  try {
    let {
      title,
      description,
      attachments,
      category_id,
      formatted_address,
      lat,
      lon,
      district_id,
      region_id,
      cover_index,
      currency_code,
      price,
      created_by,
      params,
    } = payload;

    let attribute_set = Object.values(params)
      .flatMap((param) => [param.parent, ...param.value])
      .map((v) => v.split("|")[1]);

    let cover = attachments[cover_index || 0];
    let posting = await create_one_trx(trx)({
      title,
      description,
      cover_url: cover.url,
      status_id: 3,
      created_by,
      attribute_set,
    });

    let att = await Promise.all(
      attachments.map((a) =>
        AttachmentService.create_one_trx(trx)({ resource_id: a.id, service: "CF_IMAGES" })
      )
    );

    let categories = await CategoryService.get_parents(category_id);
    await posting.$relatedQuery("attachments", trx).relate(att);
    await posting.$relatedQuery("categories", trx).relate(
      categories.map((c) => ({
        ...c,
        relation: c.id === Number(category_id) ? "DIRECT" : "PARENT",
      }))
    );
    await posting.$relatedQuery("location", trx).insert({
      formatted_address,
      coords: raw(`point(${lat}, ${lon})`),
      district_id,
      region_id,
    });

    await posting.$relatedQuery("price", trx).insert({ currency_code, price });
    await commit_trx(trx);
  } catch (err) {
    console.log({ err });
    rollback_trx(trx)
    throw new InternalError();
  }
}

async function cursor_paginate(model, list = [], excludes = []) {
  let first = list[0];
  let last = list[list.length - 1];

  let has_next =
    last && !!(await model.query().findOne("id", "<", last.id).whereNotIn("id", excludes));
  let has_prev =
    first && !!(await model.query().findOne("id", ">", first.id).whereNotIn("id", excludes));

  return { list, has_next, has_prev };
}

export async function get_one({ id, relation = {} } = {}) {
  let { rows } = await query(`
  select p.*
  ${relation.location ? `, row_to_json(pl) as location` : ''}
  ${relation.attachments ? `, array_agg(row_to_json(a)) as attachments` : ''}
  from postings
  ${relation.attachments ? `
  left join posting_attachments pa on pa.posting_id = p.id
  left join attachments a on a.id = pa.attachment_id` : ''}
  ${relation.location ? `left join posting_location pl on pl.posting_id = p.id` : ''}
  where id = $1
  `, [id]);

  return rows[0];
}

export async function get_by_hash_id({ hash_id, relation = {} } = {}) {
  //TODO: make this dynamic
  let currency = "UZS"

  let { rows } = await query(`
    select p.*,
    er.to_currency as currency,
    round(pp.price * er.rate) as price
    ${relation.attachments ? ', array_agg(row_to_json(a)) as attachments' : ''}
    ${relation.creator ? `, json_build_object('name', u.name, 'id', u.id, 'profile_photo_url', u.profile_photo_url, 'profile_url', u.profile_url) as creator` : ''}
    from postings p
    join posting_prices pp on pp.posting_id  = p.id
    join exchange_rates er on er.from_currency = pp.currency_code and er.to_currency = $1
    ${relation.attachments ? `
    left join posting_attachments pa on pa.posting_id = p.id
    left join attachments a on a.id = pa.attachment_id
    ` : ''}
    ${relation.creator ? `
    join users u on u.id = p.created_by
    ` : ''}
    where p.hash_id = $2
    group by
      p.id, pp.price, er.rate, er.to_currency
      ${relation.creator ? ', u.id, u.name' : ''}
  `, [currency, hash_id])

  return rows[0];
}

export async function get_many({
  currency = "UZS",
  status_id,
  limit = 15,
  lang = "en",
  cursor,
  direction
} = {}) {
  let { rows } = await query(`
    select p.*, er.to_currency as currency, round(pp.price * er.rate) as price, row_to_json(pl) as location from postings p
    join posting_prices pp on pp.posting_id = p.id
    join exchange_rates er on er.from_currency = pp.currency_code and er.to_currency = $1
    join posting_location pl on pl.posting_id = p.id
    where status_id = $2 order by p.id limit $3`, [currency, status_id, limit]);

  // TODO: handle pagination
  return { list: rows }
}

export async function get_statuses({ lang = "en" }) {
  let { rows } = await query(`select ps.id, ps.code, ps.bg_hex, ps.fg_hex, pst.name from posting_statuses ps
    join posting_status_translations pst on pst.status_id = ps.id and language_code = $1
  `, [lang.substring(0, 2)])

  return rows;
}

export async function update_one(id, update) {
  let sql = '';
  let keys = Object.keys(update);
  for (let i = 0, len = keys.length; i < len; i++) {
    sql += keys[i] + "=" + update[keys[i]];
    let is_last = i === len - 1;
    if (!is_last) sql += ", "
  }
  let { rowCount, rows } = await query(`update postings set ${sql} where id = $1`, [id])

  if (rowCount === 0) {
    //TODO: does not exist
  }

  return rows[0];
}
