import { BaseModel } from "./index.js";

export class NotificationTypeTranslation extends BaseModel {
  static get tableName() {
    return "notification_type_translations";
  }
}
