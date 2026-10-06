/* ============================================================
   home.js —— 首页运行器+侧边栏+主题+共享路由
   作用：首页随机/指定/临时运行+侧边栏+主题切换+路由工具
   机制：iframe srcdoc加载p5脚本；含 sessionImages注入
   加载：依赖core.js + storage.js
   ============================================================ */
(function (App) {
  "use strict";


  /* ============================================================
     共享路由工具（供其他模块调用）
     作用：路由解析+导航高亮+编辑器销毁
     ============================================================ */
  App.getRoute = function () {
    var hash = location.hash;
    if (!hash || hash === "#" || hash === "#/") return "/";
    return hash.replace(/^#/, "") || "/";
  };
  /* 侧边栏高亮：匹配data-path */
  App.setActiveNav = function (path) {
    App.$$(".sidebar .nav-item[data-path]").forEach(function (el) {
      if (el.getAttribute("data-path") === "#" + path) {
        el.setAttribute("aria-current", "page");
      } else {
        el.removeAttribute("aria-current");
      }
    });
  };
  App.destroyEditor = function () {
    if (App.state.editor) {
      try {
        App.state.editor.toTextArea();
      } catch (e) {}
      App.state.editor = null;
    }
  };


  /* ============================================================
     J11 随机p5与srcdoc
     作用：首页随机脚本抽取+iframe srcdoc生成
     机制：currentRandomFile排除上次；srcdoc内嵌CDN+脚本
     ============================================================ */
  App.pickRandomP5File = function () {
    var files = App.P5_FILES;
    if (!files || !files.length) return null;
    if (files.length === 1) return files[0];
    var pool = files.filter(function (f) {
      return f !== App.state.currentRandomFile;
    });
    if (!pool.length) pool = files.slice();
    return pool[Math.floor(Math.random() * pool.length)];
  };
  /* 路径编码：中文/空格等安全化 */
  App.encodePath = function (fileName) {
    return String(fileName)
      .split("/")
      .map(function (seg) {
        return encodeURIComponent(seg);
      })
      .join("/");
  };
  /* srcdoc：完整HTML字符串，交给iframe.srcdoc */
  App.buildP5SrcDoc = function (fileName) {
    var src = App.P5_DIR + App.encodePath(fileName);
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
      App.P5_CDN +
      '">\x3C/script>\n' +
      '  \x3Cscript src="' +
      src +
      '">\x3C/script>\n' +
      "</head>\n" +
      "<body></body>\n" +
      "</html>"
    );
  };


  /* ============================================================
     J12 侧边栏页面列表
     作用：渲染作品列表+关键词过滤
     机制：documentFragment批量插入；data-action委托事件
     ============================================================ */
  App.updateSidebarPages = function () {
    var pages = App.getPages();
    var kw = App.dom.sidebarSearchKeyword.trim().toLowerCase();
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
      var empty = App.el("div", "no-pages");
      empty.textContent = kw ? App.T("nav.noMatch") : App.T("nav.noScripts");
      App.dom.sidebarPagesEl.replaceChildren(empty);
      return;
    }
    var frag = document.createDocumentFragment();
    filtered.forEach(function (page) {
      var item = App.el("div", "page-item");
      var title = App.el("span", "page-title", page.title);
      title.dataset.action = "open";
      title.dataset.id = String(page.id);
      var actions = App.el("div", "actions");
      var renameBtn = App.el("button", "rename", "✎ ");
      renameBtn.title = App.T("common.rename");
      renameBtn.dataset.action = "rename";
      renameBtn.dataset.id = String(page.id);
      var delBtn = App.el("button", "del", " ✕");
      delBtn.title = App.T("common.delete");
      delBtn.dataset.action = "delete";
      delBtn.dataset.id = String(page.id);
      actions.appendChild(renameBtn);
      actions.appendChild(delBtn);
      item.appendChild(title);
      item.appendChild(actions);
      frag.appendChild(item);
    });
    App.dom.sidebarPagesEl.replaceChildren(frag);
  };


  /* ============================================================
     J13 iframe代理
     作用：把外部事件转发到iframe内的canvas，使预览可交互
     机制：MutationObserver等待canvas出现；document捕获事件后构造MouseEvent派发到canvas
     ============================================================ */
  App.bindIframeProxy = function (iframe) {
    var iwin, idoc;
    try {
      iwin = iframe.contentWindow;
      idoc = iframe.contentDocument;
    } catch (e) {
      console.warn("Cannot access iframe document:", e);
      return;
    }
    if (!iwin || !idoc) return;

    function tryAttach() {
      var canvas = idoc.querySelector("canvas");
      if (canvas) {
        App.attachProxy(canvas, iwin, idoc);
        return true;
      }
      return false;
    }
    if (tryAttach()) return;
    var observer = new MutationObserver(function () {
      if (tryAttach()) observer.disconnect();
    });
    observer.observe(idoc.documentElement || idoc, {
      childList: true,
      subtree: true,
    });
    /* 15s 后自动停止观察 */
    setTimeout(function () {
      try {
        observer.disconnect();
      } catch (e) {}
    }, 15000);
  };
  App.attachProxy = function (canvas, iwin, idoc) {
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
    /* 鼠标事件转发 */
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
    /* 触摸事件 → 鼠标事件 */
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
  };


  /* ============================================================
     J14 预览锁定与截图
     作用：预览模式下锁尺寸+截图按钮
     机制：直接改appEl内联style；截图用 canvas.toDataURL
     ============================================================ */
  App.lockAppSize = function () {
    document.body.classList.add("preview-lock");
    var w = window.innerWidth;
    var h = window.innerHeight;
    var appEl = App.dom.appEl;
    appEl.style.position = "fixed";
    appEl.style.top = "0";
    appEl.style.left = "0";
    appEl.style.width = w + "px";
    appEl.style.height = h + "px";
    appEl.style.overflow = "hidden";
  };
  App.unlockAppSize = function () {
    document.body.classList.remove("preview-lock");
    var appEl = App.dom.appEl;
    appEl.style.position = "";
    appEl.style.top = "";
    appEl.style.left = "";
    appEl.style.width = "";
    appEl.style.height = "";
    appEl.style.overflow = "";
  };
  /* 截图按钮：注入iframe，点击后canvas→PNG下载 */
  App.buildScreenshotButton = function (iframe) {
    var btn = App.el("button", "preview-screenshot-btn", "📷");
    btn.id = "screenshotBtn";
    btn.type = "button";
    btn.title = App.T("preview.screenshot");
    btn.addEventListener("click", function () {
      try {
        var doc = iframe.contentDocument;
        if (!doc) throw new Error("no doc");
        var canvas = doc.querySelector("canvas");
        if (!canvas) {
          App.showAlert(
            App.T("preview.screenshot"),
            App.T("preview.noCanvas"),
            true,
          );
          return;
        }
        var dataUrl = canvas.toDataURL("image/png");
        var a = document.createElement("a");
        a.href = dataUrl;
        a.download = "canvas_" + Date.now() + ".png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        App.showAlert(
          App.T("preview.screenshot"),
          App.T("preview.screenshotFail"),
          true,
        );
      }
    });
    return btn;
  };


  /* ============================================================
     J15 首页运行器
     作用：首页根据runner.mode渲染；三种模式切换
     机制：page模式含sessionImages注入（供预览显示图）
     ============================================================ */
  App.renderRunner = function () {
    App.destroyEditor();
    var appEl = App.dom.appEl;
    appEl.replaceChildren();
    appEl.classList.remove("preview-mode");
    appEl.classList.remove("ai-mode");
    App.setActiveNav("/");
    var runner = App.state.runner;
    var html = null;
    /* 指定作品模式 */
    if (runner.mode === "page") {
      var page = App.getPages().find(function (p) {
        return p.id === runner.pageId;
      });
      if (page) {
        html = page.html;
        /* 本次会话有内存图则注入 */
        if (App.state.sessionImages[page.id]) {
          html = App.injectSessionImage(
            html,
            App.state.sessionImages[page.id],
          );
        }
        appEl.dataset.currentPageId = String(page.id);
      } else {
        runner.mode = "random";
        runner.pageId = null;
      }
    }
    /* 临时HTML模式 */
    if (runner.mode === "temp") {
      html = runner.tempHtml || null;
      runner.mode = "random";
      runner.tempHtml = null;
      delete appEl.dataset.currentPageId;
    }
    /* 随机脚本模式（默认） */
    if (html === null) {
      var file = App.pickRandomP5File();
      if (!file) {
        App.unlockAppSize();
        delete appEl.dataset.currentPageId;
        var wrap = document.createElement("div");
        wrap.appendChild(App.el("h1", null, App.T("runner.noScriptTitle")));
        wrap.appendChild(App.el("p", null, App.T("runner.noScriptBody")));
        appEl.appendChild(wrap);
        return;
      }
      App.state.currentRandomFile = file;
      html = App.buildP5SrcDoc(file);
      delete appEl.dataset.currentPageId;
    }
    App.lockAppSize();
    appEl.classList.add("preview-mode");

    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", "p5");
    iframe.setAttribute("scrolling", "no");
    iframe.srcdoc = html;
    iframe.addEventListener("load", function () {
      App.bindIframeProxy(iframe);
    });
    appEl.appendChild(iframe);
    /* 仅指定作品模式显示截图按钮 */
    if (runner.mode === "page") {
      appEl.appendChild(App.buildScreenshotButton(iframe));
    }
  };
  App.setRandom = function () {
    App.state.runner.mode = "random";
    App.state.runner.pageId = null;
    App.state.runner.tempHtml = null;
    if (App.getRoute() === "/") App.render();
    else location.hash = "#/";
  };
  App.runPage = function (id) {
    App.state.runner.mode = "page";
    App.state.runner.pageId = id;
    App.state.runner.tempHtml = null;
    if (App.getRoute() === "/") App.render();
    else location.hash = "#/";
  };
  App.deletePage = function (id) {
    var pages = App.getPages();
    var page = pages.find(function (p) {
      return p.id === id;
    });
    if (!page) return;
    App.showConfirm(
      App.T("page.deleteTitle"),
      App.T("page.deleteBody", { title: page.title }),
      function () {
        var list = App.getPages().filter(function (p) {
          return p.id !== id;
        });
        App.savePages(list);
        App.updateSidebarPages();
        if (App.state.sessionImages[id]) delete App.state.sessionImages[id];
        if (
          App.state.runner.mode === "page" &&
          App.state.runner.pageId === id
        ) {
          App.state.runner.mode = "random";
          App.state.runner.pageId = null;
        }
        App.render();
      },
      true,
    );
  };
  App.renamePage = function (id) {
    var pages = App.getPages();
    var page = pages.find(function (p) {
      return p.id === id;
    });
    if (!page) return;
    App.showPrompt(App.T("page.renameTitle"), page.title, function (newTitle) {
      page.title = newTitle;
      App.savePages(pages);
      App.updateSidebarPages();
      App.render();
    });
  };


  /* ============================================================
     J16 侧边栏与主题
     作用：侧边栏开关+亮/暗主题切换
     机制：body.dark-mode类切换；CodeMirror主题同步
     ============================================================ */
  App.openSidebar = function () {
    App.dom.sidebarEl.classList.add("open");
    App.dom.overlayEl.classList.add("show");
    document.body.classList.add("sidebar-open");
    App.dom.hamburgerBtn.setAttribute("aria-expanded", "true");
  };
  App.closeSidebar = function () {
    App.dom.sidebarEl.classList.remove("open");
    App.dom.overlayEl.classList.remove("show");
    document.body.classList.remove("sidebar-open");
    App.dom.hamburgerBtn.setAttribute("aria-expanded", "false");
  };
  /* 应用主题：切CSS主题+CodeMirror主题 */
  App.applyTheme = function (theme) {
    var lightTheme = App.$("#cm-theme-light");
    var darkTheme = App.$("#cm-theme-dark");
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      if (lightTheme) lightTheme.disabled = true;
      if (darkTheme) darkTheme.disabled = false;
    } else {
      document.body.classList.remove("dark-mode");
      if (lightTheme) lightTheme.disabled = false;
      if (darkTheme) darkTheme.disabled = true;
    }
    if (App.state.editor) {
      try {
        App.state.editor.setOption(
          "theme",
          theme === "dark" ? "dracula" : "default",
        );
      } catch (e) {}
    }
  };
  App.currentTheme = function () {
    return document.body.classList.contains("dark-mode") ? "dark" : "light";
  };
  App.toggleTheme = function () {
    var next = App.currentTheme() === "dark" ? "light" : "dark";
    App.applyTheme(next);
    App.storageSet(App.THEME_KEY, next);
  };

})(window.App);