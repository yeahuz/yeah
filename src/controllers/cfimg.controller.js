import * as CFImageService from "../services/cfimg.service.js";

export async function direct_upload(req, reply) {
  const { files = [] } = req.body;
  const urls = await CFImageService.get_direct_upload_urls(files);
  reply.send(urls);
  return reply;
}
