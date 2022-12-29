import {
  add_listeners,
  remove_node,
  ul,
  classes,
  li,
  attrs,
  img,
  button,
  input,
  label,
  html,
  span
} from "./dom.js";
import { request, option, upload_request, async_pool } from "./utils.js";
import { close_icon } from "./icons.js";

const photos_area = document.querySelector(".js-photos-area");
const photos_input = document.querySelector(".js-photos-input");
const preview_delete_forms = document.querySelectorAll(".js-preview-delete-form");
const attachment_sync_form = document.querySelector(".js-attachment-sync-form");
const posting_form = document.querySelector(".js-posting-form");

function on_drag_over(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
}

function get_photos_preview(photos_area) {
  const existing = document.querySelector(".js-photos-preview");
  if (existing) return existing;
  const photos_preview = ul(classes("js-photos-preview grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6"));
  photos_area.insertAdjacentElement("beforebegin", photos_preview);
  return photos_preview;
}

function get_file_id(file) {
  return `${file.name}${file.lastModified}${file.size}`;
}

async function generate_previews(files = []) {
  const { t } = await import("./i18n.js");
  const container = get_photos_preview(photos_area);
  const children_length = container.children.length;
  for (let i = 0, len = files.length; i < len; i++) {
    const i_children = i + children_length;
    const file = files[i];
    const url = URL.createObjectURL(file);
    const item = li(attrs({ class: "relative group rounded-lg", "data-file_id": get_file_id(file) }));
    const pic = img(attrs({ src: url, class: "rounded-lg h-36 object-cover w-full" }));
    const close_btn = button(attrs({
      type: "button",
      tabindex: "0",
      class: `outline-none group-hover:scale-100 focus:scale-100 focus:ring-2
                                          focus:ring-offset-2 focus:ring-error-500 group-focus:scale-100 md:scale-0 duration-200
                                          absolute z-10 bottom-full left-full translate-y-1/2 -translate-x-1/2 bg-error-500 text-white rounded-full p-0.5`
    }), html(close_icon({ size: 20 })));

    const radio_input = input(attrs({
      type: "radio",
      value: i_children,
      name: "cover_index",
      id: `cover-${i_children}`,
      class: "absolute opacity-0 w-0 -z-10 peer",
      ...(i_children === 0 && { checked: true }),
    }));

    const main_label = label(attrs({
      for: `cover-${i_children}`,
      "data-choose_cover_text": t("form.photos.choose_as_cover", { ns: "new-posting" }),
      "data-cover_text": t("form.photos.cover", { ns: "new-posting" }),
      class: `group-hover:after:scale-100 group-hover:after:opacity-100
                        peer-focus:after:scale-100 peer-focus:after:ring-2
                        peer-focus:after:ring-offset-2 peer-focus:after:ring-primary-600 group-focus:after:scale-100 group-focus:after:opacity-100
                        relative text-xs after:opacity-100 md:after:opacity-50 md:after:scale-0 after:duration-200 after:origin-bottom-left after:absolute after:rounded-bl-lg
                        after:rounded-tr-lg after:whitespace-nowrap after:p-2
                        after:content-[attr(data-choose\\_cover\\_text)] after:bottom-0 after:bg-primary-600
                        after:text-white peer-checked:after:scale-100 peer-checked:after:opacity-100 peer-checked:after:content-[attr(data-cover\\_text)]`,

    }));

    add_listeners(pic, { load: () => URL.revokeObjectURL(url) });

    item.append(pic, close_btn, radio_input, main_label);
    container.append(item);
  }
}

async function on_drop(e) {
  e.stopPropagation();
  e.preventDefault();
  const files = e.dataTransfer.files;

  if (e.currentTarget.classList.contains("js-photos-area")) {
    photos_area.classList.remove("!border-primary-600");
  }

  photos_input.files = files;
  await generate_previews(files);
}

function on_drag_enter(e) {
  if (e.currentTarget.classList.contains("js-photos-area")) {
    photos_area.classList.add("!border-primary-600");
  }
}

function on_drag_leave(e) {
  if (e.currentTarget.classList.contains("js-photos-area")) {
    photos_area.classList.remove("!border-primary-600");
  }
}

function on_progress(item) {
  item.classList.add("pointer-events-none");
  const upload_progress = span(attrs({
    class: "upload-progress absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg"
  }));

  upload_progress.textContent = "0";
  item.append(upload_progress);
  return (progress) => {
    upload_progress.textContent = `${Math.floor(progress.percent)}%`;
  };
}

function on_done(item) {
  return () => {
    item.classList.remove("pointer-events-none");
    const upload_progress = item.querySelector(".upload-progress");
    if (upload_progress) upload_progress.remove();
  };
}

function upload_to(urls) {
  const container = get_photos_preview(photos_area);
  return async function upload(file) {
    const item = container.querySelector(`[data-file_id="${get_file_id(file)}"]`);
    const url = urls.shift();
    const fd = new FormData();
    fd.append("file", file);
    const [result, err] = await option(
      upload_request(url.uploadURL, {
        data: fd,
        on_progress: on_progress(item),
        on_done: on_done(item),
      })
    );

    if (result) {
      const close_btn = item.querySelector("button");
      add_listeners(close_btn, {
        click: async () => {
          const li = item;
          const radio_input = li.querySelector("input[type=radio]");
          const photo_input = posting_form.querySelector(`#photos-${result.result.id}`);

          const restore_li = remove_node(li);
          const restore_photo_input = remove_node(photo_input);

          const container = get_photos_preview(photos_area);
          if (radio_input.checked) {
            const first_radio_input = container.querySelector("input[type=radio]");
            if (first_radio_input) first_radio_input.checked = true;
          }

          const [_, err] = await option(
            request(new URL(window.location.href).pathname + "/attachments/" + result.result.id, {
              method: "DELETE",
            })
          );

          if (err) {
            restore_li();
            restore_photo_input();
            return;
          }
          if (!container.children.length) container.remove();
        },
      });
    }
    return result;
  };
}

async function upload_files(files = []) {
  const [urls, err] = await option(
    request("/cloudflare/images/direct_upload", {
      body: { files: Array.from(files).map((file) => ({ size: file.size, type: file.type })) },
    })
  );

  for await (const result of async_pool(10, files, upload_to(urls))) {
    const photo_input = input(attrs({
      type: "hidden",
      name: "photos",
      value: result.result.id,
      id: `photos-${result.result.id}`,
    }));

    posting_form.prepend(photo_input);

    const [_, err] = await option(
      request(attachment_sync_form.action, {
        method: "PATCH",
        body: { photo_id: result.result.id },
      })
    );

    if (err) {
      toast(err.message, "err");
    }
  }
}

async function on_photos_change(e) {
  const files = e.target.files;
  if (!files.length) return;
  await generate_previews(files);
  await upload_files(files);
}

async function on_existing_delete(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const li = e.submitter.closest("li");
  const radio_input = li.querySelector("input[type=radio]");
  const photo_input = posting_form.querySelector(`#photos-${data.get("photo_id")}`);

  const restore_photo_input = remove_node(photo_input);
  const restore_li = remove_node(li);

  const container = get_photos_preview(photos_area);
  if (radio_input.checked) {
    const first_radio_input = container.querySelector("input[type=radio]");
    if (first_radio_input) first_radio_input.checked = true;
  }

  const [result, err] = await option(request(new URL(form.action), { method: "DELETE" }));

  if (err) {
    restore_li();
    restore_photo_input();
    return;
  }

  if (!container.children.length) container.remove();
}

add_listeners(preview_delete_forms, {
  submit: on_existing_delete,
});

add_listeners(photos_area, {
  dragover: on_drag_over,
  drop: on_drop,
  dragenter: on_drag_enter,
  dragleave: on_drag_leave,
});

add_listeners(photos_input, {
  change: on_photos_change,
});
