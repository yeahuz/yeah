import { query } from "./services/db.service.js";
import { elastic_client } from "./services/es.service.js";
import cron from "node-cron";

export let pg_to_es = cron.schedule("*/5 * * * * *", pg_to_es_impl);

function boosted_description(title, facets) {
  let description = title;
  for (let prop in facets) {
    if (prop === "checkbox_facets") {
      let checkbox_facets = facets[prop];
      description += ` с ${checkbox_facets.map((facet) => facet.facet_value_name).join(", ")}.`;
    }

    if (prop === "radio_facets") {
      let radio_facets = facets[prop];
      description += radio_facets
        .map((facet) => ` ${facet.facet_name} - ${facet.facet_value_name}`)
        .join(", ");
    }
  }

  return description;
}

async function pg_to_es_impl() {
  let status = 4;
  let currency = "USD";
  let lang = "ru"

  // join listing_location pl on pl.listing_id = p.id
  // join districts d on d.id = pl.district_id
  // join regions r on r.id = pl.region_id
  //
  // d.coords as district_coords,
  // r.coords as region_coords,

  //row_to_json(pl) as location,
  // let { rows } = await query(`
  //   select
  //   p.id,
  //   p.title,
  //   p.description,
  //   p.cover_url,
  //   p.url,
  //   p.created_at,
  //   round(pp.price * er.rate)::int as price,
  //   er.to_currency as currency,
  //   json_build_object(
  //     'id', pl.id,
  //     'formatted_address', pl.formatted_address,
  //     'coords', pl.coords,
  //     'region', json_build_object(
  //       'id', r.id,
  //       'short_name', rt.short_name,
  //       'long_name', rt.long_name,
  //       'coords', r.coords
  //     ),
  //     'district', json_build_object(
  //       'id', d.id,
  //       'short_name', dt.short_name,
  //       'long_name', dt.long_name,
  //       'coords', d.coords
  //     )
  //   ) as location,
  //   jsonb_agg(distinct jsonb_build_object(
  //     'id', c.id,
  //     'title', ct.title,
  //     'description', ct.description,
  //     'relation', pc.relation
  //   )) as categories,
  //   jsonb_agg(distinct jsonb_build_object(
  //     'id', a.id,
  //     'name', at.name,
  //     'parent_id', a.parent_id,
  //     'type', a.type,
  //     'key', a.key
  //   )) as attributes
  //   from listings p
  //   join listing_location pl on pl.listing_id = p.id
  //   join districts d on d.id = pl.district_id
  //   join regions r on r.id = pl.region_id
  //   join region_translations rt on rt.region_id = r.id and rt.language_code = $2
  //   join district_translations dt on dt.district_id = d.id and dt.language_code = $2
  //   join listing_prices pp on pp.listing_id = p.id
  //   join exchange_rates er on er.from_currency = pp.currency_code and er.to_currency = $1
  //   left join attributes a on a.id = any(p.attribute_set)
  //   left join attribute_translations at on at.attribute_id = a.id and at.language_code = $2
  //   left join listing_categories pc on pc.listing_id = p.id
  //   left join categories c on c.id = pc.category_id
  //   left join category_translations ct on ct.category_id = c.id and ct.language_code = $2
  //   where status_id = $3
  //   group by
  //     p.id, pp.price, er.rate, er.to_currency, pl.id, r.id, d.id, rt.short_name, rt.long_name, dt.short_name, dt.long_name
  // `, [currency, lang, status]).catch(console.error);


  // let listings = await Listing.query()
  //   .alias("p")
  //   .select(
  //     "p.id as id",
  //     "p.title",
  //     "p.description",
  //     "p.cover_url",
  //     "p.url",
  //     "p.created_at as created_at",
  //     "pl.district_id",
  //     "pl.region_id",
  //     "pl.formatted_address",
  //     "d.coords as district_coords",
  //     "r.coords as region_coords",
  //     "exchange_rates.to_currency as currency",
  //     raw("cast(round(price * rate) as int)").as("price")
  //   )
  //   .where({ status_id: 4 })
  //   .withGraphFetched("[attributes.[field.[translation], translation], categories.[translation]]")
  //   .join("listing_location as pl", "p.id", "pl.listing_id")
  //   .join("districts as d", "pl.district_id", "d.id")
  //   .join("regions as r", "pl.region_id", "r.id")
  //   .join("listing_prices as pp", "p.id", "pp.listing_id")
  //   .join("exchange_rates", "exchange_rates.from_currency", "pp.currency_code")
  //   .where("exchange_rates.to_currency", "=", "USD")
  //   .modifyGraph("categories.translation", (builder) =>
  //     builder.select("title").where({ language_code: "ru" })
  //   )
  //   .modifyGraph("location.district", (builder) => {
  //     builder.select("ditrict.coords");
  //   })
  //   .modifyGraph("attributes.translation", (builder) =>
  //     builder.select("label").where({ language_code: "ru" })
  //   )
  //   .modifyGraph("attributes.field", (builder) => builder.select("id", "name", "type"))
  //   .modifyGraph("attributes.field.translation", (builder) =>
  //     builder.select("label").where({ language_code: "ru" })
  //   );

  // for (let listing of listings) {
  //   let checkbox_facets = [];
  //   let radio_facets = [];
  //   let number_facets = [];
  //   for (let attribute of listing.attributes) {
  //     if (attribute.field.type === "checkbox") {
  //       checkbox_facets.push({
  //         facet_id: attribute.category_field_id,
  //         facet_name: attribute.field.translation.label,
  //         facet_value_id: attribute.id,
  //         facet_value_name: attribute.translation.label,
  //       });
  //     }
  //     if (attribute.field.type === "radio") {
  //       radio_facets.push({
  //         facet_id: attribute.category_field_id,
  //         facet_name: attribute.field.translation.label,
  //         facet_value_id: attribute.id,
  //         facet_value_name: attribute.translation.label,
  //       });
  //     }
  //     if (attribute.field.type === "number") {
  //       number_facets.push({
  //         facet_id: attribute.category_field_id,
  //         facet_name: attribute.field.translation.label,
  //         facet_value_id: attribute.id,
  //         facet_value_name: attribute.translation.label,
  //       });
  //     }
  //   }

  //   await elastic_client.index({
  //     id: listing.id,
  //     index: "needs_ru",
  //     body: {
  //       result: {
  //         title: listing.title,
  //         cover_url: listing.cover_url,
  //         url: listing.url,
  //         location: {
  //           formatted_address: listing.formatted_address,
  //         },
  //         description: listing.description,
  //         created_at: listing.created_at,
  //         price: listing.price,
  //         currency: listing.currency,
  //       },
  //       search_data: {
  //         checkbox_facets,
  //         radio_facets,
  //         number_facets,
  //         categories: listing.categories.map((c) => c.translation.title),
  //         category_id: listing.categories.find((c) => c.relation === "DIRECT")?.id,
  //         title: listing.title,
  //         full_text: listing.title + listing.description,
  //         full_text_boosted: boosted_description(listing.title, { checkbox_facets, radio_facets }),
  //         district_id: listing.district_id,
  //         region_id: listing.region_id,
  //         coords: { lat: listing.district_coords.x, lon: listing.district_coords.y },
  //         price: listing.price,
  //         created_at: listing.created_at,
  //         indexed_at: new Date(),
  //       },
  //     },
  //   });

  //   await listing.$query().patch({ status_id: 1 });
  //}
}
