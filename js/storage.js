/* ============================================================
   storage.js —— 存储层（B 版：IndexedDB 优先）
   作用：统一存储层 + AI 存储 + 页面存储 + 存储配额
   机制：IDB 优先 → localStorage 兜底 → 纯内存；
         启动时全量加载到 _storage.cache；读同步，写异步
   加载：依赖 core.js
   ============================================================ */
(function (App) {
  "use strict";


  /* ============================================================
     J5 存储核心 + AI 存储
     作用：统一存储层（IndexedDB 优先，localStorage / 内存兜底）
     机制：启动时全量加载到 _storage.cache；读同步，写异步
           写入失败回滚缓存；超时不污染缓存
     ============================================================ */
  /* 存储模式与缓存 */
  App._storage = {
    mode: "memory",
    db: null,
    cache: {},
  };

  /* 从 IndexedDB 全量读取 */
  App._idbGetAll = function () {
    return new Promise(function (resolve, reject) {
      try {
        var tx = App._storage.db.transaction(App.IDB_STORE, "readonly");
        var req = tx.objectStore(App.IDB_STORE).getAll();
        req.onsuccess = function () {
          resolve(req.result || []);
        };
        req.onerror = function () {
          reject(req.error);
        };
      } catch (e) {
        reject(e);
      }
    });
  };

  /* 初始化 IndexedDB：失败/超时回退 */
  App._idbInit = function () {
    return new Promise(function (resolve) {
      var done = false;
      function finish(mode) {
        if (done) return;
        done = true;
        resolve(mode);
      }
      var timer = setTimeout(function () {
        finish("ls");
      }, App.IDB_INIT_TIMEOUT_MS);
      try {
        var req = indexedDB.open(App.IDB_NAME, App.IDB_VERSION);
        req.onupgradeneeded = function (e) {
          var db = e.target.result;
          if (!db.objectStoreNames.contains(App.IDB_STORE)) {
            db.createObjectStore(App.IDB_STORE, { keyPath: "key" });
          }
        };
        req.onsuccess = function (e) {
          clearTimeout(timer);
          /* 已超时：关闭连接，放弃 IDB */
          if (done) {
            try {
              e.target.result.close();
            } catch (err) {}
            return;
          }
          App._storage.db = e.target.result;
          App._idbGetAll()
            .then(function (rows) {
              /* getAll 期间超时：清理连接，不污染缓存 */
              if (done) {
                try {
                  App._storage.db.close();
                } catch (err) {}
                App._storage.db = null;
                return;
              }
              rows.forEach(function (r) {
                if (r && r.key) App._storage.cache[r.key] = r.value;
              });
              finish("idb");
            })
            .catch(function () {
              if (!done) finish("ls");
            });
        };
        req.onerror = function () {
          clearTimeout(timer);
          finish("ls");
        };
        req.onblocked = function () {
          clearTimeout(timer);
          finish("ls");
        };
      } catch (e) {
        clearTimeout(timer);
        finish("ls");
      }
    });
  };

  /* 从 localStorage 预热缓存 */
  App._lsWarmup = function () {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k || k.indexOf("p5_") !== 0) continue;
        try {
          App._storage.cache[k] = JSON.parse(localStorage.getItem(k));
        } catch (e) {
          App._storage.cache[k] = localStorage.getItem(k);
        }
      }
    } catch (e) {}
  };

  /* 统一初始化：IDB → ls → memory */
  App.initStorage = function () {
    return App._idbInit().then(function (mode) {
      App._storage.mode = mode;
      if (mode === "ls") {
        App._lsWarmup();
        try {
          localStorage.setItem("__p5_probe__", "1");
          localStorage.removeItem("__p5_probe__");
        } catch (e) {
          App._storage.mode = "memory";
        }
      }
    });
  };

  /* 同步读 */
  App.storageGet = function (key, fallback) {
    if (Object.prototype.hasOwnProperty.call(App._storage.cache, key)) {
      return App._storage.cache[key];
    }
    return fallback;
  };

  /* 键 → 上下文（配额错误提示用） */
  App._ctxForKey = function (key) {
    if (key === App.AI_KEY_STORAGE) return "storage.ctxKeys";
    if (key === App.AI_PROMPT_STORAGE) return "storage.ctxPrompts";
    if (key === App.AI_CUSTOM_MODELS_STORAGE) return "storage.ctxCustomModels";
    if (key === App.STORAGE_KEY) return "storage.ctxPages";
    if (key.indexOf(App.AI_CHAT_STORAGE) === 0) return "storage.ctxChats";
    return null;
  };

  /* 异步写（失败回滚） */
  App.storageSet = function (key, value) {
    var hadKey = Object.prototype.hasOwnProperty.call(App._storage.cache, key);
    var oldValue = App._storage.cache[key];
    App._storage.cache[key] = value;

    function rollback() {
      if (hadKey) App._storage.cache[key] = oldValue;
      else delete App._storage.cache[key];
    }

    if (App._storage.mode === "idb" && App._storage.db) {
      try {
        var tx = App._storage.db.transaction(App.IDB_STORE, "readwrite");
        tx.objectStore(App.IDB_STORE).put({ key: key, value: value });
        tx.onerror = function () {
          rollback();
          App.handleStorageQuotaError(tx.error, App._ctxForKey(key));
        };
        tx.onabort = tx.onerror;
      } catch (e) {
        rollback();
        App.handleStorageQuotaError(e, App._ctxForKey(key));
        return false;
      }
      return true;
    }
    if (App._storage.mode === "ls") {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        rollback();
        App.handleStorageQuotaError(e, App._ctxForKey(key));
        return false;
      }
    }
    return true;
  };

  App.storageRemove = function (key) {
    delete App._storage.cache[key];
    if (App._storage.mode === "idb" && App._storage.db) {
      try {
        var tx = App._storage.db.transaction(App.IDB_STORE, "readwrite");
        tx.objectStore(App.IDB_STORE).delete(key);
      } catch (e) {}
    } else if (App._storage.mode === "ls") {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    }
  };

  /* 应用设置：覆盖运行时参数 */
  App._applySettings = function (s) {
    if (!s || typeof s !== "object") return;
    if (typeof s.maxImageMB === "number")
      App.settings.MAX_IMAGE_BYTES = s.maxImageMB * 1024 * 1024;
    if (typeof s.maxToolLoop === "number")
      App.settings.MAX_TOOL_LOOP = s.maxToolLoop;
    if (typeof s.maxContext === "number")
      App.settings.MAX_CONTEXT_MESSAGES = s.maxContext;
    if (typeof s.requestTimeoutSec === "number")
      App.settings.REQUEST_TIMEOUT_MS = s.requestTimeoutSec * 1000;
    if (typeof s.maxTitleLen === "number")
      App.settings.MAX_TITLE_LEN = s.maxTitleLen;
  };
  App.loadSettings = function () {
    var v = App.storageGet(App.SETTINGS_KEY, null);
    if (v && typeof v === "object") App._applySettings(v);
  };
  App.saveSettings = function (obj) {
    App.storageSet(App.SETTINGS_KEY, obj);
    App._applySettings(obj);
  };

  /* AI 存储：Key / 当前模型 / 对话 / 提示词 / 自定义模型 */
  App.loadAIKeys = function () {
    var v = App.storageGet(App.AI_KEY_STORAGE, {});
    return v && typeof v === "object" ? v : {};
  };
  App.saveAIKeys = function () {
    return App.storageSet(App.AI_KEY_STORAGE, App.aiState.keys);
  };
  App.loadCurrentModel = function () {
    var v = App.storageGet(App.AI_CURRENT_MODEL_STORAGE, null);
    return typeof v === "string" ? v : null;
  };
  App.saveCurrentModel = function (id) {
    if (id) App.storageSet(App.AI_CURRENT_MODEL_STORAGE, id);
    else App.storageRemove(App.AI_CURRENT_MODEL_STORAGE);
  };
  App.loadAIChats = function () {
    var result = {};
    App.getAllModels().forEach(function (m) {
      var v = App.storageGet(App.AI_CHAT_STORAGE + "_" + m.id, []);
      result[m.id] = Array.isArray(v) ? v : [];
    });
    return result;
  };
  App.saveAIChats = function (modelId) {
    if (!modelId) return true;
    return App.storageSet(
      App.AI_CHAT_STORAGE + "_" + modelId,
      App.aiState.chats[modelId] || [],
    );
  };
  App.loadAIPrompts = function () {
    var v = App.storageGet(App.AI_PROMPT_STORAGE, {});
    return v && typeof v === "object" ? v : {};
  };
  App.saveAIPrompts = function () {
    return App.storageSet(App.AI_PROMPT_STORAGE, App.aiState.prompts);
  };
  App.loadCustomModels = function () {
    var v = App.storageGet(App.AI_CUSTOM_MODELS_STORAGE, []);
    return Array.isArray(v) ? v : [];
  };
  App.saveCustomModels = function () {
    return App.storageSet(
      App.AI_CUSTOM_MODELS_STORAGE,
      App.aiState.customModels || [],
    );
  };
  /* 初始化 AI 状态（启动时调用） */
  App.initAIState = function () {
    App.aiState.keys = App.loadAIKeys();
    App.aiState.customModels = App.loadCustomModels();
    App.aiState.chats = App.loadAIChats();
    App.aiState.prompts = App.loadAIPrompts();
    App.getAllModels().forEach(function (m) {
      if (!Array.isArray(App.aiState.chats[m.id])) App.aiState.chats[m.id] = [];
      if (typeof App.aiState.prompts[m.id] !== "string")
        App.aiState.prompts[m.id] = "";
    });
    var saved = App.loadCurrentModel();
    App.aiState.currentModel =
      saved && App.aiModelConf(saved) ? saved : null;
  };


  /* ============================================================
     J6 页面与草稿存储
     作用：作品列表 + 编辑器草稿
     ============================================================ */
  App.getPages = function () {
    var v = App.storageGet(App.STORAGE_KEY, []);
    return Array.isArray(v) ? v : [];
  };
  App.savePages = function (pages) {
    return App.storageSet(App.STORAGE_KEY, pages);
  };
  App.loadDraft = function () {
    var o = App.storageGet(App.DRAFT_KEY, null);
    if (o && typeof o === "object") {
      return {
        title: typeof o.title === "string" ? o.title : "",
        script: typeof o.script === "string" ? o.script : "",
      };
    }
    return { title: "", script: "" };
  };
  App.saveDraft = function () {
    App.storageSet(App.DRAFT_KEY, App.state.generatorDraft);
  };
  App.clearDraft = function () {
    App.state.generatorDraft = { title: "", script: "" };
    App.storageRemove(App.DRAFT_KEY);
  };


  /* ============================================================
     J7 存储配额
     作用：存储满时的统一检测与提示
     ============================================================ */
  App.isQuotaError = function (e) {
    if (!e) return false;
    if (e.name === "QuotaExceededError") return true;
    if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
    if (e.code === 22 || e.code === 1014) return true;
    return false;
  };
  /* 估算：所有缓存键值长度 × 2 字节 ÷ 1024 */
  App.estimateStorageKB = function () {
    var total = 0;
    try {
      Object.keys(App._storage.cache).forEach(function (k) {
        var v = App._storage.cache[k];
        var s = typeof v === "string" ? v : JSON.stringify(v);
        total += k.length + (s ? s.length : 0);
      });
    } catch (e) {
      return -1;
    }
    return Math.round((total * App.STORAGE_KB_MULTIPLIER) / 1024);
  };
  App.handleStorageQuotaError = function (e, contextKey) {
    if (!App.isQuotaError(e)) {
      App.showAlert(
        App.T("storage.saveFailTitle"),
        String((e && e.message) || e || "?"),
        true,
      );
      return;
    }
    var usedKB = App.estimateStorageKB();
    var usedText = usedKB >= 0 ? App.T("storage.used", { kb: usedKB }) : "";
    App.showAlert(
      App.T("storage.fullTitle"),
      App.T("storage.fullBody", {
        context: contextKey ? App.T(contextKey) : "?",
        used: usedText,
      }),
      true,
    );
  };

})(window.App);