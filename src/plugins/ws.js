import WebSocket from "ws";
import fp from "fastify-plugin";

export const ws = fp(function (fastify, opts, next) {
  const wss = new WebSocket("ws://localhost:3020/auth");
  wss.binaryType = "arraybuffer";
  fastify.decorate("ws", wss);
  fastify.decorateRequest("ws", wss);
  fastify.addHook("onClose", (fastify, done) => fastify.ws.close(done));
  next();
});
