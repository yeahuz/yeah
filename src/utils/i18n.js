import i18next from "i18next";
import fp from "fastify-plugin";
import i18n_http_middleware from "i18next-http-middleware";
import i18n_backend from "i18next-fs-backend";

i18next
  .use(i18n_backend)
  .use(i18n_http_middleware.LanguageDetector)
  .init({
    preload: ["uz", "ru", "en"],
    ns: [
      "common",
      "signup",
      "login",
      "errors",
      "success",
      "settings",
      "settings-details",
      "settings-privacy",
      "settings-billing",
      "settings-appearance",
      "2fa",
      "new-posting",
      "offline",
      "profile",
      "payments",
      "email-templates",
      "sms",
      "chats",
    ],
    fallbackLng: "ru",
    backend: {
      loadPath: process.cwd() + "/src/public/locales/{{lng}}/{{ns}}.json",
      addPath: process.cwd() + "/src/public/locales/{{lng}}/{{ns}}.missing.json",
    },
    saveMissing: true,
    cleanCode: true,
    lowerCaseLng: true,
    detection: {
      ignoreCase: true,
      lookupQuerystring: "lang",
      lookupHeader: "accept-language",
      order: ["querystring", "header"],
    },
  });

const i18next_plugin = fp((instance, opts, next) => {
  const middleware = i18n_http_middleware.handle(i18next, opts);
  instance.addHook("preValidation", (req, reply, next) => middleware(req, reply, next));
  next();
});

export { i18next, i18next_plugin };
