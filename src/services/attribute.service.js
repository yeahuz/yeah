import { InternalError } from "../utils/errors.js";
import { array_to_tree } from "../utils/index.js";
import { commit_trx, query, rollback_trx, start_trx } from "./db.service.js";

export async function get_category_attributes({ category_set = [], lang = "en", format }) {
  let { rows } = await query(`select a.id, a.type, a.parent_id, a.key, at.name from attributes a
    join attribute_translations at on at.attribute_id = a.id and at.language_id = $1
    where category_set @> ARRAY[$2]::int[]`, [lang.substring(0, 2), category_set.join(", ")])

  if (format === "tree") return array_to_tree(rows);

  return rows;
}

export async function get_category_attributes_2({ category_id, lang = "en", enabled_for_variations }) {
  let sql = `
    select a2.*, a2t.name, jsonb_agg(jsonb_build_object('id', a2o.id, 'name', coalesce(a2ot.name, a2o.value), 'value', a2o.value, 'unit', a2o.unit)) as options from attributes_2 a2
    left join attribute_2_translations a2t on a2t.attribute_id = a2.id and a2t.language_id = $1
    left join attribute_2_options a2o on a2o.attribute_id = a2.id
    left join attribute_2_option_translations a2ot on a2ot.attribute_option_id = a2o.id and a2ot.language_id = $1
    where category_id = $2`;

  if (enabled_for_variations) {
    sql += ` and enabled_for_variations is true `
  }

  sql += `group by a2.id, a2t.name order by a2.required desc`

  let { rows } = await query(sql, [lang.substring(0, 2), category_id])

  return rows;
}

export async function get_many({ lang = "en", format = "tree", attribute_set = [] } = {}) {
  let sql = `select a.id, a.parent_id, a.type, a.category_set, at.name from attributes a join attribute_translations at on at.attribute_id = a.id and at.language_id = $1`;
  let params = [lang.substring(0, 2)];
  if (attribute_set.length) {
    sql += ' where a.id = any($2)'
    params.push(attribute_set);
  }
  let { rows } = await query(sql, params);
  if (format === "tree") return array_to_tree(rows);
  return rows;
}

export async function get_translations(id) {
  let { rows } = await query(`select * attribute_translations where attribute_id = $1`, [id]);
  return rows;
}

export async function create_one({ translation, parent_id, category_set, type, key }) {
  let trx = await start_trx();
  try {
    let { rows: [attribute] } = await trx.query(`insert into attributes (parent_id, category_set, type, key) values ($1, $2, $3, $4) returning id`, [parent_id, category_set, type, key]);
    await Promise.all(translation.map(t => trx.query(`insert into attribute_translations (attribute_id, language_id, name) values ($1, $2, $3)`, [attribute.id, t.language_id, t.name])))
    await commit_trx(trx);
    return rows;
  } catch (err) {
    rollback_trx(trx);
    throw new InternalError()
  }
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from attributes where id = $1`, [id]);
  if (rowCount === 0) {
    //TODO:
  }

  return id;
}
