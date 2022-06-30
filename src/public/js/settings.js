import { request, option } from "./utils.js";
import { disable_form, replace_text } from "./dom.js";

const forms = document.querySelectorAll(".js-details-form");

async function on_submit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const enable_form = disable_form(form);
  const button = form.querySelector("button");
  const restore_text = replace_text(button, button.dataset.loading_text);

  const [result, err] = await option(
    request(form.action, {
      method: form.method,
      body: data,
      replace_state: true,
    })
  );

  enable_form(err);
  restore_text();
}

forms.forEach((form) => form.addEventListener("submit", on_submit));
