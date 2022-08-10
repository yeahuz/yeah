import * as CategoryService from '../services/category.service.js';
import { parse_url } from '../utils/index.js'
import { render_file } from "../utils/eta.js";

export async function get_search(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { q } = req.query;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const categories = await CategoryService.get_parents({ lang: req.language });
  const search_index = await render_file("/search/index.html", { q, t, user, categories });
  stream.push(search_index);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { user, t, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
