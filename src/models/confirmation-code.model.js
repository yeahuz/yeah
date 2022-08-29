import { BaseModel } from "./index.js";
import * as argon2 from "argon2";

export class ConfirmationCode extends BaseModel {
  static get tableName() {
    return "confirmation_codes";
  }

  async $beforeInsert() {
    await this.hash_code();
  }

  async hash_code() {
    const hash = await argon2.hash(String(this.code));
    this.code = hash;
    return hash;
  }

  async verify_code(code) {
    return await argon2.verify(this.code, code);
  }
}
