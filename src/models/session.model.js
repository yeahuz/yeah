import { BaseModel, UserAgent } from "./index.js";

export class Session extends BaseModel {
  static get tableName() {
    return "sessions";
  }

  static get relationMappings() {
    return {
      user_agent: {
        relation: BaseModel.HasOneRelation,
        modelClass: UserAgent,
        join: {
          from: "sessions.id",
          to: "user_agents.session_id",
        },
      },
    };
  }
}
