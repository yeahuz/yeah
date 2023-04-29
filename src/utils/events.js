import * as EmailService from "../services/email.service.js";
import { SMSService } from "../services/sms.service.js";
import { EventEmitter } from "events";
import { option } from "../utils/index.js";

export const events = new EventEmitter();

// const sms_client = await SMSService.build();

events.on("send_email", async ({ tmpl_name, vars, to }) => {
  const [_, err] = await option(EmailService.send_email({ tmpl_name, vars, to }));
  if (err) {
    console.error(`ERROR: unable to send email to ${to}:${err.message}`)
  }
});

events.on("send_phone_otp", async (data) => {
  // await sms_client.send()
});

events.on("create_otp", async (data) => {
  const { method, tmpl_name, vars, to, country_code } = data;
  if (method === "email") {
    const [_, err] = await option(EmailService.send_email({ tmpl_name, vars, to }));
    if (err) {
      console.error(`ERROR: unable to send email to ${to}:${err.message}`)
    }
  }

  if (method === "phone") {
    await SMSService.send({ to: country_code + to, vars, tmpl_name });
  }
});
