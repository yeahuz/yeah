import { toDataURL } from "/node_modules/qrcode-esm/build/qrcode.esm.js";
import { add_listeners } from "./dom.js";
import { qr_code_tmpl, scan_profile_tmpl } from "./templates.js";
import { option, request, message_sw } from "./utils.js";
import { toast } from "./toast.js";
import { WS } from "./ws.js";

const qr_container = document.querySelector(".js-qr-container");

let ws = new WS("/qr-auth");

ws.on_ready = () => ws.send("auth_init")

async function on_auth_pending(url) {
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
  const [_, err] = await option(
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
  if (is_tab_in_focus() && ws.connected() && ws.conn.readState === 3) ws.connect()
}

function on_auth_denied() {
  if (ws.connected()) ws.close();
}

ws.on("auth_pending", on_auth_pending);
ws.on("auth_scan", on_auth_scan);
ws.on("auth_confirmed", on_auth_confirm);
ws.on("auth_denied", on_auth_denied);

add_listeners(document, {
  visibilitychange: on_visibility_change,
});
