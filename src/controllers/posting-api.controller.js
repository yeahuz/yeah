import * as PostingService from "../services/posting.service.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  return await PostingService.get_one(id);
}

export async function get_many(req, reply) {
  const { status_id, limit = 15, after, before } = req.query;
  return await PostingService.get_many({ status_id, limit, after, before });
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
