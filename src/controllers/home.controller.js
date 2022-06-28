import { render_file } from "../utils/eta.js";
import * as UserService from "../services/user.service.js";

export async function get_index(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: "Home", lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", { t, user });
  stream.push(header);

  const home = await render_file("/home.html", { t });
  stream.push(home);

  const bottom = await render_file("/partials/bottom.html");
  stream.push(bottom);

  stream.push(null);
  return reply;
}

export async function get_profile(req, reply) {
  const { username } = req.params;
  const { ps } = req.query;
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: "Home", lang: req.language },
  });

  stream.push(top);

  const header = await render_file("/partials/header.html", { t, user });
  stream.push(header);

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

  const bottom = await render_file("/partials/bottom.html");
  stream.push(bottom);

  stream.push(null);
  return reply;
}
