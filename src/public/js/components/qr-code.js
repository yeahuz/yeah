import { img, fragment, h2, p, div } from "dom";

export async function QRCode(url) {
  let { t } = await import("/public/js/i18n.js");
  let component = fragment(
    div(
      { class: "p-3 rounded-lg bg-white max-w-max" },
      img({ class: "w-40 h-40 object-cover js-qr-code", src: url })
    ),
    h2(
      { class: "text-gray-900 text-lg font-medium mt-3 dark:text-white" },
      t("qr.title", { ns: "login" })
    ),
    p(
      { class: "text-gray-700 dark:text-gray-200" },
      t("qr.description", { ns: "login" })
    ),
  )
  return component;
}
