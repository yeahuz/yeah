import config from "../config/index.js";
import { Upload } from "@aws-sdk/lib-storage";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { async_pool } from "../utils/async-pool.js";

const s3 = new S3Client({
  region: config.aws_s3_region,
  credentials: {
    accessKeyId: config.aws_access_key,
    secretAccessKey: config.aws_secret_key,
  },
});

function get_key(file_name) {
  if (!file_name) return randomUUID();
  return `${randomUUID()}-${file_name}`;
}

function get_s3_url(key) {
  return `https://s3.${config.aws_s3_region}.amazonaws.com/${config.aws_s3_bucket_name}/${key}`;
}

function get_url(key) {
  return `https://${config.s3_origin}/${key}`;
}

export async function delete_one(s3_key) {
  return await s3.send(new DeleteObjectCommand({ Key: s3_key, Bucket: config.aws_s3_bucket_name }));
}

export async function upload_url(url) {
  const key = get_key();
  const response = await fetch(url);
  const content_type = response.headers.get("content-type");

  const upload = new Upload({
    client: s3,
    params: {
      Bucket: config.aws_s3_bucket_name,
      Key: key,
      Body: response.body,
      ContentType: content_type,
      CacheControl: "max-age=31536000",
    },
    leavePartsOnError: false,
  });

  await upload.done();

  return {
    s3_url: get_s3_url(key),
    url: get_url(key),
    s3_key: key,
    name: key,
    mimetype: content_type,
  };
}

export async function upload(data) {
  if (data.file.bytesRead > 0) {
    const key = get_key(data.filename);
    const upload = new Upload({
      client: s3,
      params: {
        Bucket: config.aws_s3_bucket_name,
        Key: key,
        Body: data.file,
        ContentType: data.mimetype,
        CacheControl: "max-age=31536000",
      },
      queueSize: 4,
      partSize: 1024 * 1024 * 5,
      leavePartsOnError: false,
    });

    await upload.done();

    return {
      fields: data.fields,
      attachment: {
        s3_url: get_s3_url(key),
        url: get_url(key),
        s3_key: key,
        name: data.filename,
        mimetype: data.mimetype,
      },
    };
  }

  await data.toBuffer();
  return { fields: data.fields };
}

export async function* upload_multiple(files) {
  for await (const result of async_pool(16, files, upload)) {
    yield result;
  }
}
