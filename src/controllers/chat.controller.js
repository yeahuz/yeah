import * as ChatService from "../services/chat.service.js";
import { render_file } from "../utils/eta.js";
import { parse_url, generate_srcset, group_by } from "../utils/index.js";
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
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);

  return reply;
}

export async function get_one(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { hash_id } = req.params;

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

  const chat = await ChatService.get_one({ hash_id, current_user_id: user.id });
  const chat_area = await render_file("/chats/chat-area.html", {
    t,
    chat,
    formatter: new Intl.DateTimeFormat(req.language, { hour: "numeric", minute: "numeric" }),
  });
  stream.push(chat_area);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);

  return reply;
}
