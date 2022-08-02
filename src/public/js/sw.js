importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
);

const { registerRoute, Route, NavigationRoute } = workbox.routing;
const { enable: enable_navigation_preload } = workbox.navigationPreload;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;

enable_navigation_preload();

const image_route = new Route(({ request, sameOrigin }) => {
  return request.destination === "image"
}, new StaleWhileRevalidate({
  cacheName: "images",
  plugins: [
    new ExpirationPlugin({
      maxEntries: 60,
      maxAgeSeconds: 30 * 24 * 60 * 60
    })
  ]
}));

const static_assets_route = new Route(({ request, sameOrigin }) => {
  return sameOrigin && ["script", "style", "font"].includes(request.destination)
}, new StaleWhileRevalidate({
  cacheName: "static-assets",
  plugins: [
    new ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 31556926
    })
  ]
}));

const navigation_route = new NavigationRoute(new NetworkFirst({
  cacheName: "navigations",
  networkTimeoutSeconds: 5,
  plugins: [
    new ExpirationPlugin({
      maxEntries: 20,
      maxAgeSeconds: 30 * 24 * 60 * 60
    })
  ]
}));

registerRoute(image_route);
registerRoute(navigation_route);
registerRoute(static_assets_route);
