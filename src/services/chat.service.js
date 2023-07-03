import * as MessageService from "./message.service.js";
import * as UserService from "./user.service.js";
import * as PostingService from "./posting.service.js"; import { BadRequestError, InternalError } from "../utils/errors.js";
import { Chat, User } from "../models/index.js"; import objection from "objection";

const { raw, UniqueViolationError } = objection;

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();
export const update_one_trx = (trx) => update_one_impl(trx);
export const update_one = update_one_impl();

export async function get_many({ user_id }) {
  return await User.relatedQuery("chats")
    .for(user_id)
    .withGraphFetched("[latest_message.[sender, attachments], members, posting]")
    .modifyGraph("attachments", (builder) => builder.select("name"))
    .modifyGraph("members", (builder) => {
      builder.whereNot("user_id", user_id);
    });
}

export async function get_posting_chats(posting_id) {
  return await Chat.query().select("id").where({ posting_id });
}

export async function get_chat_ids({ user_id }) {
  return await User.relatedQuery("chats").select("id").for(user_id);
}

export async function get_one({ id, current_user_id }) {
  return await Chat.query()
    .findOne({ id })
    .withGraphFetched("[messages.[sender, attachments, read_by], posting.[creator]]")
    .modifyGraph("messages", (builder) =>
      builder.select(
        "content",
        "created_at",
        "type",
        raw("case when sender_id = ? then 1 else 0 end as is_own_message", [current_user_id])
      )
    );
}

export async function create_message({ chat_id, content, reply_to, sender_id, created_at, type, attachments = [] } = {}) {
  const trx = await MessageService.start_transaction();
  try {
    const message = await MessageService.create_one_trx(trx)({
      chat_id,
      content,
      reply_to,
      sender_id,
      type,
      created_at,
      attachments
    });

    await update_one_trx(trx)(chat_id, { last_message_id: message.id });

    await trx.commit();
    return message;
  } catch (err) {
    console.error({ err })
    trx.rollback();
    throw new InternalError()
  }
}

export async function create_chat({ created_by, posting_id, members = [] }) {
  const trx = await Chat.startTransaction();
  try {
    const chat = await create_one_trx(trx)({ created_by, posting_id, members });
    await trx.commit();
    return chat;
  } catch (err) {
    trx.rollback();
    if (err instanceof UniqueViolationError) {
      throw new BadRequestError({ key: "chat_exists" });
    }

    throw new InternalError();
  }
}

export async function is_chat_member(user_id, id) {
  return await Chat.relatedQuery("members").select(1).findOne({ user_id }).for(id);
}

export async function get_member_chat(user_id, chats = []) {
  return await Chat.query()
    .join("chat_members as cm", "cm.chat_id", "chats.id")
    .where("cm.user_id", user_id)
    .whereIn(
      "cm.chat_id",
      chats.map((c) => c.id)
    )
    .first();
}

function create_one_impl(trx) {
  return async ({ created_by, posting_id, members = [] }) => {
    const actual_members = await UserService.get_by_ids({ ids: members, modify: "minimum" });
    const posting = await PostingService.get_one({ id: posting_id, modify: "minimum" })
    const chat = await Chat.query(trx).insertGraph({
      created_by,
      posting,
      members: actual_members
    }, { relate: true })

    return chat
  };
}

function update_one_impl(trx) {
  return async (id, update = {}) => {
    return await Chat.query(trx).findById(id).patch(update)
  }
}
