import { BaseModel } from "./index.js";

export class PaymentProvider extends BaseModel {
  static get tableName() {
    return "payment_providers";
  }
}
