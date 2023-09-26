let ON_PAYMENT_STATUS_UPDATE_FUNCTION = `
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

let DROP_ON_PAYMENT_STATUS_UPDATE_FUNCTION = `DROP FUNCTION on_payment_status_update`;
let DISCOUNT_BENEFIT_CURRENCY_CONSTRAINT = `ALTER TABLE discount_benefits ADD CONSTRAINT "db_curreny_code_is_not_null_check"
  CHECK (
    unit = 'PERCENTAGE'
    OR currency is not null
  )`

let DISCOUNT_SPECIFICATION_CURRENCY_CONSTRAINT = `ALTER TABLE discount_specifications ADD CONSTRAINT "ds_curreny_code_is_not_null_check"
  CHECK (
    min_amount is not null
    OR min_amount_currency is not null
    AND
    for_each_amount is not null
    OR for_each_amount_currency is not null
  )`;

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
    // .createTable("products", (t) => {
    //   t.bigIncrements("id");
    //   t.string("title");
    //   t.string("description");
    //   t.integer("unit_price");
    //   t.timestamps(false, true);
    // })
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
      t.string("id").primary();
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
        .references("id")
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
    // .createTable("invoice_lines", (t) => {
    //   t.bigIncrements("id");
    //   t.smallint("quantity").defaultTo(1);
    //   t.bigInteger("product_id")
    //     .index()
    //     .notNullable()
    //     .references("id")
    //     .inTable("products")
    //     .onDelete("CASCADE");
    //   t.timestamps(false, true);
    // })
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
    .createTable("session_credentials", (t) => {
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
      t.string("id").primary();
      t.string("name");
      t.timestamps(false, true);
    })
    .createTable("listing_statuses", (t) => {
      t.enu("id", ["ACTIVE", "IN_MODERATION", "INDEXING", "ARCHIVED", "DRAFT"]).primary();
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
    })
    .createTable("categories", (t) => {
      t.increments("id");
      t.integer("parent_id").index().references("id").inTable("categories").onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("listing_conditions", (t) => {
      t.increments("id");
      t.timestamps(false, true);
    })
    .createTable("listing_condition_translations", (t) => {
      t.increments("id");
      t.integer("condition_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_conditions")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.string("description");
      t.unique(["language_id", "condition_id"])
      t.timestamps(false, true);
    })
    .createTable("category_conditions", (t) => {
      t.integer("condition_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_conditions")
        .onDelete("CASCADE");
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.unique(["category_id", "condition_id"]);
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
    .createTable("currencies", (t) => {
      t.string("id", 10).primary();
      t.string("symbol", 10);
      t.timestamps(false, true);
    })
    .createTable("stores", (t) => {
      t.increments("id");
      t.string("url").notNullable();
      t.bigInteger("banner_id")
        .index()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
      t.bigInteger("logo_id")
        .index()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
      t.string("description");
      t.timestamps(false, true);
    })
    .createTable("listing_sku_prices", (t) => {
      t.bigIncrements("id");
      t.string("currency")
        .index()
        .notNullable()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.bigInteger("unit_price");
      t.bigInteger("listing_sku_id").index().notNullable();
      t.timestamps(false, true);
    })
    .createTable("listings", (t) => {
      t.bigIncrements("id");
      t.string("title");
      t.text("description");
      t.string("url", 512);
      t.boolean("best_offer_enabled").defaultTo(false);
      t.specificType("attributes", "INT[]").index(null, "GIN");
      t.specificType("attribute_options", "INT[]").index(null, "GIN");
      t.jsonb("temp_variations").defaultTo([])
      t.integer("store_id")
        .index()
        .references("id")
        .inTable("stores")
        .onDelete("CASCADE");
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
        .onDelete("CASCADE");
      t.bigInteger("created_by")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.string("status")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_statuses")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("listing_skus", (t) => {
      t.bigIncrements("id");
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.bigInteger("price_id")
        .index()
        .references("id")
        .inTable("listing_sku_prices")
        .onDelete("CASCADE");
      t.integer("store_id")
        .index()
        .references("id")
        .inTable("stores")
        .onDelete("CASCADE");
      t.string("custom_sku");
      t.unique(["listing_id", "price_id"]);
      t.unique(["custom_sku", "store_id", "listing_id"]);
      t.timestamps(false, true);
    })
    .table("listing_sku_prices", (t) => {
      t.foreign("listing_sku_id").references("id").inTable("listing_skus").onDelete("CASCADE");
    })
    .createTable("inventory", (t) => {
      t.bigIncrements("id");
      t.bigInteger("listing_sku_id")
        .unique()
        .notNullable()
        .references("id")
        .inTable("listing_skus")
        .onDelete("CASCADE");
      t.integer("quantity").defaultTo(0);
      t.timestamps(false, true);
    })
    .createTable("promotion_statuses", (t) => {
      t.string("id").primary();
      t.string("bg_hex", 7);
      t.string("fg_hex", 7);
    })
    .createTable("promotion_types", (t) => {
      t.string("id").primary();
    })
    .createTable("promotions", (t) => {
      t.increments("id");
      t.string("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotion_statuses")
        .onDelete("CASCADE");
      t.string("type_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotion_types")
        .onDelete("CASCADE");
      t.smallint("priority").defaultTo(1);
      t.string("name");
      t.string("description");
      t.timestamp("end_date");
      t.timestamp("start_date");
      t.integer("store_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("stores")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("promotion_criterion_skus", (t) => {
      t.bigInteger("listing_sku_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_skus")
        .onDelete("CASCADE");
      t.integer("promotion_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotions")
        .onDelete("CASCADE");
      t.unique(["listing_sku_id", "promotion_id"]);
    })
    .createTable("promotion_criterion_categories", (t) => {
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.integer("promotion_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotions")
        .onDelete("CASCADE");
      t.unique(["category_id", "promotion_id"]);
    })
    .createTable("promotion_criterion_conditions", (t) => {
      t.integer("condition_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_conditions")
        .onDelete("CASCADE");
      t.integer("promotion_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotions")
        .onDelete("CASCADE");
      t.unique(["condition_id", "promotion_id"]);
    })
    .createTable("discount_rules", (t) => {
      t.increments("id");
      t.integer("promotion_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotions")
        .onDelete("CASCADE");
      t.smallint("rule_order").defaultTo(0);
      t.timestamps(false, true);
    })
    .createTable("discount_specifications", (t) => {
      t.increments("id");
      t.integer("min_quantity");
      t.integer("min_amount");
      t.integer("for_each_quantity");
      t.integer("for_each_amount");
      t.string("min_amount_currency")
        .index()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.string("for_each_amount_currency")
        .index()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.integer("discount_rule_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("discount_rules")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("discount_benefits", (t) => {
      t.integer("discount_specification_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("discount_specifications")
        .onDelete("CASCADE");
      t.enu("unit", ["PERCENTAGE", "AMOUNT"]);
      t.string("value").defaultTo("");
      t.string("currency")
        .index()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("promotion_status_translations", (t) => {
      t.increments("id");
      t.string("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotion_statuses")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_id", "language_id"]);
      t.timestamps(false, true);
    })
    .createTable("promotion_type_translations", (t) => {
      t.increments("id");
      t.string("type_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("promotion_types")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.string("description");
      t.unique(["type_id", "language_id"]);
      t.timestamps(false, true);
    })
    .createTable("orders", (t) => {
      t.bigIncrements("id");
      t.bigInteger("customer_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("users")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("order_items", (t) => {
      t.bigIncrements("id");
      t.bigInteger("order_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("orders")
        .onDelete("CASCADE");
      t.bigInteger("listing_sku_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_skus")
        .onDelete("CASCADE");
      t.integer("quantity");
      t.bigInteger("unit_price");
      t.unique(["listing_sku_id", "order_id"])
      t.timestamps(false, true);
    })
    .createTable("shipping_cost_types", (t) => {
      t.string("id").primary();
    })
    .createTable("shipping_cost_type_translations", (t) => {
      t.increments("id");
      t.string("cost_type_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("shipping_cost_types")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["cost_type_id", "language_id"]);
      t.timestamps(false, true);
    })
    .createTable("listing_shipping_details", (t) => {
      t.increments("id");
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.string("cost_type_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("shipping_cost_types")
        .onDelete("CASCADE");
      t.string("handling_time");
      t.enu("handling_time_unit", ["DAY"]);
    })
    .createTable("shipping_services", (t) => {
      t.smallint("id").primary();
      t.string("name").notNullable();
      t.bigInteger("logo_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attachments")
        .onDelete("CASCADE");
      t.smallint("min_time");
      t.smallint("max_time");
    })
    .createTable("listing_shipping_services", (t) => {
      t.bigInteger("listing_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listings")
        .onDelete("CASCADE");
      t.smallint("shipping_service_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("shipping_services")
        .onDelete("CASCADE");
      t.boolean("free").defaultTo(false);
      t.integer("shipping_cost");
      t.string("shipping_cost_currency")
        .index()
        .notNullable()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.integer("additional_cost");
      t.string("additional_cost_currency")
        .index()
        .notNullable()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.smallint("display_order").defaultTo(0);
      t.unique(["shipping_service_id", "listing_id"]);
    })
    .createTable("payment_status_translations", (t) => {
      t.increments("id");
      t.string("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("payment_statuses")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_id", "language_id"]);
      t.timestamps(false, true);
    })
    .createTable("listing_status_translations", (t) => {
      t.increments("id");
      t.string("status_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("listing_statuses")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_id", "language_id"]);
      t.timestamps(false, true);
    })
    .createTable("roles", (t) => {
      t.increments("id");
      t.enu("code", ["ADMIN", "MODERATOR", "USER"]);
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("title");
      t.unique(["language_id", "role_id"]);
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
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
    .createTable("exchange_rates", (t) => {
      t.increments("id");
      t.string("from_currency")
        .index()
        .notNullable()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.string("to_currency")
        .index()
        .notNullable()
        .references("id")
        .inTable("currencies")
        .onDelete("CASCADE");
      t.decimal("rate", 19, 9).defaultTo(1.0);
      t.unique(["from_currency", "to_currency"]);
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.unique(["status_id", "language_id"]);
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
      t.string("id").primary();
      t.timestamps(false, true);
    })
    .createTable("country_translations", (t) => {
      t.string("country_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("countries")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
      t.timestamps(false, true);
    })
    .createTable("regions", (t) => {
      t.increments("id");
      t.string("country_id")
        .index()
        .notNullable()
        .references("id")
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
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
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("title");
      t.text("content");
      t.unique(["notification_type_name", "language_id"]);
      t.timestamps(false, true);
    })
    .createTable("user_addresses", (t) => {
      t.bigIncrements("id");
      t.string("name").notNullable();
      t.string("country_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("countries")
        .onDelete("CASCADE");
      t.integer("region_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("regions")
        .onDelete("CASCADE");
      t.integer("district_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("districts")
        .onDelete("CASCADE");
      t.string("postal_code");
      t.string("address").notNullable();
      t.string("address2")
      t.timestamps(false, true);
    })
    .createTable("attributes_2", (t) => {
      t.increments("id");
      t.boolean("multiple").defaultTo(false);
      t.boolean("required").defaultTo(false);
      t.boolean("enabled_for_variations").defaultTo(false);
      t.string("key");
      t.specificType("units", "VARCHAR[]").defaultTo('{}');
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.timestamps(false, true);
    })
    .createTable("attribute_2_translations", (t) => {
      t.increments("id");
      t.integer("attribute_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attributes_2")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
    })
    .createTable("attribute_2_options", (t) => {
      t.increments("id");
      t.string("value");
      t.string("unit").defaultTo("");
      t.integer("attribute_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attributes_2")
        .onDelete("CASCADE");
    })
    .createTable("attribute_2_option_translations", (t) => {
      t.increments("id");
      t.integer("attribute_option_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("attribute_2_options")
        .onDelete("CASCADE");
      t.string("language_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("languages")
        .onDelete("CASCADE");
      t.string("name");
    })
    .createTable("category_reference", (t) => {
      t.string("table_name");
      t.integer("category_id")
        .index()
        .notNullable()
        .references("id")
        .inTable("categories")
        .onDelete("CASCADE");
      t.specificType("columns", "VARCHAR[]").defaultTo('{}');
    })
    .then(() => knex.raw(ON_PAYMENT_STATUS_UPDATE_FUNCTION))
    .then(() => knex.raw(DISCOUNT_BENEFIT_CURRENCY_CONSTRAINT))
    .then(() => knex.raw(DISCOUNT_SPECIFICATION_CURRENCY_CONSTRAINT));
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
    listing_attributes, listing_bookmarks, listing_categories, listing_sku_prices,
    listing_location, listing_status_translations, listing_statuses,
    listings, products, promotions, read_messages, regions, region_translations,
    roles, role_translations, sessions, session_credentials, transaction_statuses,
    transaction_status_translations, transactions, user_agents, user_cards,
    user_location, user_notifications, user_preferences, user_reviews, user_roles, last_seen,
    permissions, role_permissions, listing_discounts, orders, order_items, user_addresses,
    listing_variations, listing_variation_values, inventory, shipping_services,
    category_conditions, discount_benefits, discount_rules, discount_specifications,
    listing_condition_translations, listing_conditions, listing_shipping_details,
    listing_shipping_services, listing_sku_attributes, listing_skus, promotion_criterion_categories,
    promotion_criterion_conditions, promotion_criterion_skus, promotion_status_translations, promotion_statuses,
    promotion_types, promotion_type_translations, shipping_cost_types, shipping_cost_type_translations, stores,
    attributes_2, attribute_2_options
    CASCADE;
    ${DROP_ON_PAYMENT_STATUS_UPDATE_FUNCTION}
    `)
}
