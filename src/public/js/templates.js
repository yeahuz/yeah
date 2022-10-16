import { create_node } from "./dom.js";

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
  const img_container = create_node("div", { class: "p-3 rounded-lg bg-white max-w-max" });
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
