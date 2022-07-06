import { Credential } from '../models/index.js'

export function get_many() {
  return {
    async for(user_id) {
      return await Credential.query().where({ user_id })
    }
  }
}

export async function get_one(credential_id) {
  return await Credential.query().findOne({ credential_id })
}


export async function create_one(credential) {
  return await Credential.query().insert(credential);
}

export async function delete_one(id) {
  return await Credential.query().deleteById(id);
}
