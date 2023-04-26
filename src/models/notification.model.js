import { BaseModel } from "./index.js";
import { hashids } from "../utils/hashid.js";

export class Notification extends BaseModel {
  static get tableName() {
    return "notifications";
  }

  static get relationMappings() {
    return {
      type: {
      }
    }
  }

  async $afterInsert(ctx) {
    await super.$afterInsert(ctx);
    await this.$query(ctx.transaction).patch({ hash_id: hashids.encode(this.id) });
  }
}
