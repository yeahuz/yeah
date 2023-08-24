import { render_file } from "../utils/eta.js";

let tab_active = (url) => (path) => url.startsWith(path);

export async function get_overview(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.overview", { ns: "profile" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    tab_active: tab_active(req.url),
    t,
  });
  stream.push(profile_tabs);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_recently_viewed(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.recently_viewed", { ns: "profile" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    tab_active: tab_active(req.url),
    t,
  });
  stream.push(profile_tabs);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_watchlist(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.watchlist", { ns: "profile" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    tab_active: tab_active(req.url),
    t,
  });
  stream.push(profile_tabs);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_purchases(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.purchases", { ns: "profile" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    tab_active: tab_active(req.url),
    t,
  });
  stream.push(profile_tabs);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_profile(req, reply) {
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

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    t,
  });
  stream.push(profile_tabs);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
