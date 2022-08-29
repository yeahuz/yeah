import config from "../config/index.js";
import jwt from "jsonwebtoken";
import { AuthenticationError, BadRequestError, InternalError } from "./errors.js";

export function sign(data, opts) {
  return jwt.sign(data, config.jwt_secret, opts);
}

export function verify(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt_secret, (err, decoded) => {
      if (err) {
        switch (err.name) {
          case "TokenExpiredError": {
            reject(new AuthenticationError({ key: "token_expired" }));
            break;
          }
          case "JsonWebTokenError": {
            reject(new BadRequestError({ key: "token_malformed" }));
            break;
          }
          case "NotBeforeError": {
            reject(new AuthenticationError({ key: "!token_active" }));
            break;
          }
          default:
            reject(new InternalError());
            break;
        }
      }
      resolve(decoded);
    });
  });
}
