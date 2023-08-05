import { li, p, div, classes, html, span } from "dom";
import { clock_icon } from "../icons.js";


const formatter = new Intl.DateTimeFormat(navigator.language, {
  hour: "numeric",
  minute: "numeric",
});

export class TextMessage {
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
    )
  }
}
