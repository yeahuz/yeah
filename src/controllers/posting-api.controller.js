import * as PostingService from "../services/posting.service.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  const posting = await PostingService.get_one(id);
  reply.send(posting);
  return reply;
}

export async function get_many(req, reply) {
  const { status_id, limit = 15, after, before } = req.query;
  const postings = await PostingService.get_many({ status_id, limit, after, before });
  reply.send(postings);
  return reply;
}

export async function get_filters(req, reply) {
  const statuses = await PostingService.get_statuses({ lang: req.language });
  reply.send({ statuses });
  return reply;
}
