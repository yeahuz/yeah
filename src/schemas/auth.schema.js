export const auth_schema = {
  common: {
    type: "object",
    properties: {
      email_phone: {
        description: "Email or phone of an account",
        oneOf: [
          {
            type: "string",
            format: "email",
          },
          {
            type: "string",
            pattern: "^\\+998[0-9]{9}",
          },
        ],
      },
      password: {
        description: "Password of an account",
        type: "string",
        minLength: 6,
      },
    },
    required: ["email_phone", "password"],
  },
  google_one_tap: {
    type: "object",
    properties: {
      credential: { type: "string" },
    },
    required: ["credential"],
  },
  telegram: {
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
};
