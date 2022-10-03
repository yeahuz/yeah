import { Notification, UserNotification } from "../models/index.js";

function create_one_impl(trx) {
  return async (payload) => Notification.query(trx).insert(payload);
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);

export async function get_count({ user_id, read = false, limit = 10 } = {}) {
  return await UserNotification.query()
    .where({ read, user_id })
    .limit(Math.min(limit, 20))
    .resultSize();
}
