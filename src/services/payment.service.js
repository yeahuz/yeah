import config from "../config/index.js";

const providers = {
  payme: ({ amount, ...params }) => {
    const query = Buffer.from(
      `m=${config.payme_merchant_id}&a=${amount}&ac.order_id=${params.order_id}`
    ).toString("base64");

    return `${config.payme_checkout_uri}?${query}`;
  },
  click: ({ amount, ...params }) => {
    return `${config.click_checkout_uri}?merchant_id=${config.click_merchant_id}&service_id=${config.click_merchant_id}&amount=${amount}&transaction_param=${params.order_id}`;
  },
};

export function pay_with(provider) {
  return providers[provider];
}
