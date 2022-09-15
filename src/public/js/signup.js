import { on_telegram_login } from "./auth.js";
import { add_listeners } from "./dom.js";
import { on_input, on_paste } from "./otp-input.js";

const otp_inputs = document.querySelectorAll(".js-otp-input");
const telegram_login_btn = document.querySelector(".js-telegram-login");

add_listeners(telegram_login_btn, {
  click: on_telegram_login,
});

add_listeners(otp_inputs, {
  input: on_input,
  paste: (e) => on_paste(e, otp_inputs),
});
