import config from "../config/index.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { async_pool } from "../utils/async-pool.js";
import { randomUUID } from "crypto";

let client = new S3Client({
  endpoint: `https://${config.cf_account_id}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.cf_r2_access_key,
    secretAccessKey: config.cf_r2_secret_key,
  }, region: "auto"
});

export async function update_bucket_cors() {
  return await client
    .putBucketCors({
      Bucket: "s3-needs-uz",
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedMethods: ["PUT", "POST", "GET"],
            AllowedOrigins: ["http://localhost:3000", "http://localhost:3001"],
            AllowedHeaders: [
              "content-type",
              "Content-Type",
              "Cotent-Disposition",
              "content-disposition",
              "content-length",
              "Content-Length"
            ],
            ExposeHeaders: ["Content-Disposition", "Content-Length"],
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
  let id = `${randomUUID()}/${file.name}`
  let command = new PutObjectCommand({
    Bucket: "s3-needs-uz",
    Key: id,
    ContentType: file.type
  });

  let upload_url = await getSignedUrl(client, command, { expiresIn: 3600 });

  return { id, upload_url, public_url: get_public_url(id) };
}

export async function head_object(key) {
  let [filename] = key.match(/(\w+)[^-]*$/);
  let result = await client.headObject({ Key: key, Bucket: "s3-needs-uz" }).promise();

  if (result) {
    return {
      id: key,
      name: filename,
      meta: { size: result.ContentLength, type: result.ContentType },
    };
  }
}

export async function get_direct_upload_urls(files = []) {
  let urls = [];
  for await (let url of async_pool(16, files, get_direct_upload_url)) {
    urls.push(url);
  }
  return urls;
}
