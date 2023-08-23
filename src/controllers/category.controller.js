import { render_file } from "../utils/eta.js";
import * as CategoryService from "../services/category.service.js";

export async function get_many(req, reply) {
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let { category_id } = req.params;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  let categories = await CategoryService.get_by_parent({
    lang: req.language,
    parent_id: category_id ?? null,
  });

  let list = await render_file("/category/list", { categories });

  stream.push(list);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", {
      user,
      t
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}
