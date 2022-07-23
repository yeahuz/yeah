import { BaseModel } from "./index.js";

export class Attachment extends BaseModel {
  static get tableName() {
    return "attachments";
  }
}
