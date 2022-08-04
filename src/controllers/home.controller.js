import { render_file } from "../utils/eta.js";
import * as UserService from "../services/user.service.js";
import { get_many } from '../services/region.service.js'

export async function get_partial(req, reply) {
  const user = req.user;
  const t = req.i18n.t;
  const { partial } = req.params;
  const html = await render_file(`/partials/${partial}`, {
    meta: { title: "Home", lang: req.language },
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
      meta: { title: "Home", lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const home = await render_file("/home.html", { t });
  stream.push(home);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html");
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
    const not_found = await render_file("/partials/404.html");
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
    const bottom = await render_file("/partials/bottom.html");
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
