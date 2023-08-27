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
    .createTable("users", (t) => {
      t.bigIncrements("id");
      t.string("phone", 15).unique();
      t.boolean("phone_verified").defaultTo(false);
      t.string("name");
      t.string("username").unique();
      t.text("bio");
      t.string("website_url");
      t.string("profile_photo_url");
      t.string("email").unique();
      t.boolean("email_verified").defaultTo(false);
      t.string("password").notNullable();
      t.string("profile_url");
      t.boolean("verified").defaultTo(false);
      t.timestamps(false, true);
    })
    .createTable("last_seen", (t) => {
      t.timestamp("time").defaultTo(knex.fn.now());
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE")
    })
    .createTable("user_preferences", (t) => {
      t.bigIncrements("id");
      t.string("name");
      t.string("value");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("confirmation_codes", (t) => {
      t.bigIncrements("id");
      t.string("code");
      t.string("identifier").unique();
      t.timestamp("expires_at");
      t.boolean("verified").defaultTo(false);
      t.timestamps(false, true);
    })
    .createTable("auth_providers", (t) => {
      t.string("name").primary();
      t.string("logo_url");
      t.boolean("active");
      t.timestamps(false, true);
    })
    .createTable("accounts", (t) => {
      t.bigIncrements("id");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("provider")
        .index()
        .notNullable()
        .references("name")
        .inTable("auth_providers")
        .onDelete("CASCADE");
      t.string("provider_account_id").index();
      t.unique(["provider_account_id", "user_id"]);
      t.timestamps(false, true);
    })
    .createTable("products", (t) => {
      t.bigIncrements("id");
      t.string("title");
      t.string("description");
      t.integer("unit_price");
      t.timestamps(false, true);
    })
    .createTable("billing_accounts", (t) => {
      t.bigIncrements("id");
      t.integer("balance").defaultTo(0);
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("payment_providers", (t) => {
      t.string("name").primary();
      t.string("title");
      t.string("light_logo_url");
      t.string("dark_logo_url");
      t.boolean("active").defaultTo(true);
      t.timestamps(false, true);
    })
    .createTable("payment_statuses", (t) => {
      t.string("code").primary();
      t.string("fg_hex", 7);
      t.string("bg_hex", 7);
      t.timestamps(false, true);
    })
    .createTable("payments", (t) => {
      t.bigIncrements("id");
      t.integer("debit_amount").defaultTo(0);
      t.integer("credit_amount").defaultTo(0);
      t.string("status")
        .index()
        .notNullable()
        .references("code")
        .inTable("payment_statuses")
        .onDelete("CASCADE");
      t.string("provider")
        .index()
        .notNullable()
        .references("name")
        .inTable("payment_providers")
        .onDelete("CASCADE");
      t.bigInteger("billing_account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("billing_accounts")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("invoices", (t) => {
      t.bigIncrements("id");
      t.bigInteger("payment_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("payments")
        .onDelete("CASCADE");
      t.bigInteger("billing_account_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("billing_accounts")
        .onDelete("CASCADE");
      t.unique(["payment_id", "billing_account_id"]);
      t.timestamps(false, true);
    })
    .createTable("invoice_lines", (t) => {
      t.bigIncrements("id");
      t.smallint("quantity").defaultTo(1);
      t.bigInteger("product_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("products")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("notification_types", (t) => {
      t.string("name").primary();
      t.string("description");
      t.timestamps(false, true);
    })
    .createTable("notifications", (t) => {
      t.bigIncrements("id").primary();
      t.bigInteger("sender_id").index().notNullable().references("id").inTable("users");
      t.string("type").index().notNullable().references("name").inTable("notification_types");
      t.string("href");
      t.timestamps(false, true);
    })
    .createTable("user_notifications", (t) => {
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.bigInteger("notification_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("notifications")
        .onDelete("CASCADE");
      t.boolean("read").defaultTo(false);
      t.unique(["user_id", "notification_id"]);
    })
    .createTable("user_cards", (t) => {
      t.bigIncrements("id");
      t.string("pan");
      t.string("expiry");
      t.boolean("default").defaultTo(false);
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("user_reviews", (t) => {
      t.bigIncrements("id");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.text("comment");
      t.smallint("rating");
      t.bigInteger("from")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("credentials", (t) => {
      t.bigIncrements("id");
      t.string("credential_id", 1024);
      t.string("title").notNullable();
      t.text("public_key");
      t.integer("counter");
      t.json("transports");
      t.timestamps(false, true);
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("sessions", (t) => {
      t.uuid("id").defaultTo(knex.raw("gen_random_uuid()")).primary();
      t.boolean("active").defaultTo(true);
      t.specificType("ip", "INET");
      t.timestamp("expires_at");
      t.timestamps(false, true);
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
    })
    .createTable("user_location", (t) => {
      t.bigIncrements("id");
      t.point("coords");
      t.string("city");
      t.string("region");
      t.string("country");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("user_agents", (t) => {
      t.bigIncrements("id");
      t.string("raw");
      t.string("browser_name");
      t.string("browser_version");
      t.string("engine_name");
      t.string("engine_version");
      t.string("device_type");
      t.string("device_model");
      t.string("device_vendor");
      t.uuid("session_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("sessions")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("sessions_credentials", (t) => {
      t.uuid("session_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("sessions")
        .onDelete("CASCADE");
      t.bigInteger("credential_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("credentials")
        .onDelete("CASCADE");
      t.unique(["session_id", "credential_id"]);
    })
    .createTable("languages", (t) => {
      t.string("code").primary();
      t.string("name");
      t.timestamps(false, true);
    })
    .createTable("listing_statuses", (t) => {
      t.enu("code", ["ACTIVE", "IN_MODERATION", "INDEXING", "ARCHIVED", "DRAFT"]).primary();
      t.boolean("active").defaultTo(false);
      t.string("fg_hex", 7);
      t.string("bg_hex", 7);
      t.timestamps(false, true);
    })
    .createTable("attributes", (t) => {
      t.increments("id");
      t.integer("parent_id").index().references("id").inTable("attributes").onDelete("CASCADE");
      t.enu("type", [
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
      ]);
      t.string("key");
      t.specificType("category_set", "INT[]").index(null, "GIN");
      t.timestamps(false, true);
    })
    .createTable("attribute_translations", (t) => {
      t.increments("id");
      t.integer("attribute_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attributes")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
    })
    .createTable("categories", (t) => {
      t.increments("id");
      t.integer("parent_id").index().references("id").inTable("categories").onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("attachments", (t) => {
      t.bigIncrements("id");
      t.string("resource_id").index();
      t.string("name");
      t.string("type");
      t.string("caption").nullable();
      t.integer("size").defaultTo(0);
      t.string("url", 512);
      t.bigInteger("created_by")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.enu("service", ["AWS_S3", "CF_IMAGES", "CF_R2"]).index();
      t.timestamps(false, true);
    })
    .createTable("listings", (t) => {
      t.bigIncrements("id");
      t.string("title");
      t.text("description");
      t.string("url", 512);
      t.specificType("attribute_set", "INT[]").index(null, "GIN").defaultTo('{}');
      t.bigInteger("cover_id")
        .index()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE")
      t.bigInteger("created_by")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("status")
        .index()
        .notNullable()
        .references("code")
        .inTable("listing_statuses")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("payment_status_translations", (t) => {
      t.increments("id");
      t.string("status_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("payment_statuses")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_code", "language_code"]);
      t.timestamps(false, true);
    })
    .createTable("listing_status_translations", (t) => {
      t.increments("id");
      t.string("status_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("listing_statuses")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_code", "language_code"]);
      t.timestamps(false, true);
    })
    .createTable("roles", (t) => {
      t.increments("id");
      t.enu("code", ["admin", "moderator", "user"]);
      t.timestamps(false, true);
    })
    .createTable("permissions", (t) => {
      t.increments("id");
      t.string("action").notNullable();
      t.string("subject").notNullable();
      t.jsonb("conditions").nullable();
      t.specificType("fields", "VARCHAR[]").nullable();
    })
    .createTable("role_permissions", (t) => {
      t.integer("permission_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("permissions")
        .onDelete("CASCADE");
      t.integer("role_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("roles")
        .onDelete("CASCADE");
      t.unique(["permission_id", "role_id"]);
    })
    .createTable("role_translations", (t) => {
      t.increments("id");
      t.integer("role_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("roles")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("title");
      t.unique(["language_code", "role_id"]);
      t.timestamps(false, true);
    })
    .createTable("user_roles", (t) => {
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.integer("role_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("roles")
        .onDelete("CASCADE");
      t.unique(["user_id", "role_id"]);
    })
    .createTable("category_translations", (t) => {
      t.increments("id");
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("title");
      t.text("description");
      t.timestamps(false, true);
    })
    .createTable("listing_bookmarks", (t) => {
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.unique(["user_id", "listing_id"]);
    })
    .createTable("currencies", (t) => {
      t.increments("id");
      t.string("code").unique();
      t.timestamps(false, true);
    })
    .createTable("exchange_rates", (t) => {
      t.increments("id");
      t.string("from_currency")
        .index()
        .notNullable()
        .references("code")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.string("to_currency")
        .index()
        .notNullable()
        .references("code")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.decimal("rate", 19, 9).defaultTo(1.0);
      t.unique(["from_currency", "to_currency"]);
      t.timestamps(false, true);
    })
    .createTable("listing_prices", (t) => {
      t.bigIncrements("id");
      t.string("currency_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.integer("amount");
      t.unique("listing_id");
      t.timestamps(false, true);
    })
    .createTable("listing_categories", (t) => {
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.integer("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.unique(["category_id", "listing_id"]);
    })
    .createTable("category_fields", (t) => {
      t.increments("id");
      t.boolean("required").defaultTo(true);
      t.boolean("read_only").defaultTo(false);
      t.boolean("disabled").defaultTo(false);
      t.boolean("multiple").defaultTo(false);
      t.boolean("checked").defaultTo(false);
      t.smallint("min").defaultTo(0);
      t.smallint("max").defaultTo(0);
      t.smallint("max_length").defaultTo(0);
      t.smallint("min_length").defaultTo(0);
      t.string("accept");
      t.string("pattern");
      t.enu("type", [
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
      t.enu("facet_type", ["checkbox", "radio", "number", "select", "range"]);
      t.enu("input_mode", ["text", "decimal", "numeric", "tel", "search", "email", "url"])
        .defaultTo("text");
      t.string("name");
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("category_field_translations", (t) => {
      t.increments("id");
      t.integer("category_field_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_fields")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("label");
      t.string("placeholder");
      t.string("hint");
      t.timestamps(false, true);
    })
    .createTable("category_field_values", (t) => {
      t.increments("id");
      t.integer("category_field_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_fields")
        .onDelete("CASCADE");
      t.string("name");
      t.timestamps(false, true);
    })
    .createTable("category_field_value_translations", (t) => {
      t.increments("id");
      t.integer("category_field_value_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_field_values")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("label");
      t.timestamps(false, true);
    })
    .createTable("listing_attributes", (t) => {
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.integer("category_field_value_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("category_field_values")
        .onDelete("CASCADE");
      t.unique(["listing_id", "category_field_value_id"]);
    })
    .createTable("promotions", (t) => {
      t.increments("id");
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.smallint("boost_score");
      t.timestamp("expiration_date");
      t.enu("placement", ["SEARCH", "FRONT"]).defaultTo("SEARCH");
      t.timestamps(false, true);
    })
    .createTable("listing_attachments", (t) => {
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.bigInteger("attachment_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
      t.smallint("display_order").defaultTo(0);
      t.unique(["listing_id", "attachment_id"])
    })
    .createTable("transactions", (t) => {
      t.bigIncrements("id");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.bigInteger("amount");
      t.bigInteger("card_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("user_cards")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("transaction_statuses", (t) => {
      t.increments("id");
      t.string("bg_hex", 7);
      t.string("fg_hex", 7);
      t.timestamps(false, true);
    })
    .createTable("transaction_status_translations", (t) => {
      t.increments("id");
      t.integer("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("transaction_statuses")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_id", "language_code"]);
      t.timestamps(false, true);
    })
    .createTable("chats", (t) => {
      t.bigIncrements("id");
      t.bigInteger("created_by")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.bigInteger("last_message_id")
        .index()
        .nullable()
      t.string("url");
      t.timestamps(false, true);
      t.index("created_at");
    })
    .createTable("chat_members", (t) => {
      t.bigInteger("chat_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("chats")
        .onDelete("CASCADE");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.bigInteger("last_read_message_id")
        .index()
        .nullable()
      t.integer("unread_count").defaultTo(0);
      t.unique(["chat_id", "user_id"]);
    })
    .createTable("messages", (t) => {
      t.bigIncrements("id");
      t.text("content").defaultTo("");
      t.enu("type", ["photo", "file", "video", "text", "media"]).defaultTo("text");
      t.integer("reply_to").index().references("id").inTable("messages");
      t.bigInteger("sender_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.bigInteger("chat_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("chats")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .table("chats", (t) => {
      t.foreign("last_message_id").references("id").inTable("messages").onDelete("SET NULL");
    })
    .table("chat_members", (t) => {
      t.foreign("last_read_message_id").references("id").inTable("messages").onDelete("SET NULL");
    })
    .createTable("read_messages", (t) => {
      t.bigInteger("message_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("messages")
        .onDelete("CASCADE");
      t.bigInteger("user_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.unique(["message_id", "user_id"]);
    })
    .createTable("message_attachments", (t) => {
      t.bigInteger("message_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("messages")
        .onDelete("CASCADE");
      t.bigInteger("attachment_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
      t.unique(["message_id", "attachment_id"]);
    })
    .createTable("countries", (t) => {
      t.string("code").primary();
      t.timestamps(false, true);
    })
    .createTable("country_translations", (t) => {
      t.string("country_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("countries")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.timestamps(false, true);
    })
    .createTable("regions", (t) => {
      t.increments("id");
      t.string("country_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("countries")
        .onDelete("CASCADE");
      t.integer("soato");
      t.smallint("code");
      t.point("coords");
      t.timestamps(false, true);
    })
    .createTable("region_translations", (t) => {
      t.integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("short_name");
      t.string("long_name");
      t.timestamps(false, true);
    })
    .createTable("districts", (t) => {
      t.increments("id");
      t.integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      t.integer("soato");
      t.smallint("code");
      t.point("coords");
      t.timestamps(false, true);
    })
    .createTable("district_translations", (t) => {
      t.integer("district_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("districts")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("short_name");
      t.string("long_name");
      t.timestamps(false, true);
    })
    .createTable("listing_location", (t) => {
      t.bigIncrements("id");
      t.string("formatted_address");
      t.point("coords");
      t.integer("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.integer("district_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("districts")
        .onDelete("CASCADE");
      t.integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("notification_type_translations", (t) => {
      t.increments("id");
      t.string("notification_type_name")
        .index()
        .notNullable()
        .references("name")
        .inTable("notification_types")
        .onDelete("CASCADE");
      t.string("language_code")
        .index()
        .notNullable()
        .references("code")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("title");
      t.text("content");
      t.unique(["notification_type_name", "language_code"]);
      t.timestamps(false, true);
    })
    .then(() => knex.raw(ON_PAYMENT_STATUS_UPDATE_FUNCTION));
}

export async function down(knex) {
  await knex.raw(`DROP TABLE IF EXISTS
    users, chats, accounts,
    attachments, attributes, attribute_translations,
    auth_providers, billing_accounts, categories, category_translations,
    category_fields, category_field_values, category_field_translations,
    category_field_value_translations, chat_members, confirmation_codes,
    countries, country_translations, credentials, currencies, districts,
    district_translations, exchange_rates, invoices,
    invoice_lines, languages, message_attachments, messages, notifications,
    notification_types, notification_type_translations, payment_providers, payment_statuses,
    payment_status_translations, payments, listing_attachments,
    listing_attributes, listing_bookmarks, listing_categories, listing_prices,
    listing_location, listing_status_translations, listing_statuses,
    listings, products, promotions, read_messages, regions, region_translations,
    roles, role_translations, sessions, sessions_credentials, transaction_statuses,
    transaction_status_translations, transactions, user_agents, user_cards,
    user_location, user_notifications, user_preferences, user_reviews, user_roles, last_seen,
    permissions, role_permissions
    CASCADE;
    ${DROP_ON_PAYMENT_STATUS_UPDATE_FUNCTION}
    `)
}
