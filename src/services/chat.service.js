import { Chat, User, Message } from "../models/index.js";
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

export async function get_one({ hash_id, current_user_id }) {
  const chat = await Chat.query()
    .findOne({ hash_id })
    .withGraphFetched("[messages.[sender], posting]")
    .modifyGraph("messages", (builder) =>
      builder.select(
        "content",
        "created_at",
        raw("case when sender_id = ? then 1 else 0 end as is_own_message", [current_user_id])
      )
    );

  const groups = chat.messages.reduce((prev, curr) => {
    const date = new Date(curr.created_at).toISOString().split("T")[0];
    if (prev[date]) prev[date].push(curr);
    else prev[date] = [curr];

    return prev;
  }, {});

  chat.groups = Object.keys(groups).map((date) => ({ date, messages: groups[date] }));

  return chat;
}

export async function is_chat_member(user_id, hash_id) {
  const chat = await Chat.query().findOne({ hash_id });
  return await chat.$relatedQuery("members").findOne({ user_id });
}

function create_one_impl(trx) {
  return async ({ created_by, posting_id }) =>
    await Chat.query(trx).insert({ created_by, posting_id });
}

export const create_one_trx = (trx) => create_one_impl(trx);
export const create_one = create_one_impl();
