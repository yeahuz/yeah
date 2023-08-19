import { toDataURL } from "/node_modules/qrcode-esm/build/qrcode.esm.js";
import { add_listeners } from "dom";
import { ProfileScan } from "./components/profile-scan.js";
import { QRCode } from "./components/qr-code.js";
import { option, request, message_sw } from "./utils.js";
import { toast } from "./toast.js";
import { WS } from "./ws.js";

let qr_container = document.querySelector(".js-qr-container");

let ws = WS.from("/qr-auth");
ws.send("auth_init")

async function on_auth_pending(url) {
  qr_container.innerHTML = "";
  let qr_url = await toDataURL(url, {
    margin: 0,
    color: { dark: "#101828", light: "#fff" },
  });
  qr_container.append(await QRCode(qr_url));
}

function on_auth_scan(data) {
  qr_container.innerHTML = "";
  qr_container.append(ProfileScan(data));
}

async function on_auth_confirm(data) {
  let [_, err] = await option(
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
