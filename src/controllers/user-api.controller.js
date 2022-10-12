import * as UserService from "../services/user.service.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  const user = await UserService.get_one(id);
  reply.send(user);
  return reply;
}

export async function get_many(req, reply) {
  const { next, prev, id, username, limit = 15 } = req.query;
  const users = await UserService.get_many({ next, prev, id, username, limit });
  reply.send(users);
  return reply;
}

export async function delete_one(req, reply) {
  const { id } = req.params;
  const result = await UserService.delete_one(id);
  reply.send(result);
  return reply;
}
