import { BaseModel, Notification } from "./index.js";

export class UserNotification extends BaseModel {
  static get tableName() {
    return "user_notifications";
  }

  static get relationMappings() {
    return {
      notification: {
        modelClass: Notification,
        relation: BaseModel.HasOneRelation,
        join: {
          from: "user_notifications.notification_id",
          to: "notifications.id",
        },
      },
    };
  }
}
