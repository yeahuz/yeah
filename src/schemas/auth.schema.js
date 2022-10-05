export const auth_schema = {
  login: {
    body: {
      type: "object",
      properties: {
        identifier: {
          description: "Email or phone of an account",
          oneOf: [
            {
              type: "string",
              format: "email",
              errorMessage: { format: "!email", type: "!email" },
            },
            {
              type: "string",
              pattern:
                "^(33|55|77|88|90|91|93|94|95|97|98|99)\\s?(\\d{3})\\s?(\\d{2})\\s?(\\d{2})$",
              errorMessage: { pattern: "!phone_number", type: "!phone_number" },
            },
          ],
        },
        password: {
          description: "Password of an account",
          type: "string",
          minLength: 6,
          errorMessage: { minLength: "password_short" },
        },
      },
      required: ["password", "identifier"],
    },
  },
  create_otp: {
    query: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["phone", "email"],
          default: "phone",
          errorMessage: { enum: "invalid_auth_method" },
        },
      },
    },
    body: {
      type: "object",
      properties: {
        identifier: {
          description: "Email or phone of an account",
          oneOf: [
            {
              type: "string",
              format: "email",
              errorMessage: { format: "!email", type: "!email" },
            },
            {
              type: "string",
              pattern:
                "^(33|55|77|88|90|91|93|94|95|97|98|99)\\s?(\\d{3})\\s?(\\d{2})\\s?(\\d{2})$",
              errorMessage: { pattern: "!phone_number", type: "!phone_number" },
            },
          ],
        },
      },
    },
  },
  confirm_otp: {
    query: {
      type: "object",
      properties: {
        method: {
          type: "string",
          enum: ["phone", "email"],
          default: "phone",
          errorMessage: { enum: "invalid_auth_method" },
        },
      },
    },
    body: {
      type: "object",
      properties: {
        otp: {
          oneOf: [
            {
              type: "array",
              items: { type: "string" },
              minItems: 6,
              maxItems: 6,
              errorMessage: { minItems: "invalid_otp_length", maxItems: "invalid_otp_length" },
            },
            {
              type: "string",
              minLength: 6,
              maxLength: 6,
              errorMessage: { minItems: "invalid_otp_length", maxItems: "invalid_otp_length" },
            },
          ],
        },
      },
    },
  },
  google_one_tap: {
    body: {
      type: "object",
      properties: {
        credential: { type: "string" },
      },
      required: ["credential"],
    },
  },
  telegram: {
    body: {
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            first_name: { type: "string" },
            username: { type: "string" },
            photo_url: { type: "string" },
            auth_date: { type: "number" },
            hash: { type: "string" },
          },
        },
      },
    },
  },
};
