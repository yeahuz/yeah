import { Model } from "objection";
import { yeah } from "../services/db.service.js";

export class BaseModel extends Model {}

BaseModel.knex(yeah);
