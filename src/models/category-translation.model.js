import { BaseModel } from "./index.js";

export class CategoryTranslation extends BaseModel {
  static get tableName() {
    return "category_translations";
  }
}
