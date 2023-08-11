import { li, a, ul, div, classes, html, span, form, input, condition } from "dom";
import { check_icon, clock_icon, file_icon } from "../icons.js";
import { add_prefix, format_bytes } from "../utils.js";

let formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

export function FileItems(message) {
  let list = ul({ class: "flex flex-col space-y-2" });
  for (let file of message(m => m.files || m.attachments)) {
    let item = li(
      { class: "flex items-start space-x-2" },
      div(
        classes([
          "rounded-lg h-8 w-8 flex items-center justify-center",
          message(m => m.is_own)
            ? "bg-gray-100 text-gray-600 dark:bg-white dark:text-primary-600"
            : "bg-gray-200 dark:bg-zinc-700"
        ]),
        html(file_icon({ size: 20 }))
      ),
      div(
        { class: "flex flex-col" },
        a({ href: file.url || "#" },
          file.name,
          classes([
            "underline decoration-transparent duration-300",
            message(m => m.is_own)
              ? "hover:decoration-white"
              : "hover:decoration-gray-900 dark:hover:decoration-white"
            ])
         ),
        span({ class: "text-xs" }, format_bytes(file.size))
      )
    );

    list.append(item);
  }

  return list;
}

export function FileMessage(message) {
  let component = li(
    {
      id: () => add_prefix("message", message(m => m.id)),
      "data-id": () => message(m => m.id),
      "data-chat_id": message(m => m.chat_id),
    },
    message(m => !m.is_own) && form(
      { api_action: `/api/chats/${message(m => m.chat_id)}/messages/${message(m => m.id)}`, api_method: "PATCH" },
      input({ type: "hidden", name: "chat_id", value: message(m => m.chat_id) }),
      input({ type: "hidden", name: "id", value: message(m => m.id) }),
      input({ type: "hidden", name: "_action", value: "read" })
    ),
    classes([
      "group p-2 rounded-lg flex flex-col relative max-w-md w-fit",
      message(m => m.is_own) ? "bg-primary-600 ml-auto text-white" : "mr-auto bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
    ]),
    FileItems(message),
    div(
      classes([
        "js-date-info flex items-center justify-end text-xs mt-0.5 space-x-1",
        message(m => m.is_own) ? "text-primary-50" : "text-gray-500 dark:text-gray-300"
      ]),
      span(formatter.format(new Date())),
      message(m => m.is_own) && condition(() => message(m => m.delivered),
                                         span({ class: "flex" }, html(check_icon({ size: 14 })), span({ class: "-ml-2.5 hidden group-[.read]:block" }, html(check_icon({ size: 14 })))),
                                         span({ class: "js-date-info-clock" }, html(clock_icon({ size: 14 }))))
    )
  );

  return component;
}
