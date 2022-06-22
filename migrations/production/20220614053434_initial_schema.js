export function up(knex) {
  return knex.schema
    .createTable("accounts", (table) => {
      table.increments("id");
      table.string("phone", 15);
      table.string("name");
      table.string("username");
      table.text("bio");
      table.string("website_url");
      table.string("profile_photo_url");
      table.string("email");
      table.unique(["username", "email"]);
      table.timestamp("last_activity_date").defaultTo(knex.fn.now());
      table.timestamps(false, true);
    })
    .createTable("credentials", (table) => {
      table.increments("id");
      table.string("credential_id", 1024);
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
    .createTable("postings_statuses", (table) => {
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
        .inTable("postings_statuses")
        .onDelete("CASCADE");
      table.timestamps(false, true);
    })
    .createTable("postings_statuses_translations", (table) => {
      table.increments("id");
      table
        .integer("status_id")
        .notNullable()
        .references("id")
        .inTable("postings_statuses")
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
    });
}

export function down(knex) {
  return knex.schema
    .dropTable("accounts")
    .dropTable("credentials")
    .dropTable("sessions")
    .dropTable("sessions_credentials")
    .dropTable("postings")
    .dropTable("postings_statuses")
    .dropTable("languages")
    .dropTable("postings_statuses_translations");
}
