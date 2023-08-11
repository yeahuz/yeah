import { li, p, div, classes, html, span, form, input, condition } from "dom";
import { check_icon, clock_icon } from "../icons.js";
import { add_prefix } from "../utils.js";

const formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

export function TextMessage(message) {
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
      "group p-2 rounded-lg block relative max-w-md w-fit",
      message(m => m.is_own) ? "ml-auto text-white bg-primary-600" : "mr-auto text-gray-900 bg-gray-100 dark:text-white dark:bg-zinc-800"
    ]),
    p(message(m => m.content)),
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
