import { query } from "./db.service.js";

export let add = add_impl();
export let add_trx = (trx) => add_impl(trx);

function add_impl(trx = { query }) {
  return async ({ listing_sku_id, quantity } = {}) => {
    let { rows } = await trx.query(`insert into inventory (listing_sku_id, quantity) values ($1, $2) on conflict (listing_sku_id) do update set quantity = $2`, [listing_sku_id, quantity]);
    return rows[0];
  }
}
