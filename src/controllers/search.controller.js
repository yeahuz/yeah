import * as CategoryService from "../services/category.service.js";
import * as RegionService from "../services/region.service.js";
import {
  cleanup_object,
  remove_query_value,
  append_query_value,
  array_to_tree,
  generate_srcset,
} from "../utils/index.js";
import { create_relative_formatter } from "../utils/date.js";
import { render_file } from "../utils/eta.js";
import * as ESService from "../services/es.service.js";

export async function get_search(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  const {
    q = "",
    min_amount,
    max_amount,
    placement,
    region_id,
    ...facets
  } = cleanup_object(req.query);

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
      q: q.trim(),
    });
    stream.push(top);
  }

  const categories = !q ? await CategoryService.get_by_parent({ lang: req.language }) : [];
  const regions = await RegionService.get_regions({ lang: req.language });
  const search_top = await render_file("/search/top.html", {
    q: q.trim(),
    t,
    user,
    categories: array_to_tree(categories),
    region_id,
    regions,
  });
  stream.push(search_top);

  const result = await ESService.general_search("needs_ru", {
    region_id,
    facets,
    min_amount,
    max_amount,
    q,
    placement,
  });

  const filters = await render_file("/search/filters.html", {
    filters: result.aggregations,
    min_amount,
    max_amount,
    facets,
    placement,
    region_id,
    q: q.trim(),
    url: req.url,
    remove_query_value,
    append_query_value,
  });
  stream.push(filters);

  const results = await render_file("/search/results.html", {
    hits: result.hits,
    lang: req.language,
    t,
    format_relative: create_relative_formatter(req.language),
    generate_srcset,
  });

  stream.push(results);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { user, t });
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
  const response = await ESService.elastic_client.search({
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

  const results = response.hits.hits;
  const suggestions = [];
  for (const result of results) {
    const title = result._source.result.title.toLowerCase();
    const matches = title.match(new RegExp(`(?<=${q}).+`));
    if (matches) suggestions.push(matches[0]);
  }

  reply.send(suggestions);
  return reply;
}
