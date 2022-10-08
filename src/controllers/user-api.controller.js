import * as UserService from "../services/user.service.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  const user = await UserService.get_one(id);
  reply.send(user);
  return reply;
}
