import { on_telegram_login } from "./auth.js";
import { add_listeners } from "dom";
import { on_input, on_paste } from "./otp-input.js";
import { option } from "./utils.js";

const otp_inputs = document.querySelectorAll(".js-otp-input");
const telegram_login_btn = document.querySelector(".js-telegram-login");

add_listeners(telegram_login_btn, {
  click: on_telegram_login,
});

add_listeners(otp_inputs, {
  input: on_input,
  paste: (e) => on_paste(e, otp_inputs),
});

window.addEventListener("load", async () => {
  if (!otp_inputs.length) return;

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
    if (form) form.submit();
  } else console.error(err);
});
