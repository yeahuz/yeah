import { BaseModel } from "./index.js";

export class Session extends BaseModel {
  static get tableName() {
    return "sessions";
  }
}
