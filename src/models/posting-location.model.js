import { BaseModel, District, Region } from "./index.js";

export class PostingLocation extends BaseModel {
  static get tableName() {
    return "posting_location";
  }

  static get relationMappings() {
    return {
      district: {
        relation: BaseModel.HasOneRelation,
        modelClas: District,
        join: {
          from: "posting_location.district_id",
          to: "districts.id",
        },
      },
      region: {
        relation: BaseModel.HasOneRelation,
        modelClass: Region,
        join: {
          from: "posting_location.region_id",
          to: "regions.id",
        },
      },
    };
  }
}
