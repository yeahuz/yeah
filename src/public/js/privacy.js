import { option, request } from "./utils.js";
import { toast } from "./toast.js";
import { add_listeners } from "dom";
import { add_credential, format_credential_request } from "./webauthn.js";
import Dialog from "./dialog.js";

let credential_request_form = document.querySelector(".js-credential-request-form");
let credential_remove_btns = document.querySelectorAll('.js-credential-remove-btn');
let dialogs = document.querySelectorAll('dialog');

async function on_credential_add(e) {
  e.preventDefault();
  let form = e.target;
  let resource = new URL(form.action);
  let data = new FormData(form);

  resource.search = new URLSearchParams(data);

  let [credential_request, credential_request_err] = await option(request(resource));

  if (credential_request_err) {
    toast(credential_request_err.message, "err");
    return;
  }

  let credential = await window.navigator.credentials.create({
    publicKey: format_credential_request(credential_request),
  });

  let [_, err] = await option(
    add_credential(Object.assign(credential, { title: data.get("title") }))
  );

  if (err) {
    toast(err.message, "err");
    return;
  }
}

function on_remove_intent(e) {
  let form = e.target.nextElementSibling;
  window.MiniDialog.showModal();

  window.MiniDialog.addEventListener("closed", async (e) => {
    let dialog = e.target;
    if (dialog.returnValue === "confirm") {
      let [_, err] = await option(request(form.action, { method: form.method, body: Object.fromEntries(new FormData(form)), state: { replace: true, reload: true } }));
      toast(err.message, "err");
    }
  }, { once: true });
}

add_listeners(credential_request_form, {
  submit: on_credential_add,
});

add_listeners(credential_remove_btns, {
  click: on_remove_intent
});

dialogs.forEach(Dialog);
