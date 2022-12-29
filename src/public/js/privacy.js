import { option, request } from "./utils.js";
import { toast } from "./toast.js";
import { add_listeners } from "./dom.js";
import { add_credential, format_credential_request } from "./webauthn.js";
import Dialog from "./dialog.js";

const credential_request_form = document.querySelector(".js-credential-request-form");
const credential_remove_btns = document.querySelectorAll('.js-credential-remove-btn');
const dialogs = document.querySelectorAll('dialog');

async function on_credential_add(e) {
  e.preventDefault();
  const form = e.target;
  const resource = new URL(form.action);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data);

  const [credential_request, credential_request_err] = await option(request(resource));

  if (credential_request_err) {
    toast(credential_request_err.message, "err");
    return;
  }

  const credential = await window.navigator.credentials.create({
    publicKey: format_credential_request(credential_request),
  });

  const [_, err] = await option(
    add_credential(Object.assign(credential, { title: data.get("title") }))
  );

  if (err) {
    toast(err.message, "err");
    return;
  }
}

function on_remove_intent(e) {
  const form = e.target.nextElementSibling;
  window.MiniDialog.showModal();

  window.MiniDialog.addEventListener("closed", async (e) => {
    const dialog = e.target;
    if (dialog.returnValue === "confirm") {
      const [_, err] = await option(request(form.action, { method: form.method, body: Object.fromEntries(new FormData(form)), state: { replace: true, reload: true } }));
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
