import * as GeoService from '../services/geo.service.js';
import { option } from '../utils/index.js'

export async function get_predictions(req, reply) {
  const t = req.i18n.t;
  const{ q } = req.query;
  const [predictions = [], err] = await option(GeoService.get_query_predictions({ q, lang: req.language }));

  if (err) return err.build(t)

  return predictions;
}

export async function geocode(req, reply) {
  const t = req.i18n.t;
  const { lat, lon } = req.query;
  const [result, err] = await option(GeoService.geocode({ lat, lon, lang: req.language }));
  if (err) return err.build(t)
  return result;
}
