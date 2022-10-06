export const auth_api_schema = {
  login: {
    body: {
      type: "object",
      properties: {
        email: {
          description: "Email of an account",
          type: "string",
          format: "email",
          errorMessage: { format: "!email", type: "!email" },
        },
        password: {
          description: "Password of an account",
          type: "string",
          minLength: 6,
          errorMessage: { minLength: "password_short" },
        },
      },
      required: ["password", "email"],
    },
  },
};
