import { div, span, img } from "dom";

export function ProfileScan(profile) {
  let component = div(
    { class: "max-w-fit shadow-xs py-4 px-8 bg-gray-50 text-center rounded-lg dark:bg-zinc-800" },
    img({
      class: "w-32 h-32 object-cover rounded-full",
      src: profile.profile_photo_url,
      crossorigin: "anonymous",
      referrerpolicy: "no-referrer"
    }),
    span({ class: "text-lg font-medium text-gray-900 block mt-2 dark:text-white" }, profile.name)
  )

  return component;
}
