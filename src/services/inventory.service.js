import { query } from "./db.service.js";

export async function add({ listing_sku_id, quantity }) {
  let { rows } = await query(`insert into inventory (listing_sku_id, quantity) values ($1, $2) on conflict (listing_sku_id) do update set quantity = $2`, [listing_sku_id, quantity]);
  return rows[0];
}
