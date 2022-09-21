import { add_listeners } from "./dom.js";
import { debounce, option, request } from "./utils.js";
import { search_suggestions_tmpl } from "./templates.js";

const search_input = document.querySelector(".js-search-input");
const suggestions = document.querySelector(".js-search-suggestions");

async function on_input(e) {
  if (!e.target.checkValidity()) return;
  const form = e.target.form;
  const resource = new URL(`${form.action}/completions`);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data);

  const [results, err] = await option(request(resource));
  suggestions.innerHTML = "";
  suggestions.classList.add("!opacity-100", "!translate-y-0", "!z-10");
  suggestions.append(search_suggestions_tmpl(results, data.get("q")));
}

add_listeners(search_input, {
  input: debounce(on_input),
});
