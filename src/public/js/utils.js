const noop = () => {};

export function upload_request(
  url,
  { data, method, on_progress = noop, on_done = noop, ...config } = {}
) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "json";
    xhr.addEventListener("loadend", () => {
      if (xhr.readyState === 4) {
        if (xhr.status >= 400) reject(xhr.response);
        else resolve(xhr.response);
      }
    });

    xhr.addEventListener("error", reject);
    xhr.upload.addEventListener("error", reject);
    xhr.upload.addEventListener("load", on_done);
    xhr.upload.addEventListener("loadstart", (e) => {
      on_progress({ value: 0, max: e.total, percent: 0 });
    });
    xhr.upload.addEventListener("progress", (e) => {
      on_progress({ value: e.loaded, max: e.total, percent: (e.loaded / e.total) * 100 });
    });

    xhr.open(method || "POST", url, true);

    if (config.headers) {
      for (const key in config.headers) {
        xhr.setRequestHeader(key, config.headers[key]);
      }
    }

    xhr.send(data);
  });
}

export async function request(
  url,
  { body, query, method, timeout = 60000, state = {}, ...custom_config } = {}
) {
  if (query) {
    const params = new URLSearchParams();
    for (const key in query) {
      if (query[key]) params.append(key, query[key]);
    }

    url += "?" + params.toString();
  }

  const isFormData = body instanceof FormData;
  const controller = new AbortController();
  const timerId = setTimeout(controller.abort, timeout);
  const config = {
    signal: controller.signal,
    method: method || (body ? "POST" : "GET"),
    body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    ...custom_config,
    headers: {
      "X-Requested-With": "XMLHttpRequest",
      Accept: "application/json",
      ...(!isFormData && body && { "Content-Type": "application/json" }),
      ...custom_config.headers,
    },
  };

  return window.fetch(url, config).then(async (response) => {
    clearTimeout(timerId);
    const accept = config.headers["Accept"];
    let data = response;

    switch (accept) {
      case "application/json": {
        data = await response.json().catch(() => {});
        break;
      }
      case "text/html": {
        data = await response.text();
        break;
      }
      default:
    }

    if (!response.ok) {
      return Promise.reject(data);
    }

    if (state.replace && response.redirected) {
      if (state.reload) {
        window.location.href = response.url;
      } else {
        window.history.pushState(null, "", response.url);
      }
    }

    return data;
  });
}

export async function option(promise) {
  try {
    const result = await promise;
    return [result, undefined];
  } catch (err) {
    return [undefined, err];
  }
}

export function debounce(fn, timeout = 300) {
  let timer;
  return function debouncedFn(...args) {
    const later = () => {
      clearTimeout(timer);
      fn(...args);
    };
    clearTimeout(timer);
    timer = setTimeout(later, timeout);
  };
}

export function first(arr = []) {
  return arr[0];
}

export function prop(key) {
  return (obj) => obj[key];
}

export function redirect(path) {
  window.location.href = path;
}

export function message_sw(data) {
  return new Promise(async (resolve) => {
    const message_channel = new MessageChannel();
    const reg = await navigator.serviceWorker.getRegistration();
    const sw = reg.active || reg.installing || reg.waiting;
    if (sw) {
      message_channel.port1.onmessage = resolve;
      sw.postMessage(data, [message_channel.port2]);
    } else resolve();
  });
}

export function is_apple_device() {
  return /(Mac|iPhone|iPod|iPad)/i.test(navigator.platform);
}

export function wait(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// https://github.com/rxaviers/async-pool/blob/master/lib/es9.js
export async function* async_pool(concurrency, iterable, iterator_fn) {
  const executing = new Set();
  async function consume() {
    const [promise, value] = await Promise.race(executing);
    executing.delete(promise);
    return value;
  }

  for (const item of iterable) {
    const promise = (async () => await iterator_fn(item, iterable))().then((value) => [
      promise,
      value,
    ]);
    executing.add(promise);
    if (executing.size >= concurrency) {
      yield await consume();
    }
  }

  while (executing.size) {
    yield await consume();
  }
}

export async function async_pool_all(...args) {
  const results = [];
  for await (const result of async_pool(...args)) {
    results.push(result);
  }
  return results;
}

// https://stackoverflow.com/questions/15900485/correct-way-to-convert-size-in-bytes-to-kb-mb-gb-in-javascript
export function format_bytes(bytes, decimals = 2) {
  if (!+bytes) return "0 bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))}${sizes[i]}`;
}
