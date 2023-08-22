import config from "../config/index.js";
import { InternalError } from "../utils/errors.js";
import { Client } from "@googlemaps/google-maps-services-js";
import { elastic_client } from "./es.service.js";

let client = new Client();

export async function get_query_predictions({ q, lang = "en" }) {
  try {
    let response = await elastic_client.search({
      index: `regions_${lang}`,
      body: {
        query: {
          multi_match: {
            query: q,
            type: "bool_prefix",
            fields: ["combined_address", "combined_address._2gram", "combined_address._3gram"],
          },
        },
        collapse: { field: "district_id" },
        _source: ["formatted_address", "district_id", "region_id", "coords"],
      },
    });

    let hits = response.hits.hits
    return hits.map((h) => h._source);
  } catch (err) {
    console.log(err);
    throw new InternalError();
  }
}

export async function geocode({ lat, lon, lang = "en" }) {
  try {
    let { data } = await client.reverseGeocode({
      params: { latlng: [lat, lon], language: lang, key: config.google_maps_api_key },
    });
    console.log(data);
    let ret = { coords: { lat, lon } };
    for (let result of data.results) {
      if (result.types.includes("street_address")) {
        ret.formatted_address = result.formatted_address;
      }

      if (result.types.includes("sublocality_level_1")) {
        ret.place_id = result.place_id;
        let sublocality = result.address_components[0].short_name;
        let response = await elastic_client.search({
          index: `regions_${lang}`,
          body: {
            query: {
              multi_match: {
                query: sublocality,
                type: "phrase_prefix",
                fields: ["combined_address", "combined_address._2gram", "combined_address._3gram"],
              },
            },
            collapse: { field: "district_id" },
            _source: ["district_id", "region_id"],
          },
          size: 1,
        });

        let first = response.body.hits.hits[0]._source;
        Object.assign(ret, first);
        if (!ret.formatted_address) ret.formatted_address = result.formatted_address;
      }
    }
    return ret;
  } catch (err) {
    console.log(err);
    throw new InternalError();
  }
}
