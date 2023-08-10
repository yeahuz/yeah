import * as ChatService from "../services/chat.service.js";

export async function create_message(req, reply) {
  let user = req.user;
  let { id } = req.params;
  let { content, reply_to, attachments = [], type } = req.body;
  let message = await ChatService.create_message({
    chat_id: id,
    content,
    reply_to,
    sender_id: user.id,
    attachments,
    type,
  });

  return message;
}

export async function update_message(req, reply) {
  let user = req.user;
  let { id, message_id } = req.params;
  let { _action } = req.body;

  let result;
  switch (_action) {
    case "read": {
      result = await ChatService.read_message({ id: message_id, chat_id: id, user_id: user.id });
    } break;
    default:
      break;
  }

  return result;
}
