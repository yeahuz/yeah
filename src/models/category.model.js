import { BaseModel, CategoryTranslation } from "./index.js";

export class Category extends BaseModel {
  static get tableName() {
    return "categories";
  }

  static get relationMappings() {
    return {
      children: {
        relation: BaseModel.HasManyRelation,
        modelClass: Category,
        join: {
          from: "categories.id",
          to: "categories.parent_id",
        },
      },
      translation: {
        relation: BaseModel.HasManyRelation,
        modelClass: CategoryTranslation,
        join: {
          from: "categories.id",
          to: "category_translations.category_id",
        },
      },
    };
  }
}
