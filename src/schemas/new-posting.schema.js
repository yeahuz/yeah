export const new_posting_schema = {
  essential: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 20, errorMessage: { minLength: "!posting_title_minlength" } },
      category_id: { type: "string" }
    },
    required: ["title", "category_id"]
  },
  general: {
    type: "object",
    properties: {
      title: { type: "string", minLength: 20, errorMessage: { minLength: "!posting_title_minlength" } },
      category_id: { type: "string" },
      description: { type: "string", minLength: 100, errorMessage: { minLength: "!posting_description_minlength" } }
    },
    required: ["title", "category_id", "description"]
  }
}
