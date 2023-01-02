import * as ChatService from "../services/chat.service.js";
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

  const chat = await ChatService.get_one({ id, current_user_id: user.id });
  const chat_area = await render_file("/chats/chat-area.html", {
    t,
    chat,
    formatter: new Intl.DateTimeFormat(req.language, { hour: "numeric", minute: "numeric" }),
    format_bytes,
  });
  stream.push(chat_area);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);

  return reply;
}

export async function create_message(req, reply) {
  const user = req.user;
  const { id } = req.params;
  const { content, reply_to } = req.body;
  const message = await ChatService.create_message({
    chat_id: id,
    content,
    reply_to,
    sender_id: user.id,
  });
  reply.send(message);
  return reply;
}

export async function link_photos(req, reply) {
  const user = req.user;
  const { id } = req.params;
  const { photos = [], reply_to } = req.body;
  const result = await ChatService.link_photos({
    chat_id: id,
    photos,
    reply_to,
    sender_id: user.id,
  });

  reply.send(result);
  return reply;
}

export async function link_file(req, reply) {
  const user = req.user;
  const { id } = req.params;
  const { file, reply_to } = req.body;
  const result = await ChatService.link_file({
    chat_id: id,
    file,
    reply_to,
    sender_id: user.id,
  });

  reply.send(result);
  return reply;
}
