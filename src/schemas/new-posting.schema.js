export const new_posting_schema = {
  essential: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 20,
          errorMessage: { minLength: "!posting_title_minlength" },
        },
        category_id: { type: "string" },
      },
      required: ["title", "category_id"],
    },
  },
  general: {
    body: {
      type: "object",
      properties: {
        title: {
          type: "string",
          minLength: 20,
          errorMessage: { minLength: "!posting_title_minlength" },
        },
        category_id: { type: "string" },
        description: {
          type: "string",
          minLength: 80,
          errorMessage: { minLength: "!posting_description_minlength" },
        },
        price: { type: "number" },
        currency_code: {
          type: "string",
          enum: ["UZS", "USD"],
          default: "USD",
          errorMessage: { enum: "invalid_currency_code" },
        },
        photos: {
          type: "array",
          minItems: 1,
          maxItems: 50,
          default: [],
          items: {
            type: "string",
          },
          errorMessage: {
            minItems: "posting_min_photos",
            maxItems: "posting_max_photos",
          },
        },
      },
      required: ["title", "category_id", "description", "price", "currency_code", "photos"],
      errorMessage: {
        required: {
          photos: "posting_min_photos",
        },
      },
    },
  },
  contact: {
    body: {
      type: "object",
      properties: {
        location: {
          type: "string",
          minLength: 1,
          errorMessage: { minLength: "!posting_location_minlength" },
        },
        phone: {
          type: "string",
          pattern: "^(33|55|77|88|90|91|93|94|95|97|98|99)\\s?(\\d{3})\\s?(\\d{2})\\s?(\\d{2})$",
          errorMessage: { pattern: "!phone_number", type: "!phone_number" },
        },
      },
      required: ["phone", "location"],
    },
  },
};
