importScripts("https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js");

workbox.setConfig({
  debug: false,
});

const { cacheNames } = workbox.core;
const { registerRoute, Route, setCatchHandler, setDefaultHandler } = workbox.routing;
const { enable: enable_navigation_preload } = workbox.navigationPreload;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst, Strategy } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const {
  matchPrecache,
  precacheAndRoute,
  precache,
  cleanupOutdatedCaches: cleanup_outdated_caches,
} = workbox.precaching;
const { strategy: compose_strategies } = workbox.streams;
const { googleFontsCache: google_fonts_cache, warmStrategyCache: warm_strategy_cache } =
  workbox.recipes;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

const GOOGLE_GSTATIC_REGEX = new RegExp("https://maps\\.gstatic\\.com.*");
const GOOGLE_APIS_REGEX = new RegExp("https://maps\\.googleapis\\.com.*");
const POSTING_WIZARD_REGEX = new RegExp("/postings/wizard/.*");
const SEARCH_ROUTE_REGEX = new RegExp("/search/?.*");
const AUTH_ROUTE_REGEX = new RegExp("/auth/(signup|login)");
const CHAT_ROUTE_REGEX = new RegExp("/chats/?.*");
const GLOBAL_VERSION = 20;
const CACHE_NAMES = Object.assign(workbox.core.cacheNames, {
  images: `images-${GLOBAL_VERSION}.1`,
  static_assets: `static_assets-${GLOBAL_VERSION}.6`,
  swr_content: `swr_content-${GLOBAL_VERSION}.1`,
  nf_content: `nf_content-${GLOBAL_VERSION}.1`,
  partials: `partials-${GLOBAL_VERSION}.1`,
  google_fonts_sheets: `google_fonts_stylesheets-${GLOBAL_VERSION}.1`,
  google_fonts_webfonts: `google_fonts_webfonts-${GLOBAL_VERSION}.1`,
  google_fonts_stylesheets: "google-fonts-stylesheets",
  google_fonts_webfonts: "google-fonts-webfonts",
});

self.__WB_DISABLE_DEV_LOGS = true;

const image_expiration_plugin = new ExpirationPlugin({
  maxEntries: 60,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true,
});

const static_expiration_plugin = new ExpirationPlugin({
  maxEntries: 20,
  maxAgeSeconds: 31556926,
  purgeOnQuotaError: true,
});

const partial_expiration_plugin = new ExpirationPlugin({
  maxEntries: 10,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true,
});

const content_expiration_plugin = new ExpirationPlugin({
  maxEntries: 60,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true,
});

const precache_expiration_plugin = new ExpirationPlugin({
  maxEntries: 10,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true,
});

const bg_sync_plugin = new BackgroundSyncPlugin({
  maxRetentionTime: 24 * 60,
});

const image_route = new Route(
  ({ request }) => {
    if (
      request.destination === "image" &&
      !GOOGLE_APIS_REGEX.test(request.url) &&
      !GOOGLE_GSTATIC_REGEX.test(request.url)
    ) {
      return request.destination === "image";
    }
  },
  new StaleWhileRevalidate({
    cacheName: CACHE_NAMES.images,
    plugins: [image_expiration_plugin],
  })
);

const static_assets_route = new Route(
  ({ request, sameOrigin }) => {
    return sameOrigin && ["script", "style"].includes(request.destination);
  },
  new CacheFirst({
    cacheName: CACHE_NAMES.static_assets,
    plugins: [static_expiration_plugin],
  })
);

const partial_strategy = new CacheFirst({
  cacheName: CACHE_NAMES.partials,
  plugins: [partial_expiration_plugin],
});

const swr_content_strategy = new StaleWhileRevalidate({
  cacheName: CACHE_NAMES.swr_content,
  plugins: [
    {
      requestWillFetch: ({ request }) => {
        const headers = new Headers();
        headers.append("X-Content-Mode", "partial");
        return new Request(request.url, {
          method: "GET",
          headers,
        });
      },
      handlerDidError: (err) => {
        return matchPrecache("/partials/offline.html");
      },
    },
    content_expiration_plugin,
    bg_sync_plugin,
    new CacheableResponsePlugin({
      statuses: [200],
    }),
  ],
});

const nf_content_strategy = new NetworkFirst({
  cacheName: CACHE_NAMES.nf_content,
  plugins: [
    {
      requestWillFetch: ({ request }) => {
        const headers = new Headers();
        headers.append("X-Content-Mode", "partial");
        return new Request(request.url, {
          method: "GET",
          headers,
        });
      },
      handlerDidError: () => {
        return matchPrecache("/partials/offline.html");
      },
    },
  ],
});

precacheAndRoute([
  {
    url: "/partials/offline.html",
    revision: GLOBAL_VERSION + 1,
  },
]);

const swr_content_handler = compose_strategies([
  async ({ event }) => {
    const url = new URL(event.request.url);
    if (url.searchParams.get("t")) {
      await partial_expiration_plugin.deleteCacheAndMetadata();
    }

    return partial_strategy.handle({
      event,
      request: new Request("/partials/top.html"),
    });
  },
  async ({ event }) => {
    const url = new URL(event.request.url);
    if (url.searchParams.get("t")) {
      const cache = await caches.open(CACHE_NAMES.swr_content);
      await cache.delete(url.pathname);
    }
    return swr_content_strategy.handle(event);
  },
  async ({ event }) => {
    const url = new URL(event.request.url);
    if (url.searchParams.get("t")) {
      await partial_expiration_plugin.deleteCacheAndMetadata();
    }
    return partial_strategy.handle({
      event,
      request: new Request("/partials/bottom.html"),
    });
  },
]);

const nf_content_handler = compose_strategies([
  async ({ event }) => {
    const url = new URL(event.request.url);
    if (url.searchParams.get("t")) {
      await partial_expiration_plugin.deleteCacheAndMetadata();
    }
    return partial_strategy.handle({
      event,
      request: new Request("/partials/top.html"),
    });
  },
  ({ event }) => nf_content_strategy.handle(event),
  async ({ event }) => {
    const url = new URL(event.request.url);
    if (url.searchParams.get("t")) {
      await partial_expiration_plugin.deleteCacheAndMetadata();
    }
    return partial_strategy.handle({
      event,
      request: new Request("/partials/bottom.html"),
    });
  },
]);

const swr_content_route = new Route(({ request, url }) => {
  if (url.pathname === "/postings/new") return;
  else if (url.pathname === "/auth/google") return;
  else if (SEARCH_ROUTE_REGEX.test(url.pathname)) return;
  return request.mode === "navigate";
}, swr_content_handler);

const nf_content_route = new Route(({ request, url }) => {
  if (url.pathname === "/postings/new") return;
  if (request.mode === "navigate") {
    return (
      POSTING_WIZARD_REGEX.test(url.pathname) ||
      AUTH_ROUTE_REGEX.test(url.pathname) ||
      CHAT_ROUTE_REGEX.test(url.pathname)
    );
  }
}, nf_content_handler);

// enable_navigation_preload();
google_fonts_cache();
cleanup_outdated_caches();
registerRoute(nf_content_route);
registerRoute(swr_content_route);
registerRoute(image_route);
registerRoute(static_assets_route);
warm_strategy_cache({
  urls: ["/partials/top.html", "/partials/bottom.html"],
  strategy: partial_strategy,
});

setCatchHandler(({ request }) => {
  if (request.destination === "document") {
    return matchPrecache("/partials/offline.html");
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cache_keys) => {
      const valid_caches = new Set(Object.values(CACHE_NAMES));
      const to_delete = cache_keys.filter((key) => !valid_caches.has(key));
      return Promise.all(to_delete.map((name) => caches.delete(name)));
    })
  );
});

self.addEventListener("message", async (event) => {
  const port = event.ports[0];
  const { type, payload } = event.data;
  switch (type) {
    case "expire_partials":
      await partial_expiration_plugin.deleteCacheAndMetadata();
      port.postMessage({ type, acknowledged: true });
      break;
    case "delete_content":
      const cache = await caches.open(CACHE_NAMES[payload.cache_name]);
      await cache.delete(payload.url);
      port.postMessage({ type, acknowledged: true });
      break;
    default:
      break;
  }
});
