import { UAParser } from "ua-parser-js";
import { add_minutes_to_now } from "../utils/index.js";
import { query } from "./db.service.js";

function create_one_impl(trx = { query }) {
  return async ({ ip, user_agent, user_id, exp_time = 43200 } = {}) => {
    let expires_at = add_minutes_to_now(exp_time);
    let { rows: [session] } = await trx.query("insert into sessions (ip, user_id, expires_at) values ($1, $2, $3) returning id", [ip, user_id, expires_at]);
    let parser = new UAParser(user_agent);
    let { browser, engine, device } = parser.getResult();

    await trx.query(`insert into user_agents
          (session_id, browser_name, browser_version, engine_name, engine_version, device_type, device_model, device_vendor, raw)
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [session.id, browser.name, browser.version, engine.name, engine.version, device.type, device.model, device.vendor, user_agent]);

    return session;
  };
}

export async function get_one(id) {
  if (!id) return;
  let { rows } = await query(`select *,
      case when now() > expires_at then 1 else 0 end as expired
      from sessions where id = $1`, [id]);

  return rows[0];
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from sessions where id = $1`, [id]);
  if (rowCount == 0) {
    //TODO: session not found, throw some error or something??
    console.log("session not found");
  }

  return id;
}

export async function update_one(id, update = {}) {
  let sql = '';
  let keys = Object.keys(update);
  for (let i = 0, len = keys.length; i < len; i++) {
    sql += keys[i] + "=" + update[keys[i]];
    let is_last = i === len - 1;
    if (!is_last) sql += ", "
  }

  let { rows, rowCount } = await query(`update sessions set ${sql} where id = $1`, [id]);
  if (rowCount === 0) {
    console.log("Session not found")
    // TODO: handle 404
  }

  return rows[0];
}

export async function validate_one(id) {
  if (!id) return;
  let session = await get_one(id);
  return !session?.expired && session?.active;
}

export async function get_many({ user_id, current_sid, params = {} } = {}) {
  let sql = `select s.id, s.active, s.ip, s.expires_at,
    case
      when ua.id is null then null
    else json_build_object('id', ua.id, 'browser_name', ua.browser_name, 'browser_version', ua.browser_version, 'created_at', ua.created_at, 'raw', ua.raw) end as user_agent
    from sessions s ${params.user_agent ? `join user_agents ua on ua.session_id = s.id` : ''}
    where s.user_id = $1 and active is true order by (case when s.id = $2 then 1 end) asc, s.created_at desc`;
  let { rows } = await query(sql, [user_id, current_sid]);
  return rows;
}

export async function delete_many(ids) {
  await query(`delete from sessions where id = any($1)`, [ids]);
  return ids;
}

export async function delete_many_for(user_id, exceptions = []) {
  let { rows } = await query(`delete from sessions where user_id = $1 and id != any($2)`, [user_id, exceptions]);
  return rows[0]
}

export async function belongs_to(user_id, id) {
  let { rows } = await query(`select 1 from sessions where user_id = $1 and id = $2`, [user_id, id]);
  return rows[0];
}

export let create_one = create_one_impl();

export let create_one_trx = (trx) => create_one_impl(trx);
