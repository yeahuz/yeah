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
  return await client
    .putBucketCors({
      Bucket: "s3-needs-uz",
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedMethods: ["PUT", "POST", "GET"],
            AllowedOrigins: ["http://localhost:3000"],
            AllowedHeaders: [
              "content-type",
              "Content-Type",
              "Cotent-Disposition",
              "content-disposition",
            ],
            ExposeHeaders: ["Content-Disposition"],
          },
        ],
      },
    })
    .promise();
}

export async function get_bucket_cors() {
  return await client.getBucketCors({ Bucket: "s3-needs-uz" }).promise();
}

export function get_public_url(id) {
  return `${config.cf_r2_base_public_uri}/${id}`;
}

export async function get_direct_upload_url(file) {
  let id = `${randomUUID()}/${file.name}`;
  let upload_url = await client.getSignedUrlPromise("putObject", {
    Bucket: "s3-needs-uz",
    Key: id,
    Expires: 3600,
    ContentType: file.type,
  });

  return { id, upload_url, public_url: get_public_url(id) };
}

export async function head_object(key) {
  const [filename] = key.match(/(\w+)[^-]*$/);
  const result = await client.headObject({ Key: key, Bucket: "s3-needs-uz" }).promise();

  if (result) {
    return {
      id: key,
      name: filename,
      meta: { size: result.ContentLength, type: result.ContentType },
    };
  }
}

export async function get_direct_upload_urls(files = []) {
  const urls = [];
  for await (const url of async_pool(16, files, get_direct_upload_url)) {
    urls.push(url);
  }
  return urls;
}
