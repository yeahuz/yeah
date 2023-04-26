import config from "../config/index.js";
import knex from "knex";
import pkg from "pg";

const { Pool } = pkg;

export const pool = new Pool({ connectionString: config.postgres_uri })

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err)
  process.exit(-1)
})

export const yeah = knex({
  client: "pg",
  connection: config.postgres_uri,
  pool: { min: 0 },
});
