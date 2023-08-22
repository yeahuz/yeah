import config from "../config/index.js";
import { InternalError } from "../utils/errors.js";
import { commit_trx, rollback_trx, start_trx } from "./db.service.js";
import { query } from "./db.service.js";

class Payme {
  constructor({ merchant_id, checkout_uri }) {
    this.merchant_id = merchant_id;
    this.checkout_uri = checkout_uri;
  }

  prepare_payment({ amount, params }) {
    let query = Buffer.from(
      `m=${config.payme_merchant_id}&a=${amount}&ac.payment_id=${params.payment.id}`
    ).toString("base64");

    return `${this.checkout_uri}?${query}`;
  }
}

class Click {
  constructor({ merchant_id, checkout_uri }) {
    this.merchant_id = merchant_id;
    this.checkout_uri = checkout_uri;
  }

  prepare_payment({ amount, params }) {
    return `${this.checkout_uri}?merchant_id=${this.merchant_id}&service_id=${this.merchant_id}&amount=${amount}&transaction_param=${params.payment.id}`;
  }
}

class Octo {
  constructor({ merchant_id, api_key, api_uri }) {
    this.merchant_id = merchant_id;
    this.api_key = api_key;
    this.api_uri = api_uri;
  }

  async request(url, { method, data } = {}) {
    let response = await fetch(this.api_uri + url, {
      method: method || (data ? "POST" : "GET"),
      body: data ? JSON.stringify(data) : undefined,
    });

    let json = await response.json();
    return json;
  }

  async prepare_payment({ amount, params }) {
    let now = new Date();
    let init_time = `${now.getFullYear()}-${now.getMonth()}-${now.getDay()} ${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;
    let data = await this.request("/prepare_payment", {
      data: {
        total_sum: amount,
        currency: "UZS",
        description: "Пополнение баланса",
        test: true,
        auto_capture: true,
        shop_transaction_id: params.payment.id,
        octo_secret: this.api_key,
        octo_shop_id: this.merchant_id,
        return_url: config.octo_redirect_uri,
        language: "uz",
        ttl: 15,
        init_time,
        payment_methods: [
          {
            method: "uzcard",
          },
          {
            method: "humo",
          },
        ],
      },
    });

    return data.octo_pay_url;
  }
}

class Providers {
  constructor() {
    this.payme = new Payme({
      merchant_id: config.payme_merchant_id,
      checkout_uri: config.payme_checkout_uri,
    });

    this.click = new Click({
      merchnat_id: config.click_merchant_id,
      checkout_uri: config.click_checkout_uri,
    });

    this.octo = new Octo({
      merchant_id: config.octo_merchant_id,
      api_key: config.octo_api_key,
      api_uri: config.octo_api_uri,
    });
  }

  pay_with(provider) {
    return this[provider];
  }
}

let providers = new Providers();

export function pay_with(provider) {
  return providers.pay_with(provider);
}

export async function get_providers() {
  let { rows } = await query(`select * from payment_providers where active is true`);
  return rows;
}

export async function create_payment(payload) {
  let trx = await start_trx();
  try {
    let { billing_account_id, debit_amount, status, provider_name } = payload;
    let payment = await create_one_trx(trx)({
      debit_amount,
      billing_account_id,
      status,
      provider: provider_name,
    });
    let provider = await pay_with(provider_name);
    let url = await provider.prepare_payment({ amount: debit_amount, params: { payment } });
    await commit_trx(trx);
    return { payment, url };
  } catch (err) {
    console.log(err);
    rollback_trx(trx);
    throw new InternalError();
  }
}

function create_one_impl(trx = { query }) {
  return async ({ debit_amount, billing_account_id, status, provider }) => {
    let { rows } = await trx.query(`insert into payments (debit_amount, billing_account_id, status, provider) values ($1, $2, $3, $4) returning id`, [debit_amount, billing_account_id, status, provider]);
    return rows[0];
  };
}

export let create_one = create_one_impl();
export let create_one_trx = (trx) => create_one_impl(trx);
