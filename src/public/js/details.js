import { request, option, upload_request } from "./utils.js";
import { add_listeners, create_node } from "./dom.js";

const photo_input = document.querySelector(".js-photo-input");
const profile_photo_container = document.querySelector(".js-profile-photo-container");

add_listeners(photo_input, {
  change: on_photo_change,
});

function on_progress(item) {
  item.classList.add("pointer-events-none");
  const span = create_node("span", {
    class:
      "upload-progress absolute top-0 left-0 w-full h-full bg-black/70 flex items-center justify-center rounded-lg",
  });
  span.textContent = "0";
  item.append(span);
  return (progress) => {
    span.textContent = `${Math.floor(progress.percent)}%`;
  };
}

function on_done(item) {
  return () => {
    item.classList.remove("pointer-events-none");
    const upload_progress = item.querySelector(".upload-progress");
    if (upload_progress) upload_progress.remove();
  };
}

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

  const [uploaded, upload_err] = await option(
    upload_request(url.upload_url, {
      data: fd,
      on_progress: on_progress(profile_photo_container),
      on_done: on_done(profile_photo_container),
    })
  );

  const [result, update_err] = await option(
    request(form.action, {
      body: { photo_id: uploaded.result.id },
      state: { replace: true, reload: true },
    })
  );
}
