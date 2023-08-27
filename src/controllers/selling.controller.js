import { render_file } from "../utils/eta.js";
import * as ListingService from "../services/listing.service.js";

let tab_active = (url) => (path) => url.startsWith(path)

export async function get_overview(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("tabs.overview", { ns: "selling" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    url: req.url,
    t,
    tab_active: tab_active(req.url)
  });
  stream.push(profile_tabs);

  let overview = await render_file("/selling/overview.html", {
    t
  });
  stream.push(overview);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_selling(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let { status } = req.query;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "selling" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let profile_top = await render_file("/profile/top.html", { t });
  stream.push(profile_top);

  let profile_tabs = await render_file("/partials/profile-tabs.html", {
    url: req.url,
    t,
    tab_active: tab_active(req.url)
  });
  stream.push(profile_tabs);

  let listings = await ListingService.get_many({ status, created_by: user.id });
  stream.push(await render_file("/selling/listings.html", { listings, t }));

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { t, user });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
