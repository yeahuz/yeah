import { BaseModel } from "./index.js";

export class AttributeTranslation extends BaseModel {
  static get tableName() {
    return "attribute_translations";
  }
}
