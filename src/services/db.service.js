import config from "../config/index.js";
import pkg from "pg";

export let { Pool, escapeIdentifier, types } = pkg;

types.setTypeParser(20, String);

export let pool = new Pool({ connectionString: config.postgres_uri, connectionTimeoutMillis: 1000 });

export function prepare_bulk_insert(data, extensions = { data = {}, columns_map = {} } = {}, predicate = () => true) {
  let counter = 0;
  let values = ``;
  let columns = new Set();
  let params = [];

  for (let i = 0, len = data.length; i < len; i++) {
    let item = Object.assign(data[i], extensions.data);
    let is_last_item = i === len - 1;
    let keys = Object.keys(item);
    values += "("
    for (let j = 0, len = keys.length; j < len; j++) {
      let key = keys[j];
      if (!predicate(key)) continue;
      let mapped = extensions.columns_map[key];
      if (mapped) columns.add(mapped);
      else columns.add(key);
      let is_last_key = j === len - 1;
      if (is_last_key) values += `$${counter + 1}`;
      else values += `$${counter + 1},`;
      params.push(item[key]);
      counter++
    }
    if (is_last_item) values += ")"
    else values += "),"
  }

  return { sql: `(${Array.from(columns).join(",")}) values ${values}`, params }
}

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
