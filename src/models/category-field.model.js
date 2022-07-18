import { BaseModel, CategoryFieldValue, CategoryFieldTranslation } from "./index.js";

export class CategoryField extends BaseModel {
  static get tableName() {
    return "category_fields";
  }

  static get relationMappings() {
    return {
      values: {
        relation: BaseModel.HasManyRelation,
        modelClass: CategoryFieldValue,
        join: {
          from: "category_fields.id",
          to: "category_field_values.category_field_id",
        }
      },
      translation: {
        relation: BaseModel.HasOneRelation,
        modelClass: CategoryFieldTranslation,
        join: {
          from: "category_fields.id",
          to: "category_field_translations.category_field_id"
        }
      }
    }
  }
}
