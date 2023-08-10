import { PackBytes } from "/node_modules/packbytes/packbytes.mjs";
import { wait } from "./utils.js";

export class WS {
  constructor(path) {
    this.conn = null;
    this.encoder = null;
    this.path = path;
    this.listeners = new Map();
    this.base_uri = WS_URI_PUBLIC;
    this.buffer = [];
    this.connect();
  }

  connect() {
    this.conn = new WebSocket(this.base_uri + this.path);

    this.conn.binaryType = "arraybuffer";

    this.conn.addEventListener("close", async (event) => {
      console.error("Websocket connection closed: ", event);
      await wait(3000);
      this.connect();
    });

    this.conn.addEventListener("error", (event) => {
      console.error("ERROR: Websocket connection error: ", event);
      this.conn.close();
      this.conn = null;
    });

    this.conn.addEventListener("message", (e) => {
      if (e.data instanceof ArrayBuffer && this.encoder) {
        let [op, payload] = this.encoder.decode(e.data);
        let cb = this.listeners.get(op);
        if (cb) cb(payload);
        return;
      }

      if (!this.encoder) {
        this.encoder = new PackBytes(e.data);
      }

      this.on_ready(this.ws);
    });
  }

  on(op, cb) {
    this.listeners.set(op, cb);
  }

  connected() {
    return this.conn !== null && this.encoder !== null;
  }

  send(key, data) {
    if (!this.connected()) this.buffer.push(key, data);
    else return this.conn.send(this.encoder.encode(key, data));
  }

  on_ready() {
    while (this.buffer.length) {
      let data = this.buffer.pop();
      let key = this.buffer.pop();
      this.send(key, data);
    }
  }
}
