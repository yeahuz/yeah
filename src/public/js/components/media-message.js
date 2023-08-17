import { li, ul, div, classes, html, span, form, input, condition, button, img } from "dom";
import { add_prefix, format_bytes } from "../utils.js";
import { arrow_down, check_icon, clock_icon } from "../icons.js";

let formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

function Attachments(message) {
  let list = ul({
    class: "flex flex-wrap justify-end gap-0.5 bg-primary-600 p-0.5 rounded-lg js-image-viewer"
  });

  for (let a of message(m => m.files || m.attachments)) {
    let src = a.url ? `${a.url}/width=10` : URL.createObjectURL(a.raw);
    let item = li(
      { class: "basis-40 flex-1 max-h-64 relative" },
      span({ class: "absolute left-1 top-1 inline-block bg-black/50 rounded-lg py-0.5 px-2 text-white text-xs" }, format_bytes(a.size)),
      img({
        class: "cursor-zoom-in w-full h-full object-cover align-middle rounded-lg js-zoomable",
        src,
        crossorigin: "anonymous",
        referrerpolicy: "no-referrer",
        "data-photo_url": a.url,
        "data-object_url": a.raw ? src : "",
      })
    );

    list.append(item);
  }

  return list;
}

export function MediaMessage(message) {
  let component = li(
    {
      id: () => add_prefix("message", message().id),
      "data-id": message().id,
      "data-chat_id": message().chat_id
    },
    classes([
      "group w-full max-w-md relative",
      message().is_own ? "ml-auto" : "mr-auto"
    ]),
    !message().is_own && form(
      { api_action: `/api/chats/${message().chat_id}/messages/${message().id}`, api_method: "PATCH" },
      input({ type: "hidden", name: "chat_id", value: message().chat_id }),
      input({ type: "hidden", name: "id", value: message().id }),
      input({ type: "hidden", name: "_action", value: "read" })
    ),
    Attachments(message),
    div(
      classes([
        "inline-flex items-center space-x-1 py-0.5 px-2 rounded-lg text-xs text-white absolute bottom-2 right-2 bg-black/50"
      ]),
      span(formatter.format(new Date(message(m => m.created_at) || Date.now()))),
      message(m => m.is_own) && condition(() => message(m => m.delivered),
        span({ class: "flex" }, html(check_icon({ size: 14 })), span({ class: "-ml-2.5 hidden group-[.read]:block" }, html(check_icon({ size: 14 })))),
        span({ class: "js-date-info-clock" }, html(clock_icon({ size: 14 }))))
    )
  );

  return component;
}
