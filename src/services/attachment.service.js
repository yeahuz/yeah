import { Attachment } from '../models/index.js'

export const create_one = create_one_impl();
export const createt_one_trx = (trx) => create_one_impl(trx);

function create_one_impl(trx) {
  return async (payload) => await Attachment.query(trx).insert(payload);
}
