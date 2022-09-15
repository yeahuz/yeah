import { BaseModel } from "./index.js";

export class BillingAccount extends BaseModel {
  static get tableName() {
    return "billing_accounts";
  }
}
