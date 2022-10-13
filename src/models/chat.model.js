import { BaseModel, Message, User } from "./index.js";
import { hashids } from "../utils/hashid.js";
import config from "../config/index.js";

export class Chat extends BaseModel {
  static get tableName() {
    return "chats";
  }

  static get relationMappings() {
    return {
      creator: {
        modelClass: User,
        relation: BaseModel.BelongsToOneRelation,
        join: {
          from: "chats.created_by",
          to: "users.id",
        },
      },
      messages: {
        modelClass: Message,
        relation: BaseModel.HasManyRelation,
        join: {
          from: "chats.id",
          to: "messages.chat_id",
        },
      },
    };
  }
  async $afterInsert(ctx) {
    await super.$afterInsert(ctx);
    const hash_id = hashids.encode(this.id);
    const url = `${config.origin}/chats/${hash_id}`;
    await this.$query(ctx.transaction).patch({ hash_id: hashids.encode(this.id), url });
  }
}
