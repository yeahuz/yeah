import { Credential } from '../models/index.js'

export function get_many() {
  return {
    async for(user_id) {
      return await Credential.query().where({ user_id })
    }
  }
}
