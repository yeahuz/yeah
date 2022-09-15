import { BaseModel } from "./index.js";

export class PostingPrice extends BaseModel {
  static get tableName() {
    return "posting_prices";
  }
}
