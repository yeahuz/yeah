import { render_file } from "../utils/eta.js";
import { parse_url } from "../utils/index.js";

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

  const chats = await render_file("/chats/list.html", { t });
  stream.push(chats);

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

  const chats = await render_file("/chats/list.html", { t });
  stream.push(chats);

  const chat_area = await render_file("/chats/chat-area.html", { t, chat: {} });
  stream.push(chat_area);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);

  return reply;
}
