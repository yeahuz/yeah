import { BaseModel } from "./index.js";

export class TelegramAccount extends BaseModel {
  static get tableName() {
    return "telegram_accounts";
  }
}
