import { BaseModel } from "./index.js";

export class RegionTranslation extends BaseModel {
  static get tableName() {
    return "region_translations";
  }
}
