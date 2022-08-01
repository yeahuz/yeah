import config from '../config/index.js';
import { Client } from '@elastic/elasticsearch';

export const elastic_client = new Client({
  node: 'http://localhost:9200',
});

export function get_ranked_lang_indices(index_name, languages) {
  const ranked_indices = []

  for (let i = languages.length - 1; i >= 0; i--) {
    ranked_indices.push({
      [`${index_name}${languages[i]}`]: languages.length - i
    })
  }

  return ranked_indices;
}
