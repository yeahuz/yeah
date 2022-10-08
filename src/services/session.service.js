import { Session } from "../models/index.js";
import { UAParser } from "ua-parser-js";
import { add_minutes_to_now, format_relations } from "../utils/index.js";
import pkg from "objection";

const { raw } = pkg;

function create_one_impl(trx) {
  return async ({ ip, user_agent, user_id, exp_time = 43200 } = {}) => {
    const expires_at = add_minutes_to_now(exp_time);
    const session = await Session.query(trx).insert({ ip, user_id, expires_at });
    const parser = new UAParser(user_agent);
    const { browser, engine, device } = parser.getResult();
    await session.$relatedQuery("user_agent", trx).insert({
      browser_name: browser.name,
      browser_version: browser.version,
      engine_name: engine.name,
      engine_version: engine.version,
      device_type: device.type,
      device_model: device.model,
      device_vendor: device.vendor,
    });
    return session;
  };
}

export async function get_one(id) {
  if (!id) return;
  return await Session.query()
    .select("*")
    .select(raw("case when now() > expires_at then 1 else 0 end as expired"))
    .findById(id);
}

export async function delete_one(id) {
  return await Session.query().deleteById(id);
}

export async function validate_one(id) {
  if (!id) return;
  const session = await get_one(id);
  return !session.expired && session?.active;
}

export function get_many(query, relations = ["user_agent(browser_selects)"]) {
  return {
    async for(user_id, current_sid) {
      return await Session.query()
        .where({ user_id })
        .withGraphFetched(format_relations(relations))
        .orderByRaw(`(case when id = ? then 1 end) asc, created_at desc`, [current_sid]);
    },
  };
}

export async function delete_many(ids) {
  return await Session.query().delete().whereIn("id", ids);
}

export async function delete_many_for(user_id, exceptions = []) {
  return await delete_many(
    Session.query().select("id").where({ user_id }).whereNotIn("id", exceptions)
  );
}

export async function belongs_to(user_id, id) {
  return await Session.query().findOne({ user_id, id });
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
