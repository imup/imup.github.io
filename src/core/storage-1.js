/**
 * core/storage.js — 存储层
 *
 * 架构：
 *   initStorage()  启动时打开 IDB、迁移 localStorage、全量读入内存缓存
 *   storageGet     同步读内存（永不阻塞）
 *   storageSet     同步写内存 + 异步写 IDB（后台落盘，失败回退 localStorage）
 *   storageRemove  同步删内存 + 异步删 IDB
 *
 * 兼容：
 *   - p5_theme / p5_lang 双写 localStorage（预闪脚本、i18n.js 需要同步读）
 *   - IDB 不可用时回退 localStorage 全量模式
 *   - 失败时最后兜底写 localStorage，保证数据不丢
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

/* ---------- 必须双写到 localStorage 的键 ---------- */
const DUAL_WRITE_KEYS = new Set([THEME_KEY, LANG_KEY]);

/* ---------- IndexedDB 配置 ---------- */
const IDB_NAME = "randomArtDB";
const IDB_VERSION = 1;
const IDB_STORE = "kv";
const MIGRATION_FLAG = "__idb_migrated__";
const IDB_OPEN_TIMEOUT_MS = 3000;

/* ---------- 内存缓存（同步读写源） ---------- */
const _cache = new Map();
let _idb = null;
let _idbReady = false;
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

function _idbGet(key) {
  return new Promise((resolve, reject) => {
    if (!_idb) { reject(new Error("IDB not ready")); return; }
    let tx;
    try { tx = _idb.transaction(IDB_STORE, "readonly"); }
    catch (e) { reject(e); return; }
    const req = tx.objectStore(IDB_STORE).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IDB get error"));
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
    req.onerror = () => reject(req.error || new Error("IDB remove error"));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error("IDB tx error"));
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

/* ============================================================
 * localStorage 直通（raw 层）
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
    // 1. 尝试打开 IDB
    try {
      _idb = await _openIDB();
      _idbReady = true;
    } catch (e) {
      console.warn("[storage] IndexedDB 不可用，回退 localStorage：", e);
      _idbReady = false;
      _cache.clear();
      _readAllLocalStorageToCache();
      return;
    }

    // 2. 检测迁移标记
    let migrated = null;
    try { migrated = await _idbGet(MIGRATION_FLAG); } catch (e) {}

    // 3. 首次迁移
    if (!migrated) {
      const localData = _readLocalStorageP5Keys();
      const keys = Object.keys(localData);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        try { await _idbSet(k, localData[k]); }
        catch (e) { console.warn("[storage] 迁移失败：" + k, e); }
      }
      try {
        await _idbSet(MIGRATION_FLAG, { at: Date.now(), count: keys.length });
      } catch (e) {}
      if (keys.length > 0) {
        console.log("[storage] 已迁移 " + keys.length + " 项到 IndexedDB");
      }
    }

    // 4. 全量读 IDB 到内存缓存
    try {
      const all = await _idbGetAll();
      _cache.clear();
      Object.keys(all).forEach((k) => {
        if (k === MIGRATION_FLAG) return;
        _cache.set(k, all[k]);
      });
    } catch (e) {
      console.warn("[storage] IDB 全量读取失败，回退 localStorage：", e);
      _cache.clear();
      _readAllLocalStorageToCache();
    }

    // 5. IDB 连接被关闭时（iOS 内存压力）自动标记重连
    _idb.onclose = () => {
      console.warn("[storage] IDB 连接被关闭，下次写入时重连");
      _idb = null;
      _idbReady = false;
    };
  })();
  return _initPromise;
}

/* ============================================================
 * 内部：读取 localStorage 中所有 p5_* 数据
 * ========================================================== */
function _readLocalStorageP5Keys() {
  const result = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.indexOf("p5_") !== 0) continue;
      if (k === MIGRATION_FLAG) continue;
      const raw = localStorage.getItem(k);
      if (raw == null) continue;
      try { result[k] = JSON.parse(raw); }
      catch (e) { result[k] = raw; }
    }
  } catch (e) {}
  return result;
}

function _readAllLocalStorageToCache() {
  const data = _readLocalStorageP5Keys();
  Object.keys(data).forEach((k) => _cache.set(k, data[k]));
}

/* ============================================================
 * 业务 API（同步签名不变）
 * ========================================================== */
export function storageGet(key, fallback) {
  if (_cache.has(key)) return _cache.get(key);
  // 缓存未命中时：IDB 模式数据已在启动时全量加载，不存在即为无；
  // 若 IDB 未就绪（初始化中或已回退），走 localStorage 兜底。
  if (!_idbReady) {
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
 * 内部：异步落盘
 * ========================================================== */
function _persistSet(key, value) {
  // 双写键或 IDB 不可用：写 localStorage
  if (DUAL_WRITE_KEYS.has(key) || !_idbReady) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      _handleQuotaError(e, key);
    }
  }
  // IDB 写入
  if (_idbReady && _idb) {
    _retryOnce(function () { return _idbSet(key, value); }, "set", key, value);
  }
}

function _persistRemove(key) {
  if (DUAL_WRITE_KEYS.has(key) || !_idbReady) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
  if (_idbReady && _idb) {
    _retryOnce(function () { return _idbRemove(key); }, "remove", key, null);
  }
}

/* ============================================================
 * 内部：失败重试（iOS 上 IDB 连接可能被关闭）
 * ========================================================== */
function _retryOnce(fn, op, key, value) {
  fn().catch(function (e) {
    console.warn("[storage] " + op + " 失败，重试：" + key, e);
    (async function () {
      try {
        _idb = await _openIDB();
        _idbReady = true;
        await fn();
        return;
      } catch (e2) {
        console.error("[storage] 重试仍失败：" + op + " " + key, e2);
      }
      // 最后兜底：写 localStorage（保证数据不丢）
      try {
        if (op === "set") {
          localStorage.setItem(key, JSON.stringify(value));
        } else if (op === "remove") {
          localStorage.removeItem(key);
        }
      } catch (e3) {}
    })();
  });
}

/* ============================================================
 * 诊断与 quota 处理
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
  // 基于内存缓存估算（同步），IDB 模式与回退模式都适用
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