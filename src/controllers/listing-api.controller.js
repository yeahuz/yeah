import * as ListingService from "../services/listing.service.js";
import { transform_object } from "../utils/index.js";
import { permittedFieldsOf } from "@casl/ability/extra";

export async function get_one(req, reply) {
  let { id } = req.params;
  return await ListingService.get_one({ id, relation: { attachments: true, location: true } });
}

export async function get_many(req, reply) {
  let { status, limit = 15, cursor, direction } = transform_object(req.query, {
    status: (v) => v ? v.trim() : ""
  });
  return await ListingService.get_many({ status, limit, direction, cursor, lang: req.language });
}

export async function get_filters(req, reply) {
  let statuses = await ListingService.get_statuses({ lang: req.language });
  return { statuses }
}

export async function update_one(req, reply) {
  let { id } = req.params;
  let ability = req.ability;
  return await ListingService.update_one(ability, id, req.body);
}

export async function link_attachments(req, reply) {
  let { id } = req.params;
  let { attachments = [] } = req.body;
  let ability = req.ability;
  return await ListingService.link_attachments(ability, id, attachments)
}

export async function unlink_attachment(req, reply) {
  let { id, attachment_id } = req.params;
  let ability = req.ability;
  return await ListingService.unlink_attachment(ability, id, attachment_id);
}
