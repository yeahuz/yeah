importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js'
);

const { cacheNames } = workbox.core;
const { registerRoute, Route, NavigationRoute, setCatchHandler } = workbox.routing;
const { enable: enable_navigation_preload } = workbox.navigationPreload;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst, Strategy } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { matchPrecache, precacheAndRoute, addPlugins, getCacheKeyForURL, precache, cleanupOutdatedCaches: cleanup_outdated_caches } = workbox.precaching;
const { strategy: compose_strategies } = workbox.streams;
const { googleFontsCache: google_fonts_cache, warmStrategyCache: warm_strategy_cache } = workbox.recipes;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

const GOOGLE_GSTATIC_REGEX = new RegExp('https://maps\\.gstatic\\.com.*');
const GOOGLE_APIS_REGEX = new RegExp('https://maps\\.googleapis\\.com.*');
const GLOBAL_VERSION = 1;
const CACHE_NAMES = Object.assign(workbox.core.cacheNames, {
  images: `images-${GLOBAL_VERSION}.1`,
  static_assets: `static_assets-${GLOBAL_VERSION}.1`,
  content: `content-${GLOBAL_VERSION}.1`,
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
  purgeOnQuotaError: true
});

const static_expiration_plugin = new ExpirationPlugin({
  maxEntries: 20,
  maxAgeSeconds: 31556926,
  purgeOnQuotaError: true
});

const partial_expiration_plugin = new ExpirationPlugin({
  maxEntries: 10,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true
});

const content_expiration_plugin = new ExpirationPlugin({
  maxEntries: 60,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true
});

const precache_expiration_plugin = new ExpirationPlugin({
  maxEntries: 10,
  maxAgeSeconds: 30 * 24 * 60 * 60,
  purgeOnQuotaError: true
});

const image_route = new Route(({ request, sameOrigin }) => {
  if (request.destination === "image" && !GOOGLE_APIS_REGEX.test(request.url) && !GOOGLE_GSTATIC_REGEX.test(request.url)) {
    return request.destination === "image"
  }
}, new StaleWhileRevalidate({
  cacheName: CACHE_NAMES.images,
  plugins: [image_expiration_plugin]
}));

const static_assets_route = new Route(({ request, sameOrigin }) => {
  return sameOrigin && ["script", "style"].includes(request.destination)
}, new CacheFirst({
  cacheName: CACHE_NAMES.static_assets,
  plugins: [static_expiration_plugin]
}));

const partial_strategy = new CacheFirst({
  cacheName: CACHE_NAMES.partials,
  plugins: [partial_expiration_plugin]
});

const content_strategy = new NetworkFirst({
  cacheName: CACHE_NAMES.content,
  plugins: [
    {
      requestWillFetch: ({ request }) => {
        const headers = new Headers();
        headers.append("X-Content-Mode", "partial");
        return new Request(request.url, {
          method: 'GET',
          headers,
          redirect: "follow"
        });
      },
      handlerDidError: async ({ request }) => {
        console.log("here");
        return await matchPrecache("/offile.html")
      }
    },
    content_expiration_plugin
  ]
});

const navigation_handler = compose_strategies([
  ({ event }) => partial_strategy.handle({ event, request: new Request("/partials/top.html") }),
  ({ event }) => content_strategy.handle(event),
  ({ event }) => partial_strategy.handle({ event, request: new Request("/partials/bottom.html") }),
]);

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((cache_keys) => {
    const valid_caches = new Set(Object.values(CACHE_NAMES));
    const to_delete = cache_keys.filter((key) => !valid_caches.has(key));
    return Promise.all(to_delete.map((name) => caches.delete(name)));
  }))
});

registerRoute(({ request }) => request.mode === "navigate", navigation_handler);
registerRoute(image_route);
registerRoute(static_assets_route);
warm_strategy_cache({ urls: ["/partials/top.html", "/partials/bottom.html"], strategy: partial_strategy })
enable_navigation_preload();
google_fonts_cache();
cleanup_outdated_caches();

self.addEventListener("message", async (e) => {
  const { type, payload } = e.data;
  switch(type) {
    case "refetch_partials":
      await partial_expiration_plugin.deleteCacheAndMetadata();
      break
    default:
      break;
  }
});
