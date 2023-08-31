import { query, start_trx } from "./db.service.js";

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

export async function create_one({ type_id, name, description, end_date, start_date, priority, status_id = promotion_statuses.DRAFT }) {
  let { rows } = await query(`insert into promotions (type_id, name, description, end_date, start_date, priority, status_id)
    values ($1, $2, $3, $4, $5, $6, $7) returning id`, [type_id, name, description, end_date, start_date, priority, status_id]);

  return rows[0];
}

export async function add_discount_rules(promotion_id, rules = []) {
  for (let rule of rules) {
    let { rows: [inserted_rule] } = await query(`insert into discount_rules (promotion_id, rule_order) values ($1, $2) returning id`, [promotion_id, rule.order]);
    let { rows: [inserted_spec] } = await query(`insert into discount_specifications (discount_rule_id, min_quantity, min_amount, for_each_quantity, for_each_amount, min_amount_currency, for_each_amount_currency)
      values ($1, $2, $3, $4, $5, $6, $7)`, Object.values(Object.assign(rule.specification, { discount_rule_id: inserted_rule.id })));

    await query(`insert into discount_benefits (discount_specification_id, unit, value, currency)
      values ($1, $2, $3, $4, $5, $6, $7)`, Object.values(Object.assign(rule.benefit, { discount_specification_id: inserted_spec.id })));
  }
}
