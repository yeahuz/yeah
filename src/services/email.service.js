import config from "../config/index.js";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { render_file } from "../utils/eta.js";

const client = new SESClient({
  region: "eu-north-1",
  credentials: {
    accessKeyId: config.aws_access_key,
    secretAccessKey: config.aws_secret_key,
  },
});

const TEMPLATES = {
  verify: {
    render: (vars) => render_file("/email-templates/verify.html", vars),
    subject: (vars) => {
      return vars.t("verify.verification_code", { ns: "email-templates", code: vars.code });
    },
    source: () => `Needs <noreply@needs.uz>`,
  },
  update_email: {
    render: (vars) => render_file("/email-templates/update-email.html", vars),
    subject: (vars) => vars.t("update_email.title", { ns: "email-templates" }),
    source: () => `Needs <noreply@needs.uz>`,
  },
  new_email: {
    render: (vars) => render_file("/email-templates/new-email.html", vars),
    subject: (vars) => vars.t("new_email.title", { ns: "email-templates" }),
    source: () => `Needs <noreply@needs.uz>`,
  },
};

export async function send_email({ tmpl_name, to, vars }) {
  const template = TEMPLATES[tmpl_name];
  if (!template) throw new Error("Non-existent template");

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [to],
    },
    Message: {
      Subject: {
        Charset: "UTF-8",
        Data: template.subject(vars),
      },
      Body: {
        Html: {
          Charset: "UTF-8",
          Data: await template.render(vars),
        },
      },
    },
    Source: template.source(),
  });

  return await client.send(command);
}
