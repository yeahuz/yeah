import { Credential } from "../models/index.js";

export function get_many() {
  return {
    async for(user_id) {
      return await Credential.query().where({ user_id });
    },
  };
}

export async function get_one(credential_id) {
  return await Credential.query().findOne({ credential_id });
}

export async function create_one(credential) {
  return await Credential.query().insert(credential);
}

export async function delete_one(id) {
  return await Credential.query().deleteById(id);
}

export async function exists_for(user_id) {
  const credentials = await Credential.query()
    .select(1)
    .whereExists(Credential.query().select(1).where({ user_id }).limit(1));
  return !!credentials.length;
}

export async function belongs_to(user_id, id) {
  return await Credential.query().findOne({ user_id, id });
}

export function delete_many() {
  return {
    async for(user_id) {
      return await Credential.query().where({ user_id }).delete();
    },
  };
}
