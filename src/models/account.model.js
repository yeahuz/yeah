import { BaseModel } from "./index.js";

export class Account extends BaseModel {
  static get tableName() {
    return "accounts";
  }
}
