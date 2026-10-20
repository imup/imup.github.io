/**
 * core/storage.js — IndexedDB 存储层（同步 API 不变）
 *
 * 设计：
 *   - 启动时 initStorage() 打开 IDB，全量读入内存 Map
 *   - 之后 storageGet / storageSet / storageRemove 保持同步（读写内存）
 *   - 写操作：同步改内存 + 异步落盘 IDB（fire-and-forget）
 *   - IDB 不可用时回退 localStorage（同步全量读入内存）
 *
 * 兼容：
 *   - p5_theme / p5_lang 双写 localStorage：
 *       index.html 首屏预闪脚本需要同步读 p5_theme
 *       i18n.js 自读 p5_lang（断开循环依赖）
 *   - 失败重试：iOS 内存压力下 IDB 连接可能被系统关闭，
 *     写入失败自动重连一次；仍失败则兜底写 localStorage
 */
import { showAlert } from "./modal.js";
import { T } from "./i18n.js";

/* ---------- 存储键常量（保持不变） ---------- */
export const STORAGE_KEY = "p5_pages";
export const THEME_KEY = "p5_theme";
export const LANG_KEY = "p5_lang";
export const DRAFT_KEY = "p5_gen_draft";
export const AI_KEY_STORAGE = "p5_ai_keys";
export const AI_CHAT_STORAGE = "p5_ai_chats";
export const AI_PROMPT_STORAGE = "p5_ai_prompts";
export const AI_CUSTOM_MODELS_STORAGE = "p5_ai_custom_models";
export const AI_CURRENT_MODEL_STORAGE = "p5_ai_current_model";
export const SETTINGS_KEY = "p5_settings";

/* ---------- 必须双写 localStorage 的键 ---------- */
const DUAL_WRITE_KEYS = new Set([THEME_KEY, LANG_KEY]);

/* ---------- IndexedDB 配置 ---------- */
const IDB_NAME = "randomArtDB";
const IDB_VERSION = 1;
const IDB_STORE = "kv";
const IDB_OPEN_TIMEOUT_MS = 3000;

/* ---------- 内存缓存 ---------- */
const _cache = new Map();
let _idb = null;
let _ready = false;
let _initPromise = null;

/* ============================================================
 * IndexedDB 底层
 * ========================================================== */
function _openIDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    let req;
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error("IDB open timeout"));
    }, IDB_OPEN_TIMEOUT_MS);

    try {
      req = indexedDB.open(IDB_NAME, IDB_VERSION);
    } catch (e) {
      clearTimeout(timer);
      settled = true;
      reject(e);
      return;
    }
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(req.result);
    };
    req.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(req.error || new Error("IDB open error"));
    };
    req.onblocked = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(new Error("IDB blocked"));
    };
  });
}

function _idbGetAll() {
  return new Promise((resolve, reject) => {
    if (!_idb) { reject(new Error("IDB not ready")); return; }
    let tx;
    try { tx = _idb.transaction(IDB_STORE, "readonly"); }
    catch (e) { reject(e); return; }
    const result = {};
    const req = tx.objectStore(IDB_STORE).openCursor();
    req.onsuccess = (e) => {
      const cursor = e.target.result;
      if (cursor) {
        result[cursor.key] = cursor.value;
        cursor.continue();
      } else {
        resolve(result);
      }
    };
    req.onerror = () => reject(req.error || new Error("IDB cursor error"));
  });
}

function _idbSet(key, value) {
  return new Promise((resolve, reject) => {
    if (!_idb) { reject(new Error("IDB not ready")); return; }
    let tx;
    try { tx = _idb.transaction(IDB_STORE, "readwrite"); }
    catch (e) { reject(e); return; }
    const req = tx.objectStore(IDB_STORE).put(value, key);
    req.onsuccess = () => {};
    req.onerror = () => reject(req.error || new Error("IDB set error"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB tx error"));
    tx.onabort = () => reject(tx.error || new Error("IDB tx aborted"));
  });
}

function _idbRemove(key) {
  return new Promise((resolve, reject) => {
    if (!_idb) { reject(new Error("IDB not ready")); return; }
    let tx;
    try { tx = _idb.transaction(IDB_STORE, "readwrite"); }
    catch (e) { reject(e); return; }
    const req = tx.objectStore(IDB_STORE).delete(key);
    req.onsuccess = () => {};
    req.onerror = () => reject(req.error || new Error("IDB delete error"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB tx error"));
    tx.onabort = () => reject(tx.error || new Error("IDB tx aborted"));
  });
}

/* ============================================================
 * localStorage 直通（保留供外部直接使用）
 * ========================================================== */
export function storageGetRaw(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    try { return JSON.parse(raw); } catch (e) { return raw; }
  } catch (e) {
    return fallback;
  }
}

export function storageSetRaw(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    return false;
  }
}

export function storageRemoveRaw(key) {
  try { localStorage.removeItem(key); } catch (e) {}
}

/* ============================================================
 * 初始化
 * ========================================================== */
export function initStorage() {
  if (_initPromise) return _initPromise;
  _initPromise = (async () => {
    try {
      _idb = await _openIDB();
      const all = await _idbGetAll();
      _cache.clear();
      Object.keys(all).forEach((k) => _cache.set(k, all[k]));
      _ready = true;
      _idb.onclose = () => {
        console.warn("[storage] IDB 连接被关闭，下次写入时重连");
        _idb = null;
        _ready = false;
      };
      console.log("[storage] IndexedDB 已就绪，加载 " + _cache.size + " 项");
    } catch (e) {
      console.warn("[storage] IDB 不可用，回退 localStorage：", e);
      _ready = false;
      _idb = null;
      _cache.clear();
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || k.indexOf("p5_") !== 0) continue;
          const raw = localStorage.getItem(k);
          if (raw == null) continue;
          try { _cache.set(k, JSON.parse(raw)); }
          catch (err) { _cache.set(k, raw); }
        }
        console.log("[storage] 回退模式，localStorage 加载 " + _cache.size + " 项");
      } catch (e2) {}
    }
  })();
  return _initPromise;
}

/* ============================================================
 * 业务 API（同步）
 * ========================================================== */
export function storageGet(key, fallback) {
  if (_cache.has(key)) return _cache.get(key);
  if (!_ready) {
    return storageGetRaw(key, fallback);
  }
  return fallback;
}

export function storageSet(key, value) {
  _cache.set(key, value);
  _persistSet(key, value);
  return true;
}

export function storageRemove(key) {
  _cache.delete(key);
  _persistRemove(key);
}

/* ============================================================
 * 内部：落盘
 * ========================================================== */
function _persistSet(key, value) {
  const needLocal = DUAL_WRITE_KEYS.has(key) || !_ready;
  if (needLocal) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      _handleQuotaError(e, key);
    }
  }
  if (_ready && _idb) {
    _idbSet(key, value).catch((e) => _retrySet(key, value, e));
  }
}

function _persistRemove(key) {
  const needLocal = DUAL_WRITE_KEYS.has(key) || !_ready;
  if (needLocal) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
  if (_ready && _idb) {
    _idbRemove(key).catch((e) => _retryRemove(key, e));
  }
}

/* ============================================================
 * 内部：失败重试（iOS 上 IDB 连接可能被系统关闭）
 * ========================================================== */
function _retrySet(key, value, firstErr) {
  console.warn("[storage] IDB 写入失败，尝试重连：" + key, firstErr);
  (async () => {
    try {
      _idb = await _openIDB();
      _ready = true;
      await _idbSet(key, value);
    } catch (e) {
      console.error("[storage] IDB 写入重试仍失败：" + key, e);
      try { localStorage.setItem(key, JSON.stringify(value)); }
      catch (e2) { _handleQuotaError(e2, key); }
    }
  })();
}

function _retryRemove(key, firstErr) {
  console.warn("[storage] IDB 删除失败，尝试重连：" + key, firstErr);
  (async () => {
    try {
      _idb = await _openIDB();
      _ready = true;
      await _idbRemove(key);
    } catch (e) {
      console.error("[storage] IDB 删除重试仍失败：" + key, e);
      try { localStorage.removeItem(key); } catch (e2) {}
    }
  })();
}

/* ============================================================
 * Quota / 诊断
 * ========================================================== */
export function isQuotaError(e) {
  if (!e) return false;
  if (e.name === "QuotaExceededError") return true;
  if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
  if (e.code === 22 || e.code === 1014) return true;
  return false;
}

const STORAGE_KB_MULTIPLIER = 2;

export function estimateStorageKB() {
  let total = 0;
  try {
    _cache.forEach(function (v, k) {
      total += k.length + JSON.stringify(v).length;
    });
  } catch (e) {
    return -1;
  }
  return Math.round((total * STORAGE_KB_MULTIPLIER) / 1024);
}

function _ctxForKey(key) {
  if (key === AI_KEY_STORAGE) return "storage.ctxKeys";
  if (key === AI_PROMPT_STORAGE) return "storage.ctxPrompts";
  if (key === AI_CUSTOM_MODELS_STORAGE) return "storage.ctxCustomModels";
  if (key === STORAGE_KEY) return "storage.ctxPages";
  if (key.indexOf(AI_CHAT_STORAGE) === 0) return "storage.ctxChats";
  return null;
}

function _handleQuotaError(e, key) {
  if (!isQuotaError(e)) {
    showAlert(T("storage.saveFailTitle"), String((e && e.message) || e || "?"), true);
    return;
  }
  const usedKB = estimateStorageKB();
  const usedText = usedKB >= 0 ? T("storage.used", { kb: usedKB }) : "";
  const ctx = _ctxForKey(key);
  showAlert(
    T("storage.fullTitle"),
    T("storage.fullBody", { context: ctx ? T(ctx) : "?", used: usedText }),
    true,
  );
}