import * as CFImageService from "../services/cfimg.service.js";
import * as CFR2Service from "../services/cfr2.service.js";
import { BaseModel } from "./index.js";

export class Attachment extends BaseModel {
  static get tableName() {
    return "attachments";
  }

  $beforeInsert() {
    this.generate_url();
  }

  generate_url() {
    switch (this.service) {
      case "CF_IMAGES": {
        this.url = CFImageService.get_cf_image_url(this.resource_id);
        break;
      }
      case "CF_R2": {
        this.url = CFR2Service.get_public_url(this.resource_id);
        break;
      }
      default:
        break;
    }
  }
}
