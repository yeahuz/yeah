import { render_file } from "../utils/eta.js";

export async function get_tab(req, reply) {
  const { tab } = req.params;
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: "Settings", lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", {
    t,
    user: user,
  });
  stream.push(header);

  const settings = await render_file("/settings/index.html", { tab });
  stream.push(settings);

  const selected_tab = await render_file(`/settings/${tab}`, { user });
  if (!selected_tab) {
    const not_found = await render_file("/404.html");
    stream.push(not_found);
  } else {
    stream.push(selected_tab);
  }

  const bottom = await render_file("/partials/bottom.html", {
    scripts: ["/public/js/settings.js"],
  });

  stream.push(bottom);
  stream.push(null);
  return reply;
}
