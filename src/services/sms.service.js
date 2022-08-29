import config from "../config/index.js";

export class SMSService {
  constructor(token) {
    this.refresh_token_promise = null;
    this.token = token;
  }

  static async build() {
    const token = await SMSService.get_token();
    return new SMSService(token);
  }

  static async get_token() {
    const fd = new FormData();
    fd.append("email", config.sms_api_email);
    fd.append("password", config.sms_api_password);
    const response = await fetch(config.sms_api_uri + "/auth/login", {
      method: "POST",
      body: fd,
    });
    const json = await response.json().catch(() => {});

    if (!response.ok) {
      return Promise.reject(json);
    }

    return json.data.token;
  }

  async get_refresh_token() {
    const json = await this.request("/auth/refresh", { method: "PATCH" });
    this.token = json.data.token;
    return this.token;
  }

  async request(url, { method, data } = {}) {
    const response = await fetch(config.sms_api_uri + url, {
      method: method || (data ? "POST" : "GET"),
      body: data,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    const json = await response.json().catch(() => {});

    if (response.status === 401) {
      if (!this.refresh_token_promise) {
        this.refresh_token_promise = this.get_refresh_token().then(() => {
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

  async send(phone, message) {
    const fd = new FormData();
    fd.append("from", "4546");
    fd.append("message", message);
    fd.append("mobile_phone", phone);
    return await this.request("/message/sms/send", { data: fd });
  }
}
