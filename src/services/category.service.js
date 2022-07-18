import { Category, CategoryField } from '../models/index.js'

export async function get_many({ lang = "en" }) {
  return await Category.query().select("ct.title as title", "categories.id", "categories.parent_id")
                       .join('category_translations as ct', "ct.category_id", "categories.id")
                       .where({ language_code: lang.substring(0, 2) });
}

export async function get_fields({ category_id, lang = "en" }) {
  return await CategoryField.query().where({ category_id })
                            .select("translation.label as label", "translation.placeholder as placeholder", "translation.hint as hint", "category_fields.*")
                            .joinRelated("translation")
                            .where({ language_code: lang.substring(0, 2) })
                            .withGraphFetched("values")
                            .modifyGraph("values", (builder) => builder.select("translation.label as label", "translation.category_field_value_id as id").joinRelated("translation").where({ language_code: lang.substring(0, 2) }))
}

export async function get_desc({ lang = "en" }) {
  return await Category.query().select("translation.title as title", "categories.id as id", "categories.parent_id as parent_id")
                       .where("categories.parent_id", null)
                       .joinRelated("translation")
                       .withGraphJoined("children").modifyGraph("children", (builder) => builder.select("translation.title as title", "categories.id as id", "categories.parent_id as parent_id").joinRelated("translation"))
                       .where("translation.language_code", lang.substring(0, 2));
}
