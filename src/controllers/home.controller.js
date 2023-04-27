import * as UserService from "../services/user.service.js";
import * as CategoryService from "../services/category.service.js";
import * as PostingService from "../services/posting.service.js";
import * as RegionService from "../services/region.service.js";
import * as NotificationService from "../services/notification.service.js";
import config from "../config/index.js";
import path from "path";
import fs from "fs";
import { render_file } from "../utils/eta.js";
import { array_to_tree, generate_srcset, interpolate } from "../utils/index.js";
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
    env: { WS_URI_PUBLIC: config.ws_uri_public }
  });

  reply.header("Content-Type", "text/html").send(html);
  return reply;
}

export async function get_time(req, reply) {
  let { size = 100, color = "0070f3", font_size = 0.3, radius = 10 } = req.query;
  size = parseInt(size);
  font_size = parseFloat(font_size);
  radius = parseInt(radius);
  const hours = 24;
  const minutes = 60;

  const is_one_digit = (str) => str.length === 1;

  for (let hour = 0; hour < hours; hour++) {
    for (let minute = 0; minute < minutes; minute++) {
      let hour_str = is_one_digit(String(hour)) ? `0${hour}` : hour;
      let minute_str = is_one_digit(String(minute)) ? `0${minute}` : minute;
      let time = `${hour_str}:${minute_str}`;

      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext("2d");

      ctx.beginPath();
      ctx.roundRect(0, (size - size / 1.5) * 0.5, size, size / 1.5, radius);
      ctx.strokeStyle = `#${color}`;
      ctx.stroke();

      ctx.font = `${font_size * size}px "Inter"`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillStyle = `#${color}`;
      ctx.fillText(time, size / 2, size / 2);
      ctx.lineWidth = 10;
      fs.writeFileSync(`./clock/${time}.png`, canvas.toBuffer());
    }
  }

  reply.send({ status: "ok" });
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

  const canvas = createCanvas(size, size);
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
  reply.type("image/png");
  reply.send(canvas.toBuffer("image/png"));
  return reply;
}

export async function get_index(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const [notifications, notifications_count] = await Promise.all([
      NotificationService.get_many({ user_id: user?.id, lang: req.language }),
      NotificationService.get_count({ user_id: user?.id })
    ]);

    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
      notifications,
      notifications_count,
      interpolate
    });
    stream.push(top);
  }

  const [categories, postings, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language, format: "tree" }),
    PostingService.get_many({ status_id: 1 }),
    RegionService.get_regions({ lang: req.language })
  ]);

  const home = await render_file("/home.html", {
    t,
    categories,
    postings,
    lang: req.language,
    format_relative: create_relative_formatter(req.language),
    regions,
    generate_srcset,
  });
  stream.push(home);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { user, t });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_me(req, reply) {
  const { ps = "active" } = req.query;
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: user.name, lang: req.language },
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
      current_user: user,
      ps,
      generate_srcset,
    });
    stream.push(profile_html);
  }

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_profile(req, reply) {
  const { username } = req.params;
  const { ps = "active" } = req.query;
  const stream = reply.init_stream();
  const current_user = req.user;
  const t = req.i18n.t;

  const profile =
    current_user.username === username ? current_user : UserService.get_by_username(username);

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: (await profile)?.name, lang: req.language },
      t,
    });
    stream.push(top);
  }

  if (!profile) {
    const not_found = await render_file("/partials/404.html", { t });
    stream.push(not_found);
  } else {
    const profile_html = await render_file("/profile.html", {
      t,
      profile: await profile,
      current_user,
      ps,
      generate_srcset,
    });
    stream.push(profile_html);
  }

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", {
      t,
      user: current_user
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
