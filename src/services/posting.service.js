import * as AttachmentService from "./attachment.service.js";
import * as CategoryService from "./category.service.js";
import objection from "objection";
import { Posting, PostingStatus, Attribute } from "../models/index.js";
import { InternalError } from "../utils/errors.js";
import { format_relations } from "../utils/index.js";

const { raw } = objection;

function create_one_impl(trx) {
  return async (payload) => await Posting.query(trx).insert(payload);
}

export async function start_transaction() {
  return await Posting.startTransaction();
}

export const create_one = create_one_impl();
export const create_one_trx = (trx) => create_one_impl(trx);

export async function create_posting(payload) {
  const trx = await start_transaction();
  try {
    const {
      title,
      description,
      attachments,
      category_id,
      formatted_address,
      lat,
      lon,
      district_id,
      region_id,
      cover_index,
      currency_code,
      price,
      created_by,
      params,
    } = payload;

    const attribute_set = Object.values(params)
      .flatMap((param) => [param.parent, ...param.value])
      .map((v) => v.split("|")[1]);

    const cover = attachments[cover_index];
    const posting = await create_one_trx(trx)({
      title,
      description,
      cover_url: cover.url,
      status_id: 3,
      created_by,
      attribute_set,
    });

    const att = await Promise.all(
      attachments.map((a) =>
        AttachmentService.create_one_trx(trx)({ resource_id: a.id, service: "CF_IMAGES" })
      )
    );

    const categories = await CategoryService.get_parents(category_id);
    await posting.$relatedQuery("attachments", trx).relate(att);
    await posting.$relatedQuery("categories", trx).relate(
      categories.map((c) => ({
        ...c,
        relation: c.id === Number(category_id) ? "DIRECT" : "PARENT",
      }))
    );
    await posting.$relatedQuery("location", trx).insert({
      formatted_address,
      coords: raw(`point(${lat}, ${lon})`),
      district_id,
      region_id,
    });

    await posting.$relatedQuery("price", trx).insert({ currency_code, price });
    await trx.commit();
  } catch (err) {
    console.log({ err });
    trx.rollback();
    throw new InternalError();
  }
}

async function cursor_paginate(model, list = [], excludes = []) {
  const first = list[0];
  const last = list[list.length - 1];

  const has_next =
    last && !!(await model.query().findOne("id", "<", last.id).whereNotIn("id", excludes));
  const has_prev =
    first && !!(await model.query().findOne("id", ">", first.id).whereNotIn("id", excludes));

  return { list, has_next, has_prev };
}

export async function get_one(id) {
  if (!id) return;
  return await Posting.query().findById(id).withGraphFetched("[attachments, location]");
}

export async function get_by_hash_id(hash_id, relations = ["attachments", "location"]) {
  if (!hash_id) return;
  return await Posting.query()
    .select(
      "title",
      "description",
      "postings.created_at",
      "postings.id",
      "attribute_set",
      "url",
      "cover_url",
      "er.to_currency as currency_code",
      raw("round(price * rate) as price")
    )
    .findOne({ hash_id })
    .join("posting_prices as pp", "postings.id", "pp.posting_id")
    .join("exchange_rates as er", "er.from_currency", "pp.currency_code")
    .where("er.to_currency", "=", "UZS")
    .withGraphFetched(format_relations(relations));
}

export async function get_attributes({ attribute_set = [], lang = "en" }) {
  return await Attribute.query()
    .whereIn("id", attribute_set)
    .withGraphFetched("translation")
    .modifyGraph("translation", (builder) =>
      builder.where({ language_code: lang.substring(0, 2) })
    );
}

export async function get_many({
  currency = "UZS",
  status_id = 1,
  limit = 15,
  after,
  before,
} = {}) {
  const list = await Posting.query()
    .select(
      "title",
      "description",
      "postings.id",
      "cover_url",
      "url",
      "status_id",
      "exchange_rates.to_currency as currency",
      "postings.created_at as created_at",
      "postings.id as id",
      raw("round(price * rate) as price")
    )
    .where({ status_id })
    .join("posting_prices as pp", "postings.id", "pp.posting_id")
    .join("exchange_rates", "exchange_rates.from_currency", "pp.currency_code")
    .where("exchange_rates.to_currency", "=", currency)
    .groupBy(
      "exchange_rates.to_currency",
      "exchange_rates.rate",
      "postings.title",
      "postings.description",
      "postings.id",
      "pp.price"
    )
    .withGraphFetched("location")
    .limit(limit);

  return await cursor_paginate(Posting, list);
}

export async function get_statuses({ lang = "en" }) {
  return await PostingStatus.query()
    .select("pst.name as name", "posting_statuses.id", "posting_statuses.code")
    .join("posting_status_translations as pst", "pst.status_id", "posting_statuses.id")
    .where({ language_code: lang.substring(0, 2) });
}

export async function update_one(id, update) {
  return await Posting.query().findById(id).patch(update);
}
