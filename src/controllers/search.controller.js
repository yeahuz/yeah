import * as CategoryService from "../services/category.service.js";
import * as RegionService from "../services/region.service.js";
import { parse_url } from "../utils/index.js";
import { render_file } from "../utils/eta.js";
import { elastic_client } from "../services/es.service.js";

export async function get_search(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { q, region } = req.query;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
      mobile_search: true,
      q,
    });
    stream.push(top);
  }

  // const search_top = await render_file("/search/top.html", { q, t, user });
  // stream.push(search_top);

  const categories = !q ? await CategoryService.get_by_parent({ lang: req.language }) : [];
  const regions = await RegionService.get_regions({ lang: req.language });
  const search_index = await render_file("/search/index.html", {
    q,
    t,
    user,
    categories,
    region,
    regions,
  });
  stream.push(search_index);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", { user, t, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_completions(req, reply) {
  const { q } = req.query;
  const words = q.split(" ").map((w) => w.toLowerCase());
  const prefix = words[words.length - 1];
  const term = words.slice(0, words.length - 1).join("");
  const response = await elastic_client.search({
    index: "needs_ru",
    body: {
      query: {
        bool: {
          should: [
            { match: { "search_data.title": term } },
            { prefix: { "search_data.title": prefix } },
          ],
        },
      },
      _source: ["result.title"],
    },
  });

  const results = response.body.hits.hits;
  const suggestions = [];
  for (const result of results) {
    const title = result._source.result.title.toLowerCase();
    const matches = title.match(new RegExp(`(?<=${q}).+`));
    if (matches) suggestions.push(matches[0]);
  }

  reply.send(suggestions);
  return reply;
}
