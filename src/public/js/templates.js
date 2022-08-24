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

  const span = create_node("span", { class: "text-lg font-medium text-gray-900 block mt-2" });
  span.textContent = profile.name;

  div.append(img, span);

  return div;
}
