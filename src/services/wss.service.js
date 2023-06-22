import WebSocket from "ws";
import config from "../config/index.js";
import { PackBytes } from "packbytes";

export let wss = null
export let wss_encoder = null

function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function wss_connect(app) {
  wss = new WebSocket(config.ws_uri_internal)
  wss.binaryType = "arraybuffer";
  wss.on("close", async (e) => {
    app.log.error(`ERROR: websocket connection closed: ${e}`)
    await wait(1000)
    wss_connect(app)
  });

  wss.on("error", (e) => {
    app.log.error(`ERROR: websocket connection error: ${e}`)
    wss.close()
    wss = null
  });

  wss.on("open", () => {
    app.log.info(`websocket connection established to: ${config.ws_uri_internal}`)
  })

  wss.on("message", (msg) => {
    if (!wss_encoder) {
      wss_encoder = new PackBytes(JSON.parse(msg))
    }
  })
}
