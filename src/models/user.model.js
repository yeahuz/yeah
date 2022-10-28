import { BaseModel, BillingAccount, UserPrefence, UserNotification, Chat, Role } from "./index.js";
import { hashids } from "../utils/hashid.js";
import * as argon2 from "argon2";
import { createHash } from "crypto";

export class User extends BaseModel {
  static get tableName() {
    return "users";
  }

  static get virtualAttributes() {
    return ["formatted_phone"];
  }

  static get relationMappings() {
    return {
      roles: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Role,
        join: {
          from: "users.id",
          through: {
            from: "user_roles.user_id",
            to: "user_roles.role_id",
          },
          to: "roles.id",
        },
      },
      chats: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Chat,
        join: {
          from: "users.id",
          through: {
            from: "chat_members.user_id",
            to: "chat_members.chat_id",
          },
          to: "chats.id",
        },
      },
      billing_account: {
        relation: BaseModel.HasOneRelation,
        modelClass: BillingAccount,
        join: {
          from: "users.id",
          to: "billing_accounts.user_id",
        },
      },
      preferences: {
        relation: BaseModel.HasManyRelation,
        modelClass: UserPrefence,
        join: {
          from: "users.id",
          to: "user_preferences.user_id",
        },
      },
      notifications: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: UserNotification,
        join: {
          from: "users.id",
          through: {
            from: "user_notifications.user_id",
            to: "user_notifications.notification_id",
          },
          to: "notifications.id",
        },
      },
    };
  }

  $formatJson(json) {
    json = super.$formatJson(json);
    delete json.password;
    return json;
  }

  async $beforeInsert() {
    await this.hash_password();
    this.set_avatar();
  }

  async $afterInsert(ctx) {
    await super.$afterInsert(ctx);
    await this.$query(ctx.transaction).patch({ hash_id: hashids.encode(this.id) });
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
      /^(33|55|77|88|90|91|93|94|95|97|98|99)(\d{3})(\d{2})(\d{2})$/,
      "$1 $2 $3 $4"
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

  set_avatar() {
    if (!this.email || this.profile_photo_url) return;
    const hash = createHash("md5").update(this.email).digest("hex");
    this.profile_photo_url = `https://gravatar.com/avatar/${hash}?d=retro`;
    return this.profile_photo_url;
  }
}
