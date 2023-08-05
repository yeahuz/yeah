import * as MessageService from "./message.service.js";
import * as UserService from "./user.service.js";
import * as PostingService from "./posting.service.js";
import { BadRequestError, InternalError } from "../utils/errors.js";
import { Chat, User } from "../models/index.js";
import objection from "objection";
import { commit_trx, rollback_trx, start_trx } from "./db.service.js";

const { raw, UniqueViolationError } = objection;

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();
export const update_one_trx = (trx) => update_one_impl(trx);
export const update_one = update_one_impl();

export async function get_many({ user_id }) {
  const knex = Chat.knex();
  const { rows } = await knex.raw(`
    select 
    c.id, c.created_by, c.url,
    cm.last_read_message_id,
    jsonb_build_object(
      'id', p.id,
      'title', p.title,
      'cover_url', p.cover_url,
      'url', p.url
    ) as posting,
    jsonb_build_object(
      'type', m.type,
      'content', m.content,
      'attachments', coalesce(jsonb_agg(jsonb_build_object('id', a.id)) filter (where a.id is not null), '[]'::jsonb),
      'created_at', m.created_at,
      'sender_id', m.sender_id
    ) as latest_message,
    jsonb_agg(distinct jsonb_build_object('name', u.name)) as members
    from chats c
    join chat_members cm on cm.chat_id = c.id and cm.user_id = ?
    join users u on u.id = cm.user_id
    join messages m on m.chat_id = c.id
    join read_messages rm on rm.message_id = m.id and rm.user_id = ?
    left join message_attachments ma on ma.message_id = c.last_message_id
    left join attachments a on a.id = ma.attachment_id
    join postings p on p.id = c.posting_id
    group by c.id, p.id, m.type, m.content, m.created_at, m.sender_id, cm.unread_count, cm.last_read_message_id
  `, [user_id, user_id])

  return rows
}

export async function get_posting_chats(posting_id) {
  return await Chat.query().select("id").where({ posting_id });
}

export async function get_chat_ids({ user_id }) {
  return await User.relatedQuery("chats").select("id").for(user_id);
}

export async function get_one({ id, current_user_id }) {
  const knex = Chat.knex();

  const { rows } = await knex.raw(`
    select sub.id,
    sub.posting,
    jsonb_agg(jsonb_build_object(
      'id', sub.msg_id,
      'read_by', sub.read_by,
      'content', sub.content,
      'type', sub.type,
      'created_at', sub.msg_created_at,
      'attachments', sub.attachments,
      'is_own_message', sub.is_own_message,
      'chat_id', sub.id,
      'is_read', sub.is_read
    )) as messages from (
      select c.id,
      m.content,
      m.type,
      m.created_at as msg_created_at,
      m.id as msg_id,
      case when m.sender_id != ? and m.id >= cm.last_read_message_id then 1 else 0 end as is_read,
      case when sender_id = ? then 1 else 0 end as is_own_message,
      coalesce(jsonb_agg(jsonb_build_object('name', u.name)) filter (where u.id is not null), '[]'::jsonb) as read_by,
      coalesce(jsonb_agg(jsonb_build_object('id', a.id)) filter (where a.id is not null), '[]'::jsonb) as attachments,
      jsonb_build_object(
        'id', p.id,
        'title', p.title,
        'url', p.url,
        'cover_url', p.cover_url,
        'creator', jsonb_build_object('profile_url', u2.profile_url)
      ) as posting
      from chats c
      join chat_members cm on cm.chat_id = c.id and cm.user_id = ?
      join messages m on m.chat_id = c.id
      join postings p on p.id = c.posting_id
      join users u2 on u2.id = p.created_by
      left join read_messages rm on rm.message_id = m.id
      left join users u on u.id = rm.user_id
      left join message_attachments ma on m.id = ma.message_id
      left join attachments a on a.id = ma.attachment_id
      where c.id = ?
      group by c.id, m.content, m.type, m.created_at, p.title, p.id, u2.profile_url, m.sender_id, m.id, cm.last_read_message_id
      order by m.created_at asc
    ) sub
    group by sub.id, sub.posting
  `, [current_user_id, current_user_id, current_user_id, id])

  return rows[0]
}

export async function create_message({ chat_id, content, reply_to, sender_id, created_at, type, attachments = [] } = {}) {
  let trx = await start_trx()
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

    //await update_one_trx(trx)(chat_id, { last_message_id: message.id });
    //await Chat.queyr("members").for(chat_id).whereNot({ user_id: sender_id }).increment("unread_count", 1)

    await commit_trx(trx)
    return message;
  } catch (err) {
    console.error({ err })
    rollback_trx(trx)
    //trx.rollback();
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

export async function read_message({ id, chat_id, user_id }) {
  let knex = Chat.knex();
  await knex.transaction((trx) => {
    return Promise.all([
      knex.raw(`update chat_members set last_read_message_id = ? where chat_id = ? and user_id = ?`, [id, chat_id, user_id]).transacting(trx),
      knex.raw(`insert into read_messages (message_id, user_id) values (?, ?)`, [id, user_id]).transacting(trx)
    ])
  });
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
