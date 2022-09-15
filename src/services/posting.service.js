import * as AttachmentService from "./attachment.service.js";
import * as CategoryService from "./category.service.js";
import objection from "objection";
import { Posting } from "../models/index.js";
import { InternalError } from "../utils/errors.js";

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
      ...rest
    } = payload;

    const attributes = Object.entries(rest)
      .filter(([key]) => /\d/.test(key))
      .flatMap(([_, value]) => value);

    const cover = attachments[cover_index];
    const posting = await create_one_trx(trx)({
      title,
      description,
      cover_url: cover.url,
      status_id: 3,
    }); // status_id = 3 means moderation;

    const attachments_to_insert = attachments.map((attachment) => ({
      resource_id: attachment.id,
      name: attachment.name || attachment.filename,
      service: "CF_IMAGES",
    }));

    const att = await AttachmentService.createt_one_trx_v2(trx)(attachments_to_insert);
    const categories = await CategoryService.get_parents(category_id);
    await posting.$relatedQuery("attachments", trx).relate(att);
    await posting.$relatedQuery("categories", trx).relate(categories);
    await posting.$relatedQuery("location", trx).insert({
      formatted_address,
      coords: raw(`point(${lat}, ${lon})`),
      district_id: 467,
      region_id: 29,
    });

    await posting.$relatedQuery("attributes", trx).relate(attributes);
    await posting.$relatedQuery("price", trx).insert({ currency_code, price });
    await trx.commit();
  } catch (err) {
    console.log({ err });
    trx.rollback();
    throw new InternalError();
  }
}

export async function get_many({ currency = "USD" } = {}) {
  return await Posting.query()
    .select(
      "title",
      "description",
      "postings.id",
      "cover_url",
      "exchange_rates.to_currency as currency",
      "postings.created_at as created_at",
      "postings.id as id",
      raw("round(price * rate) as price")
    )
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
    .withGraphFetched("location");
}
