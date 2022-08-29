import { toDataURL } from "/node_modules/qrcode/build/qrcode.esm.js";
import { add_listeners } from "./dom.js";
import { qr_code_tmpl, scan_profile_tmpl } from "./templates.js";
import { encoder } from "./byte-utils.js";
import { option, request, wait, message_sw } from "./utils.js";
import { toast } from "./toast.js";

const MAX_RETRIES = 5;
const qr_container = document.querySelector(".js-qr-container");
const qr_code_img = document.querySelector(".js-qr-code");

const listeners = {};

function on(op, callback) {
  listeners[op] = callback;
}

let ws = null;
function connect({ retries }) {
  if (retries === 0) return;

  ws = new WebSocket("ws://localhost:3020/qr-auth");

  ws.binaryType = "arraybuffer";

  ws.addEventListener("close", (e) => {
    if (is_tab_in_focus()) connect({ retries: MAX_RETRIES });
  });

  ws.addEventListener("error", async (err) => {
    await wait(3000);
    connect({ retries: retries - 1 });
  });

  ws.addEventListener("message", (e) => {
    const [op, payload] = encoder.decode(e.data);
    if (listeners[op]) listeners[op](payload);
  });
}

async function on_auth_init(url) {
  qr_container.innerHTML = "";
  const qr_url = await toDataURL(url, {
    margin: 0,
    color: { dark: "#101828", light: "#fff" },
  });
  const qr_code = await qr_code_tmpl(qr_url);
  qr_container.append(qr_code);
}

function on_auth_scan(data) {
  qr_container.innerHTML = "";
  qr_container.append(scan_profile_tmpl(data));
}

async function on_auth_confirm(data) {
  const [result, err] = await option(
    request("/auth/qr", { method: "POST", body: { token: data.token }, state: { replace: true } })
  );

  if (err) {
    toast(err.message, "err");
    return;
  }

  await message_sw({ type: "expire_partials" });
  window.location.reload();
}

function is_tab_in_focus() {
  return document.visibilityState === "visible";
}

function on_visibility_change() {
  if (is_tab_in_focus() && ws && ws.readState === 3) connect({ retries: MAX_RETRIES });
}

function on_auth_denied() {
  if (ws) ws.close();
}

on("auth_init", on_auth_init);
on("auth_scan", on_auth_scan);
on("auth_confirmed", on_auth_confirm);
on("auth_denied", on_auth_denied);

add_listeners(document, {
  visibilitychange: on_visibility_change,
});

connect({ retries: MAX_RETRIES });
