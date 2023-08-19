import { request, option, upload_request } from "./utils.js";
import { add_listeners, text } from "dom";
import { effect, signal } from "state";
import { toast } from "./toast.js";

let photo_input = document.querySelector(".js-photo-input");
let profile_photo_container = document.querySelector(".js-profile-photo-container");
let upload_progress = document.querySelector(".js-upload-progress");

add_listeners(photo_input, {
  change: on_photo_change,
});


let progress = signal(0);
let uploading = signal(false);

effect(() => {
  let loading = uploading();
  text(() => `${progress()}%`)(upload_progress);
  profile_photo_container.classList.toggle("uploading", loading);
});

async function on_photo_change(e) {
  let file = e.target.files[0];
  if (!file) return;
  let form = e.target.form;

  // TODO: handle errors;
  let [url, err] = await option(request("/cf/direct_upload", {
    body: { file: { type: file.type, size: file.size, name: file.name, is_image: true } }
  }))

  let fd = new FormData();
  fd.append("file", file);

  uploading.set(true);
  let [uploaded, upload_err] = await option(
    upload_request(url.upload_url, {
      data: fd,
      on_progress: (p) => progress.set(Math.floor(p.percent)),
      on_done: () => uploading.set(false)
    })
  );

  if (upload_err) {
    toast("Something went wrong uploading the profile picture. Please, try again", "err")
    return
  }

  let [result, update_err] = await option(
    request(form.action, {
      body: { photo_id: uploaded.result.id },
      state: { replace: true, reload: true },
    })
  );

  if (update_err) {
    toast(update_err.message, "err");
  }

  uploading.set(false);
}
