import {
  PORT,
  PORT_DEV,
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
  GOOGLE_JS_MAPS_API_KEY,
  GOOGLE_MAPS_API_KEY,
  TELEGRAM_BOT_TOKEN,
  NODE_ENV,
  RP_ID,
  RP_ID_DEV,
  RP_NAME,
  RP_NAME_DEV,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_S3_REGION,
  AWS_S3_BUCKET_NAME,
  S3_ORIGIN,
  ES_PASSWORD,
  ES_USERNAME,
  ORIGIN,
  ORIGIN_DEV
} from "./secrets.js";

export const configs = {
  production: {
    port: PORT,
    knex_migrations_dir: KNEX_MIGRATIONS_DIR,
    postgres_uri: POSTGRES_URI,
    knex_seeds_dir: KNEX_SEEDS_DIR,
    encryption_key: ENCRYPTION_KEY,
    session_cookie_name: SESSION_COOKIE_NAME,
    session_cookie_secret: SESSION_COOKIE_SECRET,
    google_oauth_client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    google_oauth_client_id: GOOGLE_OAUTH_CLIENT_ID,
    google_maps_api_key: GOOGLE_MAPS_API_KEY,
    google_js_maps_api_key: GOOGLE_JS_MAPS_API_KEY,
    telegram_bot_token: TELEGRAM_BOT_TOKEN,
    node_env: NODE_ENV,
    rp_id: RP_ID,
    rp_name: RP_NAME,
    s3_origin: S3_ORIGIN,
    aws_access_key: AWS_ACCESS_KEY,
    aws_secret_key: AWS_SECRET_KEY,
    aws_s3_region: AWS_S3_REGION,
    aws_s3_bucket_name: AWS_S3_BUCKET_NAME,
    es_username: ES_USERNAME,
    es_password: ES_PASSWORD,
    origin: ORIGIN
  },
  development: {
    port: PORT_DEV,
    knex_migrations_dir: KNEX_MIGRATIONS_DIR_DEV,
    postgres_uri: POSTGRES_URI_DEV,
    knex_seeds_dir: KNEX_SEEDS_DIR_DEV,
    encryption_key: ENCRYPTION_KEY,
    session_cookie_name: SESSION_COOKIE_NAME_DEV,
    session_cookie_secret: SESSION_COOKIE_SECRET,
    google_oauth_client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
    google_oauth_client_id: GOOGLE_OAUTH_CLIENT_ID,
    google_maps_api_key: GOOGLE_MAPS_API_KEY,
    google_js_maps_api_key: GOOGLE_JS_MAPS_API_KEY,
    telegram_bot_token: TELEGRAM_BOT_TOKEN,
    node_env: NODE_ENV,
    rp_id: RP_ID_DEV,
    rp_name: RP_NAME_DEV,
    s3_origin: S3_ORIGIN,
    aws_access_key: AWS_ACCESS_KEY,
    aws_secret_key: AWS_SECRET_KEY,
    aws_s3_region: AWS_S3_REGION,
    aws_s3_bucket_name: AWS_S3_BUCKET_NAME,
    es_username: ES_USERNAME,
    es_password: ES_PASSWORD,
    origin: ORIGIN_DEV
  },
};
