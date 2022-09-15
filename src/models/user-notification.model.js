import { BaseModel } from "./index.js";

export class UserNotification extends BaseModel {
  static get tableName() {
    return "user_notifications";
  }
}
