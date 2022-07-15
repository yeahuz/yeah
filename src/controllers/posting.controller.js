import { render_file } from '../utils/eta.js';
import { array_to_tree } from '../utils/index.js'
import * as CategoryService from '../services/category.service.js'

export async function get_new(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { step = "1" } = req.query

  const categories = await CategoryService.get_many({ lang: req.language });
  const posting_data = JSON.parse(req.session.get("new-posting") || null)

  const top = await render_file("/partials/top.html", {
    meta: { title: "New posting", lang: req.language }
  })
  stream.push(top)

  const header = await render_file("/partials/header.html", {
    t,
    user,
  });
  stream.push(header);

  const posting_top = await render_file("/posting/new/top.html", { step: parseInt(step, 10) })
  stream.push(posting_top);

  const current_step = await render_file(`/posting/new/step-${step}`, { categories: array_to_tree(categories) });
  if (!current_step) {
    const not_found =  await render_file("/partials/404.html");
    stream.push(not_found);
  } else {
    stream.push(current_step);
  }

  const step_bottom = await render_file("/posting/new/bottom.html");
  stream.push(step_bottom);

  const bottom = await render_file("/partials/bottom.html", {
    scripts: ["/public/js/settings.js"],
  });

  stream.push(bottom);
  stream.push(null);
  return reply;
}

export async function submit_step(req, reply) {
  const { step = "1", ...data} = req.body
  console.log({ data })
  req.session.set("new-posting", JSON.stringify(data));
  reply.redirect(`/postings/new?step=${parseInt(step, 10) + 1}`);
}
