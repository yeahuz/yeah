import { Message } from "../models/index.js";

export async function start_transaction() {
  return await Message.startTransaction();
}

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();

function expand(rowCount, columnCount, startAt = 1) {
  var index = startAt
  return Array(rowCount).fill(0).map(v => `(${Array(columnCount).fill(0).map(v => `$${index++}`).join(", ")})`).join(", ")
}

export function flatten_obj_array(arr, cb) {
  let flat = []
  for (let item of arr) {
    for (let key in item) {
      if (cb) cb(key, item[key], flat)
      else flat.push(item[key])
    }
  }

  return flat;
}

function create_one_impl(trx) {
  return async ({ sender_id, content, reply_to, chat_id, type, created_at, attachments = [] } = {}) => {
    let { rows } = await trx.query(`insert into messages (content, sender_id, reply_to, chat_id, type, created_at) values($1, $2, $3, $4, $5, $6) returning id, created_at`,
      [content, sender_id, reply_to, chat_id, type, new Date(created_at).toISOString()])

    let inserted = []
    if (attachments.length) {
      let { rows: inserted_attachments } = await trx.query(`
      insert into attachments (size, resource_id, name, type, url)
      values ${expand(attachments.length, 5)} returning id, resource_id, name, size, type, url
    `, flatten_obj_array(attachments))

      if (inserted_attachments.length) {
        await trx.query(`insert into message_attachments (attachment_id, message_id) values ${expand(inserted_attachments.length, 2)}`,
          flatten_obj_array(inserted_attachments, (key, value, flat) => {
            if (key === "id") flat.push(value, rows[0].id)
          }))
      }

      inserted = inserted_attachments;
    }

    return { content, id: rows[0], created_at: rows[0].created_at, sender_id, reply_to, chat_id, type, attachments: inserted }
  };
}
