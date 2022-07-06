import * as CredentialService from '../services/credential.service.js'
import base64url from 'base64url'
import crypto from 'crypto'
import config from '../config/index.js'
import cbor from 'cbor';
import { ValidationError } from './errors.js'
import { get_domain_without_subdomain, hash_sha256, verify_sha256 } from './index.js'

function generate_challenge(len = 32) {
  return base64url.encode(crypto.randomBytes(len))
}

function coseecdha_to_pkcs(cose_public_key) {
  const cose_struct = cbor.decodeAllSync(cose_public_key)[0];
  const tag = Buffer.from([0x04]);
  const x = cose_struct.get(-2);
  const y = cose_struct.get(-3);

  return Buffer.concat([tag, x, y]);
}

function parse_auth_data(buffer) {
  const rp_id_hash = buffer.slice(0, 32);
  buffer = buffer.slice(32);
  const flags_buf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  const flags_int = flags_buf[0];

  const flags = {
    up: !!(flags_int & 0x01), // user presence
    uv: !!(flags_int & 0x04), // user verification
    at: !!(flags_int & 0x40), // attestation data
    ed: !!(flags_int & 0x80), // extension data
  }

  const counter_buf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  const counter = counter_buf.readUInt32BE();

  const aaguid = buffer.slice(0, 16);
  buffer = buffer.slice(16);

  const cred_id_len_buf = buffer.slice(0, 2);
  buffer = buffer.slice(2);

  const cred_id_len = cred_id_len_buf.readUInt16BE();
  const cred_id_buf = buffer.slice(0, cred_id_len);
  buffer = buffer.slice(cred_id_len);

  const cose_public_key = buffer;

  return {
    rp_id_hash,
    flags,
    counter,
    aaguid,
    cred_id_buf,
    cred_id_len,
    cose_public_key,
    public_key: base64url.encode(coseecdha_to_pkcs(cose_public_key)),
    cred_id: base64url.encode(cred_id_buf),
  }
}

function parse_authenticator_data(buffer) {
  const rp_id_hash = buffer.slice(0, 32);
  buffer = buffer.slice(32);

  const flags_buf = buffer.slice(0, 1);
  buffer = buffer.slice(1);
  const flags_int = flags_buf[0];

  const flags = {
    up: !!(flags_int & 0x01), // user presence
    uv: !!(flags_int & 0x04), // user verification
    at: !!(flags_int & 0x40), // attestation data
    ed: !!(flags_int & 0x80), // extension data
  }

  const counter_buf = buffer.slice(0, 4);
  buffer = buffer.slice(4);
  const counter = counter_buf.readUInt32BE(0);

  return { rp_id_hash, flags_buf, flags, counter }
}

function client_data_validator(type) {
  return async function validate_cient_data(credential, challenge) {
    const client_data = JSON.parse(base64url.decode(credential.response.client_data_json));

    if (client_data.type !== type) {
      throw new ValidationError({ key: "!valid_cred_type" });
    }

    if (client_data.challenge !== challenge) {
      throw new ValidationError({ key: "!valid_challenge" });
    }

    const origin = get_domain_without_subdomain(client_data.origin);

    if (origin !== config.rp_id) {
      throw new ValidationError({ key: "!valid_rp_origin" });
    }

    return client_data;
  }
}

function asn1_to_pem(pk_buffer) {
  if (!Buffer.isBuffer(pk_buffer)) throw new Error("asn1_to_pem: pk_buffer must be Buffer.");

  let type;
  if (pk_buffer.length == 65 && pk_buffer[0] == 0x04) {
    pk_buffer = Buffer.concat([
      new Buffer.from("3059301306072a8648ce3d020106082a8648ce3d030107034200", "hex"),
      pk_buffer,
    ]);

    type = "PUBLIC KEY";
  } else {
    type = "CERTIFICATE";
  }

  let b64_cert = pk_buffer.toString("base64");

  let pem_key = "";
  for (let i = 0; i < Math.ceil(b64_cert.length / 64); i++) {
    let start = 64 * i;

    pem_key += b64_cert.substr(start, 64) + "\n";
  }

  pem_key = `-----BEGIN ${type}-----\n` + pem_key + `-----END ${type}-----\n`;

  return pem_key;
}


export class CredentialRequest {
  constructor(user) {
    this.challenge = generate_challenge()
    this.rp = {
      name: config.rp_name,
      id: config.rp_id,
    }
    this.user = {
      id: base64url.encode(String(user.id)),
      displayName: user.username || user.name || user.email || user.phone,
      name: user.name || user.username || user.email || user.phone
    }
    this.timeout = 60000
    this.attestation = "none"
    this.pubKeyCredParams = [{
      type: "public-key",
      alg: -7
    }]
  }

  static from(user) {
    return new CredentialRequest(user)
  }

  static async validate_client_data(credential, challenge) {
    const validate = client_data_validator("webauthn.create");
    return await validate(credential, challenge);
  }

  static validate_response(credential) {
    try {
      const attestation_buffer = base64url.toBuffer(credential.response.attestation_object);
      const attestation_object = cbor.decodeAllSync(attestation_buffer)[0];
      const result = parse_auth_data(attestation_object.authData);

      if (result.cred_id_len > 1023) {
        throw new ValidationError({ key: "!valid_cred_len" });
      }

      if (!result.flags.up) {
        throw new ValidationError({ key: "!user_present" })
      }

      return [result, null]
    } catch (err) {
      console.log('here', err)
      return [null, new ValidationError()]
    }
  }
}

export class AssertionRequest {
  constructor(credentials) {
    this.challenge = generate_challenge()
    this.allowCredentials = credentials.map(credential => ({
      id: credential.credential_id,
      type: "public-key",
      transports: credential.transports
    }))
    this.rpId = config.rp_id
    this.timeout = 60000;
  }


  static from(credentials) {
    return new AssertionRequest(credentials)
  }

  static async validate_client_data(assertion, challenge) {
    const validate = client_data_validator("webauthn.get");
    return await validate(assertion, challenge);
  }

  static async validate_response(assertion) {
    try {
      const authenticator_data = base64url.toBuffer(assertion.response.authenticator_data);
      const auth_data = parse_authenticator_data(authenticator_data);
      const credential = await CredentialService.get_one(assertion.id);

      if (!auth_data.flags.up) {
        throw new ValidationError({ key: "!user_present" });
      }

      if (auth_data.counter <= credential.counter) {
        throw new ValidationErrror({ key: "!counter_increased" });
      }

      const client_data_hash = hash_sha256(base64url.toBuffer(assertion.response.client_data_json));
      const signature_base = Buffer.concat([authenticator_data, client_data_hash]);
      const public_key = asn1_to_pem(base64url.toBuffer(credential.public_key));
      const signature = base64url.toBuffer(assertion.response.signature);
      const is_valid = verify_sha256(signature, signature_base, public_key);

      if (!is_valid) {
        throw new ValidationError({ key: "!signagure_verified" })
      }

      return [auth_data, null];
    } catch (err) {
      return [null, new ValidationError()];
    }
  }
}
