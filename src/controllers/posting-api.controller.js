import * as PostingService from "../services/posting.service.js";
import { transform_object } from "../utils/index.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  return await PostingService.get_one({ id, relation: { attachments: true, location: true } });
}

export async function get_many(req, reply) {
  const { status_id, limit = 15, cursor, direction } = transform_object(req.query, {
    status_id: (v) => v ? v.trim() : ""
  })
  return await PostingService.get_many({ status_id, limit, direction, cursor, lang: req.language });
}

export async function get_filters(req, reply) {
  const statuses = await PostingService.get_statuses({ lang: req.language });
  reply.send({ statuses });
  return reply;
}

export async function update_one(req, reply) {
  const { id } = req.params;
  const { status_id } = req.body;
  return await PostingService.update_one(id, { status_id });
}
