import { BillingAccount } from "../models/index.js";

export async function get_by_user_id(user_id) {
  return await BillingAccount.query().findOne({ user_id });
}

function create_one_impl(trx) {
  return async (user_id) => {
    return await BillingAccount.query(trx).insert({ user_id });
  };
}

export const create_one = create_one_impl();
export const create_one_trx = (trx) => create_one_impl(trx);
