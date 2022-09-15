import {
  BaseModel,
  Attachment_v2,
  Category,
  CategoryFieldValue,
  PostingLocation,
  PostingPrice,
} from "./index.js";

export class Posting extends BaseModel {
  static get tableName() {
    return "postings";
  }

  static get relationMappings() {
    return {
      attachments: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Attachment_v2,
        join: {
          from: "postings.id",
          through: {
            from: "posting_attachments.posting_id",
            to: "posting_attachments.attachment_id",
          },
          to: "attachments_v2.id",
        },
      },
      categories: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: Category,
        join: {
          from: "postings.id",
          through: {
            from: "posting_categories.posting_id",
            to: "posting_categories.category_id",
          },
          to: "categories.id",
        },
      },
      attributes: {
        relation: BaseModel.ManyToManyRelation,
        modelClass: CategoryFieldValue,
        join: {
          from: "postings.id",
          through: {
            from: "posting_attributes.posting_id",
            to: "posting_attributes.category_field_value_id",
          },
          to: "category_field_values.id",
        },
      },
      location: {
        relation: BaseModel.HasOneRelation,
        modelClass: PostingLocation,
        filter: (query) => query.select("formatted_address"),
        join: {
          from: "postings.id",
          to: "posting_location.posting_id",
        },
      },
      price: {
        relation: BaseModel.HasOneRelation,
        modelClass: PostingPrice,
        filter: (query) => query.select("id", "currency_code", "posting_id", "price as amount"),
        join: {
          from: "postings.id",
          to: "posting_prices.posting_id",
        },
      },
    };
  }
}
