import config from "./src/config/index.js";
import path from "path";

export default {
  client: "pg",
  connection: config.postgres_uri,
  pool: { min: 0 },
  migrations: {
    directory: path.join(process.cwd(), config.knex_migrations_dir),
  },
  seeds: {
    directory: path.join(process.cwd(), config.knex_seeds_dir),
  },
};
