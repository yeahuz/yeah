import * as AttachmentService from "../services/attachment.service.js";

export async function create_one(req, reply) {
  return await AttachmentService.create_one(req.body);
}
