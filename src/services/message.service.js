import * as AttachmentService from "./attachment.service.js";
import { query } from "./db.service.js";

export let create_one_trx = (trx) => create_one_impl(trx);
export let create_one = create_one_impl();

function create_one_impl(trx = { query }) {
  return async ({ sender_id, content, reply_to, chat_id, type = "text", attachments = [] } = {}) => {
    let { rows: [message] } = await trx.query(`insert into messages (content, sender_id, reply_to, chat_id, type) values($1, $2, $3, $4, $5) returning id, created_at`,
      [content, sender_id, reply_to, chat_id, type]);

    await Promise.all([
      trx.query("update chat_members set unread_count = unread_count + 1 where chat_id = $1 and user_id != $2", [chat_id, sender_id]),
      trx.query("update chats set last_message_id = $1 where id = $2", [message.id, chat_id])
    ]);

    let inserted = await Promise.all(attachments.map(AttachmentService.create_one_trx(trx)));
    await Promise.all(inserted.map(a => {
      return trx.query(`insert into message_attachments (attachment_id, message_id) values ($1, $2)`, [a.id, message.id]);
    }));

    return { content, id: message.id, created_at: message.created_at, sender_id, reply_to, chat_id, type, attachments: inserted };
  };
}

export async function get_many({ chat_id, user_id }) {
  let { rows } = await query(`
    select  m.id, m.content, m.type, m.created_at, m.chat_id,
    case when m.sender_id != $1 and m.id = rm.message_id then 1 else 0 end as is_read,
    case when m.sender_id = $1 then 1 else 0 end as is_own_message,
    greatest(0, (select count(*) from read_messages rm where rm.message_id = m.id)) as read_by_count,
    coalesce(array_agg(row_to_json(a)) filter (where a.id is not null), '{}') as attachments
    from messages m
    left join message_attachments ma on m.id = ma.message_id
    left join attachments a on a.id = ma.attachment_id
    left join read_messages rm on rm.message_id = m.id
    where chat_id = $2
    group by m.id, rm.message_id
    order by m.created_at asc;`,
    [user_id, chat_id]);

  return rows;
}
