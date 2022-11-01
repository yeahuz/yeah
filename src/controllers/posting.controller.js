import * as CategoryService from "../services/category.service.js";
import * as S3Service from "../services/s3.service.js";
import * as AttachmentService from "../services/attachment.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import * as PostingService from "../services/posting.service.js";
import * as RegionService from "../services/region.service.js";
import { render_file } from "../utils/eta.js";
import { array_to_tree, parse_url, generate_srcset, option } from "../utils/index.js";
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
      const fields = await CategoryService.get_fields({
        category_id: posting_data.category_id,
        lang: req.language,
      });
      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        id,
        step,
        fields,
        t,
        posting_data,
        generate_srcset,
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

export async function get_one(req, reply) {
  const flash = reply.flash();
  const stream = reply.init_stream();
  const { hash_id } = req.params;
  const t = req.i18n.t;
  const user = req.user;
  const { region_id } = req.query;

  if (!req.partial) {
    const top = await render_file("/partials/top.html", {
      meta: { title: t("home", { ns: "common" }), lang: req.language },
      user,
      t,
    });
    stream.push(top);
  }

  const categories = await CategoryService.get_by_parent({ lang: req.language });
  const regions = await RegionService.get_regions({ lang: req.language });
  const search_top = await render_file("/search/top.html", {
    t,
    user,
    categories,
    region_id,
    regions,
  });
  stream.push(search_top);

  const posting = await PostingService.get_by_hash_id(hash_id, [
    "attachments",
    "location",
    "attributes.[field.[translation], translation]",
  ]);

  const single = await render_file("/posting/single.html", { posting, t, generate_srcset });
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
