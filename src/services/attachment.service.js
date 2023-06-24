import * as CFImageService from "../services/cfimg.service.js";
import * as CFR2Service from "../services/cfr2.service.js";

import { Attachment } from "../models/index.js";

export const create_one = create_one_impl();
export const create_one_trx = (trx) => create_one_impl(trx);

export async function delete_one(id) {
  return await Attachment.query().deleteById(id);
}

export async function delete_by_resource_id(resource_id) {
  return await Attachment.query().findOne({ resource_id }).delete();
}

export async function get_by_resource_id(resource_id, service = "CF_IMAGES") {
  return await Attachment.query().findOne({ resource_id, service });
}

function create_one_impl(trx) {
  return async ({ service = "CF_IMAGES", resource_id } = {}) => {
    let resource;
    switch (service) {
      case "CF_IMAGES": {
        resource = await CFImageService.get_one(resource_id);
        break;
      }
      case "CF_R2": {
        resource = await CFR2Service.head_object(resource_id);
        break;
      }
      default:
        break;
    }

    if (resource) {
      return await Attachment.query(trx).insert({
        resource_id: resource.id,
        name: resource.name,
        service,
        ...resource.meta,
      });
    }

  };
}
