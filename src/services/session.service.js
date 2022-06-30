import { Session } from "../models/index.js";
import { UAParser } from "ua-parser-js";
import { format_relations } from "../utils/index.js";

function create_one_impl(trx) {
  return async ({ ip, user_agent, user_id }) => {
    const session = await Session.query(trx).insert({ ip, user_id });
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
  return await Session.query().findById(id);
}

export async function delete_one(id) {
  return await Session.query().deleteById(id);
}

export async function validate_one(id) {
  if (!id) return;
  const session = await get_one(id);
  return session?.active;
}

export async function get_many_for(
  user_id,
  relations = ["user_agent(browser_selects)"]
) {
  if (!user_id) return [];
  return await Session.query()
    .where({ user_id })
    .withGraphJoined(format_relations(relations));
}

export async function delete_many(ids) {
  return await Session.query().delete().whereIn("id", ids);
}

export async function delete_many_for(user_id, exceptions = []) {
  return await delete_many(
    Session.query().select("id").where({ user_id }).whereNotIn("id", exceptions)
  );
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
