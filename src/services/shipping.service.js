import { query } from "./db.service.js";

export async function get_services({ lang = "en" } = {}) {
  let { rows } = await query(`select name, description, logo_url, logo_data_url, active
    from shipping_services ss
    left join shipping_service_translations sst on sst.shipping_service_id = ss.id and sst.language_id = $1`, [lang.substring(0, 2)]);
  return rows;
}


export async function get_cost_types({ lang = "en" } = {}) {
  let { rows } = await query(`select sct.id, name, description
    from shipping_cost_types sct
    left join shipping_cost_type_translations sctt on sctt.cost_type_id = sct.id and sctt.language_id = $1`, [lang.substring(0, 2)]);
  return rows;
}
