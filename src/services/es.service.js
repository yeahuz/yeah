import config from "../config/index.js";
import { Client } from "@elastic/elasticsearch";

export const elastic_client = new Client({
  node: config.es_uri,
});

export function get_ranked_lang_indices(index_name, languages) {
  const ranked_indices = [];

  for (let i = languages.length - 1; i >= 0; i--) {
    ranked_indices.push({
      [`${index_name}${languages[i]}`]: languages.length - i,
    });
  }

  return ranked_indices;
}

export async function general_search(
  index_name,
  {
    q,
    facets = {},
    region_id,
    district_id,
    placement,
    min_amount = 0,
    max_amount = 2147483647,
    geo = {},
  } = {}
) {
  const filters = [
    {
      range: {
        "search_data.price": { gte: parseInt(min_amount, 10), lte: parseInt(max_amount, 10) },
      },
    },
  ];

  if (region_id) {
    filters.push({ term: { "search_data.region_id": region_id } });
  }

  if (district_id) {
    filters.push({ term: { "search_data.district_id": district_id } });
  }

  if (placement) {
    filters.push({
      range: {
        "search_data.created_at": { gt: `now-${placement}`, lt: "now" },
      },
    });
  }

  const facet_keys = Object.keys(facets);

  if (facet_keys.length > 0) {
    filters.push({
      bool: {
        should: [
          {
            nested: {
              path: "search_data.checkbox_facets",
              query: {
                bool: {
                  filter: [
                    {
                      terms: {
                        "search_data.checkbox_facets.facet_id": facet_keys,
                      },
                    },
                    {
                      terms: {
                        "search_data.checkbox_facets.facet_value_id": Object.values(facets).flat(),
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            nested: {
              path: "search_data.radio_facets",
              query: {
                bool: {
                  filter: [
                    {
                      terms: {
                        "search_data.radio_facets.facet_id": facet_keys,
                      },
                    },
                    {
                      terms: {
                        "search_data.radio_facets.facet_value_id": Object.values(facets).flat(),
                      },
                    },
                  ],
                },
              },
            },
          },
          {
            nested: {
              path: "search_data.number_facets",
              query: {
                bool: {
                  filter: [
                    {
                      terms: {
                        "search_data.number_facets.facet_id": facet_keys,
                      },
                    },
                    {
                      terms: {
                        "search_data.number_facets.facet_value_id": Object.values(facets).flat(),
                      },
                    },
                  ],
                },
              },
            },
          },
        ],
      },
    });
  }

  const should = [
    {
      multi_match: {
        query: q,
        type: "bool_prefix",
        operator: "and",
        fields: [
          "search_data.full_text",
          "search_data.full_text_boosted",
          "seach_data.categories.keyword^50",
        ],
      },
    },
    {
      multi_match: {
        query: q,
        fields: [
          "search_data.full_text",
          "search_data.full_text_boosted",
          "seach_data.categories.keyword^50",
        ],
      },
    },
  ];

  if (geo.loc) {
    should.push({
      geo_distance: {
        distance: "50km",
        "search_data.coords": geo.loc,
      },
    });
  }

  const result = await elastic_client.search({
    index: index_name,
    body: {
      _source: ["result"],
      query: {
        bool: {
          must: [
            {
              multi_match: {
                query: q,
                type: "bool_prefix",
                fields: [
                  "search_data.full_text",
                  "search_data.full_text_boosted",
                  "search_data.categories.keyword^50",
                ],
              },
            },
          ],
          should,
          filter: filters,
        },
      },
      aggs: {
        checkbox_facets: {
          nested: {
            path: "search_data.checkbox_facets",
          },
          aggs: {
            facet_id: {
              terms: {
                field: "search_data.checkbox_facets.facet_id",
              },
              aggs: {
                facet_name: {
                  terms: {
                    field: "search_data.checkbox_facets.facet_name",
                    size: 1,
                  },
                },
                facet_value_id: {
                  terms: {
                    field: "search_data.checkbox_facets.facet_value_id",
                  },
                  aggs: {
                    facet_value_name: {
                      terms: {
                        field: "search_data.checkbox_facets.facet_value_name",
                      },
                    },
                  },
                },
              },
            },
          },
        },
        radio_facets: {
          nested: {
            path: "search_data.radio_facets",
          },
          aggs: {
            facet_id: {
              terms: {
                field: "search_data.radio_facets.facet_id",
              },
              aggs: {
                facet_name: {
                  terms: {
                    field: "search_data.radio_facets.facet_name",
                    size: 1,
                  },
                },
                facet_value_id: {
                  terms: {
                    field: "search_data.radio_facets.facet_value_id",
                  },
                  aggs: {
                    facet_value_name: {
                      terms: {
                        field: "search_data.radio_facets.facet_value_name",
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return result;
}
