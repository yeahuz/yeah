import config from "../config/index.js";
import knex from "knex";

export const yeah = knex({
  client: "pg",
  connection: config.postgres_uri,
  pool: { min: 0 },
});
