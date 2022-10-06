import { ExternalClient } from "../models/index.js";

export async function get_by_token(token) {
  return await ExternalClient.query().findOne({ token });
}
