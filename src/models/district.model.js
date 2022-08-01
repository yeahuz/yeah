import { BaseModel } from "./index.js";

export class District extends BaseModel {
  static get tableName() {
    return "districts";
  }
}
