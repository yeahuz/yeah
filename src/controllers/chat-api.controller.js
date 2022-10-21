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

export async function link_files(req, reply) {
  const { id } = req.params;
  const { files = [], reply_to, sender_id } = req.body;
  const result = await ChatService.link_files({
    sender_id,
    reply_to,
    files,
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
