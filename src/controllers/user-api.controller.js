import * as UserService from "../services/user.service.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  const user = await UserService.get_one(id);
  reply.send(user);
  return reply;
}

export async function get_many(req, reply) {
  const { next, prev, id, username } = req.query;
  const users = await UserService.get_many({ next, prev, id, username });
  reply.send(users);
  return reply;
}
