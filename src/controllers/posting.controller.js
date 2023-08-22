import * as CategoryService from "../services/category.service.js";
import * as S3Service from "../services/s3.service.js";
import * as AttachmentService from "../services/attachment.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import * as PostingService from "../services/posting.service.js";
import * as AttributeService from "../services/attribute.service.js";
import * as RegionService from "../services/region.service.js";
import * as ChatService from "../services/chat.service.js";
import { render_file } from "../utils/eta.js";
import { array_to_tree, generate_srcset, option, add_t } from "../utils/index.js";
import { redis_client } from "../services/redis.service.js";
import { new_posting_schema } from "../schemas/new-posting.schema.js";
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
  reply.redirect(`/postings/wizard/${id}/2`);
}

export async function submit_second_step(req, reply) {
  let { id } = req.params;
  let body = req.body;
  let existing = JSON.parse((await redis_client.get(id)) || null) || {};
  await redis_client.set(id, JSON.stringify(Object.assign(existing, body)));
  reply.redirect(`/postings/wizard/${id}/3`);
  return reply;
}

// TODO: This function is fucking shit. Fix this.
export async function submit_second_step_old(req, reply) {
  let { id } = req.params;

  let fields;
  let uploaded_files = [];
  for await (let result of S3Service.upload_multiple(req.files())) {
    let { fields: result_fields, attachment } = result;
    if (!fields) fields = result_fields;

    if (attachment) {
      let photo = await AttachmentService.create_one(attachment);
      uploaded_files.push(photo);
    }
  }

  let body = {};
  for (let key of Object.keys(fields)) {
    let field = fields[key];
    if (Array.isArray(field)) {
      body[key] = field.filter((k) => !k.file).map((k) => k.value);
    } else if (!field.file && field.value) {
      body[key] = field.value;
    }
  }

  let existing = JSON.parse((await redis_client.get(id)) || null) || {};

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
  reply.redirect(`/postings/wizard/${id}/4`);
  return reply;
}

export async function submit_fourth_step(req, reply) {
  let { id } = req.params;
  let { err_to } = req.query;
  let t = req.t;
  let user = req.user;
  let posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
  let [_, err] = await option(PostingService.create_posting(Object.assign(posting_data, { created_by: user.id })));

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
  let { id, step } = req.params;

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: t("title", { ns: "new-posting" }), lang: req.language },
      t,
      user,
    });
    stream.push(top);
  }

  let posting_top = await render_file("/posting/new/top.html", {
    step,
    t,
    wizard_id: id,
  });
  stream.push(posting_top);

  let rendered_step;

  switch (step) {
    case 1: {
      let posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      let categories = await CategoryService.get_many({ lang: req.language, format: "tree" });
      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        categories,
        t,
        posting_data,
      });
      break;
    }
    case 2: {
      let posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      let valid = req.validateInput(posting_data, new_posting_schema.essential.body);
      if (!valid) {
        rendered_step = await render_file("/partials/404.html", { t });
        break;
      }

      let attributes = await AttributeService.get_category_attributes({
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
      let posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      let valid = req.validateInput(posting_data, new_posting_schema.general.body);
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
      let posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      let valid = req.validateInput(posting_data, new_posting_schema.contact.body);
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
        id
      });
      break;
    }
    default:
      rendered_step = await render_file("/partials/404.html", { t });
      break;
  }
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
  reply.code(302).redirect(`/postings/wizard/${id}/1`);
}

export async function get_contact(req, reply) {
  let { hash_id } = req.params;
  let { region_id } = req.query;
  let flash = reply.flash();
  let stream = reply.init_stream();
  let t = req.i18n.t;
  let user = req.user;

  let posting = PostingService.get_by_hash_id({ hash_id, relation: { creator: true } });

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: {
        title: t("contact_user", { ns: "profile", name: (await posting).creator.name }),
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

  let contact = await render_file("/posting/contact", {
    posting: await posting,
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
  let { posting_id, creator_id } = req.query;
  let { content } = req.body;
  let chats = await ChatService.get_posting_chats(posting_id);
  let chat = await ChatService.get_member_chat(user.id, chats)

  if (!chat) {
    let [new_chat, err] = await option(ChatService.create_chat({
      created_by: user.id,
      posting_id,
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

  let posting = PostingService.get_by_hash_id({ hash_id, relation: { attachments: true, creator: true } });

  if (!req.partial) {
    let top = await render_file("/partials/top.html", {
      meta: { title: (await posting).title, lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  let [categories, regions] = await Promise.all([
    CategoryService.get_many({ lang: req.language, format: "tree" }),
    RegionService.get_regions({ lang: req.language }),
  ]);

  let single = await render_file("/posting/single.html", {
    regions,
    categories,
    region_id,
    posting: await posting,
    t,
    generate_srcset,
    lang: req.language,
    user,
    attributes: await AttributeService.get_many({ attribute_set: (await posting).attribute_set, lang: req.language }),
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
  let { step = "1", ...data } = req.body;
  req.session.set("new-posting", JSON.stringify(data));
  reply.redirect(`/postings/new?step=${parseInt(step, 10) + 1}`);
}
