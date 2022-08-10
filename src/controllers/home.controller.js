import * as UserService from "../services/user.service.js";
import * as CategoryService from "../services/category.service.js";
import { render_file } from "../utils/eta.js";
import { get_many } from '../services/region.service.js'
import { parse_url, array_to_tree } from "../utils/index.js";

export async function get_partial(req, reply) {
  const user = req.user;
  const t = req.i18n.t;
  const { partial } = req.params;
  const html = await render_file(`/partials/${partial}`, {
    meta: { title: t("home", { ns: "common" }), lang: req.language, t },
    t,
    user
  });

  reply.header("Content-Type", "text/html").send(html)
  return reply;
}

export async function get_index(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const categories = await CategoryService.get_many({ lang: req.language });
  const home = await render_file("/home.html", { t, categories: array_to_tree(categories) });
  stream.push(home);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { user, t, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_profile(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const { username } = req.params;
  const { ps } = req.query;
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if(!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: "Home", lang: req.language },
      t,
      user
    });
    stream.push(top);
  }

  const profile =
    user?.username === username
      ? user
      : await UserService.get_by_username(username);

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

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
