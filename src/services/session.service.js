import { Session } from "../models/index.js";

function create_one_impl(trx) {
  return async ({ user_agent, account_id }) =>
    await Session.query(trx).insert({ user_agent, account_id });
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

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);
