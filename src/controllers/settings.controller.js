import * as SessionService from "../services/session.service.js";
import * as CredentialService from "../services/credential.service.js";
import * as BillingService from "../services/billing.service.js";
import { render_file } from "../utils/eta.js";
import { add_t, format_phone } from "../utils/index.js";
import { create_date_formatter } from "../utils/date.js";


export async function get_tab(req, reply) {
  let { tab } = req.params;
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  let settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab,
    t,
  });
  stream.push(settings_tabs);

  let selected_tab = await render_file(`/settings/${tab}`, {
    user,
    flash,
    t,
  });

  if (!selected_tab) {
    let not_found = await render_file("/partials/404.html", { t });
    stream.push(not_found);
  } else {
    stream.push(selected_tab);
  }

  let settings_bottom = await render_file("/settings/bottom.html");
  stream.push(settings_bottom);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_details(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.details", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  let settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "details",
    t,
  });
  stream.push(settings_tabs);

  let details = await render_file("/settings/details.html", {
    user,
    flash,
    t,
    format_phone
  });
  stream.push(details);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_privacy(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let current_sid = req.session.get("sid");

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.privacy", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  let settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "privacy",
    t,
  });
  stream.push(settings_tabs);

  let [sessions, credentials] = await Promise.all([
    SessionService.get_many({ user_id: user.id, current_sid, params: { user_agent: true } }),
    CredentialService.get_many({ user_id: user.id })
  ]);

  let privacy = await render_file("/settings/privacy.html", {
    user,
    flash,
    t,
    sessions,
    credentials,
    date_formatter: create_date_formatter(req.language),
  });
  stream.push(privacy);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_billing(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.billing", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  let settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "billing",
    t,
  });
  stream.push(settings_tabs);

  let billing_account = await BillingService.get_by_user_id(user.id);
  let billing = await render_file("/settings/billing.html", {
    user,
    flash,
    t,
    billing_account,
  });
  stream.push(billing);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_appearance(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let theme = req.session.get("theme");

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.appearance", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  let settings_tabs = await render_file("/partials/settings-tabs.html", {
    tab: "appearance",
    t,
  });
  stream.push(settings_tabs);

  let appearance = await render_file("/settings/appearance.html", {
    user,
    flash,
    t,
    theme,
  });
  stream.push(appearance);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function update_appearance(req, reply) {
  let { return_to = "/" } = req.query;
  let { theme } = req.body;
  req.session.set("theme", theme);
  reply.redirect(add_t(return_to));
  return reply;
}

export async function get_settings(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "settings" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let settings_top = await render_file("/settings/top.html", { t });
  stream.push(settings_top);

  let settings_tabs = await render_file("/partials/settings-tabs.html", {
    t,
  });

  stream.push(settings_tabs);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
