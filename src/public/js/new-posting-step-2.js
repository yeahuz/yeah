import { add_listeners, remove_node } from "./dom.js";
import { request, option } from "./utils.js";
import { close_icon } from "./icons.js";

const photos_area = document.querySelector(".js-photos-area");
const photos_input = document.querySelector(".js-photos-input");
const preview_delete_forms = document.querySelectorAll(".js-preview-delete-form");

function on_drag_over(e) {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "copy";
}

function get_photos_preview(photos_area) {
  const existing = document.querySelector(".js-photos-preview");
  if (existing) return existing;
  const photos_preview = create_node("ul", {
    class:
      "js-photos-preview grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6",
  });
  photos_area.insertAdjacentElement("beforebegin", photos_preview);
  return photos_preview;
}

function get_file_id(file) {
  return `${file.name}${file.lastModified}${file.size}`;
}

function remove_file(file_to_remove) {
  const dt = new DataTransfer();
  const files = photos_input.files;
  const container = get_photos_preview(photos_area);

  for (const file of files) {
    if (get_file_id(file) !== get_file_id(file_to_remove)) {
      dt.items.add(file);
    }
  }

  if (!dt.files.length && !container.children.length) {
    container.remove();
  }

  photos_input.files = dt.files;
}

async function generate_previews(files = []) {
  const { t } = await import("./i18n.js");
  const container = get_photos_preview(photos_area);
  const children_length = container.children.length;
  for (let i = 0, len = files.length; i < len; i++) {
    const i_children = i + children_length;
    const file = files[i];
    const url = URL.createObjectURL(file);
    const li = create_node("li", { class: "relative group rounded-lg" });
    const img = create_node("img", {
      src: url,
      class: "min-h-[128px] object-fit rounded-lg aspect-video",
    });
    const close_btn = create_node("button", {
      type: "button",
      tabindex: "0",
      class: `outline-none group-hover:scale-100 focus:scale-100 focus:ring-2
                                          focus:ring-offset-2 focus:ring-error-500 group-focus:scale-100 md:scale-0 duration-200
                                          absolute z-10 bottom-full left-full translate-y-1/2 -translate-x-1/2 bg-error-500 text-white rounded-full p-0.5`,
    });

    const radio_input = create_node("input", {
      type: "radio",
      value: i_children,
      name: "cover_index",
      id: `cover-${i_children}`,
      class: "absolute opacity-0 w-0 -z-10 peer",
      ...(i_children === 0 && { checked: true }),
    });
    const main_label = create_node("label", {
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
    });

    close_btn.innerHTML = close_icon({ size: 20 });

    add_listeners(img, { load: () => URL.revokeObjectURL(url) });
    add_listeners(close_btn, {
      click: () => {
        li.remove();
        remove_file(file);
        if (radio_input.checked) {
          const first_radio_input = container.querySelector("input[type=radio]");
          if (first_radio_input) {
            first_radio_input.checked = true;
          }
        }
      },
    });

    li.append(img, close_btn, radio_input, main_label);
    container.append(li);
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

async function on_photos_change(e) {
  const files = e.target.files;
  if (!files.length) return;
  await generate_previews(files);
}

async function on_existing_delete(e) {
  e.preventDefault();
  const form = e.target;
  const li = e.submitter.closest("li");
  const radio_input = li.querySelector("input[type=radio]");

  const restore_li = remove_node(li);

  const container = get_photos_preview(photos_area);
  if (radio_input.checked) {
    const first_radio_input = container.querySelector("input[type=radio]");
    if (first_radio_input) first_radio_input.checked = true;
  }

  const [result, err] = await option(request(new URL(form.action), { method: "DELETE" }));

  if (err) {
    restore_li();
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
