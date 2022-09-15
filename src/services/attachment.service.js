import { Attachment, Attachment_v2 } from "../models/index.js";

export const create_one = create_one_impl();
export const create_one_v2 = create_one_impl_v2();
export const createt_one_trx = (trx) => create_one_impl(trx);
export const createt_one_trx_v2 = (trx) => create_one_impl_v2(trx);

function create_one_impl(trx) {
  return async (payload) => await Attachment.query(trx).insert(payload);
}

function create_one_impl_v2(trx) {
  return async (payload) => await Attachment_v2.query(trx).insert(payload);
}

export async function delete_one(id) {
  return await Attachment.query().deleteById(id);
}
export async function delete_by_resource_id(resource_id) {
  return await Attachment_v2.query().findOne({ resource_id }).delete();
}

export async function get_one(id) {
  return await Attachment.query().findById(id);
}

export async function get_by_resource_id(resource_id, service = "CF_IMAGES") {
  return await Attachment_v2.query().findOne({ resource_id, service });
}
