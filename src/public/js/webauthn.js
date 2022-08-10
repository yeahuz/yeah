import { option, request } from './utils.js';
import { disable_form, replace_text } from './dom.js'
import { decode, encode } from './base64-url.js';
import { toast } from './toast.js'

export function format_assertion_request(assertion) {
  assertion.allowCredentials = assertion.allowCredentials.map((credential) => ({
    ...credential,
    id: decode(credential.id)
  }));
  assertion.challenge = decode(assertion.challenge);

  return assertion;
}

export function format_credential_request(credential_request) {
  credential_request.challenge = decode(credential_request.challenge);
  credential_request.user.id = decode(credential_request.user.id);

  return credential_request;
}

export async function verify_assertion(assertion) {
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

export async function add_credential(credential) {
  const [raw_id, attestation_object, client_data_json] = await Promise.all([
    encode(credential.rawId),
    encode(credential.response.attestationObject),
    encode(credential.response.clientDataJSON),
  ])

  return await request("/auth/credentials?return_to=/settings/privacy", {
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
