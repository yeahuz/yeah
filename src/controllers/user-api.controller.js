import * as UserService from "../services/user.service.js";
import * as ChatService from "../services/chat.service.js";

export async function get_one(req, reply) {
  const { id } = req.params;
  const user = await UserService.get_one(id);
  reply.send(user);
  return reply;
}

export async function get_many(req, reply) {
  const { id, username, limit = 15, excludes, after, before, email, phone } = req.query;
  const users = await UserService.get_many({
    id,
    username,
    limit,
    excludes,
    after,
    before,
    email,
    phone,
  });
  reply.send(users);
  return reply;
}

export async function delete_one(req, reply) {
  const { id } = req.params;
  const result = await UserService.delete_one(id);
  reply.send(result);
  return reply;
}

export async function get_chats(req, reply) {
  const { id } = req.params;
  const chats = await ChatService.get_chat_ids({ user_id: id });
  reply.send(chats);
  return reply;
}
