import { on_telegram_login } from "./auth.js";
import { add_listeners } from "./dom.js";

const telegram_login = document.querySelector(".js-telegram-login");

add_listeners(telegram_login, {
  click: on_telegram_login,
});
