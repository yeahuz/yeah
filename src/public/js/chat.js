import { add_listeners, create_node } from "./dom.js";
import { media_message_tmpl, file_message_tmpl, text_message_tmpl } from "./templates-v2.js";
import { option, request, async_pool, upload_request, generate_srcset, wait } from "./utils.js";
import { toast } from "./toast.js";
import { PackBytes } from "/node_modules/packbytes/packbytes.mjs";

const files_input = document.querySelector(".js-files");
const messages = document.querySelector(".js-messages");
const photos_link_form = document.querySelector(".js-photos-link-form");
const files_link_form = document.querySelector(".js-files-link-form");
const photo_download_btns = document.querySelectorAll(".js-photo-download-btn");
const file_download_btns = document.querySelectorAll(".js-file-download-btn");
const message_form = document.querySelector(".js-message-form");
// const message_textarea = message_form.querySelector("textarea[name='content']");

const top = window.localStorage.getItem(window.location.pathname);
if (top && messages) messages.scrollTop = parseInt(top, 10);

window.addEventListener("beforeunload", () => {
  const pathname = window.location.pathname;
  if (messages) {
    localStorage.setItem(pathname, messages.scrollTop);
  }
});

let ws = null;
let encoder = null;
const listeners = {};

function on(op, callback) {
  listeners[op] = callback;
}

function connect() {
  ws = new WebSocket("ws://localhost:3020/chat");

  ws.binaryType = "arraybuffer";

  ws.addEventListener("close", async () => {
    await wait(3000);
    connect();
  });

  ws.addEventListener("error", () => {
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
    messages.append(text_message_tmpl(payload, true));

    textarea.focus();
    form.reset();
    scroll_to_bottom(messages);
  }
}

function on_message_sent(message) {
  const item = messages.querySelector(`li[data-temp_id=${message.temp_id}]`);
  const date_infos = item.querySelectorAll(".js-date-info");
  for (const info of date_infos) {
    const clock = info.querySelector(".js-date-info-clock");
    if (clock) clock.remove();
    const check = create_node("span");
    check.innerHTML = `<svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

    info.append(check);
  }

  item.setAttribute("date-message_id", message.id);
}

function on_new_message(payload) {
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

on("new_message", on_new_message);
on("message_sent", on_message_sent);

function on_media_progress(item) {
  item.classList.add("pointer-events-none");
  const span = create_node("span", {
    class:
      "upload-progress absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg",
  });

  span.textContent = "0";
  item.append(span);
  return (progress) => {
    span.textContent = `${Math.floor(progress.percent)}%`;
  };
}

function on_media_done(item) {
  return () => {
    item.classList.remove("pointer-events-none");
    const upload_progress = item.querySelector(".upload-progress");
    if (upload_progress) upload_progress.remove();
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

  const span = create_node("span", {
    class:
      "upload-progress absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg text-white",
  });

  item.querySelector(".js-file-icon").append(span);

  return (progress) => {
    span.textContent = `${Math.floor(progress.percent)}%`;
  };
}

function on_file_done(item) {
  return () => {
    item.classList.remove("pointer-events-none");
    const upload_progress = item.querySelector(".upload-progress");
    if (upload_progress) upload_progress.remove();
  };
}

function upload_files_to(urls) {
  return async function upload(file) {
    const list_item = messages.querySelector(`[data-id="${file.id}"]`);
    const url = urls.shift();
    const fd = new FormData();
    fd.append("file", file, file.name);

    const [result = {}, err] = await option(
      upload_request(url.uploadURL, {
        method: "PUT",
        data: fd,
        on_progress: on_file_progress(list_item),
        on_done: on_file_done(list_item),
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
        photos: photos,
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

  const file_ids = [];
  for await (const [result, err] of async_pool(10, message.attachments, upload_files_to(urls))) {
    file_ids.push(result.id);
  }

  if (ws) {
    const data = new FormData(files_link_form);
    ws.send(
      encoder.encode("publish_files", {
        chat_id: data.get("chat_id"),
        files: file_ids,
        temp_id: message.temp_id,
      })
    );
  }
}

async function on_files_change(e) {
  const files = e.target.files;
  if (!files.length) return;

  const media_message = { temp_id: `temp-${Math.random().toString(32).slice(2)}`, attachments: [] };
  const other_message = { temp_id: `temp-${Math.random().toString(32).slice(2)}`, attachments: [] };

  for (const file of files) {
    const id = `temp-${Math.random().toString(32).slice(2)}`;
    if (is_media(file.type)) media_message.attachments.push(Object.assign(file, { id }));
    else other_message.attachments.push(Object.assign(file, { id }));
  }

  if (media_message.attachments.length) {
    messages.append(media_message_tmpl(media_message));
    upload_media_files(media_message);
  }
  if (other_message.attachments.length) {
    messages.append(file_message_tmpl(other_message));
    upload_files(other_message);
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

function is_tab_in_focus() {
  return document.visibilityState === "visible";
}

function on_visibility_change() {
  if (is_tab_in_focus() && !ws) connect();
}

// add_listeners(document, {
//   visibilitychange: on_visibility_change,
// });

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
