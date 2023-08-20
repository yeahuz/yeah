import { Session } from "../models/index.js";
import { UAParser } from "ua-parser-js";
import { add_minutes_to_now, format_relations } from "../utils/index.js";
import { query } from "./db.service.js";
import pkg from "objection";

let { raw } = pkg;

function create_one_impl(trx) {
  return async ({ ip, user_agent, user_id, exp_time = 43200 } = {}) => {
    let expires_at = add_minutes_to_now(exp_time);
    let session = await Session.query(trx).insert({ ip, user_id, expires_at });
    let parser = new UAParser(user_agent);
    let { browser, engine, device } = parser.getResult();
    await session.$relatedQuery("user_agent", trx).insert({
      browser_name: browser.name,
      browser_version: browser.version,
      engine_name: engine.name,
      engine_version: engine.version,
      device_type: device.type,
      device_model: device.model,
      device_vendor: device.vendor,
      raw: user_agent,
    });
    return session;
  };
}

export async function get_one(id) {
  if (!id) return;
  let { rows } = query(`select *,
      case when now() > expires_at then 1 else 0 end as expired
      from sessions where id = $1`, [id]);

  return rows[0];
}

export async function delete_one(id) {
  let { rowCount } = await query(`delete from sessions where id = $1`, [id]);
  if (rowCount == 0) {
    //TODO: session not found, throw some error or something??
    console.log("session not found")
  }

  return id;
}

export async function update_one(id, update = {}) {
  return await Session.query().findById(id).patch(update)
}

export async function validate_one(id) {
  if (!id) return;
  let session = await get_one(id);
  return !session?.expired && session?.active;
}

export function get_many(query, relations = ["user_agent(browser_selects)"]) {
  return {
    async for(user_id, current_sid) {
      return await Session.query()
        .where({ user_id, active: true })
        .withGraphFetched(format_relations(relations))
        .orderByRaw(`(case when id = ? then 1 end) asc, created_at desc`, [current_sid]);
    },
  };
}

export async function delete_many(ids) {
  await query(`delete from sessions where id = any($1)`, [ids]);
  return ids;
}

export async function delete_many_for(user_id, exceptions = []) {
  return await delete_many(
    Session.query().select("id").where({ user_id }).whereNotIn("id", exceptions)
  );
}

export async function belongs_to(user_id, id) {
  let { rows } = await query(`select 1 from where user_id = $1 and id = $2`, [user_id, id]);
  return rows;
}

export let create_one = create_one_impl();

export let create_one_trx = (trx) => create_one_impl(trx);
