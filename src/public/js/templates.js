import {
  classes,
  h2,
  div,
  span,
  ul,
  li,
  img,
  attrs,
  text,
  a,
  p,
  html,
  children,
  fragment
} from "./dom.js";
import { format_bytes } from "./utils.js";
import { clock_icon, file_icon, arrow_down } from "./icons.js";

const formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

export function scan_profile_tmpl(profile) {
  const profile_pic = img(
    attrs({
      src: profile.profile_photo_url,
      crossorigin: "anonymous",
      referrerpolicy: "no-referrer",
      class: "w-32 h-32 object-cover rounded-full",
    })
  );

  const profile_name = span(
    attrs({ class: "text-lg font-medium text-gray-900 block mt-2 dark:text-white" }),
    text(profile.name)
  );

  const container = div(
    attrs({ class: "shadow-xs py-4 px-8 bg-gray-50 text-center rounded-lg dark:bg-zinc-800" }),
    children(profile_pic, profile_name)
  );

  return container;
}

export async function qr_code_tmpl(url) {
  const { t } = await import("./i18n.js");

  const qr_img = img(attrs({ src: url, class: "w-40 h-40 object-cover js-qr-code" }));
  const heading = h2(
    attrs({ class: "text-gray-900 text-lg font-medium mt-3 dark:text-white" }),
    text(t("qr.title", { ns: "login" }))
  );

  const description = p(
    attrs({ classes: "text-gray-700 dark:text-gray-200" }),
    text(t("qr.description", { ns: "login" }))
  );

  const container = div(attrs({ class: "p-3 rounded-lg bg-white max-w-max" }), children(qr_img));

  return fragment(children(container, heading, description));
}

export function search_suggestion_tmpl(suggestion, query) {
  const item = li();
  const link = a(
    attrs({
      class:
        "text-gray-900 block p-2.5 hover:bg-gray-50 duration-200 peer-checked:bg-gray-50 hover: dark:text-gray-200 dark:hover:bg-zinc-800",
      href: `/search?q=${query}${suggestion}`,
    }),
    text(query)
  );

  const content = span(attrs({ class: "font-semibold" }), text(suggestion));

  link.append(content);
  item.append(link);
  return item;
}

export function search_suggestions_tmpl(suggestions, query) {
  const list = fragment();

  for (const suggestion of suggestions) {
    list.append(search_suggestion_tmpl(suggestion, query));
  }

  return list;
}


export function file_message_tmpl(message, is_own_file = true) {
  const list = ul(classes("flex flex-col space-y-2"));
  const date = span(text(formatter.format(new Date(message.created_at))));

  const info = div(
    classes("flex text-xs self-end space-x-1 items-center"),
    children(date)
  );

  if (is_own_file) {
    const clock = span(
      classes("js-date-info-clock"),
      html(clock_icon({ size: 14 }))
    );

    info.append(clock);
  }

  for (const file of message.files || message.attachments) {
    const left = div(
      classes("rounded-lg h-8 w-8 flex items-center justify-center", {
        "bg-gray-100 text-gray-600 dark:bg-white dark:text-primary-600": is_own_file,
        "dark:bg-zinc-700": !is_own_file
      }),
      html(file_icon({ size: 20 }))
    );

    const link = a(
      attrs({
        class: "underline decoration-transparent hover:decoration-white duration-300",
        href: file.url || "#"
      }),
      text(file.name)
    );

    const file_size = span(
      classes("text-xs"),
      text(format_bytes(file.size))
    );

    const right = div(
      classes("flex flex-col"),
      children(link, file_size)
    );

    const item = li(
      classes("flex items-start space-x-2"),
      children(left, right)
    );

    list.append(item);
  }

  const msg = li(
    attrs({
      id: message.temp_id,
    }),
    classes("p-2 rounded-lg flex flex-col relative max-w-md w-fit text-white", {
      "ml-auto bg-primary-600": is_own_file,
      "bg-gray-100 dark:bg-zinc-800 mr-auto text-gray-900 dark:text-white": !is_own_file
    }),
    children(list, info)
  );

  return msg;
}

export function media_message_tmpl(message, is_own_media = true) {
  const date = span(text(formatter.format(new Date(message.created_at))));

  const info = div(
    attrs({
      class:
        "js-date-info inline-flex items-center space-x-1 py-0.5 px-2 rounded-lg text-xs text-white absolute bottom-2 right-2 bg-black/50",
    }),
    children(date)
  );

  if (is_own_media) {
    const clock = span(
      attrs({ class: "js-date-info-clock" }),
      html(clock_icon({ size: 14 }))
    );
    info.append(clock);
  }

  const list = ul(
    attrs({
      class: "flex flex-wrap justify-end gap-0.5 bg-primary-600 p-0.5 rounded-lg js-image-viewer",
    })
  );


  const msg = li(
    attrs({ id: message.temp_id }),
    classes("w-full max-w-md relative", {
      "ml-auto": is_own_media,
      "mr-auto": !is_own_media,
    }),
    children(list, info)
  );

  for (const file of message.files || message.attachments) {
    const src = file.url ? `${file.url}/width=10` : URL.createObjectURL(file.raw);
    const photo = img(attrs({ class: "w-full h-full object-cover align-middle rounded-lg", src }));
    const file_size = span(classes("absolute left-1 top-1 inline-block bg-black/50 rounded-lg py-0.5 px-2 text-white text-xs"), text(format_bytes(file.size)));

    const item = li(
      attrs({ class: "basis-40 flex-1 max-h-64 relative", id: file.temp_id }),
      children(file_size, photo)
    );
    list.append(item);
  }

  return msg;
}

export function text_message_tmpl(payload, is_own_message) {
  const content = p(text(payload.content));
  const date_info = div(
    classes("js-date-info flex items-center justify-end text-xs mt-0.5 space-x-1", {
      "text-primary-50": is_own_message,
      "text-gray-500 dark:text-gray-300": !is_own_message,
    })
  );

  const msg = li(
    attrs({
      id: payload.temp_id,
      "data-chat_id": payload.chat_id
    }),
    classes("p-2 rounded-lg block relative max-w-md w-fit", {
      "ml-auto text-white bg-primary-600": is_own_message,
      "mr-auto text-gray-900 bg-gray-100 dark:text-white dark:bg-zinc-800": !is_own_message,
    }),
    children(content, date_info)
  );

  const time = span(
    text(formatter.format(new Date(payload.created_at)))
  );

  if (is_own_message) {
    const clock = span(
      classes("js-date-info-clock"),
      html(clock_icon({ size: 14 }))
    );
    date_info.append(time, clock);
  } else date_info.append(time);

  return msg;
}

export function chat_list_item_tmpl(payload) {
  const chat_link = a(attrs({
    href: `/chats/${payload.id}#${payload.id}`,
    class: "after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0",
  }));

  const latest_message_date = span(classes("text-gray-500 dark:text-gray-300 text-sm js-latest-date"), text(Date.now()));
  const latest_message = p(classes("text-gray-500 dark:text-gray-300 text-sm truncate mt-2 js-latest-message"));

  const posting_cover = img(attrs({
    src: payload.posting.cover_url + "/width=80",
    class: "w-12 h-12 object-cover rounded-full overflow-hidden mr-2 flex-shrink-0",
    crossorigin: "anonymous"
  }));

  const posting_link = a(attrs({
    href: payload.posting.url,
    class: "relative underline decoration-transparent hover:decoration-white duration-200 text-gray-700 dark:text-gray-200 font-medium truncate"
  }), text(payload.posting.title));

  const members = span(attrs({
    class: "text-gray-500 dark:text-gray-300 text-sm truncate"
  }), text(payload.posting.creator));

  const members_container = div(
    classes("flex flex-col max-w-[200px]"),
    children(members, posting_link)
  );

  const container_left = div(
    classes("flex items-center"),
    children(
      posting_cover,
      members_container,
    )
  );

  const container = div(
    classes("flex items-start justify-between"),
    children(
      container_left,
      latest_message_date
    )
  );

  const item = li(
    attrs({
      id: `chat-${payload.id}`,
      class: "flex flex-col hover:bg-gray-100 dark:hover:bg-zinc-800 duration-200 p-4 relative"
    }),
    children(
      chat_link,
      container,
      latest_message
    ));

  return item;
}
