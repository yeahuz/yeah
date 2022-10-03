import * as UserService from "../services/user.service.js";
import * as CategoryService from "../services/category.service.js";
import * as PostingService from "../services/posting.service.js";
import * as RegionService from "../services/region.service.js";
import * as NotificationService from "../services/notification.service.js";
import path from "path";
import { render_file } from "../utils/eta.js";
import { parse_url, array_to_tree } from "../utils/index.js";
import { create_relative_formatter } from "../utils/date.js";
import { registerFont, createCanvas } from "canvas";

registerFont(path.join(process.cwd(), "src/public/fonts/Inter-Regular.ttf"), { family: "Inter" });

export async function get_partial(req, reply) {
  const user = req.user;
  const t = req.i18n.t;
  const { partial } = req.params;
  const theme = req.session.get("theme");
  const html = await render_file(`/partials/${partial}`, {
    meta: { title: t("home", { ns: "common" }), lang: req.language, t },
    t,
    user,
    theme,
  });

  reply.header("Content-Type", "text/html").send(html);
  return reply;
}

export async function get_avatar(req, reply) {
  let { name, size = 64, bg_color = "0070f3", color = "fff", font_size = 0.4 } = req.query;
  const [first_name, last_name] = name.split(" ");
  let initials = first_name[0];
  if (last_name) initials += last_name[0];
  else initials += first_name[1];

  size = parseInt(size);
  font_size = parseFloat(font_size);

  const canvas = createCanvas(size, size, "svg");
  const ctx = canvas.getContext("2d");
  ctx.font = `${font_size * size}px "Inter"`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillStyle = `#${bg_color}`;
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = `#${color}`;
  ctx.fillText(initials.toUpperCase(), size / 2, size / 2);

  reply.header("Cache-Control", "public, max-age=31556926");
  reply.header("Content-Disposition", "inline");
  reply.type("image/svg+xml");
  reply.send(canvas.toBuffer());
  return reply;
}

export async function get_index(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const categories = await CategoryService.get_many({ lang: req.language });
  const postings = await PostingService.get_many({ status_id: 1 });
  const regions = await RegionService.get_regions({ lang: req.language });

  const home = await render_file("/home.html", {
    t,
    categories: array_to_tree(categories),
    postings,
    lang: req.language,
    format_relative: create_relative_formatter(req.language),
    regions,
  });
  stream.push(home);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { user, t, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_me(req, reply) {
  const { ps } = req.query;
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: "Home", lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  if (!user) {
    const not_found = await render_file("/partials/404.html", { t });
    stream.push(not_found);
  } else {
    const profile_html = await render_file("/profile.html", {
      t,
      profile: user,
      ps,
    });
    stream.push(profile_html);
  }

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_profile(req, reply) {
  const { username } = req.params;
  const { ps } = req.query;
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: "Home", lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const profile = user?.username === username ? user : await UserService.get_by_username(username);

  if (!profile) {
    const not_found = await render_file("/partials/404.html", { t });
    stream.push(not_found);
  } else {
    const profile_html = await render_file("/profile.html", {
      t,
      profile,
      ps,
    });
    stream.push(profile_html);
  }

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
