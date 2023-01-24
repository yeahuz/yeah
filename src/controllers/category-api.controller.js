import * as CategoryService from "../services/category.service.js";
import { array_to_tree } from "../utils/index.js";

export async function get_many(req, reply) {
  const categories = await CategoryService.get_many({ lang: req.language });
  return array_to_tree(categories);
}

export async function create_one(req, reply) {
  const { translation, parent_id } = req.body;
  return await CategoryService.create_one({ translation, parent_id });
}

export async function delete_one(req, reply) {
  const { id } = req.params
  return await CategoryService.delete_one(id);
}
