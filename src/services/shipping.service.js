import { query } from "./db.service.js";

export async function get_services({ lang = "en" } = {}) {
  let { rows } = await query(`select name, description, logo_url, logo_data_url, active
    from shipping_services ss left
    join shipping_service_translations sst on sst.shipping_service_id = ss.id and sst.language_id = $1`, [lang.substring(0, 2)])
  return rows;
}
