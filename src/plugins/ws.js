import WebSocket from "ws";
import fp from "fastify-plugin";
import config from "../config/index.js";

export const ws = fp(async function (fastify, opts, next) {
  let wss;
  let timeout_id;
  const connect = ({ retries }) => {
    if (timeout_id) clearTimeout(timeout_id);
    if (retries === 0) return;

    wss = new WebSocket(config.ws_uri);

    wss.on("error", (e) => {
      fastify.log.error(`WebSocket connection failed: ${e.message}`);
      fastify.log.info(`Retrying WebSocket connection, tries left: ${retries - 1}`);
      timeout_id = setTimeout(() => connect({ retries: retries - 1 }), 2000);
    });

    wss.on("close", (code) => {
      fastify.log.info(`WebSocket connection closed with code ${code}`);
      timeout_id = setTimeout(() => connect({ retries }), 2000);
    });

    wss.on("open", () => fastify.log.info(`WebSocket connection established to ${config.ws_uri}`));
  };

  connect({ retries: 100 });

  wss.binaryType = "arraybuffer";
  fastify.decorate("ws", wss);
  fastify.addHook("onClose", (fastify, done) => fastify.ws.close(done));
  next();
});
