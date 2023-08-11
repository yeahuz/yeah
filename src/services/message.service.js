import { Message } from "../models/index.js";

export async function start_transaction() {
  return await Message.startTransaction();
}

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();

function create_one_impl(trx) {
  return async ({ sender_id, content, reply_to, chat_id, type = "text", created_at, attachments = [] } = {}) => {
    let { rows: [message] } = await trx.query(`insert into messages (content, sender_id, reply_to, chat_id, type) values($1, $2, $3, $4, $5) returning id, created_at`,
                                              [content, sender_id, reply_to, chat_id, type]);

    await Promise.all([
      trx.query("update chat_members set unread_count = unread_count + 1 where chat_id = $1 and user_id != $2", [chat_id, sender_id]),
      trx.query("update chats set last_message_id = $1 where id = $2", [message.id, chat_id])
    ]);

    let inserted = await Promise.all(attachments.map(a => {
      return trx.query(`
        insert into attachments (size, resource_id, name, type, url)
        values ($1, $2, $3, $4, $5) returning id, resource_id, name, size, type, url
      `, [a.size, a.resource_id, a.name, a.type, a.url]).then((result) => result.rows[0]);
    }));

    await Promise.all(inserted.map(a => {
      return trx.query(`insert into message_attachments (attachment_id, message_id) values ($1, $2)`, [a.id, message.id]);
    }));

    return { content, id: message.id, created_at: message.created_at, sender_id, reply_to, chat_id, type, attachments: inserted };
  };
}
