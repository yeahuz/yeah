import { i18next } from "./i18n.js";

export class DomainError extends Error {
  constructor(
    message = "generic_internal",
    status_code = 500,
    params = {},
    view = "home",
    errors = []
  ) {
    super();
    this.message = message;
    this.status_code = status_code;
    this.name = this.constructor.name;
    this.errors = errors;
    this.view = view;
    this.params = params;
    Error.captureStackTrace(this, this.constructor);
  }

  translated(t = i18next.getFixedT("en")) {
    this.message = t(this.message, { ns: "errors", ...this.params });
    return this;
  }
}

export class BadRequestError extends DomainError {
  constructor(message = "generic_bad_request", view) {
    super(message, 400, view);
  }
}

export class InternalError extends DomainError {
  constructor(message = "generic_internal", view) {
    super(message, 500, view);
  }
}

export class AuthorizationError extends DomainError {
  constructor(message = "generic_unauthorized", view) {
    super(message, 403, view);
  }
}

export class AuthenticationError extends DomainError {
  constructor(message = "generic_unauthenticated", view) {
    super(message, 401, view);
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor(message = "generic_resource_not_found", view) {
    super(message, 404, view);
  }
}

export class BadGatewayError extends DomainError {
  constructor(message = "generic_bad_gateway", view) {
    super(message, 502, view);
  }
}

export class ValidationError extends DomainError {
  constructor(message = "generic_validation_error", view, errors) {
    super(message, 422, errors, view);
  }
}

export class ConflictError extends DomainError {
  constructor(message = "generic_conflict", params, view) {
    super(message, 409, params, view);
  }
}
