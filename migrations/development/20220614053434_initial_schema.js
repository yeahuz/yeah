const ON_PAYMENT_STATUS_UPDATE_FUNCTION = `
  CREATE OR REPLACE FUNCTION on_payment_status_update() RETURNS trigger AS $$
  BEGIN
    UPDATE billing_accounts
    SET balance = balance + (NEW.debit_amount - NEW.credit_amount)
    WHERE id = NEW.billing_account_id;
    RETURN NEW;
  END;
  $$ language 'plpgsql';

  CREATE TRIGGER tr_payment_status_update
  AFTER UPDATE ON payments
  FOR EACH ROW
  WHEN (NEW.status = 'SUCCESS')
  EXECUTE FUNCTION on_payment_status_update();
`;

const DROP_ON_PAYMENT_STATUS_UPDATE_FUNCTION = `DROP FUNCTION on_payment_status_update`;

export function up(knex) {
  return knex.schema
    .createTable("users", (table) => {
      table.increments("id");
      table.string("phone", 15).unique();
      table.string("name");
      table.string("username").unique();
      table.text("bio");
      table.string("website_url");
      table.string("profile_photo_url");
      table.string("email").unique();
      table.string("password").notNullable();
      table.string("hash_id").index();
      table.boolean("verified").defaultTo(false);
      table.timestamp("last_activity_date").defaultTo(knex.fn.now());
      table.timestamps(false, true);
    })
    .createTable("user_preferences", (table) => {
      table.increments("id");
      table.string("name");
      table.string("value");
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("confirmation_codes", (table) => {
      table.increments("id");
      table.string("code");
      table.string("identifier").unique();
      table.timestamp("expires_at");
      table.timestamps(false, true);
    })
    .createTable("auth_providers", (table) => {
      table.increments("id");
      table.string("name").unique();
      table.string("logo_url");
      table.boolean("active");
      table.timestamps(false, true);
    })
    .createTable("accounts", (table) => {
      table.increments("id");
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .string("provider")
        .index()
        .notNullable()
        .references("name")
        .inTable("auth_providers")
        .onDelete("CASCADE");
      table.string("provider_account_id").index();
      table.unique(["provider_account_id", "user_id"]);
      table.timestamps(false, true);
    })
    .createTable("products", (table) => {
      table.increments("id");
      table.string("title");
      table.string("description");
      table.integer("unit_price");
      table.timestamps(false, true);
    })
    .createTable("billing_accounts", (table) => {
      table.increments("id");
      table.integer("balance").defaultTo(0);
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("payment_providers", (table) => {
      table.string("name").primary();
      table.string("title");
      table.string("light_logo_url");
      table.string("dark_logo_url");
      table.boolean("active").defaultTo(true);
      table.timestamps(false, true);
    })
    .createTable("payment_statuses", (table) => {
      table.string("code").primary();
      table.timestamps(false, true);
    })
    .createTable("payments", (table) => {
      table.increments("id");
      table.integer("debit_amount").defaultTo(0);
      table.integer("credit_amount").defaultTo(0);
      table
        .string("status")
        .index()
        .notNullable()
        .references("code")
        .inTable("payment_statuses")
        .onDelete("CASCADE");
      table
        .string("provider")
        .index()
        .notNullable()
        .references("name")
        .inTable("payment_providers")
        .onDelete("CASCADE");
      table
        .integer("billing_account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("billing_accounts")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("invoices", (table) => {
      table.increments("id");
      table
        .integer("payment_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("payments")
        .onDelete("CASCADE");
      table
        .integer("billing_account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("billing_accounts")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("invoice_lines", (table) => {
      table.increments("id");
      table.smallint("quantity").defaultTo(1);
      table
        .integer("product_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("notification_types", (table) => {
      table.string("name").primary();
      table.string("description");
      table.timestamps(false, true);
    })
    .createTable("notifications", (table) => {
      table.increments("id").primary();
      table.integer("sender_id").index().notNullable().references("id").inTable("users");
      table.string("type").index().notNullable().references("name").inTable("notification_types");
      table.string("hash_id");
      table.timestamps(false, true);
    })
    .createTable("user_notifications", (table) => {
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("notification_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("notifications")
        .onDelete("CASCADE");
      table.boolean("read").defaultTo(false);
    })
    .createTable("user_cards", (table) => {
      table.increments("id");
      table.string("pan");
      table.string("expiry");
      table.boolean("default").defaultTo(false);
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("user_reviews", (table) => {
      table.increments("id");
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.text("comment");
      table.smallint("rating");
      table
        .integer("from")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("credentials", (table) => {
      table.increments("id");
      table.string("credential_id", 1024);
      table.string("title").notNullable().unique();
      table.text("public_key");
      table.integer("counter");
      table.json("transports");
      table.timestamps(false, true);
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("sessions", (table) => {
      table.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
      table.boolean("active").defaultTo(true);
      table.specificType("ip", "INET");
      table.timestamp("expires_at");
      table.timestamps(false, true);
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("user_location", (table) => {
      table.increments("id");
      table.point("coords");
      table.string("city");
      table.string("region");
      table.string("country");
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("user_agents", (table) => {
      table.increments("id");
      table.string("browser_name");
      table.string("browser_version");
      table.string("engine_name");
      table.string("engine_version");
      table.string("device_type");
      table.string("device_model");
      table.string("device_vendor");
      table
        .uuid("session_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("sessions")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("sessions_credentials", (table) => {
      table
        .uuid("session_id")
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
      table.boolean("active").defaultTo(false);
      table.string("code").notNullable();
      table.timestamps(false, true);
    })
    .createTable("postings", (table) => {
      table.increments("id");
      table.string("title");
      table.text("description");
      table.string("cover_url", 512);
      table.string("hash_id").index();
      table.string("url", 512);
      table
        .integer("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("posting_statuses")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("payment_status_translations", (table) => {
      table.increments("id");
      table
        .string("status_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("payment_statuses")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("name");
      table.unique(["status_code", "language_code"]);
      table.timestamps(false, true);
    })
    .createTable("posting_status_translations", (table) => {
      table.increments("id");
      table
        .integer("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("posting_statuses")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("name");
      table.unique(["status_id", "language_code"]);
      table.timestamps(false, true);
    })
    .createTable("roles", (table) => {
      table.increments("id");
      table.enu("code", ["admin", "moderator"]);
      table.timestamps(false, true);
    })
    .createTable("role_translations", (table) => {
      table.increments("id");
      table
        .integer("role_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("roles")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("title");
      table.unique(["language_code", "role_id"]);
      table.timestamps(false, true);
    })
    .createTable("user_roles", (table) => {
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("role_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("roles")
        .onDelete("CASCADE");
      table.unique(["user_id", "role_id"]);
    })
    .createTable("categories", (table) => {
      table.increments("id");
      table.integer("parent_id").index().references("id").inTable("categories").onDelete("CASCADE");
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
        .index()
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
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.unique(["user_id", "posting_id"]);
    })
    .createTable("currencies", (table) => {
      table.increments("id");
      table.string("code").unique();
      table.timestamps(false, true);
    })
    .createTable("exchange_rates", (table) => {
      table.increments("id");
      table
        .string("from_currency")
        .index()
        .notNullable()
        .references("code")
        .inTable("currencies")
        .onDelete("CASCADE");
      table
        .string("to_currency")
        .index()
        .notNullable()
        .references("code")
        .inTable("currencies")
        .onDelete("CASCADE");
      table.decimal("rate", 19, 9).defaultTo(1.0);
      table.unique(["from_currency", "to_currency"]);
      table.timestamps(false, true);
    })
    .createTable("posting_prices", (table) => {
      table.increments("id");
      table
        .string("currency_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("currencies")
        .onDelete("CASCADE");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.integer("price");
      table.unique(["posting_id", "currency_code"]);
      table.timestamps(false, true);
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
      table.enu("relation", ["DIRECT", "PARENT"]);
      table.unique(["category_id", "posting_id"]);
    })
    .createTable("category_fields", (table) => {
      table.increments("id");
      table.boolean("required").defaultTo(true);
      table.boolean("read_only").defaultTo(false);
      table.boolean("disabled").defaultTo(false);
      table.boolean("multiple").defaultTo(false);
      table.boolean("checked").defaultTo(false);
      table.smallint("min").defaultTo(0);
      table.smallint("max").defaultTo(0);
      table.smallint("max_length").defaultTo(0);
      table.smallint("min_length").defaultTo(0);
      table.string("accept");
      table.string("pattern");
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
          "file",
          "search",
          "tel",
        ])
        .defaultTo("text");
      table.enu("facet_type", ["checkbox", "radio", "number", "select", "range"]);
      table
        .enu("input_mode", ["text", "decimal", "numeric", "tel", "search", "email", "url"])
        .defaultTo("text");
      table.string("name");
      table
        .integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("category_field_translations", (table) => {
      table.increments("id");
      table
        .integer("category_field_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_fields")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("label");
      table.string("placeholder");
      table.string("hint");
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
      table.string("name");
      table.timestamps(false, true);
    })
    .createTable("category_field_value_translations", (table) => {
      table.increments("id");
      table
        .integer("category_field_value_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_field_values")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("label");
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
      table.string("resource_id").index();
      table.string("name");
      table.string("type");
      table.string("caption").nullable();
      table.integer("size").defaultTo(0);
      table.string("url", 512);
      table.enu("service", ["AWS_S3", "CF_IMAGES", "CF_R2"]).index();
      table.timestamps(false, true);
    })
    .createTable("posting_attachments", (table) => {
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
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
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.integer("amount");
      table
        .integer("card_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("user_cards")
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
        .index()
        .notNullable()
        .references("id")
        .inTable("transaction_statuses")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("name");
      table.unique(["status_id", "language_code"]);
      table.timestamps(false, true);
    })
    .createTable("chats", (table) => {
      table.increments("id");
      table
        .integer("created_by")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table.string("hash_id").index();
      table.string("url", 512);
      table.timestamps(false, true);
      table.index("created_at");
    })
    .createTable("chat_members", (table) => {
      table
        .integer("chat_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("chats")
        .onDelete("CASCADE");
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table.unique(["chat_id", "user_id"]);
    })
    .createTable("messages", (table) => {
      table.increments("id");
      table.text("content");
      table.enu("type", ["photo", "file", "video", "text"]);
      table.integer("reply_to").index().references("id").inTable("messages");
      table
        .integer("sender_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      table
        .integer("chat_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("chats")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("read_messages", (table) => {
      table
        .integer("message_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("messages")
        .onDelete("CASCADE");
      table
        .integer("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("message_attachments", (table) => {
      table
        .integer("message_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("messages")
        .onDelete("CASCADE");
      table
        .integer("attachment_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
    })
    .createTable("countries", (table) => {
      table.string("code").primary();
      table.timestamps(false, true);
    })
    .createTable("country_translations", (table) => {
      table
        .string("country_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("countries")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("name");
      table.timestamps(false, true);
    })
    .createTable("regions", (table) => {
      table.increments("id");
      table
        .string("country_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("countries")
        .onDelete("CASCADE");
      table.integer("soato");
      table.smallint("code");
      table.point("coords");
      table.timestamps(false, true);
    })
    .createTable("region_translations", (table) => {
      table
        .integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("short_name");
      table.string("long_name");
      table.timestamps(false, true);
    })
    .createTable("districts", (table) => {
      table.increments("id");
      table
        .integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      table.integer("soato");
      table.smallint("code");
      table.point("coords");
      table.timestamps(false, true);
    })
    .createTable("district_translations", (table) => {
      table
        .integer("district_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("districts")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("short_name");
      table.string("long_name");
      table.timestamps(false, true);
    })
    .createTable("posting_location", (table) => {
      table.increments("id");
      table.string("formatted_address");
      table.point("coords");
      table
        .integer("posting_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("postings")
        .onDelete("CASCADE");
      table
        .integer("district_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("districts")
        .onDelete("CASCADE");
      table
        .integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("notification_type_translations", (table) => {
      table.increments("id");
      table
        .string("notification_type_name")
        .index()
        .notNullable()
        .references("name")
        .inTable("notification_types")
        .onDelete("CASCADE");
      table
        .string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      table.string("title");
      table.text("content");
      table.unique(["notification_type_name", "language_code"]);
      table.timestamps(false, true);
    })
    .createTable("external_clients", (table) => {
      table.increments("id");
      table.string("title");
      table.string("token").index();
      table.boolean("active").defaultTo(true);
    })
    .then(() => knex.raw(ON_PAYMENT_STATUS_UPDATE_FUNCTION));
}

export function down(knex) {
  return knex.schema
    .dropTable("sessions_credentials")
    .dropTable("user_agents")
    .dropTable("user_location")
    .dropTable("sessions")
    .dropTable("credentials")
    .dropTable("transaction_status_translations")
    .dropTable("transaction_statuses")
    .dropTable("transactions")
    .dropTable("user_reviews")
    .dropTable("user_cards")
    .dropTable("user_roles")
    .dropTable("role_translations")
    .dropTable("roles")
    .dropTable("posting_bookmarks")
    .dropTable("posting_location")
    .dropTable("chat_members")
    .dropTable("read_messages")
    .dropTable("message_attachments")
    .dropTable("messages")
    .dropTable("chats")
    .dropTable("user_notifications")
    .dropTable("notifications")
    .dropTable("notification_type_translations")
    .dropTable("notification_types")
    .dropTable("accounts")
    .dropTable("invoice_lines")
    .dropTable("invoices")
    .dropTable("products")
    .dropTable("payments")
    .dropTable("payment_status_translations")
    .dropTable("payment_statuses")
    .dropTable("payment_providers")
    .dropTable("billing_accounts")
    .dropTable("user_preferences")
    .dropTable("users")
    .dropTable("auth_providers")
    .dropTable("posting_prices")
    .dropTable("exchange_rates")
    .dropTable("currencies")
    .dropTable("posting_attachments")
    .dropTable("posting_categories")
    .dropTable("posting_attributes")
    .dropTable("posting_status_translations")
    .dropTable("district_translations")
    .dropTable("districts")
    .dropTable("region_translations")
    .dropTable("regions")
    .dropTable("country_translations")
    .dropTable("countries")
    .dropTable("promotions")
    .dropTable("postings")
    .dropTable("posting_statuses")
    .dropTable("category_translations")
    .dropTable("category_field_translations")
    .dropTable("category_field_value_translations")
    .dropTable("languages")
    .dropTable("category_field_values")
    .dropTable("category_fields")
    .dropTable("categories")
    .dropTable("attachments")
    .dropTable("confirmation_codes")
    .dropTable("external_clients")
    .then(() => knex.raw(DROP_ON_PAYMENT_STATUS_UPDATE_FUNCTION));
}
