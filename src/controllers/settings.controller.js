import * as SessionService from "../services/session.service.js";
import * as CredentialService from "../services/credential.service.js";
import { render_file } from "../utils/eta.js";
import { create_date_formatter, parse_url } from "../utils/index.js";

export async function get_tab(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const { tab } = req.params;
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { mobile } = req.query;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  if (!mobile) {
    const settings_tabs = await render_file("/partials/settings-tabs.html", {
      tab,
      t,
      mobile,
    });
    stream.push(settings_tabs);
  }

  const selected_tab = await render_file(`/settings/${tab}`, {
    user,
    flash,
    t,
  });

  if (!selected_tab) {
    const not_found = await render_file("/partials/404.html", { t });
    stream.push(not_found);
  } else {
    stream.push(selected_tab);
  }

  const settings_bottom = await render_file("/settings/bottom.html");
  stream.push(settings_bottom);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_details(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { mobile } = req.query;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.details", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  if (!mobile) {
    const settings_tabs = await render_file("/partials/settings-tabs.html", {
      tab: "details",
      t,
      mobile,
    });
    stream.push(settings_tabs);
  }

  const details = await render_file("/settings/details.html", {
    user,
    flash,
    t,
  });
  stream.push(details);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_privacy(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const current_sid = req.session.get("sid");
  const { mobile } = req.query;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.privacy", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  if (!mobile) {
    const settings_tabs = await render_file("/partials/settings-tabs.html", {
      tab: "privacy",
      t,
      mobile,
    });
    stream.push(settings_tabs);
  }

  const sessions = await SessionService.get_many().for(user.id, current_sid);
  const credentials = await CredentialService.get_many().for(user.id);

  const privacy = await render_file("/settings/privacy.html", {
    user,
    flash,
    t,
    sessions,
    credentials,
    date_formatter: create_date_formatter(req.language),
  });
  stream.push(privacy);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_settings(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { mobile } = req.query;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.privacy", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  if (mobile) {
    const settings_tabs = await render_file("/partials/settings-tabs.html", {
      t,
      mobile,
    });
    stream.push(settings_tabs);
  }

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
