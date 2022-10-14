import { BaseModel, User } from "./index.js";

export class Message extends BaseModel {
  static get tableName() {
    return "messages";
  }

  static get relationMappings() {
    return {
      sender: {
        relation: BaseModel.BelongsToOneRelation,
        modelClass: User,
        filter: (builder) => builder.select("name", "profile_photo_url", "id"),
        join: {
          from: "messages.sender_id",
          to: "users.id",
        },
      },
    };
  }
}
