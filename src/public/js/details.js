import { request, option, upload_request } from "./utils.js";
import { add_listeners, disable_form, replace_text } from "./dom.js";

const forms = document.querySelectorAll(".js-details-form");
const photo_input = document.querySelector(".js-photo-input");

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
      state: {
        replace: true,
      },
    })
  );

  enable_form(err);
  restore_text();
}

// forms.forEach((form) => form.addEventListener("submit", on_submit));

add_listeners(photo_input, {
  change: on_photo_change,
});

async function on_photo_change(e) {
  const file = e.target.files[0];
  if (!file) return;
  const form = e.target.form;
  const [[url], err] = await option(
    request("/cloudflare/images/direct_upload", {
      body: { files: [{ size: file.size, type: file.type }] },
    })
  );

  const fd = new FormData();
  fd.append("file", file);

  const [uploaded, upload_err] = await option(upload_request(url.uploadURL, { data: fd }));
  console.log({ uploaded });
}
