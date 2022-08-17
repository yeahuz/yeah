import { BaseModel, CategoryFieldValueTranslation } from "./index.js";

export class CategoryFieldValue extends BaseModel {
  static get tableName() {
    return "category_field_values";
  }

  static get relationMappings() {
    return {
      translation: {
        relation: BaseModel.HasOneRelation,
        modelClass: CategoryFieldValueTranslation,
        join: {
          from: "category_field_values.id",
          to: "category_field_value_translations.category_field_value_id"
        }
      }
    }
  }
}