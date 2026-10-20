/** main.js — 应用入口（无构建，纯 ESM） */
import { $, $$ } from "./core/dom.js";
import { detectLang, setLang, setI18nData, applyI18nToStatic } from "./core/i18n.js";
import { applyTheme } from "./core/theme.js";
import { loadSettings, setSettingsFromContent } from "./core/settings.js";
import { storageGet, THEME_KEY, initStorage } from "./core/storage.js";
import { initModal, closeModal, isModalOpen } from "./core/modal.js";
import { getRoute, onRouteChange } from "./core/nav.js";
import { setAI_MODELS, initAIState } from "./state/ai-state.js";
import { runner, setRandom } from "./state/runner.js";
import { refreshEditor } from "./state/editor.js";
import {
  bindSidebar, updateSidebarPages, closeSidebar, isSidebarOpen,
} from "./sidebar.js";
import { render } from "./router.js";

/** ⚠️ 按你实际 json 路径 */
const CONTENT_URL = "src/data/content.json";

/**
 * iOS Safari 的 fetch 有时会永久挂起（不 resolve 不 reject）。
 * 加 5 秒超时兜底：即使 fetch 挂死，5 秒后走 catch → boot() 降级启动。
 */
const CONTENT_TIMEOUT_MS = 5000;

function initGlobalGuards() {
  ["gesturestart", "gesturechange", "gestureend"].forEach((type) => {
    document.addEventListener(type, (e) => e.preventDefault(), { passive: false });
  });

  // 锁定主文档双指/多指缩放（原代码逻辑）。
  // preventDefault 只阻止浏览器默认行为，不影响 iframe 内部 three 注册的触摸事件。
  document.addEventListener("touchstart", (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });
  document.addEventListener("touchmove", (e) => {
    if (e.touches && e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  let lastTouchEnd = 0;
  document.addEventListener("touchend", (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : "";
      if (tag !== "input" && tag !== "textarea" && tag !== "button" && tag !== "select" && tag !== "a") {
        e.preventDefault();
      }
    }
    lastTouchEnd = now;
  }, { passive: false });

  document.addEventListener("pointerdown", (e) => {
    const aiMenu = $("#aiModelMenu");
    if (aiMenu && aiMenu.classList.contains("show")) {
      const picker = aiMenu.parentNode;
      if (picker && !picker.contains(e.target)) aiMenu.classList.remove("show");
    }
    const genMenu = $("#genModelMenu");
    if (genMenu && genMenu.classList.contains("show")) {
      const gPicker = genMenu.parentNode;
      if (gPicker && !gPicker.contains(e.target)) genMenu.classList.remove("show");
    }
    if (!e.target.closest(".ai-msg")) {
      $$(".ai-msg.actions-visible").forEach((el) => el.classList.remove("actions-visible"));
    }
  });

  document.addEventListener("pointerdown", (e) => {
    const t = e.target;
    if (!t || !t.closest) return;
    if (t.closest("input, textarea, select, [contenteditable]")) return;
    if (t.closest(".CodeMirror")) return;
    if (t.closest(".ai-model-picker")) return;
    if (t.closest(".modal-backdrop")) return;
    if (t.closest("button")) return;
    const active = document.activeElement;
    if (!active) return;
    const tag = active.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || active.isContentEditable) active.blur();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (isModalOpen()) closeModal();
    else if (isSidebarOpen()) closeSidebar();
    else if (runner.mode === "page" && getRoute() === "/") setRandom();
  });

  window.addEventListener("orientationchange", () => refreshEditor());

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    const appEl = $("#app");
    if (appEl && appEl.classList.contains("preview-mode")) {
      appEl.style.width = window.innerWidth + "px";
      appEl.style.height = window.innerHeight + "px";
    }
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeTimer = null; refreshEditor(); }, 100);
  });
}

/**
 * iOS Safari 键盘避让：
 * 键盘弹起时不 resize layout viewport，而是 scroll 页面，
 * 导致固定输入区被遮挡、汉堡/清除按钮被推出视口。
 * 用 visualViewport 拿可视高度，动态收缩 .ai-page 到可视区域。
 */
function initKeyboardAvoidance() {
  if (!window.visualViewport) return;
  const vv = window.visualViewport;
  let rafId = null;

  function update() {
    const aiPage = document.querySelector(".ai-page");
    if (!aiPage) {
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.classList.remove("keyboard-open");
      return;
    }
    const layoutHeight = window.innerHeight;
    const visualHeight = vv.height;
    const offsetTop = vv.offsetTop || 0;
    const keyboardHeight = layoutHeight - visualHeight - offsetTop;

    if (keyboardHeight > 100) {
      // 键盘弹起
      document.documentElement.style.setProperty("--vvh", visualHeight + "px");
      document.documentElement.classList.add("keyboard-open");
      // 阻止 iOS 自动 scroll 页面（否则汉堡/清除按钮被推走）
      if (window.scrollY !== 0) window.scrollTo(0, 0);
      // 消息区滚到底部，保证最新消息可见
      const box = document.querySelector("#aiMessages");
      if (box) box.scrollTop = box.scrollHeight;
    } else {
      // 键盘收起
      document.documentElement.style.removeProperty("--vvh");
      document.documentElement.classList.remove("keyboard-open");
    }
  }

  function schedule() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(update);
  }

  vv.addEventListener("resize", schedule);
  vv.addEventListener("scroll", schedule);

  // 输入框聚焦时也触发一次（部分 iOS 版本 focus 后才会更新 visualViewport）
  document.addEventListener("focusin", (e) => {
    const t = e.target;
    if (t && (t.tagName === "TEXTAREA" || t.tagName === "INPUT")) schedule();
  });
}

function loadContent() {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error("content load timeout")), CONTENT_TIMEOUT_MS);
  });
  return Promise.race([
    fetch(CONTENT_URL, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    }),
    timeoutPromise,
  ]).then((json) => {
    const content = json || {};
    setI18nData(content.i18n || {}, content.defaultLang);
    setAI_MODELS(content.models || []);
    setSettingsFromContent(content.settings);
  });
}

function boot() {
  initModal();
  bindSidebar();
  initGlobalGuards();
  initKeyboardAvoidance();

  applyTheme(storageGet(THEME_KEY, "light"));
  loadSettings();
  setLang(detectLang());
  initAIState();
  applyI18nToStatic();
  updateSidebarPages();

  onRouteChange(render);
  render();
}

// ============================================================
// 启动链：存储初始化 → 内容加载 → boot
// ============================================================
(async function start() {
  try {
    await initStorage();
  } catch (e) {
    console.warn("[storage] 初始化失败，使用 localStorage 兜底：", e);
  }

  try {
    await loadContent();
  } catch (e) {
    console.warn("[content] 加载失败或超时，降级启动：", e);
  }

  boot();
})();