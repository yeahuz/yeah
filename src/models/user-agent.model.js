import { BaseModel } from "./index.js";

export class UserAgent extends BaseModel {
  static get tableName() {
    return "user_agents";
  }

  static get modifiers() {
    return {
      browser_selects(builder) {
        builder.select("id", "browser_name", "browser_version", "created_at", "raw");
      },
    };
  }
}
