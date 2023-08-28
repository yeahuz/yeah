import * as AttachmentService from "./attachment.service.js";
import * as CategoryService from "./category.service.js";
import { AuthorizationError, InternalError } from "../utils/errors.js";
import { commit_trx, start_trx, rollback_trx, query } from "./db.service.js";
import { subject } from "@casl/ability";
import { permittedFieldsOf } from "@casl/ability/extra";
import { pick } from "../utils/index.js";
import { hashids } from "../utils/hashids.js";
import config from "../config/index.js";

export async function create_one({ title, description, status, created_by, attribute_set = [], category_id }) {
  let trx = await start_trx();
  try {
    let { rows: [listing] } = await trx.query(`insert into listings (title, description, status, created_by, attribute_set, category_id)
      values ($1, $2, $3, $4, $5, $6) returning id`, [title, description, status, created_by, attribute_set, category_id]);

    let url = new URL(`listings/${hashids.encode([listing.id])}`, config.origin).href;
    await trx.query(`update listings set url = $1 where id = $2`, [url, listing.id]);
    let categories = await CategoryService.get_parents(category_id);
    await Promise.all(categories.map((category) => {
      return trx.query(`insert into listing_categories (category_id, listing_id) values ($1, $2)`, [category.id, listing.id]);
    }));

    await commit_trx(trx)
    return listing;
  } catch (err) {
    console.log({ err });
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function create_listing(payload) {
  //TODO: create listing impl
  // let trx = start_trx();
  // try {
  //   let {
  //     title,
  //     description,
  //     attachments,
  //     category_id,
  //     formatted_address,
  //     lat,
  //     lon,
  //     district_id,
  //     region_id,
  //     cover_index,
  //     currency_code,
  //     price,
  //     created_by,
  //     params,
  //   } = payload;

  //   let attribute_set = Object.values(params)
  //     .flatMap((param) => [param.parent, ...param.value]) .map((v) => v.split("|")[1]);
  //   let cover = attachments[cover_index || 0]; let listing = await create_one_trx(trx)({
  //     title,
  //     description,
  //     cover_url: cover.url,
  //     status_id: 3,
  //     created_by,
  //     attribute_set,
  //   });

  //   let att = await Promise.all(
  //     attachments.map((a) =>
  //       AttachmentService.create_one_trx(trx)({ resource_id: a.id, service: "CF_IMAGES" })
  //     )
  //   );

  //   let categories = await CategoryService.get_parents(category_id);
  //   await listing.$relatedQuery("attachments", trx).relate(att);
  //   await listing.$relatedQuery("categories", trx).relate(
  //     categories.map((c) => ({
  //       ...c,
  //       relation: c.id === Number(category_id) ? "DIRECT" : "PARENT",
  //     }))
  //   );
  //   await listing.$relatedQuery("location", trx).insert({
  //     formatted_address,
  //     coords: raw(`point(${lat}, ${lon})`),
  //     district_id,
  //     region_id,
  //   });

  //   await listing.$relatedQuery("price", trx).insert({ currency_code, price });
  //   await commit_trx(trx);
  // } catch (err) {
  //   console.log({ err });
  //   rollback_trx(trx)
  //   throw new InternalError();
  // }
}


export async function get_one({ id, lang = "en", relation = {} } = {}) {
  if (!id) return;
  let params = [id];
  let sql = `
    select l.*
    ${relation.price ? `, row_to_json(lp) as price` : ''}
    ${relation.location ? `, row_to_json(ll) as location` : ''}
    ${relation.attachments ? `, coalesce(array_agg(row_to_json(a) order by la.display_order asc) filter (where a.id is not null), '{}') as attachments` : ''}
    ${relation.attributes ? `, coalesce(array_agg(row_to_json(ab)) filter (where ab.id is not null), '{}') as attributes` : ''}
    from listings l
    ${relation.attachments ? `
    left join listing_attachments la on la.listing_id = l.id
    left join attachments a on a.id = la.attachment_id` : ''}
    ${relation.location ? `left join listing_location ll on ll.listing_id = l.id` : ''}
  `;

  if (relation.attributes) {
    params.push(lang.substring(0, 2));
    sql += `left join attributes ab on ab.id = any(l.attribute_set)
            left join attribute_translations at on at.attribute_id = ab.id and at.language_code = $${params.length}`
  }

  if (relation.price) {
    sql += `left join listing_prices lp on lp.listing_id = l.id`
  }

  sql += ` where l.id = $1 group by l.id`

  if (relation.price) sql += ', lp.*'

  let { rows } = await query(sql, params);

  return rows[0];
}

export async function get_by_hash_id({ hash_id, relation = {} } = {}) {
  //TODO: make this dynamic
  let currency = "UZS"

  let { rows } = await query(`
    select l.*,
    er.to_currency as currency,
    round(ll.price * er.rate) as price
    ${relation.attachments ? `, coalesce(array_agg(row_to_json(a)) filter (where a.id is not null), '{}') as attachments` : ''}
    ${relation.creator ? `, json_build_object('name', u.name, 'id', u.id, 'profile_photo_url', u.profile_photo_url, 'profile_url', u.profile_url) as creator` : ''}
    from listings l
    join listing_prices lp on lp.listing_id  = l.id
    join exchange_rates er on er.from_currency = lp.currency_code and er.to_currency = $1
    ${relation.attachments ? `
    left join listing_attachments la on la.listing_id = l.id
    left join attachments a on a.id = la.attachment_id
    ` : ''}
    ${relation.creator ? ` join users u on u.id = p.created_by ` : ''}
    where l.hash_id = $2
    group by
      l.id, lp.amount, er.rate, er.to_currency
      ${relation.creator ? ', u.id, u.name' : ''}
  `, [currency, hash_id])

  return rows[0];
}

async function cursor_paginate(list = []) {
  let first = list[0];
  let last = list[list.length - 1];
  let has_next = false;
  let has_prev = false;

  if (last) {
    let { rows } = await query(`select 1 from listings where id < $1 limit 1`, [last.id]);
    has_next = rows.length > 0;
  }

  if (first) {
    let { rows } = await query(`select 1 from listings where id > $1 limit 1`, [first.id]);
    has_prev = rows.length > 0;
  }

  return { list, has_next, has_prev };
}

export async function get_many({
  currency = "UZS",
  status,
  limit = 15,
  lang = "en",
  cursor,
  direction,
  created_by
} = {}) {
  let params = [currency, status, limit];
  let sql = `
    select l.*, a.url as cover_url, er.to_currency as currency, round(lp.amount * er.rate) as price, row_to_json(ll) as location from listings l
    left join listing_prices lp on lp.listing_id = l.id
    left join exchange_rates er on er.from_currency = lp.currency_code and er.to_currency = $1
    left join listing_location ll on ll.listing_id = l.id
    left join attachments a on a.id = l.cover_id
    where l.status = $2
  `

  if (created_by) {
    params.push(created_by);
    sql += `and l.created_by = $${params.length}`;
  }

  if (direction === "after") {
    params.push(cursor)
    sql += ` and l.id < $${params.length}`;
  } else if (direction === "before") {
    params.push(cursor);
    sql += ` and l.id > $${params.length}`;
  }

  sql += ` order by l.id limit $3`;
  let { rows } = await query(sql, params);
  console.log({ rows });
  return await cursor_paginate(rows);
}

export async function get_statuses({ lang = "en" }) {
  let { rows } = await query(`select ls.id, ls.code, ls.bg_hex, ls.fg_hex, lst.name from listing_statuses ls
    join listing_status_translations lst on lst.status_code = ls.code and language_code = $1
  `, [lang.substring(0, 2)])

  return rows;
}

export async function update_one(ability, id, update) {
  let listing = await get_one({ id });

  if (!ability.can("update", subject("Listing", listing))) {
    throw new AuthorizationError();
  }

  let fields = permittedFieldsOf(ability, "update", subject("Listing", listing), { fieldsFrom: (rule) => rule.fields });
  let sql = '';
  let params = [id];
  let keys = Object.keys(pick(update, fields));
  for (let i = 0, len = keys.length; i < len; i++) {
    params.push(update[keys[i]]);
    sql += keys[i] + "=" + `$${params.length}`;
    let is_last = i === len - 1;
    if (!is_last) sql += ", "
  }

  let { rowCount, rows } = await query(`update listings set ${sql} where id = $1`, params)

  if (rowCount === 0) {
    //TODO: does not exist
  }

  return rows[0];
}

export async function link_attachments(ability, id, attachments = []) {
  let listing = await get_one({ id });
  if (!ability.can("update", subject("Listing", listing))) {
    throw new AuthorizationError();
  }

  let trx = await start_trx();
  try {
    await Promise.all(attachments.map(a => {
      return trx.query(`insert into listing_attachments (listing_id, attachment_id, display_order) values ($1, $2, $3) on conflict(listing_id, attachment_id) do nothing`, [id, a.id, a.order]);
    }));
    await commit_trx(trx);
  } catch (err) {
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function unlink_attachment(ability, listing_id, attachment_id) {
  let listing = await get_one({ id: listing_id });
  if (!ability.can("update", subject("Listing", listing))) {
    throw new AuthorizationError();
  }
  await query(`delete from listing_attachments where listing_id = $1 and attachment_id = $2`, [listing_id, attachment_id])
  return attachment_id;
}

export async function upsert_price(ability, { amount, currency_code, id }) {
  let listing = await get_one({ id });
  if (!ability.can("update", subject("Listing", listing))) {
    throw new AuthorizationError();
  }
  let { rows } = await query(`insert into listing_prices (amount, currency_code, listing_id)
    values ($1, $2, $3) on conflict(listing_id) do update set amount = $1, currency_code = $2`,
    [amount, currency_code, id]);

  return rows[0];
}
