import { BaseModel } from "./index.js";

export class NotificationType extends BaseModel {
  static get tableName() {
    return "notification_types";
  }
}
