import { BaseModel } from "./index.js";
import { encrypt, decrypt } from "../utils/index.js";
import { totp } from "otplib";

totp.options = { step: 120, window: 2 };

export class OTPSecret extends BaseModel {
  static get tableName() {
    return "otp_secrets";
  }

  async $beforeInsert() {
    this.secret = encrypt(this.secret);
  }

  verify_otp(otp) {
    return totp.check(otp, decrypt(this.secret));
  }

  generate_otp() {
    return totp.generate(decrypt(this.secret));
  }
}
