import * as SessionService from "../services/session.service.js";
import * as CredentialService from '../services/credential.service.js'
import { render_file } from "../utils/eta.js";
import { create_date_formatter } from "../utils/index.js";

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

  const settings_top = await render_file("/settings/top.html", { tab, t });
  stream.push(settings_top);

  const selected_tab = await render_file(`/settings/${tab}`, {
    user,
    flash,
    t,
  });

  if (!selected_tab) {
    const not_found = await render_file("/partials/404.html");
    stream.push(not_found);
  } else {
    stream.push(selected_tab);
  }

  const settings_bottom = await render_file("/settings/bottom.html");
  stream.push(settings_bottom);

  const bottom = await render_file("/partials/bottom.html", {
    scripts: ["/public/js/settings.js"],
  });

  stream.push(bottom);
  stream.push(null);
  return reply;
}

export async function get_details(req, reply) {
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

  const settings_top = await render_file("/settings/top.html", {
    tab: "details",
    t,
  });
  stream.push(settings_top);

  const details = await render_file("/settings/details.html", {
    user,
    flash,
    t,
  });
  stream.push(details);

  const settings_bottom = await render_file("/settings/bottom.html");
  stream.push(settings_bottom);

  const bottom = await render_file("/partials/bottom.html", {
    scripts: ["/public/js/settings.js"],
  });
  stream.push(bottom);
  stream.push(null);

  return reply;
}

export async function get_privacy(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const current_sid = req.session.get("sid");

  const top = await render_file("/partials/top.html", {
    meta: { title: "Settings", lang: req.language },
  });
  stream.push(top);

  const header = await render_file("/partials/header.html", {
    t,
    user: user,
  });
  stream.push(header);

  const settings_top = await render_file("/settings/top.html", {
    tab: "privacy",
    t,
  });
  stream.push(settings_top);

  const sessions = await SessionService.get_many_for(user.id);
  const credentials = await CredentialService.get_many().for(user.id)

  const privacy = await render_file("/settings/privacy.html", {
    user,
    flash,
    t,
    sessions,
    credentials,
    current_sid,
    date_formatter: create_date_formatter(req.language),
  });
  stream.push(privacy);

  const settings_bottom = await render_file("/settings/bottom.html", {
    scripts: ["/public/js/settings.js"]
  });
  stream.push(settings_bottom);

  const bottom = await render_file("/partials/bottom.html");

  stream.push(bottom);
  stream.push(null);
  return reply;
}
