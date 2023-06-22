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
      temp_id: `temp-${Math.random().toString(32).slice(2)}`,
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
  const item = messages.querySelector(`li[data-temp_id=${message.temp_id}]`);
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

  item.setAttribute("date-message_id", message.id);
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

function on_media_progress(item) {
  item.classList.add("pointer-events-none");
  const progress = span(
    attrs({
      class:
        "upload-progress absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg",
    }),
    text("0")
  );

  item.append(progress);
  return (progress) => {
    progress.textContent = `${Math.floor(progress.percent)}%`;
  };
}

function on_media_done(item) {
  return () => {
    item.classList.remove("pointer-events-none");
  };
}

function upload_media_to(urls) {
  return async function upload(file) {
    const list_item = messages.querySelector(`[data-id="${file.id}"]`);
    const url = urls.shift();
    const fd = new FormData();
    fd.append("file", file);

    return await option(
      upload_request(url.uploadURL, {
        data: fd,
        on_progress: on_media_progress(list_item),
        on_done: on_media_done(list_item),
      })
    );
  };
}

function on_file_progress(item) {
  item.classList.add("pointer-events-none");

  const upload_progress = span(classes("upload-progress absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg text-white"));

  item.append(upload_progress);

  return (progress) => {
    upload_progress.textContent = `${Math.floor(progress.percent)}%`;
  };
}

function upload_files_to(urls) {
  return async function upload(file) {
    const left_container = messages.querySelector(`[data-id="${file.id}"]`);
    const url = urls.shift();
    const fd = new FormData();
    fd.append("file", file, file.name);

    const [result = {}, err] = await option(
      upload_request(url.uploadURL, {
        method: "PUT",
        data: fd,
        on_progress: on_file_progress(left_container),
        // on_done: on_file_done(left_container),
        headers: {
          "Content-Type": file.type,
        },
      })
    );

    return [Object.assign(result || {}, { id: url.id }), err];
  };
}

async function upload_media_files(message) {
  const [urls, err] = await option(
    request("/cloudflare/images/direct_upload", {
      body: { files: message.attachments.map((file) => ({ size: file.size, type: file.type })) },
    })
  );

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  const photos = [];
  for await (const [result, err] of async_pool(10, message.attachments, upload_media_to(urls))) {
    photos.push(result.result.id);
  }

  if (ws) {
    const data = new FormData(photos_link_form);
    ws.send(
      encoder.encode("publish_photos", {
        chat_id: data.get("chat_id"),
        photos,
        temp_id: message.temp_id,
      })
    );
  }
}

async function upload_files(message) {
  const [urls, err] = await option(
    request("/cloudflare/r2/direct_upload", {
      body: {
        files: message.attachments.map((file) => ({
          name: file.name,
          size: String(file.size),
          type: file.type,
        })),
      },
    })
  );

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  const data = new FormData(files_link_form);

  for await (const [result, err] of async_pool(10, message.attachments, upload_files_to(urls))) {
    if (ws) {
      ws.send(
        encoder.encode("publish_file", {
          chat_id: data.get("chat_id"),
          file: result.id,
          temp_id: message.temp_id,
        })
      );
    }
  }
}

async function on_files_change(e) {
  const files = e.target.files;
  if (!files.length) return;

  const media_message = { temp_id: gen_id(), attachments: [] };
  const other_messages = [];

  for (const file of files) {
    if (is_media(file.type)) media_message.attachments.push(Object.assign(file, { id: gen_id() }));
    else {
      other_messages.push({
        temp_id: gen_id(),
        attachments: [Object.assign(file, { id: gen_id() })],
      });
    }
  }

  if (media_message.attachments.length) {
    messages.append(media_message_tmpl(media_message));
    upload_media_files(media_message);
  }

  if (other_messages.length) {
    for (const msg of other_messages) {
      messages.append(file_message_tmpl(msg));
      upload_files(msg);
    }
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

function is_media(type) {
  return /(image\/*)|(video\/*)/.test(type);
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
