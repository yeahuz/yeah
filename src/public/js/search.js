import { add_listeners } from "dom";
import { debounce, option, request } from "./utils.js";
import { SearchSuggestions } from "./components/search-suggestion.js";

let search_inputs = document.querySelectorAll(".js-search-input");
let suggestions = document.querySelector(".js-search-suggestions");

async function on_input(e) {
  if (!e.target.checkValidity()) return;
  let form = e.target.form;
  let resource = new URL(`${form.action}/completions`);
  let data = new FormData(form);

  resource.search = new URLSearchParams(data);

  let [results, err] = await option(request(resource));
  suggestions.innerHTML = "";
  suggestions.classList.add("!opacity-100", "!translate-y-0", "!z-10");
  suggestions.append(SearchSuggestions(results, data.get("q")));
}

add_listeners(search_inputs, {
  input: debounce(on_input),
});
