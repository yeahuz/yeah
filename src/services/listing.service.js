import * as AttachmentService from "./attachment.service.js";
import * as CategoryService from "./category.service.js";
import { AuthorizationError, InternalError } from "../utils/errors.js";
import { commit_trx, start_trx, rollback_trx, query, prepare_bulk_insert } from "./db.service.js";
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

export async function create_sku({ listing_id, price_id, custom_sku, store_id }) {
  let { rows } = await query(`insert into listing_skus (listing_id, price_id, custom_sku, store_id) values ($1, $2, $3, $4) returning id`, [listing_id, price_id, custom_sku, store_id]);
  return rows[0];
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
  //     currency,
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

  //   await listing.$relatedQuery("price", trx).insert({ currency, price });
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
  // ${relation.discounts ? `, coalesce(array_agg(row_to_json(ld)) filter (where ld.id is not null), '{}') as discounts` : ''}
  let sql = `
    select l.*
    ${relation.price ? `, row_to_json(lp) as price` : ''}
    ${relation.location ? `, row_to_json(ll) as location` : ''}
    ${relation.attachments ? `, coalesce(array_agg(row_to_json(a) order by la.display_order asc) filter (where a.id is not null), '{}') as attachments` : ''}
    ${relation.attributes ? `, coalesce(array_agg(row_to_json(lb)) filter (where lb.attribute_id is not null), '{}') as attributes` : ''}
    ${relation.discounts ? `, coalesce(ld.discounts, '[]') as discounts` : ''}
    from listings l
    ${relation.attachments ? `
    left join listing_attachments la on la.listing_id = l.id
    left join attachments a on a.id = la.attachment_id` : ''}
    ${relation.location ? `left join listing_location ll on ll.listing_id = l.id` : ''}
  `;

  if (relation.attributes) {
    params.push(lang.substring(0, 2));
    sql += `left join listing_attributes lb on lb.listing_id = l.id
            left join attributes ab on ab.id = lb.attribute_id
            left join attributes ab2 on ab2.id = lb.attribute_value_id
            left join attribute_translations at on at.attribute_id = ab.id and at.language_id = $${params.length}`
  }

  // if (relation.discounts) {
  //   sql += ` left join listing_discounts ld on ld.listing_id = l.id`
  // }
  //
  if (relation.discounts) {
    sql += ` left join lateral
      (select listing_id, jsonb_agg(ld) filter(where ld.id is not null) as discounts from listing_discounts ld where ld.listing_id = l.id group by ld.listing_id)
      ld on ld.listing_id = l.id`
  }

  if (relation.price) {
    sql += ` left join listing_prices lp on lp.id = l.price_id`;
  }

  sql += ` where l.id = $1 group by l.id`

  if (relation.discounts) sql += `, ld.discounts`
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
    join exchange_rates er on er.from_currency = lp.currency and er.to_currency = $1
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
  currency = "UZS", status,
  limit = 15,
  lang = "en",
  cursor,
  direction,
  created_by
} = {}) {
  let params = [currency, status, limit];
  let sql = `
    select l.*, a.url as cover_url, er.to_currency as currency, round(lp.unit_price * er.rate) as price, row_to_json(ll) as location from listings l
    left join listing_prices lp on lp.id = l.price_id
    left join exchange_rates er on er.from_currency = lp.currency and er.to_currency = $1
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
    join listing_status_translations lst on lst.status_code = ls.code and language_id = $1
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

  if (sql) {
    let { rowCount, rows } = await query(`update listings set ${sql} where id = $1`, params)

    if (rowCount === 0) {
      //TODO: does not exist
    }

    return rows[0];
  }
}

export async function update_listing_attributes(id, attributes = []) {
  let prepared = prepare_bulk_insert(attributes, { data: { listing_id: id }, columns_map: { id: "attribute_id", value: "attribute_value_id" } });
  let { rows } = await query(`insert into listing_attributes ${prepared.sql} on conflict(attribute_id, attribute_value_id, listing_id) do nothing`, prepared.params);
  return rows;
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

export async function upsert_price(ability, { unit_price, currency, id }) {
  let listing = await get_one({ id });
  if (!ability.can("update", subject("Listing", listing))) {
    throw new AuthorizationError();
  }
  let trx = await start_trx();
  try {
    let { rows: [price] } = await query(`insert into listing_prices (unit_price, currency, listing_id) values ($1, $2, $3) returning id`, [unit_price, currency, id]);
    await query(`update listings set price_id = $1 where id = $2`, [price.id, id]);
    await commit_trx(trx);
    return price;
  } catch (err) {
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function upsert_discounts(ability, id, discounts = []) {
  let listing = await get_one({ id });
  if (!ability.can("update", subject("Listing", listing))) {
    throw new AuthorizationError();
  }

  let trx = await start_trx();
  try {
    let results = await Promise.all(discounts.map(d => upsert_discount_trx(trx)(Object.assign(d, { listing_id: id }))));
    await commit_trx(trx);
    return results;
  } catch (err) {
    rollback_trx(trx);
    throw new InternalError();
  }
}

function upsert_discount_impl(trx = { query }) {
  return async function upsert_discount({ min_order_value = 0, min_qty_value, unit, value, listing_id }) {
    let { rows } = await trx.query(`insert into listing_discounts (min_order_value, min_qty_value, unit, value, listing_id)
    values ($1, $2, $3, $4, $5) on conflict (min_qty_value, listing_id, unit, min_order_value)
    do update set min_order_value = $1, min_qty_value = $2, unit = $3, value = $4`, [min_order_value, min_qty_value, unit, value, listing_id]);

    return rows[0];
  }
}

export let upsert_discount_trx = (trx) => upsert_discount_impl(trx);
export let upsert_discount = upsert_discount_impl();
