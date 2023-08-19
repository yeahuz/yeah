import { li, a, ul, span } from "dom";

export function SearchSuggestion(suggestion, query) {
  let component = li(
    a(
      {
        class: "text-gray-900 block p-2.5 hover:bg-gray-50 duration-200 peer-checked:bg-gray-50 hover: dark:text-gray-200 dark:hover:bg-zinc-800",
        href: `/search?q=${query}${suggestion}`,
      },
      query,
      span({ class: "font-semibold" }, suggestion)
    )
  )

  return component;
}

export function SearchSuggestions(suggestions, query) {
  let list = ul();
  for (let suggestion of suggestions) {
    list.append(SearchSuggestion(suggestion, query))
  }

  return list;
}
