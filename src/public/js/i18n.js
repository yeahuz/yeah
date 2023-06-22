import i18next from "/node_modules/i18next/dist/esm/i18next.bundled.js";
import i18n_fetch_backend from "/node_modules/i18next-fetch-backend/index.js";

export const t = await i18next.use(i18n_fetch_backend).init({
  preload: ["uz", "ru", "en"],
  ns: ["new-posting", "login", "chats"],
  fallbackLng: "ru",
  backend: {
    loadPath: "/public/locales/{{lng}}/{{ns}}.json",
  },
});
