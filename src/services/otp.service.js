import * as UserService from "../services/user.service.js";
import { OTPSecret } from "../models/index.js";
import { authenticator } from "otplib";
import { ConflictError } from "../utils/errors.js";

function generate_totp(gen_secret = false) {
  return async ({ method, identifier }) => {
    const existing = await UserService.get_by_email_phone(identifier);
    if (existing) {
      throw new ConflictError({
        key: "user_exists",
        params: { user: identifier },
      });
    }

    let secret;
    if (gen_secret) {
      secret = authenticator.generateSecret();
      secret = await OTPSecret.query()
        .insert({ secret, method, identifier })
        .onConflict(["identifier", "method"])
        .merge();
    } else {
      secret = await OTPSecret.query().findOne({ method, identifier });
    }

    return secret.generate_otp();
  };
}

export async function verify_totp({ method, otp, identifier }) {
  const otp_secret = await OTPSecret.query().findOne({ method, identifier });
  const is_valid = otp_secret?.verify_otp(otp);
  return is_valid;
}

export const generate_with_existing_secret = generate_totp();
export const generate_with_new_secret = generate_totp(true);
