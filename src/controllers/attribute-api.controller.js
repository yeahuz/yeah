import * as AttributeService from "../services/attribute.service.js";

export async function get_many(req, reply) {
  const { format = "tree" } = req.query;
  return await AttributeService.get_many({ lang: req.language, format });
}

export async function create_one(req, reply) {
  const { translation, parent_id, key = "default", category_set, type } = req.body;
  return await AttributeService.create_one({ translation, parent_id, key, category_set, type });
}

export async function get_translations(req, reply) {
  const { id } = req.params;
  return await AttributeService.get_translations(id);
}

export async function delete_one(req, reply) {
  const { id } = req.params
  return await AttributeService.delete_one(id);
}
