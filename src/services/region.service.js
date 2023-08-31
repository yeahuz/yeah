import { query } from "./db.service.js";

export async function get_regions({ lang = "en" } = {}) {
  let { rows } = await query(`select rt.short_name, rt.long_name, r.id from regions r join region_translations rt on rt.region_id = r.id and rt.language_id = $1`, [lang.substring(0, 2)]);
  return rows;
}

export async function get_districts({ lang, region_id } = {}) {
  let { rows } = await query(`select
    dt.short_name, dt.long_name, d.id, d.coords
    from districts d
    join district_translations dt on dt.district_id = d.id and dt.language_id = $1
    where d.region_id = $2`, [lang.substring(0, 2), region_id])
  return rows;
}

export async function get_region({ lang = "en", id } = {}) {
  let { rows } = await query(`select rt.short_name, rt.long_name, r.id from regions r join region_translations rt on rt.region_id = r.id and rt.language_id = $1 where r.id = $2`, [lang.substring(0, 2), id]);
  return rows[0];
}

export async function get_district({ lang = "en", id } = {}) {
  let { rows } = await query(`select
    dt.short_name, dt.long_name, d.id, d.coords
    from districts d
    join district_translations dt on dt.district_id = d.id and dt.language_id = $1
    where d.id = $2`, [lang.substring(0, 2), id])
  return rows[0];
}
