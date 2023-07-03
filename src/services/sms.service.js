import config, { update_env } from "../config/index.js";

const TEMPLATES = {
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
    const token = await SMSClient.get_token();
    return new SMSClient(token);
  }

  static async get_token(force) {
    if (config.sms_api_token && !force) return config.sms_api_token;

    const fd = new FormData();
    fd.append("email", config.sms_api_email);
    fd.append("password", config.sms_api_password);
    const response = await fetch(config.sms_api_uri + "/auth/login", {
      method: "POST",
      body: fd,
    });

    const json = await response.json().catch(() => { });

    if (!response.ok) {
      return Promise.reject(json);
    }

    await update_env({ SMS_API_TOKEN: json.data.token });
    return json.data.token;
  }

  async refresh_token() {
    await update_env({ SMS_API_TOKEN: '' });
    const token = await SMSClient.get_token(true).catch((err) => console.log({ err }));
    this.token = token;
  }

  async request(url, { method, data } = {}) {
    const response = await fetch(config.sms_api_uri + url, {
      method: method || (data ? "POST" : "GET"),
      body: data,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const json = await response.json().catch(() => { });

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
    const template = TEMPLATES[tmpl_name];
    const fd = new FormData();
    fd.append("from", "4546");
    fd.append("message", template.message(vars));
    fd.append("mobile_phone", to);
    return await this.request("/message/sms/send", { data: fd });
  }
}

export const SMSService = await SMSClient.build();
