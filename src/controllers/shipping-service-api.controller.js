import * as ShippingService from "../services/shipping.service.js";

export async function get_many(req, reply) {
  return {
    list: await ShippingService.get_services({ lang: req.language }),
  }
}
