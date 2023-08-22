import { Category } from "../models/index.js";
import { array_to_tree } from "../utils/index.js";
import { query } from "./db.service.js";

export async function create_one({ translation, parent_id }) {
  return await Category.query().insertGraph({ parent_id, translation }, { relate: true });
}

export async function get_many({ lang = "en", format = "tree" } = {}) {
  let { rows } = await query(`select c.id, c.parent_id, ct.title from categories c join category_translations ct on ct.category_id = c.id and ct.language_code = $1`, [lang.substring(0, 2)]);
  if (format === "tree") return array_to_tree(rows);
  return rows;
}

export async function get_by_parent({ lang = "en", parent_id = null } = {}) {
  let { rows } = await query(`
    select c.id, c.parent_id,
    exists (select 1 from categories where parent_id = c.id and parent_id is not null limit 1) as has_children
    from categories c
    join category_translations ct on ct.category_id = c.id and ct.language_code = $1
    where parent_id = $2`, [lang.substring(0, 2), parent_id])

  return rows;
}

export async function get_parents(category_id, include_itself = true) {
  const knex = Category.knex();
  const cte_query = knex
    .withRecursive("category_parents", (qb) => {
      qb.select("parent_id", "id")
        .from("categories")
        .where({ id: category_id })
        .unionAll((qb) => {
          qb.select("categories.parent_id", "categories.id")
            .from("categories")
            .join("category_parents", "category_parents.parent_id", "categories.id");
        });
    })
    .select("id")
    .from("category_parents");

  if (!include_itself) {
    cte_query.whereNot({ id: category_id });
  }

  return await cte_query;
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from categories where id = $1`, [id]);
  if (rowCount === 0) {
    //TODO: handle non-existing record;
  }

  return id;
}
