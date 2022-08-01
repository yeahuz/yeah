import config from '../config/index.js';
import { InternalError } from '../utils/errors.js'
import { Client } from '@googlemaps/google-maps-services-js'
import { elastic_client, get_ranked_lang_indices }from './es.service.js'

const client = new Client();

export async function get_query_predictions({ q, lang = "en" }) {
  try {
    const response = await elastic_client.search({ index: `regions_${lang}`, body: {
                                      query: { multi_match: { query: q, type: "bool_prefix", fields: ["combined_address", "combined_address._2gram", "combined_address._3gram"] } },
                                      collapse: { field: "district_id" }, _source: ["formatted_address", "district_id", "region_id", "coords"] }});

    const { hits: { hits, total } } = response.body;
    return hits.map(h => h._source);
  } catch(err) {
    console.log(err);
    throw new InternalError();
  }
}

export async function geocode({ lat, lon, lang = "en" }) {
  try {
    const { data } = await client.reverseGeocode({ params: { latlng: [lat, lon], language: lang, key: config.google_maps_api_key } })
    const ret = { coords: { lat, lon } };
    for (const result of data.results) {
      if (result.types.includes("street_address")) {
        ret.formatted_address = result.formatted_address;
      }

      if (result.types.includes("sublocality_level_1")) {
        const sublocality = result.address_components[0].short_name
        const response = await elastic_client.search({ index: `regions_${lang}`, body: {
                                      query: { multi_match: { query: sublocality,  type: "phrase_prefix", fields: ["combined_address", "combined_address._2gram", "combined_address._3gram"] } },
          collapse: { field: "district_id" }, _source: ["district_id", "region_id"] }, size: 1});

        const first = response.body.hits.hits[0]._source;
        Object.assign(ret, first);
        if (!ret.formatted_address) ret.formatted_address = result.formatted_address;
      }
    }
    return ret;
  } catch(err) {
    console.log(err);
    throw new InternalError();
  }
}
