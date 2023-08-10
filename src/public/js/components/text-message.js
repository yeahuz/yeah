import { li, p, div, classes, html, span } from "dom";
import { check_icon, clock_icon } from "../icons.js";
import { effect } from "state";
import { add_prefix } from "../utils.js";

const formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

export class TextMessageClass {
  constructor(data, is_own) {
    this.data = data;
    this.el = li(
      { id: data.temp_id },
      classes([
        "p-2 rounded-lg block relative max-w-md w-fit",
        is_own ? "ml-auto text-white bg-primary-600" : "mr-auto text-gray-900 bg-gray-100 dark:text-white dark:bg-zinc-800"
      ]),
      p(data.content),
      div(
        classes([
          "js-date-info flex items-center justify-end text-xs mt-0.5 space-x-1",
          is_own ? "text-primary-50" : "text-gray-500 dark:text-gray-300"
        ]),
        span(formatter.format(new Date(data.created_at))),
        is_own && span(
          { class: "js-date-info-clock" },
          html(clock_icon({ size: 14 }))
        )
      )
    );
  }
}

let condition = (cond, truthy, falsey) => (parent, pos) => {
  effect(() => {
    if (cond()) {
      if (falsey) falsey.remove();
      return parent.insertBefore(truthy, parent.children[pos - 1]);
    } else if (falsey) {
      return parent.insertBefore(falsey, parent.children[pos - 1]);
    }
  });

  return falsey;
};

export function TextMessage(message) {
  let component = li(
    {
      id: () => add_prefix("message", message(m => m.id)),
      "data-id": () => message(m => m.id),
      "data-chat_id": message(m => m.chat_id),
    },
    classes([
      "p-2 rounded-lg block relative max-w-md w-fit",
      message(m => m.is_own) ? "ml-auto text-white bg-primary-600" : "mr-auto text-gray-900 bg-gray-100 dark:text-white dark:bg-zinc-800"
    ]),
    p(message(m => m.content)),
    div(
      classes([
        "js-date-info flex items-center justify-end text-xs mt-0.5 space-x-1",
        message(m => m.is_own) ? "text-primary-50" : "text-gray-500 dark:text-gray-300"
      ]),
      span(formatter.format(new Date())),
      message(m => m.is_own) && condition(() => message(m => m.delivered), span(html(check_icon({ size: 14 }))), span({ class: "js-date-info-clock" }, html(clock_icon({ size: 14 }))))
      //message(m => m.is_own) && span({ class: "js-date-info-clock" }, html(clock_icon({ size: 14 })))
    )
  );

  return component;
}
