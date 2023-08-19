import { on_telegram_login } from "./auth.js";
import { add_listeners } from "dom";
import { maskit } from "./mask.js";

const masked_input = document.querySelector(".js-masked-input");
const telegram_login = document.querySelector(".js-telegram-login");

add_listeners(telegram_login, {
  click: on_telegram_login,
});

add_listeners(masked_input, {
  input: on_masked_input,
});

window.addEventListener("load", () => {
  if (masked_input) {
    masked_input.value = maskit(masked_input.value, masked_input.dataset.mask);
  }
});

function on_masked_input(e) {
  const mask = e.target.dataset.mask;
  const unmask = e.target.dataset.unmask;
  e.target.value = maskit(maskit(e.target.value, unmask), mask);
}
