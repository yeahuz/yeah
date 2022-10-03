import { NODE_ENV } from "./secrets.js";
import { configs } from "./configs.js";
import { parse } from "dotenv";
import { writeFile, rename } from "fs/promises";
import { option } from "../utils/index.js";
import fs from "fs";

const env = NODE_ENV || "development";

const buf = fs.readFileSync(".env");
const config = parse(buf);

export async function update_env(new_config = {}, eol = "\n") {
  const contents = Object.entries(Object.assign(config, new_config))
    .map(([key, value]) => `${key}=${value}`)
    .join(eol);

  const [result, err] = await option(writeFile(".env.next", contents));
  if (!err) await rename(".env.next", ".env");
}

export default configs[env];
