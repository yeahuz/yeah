import { render_file } from "../utils/eta.js";

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
