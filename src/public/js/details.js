import { request, option, message_sw } from "./utils.js";
import { disable_form, replace_text } from "./dom.js";

const forms = document.querySelectorAll(".js-details-form");

async function on_submit(e) {
  e.preventDefault();
  const form = e.target;
  const { cache_key } = form.dataset
  const data = Object.fromEntries(new FormData(form));

  const enable_form = disable_form(form);
  const button = form.querySelector("button");
  const restore_text = replace_text(button, button.dataset.loading_text);

  const [result, err] = await option(
    request(form.action, {
      method: form.method,
      body: data,
    })
  );

  enable_form(err);
  restore_text();

  if (!err && cache_key) {
    await message_sw({ type: "delete_content", payload: { cache_name: "swr_content", url: cache_key } });
  }
}

forms.forEach((form) => form.addEventListener("submit", on_submit));
