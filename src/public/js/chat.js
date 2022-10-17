import { add_listeners, create_node } from "./dom.js";
import { chat_files_preview_tmpl, chat_photo_previews_tmpl } from "./templates.js";

const files_input = document.querySelector(".js-files");
const chat_actions_container = document.querySelector(".js-chat-actions-container");

function get_files_preview_container() {
  const existing = chat_actions_container.querySelector(".js-files-preview");
  if (existing) return existing;
  const container = create_node("div", {
    class:
      "max-w-xs w-full bg-white border border-gray-100 shadow-xs p-2 mb-2 rounded-lg space-y-3 absolute bottom-full dark:bg-zinc-800 dark:border-zinc-700 js-files-preview max-h-52 overflow-y-auto",
  });

  chat_actions_container.prepend(container);

  return container;
}

function on_files_change(e) {
  const files = e.target.files;
  if (!files.length) return;
  generate_previews(files);
}

function is_image(type) {
  return /image\/*/.test(type);
}

function generate_previews(files = []) {
  const image_files = [];
  const other_files = [];

  for (const file of files) {
    if (is_image(file.type)) {
      image_files.push(file);
    } else {
      other_files.push(file);
    }
  }

  const files_preview = get_files_preview_container();
  if (image_files.length)
    files_preview.append(chat_photo_previews_tmpl(image_files, files_preview));
  if (other_files.length) files_preview.append(chat_files_preview_tmpl(other_files, files_preview));
}

add_listeners(files_input, {
  change: on_files_change,
});
