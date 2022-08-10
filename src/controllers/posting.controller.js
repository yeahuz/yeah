import { render_file } from '../utils/eta.js';import { array_to_tree, add_t, parse_url } from '../utils/index.js';import { redis_client } from '../services/redis.service.js';import { new_posting_schema } from '../schemas/new-posting.schema.js';import * as CategoryService from '../services/category.service.js';import * as S3Service from '../services/s3.service.js';import * as AttachmentService from '../services/attachment.service.js';export async function update_attachment(req, reply) {  const {  id, attachment_id  } = req.params  const { return_to } = req.query;  const { _action } = req.body  switch (_action) {    case "delete_attachment": {      const attachment = await AttachmentService.get_one(attachment_id);      await S3Service.delete_one(attachment.s3_key);      await AttachmentService.delete_one(attachment.id);      const existing = JSON.parse(await redis_client.get(id));      const uploaded_files = existing.uploaded_files?.filter(f => f.id !== attachment_id);      await redis_client.set(id, JSON.stringify(Object.assign(existing, { uploaded_files })))    }    default:      break;  }  reply.redirect(add_t(return_to));}export async function delete_attachment(req, reply) {  const { attachment_id, id } = req.params;  const attachment = await AttachmentService.get_one(attachment_id);  await S3Service.delete_one(attachment.s3_key);  await AttachmentService.delete_one(attachment.id);  const existing = JSON.parse(await redis_client.get(id) || null) || {};  const uploaded_files = existing.uploaded_files?.filter(f => f.id !== attachment_id);  await redis_client.set(id, JSON.stringify(Object.assign(existing, { uploaded_files })))  return { status: "oke" }}export async function submit_first_step(req, reply) {  const { id } = req.params;  const { title, category_id } = req.body;  const existing = JSON.parse(await redis_client.get(id) || null) || {};  await redis_client.set(id, JSON.stringify(Object.assign(existing, { title, category_id })))  reply.redirect(`/postings/wizard/${id}/2`);}// TODO: This function is fucking shit. Fix this.export async function submit_second_step(req, reply) {  const { id } = req.params;  const files = req.files();  let fields;  let uploaded_files = [];  for await (const result of S3Service.upload_multiple(req.files())) {    const { fields: result_fields, attachment } = result;    if (!fields) fields = result_fields;    if (attachment) {      const photo = await AttachmentService.create_one(attachment)      uploaded_files.push(photo);    }  }  let body = {}  for (const key of Object.keys(fields)) {    const field = fields[key];    if (Array.isArray(field)) {      body[key] = field.filter(k => !k.file).map(k => k.value);    }    else if (!field.file && field.value) {      body[key] = field.value;    }  }  const existing = JSON.parse(await redis_client.get(id) || null) || {};  uploaded_files = existing.uploaded_files ? (existing.uploaded_files || []).concat(uploaded_files) : uploaded_files;  await redis_client.set(id, JSON.stringify(Object.assign(existing, Object.assign(body, { uploaded_files }))));  reply.redirect(`/postings/wizard/${id}/3`);}export async function submit_third_step(req, reply) {  const { id } = req.params;  const { location, phone } = req.body;  const [formatted_address, lat, lon, district_id, region_id] = location.split("|");  const existing = JSON.parse(await redis_client.get(id) || null) || {}  await redis_client.set(id, JSON.stringify(Object.assign(existing, { formatted_address, lat, lon, district_id, region_id, location, phone })));  reply.redirect(`/postings/wizard/${id}/4`);}export async function get_step(req, reply) {  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";  const flash = reply.flash();  const stream = reply.init_stream();  const user = req.user;  const t = req.i18n.t  const { id, step } = req.params;  if (!is_navigation_preload) {    const top = await render_file("/partials/top.html", {      meta: { title: t("title", { ns: "new-posting" }), lang: req.language },      t,      user    });    stream.push(top)  }  const posting_top = await render_file("/posting/new/top.html", { step, t, wizard_id: id })  stream.push(posting_top);  let rendered_step  switch(step) {    case "1": {      const posting_data = JSON.parse(await redis_client.get(id) || null) || {};      const categories = await CategoryService.get_many({ lang: req.language });      rendered_step = await render_file(`/posting/new/step-${step}`, { flash, categories: array_to_tree(categories), t, posting_data });      break;    }    case "2": {      const posting_data = JSON.parse(await redis_client.get(id) || null) || {};      const valid = req.validateInput(posting_data, new_posting_schema.essential);      if (!valid) {        rendered_step = await render_file("/partials/404.html", { t });        break;      }      const fields = await CategoryService.get_fields({ category_id: posting_data.category_id, lang: req.language });      rendered_step = await render_file(`/posting/new/step-${step}`, { flash, id, step, fields, t, posting_data })      break;    }    case "3": {      const posting_data = JSON.parse(await redis_client.get(id) || null) || {}      rendered_step = await render_file(`/posting/new/step-${step}`, { flash, t, posting_data });      break;    }    case "4": {      const posting_data = JSON.parse(await redis_client.get(id) || null) || {}      rendered_step = await render_file(`/posting/new/step-${step}`, { flash, t, posting_data });      break;    }    default:      rendered_step = await render_file("/partials/404.html", { t });      break  }  stream.push(rendered_step)  if (!is_navigation_preload) {    const bottom = await render_file("/partials/bottom.html", { t, url: parse_url(req.url), user });    stream.push(bottom);  }  stream.push(null);  return reply;}export async function get_new(req, reply) {  const id = Math.random().toString(32).slice(2);  reply.code(302).redirect(`/postings/wizard/${id}/1`);}export async function submit_step(req, reply) {  const { step = "1", ...data} = req.body  req.session.set("new-posting", JSON.stringify(data));  reply.redirect(`/postings/new?step=${parseInt(step, 10) + 1}`);}