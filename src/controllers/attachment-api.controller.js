import * as AttachmentService from "../services/attachment.service.js";

export async function create_one(req, reply) {
  let user = req.user;
  return await AttachmentService.create_one(Object.assign(req.body, { created_by: user.id }));
}
