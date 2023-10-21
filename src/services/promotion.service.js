import { query, rollback_trx, start_trx } from "./db.service.js";
import { InternalError } from "../utils/errors.js";

export let promotion_types = {
  VOLUME_DISCOUNT: "VOLUME_DISCOUNT",
  ORDER_DISCOUNT: "ORDER_DISCOUNT",
  COUPON_DISCOUNT: "COUPON_DISCOUNT",
  MARKDOWN_SALE: "MARKDOWN_SALE",
}

export let promotion_statuses = {
  SCHEDULED: "SCHEDULED",
  RUNNING: "RUNNING",
  PAUSED: "PAUSED",
  DRAFT: "DRAFT",
  ENDED: "ENDED",
  INVALID: "INVALID"
}

export function create_one_impl(trx = { query }) {
  return async ({ type_id, name, description, end_date, start_date, priority, status_id = promotion_statuses.DRAFT }) => {
    let { rows } = await trx.query(`insert into promotions (type_id, name, description, end_date, start_date, priority, status_id)
    values ($1, $2, $3, $4, $5, $6, $7) returning id`, [type_id, name, description, end_date, start_date, priority, status_id]);
    return rows[0];
  }
}

export function add_discount_rules_impl(trx = { query }) {
  return async (promotion_id, rules = []) => {
    for (let rule of rules) {
      let { min_quantity, min_amount, for_each_quantity, for_each_amount, min_amount_currency,for_each_amount_currency } = rule.specification;
      let { unit, value, currency } = rule.benefit;
      let { rows: [inserted_rule] } = await trx.query(`insert into discount_rules (promotion_id, rule_order) values ($1, $2) returning id`, [promotion_id, rule.order]);
      let { rows: [inserted_spec] } = await trx.query(`
        insert into discount_specifications (discount_rule_id, min_quantity, min_amount, for_each_quantity, for_each_amount, min_amount_currency, for_each_amount_currency)
        values ($1, $2, $3, $4, $5, $6, $7)`,
      [inserted_rule.id, min_quantity, min_amount, for_each_quantity, for_each_amount, min_amount_currency, for_each_amount_currency]);

      await trx.query(`insert into discount_benefits (discount_specification_id, unit, value, currency)
        values ($1, $2, $3, $4, $5, $6, $7)`, [inserted_spec.id, unit, value, currency]);
    }
  }
}

export let add_discount_rules_trx = (trx) => add_discount_rules_impl(trx);
export let add_discount_rules = add_discount_rules_impl();
export let create_one_trx = (trx) => create_one_impl(trx);
export let create_one = create_one_impl();

export async function add_volume_pricing({ name = "Volume Pricing Promotion", description = "Volume Pricing Promotion", end_date, start_date, priority, status_id, rules = [] }) {
  let trx = await start_trx();
  try {
    let promotion = await create_one_trx(trx)({ type_id: promotion_types.VOLUME_DISCOUNT, name, description, end_date, start_date, priority, status_id })
    await add_discount_rules_trx(trx)(promotion.id, rules);
    await commit_trx(trx);
    return promotion;
  } catch(err) {
    rollback_trx(trx);
    throw new InternalError({ raw: err.message });
  }
}
