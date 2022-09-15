import { render_file } from "../utils/eta.js";
import { parse_url } from "../utils/index.js";
import * as PaymentService from "../services/payment.service.js";

export async function get_new(req, reply) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!is_navigation_preload) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-posting" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const new_payment = await render_file("/payments/new.html", { t, flash });
  stream.push(new_payment);

  if (!is_navigation_preload) {
    const bottom = await render_file("/partials/bottom.html", {
      t,
      url: parse_url(req.url),
      user,
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function create_new_payment(req, reply) {
  const user = req.user;
  const { provider = "payme", amount = 0 } = req.body;
  const generate_url = PaymentService.pay_with(provider);
  const url = generate_url({ amount, user, order_id: 90 });
  reply.redirect(url);
  return reply;
}
