/* ============================================================
   storage.js —— 存储层（localStorage）
   作用：统一存储层+AI存储+页面存储+存储配额
   机制：storageGet/Set/Remove封装JSON读写；设置独立存取
   加载：依赖core.js
   ============================================================ */
(function (App) {
  "use strict";


  /* ============================================================
     J5 存储封装+AI存储
     作用：统一存储层（localStorage后端）
     机制：storageGet/Set/Remove封装JSON读写；设置独立存取
     ============================================================ */
  /* 读取：解析失败返回原始字符串，键不存在返回 fallback */
  App.storageGet = function (key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      if (raw == null) return fallback;
      try {
        return JSON.parse(raw);
      } catch (e) {
        return raw;
      }
    } catch (e) {
      return fallback;
    }
  };
  /* 写入：配额错误统一处理 */
  App.storageSet = function (key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      App.handleStorageQuotaError(e, App._ctxForKey(key));
      return false;
    }
  };
  App.storageRemove = function (key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
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

  /* AI存储：Key/当前模型/对话/提示词/自定义模型 */
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
  /* 初始化 AI状态（启动时调用） */
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
     作用：作品列表+编辑器草稿
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
     作用：localStorage满时的统一检测与提示
     机制：捕获QuotaExceededError → 估算占用 → 弹窗建议清理
     ============================================================ */
  App.isQuotaError = function (e) {
    if (!e) return false;
    if (e.name === "QuotaExceededError") return true;
    if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
    if (e.code === 22 || e.code === 1014) return true;
    return false;
  };
  /* 估算：所有键值长度×2字节÷1024（KB） */
  App.estimateStorageKB = function () {
    var total = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        var v = localStorage.getItem(k) || "";
        total += k.length + v.length;
      }
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