import { Notification } from "../models/index.js";

function create_one_impl(trx) {
  return async (payload) => Notification.query().insert(payload);
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
