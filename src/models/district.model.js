import { BaseModel, DistrictTranslation } from "./index.js";

export class District extends BaseModel {
  static get tableName() {
    return "districts";
  }

  static get relationMappings() {
    return {
      translation: {
        relation: BaseModel.HasOneRelation,
        modelClass: DistrictTranslation,
        join: {
          from: "districts.id",
          to: "district_translations.district_id",
        },
      },
    };
  }
}
