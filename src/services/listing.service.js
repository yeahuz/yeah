import * as AttachmentService from "./attachment.service.js";
import * as CategoryService from "./category.service.js";
import * as InventoryService from "./inventory.service.js";
import { AuthorizationError, InternalError } from "../utils/errors.js";
import { commit_trx, start_trx, rollback_trx, query, prepare_bulk_insert, escapeIdentifier } from "./db.service.js";
import { subject } from "@casl/ability";
import { permittedFieldsOf } from "@casl/ability/extra";
import { pick } from "../utils/index.js";
import { hashids } from "../utils/hashids.js";
import config from "../config/index.js";
import { CATEGORY_REFERENCE } from "../constants/index.js";

function create_policy_impl(trx = { query }) {
  return async ({ best_offer_enabled = false, best_offer_minimum, best_offer_autoaccept, best_offer_minimum_currency, best_offer_autoaccept_currency } = {}) => {
    let { rows: [policy] } = await trx.query(`insert into listing_policies
      (best_offer_enabled, best_offer_minimum, best_offer_autoaccept, best_offer_minimum_currency, best_offer_autoaccept_currency)
      values ($1, $2, $3, $4, $5) returning id
    `, [best_offer_enabled, best_offer_minimum, best_offer_autoaccept, best_offer_minimum_currency, best_offer_autoaccept_currency])

    return policy;
  }
}

function update_policy_impl(trx = { query }) {
  return async (id, update) => {
    let sql = '';
    let params = [id];
    let keys = Object.keys(update);
    for (let i = 0, len = keys.length; i < len; i++) {
      params.push(update[keys[i]]);
      sql += keys[i] + " = " + `$${params.length}`;
      let is_last = i === len - 1;
      if (!is_last) sql += ", ";
    }

    let { rows, rowCount } = await trx.query(`update listing_policies set ${sql} where id = $1`, params);
    if (rowCount == 0) {
      // TODO: policy does not exist.handle somehow ??
    }

    return rows[0];
  }
}

export let create_policy_trx = (trx) => create_policy_impl(trx);
export let create_policy = create_policy_impl();

export let update_policy_trx = (trx) => update_policy_impl(trx);
export let update_policy = update_policy_impl();

export async function create_one({ title, description, status, created_by, category_id }) {
  let trx = await start_trx();
  try {
    let policy = await create_policy_trx(trx)();
    let { rows: [listing] } = await trx.query(`insert into listings (title, description, status, created_by, category_id, policy_id)
      values ($1, $2, $3, $4, $5, $6) returning id`, [title, description, status, created_by, category_id, policy.id]);

    let url = new URL(`listings/${hashids.encode([listing.id])}`, config.origin).href;
    await trx.query(`update listings set url = $1 where id = $2`, [url, listing.id]);
    let categories = await CategoryService.get_parents(category_id);
    await Promise.all(categories.map((category) => {
      return trx.query(`insert into listing_categories (category_id, listing_id) values ($1, $2)`, [category.id, listing.id]);
    }));

    await commit_trx(trx);
    return listing;
  } catch (err) {
    console.log({ err });
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function update_variation_options(id, options) {
  let { rows } = await query(`update listings set variation_options = $1 where id = $2`, [options, id]);
  return rows[0];
}

export async function resolve_attribute_options(options, lang = "en") {
  let { rows } = await query(`
    select ao.attribute_id, at.name, a.key,
    json_agg(json_build_object('value_label', coalesce(aot.name, ao.value || ' ' || ao.unit), 'value', ao.value || coalesce(' ' || nullif(ao.unit, ''), ''))) as options
    from attribute_2_options ao
    left join attributes_2 a on a.id = ao.attribute_id
    left join attribute_2_option_translations aot on aot.attribute_option_id = ao.id and aot.language_id = $2
    left join attribute_2_translations at on at.attribute_id = a.id and at.language_id = $2
    where ao.id = any($1) group by ao.attribute_id, at.name, a.key`,
    [options, lang.substring(0, 2)]);
  return rows;
}

export async function get_one({ id, lang = "en", relation = {} } = {}) {
  if (!id) return;
  let params = [id];
  // ${relation.discounts ? `, coalesce(array_agg(row_to_json(ld)) filter (where ld.id is not null), '{}') as discounts` : ''}
  // ${relation.price ? `, row_to_json(lp) as price` : ''}
  // ${relation.attributes ? `, coalesce(array_agg(row_to_json(lb)) filter (where lb.attribute_id is not null), '{}') as attributes` : ''}
  let sql = `
    select l.*
    ${relation.location ? `, row_to_json(ll) as location` : ''}
    ${relation.attachments ? `, coalesce(array_agg(row_to_json(a) order by la.display_order asc) filter (where a.id is not null), '{}') as attachments` : ''}
    ${relation.discounts ? `, coalesce(ld.discounts, '[]') as discounts` : ''}
    ${relation.policy ? `, row_to_json(lp) as policy` : ''}
    from listings l
    ${relation.attachments ? `
    left join listing_attachments la on la.listing_id = l.id
    left join attachments a on a.id = la.attachment_id` : ''}
    ${relation.location ? `left join listing_location ll on ll.listing_id = l.id` : ''}
    ${relation.policy ? `left join listing_policies lp on lp.id = l.policy_id` : ''}
  `;

  // left join listing_skus ls on ls.listing_id = l.id
  // left join listing_sku_prices lsp on lsp.listing_sku_id = ls.id

  // if (relation.attributes) {
  //   params.push(lang.substring(0, 2));
  //   sql += `left join listing_attributes lb on lb.listing_id = l.id
  //           left join attributes ab on ab.id = lb.attribute_id
  //           left join attributes ab2 on ab2.id = lb.attribute_value_id
  //           left join attribute_translations at on at.attribute_id = ab.id and at.language_id = $${params.length}`
  // }

  // if (relation.discounts) {
  //   sql += ` left join listing_discounts ld on ld.listing_id = l.id`
  // }
  //
  if (relation.discounts) {
    sql += ` left join lateral
      (select listing_id, jsonb_agg(ld) filter(where ld.id is not null) as discounts from listing_discounts ld where ld.listing_id = l.id group by ld.listing_id)
      ld on ld.listing_id = l.id`;
  }

  // if (relation.price) {
  //   sql += ` left join listing_prices lp on lp.id = l.price_id`;
  // }

  sql += ` where l.id = $1 group by l.id`;

  if (relation.discounts) sql += `, ld.discounts`;
  if (relation.policy) sql += `, lp.*`;
  // if (relation.price) sql += ', lp.*'

  let { rows } = await query(sql, params);

  return rows[0];
}

export async function get_variants(listing) {
  let reference = CATEGORY_REFERENCE[listing.category_id];
  if (!reference) throw new Error("Category reference not found");
  let { rows } = await query(`
    select ls.*, lsp.unit_price, lsp.currency, t.*, i.quantity from listing_skus ls
    left join ${escapeIdentifier(reference.table_name)} t on t.listing_sku_id = ls.id
    left join listing_sku_prices lsp on lsp.id = ls.price_id
    left join inventory i on i.listing_sku_id = ls.id
    where ls.listing_id = $1`, [listing.id]);

  return rows;
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
    select l.*, a.url as cover_url, er.to_currency as currency, round(prices.start_price * er.rate) as start_price, round(prices.max_price * er.rate) as max_price, row_to_json(ll) as location from listings l
    left join listing_skus ls on ls.listing_id = l.id
    left join (
      select id, min(unit_price) as start_price, max(unit_price) as max_price, currency from listing_sku_prices group by id
    ) prices on ls.price_id = prices.id
    left join exchange_rates er on er.from_currency = prices.currency and er.to_currency = $1
    left join listing_location ll on ll.listing_id = l.id
    left join attachments a on a.id = l.cover_id
    where l.status = $2
  `;

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
  return await cursor_paginate(rows);
}

export async function get_statuses({ lang = "en" }) {
  let { rows } = await query(`select ls.id, ls.bg_hex, ls.fg_hex, lst.name from listing_statuses ls
    join listing_status_translations lst on lst.status_id = ls.id and language_id = $1
  `, [lang.substring(0, 2)]);

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
    if (!is_last) sql += ", ";
  }

  if (sql) {
    let { rowCount, rows } = await query(`update listings set ${sql} where id = $1`, params);

    if (rowCount === 0) {
      //TODO: does not exist
    }

    return rows[0];
  }
}

export async function get_category_reference(id) {
  let { rows } = await query(`select cr.* from listing_categories lc join category_reference cr on cr.category_id = lc.category_id where lc.listing_id = $1`, [id]);
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
  await query(`delete from listing_attachments where listing_id = $1 and attachment_id = $2`, [listing_id, attachment_id]);
  return attachment_id;
}

export function upsert_price(trx = { query }) {
  return async ({ unit_price, currency, listing_sku_id }) => {
    let { rows: [price] } = await trx.query(`insert into listing_sku_prices (unit_price, currency, listing_sku_id) values ($1, $2, $3) returning id`, [unit_price, currency, listing_sku_id]);
    await trx.query(`update listing_skus set price_id = $1 where id = $2`, [price.id, listing_sku_id]);
    return price;
  };
}

export async function update_listing_attributes(listing_id) {
  let categories = await get_category_reference(listing_id);
  return async ({ listing_sku_id, attributes, trx = { query } }) => {
    let promises = categories.map((category) => {
      let fields = pick(attributes, category.columns);
      let keys = Object.keys(fields);
      let values = Object.values(fields);
      let updates = keys.map((k, i) => `${k}=$${i + 2}`).join(", ");
      if (keys.length) {
        return trx.query(`insert into ${escapeIdentifier(category.table_name)} (${["listing_sku_id", ...keys].join(", ")}) values (${["$1", ...values.map((_, i) => `$${i + 2}`)].join(", ")})
          on conflict(listing_sku_id) do update set ${updates}`,
          [listing_sku_id, ...values]);
      }
      return Promise.resolve();
    });
    return await Promise.all(promises);
  };
}

export async function upsert_sku({ listing_id, price_id, unit_price, currency, custom_sku, created_by, attributes, quantity }) {
  let update_attributes = await update_listing_attributes(listing_id);
  let trx = await start_trx();
  try {
    let { rows: [sku] } = await trx.query(`insert into listing_skus
      (listing_id, price_id, custom_sku, created_by)
      values ($1, $2, $3, $4) returning id`, [listing_id, price_id, custom_sku, created_by]);
    await Promise.all([
      InventoryService.add_trx(trx)({ listing_sku_id: sku.id, quantity }),
      upsert_price(trx)({ unit_price, currency, listing_sku_id: sku.id }),
      update_attributes({ trx, listing_sku_id: sku.id, attributes })
    ]);
    await commit_trx(trx);
    return sku;
  } catch (err) {
    console.log({ err });
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function cleanup_skus({ listing_id }) {
  let { rowCount } = await query(`delete from listing_skus where listing_id = $1`, [listing_id]);
  return rowCount;
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
