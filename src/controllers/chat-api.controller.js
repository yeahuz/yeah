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

export async function link_file(req, reply) {
  const { id } = req.params;
  const { file, reply_to, sender_id } = req.body;
  const result = await ChatService.link_file({
    sender_id,
    reply_to,
    file,
    chat_id: id,
  });

  reply.send(result);
  return reply;
}

export async function link_photos(req, reply) {
  const { id } = req.params;
  const { photos = [], reply_to, sender_id } = req.body;
  const result = await ChatService.link_photos({
    chat_id: id,
    photos,
    reply_to,
    sender_id,
  });

  reply.send(result);
  return reply;
}
