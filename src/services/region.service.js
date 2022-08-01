import { Region } from '../models/region.model.js'

export async function get_many({ country_code = "uz", lang = "en" } = {}) {
   return await Region.query().select("rt.short_name as short_name", "rt.long_name as long_name", "regions.id", "regions.coords", "rt.language_code as lang")
                     .join("region_translations as rt", "rt.region_id", "regions.id")
                     .withGraphFetched("districts").modifyGraph("districts", (builder) => builder
                                                               .select("dt.short_name as short_name", "dt.long_name as long_name", "districts.id", "districts.coords", "dt.language_code as lang")
                                                               .join("district_translations as dt", "dt.district_id", "districts.id"));
}

export async function get_many_prev({ country_code = "uz", lang = "en" } = {}) {
  return await Region.query().select("rt.short_name as short_name", "rt.long_name as long_name", "regions.id", "regions.coords")
                     .join("region_translations as rt", "rt.region_id", "regions.id")
                     .withGraphJoined("districts").modifyGraph("districts", (builder) => builder
                                                               .select("dt.short_name as short_name", "dt.long_name as long_name", "districts.id", "districts.coords")
                                                               .join("district_translations as dt", "dt.district_id", "districts.id").where({ language_code: lang.substring(0, 2) }))
                     .where({ language_code: lang.substring(0, 2) });
}

// export async function get_many({ lang = "en" }) {
//   return await Category.query().select("ct.title as title", "categories.id", "categories.parent_id")
//                        .join('category_translations as ct', "ct.category_id", "categories.id")
//                        .where({ language_code: lang.substring(0, 2) });
// }
