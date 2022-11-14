import { classes, h2, div, span, ul, li, img, attrs, text, a, p, html } from "./dom-v2.js";
import { format_bytes, pipe } from "./utils.js";
import { clock_icon, file_icon, arrow_down } from "./icons.js";

export function scan_profile_tmpl(profile) {
  const container = div(
    attrs({ class: "shadow-xs py-4 px-8 bg-gray-50 text-center rounded-lg dark:bg-zinc-800" })
  );

  const profile_pic = img(
    attrs({
      src: profile.profile_photo_url,
      crossorigin: "anonymous",
      referrerpolicy: "no-referrer",
      class: "w-32 h-32 object-cover rounded-full",
    })
  );
  const profile_name = span(
    pipe(
      attrs({ class: "text-lg font-medium text-gray-900 block mt-2 dark:text-white" }),
      text(profile.name)
    )
  );

  container.append(profile_pic, profile_name);
}

export async function qr_code_tmpl(url) {
  const { t } = await import("./i18n.js");
  const fragment = new DocumentFragment();
  const container = div(attrs({ class: "p-3 rounded-lg bg-white max-w-max" }));

  const qr_img = img(attrs({ src: url, class: "w-40 h-40 object-cover js-qr-code" }));
  const heading = h2(
    pipe(
      attrs({ class: "text-gray-900 text-lg font-medium mt-3 dark:text-white" }),
      text(t("qr.title", { ns: "login" }))
    )
  );

  const description = p(
    pipe(
      attrs({ classes: "text-gray-700 dark:text-gray-200" }),
      text(t("qr.description", { ns: "login" }))
    )
  );

  container.append(qr_img);
  fragment.append(container, heading, description);

  return fragment;
}

export function search_suggestion_tmpl(suggestion, query) {
  const item = li();
  const link = a(
    pipe(
      attrs({
        class:
          "text-gray-900 block p-2.5 hover:bg-gray-50 duration-200 peer-checked:bg-gray-50 hover: dark:text-gray-200 dark:hover:bg-zinc-800",
        href: `/search?q=${query}${suggestion}`,
      }),
      text(query)
    )
  );

  const content = span(pipe(attrs({ class: "font-semibold" }), text(suggestion)));

  link.append(content);
  item.append(link);
  return item;
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
    const item = li(attrs({ class: "flex items-center space-x-2" }));
    const photo = img(attrs({ src: url, class: "w-11 h-11 object-cover rounded-lg" }));
    const info = div(attrs({ class: "flex flex-col space-y-1 overflow-hidden" }));
    const filename = span(
      pipe(
        attrs({
          class: "font-meidum text-gray-700 text-sm dark:text-gray-200 truncate",
        }),
        text(file.name)
      )
    );

    const filesize = span(
      pipe(
        attrs({ class: "text-gray-500 dark:text-gray-300 text-xs" }),
        text(format_bytes(file.size))
      )
    );

    info.append(filename, filesize);
    item.append(photo, info);

    fragment.append(item);
  }

  const existing = container.querySelector(".js-photo-previews");
  if (existing) {
    const list = existing.querySelector("ul");
    list.append(fragment);
    return existing;
  }

  const photo_previews = div(attrs({ class: "js-photo-previews" }));
  const label = span(
    pipe(
      attrs({
        class: "text-sm font-medium text-gray-600 dark:text-gray-300",
      }),
      text("Photos")
    )
  );

  const list = ul(attrs({ class: "mt-1 space-y-2" }));
  list.append(fragment);
  photo_previews.append(label, list);
  return photo_previews;
}

export function chat_files_preview_tmpl(files = [], container) {
  const fragment = new DocumentFragment();

  for (const file of files) {
    const item = li(attrs({ class: "flex items-center space-x-2" }));

    const icon = span(
      pipe(
        attrs({
          class:
            "flex items-center justify-center flex-shrink-0 w-11 h-11 rounded-lg bg-gray-100 text-gray-600 dark:bg-zinc-700 dark:text-gray-300",
        }),
        html(file_icon({ size: 20 }))
      )
    );

    const info = div(attrs({ class: "flex flex-col space-y-1 overflow-hidden" }));
    const filename = span(
      pipe(
        attrs({
          class: "font-meidum text-gray-700 text-sm dark:text-gray-200 truncate",
        }),
        text(file.name)
      )
    );

    const filesize = span(
      pipe(
        attrs({ class: "text-gray-500 dark:text-gray-300 text-xs" }),
        text(format_bytes(file.size))
      )
    );

    info.append(filename, filesize);
    item.append(icon, info);

    fragment.append(item);
  }

  const existing = container.querySelector(".js-file-previews");

  if (existing) {
    const list = existing.querySelector("ul");
    list.append(fragment);
    return existing;
  }

  const file_previews = div(attrs({ class: "js-file-previews" }));
  const label = span(
    pipe(
      attrs({
        class: "text-sm font-medium text-gray-600 dark:text-gray-300",
      }),
      text("Files")
    )
  );

  const list = ul(attrs({ class: "mt-1 space-y-2" }));

  list.append(fragment);
  file_previews.append(label, list);
  return file_previews;
}

export function file_message_tmpl(payload, is_own_files = true) {
  const msg = li(
    pipe(
      attrs({ "data-temp_id": payload.temp_id }),
      classes("max-w-md w-fit text-white rounded-lg overflow-hidden", {
        "ml-auto": is_own_files,
        "mr-auto text-gray-900 dark:text-white": !is_own_files,
      })
    )
  );

  const list = ul(attrs({ class: "flex flex-col space-y-1" }));
  for (const file of payload.attachments) {
    const item = li(
      pipe(
        attrs({ "data-id": file.id }),
        classes("max-w-md w-fit flex items-center rounded-l-lg", {
          "bg-primary-600 ml-auto": is_own_files,
          "mr-auto bg-gray-100 dark:bg-zinc-800": !is_own_files,
        })
      )
    );

    const icon_container = div(attrs({ class: "relative group" }));
    const download_btn = a(
      pipe(
        attrs({
          class:
            "w-12 h-12 opacity-0 group-hover:opacity-100 duration-200 absolute flex items-center justify-center top-0 left-1 w-full h-full text-white bg-black/50 rounded-lg js-file-download-btn",
        }),
        html(arrow_down({ size: 20 }))
      )
    );

    const icon = span(
      pipe(
        attrs({
          class:
            "flex items-center justify-center flex-shrink-0 w-12 h-12 ml-1 rounded-lg bg-gray-100 text-gray-600 dark:bg-white dark:text-primary-600 js-file-icon",
        }),
        html(file_icon({ size: 20 }))
      )
    );
    icon_container.append(download_btn, icon);

    const info = div(attrs({ class: "p-2 overflow-hidden w-full" }));
    const file_name = a(
      pipe(
        attrs({
          class:
            "underline decoration-transparent hover:decoration-white duration-300 block font-meidum text-gray-700 dark:text-gray-200 truncate",
        }),
        text(file.name)
      )
    );

    const meta = div(
      attrs({
        class: "flex justify-between text-xs space-x-4 mt-0.5 text-primary-50",
      })
    );

    const file_size = span(text(format_bytes(file.size)));
    const time = span(text("14:45"));
    const date_info = div(
      classes("js-date-info flex items-center justify-end text-xs mt-0.5 space-x-1", {
        "text-primary-50": is_own_files,
        "text-gray-500 dark:text-gray-300": !is_own_files,
      })
    );

    if (is_own_files) {
      const clock = span(
        pipe(attrs({ class: "js-date-info-clock" }), html(clock_icon({ size: 12 })))
      );
      date_info.append(time, clock);
    } else date_info.append(time);

    meta.append(file_size, date_info);
    info.append(file_name, meta);

    item.append(icon_container, info);
    list.append(item);
  }

  msg.append(list);
  return msg;
}

const formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

export function media_message_tmpl(payload) {
  const msg = li(
    attrs({ class: "w-full max-w-sm ml-auto relative", "data-temp_id": payload.temp_id })
  );

  const list = ul(
    attrs({ class: "flex flex-wrap justify-end gap-0.5 bg-primary-600 p-0.5 rounded-lg" })
  );

  const date_info = div(
    attrs({
      class:
        "js-date-info inline-flex items-center space-x-1 py-0.5 px-2 rounded-lg text-xs text-white absolute bottom-2 right-2 bg-black/50",
    })
  );

  const time = span(text(formatter.format(new Date())));
  const clock = span(pipe(attrs({ class: "js-date-info-clock" }), html(clock_icon({ size: 12 }))));

  date_info.append(time, clock);

  for (const file of payload.attachments) {
    const src = URL.createObjectURL(file);
    const item = li(attrs({ class: "basis-40 flex-1 max-h-64 relative", "data-id": file.id }));
    const photo = img(attrs({ class: "w-full h-full object-cover align-middle rounded-lg", src }));

    item.append(photo);
    list.append(item);
  }

  msg.append(list, date_info);

  return msg;
}

export function text_message_tmpl(payload, is_own_message) {
  const msg = li(
    pipe(
      attrs({
        "data-temp_id": payload.temp_id,
      }),
      classes("p-2 rounded-lg block relative max-w-md w-fit", {
        "ml-auto text-white bg-primary-600": is_own_message,
        "mr-auto text-gray-900 bg-gray-100 dark:text-white dark:bg-zinc-800": !is_own_message,
      })
    )
  );

  const content = p(text(payload.content));
  const date_info = div(
    classes("js-date-info flex items-center justify-end text-xs mt-0.5 space-x-1", {
      "text-primary-50": is_own_message,
      "text-gray-500 dark:text-gray-300": !is_own_message,
    })
  );

  const time = span(text(formatter.format(new Date(payload.created_at))));

  if (is_own_message) {
    const clock = span(
      pipe(attrs({ class: "js-date-info-clock" }), html(clock_icon({ size: 12 })))
    );
    date_info.append(time, clock);
  } else date_info.append(time);

  msg.append(content, date_info);

  return msg;
}
