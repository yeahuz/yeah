import { Attribute } from "../models/index.js";
import { array_to_tree } from "../utils/index.js";

export async function get_category_attributes({ category_set = [], lang = "en" }) {
  return await Attribute.query()
    .whereRaw("category_set @> ARRAY[??]", category_set)
    .withGraphFetched("translation")
    .modifyGraph("translation", (builder) =>
      builder.where({ language_code: lang.substring(0, 2) })
    );
}

export async function get_many({ lang = "en", format = "tree" } = {}) {
  const attributes = await Attribute.query()
    .select("at.name as name", "attributes.id", "attributes.parent_id", "attributes.type", "attributes.category_set")
    .join("attribute_translations as at", "at.attribute_id", "attributes.id")
    .where({ language_code: lang.substring(0, 2) });

  if (format === "tree") return array_to_tree(attributes);
  return attributes;
}

export async function get_translations(id) {
  return await Attribute.relatedQuery("translation").for(id);
}

export async function create_one({ translation, parent_id, category_set, type, key }) {
  return await Attribute.query().insertGraph({ parent_id, category_set, type, key, translation }, { relate: true });
}

export async function delete_one(id) {
  return await Attribute.query().deleteById(id);
}
