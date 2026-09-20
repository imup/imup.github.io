/* Service Worker —— 缓存静态资源，支持离线打开 */
var CACHE_NAME = "randomArt-v1";
var URLS_TO_CACHE = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./data/content.json",
  "./manifest.json",
  "./img/icon-192.png",
  "./img/icon-512.png",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(URLS_TO_CACHE).catch(function () {});
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.map(function (n) {
          if (n !== CACHE_NAME) return caches.delete(n);
        }),
      );
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (e) {
  /* 只缓存GET请求 */
  if (e.request.method !== "GET") return;
  /* 不缓存AI API请求 */
  var url = e.request.url;
  if (
    url.indexOf("api.openai.com") !== -1 ||
    url.indexOf("generativelanguage") !== -1 ||
    url.indexOf("api.deepseek") !== -1
  ) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (cached) {
      if (cached) return cached;
      return fetch(e.request)
        .then(function (res) {
          /* 只缓存同源200响应 */
          if (
            res &&
            res.status === 200 &&
            e.request.url.indexOf(location.origin) === 0
          ) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (c) {
              c.put(e.request, clone);
            });
          }
          return res;
        })
        .catch(function () {
          return cached;
        });
    }),
  );
});