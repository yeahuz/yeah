import { on_login, on_telegram_login } from "./auth.js";
import { add_listeners } from "./dom.js";

const login_form = document.querySelector(".js-login-form");
const telegram_login = document.querySelector(".js-telegram-login");

add_listeners(telegram_login, {
  click: on_telegram_login,
});

add_listeners(login_form, {
  submit: on_login,
});
