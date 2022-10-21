import { BaseModel, Message, User, Posting } from "./index.js";
import { hashids } from "../utils/hashid.js";
import config from "../config/index.js";

export class Chat extends BaseModel {
  static get tableName() {
    return "chats";
  }

  static get relationMappings() {
    return {
      posting: {
        modelClass: Posting,
        relation: BaseModel.BelongsToOneRelation,
        filter: (builder) => builder.select("id", "cover_url", "url", "title"),
        join: {
          from: "chats.posting_id",
          to: "postings.id",
        },
      },
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
        filter: (builder) => builder.orderBy("created_at", "desc").limit(20),
        join: {
          from: "chats.id",
          to: "messages.chat_id",
        },
      },
      members: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: User,
        join: {
          from: "chats.id",
          through: {
            from: "chat_members.chat_id",
            to: "chat_members.user_id",
          },
          to: "users.id",
        },
      },
      latest_message: {
        modelClass: Message,
        relation: BaseModel.HasOneRelation,
        filter: (builder) => builder.orderBy("created_at", "desc").limit(1),
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
