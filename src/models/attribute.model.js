import { BaseModel, AttributeTranslation } from "./index.js";

export class Attribute extends BaseModel {
  static get tableName() {
    return "attributes";
  }

  static get relationMappings() {
    return {
      translation: {
        modelClass: AttributeTranslation,
        relation: BaseModel.HasOneRelation,
        filter: (query) => query.select("name"),
        join: {
          from: "attributes.id",
          to: "attribute_translations.attribute_id",
        },
      },
    };
  }
}