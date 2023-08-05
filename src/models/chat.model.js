import { BaseModel, Message, User, Posting } from "./index.js";
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
        filter: (builder) => builder.select("name"),
        join: {
          from: "chats.id",
          through: {
            from: "chat_members.chat_id",
            to: "chat_members.user_id",
          },
          extra: ["unread_count"],
          to: "users.id",
        },
      },
      latest_message: {
        modelClass: Message,
        relation: BaseModel.HasOneRelation,
        join: {
          from: "chats.last_message_id",
          to: "messages.id",
        },
      },
    };
  }

  async $afterInsert(ctx) {
    await super.$afterInsert(ctx);
    const url = `${config.origin}/chats/${this.id}`;
    await this.$query(ctx.transaction).patch({ url });
  }
}
