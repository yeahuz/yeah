import base64url from 'base64url'
import crypto from 'crypto'
import config from '../config/index.js'

function generate_challenge(len = 32) {
  return base64url.encode(crypto.randomBytes(len))
}

export function parse_auth_data(buffer) {

}

export class CredentialRequest {
  constructor(user) {
    this.challenge = generate_challenge()
    this.rp = {
      name: config.rp_name,
      id: config.rp_id,
    }
    this.user = {
      id: user.id,
      displayName: user.username || user.name || user.email || user.phone
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
}
