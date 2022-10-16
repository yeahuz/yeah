import { elastic_client } from "./services/es.service.js";

(async () => {
  await elastic_client.indices.putIndexTemplate({
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

  await elastic_client.indices.putIndexTemplate({
    name: "needs",
    body: {
      index_patterns: ["needs_*"],
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

  const result = await fetch("/elastic/regions");
  console.log({ result });
})();
