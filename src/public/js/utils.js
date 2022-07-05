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

// export async function request2(entity, { body, timeout = 60000, replace_state, ...custom_config }) {
//   const is_form_element = entity instanceof HTMLFormElement;
//   let resource = is_form_element ? new URL(entity.action || window.location.href) : entity;

//   const controller = new AbortController();
//   const timer_id = setTimeout(controller.abort, timeout);

//   const d = new FormData(entity)
//   console.log(d.get("phone"))
//   console.log(Object.fromEntries(new FormData(entity)));
//   const config = {
//     signal: controller.signal,
//     method: (is_form_element && entity.method) || body ? "post" : "get",
//     body: (body && JSON.stringify(body)) || is_form_element ? JSON.stringify(Object.fromEntries(new FormData(entity))) : undefined,
//     ...custom_config,
//     headers: {
//       "X-Requested-With": "XMLHttpRequest",
//       Accept: "application/json",
//       ...(!is_form_element && { "Content-Type": "application/json" }),
//       ...custom_config.headers
//     }
//   }


//   if(is_form_element && config.method === "get") {
//     resource.search = new URLSearchParams(new FormData(entity))
//   }

//   return window.fetch(resource, config).then(async response => {
//     clearTimeout(timer_id);

//     if (replace_state && response.redirected) {
//       window.history.replaceState(null, "", response.url);
//     }

//     const accept = config.headers['Accept'];
//     let data = response

//     switch(accept) {
//       case "application/json": {
//         data = await response.json().catch(() => {});
//         break;
//       }
//       case "text/html": {
//         data = await response.text();
//         break;
//       }
//       default:
//         break;
//     }

//     if (!response.ok) {
//       return Promise.reject(data);
//     }

//     return data;
//   })
// }
