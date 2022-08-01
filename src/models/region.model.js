import { BaseModel, District } from "./index.js";

export class Region extends BaseModel {
  static get tableName() {
    return "regions";
  }

  static get relationMappings() {
    return {
      districts: {
        relation: BaseModel.HasManyRelation,
        modelClass: District,
        join: {
          from: "regions.id",
          to: "districts.region_id"
        }
      }
    }
  }
}
