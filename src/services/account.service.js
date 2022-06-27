import { Account } from "../models/index.js";

export async function get_by_provider_id(id) {
  return await Account.query().findOne({ provider_account_id: id });
}

function link_account_impl(trx) {
  return (modifierFn = (payload) => payload) => {
    return async (payload) => await Account.query(trx).insert(modifierFn(payload));
  };
}

export const link_google_trx = (trx) => {
  return link_account_impl(trx)((payload) => Object.assign(payload, { provider: "google" }));
};

export const link_telegram_trx = (trx) => {
  return link_account_impl(trx)((payload) => Object.assign(payload, { provider: "telegram" }));
};

export const link_telegram = link_account_impl()((payload) =>
  Object.assign(payload, { provider: "telegram" })
);

export const link_google = link_account_impl()((payload) =>
  Object.assign(payload, { provider: "google" })
);
