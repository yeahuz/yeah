import * as MessageService from "./message.service.js";
import * as AttachmentService from "./attachment.service.js";
import { InternalError } from "../utils/errors.js";
import { Chat, User } from "../models/index.js";
import objection from "objection";

const { raw } = objection;

export async function get_many({ user_id }) {
  return await User.relatedQuery("chats")
    .for(user_id)
    .withGraphFetched("[latest_message.[sender], members, posting]")
    .modifyGraph("members", (builder) => {
      builder.whereNot("user_id", user_id);
    });
}

export async function get_one({ id, current_user_id }) {
  return await Chat.query()
    .findOne({ id })
    .withGraphFetched("[messages.[sender, attachments], posting]")
    .modifyGraph("messages", (builder) =>
      builder.select(
        "content",
        "created_at",
        "type",
        raw("case when sender_id = ? then 1 else 0 end as is_own_message", [current_user_id])
      )
    );
}

export async function create_message({ chat_id, content, reply_to, sender_id }) {
  return await MessageService.create_one({ chat_id, content, reply_to, sender_id, type: "text" });
}

export async function link_photos({ chat_id, photos = [], sender_id, reply_to }) {
  const trx = await MessageService.start_transaction();
  try {
    const message = await MessageService.create_one_trx(trx)({
      chat_id,
      sender_id,
      reply_to,
      type: "photo",
    });
    const attachments = await Promise.all(
      photos.map((resource_id) => AttachmentService.create_one_trx(trx)({ resource_id }))
    );
    await message.$relatedQuery("attachments", trx).relate(attachments);
    await trx.commit();
  } catch (err) {
    console.log({ err });
    trx.rollback();
    throw new InternalError();
  }
}

export async function link_files({ chat_id, files = [], sender_id, reply_to }) {
  const trx = await MessageService.start_transaction();
  try {
    const message = await MessageService.create_one_trx(trx)({
      chat_id,
      sender_id,
      reply_to,
      type: "file",
    });
    const attachments = await Promise.all(
      files.map((resource_id) =>
        AttachmentService.create_one_trx(trx)({ resource_id, service: "CF_R2" })
      )
    );
    await message.$relatedQuery("attachments", trx).relate(attachments);
    await trx.commit();
    return { message, attachments };
  } catch (err) {
    console.log({ err });
    trx.rollback();
    throw new InternalError();
  }
}

export async function is_chat_member(user_id, id) {
  const chat = await Chat.query().findOne({ id });
  return await chat?.$relatedQuery("members").findOne({ user_id });
}

function create_one_impl(trx) {
  return async ({ created_by, posting_id }) =>
    await Chat.query(trx).insert({ created_by, posting_id });
}

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();
