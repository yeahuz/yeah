import * as MessageService from "./message.service.js";
import { AuthorizationError, BadRequestError, InternalError } from "../utils/errors.js";
import { commit_trx, query, rollback_trx, start_trx } from "./db.service.js";
import { option } from "../utils/index.js";
import { hashids } from "../utils/hashids.js";
import config from "../config/index.js";

export let create_one_trx = (trx) => create_one_impl(trx);
export let create_one = create_one_impl();
export let update_one_trx = (trx) => update_one_impl(trx);
export let update_one = update_one_impl();

export async function get_many({ user_id }) {
  let { rows } = await query(`
    select 
    c.id, c.created_by, c.url,
    cm.unread_count,
    cm.last_read_message_id,
    json_build_object(
      'id', l.id,
      'title', l.title,
      'cover_url', a2.url,
      'url', l.url,
      'creator', u.name
    ) as listing,
    case
      when m.type is null then null
      else json_build_object(
        'type', m.type,
        'content', m.content,
        'attachments', coalesce(json_agg(json_build_object('id', a.id, 'name', a.name)) filter (where a.id is not null), '{}'),
        'created_at', m.created_at,
        'sender_id', m.sender_id,
        'is_own', case when m.sender_id = $1 then 1 else 0 end
      ) end as latest_message
    from chats c
    join chat_members cm on cm.chat_id = c.id and cm.user_id = $1
    left join messages m on m.chat_id = c.id and m.id = c.last_message_id
    left join message_attachments ma on ma.message_id = c.last_message_id
    left join attachments a on a.id = ma.attachment_id
    join listings l on l.id = c.listing_id
    left join attachments a2 on a2.id = l.cover_id
    join users u on u.id = l.created_by
    group by c.id, l.id, m.type, m.content, m.created_at, m.sender_id, cm.unread_count, u.name, cm.last_read_message_id, a2.url
  `, [user_id]);

  return rows;
}

export async function get_listing_chats(listing_id) {
  let { rows } = await query(`select id from chats where listing_id = $1`, [listing_id]);
  return rows;
}

export async function get_chat_ids({ user_id }) {
  let { rows } = await query(`select c.id from chats c join chat_members cm on cm.chat_id = c.id and cm.user_id = $1`, [user_id]);
  return rows;
}

export async function get_one({ id, user_id }) {
  if (!is_chat_member(user_id, id)) {
    throw new AuthorizationError();
  }
  let { rows } = await query(`
    select c.id,
    json_build_object(
    'id', l.id,
    'title', l.title,
    'url', l.url,
    'cover_url', a.url,
    'creator', json_build_object('profile_url', u.profile_url, 'username', u.username)) as listing
    from chats c
    join listings l on l.id = c.listing_id
    join users u on u.id = l.created_by
    left join attachments a on a.id = l.cover_id
    where c.id = $1
    group by l.*, c.id, l.id, u.profile_url, u.username
  `, [id])

  if (rows.length) return rows[0];
}

export async function create_message({ chat_id, content, reply_to, sender_id, type, attachments = [] } = {}) {
  if (!is_chat_member(sender_id, chat_id)) {
    throw new AuthorizationError();
  }

  let trx = await start_trx();
  try {
    let message = await MessageService.create_one_trx(trx)({
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

export async function create_chat({ created_by, listing_id, members = [] }) {
  let trx = await start_trx();
  try {
    let { rows: [chat] } = await trx.query("insert into chats (created_by, listing_id) values ($1, $2) returning id", [created_by, listing_id]);
    let url = new URL(`chats/${hashids.encode([chat.id])}`, config.origin).href;
    await trx.query("update chats set url = $1 where id = $2", [url, chat.id])
    await Promise.all(members.map(m => trx.query("insert into chat_members (chat_id, user_id) values ($1, $2)", [chat.id, m])))
    await commit_trx(trx)

    let { rows: [listing] } = await query(`
      select l.id, a.url as cover_url, url, title, u.name as creator
      from listings l
      join users u on u.id = l.created_by
      left join attachments a on a.id = l.cover_id
      where l.id = $1`,
      [listing_id]);

    chat.url = url;
    chat.listing = listing;
    chat.members = members;
    return chat;
  } catch (err) {
    console.error({ err });
    rollback_trx(trx);
    //TODO: handle unique vialation err
    // if (err instanceof UniqueViolationError) {
    //   throw new BadRequestError({ key: "chat_exists" });
    // }
    throw new InternalError();
  }
}

export async function is_chat_member(user_id, id) {
  let { rows } = await query(`select 1 from chat_members where chat_id = $1 and user_id = $2`, [id, user_id]);
  return rows.length > 0;
}

export async function get_members(id) {
  let { rows } = await query(`select u.id from chat_members cm join users u on u.id = cm.user_id where chat_id = $1`, [id]);
  return rows;
}

export async function get_member_chat(user_id, chats = []) {
  let { rows } = await query(`select c.* from chats c join chat_members cm on cm.chat_id = c.id and cm.user_id = $1`, [user_id]);
  return rows[0];
  // return await Chat.query()
  //   .join("chat_members as cm", "cm.chat_id", "chats.id")
  //   .where("cm.user_id", user_id)
  //   .whereIn(
  //     "cm.chat_id",
  //     chats.map((c) => c.id)
  //   )
  //   .first();
}

export async function read_message({ id, chat_id, user_id }) {
  if (!is_chat_member(user_id, chat_id)) {
    throw new AuthorizationError();
  }

  let trx = await start_trx();
  try {
    let [_, err] = await option(trx.query("insert into read_messages (message_id, user_id) values ($1, $2)", [id, user_id]));
    if (!err) await trx.query("update chat_members set unread_count = unread_count - 1, last_read_message_id = case when $1 > coalesce(last_read_message_id, 0) then $1 else last_read_message_id end where chat_id = $2 and user_id = $3", [id, chat_id, user_id]);
    await commit_trx(trx);
  } catch (err) {
    console.error({ err });
    rollback_trx(trx);
    throw new InternalError();
  }
}

function create_one_impl(trx = { query }) {
  return async ({ created_by, listing_id, members = [] }) => {
    let chat = await trx.query(`insert into chats (created_by, listing_id, url) values ($1, $2, $3) returning id`, [created_by, listing_id, url]);
    let url = new URL(`chats/${chat.id}`, config.origin).href;
    await Promise.all([
      trx.query(`update chats set url = $1 where id = $2`, [url, chat.id]),
      Promise.all(members.map(m => trx.query(`insert into chat_members (chat_id, user_id) values ($1, $2)`, [chat.id, m])))
    ]);
    return chat;
  };
}

function update_one_impl(trx = { query }) {
  return async (id, update = {}) => {
    let sql = '';
    let keys = Object.keys(update);
    for (let i = 0, len = keys.length; i < len; i++) {
      sql += keys[i] + "=" + update[keys[i]];
      let is_last = i === len - 1;
      if (!is_last) sql += ", "
    }

    let { rows } = await trx.query(`update chats set ${sql} where id = $1`, [id]);
    return rows[0];
  };
}
