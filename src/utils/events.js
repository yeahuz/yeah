import * as EmailService from "../services/email.service.js";
import { SMSService } from "../services/sms.service.js";
import { EventEmitter } from "events";

export const events = new EventEmitter();

// const sms_client = await SMSService.build();

events.on("send_email", async ({ tmpl_name, vars, to }) => {
  await EmailService.send_email({ tmpl_name, vars, to });
});

events.on("send_phone_otp", async (data) => {
  // await sms_client.send()
});

events.on("create_otp", async (data) => {
  const { method, tmpl_name, vars, to, country_code } = data;
  console.log({ method, tmpl_name, vars, to, country_code })
  if (method === "email") {
    await EmailService.send_email({ tmpl_name, vars, to });
  }

  if (method === "phone") {
    await SMSService.send({ to: country_code + to, vars, tmpl_name });
  }
});
