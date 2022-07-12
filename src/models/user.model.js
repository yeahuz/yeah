import { BaseModel } from "./index.js";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";

export class User extends BaseModel {
  static get tableName() {
    return "users";
  }

  static get virtualAttributes() {
    return ["formatted_phone"];
  }

  $formatJson(json) {
    json = super.$formatJson(json);
    delete json.password;
    return json;
  }

  async $beforeInsert() {
    await this.hash_password();
    this.set_avatar();
    this.set_username();
  }

  async $beforeUpdate(opts, ...args) {
    await super.$beforeUpdate(opts, ...args);
    if (opts.patch && this.password === undefined) {
      return;
    }
    return await this.hash_password();
  }

  formatted_phone() {
    return this.phone?.replace(
      /^(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/,
      "$2 $3 $4-$5"
    );
  }

  async verify_password(password) {
    return await argon2.verify(this.password, password);
  }

  async hash_password() {
    const hash = await argon2.hash(this.password);
    this.password = hash;
    return hash;
  }

  set_username() {
    const random_suffix = randomBytes(4).readUInt32LE();

    if (this.name) {
      this.username = this.name + random_suffix;
      return;
    }

    if (this.phone || this.email) {
      this.username = btoa(this.phone || this.email) + random_suffix;
      return;
    }
  }

  set_avatar() {
    if (!this.email || this.profile_photo_url) return;
    const hash = createHash("md5").update(this.email).digest("hex");
    this.profile_photo_url = `https://gravatar.com/avatar/${hash}?d=retro`;
    return this.profile_photo_url;
  }
}
