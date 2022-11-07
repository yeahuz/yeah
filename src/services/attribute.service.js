import { Attribute } from "../models/index.js";

export async function get_category_attributes({ category_set = [], lang = "en" }) {
  return await Attribute.query()
    .whereRaw("category_set @> ARRAY[??]", category_set)
    .withGraphFetched("translation")
    .modifyGraph("translation", (builder) =>
      builder.where({ language_code: lang.substring(0, 2) })
    );
}
