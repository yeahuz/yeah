import dotenv from "dotenv";

dotenv.config();

const PORT = parseInt(process.env.PORT, 10);
const PORT_DEV = parseInt(process.env.PORT_DEV, 10);
const PORT_STAGING = parseInt(process.env.PORT_STAGING, 10);

export { PORT, PORT_DEV, PORT_STAGING };
export const {
  NODE_ENV,
  KNEX_MIGRATIONS_DIR,
  KNEX_MIGRATIONS_DIR_DEV,
  POSTGRES_URI,
  POSTGRES_URI_DEV,
  KNEX_SEEDS_DIR,
  KNEX_SEEDS_DIR_DEV,
  ENCRYPTION_KEY,
  SESSION_COOKIE_SECRET,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_NAME_DEV,
  GOOGLE_OAUTH_CLIENT_SECRET,
  GOOGLE_OAUTH_CLIENT_ID,
  TELEGRAM_BOT_TOKEN,
  RP_ID,
  RP_ID_DEV,
  RP_NAME,
  RP_NAME_DEV,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_S3_REGION,
  AWS_S3_BUCKET_NAME,
  S3_ORIGIN,
} = process.env;
