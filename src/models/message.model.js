import { Attachment } from "./attachment.model.js";
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

      attachments: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Attachment,
        join: {
          from: "messages.id",
          through: {
            from: "message_attachments.message_id",
            to: "message_attachments.attachment_id",
          },
          to: "attachments.id",
        },
      },
    };
  }
}
