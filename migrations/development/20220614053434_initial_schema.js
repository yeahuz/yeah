export function up(knex) {
  return knex.schema
    .createTable("accounts", (table) => {
      table.increments("id");
      table.string("phone", 15).unique();
      table.string("name");
      table.string("username").unique();
      table.text("bio");
      table.string("website_url");
      table.string("profile_photo_url");
      table.string("email").unique();
      table.string("password").notNullable();
      table.timestamp("last_activity_date").defaultTo(knex.fn.now());
      table.timestamps(false, true);
    })
    .createTable("google_accounts", (table) => {
      table.increments("id");
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table.string("google_id").unique();
      table.unique(["google_id", "account_id"]);
      table.timestamps(false, true);
    })
    .createTable("telegram_accounts", (table) => {
      table.increments("id");
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table.string("telegram_id").unique();
      table.unique(["telegram_id", "account_id"]);
      table.timestamps(false, true);
    })
    .createTable("account_cards", (table) => {
      table.increments("id");
      table.string("pan");
      table.string("expiry");
      table.boolean("default").defaultTo(false);
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("account_reviews", (table) => {
      table.increments("id");
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table.text("comment");
      table.smallint("rating");
      table
        .integer("from")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
    })
    .createTable("credentials", (table) => {
      table.increments("id");
      table.string("credential_id", 1024);
      table.string("title");
      table.text("public_key");
      table.integer("counter");
      table.json("transports");
      table.timestamps(false, true);
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
    })
    .createTable("sessions", (table) => {
      table.increments("id");
      table.boolean("active").defaultTo(true);
      table.string("user_agent");
      table.timestamps(false, true);
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
    })
    .createTable("sessions_credentials", (table) => {
      table
        .integer("session_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("sessions")
        .onDelete("CASCADE");
      table
        .integer("credential_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("credentials")
        .onDelete("CASCADE");
      table.unique(["session_id", "credential_id"]);
    })
    .createTable("languages", (table) => {
      table.string("code").primary();
      table.string("name");
      table.timestamps(false, true);
    })
    .createTable("posting_statuses", (table) => {
      table.increments("id");
      table.timestamps(false, true);
    })
    .createTable("postings", (table) => {
      table.increments("id");
      table.string("title");
      table.text("description");
      table
        .integer("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("posting_statuses")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("posting_status_translations", (table) => {
      table.increments("id");
      table
        .integer("status_id")
        .notNullable()
        .references("id")
        .inTable("posting_statuses")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("name");
      table.unique(["status_id", "language_code"]);
      table.timestamps(false, true);
    })
    .createTable("categories", (table) => {
      table.increments("id");
      table
        .integer("parent_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("category_translations", (table) => {
      table.increments("id");
      table
        .integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("title");
      table.text("description");
      table.timestamps(false, true);
    })
    .createTable("posting_bookmarks", (table) => {
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.unique(["account_id", "posting_id"]);
    })
    .createTable("posting_categories", (table) => {
      table
        .integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.unique(["category_id", "posting_id"]);
    })
    .createTable("category_fields", (table) => {
      table.increments("id");
      table.string("label");
      table
        .enu("type", [
          "range",
          "radio",
          "text",
          "checkbox",
          "select",
          "search",
          "url",
          "number",
          "password",
        ])
        .defaultTo("text");
      table
        .enu("input_mode", ["text", "decimal", "numeric", "tel", "search", "email", "url"])
        .defaultTo("text");
      table.string("placeholder");
      table.string("key");
      table
        .integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("category_field_values", (table) => {
      table.increments("id");
      table
        .integer("category_field_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_fields")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("posting_attributes", (table) => {
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table
        .integer("category_field_value_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_field_values")
        .onDelete("CASCADE");
      table.unique(["posting_id", "category_field_value_id"]);
    })
    .createTable("promotions", (table) => {
      table.increments("id");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.smallint("boost_score");
      table.timestamp("expiration_date");
      table.enu("placement", ["SEARCH", "FRONT"]).defaultTo("SEARCH");
      table.timestamps(false, true);
    })
    .createTable("attachments", (table) => {
      table.increments("id");
      table.string("url", 512);
      table.string("mimetype");
      table.string("name");
      table.string("s3_url", 512);
      table.string("s3_key", 512);
      table.string("caption");
      table.timestamps(false, true);
    })
    .createTable("entity_attachments", (table) => {
      table.integer("entity_id");
      table
        .integer("attachment_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
    })
    .createTable("transactions", (table) => {
      table.increments("id");
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table.integer("amount");
      table
        .integer("card_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("account_cards")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("transaction_statuses", (table) => {
      table.increments("id");
      table.timestamps(false, true);
    })
    .createTable("transaction_status_translations", (table) => {
      table.increments("id");
      table
        .integer("status_id")
        .notNullable()
        .references("id")
        .inTable("transaction_statuses")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("name");
      table.unique(["status_id", "language_code"]);
      table.timestamps(false, true);
    })
    .createTable("conversations", (table) => {
      table.increments("id");
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("conversation_members", (table) => {
      table
        .integer("conversation_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("conversations")
        .onDelete("CASCADE");
      table
        .integer("account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table.unique(["conversation_id", "account_id"]);
    })
    .createTable("messages", (table) => {
      table.increments("id");
      table.text("content");
      table.integer("reply_to").index().references("id").inTable("messages");
      table
        .integer("sender_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("accounts")
        .onDelete("CASCADE");
      table
        .integer("conversation_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("conversations")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    });
}

export function down(knex) {
  return knex.schema
    .dropTable("sessions_credentials")
    .dropTable("sessions")
    .dropTable("credentials")
    .dropTable("transaction_status_translations")
    .dropTable("transaction_statuses")
    .dropTable("transactions")
    .dropTable("account_reviews")
    .dropTable("account_cards")
    .dropTable("posting_bookmarks")
    .dropTable("conversation_members")
    .dropTable("messages")
    .dropTable("conversations")
    .dropTable("google_accounts")
    .dropTable("telegram_accounts")
    .dropTable("accounts")
    .dropTable("posting_categories")
    .dropTable("posting_attributes")
    .dropTable("posting_status_translations")
    .dropTable("promotions")
    .dropTable("postings")
    .dropTable("posting_statuses")
    .dropTable("category_translations")
    .dropTable("languages")
    .dropTable("category_field_values")
    .dropTable("category_fields")
    .dropTable("categories")
    .dropTable("entity_attachments")
    .dropTable("attachments");
}
