import config from "../config/index.js";
import { async_pool } from "../utils/async-pool.js";

class CFImages {
  constructor({ token, base_uri }) {
    this.token = token;
    this.base_uri = base_uri;
  }

  async request(url, { method, data, ...config } = {}) {
    const response = await fetch(this.base_uri + url, {
      method: method || (data ? "POST" : "GET"),
      body: data,
      headers: {
        Authorization: `Bearer ${this.token}`,
        ...config.headers,
      },
    });
    const json = await response.json().catch((e) => console.log({ e }));

    if (!response.ok) {
      return Promise.reject(json);
    }

    return json?.result;
  }
}

const client = new CFImages({
  token: config.cf_images_api_key,
  base_uri: config.cf_images_api_uri,
});

export function get_cf_image_url(id) {
  return `https://imagedelivery.net/${config.cf_images_account_hash}/${id}`;
}

export async function get_direct_upload_url(file) {
  const fd = new FormData();
  fd.append("requireSignedURLs", "false");
  fd.append("metadata", JSON.stringify(file));
  return await client.request("/v2/direct_upload", { data: fd });
}

export async function get_direct_upload_urls(files) {
  const urls = [];
  for await (const url of async_pool(16, files, get_direct_upload_url)) {
    urls.push(url);
  }
  return urls;
}

export async function get_one(id) {
  const result = await client.request(`/v1/${id}`, {
    headers: { "Content-Type": "application/json" },
  });

  if (result) {
    return { id: result.id, name: result.filename, meta: result.meta };
  }
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

export async function upload_url(url) {
  const fd = new FormData();
  fd.append("url", url);
  return await client.request("/v1", { data: fd });
}
