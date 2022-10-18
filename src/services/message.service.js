import { Message } from "../models/index.js";

function create_one_impl(trx) {
  return async ({ sender_id, content, reply_to, chat_id } = {}) => {
    return await Message.query(trx).insert({ content, sender_id, reply_to, chat_id });
  };
}

export async function start_transaction() {
  return await Message.startTransaction();
}

export const create_one_trx = (trx) => create_one_trx(trx);
export const create_one = create_one_impl();
