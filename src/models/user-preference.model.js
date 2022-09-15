import { BaseModel } from "./index.js";

export class UserPrefence extends BaseModel {
  static get tableName() {
    return "user_preferences";
  }
}
