import config from "../config/index.js";
import { async_pool } from "../utils/async-pool.js";

class CFImages {
  constructor(token) {
    this.token = token;
  }

  async request(url, { method, data }) {
    const response = await fetch(config.cf_images_api_uri + url, {
      method: method || (data ? "POST" : "GET"),
      body: data,
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
    const json = await response.json().catch((e) => console.log({ e }));

    if (!response.ok) {
      return Promise.reject(json);
    }

    return json?.result;
  }
}

const client = new CFImages(config.cf_images_api_key);

export function get_cf_image_url(uploaded) {
  return {
    ...uploaded,
    url: `https://imagedelivery.net/${config.cf_images_account_hash}/${uploaded.id}`,
  };
}

export async function get_direct_upload_url() {
  const fd = new FormData();
  fd.append("requireSignedURLs", "false");
  return await client.request("/v2/direct_upload", { data: fd });
}

export async function get_direct_upload_urls(count) {
  const urls = [];
  const arr = Array(count).fill(0);
  for await (const url of async_pool(16, arr, get_direct_upload_url)) {
    urls.push(url);
  }
  return urls;
}

export async function upload(data) {
  const fd = new FormData();
  const buf = await data.toBuffer();
  if (!data.filename || !buf.length) return;
  fd.append("file", new Blob([buf]), data.filename);
  return await client.request("/v1", { data: fd });
}

export async function delete_one(id) {
  return await client.request(`/v1/${id}`, { method: "DELETE" });
}
