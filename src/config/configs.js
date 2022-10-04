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
  GOOGLE_OAUTH_REDIRECT_URI,
  GOOGLE_OAUTH_REDIRECT_URI_DEV,
  TELEGRAM_BOT_TOKEN,
  NODE_ENV,
  RP_ID,
  RP_ID_DEV,
  RP_NAME,
  AWS_ACCESS_KEY,
  AWS_SECRET_KEY,
  AWS_S3_REGION,
  AWS_S3_BUCKET_NAME,
  S3_ORIGIN,
  ES_PASSWORD,
  ES_USERNAME,
  ORIGIN,
  ORIGIN_DEV,
  JWT_SECRET,
  WS_URI,
  WS_URI_DEV,
  SMS_API_URI,
  SMS_API_EMAIL,
  SMS_API_PASSWORD,
  PAYME_MERCHANT_ID,
  CLICK_MERCHANT_ID,
  PAYME_CHECKOUT_URI,
  CLICK_CHECKOUT_URI,
  CF_IMAGES_API_KEY,
  CF_API_URI,
  CF_IMAGES_ACCOUNT_ID,
  CF_IMAGES_ACCOUNT_HASH,
  IP_INFO_API_TOKEN,
  OCTO_API_KEY,
  OCTO_API_URI,
  OCTO_MERCHANT_ID,
  SMS_API_TOKEN,
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
    google_oauth_redirect_uri: GOOGLE_OAUTH_REDIRECT_URI,
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
    origin: ORIGIN,
    jwt_secret: JWT_SECRET,
    ws_uri: WS_URI,
    sms_api_uri: SMS_API_URI,
    sms_api_email: SMS_API_EMAIL,
    sms_api_password: SMS_API_PASSWORD,
    sms_api_token: SMS_API_TOKEN,
    payme_merchant_id: PAYME_MERCHANT_ID,
    click_merchant_id: CLICK_MERCHANT_ID,
    payme_checkout_uri: PAYME_CHECKOUT_URI,
    click_checkout_uri: CLICK_CHECKOUT_URI,
    cf_images_api_key: CF_IMAGES_API_KEY,
    cf_api_uri: CF_API_URI,
    cf_images_api_uri: `${CF_API_URI}/${CF_IMAGES_ACCOUNT_ID}/images`,
    cf_images_account_id: CF_IMAGES_ACCOUNT_ID,
    cf_images_account_hash: CF_IMAGES_ACCOUNT_HASH,
    ip_info_api_token: IP_INFO_API_TOKEN,
    octo_api_key: OCTO_API_KEY,
    octo_api_uri: OCTO_API_URI,
    octo_merchant_id: OCTO_MERCHANT_ID,
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
    google_oauth_redirect_uri: GOOGLE_OAUTH_REDIRECT_URI_DEV,
    telegram_bot_token: TELEGRAM_BOT_TOKEN,
    node_env: NODE_ENV,
    rp_id: RP_ID_DEV,
    rp_name: RP_NAME,
    s3_origin: S3_ORIGIN,
    aws_access_key: AWS_ACCESS_KEY,
    aws_secret_key: AWS_SECRET_KEY,
    aws_s3_region: AWS_S3_REGION,
    aws_s3_bucket_name: AWS_S3_BUCKET_NAME,
    es_username: ES_USERNAME,
    es_password: ES_PASSWORD,
    origin: ORIGIN_DEV,
    jwt_secret: JWT_SECRET,
    ws_uri: WS_URI_DEV,
    sms_api_uri: SMS_API_URI,
    sms_api_email: SMS_API_EMAIL,
    sms_api_password: SMS_API_PASSWORD,
    sms_api_token: SMS_API_TOKEN,
    payme_merchant_id: PAYME_MERCHANT_ID,
    click_merchant_id: CLICK_MERCHANT_ID,
    payme_checkout_uri: PAYME_CHECKOUT_URI,
    click_checkout_uri: CLICK_CHECKOUT_URI,
    cf_images_api_key: CF_IMAGES_API_KEY,
    cf_api_uri: CF_API_URI,
    cf_images_api_uri: `${CF_API_URI}/${CF_IMAGES_ACCOUNT_ID}/images`,
    cf_images_account_id: CF_IMAGES_ACCOUNT_ID,
    cf_images_account_hash: CF_IMAGES_ACCOUNT_HASH,
    ip_info_api_token: IP_INFO_API_TOKEN,
    octo_api_key: OCTO_API_KEY,
    octo_api_uri: OCTO_API_URI,
    octo_merchant_id: OCTO_MERCHANT_ID,
  },
};
