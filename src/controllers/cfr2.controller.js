import * as CFR2Service from "../services/cfr2.service.js";

export async function direct_upload(req, reply) {
  const { files = [] } = req.body;
  const urls = await CFR2Service.get_direct_upload_urls(files);
  reply.send(urls);
  return reply;
}

export async function update_bucket_cors(req, reply) {
  const result = await CFR2Service.update_bucket_cors();
  reply.send(result);
  return reply;
}

export async function get_bucket_cors(req, reply) {
  const result = await CFR2Service.get_bucket_cors();
  reply.send(result);
  return reply;
}
