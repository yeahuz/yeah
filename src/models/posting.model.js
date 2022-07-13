import { BaseModel } from "./index.js";

export class Posting extends BaseModel {
  static get tableName() {
    return "postings";
  }
}
