import fp from "fastify-plugin";
import { Readable } from "stream";

export const chunk_view = fp(function chunk_view(fastify, opts, next) {
  fastify.decorateReply("chunk_view", chunk_view_impl);
  next();
});

async function chunk_view_impl(chunks) {
  const response_stream = get_response_stream();
  this.header("content-type", "text/html; charset=utf-8");
  this.header("transfer-encoding", "chunked");
  this.send(response_stream);

  try {
    for (const chunk of chunks) {
      let result;
      const next_chunk = get_chunk(chunk, response_stream);
      if (next_chunk.then) {
        result = await next_chunk;
      } else result = next_chunk;

      response_stream.push(result);
    }
  } catch (err) {
    console.error(err);
  }
  response_stream.push(null);
}

function get_chunk(chunk, response_stream) {
  const strategy = get_chunk_strategy(chunk, response_stream);
  return strategy();
}

function get_chunk_strategy(chunk, response_stream) {
  if (typeof chunk === "string") return () => chunk;
  if (typeof chunk === "function") return chunk;
  if (chunk instanceof Readable) return handle_readable_stream(response_stream, chunk);
  return () => `No strategy found for this chunk`;
}

function handle_readable_stream(response_stream, readable) {
  return () =>
    new Promise((resolve, reject) => {
      readable.on("data", (data) => {
        response_stream.push(data);
      });
      readable.on("end", () => {
        resolve("");
      });
      readable.on("error", (error) => {
        reject(error);
      });
    });
}

function get_response_stream() {
  const stream = new Readable();
  stream._read = () => {};
  return stream;
}
