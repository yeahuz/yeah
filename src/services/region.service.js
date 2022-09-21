import { Region, District } from "../models/index.js";

export async function get_many({ country_code = "uz", lang = "en" } = {}) {
  return await Region.query()
    .select(
      "rt.short_name as short_name",
      "rt.long_name as long_name",
      "regions.id",
      "regions.coords",
      "rt.language_code as lang"
    )
    .join("region_translations as rt", "rt.region_id", "regions.id")
    .withGraphFetched("districts")
    .modifyGraph("districts", (builder) =>
      builder
        .select(
          "dt.short_name as short_name",
          "dt.long_name as long_name",
          "districts.id",
          "districts.coords",
          "dt.language_code as lang"
        )
        .join("district_translations as dt", "dt.district_id", "districts.id")
    );
}

export async function get_regions({ lang = "en" } = {}) {
  return await Region.query()
    .select("rt.short_name as short_name", "rt.long_name as long_name", "regions.id")
    .join("region_translations as rt", "rt.region_id", "regions.id")
    .where({ language_code: lang.substring(0, 2) });
}

export async function get_districts({ lang, region_id } = {}) {
  return await District.query()
    .where({ region_id })
    .select(
      "dt.short_name as short_name",
      "dt.long_name as long_name",
      "districts.id",
      "districts.coords"
    )
    .join("district_translations as dt", "dt.district_id", "districts.id")
    .where({ language_code: lang.substring(0, 2) });
}

export async function get_region({ lang = "en", id } = {}) {
  return await Region.query()
    .findById(id)
    .select(
      "rt.short_name as short_name",
      "rt.long_name as long_name",
      "regions.id",
      "rt.language_code as lang"
    )
    .join("region_translations as rt", "rt.region_id", "regions.id")
    .where({ language_code: lang.substring(0, 2) });
}

export async function get_district({ lang = "en", id } = {}) {
  return await District.query()
    .findById(id)
    .select(
      "dt.short_name as short_name",
      "dt.long_name as long_name",
      "districts.id",
      "districts.coords"
    )
    .join("district_translations as dt", "dt.district_id", "districts.id")
    .where({ language_code: lang.substring(0, 2) });
}

export async function get_many_prev({ country_code = "uz", lang = "en" } = {}) {
  return await Region.query()
    .select(
      "rt.short_name as short_name",
      "rt.long_name as long_name",
      "regions.id",
      "regions.coords"
    )
    .join("region_translations as rt", "rt.region_id", "regions.id")
    .withGraphJoined("districts")
    .modifyGraph("districts", (builder) =>
      builder
        .select(
          "dt.short_name as short_name",
          "dt.long_name as long_name",
          "districts.id",
          "districts.coords"
        )
        .join("district_translations as dt", "dt.district_id", "districts.id")
        .where({ language_code: lang.substring(0, 2) })
    )
    .where({ language_code: lang.substring(0, 2) });
}
