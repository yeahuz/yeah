import * as ChatService from "../services/chat.service.js";
import * as MessageService from "../services/message.service.js";
import config from "../config/index.js";
import { render_file } from "../utils/eta.js";
import { generate_srcset, format_bytes } from "../utils/index.js";
import { create_relative_formatter } from "../utils/date.js";

export async function get_many(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "chats" }), lang: req.language },
      t,
      user,
      env: { WS_URI_PUBLIC: config.ws_uri_public }
    });
    stream.push(top);
  }

  const chats_top = await render_file("/chats/top.html", { t });
  stream.push(chats_top);

  const chats = await ChatService.get_many({ user_id: user.id });
  const chat_list = await render_file("/chats/list.html", {
    t,
    chats,
    format_relative: create_relative_formatter(req.language),
    user,
    generate_srcset,
  });
  stream.push(chat_list);

  const chat_area = await render_file("/chats/chat-area.html", { t });
  stream.push(chat_area);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);

  return reply;
}

export async function get_one(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { id } = req.params;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "chats" }), lang: req.language },
      t,
      user,
      env: { WS_URI_PUBLIC: config.ws_uri_public }
    });
    stream.push(top);
  }

  const chats_top = await render_file("/chats/top.html", { t });
  stream.push(chats_top);

  const chats = await ChatService.get_many({ user_id: user.id });
  const chat_list = await render_file("/chats/list.html", {
    t,
    chats,
    format_relative: create_relative_formatter(req.language),
    user,
    generate_srcset,
    current_chat_id: id,
  });
  stream.push(chat_list);

  let [chat, messages] = await Promise.all([
    ChatService.get_one({ id }),
    MessageService.get_many({ chat_id: id, user_id: user.id }),
  ]);

  const chat_area = await render_file("/chats/chat-area.html", {
    t,
    chat,
    formatter: new Intl.DateTimeFormat(req.language, { hour: "numeric", minute: "numeric" }),
    format_bytes,
    user,
    messages
  });
  stream.push(chat_area);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);

  return reply;
}

// TODO: Should return html or redirect
export async function create_message(req, reply) {
  const user = req.user;
  const { id } = req.params;
  const { content, reply_to, attachments = [], type } = req.body;
  const message = await ChatService.create_message({
    chat_id: id,
    content,
    reply_to,
    sender_id: user.id,
    attachments,
    type,
  });
  reply.send(message);
  return reply;
}
