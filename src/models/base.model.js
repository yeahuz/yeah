import { Model } from "objection";
import { yeah } from "../services/db.service.js";

export class BaseModel extends Model {
  $beforeUpdate() {
    this.updated_at = new Date();
  }
}

BaseModel.knex(yeah);
