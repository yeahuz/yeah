import { query } from "./db.service.js";

export async function get_many({ user_id } = {}) {
  let { rows } = await query(`select * from credentials where user_id = $1`, [user_id]);
  return rows;
}

export async function get_one(credential_id) {
  let { rows } = await query(`select * from credentials where credential_id = $1`, [credential_id]);
  return rows[0];
}

export async function create_one({ public_key, counter, credential_id, transports, title, user_id }) {
  let { rows } = await query(`insert into credentials
    (public_key, counter, credential_id, transports, title, user_id)
    values ($1, $2, $3, $4, $5, $6)`, [public_key, counter, credential_id, transports, title, user_id]);

  return rows[0];
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from credentials where id = $1`, [id]);
  if (rowCount === 0) {
    //TODO:
    console.log("Could not find credential");
  }

  return id;
}

export async function exists_for(user_id) {
  let { rows } = await query(`select 1 from credentials where user_id = $1 limit 1`, [user_id]);
  return rows.length > 0;
}

export async function belongs_to(user_id, id) {
  let { rows } = await query(`select 1 from credentials where user_id = $1 and id = $2`, [user_id, id]);
  return rows[0];
}

export async function delete_many(user_id) {
  let { rowCount } = await query(`delete from credentials where user_id = $1`, [user_id]);
  return rowCount;
}
