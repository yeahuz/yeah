import { add_listeners, attrs, span, text, html, classes } from "./dom.js";
import { check_icon } from "./icons.js";
import { media_message_tmpl, text_message_tmpl, chat_list_item_tmpl, file_message_tmpl } from "./templates.js";
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
    const message = {
      chat_id: data.get("chat_id"),
      content: data.get("content"),
      temp_id: gen_id(),
      attachments: [],
      type: "text",
      created_at: Date.now(),
    };

    ws.send(encoder.encode("new_message", message));
    if (messages) messages.append(text_message_tmpl(message, true));

    textarea.focus();
    form.reset();
    scroll_to_bottom(messages);
  }
}

function on_message_sent(message) {
  if (!messages) return
  const item = messages.querySelector("#" + message.temp_id)
  if (!item) return
  const clock = item.querySelector(".js-date-info-clock");
  if (clock) clock.replaceWith(span(html(check_icon({ size: 14 }))))

  item.setAttribute("id", message.id)
  update_latest_message(message, true)
}

function on_new_message(payload) {
  console.log({ payload })
  update_latest_message(payload)
  if (!messages) return
  switch (payload.type) {
    case "text":
      messages.append(text_message_tmpl(payload, false));
      break;
    case "file":
      messages.append(file_message_tmpl(payload, false));
      break;
    case "photo":
      messages.append(media_message_tmpl(payload, false));
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
    const content = payload.content ? payload.content : payload.attachments[payload.attachments.length - 1]?.name;
    if (latest_message) latest_message.textContent = you ? `${t("you", { ns: "chats" })}: ` + content : content;
    if (latest_date) latest_date.textContent = format_relative(new Date(payload.created_at), new Date());
  }
}

function on_new_chat(payload) {
  if (chats_list) chats_list.append(chat_list_item_tmpl(payload))
  ws.send(encoder.encode("subscribe", `chats/${payload.id}`))
}

function on_file_done(file, url) {
  return () => {
    const message = document.getElementById(file.msg_id);
    const item = document.getElementById(file.temp_id);
    if (item) {
      const progress = item.querySelector(".js-progress");
      if (progress) progress.remove();
    }

    if (message) {
      const links = message.querySelectorAll("a");
      for (const link of links) {
        link.setAttribute("href", url.public_url);
      }
    }
  }
}

function on_file_progress(file) {
  const item = document.getElementById(file.temp_id);
  const overlay = span(
    attrs({
      class: "absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg js-progress"
    }),
    text("0")
  )

  if (item) item.append(overlay)

  return (progress) => {
    overlay.textContent = `${Math.floor(progress.percent)}%`
  };
}

async function on_files_change(e) {
  const data = new FormData(e.target.form);
  const files = e.target.files;
  if (!files.length) return;

  const media_msg = {
    type: "photo",
    chat_id: data.get("chat_id"),
    content: "",
    temp_id: gen_id("message"),
    files: [],
    attachments: [],
    created_at: Date.now(),
  }

  const files_msg = {
    type: "file",
    chat_id: data.get("chat_id"),
    content: "",
    temp_id: gen_id("message"),
    files: [],
    attachments: [],
    created_at: Date.now(),
  }

  for (const file of files) {
    const is_image = /(image\/*)/.test(file.type)
    const obj = is_image ? media_msg : files_msg;
    obj.files.push({
      temp_id: gen_id("attachment"),
      msg_id: obj.temp_id,
      raw: file,
      name: file.name,
      size: file.size,
      type: file.type,
      is_image,
    })
  }

  if (messages) {
    if (media_msg.files.length) messages.append(media_message_tmpl(media_msg, true))
    if (files_msg.files.length) messages.append(file_message_tmpl(files_msg, true))
  }

  upload_all({ media_msg, files_msg })
}

function upload_to(urls) {
  return async function upload(file) {
    const key = file.is_image ? "images" : "files"
    const url = urls[key].pop()
    if (!url) return
    const fd = new FormData();
    fd.append("file", file.raw, file.name);

    const [_, err] = await option(
      upload_request(url.upload_url, {
        data: fd,
        method: file.is_image ? "POST" : "PUT",
        on_progress: on_file_progress(file),
        on_done: on_file_done(file, url),
        ...(!file.is_image && {
          headers: {
            "Content-Type": file.type
          }
        })
      })
    );

    if (err) {
      console.error("Something went wrong uploading file: ", err)
      return
    }

    return {
      url: url.public_url,
      resource_id: url.id,
      size: file.size,
      type: file.type,
      name: file.name,
      is_image: file.is_image
    }
  }
}

async function upload_all({ media_msg, files_msg }) {
  const files = media_msg.files.concat(files_msg.files);
  const [urls, err] = await option(
    request("/cf/direct_upload", {
      body: { files: files.map(({ type, size, name, is_image }) => ({ type, size, name, is_image })) }
    })
  )

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  for await (const result of async_pool(10, files, upload_to(urls))) {
    if (!result) continue;
    if (result.is_image) media_msg.attachments.push(result);
    else files_msg.attachments.push(result);
  }

  if (ws) {
    if (media_msg.attachments.length) ws.send(encoder.encode("new_message", media_msg));
    if (files_msg.attachments.length) ws.send(encoder.encode("new_message", files_msg));
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

on("new_message", on_new_message);
on("message_sent", on_message_sent);
on("new_chat", on_new_chat)

connect();
