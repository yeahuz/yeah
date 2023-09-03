import { InternalError } from "../utils/errors.js";
import { array_to_tree } from "../utils/index.js";
import { query, rollback_trx } from "./db.service.js";

export async function create_one({ translation, parent_id }) {
  let trx = await start_trx();
  try {
    let { rows: [category] } = await trx.query(`insert into categories (parent_id) values ($1) returning id`, [parent_id]);
    await Promise.all(translation.map(t => trx.query(`insert into category_translations (category_id, title, description, language_id)`, [category.id, t.title, t.description, t.language_id])))
    await commit_trx(trx);
  } catch (err) {
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function get_many({ lang = "en", format = "tree", relation = {} } = {}) {
  let params = [];
  let sql = `select c.id, c.parent_id
  ${relation.translation ? `, ct.title` : ''}
  ${relation.reference ? `, cr.table_name, cr.columns` : ''}
  from categories c`;

  if (relation.translation) {
    params.push(lang.substring(0, 2));
    sql += ` left join category_translations ct on ct.category_id = c.id and ct.language_id = $${params.length}`;
  }
  if (relation.reference) {
    sql += ` left join category_reference cr on cr.category_id = c.id`;
  }

  let { rows } = await query(sql, params);

  if (format === "tree") return array_to_tree(rows);
  return rows;
}

export async function get_by_parent({ lang = "en", parent_id = null } = {}) {
  let params = [lang.substring(0, 2)];
  let sql = `
    select c.id, c.parent_id, ct.title,
    exists (select 1 from categories where parent_id = c.id and parent_id is not null limit 1) as has_children
    from categories c
    join category_translations ct on ct.category_id = c.id and ct.language_id = $1`;
  if (parent_id != null) {
    params.push(parent_id);
    sql += ` where parent_id = $${params.length}`;
  } else sql += ` where parent_id is null`;

  let { rows } = await query(sql, params);
  return rows;
}

//TODO: why is taking ~200ms. It takes 1ms in dbeaver;
export async function get_parents(category_id, include_itself = true) {
  let sql = `with recursive category_parents as (
    select parent_id, id from categories c where id = $1
    union all
    select c.parent_id, c.id from categories c
    join category_parents cp on cp.parent_id = c.id
  ) select id from category_parents`

  if (!include_itself) {
    sql += ' where id != $1'
  }

  let { rows } = await query(sql, [category_id]);

  return rows;
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from categories where id = $1`, [id]);
  if (rowCount === 0) {
    //TODO: handle non-existing record;
  }

  return id;
}
