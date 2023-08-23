import { elastic_client } from "./services/es.service.js";
import * as RegionService from "./services/region.service.js";

let SUPPORTED_LANGS = ["en", "uz", "ru"];

async function create_index(name) {
  console.log(`Creating index ${name}`)
  let exists = await elastic_client.indices.exists({ index: name });
  if (exists) {
    console.log(`Index ${name} already exists. Skipping...`)
    return
  }

  return await elastic_client.indices.create({ index: name });
}

async function create_index_template({ name, body }) {
  let exists = await elastic_client.indices.existsIndexTemplate({ name });
  if (exists) {
    console.log(`Index template ${name} already exists. Skipping...`);
    return false;
  }

  return await elastic_client.indices.putIndexTemplate({ name, body });
}

async function insert_regions() {
  let result = { en: 0, ru: 0, uz: 0 };

  for (let lang of SUPPORTED_LANGS) {
    let regions = await RegionService.get_regions({ lang });
    for (let region of regions) {
      let other_langs = SUPPORTED_LANGS.filter((l) => l !== lang);
      let districts = await RegionService.get_districts({ region_id: region.id, lang });

      for (let district of districts) {
        let combined = `${district.long_name}, ${region.long_name}`;
        for (let other_lang of other_langs) {
          let sibling = await RegionService.get_region({ id: region.id, lang: other_lang });
          let sibling_district = await RegionService.get_district({
            id: district.id,
            lang: other_lang,
          });
          combined += `; ${sibling_district.long_name}, ${sibling.long_name}`;
        }

        await elastic_client.index({
          index: `regions_${lang}`,
          body: {
            region_id: region.id,
            district_id: district.id,
            formatted_address: `${district.long_name}, ${region.long_name}`,
            combined_address: combined,
            ...(district.coords && {
              coords: { lat: district.coords.x, lon: district.coords.y },
            }),
          },
        });

        result[lang] += 1;
      }
    }
  }

  return result;
}

(async () => {
  console.log("Putting needs_* index template");
  await create_index_template({
    name: "needs",
    body: {
      index_patterns: ["needs_*"],
      template: {
        mappings: {
          _routing: {
            required: false,
          },
          numeric_detection: false,
          dynamic_date_formats: [
            "strict_date_optional_time",
            "yyyy/MM/dd HH:mm:ss Z||yyyy/MM/dd Z",
          ],
          _source: {
            excludes: [],
            includes: [],
            enabled: true,
          },
          dynamic: true,
          dynamic_templates: [],
          date_detection: true,
          properties: {
            result: {
              dynamic: true,
              type: "object",
              enabled: false,
            },
            scores: {
              type: "rank_features",
            },
            search_data: {
              type: "object",
              properties: {
                region_id: {
                  type: "integer",
                },
                created_at: {
                  index: true,
                  ignore_malformed: false,
                  store: false,
                  type: "date",
                  doc_values: true,
                },
                radio_facets: {
                  type: "nested",
                  properties: {
                    facet_value_id: {
                      eager_global_ordinals: false,
                      norms: false,
                      index: true,
                      store: false,
                      type: "keyword",
                      split_queries_on_whitespace: false,
                      index_options: "docs",
                      doc_values: true,
                    },
                    facet_name: {
                      type: "keyword",
                    },
                    facet_id: {
                      type: "keyword",
                    },
                    facet_value_name: {
                      type: "keyword",
                    },
                  },
                },
                title: {
                  norms: true,
                  index: true,
                  store: false,
                  type: "search_as_you_type",
                  index_options: "positions",
                },
                checkbox_facets: {
                  type: "nested",
                  properties: {
                    facet_value_id: {
                      eager_global_ordinals: false,
                      norms: false,
                      index: true,
                      store: false,
                      type: "keyword",
                      split_queries_on_whitespace: false,
                      index_options: "docs",
                      doc_values: true,
                    },
                    facet_name: {
                      type: "keyword",
                    },
                    facet_id: {
                      type: "keyword",
                    },
                    facet_value_name: {
                      type: "keyword",
                    },
                  },
                },
                full_text_boosted: {
                  eager_global_ordinals: false,
                  index_phrases: false,
                  fielddata: false,
                  norms: true,
                  index: true,
                  boost: 7,
                  store: false,
                  type: "text",
                  index_options: "positions",
                },
                category_id: {
                  type: "integer",
                },
                indexed_at: {
                  type: "date",
                },
                full_text: {
                  eager_global_ordinals: false,
                  index_phrases: false,
                  fielddata: false,
                  norms: true,
                  index: true,
                  store: false,
                  type: "text",
                  index_options: "positions",
                },
                number_facets: {
                  type: "nested",
                  properties: {
                    facet_value_id: {
                      eager_global_ordinals: false,
                      norms: false,
                      index: true,
                      store: false,
                      type: "keyword",
                      split_queries_on_whitespace: false,
                      index_options: "docs",
                      doc_values: true,
                    },
                    facet_name: {
                      type: "keyword",
                    },
                    facet_id: {
                      type: "keyword",
                    },
                    facet_value_name: {
                      type: "keyword",
                    },
                  },
                },
                price: {
                  type: "integer",
                },
                categories: {
                  type: "text",
                  fields: {
                    keyword: {
                      type: "keyword",
                    },
                  },
                },
                district_id: {
                  type: "integer",
                },
                coords: {
                  type: "geo_point",
                },
              },
            },
          },
        },
      },
    },
  });

  await Promise.all(SUPPORTED_LANGS.map((lang) => create_index(`needs_${lang}`)));

  console.log("Putting regions_* index template");
  await create_index_template({
    name: "regions",
    body: {
      index_patterns: ["regions_*"],
      template: {
        mappings: {
          dynamic_templates: [],
          properties: {
            formatted_address: {
              eager_global_ordinals: false,
              index_phrases: false,
              fielddata: false,
              norms: true,
              index: false,
              store: false,
              type: "text",
            },
            region_id: {
              type: "integer",
            },
            combined_address: {
              type: "search_as_you_type",
            },
            district_id: {
              type: "integer",
            },
            coords: {
              type: "geo_point",
            },
          },
        },
      },
    },
  });

  console.log("Inserting regions to regions_*");
  let inserted_regions = await insert_regions();
  console.log({ inserted_regions });
  process.exit(0)
})();
