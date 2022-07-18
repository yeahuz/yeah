import { BaseModel } from "./index.js";

export class CategoryFieldValueTranslation extends BaseModel {
  static get tableName() {
    return "category_field_value_translations";
  }
}
