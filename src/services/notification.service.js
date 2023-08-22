import { query } from "./db.service.js";

function create_one_impl(trx = { query }) {
  return async ({ sender_id, type, href }) => {
    let { rows } = await trx.query(`insert into notifications (sender_id, type, href) values ($1, $2, $3)`, [sender_id, type, href]);
    return rows;
  }
}

export let create_one = create_one_impl();
export let create_one_trx = (trx) => create_one_impl(trx);

export async function get_count({ user_id, read = false, limit = 10 } = {}) {
  let { rows } = await query(`select count(1)::int from user_notifications where user_id = $1 and read = $2`, [user_id, read]);
  if (rows.length) return rows[0].count;
  return 0;
}

export async function get_many({ user_id, lang = "en" } = {}) {
  let { rows } = await query(`select * from user_notifications un where un.user_id = $1`, [user_id]);
  return rows;
}
