import * as PaymentService from "../services/payment.service.js";
import * as BillingService from "../services/billing.service.js";
import { render_file } from "../utils/eta.js";
import { option } from "../utils/index.js";

export async function get_new(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-posting" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const providers = await PaymentService.get_providers();
  const new_payment = await render_file("/payments/new.html", { t, flash, providers });
  stream.push(new_payment);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", {
      t,
      user
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function create_new_payment(req, reply) {
  const user = req.user;
  const t = req.i18n.t;
  const billing_account = await BillingService.get_by_user_id(user.id);
  const { provider_name = "payme", debit_amount = 0 } = req.body;
  const [result, err] = await option(
    PaymentService.create_payment({
      debit_amount,
      provider_name,
      status: "PENDING",
      billing_account_id: billing_account.id,
    })
  );

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(req.url);
    return reply;
  }

  reply.redirect(result.url);
  return reply;
}
