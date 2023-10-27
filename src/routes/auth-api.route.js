import * as AuthApiController from "../controllers/auth-api.controller.js";

export let auth_api = (fastify, opts, done) => {
  fastify.route({
    method: "POST",
    url: "/login",
    handler: AuthApiController.login,
    config: { public: true }
    // schema: auth_api_schema.login,
    //onRequest: fastify.can_api([guest_user]),
  });
  fastify.route({
    method: "GET",
    url: "/requests",
    handler: AuthApiController.generate_request,
  });
  fastify.route({
    method: "POST",
    url: "/assertions",
    handler: AuthApiController.verify_assertion,
  });
  fastify.route({
    method: "GET",
    url: "/sessions/:id",
    handler: AuthApiController.get_session,
    config: { public: true }
    //onRequest: fastify.can_api([own_session, external_client]),
  });
  fastify.route({
    method: "DELETE",
    url: "/sessions/:id",
    handler: AuthApiController.delete_session,
    //onRequest: fastify.can_api([own_session, external_client]),
  });
  fastify.route({
    method: "GET",
    url: "/session",
    handler: AuthApiController.get_me,
    //onRequest: fastify.can_api([authenticated_user])
  });
  fastify.route({
    method: "DELETE",
    url: "/session",
    handler: AuthApiController.logout,
  });

  done();
};
