import { Posting } from '../models/index.js'

function create_one_impl(trx) {
  return async (payload) => await Posting.query(trx).insert(payload);
}
