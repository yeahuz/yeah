import { Posting } from "./models/index.js";
import { elastic_client } from "./services/es.service.js";
import cron from "node-cron";
import objection from "objection";

let { raw } = objection;

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
  let postings = await Posting.query()
    .alias("p")
    .select(
      "p.id as id",
      "p.title",
      "p.description",
      "p.cover_url",
      "p.url",
      "p.created_at as created_at",
      "pl.district_id",
      "pl.region_id",
      "pl.formatted_address",
      "d.coords as district_coords",
      "r.coords as region_coords",
      "exchange_rates.to_currency as currency",
      raw("cast(round(price * rate) as int)").as("price")
    )
    .where({ status_id: 4 })
    .withGraphFetched("[attributes.[field.[translation], translation], categories.[translation]]")
    .join("posting_location as pl", "p.id", "pl.posting_id")
    .join("districts as d", "pl.district_id", "d.id")
    .join("regions as r", "pl.region_id", "r.id")
    .join("posting_prices as pp", "p.id", "pp.posting_id")
    .join("exchange_rates", "exchange_rates.from_currency", "pp.currency_code")
    .where("exchange_rates.to_currency", "=", "USD")
    .modifyGraph("categories.translation", (builder) =>
      builder.select("title").where({ language_code: "ru" })
    )
    .modifyGraph("location.district", (builder) => {
      builder.select("ditrict.coords");
    })
    .modifyGraph("attributes.translation", (builder) =>
      builder.select("label").where({ language_code: "ru" })
    )
    .modifyGraph("attributes.field", (builder) => builder.select("id", "name", "type"))
    .modifyGraph("attributes.field.translation", (builder) =>
      builder.select("label").where({ language_code: "ru" })
    );

  for (let posting of postings) {
    let checkbox_facets = [];
    let radio_facets = [];
    let number_facets = [];
    for (let attribute of posting.attributes) {
      if (attribute.field.type === "checkbox") {
        checkbox_facets.push({
          facet_id: attribute.category_field_id,
          facet_name: attribute.field.translation.label,
          facet_value_id: attribute.id,
          facet_value_name: attribute.translation.label,
        });
      }
      if (attribute.field.type === "radio") {
        radio_facets.push({
          facet_id: attribute.category_field_id,
          facet_name: attribute.field.translation.label,
          facet_value_id: attribute.id,
          facet_value_name: attribute.translation.label,
        });
      }
      if (attribute.field.type === "number") {
        number_facets.push({
          facet_id: attribute.category_field_id,
          facet_name: attribute.field.translation.label,
          facet_value_id: attribute.id,
          facet_value_name: attribute.translation.label,
        });
      }
    }

    await elastic_client.index({
      id: posting.id,
      index: "needs_ru",
      body: {
        result: {
          title: posting.title,
          cover_url: posting.cover_url,
          url: posting.url,
          location: {
            formatted_address: posting.formatted_address,
          },
          description: posting.description,
          created_at: posting.created_at,
          price: posting.price,
          currency: posting.currency,
        },
        search_data: {
          checkbox_facets,
          radio_facets,
          number_facets,
          categories: posting.categories.map((c) => c.translation.title),
          category_id: posting.categories.find((c) => c.relation === "DIRECT")?.id,
          title: posting.title,
          full_text: posting.title + posting.description,
          full_text_boosted: boosted_description(posting.title, { checkbox_facets, radio_facets }),
          district_id: posting.district_id,
          region_id: posting.region_id,
          coords: { lat: posting.district_coords.x, lon: posting.district_coords.y },
          price: posting.price,
          created_at: posting.created_at,
          indexed_at: new Date(),
        },
      },
    });

    await posting.$query().patch({ status_id: 1 });
  }
}
