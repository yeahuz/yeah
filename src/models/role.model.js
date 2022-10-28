import { BaseModel } from "./index.js";

export class Role extends BaseModel {
  static get tableName() {
    return "roles";
  }
}
