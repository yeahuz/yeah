import { query } from "./db.service.js";

export async function get_by_user_id(user_id) {
  let { rows } = await query(`select * from billing_accounts where user_id = $1`, [user_id]);
  return rows[0];
}

function create_one_impl(trx = { query }) {
  return async (user_id) => {
    let { rows } = await trx.query(`insert into billing_accounts (user_id) values ($1)`, [user_id]);
    return rows[0];
  };
}

export const create_one = create_one_impl();
export const create_one_trx = (trx) => create_one_impl(trx);
