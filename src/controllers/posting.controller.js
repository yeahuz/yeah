import * as CategoryService from "../services/category.service.js";
import * as S3Service from "../services/s3.service.js";
import * as AttachmentService from "../services/attachment.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import * as PostingService from "../services/posting.service.js";
import * as AttributeService from "../services/attribute.service.js";
import * as RegionService from "../services/region.service.js";
import * as ChatService from "../services/chat.service.js";
import { render_file } from "../utils/eta.js";
import { array_to_tree, parse_url, generate_srcset, option, add_t } from "../utils/index.js";
import { redis_client } from "../services/redis.service.js";
import { new_posting_schema } from "../schemas/new-posting.schema.js";
import { async_pool_all } from "../utils/async-pool.js";

export async function update_attachment(req, reply) {
  const { id, attachment_id } = req.params;
  const { return_to } = req.query;
  const { _action } = req.body;

  switch (_action) {
    case "delete_attachment": {
      const existing = JSON.parse((await redis_client.get(id)) || null) || {};
      const attachments = existing.attachments?.filter((f) => f.id !== attachment_id);
      await redis_client.set(id, JSON.stringify(Object.assign(existing, { attachments })));
      const [result, err] = await option(CFImageService.delete_one(attachment_id));
    }
    default:
      break;
  }

  reply.redirect(return_to);
  return reply;
}

export async function upload_attachments(req, reply) {
  const { return_to = "/" } = req.query;
  const { id } = req.params;
  const files = req.files();
  const results = await async_pool_all(20, files, CFImageService.upload);
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};
  const attachments = (existing.attachments || []).concat(
    results.map(CFImageService.get_cf_image_url)
  );

  await redis_client.set(id, JSON.stringify(Object.assign(existing, { attachments })));

  reply.redirect(return_to);
  return reply;
}

export async function delete_attachment(req, reply) {
  const { attachment_id, id } = req.params;
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};
  const attachments = existing.attachments?.filter((f) => f.id !== attachment_id);
  await redis_client.set(id, JSON.stringify(Object.assign(existing, { attachments })));
  const [result, err] = await option(CFImageService.delete_one(attachment_id));
  reply.send({ status: "oke" });
  return reply;
}

export async function sync_attachments(req, reply) {
  const { id } = req.params;
  const { photo_id } = req.body;
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};

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
  const { id } = req.params;
  const { title, category_id } = req.body;
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};
  await redis_client.set(id, JSON.stringify(Object.assign(existing, { title, category_id })));
  reply.redirect(`/postings/wizard/${id}/2`);
}

export async function submit_second_step(req, reply) {
  const { id } = req.params;
  const body = req.body;
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};
  await redis_client.set(id, JSON.stringify(Object.assign(existing, body)));
  reply.redirect(`/postings/wizard/${id}/3`);
  return reply;
}

// TODO: This function is fucking shit. Fix this.
export async function submit_second_step_old(req, reply) {
  const { id } = req.params;

  let fields;
  let uploaded_files = [];
  for await (const result of S3Service.upload_multiple(req.files())) {
    const { fields: result_fields, attachment } = result;
    if (!fields) fields = result_fields;

    if (attachment) {
      const photo = await AttachmentService.create_one(attachment);
      uploaded_files.push(photo);
    }
  }

  let body = {};
  for (const key of Object.keys(fields)) {
    const field = fields[key];
    if (Array.isArray(field)) {
      body[key] = field.filter((k) => !k.file).map((k) => k.value);
    } else if (!field.file && field.value) {
      body[key] = field.value;
    }
  }

  const existing = JSON.parse((await redis_client.get(id)) || null) || {};

  uploaded_files = existing.uploaded_files
    ? (existing.uploaded_files || []).concat(uploaded_files)
    : uploaded_files;

  await redis_client.set(
    id,
    JSON.stringify(Object.assign(existing, Object.assign(body, { uploaded_files })))
  );

  reply.redirect(`/postings/wizard/${id}/3`);
}

export async function submit_third_step(req, reply) {
  const { id } = req.params;
  const { location, phone } = req.body;
  const [formatted_address, lat, lon, district_id, region_id] = location.split("|");
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};
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
  reply.redirect(`/postings/wizard/${id}/4`);
}

export async function submit_fourth_step(req, reply) {
  const { id } = req.params;
  const user = req.user;
  const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
  await PostingService.create_posting(Object.assign(posting_data, { created_by: user.id }));
  reply.redirect(req.url);
  return reply;
}

export async function get_step(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const user = req.user;
  const t = req.i18n.t;
  const { id, step } = req.params;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-posting" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  const posting_top = await render_file("/posting/new/top.html", {
    step,
    t,
    wizard_id: id,
  });
  stream.push(posting_top);

  let rendered_step;

  switch (step) {
    case 1: {
      const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      const categories = await CategoryService.get_many({ lang: req.language });
      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        categories: array_to_tree(categories),
        t,
        posting_data,
      });
      break;
    }
    case 2: {
      const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      const valid = req.validateInput(posting_data, new_posting_schema.essential.body);
      if (!valid) {
        rendered_step = await render_file("/partials/404.html", { t });
        break;
      }

      const attributes = await AttributeService.get_category_attributes({
        category_set: [Number(posting_data.category_id)],
        lang: req.language,
      });

      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        id,
        step,
        t,
        posting_data,
        generate_srcset,
        attributes: array_to_tree(attributes),
      });
      break;
    }
    case 3: {
      const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      const valid = req.validateInput(posting_data, new_posting_schema.general.body);
      if (!valid) {
        rendered_step = await render_file("/partials/404.html", { t });
        break;
      }
      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        t,
        posting_data,
      });
      break;
    }
    case 4: {
      const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      const valid = req.validateInput(posting_data, new_posting_schema.contact.body);
      if (!valid) {
        rendered_step = await render_file("/partials/404.html", { t });
        break;
      }

      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        t,
        posting_data,
        generate_srcset,
        user,
      });
      break;
    }
    default:
      rendered_step = await render_file("/partials/404.html", { t });
      break;
  }
  stream.push(rendered_step);

  if (!req.partial) {
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

export async function get_new(req, reply) {
  const id = Math.random().toString(32).slice(2);
  reply.code(302).redirect(`/postings/wizard/${id}/1`);
}

export async function get_contact(req, reply) {
  const { hash_id } = req.params;
  const { region_id } = req.query;
  const flash = reply.flash();
  const stream = reply.init_stream();
  const t = req.i18n.t;
  const user = req.user;

  const posting = PostingService.get_by_hash_id(hash_id, ["creator"]);

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: {
        title: t("contact_user", { ns: "profile", name: (await posting).creator.name }),
        lang: req.language,
      },
      user,
      t,
    });
    stream.push(top);
  }

  const [categories, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language }),
    RegionService.get_regions({ lang: req.language }),
  ]);

  const contact = await render_file("/posting/contact", {
    posting: await posting,
    t,
    flash,
    user,
    categories: array_to_tree(categories),
    region_id,
    regions,
  });
  stream.push(contact);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { user, t, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function contact(req, reply) {
  const t = req.i18n.t;
  const user = req.user;
  const { posting_id, creator_id } = req.query;
  const { content } = req.body;
  const chats = await ChatService.get_posting_chats(posting_id);
  const [chat, err] = await option(
    (await ChatService.get_member_chat(user.id, chats)) ||
      ChatService.create_chat({
        created_by: user.id,
        posting_id,
        members: [creator_id, user.id],
      })
  );

  if (err) {
    req.flash("err", err.build(t));
    reply.redirect(add_t(req.url));
    return reply;
  }

  const [sent, sent_err] = await option(
    ChatService.create_message({
      chat_id: chat.id,
      content,
      sender_id: user.id,
    })
  );

  if (sent_err) {
    req.flash("err", sent_err.build(t));
    reply.redirect(add_t(req.url));
    return reply;
  }

  req.flash("success", { message: t("message_sent", { ns: "success" }) });
  reply.redirect(add_t(req.url));
  return reply;
}

export async function get_one(req, reply) {
  const { hash_id } = req.params;
  const { region_id } = req.query;
  const stream = reply.init_stream();
  const t = req.i18n.t;
  const user = req.user;

  const posting = PostingService.get_by_hash_id(hash_id, ["attachments", "location", "creator"]);

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: (await posting).title, lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const [categories, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language }),
    RegionService.get_regions({ lang: req.language }),
  ]);

  const single = await render_file("/posting/single.html", {
    regions,
    categories: array_to_tree(categories),
    region_id,
    posting: await posting,
    t,
    generate_srcset,
    lang: req.language,
    user,
    attributes: array_to_tree(
      await PostingService.get_attributes({
        attribute_set: (await posting).attribute_set,
        lang: req.language,
      })
    ),
  });
  stream.push(single);

  if (!req.partial) {
    const bottom = await render_file("/partials/bottom.html", { user, t, url: parse_url(req.url) });
    stream.push(bottom);
  }

  stream.push(null);
  return reply;
}

export async function submit_step(req, reply) {
  const { step = "1", ...data } = req.body;
  req.session.set("new-posting", JSON.stringify(data));
  reply.redirect(`/postings/new?step=${parseInt(step, 10) + 1}`);
}
