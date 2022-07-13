import { render_file } from '../utils/eta.js';

export async function get_new(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const top = await render_file("/partials/top.html", {
    meta: { title: "New posting", lang: req.language }
  })
  stream.push(top)

  const header = await render_file("/partials/header.html", {
    t,
    user: user,
  });
  stream.push(header);

  const posting_top = await render_file("/posting/new.html")
  stream.push(posting_top);

  const bottom = await render_file("/partials/bottom.html", {
    scripts: ["/public/js/settings.js"],
  });

  stream.push(bottom);
  stream.push(null);
  return reply;
}
