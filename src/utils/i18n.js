import i18next from "i18next";
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
    ],
    fallbackLng: "ru",
    backend: {
      loadPath: process.cwd() + "/src/public/locales/{{lng}}/{{ns}}.json",
      addPath: process.cwd() + "/src/public/locales/{{lng}}/{{ns}}.missing.json",
    },
    saveMissing: true,
    cleanCode: true,
    lowerCaseLng: true,
    order: ["header"],
  });

export { i18next };
