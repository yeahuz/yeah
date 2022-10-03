import { BaseModel } from "./index.js";

export class Payment extends BaseModel {
  static get tableName() {
    return "payments";
  }
}
