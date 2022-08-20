import { option } from "./utils.js";
const qr_code_img = document.querySelector(".js-qr-code");
// import { toCanvas } from "/node_modules/qrcode/build/qrcode.esm.js";
// import "https://unpkg.com/@otplib/preset-browser@^12.0.0/buffer.js";
// import "https://unpkg.com/@otplib/preset-browser@^12.0.0/index.js";

// window.otplib.totp.options = { window: 5 };

// const secret = window.otplib.authenticator.generateSecret();
// let token = window.otplib.totp.generate(secret);

// const qr_code_canvas = document.querySelector(".js-qr-code-canvas");

// toCanvas(qr_code_canvas, "What an awesome text", { margin: 0 });

// function check_remaining() {
//   console.log(window.otplib.totp.timeUsed());

//   const is_valid = window.otplib.totp.check(token, secret);
//   if (!is_valid) {
//     token = window.otplib.totp.generate(secret);
//   }
//   console.log({ is_valid });
//   // setTimeout(check_remaining, 1000);
// }

// check_remaining();

// const TIMEOUT = 120_000;

// async function renew_qr_code() {
//   const [response, err] = await option(fetch("/auth/qr"));
//   if (err) return;
//   const blob = await response.blob();
//   const url = URL.createObjectURL(blob);

//   qr_code_img.src = url;
//   setTimeout(renew_qr_code, TIMEOUT);
// }

// setTimeout(renew_qr_code, TIMEOUT);
