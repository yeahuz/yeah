import { add_listeners, create_node } from "./dom.js";
import { media_message_tmpl, file_message_tmpl } from "./templates.js";
import { option, request, async_pool, upload_request } from "./utils.js";
import { toast } from "./toast.js";
// import { openDB } from "/node_modules/idb/with-async-ittr.js";

// const db = await openDB("testo", 1, {
//   upgrade(db) {
//     db.createObjectStore("chat-messages");
//   },
// });

// const tx = db.transaction(["chat-messages"], "readwrite");
// const store = tx.objectStore("chat-messages");
// await store.put("hello", "world");
// await tx.done;

// for await (const cursor of db.transaction("chat-messages").store) {
//   console.log(cursor.value);
// }

// {
//   const tx = db.transaction(["chat-messages"], "readwrite");
//   const store = tx.objectStore("chat-messages");
//   await store.put("another-hello", "another-world");
//   await tx.done;
// }

const files_input = document.querySelector(".js-files");
const messages = document.querySelector(".js-messages");

function upload_to(urls) {
  return async function upload(file) {
    const url = urls.shift();
    const fd = new FormData();
    fd.append("file", file, file.name);
    const [result, err] = await option(upload_request(url, { data: fd, method: "PUT" }));
  };
}

async function upload_files(files = []) {
  const [urls, err] = await option(
    request("/cloudflare/r2/direct_upload", {
      body: { filenames: Array.from(files).map((file) => file.name) },
    })
  );

  for await (const result of async_pool(10, files, upload_to(urls))) {
    console.log({ result });
  }
}

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
    const list_item = messages.querySelector("#" + file.id);
    const url = urls.shift();
    const fd = new FormData();
    fd.append("file", file);

    return option(
      upload_request(url.uploadURL, {
        data: fd,
        on_progress: on_media_progress(list_item),
        on_done: on_media_done(list_item),
      })
    );
  };
}

async function upload_media_files(files = []) {
  const [urls, err] = await option(
    request("/cloudflare/images/direct_upload", {
      body: { files: files.map((file) => ({ size: file.size, type: file.type })) },
    })
  );

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  for await (const [result, err] of async_pool(10, files, upload_media_to(urls))) {
    console.log({ result, err });
  }
}

function is_media(type) {
  return /(image\/*)|(video\/*)/.test(type);
}

async function on_files_change(e) {
  const files = e.target.files;
  if (!files.length) return;

  const media_files = [];
  const other_files = [];

  for (const file of files) {
    const id = Math.random().toString(32).slice(2);
    if (is_media(file.type)) media_files.push(Object.assign(file, { id }));
    else other_files.push(Object.assign(file, { id }));
  }

  if (media_files.length) messages.append(media_message_tmpl(media_files));
  if (other_files.length) messages.append(file_message_tmpl(other_files));
  await upload_media_files(media_files);
  // await upload_files(files);
}

add_listeners(files_input, {
  change: on_files_change,
});
