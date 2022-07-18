import { BaseModel } from "./index.js";

export class CategoryFieldTranslation extends BaseModel {
  static get tableName() {
    return "category_field_translations";
  }
}
