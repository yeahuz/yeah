import { BaseModel } from "./index.js";

export class PostingStatus extends BaseModel {
  static get tableName() {
    return "posting_statuses";
  }
}
