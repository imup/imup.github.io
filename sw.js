var CACHE_VERSION = "1.0";
var CACHE_NAME = "randomArt-v" + CACHE_VERSION;

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./src/css/style.css",
  "./src/data/content.json",

  // ESM模块（27个，缺一不可）
  "./src/main.js",
  "./src/router.js",
  "./src/sidebar.js",
  "./src/core/dom.js",
  "./src/core/nav.js",
  "./src/core/storage.js",
  "./src/core/i18n.js",
  "./src/core/modal.js",
  "./src/core/settings.js",
  "./src/core/theme.js",
  "./src/core/clipboard.js",
  "./src/core/page-html.js",
  "./src/core/download.js",
  "./src/state/pages-state.js",
  "./src/state/ai-state.js",
  "./src/state/gen-state.js",
  "./src/state/editor.js",
  "./src/state/runner.js",
  "./src/ai/providers.js",
  "./src/ai/tools.js",
  "./src/ai/model-menu.js",
  "./src/pages/home.js",
  "./src/pages/about.js",
  "./src/pages/generator.js",
  "./src/pages/ai.js",
  "./src/features/backup.js",
  "./src/features/settings-dialog.js",

  // 内置p5脚本
  "./p5/sketch1.js",
  "./p5/sketch2.js",
  "./p5/sketch3.js",

  // 图标
  "./img/icon-192.png",
  "./img/icon-512.png",

  // CDN
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/duotone-light.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/dracula.min.css",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/javascript/javascript.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.186.0/build/three.module.js"
];

var NETWORK_FIRST_PATHS = ["./src/data/content.json"];

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
      })
      .catch(function (err) {
        console.warn("[SW] 预缓存失败：", err);
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

  var url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

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
          if (res && (res.status === 200 || res.type === "opaque")) {
            var copy = res.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(req, copy);
            });
          }
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