import { option, request } from './utils.js'
import { toast } from './toast.js'
import { add_credential, format_credential_request } from './webauthn.js'

const credential_request_form = document.querySelector(".js-credential-request-form");

credential_request_form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;

  const resource = new URL(form.action);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data)

  const [credential_request, credential_request_err] = await option(request(resource));

  if (credential_request_err) {
    toast(credential_request_err.message, "err");
    return
  }


  const credential = await window.navigator.credentials.create({
    publicKey: format_credential_request(credential_request)
  })

  const [result, err] = await option(add_credential(Object.assign(credential, { title: data.get("title") })))

  if (err) {
    toast(err.message, "err")
    return
  }
});
