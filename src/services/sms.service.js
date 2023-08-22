import config, { update_env } from "../config/index.js";

let TEMPLATES = {
  verify: {
    message: ({ t, ...vars }) => t("verify", { ns: "sms", ...vars }),
  },
};

export class SMSClient {
  constructor(token) {
    this.refresh_token_promise = null;
    this.token = token;
  }

  static async build() {
    let token = await SMSClient.get_token();
    return new SMSClient(token);
  }

  static async get_token(force) {
    if (config.sms_api_token && !force) return config.sms_api_token;

    let fd = new FormData();
    fd.append("email", config.sms_api_email);
    fd.append("password", config.sms_api_password);
    let response = await fetch(config.sms_api_uri + "/auth/login", {
      method: "POST",
      body: fd,
    });

    let json = await response.json().catch(() => {});

    if (!response.ok) {
      return Promise.reject(json);
    }

    await update_env({ SMS_API_TOKEN: json.data.token });
    return json.data.token;
  }

  async refresh_token() {
    await update_env({ SMS_API_TOKEN: '' });
    let token = await SMSClient.get_token(true).catch((err) => console.log({ err }));
    this.token = token;
  }

  async request(url, { method, data } = {}) {
    let response = await fetch(config.sms_api_uri + url, {
      method: method || (data ? "POST" : "GET"),
      body: data,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    let json = await response.json().catch(() => {});

    if (response.status === 401) {
      if (!this.refresh_token_promise) {
        this.refresh_token_promise = this.refresh_token().then(() => {
          this.refresh_token_promise = null;
        });
      }

      return this.refresh_token_promise.then(() => this.request({ url, method, data }));
    }

    if (!response.ok) {
      return Promise.reject(json);
    }

    return json;
  }

  async send({ to, tmpl_name, vars }) {
    let template = TEMPLATES[tmpl_name];
    let fd = new FormData();
    fd.append("from", "4546");
    fd.append("message", template.message(vars));
    fd.append("mobile_phone", to);
    return await this.request("/message/sms/send", { data: fd });
  }
}

export let SMSService = await SMSClient.build();
