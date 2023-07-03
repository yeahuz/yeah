import * as ChatService from "../services/chat.service.js";

export async function create_message(req, reply) {
  const { id } = req.params;
  const { content, sender_id, reply_to } = req.body;

  const message = await ChatService.create_message({
    chat_id: id,
    content,
    sender_id,
    reply_to,
  });

  reply.send(message);
  return reply;
}
