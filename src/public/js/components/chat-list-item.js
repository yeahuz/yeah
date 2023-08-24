import { div, img, li, a, span, text, p, classes } from "dom";
import { add_prefix, format_relative } from "../utils.js";

export function ChatListItem(chat) {
  let component = li(
    {
      class: "flex flex-col hover:bg-gray-100 dark:hover:bg-zinc-800 duration-200 p-4 relative",
      id: add_prefix("chat", chat.id)
    },
    a({
      href: `/chats/${chat.id}`,
      class: "after:absolute after:top-0 after:left-0 after:right-0 after:bottom-0"
    }),
    div({ class: "flex items-start justify-between" },
      div({ class: "flex items-center" },
        img({
          src: chat.listing.cover_url + "/width=80",
          class: "w-12 h-12 object-cover rounded-full overflow-hidden mr-2 flex-shrink-0",
          crossorigin: "anonymous"
        }),
        div({ class: "flex flex-col max-w-[200px]" },
          span({ class: "text-gray-500 dark:text-gray-300 text-sm truncate" }, chat.listing.creator),
          a(
            { href: chat.listing.url, class: "relative underline decoration-transparent hover:decoration-white duration-200 text-gray-700 dark:text-gray-200 font-medium truncate" },
            chat.listing.title
          )
        ),
      ),
      div({ class: "flex flex-col items-end space-y-2" },
        span(
          { class: "text-gray-500 dark:text-gray-300 text-sm js-latest-date" },
          text(() => chat.latest_message.created_at() ? format_relative(new Date(chat.latest_message.created_at()), new Date()) : "")
        ),
        div(classes(() => [
          "text-xs p-1 min-w-[1.2rem] leading-[0] min-h-[1.2rem] bg-primary-500 text-white items-center justify-center rounded-full js-unread-count",
          chat.unread_count() > 0 ? "inline-flex" : "hidden"
        ]), text(chat.unread_count)),
      ),
    ),
    p(
      { class: "text-gray-500 dark:text-gray-300 text-sm truncate mt-2 js-latest-message" },
      text(chat.latest_message.content)
    )
  );

  return component;
}
