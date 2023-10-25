import * as CategoryService from "../services/category.service.js";
import * as S3Service from "../services/s3.service.js";
import * as AttachmentService from "../services/attachment.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import * as ListingService from "../services/listing.service.js";
import * as InventoryService from "../services/inventory.service.js";
import * as PromotionService from "../services/promotion.service.js";
import * as AttributeService from "../services/attribute.service.js";
import * as RegionService from "../services/region.service.js";
import * as ChatService from "../services/chat.service.js";
import { render_file } from "../utils/eta.js";
import { generate_srcset, option, add_t } from "../utils/index.js";
import { redis_client } from "../services/redis.service.js";
import { async_pool_all } from "../utils/async-pool.js";
import { cartesian } from "../utils/index.js";

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
        CategoryService.get_many({ lang: req.language, format: "tree", relation: { translation: true } })
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
      let listing = await ListingService.get_one({ id, relation: { attachments: true, price: true, policy: true } });
      let variants = await ListingService.get_variants(listing);
      let attributes = [];
      let selected_attributes = [];
      if (listing) {
        attributes = await AttributeService.get_category_attributes_2({ category_id: listing.category_id, lang: req.language });
        selected_attributes = await ListingService.resolve_attribute_options(listing.attribute_options, req.language);
      };
      rendered_step = await render_file(`/listing/new/step-${step}`, {
        flash,
        listing,
        step,
        generate_srcset,
        attributes,
        t,
        variants,
        selected_attributes
      });
    } break;
    case "3": {
      let listing = await ListingService.get_one({ id, relation: { price: true } });
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

export async function get_attrs(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let id = req.params.id;
  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-listing" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let listing = await ListingService.get_one({ id });
  let attributes = await AttributeService.get_category_attributes_2({ category_id: listing.category_id, enabled_for_variations: true, lang: req.language });
  let attrs = await render_file("/listing/variations/attrs.html", { attributes, listing, t });
  stream.push(attrs);

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

export async function save_attrs(req, reply) {
  let id = req.params.id;
  let ability = req.ability;
  let return_to = req.query.return_to;
  let { attributes = [] } = req.body;
  let options = [];
  let selected_attributes = [];
  for (let attribute of attributes) {
    if (attribute.options?.length) {
      selected_attributes.push(attribute.id)
      options.push(...attribute.options);
    }
  }
  if (!selected_attributes.length) return reply.redirect(`/listings/wizard/${id}?step=2`);
  await ListingService.update_one(ability, id, { attributes: selected_attributes, attribute_options: options });
  return reply.redirect(return_to);
}


export async function save_combos(req, reply) {
  let { temp_variations } = req.body;
  let id = req.params.id;
  let return_to = req.query.return_to;
  let ability = req.ability;
  await ListingService.update_one(ability, id, { temp_variations: JSON.stringify(temp_variations) });
  return reply.redirect(return_to);
}

export async function get_combos(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let id = req.params.id;
  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-listing" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let listing = await ListingService.get_one({ id });
  let options = await ListingService.resolve_attribute_options(listing.attribute_options, req.language);
  let combos = await render_file("/listing/variations/combos.html", { listing, t, combos: cartesian(options), headers: options.map((c) => c.name) });
  stream.push(combos);

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

export async function get_variations(req, reply) {
  let flash = reply.flash();
  let stream = reply.init_stream();
  let user = req.user;
  let t = req.i18n.t;
  let id = req.params.id;
  let { step = "1" } = req.query;
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

  let listing = await ListingService.get_one({ id });
  let attributes = await AttributeService.get_category_attributes_2({ category_id: listing.category_id, enabled_for_variations: true, lang: req.language });
  let variations = await render_file("/listing/new/variations-wizard.html", { step, attributes, t, listing_id: id });
  stream.push(variations);

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
  let chat = await ChatService.get_member_chat(user.id, chats);

  if (!chat) {
    let [new_chat, err] = await option(ChatService.create_chat({
      created_by: user.id,
      listing_id,
      members: [creator_id, user.id]
    }));

    if (err) {
      req.flash("err", err.build(t));
      reply.redirect(add_t(req.url));
      return reply;
    }

    chat = new_chat;
    redis_client.publish("chats/new", JSON.stringify(chat));
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

  redis_client.publish("messages/new", JSON.stringify(sent));

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
      if (id) return reply.redirect(`/listings/wizard/${id}?step=${next_step}`);
      let listing = await ListingService.create_one({ category_id, title, created_by: user.id, status: "DRAFT" });
      return reply.redirect(`/listings/wizard/${listing.id}?step=${next_step}`);
    }
    case "2": {
      let {
        description,
        currency,
        cover_id,
        unit_price,
        quantity,
        discount_rules = [],
        attributes = {},
        best_offer_enabled,
        best_offer_minimum,
        best_offer_minimum_currency,
        best_offer_autoaccept,
        best_offer_autoaccept_currency,
      } = req.body;
      let [listing] = await Promise.all([
        ListingService.get_one({ id }),
        ListingService.cleanup_skus({ listing_id: id })
      ]);
      if (listing.temp_variations.length) {
        await Promise.all(listing.temp_variations.map((variation) => {
          return ListingService.upsert_sku({ listing_id: id, created_by: user.id, ...variation, attributes: { ...attributes, ...variation.attributes } })
        }));
      } else {
        await ListingService.upsert_sku({ listing_id: id, created_by: user.id, currency, unit_price, quantity, attributes });
      }

      await Promise.all([
        ListingService.update_one(ability, id, { description, cover_id }),
        ListingService.update_policy(listing.policy_id, { best_offer_enabled, best_offer_minimum, best_offer_autoaccept, best_offer_minimum_currency, best_offer_autoaccept_currency }),
        PromotionService.add_volume_pricing({ rules: discount_rules, created_by: user.id })
      ]);

      return reply.redirect(`/listings/wizard/${id}?step=${next_step}`);
    }
    default:
      break;
  }
}
