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

    const cover = attachments[cover_index || 0];
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

export async function get_one({ id, relations = [], modify } = {}) {
  if (!id) return;
  return await Posting.query().findById(id).modify(modify).withGraphFetched(format_relations(relations));
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
  status_id,
  limit = 15,
  lang = "en",
  cursor,
  direction
} = {}) {
  const knex = Posting.knex();
  const list = await knex.with("t1",
    knex()
      .from("postings")
      .join("posting_status_translations as pst", "postings.status_id", "pst.status_id")
      .join("posting_statuses as ps", "postings.status_id", "ps.id")
      .where("pst.language_code", "=", lang.substring(0, 2))
      .join("posting_prices as pp", "postings.id", "pp.posting_id")
      .join("exchange_rates", "exchange_rates.from_currency", "pp.currency_code")
      .join("posting_location", "postings.id", "posting_location.posting_id")
      .where("exchange_rates.to_currency", "=", currency)
      .select(
        "title",
        "description",
        "postings.id",
        "cover_url",
        "url",
        "postings.created_at as created_at",
        "exchange_rates.to_currency as currency",
        knex.raw("round(price * rate) as price"),
        knex.raw("(json_build_object('id', ps.id, 'name', pst.name, 'code', ps.code, 'bg_hex', ps.bg_hex, 'fg_hex', ps.fg_hex)) as status"),
        knex.raw("(json_agg(posting_location.*) ->> 0)::json as location")
      )
      .groupBy(["postings.id", "pst.id", "pp.price", "exchange_rates.rate", "ps.id", "exchange_rates.to_currency"])
      .orderBy("postings.id", direction === "before" ? "asc" : direction === "after" ? "desc" : "desc")
      .modify((qb) => {
        if (direction === "after") {
          qb.where("postings.id", "<", cursor);
        } else if (direction === "before") {
          qb.where("postings.id", ">", cursor);
        }
        if (status_id) {
          qb.where("postings.status_id", "=", status_id);
        }
      })
      .limit(limit)
  ).select("*").from("t1").orderBy("id", "desc")

  return await cursor_paginate(Posting, list);
}

get_many({ limit: 2, direction: "before", cursor: 2 });

export async function get_statuses({ lang = "en" }) {
  return await PostingStatus.query()
    .select("pst.name as name", "posting_statuses.id", "posting_statuses.code", "posting_statuses.bg_hex", "posting_statuses.fg_hex")
    .join("posting_status_translations as pst", "pst.status_id", "posting_statuses.id")
    .where({ language_code: lang.substring(0, 2) });
}

export async function update_one(id, update) {
  return await Posting.query().findById(id).patch(update);
}
