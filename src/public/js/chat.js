import { add_class } from "./dom.js";
import { add_listeners, text } from "dom";
import {
  option,
  request,
  async_pool,
  upload_request,
  generate_srcset,
  gen_id,
  format_relative,
  add_prefix,
} from "./utils.js";
import { toast } from "./toast.js";
import { WS } from "./ws.js";
import { signal, effect } from "state";
import { TextMessage } from "./components/text-message.js";
import { FileMessage } from "./components/file-message.js";
import { MediaMessage } from "./components/media-message.js";
import { ImageViewer } from "./image-viewer.js";
import { ChatListItem } from "./components/chat-list-item.js";

let messages = document.querySelector(".js-messages");

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

export class Chat {
  constructor(props) {
    this.elements = {
      message_form: document.querySelector(".js-message-form"),
      scroll_down_btn: document.querySelector(".js-scroll-down-btn"),
      messages: document.querySelector(".js-messages"),
      get textarea() {
        return this.message_form.querySelector("textarea[name='content']")
      },
      get unread_messages() {
        return messages?.querySelectorAll(".js-unread") || [];
      },
      files_input: document.querySelector(".js-files"),
      chats: document.querySelector(".js-chats-list"),
      photo_download_btns: document.querySelectorAll(".js-photo-download-btn")
    }

    this.props = props;
    this.ws = WS.from("/chat");
    this.image_viewer = ImageViewer.from(".js-zoomable");
    this.chats_map = new Map();
    this.messages_map = new Map();
    this.observer = new IntersectionObserver(this.on_observe.bind(this), {
      root: this.elements.messages,
      rootMargin: "0px",
      threshold: 1.0,
    });
    this.t;
    this.last_scroll;
    this.is_at_end;
    this.tpromise = import("./i18n.js").then((mod) => {
      this.t = mod.t;
    });

    this.setup();
  }

  static from({ chats }) {
    return new Chat({ chats });
  }

  classlist(cond, truthy, falsey) {
    return (node) => {
      if (cond()) {
        node.classList.add(...truthy)
        node.classList
      } else {
        node.classList.remove(...truthy)
        node.classList.add(...falsey)
      }
    }
  }

  async setup() {
    await this.tpromise;
    for (let item of this.props.chats) {
      let chat = {
        id: item.id,
        unread_count: signal(item.unread_count),
        latest_message: {
          is_own: signal(item.latest_message?.is_own),
          content: signal(item.latest_message?.content),
          created_at: signal(item.latest_message?.created_at),
          attachments: signal(item.latest_message?.attachments),
          type: signal(item.latest_message?.type),
        }
      }

      this.chats_map.set(item.id, chat);

      let chat_el = document.getElementById(add_prefix("chat", item.id));
      let unread_count = chat_el.querySelector(".js-unread-count");
      let latest_message = chat_el.querySelector(".js-latest-message");
      let latest_date = chat_el.querySelector(".js-latest-date");

      let latest = chat.latest_message;
      text(() => this.latest_message_content(latest))(latest_message);
      text(() => latest.created_at() ? format_relative(new Date(latest.created_at()), new Date()) : "")(latest_date);
      text(chat.unread_count)(unread_count);

      //TODO: how to improve?
      effect(() => {
        let count = chat.unread_count();
        unread_count.classList.toggle("inline-flex", count > 0);
        unread_count.classList.toggle("hidden", count < 1);
      })
    }

    for (let message of this.elements.unread_messages) {
      this.observer.observe(message)
    }

    this.setup_listeners();
  }

  latest_message_content(message) {
    let s = "";
    // have to subscribe at the beginning, otherwise will not work
    let type = message.type();
    let content = message.content();
    let attachments = message.attachments();
    let is_own = message.is_own();
    if (!type) return s;

    if (is_own) {
      s += (this.t("you", { ns: "chats" }) + ": ")
    }

    if (type === "text") {
      s += content;
    } else {
      let key = type === "file" ? "files_count" : "photos_count"
      s += this.t(key, { ns: "chats", count: attachments.length, first: attachments[0]?.name })
    }

    return s;
  }

  save_scroll_pos() {
    let pathname = window.location.pathname;
    if (messages) {
      window.localStorage.setItem(pathname, this.elements.messages.scrollTop);
    }
  }

  setup_listeners() {
    add_listeners(this.elements.files_input, {
      change: this.on_files_change.bind(this),
    });

    add_listeners(this.elements.photo_download_btns, {
      click: this.on_photo_download
    });

    add_listeners(this.elements.message_form, {
      submit: this.on_send_message.bind(this),
    });

    add_listeners(this.elements.scroll_down_btn, {
      click: this.scroll_to_bottom.bind(this),
    })

    add_listeners(this.elements.messages, {
      scroll: this.on_scroll.bind(this),
    }, { scroll: { passive: true } })

    add_listeners(window, {
      beforeunload: this.save_scroll_pos.bind(this)
    })

    this.ws.on("message", this.on_message_received.bind(this));
    this.ws.on("new_chat", this.on_new_chat.bind(this));
    this.ws.on("message_read", this.on_message_read.bind(this));
  }

  on_photo_download(e) {
    let { photo_url } = e.target.dataset;
    let img = e.target.nextElementSibling;
    let srcset = generate_srcset(photo_url, "fit=scale-down", 12);
    img.setAttribute("src", `${photo_url}/public`);
    img.setAttribute("srcset", srcset);
    e.target.remove();
  }

  scroll_to_bottom() {
    let el = this.elements.messages;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }

  on_observe(entries, observer) {
    for (let entry of entries) {
      if (entry.intersectionRatio > 0) {
        let form = entry.target.querySelector("form");
        if (form) {
          this.read_message(form);
          observer.unobserve(entry.target);
        }
      }
    }
  }

  on_scroll(e) {
    let scroll_top = e.target.scrollTop;
    this.is_at_end = scroll_top > e.target.scrollHeight - e.target.offsetHeight - 60; // some arbitrary offset from bottom;
    if (this.last_scroll && scroll_top > this.last_scroll && !this.is_at_end) {
      this.elements.scroll_down_btn.classList.remove("scale-0");
    } else this.elements.scroll_down_btn.classList.add("scale-0");

    this.last_scroll = scroll_top;
  }

  async on_send_message(e) {
    e.preventDefault();
    let form = e.target;
    let data = new FormData(form);

    let message = {
      chat_id: Number(data.get("chat_id")),
      content: data.get("content"),
      type: "text",
      created_at: new Date().toISOString(),
      delivered: signal(false),
      is_own: signal(true),
      id: signal(undefined),
      read: signal(false),
    }

    if (this.elements.messages) this.elements.messages.append(new TextMessage(message));
    if (this.elements.textarea) this.elements.textarea.focus();

    form.reset();
    this.scroll_to_bottom(this.elements.messages);

    let action = form.getAttribute("api_action") || form.action;
    let [result, err] = await option(request(action, { body: message }));
    if (!err) {
      message.delivered.set(true);
      message.id.set(result.id);
      this.ws.send("message", result);
      this.update_chat(message.chat_id, (chat) => {
        chat.latest_message.type.set(result.type);
        chat.latest_message.content.set(result.content);
        chat.latest_message.created_at.set(result.created_at);
        chat.latest_message.is_own.set(true);
      });
      this.messages_map.set(result.id, message);
    }
  }

  on_files_change(e) {
    let data = new FormData(e.target.form);
    let files = e.target.files;
    if (!files.length) return;

    let media_msg = {
      type: "media",
      chat_id: Number(data.get("chat_id")),
      content: "",
      temp_id: gen_id("message"),
      files: signal([]),
      attachments: [],
      created_at: new Date().toISOString(),
      is_own: signal(true),
      delivered: signal(false),
      id: signal(undefined),
      read: signal(false)
    }

    let files_msg = {
      type: "file",
      chat_id: Number(data.get("chat_id")),
      content: "", temp_id: gen_id("message"), files: [],
      attachments: [],
      files: signal([]),
      created_at: new Date().toISOString(),
      is_own: signal(true),
      delivered: signal(false),
      id: signal(undefined),
      read: signal(false)
    };

    //TODO: Instead of uploading bool, make it string status so that I can track when upload errors occur and display the error
    for (let file of files) {
      let is_image = /(image\/*)/.test(file.type);
      let is_video = /(video\/*)/.test(file.type);
      let obj = (is_image || is_video) ? media_msg : files_msg;

      obj.files.mutate(files => files.push({
        temp_id: gen_id("attachment"),
        msg_id: obj.temp_id,
        raw: file,
        name: file.name,
        size: file.size,
        type: file.type,
        is_image,
        is_video,
        uploading: signal(true),
        progress: signal(0)
      }))
    }

    if (this.elements.messages) {
      if (media_msg.files.value.length) {
        this.elements.messages.append(new MediaMessage(media_msg))
        this.image_viewer.reselect();
      }
      if (files_msg.files.value.length) this.elements.messages.append(new FileMessage(files_msg));
    }

    this.upload_all({ media_msg, files_msg });
  }

  async upload_all({ media_msg, files_msg }) {
    let files = media_msg.files.value.concat(files_msg.files.value);
    let [urls, err] = await option(
      request("/cf/direct_upload", {
        body: { files: files.map(({ type, size, name, is_image, is_video, temp_id }) => ({ type, size, name, is_image, is_video, temp_id })) }
      })
    );

    if (err) {
      toast("Unable to create direct creator upload urls. Please try again", "err");
      return;
    }

    for await (let result of async_pool(10, files, this.upload_to(urls))) {
      if (!result) continue;
      if (result.is_image || result.is_video) media_msg.attachments.push(result);
      else files_msg.attachments.push(result);
    }

    let action = this.elements.message_form.getAttribute("api_action") || this.elements.message_form.action;

    if (media_msg.attachments.length) {
      let [result, err] = await option(request(action, { body: media_msg }));
      if (!err) {
        media_msg.delivered.set(true);
        media_msg.id.set(result.id);
        this.ws.send("message", result)

        this.update_chat(media_msg.chat_id, (chat) => {
          chat.latest_message.type.set(result.type);
          chat.latest_message.attachments.set(result.attachments);
          chat.latest_message.created_at.set(result.created_at);
          chat.latest_message.is_own.set(true);
        });
        this.messages_map.set(result.id, media_msg);
      }
    }

    if (files_msg.attachments.length) {
      let [result, err] = await option(request(action, { body: files_msg }));
      if (!err) {
        files_msg.delivered.set(true);
        files_msg.id.set(result.id);
        files_msg.files.set(result.attachments);
        this.ws.send("message", result);

        this.update_chat(files_msg.chat_id, (chat) => {
          chat.latest_message.type.set(result.type);
          chat.latest_message.attachments.set(result.attachments);
          chat.latest_message.created_at.set(result.created_at);
          chat.latest_message.is_own.set(true);
        });
        this.messages_map.set(result.id, files_msg);
      }
    }
  }

  upload_to(urls) {
    let ctx = this;
    return async function upload(file) {
      let url = urls[file.temp_id];
      if (!url) return;
      let fd = new FormData();
      fd.append("file", file.raw, file.name);

      let [_, err] = await option(
        upload_request(url.upload_url, {
          data: file.is_image ? fd : fd.get("file"),
          method: file.is_image ? "POST" : "PUT",
          on_progress: ctx.on_upload_progress(file),
          on_done: ctx.on_upload_done(file, url),
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

  on_upload_progress(file) {
    return (progress) => {
      file.progress.set(Math.floor(progress.percent));
    };
  }

  on_upload_done(file) {
    return () => {
      file.uploading.set(false)
    }
  }

  update_chat(id, update_fn) {
    let chat = this.chats_map.get(id);
    if (chat) update_fn(chat);
  }

  update_message(id, update_fn) {
    let message = this.messages_map.get(id);
    if (message) update_fn(message);
  }

  async read_message(form) {
    let data = Object.fromEntries(new FormData(form));
    let action = form.getAttribute("api_action") || form.action;
    let method = form.getAttribute("api_method") || form.method;
    let [_, err] = await option(request(action, { body: data, method }));
    // TODO: handle errors
    if (!err) {
      this.ws.send("message_read", data);
      this.update_chat(Number(data.chat_id), (chat) => {
        chat.unread_count.update(c => c - 1);
      })
    }
  }

  on_message_received(payload) {
    this.update_chat(payload.chat_id, (chat) => {
      chat.unread_count.update(c => c + 1);
      chat.latest_message.content.set(payload.content);
      chat.latest_message.created_at.set(payload.created_at);
      chat.latest_message.attachments.set(payload.attachments);
      chat.latest_message.is_own.set(false);
    });

    if (!this.elements.messages) return;
    Object.assign(payload, {
      delivered: signal(false),
      id: signal(payload.id),
      read: signal(false),
      is_own: signal(false)
    });

    let node
    switch (payload.type) {
      case "text": {
        node = new TextMessage(payload);
      } break;
      case "media": {
        node = new MediaMessage(payload);
      } break;
      case "file": {
        node = new FileMessage(payload);
      } break;
      default:
        break;
    }

    if (node) {
      this.elements.messages.append(node)
      this.observer.observe(node);
    }

    if (this.is_at_end) this.scroll_to_bottom();
  }

  on_new_chat(payload) {
    this.ws.send("subscribe", `chats/${payload.id}`);
    let chat = Object.assign(payload, {
      unread_count: signal(0),
      latest_message: {
        is_own: signal(false),
        content: signal(""),
        created_at: signal(undefined),
        attachments: signal([]),
        type: signal(undefined)
      },
    });

    if (this.elements.chats) this.elements.chats.append(new ChatListItem(chat));
    this.chats_map.set(payload.id, chat)
  }

  on_message_read(payload) {
    //TODO: could be improved
    let message = this.elements.messages.querySelector("#" + add_prefix("message", payload.id));
    if (message) message.classList.add("read");
  }
}
