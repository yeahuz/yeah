import { attrs, span, text, add_class } from "./dom.js";
import { add_listeners } from "dom";
import { chat_list_item_tmpl } from "./templates.js";
import {
  option,
  request,
  async_pool,
  upload_request,
  generate_srcset,
  gen_id,
  format_relative,
  add_prefix
} from "./utils.js";
import { toast } from "./toast.js";
import { WS } from "./ws.js";
import { signal, effect } from "state";
import { TextMessage } from "./components/text-message.js";
import { FileMessage } from "./components/file-message.js";
import { MediaMessage } from "./components/media-message.js";
import { ImageViewer } from "./image-viewer.js";

let scroll_down_btn = document.querySelector(".js-scroll-down-btn");
let image_viewer = ImageViewer.from(".js-zoomable");
let files_input = document.querySelector(".js-files");
let messages = document.querySelector(".js-messages");
let photo_download_btns = document.querySelectorAll(".js-photo-download-btn");
let message_form = document.querySelector(".js-message-form");
let chats_list = document.querySelector(".js-chats-list");
let unread_messages = messages?.querySelectorAll(".js-unread") || [];
let textarea = message_form?.querySelector("textarea[name='content']");

let ws = new WS("/chat");

function on_observe(entries, observer) {
  for (let entry of entries) {
    if (entry.intersectionRatio > 0) {
      let form = entry.target.querySelector("form");
      if (form) {
        read_message(form);
        observer.unobserve(entry.target);
      }
    }
  }
}

let observer = new IntersectionObserver(on_observe, {
  root: messages,
  rootMargin: "0px",
  threshold: 1.0,
});

for (let message of unread_messages) observer.observe(message);

let params = new URLSearchParams(window.location.search);
let last_read_messsage_id = params.get("m");
let chat_id = params.get("c");
if (chat_id) {
  let el = document.getElementById(chat_id);
  if (el) el.scrollIntoView();
}

if (last_read_messsage_id) {
  let el = document.getElementById(last_read_messsage_id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "end" });
    let restore = add_class(el, "animate-pulse");
    setTimeout(restore, 3000);
  }
} else {
  let top = window.localStorage.getItem(window.location.pathname);
  if (top && messages) messages.scrollTop = parseInt(top, 10);
}


window.addEventListener("beforeunload", () => {
  let pathname = window.location.pathname;
  if (messages) {
    window.localStorage.setItem(pathname, messages.scrollTop);
  }
});


let last_scroll;
let is_at_end;
function on_scroll(e) {
  let scroll_top = e.target.scrollTop;
  is_at_end = scroll_top === e.target.scrollHeight - e.target.offsetHeight;
  if (last_scroll && scroll_top > last_scroll && !is_at_end) {
    scroll_down_btn.classList.remove("scale-0");
  } else scroll_down_btn.classList.add("scale-0");

  last_scroll = scroll_top;
}

async function on_send_message(e) {
  e.preventDefault();
  let form = e.target;
  let data = new FormData(form);
  let message = signal({
    chat_id: Number(data.get("chat_id")),
    content: data.get("content"),
    attachments: [],
    type: "text",
    created_at: new Date().toISOString(),
    delivered: false,
    is_own: true
  })

  if (messages) messages.append(new TextMessage(message));
  if (textarea) textarea.focus();
  form.reset();
  scroll_to_bottom(messages);

  let action = form.getAttribute("api_action") || form.action;
  let [result, err] = await option(request(action, { body: message() }));
  // TODO: handle errors
  if (!err) {
    message.mutate((message) => {
      message.delivered = true;
      message.id = result.id;
    });
    ws.send("message", result);
    update_latest_message(result, true);
  }
}

export async function read_message(form) {
  let data = Object.fromEntries(new FormData(form));
  let action = form.getAttribute("api_action") || form.action;
  let method = form.getAttribute("api_method") || form.method;
  let chat = document.getElementById(add_prefix("chat", data.chat_id));
  if (chat) {
    let unread_count = chat.querySelector(".js-unread-count");
    let new_count = Number(unread_count.textContent) - 1;
    if (new_count < 1) {
      unread_count.classList.add("hidden");
      unread_count.classList.remove("inline-flex");
    } else unread_count.textContent = new_count;
  }

  let [_, err] = await option(request(action, { body: data, method }));
  // TODO: handle errors
  if (!err) {
    ws.send("message_read", data);
  }
}

function on_message_received(payload) {
  update_latest_message(payload);
  if (!messages) return;
  let node;
  switch (payload.type) {
    case "text":
      node = new TextMessage((mod = (m) => m) => mod(payload));
      messages.append(node);
      break;
    case "file":
      node = new FileMessage((mod = (m) => m) => mod(payload));
      messages.append(node);
      break;
    case "photo":
      node = new MediaMessage((mod = (m) => m) => mod(payload));
      messages.append(node);
      image_viewer.reselect();
      break;
    default:
      break;
  }

  if (is_at_end) scroll_to_bottom(messages);
  observer.observe(node);
}

async function update_latest_message(payload, you) {
  let { t } = await import("./i18n.js");
  let item = document.getElementById(`chat-${payload.chat_id}`);
  if (item) {
    let latest_date = item.querySelector(".js-latest-date");
    let latest_message = item.querySelector(".js-latest-message");
    let content = payload.content ? payload.content : payload.attachments[payload.attachments.length - 1]?.name;
    if (latest_message) latest_message.textContent = you ? `${t("you", { ns: "chats" })}: ` + content : content;
    if (latest_date) latest_date.textContent = format_relative(new Date(payload.created_at), new Date());
  }
}

function on_new_chat(payload) {
  if (chats_list) chats_list.append(chat_list_item_tmpl(payload));
  ws.send("subscribe", `chats/${payload.id}`);
}

function on_file_done(file, url) {
  return () => {
    let message = document.getElementById(file.msg_id);
    let item = document.getElementById(file.temp_id);
    if (item) {
      let progress = item.querySelector(".js-progress");
      if (progress) progress.remove();
    }

    if (message) {
      let links = message.querySelectorAll("a");
      for (let link of links) {
        link.setAttribute("href", url.public_url);
      }
    }
  };
}

function on_file_progress(file) {
  let item = document.getElementById(file.temp_id);
  let overlay = span(
    attrs({
      class: "absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg js-progress"
    }),
    text("0")
  );

  if (item) item.append(overlay);

  return (progress) => {
    overlay.textContent = `${Math.floor(progress.percent)}%`;
  };
}

async function on_files_change(e) {
  let data = new FormData(e.target.form);
  let files = e.target.files;
  if (!files.length) return;

  let media_msg = signal({
    type: "media",
    chat_id: Number(data.get("chat_id")),
    content: "",
    temp_id: gen_id("message"),
    files: [],
    attachments: [],
    created_at: new Date().toISOString(),
    is_own: true,
    delivered: false
  });

  let files_msg = signal({
    type: "file",
    chat_id: Number(data.get("chat_id")),
    content: "",
    temp_id: gen_id("message"),
    files: [],
    attachments: [],
    created_at: new Date().toISOString(),
    is_own: true,
    delivered: false
  });

  for (let file of files) {
    let is_image = /(image\/*)/.test(file.type);
    let is_video = /(video\/*)/.test(file.type);
    let obj = (is_image || is_video) ? media_msg : files_msg;
    obj.mutate((message) => {
      message.files.push({
        temp_id: gen_id("attachment"),
        msg_id: obj.temp_id,
        raw: file,
        name: file.name,
        size: file.size,
        type: file.type,
        is_image,
        is_video
      })
    })
  }

  if (messages) {
    if (media_msg.files.length) {
      messages.append(new MediaMessage(media_msg))
      image_viewer.reselect();
    }
    if (files_msg.files.length) messages.append(new FileMessage(files_msg));
  }

  upload_all({ media_msg, files_msg });
}


// TODO: associate file with specific url so that content-types match;
function upload_to(urls) {
  return async function upload(file) {
    let url = urls[file.temp_id];
    if (!url) return;
    let fd = new FormData();
    fd.append("file", file.raw, file.name);

    let [_, err] = await option(
      upload_request(url.upload_url, {
        data: file.is_image ? fd : fd.get("file"),
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
      console.error("Something went wrong uploading file: ", err);
      return;
    }

    return {
      url: url.public_url,
      resource_id: url.id,
      size: file.size,
      type: file.type,
      name: file.name,
      is_image: file.is_image,
      is_video: file.is_video
    };
  };
}

async function upload_all({ media_msg, files_msg }) {
  let files = media_msg.files.concat(files_msg.files);
  let [urls, err] = await option(
    request("/cf/direct_upload", {
      body: { files: files.map(({ type, size, name, is_image, is_video, temp_id }) => ({ type, size, name, is_image, is_video, temp_id })) }
    })
  );

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  for await (let result of async_pool(10, files, upload_to(urls))) {
    if (!result) continue;
    if (result.is_image || result.is_video) media_msg.attachments.push(result);
    else files_msg.attachments.push(result);
  }

  let action = message_form.getAttribute("api_action") || message_form.action;

  if (media_msg.attachments.length) {
    let [result, err] = await option(request(action, { body: media_msg }));
    if (!err) {
      media_msg.mutate((message) => {
        message.delivered = true;
        message.id = result.id;
      });
      ws.send("message", result)
    }
  }

  if (files_msg.attachments.length) {
    let [result, err] = await option(request(action, { body: files_msg }));
    if (!err) {
      files_msg.mutate((message) => {
        message.delivered = true;
        message.id = result.id;
        message.files = result.attachments
      });
      ws.send("message", result);
    }
  }
}

async function on_photo_download(e) {
  let { photo_url } = e.target.dataset;
  let img = e.target.nextElementSibling;
  let srcset = generate_srcset(photo_url, "fit=scale-down", 12);
  img.setAttribute("src", `${photo_url}/public`);
  img.setAttribute("srcset", srcset);
  e.target.remove();
}

function scroll_to_bottom(element) {
  element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
}

add_listeners(files_input, {
  change: on_files_change,
});

add_listeners(photo_download_btns, {
  click: on_photo_download,
});


add_listeners(message_form, {
  submit: on_send_message,
});

add_listeners(scroll_down_btn, {
  click: () => scroll_to_bottom(messages)
})

add_listeners(messages, {
  scroll: on_scroll
}, { scroll: { passive: true } })

function on_message_read(payload) {
  let item = document.getElementById(add_prefix("message", payload.id));
  if (item) item.classList.add("read");
}

export function setup_chat(chat, chats) {
  let c = signal(chats.map(c => {
    return { id: c.id, unread_count: signal(c.unread_count), latest_message: signal(c.latest_message) }
  }));

  for (let chat of c()) {
    let item = document.getElementById(add_prefix("chat", chat.id));
    let unread_count = item.querySelector(".js-unread-count");
    let latest_message = item.querySelector(".js-latest-message");
    let latest_date = item.querySelector(".js-latest-date");

    effect(() => {
      let latest = chat.latest_message();
      latest_message.textContent = latest.content;
      latest_date.textContent = latest.created_at;
      setInterval(() => {
        chat.latest_message.update((m) => ({ ...m, content: Math.random().toString(32).slice(2), created_at: new Date().toISOString() }));
      }, 2000)
    });

    effect(() => {
      let count = chat.unread_count();
      if (count > 0) {
        unread_count.classList.remove("hidden");
        unread_count.classList.add("inline-flex")
      }
      unread_count.textContent = count;
    });

    setInterval(() => {
      chat.unread_count.update(c => c + 1);
    }, 2000)
  }

  console.log({ chat, chats });
}


ws.on("message", on_message_received);
ws.on("new_chat", on_new_chat);
ws.on("message_read", on_message_read);
