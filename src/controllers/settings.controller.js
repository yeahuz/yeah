import * as SessionService from "../services/session.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as BillingService from "../services/billing.service.js";
import { render_file } from "../utils/eta.js";
import { parse_url, add_t } from "../utils/index.js";
import { create_date_formatter } from "../utils/date.js";

export async function get_tab(req, reply) {
  const { tab } = req.params;
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  const settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab,
    t,
  });
  stream.push(settings_tabs);

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

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_details(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.details", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  const settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "details",
    t,
  });
  stream.push(settings_tabs);

  const details = await render_file("/settings/details.html", {
    user,
    flash,
    t,
  });
  stream.push(details);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_privacy(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const current_sid = req.session.get("sid");

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.privacy", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  const settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "privacy",
    t,
  });
  stream.push(settings_tabs);

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

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_billing(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.billing", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  const settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "billing",
    t,
  });
  stream.push(settings_tabs);

  const billing_account = await BillingService.get_by_user_id(user.id);
  const billing = await render_file("/settings/billing.html", {
    user,
    flash,
    t,
    billing_account,
  });
  stream.push(billing);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_appearance(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const theme = req.session.get("theme");

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.appearance", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  const settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "appearance",
    t,
  });
  stream.push(settings_tabs);

  const appearance = await render_file("/settings/appearance.html", {
    user,
    flash,
    t,
    theme,
  });
  stream.push(appearance);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function update_appearance(req, reply) {
  const { return_to = "/" } = req.query;
  const { theme } = req.body;
  req.session.set("theme", theme);
  reply.redirect(add_t(return_to));
  return reply;
}

export async function get_settings(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  const settings_tabs = await render_file("/partials/settings-tabs.html", {
    t,
  });

  stream.push(settings_tabs);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { t, user, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
