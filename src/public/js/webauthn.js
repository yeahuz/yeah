import { option, request } from './utils.js';
import { disable_form, replace_text } from './dom.js'
import { decode, encode } from './base64-url.js';

const assertion_request_form = document.querySelector(".js-assertion-request-form");


function format_assertion_request(assertion) {
  assertion.allowCredentials = assertion.allowCredentials.map((credential) => ({
    ...credential,
    id: decode(credential.id)
  }));
  assertion.challenge = decode(assertion.challenge);

  return assertion;
}

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

  const [assertion, assertion_err] = await option(window.navigator.credentials.get({
    publicKey: format_assertion_request(assertion_request),
  }))

  if (assertion_err) {
    console.log({ assertion_err })
    enable_form(assertion_err);
    restore_text();
    return
  }

  enable_form(assertion_request_err);
  restore_text();

  const [_, verification_err] = await option(verify_assertion(assertion));

  console.log({verification_err})
})

async function verify_assertion(assertion) {
  const [raw_id, authenticator_data, client_data_json, signature, user_handle] = await Promise.all([
    encode(assertion.rawId),
    encode(assertion.response.authenticatorData),
    encode(assertion.response.clientDataJSON),
    encode(assertion.response.signature),
    encode(assertion.response.userHandle),
  ])

  return await request("/auth/assertions", {
    body: {
      id: assertion.id,
      raw_id,
      response: {
        authenticator_data,
        client_data_json,
        signature,
        user_handle,
      }
    },
    state: {
      replace: true,
      reload: true,
    }
  })
}
