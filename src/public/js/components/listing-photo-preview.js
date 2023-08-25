import { li, img, button, fragment, listeners, span, text, html, form, label } from "dom";
import { effect } from "state";
import { close_icon } from "../icons.js";

export function ListingPhotoPreview(file, files) {
  let src = file.url ? `${file.url}/thumbnail` : URL.createObjectURL(file.raw);
  let component = li(
    { class: "relative group rounded-lg" },
    img({ src: src, class: "rounded-lg h-36 object-cover w-full", decoding: "async" }),
    span(
      { class: () => `absolute top-0 left-0 w-full h-full bg-black/70 items-center justify-center rounded-lg ${file.uploading() ? "flex" : "hidden"}` },
      text(() => `${file.progress()}%`)
    ),
    form(
      button({
        type: "button",
        tabindex: "0",
        class: `outline-none group-hover:scale-100 focus:scale-100 focus:ring-2
              focus:ring-offset-2 focus:ring-error-500 group-focus:scale-100 md:scale-0 duration-200
              absolute z-10 bottom-full left-full translate-y-1/2 -translate-x-1/2 bg-error-500 text-white rounded-full p-0.5`
      },
        html(close_icon({ size: 20 })),
        listeners({
          click: (e) => {
            files.update(files => files.filter((f) => f.temp_id !== file.temp_id))
            e.target.closest("li").remove();
          }
        })
      ),
    )
  )

  return component;
}

export function ListingPhotoPreviews(files, previews) {
  let list = fragment();
  for (let file of files()) {
    if (file.is_new()) {
      list.append(ListingPhotoPreview(file, files))
      file.is_new.set(false);
    }
  }

  effect(() => {
    previews.classList.toggle("hidden", files().length < 1);
    previews.append(list);
  });
}
