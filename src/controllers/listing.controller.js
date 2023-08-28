import * as CategoryService from "../services/category.service.js";
import * as S3Service from "../services/s3.service.js";
import * as AttachmentService from "../services/attachment.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import * as ListingService from "../services/listing.service.js";
import * as AttributeService from "../services/attribute.service.js";
import * as RegionService from "../services/region.service.js";
import * as ChatService from "../services/chat.service.js";
import { render_file } from "../utils/eta.js";
import { generate_srcset, option, add_t } from "../utils/index.js";
import { redis_client } from "../services/redis.service.js";
import { async_pool_all } from "../utils/async-pool.js";

export async function update_attachment(req, reply) {
  let { id, attachment_id } = req.params;
  let { return_to } = req.query;
  let { _action } = req.body;

  switch (_action) {
    case "delete_attachment": {
      let existing = JSON.parse((await redis_client.get(id)) || null) || {};
      let attachments = existing.attachments?.filter((f) => f.id !== attachment_id);
      await redis_client.set(id, JSON.stringify(Object.assign(existing, { attachments })));
      let [result, err] = await option(CFImageService.delete_one(attachment_id));
    }
    default:
      break;
  }

  reply.redirect(return_to);
  return reply;
}

export async function upload_attachments(req, reply) {
  let { return_to = "/" } = req.query;
  let { id } = req.params;
  let files = req.files();
  let results = await async_pool_all(20, files, CFImageService.upload);
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};
  let attachments = (existing.attachments || []).concat(
    results.map(CFImageService.get_cf_image_url)
  );

  await redis_client.set(id, JSON.stringify(Object.assign(existing, { attachments })));

  reply.redirect(return_to);
  return reply;
}

export async function delete_attachment(req, reply) {
  let { attachment_id, id } = req.params;
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};
  let attachments = existing.attachments?.filter((f) => f.id !== attachment_id);
  await redis_client.set(id, JSON.stringify(Object.assign(existing, { attachments })));
  let [result, err] = await option(CFImageService.delete_one(attachment_id));
  reply.send({ status: "oke" });
  return reply;
}

export async function sync_attachments(req, reply) {
  let { id } = req.params;
  let { photo_id } = req.body;
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};

  await redis_client.set(
    id,
    JSON.stringify(
      Object.assign(existing, {
        attachments: [
          ...new Set(
            (existing.attachments || []).concat({
              id: photo_id,
              url: CFImageService.get_cf_image_url(photo_id),
            })
          ),
        ],
      })
    )
  );

  reply.send({ status: "oke" });
  return reply;
}

export async function submit_first_step(req, reply) {
  let { id } = req.params;
  let { title, category_id } = req.body;
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};
  await redis_client.set(id, JSON.stringify(Object.assign(existing, { title, category_id })));
  reply.redirect(`/listings/wizard/${id}/2`);
}

export async function submit_second_step(req, reply) {
  let { id } = req.params;
  let body = req.body;
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};
  await redis_client.set(id, JSON.stringify(Object.assign(existing, body)));
  reply.redirect(`/listings/wizard/${id}/3`);
  return reply;
}

export async function submit_third_step(req, reply) {
  let { id } = req.params;
  let { location, phone } = req.body;
  let [formatted_address, lat, lon, district_id, region_id] = location.split("|");
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};
  await redis_client.set(
    id,
    JSON.stringify(
      Object.assign(existing, {
        formatted_address,
        lat,
        lon,
        district_id,
        region_id,
        location,
        phone,
      })
    )
  );
  reply.redirect(`/listings/wizard/${id}/4`);
  return reply;
}

export async function submit_fourth_step(req, reply) {
  let { id } = req.params;
  let { err_to } = req.query;
  let t = req.t;
  let user = req.user;
  let listing_data = JSON.parse((await redis_client.get(id)) || null) || {};
  let [_, err] = await option(ListingService.create_listing(Object.assign(listing_data, { created_by: user.id })));

  if (err) {
    req.flash("err", err.build(t))
    return reply.redirect(err_to)
  }

  reply.redirect(req.url);
  return reply;
}

export async function get_step(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let id = req.params.id;
  let { step = "1", title, category_id } = req.query;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-listing" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let listing_top = await render_file("/listing/new/top.html", {
    step,
    t,
    listing_id: id,
  });
  stream.push(listing_top);

  let rendered_step;

  switch (step) {
    case "1": {
      let [listing, categories] = await Promise.all([
        ListingService.get_one({ id }),
        CategoryService.get_many({ lang: req.language, format: "tree" })
      ]);
      rendered_step = await render_file(`/listing/new/step-${step}`, {
        flash,
        categories,
        t,
        listing,
        title,
        category_id
      });
    } break;
    case "2": {
      let listing = await ListingService.get_one({ id, relation: { attachments: true, price: true } });
      let attributes = [];
      if (listing) {
        attributes = await AttributeService.get_category_attributes({
          category_set: [listing.category_id],
          lang: req.language,
          format: "tree"
        });
      };
      rendered_step = await render_file(`/listing/new/step-${step}`, {
        flash,
        listing,
        step,
        generate_srcset,
        attributes,
        t
      });
    } break;
    case "3": {
      let listing = await ListingService.get_one({ id });
      console.log({ listing });
      rendered_step = await render_file(`/listing/new/step-${step}`, {
        flash,
        t,
        listing
      });
    } break;
    default:
      break;
  }

  // switch (step) {
  //   case 1: {
  //     let listing_data = JSON.parse((await redis_client.get(id)) || null) || {};
  //     let categories = await CategoryService.get_many({ lang: req.language, format: "tree" });
  //     rendered_step = await render_file(`/listing/new/step-${step}`, {
  //       flash,
  //       categories,
  //       t,
  //       listing_data,
  //     });
  //     break;
  //   }
  //   case 2: {
  //     let listing_data = JSON.parse((await redis_client.get(id)) || null) || {};
  //     let valid = req.validateInput(listing_data, new_listing_schema.essential.body);
  //     if (!valid) {
  //       rendered_step = await render_file("/partials/404.html", { t });
  //       break;
  //     }

  //     let attributes = await AttributeService.get_category_attributes({
  //       category_set: [Number(listing_data.category_id)],
  //       lang: req.language,
  //     });

  //     rendered_step = await render_file(`/listing/new/step-${step}`, {
  //       flash,
  //       id,
  //       step,
  //       t,
  //       listing_data,
  //       generate_srcset,
  //       attributes: array_to_tree(attributes),
  //     });
  //     break;
  //   }
  //   case 3: {
  //     let listing_data = JSON.parse((await redis_client.get(id)) || null) || {};
  //     let valid = req.validateInput(listing_data, new_listing_schema.general.body);
  //     if (!valid) {
  //       rendered_step = await render_file("/partials/404.html", { t });
  //       break;
  //     }
  //     rendered_step = await render_file(`/listing/new/step-${step}`, {
  //       flash,
  //       t,
  //       listing_data,
  //     });
  //     break;
  //   }
  //   case 4: {
  //     let listing_data = JSON.parse((await redis_client.get(id)) || null) || {};
  //     let valid = req.validateInput(listing_data, new_listing_schema.contact.body);
  //     if (!valid) {
  //       rendered_step = await render_file("/partials/404.html", { t });
  //       break;
  //     }

  //     rendered_step = await render_file(`/listing/new/step-${step}`, {
  //       flash,
  //       t,
  //       listing_data,
  //       generate_srcset,
  //       user,
  //       id
  //     });
  //     break;
  //   }
  //   default:
  //     rendered_step = await render_file("/partials/404.html", { t });
  //     break;
  // }
  stream.push(rendered_step);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", {
      t,
      user
    });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function get_new(req, reply) {
  let id = Math.random().toString(32).slice(2);
  reply.code(302).redirect(`/listings/wizard/${id}/1`);
}

export async function get_contact(req, reply) {
  let { hash_id } = req.params;
  let { region_id } = req.query;
  let flash = reply.flash();
  let stream = reply.init_stream();
  let t = req.i18n.t;
  let user = req.user;

  let listing = ListingService.get_by_hash_id({ hash_id, relation: { creator: true } });

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: {
        title: t("contact_user", { ns: "profile", name: (await listing).creator.name }),
        lang: req.language,
      },
      user,
      t,
    });
    stream.push(top);
  }

  let [categories, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language, format: "tree" }),
    RegionService.get_regions({ lang: req.language }),
  ]);

  let contact = await render_file("/listing/contact", {
    listing: await listing,
    t,
    flash,
    user,
    categories,
    region_id,
    regions,
  });
  stream.push(contact);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { user, t });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function contact(req, reply) {
  let t = req.i18n.t;
  let user = req.user;
  let { listing_id, creator_id } = req.query;
  let { content } = req.body;
  let chats = await ChatService.get_listing_chats(listing_id);
  let chat = await ChatService.get_member_chat(user.id, chats)

  if (!chat) {
    let [new_chat, err] = await option(ChatService.create_chat({
      created_by: user.id,
      listing_id,
      members: [creator_id, user.id]
    }))

    if (err) {
      req.flash("err", err.build(t));
      reply.redirect(add_t(req.url));
      return reply;
    }

    chat = new_chat
    redis_client.publish("chats/new", JSON.stringify(chat))
  }

  let [sent, sent_err] = await option(
    ChatService.create_message({
      chat_id: chat.id,
      content,
      sender_id: user.id,
      created_at: new Date().toISOString()
    })
  );

  if (sent_err) {
    req.flash("err", sent_err.build(t));
    reply.redirect(add_t(req.url));
    return reply;
  }

  redis_client.publish("messages/new", JSON.stringify(sent))

  req.flash("success", { message: t("message_sent", { ns: "success" }) });
  reply.redirect(add_t(req.url));
  return reply;
}

export async function get_one(req, reply) {
  let { hash_id } = req.params;
  let { region_id } = req.query;
  let stream = reply.init_stream();
  let t = req.i18n.t;
  let user = req.user;

  let listing = ListingService.get_by_hash_id({ hash_id, relation: { attachments: true, creator: true } });

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: (await listing).title, lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  let [categories, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language, format: "tree" }),
    RegionService.get_regions({ lang: req.language }),
  ]);

  let single = await render_file("/listing/single.html", {
    regions,
    categories,
    region_id,
    listing: await listing,
    t,
    generate_srcset,
    lang: req.language,
    user,
    attributes: await AttributeService.get_many({ attribute_set: (await listing).attribute_set, lang: req.language }),
  });
  stream.push(single);

  if (!req.partial) {
    let bottom = await render_file("/partials/bottom.html", { user, t });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function submit_step(req, reply) {
  let step = req.query.step || "1";
  let id = req.params.id;
  let user = req.user;
  let ability = req.ability;
  let { title, category_id } = req.body;

  let next_step = Number(step) + 1;
  switch (step) {
    case "1": {
      if (id) return reply.redirect(`/listings/wizard/${id}?step=${next_step}`)
      let listing = await ListingService.create_one({ category_id, title, created_by: user.id, status: "DRAFT" });
      return reply.redirect(`/listings/wizard/${listing.id}?step=${next_step}`)
    }
    case "2": {
      let { attribute_set, description, currency_code, cover_id, unit_price, quantity = 1 } = req.body;
      await Promise.all([
        ListingService.update_one(ability, id, { attribute_set, description, cover_id }),
        ListingService.upsert_price(ability, { amount, currency_code, id })
      ]);
      return reply.redirect(`/listings/wizard/${id}?step=${next_step}`);
    }
    default:
      break;
  }
}
