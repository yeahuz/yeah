import fp from "fastify-plugin";

export const is_partial = fp(function is_partial(fastify, opts, next) {
  fastify.decorateRequest("partial", false);
  fastify.addHook("onRequest", is_partial_impl);
  next();
});

function is_partial_impl(req, res, next) {
  const is_navigation_preload = req.headers["service-worker-navigation-preload"] === "true";
  const is_partial_content = req.headers["x-content-mode"] === "partial";

  req.partial = is_navigation_preload || is_partial_content;
  next();
}
