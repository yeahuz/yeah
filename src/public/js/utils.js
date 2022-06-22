export async function request(
  url,
  { body, query, method, timeout = 60000, replace_state, ...custom_config } = {}
) {
  if (query) {
    url += `?${new URLSearchParams(query).toString()}`;
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
    if (replace_state && response.redirected) {
      window.history.replaceState(null, "", response.url);
    }
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

    return data;
  });
}

export async function option(promise) {
  try {
    const result = await promise;
    return [result, null];
  } catch (err) {
    return [null, err];
  }
}
