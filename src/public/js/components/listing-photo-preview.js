import { li, img, button, listeners, span, text, html, form, label, input } from "dom";
import { close_icon } from "../icons.js";

export function ListingPhotoPreview({ file, on_delete, listing, t }) {
  let src = URL.createObjectURL(file.raw);
  let component = li(
    { class: "relative group rounded-lg" },
    img({ src, class: "rounded-lg h-36 object-cover w-full", decoding: "async" }),
    span(
      { class: () => `absolute top-0 left-0 w-full h-full bg-black/70 items-center justify-center rounded-lg ${file.uploading() ? "flex" : "hidden"}` },
      text(() => `${file.progress()}%`)
    ),
    input({
      type: "radio",
      name: "cover_id",
      value: file.id,
      id: () => `cover-${file.id()}`,
      class: "absolute opacity-0 w-0 -z-10 peer",
      form: "listing-form",
      ...(file.order === 0 && { checked: true })
    }),
    label({
      for: () => `cover-${file.id()}`,
      "data-choose_cover_text": t("form.photos.choose_as_cover", { ns: "new-listing" }),
      "data-cover_text": t("form.photos.cover", { ns: "new-listing" }),
      class: `group-hover:after:scale-100 group-hover:after:opacity-100
              peer-focus:after:scale-100 peer-focus:after:ring-2
              peer-focus:after:ring-offset-2 peer-focus:after:ring-primary-600 group-focus:after:scale-100 group-focus:after:opacity-100
              relative text-xs after:opacity-100 md:after:opacity-50 md:after:scale-0 after:duration-200 after:origin-bottom-left after:absolute after:rounded-bl-lg
              after:rounded-tr-lg after:whitespace-nowrap after:p-2
              after:content-[attr(data-choose\\_cover\\_text)] after:bottom-0 after:bg-primary-600
              after:text-white peer-checked:after:scale-100 peer-checked:after:opacity-100 peer-checked:after:content-[attr(data-cover\\_text)]`
    }),
    form(
      { api_action: () => `/api/listings/${listing.id}/attachments/${file.id()}`, api_method: "DELETE", action: `/listings/${listing.id}/attachments/${file.id()}`, method: "post" },
      listeners({
        submit: on_delete
      }),
      button({
        name: "_action",
        value: "delete",
        tabindex: "0",
        class: `outline-none group-hover:scale-100 focus:scale-100 focus:ring-2
              focus:ring-offset-2 focus:ring-error-500 group-focus:scale-100 md:scale-0 duration-200
              absolute z-10 bottom-full left-full translate-y-1/2 -translate-x-1/2 bg-error-500 text-white rounded-full p-0.5`
      }, html(close_icon({ size: 20 }))),
    )
  )

  return component;
}
