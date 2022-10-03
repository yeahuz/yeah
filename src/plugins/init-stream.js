import fp from "fastify-plugin";
import { Readable } from "stream";

export const init_stream = fp(function init_stream(fastify, opts, next) {
  fastify.decorateReply("init_stream", init_stream_impl);
  next();
});

function init_stream_impl({ headers = {} } = {}) {
  const stream = new Readable();
  stream._read = () => {};
  this.header("content-type", "text/html; charset=utf-8");
  this.header("transfer-encoding", "chunked");
  this.header("vary", "Service-Worker-Navigation-Preload, X-Content-Mode");

  for (const key of Object.keys(headers)) {
    this.header(key, headers[key]);
  }

  this.send(stream);
  return stream;
}
