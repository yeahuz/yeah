import { div, img, li, a, span } from "dom";
import { add_prefix } from "../utils.js";

export class ChatListItem {
  constructor(data) {
    this.data = data;
    this.el = li(
      {
        class: "flex flex-col hover:bg-gray-100 dark:hover:bg-zinc-800 duration-200 p-4 relative",
        id: add_prefix("chat", data.id)
      },
      a({
        href: `/chats/${data.id}#${data.id}`,
        class: "after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0",
      }),
      div({ class: "flex items-start justify-between" },
        div({ class: "flex items-center" },
          img({
            src: data.posting.cover_url + "/width=80",
            class: "w-12 h-12 object-cover rounded-full overflow-hidden mr-2 flex-shrink-0",
            crossorigin: "anonymous"
          }),
          div({ class: "flex flex-col max-w-[200px]" },
            span(
              { class: "text-gray-500 dark:text-gray-300 text-sm truncate" },
              data.members.map(m => m.name).join(", ")
            ),
            a({
              href: data.posting.url,
              class: "relative underline decoration-transparent hover:decoration-white duration-200 text-gray-700 dark:text-gray-200 font-medium truncate"
            }, data.posting.title)
          )
        ),
        span({ class: "text-gray-500 dark:text-gray-300 text-sm js-latest-date" }, Date.now())
      ),
      p({ class: "text-gray-500 dark:text-gray-300 text-sm truncate mt-2 js-latest-message" })
    )
  }

  static from(data) {
    return new ChatListItem(data).el
  }
}
