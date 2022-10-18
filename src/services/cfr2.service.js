import config from "../config/index.js";
import S3 from "aws-sdk/clients/s3.js";
import { async_pool } from "../utils/async-pool.js";
import { randomUUID } from "crypto";

const client = new S3({
  endpoint: `https://${config.cf_account_id}.r2.cloudflarestorage.com`,
  accessKeyId: config.cf_r2_access_key,
  secretAccessKey: config.cf_r2_secret_key,
  signatureVersion: "v4",
});

export async function update_bucket_cors() {
  return await client.putBucketCors({
    Bucket: "s3-needs-uz",
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedMethods: ["PUT", "POST"],
          AllowedOrigins: ["http://localhost:3000"],
          AllowedHeaders: ["*"],
        },
      ],
    },
  });
}

export async function get_direct_upload_url(filename) {
  const Key = `${randomUUID()}-${filename}`;
  return await client.getSignedUrlPromise("putObject", {
    Bucket: "s3-needs-uz",
    Key,
    Expires: 3600,
  });
}

export async function get_direct_upload_urls(filenames = []) {
  const urls = [];
  for await (const url of async_pool(16, filenames, get_direct_upload_url)) {
    urls.push(url);
  }
  return urls;
}
