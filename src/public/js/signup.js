import { on_telegram_login } from "./auth.js";
import { add_listeners } from "./dom.js";
import { on_input, on_paste } from "./otp-input.js";
import { option } from "./utils.js";
import { maskit } from "./mask.js";

const masked_input = document.querySelector(".js-masked-input");
const otp_inputs = document.querySelectorAll(".js-otp-input");
const telegram_login_btn = document.querySelector(".js-telegram-login");

add_listeners(telegram_login_btn, {
  click: on_telegram_login,
});

add_listeners(otp_inputs, {
  input: on_input,
  paste: (e) => on_paste(e, otp_inputs),
});

function on_masked_input(e) {
  const mask = e.target.dataset.mask;
  const unmask = e.target.dataset.unmask;
  e.target.value = maskit(maskit(e.target.value, unmask), mask);
}

window.addEventListener("load", () => {
  if (masked_input) {
    add_listeners(masked_input, { input: on_masked_input });
    masked_input.value = maskit(masked_input.value, masked_input.dataset.mask);
  }
});

window.addEventListener("DOMContentLoaded", async () => {
  console.log("DOMContentLoaded");
  if (!otp_inputs) return;
  const first_input = otp_inputs[0];
  const form = first_input.closest("form");
  const ac = new AbortController();

  if (form) {
    form.addEventListener("submit", () => ac.abort());
  }

  const [otp, err] = await option(
    navigator.credentials.get({
      otp: { transport: ["sms"] },
      signal: ac.signal,
    })
  );

  if (otp) {
    otp_inputs.forEach((input, i) => (input.value = otp.code[i]));
  } else console.error(err);
});
