import { BaseModel, District, RegionTranslation } from "./index.js";

export class Region extends BaseModel {
  static get tableName() {
    return "regions";
  }

  static get relationMappings() {
    return {
      translation: {
        relation: BaseModel.HasOneRelation,
        modelClass: RegionTranslation,
        join: {
          from: "regions.id",
          to: "region_translations.district_id",
        },
      },
      districts: {
        relation: BaseModel.HasManyRelation,
        modelClass: District,
        join: {
          from: "regions.id",
          to: "districts.region_id",
        },
      },
    };
  }
}
