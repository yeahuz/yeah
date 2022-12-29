import { request, option } from "./utils.js";
import { format_assertion_request, verify_assertion } from "./webauthn.js";
import { add_listeners, disable_form, replace_text } from "./dom.js";
import { toast } from "./toast.js";
import { encode } from "./base64-url.js";

const assertion_request_form = document.querySelector(".js-assertion-request-form");
const assertion_verification_form = document.querySelector(".js-assertion-verification-form");

async function on_assertion_request(e) {
  e.preventDefault();

  const form = e.target;
  const resource = new URL(form.action);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data);

  const enable_form = disable_form(form);
  const button = form.querySelector("button");
  const restore_text = replace_text(button, button.dataset.loading_text);

  const [assertion_request, assertion_request_err] = await option(request(resource));

  if (assertion_request_err) {
    toast(assertion_request_err.message, "err");
    return;
  }

  const [assertion, assertion_err] = await option(
    window.navigator.credentials.get({
      publicKey: format_assertion_request(assertion_request),
    })
  );

  if (assertion_err) {
    toast(assertion_err.message, "err");
    enable_form(assertion_err);
    restore_text();
    return;
  }

  enable_form();
  restore_text();

  const [raw_id, authenticator_data, client_data_json, signature, user_handle] = await Promise.all([
    encode(assertion.rawId),
    encode(assertion.response.authenticatorData),
    encode(assertion.response.clientDataJSON),
    encode(assertion.response.signature),
    encode(assertion.response.userHandle),
  ]);

  const [_, verification_err] = await option(request(assertion_verification_form.action, {
    method: assertion_verification_form.method,
    body: {
      id: assertion.id,
      raw_id,
      response: {
        authenticator_data,
        client_data_json,
        signature,
        user_handle,
      },
    },
    state: {
      replace: true,
      reload: true,
    },
  }));

  toast(verification_err.message, "err");
}

add_listeners(assertion_request_form, {
  submit: on_assertion_request,
});
