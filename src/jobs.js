import { Posting } from "./models/index.js";
import objection from "objection";
import cron from "node-cron";
import { elastic_client } from "./services/es.service.js";

const { ref } = objection;

export const pg_to_es = cron.schedule("* * * * *", pg_to_es_impl);

async function pg_to_es_impl() {
  const postings = await Posting.query()
    .where({ status_id: 4 })
    .withGraphFetched("[attributes.[field.[translation], translation], categories.[translation]]")
    .modifyGraph("categories.translation", (builder) =>
      builder.select("title").where({ language_code: "ru" })
    )
    .modifyGraph("attributes.translation", (builder) =>
      builder.select("label").where({ language_code: "ru" })
    )
    .modifyGraph("attributes.field", (builder) => builder.select("id", "name", "type"))
    .modifyGraph("attributes.field.translation", (builder) =>
      builder.select("label").where({ language_code: "ru" })
    );

  for (const posting of postings) {
    const checkbox_facets = [];
    const radio_facets = [];
    for (const attribute of posting.attributes) {
      if (attribute.field.type === "checkbox") {
        checkbox_facets.push({
          facet_name: attribute.category_field_id,
          facet_value: attribute.id,
        });
      }
      if (attribute.field.type === "radio") {
        radio_facets.push({ facet_name: attribute.category_field_id, facet_value: attribute.id });
      }
    }

    await elastic_client.index({
      index: "needs_ru",
      body: {
        result: {
          title: posting.title,
          cover_url: posting.cover_url,
          url: posting.url,
        },
        search_data: {
          checkbox_facets,
          radio_facets,
          categories: posting.categories.map((c) => c.id),
          title: posting.title,
        },
      },
    });

    await posting.$query().patch({ status_id: 1 });
  }
}
