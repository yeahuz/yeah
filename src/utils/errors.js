import { i18next } from "./i18n.js";

export class DomainError extends Error {
  #t = i18next.getFixedT("en");

  constructor({ key, status_code, view, errors = [], params } = {}) {
    super();
    this.key = key;
    this.status_code = status_code;
    this.view = view;
    this.errors = errors.map((err) => ({ ...err, field: err.instancePath.replace(/\//g, "") }));
    this.params = params;
    this.message = this.#t(key, { ns: "errors", ...this.params });
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }

  build(t) {
    let translated_errors = this.errors;
    if (Array.isArray(this.errors)) {
      translated_errors = this.errors.map((err) => ({
        ...err,
        message: t(err.message, { ns: "errors", ...this.params }),
      }));
    } else {
      for (const key in this.errors) {
        translated_errors[key] = t(this.errors[key], { ns: "errors", ...this.params });
      }
    }

    return {
      message: t(this.key, { ns: "errors", ...this.params }),
      status_code: this.status_code,
      name: this.name,
      errors: translated_errors,
    };
  }

  errors_as_object() {
    const errors = {};
    for (const err of this.errors) {
      errors[err.field] = err.message;
    }
    this.errors = errors;
    return this;
  }
}

export class ValidationError extends DomainError {
  constructor({ key = "generic_validation_error", errors, params } = {}) {
    super({ key, errors, status_code: 422, params });
  }
}

export class ConflictError extends DomainError {
  constructor({ key = "generic_conflict", params } = {}) {
    super({ key, params, status_code: 409 });
  }
}

export class BadRequestError extends DomainError {
  constructor({ key = "generic_bad_request", params } = {}) {
    super({ key, status_code: 400, params });
  }
}

export class InternalError extends DomainError {
  constructor({ key = "generic_internal" } = {}) {
    super({ key, status_code: 500 });
  }
}

export class ResourceNotFoundError extends DomainError {
  constructor({ key = "generic_resource_not_found", params } = {}) {
    super({ key, status_code: 404, params });
  }
}
export class AuthenticationError extends DomainError {
  constructor({ key = "generic_unauthenticated" } = {}) {
    super({ key, status_code: 401 });
  }
}

export class AuthorizationError extends DomainError {
  constructor({ key = "generic_unauthorized" } = {}) {
    super({ key, status_code: 403 });
  }
}

export class BadGatewayError extends DomainError {
  constructor({ key = "generic_bad_gateway" } = {}) {
    super({ key, status_code: 502 });
  }
}

export class GoneError extends DomainError {
  constructor({ key = "genereic_gone" } = {}) {
    super({ key, status_code: 410 });
  }
}
