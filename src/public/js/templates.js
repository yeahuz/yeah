import { create_node } from "./dom.js";
import { format_bytes } from "./utils.js";

export function scan_profile_tmpl(profile) {
  const div = create_node("div", {
    class: "shadow-xs py-4 px-8 bg-gray-50 text-center rounded-lg dark:bg-zinc-800",
  });

  const img = create_node("img", {
    class: "w-32 h-32 object-cover rounded-full",
    src: profile.profile_photo_url,
    crossorigin: "anonymous",
    referrerpolicy: "no-referrer",
  });

  const span = create_node("span", {
    class: "text-lg font-medium text-gray-900 block mt-2 dark:text-white",
  });
  span.textContent = profile.name;

  div.append(img, span);

  return div;
}

export async function qr_code_tmpl(url) {
  const { t } = await import("./i18n.js");
  const fragment = new DocumentFragment();
  const img_container = create_node("div", {
    class: "p-3 rounded-lg bg-white max-w-max",
  });
  const img = create_node("img", { src: url, class: "w-40 h-40 object-cover js-qr-code" });
  const h2 = create_node("h2", { class: "text-gray-900 text-lg font-medium mt-3 dark:text-white" });
  const p = create_node("p", { class: "text-gray-700 dark:text-gray-200" });

  h2.textContent = t("qr.title", { ns: "login" });
  p.textContent = t("qr.description", { ns: "login" });
  img_container.append(img);
  fragment.append(img_container, h2, p);

  return fragment;
}

export function search_suggestion_tmpl(suggestion, query) {
  const li = create_node("li");
  const link = create_node("a", {
    class:
      "text-gray-900 block p-2.5 hover:bg-gray-50 duration-200 peer-checked:bg-gray-50 hover: dark:text-gray-200 dark:hover:bg-zinc-800",
    href: `/search?q=${query}${suggestion}`,
  });
  const span = create_node("span", { class: "font-semibold" });
  span.textContent = suggestion;

  link.textContent = query;
  link.append(span);
  li.append(link);
  return link;
}

export function search_suggestions_tmpl(suggestions, query) {
  const fragment = new DocumentFragment();
  for (const suggestion of suggestions) {
    fragment.append(search_suggestion_tmpl(suggestion, query));
  }
  return fragment;
}

export function chat_photo_previews_tmpl(files = [], container) {
  const fragment = new DocumentFragment();

  for (const file of files) {
    const url = URL.createObjectURL(file);
    const list_item = create_node("li", { class: "flex items-center space-x-2" });
    const img = create_node("img", { src: url, class: "w-11 h-11 object-cover rounded-lg" });
    const info = create_node("div", { class: "flex flex-col space-y-1 overflow-hidden" });
    const filename = create_node("span", {
      class: "font-meidum text-gray-700 text-sm dark:text-gray-200 truncate",
    });
    const filesize = create_node("span", { class: "text-gray-500 dark:text-gray-300 text-xs" });

    filename.textContent = file.name;
    filesize.textContent = format_bytes(file.size);

    info.append(filename, filesize);
    list_item.append(img, info);

    fragment.append(list_item);
  }

  const existing = container.querySelector(".js-photo-previews");
  if (existing) {
    const list = existing.querySelector("ul");
    list.append(fragment);
    return existing;
  }

  const photo_previews = create_node("div", { class: "js-photo-previews" });
  const label = create_node("span", {
    class: "text-sm font-medium text-gray-600 dark:text-gray-300",
  });

  const list = create_node("ul", { class: "mt-1 space-y-2" });
  list.append(fragment);
  label.textContent = "Photos";
  photo_previews.append(label, list);
  return photo_previews;
}

export function chat_files_preview_tmpl(files = [], container) {
  const fragment = new DocumentFragment();

  for (const file of files) {
    const list_item = create_node("li", { class: "flex items-center space-x-2" });
    const span = create_node("span", {
      class:
        "flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300",
    });
    span.innerHTML = `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M14 2.26946V6.4C14 6.96005 14 7.24008 14.109 7.45399C14.2049 7.64215 14.3578 7.79513 14.546 7.89101C14.7599 8 15.0399 8 15.6 8H19.7305M20 9.98822V17.2C20 18.8802 20 19.7202 19.673 20.362C19.3854 20.9265 18.9265 21.3854 18.362 21.673C17.7202 22 16.8802 22 15.2 22H8.8C7.11984 22 6.27976 22 5.63803 21.673C5.07354 21.3854 4.6146 20.9265 4.32698 20.362C4 19.7202 4 18.8802 4 17.2V6.8C4 5.11984 4 4.27976 4.32698 3.63803C4.6146 3.07354 5.07354 2.6146 5.63803 2.32698C6.27976 2 7.11984 2 8.8 2H12.0118C12.7455 2 13.1124 2 13.4577 2.08289C13.7638 2.15638 14.0564 2.27759 14.3249 2.44208C14.6276 2.6276 14.887 2.88703 15.4059 3.40589L18.5941 6.59411C19.113 7.11297 19.3724 7.3724 19.5579 7.67515C19.7224 7.94356 19.8436 8.2362 19.9171 8.5423C20 8.88757 20 9.25445 20 9.98822Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>`;

    const info = create_node("div", { class: "flex flex-col space-y-1 overflow-hidden" });
    const filename = create_node("span", {
      class: "font-meidum text-gray-700 text-sm dark:text-gray-200 truncate",
    });

    const filesize = create_node("span", { class: "text-gray-500 dark:text-gray-300 text-xs" });

    filename.textContent = file.name;
    filesize.textContent = format_bytes(file.size);

    info.append(filename, filesize);
    list_item.append(span, info);

    fragment.append(list_item);
  }

  const existing = container.querySelector(".js-file-previews");

  if (existing) {
    const list = existing.querySelector("ul");
    list.append(fragment);
    return existing;
  }

  const file_previews = create_node("div", { class: "js-file-previews" });
  const label = create_node("span", {
    class: "text-sm font-medium text-gray-600 dark:text-gray-300",
  });
  const list = create_node("ul", { class: "mt-1 space-y-2" });
  list.append(fragment);
  label.textContent = "Files";
  file_previews.append(label, list);
  return file_previews;
}
