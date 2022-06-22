import { BaseModel } from "./index.js";

export class GoogleAccount extends BaseModel {
  static get tableName() {
    return "google_accounts";
  }
}
