import * as CategoryService from "../services/category.service.js";
import * as RegionService from "../services/region.service.js";
import {
  cleanup_object,
  remove_query_value,
  append_query_value,
  generate_srcset,
} from "../utils/index.js";
import { create_relative_formatter } from "../utils/date.js";
import { render_file } from "../utils/eta.js";
import * as ESService from "../services/es.service.js";

export async function get_search(req, reply) {
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;

  let {
    q = "",
    min_amount,
    max_amount,
    placement,
    region_id,
    category_id,
    ...facets
  } = cleanup_object(req.query);

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
      q: q.trim(),
    });
    stream.push(top);
  }

  let [categories, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language, format: "tree" }),
    RegionService.get_regions({ lang: req.language })
  ]);

  let search_top = await render_file("/search/top.html", {
    q: q.trim(),
    t,
    user,
    categories,
    region_id,
    regions,
    category_id
  });
  stream.push(search_top);

  let result = await ESService.general_search("needs_ru", {
    region_id,
    facets,
    min_amount,
    max_amount,
    q,
    placement,
  });

  let filters = await render_file("/search/filters.html", {
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

  let results = await render_file("/search/results.html", {
    hits: result.hits,
    lang: req.language,
    t,
    format_relative: create_relative_formatter(req.language),
    generate_srcset,
  });

  stream.push(results);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { user, t });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_completions(req, reply) {
  let { q } = req.query;
  let words = q.split(" ").map((w) => w.toLowerCase());
  let prefix = words[words.length - 1];
  let term = words.slice(0, words.length - 1).join("");
  let response = await ESService.elastic_client.search({
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

  let results = response.hits.hits;
  let suggestions = [];
  for (let result of results) {
    let title = result._source.result.title.toLowerCase();
    let matches = title.match(new RegExp(`(?<=${q}).+`));
    if (matches) suggestions.push(matches[0]);
  }

  reply.send(suggestions);
  return reply;
}
