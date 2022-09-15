import { create_node } from "./dom.js";

export function scan_profile_tmpl(profile) {
  const div = create_node("div", {
    class: "shadow-xs py-4 px-8 bg-gray-50 text-center rounded-lg",
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
  const img = create_node("img", { src: url, class: "w-36 h-36 object-cover js-qr-code" });
  const h2 = create_node("h2", { class: "text-gray-900 text-lg font-medium mt-2 dark:text-white" });
  const p = create_node("p", { class: "text-gray-700 dark:text-gray-200" });

  h2.textContent = t("qr.title", { ns: "login" });
  p.textContent = t("qr.description", { ns: "login" });
  fragment.append(img, h2, p);

  return fragment;
}
