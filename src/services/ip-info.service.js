import { IPinfoWrapper } from "node-ipinfo";
import config from "../config/index.js";

let ip_info_client = new IPinfoWrapper(config.ip_info_api_token);

export async function lookup(ip) {
  return await ip_info_client.lookupIp(ip);
}
