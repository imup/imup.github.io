/* randomArt可视化创意编程 */
(function () {
  "use strict";

  /* 常量 */

  var STORAGE_KEY = "p5_pages";
  var THEME_KEY = "p5_theme";
  var LANG_KEY = "p5_lang";
  var MAX_IMAGE_BYTES = 1.5 * 1024 * 1024;

  var P5_DIR = "p5/";
  var P5_CDN =
    "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js";
  var P5_FILES = ["sketch1.js", "sketch2.js", "sketch3.js"];

  var AI_KEY_STORAGE = "p5_ai_keys";
  var AI_CHAT_STORAGE = "p5_ai_chats";
  var AI_PROMPT_STORAGE = "p5_ai_prompts";
  var AI_CUSTOM_MODELS_STORAGE = "p5_ai_custom_models";

  var MAX_CONTEXT_MESSAGES = 30;

  var CONTENT_URL = "data/content.json";

  /* 运行时状态 */

  var AI_MODELS = [];
  var I18N = {};
  var LANG = "zh";
  var CONTENT = null;

  var aiState = {
    currentModel: null,
    keys: {},
    chats: {},
    prompts: {},
    customModels: [],
    busy: false,
    abortController: null,
    streamToken: 0,
  };

  var modalBackdrop, modalBox, lastFocused;
  var sidebarPagesEl, sidebarEl, overlayEl, hamburgerBtn;
  var sidebarSearchEl;
  var sidebarSearchKeyword = "";
  var appEl;

  var runner = { mode: "random", pageId: null };
  var currentRandomFile = null;

  var editor = null;
  var uploadedImageDataUrl = null;
  var generatorDraft = { title: "", script: "" };
  var renderedMsgCount = 0;
  var renderedModelId = null;

  /* i18n */

  function T(key, params) {
    var pack = I18N[LANG] || I18N.zh || {};
    var text = pack[key];
    if (text == null) text = (I18N.zh && I18N.zh[key]) || key;
    if (params) {
      text = String(text).replace(/\{(\w+)\}/g, function (m, k) {
        return params[k] != null ? String(params[k]) : m;
      });
    }
    return text;
  }

  function detectLang() {
    try {
      var saved = localStorage.getItem(LANG_KEY);
      if (saved && I18N[saved]) return saved;
    } catch (e) {}
    var nav = (navigator.language || "zh").toLowerCase();
    if (nav.indexOf("zh") === 0) return "zh";
    return "en";
  }

  function applyI18nToStatic() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      el.textContent = T(key);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-placeholder");
      el.setAttribute("placeholder", T(key));
      el.setAttribute("aria-label", T(key));
    });
    document.querySelectorAll("[data-i18n-title]").forEach(function (el) {
      var key = el.getAttribute("data-i18n-title");
      el.setAttribute("title", T(key));
    });
    try {
      document.title = T("site.title");
      document.documentElement.lang = LANG === "zh" ? "zh-CN" : "en";
    } catch (e) {}
  }

  /* 模型访问 */

  function getAllModels() {
    return AI_MODELS.concat(aiState.customModels || []);
  }

  function aiModelConf(id) {
    var all = getAllModels();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) return all[i];
    }
    return null;
  }

  function aiModelName(id) {
    var c = aiModelConf(id);
    return c ? c.name : id;
  }

  /* localStorage */

  function loadAIKeys() {
    try {
      var raw = localStorage.getItem(AI_KEY_STORAGE);
      var o = raw ? JSON.parse(raw) : {};
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }
  function saveAIKeys() {
    try {
      localStorage.setItem(AI_KEY_STORAGE, JSON.stringify(aiState.keys));
      return true;
    } catch (e) {
      handleStorageQuotaError(e, "storage.ctxKeys");
      return false;
    }
  }

  function loadAIChats() {
    var result = {};
    getAllModels().forEach(function (m) {
      try {
        var raw = localStorage.getItem(AI_CHAT_STORAGE + "_" + m.id);
        var v = raw ? JSON.parse(raw) : [];
        result[m.id] = Array.isArray(v) ? v : [];
      } catch (e) {
        result[m.id] = [];
      }
    });
    try {
      var oldRaw = localStorage.getItem(AI_CHAT_STORAGE);
      if (oldRaw) {
        var old = JSON.parse(oldRaw);
        if (old && typeof old === "object") {
          getAllModels().forEach(function (m) {
            if (
              Array.isArray(old[m.id]) &&
              old[m.id].length &&
              (!result[m.id] || !result[m.id].length)
            ) {
              result[m.id] = old[m.id];
              try {
                localStorage.setItem(
                  AI_CHAT_STORAGE + "_" + m.id,
                  JSON.stringify(old[m.id]),
                );
              } catch (e) {}
            }
          });
        }
        localStorage.removeItem(AI_CHAT_STORAGE);
      }
    } catch (e) {}
    return result;
  }

  function saveAIChats(modelId) {
    if (!modelId) {
      var ok = true;
      getAllModels().forEach(function (m) {
        try {
          localStorage.setItem(
            AI_CHAT_STORAGE + "_" + m.id,
            JSON.stringify(aiState.chats[m.id] || []),
          );
        } catch (e) {
          handleStorageQuotaError(e, "storage.ctxChats");
          ok = false;
        }
      });
      return ok;
    }
    try {
      localStorage.setItem(
        AI_CHAT_STORAGE + "_" + modelId,
        JSON.stringify(aiState.chats[modelId] || []),
      );
      return true;
    } catch (e) {
      handleStorageQuotaError(e, "storage.ctxChats");
      return false;
    }
  }

  function loadAIPrompts() {
    try {
      var raw = localStorage.getItem(AI_PROMPT_STORAGE);
      var o = raw ? JSON.parse(raw) : {};
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }
  function saveAIPrompts() {
    try {
      localStorage.setItem(
        AI_PROMPT_STORAGE,
        JSON.stringify(aiState.prompts),
      );
      return true;
    } catch (e) {
      handleStorageQuotaError(e, "storage.ctxPrompts");
      return false;
    }
  }

  function loadCustomModels() {
    try {
      var raw = localStorage.getItem(AI_CUSTOM_MODELS_STORAGE);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function saveCustomModels() {
    try {
      localStorage.setItem(
        AI_CUSTOM_MODELS_STORAGE,
        JSON.stringify(aiState.customModels || []),
      );
      return true;
    } catch (e) {
      handleStorageQuotaError(e, "storage.ctxCustomModels");
      return false;
    }
  }

  function getPages() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var list = raw ? JSON.parse(raw) : [];
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  }
  function savePages(pages) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pages));
      return true;
    } catch (e) {
      handleStorageQuotaError(e, "storage.ctxPages");
      return false;
    }
  }

  function initAIState() {
    aiState.keys = loadAIKeys();
    aiState.customModels = loadCustomModels();
    aiState.chats = loadAIChats();
    aiState.prompts = loadAIPrompts();
    getAllModels().forEach(function (m) {
      if (!Array.isArray(aiState.chats[m.id])) aiState.chats[m.id] = [];
      if (typeof aiState.prompts[m.id] !== "string") aiState.prompts[m.id] = "";
    });
    aiState.currentModel = null;
  }

  /* 存储超限 */

  function isQuotaError(e) {
    if (!e) return false;
    if (e.name === "QuotaExceededError") return true;
    if (e.name === "NS_ERROR_DOM_QUOTA_REACHED") return true;
    if (e.code === 22 || e.code === 1014) return true;
    return false;
  }

  function estimateLocalStorageKB() {
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
    return Math.round((total * 2) / 1024);
  }

  function handleStorageQuotaError(e, contextKey) {
    if (!isQuotaError(e)) {
      showAlert(
        T("storage.saveFailTitle"),
        String((e && e.message) || e || "?"),
        true,
      );
      return;
    }
    var usedKB = estimateLocalStorageKB();
    var usedText = usedKB >= 0 ? T("storage.used", { kb: usedKB }) : "";
    showAlert(
      T("storage.fullTitle"),
      T("storage.fullBody", {
        context: contextKey ? T(contextKey) : "?",
        used: usedText,
      }),
      true,
    );
  }

  /* 通用工具 */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $$(sel, root) {
    return Array.prototype.slice.call(
      (root || document).querySelectorAll(sel),
    );
  }
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }
  function escapeScriptClose(str) {
    var LT = "\x3C";
    return String(str)
      .replace(new RegExp(LT + "/script", "gi"), LT + "\\/script")
      .replace(new RegExp(LT + "!--", "g"), LT + "\\!--")
      .replace(new RegExp(LT + "script", "gi"), LT + "\\script");
  }
  function safeFileName(name) {
    var n = String(name || "")
      .replace(/[\\/:*?"<>|]/g, "_")
      .trim();
    return n || "untitled";
  }

  /* DOM 小工厂 */

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function rightGroup() {
    return el("div", "right-group");
  }

  /* 弹窗 */

  function openModal(builder) {
    lastFocused = document.activeElement;
    modalBox.innerHTML = "";
    builder(modalBox);
    modalBackdrop.classList.add("show");
    var f = $("input, textarea, button", modalBox);
    if (f && f.focus) f.focus();
  }
  function closeModal() {
    modalBackdrop.classList.remove("show");
    modalBox.innerHTML = "";
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function showAlert(title, message, isError) {
    openModal(function (box) {
      box.appendChild(el("h3", null, title));
      box.appendChild(el("p", null, message));
      var a = el("div", "modal-actions");
      var rg = rightGroup();
      var ok = el("button", isError ? "danger" : null, T("common.know"));
      ok.addEventListener("click", closeModal);
      rg.appendChild(ok);
      a.appendChild(rg);
      box.appendChild(a);
    });
  }

  function showConfirm(title, message, onConfirm, danger) {
    openModal(function (box) {
      box.appendChild(el("h3", null, title));
      box.appendChild(el("p", null, message));
      var a = el("div", "modal-actions");
      var rg = rightGroup();
      var cancel = el("button", "cancel", T("common.cancel"));
      cancel.addEventListener("click", closeModal);
      var ok = el("button", danger ? "danger" : null, T("common.ok"));
      ok.addEventListener("click", function () {
        closeModal();
        onConfirm();
      });
      rg.appendChild(cancel);
      rg.appendChild(ok);
      a.appendChild(rg);
      box.appendChild(a);
    });
  }

  function showPrompt(title, defaultValue, onOk, inputType) {
    openModal(function (box) {
      box.appendChild(el("h3", null, title));
      var input = document.createElement("input");
      input.type = inputType || "text";
      input.value = defaultValue || "";
      input.autocomplete = "off";
      input.spellcheck = false;
      var a = el("div", "modal-actions");
      var rg = rightGroup();
      var cancel = el("button", "cancel", T("common.cancel"));
      cancel.addEventListener("click", closeModal);
      var ok = el("button", null, T("common.save"));
      ok.addEventListener("click", function () {
        var v = input.value.trim();
        if (!v) {
          input.focus();
          return;
        }
        closeModal();
        onOk(v);
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") ok.click();
      });
      rg.appendChild(cancel);
      rg.appendChild(ok);
      a.appendChild(rg);
      box.appendChild(input);
      box.appendChild(a);
    });
  }

  function showPromptArea(opts) {
    openModal(function (box) {
      box.appendChild(el("h3", null, opts.title));
      var hint = el("div", "modal-hint", opts.hint || T("ai.setPromptHint"));
      var ta = document.createElement("textarea");
      ta.value = opts.value || "";
      ta.placeholder = opts.placeholder || "";
      ta.rows = 7;
      ta.spellcheck = false;

      var a = el("div", "modal-actions");
      var leftWrap = document.createElement("div");
      if (opts.value && opts.value.trim()) {
        var clearBtn = el("button", "link-btn", T("ai.clearPrompt"));
        clearBtn.addEventListener("click", function () {
          closeModal();
          if (opts.onClear) opts.onClear();
        });
        leftWrap.appendChild(clearBtn);
      }
      var rg = rightGroup();
      var cancel = el("button", "cancel", T("common.cancel"));
      cancel.addEventListener("click", closeModal);
      var ok = el("button", null, T("common.save"));
      ok.addEventListener("click", function () {
        var v = ta.value;
        closeModal();
        opts.onOk(v);
      });
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          ok.click();
        }
      });
      rg.appendChild(cancel);
      rg.appendChild(ok);
      a.appendChild(leftWrap);
      a.appendChild(rg);
      box.appendChild(hint);
      box.appendChild(ta);
      box.appendChild(a);
    });
  }

  /* 生成作品 HTML */

  function generatePageHtml(title, script, imageDataUrl) {
    var safeTitle = escapeHtml(title || T("generator.untitledPage"));
    var imgVar = imageDataUrl
      ? 'var imageUrl = "' + imageDataUrl + '";'
      : "var imageUrl = null;";
    var safeImgVar = escapeScriptClose(imgVar);
    var safeScript = escapeScriptClose(script);

    return (
      "<!DOCTYPE html>\n" +
      '<html lang="zh-CN">\n' +
      "<head>\n" +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      "  <title>" +
      safeTitle +
      "</title>\n" +
      "  <style>\n" +
      "    html, body { margin: 0; padding: 0; }\n" +
      "    canvas { display: block; }\n" +
      "  </style>\n" +
      '  \x3Cscript src="' +
      P5_CDN +
      '">\x3C/script>\n' +
      "</head>\n" +
      "<body>\n" +
      "  \x3Cscript>\n" +
      "    " +
      safeImgVar +
      "\n" +
      "    " +
      safeScript +
      "\n" +
      "  \x3C/script>\n" +
      "</body>\n" +
      "</html>"
    );
  }

  function downloadSingleHtml(filename, html) {
    try {
      var blob = new Blob([html], { type: "text/html;charset=utf-8" });
      var url = URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(function () {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (err) {
      showAlert(
        T("page.downloadFailTitle"),
        String((err && err.message) || err),
        true,
      );
    }
  }

  function exportZip() {
    var pages = getPages();
    if (!pages.length) {
      showAlert(T("page.exportEmptyTitle"), T("page.exportEmptyBody"));
      return;
    }
    var zip = new JSZip();
    pages.forEach(function (page, idx) {
      var base = (page.title || "untitled").replace(/[\\/:*?"<>|]/g, "_");
      zip.file("p5_" + base + "_" + (idx + 1) + ".html", page.html);
    });
    zip
      .generateAsync({ type: "blob" })
      .then(function (blob) {
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "p5_works.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 1000);
      })
      .catch(function (err) {
        showAlert(
          T("page.exportFailTitle"),
          String((err && err.message) || err),
          true,
        );
      });
  }

  /* 首页随机脚本 */

  function pickRandomP5File() {
    if (!P5_FILES || !P5_FILES.length) return null;
    if (P5_FILES.length === 1) return P5_FILES[0];
    var pool = P5_FILES.filter(function (f) {
      return f !== currentRandomFile;
    });
    if (!pool.length) pool = P5_FILES.slice();
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function encodePath(fileName) {
    return String(fileName)
      .split("/")
      .map(function (seg) {
        return encodeURIComponent(seg);
      })
      .join("/");
  }
  function buildP5SrcDoc(fileName) {
    var src = P5_DIR + encodePath(fileName);
    return (
      "<!DOCTYPE html>\n" +
      '<html lang="zh-CN">\n' +
      "<head>\n" +
      '  <meta charset="UTF-8">\n' +
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">\n' +
      "  <style>\n" +
      "    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; touch-action: none; }\n" +
      "    canvas { display: block; touch-action: none; }\n" +
      "  </style>\n" +
      '  \x3Cscript src="' +
      P5_CDN +
      '">\x3C/script>\n' +
      '  \x3Cscript src="' +
      src +
      '">\x3C/script>\n' +
      "</head>\n" +
      "<body></body>\n" +
      "</html>"
    );
  }

  /* 侧边栏作品列表 */

  function updateSidebarPages() {
    var pages = getPages();
    var kw = sidebarSearchKeyword.trim().toLowerCase();
    var filtered = pages;
    if (kw) {
      filtered = pages.filter(function (p) {
        return (
          String(p.title || "")
            .toLowerCase()
            .indexOf(kw) !== -1
        );
      });
    }

    if (!filtered.length) {
      var empty = el("div", "no-pages");
      empty.textContent = kw ? T("nav.noMatch") : T("nav.noScripts");
      sidebarPagesEl.replaceChildren(empty);
      return;
    }

    var frag = document.createDocumentFragment();
    filtered.forEach(function (page) {
      var item = el("div", "page-item");

      var title = el("span", "page-title", page.title);
      title.dataset.action = "open";
      title.dataset.id = String(page.id);

      var actions = el("div", "actions");
      var renameBtn = el("button", "rename", "✏️");
      renameBtn.title = T("common.rename");
      renameBtn.dataset.action = "rename";
      renameBtn.dataset.id = String(page.id);

      var delBtn = el("button", "del", "🗑️");
      delBtn.title = T("common.delete");
      delBtn.dataset.action = "delete";
      delBtn.dataset.id = String(page.id);

      actions.appendChild(renameBtn);
      actions.appendChild(delBtn);
      item.appendChild(title);
      item.appendChild(actions);
      frag.appendChild(item);
    });
    sidebarPagesEl.replaceChildren(frag);
  }

  /* iframe 内 p5 画布事件代理 */

  function bindIframeProxy(iframe) {
    var iwin, idoc;
    try {
      iwin = iframe.contentWindow;
      idoc = iframe.contentDocument;
    } catch (e) {
      console.warn("Cannot access iframe document:", e);
      return;
    }
    if (!iwin || !idoc) return;

    var tries = 0;
    function tryFindCanvas() {
      var canvas = idoc.querySelector("canvas");
      if (canvas) {
        attachProxy(canvas, iwin, idoc);
        return;
      }
      if (++tries < 80) setTimeout(tryFindCanvas, 100);
    }
    tryFindCanvas();
  }

  function attachProxy(canvas, iwin, idoc) {
    if (canvas.__proxyAttached) return;
    canvas.__proxyAttached = true;

    var MOUSE_TYPES = [
      "mousemove",
      "mousedown",
      "mouseup",
      "click",
      "dblclick",
    ];
    var TOUCH_TYPES = ["touchstart", "touchmove", "touchend", "touchcancel"];

    function relayMouse(e) {
      if (e.target === canvas) return;
      if (
        (e.type === "mousedown" ||
          e.type === "mouseup" ||
          e.type === "click" ||
          e.type === "dblclick") &&
        e.button !== 0
      )
        return;
      var ev;
      try {
        ev = new iwin.MouseEvent(e.type, {
          bubbles: true,
          cancelable: true,
          view: iwin,
          detail: e.detail || 1,
          screenX: e.screenX,
          screenY: e.screenY,
          clientX: e.clientX,
          clientY: e.clientY,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          metaKey: e.metaKey,
          button: e.button,
          buttons: e.buttons,
          relatedTarget: null,
        });
      } catch (err) {
        return;
      }
      canvas.dispatchEvent(ev);
    }

    function relayTouch(e) {
      if (e.target === canvas) return;
      if (!e.touches || !e.touches.length) return;
      var t = e.touches[0];
      var type =
        e.type === "touchstart"
          ? "mousedown"
          : e.type === "touchmove"
            ? "mousemove"
            : e.type === "touchend"
              ? "mouseup"
              : null;
      if (!type) return;
      var ev;
      try {
        ev = new iwin.MouseEvent(type, {
          bubbles: true,
          cancelable: true,
          view: iwin,
          clientX: t.clientX,
          clientY: t.clientY,
          screenX: t.screenX,
          screenY: t.screenY,
          button: 0,
          buttons: type === "mouseup" ? 0 : 1,
        });
      } catch (err) {
        return;
      }
      canvas.dispatchEvent(ev);
    }

    MOUSE_TYPES.forEach(function (type) {
      idoc.addEventListener(type, relayMouse, true);
    });
    TOUCH_TYPES.forEach(function (type) {
      idoc.addEventListener(type, relayTouch, {
        capture: true,
        passive: true,
      });
    });
  }

  /* 预览锁屏 */

  function lockAppSize() {
    document.body.classList.add("preview-lock");
    var w = window.innerWidth;
    var h = window.innerHeight;
    appEl.style.position = "fixed";
    appEl.style.top = "0";
    appEl.style.left = "0";
    appEl.style.width = w + "px";
    appEl.style.height = h + "px";
    appEl.style.overflow = "hidden";
  }
  function unlockAppSize() {
    document.body.classList.remove("preview-lock");
    appEl.style.position = "";
    appEl.style.top = "";
    appEl.style.left = "";
    appEl.style.width = "";
    appEl.style.height = "";
    appEl.style.overflow = "";
  }

  /* 首页渲染 */

  function renderRunner() {
    destroyEditor();
    appEl.replaceChildren();
    appEl.classList.remove("preview-mode");
    appEl.classList.remove("ai-mode");
    setActiveNav("/");

    var html = null;

    if (runner.mode === "page") {
      var page = getPages().find(function (p) {
        return p.id === runner.pageId;
      });
      if (page) {
        html = page.html;
        appEl.dataset.currentPageId = String(page.id);
      } else {
        runner.mode = "random";
        runner.pageId = null;
      }
    }

    if (html === null) {
      var file = pickRandomP5File();
      if (!file) {
        unlockAppSize();
        delete appEl.dataset.currentPageId;
        var wrap = document.createElement("div");
        wrap.appendChild(el("h1", null, T("runner.noScriptTitle")));
        wrap.appendChild(el("p", null, T("runner.noScriptBody")));
        appEl.appendChild(wrap);
        return;
      }
      currentRandomFile = file;
      html = buildP5SrcDoc(file);
      delete appEl.dataset.currentPageId;
    }

    lockAppSize();
    appEl.classList.add("preview-mode");

    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", "p5");
    iframe.setAttribute("scrolling", "no");
    iframe.srcdoc = html;
    iframe.addEventListener("load", function () {
      bindIframeProxy(iframe);
    });
    appEl.appendChild(iframe);
  }

  function setRandom() {
    runner.mode = "random";
    runner.pageId = null;
    if (getRoute() === "/") render();
    else location.hash = "#/";
  }

  function runPage(id) {
    runner.mode = "page";
    runner.pageId = id;
    if (getRoute() === "/") render();
    else location.hash = "#/";
  }

  /* 作品操作 */

  function deletePage(id) {
    var pages = getPages();
    var page = pages.find(function (p) {
      return p.id === id;
    });
    if (!page) return;
    showConfirm(
      T("page.deleteTitle"),
      T("page.deleteBody", { title: page.title }),
      function () {
        var list = getPages().filter(function (p) {
          return p.id !== id;
        });
        savePages(list);
        updateSidebarPages();
        if (runner.mode === "page" && runner.pageId === id) {
          runner.mode = "random";
          runner.pageId = null;
        }
        render();
      },
      true,
    );
  }

  function renamePage(id) {
    var pages = getPages();
    var page = pages.find(function (p) {
      return p.id === id;
    });
    if (!page) return;
    showPrompt(T("page.renameTitle"), page.title, function (newTitle) {
      page.title = newTitle;
      savePages(pages);
      updateSidebarPages();
      render();
    });
  }

  /* 侧边栏开关 */

  function openSidebar() {
    sidebarEl.classList.add("open");
    overlayEl.classList.add("show");
    document.body.classList.add("sidebar-open");
    hamburgerBtn.setAttribute("aria-expanded", "true");
  }
  function closeSidebar() {
    sidebarEl.classList.remove("open");
    overlayEl.classList.remove("show");
    document.body.classList.remove("sidebar-open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
  }

  /* 主题 */

  function applyTheme(theme) {
    var lightTheme = $("#cm-theme-light");
    var darkTheme = $("#cm-theme-dark");
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      if (lightTheme) lightTheme.disabled = true;
      if (darkTheme) darkTheme.disabled = false;
    } else {
      document.body.classList.remove("dark-mode");
      if (lightTheme) lightTheme.disabled = false;
      if (darkTheme) darkTheme.disabled = true;
    }
    if (editor)
      editor.setOption("theme", theme === "dark" ? "dracula" : "default");
  }
  function currentTheme() {
    return document.body.classList.contains("dark-mode") ? "dark" : "light";
  }
  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch (e) {}
  }

  /* 路由 */

  function getRoute() {
    var hash = location.hash;
    if (!hash || hash === "#" || hash === "#/") return "/";
    return hash.replace(/^#/, "") || "/";
  }
  function setActiveNav(path) {
    $$(".sidebar .nav-item[data-path]").forEach(function (el) {
      if (el.getAttribute("data-path") === "#" + path) {
        el.setAttribute("aria-current", "page");
      } else {
        el.removeAttribute("aria-current");
      }
    });
  }
  function destroyEditor() {
    if (editor) {
      try {
        editor.toTextArea();
      } catch (e) {}
      editor = null;
    }
  }

  /* 关于页 */

  function renderAbout() {
    var wrap = document.createElement("div");
    wrap.appendChild(el("h1", null, T("about.title")));
    ["p1", "p2", "p3", "p4", "p5"].forEach(function (k) {
      wrap.appendChild(el("p", null, T("about." + k)));
    });
    return wrap;
  }

  /* 编写脚本页 */

  function renderGenerator() {
    var wrap = el("div", "generator-page");
    wrap.appendChild(el("h1", null, T("generator.title")));
    wrap.appendChild(el("p", null, T("generator.subtitle")));

    /* 标题输入 */
    var g1 = el("div", "form-group");
    var l1 = el("label", null, T("generator.labelTitle"));
    l1.setAttribute("for", "title");
    var titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.id = "title";
    titleInput.placeholder = T("generator.titlePlaceholder");
    g1.appendChild(l1);
    g1.appendChild(titleInput);

    /* 脚本 */
    var g2 = el("div", "form-group");
    var l2 = el("label", null, T("generator.labelScript"));
    l2.setAttribute("for", "script");
    var ta = document.createElement("textarea");
    ta.id = "script";
    g2.appendChild(l2);
    g2.appendChild(ta);

    /* 图片 */
    var g3 = el("div", "form-group");
    var l3 = el("label");
    l3.textContent = T("generator.labelImage");
    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "image";
    fileInput.accept = "image/*"; var previewBox = el("div"); previewBox.id = "image-preview"; g3.appendChild(l3); g3.appendChild(fileInput); g3.appendChild(previewBox); var submit = el("button", null, T("generator.submit")); submit.id = "buildBtn"; submit.type = "button"; var result = el("div", "result"); result.id = "result"; result.style.display = "none"; wrap.appendChild(g1); wrap.appendChild(g2); wrap.appendChild(g3); wrap.appendChild(submit); wrap.appendChild(result); return wrap; } function bindGenerator() { var titleInput = $("#title"); var textarea = $("#script"); var fileInput = $("#image"); var previewEl = $("#image-preview"); var resultEl = $("#result"); var buildBtn = $("#buildBtn"); uploadedImageDataUrl = null; titleInput.value = generatorDraft.title || ""; destroyEditor(); if (window.CodeMirror) { var themeName = currentTheme() === "dark" ? "dracula" : "default"; editor = window.CodeMirror.fromTextArea(textarea, { mode: "javascript", lineNumbers: true, theme: themeName, tabSize: 2, indentUnit: 2, autofocus: true, }); editor.setSize(null, "100%"); if (generatorDraft.script) editor.setValue(generatorDraft.script); var cmWrapper = editor.getWrapperElement(); if (getComputedStyle(cmWrapper).position === "static") { cmWrapper.style.position = "relative"; } var cmPlaceholderEl = el("div", "cm-placeholder-overlay"); cmPlaceholderEl.textContent = T("generator.scriptPlaceholder"); cmWrapper.appendChild(cmPlaceholderEl); var gutters = cmWrapper.querySelector(".CodeMirror-gutters"); var leftOffset = gutters ? gutters.offsetWidth + 8 : 44; cmPlaceholderEl.style.left = leftOffset + "px"; function updateCmPlaceholder() { cmPlaceholderEl.style.display = editor.getValue().length === 0 ? "block" : "none"; } editor.on("change", updateCmPlaceholder); editor.on("optionChange", function () { var g = cmWrapper.querySelector(".CodeMirror-gutters"); if (g) cmPlaceholderEl.style.left = g.offsetWidth + 8 + "px"; }); updateCmPlaceholder(); editor.on("change", function () { generatorDraft.script = editor.getValue(); }); } titleInput.addEventListener("input", function () { generatorDraft.title = this.value; }); fileInput.addEventListener("change", function () { var file = this.files && this.files[0]; if (!file) return; if (!/^image\//.test(file.type)) { showAlert(T("page.badImageTitle"), T("page.badImageBody"), true); this.value = ""; return; } if (file.size > MAX_IMAGE_BYTES) { showAlert( T("page.imageTooLargeTitle"), T("page.imageTooLargeBody"), true, ); this.value = ""; return; } var reader = new FileReader(); reader.onload = function (e) { uploadedImageDataUrl = e.target.result; var tip = el("p", null, T("generator.imageOk")); var img = document.createElement("img"); img.src = e.target.result; img.className = "preview-img"; img.alt = T("generator.imageAlt"); previewEl.replaceChildren(tip, img); }; reader.onerror = function () { showAlert( T("page.imageReadFailTitle"), T("page.imageReadFailBody"), true, ); }; reader.readAsDataURL(file); }); buildBtn.addEventListener("click", function () { var title = titleInput.value.trim() || T("generator.untitled"); var script = (editor ? editor.getValue() : textarea.value).trim(); if (!script) { showAlert(T("page.noScriptTitle"), T("page.noScriptBody"), true); return; } var imageDataUrl = uploadedImageDataUrl || ""; var htmlContent = generatePageHtml(title, script, imageDataUrl); var newId = Date.now() + Math.floor(Math.random() * 1000); var pages = getPages(); pages.push({ id: newId, title: title, html: htmlContent, timestamp: new Date().toISOString(), }); if (!savePages(pages)) return; updateSidebarPages(); resultEl.style.display = "block"; var msg = el("p", null, T("generator.buildOk")); var btnContainer = el("div", "action-buttons"); var previewBtn = el("button", "preview", T("generator.preview")); previewBtn.addEventListener("click", function () { runPage(newId); }); var downloadBtn = el("button", "download", T("generator.download")); downloadBtn.addEventListener("click", function () { downloadSingleHtml( "p5_" + safeFileName(title) + "_" + newId + ".html", htmlContent, ); }); btnContainer.appendChild(previewBtn); btnContainer.appendChild(downloadBtn); resultEl.replaceChildren(msg, btnContainer); titleInput.value = ""; if (editor) editor.setValue(""); generatorDraft.title = ""; generatorDraft.script = ""; uploadedImageDataUrl = ""; previewEl.replaceChildren(); fileInput.value = ""; }); } /* AI 页骨架（JS 生成） */

  function renderAIAssistant() {
    var page = el("div", "ai-page");

    var clearBtn = el("button", "ai-clear-btn", "−");
    clearBtn.id = "aiClearBtn";
    clearBtn.type = "button";
    clearBtn.title = T("ai.clearTitle");

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "aiImportFile";
    fileInput.accept = ".json,application/json";
    fileInput.style.display = "none";

    var messages = el("div", "ai-messages");
    messages.id = "aiMessages";

    var inputWrap = el("div", "ai-input-wrap");
    var bar = el("div", "ai-input-bar");
    var picker = el("div", "ai-model-picker");

    var modelBtn = el("button", "ai-model-btn", "+");
    modelBtn.id = "aiModelBtn";
    modelBtn.type = "button";
    modelBtn.title = T("ai.modelPickerTitle");

    var menu = el("div", "ai-model-menu");
    menu.id = "aiModelMenu";

    picker.appendChild(modelBtn);
    picker.appendChild(menu);

    var input = document.createElement("textarea");
    input.id = "aiInput";
    input.rows = 1;
    input.placeholder = T("ai.inputPlaceholder");

    var sendBtn = el("button", "ai-send-btn", "↑");
    sendBtn.id = "aiSendBtn";
    sendBtn.type = "button";
    sendBtn.title = T("ai.sendTitle");

    bar.appendChild(picker);
    bar.appendChild(input);
    bar.appendChild(sendBtn);
    inputWrap.appendChild(bar);

    page.appendChild(clearBtn);
    page.appendChild(fileInput);
    page.appendChild(messages);
    page.appendChild(inputWrap);
    return page;
  }

  /* 模型菜单 */

  function buildAIModelMenu() {
    var menu = $("#aiModelMenu");
    if (!menu) return;
    var frag = document.createDocumentFragment();

    /* 顶部：自定义 + 导入 */
    var topRow = el("div", "ai-model-toprow");
    var addBtn = el("div", "ai-model-topbtn ai-model-add", T("ai.topRowAdd"));
    addBtn.dataset.add = "1";
    var importBtn = el("div", "ai-model-topbtn", T("ai.topRowImport"));
    importBtn.dataset.import = "1";
    topRow.appendChild(addBtn);
    topRow.appendChild(importBtn);
    frag.appendChild(topRow);

    /* 模型列表 */
    getAllModels().forEach(function (m) {
      var item = el("div", "ai-model-item");
      if (aiState.currentModel === m.id) item.classList.add("active");
      item.dataset.model = m.id;

      item.appendChild(el("span", "ai-check", "✓"));

      var name = el("span", "ai-model-name");
      var nameText = el("span", "ai-model-name-text", m.name);
      name.appendChild(nameText);

      if (!m.builtin) {
        var editBtn = el("button", "ai-model-edit", "✎");
        editBtn.type = "button";
        editBtn.title = T("ai.editModelTitle");
        editBtn.dataset.edit = m.id;
        name.appendChild(editBtn);
      }
      item.appendChild(name);

      var testBtn = el("button", "ai-dl", "T");
      testBtn.type = "button";
      testBtn.title = T("ai.menuTest");
      testBtn.dataset.test = m.id;

      var keyBtn = el("button", "ai-key", "K");
      keyBtn.type = "button";
      keyBtn.title = T("ai.menuKey");
      keyBtn.dataset.key = m.id;

      var promptBtn = el("button", "ai-prompt", "P");
      promptBtn.type = "button";
      promptBtn.title = T("ai.menuPrompt");
      promptBtn.dataset.prompt = m.id;
      if (aiState.prompts[m.id] && aiState.prompts[m.id].trim()) {
        promptBtn.classList.add("has-prompt");
      }

      var jsonBtn = el("button", "ai-dl", "J");
      jsonBtn.type = "button";
      jsonBtn.title = T("ai.menuDownloadJson");
      jsonBtn.dataset.json = m.id;

      var mdBtn = el("button", "ai-dl", "M");
      mdBtn.type = "button";
      mdBtn.title = T("ai.menuDownloadMd");
      mdBtn.dataset.md = m.id;

      item.appendChild(testBtn);
      item.appendChild(keyBtn);
      item.appendChild(promptBtn);
      item.appendChild(jsonBtn);
      item.appendChild(mdBtn);

      frag.appendChild(item);
    });

    menu.replaceChildren(frag);
  }

  function refreshAIModelUI() {
    $$(".ai-model-item").forEach(function (el) {
      if (aiState.currentModel && el.dataset.model === aiState.currentModel) {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
    var btn = $("#aiModelBtn");
    if (btn) {
      if (aiState.currentModel) {
        btn.classList.add("has-model");
        btn.textContent = aiModelName(aiState.currentModel).charAt(0);
      } else {
        btn.classList.remove("has-model");
        btn.textContent = "+";
      }
    }
  }

  function closeAIModelMenu() {
    var menu = $("#aiModelMenu");
    if (menu) menu.classList.remove("show");
  }
  function toggleAIModelMenu() {
    var menu = $("#aiModelMenu");
    if (!menu) return;
    menu.classList.toggle("show");
  }

  /* AI 消息渲染 */

  function buildMsgNode(m) {
    var row = el("div", "ai-msg " + (m.role === "assistant" ? "assistant" : "user"));
    var b = el("div", "bubble");
    if (m.role === "assistant" && !m.content) {
      b.textContent = T("ai.thinking");
      b.classList.add("pending");
    } else {
      b.textContent = m.content;
    }
    row.appendChild(b);
    return row;
  }

  function buildEmptyNode(text) {
    return el("div", "ai-empty", text);
  }

  function renderAIMessages() {
    var box = $("#aiMessages");
    if (!box) return;
    var model = aiState.currentModel;

    if (!model) {
      if (!box.firstChild || !box.querySelector(".ai-empty")) {
        box.replaceChildren(buildEmptyNode(T("ai.emptyNoModel")));
      }
      renderedModelId = null;
      renderedMsgCount = 0;
      return;
    }

    if (renderedModelId !== model) {
      renderedModelId = model;
      renderedMsgCount = 0;
      box.replaceChildren();
    }

    var chat = aiState.chats[model] || [];

    if (!chat.length) {
      if (!box.firstChild || !box.querySelector(".ai-empty")) {
        box.replaceChildren(
          buildEmptyNode(T("ai.emptyStart", { model: aiModelName(model) })),
        );
      }
      renderedMsgCount = 0;
      return;
    }

    if (renderedMsgCount > chat.length) renderedMsgCount = 0;

    if (renderedMsgCount === 0) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < chat.length; i++) {
        frag.appendChild(buildMsgNode(chat[i]));
      }
      box.replaceChildren(frag);
      renderedMsgCount = chat.length;
      box.scrollTop = box.scrollHeight;
      return;
    }

    if (renderedMsgCount < chat.length) {
      var emptyEl = box.querySelector(".ai-empty");
      if (emptyEl && box.children.length === 1) {
        box.replaceChildren();
        renderedMsgCount = 0;
        var frag2 = document.createDocumentFragment();
        for (var k = 0; k < chat.length; k++) {
          frag2.appendChild(buildMsgNode(chat[k]));
        }
        box.replaceChildren(frag2);
        renderedMsgCount = chat.length;
        box.scrollTop = box.scrollHeight;
        return;
      }
      for (var j = renderedMsgCount; j < chat.length; j++) {
        box.appendChild(buildMsgNode(chat[j]));
      }
      renderedMsgCount = chat.length;
      box.scrollTop = box.scrollHeight;
    }
  }

  function updateAISendBtn() {
    var btn = $("#aiSendBtn");
    if (!btn) return;
    btn.disabled = !!aiState.busy;
  }

  function getLastAssistantBubble() {
    var box = $("#aiMessages");
    if (!box) return null;
    var last = box.lastElementChild;
    if (!last || !last.classList.contains("assistant")) return null;
    return last.querySelector(".bubble");
  }

  function isNearBottom(box) {
    if (!box) return true;
    return box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  }

  /* 流式请求 */

  function streamAI(model, key, messages, systemPrompt, onDelta, onRaw) {
    var conf = aiModelConf(model);
    var url, options;

    if (conf.protocol === "gemini") {
      url =
        conf.endpoint.replace(":generateContent", ":streamGenerateContent") +
        "?alt=sse&key=" +
        encodeURIComponent(key);
      var contents = messages.map(function (m) {
        return {
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        };
      });
      var body = { contents: contents };
      if (systemPrompt) {
        body.systemInstruction = { parts: [{ text: systemPrompt }] };
      }
      options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      };
    } else {
      var msgs = [];
      if (systemPrompt) msgs.push({ role: "system", content: systemPrompt });
      messages.forEach(function (m) {
        msgs.push({ role: m.role, content: m.content });
      });
      url = conf.endpoint;
      options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify({
          model: conf.apiModel,
          messages: msgs,
          stream: true,
          stream_options: { include_usage: true },
        }),
      };
    }

    if (aiState.abortController) {
      options.signal = aiState.abortController.signal;
    }

    return fetch(url, options).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var msg = "HTTP " + res.status;
          try {
            var d = JSON.parse(t);
            msg =
              (d.error && d.error.message) ||
              d.message ||
              (d.error && d.error.status) ||
              msg;
          } catch (e) {}
          throw new Error(msg);
        });
      }
      if (!res.body || !res.body.getReader) {
        throw new Error(T("chat.errStreamUnsupported"));
      }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";

      function dispatchData(data) {
        if (!data) return;
        if (data === "[DONE]") {
          if (onRaw) onRaw("[DONE]");
          return;
        }
        try {
          var obj = JSON.parse(data);
          if (onRaw) onRaw(obj);
          onDelta(obj);
        } catch (e) {}
      }

      function processBuffer(flush) {
        if (buffer.indexOf("\r") !== -1) {
          buffer = buffer.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
        }
        var sepIndex;
        while ((sepIndex = buffer.indexOf("\n\n")) !== -1) {
          var evt = buffer.slice(0, sepIndex);
          buffer = buffer.slice(sepIndex + 2);
          var lines = evt.split("\n");
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.indexOf("data:") === 0) {
              dispatchData(line.slice(5).trim());
            }
          }
        }
        if (flush && buffer.trim()) {
          var tail = buffer.trim();
          if (tail.indexOf("data:") === 0) {
            dispatchData(tail.slice(5).trim());
          }
          buffer = "";
        }
      }

      function pump() {
        return reader.read().then(function (result) {
          if (result.done) {
            processBuffer(true);
            return;
          }
          buffer += decoder.decode(result.value, { stream: true });
          processBuffer(false);
          return pump();
        });
      }

      return pump();
    });
  }

  /* 结构化累积器 */

  function createStructuredAccumulator() {
    var meta = {
      id: null,
      model: null,
      created: null,
      finish_reason: null,
      usage: null,
      tool_calls: null,
    };
    var tcBuf = {};
    var hasToolCall = false;

    function consume(obj) {
      if (!obj || obj === "[DONE]") return;
      if (obj.id && !meta.id) meta.id = obj.id;
      if (obj.model && !meta.model) meta.model = obj.model;
      if (obj.created && !meta.created) meta.created = obj.created;
      if (obj.usage) meta.usage = obj.usage;

      var ch = obj.choices && obj.choices[0];
      if (ch) {
        if (ch.finish_reason) meta.finish_reason = ch.finish_reason;
        var delta = ch.delta || {};
        var tcs = delta.tool_calls;
        if (tcs && tcs.length) {
          hasToolCall = true;
          tcs.forEach(function (t) {
            var idx = t.index != null ? t.index : 0;
            if (!tcBuf[idx]) {
              tcBuf[idx] = {
                id: "",
                type: "function",
                function: { name: "", arguments: "" },
              };
            }
            var buf = tcBuf[idx];
            if (t.id) buf.id = t.id;
            if (t.type) buf.type = t.type;
            if (t.function) {
              if (t.function.name) buf.function.name += t.function.name;
              if (t.function.arguments)
                buf.function.arguments += t.function.arguments;
            }
          });
        }
      }

      var cand = obj.candidates && obj.candidates[0];
      if (cand) {
        if (cand.finishReason && !meta.finish_reason) {
          meta.finish_reason = cand.finishReason;
        }
        if (cand.content && cand.content.parts) {
          cand.content.parts.forEach(function (p) {
            if (p.functionCall) {
              hasToolCall = true;
              var idx = Object.keys(tcBuf).length;
              tcBuf[idx] = {
                id: "call_" + Date.now() + "_" + idx,
                type: "function",
                function: {
                  name: p.functionCall.name || "",
                  arguments: JSON.stringify(p.functionCall.args || {}),
                },
              };
            }
          });
        }
      }
      if (obj.usageMetadata) {
        meta.usage = {
          prompt_tokens: obj.usageMetadata.promptTokenCount,
          completion_tokens: obj.usageMetadata.candidatesTokenCount,
          total_tokens: obj.usageMetadata.totalTokenCount,
        };
      }
    }

    function finalize() {
      if (hasToolCall) {
        var arr = [];
        Object.keys(tcBuf)
          .sort(function (a, b) {
            return a - b;
          })
          .forEach(function (k) {
            var t = tcBuf[k];
            if (t.function && t.function.name) arr.push(t);
          });
        if (arr.length) meta.tool_calls = arr;
      }
      return meta;
    }

    return { consume: consume, finalize: finalize };
  }

  /* 自定义模型编辑弹窗 */

  function showModelEditor(modelId) {
    var isEdit = !!modelId;
    var existing = isEdit ? aiModelConf(modelId) : null;
    if (isEdit && (!existing || existing.builtin)) return;

    openModal(function (box) {
      box.appendChild(
        el("h3", null, isEdit ? T("ai.editModelTitle") : T("model.addTitle")),
      );
      var hint = el(
        "div",
        "modal-hint",
        T("model.hint", { endpoint: "{endpoint}" }),
      );
      box.appendChild(hint);

      /* 名称 */
      var l1 = el("label", null, T("model.labelName"));
      l1.style.cssText =
        "display:block;font-weight:bold;font-size:0.9rem;margin:8px 0 4px;";
      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = T("model.placeholderName");
      nameInput.value = isEdit ? existing.name : "";
      nameInput.autocomplete = "off";
      nameInput.spellcheck = false;

      /* Endpoint */
      var l2 = el("label", null, T("model.labelEndpoint"));
      l2.style.cssText = l1.style.cssText;
      var epInput = document.createElement("input");
      epInput.type = "text";
      epInput.placeholder = T("model.placeholderEndpoint");
      epInput.value = isEdit ? existing.endpoint : "";
      epInput.autocomplete = "off";
      epInput.spellcheck = false;

      /* API Model */
      var l3 = el("label", null, T("model.labelApiModel"));
      l3.style.cssText = l1.style.cssText;
      var apiInput = document.createElement("input");
      apiInput.type = "text";
      apiInput.placeholder = T("model.placeholderApiModel");
      apiInput.value = isEdit ? existing.apiModel : "";
      apiInput.autocomplete = "off";
      apiInput.spellcheck = false;

      var actions = el("div", "modal-actions");

      var leftWrap = document.createElement("div");
      if (isEdit) {
        var delBtn = el("button", "link-btn", T("model.deleteBtn"));
        delBtn.type = "button";
        delBtn.addEventListener("click", function () {
          closeModal();
          deleteCustomModel(modelId);
        });
        leftWrap.appendChild(delBtn);
      }

      var rg = rightGroup();
      var cancel = el("button", "cancel", T("common.cancel"));
      cancel.addEventListener("click", closeModal);

      var ok = el("button", null, isEdit ? T("common.save") : T("common.ok"));
      ok.addEventListener("click", function () {
        var name = nameInput.value.trim();
        var ep = epInput.value.trim();
        var apiModel = apiInput.value.trim();

        if (!name) {
          nameInput.focus();
          return;
        }
        if (!ep) {
          epInput.focus();
          return;
        }
        if (!/^https?:\/\//i.test(ep)) {
          showAlert(T("model.errFormat"), T("model.errFormatBody"), true);
          return;
        }
        if (!apiModel) {
          apiInput.focus();
          return;
        }

        if (isEdit) {
          existing.name = name;
          existing.endpoint = ep;
          existing.apiModel = apiModel;
          saveCustomModels();
          closeModal();
          buildAIModelMenu();
          refreshAIModelUI();
          showAlert(T("model.editOk"), T("model.editOkBody", { name: name }));
        } else {
          var newId = "custom_" + Date.now();
          aiState.customModels.push({
            id: newId,
            name: name,
            endpoint: ep,
            apiModel: apiModel,
            protocol: "openai",
            builtin: false,
          });
          aiState.chats[newId] = [];
          aiState.prompts[newId] = "";
          saveCustomModels();
          saveAIPrompts();
          closeModal();
          buildAIModelMenu();
          refreshAIModelUI();
          showAlert(T("model.addOk"), T("model.addOkBody", { name: name }));
        }
      });

      rg.appendChild(cancel);
      rg.appendChild(ok);
      actions.appendChild(leftWrap);
      actions.appendChild(rg);

      box.appendChild(l1);
      box.appendChild(nameInput);
      box.appendChild(l2);
      box.appendChild(epInput);
      box.appendChild(l3);
      box.appendChild(apiInput);
      box.appendChild(actions);
    });
  }

  function deleteCustomModel(modelId) {
    var conf = aiModelConf(modelId);
    if (!conf || conf.builtin) return;
    showConfirm(
      T("model.deleteConfirmTitle"),
      T("model.deleteConfirmBody", { name: conf.name }),
      function () {
        delete aiState.keys[modelId];
        delete aiState.chats[modelId];
        delete aiState.prompts[modelId];
        saveAIKeys();
        saveAIPrompts();
        try {
          localStorage.removeItem(AI_CHAT_STORAGE + "_" + modelId);
        } catch (e) {}
        aiState.customModels = aiState.customModels.filter(function (m) {
          return m.id !== modelId;
        });
        saveCustomModels();
        if (aiState.currentModel === modelId) {
          aiState.currentModel = null;
          renderedModelId = null;
          renderedMsgCount = 0;
        }
        buildAIModelMenu();
        refreshAIModelUI();
        renderAIMessages();
        updateAISendBtn();
        showAlert(
          T("model.deleteOk"),
          T("model.deleteOkBody", { name: conf.name }),
        );
      },
      true,
    );
  }

  /* 测试连接 */

  function testAIModelConnection(model) {
    var conf = aiModelConf(model);
    if (!conf) return;
    var key = aiState.keys[model];
    if (!key) {
      showAlert(
        T("test.noKeyTitle"),
        T("test.noKeyBody", { model: aiModelName(model) }),
        true,
      );
      return;
    }

    var url, body, headers;
    if (conf.protocol === "gemini") {
      url = conf.endpoint + "?key=" + encodeURIComponent(key);
      body = { contents: [{ role: "user", parts: [{ text: "hi" }] }] };
      headers = { "Content-Type": "application/json" };
    } else {
      url = conf.endpoint;
      body = {
        model: conf.apiModel,
        messages: [{ role: "user", content: "hi" }],
        max_tokens: 1,
      };
      headers = {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key,
      };
    }

    showAlert(T("test.title"), T("test.body", { model: aiModelName(model) }));

    var testAbort = new AbortController();
    var timeoutId = setTimeout(function () {
      try {
        testAbort.abort();
      } catch (e) {}
    }, 15000);

    fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
      signal: testAbort.signal,
    })
      .then(function (res) {
        clearTimeout(timeoutId);
        return res.text().then(function (t) {
          if (res.ok) {
            showAlert(
              T("test.okTitle"),
              T("test.okBody", { model: aiModelName(model) }),
            );
          } else {
            var msg = "HTTP " + res.status;
            try {
              var d = JSON.parse(t);
              msg =
                (d.error && d.error.message) ||
                d.message ||
                (d.error && d.error.status) ||
                msg;
            } catch (e) {}
            showAlert(T("test.failTitle"), msg, true);
          }
        });
      })
      .catch(function (err) {
        clearTimeout(timeoutId);
        var msg = String((err && err.message) || err);
        if (err && err.name === "AbortError") msg = T("test.timeout");
        showAlert(T("test.failTitle"), msg, true);
      });
  }

  /* Key / 提示词 */

  function promptAPIKey(model, onSaved) {
    showPrompt(
      T("ai.setKeyTitle", { model: aiModelName(model) }),
      aiState.keys[model] || "",
      function (v) {
        aiState.keys[model] = v;
        saveAIKeys();
        if (onSaved) onSaved();
      },
      "password",
    );
  }

  function promptSystemPrompt(model) {
    var existing = aiState.prompts[model] || "";
    showPromptArea({
      title: T("ai.setPromptTitle", { model: aiModelName(model) }),
      hint: T("ai.setPromptHint"),
      value: existing,
      placeholder: T("ai.setPromptPlaceholder"),
      onOk: function (v) {
        aiState.prompts[model] = v.trim();
        saveAIPrompts();
        buildAIModelMenu();
        refreshAIModelUI();
      },
      onClear: function () {
        aiState.prompts[model] = "";
        saveAIPrompts();
        buildAIModelMenu();
        refreshAIModelUI();
      },
    });
  }

  function selectAIModel(model) {
    if (!aiModelConf(model)) return;
    if (aiState.busy) {
      if (aiState.abortController) {
        try {
          aiState.abortController.abort();
        } catch (e) {}
      }
      aiState.streamToken += 1;
      aiState.busy = false;
      updateAISendBtn();
    }
    if (!aiState.keys[model]) {
      promptAPIKey(model, function () {
        aiState.currentModel = model;
        refreshAIModelUI();
        renderAIMessages();
        updateAISendBtn();
      });
      return;
    }
    aiState.currentModel = model;
    refreshAIModelUI();
    renderAIMessages();
    updateAISendBtn();
  }

  /* 导出 / 导入 */

  function triggerDownload(content, mime, filename) {
    var blob = new Blob([content], { type: mime });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function downloadAIChatMd(model) {
    var chat = aiState.chats[model] || [];
    if (!chat.length) {
      showAlert(
        T("chat.errNoDownloadTitle"),
        T("chat.errNoDownloadBody", { model: aiModelName(model) }),
      );
      return;
    }
    var lines = ["# " + aiModelName(model), ""];
    var sys = aiState.prompts[model];
    if (sys && sys.trim()) {
      lines.push("## system");
      lines.push("");
      lines.push(sys);
      lines.push("");
    }
    chat.forEach(function (m) {
      lines.push("## " + m.role);
      lines.push("");
      lines.push(m.content || "");
      lines.push("");
    });
    triggerDownload(
      lines.join("\n"),
      "text/markdown;charset=utf-8",
      "ai_chat_" + model + "_" + Date.now() + ".md",
    );
  }

  function downloadAIChatJson(model) {
    var chat = aiState.chats[model] || [];
    if (!chat.length) {
      showAlert(
        T("chat.errNoDownloadTitle"),
        T("chat.errNoDownloadBody", { model: aiModelName(model) }),
      );
      return;
    }
    var sys = aiState.prompts[model];
    var data = {
      schemaVersion: 1,
      model: model,
      modelName: aiModelName(model),
      exportedAt: new Date().toISOString(),
      systemPrompt: sys && sys.trim() ? sys : null,
      messages: chat.map(function (m) {
        var out = { role: m.role, content: m.content };
        if (m.id) out.id = m.id;
        if (m.model) out.model = m.model;
        if (m.created) out.created = m.created;
        if (m.finish_reason) out.finish_reason = m.finish_reason;
        if (m.usage) out.usage = m.usage;
        if (m.tool_calls && m.tool_calls.length) out.tool_calls = m.tool_calls;
        return out;
      }),
    };
    triggerDownload(
      JSON.stringify(data, null, 2),
      "application/json;charset=utf-8",
      "ai_chat_" + model + "_" + Date.now() + ".json",
    );
  }

  function importAIChatFromFile(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var data;
      try {
        data = JSON.parse(e.target.result);
      } catch (err) {
        showAlert(T("import.failTitle"), T("import.badJson"), true);
        return;
      }
      if (!data || !Array.isArray(data.messages)) {
        showAlert(T("import.failTitle"), T("import.badShape"), true);
        return;
      }

      var targetModel = data.model;
      if (!targetModel || !aiModelConf(targetModel)) {
        var name = String(data.modelName || "").toLowerCase();
        var allModels = getAllModels();
        for (var i = 0; i < allModels.length; i++) {
          if (allModels[i].name.toLowerCase() === name) {
            targetModel = allModels[i].id;
            break;
          }
        }
      }
      if (!targetModel || !aiModelConf(targetModel)) {
        showAlert(
          T("import.failTitle"),
          T("import.unknownModel", { model: data.model || "?" }),
          true,
        );
        return;
      }

      var cleaned = data.messages
        .filter(function (m) {
          return m && typeof m.role === "string";
        })
        .map(function (m) {
          var out = {
            role: m.role,
            content: typeof m.content === "string" ? m.content : "",
          };
          if (m.id) out.id = m.id;
          if (m.model) out.model = m.model;
          if (m.created) out.created = m.created;
          if (m.finish_reason) out.finish_reason = m.finish_reason;
          if (m.usage) out.usage = m.usage;
          if (m.tool_calls && m.tool_calls.length) out.tool_calls = m.tool_calls;
          return out;
        });

      if (!cleaned.length) {
        showAlert(T("import.failTitle"), T("import.noMessages"), true);
        return;
      }

      var applyImport = function (mode) {
        var existing = aiState.chats[targetModel] || [];
        if (mode === "replace") aiState.chats[targetModel] = cleaned;
        else aiState.chats[targetModel] = existing.concat(cleaned);

        if (
          data.systemPrompt &&
          String(data.systemPrompt).trim() &&
          !(aiState.prompts[targetModel] || "").trim()
        ) {
          aiState.prompts[targetModel] = String(data.systemPrompt).trim();
          saveAIPrompts();
        }
        saveAIChats(targetModel);

        if (aiState.currentModel === targetModel) {
          renderedMsgCount = 0;
          renderAIMessages();
          showAlert(
            T("import.okTitle"),
            T("import.okBody", {
              n: cleaned.length,
              model: aiModelName(targetModel),
            }),
          );
        } else {
          showConfirm(
            T("import.okTitle"),
            T("import.askSwitch", {
              n: cleaned.length,
              model: aiModelName(targetModel),
            }),
            function () {
              selectAIModel(targetModel);
            },
          );
        }
      };

      var existing = aiState.chats[targetModel] || [];
      if (!existing.length) {
        applyImport("replace");
        return;
      }

      openModal(function (box) {
        box.appendChild(el("h3", null, T("import.conflictTitle")));
        box.appendChild(
          el(
            "p",
            null,
            T("import.conflictBody", {
              model: aiModelName(targetModel),
              existing: existing.length,
              incoming: cleaned.length,
            }),
          ),
        );
        var actions = el("div", "modal-actions");
        var leftWrap = document.createElement("div");
        var cancelBtn = el("button", "link-btn", T("common.cancel"));
        cancelBtn.addEventListener("click", closeModal);
        leftWrap.appendChild(cancelBtn);

        var rg = rightGroup();
        var appendBtn = el("button", "cancel", T("common.append"));
        appendBtn.addEventListener("click", function () {
          closeModal();
          applyImport("append");
        });
        var replaceBtn = el("button", "danger", T("common.replace"));
        replaceBtn.addEventListener("click", function () {
          closeModal();
          applyImport("replace");
        });
        rg.appendChild(appendBtn);
        rg.appendChild(replaceBtn);
        actions.appendChild(leftWrap);
        actions.appendChild(rg);
        box.appendChild(actions);
      });
    };
    reader.onerror = function () {
      showAlert(T("import.failTitle"), T("import.readFail"), true);
    };
    reader.readAsText(file);
  }

  /* 发送 / 清空 */

  function aiSend() {
    if (aiState.busy) return;
    var model = aiState.currentModel;
    if (!model) {
      showAlert(T("chat.errNoModelTitle"), T("chat.errNoModelBody"), true);
      return;
    }
    var key = aiState.keys[model];
    if (!key) {
      promptAPIKey(model, function () {
        aiSend();
      });
      return;
    }

    var inputEl = $("#aiInput");
    if (!inputEl) return;
    var text = (inputEl.value || "").trim();
    if (!text) return;

    var chat = aiState.chats[model];
    if (!Array.isArray(chat)) chat = aiState.chats[model] = [];

    chat.push({ role: "user", content: text });
    chat.push({ role: "assistant", content: "" });
    saveAIChats(model);

    inputEl.value = "";
    inputEl.style.height = "auto";

    if (aiState.abortController) {
      try {
        aiState.abortController.abort();
      } catch (e) {}
    }
    aiState.streamToken += 1;
    var myToken = aiState.streamToken;
    aiState.abortController = new AbortController();

    aiState.busy = true;
    updateAISendBtn();
    renderAIMessages();

    var bubble = getLastAssistantBubble();
    if (bubble) {
      bubble.textContent = "";
      bubble.classList.remove("pending");
    }
    var accumulated = "";
    var conf = aiModelConf(model);
    var isGemini = conf && conf.protocol === "gemini";
    var box = $("#aiMessages");
    var acc = createStructuredAccumulator();

    function pushDelta(text2) {
      if (aiState.streamToken !== myToken) return;
      if (!text2) return;
      accumulated += text2;
      if (bubble) bubble.appendChild(document.createTextNode(text2));
      if (box && isNearBottom(box)) box.scrollTop = box.scrollHeight;
    }

    var onDelta = function (obj) {
      if (isGemini) {
        var cand = obj.candidates && obj.candidates[0];
        if (cand && cand.content && cand.content.parts) {
          var t = "";
          for (var i = 0; i < cand.content.parts.length; i++) {
            t += cand.content.parts[i].text || "";
          }
          pushDelta(t);
        }
      } else {
        var d = obj.choices && obj.choices[0] && obj.choices[0].delta;
        if (d && d.content) pushDelta(d.content);
      }
    };

    var payload = chat.slice(0, -1);
    if (payload.length > MAX_CONTEXT_MESSAGES) {
      payload = payload.slice(-MAX_CONTEXT_MESSAGES);
    }
    var systemPrompt = aiState.prompts[model] || "";

    streamAI(model, key, payload, systemPrompt, onDelta, function (raw) {
      acc.consume(raw);
    })
      .then(function () {
        if (aiState.streamToken !== myToken) return;
        var meta = acc.finalize();
        var msg = chat[chat.length - 1];
        msg.content = accumulated || T("ai.emptyReply");
        if (meta.id) msg.id = meta.id;
        if (meta.model) msg.model = meta.model;
        if (meta.created) msg.created = meta.created;
        if (meta.finish_reason) msg.finish_reason = meta.finish_reason;
        if (meta.usage) msg.usage = meta.usage;
        if (meta.tool_calls) msg.tool_calls = meta.tool_calls;
        saveAIChats(model);
        aiState.busy = false;
        updateAISendBtn();
        renderAIMessages();
      })
      .catch(function (err) {
        if (aiState.streamToken !== myToken) return;
        aiState.busy = false;
        updateAISendBtn();
        var meta = acc.finalize();
        var isAbort = err && (err.name === "AbortError" || err.code === 20);
        if (accumulated) {
          var msg = chat[chat.length - 1];
          msg.content = accumulated;
          if (meta.id) msg.id = meta.id;
          if (meta.model) msg.model = meta.model;
          if (meta.created) msg.created = meta.created;
          if (meta.finish_reason) msg.finish_reason = meta.finish_reason;
          if (meta.usage) msg.usage = meta.usage;
          if (meta.tool_calls) msg.tool_calls = meta.tool_calls;
        } else {
          chat.pop();
        }
        saveAIChats(model);
        renderAIMessages();
        if (!isAbort) {
          showAlert(
            T("chat.errRequestTitle"),
            String((err && err.message) || err) || T("chat.errRequestBody"),
            true,
          );
        }
      });
  }

  function clearAIChat() {
    var model = aiState.currentModel;
    if (!model) {
      showAlert(T("chat.errNoClearTitle"), T("chat.errNoClearNoModel"));
      return;
    }
    var chat = aiState.chats[model] || [];
    if (!chat.length) {
      showAlert(
        T("chat.errNoClearTitle"),
        T("chat.errNoClearNoChat", { model: aiModelName(model) }),
      );
      return;
    }
    showConfirm(
      T("chat.clearConfirmTitle"),
      T("chat.clearConfirmBody", { model: aiModelName(model) }),
      function () {
        if (aiState.busy) {
          if (aiState.abortController) {
            try {
              aiState.abortController.abort();
            } catch (e) {}
          }
          aiState.streamToken += 1;
          aiState.busy = false;
          updateAISendBtn();
        }
        aiState.chats[model] = [];
        saveAIChats(model);
        renderedMsgCount = 0;
        renderAIMessages();
      },
      true,
    );
  }

  function bindAIAssistant() {
    buildAIModelMenu();
    refreshAIModelUI();
    renderAIMessages();
    updateAISendBtn();

    var modelBtn = $("#aiModelBtn");
    var modelMenu = $("#aiModelMenu");
    var inputEl = $("#aiInput");
    var sendBtn = $("#aiSendBtn");
    var clearBtn = $("#aiClearBtn");

    if (modelBtn) {
      modelBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        toggleAIModelMenu();
      });
    }

    if (modelMenu) {
      modelMenu.addEventListener("click", function (e) {
        var importItem = e.target.closest("[data-import]");
        if (importItem) {
          e.stopPropagation();
          closeAIModelMenu();
          var importFile = $("#aiImportFile");
          if (importFile) {
            importFile.value = "";
            importFile.click();
          }
          return;
        }
        var addBtn = e.target.closest("[data-add]");
        if (addBtn) {
          e.stopPropagation();
          closeAIModelMenu();
          showModelEditor();
          return;
        }
        var editBtn = e.target.closest("[data-edit]");
        if (editBtn) {
          e.stopPropagation();
          e.preventDefault();
          closeAIModelMenu();
          showModelEditor(editBtn.dataset.edit);
          return;
        }
        var promptBtn = e.target.closest("[data-prompt]");
        if (promptBtn) {
          e.stopPropagation();
          closeAIModelMenu();
          promptSystemPrompt(promptBtn.dataset.prompt);
          return;
        }
        var keyBtn = e.target.closest("[data-key]");
        if (keyBtn) {
          e.stopPropagation();
          promptAPIKey(keyBtn.dataset.key);
          return;
        }
        var testBtn = e.target.closest("[data-test]");
        if (testBtn) {
          e.stopPropagation();
          closeAIModelMenu();
          testAIModelConnection(testBtn.dataset.test);
          return;
        }
        var mdBtn = e.target.closest("[data-md]");
        if (mdBtn) {
          e.stopPropagation();
          downloadAIChatMd(mdBtn.dataset.md);
          return;
        }
        var jsonBtn = e.target.closest("[data-json]");
        if (jsonBtn) {
          e.stopPropagation();
          downloadAIChatJson(jsonBtn.dataset.json);
          return;
        }
        var item = e.target.closest(".ai-model-item");
        if (item) {
          e.stopPropagation();
          closeAIModelMenu();
          selectAIModel(item.dataset.model);
        }
      });
    }

    if (inputEl) {
      inputEl.addEventListener("input", function () {
        this.style.height = "auto";
        this.style.height = Math.min(this.scrollHeight, 140) + "px";
      });
      inputEl.addEventListener("keydown", function (e) {
        if (
          e.key === "Enter" &&
          !e.shiftKey &&
          !e.isComposing &&
          e.keyCode !== 229
        ) {
          e.preventDefault();
          aiSend();
        }
      });
    }

    if (sendBtn) {
      sendBtn.addEventListener("click", function () {
        aiSend();
      });
    }

    var importFile = $("#aiImportFile");
    if (importFile) {
      importFile.addEventListener("change", function () {
        var f = this.files && this.files[0];
        if (!f) return;
        importAIChatFromFile(f);
        this.value = "";
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener("click", function () {
        clearAIChat();
      });
    }
  }

  /* 总渲染入口 */

  function render() {
    var path = getRoute();

    if (path !== "/" && path !== "" && path !== "/index.html") {
      if (runner.mode === "page") {
        runner.mode = "random";
        runner.pageId = null;
      }
    }

    if (path === "/" || path === "" || path === "/index.html") {
      renderRunner();
      return;
    }

    if (appEl.classList.contains("preview-mode")) {
      appEl.classList.remove("preview-mode");
    }
    appEl.classList.remove("ai-mode");
    delete appEl.dataset.currentPageId;
    unlockAppSize();

    destroyEditor();
    appEl.replaceChildren();
    setActiveNav(path);

    if (path === "/ai") {
      appEl.classList.add("ai-mode");
      appEl.appendChild(renderAIAssistant());
      bindAIAssistant();
      return;
    }

    if (path === "/about") {
      appEl.appendChild(renderAbout());
    } else if (path === "/generator") {
      appEl.appendChild(renderGenerator());
      bindGenerator();
    } else {
      var wrap = document.createElement("div");
      wrap.appendChild(el("h1", null, T("page.notFoundTitle", { path: path })));
      wrap.appendChild(el("p", null, T("page.notFoundBody")));
      appEl.appendChild(wrap);
    }
  }

  /* 静态初始化 */

  function initStatic() {
    modalBackdrop = $("#modalBackdrop");
    modalBox = $("#modalBox");
    sidebarPagesEl = $("#sidebar-pages");
    sidebarEl = $("#sidebar");
    overlayEl = $("#overlay");
    hamburgerBtn = $("#hamburgerBtn");
    appEl = $("#app");
    sidebarSearchEl = $("#sidebarSearch");

    var savedTheme = "light";
    try {
      savedTheme = localStorage.getItem(THEME_KEY) || "light";
    } catch (e) {}
    applyTheme(savedTheme);

    ["gesturestart", "gesturechange", "gestureend"].forEach(function (type) {
      document.addEventListener(
        type,
        function (e) {
          e.preventDefault();
        },
        { passive: false },
      );
    });
    document.addEventListener(
      "touchstart",
      function (e) {
        if (e.touches && e.touches.length > 1) e.preventDefault();
      },
      { passive: false },
    );
    document.addEventListener(
      "touchmove",
      function (e) {
        if (e.touches && e.touches.length > 1) e.preventDefault();
      },
      { passive: false },
    );
    var lastTouchEnd = 0;
    document.addEventListener(
      "touchend",
      function (e) {
        var now = Date.now();
        if (now - lastTouchEnd <= 300) {
          var t = e.target;
          var tag = t && t.tagName ? t.tagName.toLowerCase() : "";
          if (
            tag !== "input" &&
            tag !== "textarea" &&
            tag !== "button" &&
            tag !== "select" &&
            tag !== "a"
          ) {
            e.preventDefault();
          }
        }
        lastTouchEnd = now;
      },
      { passive: false },
    );
    document.addEventListener("click", function (e) {
      var menu = $("#aiModelMenu");
      if (!menu || !menu.classList.contains("show")) return;
      var picker = menu.parentNode;
      if (picker && !picker.contains(e.target)) menu.classList.remove("show");
    });

    if (sidebarSearchEl) {
      sidebarSearchEl.addEventListener("input", function () {
        sidebarSearchKeyword = this.value || "";
        updateSidebarPages();
      });
      sidebarSearchEl.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          if (this.value) {
            this.value = "";
            sidebarSearchKeyword = "";
            updateSidebarPages();
          }
          e.stopPropagation();
        } else {
          e.stopPropagation();
        }
      });
      sidebarSearchEl.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }

    hamburgerBtn.addEventListener("click", openSidebar);
    overlayEl.addEventListener("click", closeSidebar);
    modalBackdrop.addEventListener("click", function (e) {
      if (e.target === modalBackdrop) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (modalBackdrop.classList.contains("show")) {
          closeModal();
        } else if (sidebarEl.classList.contains("open")) {
          closeSidebar();
        } else if (runner.mode === "page" && getRoute() === "/") {
          setRandom();
        }
      }
    });

    var exportZipBtn = $("#exportZipSidebar");
    if (exportZipBtn) {
      var runExport = function () {
        closeSidebar();
        exportZip();
      };
      exportZipBtn.addEventListener("click", runExport);
      exportZipBtn.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          runExport();
        }
      });
    }

    var themeBtn = $("#themeToggleSidebar");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    $$(".sidebar .nav-item[data-path]").forEach(function (el) {
      var go = function () {
        var path = el.getAttribute("data-path");
        closeSidebar();
        if (path === "#/") {
          setRandom();
          return;
        }
        if (location.hash === path) render();
        else location.hash = path;
      };
      el.addEventListener("click", go);
      el.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          go();
        }
      });
    });

    sidebarPagesEl.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-action]");
      if (!btn) return;
      var id = Number(btn.dataset.id);
      var action = btn.dataset.action;
      if (action === "open") {
        closeSidebar();
        runPage(id);
      } else if (action === "rename") {
        renamePage(id);
      } else if (action === "delete") {
        deletePage(id);
      }
    });

    window.addEventListener("hashchange", function () {
      render();
      closeSidebar();
    });
    window.addEventListener("orientationchange", function () {
      if (editor) editor.refresh();
    });
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (appEl.classList.contains("preview-mode")) {
        appEl.style.width = window.innerWidth + "px";
        appEl.style.height = window.innerHeight + "px";
      }
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (editor) editor.refresh();
      }, 100);
    });
  }

  /* 加载 content.json → 启动 */

  function loadContent() {
    return fetch(CONTENT_URL, { cache: "no-cache" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        CONTENT = json || {};
        I18N = CONTENT.i18n || {};
        AI_MODELS = (CONTENT.models || []).slice();
        LANG = detectLang();
      });
  }

  function boot() {
    initStatic();
    initAIState();
    applyI18nToStatic();
    updateSidebarPages();
    render();
  }

  loadContent()
    .then(function () {
      boot();
    })
    .catch(function (e) {
      console.warn("[content.json] 加载失败，使用 HTML 默认文案：", e);
      boot();
    });