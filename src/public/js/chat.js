import { add_listeners, create_node } from "./dom.js";
import { media_message_tmpl, file_message_tmpl } from "./templates.js";
import { option, request, async_pool, upload_request, generate_srcset } from "./utils.js";
import { toast } from "./toast.js";

const files_input = document.querySelector(".js-files");
const messages = document.querySelector(".js-messages");
const photos_link_form = document.querySelector(".js-photos-link-form");
const files_link_form = document.querySelector(".js-files-link-form");
const photo_download_btns = document.querySelectorAll(".js-photo-download-btn");
const file_download_btns = document.querySelectorAll(".js-file-download-btn");

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

  const photos = [];
  for await (const [result, err] of async_pool(10, files, upload_media_to(urls))) {
    photos.push(result.result.id);
  }

  await request(photos_link_form.action, { method: photos_link_form.method, body: { photos } });
}

async function upload_files(files = []) {
  const [urls, err] = await option(
    request("/cloudflare/r2/direct_upload", {
      body: {
        files: files.map((file) => ({ name: file.name, size: String(file.size), type: file.type })),
      },
    })
  );

  if (err) {
    toast("Unable to create direct creator upload urls. Please try again", "err");
    return;
  }

  const file_ids = [];
  for await (const [result, err] of async_pool(10, files, upload_files_to(urls))) {
    file_ids.push(result.id);
  }

  await request(files_link_form.action, {
    method: files_link_form.method,
    body: { files: file_ids },
  });
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

  if (media_files.length) {
    messages.append(media_message_tmpl(media_files));
    upload_media_files(media_files);
  }
  if (other_files.length) {
    messages.append(file_message_tmpl(other_files));
    upload_files(other_files);
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

add_listeners(files_input, {
  change: on_files_change,
});

add_listeners(file_download_btns, {
  click: on_file_download,
});
add_listeners(photo_download_btns, {
  click: on_photo_download,
});
