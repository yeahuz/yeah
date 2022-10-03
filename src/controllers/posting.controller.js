import * as CategoryService from "../services/category.service.js";
import * as S3Service from "../services/s3.service.js";
import * as AttachmentService from "../services/attachment.service.js";
import * as CFImageService from "../services/cfimg.service.js";
import * as PostingService from "../services/posting.service.js";
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
  const { attachments = [] } = req.body;
  const existing = JSON.parse((await redis_client.get(id)) || null) || {};
  const clean_attachments = (existing.attachments || []).concat(
    attachments.map(CFImageService.get_cf_image_url)
  );

  await redis_client.set(
    id,
    JSON.stringify(Object.assign(existing, { attachments: clean_attachments }))
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
  const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
  await PostingService.create_posting(posting_data);
  reply.redirect(req.url);
  return reply;
  // const {
  //   title,
  //   description,
  //   attachments,
  //   district_id,
  //   region_id,
  //   formatted_address,
  //   category_id,
  // } = posting_data;
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
      const valid = req.validateInput(posting_data, new_posting_schema.essential);
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
      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        t,
        posting_data,
      });
      break;
    }
    case 4: {
      const posting_data = JSON.parse((await redis_client.get(id)) || null) || {};
      const fields = await CategoryService.get_fields({
        category_id: posting_data.category_id,
        lang: req.language,
      });
      let number_keys = {};
      for (const [key, value] of Object.entries(posting_data)) {
        if (/\d/.test(key)) number_keys[key] = value;
      }
      const paramaters = [];
      for (const field of fields) {
        const found = number_keys[field.id];
        if (number_keys[field.id]) {
          field.values = field.values.filter((value) => {
            if (Array.isArray(found)) return found.includes(String(value.id));
            return found === String(value.id);
          });
          paramaters.push(field);
        }
      }

      rendered_step = await render_file(`/posting/new/step-${step}`, {
        flash,
        t,
        posting_data,
        generate_srcset,
        paramaters,
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

export async function submit_step(req, reply) {
  const { step = "1", ...data } = req.body;
  req.session.set("new-posting", JSON.stringify(data));
  reply.redirect(`/postings/new?step=${parseInt(step, 10) + 1}`);
}
