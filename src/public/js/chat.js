import { add_listeners, attrs, span, text, html, classes } from "./dom.js";
import { check_icon } from "./icons.js";
import { media_message_tmpl, file_message_tmpl, text_message_tmpl, chat_list_item_tmpl } from "./templates.js";
import {
  option,
  request,
  async_pool,
  upload_request,
  generate_srcset,
  wait,
  gen_id,
  format_relative
} from "./utils.js";
import { toast } from "./toast.js";
import { PackBytes } from "/node_modules/packbytes/packbytes.mjs";

const files_input = document.querySelector(".js-files");
const messages = document.querySelector(".js-messages");
const photos_link_form = document.querySelector(".js-photos-link-form");
const files_link_form = document.querySelector(".js-files-link-form");
const photo_download_btns = document.querySelectorAll(".js-photo-download-btn");
const file_download_btns = document.querySelectorAll(".js-file-download-btn");
const message_form = document.querySelector(".js-message-form");
const chats_list = document.querySelector(".js-chats-list")
// const message_textarea = message_form.querySelector("textarea[name='content']");

const top = window.localStorage.getItem(window.location.pathname);
if (top && messages) messages.scrollTop = parseInt(top, 10);

window.addEventListener("beforeunload", () => {
  const pathname = window.location.pathname;
  if (messages) {
    window.localStorage.setItem(pathname, messages.scrollTop);
  }
});

let ws = null;
let encoder = null;
const listeners = {};

function on(op, callback) {
  listeners[op] = callback;
}

function connect() {
  ws = new WebSocket(`${WS_URI_PUBLIC}/chat`);

  ws.binaryType = "arraybuffer";

  ws.addEventListener("close", async (event) => {
    console.error("Websocket connection closed: ", event)
    await wait(3000);
    connect();
  });

  ws.addEventListener("error", (event) => {
    console.error("ERROR: Websocket connection error: ", event)
    ws.close();
    ws = null;
  });

  ws.addEventListener("message", (e) => {
    if (e.data instanceof ArrayBuffer && encoder) {
      const [op, payload] = encoder.decode(e.data);
      if (listeners[op]) listeners[op](payload);
      return;
    }

    if (!encoder) {
      encoder = new PackBytes(e.data);
    }
  });
}

add_listeners(message_form, {
  submit: on_send_message,
});

function on_send_message(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const textarea = form.querySelector("textarea[name='content']");

  if (ws) {
    const payload = {
      chat_id: data.get("chat_id"),
      content: data.get("content"),
      created_at: Date.now(),
      temp_id: gen_id()
    };

    ws.send(encoder.encode("publish_message", payload));
    if (messages) messages.append(text_message_tmpl(payload, true));

    textarea.focus();
    form.reset();
    scroll_to_bottom(messages);
  }
}

function on_message_sent(message) {
  if (!messages) return
  const item = messages.querySelector("#" + message.temp_id)
  if (!item) return
  item.classList.remove("pointer-events-none");

  const upload_progresses = item.querySelectorAll(".upload-progress");
  upload_progresses.forEach((progress) => progress.remove());

  const date_infos = item.querySelectorAll(".js-date-info");
  for (const info of date_infos) {
    const clock = info.querySelector(".js-date-info-clock");
    if (clock) clock.remove();
    const check = span(html(check_icon({ size: 14 })));
    info.append(check);
  }

  item.setAttribute("id", message.id)
  update_latest_message(message, true)
}

function on_new_message(payload) {
  update_latest_message(payload)
  if (!messages) return
  switch (payload.type) {
    case "text":
      messages.append(text_message_tmpl(payload, false));
      break;
    case "file":
      messages.append(file_message_tmpl(payload, false));
      break;
    default:
      break;
  }

  scroll_to_bottom(messages);
}

async function update_latest_message(payload, you) {
  const { t } = await import("./i18n.js");
  const item = document.getElementById(`chat-${payload.chat_id}`);
  if (item) {
    const latest_date = item.querySelector(".js-latest-date");
    const latest_message = item.querySelector(".js-latest-message");
    if (latest_message) latest_message.textContent = you ? `${t("you", { ns: "chats" })}: ` + payload.content : payload.content
    if (latest_date) latest_date.textContent = format_relative(new Date(payload.created_at), new Date())
  }
}

function on_new_chat(payload) {
  if (chats_list) chats_list.append(chat_list_item_tmpl(payload))
  ws.send(encoder.encode("subscribe", String(payload.id)))
}

on("new_message", on_new_message);
on("message_sent", on_message_sent);
on("new_chat", on_new_chat)

function on_file_done(file, url, is_image) {
  return () => {
    const message = document.getElementById(file.msg_id);
    if (message) {
      const links = message.querySelectorAll("a");
      for (const link of links) {
        link.setAttribute("href", url.public_url);
      }
    }
  }
}

function on_file_progress(file, is_image) {
  return (progress) => {
  };
}

async function on_files_change(e) {
  const files = e.target.files;
  if (!files.length) return;
  const media_msg = { temp_id: gen_id("message"), files: [] }
  const files_msg = { temp_id: gen_id("message"), files: [] }

  for (const file of files) {
    const obj = /(image\/*)/.test(file.type) ? media_msg : files_msg;
    obj.files.push({ temp_id: gen_id("attachment"), msg_id: obj.temp_id, raw: file, meta: { name: file.name, size: file.size, type: file.type } })
  }

  if (messages) {
    if (media_msg.files.length) messages.append(media_message_tmpl(media_msg, true))
    if (files_msg.files.length) messages.append(file_message_tmpl(files_msg, true))
  }

  upload_all({ media_msg, files_msg })
}

function upload_to(urls) {
  return async function upload(file) {
    const is_image = /(image\/*)/.test(file.meta.type)
    const key = is_image ? "images" : "files"
    const url = urls[key].pop()
    if (!url) return
    const fd = new FormData();
    fd.append("file", file.raw, file.meta.name);

    const [_, err] = await option(
      upload_request(url.upload_url, {
        data: fd,
        method: is_image ? "POST" : "PUT",
        on_progress: on_file_progress(file, is_image),
        on_done: on_file_done(file, url, is_image),
        ...(!is_image && {
          headers: {
            "Content-Type": file.meta.type
          }
        })
      })
    );

    if (err) {
      console.error(err)
      return
    }

    return Object.assign(file.meta, { url: url.public_url, id: url.id })
  }
}

async function upload_all({ media_msg, files_msg }) {
  const files = media_msg.files.concat(files_msg.files);
  const [urls, err] = await option(
    request("/cf/direct_upload", {
      body: { files: files.map(f => f.meta) }
    })
  );

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  for await (const result of async_pool(10, files, upload_to(urls))) {
    console.log(result)
  }
}

async function on_photo_download(e) {
  const { photo_url } = e.target.dataset;
  const img = e.target.nextElementSibling;
  const srcset = generate_srcset(photo_url, "fit=scale-down", 12);
  img.setAttribute("src", `${photo_url}/public`);
  img.setAttribute("srcset", srcset);
  e.target.remove();
}

async function on_file_download(e) {
  const { file_url, file_name } = e.target.dataset;
  const response = await fetch(file_url);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file_name;
  document.body.append(a);
  a.click();
  a.remove();
}

function scroll_to_bottom(element) {
  element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
}

add_listeners(files_input, {
  change: on_files_change,
});

add_listeners(file_download_btns, {
  click: on_file_download,
});

add_listeners(photo_download_btns, {
  click: on_photo_download,
});

connect();
