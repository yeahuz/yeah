import { BaseModel } from "./index.js";

export class Message extends BaseModel {
  static get tableName() {
    return "messages";
  }
}
