import { render_file } from "../utils/eta.js";
import * as CategoryService from "../services/category.service.js";

export async function get_many(req, reply) {
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { category_id } = req.params;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const categories = await CategoryService.get_by_parent({
    lang: req.language,
    parent_id: category_id ?? null,
  });
  const list = await render_file("/category/list", { categories });
  stream.push(list);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", {
      user,
      t
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
