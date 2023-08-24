import * as ListingService from "../services/listing.service.js";
import { transform_object } from "../utils/index.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  return await ListingService.get_one({ id, relation: { attachments: true, location: true } });
}

export async function get_many(req, reply) {
  const { status, limit = 15, cursor, direction } = transform_object(req.query, {
    status: (v) => v ? v.trim() : ""
  })
  return await ListingService.get_many({ status, limit, direction, cursor, lang: req.language });
}

export async function get_filters(req, reply) {
  const statuses = await ListingService.get_statuses({ lang: req.language });
  reply.send({ statuses });
  return reply;
}

export async function update_one(req, reply) {
  const { id } = req.params;
  const { status } = req.body;
  return await ListingService.update_one(id, { status });
}
