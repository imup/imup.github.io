import { $, el } from "../core/dom.js";
import { T } from "../core/i18n.js";
import { injectSessionImage } from "../core/page-html.js";
import { showAlert } from "../core/modal.js";
import { getPages, sessionImages } from "../state/pages-state.js";
import { runner, randomFileRef } from "../state/runner.js";

const P5_DIR = "p5/";
const P5_CDN = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js";
const P5_FILES = ["sketch1.js", "sketch2.js", "sketch3.js"];
const MAX_RECORD_MS = 15000;

var _recorderRef = {
  recorder: null,
  stream: null,
  chunks: [],
  timer: null,
  interval: null,
  btn: null,
  mimeType: "",
  aborted: false,
  seconds: 0,
};

function stopRecordingIfAny() {
  if (_recorderRef.recorder) stopRecording(true);
}
window.addEventListener("app:teardown", stopRecordingIfAny);

function pickRandomP5File() {
  if (!P5_FILES || !P5_FILES.length) return null;
  if (P5_FILES.length === 1) return P5_FILES[0];
  var pool = P5_FILES.filter(function (f) { return f !== randomFileRef.current; });
  if (!pool.length) pool = P5_FILES.slice();
  return pool[Math.floor(Math.random() * pool.length)];
}

function encodePath(fileName) {
  return String(fileName).split("/").map(function (s) { return encodeURIComponent(s); }).join("/");
}

function buildP5SrcDoc(fileName) {
  var src = P5_DIR + encodePath(fileName);
  return (
    "<!DOCTYPE html>\n" +
    '<html lang="zh-CN">\n' +
    "<head>\n" +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    "  <style>\n" +
    "    html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: #000; touch-action: none; }\n" +
    "    canvas { display: block; touch-action: none; }\n" +
    "  </style>\n" +
    '  \x3Cscript src="' + P5_CDN + '">\x3C/script>\n' +
    '  \x3Cscript src="' + src + '">\x3C/script>\n' +
    "</head>\n<body></body>\n</html>"
  );
}

function bindIframeProxy(iframe, engine) {
  var iwin, idoc;
  try { iwin = iframe.contentWindow; idoc = iframe.contentDocument; } catch (e) { return; }
  if (!iwin || !idoc) return;
  function ta() {
    var canvas = idoc.querySelector("canvas");
    if (canvas) {
      if (engine === "three") attachPointerProxy(canvas, iwin, idoc);
      else attachProxy(canvas, iwin, idoc);
      return true;
    }
    return false;
  }
  if (ta()) return;
  var obs = new MutationObserver(function () { if (ta()) obs.disconnect(); });
  obs.observe(idoc.documentElement || idoc, { childList: true, subtree: true });
  setTimeout(function () { try { obs.disconnect(); } catch (e) {} }, 15000);
}

function attachProxy(canvas, iwin, idoc) {
  if (canvas.__proxyAttached) return;
  canvas.__proxyAttached = true;
  var MT = ["mousemove", "mousedown", "mouseup", "click", "dblclick"];
  var TT = ["touchstart", "touchmove", "touchend", "touchcancel"];
  function rm(e) {
    if (e.target === canvas) return;
    if ((e.type === "mousedown" || e.type === "mouseup" || e.type === "click" || e.type === "dblclick") && e.button !== 0) return;
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
    } catch (err) { return; }
    canvas.dispatchEvent(ev);
  }
  function rt(e) {
    if (e.target === canvas) return;
    if (!e.touches || !e.touches.length) return;
    var t = e.touches[0];
    var type = e.type === "touchstart" ? "mousedown" : e.type === "touchmove" ? "mousemove" : e.type === "touchend" ? "mouseup" : null;
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
    } catch (err) { return; }
    canvas.dispatchEvent(ev);
  }
  MT.forEach(function (t) { idoc.addEventListener(t, rm, true); });
  TT.forEach(function (t) { idoc.addEventListener(t, rt, { capture: true, passive: true }); });
}

function attachPointerProxy(canvas, iwin, idoc) {
  if (canvas.__pointerAttached) return;
  canvas.__pointerAttached = true;
  var TYPES = ["pointerdown", "pointermove", "pointerup", "pointercancel"];
  function r(e) {
    if (e.target === canvas) return;
    var ev;
    try {
      ev = new iwin.PointerEvent(e.type, {
        bubbles: true,
        cancelable: true,
        view: iwin,
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        isPrimary: e.isPrimary,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        button: e.button,
        buttons: e.buttons,
        width: e.width,
        height: e.height,
        pressure: e.pressure,
      });
    } catch (err) { return; }
    canvas.dispatchEvent(ev);
  }
  TYPES.forEach(function (t) { idoc.addEventListener(t, r, { capture: true, passive: true }); });
}

function lockAppSize() {
  document.body.classList.add("preview-lock");
  var a = $("#app");
  if (!a) return;
  a.style.position = "fixed";
  a.style.top = "0";
  a.style.left = "0";
  a.style.width = window.innerWidth + "px";
  a.style.height = window.innerHeight + "px";
  a.style.overflow = "hidden";
}

function unlockAppSize() {
  document.body.classList.remove("preview-lock");
  var a = $("#app");
  if (!a) return;
  a.style.position = "";
  a.style.top = "";
  a.style.left = "";
  a.style.width = "";
  a.style.height = "";
  a.style.overflow = "";
}

function buildScreenshotButton(iframe) {
  var btn = el("button", "preview-screenshot-btn", "📷");
  btn.id = "screenshotBtn";
  btn.type = "button";
  btn.title = T("preview.screenshot");
  btn.addEventListener("click", function () {
    try {
      var doc = iframe.contentDocument;
      if (!doc) throw new Error("no doc");
      var canvas = doc.querySelector("canvas");
      if (!canvas) {
        showAlert(T("preview.screenshot"), T("preview.noCanvas"), true);
        return;
      }
      var d = canvas.toDataURL("image/png");
      var a = document.createElement("a");
      a.href = d;
      a.download = "canvas_" + Date.now() + ".png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      showAlert(T("preview.screenshot"), T("preview.screenshotFail"), true);
    }
  });
  return btn;
}

function resetRecordUI() {
  var r = _recorderRef;
  if (r.timer) { clearTimeout(r.timer); r.timer = null; }
  if (r.interval) { clearInterval(r.interval); r.interval = null; }
  if (r.btn) {
    r.btn.classList.remove("recording");
    r.btn.textContent = "⏺";
    r.btn.title = T("preview.record");
  }
  var sb = document.getElementById("screenshotBtn");
  if (sb) sb.disabled = false;
  if (r.stream) {
    try { r.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {}
  }
  r.stream = null;
  r.chunks = [];
  r.recorder = null;
  r.aborted = false;
  r.seconds = 0;
  r.mimeType = "";
  r.btn = null;
}

function stopRecording(aborted) {
  var r = _recorderRef;
  if (r.timer) { clearTimeout(r.timer); r.timer = null; }
  if (r.interval) { clearInterval(r.interval); r.interval = null; }
  if (r.recorder && r.recorder.state !== "inactive") {
    r.aborted = !!aborted;
    try { r.recorder.stop(); } catch (e) { resetRecordUI(); }
  } else {
    resetRecordUI();
  }
}

function startRecording(iframe, btn) {
  try {
    var doc = iframe.contentDocument;
    if (!doc) throw new Error("no doc");
    var canvas = doc.querySelector("canvas");
    if (!canvas) {
      showAlert(T("preview.record"), T("preview.noCanvas"), true);
      return;
    }
    if (!canvas.captureStream) {
      showAlert(T("preview.record"), T("preview.recordFail"), true);
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      showAlert(T("preview.record"), T("preview.recordFail"), true);
      return;
    }
    var mime = "";
    var candidates = [
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
      "video/mp4",
    ];
    if (typeof MediaRecorder.isTypeSupported === "function") {
      for (var i = 0; i < candidates.length; i++) {
        if (MediaRecorder.isTypeSupported(candidates[i])) {
          mime = candidates[i];
          break;
        }
      }
    } else {
      mime = "video/webm";
    }
    if (!mime) {
      showAlert(T("preview.record"), T("preview.recordFail"), true);
      return;
    }
    var stream = canvas.captureStream(30);
    var recorder = new MediaRecorder(stream, { mimeType: mime });
    var r = _recorderRef;
    r.recorder = recorder;
    r.stream = stream;
    r.chunks = [];
    r.btn = btn;
    r.mimeType = mime;
    r.aborted = false;
    r.seconds = 0;

    recorder.ondataavailable = function (e) {
      if (e.data && e.data.size) r.chunks.push(e.data);
    };
    recorder.onstop = function () {
      var aborted = r.aborted;
      var chunks = r.chunks.slice();
      var mimeType = r.mimeType;
      resetRecordUI();
      if (aborted || !chunks.length) return;
      try {
        var blob = new Blob(chunks, { type: mimeType });
        var ext = mimeType.indexOf("mp4") >= 0 ? "mp4" : "webm";
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "video_" + Date.now() + "." + ext;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      } catch (err) {
        showAlert(T("preview.record"), String((err && err.message) || err), true);
      }
    };

    requestAnimationFrame(function () {
      if (r.recorder !== recorder || r.aborted) {
        resetRecordUI();
        return;
      }
      recorder.start();
      btn.classList.add("recording");
      btn.textContent = "⏹ 0s";
      btn.title = T("preview.recordStop");
      var sb = document.getElementById("screenshotBtn");
      if (sb) sb.disabled = true;
      r.interval = setInterval(function () {
        r.seconds += 1;
        if (btn) btn.textContent = "⏹ " + r.seconds + "s";
        if (r.seconds >= 15) stopRecording(false);
      }, 1000);
      r.timer = setTimeout(function () { stopRecording(false); }, MAX_RECORD_MS);
    });
  } catch (e) {
    showAlert(T("preview.record"), String((e && e.message) || e), true);
  }
}

function buildRecordButton(iframe) {
  var btn = el("button", "preview-record-btn", "⏺");
  btn.id = "recordBtn";
  btn.type = "button";
  btn.title = T("preview.record");
  btn.addEventListener("click", function () {
    if (_recorderRef.recorder && _recorderRef.recorder.state !== "inactive") {
      stopRecording(false);
    } else {
      startRecording(iframe, btn);
    }
  });
  return btn;
}

export function renderRunner() {
  var appEl = $("#app");
  if (!appEl) return;
  appEl.replaceChildren();
  appEl.classList.remove("preview-mode");
  appEl.classList.remove("ai-mode");

  var html = null;
  var currentPage = null;

  if (runner.mode === "page") {
    var page = getPages().find(function (p) { return p.id === runner.pageId; });
    if (page) {
      currentPage = page;
      html = page.html;
      if (sessionImages[page.id]) html = injectSessionImage(html, sessionImages[page.id]);
      appEl.dataset.currentPageId = String(page.id);
    } else {
      runner.mode = "random";
      runner.pageId = null;
    }
  }

  if (runner.mode === "temp") {
    html = runner.tempHtml || null;
    runner.mode = "random";
    runner.tempHtml = null;
    delete appEl.dataset.currentPageId;
  }

  if (html === null) {
    var file = pickRandomP5File();
    if (!file) {
      unlockAppSize();
      delete appEl.dataset.currentPageId;
      var w = document.createElement("div");
      w.appendChild(el("h1", null, T("runner.noScriptTitle")));
      w.appendChild(el("p", null, T("runner.noScriptBody")));
      appEl.appendChild(w);
      return;
    }
    randomFileRef.current = file;
    html = buildP5SrcDoc(file);
    delete appEl.dataset.currentPageId;
  }

  lockAppSize();
  appEl.classList.add("preview-mode");

  var iframe = document.createElement("iframe");
  iframe.setAttribute("title", "preview");
  iframe.setAttribute("scrolling", "no");
  iframe.srcdoc = html;
  var engine = currentPage ? (currentPage.engine || "p5") : "p5";
  iframe.addEventListener("load", function () { bindIframeProxy(iframe, engine); });
  appEl.appendChild(iframe);

  if (runner.mode === "page" && currentPage) {
    appEl.appendChild(buildScreenshotButton(iframe));
    appEl.appendChild(buildRecordButton(iframe));
  }
}