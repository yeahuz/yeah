import { PackBytes, string, bits } from "/node_modules/packBytes/packBytes.mjs";
import { toDataURL } from "/node_modules/qrcode/build/qrcode.esm.js";
import { create_node } from "./dom.js";
import { scan_profile_tmpl } from "./templates.js";

const qr_container = document.querySelector(".js-qr-container");
const qr_code_img = document.querySelector(".js-qr-code");

const encoder = new PackBytes({
  op: string,
  payload: string,
});

const operation_encoder = new PackBytes({
  op: bits(8),
});

const simple_message_encoder = new PackBytes({
  op: bits(8),
  payload: string,
});

const auth_scan_encoder = new PackBytes({
  op: bits(8),
  payload: {
    topic: string,
    data: {
      name: string,
      username: string,
      profile_photo_url: string,
    },
  },
});

const listeners = {};

function on(op, callback) {
  listeners[op] = callback;
}

function connect() {
  const ws = new WebSocket("ws://localhost:3020/auth");

  ws.binaryType = "arraybuffer";

  ws.addEventListener("close", () => {
    setTimeout(connect, 1000);
  });

  ws.addEventListener("open", () => {
    ws.send(operation_encoder.encode({ op: 1 }));
    // ws.send(encoder.encode({ op: "auth_init", payload: "what up" }));
  });

  ws.addEventListener("error", console.error);

  ws.addEventListener("message", (e) => {
    const op = new Uint8Array(e.data, 0, 1)[0];
    console.log({ op });
    let encoder;
    switch (op) {
      case 1:
        encoder = simple_message_encoder;
        break;
      case 2:
        encoder = auth_scan_encoder;
        break;
      default:
        break;
    }
    const packet = encoder.decode(e.data);
    if (listeners[op]) listeners[op](packet);
  });
}

async function on_auth_init(packet) {
  const qr_url = await toDataURL(packet.payload, {
    margin: 0,
    color: { dark: "#0070f3", ligth: "#fff" },
  });

  qr_code_img.src = qr_url;
}

async function on_auth_scan(packet) {
  qr_container.innerHTML = "";
  qr_container.innerHTML = scan_profile_tmpl(packet.payload.data);
}

on(1, on_auth_init);
on(2, on_auth_scan);

connect();
