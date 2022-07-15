import { request, option } from './utils.js'
import { format_assertion_request, verify_assertion } from './webauthn.js'
import { disable_form, replace_text } from './dom.js'
import { toast } from './toast.js'

const assertion_request_form = document.querySelector(".js-assertion-request-form");

assertion_request_form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const resource = new URL(form.action);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data);

  const enable_form = disable_form(form);
  const button = form.querySelector("button");
  const restore_text = replace_text(button, button.dataset.loading_text);

  const [assertion_request, assertion_request_err] = await option(request(resource));

  if (assertion_request_err){
    toast(assertion_request_err.message, "err");
    return;
  }

  const [assertion, assertion_err] = await option(window.navigator.credentials.get({
    publicKey: format_assertion_request(assertion_request),
  }))

  if (assertion_err) {
    toast(assertion_err.message, "err");
    enable_form(assertion_err);
    restore_text();
    return
  }

  enable_form();
  restore_text();

  const [_, verification_err] = await option(verify_assertion(assertion));
  toast(verification_err.message, "err");
})