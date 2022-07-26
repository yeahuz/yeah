import * as AttachmentService from '../services/attachment.service.js';
import * as S3Service from '../services/s3.service.js';

export async function delete_one(req, reply) {
  const { id } = req.params;
  const attachment = await AttachmentService.get_one(id);
  await S3Service.delete_one(attachment.s3_key);
  await AttachmentService.delete_one(attachment.id);

  return { status: "oke" }
}
