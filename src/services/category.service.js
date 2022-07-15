import { Category } from '../models/index.js'

export async function get_many({ lang = "en" }) {
  return await Category.query().select("ct.title as title", "categories.id", "categories.parent_id")
                       .join('category_translations as ct', "ct.category_id", "categories.id")
                       .where({ language_code: lang.substring(0, 2) });
}

export async function get_desc({ lang = "en" }) {
  return await Category.query().select("translation.title as title", "categories.id as id", "categories.parent_id as parent_id")
                       .where("categories.parent_id", null)
                       .joinRelated("translation")
                       .withGraphJoined("children").modifyGraph("children", (builder) => builder.select("translation.title as title", "categories.id as id", "categories.parent_id as parent_id").joinRelated("translation"))
                       .where("translation.language_code", lang.substring(0, 2));
}
