import { query } from "./db.service.js";

export let create_one = create_one_impl();
export let create_one_trx = (trx) => create_one_impl(trx);

export async function delete_one(id) {
  let { rowCount } = await query(`delete from attachments where id = $1`, [id]);
  if (rowCount === 0) {
    //TODO: handle
  }

  return id;
}
export async function delete_by_resource_id(resource_id) {
  let { rowCount } = await query(`delete from attachments where resource_id = $1`, [resource_id]);
  if (rowCount === 0) {
    //TODO: handle
  }

  return resource_id;
}

export async function get_by_resource_id(resource_id, service = "CF_IMAGES") {
  let { rows } = await query(`select * from attachments where service = $1 and resource_id = $2`, [service, resource_id]);
  return rows;
}

function create_one_impl(trx = { query }) {
  return async ({ size, resource_id, name, type, url } = {}) => {
    let { rows } = await trx.query(`insert into attachments (size, resource_id, name, type, url) values ($1, $2, $3, $4, $5)`, [size, resource_id, name, type, url]);
    return rows[0];
  };
}
