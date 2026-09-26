var CACHE_VERSION = "v1";
var CACHE_NAME = "randomArt-" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/script.js",
  "./js/lib/codemirror.min.css",
  "./js/lib/duotone-light.min.css",
  "./js/lib/dracula.min.css",
  "./js/lib/codemirror.min.js",
  "./js/lib/javascript.min.js",
  "./js/lib/jszip.min.js",
  "./js/lib/p5.min.js",
  "./manifest.json",
  "./img/icon-192.png",
  "./img/icon-512.png",
  "./p5/sketch1.js",
  "./p5/sketch2.js",
  "./p5/sketch3.js",
];

var NETWORK_FIRST_PATHS = ["./data/content.json"];

function isNetworkFirst(url) {
  var path = url.pathname;
  return NETWORK_FIRST_PATHS.some(function (p) {
    return path.indexOf(p.replace("./", "")) !== -1;
  });
}

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(PRECACHE_URLS);
      })
      .then(function () {
        return self.skipWaiting();
      }),
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (names) {
        return Promise.all(
          names.map(function (n) {
            if (n !== CACHE_NAME) return caches.delete(n);
          }),
        );
      })
      .then(function () {
        return self.clients.claim();
      }),
  );
});

self.addEventListener("fetch", function (event) {
  var req = event.request;

  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  if (isNetworkFirst(url)) {
    event.respondWith(
      fetch(req)
        .then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(req, copy);
            });
          }
          return res;
        })
        .catch(function () {
          return caches.match(req);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req)
        .then(function (res) {
          if (!res || res.status !== 200 || res.type === "opaque") {
            return res;
          }
          var copy = res.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(req, copy);
          });
          return res;
        })
        .catch(function () {
          if (req.mode === "navigate") {
            return caches.match("./index.html");
          }
        });
    }),
  );
});