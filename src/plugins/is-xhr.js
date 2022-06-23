import fp from "fastify-plugin";

export const is_xhr = fp(function is_xhr(fastify, opts, next) {
  fastify.decorateRequest("xhr", false);
  fastify.addHook("onRequest", is_xhr_impl);
  next();
});

function is_xhr_impl(req, res, next) {
  req.xhr = req.headers["x-requested-with"] === "XMLHttpRequest";
  next();
}
