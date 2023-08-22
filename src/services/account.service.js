import { query } from "./db.service.js";

export async function get_by_provider_id(id) {
  let { rows } = await query(`select * from accounts where provider_account_id = $1`, [id]);
  return rows[0];
}

function link_account_impl(trx = { query }) {
  return (mod = (payload) => payload) => {
    return async (payload) => {
      let { user_id, provider, provider_account_id } = mod(payload);
      let { rowCount } = await trx.query(`insert into accounts (user_id, provider, provider_account_id) values ($1, $2, $3)`, [user_id, provider, provider_account_id]);
      return rowCount;
    }
  };
}

export let link_google_trx = (trx) => {
  return link_account_impl(trx)((payload) => Object.assign(payload, { provider: "google" }));
};

export let link_telegram_trx = (trx) => {
  return link_account_impl(trx)((payload) => Object.assign(payload, { provider: "telegram" }));
};

export let link_telegram = link_account_impl()((payload) =>
  Object.assign(payload, { provider: "telegram" })
);

export let link_google = link_account_impl()((payload) =>
  Object.assign(payload, { provider: "google" })
);
