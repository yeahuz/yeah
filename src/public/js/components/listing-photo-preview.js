import { li, img, div, ul, fragment } from "dom";
import { effect } from "state";

let existing = null;

let photos_area = document.querySelector(".js-photos-area");
export function ListingPhotoPreview(file) {
  let src = file.url ? `${file.url}/width=200` : URL.createObjectURL(file);
  let component = li(
    { class: "relative group rounded-lg" },
    img({ src: src, class: "rounded-lg h-36 object-cover w-full" })
  )

  return component;
}

export function ListingPhotoPreviews(files) {
  let list = fragment();
  for (let file of files()) list.append(ListingPhotoPreview(file));

  effect(() => {
    if (files().length > 0) {
      if (!existing) {
        existing = ul({ class: "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-6" })
        photos_area.insertAdjacentElement("beforebegin", existing);
      }
      existing.append(list);
    } else {
      if (existing) {
        existing.remove()
        existing = null
      }
    }
  });
}
