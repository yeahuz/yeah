import { BaseModel } from "./index.js";

export class PostingStatusTranslation extends BaseModel {
  static get tableName() {
    return "posting_status_translations";
  }
}
