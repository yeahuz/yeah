import * as CFService from "../services/cf.service.js";

export async function direct_upload(req, reply) {
  const { files = [], file } = req.body;
  return await CFService.get_upload_urls(files, file)
}
