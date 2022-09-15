import * as CFImageService from "../services/cfimg.service.js";

export async function direct_upload(req, reply) {
  const { count = 1 } = req.query;
  const urls = await CFImageService.get_direct_upload_urls(Math.min(parseInt(count, 10), 25));
  reply.send(urls);
  return reply;
}
