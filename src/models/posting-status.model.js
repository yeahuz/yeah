import { BaseModel, PostingStatusTranslation } from "./index.js";

export class PostingStatus extends BaseModel {
  static get tableName() {
    return "posting_statuses";
  }

  static get relationMappings() {
    return {
      translation: {
        relation: BaseModel.HasOneRelation,
        modelClass: PostingStatusTranslation,
        join: {
          from: "posting_statuses.id",
          to: "posting_status_translations.status_id"
        }
      }
    }
  }
}
