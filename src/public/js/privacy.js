import { option, request } from './utils.js'
import * as base64url from './base64-url.js';

const credential_request_form = document.querySelector(".js-credential-request-form");


function format_credential_request(credential_request) {
  credential_request.challenge = base64url.decode(credential_request.challenge);
  credential_request.user.id = base64url.decode(credential_request.user.id);

  return credential_request;
}

credential_request_form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;

  const resource = new URL(form.action);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data)

  const [credential_request, credential_request_err] = await option(request(resource));

  if (credential_request_err) {
    console.log(credential_request_err)
    return
  }


  const credential = await window.navigator.credentials.create({
    publicKey: format_credential_request(credential_request)
  })

  const [result, err] = await option(add_credential(Object.assign(credential, { title: data.get("title") })))

  if (err) {
    console.log(err);
    return
  }
});

async function add_credential(credential) {
  const [raw_id, attestation_object, client_data_json] = await Promise.all([
    base64url.encode(credential.rawId),
    base64url.encode(credential.response.attestationObject),
    base64url.encode(credential.response.clientDataJSON),
  ])

  return await request("/auth/credentials", {
    body: {
      id: credential.id,
      raw_id,
      type: credential.type,
      response: {
        attestation_object,
        client_data_json
      },
      transports: credential.response.getTransports?.() || [],
      title: credential.title
    }
  })
}
