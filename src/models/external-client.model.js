import { BaseModel } from "./index.js";

export class ExternalClient extends BaseModel {
  static get tableName() {
    return "external_clients";
  }
}
