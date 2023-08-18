import * as MessageService from "./message.service.js";
import * as UserService from "./user.service.js";
import * as PostingService from "./posting.service.js";
import { BadRequestError, InternalError } from "../utils/errors.js";
import { Chat, User } from "../models/index.js";
import objection from "objection";
import { commit_trx, query, rollback_trx, start_trx } from "./db.service.js";
import { option } from "../utils/index.js";
import { join } from "path";
import config from "../config/index.js";

const { UniqueViolationError } = objection;

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();
export const update_one_trx = (trx) => update_one_impl(trx);
export const update_one = update_one_impl();

export async function get_many({ user_id }) {
  let { rows } = await query(`
    select 
    c.id, c.created_by, c.url,
    cm.unread_count,
    json_build_object(
      'id', p.id,
      'title', p.title,
      'cover_url', p.cover_url,
      'url', p.url,
      'creator', json_build_object('name', u.name)
    ) as posting,
    case
      when m.type is null then null
      else json_build_object(
        'type', m.type,
        'content', m.content,
        'attachments', coalesce(json_agg(json_build_object('id', a.id, 'name', a.name)) filter (where a.id is not null), '[]'::json),
        'created_at', m.created_at,
        'sender_id', m.sender_id,
        'is_own', case when m.sender_id = $1 then 1 else 0 end
      ) end as latest_message
    from chats c
    join chat_members cm on cm.chat_id = c.id and cm.user_id = $1
    left join messages m on m.chat_id = c.id and m.id = c.last_message_id
    left join message_attachments ma on ma.message_id = c.last_message_id
    left join attachments a on a.id = ma.attachment_id
    join postings p on p.id = c.posting_id
    join users u on u.id = p.created_by
    group by c.id, p.id, m.type, m.content, m.created_at, m.sender_id, cm.unread_count, u.name
  `, [user_id]);

  return rows;
}

export async function get_posting_chats(posting_id) {
  return await Chat.query().select("id").where({ posting_id });
}

export async function get_chat_ids({ user_id }) {
  return await User.relatedQuery("chats").select("id").for(user_id);
}

export async function get_one({ id }) {
  let { rows } = await query(`
    select c.id,
    json_build_object(
    'id', p.id,
    'title', p.title,
    'url', p.url,
    'cover_url', p.cover_url,
    'creator', json_build_object('profile_url', u.profile_url, 'username', u.username)
    ) as posting
    from chats c
    join postings p on p.id = c.posting_id
    join users u on u.id = p.created_by
    where c.id = $1
    group by p.*, c.id, p.id, u.profile_url, u.username
  `, [id])

  if (rows.length) return rows[0];
}

export async function create_message({ chat_id, content, reply_to, sender_id, type, attachments = [] } = {}) {
  let trx = await start_trx();
  try {
    const message = await MessageService.create_one_trx(trx)({
      chat_id,
      content,
      reply_to,
      sender_id,
      type,
      attachments
    });

    await commit_trx(trx);
    return message;
  } catch (err) {
    console.error({ err });
    rollback_trx(trx);
    throw new InternalError();
  }
}

export async function create_chat({ created_by, posting_id, members = [] }) {
  let trx = await start_trx();
  try {
    let { rows: [chat] } = await trx.query("insert into chats (created_by, posting_id) values ($1, $2) returning id", [created_by, posting_id]);
    let url = join(config.origin, "chats", String(chat.id));
    await trx.query("update chats set url = $1 where id = $2", [url, chat.id])
    await Promise.all(members.map(m => trx.query("insert into chat_members (chat_id, user_id) values ($1, $2)", [chat.id, m])))
    await commit_trx(trx)

    let { rows: [posting] } = await query(`
      select p.id, cover_url, url, title, u.name as creator
      from postings p
      join users u on u.id = p.created_by
      where p.id = $1`,
      [posting_id]);

    chat.url = url;
    chat.posting = posting;
    chat.members = members;
    return chat;
  } catch (err) {
    console.error({ err });
    rollback_trx(trx);
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
  let trx = await start_trx();
  try {
    let [_, err] = await option(trx.query("insert into read_messages (message_id, user_id) values ($1, $2)", [id, user_id]));
    if (!err) await trx.query("update chat_members set unread_count = unread_count - 1 where chat_id = $1 and user_id = $2", [chat_id, user_id]);
    await commit_trx(trx);
  } catch (err) {
    console.error({ err });
    rollback_trx(trx);
    throw new InternalError();
  }
}

function create_one_impl(trx) {
  return async ({ created_by, posting_id, members = [] }) => {
    const actual_members = await UserService.get_by_ids({ ids: members, modify: "minimum" });
    const posting = await PostingService.get_one({ id: posting_id, modify: "minimum" });
    const chat = await Chat.query(trx).insertGraph({
      created_by,
      posting,
      members: actual_members
    }, { relate: true });

    return chat;
  };
}

function update_one_impl(trx) {
  return async (id, update = {}) => {
    return await Chat.query(trx).findById(id).patch(update);
  };
}
