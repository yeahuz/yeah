import config from "../config/index.js";
import pkg from "pg";

export let { Pool, escapeIdentifier, types } = pkg;

types.setTypeParser(20, String);

export let pool = new Pool({ connectionString: config.postgres_uri, connectionTimeoutMillis: 1000 });
export let ROLES = {};

async function populate_user_roles() {
  let { rows } = await pool.query(`select * from roles`);
  for (let role of rows) {
    ROLES[role.code] = role.id;
  }
}

populate_user_roles();

export async function query(text, params) {
  console.log("executing query", { text });
  let start = performance.now();
  let res = await pool.query(text, params);
  let duration = (performance.now() - start).toFixed(2);
  console.log("executed query", { duration, rows: res.rowCount });
  return res;
}

export async function get_client() {
  let client = await pool.connect();
  let original_query = client.query;
  let release = client.release;

  let timeout = setTimeout(() => {
    console.error(`A client has been checkout out for more than 5 seconds!`);
    console.error(`The last executed query on this client was: ${client.last_query}`);
  });

  client.query = (...args) => {
    client.lastQuery = args;
    return original_query.apply(client, args)
  }

  client.release = () => {
    clearTimeout(timeout);
    client.query = original_query;
    client.release = release;
    return release.apply(client);
  }

  return client;
}

export let start_trx = async () => {
  let client = await pool.connect();
  await client.query("BEGIN")
  return client;
}

export let commit_trx = async (client) => {
  await client.query("COMMIT")
  client.release();
}

export let rollback_trx = async (client) => {
  await client.query("ROLLBACK");
  client.release();
}

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
})
