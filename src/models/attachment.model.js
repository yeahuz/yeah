import { BaseModel } from "./index.js";

export class Attachment extends BaseModel {
  static get tableName() {
    return "attachments";
  }
}

export class Attachment_v2 extends BaseModel {
  static get tableName() {
    return "attachments_v2";
  }
}
