(function () {
'use strict';

const $ = id => document.getElementById(id);
const appEl         = $('appRoot');
const previewHost   = $('preview');
const previewWrap   = $('previewWrap');
const editorEl      = $('editorSection');
const codeEl        = $('code');
const highlightEl   = $('highlight');
const highlightCode = $('highlightCode');
const gutterEl      = $('gutter');
const badge         = $('badge');
const toastEl       = $('toast');
const fileInput     = $('fileInput');
const dropOverlay   = $('dropOverlay');
const dropOverlayText = dropOverlay.querySelector('.drop-overlay__text');
const btnPreviewMenu = $('btnPreviewMenu');
const previewMenu    = $('previewMenu');
const menuOpenSvg    = $('menuOpenSvg');
const menuInsertImage= $('menuInsertImage');
const menuCopyPng    = $('menuCopyPng');
const menuCopySvg    = $('menuCopySvg');
const menuSavePng    = $('menuSavePng');
const menuSaveSvg    = $('menuSaveSvg');
const btnRotate90    = $('btnRotate90');
const btnRotateReset = $('btnRotateReset');
const btnUndo = $('btnUndo');
const btnRedo = $('btnRedo');
const btnFormat     = $('btnFormat');
const btnFind       = $('btnFind');
const btnEditorMenu = $('btnEditorMenu');
const editorMenu    = $('editorMenu');
const menuWrap      = $('menuWrap');
const menuHighlightLine = $('menuHighlightLine');
const menuAutoIndent = $('menuAutoIndent');
const menuHistory    = $('menuHistory');
const menuResetExample = $('menuResetExample');
const menuClearDraft = $('menuClearDraft');
const zoomInBtn     = $('zoomIn');
const zoomOutBtn    = $('zoomOut');
const zoomResetBtn  = $('zoomReset');
const zoomLabel     = zoomResetBtn;
const bgBtns        = Array.from(document.querySelectorAll('.bg-btn'));
const splitterEl    = $('splitter');
const splitterGrips = Array.from(document.querySelectorAll('.tool-grip'));
const warningBar   = $('warningBar');
const warningText  = $('warningText');
const warningClose = $('warningClose');
const findPanel      = $('findPanel');
const findInput      = $('findInput');
const replaceInput   = $('replaceInput');
const findPrev       = $('findPrev');
const findNext       = $('findNext');
const findReplace    = $('findReplace');
const findReplaceAll = $('findReplaceAll');
const findClose      = $('findClose');
const modalMask      = $('modalMask');
const modalTitle     = $('modalTitle');
const modalSubtitle  = $('modalSubtitle');
const exportWInput   = $('exportW');
const exportHInput   = $('exportH');
const exportLock     = $('exportLock');
const exportHint     = $('exportHint');
const formatRow      = $('formatRow');
const exportFormat   = $('exportFormat');
const bgRow          = $('bgRow');
const exportWhiteBg  = $('exportWhiteBg');
const viewBoxRow     = $('viewBoxRow');
const exportScaleViewBox = $('exportScaleViewBox');
const exportOriginal = $('exportOriginal');
const exportCancel   = $('exportCancel');
const exportConfirm  = $('exportConfirm');
const historyMask  = $('historyMask');
const historyList  = $('historyList');
const historyClear = $('historyClear');
const historyClose = $('historyClose');
const imageFileInput       = $('imageFileInput');
const imageConfigMask      = $('imageConfigMask');
const imageConfigPreview   = $('imageConfigPreview');
const imageConfigRatio     = $('imageConfigRatio');
const imageConfigCustomRow = $('imageConfigCustomRow');
const imageConfigCustomW   = $('imageConfigCustomW');
const imageConfigCustomH   = $('imageConfigCustomH');
const imageConfigShape     = $('imageConfigShape');
const imageConfigRxRow     = $('imageConfigRxRow');
const imageConfigRx        = $('imageConfigRx');
const imageConfigCompress  = $('imageConfigCompress');
const imageConfigCancel    = $('imageConfigCancel');
const imageConfigConfirm   = $('imageConfigConfirm');
const imageConfigFillRadios   = Array.from(document.querySelectorAll('input[name="imageConfigFill"]'));
const imageConfigInsertRadios = Array.from(document.querySelectorAll('input[name="imageConfigInsert"]'));
const attrPanel            = $('attrPanel');
const attrPanelTag         = $('attrPanelTag');
const attrPanelId          = $('attrPanelId');
const attrPanelWarning     = $('attrPanelWarning');
const attrPanelBody        = $('attrPanelBody');
const attrPanelClose       = $('attrPanelClose');
const attrPanelLocate      = $('attrPanelLocate');
const btnMobileViewMenu = $('btnMobileViewMenu');
const mobileViewMenu    = $('mobileViewMenu');
const menuViewCode      = $('menuViewCode');
const menuViewAttr      = $('menuViewAttr');

let currentSvg   = null;
let lastGoodCode = null;
let renderTimer  = null;
let toastTimer   = null;
let draftTimer   = null;
let previewScale = 1;
let previewPanX  = 0;
let previewPanY  = 0;
let previewRotation = 0;
let exportState  = null;
let isWrapMode   = false;
let splitState = 'default';
let splitRatio = 0.8;
let highlightCurrentLineEnabled = true;
let autoIndentEnabled = true;
let isFitMode = true;

const imageImportState = {
  file: null, dataUrl: '', originalW: 0, originalH: 0,
  ratio: 'original', customW: 100, customH: 100,
  shape: 'rect', rx: 12,
  fillMode: 'slice', insertMode: 'replace',
  compress: true, busy: false
};
let selectedPath = null;
let attrPanelOpen = false;
let attrCommitTimer = 0;
let suppressAttrRebuild = false;
let mobileView = 'code';
function isMobileViewport() {
  return window.innerWidth <= 480;
}
const MAX_SIDE      = 4096;
const DRAFT_KEY     = 'svg-editor.draft.v1';
const HISTORY_KEY   = 'svg-editor.history.v1';
const HISTORY_MAX   = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DEFAULT_CODE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
  <circle cx="50" cy="50" r="50" fill="#33FAFC" />
  <g stroke="#000000" stroke-width="2.0" stroke-linecap="round">
    <line x1="34" y1="50" x2="50" y2="50" />
    <line x1="66" y1="34" x2="66" y2="50" />
    <line x1="50" y1="66" x2="66" y2="66" />
  </g>
  <g fill="#000000">
    <circle cx="34" cy="34" r="3.0" />
    <circle cx="50" cy="34" r="3.0" />
    <circle cx="66" cy="34" r="3.0" />
    <circle cx="34" cy="50" r="3.0" />
    <circle cx="50" cy="50" r="3.0" />
    <circle cx="66" cy="50" r="3.0" />
    <circle cx="34" cy="66" r="3.0" />
    <circle cx="50" cy="66" r="3.0" />
    <circle cx="66" cy="66" r="3.0" />
  </g>
</svg>`;
let cachedPreviewRect = null;
function getPreviewRect() {
  if (!cachedPreviewRect) cachedPreviewRect = previewHost.getBoundingClientRect();
  return cachedPreviewRect;
}
function invalidatePreviewRect() { cachedPreviewRect = null; }

let canvasRootMode = false;
let canvasBackPath = null;  

function stamp() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}`
       + `-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}
function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add('is-show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-show'), 2400);
}
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

const errorEl = document.createElement('div');
errorEl.className = 'error';
errorEl.hidden = true;
errorEl.setAttribute('role', 'alert');
previewWrap.appendChild(errorEl);
function showError(msg) {
  if (msg) { errorEl.textContent = msg; errorEl.hidden = false; warningBar.hidden = true; }
  else { errorEl.hidden = true; errorEl.textContent = ''; }
}
function showWarning(msg) {
  if (!errorEl.hidden) return;
  warningText.textContent = msg;
  warningBar.hidden = false;
}
function hideWarning() { warningBar.hidden = true; }

function updateButtons() {
  const ok = !!currentSvg;
  btnPreviewMenu.disabled = !ok;
  [menuCopyPng, menuCopySvg, menuSavePng, menuSaveSvg, btnRotate90, btnRotateReset]
    .forEach(b => b.disabled = !ok);
}

function parseSVG(code) {
  const doc = new DOMParser().parseFromString(code, 'image/svg+xml');
  const errNode = doc.querySelector('parsererror');
  if (errNode) {
    const detail = (errNode.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180);
    const lineInfo = extractErrorLine(errNode.textContent || '');
    const suffix = lineInfo ? `（第 ${lineInfo.line} 行附近）` : '';
    throw new Error('SVG 语法错误：' + detail + suffix);
  }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') throw new Error('根元素必须是 <svg>');
  sanitize(root);
  ensureNamespaces(root);
  return root;
}
function extractErrorLine(text) {
  let m = text.match(/line\s+(\d+)/i);
  if (m) return { line: parseInt(m[1], 10) };
  m = text.match(/Line Number[:\s]+(\d+)/i);
  if (m) return { line: parseInt(m[1], 10) };
  return null;
}
function sanitize(root) {
  const DANGEROUS = new Set(['script','iframe','object','embed','meta','link']);
  const nodes = [root, ...Array.from(root.querySelectorAll('*'))];
  const toRemove = [];
  nodes.forEach(el => {
    const tag = (el.nodeName || '').toLowerCase();
    if (DANGEROUS.has(tag)) { toRemove.push(el); return; }
    if (!el.attributes) return;
    Array.from(el.attributes).forEach(attr => {
      const name = attr.name.toLowerCase();
      const value = (attr.value || '').trim().toLowerCase();
      if (name.startsWith('on')) el.removeAttribute(attr.name);
      else if ((name === 'href' || name === 'xlink:href' || name === 'src') && value.startsWith('javascript:'))
        el.removeAttribute(attr.name);
    });
  });
  toRemove.forEach(el => { try { el.remove(); } catch(_) {} });
}
function ensureNamespaces(root) {
  if (!root.getAttribute('xmlns')) root.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  let usesXlink = false;
  const nodes = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const el of nodes) {
    if (!el.attributes) continue;
    for (const attr of Array.from(el.attributes)) {
      if (attr.name.toLowerCase().startsWith('xlink:')) { usesXlink = true; break; }
    }
    if (usesXlink) break;
  }
  if (usesXlink && !root.getAttribute('xmlns:xlink'))
    root.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
}
const RESOURCE_TAGS = ['image','use','feimage'];
function detectExternalRefs(root) {
  const refs = [];
  const nodes = [root, ...Array.from(root.querySelectorAll('*'))];
  for (const el of nodes) {
    const tag = el.nodeName.toLowerCase();
    if (!RESOURCE_TAGS.includes(tag)) continue;
    const href = el.getAttribute('href') || el.getAttribute('xlink:href');
    if (!href) continue;
    const v = href.trim();
    if (!v || v.startsWith('data:') || v.startsWith('#')) continue;
    refs.push(v);
    if (refs.length >= 3) break;
  }
  return refs;
}
function parseLength(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (s.endsWith('%')) return null;
  const n = parseFloat(s);
  return isFinite(n) && n > 0 ? n : null;
}
function getSize(svg) {
  let vbBox = null;
  const vb = svg.getAttribute('viewBox');
  if (vb) {
    const p = vb.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) vbBox = { w: p[2], h: p[3] };
  }
  const w = parseLength(svg.getAttribute('width'));
  const h = parseLength(svg.getAttribute('height'));
  if (w && h) return { width: w, height: h };
  if (vbBox) {
    if (w && !h) return { width: w, height: w * vbBox.h / vbBox.w };
    if (h && !w) return { width: h * vbBox.w / vbBox.h, height: h };
    return { width: vbBox.w, height: vbBox.h };
  }
  if (w && !h) return { width: w, height: w * 0.75 };
  if (h && !w) return { width: h * 0.75, height: h };
  return { width: 800, height: 600 };
}
function serializeSVG(svg, width, height, scaleViewBox) {
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  if (width != null && height != null) {
    clone.setAttribute('width',  String(width));
    clone.setAttribute('height', String(height));
  }
  if (scaleViewBox) {
    const vb = clone.getAttribute('viewBox');
    if (vb) {
      const p = vb.trim().split(/[\s,]+/).map(Number);
      if (p.length === 4 && p[2] > 0 && p[3] > 0) {
        const ratio = (width != null && height != null)
          ? Math.min(width / p[2], height / p[3]) : 1;
        clone.setAttribute('viewBox', [p[0], p[1], p[2] * ratio, p[3] * ratio].join(' '));
      }
    }
  }
  let xml = new XMLSerializer().serializeToString(clone);
  if (!/^\s*<\?xml/.test(xml)) xml = '<?xml version="1.0" encoding="UTF-8"?>\n' + xml;
  return xml;
}

const shadow = previewHost.attachShadow({ mode: 'open' });
shadow.innerHTML = `
  <style>
    :host { display: block; width: 100%; height: 100%; }
    .stage {
      position: relative; width: 100%; height: 100%;
      overflow: hidden; background: #ffffff;
    }
    .stage.bg-checker {
      background-color: #f8fafc;
      background-image:
        linear-gradient(45deg, #e2e8f0 25%, transparent 25%),
        linear-gradient(-45deg, #e2e8f0 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #e2e8f0 75%),
        linear-gradient(-45deg, transparent 75%, #e2e8f0 75%);
      background-size: 16px 16px;
      background-position: 0 0, 0 8px, 8px -8px, -8px 0;
    }
    .stage.bg-white { background: #ffffff; }
    .stage.bg-dark  { background: #0f172a; }
    .canvas {
      position: absolute; left: 50%; top: 50%;
      transform-origin: center center;
      will-change: transform; transition: opacity .2s;
      outline: 1px solid rgba(200, 200, 200, 0.5);
      outline-offset: -1px;
    }
    .canvas > * { display: block; }
    .canvas a, .canvas a * { pointer-events: none; cursor: default; }
    .stage.is-stale .canvas { opacity: 0.35; }

    /* 选中高亮叠加层 */
    .selection-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
      z-index: 10;
    }
    /* 四边用 repeating-linear-gradient 绘制虚线：跨浏览器一致，不受元素宽高比影响 */
    .selection-box {
      position: absolute;
      pointer-events: none;
      box-sizing: border-box;
      background:
        /* 上边 */
        repeating-linear-gradient(to right, #2563eb 0 5px, transparent 5px 9px) 0 0 / 100% 1.5px no-repeat,
        /* 下边 */
        repeating-linear-gradient(to right, #2563eb 0 5px, transparent 5px 9px) 0 100% / 100% 1.5px no-repeat,
        /* 左边 */
        repeating-linear-gradient(to bottom, #2563eb 0 5px, transparent 5px 9px) 0 0 / 1.5px 100% no-repeat,
        /* 右边 */
        repeating-linear-gradient(to bottom, #2563eb 0 5px, transparent 5px 9px) 100% 0 / 1.5px 100% no-repeat,
        /* 浅蓝填充 */
        rgba(37, 99, 235, 0.04);
    }
  </style>
  <div class="stage bg-checker">
    <div class="canvas"></div>
    <div class="selection-overlay"></div>
  </div>
`;
const stageEl  = shadow.querySelector('.stage');
const canvasEl = shadow.querySelector('.canvas');
const selectionOverlayEl = shadow.querySelector('.selection-overlay');

class DomRenderer {
  constructor() { this.host = null; this.type = 'dom'; }
  getType() { return this.type; }
  async mount(hostEl, svgRoot, size) {
    this.host = hostEl;
    const node = document.importNode(svgRoot, true);
    node.setAttribute('width',  String(Math.round(size.width)));
    node.setAttribute('height', String(Math.round(size.height)));
    hostEl.replaceChildren(node);
    try {
      const anims = node.querySelectorAll(
        'animate, animateTransform, animateMotion, animateColor, set'
      );
      anims.forEach(a => {
        try { a.beginElement(); } catch (_) {}
      });
    } catch (_) {}
  }
  unmount() { if (this.host) this.host.replaceChildren(); }
  destroy() { this.unmount(); this.host = null; }
  async exportBlob({ markup, width, height, format, whiteBg }) {
    return canvas2dExportBlob(markup, width, height, format, whiteBg);
  }
}

async function canvas2dExportBlob(markup, width, height, format, whiteBg) {
  const isJpg = format === 'jpg';
  const needWhite = isJpg || whiteBg;
  const mime = isJpg ? 'image/jpeg' : `image/${format}`;
  const quality = (format === 'png') ? undefined : 0.92;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建 canvas 上下文');
  if (needWhite) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }

  const blobUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('SVG 无法渲染为图像，可能引用了外部资源'));
      img.src = blobUrl;
    });
    ctx.drawImage(img, 0, 0, width, height);
  } finally { URL.revokeObjectURL(blobUrl); }

  const hasDataImage = /<image\b[^>]*(?:href|xlink:href)\s*=\s*["']data:/i.test(markup);
  if (hasDataImage) {
    try {
      await drawDataImagesToCanvas(ctx, markup, width, height);
    } catch (err) {
      console.warn('[export] 手动绘制图片失败：', err);
    }
  }

  const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
  if (!blob) throw new Error('图像生成失败');
  return blob;
}

function loadImageFromUrl(url) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error('图片加载失败'));
    im.src = url;
  });
}

function applyClipShapeToCtx(ctx, shapeEl, sx, sy, offsetX, offsetY) {
  const tag = shapeEl.localName.toLowerCase();
  const num = (a, d) => { const v = parseFloat(shapeEl.getAttribute(a)); return isFinite(v) ? v : d; };
  ctx.beginPath();

  if (tag === 'rect') {
    const x = num('x', 0), y = num('y', 0);
    const w = num('width', 0), h = num('height', 0);
    const rx = num('rx', 0), ry = num('ry', 0);
    const px = x * sx + offsetX, py = y * sy + offsetY;
    const pw = w * sx, ph = h * sy;
    const r = Math.min(rx * sx, ry * sy, pw / 2, ph / 2);
    if (r > 0) {
      ctx.moveTo(px + r, py);
      ctx.arcTo(px + pw, py, px + pw, py + ph, r);
      ctx.arcTo(px + pw, py + ph, px, py + ph, r);
      ctx.arcTo(px, py + ph, px, py, r);
      ctx.arcTo(px, py, px + pw, py, r);
      ctx.closePath();
    } else {
      ctx.rect(px, py, pw, ph);
    }
  } else if (tag === 'circle') {
    const cx = num('cx', 0), cy = num('cy', 0), r = num('r', 0);
    ctx.arc(cx * sx + offsetX, cy * sy + offsetY, r * Math.min(Math.abs(sx), Math.abs(sy)), 0, Math.PI * 2);
  } else if (tag === 'ellipse') {
    const cx = num('cx', 0), cy = num('cy', 0);
    const rx = num('rx', 0), ry = num('ry', 0);
    ctx.ellipse(cx * sx + offsetX, cy * sy + offsetY, Math.abs(rx * sx), Math.abs(ry * sy), 0, 0, Math.PI * 2);
  }
}

function computeParDrawRect(img, boxX, boxY, boxW, boxH, par) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (!iw || !ih) return null;
  const meet = par.includes('meet');
  const isSlice = !meet;

  let dw, dh, dx, dy;
  const sx = 0, sy = 0, sw = iw, sh = ih;

  if (isSlice) {
    const k = Math.max(boxW / iw, boxH / ih);
    dw = iw * k; dh = ih * k;
    dx = boxX + (boxW - dw) / 2;
    dy = boxY + (boxH - dh) / 2;
  } else {
    const k = Math.min(boxW / iw, boxH / ih);
    dw = iw * k; dh = ih * k;
    dx = boxX + (boxW - dw) / 2;
    dy = boxY + (boxH - dh) / 2;
  }
  return { sx, sy, sw, sh, dx, dy, dw, dh, needClip: isSlice };
}

async function drawDataImagesToCanvas(ctx, markup, canvasW, canvasH) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root) return;

  let vb = { x: 0, y: 0, w: canvasW, h: canvasH };
  const vbAttr = root.getAttribute('viewBox');
  if (vbAttr) {
    const p = vbAttr.trim().split(/[\s,]+/).map(Number);
    if (p.length === 4 && p[2] > 0 && p[3] > 0) {
      vb = { x: p[0], y: p[1], w: p[2], h: p[3] };
    }
  }
  const sx = canvasW / vb.w;
  const sy = canvasH / vb.h;
  const offsetX = -vb.x * sx;
  const offsetY = -vb.y * sy;

  const clipMap = {};
  root.querySelectorAll('clipPath').forEach(cp => {
    const id = cp.getAttribute('id');
    if (!id) return;
    const shape = cp.firstElementChild;
    if (shape) clipMap[id] = shape;
  });

  const images = [];
  root.querySelectorAll('image').forEach(img => {
    const href = img.getAttribute('href') || img.getAttribute('xlink:href');
    if (!href || !href.startsWith('data:')) return;
    const x = parseFloat(img.getAttribute('x'));
    const y = parseFloat(img.getAttribute('y'));
    const w = parseFloat(img.getAttribute('width'));
    const h = parseFloat(img.getAttribute('height'));
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
    const par = img.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
    const clipAttr = img.getAttribute('clip-path') || '';
    const cidMatch = clipAttr.match(/url\(#([^)]+)\)/);
    const clipEl = cidMatch ? clipMap[cidMatch[1]] : null;
    images.push({
      href,
      x: isFinite(x) ? x : 0,
      y: isFinite(y) ? y : 0,
      w, h, par, clipEl
    });
  });

  for (const t of images) {
    let im;
    try { im = await loadImageFromUrl(t.href); } catch (_) { continue; }

    const drawRect = computeParDrawRect(
      im,
      t.x * sx + offsetX,
      t.y * sy + offsetY,
      t.w * sx,
      t.h * sy,
      t.par
    );
    if (!drawRect) continue;

    ctx.save();

    if (t.clipEl) {
      applyClipShapeToCtx(ctx, t.clipEl, sx, sy, offsetX, offsetY);
      ctx.clip();
    } else if (drawRect.needClip) {
      ctx.beginPath();
      ctx.rect(t.x * sx + offsetX, t.y * sy + offsetY, t.w * sx, t.h * sy);
      ctx.clip();
    }

    ctx.drawImage(
      im,
      drawRect.sx, drawRect.sy, drawRect.sw, drawRect.sh,
      drawRect.dx, drawRect.dy, drawRect.dw, drawRect.dh
    );

    ctx.restore();
  }
}

const domRenderer = new DomRenderer();

function applyPreviewTransform() {
  if (!currentSvg) return;
  const s = previewScale;
  canvasEl.style.transformOrigin = 'center center';
  canvasEl.style.transform =
    `translate(calc(-50% + ${previewPanX}px), calc(-50% + ${previewPanY}px)) ` +
    `rotate(${previewRotation}deg) scale(${s})`;
  zoomLabel.textContent = Math.round(s * 100) + '%';
  scheduleRefreshSelectionOverlay();
}
function fitToView() {
  if (!currentSvg) return;
  const size = getSize(currentSvg);
  const rect = getPreviewRect();
  const pad = 40;
  const rotated = previewRotation % 180 !== 0;
  const dispW = rotated ? size.height : size.width;
  const dispH = rotated ? size.width  : size.height;
  const s = Math.min((rect.width - pad) / dispW, (rect.height - pad) / dispH, 1);
  previewScale = clamp(s, 0.05, 20);
  previewPanX = 0;
  previewPanY = 0;
  isFitMode = true;
  applyPreviewTransform();
}
function updateBadge(width, height) {
  badge.textContent = `${Math.round(width)} × ${Math.round(height)}`;
  badge.hidden = false;
}
async function renderPreview() {
  const code = codeEl.value;
  if (!code.trim()) {
    currentSvg = null; lastGoodCode = null;
    domRenderer.destroy();
    showError(''); hideWarning();
    badge.hidden = true;
    stageEl.classList.remove('is-stale');
    updateButtons();
    closeAttrPanel();
    return;
  }
  if (code === lastGoodCode) {
    showError('');
    stageEl.classList.remove('is-stale');
    return;
  }
  let svg;
  try { svg = parseSVG(code); }
  catch (err) {
    showError(err.message || 'SVG 解析失败');
    locateErrorInEditor(err.message);
    stageEl.classList.add('is-stale');
    return;
  }
  showError('');
  stageEl.classList.remove('is-stale');
  currentSvg = svg;
  lastGoodCode = code;
  const refs = detectExternalRefs(svg);
  if (refs.length > 0) {
    const first = refs[0];
    const shown = first.length > 50 ? first.slice(0, 50) + '…' : first;
    const more = refs.length > 1 ? ` 等 ${refs.length} 处` : '';
    showWarning(`检测到外部引用：${shown}${more}，导出 PNG 可能失败`);
  } else { hideWarning(); }
  const size = getSize(svg);
  try {
    await domRenderer.mount(canvasEl, svg, size);
  } catch (err) {
    console.error(err);
    showToast('预览渲染失败：' + (err.message || '未知错误'));
    return;
  }
  updateBadge(size.width, size.height);
  if (isFitMode) fitToView();
  updateButtons();

  if (selectedPath) {
    const newEl = resolvePath(currentSvg, selectedPath);
    if (newEl && newEl !== canvasEl.firstElementChild) {
      applySelectionOutline(newEl);
      if (!suppressAttrRebuild && attrPanelOpen) rebuildAttrPanel();
    } else {
      clearSelection();
    }
  }
}
function locateErrorInEditor(msg) {
  const m = msg.match(/第\s*(\d+)\s*行/);
  if (!m) return;
  const lineNo = parseInt(m[1], 10);
  if (!lineNo) return;
  const lines = codeEl.value.split('\n');
  let offset = 0;
  for (let i = 0; i < lineNo - 1 && i < lines.length; i++) offset += lines[i].length + 1;
  const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
  const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
  codeEl.scrollTop = Math.max(0, (lineNo - 2) * lineHeight - codeEl.clientHeight / 3 + padTop);
  syncScroll();
  try { codeEl.setSelectionRange(offset, offset + (lines[lineNo - 1] || '').length); } catch(_) {}
}
function schedulePreviewRender() {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPreview, 250);
}

function isIOSLike() {
  if (navigator.userAgentData) return navigator.userAgentData.platform === 'iOS';
  return /iPhone|iPad|iPod/.test(navigator.userAgent) ||
         (navigator.maxTouchPoints > 2 && /Macintosh/.test(navigator.userAgent));
}
async function saveWithFilePicker(blob, filename) {
  const ext = blob.type === 'image/jpeg' ? 'jpg'
            : blob.type === 'image/webp' ? 'webp'
            : blob.type === 'image/svg+xml' ? 'svg' : 'png';
  const types = [{ description: 'File', accept: { [blob.type]: ['.' + ext] } }];
  const handle = await window.showSaveFilePicker({ suggestedName: filename, types });
  const writable = await handle.createWritable();
  await writable.write(blob);
  await writable.close();
  showToast('已保存');
}
function fallbackDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.style.display = 'none';
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function downloadBlob(blob, filename) {
  const file = new File([blob], filename, { type: blob.type });
  if (isIOSLike() && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] }).catch(err => {
      if (err && (err.name === 'AbortError' || err.name === 'InvalidStateError')) return;
      showToast('分享失败：' + ((err && err.message) || '请长按预览图另存'));
    });
    return;
  }
  if (window.showSaveFilePicker && !isIOSLike()) {
    saveWithFilePicker(blob, filename).catch(err => {
      if (err && err.name === 'AbortError') return;
      fallbackDownload(blob, filename);
    });
    return;
  }
  fallbackDownload(blob, filename);
}
function exportSVG(width, height, scaleViewBox) {
  if (!currentSvg) return;
  try {
    const markup = serializeSVG(currentSvg, width, height, scaleViewBox);
    const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
    downloadBlob(blob, `svg-${stamp()}.svg`);
    showToast(`SVG 已保存（${width} × ${height}）`);
  } catch (err) {
    console.error(err);
    showToast('SVG 保存失败：' + (err.message || '未知错误'));
  }
}
async function exportImage(width, height, format, whiteBg, scaleViewBox) {
  if (!currentSvg) return;
  try {
    const markup = serializeSVG(currentSvg, width, height, scaleViewBox);
    const blob = await domRenderer.exportBlob({ markup, width, height, format, whiteBg });
    const ext = blob.type === 'image/jpeg' ? 'jpg'
              : blob.type === 'image/webp' ? 'webp' : 'png';
    downloadBlob(blob, `svg-${stamp()}.${ext}`);
    showToast(`${ext.toUpperCase()} 已保存（${width} × ${height}，${whiteBg ? '白底' : '透明'}）`);
  } catch (err) {
    console.error(err);
    showToast('图像导出失败：' + (err.message || '未知错误'));
  }
}
function openExportModal(format) {
  if (!currentSvg) return;
  const size = getSize(currentSvg);
  const ow = Math.round(size.width), oh = Math.round(size.height);
  exportState = {
    mode: format, originWidth: ow, originHeight: oh,
    lockRatio: true, hasViewBox: !!currentSvg.getAttribute('viewBox')
  };
  modalTitle.textContent = format === 'svg' ? '导出 SVG' : '导出图片';
  exportWInput.value = ow;
  exportHInput.value = oh;
  exportLock.textContent = '🔒';
  exportLock.classList.add('is-locked');
  exportLock.setAttribute('aria-pressed', 'true');
  const isSvg = format === 'svg';
  const hasFO = !isSvg && !!currentSvg.querySelector('foreignObject');
  if (hasFO) {
    exportHint.textContent = '此 SVG 包含 <foreignObject>，部分浏览器/环境导出可能不完整。';
    exportHint.hidden = false;
  } else if (!exportState.hasViewBox) {
    exportHint.textContent = '此 SVG 没有 viewBox，修改尺寸可能导致内容被裁切或留白。';
    exportHint.hidden = false;
  } else exportHint.hidden = true;
  formatRow.hidden = isSvg;
  if (!isSvg && format === 'png') exportFormat.value = 'png';
  const isJpg = !isSvg && exportFormat.value === 'jpg';
  bgRow.hidden = isSvg || isJpg;
  exportWhiteBg.checked = false;
  viewBoxRow.hidden = !(exportState.hasViewBox && !isSvg);
  exportScaleViewBox.checked = false;
  exportConfirm.textContent = isIOSLike() ? '保存 / 分享' : '导出';
  modalSubtitle.textContent = isIOSLike()
    ? '设置尺寸后点击保存，在系统分享面板中选择“存储到照片”或“存储到文件”'
    : (isSvg ? '设置输出尺寸，点击导出即可保存' : '选择格式与尺寸，点击导出即可保存');
  modalMask.hidden = false;
  if (window.matchMedia('(hover: hover)').matches) {
    exportWInput.focus(); exportWInput.select();
  }
}
function closeExportModal() { modalMask.hidden = true; exportState = null; }
function syncHeightFromWidth() {
  if (!exportState || !exportState.lockRatio) return;
  const w = parseInt(exportWInput.value, 10);
  if (w > 0) {
    const ratio = exportState.originWidth / exportState.originHeight;
    exportHInput.value = Math.max(1, Math.round(w / ratio));
  }
}
function syncWidthFromHeight() {
  if (!exportState || !exportState.lockRatio) return;
  const h = parseInt(exportHInput.value, 10);
  if (h > 0) {
    const ratio = exportState.originWidth / exportState.originHeight;
    exportWInput.value = Math.max(1, Math.round(h * ratio));
  }
}
function confirmExport() {
  if (!exportState) return;
  const w = parseInt(exportWInput.value, 10);
  const h = parseInt(exportHInput.value, 10);
  if (!w || !h || w <= 0 || h <= 0 || !isFinite(w) || !isFinite(h)) {
    showToast('请输入有效的宽度和高度'); return;
  }
  if (w > MAX_SIDE || h > MAX_SIDE) { showToast(`单边尺寸不能超过 ${MAX_SIDE}px`); return; }
  const mode = exportState.mode;
  const format = mode === 'svg' ? 'svg' : exportFormat.value;
  const isJpg = format === 'jpg';
  const whiteBg = isJpg || exportWhiteBg.checked;
  const scaleVB = !viewBoxRow.hidden && exportScaleViewBox.checked;
  closeExportModal();
  if (mode === 'svg') exportSVG(w, h, scaleVB);
  else exportImage(w, h, format, whiteBg, scaleVB);
}

function setFlex(el, grow, basis, minH) {
  el.style.flexGrow = String(grow);
  el.style.flexShrink = '1';
  el.style.flexBasis = basis || '0';
  el.style.minHeight = (minH || 0) + 'px';
}
let splitViewRafId = 0;
function scheduleApplyViewAfterSplit() {
  if (splitViewRafId) return;
  splitViewRafId = requestAnimationFrame(() => {
    splitViewRafId = 0;
    invalidatePreviewRect();
    if (currentSvg) applyPreviewTransform();
  });
}
function applySplit() {
  const isMobile = window.innerWidth <= 480;
  const minEditor = isMobile ? 100 : 120;
  const minPreview = 80;
  if (splitState === 'preview-max') {
    setFlex(previewWrap, 100, '0', minPreview);
    setFlex(editorEl, 0.001, minEditor + 'px', minEditor);
  } else if (splitState === 'code-max') {
    setFlex(previewWrap, 0.001, minPreview + 'px', minPreview);
    setFlex(editorEl, 100, '0', minEditor);
  } else {
    setFlex(previewWrap, splitRatio * 100, '0', minPreview);
    setFlex(editorEl, (1 - splitRatio) * 100, '0', minEditor);
  }
  scheduleApplyViewAfterSplit();
}
let isSplitting = false, pointerCaptured = false, splitHasMoved = false;
let splitStartY = 0, splitStartH = 0;
let lastSplitDownTime = 0, lastSplitDownY = 0;
const DBLCLICK_INTERVAL = 350;
const DBLCLICK_DISTANCE = 10;
function getPreviewHeight() { return previewWrap.getBoundingClientRect().height; }
function onSplitterPointerDown(e) {
  if (e.target.closest('.tool-btn') || e.target.closest('.dropdown')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const now = Date.now();
  if (now - lastSplitDownTime < DBLCLICK_INTERVAL &&
      Math.abs(e.clientY - lastSplitDownY) < DBLCLICK_DISTANCE) {
    lastSplitDownTime = 0; lastSplitDownY = 0; isSplitting = false;
    if (pointerCaptured) {
      try { splitterEl.releasePointerCapture(e.pointerId); } catch(_) {}
      pointerCaptured = false;
    }
    resetSplitToDefault();
    return;
  }
  lastSplitDownTime = now; lastSplitDownY = e.clientY;
  isSplitting = true; splitHasMoved = false;
  splitStartY = e.clientY; splitStartH = getPreviewHeight();
  try { splitterEl.setPointerCapture(e.pointerId); } catch(_) {}
  pointerCaptured = true;
  document.body.style.cursor = 'ns-resize';
  document.body.style.userSelect = 'none';
}
function onSplitterPointerMove(e) {
  if (!isSplitting) return;
  const delta = e.clientY - splitStartY;
  if (!splitHasMoved && Math.abs(delta) < 3) return;
  splitHasMoved = true;
  const appRect = appEl.getBoundingClientRect();
  const splitterH = splitterEl.getBoundingClientRect().height;
  const totalH = appRect.height - splitterH;
  if (totalH <= 0) return;
  const newPreviewH = splitStartH + delta;
  const ratio = clamp(newPreviewH / totalH, 0.05, 0.95);
  splitRatio = ratio; splitState = 'default';
  splitterGrips.forEach(g => {
    g.classList.toggle('is-snap-preview', ratio <= 0.10);
    g.classList.toggle('is-snap-code',    ratio >= 0.90);
  });
  applySplit();
}
function onSplitterPointerUp(e) {
  if (!isSplitting) return;
  isSplitting = false;
  if (pointerCaptured) {
    try { splitterEl.releasePointerCapture(e.pointerId); } catch(_) {}
    pointerCaptured = false;
  }
  document.body.style.cursor = '';
  document.body.style.userSelect = '';
  splitterGrips.forEach(g => g.classList.remove('is-snap-preview', 'is-snap-code'));
  if (splitHasMoved) {
    lastSplitDownTime = 0; lastSplitDownY = 0; splitHasMoved = false;
    if (splitRatio <= 0.10) {
      splitState = 'preview-max'; applySplit();
      showToast('预览已最大化（双击拖动条恢复）');
    } else if (splitRatio >= 0.90) {
      splitState = 'code-max'; applySplit();
      showToast('代码已最大化（双击拖动条恢复）');
    }
    return;
  }
  splitHasMoved = false;
}
function resetSplitToDefault() {
  splitState = 'default'; splitRatio = 0.8;
  applySplit();
  showToast('已恢复默认 80/20 布局');
}
splitterEl.addEventListener('pointerdown', onSplitterPointerDown);
splitterEl.addEventListener('pointermove', onSplitterPointerMove);
splitterEl.addEventListener('pointerup', onSplitterPointerUp);
splitterEl.addEventListener('pointercancel', onSplitterPointerUp);

function syncScroll() {
  const top = codeEl.scrollTop, left = codeEl.scrollLeft;
  highlightEl.scrollTop = top;
  highlightEl.scrollLeft = left;
  gutterEl.scrollTop = top;
}
let lastGutterCount = 0;
function renderGutter(lineCount) {
  if (lineCount === lastGutterCount) return;
  if (lineCount > lastGutterCount) {
    const frag = document.createDocumentFragment();
    for (let i = lastGutterCount + 1; i <= lineCount; i++) {
      const d = document.createElement('div');
      d.className = 'gutter-line'; d.textContent = i;
      frag.appendChild(d);
    }
    gutterEl.appendChild(frag);
  } else {
    while (gutterEl.childElementCount > lineCount) gutterEl.removeChild(gutterEl.lastElementChild);
  }
  lastGutterCount = lineCount;
  const digits = String(lineCount).length;
  gutterEl.style.minWidth = `calc(${digits}ch + 22px)`;
}
let lineResizeObserver = null;
function observeLinesForWrap() {
  if (!lineResizeObserver) {
    lineResizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const el = entry.target;
        const idx = Number(el.dataset.idx);
        const gl = gutterEl.children[idx];
        if (gl && gl.classList.contains('gutter-line')) {
          const h = Math.round(entry.contentRect.height);
          if (gl.style.height !== h + 'px') gl.style.height = h + 'px';
        }
      }
    });
  }
  lineResizeObserver.disconnect();
  if (!isWrapMode) return;
  const els = highlightCode.querySelectorAll('.line');
  els.forEach((el, i) => {
    el.dataset.idx = String(i);
    lineResizeObserver.observe(el);
  });
}
function splitHighlightByLines(html) {
  const result = []; let current = ''; const stack = []; let i = 0;
  while (i < html.length) {
    const ch = html[i];
    if (ch === '<') {
      const end = html.indexOf('>', i);
      if (end === -1) { current += html.slice(i); break; }
      const tag = html.slice(i, end + 1);
      current += tag;
      if (tag.startsWith('</')) stack.pop(); else stack.push(tag);
      i = end + 1;
    } else if (ch === '\n') {
      let closing = '';
      for (let k = stack.length - 1; k >= 0; k--) closing += '</span>';
      result.push(current + closing);
      current = stack.join('');
      i++;
    } else { current += ch; i++; }
  }
  if (current || result.length === 0) {
    let closing = '';
    for (let k = stack.length - 1; k >= 0; k--) closing += '</span>';
    result.push(current + closing);
  }
  return result;
}
let lineNodes = [], lastLineHtmls = [], currentLineEl = null;
function updateCurrentLineHighlight() {
  if (!highlightCurrentLineEnabled) {
    if (currentLineEl) currentLineEl.classList.remove('current');
    currentLineEl = null;
    highlightCode.querySelectorAll('.line.current').forEach(el => el.classList.remove('current'));
    return;
  }
  const text = codeEl.value;
  const pos = codeEl.selectionStart;
  const lineNo = text.slice(0, pos).split('\n').length;
  const target = lineNodes[lineNo - 1] || null;
  if (target === currentLineEl) return;
  if (currentLineEl) currentLineEl.classList.remove('current');
  if (target) target.classList.add('current');
  currentLineEl = target;
}
function renderEditor() {
  const code = codeEl.value;
  const lineCount = code.split('\n').length;
  renderGutter(lineCount);
  const html = highlightXML(code);
  const lineHtmls = splitHighlightByLines(html);
  while (lineHtmls.length < lineCount) lineHtmls.push('');
  const container = highlightCode;
  const newLen = lineHtmls.length, oldLen = lineNodes.length;
  const minLen = Math.min(newLen, oldLen);
  for (let i = 0; i < minLen; i++) {
    if (lastLineHtmls[i] !== lineHtmls[i]) {
      lineNodes[i].innerHTML = lineHtmls[i] || '';
    }
  }
  for (let i = oldLen; i < newLen; i++) {
    const sp = document.createElement('span');
    sp.className = 'line';
    sp.innerHTML = lineHtmls[i] || '';
    container.appendChild(sp);
    lineNodes.push(sp);
  }
  for (let i = newLen; i < oldLen; i++) container.removeChild(lineNodes[i]);
  lineNodes.length = newLen;
  lastLineHtmls = lineHtmls;
  updateCurrentLineHighlight();
  observeLinesForWrap();
  syncScroll();
}
let renderEditorRafId = 0;
function scheduleRenderEditor() {
  if (renderEditorRafId) return;
  renderEditorRafId = requestAnimationFrame(() => {
    renderEditorRafId = 0;
    renderEditor();
  });
}
function esc(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function findTagEnd(code, start) {
  let i = start, quote = null;
  while (i < code.length) {
    const c = code[i];
    if (quote) { if (c === quote) quote = null; }
    else if (c === '"' || c === "'") quote = c;
    else if (c === '>') return i;
    i++;
  }
  return code.length;
}
function highlightTag(tag) {
  const m = tag.match(/^(<\/?)([A-Za-z_][\w\-:.]*)([\s\S]*?)(\/?>)$/);
  if (!m) return esc(tag);
  const [, open, name, attrs, close] = m;
  return esc(open) + '<span class="tok-tag">' + esc(name) + '</span>' + highlightAttrs(attrs) + esc(close);
}
function highlightAttrs(attrs) {
  if (!attrs) return '';
  let out = '', i = 0;
  const len = attrs.length;
  while (i < len) {
    const c = attrs[i];
    if (c === '"' || c === "'") {
      const quote = c;
      const end = attrs.indexOf(quote, i + 1);
      const stop = end === -1 ? len : end + 1;
      out += '<span class="tok-string">' + esc(attrs.slice(i, stop)) + '</span>';
      i = stop;
    } else if (/[A-Za-z_:]/.test(c)) {
      let j = i;
      while (j < len && /[\w\-:.]/.test(attrs[j])) j++;
      out += '<span class="tok-attr">' + esc(attrs.slice(i, j)) + '</span>';
      i = j;
    } else { out += esc(c); i++; }
  }
  return out;
}
function highlightXML(code) {
  let out = '', i = 0;
  const len = code.length;
  while (i < len) {
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4);
      const stop = end === -1 ? len : end + 3;
      out += '<span class="tok-comment">' + esc(code.slice(i, stop)) + '</span>';
      i = stop; continue;
    }
    if (code.startsWith('<![CDATA[', i)) {
      const end = code.indexOf(']]>', i + 9);
      const stop = end === -1 ? len : end + 3;
      out += '<span class="tok-cdata">' + esc(code.slice(i, stop)) + '</span>';
      i = stop; continue;
    }
    if (code.startsWith('<?', i)) {
      const end = code.indexOf('?>', i + 2);
      const stop = end === -1 ? len : end + 2;
      out += '<span class="tok-pi">' + esc(code.slice(i, stop)) + '</span>';
      i = stop; continue;
    }
    if (code.startsWith('<!', i)) {
      const end = code.indexOf('>', i + 2);
      const stop = end === -1 ? len : end + 1;
      out += '<span class="tok-doctype">' + esc(code.slice(i, stop)) + '</span>';
      i = stop; continue;
    }
    if (code[i] === '<') {
      const end = findTagEnd(code, i + 1);
      const stop = end === -1 ? len : end + 1;
      out += highlightTag(code.slice(i, stop));
      i = stop; continue;
    }
    let next = i;
    while (next < len && code[next] !== '<') next++;
    out += esc(code.slice(i, next));
    i = next;
  }
  return out;
}
function findMatchingClose(xml, startTagIndex, name) {
  const openEnd = findTagEnd(xml, startTagIndex + 1);
  if (openEnd === -1) return -1;
  let i = openEnd + 1, nest = 0;
  const lower = name.toLowerCase();
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) return -1;
    if (xml.startsWith('<!--', lt)) { const c = xml.indexOf('-->', lt + 4); if (c === -1) return -1; i = c + 3; continue; }
    if (xml.startsWith('<![CDATA[', lt)) { const c = xml.indexOf(']]>', lt + 9); if (c === -1) return -1; i = c + 3; continue; }
    if (xml.startsWith('<?', lt)) { const c = xml.indexOf('?>', lt + 2); if (c === -1) return -1; i = c + 2; continue; }
    const end = findTagEnd(xml, lt + 1);
    if (end === -1) return -1;
    const t = xml.slice(lt, end + 1);
    if (t.startsWith('</')) {
      const cn = t.slice(2, -1).trim().toLowerCase();
      if (cn === lower) {
        if (nest === 0) return end + 1;
        nest--;
      }
    } else if (!t.endsWith('/>')) {
      const m = t.match(/^<([^\s>\/]+)/);
      if (m && m[1].toLowerCase() === lower) nest++;
    }
    i = end + 1;
  }
  return -1;
}
function formatXML(xml) {
  const tokens = []; let i = 0;
  const len = xml.length; const stack = [];
  const SENSITIVE = new Set(['text','tspan','style','script','desc','title','foreignobject']);
  while (i < len) {
    if (xml.startsWith('<!--', i)) {
      const end = xml.indexOf('-->', i + 4);
      const stop = end === -1 ? len : end + 3;
      tokens.push({ type: 'meta', value: xml.slice(i, stop) }); i = stop;
    } else if (xml.startsWith('<![CDATA[', i)) {
      const end = xml.indexOf(']]>', i + 9);
      const stop = end === -1 ? len : end + 3;
      tokens.push({ type: 'meta', value: xml.slice(i, stop) }); i = stop;
    } else if (xml.startsWith('<?', i)) {
      const end = xml.indexOf('?>', i + 2);
      const stop = end === -1 ? len : end + 2;
      tokens.push({ type: 'meta', value: xml.slice(i, stop) }); i = stop;
    } else if (xml.startsWith('<!', i)) {
      const end = xml.indexOf('>', i + 2);
      const stop = end === -1 ? len : end + 1;
      tokens.push({ type: 'meta', value: xml.slice(i, stop) }); i = stop;
    } else if (xml[i] === '<') {
      const end = findTagEnd(xml, i + 1);
      const stop = end === -1 ? len : end + 1;
      const tag = xml.slice(i, stop);
      const m = tag.match(/^<([^\s>\/]+)/);
      const name = m ? m[1] : '';
      if (!tag.startsWith('</') && !tag.endsWith('/>') && SENSITIVE.has(name.toLowerCase())) {
        const closeEnd = findMatchingClose(xml, i, name);
        if (closeEnd > 0) {
          tokens.push({ type: 'block', value: xml.slice(i, closeEnd) });
          i = closeEnd;
          continue;
        }
      }
      if (tag.startsWith('</')) { stack.pop(); tokens.push({ type: 'close', value: tag }); }
      else if (tag.endsWith('/>')) tokens.push({ type: 'self', value: tag });
      else {
        if (name) stack.push(name);
        tokens.push({ type: 'open', value: tag });
      }
      i = stop;
    } else {
      let next = i;
      while (next < len && xml[next] !== '<') next++;
      const text = xml.slice(i, next);
      if (text.trim()) tokens.push({ type: 'text', value: text });
      i = next;
    }
  }
  const INDENT = '  ';
  let out = ''; let depth = 0;
  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    if (tok.type === 'block') {
      out += INDENT.repeat(depth) + tok.value + '\n';
      continue;
    }
    if (tok.type === 'open') {
      const next = tokens[k + 1], after = tokens[k + 2];
      if (next && next.type === 'text' && after && after.type === 'close') {
        const openName = tok.value.match(/^<([^\s>\/]+)/)?.[1];
        const closeName = after.value.match(/^<\/([^\s>]+)/)?.[1];
        if (openName && openName === closeName) {
          out += INDENT.repeat(depth) + tok.value + next.value + after.value + '\n';
          k += 2; continue;
        }
      }
      out += INDENT.repeat(depth) + tok.value + '\n';
      depth++;
    } else if (tok.type === 'close') {
      depth = Math.max(0, depth - 1);
      out += INDENT.repeat(depth) + tok.value + '\n';
    } else {
      out += INDENT.repeat(depth) + tok.value + '\n';
    }
  }
  return out.trimEnd();
}

function saveDraftDebounced() {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(() => {
    try { localStorage.setItem(DRAFT_KEY, codeEl.value); } catch(_) {}
  }, 500);
}
function loadDraft() {
  try {
    const v = localStorage.getItem(DRAFT_KEY);
    if (typeof v === 'string' && v.trim()) return v;
  } catch(_) {}
  return null;
}
function getHistoryList() {
  try {
    const s = localStorage.getItem(HISTORY_KEY);
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch(_) { return []; }
}
function safeSetItem(key, value) {
  try { localStorage.setItem(key, value); return true; }
  catch (_) { return false; }
}
function saveHistoryList(list) {
  let cur = list.slice();
  while (cur.length > 0) {
    if (safeSetItem(HISTORY_KEY, JSON.stringify(cur))) {
      if (cur.length < list.length) {
        showToast(`本地存储空间不足，历史缩减至 ${cur.length} 条`);
      }
      return;
    }
    cur = cur.slice(0, Math.max(0, Math.floor(cur.length / 2)));
  }
  safeSetItem(HISTORY_KEY, '[]');
  showToast('本地存储空间不足，历史无法保存');
}
function guessTitle(code) {
  const m = code.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m && m[1].trim()) return m[1].trim().slice(0, 30);
  const first = code.split('\n').find(l => l.trim());
  if (first) return first.trim().slice(0, 30);
  return '未命名';
}
function saveToHistory(code) {
  if (!code || !code.trim()) return;
  const list = getHistoryList();
  if (list[0] && list[0].code === code) return;
  list.unshift({ code, time: Date.now(), title: guessTitle(code) });
  saveHistoryList(list.slice(0, HISTORY_MAX));
}
function formatTime(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function openHistory() {
  const list = getHistoryList();
  historyList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = '暂无历史版本';
    historyList.appendChild(empty);
  } else {
    list.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'history-item';
      const t = document.createElement('span');
      t.className = 'history-item__title';
      t.textContent = item.title || '未命名';
      const time = document.createElement('span');
      time.className = 'history-item__time';
      time.textContent = formatTime(item.time);
      btn.appendChild(t); btn.appendChild(time);
      btn.addEventListener('click', () => {
        codeEl.value = item.code;
        selectedPath = null;
        renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
        closeHistory();
        showToast('已载入历史版本');
      });
      historyList.appendChild(btn);
    });
  }
  historyMask.hidden = false;
}
function closeHistory() { historyMask.hidden = true; }

let undoStack = [];
let undoIndex = -1;
let lastSnapshotTime = 0;
function recordSnapshot(force) {
  const text = codeEl.value;
  if (!force && undoIndex >= 0 && undoStack[undoIndex].text === text) return;
  const now = Date.now();
  const merge = !force && now - lastSnapshotTime < 400
                && undoIndex === undoStack.length - 1 && undoIndex >= 0;
  if (merge) {
    undoStack[undoIndex] = { text, selStart: codeEl.selectionStart, selEnd: codeEl.selectionEnd };
  } else {
    if (undoIndex < undoStack.length - 1) undoStack = undoStack.slice(0, undoIndex + 1);
    undoStack.push({ text, selStart: codeEl.selectionStart, selEnd: codeEl.selectionEnd });
    undoIndex = undoStack.length - 1;
    if (undoStack.length > 100) { undoStack.shift(); undoIndex--; }
  }
  lastSnapshotTime = now;
  updateUndoRedoMenu();
}
function applySnapshot(s) {
  codeEl.value = s.text;
  try { codeEl.selectionStart = s.selStart; codeEl.selectionEnd = s.selEnd; } catch(_) {}
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); updateUndoRedoMenu();
}
function undo() {
  const cur = codeEl.value;
  if (undoIndex >= 0 && undoStack[undoIndex].text !== cur) recordSnapshot(true);
  if (undoIndex <= 0) { showToast('没有可撤销的操作'); return; }
  undoIndex--; applySnapshot(undoStack[undoIndex]);
  showToast('已撤销');
}
function redo() {
  const cur = codeEl.value;
  if (undoIndex >= 0 && undoIndex < undoStack.length - 1 && undoStack[undoIndex].text !== cur) recordSnapshot(true);
  if (undoIndex >= undoStack.length - 1) { showToast('没有可重做的操作'); return; }
  undoIndex++; applySnapshot(undoStack[undoIndex]);
  showToast('已重做');
}
function updateUndoRedoMenu() {
  btnUndo.disabled = undoIndex <= 0;
  btnRedo.disabled = undoIndex >= undoStack.length - 1;
}

function openFindPanel() {
  closeAttrPanel();
  findPanel.hidden = false;
  positionFindPanel();
  findInput.focus(); findInput.select();
}
function closeFindPanel() { findPanel.hidden = true; codeEl.focus(); }
function scrollToSelection() {
  const idx = codeEl.selectionStart;
  const text = codeEl.value;
  const lineNo = text.slice(0, idx).split('\n').length;
  const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
  const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
  codeEl.scrollTop = Math.max(0, (lineNo - 1) * lineHeight - codeEl.clientHeight / 3 + padTop);
  syncScroll();
}
function findNextMatch(backwards) {
  const query = findInput.value;
  if (!query) return;
  const text = codeEl.value;
  let idx;
  if (backwards) {
    idx = text.lastIndexOf(query, Math.max(0, codeEl.selectionStart - 1));
    if (idx < 0) idx = text.lastIndexOf(query);
  } else {
    idx = text.indexOf(query, codeEl.selectionEnd);
    if (idx < 0) idx = text.indexOf(query);
  }
  if (idx < 0) { showToast('未找到匹配'); return; }
  codeEl.focus();
  try { codeEl.setSelectionRange(idx, idx + query.length); } catch(_) {}

  if (isMobileViewport()) {
    const panelRect = findPanel.getBoundingClientRect();
    const codeRect  = codeEl.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
    const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
    const lineNo = text.slice(0, idx).split('\n').length;
    const targetY = (lineNo - 1) * lineHeight + padTop;
    const obscureTop = Math.max(0, panelRect.bottom - codeRect.top);
    codeEl.scrollTop = Math.max(0, targetY - obscureTop - lineHeight * 2);
    syncScroll();
  } else {
    scrollToSelection();
  }
  updateCurrentLineHighlight();
}
function replaceOne() {
  const query = findInput.value, replacement = replaceInput.value;
  if (!query) return;
  const selText = codeEl.value.slice(codeEl.selectionStart, codeEl.selectionEnd);
  if (selText === query) {
    const start = codeEl.selectionStart;
    const before = codeEl.value.slice(0, start);
    const after = codeEl.value.slice(codeEl.selectionEnd);
    codeEl.value = before + replacement + after;
    codeEl.selectionStart = codeEl.selectionEnd = start + replacement.length;
    renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot();
  }
  findNextMatch(false);
}
function replaceAll() {
  const query = findInput.value, replacement = replaceInput.value;
  if (!query) return;
  const text = codeEl.value;
  if (!text.includes(query)) { showToast('未找到匹配'); return; }
  const parts = []; let i = 0, count = 0;
  while (i <= text.length) {
    const idx = text.indexOf(query, i);
    if (idx < 0) { parts.push(text.slice(i)); break; }
    parts.push(text.slice(i, idx));
    parts.push(replacement);
    i = idx + query.length; count++;
  }
  codeEl.value = parts.join('');
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot();
  showToast(`已替换 ${count} 处`);
}
function positionFindPanel() {
  if (findPanel.hidden) return;

  if (isMobileViewport()) {
    const splitterRect = splitterEl.getBoundingClientRect();
    findPanel.style.top = splitterRect.bottom + 'px';
    findPanel.style.left = '';
    findPanel.style.right = '';
    return;
  }

  const btnRect = btnFind.getBoundingClientRect();
  const gap = 6, vh = window.innerHeight, vw = window.innerWidth;
  const panelW = findPanel.offsetWidth || 300;
  const panelH = findPanel.offsetHeight || 120;
  let top;
  if (btnRect.top - gap - panelH >= 8) top = btnRect.top - gap - panelH;
  else if (btnRect.bottom + gap + panelH <= vh - 8) top = btnRect.bottom + gap;
  else top = Math.max(8, vh - panelH - 8);
  let right = vw - btnRect.right;
  right = Math.min(Math.max(right, 8), vw - panelW - 8);
  findPanel.style.top = top + 'px';
  findPanel.style.right = right + 'px';
  findPanel.style.left = '';
}

async function loadFile(file) {
  if (!file) return;
  const isSvg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
  if (!isSvg) { showToast('请选择 SVG 文件'); return; }
  if (file.size > MAX_FILE_SIZE) {
    showToast(`文件过大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    return;
  }
  try {
    let text = await file.text();
    text = text.replace(/^\uFEFF/, '');
    if (!text.trim()) { showToast('文件为空'); return; }
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const hasParseError = !!doc.querySelector('parsererror');
    codeEl.value = text;
    selectedPath = null;
    renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
    if (!hasParseError) saveToHistory(text);
    const lineCount = text.split('\n').length;
    const isSingleLine = (lineCount === 1 && text.length > 80);
    let msg;
    if (hasParseError) msg = `已载入 ${file.name}，但 SVG 解析失败，请检查语法`;
    else if (isSingleLine) msg = `已载入 ${file.name}（单行文件，可用「≡」格式化整理）`;
    else msg = `已载入：${file.name}`;
    showToast(msg);
  } catch (err) {
    showToast('读取失败：' + (err.message || '未知错误'));
  }
}
async function copySVGCode() {
  if (!currentSvg) return;
  const raw = codeEl.value.trim();
  const markup = raw || serializeSVG(currentSvg);
  if (!markup) return;
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    showToast('当前环境不支持剪贴板（需要 HTTPS）'); return;
  }
  try {
    await navigator.clipboard.writeText(markup);
    showToast('SVG 代码已复制');
  } catch (err) { showToast('复制失败：' + (err.message || '权限被拒绝')); }
}
async function copyPNGImage() {
  if (!currentSvg) return;
  if (!navigator.clipboard || !window.ClipboardItem) {
    showToast('当前浏览器不支持复制 PNG（请使用导出）'); return;
  }
  try {
    const size = getSize(currentSvg);
    let w = Math.round(size.width), h = Math.round(size.height);
    const longest = Math.max(w, h);
    if (longest > MAX_SIDE) {
      const k = MAX_SIDE / longest;
      w = Math.max(1, Math.round(w * k));
      h = Math.max(1, Math.round(h * k));
    }
    const markup = serializeSVG(currentSvg, w, h);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法创建 canvas 上下文');
    const blobUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    const img = new Image();
    try {
      await new Promise((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('SVG 无法渲染'));
        img.src = blobUrl;
      });
      ctx.drawImage(img, 0, 0, w, h);
    } finally { URL.revokeObjectURL(blobUrl); }
    const item = new ClipboardItem({
      'image/png': new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG 生成失败')), 'image/png');
      })
    });
    await navigator.clipboard.write([item]);
    showToast(`PNG 已复制（${w} × ${h}）`);
  } catch (err) {
    console.error(err);
    if (isIOSLike() && currentSvg) {
      showToast('当前环境不支持复制，正在打开分享面板…');
      try {
        const size = getSize(currentSvg);
        const w = Math.round(size.width), h = Math.round(size.height);
        const markup = serializeSVG(currentSvg, w, h);
        const blob = await canvas2dExportBlob(markup, w, h, 'png', false);
        downloadBlob(blob, `svg-${stamp()}.png`);
      } catch (_) { showToast('请使用「导出图片」按钮'); }
      return;
    }
    showToast('复制失败：' + (err.message || '请使用导出功能'));
  }
}

function setPreviewBg(bg) {
  stageEl.className = 'stage bg-' + bg;
  bgBtns.forEach(b => b.classList.toggle('is-active', b.dataset.bg === bg));
}
function zoomAt(factor, localX, localY) {
  if (!currentSvg) return;
  const rect = getPreviewRect();
  const newScale = clamp(previewScale * factor, 0.05, 20);
  if (newScale === previewScale) return;
  const ratio = newScale / previewScale;
  const relX = localX - rect.width / 2 - previewPanX;
  const relY = localY - rect.height / 2 - previewPanY;
  previewPanX = localX - rect.width / 2 - relX * ratio;
  previewPanY = localY - rect.height / 2 - relY * ratio;
  previewScale = newScale;
  isFitMode = false;
  applyPreviewTransform();
}
function zoomByButton(factor) {
  if (!currentSvg) return;
  const rect = getPreviewRect();
  zoomAt(factor, rect.width / 2, rect.height / 2);
}
function setPreviewRotation(deg) {
  previewRotation = ((deg % 360) + 360) % 360;
  fitToView();
  showToast(`预览旋转 ${previewRotation}°`);
}

let lockedScrollTop = 0;
codeEl.addEventListener('focus', () => {
  requestAnimationFrame(() => { codeEl.scrollTop = lockedScrollTop; syncScroll(); });
});
if (window.visualViewport) {
  window.visualViewport.addEventListener('scroll', () => {
    if (window.visualViewport.offsetTop === 0 && Math.abs(window.scrollY) > 1) window.scrollTo(0, 0);
  });
}
codeEl.addEventListener('input', () => {
  lockedScrollTop = codeEl.scrollTop;
  scheduleRenderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
});
let snapshotTimer = 0;
codeEl.addEventListener('input', () => {
  clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => recordSnapshot(false), 500);
});
codeEl.addEventListener('scroll', syncScroll);

function handleTab(e) {
  const start = codeEl.selectionStart, end = codeEl.selectionEnd;
  const value = codeEl.value;
  const shift = e.shiftKey;
  if (start === end) {
    if (shift) {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineText = value.slice(lineStart, start);
      if (lineText.startsWith('  ')) {
        codeEl.value = value.slice(0, lineStart) + lineText.slice(2) + value.slice(end);
        codeEl.selectionStart = codeEl.selectionEnd = Math.max(lineStart, start - 2);
      } else if (lineText.startsWith(' ')) {
        codeEl.value = value.slice(0, lineStart) + lineText.slice(1) + value.slice(end);
        codeEl.selectionStart = codeEl.selectionEnd = Math.max(lineStart, start - 1);
      }
    } else {
      const insert = '  ';
      codeEl.value = value.slice(0, start) + insert + value.slice(end);
      codeEl.selectionStart = codeEl.selectionEnd = start + insert.length;
    }
  } else {
    const linesStart = value.lastIndexOf('\n', start - 1) + 1;
    const before = value.slice(linesStart, start);
    const selectedBlock = before + value.slice(start, end);
    const lines = selectedBlock.split('\n');
    if (shift) {
      const newLines = lines.map(l => l.startsWith('  ') ? l.slice(2) : (l.startsWith(' ') ? l.slice(1) : l));
      const newBlock = newLines.join('\n');
      codeEl.value = value.slice(0, linesStart) + newBlock + value.slice(end);
      codeEl.selectionStart = linesStart;
      codeEl.selectionEnd = linesStart + newBlock.length;
    } else {
      const newLines = lines.map(l => '  ' + l);
      const newBlock = newLines.join('\n');
      codeEl.value = value.slice(0, linesStart) + newBlock + value.slice(end);
      codeEl.selectionStart = linesStart;
      codeEl.selectionEnd = linesStart + newBlock.length;
    }
  }
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot();
}
function handleEnterIndent() {
  const start = codeEl.selectionStart, end = codeEl.selectionEnd;
  const value = codeEl.value;
  const lineStart = value.lastIndexOf('\n', start - 1) + 1;
  const currentLine = value.slice(lineStart, start);
  const indentMatch = currentLine.match(/^([ \t]*)/);
  let indent = indentMatch ? indentMatch[1] : '';
  const trimmed = currentLine.trimEnd();
  if (trimmed.endsWith('>') && !trimmed.endsWith('/>') && !/<\/[^>]+>$/.test(trimmed)) indent += '  ';
  const insert = '\n' + indent;
  codeEl.value = value.slice(0, start) + insert + value.slice(end);
  codeEl.selectionStart = codeEl.selectionEnd = start + insert.length;
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot();
}
codeEl.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && !e.altKey) {
    const k = e.key.toLowerCase();
    if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if ((k === 'z' && e.shiftKey) || k === 'y') { e.preventDefault(); redo(); return; }
    if (k === 'f') { e.preventDefault(); openFindPanel(); return; }
    if (k === 's') {
      e.preventDefault();
      if (e.shiftKey) fileInput.click();
      else if (currentSvg) openExportModal('svg');
      return;
    }
    if (e.code === 'Digit0' || k === '0') {
      e.preventDefault();
      if (currentSvg) fitToView();
      return;
    }
  }
  if (e.key === 'Tab') { e.preventDefault(); handleTab(e); return; }
  if (e.key === 'Enter' && autoIndentEnabled && !e.isComposing) { e.preventDefault(); handleEnterIndent(); return; }
  if (e.key === 'Escape' && !findPanel.hidden) { e.preventDefault(); closeFindPanel(); }
});
document.addEventListener('selectionchange', () => {
  if (document.activeElement === codeEl) updateCurrentLineHighlight();
});

function closeAllMenus() {
  previewMenu.hidden = true;   btnPreviewMenu.setAttribute('aria-expanded', 'false');
  editorMenu.hidden  = true;   btnEditorMenu.setAttribute('aria-expanded',  'false');
  mobileViewMenu.hidden = true; btnMobileViewMenu.setAttribute('aria-expanded', 'false');
}
function positionDropdown(btn, menu) {
  menu.classList.remove('dropdown--up');
  void menu.offsetHeight;
  const btnRect = btn.getBoundingClientRect();
  const menuH = menu.offsetHeight;
  const vh = window.innerHeight;
  const spaceBelow = vh - btnRect.bottom - 12;
  const spaceAbove = btnRect.top - 12;
  if (menuH > spaceBelow && spaceAbove > spaceBelow) menu.classList.add('dropdown--up');
}
function toggleMenu(btn, menu) {
  const willOpen = menu.hidden;
  closeAllMenus();
  if (willOpen) {
    menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    positionDropdown(btn, menu);
    const first = menu.querySelector('button:not(:disabled)');
    if (first) first.focus();
  }
}
btnPreviewMenu.addEventListener('click', e => { e.stopPropagation(); toggleMenu(btnPreviewMenu, previewMenu); });
btnEditorMenu.addEventListener('click',  e => { e.stopPropagation(); toggleMenu(btnEditorMenu,  editorMenu); });
btnMobileViewMenu.addEventListener('click', e => {
  e.stopPropagation();
  updateMobileViewMenu();
  toggleMenu(btnMobileViewMenu, mobileViewMenu);
});

function handleMenuKeydown(e, menu) {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const items = Array.from(menu.querySelectorAll('button:not(:disabled)'));
  if (!items.length) return;
  const idx = items.indexOf(document.activeElement);
  const next = e.key === 'ArrowDown'
    ? items[(idx + 1) % items.length]
    : items[(idx - 1 + items.length) % items.length];
  next.focus();
}
previewMenu.addEventListener('keydown', e => handleMenuKeydown(e, previewMenu));
editorMenu.addEventListener('keydown',  e => handleMenuKeydown(e, editorMenu));
mobileViewMenu.addEventListener('keydown', e => handleMenuKeydown(e, mobileViewMenu));

menuViewCode.addEventListener('click', () => {
  closeAllMenus();
  setMobileView('code');
});
menuViewAttr.addEventListener('click', () => {
  if (menuViewAttr.disabled) return;
  closeAllMenus();
  setMobileView('attr');
});

btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);

btnFormat.addEventListener('click', () => {
  const raw = codeEl.value;
  if (!raw.trim()) return;
  try {
    const formatted = formatXML(raw);
    if (formatted === raw) { showToast('已是格式化状态'); return; }
    codeEl.value = formatted;
    renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
    showToast('代码已格式化');
  } catch (err) { showToast('格式化失败：' + (err.message || '未知错误')); }
});

btnFind.addEventListener('click', e => {
  e.stopPropagation();
  if (findPanel.hidden) openFindPanel();
  else closeFindPanel();
});

menuOpenSvg.addEventListener('click', () => { closeAllMenus(); fileInput.click(); });
menuInsertImage.addEventListener('click', () => { closeAllMenus(); imageFileInput.click(); });
menuCopyPng.addEventListener('click', () => { closeAllMenus(); copyPNGImage(); });
menuCopySvg.addEventListener('click', () => { closeAllMenus(); copySVGCode(); });
menuSavePng.addEventListener('click', () => { closeAllMenus(); openExportModal('png'); });
menuSaveSvg.addEventListener('click', () => { closeAllMenus(); openExportModal('svg'); });

menuWrap.addEventListener('click', e => {
  e.stopPropagation();
  isWrapMode = !isWrapMode;
  editorEl.classList.toggle('is-wrap', isWrapMode);
  codeEl.setAttribute('wrap', isWrapMode ? 'soft' : 'off');
  menuWrap.setAttribute('aria-checked', String(isWrapMode));
  const savedTop = codeEl.scrollTop;
  renderEditor();
  codeEl.scrollTop = savedTop;
  syncScroll();
  showToast(isWrapMode ? '已开启自动换行' : '已关闭自动换行');
});
menuHighlightLine.addEventListener('click', e => {
  e.stopPropagation();
  highlightCurrentLineEnabled = !highlightCurrentLineEnabled;
  menuHighlightLine.setAttribute('aria-checked', String(highlightCurrentLineEnabled));
  updateCurrentLineHighlight();
  showToast(highlightCurrentLineEnabled ? '已开启当前行高亮' : '已关闭当前行高亮');
});
menuAutoIndent.addEventListener('click', e => {
  e.stopPropagation();
  autoIndentEnabled = !autoIndentEnabled;
  menuAutoIndent.setAttribute('aria-checked', String(autoIndentEnabled));
  showToast(autoIndentEnabled ? '已开启自动缩进' : '已关闭自动缩进');
});
menuHistory.addEventListener('click', () => { closeAllMenus(); openHistory(); });
menuResetExample.addEventListener('click', () => {
  closeAllMenus();
  codeEl.value = DEFAULT_CODE;
  selectedPath = null;
  renderEditor(); renderPreview(); saveDraftDebounced(); recordSnapshot(true);
  showToast('已恢复示例代码');
});
menuClearDraft.addEventListener('click', () => {
  closeAllMenus();
  try { localStorage.removeItem(DRAFT_KEY); } catch(_) {}
  showToast('草稿已清空（当前编辑内容保留）');
});

document.addEventListener('click', e => {
  if (!e.target.closest('#previewActions')) {
    previewMenu.hidden = true; btnPreviewMenu.setAttribute('aria-expanded', 'false');
  }
  if (!e.target.closest('#editorActions')) {
    editorMenu.hidden = true; btnEditorMenu.setAttribute('aria-expanded', 'false');
  }
  if (!e.target.closest('.mobile-view-switch')) {
    mobileViewMenu.hidden = true; btnMobileViewMenu.setAttribute('aria-expanded', 'false');
  }
  if (!findPanel.hidden && !e.target.closest('#findPanel')) closeFindPanel();
  // 关闭属性面板中的"添加动画"菜单
  closeAnimAddMenu();
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!imageConfigMask.hidden) { closeImageConfigModal(); return; }
  if (!historyMask.hidden) { closeHistory(); return; }
  if (!modalMask.hidden) { closeExportModal(); return; }
  if (!findPanel.hidden) { closeFindPanel(); return; }
  if (attrPanelOpen) { clearSelection(); return; }
  closeAllMenus();
});

findPrev.addEventListener('click', () => findNextMatch(true));
findNext.addEventListener('click', () => findNextMatch(false));
findReplace.addEventListener('click', replaceOne);
findReplaceAll.addEventListener('click', replaceAll);
findClose.addEventListener('click', closeFindPanel);
findInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); findNextMatch(e.shiftKey); }
});
replaceInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') { e.preventDefault(); replaceOne(); }
});

exportWInput.addEventListener('input', syncHeightFromWidth);
exportHInput.addEventListener('input', syncWidthFromHeight);
exportLock.addEventListener('click', () => {
  if (!exportState) return;
  exportState.lockRatio = !exportState.lockRatio;
  exportLock.textContent = exportState.lockRatio ? '🔒' : '🔓';
  exportLock.classList.toggle('is-locked', exportState.lockRatio);
  exportLock.setAttribute('aria-pressed', String(exportState.lockRatio));
  if (exportState.lockRatio) syncHeightFromWidth();
});
exportFormat.addEventListener('change', () => {
  if (!exportState) return;
  const isJpg = exportFormat.value === 'jpg';
  bgRow.hidden = isJpg;
  if (isJpg) exportWhiteBg.checked = false;
});
exportOriginal.addEventListener('click', () => {
  if (!exportState) return;
  exportWInput.value = exportState.originWidth;
  exportHInput.value = exportState.originHeight;
});
exportCancel.addEventListener('click', closeExportModal);
exportConfirm.addEventListener('click', confirmExport);
modalMask.addEventListener('click', e => { if (e.target === modalMask) closeExportModal(); });

historyClose.addEventListener('click', closeHistory);
historyMask.addEventListener('click', e => { if (e.target === historyMask) closeHistory(); });
historyClear.addEventListener('click', () => {
  try { localStorage.removeItem(HISTORY_KEY); } catch(_) {}
  historyList.innerHTML = '<div class="history-empty">暂无历史版本</div>';
  showToast('历史版本已清空');
});

warningClose.addEventListener('click', hideWarning);
fileInput.addEventListener('change', e => {
  const f = e.target.files?.[0];
  if (f) loadFile(f);
  e.target.value = '';
});

let dragCounter = 0;
window.addEventListener('dragenter', e => {
  if (!e.dataTransfer) return;
  const types = e.dataTransfer.types || [];
  if (!Array.from(types).includes('Files')) return;
  e.preventDefault();
  dragCounter++;
  dropOverlay.hidden = false;
});
window.addEventListener('dragover', e => {
  if (!e.dataTransfer) return;
  const types = e.dataTransfer.types || [];
  if (!Array.from(types).includes('Files')) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
});
window.addEventListener('dragleave', e => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) { dragCounter = 0; dropOverlay.hidden = true; }
});
window.addEventListener('drop', e => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.hidden = true;
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFile(file);
});

bgBtns.forEach(btn => btn.addEventListener('click', () => setPreviewBg(btn.dataset.bg)));

previewWrap.addEventListener('wheel', e => {
  if (!currentSvg || !modalMask.hidden) return;
  if (e.target.closest && e.target.closest('.preview-actions, .view-controls, .warning-bar')) return;
  e.preventDefault();
  const rect = getPreviewRect();
  zoomAt(e.deltaY < 0 ? 1.15 : 1/1.15, e.clientX - rect.left, e.clientY - rect.top);
}, { passive: false });

zoomInBtn.addEventListener('click', () => zoomByButton(1.25));
zoomOutBtn.addEventListener('click', () => zoomByButton(1/1.25));
zoomResetBtn.addEventListener('click', () => {
  if (!currentSvg) return;
  fitToView();
  showToast('视图已重置为适应窗口');
});

btnRotate90.addEventListener('click', () => {
  if (!currentSvg) return;
  setPreviewRotation(previewRotation + 90);
});
btnRotateReset.addEventListener('click', () => {
  if (!currentSvg) return;
  setPreviewRotation(0);
});

let isPanning = false, panHasMoved = false;
let panStartX = 0, panStartY = 0, panStartTx = 0, panStartTy = 0;
const activePointers = new Map();
let pinchStartDist = 0, pinchStartScale = 1, pinchStartPanX = 0, pinchStartPanY = 0;
let pinchCenterX = 0, pinchCenterY = 0;
let downTargetEl = null;
let didPinch = false;

previewWrap.addEventListener('pointerdown', e => {
  if (!currentSvg || !modalMask.hidden) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.target.closest && e.target.closest('.preview-actions, .view-controls, .warning-bar')) return;

  let realTarget = null;
  const composed = typeof e.composedPath === 'function' ? e.composedPath() : [];
  for (const node of composed) {
    if (node instanceof Element && node !== canvasEl && canvasEl.contains(node)) {
      realTarget = node;
      break;
    }
  }
  downTargetEl = realTarget;

  activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (activePointers.size === 2) {
    const pts = Array.from(activePointers.values());
    pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    pinchStartScale = previewScale;
    pinchStartPanX = previewPanX;
    pinchStartPanY = previewPanY;
    const rect = getPreviewRect();
    pinchCenterX = (pts[0].x + pts[1].x) / 2 - rect.left;
    pinchCenterY = (pts[0].y + pts[1].y) / 2 - rect.top;
    isPanning = false; panHasMoved = true;
    didPinch = true;
    try { previewWrap.setPointerCapture(e.pointerId); } catch(_) {}
    return;
  }
  isPanning = true; panHasMoved = false;
  panStartX = e.clientX; panStartY = e.clientY;
  panStartTx = previewPanX; panStartTy = previewPanY;
  try { previewWrap.setPointerCapture(e.pointerId); } catch(_) {}
});
previewWrap.addEventListener('pointermove', e => {
  if (activePointers.has(e.pointerId)) {
    activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }
  if (activePointers.size === 2 && pinchStartDist > 0) {
    const pts = Array.from(activePointers.values());
    const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
    const newScale = clamp(pinchStartScale * (dist / pinchStartDist), 0.05, 20);
    if (newScale !== previewScale) {
      const size = getSize(currentSvg);
      const rect = getPreviewRect();
      const s0 = pinchStartScale, s1 = newScale;
      const offsetX0 = (rect.width - size.width * s0) / 2 + pinchStartPanX;
      const offsetY0 = (rect.height - size.height * s0) / 2 + pinchStartPanY;
      const px = (pinchCenterX - offsetX0) / s0;
      const py = (pinchCenterY - offsetY0) / s0;
      previewPanX = pinchCenterX - px * s1 - (rect.width - size.width * s1) / 2;
      previewPanY = pinchCenterY - py * s1 - (rect.height - size.height * s1) / 2;
      previewScale = s1;
      isFitMode = false;
      applyPreviewTransform();
    }
    return;
  }
  if (!isPanning) return;
  const dx = e.clientX - panStartX, dy = e.clientY - panStartY;
  if (!panHasMoved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) panHasMoved = true;
  if (panHasMoved) {
    previewPanX = panStartTx + dx;
    previewPanY = panStartTy + dy;
    isFitMode = false;
    applyPreviewTransform();
  }
});
function endPan(e) {
  if (activePointers.has(e.pointerId)) activePointers.delete(e.pointerId);
  if (activePointers.size < 2) pinchStartDist = 0;
  if (activePointers.size === 1) {
    const p = activePointers.values().next().value;
    isPanning = true; panHasMoved = false;
    panStartX = p.x; panStartY = p.y;
    panStartTx = previewPanX; panStartTy = previewPanY;
    return;
  }
  if (!isPanning) return;
  isPanning = false;
  try { previewWrap.releasePointerCapture(e.pointerId); } catch(_) {}

  if (!panHasMoved && !didPinch) {
    handlePreviewClick(downTargetEl);
  }
  didPinch = false;
  downTargetEl = null;
}
previewWrap.addEventListener('pointerup', endPan);
previewWrap.addEventListener('pointercancel', endPan);
previewWrap.addEventListener('dblclick', e => {
  if (!currentSvg || !modalMask.hidden) return;
  if (e.target.closest && e.target.closest('.preview-actions, .view-controls, .warning-bar')) return;
  fitToView();
  showToast('已回中');
});

function handlePreviewClick(target) {
  if (!currentSvg) return;
  const svgRoot = canvasEl.firstElementChild;
  if (!svgRoot) return;
  if (!target || target === svgRoot) {
    clearSelection(); return;
  }
  let cur = target;
  while (cur && cur !== svgRoot && !svgRoot.contains(cur)) cur = cur.parentElement;
  if (!cur || cur === svgRoot) {
    clearSelection(); return;
  }
  selectElement(cur);
}

attrPanelClose.addEventListener('click', clearSelection);
attrPanelLocate.addEventListener('click', locateSelectedInSource);

imageFileInput.addEventListener('change', e => {
  const f = e.target.files?.[0];
  e.target.value = '';
  if (f) loadImageForConfig(f);
});
imageConfigRatio.addEventListener('change', () => {
  imageImportState.ratio = imageConfigRatio.value;
  syncImageConfigUI();
  renderImageConfigPreview();
});
imageConfigCustomW.addEventListener('input', () => {
  imageImportState.customW = Math.max(1, parseInt(imageConfigCustomW.value, 10) || 1);
  renderImageConfigPreview();
});
imageConfigCustomH.addEventListener('input', () => {
  imageImportState.customH = Math.max(1, parseInt(imageConfigCustomH.value, 10) || 1);
  renderImageConfigPreview();
});
imageConfigShape.addEventListener('change', () => {
  imageImportState.shape = imageConfigShape.value;
  syncImageConfigUI();
  renderImageConfigPreview();
});
imageConfigRx.addEventListener('input', () => {
  imageImportState.rx = Math.max(0, parseInt(imageConfigRx.value, 10) || 0);
  renderImageConfigPreview();
});
imageConfigFillRadios.forEach(r => r.addEventListener('change', () => {
  if (!r.checked) return;
  imageImportState.fillMode = r.value;
  renderImageConfigPreview();
}));
imageConfigInsertRadios.forEach(r => r.addEventListener('change', () => {
  if (!r.checked) return;
  imageImportState.insertMode = r.value;
  renderImageConfigPreview();
}));
imageConfigCompress.addEventListener('change', () => {
  imageImportState.compress = imageConfigCompress.checked;
});
imageConfigCancel.addEventListener('click', closeImageConfigModal);
imageConfigConfirm.addEventListener('click', confirmImageInsert);
imageConfigMask.addEventListener('click', e => {
  if (e.target === imageConfigMask) closeImageConfigModal();
});

window.addEventListener('resize', () => {
  invalidatePreviewRect();
  if (appEl.style.height && window.visualViewport &&
      window.visualViewport.height >= window.innerHeight - 100) {
    appEl.style.height = '';
  }
  if (currentSvg) {
    if (isFitMode) fitToView();
    else applyPreviewTransform();
  }
  if (!previewMenu.hidden) positionDropdown(btnPreviewMenu, previewMenu);
  if (!editorMenu.hidden)  positionDropdown(btnEditorMenu,  editorMenu);
  if (!mobileViewMenu.hidden) positionDropdown(btnMobileViewMenu, mobileViewMenu);
  if (!findPanel.hidden)   positionFindPanel();

  if (!isMobileViewport()) {
    if (editorEl.hidden) editorEl.hidden = false;
  } else {
    if (mobileView === 'attr' && attrPanelOpen) {
      editorEl.hidden = true;
      attrPanel.hidden = false;
    } else {
      editorEl.hidden = false;
      attrPanel.hidden = true;
      mobileView = 'code';
    }
  }
  updateMobileViewMenu();
});

(function detectScrollbarWidth() {
  const div = document.createElement('div');
  div.style.cssText = 'width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px;left:0;';
  document.body.appendChild(div);
  const w = div.offsetWidth - div.clientWidth;
  div.remove();
  document.documentElement.style.setProperty('--ed-sbw', w + 'px');
})();

if (window.visualViewport) {
  let vvRaf = 0;
  const onVVResize = () => {
    if (vvRaf) return;
    vvRaf = requestAnimationFrame(() => {
      vvRaf = 0;
      const vv = window.visualViewport;
      appEl.style.height = (vv.height < window.innerHeight - 100) ? (vv.height + 'px') : '';
      invalidatePreviewRect();
      if (currentSvg) {
        if (isFitMode) fitToView();
        else applyPreviewTransform();
      }
      if (!findPanel.hidden) positionFindPanel();
    });
  };
  window.visualViewport.addEventListener('resize', onVVResize);
}

const draft = loadDraft();
codeEl.value = draft || DEFAULT_CODE;
setPreviewBg('checker');
recordSnapshot(true);
renderEditor();
renderPreview();
applySplit();
updateUndoRedoMenu();
updateMobileViewMenu();

async function loadImageForConfig(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    showToast('仅支持 PNG / JPG 图片'); return;
  }
  if (file.size > MAX_FILE_SIZE) {
    showToast(`图片过大（${(file.size / 1024 / 1024).toFixed(1)}MB），上限 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    return;
  }
  let dataUrl;
  try {
    dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('FileReader 读取失败'));
      r.readAsDataURL(file);
    });
  } catch (err) {
    showToast('读取图片失败：' + (err.message || '未知错误')); return;
  }
  const img = new Image();
  try {
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error('图片解码失败'));
      img.src = dataUrl;
    });
  } catch (err) { showToast(err.message); return; }
  imageImportState.file = file;
  imageImportState.dataUrl = dataUrl;
  imageImportState.originalW = img.naturalWidth;
  imageImportState.originalH = img.naturalHeight;
  imageImportState.ratio = 'original';
  imageImportState.shape = 'rect';
  imageImportState.rx = Math.max(2, Math.round(Math.min(img.naturalWidth, img.naturalHeight) * 0.1));
  imageImportState.fillMode = 'slice';
  imageImportState.insertMode = 'replace';
  imageImportState.compress = true;
  openImageConfigModal();
}

function computeImageBox() {
  const { originalW, originalH, ratio, customW, customH, shape, insertMode } = imageImportState;

  let L = 0;
  let explicitW = 0, explicitH = 0;

  if (insertMode === 'replace') {
    L = Math.max(originalW, originalH);
    if (ratio === 'custom' && customW > 0 && customH > 0) {
      explicitW = customW;
      explicitH = customH;
    }
  } else {
    if (currentSvg) {
      const vb = currentSvg.getAttribute('viewBox');
      if (vb) {
        const p = vb.trim().split(/[\s,]+/).map(Number);
        if (p.length === 4 && p[2] > 0 && p[3] > 0) {
          L = Math.min(p[2], p[3]) * 0.6;
        }
      }
    }
    if (!L) L = Math.max(originalW, originalH);
    if (ratio === 'custom' && customW > 0 && customH > 0) {
      explicitW = customW;
      explicitH = customH;
    }
  }
  if (explicitW > 0 && explicitH > 0) {
    let width = explicitW, height = explicitH;
    if (shape === 'circle') {
      const D = Math.min(width, height);
      width = D; height = D;
    }
    let x = 0, y = 0;
    if (insertMode === 'append' && currentSvg) {
      const vb = currentSvg.getAttribute('viewBox');
      if (vb) {
        const p = vb.trim().split(/[\s,]+/).map(Number);
        if (p.length === 4) { x = p[0]; y = p[1]; }
      }
    }
    return {
      x, y,
      width: Math.round(width * 100) / 100,
      height: Math.round(height * 100) / 100
    };
  }
  let R;
  if (shape === 'circle') {
    R = 1;
  } else {
    switch (ratio) {
      case 'original': R = originalW / originalH; break;
      case '1:1':      R = 1; break;
      case '4:3':      R = 4 / 3; break;
      case '16:9':     R = 16 / 9; break;
      case '3:4':      R = 3 / 4; break;
      case '9:16':     R = 9 / 16; break;
      case 'custom':   R = (customW > 0 && customH > 0) ? customW / customH : originalW / originalH; break;
      default:         R = originalW / originalH;
    }
  }

  let width, height;
  if (R >= 1) { width = L; height = L / R; }
  else        { height = L; width = L * R; }

  if (shape === 'circle') {
    const D = Math.min(width, height);
    width = D; height = D;
  }

  let x = 0, y = 0;
  if (insertMode === 'append' && currentSvg) {
    const vb = currentSvg.getAttribute('viewBox');
    if (vb) {
      const p = vb.trim().split(/[\s,]+/).map(Number);
      if (p.length === 4) { x = p[0]; y = p[1]; }
    }
  }

  return {
    x, y,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100
  };
}


function renderImageConfigPreview() {
  if (!imageImportState.dataUrl) { imageConfigPreview.innerHTML = ''; return; }
  const box = computeImageBox();
  const w = box.width, h = box.height;
  const rx = Math.min(imageImportState.rx, Math.min(w, h) / 2);
  let shapeEl = '';
  switch (imageImportState.shape) {
    case 'rect':      shapeEl = `<rect width="${w}" height="${h}"/>`; break;
    case 'roundrect': shapeEl = `<rect width="${w}" height="${h}" rx="${rx}" ry="${rx}"/>`; break;
    case 'circle':    shapeEl = `<circle cx="${w/2}" cy="${h/2}" r="${Math.min(w,h)/2}"/>`; break;
    case 'ellipse':   shapeEl = `<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2}" ry="${h/2}"/>`; break;
  }
  const par = imageImportState.fillMode === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet';
  imageConfigPreview.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      <defs><clipPath id="preview-clip">${shapeEl}</clipPath></defs>
      <image width="${w}" height="${h}" preserveAspectRatio="${par}"
             clip-path="url(#preview-clip)" href="${imageImportState.dataUrl}"/>
    </svg>`;
}
function buildImageSvgFragment() {
  const box = computeImageBox();
  const { x, y, width, height } = box;
  const id = 'clip-' + Math.random().toString(36).slice(2, 10);
  const rx = Math.min(imageImportState.rx, Math.min(width, height) / 2);
  let shapeEl = '';
  switch (imageImportState.shape) {
    case 'rect':      shapeEl = `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`; break;
    case 'roundrect': shapeEl = `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${rx}" ry="${rx}"/>`; break;
    case 'circle':    shapeEl = `<circle cx="${x + width/2}" cy="${y + height/2}" r="${Math.min(width,height)/2}"/>`; break;
    case 'ellipse':   shapeEl = `<ellipse cx="${x + width/2}" cy="${y + height/2}" rx="${width/2}" ry="${height/2}"/>`; break;
  }
  const par = imageImportState.fillMode === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet';
  return {
    id,
    defs:  `<clipPath id="${id}">${shapeEl}</clipPath>`,
    image: `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${par}" clip-path="url(#${id})" href="${imageImportState.dataUrl}"/>`,
    box
  };
}
async function maybeCompressImage(box) {
  if (!imageImportState.compress) return imageImportState.dataUrl;
  const { originalW, originalH, dataUrl } = imageImportState;
  const targetW = Math.max(1, Math.round(box.width  * 2));
  const targetH = Math.max(1, Math.round(box.height * 2));
  if (originalW <= targetW && originalH <= targetH) return dataUrl;
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('图片重载失败'));
    img.src = dataUrl;
  });
  const k = Math.max(targetW / originalW, targetH / originalH);
  const cw = Math.max(1, Math.round(originalW * k));
  const ch = Math.max(1, Math.round(originalH * k));
  const canvas = document.createElement('canvas');
  canvas.width = cw; canvas.height = ch;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, cw, ch);
  const isPng = /^data:image\/png/i.test(dataUrl);
  return canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.92);
}
function openImageConfigModal() {
  imageConfigRatio.value = imageImportState.ratio;
  imageConfigShape.value = imageImportState.shape;
  imageConfigCustomW.value = imageImportState.customW;
  imageConfigCustomH.value = imageImportState.customH;
  imageConfigRx.value = imageImportState.rx;
  imageConfigCompress.checked = imageImportState.compress;
  imageConfigFillRadios.forEach(r => { r.checked = r.value === imageImportState.fillMode; });
  imageConfigInsertRadios.forEach(r => { r.checked = r.value === imageImportState.insertMode; });
  syncImageConfigUI();
  renderImageConfigPreview();
  imageConfigMask.hidden = false;
}
function closeImageConfigModal() {
  imageConfigMask.hidden = true;
  imageImportState.file = null;
  imageImportState.dataUrl = '';
  imageImportState.originalW = 0;
  imageImportState.originalH = 0;
  imageImportState.busy = false;
  imageConfigPreview.innerHTML = '';
  imageFileInput.value = '';
  imageConfigConfirm.disabled = false;
  imageConfigConfirm.textContent = '插入';
}
function syncImageConfigUI() {
  imageConfigCustomRow.hidden = imageImportState.ratio !== 'custom';
  imageConfigRxRow.hidden = imageImportState.shape !== 'roundrect';
  imageConfigRatio.disabled = imageImportState.shape === 'circle';
}
async function confirmImageInsert() {
  if (!imageImportState.dataUrl || imageImportState.busy) return;
  imageImportState.busy = true;
  imageConfigConfirm.disabled = true;
  imageConfigConfirm.textContent = '处理中…';
  try {
    const fragment = buildImageSvgFragment();
    const compressedUrl = await maybeCompressImage(fragment.box);
    if (compressedUrl && compressedUrl !== imageImportState.dataUrl) {
      fragment.image = fragment.image.replace(/href="[^"]*"/, `href="${compressedUrl}"`);
    }
    let finalCode;
    if (imageImportState.insertMode === 'replace') {
      finalCode = formatXML(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fragment.box.width} ${fragment.box.height}" width="${fragment.box.width}" height="${fragment.box.height}">\n<defs>${fragment.defs}</defs>\n${fragment.image}\n</svg>`
      );
    } else {
      if (!currentSvg) throw new Error('当前无 SVG 内容，无法追加');
      finalCode = appendImageToSource(fragment.defs, fragment.image);
    }
    codeEl.value = finalCode;
    selectedPath = null;
    renderEditor();
    renderPreview();
    saveDraftDebounced();
    recordSnapshot(true);
    closeImageConfigModal();
    showToast('图片已插入');
  } catch (err) {
    console.error(err);
    showToast('插入失败：' + (err.message || '未知错误'));
    imageImportState.busy = false;
    imageConfigConfirm.disabled = false;
    imageConfigConfirm.textContent = '插入';
  }
}
function appendImageToSource(defsStr, imageStr) {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const clone = currentSvg.cloneNode(true);
  let defs = null;
  for (let i = 0; i < clone.children.length; i++) {
    if (clone.children[i].localName === 'defs') { defs = clone.children[i]; break; }
  }
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    clone.insertBefore(defs, clone.firstChild);
  }
  const tmp = new DOMParser().parseFromString(
    `<svg xmlns="${SVG_NS}"><defs>${defsStr}</defs>${imageStr}</svg>`,
    'image/svg+xml'
  );
  const tmpRoot = tmp.documentElement;
  const tmpDefs = tmpRoot.querySelector('defs');
  if (tmpDefs) {
    Array.from(tmpDefs.childNodes).forEach(child => {
      defs.appendChild(document.importNode(child, true));
    });
  }
  const tmpImage = tmpRoot.querySelector('image');
  if (tmpImage) clone.appendChild(document.importNode(tmpImage, true));
  return formatXML(serializeSVG(clone));
}

const ANIM_TAGS = new Set(['animate', 'animatetransform', 'animatemotion', 'animatecolor', 'set']);

let animAddMenuEl = null;
let canvasAttrTimer = 0;
let canvasViewBoxTimer = 0;
let overlayRafId = 0;
let sliderSuppressTimer = 0;

const ANIM_TEMPLATES = [
  { id: 'fade', label: '淡入淡出',
    build: () => `<animate attributeName="opacity" values="1;0;1" dur="2s" repeatCount="indefinite"/>` },
  { id: 'rotate', label: '旋转',
    build: (el) => {
      const c = getElementCenter(el);
      return `<animateTransform attributeName="transform" type="rotate" from="0 ${c.x} ${c.y}" to="360 ${c.x} ${c.y}" dur="4s" repeatCount="indefinite"/>`;
    } },
  { id: 'scale', label: '缩放',
    build: () => `<animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite"/>` },
  { id: 'translate', label: '平移',
    build: () => `<animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="2s" repeatCount="indefinite"/>` },
  { id: 'color', label: '颜色变化',
    build: () => `<animate attributeName="fill" values="#ff0000;#00ff00;#ff0000" dur="3s" repeatCount="indefinite"/>` },
  { id: 'stroke', label: '描边绘制',
    build: () => `<animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" fill="freeze"/>` },
  { id: 'motion', label: '沿路径运动',
    build: () => `<animateMotion path="M0,0 C 20,-20 40,20 60,0" dur="4s" repeatCount="indefinite"/>` },
  { id: 'pulse', label: '透明度脉冲',
    build: () => `<animate attributeName="opacity" values="1;0.4;1" dur="1s" repeatCount="indefinite"/>` },
  { id: 'custom', label: '自定义…', isCustom: true,
    build: () => `<animate attributeName="" dur="2s" repeatCount="indefinite"/>` }
];

function buildValuePulseAnim(attrName, currentVal, delta) {
  const v = parseFloat(currentVal);
  const base = isFinite(v) ? v : 0;
  const to = base + delta;
  return `<animate attributeName="${attrName}" values="${base};${to};${base}" dur="2s" repeatCount="indefinite"/>`;
}
function buildScalePulseAnim(attrName, currentVal, factor) {
  const v = parseFloat(currentVal);
  const base = isFinite(v) ? v : 1;
  const to = base * factor;
  return `<animate attributeName="${attrName}" values="${base};${to};${base}" dur="2s" repeatCount="indefinite"/>`;
}
function buildColorLoopAnim(attrName) {
  return `<animate attributeName="${attrName}" values="#ff0000;#00ff00;#0000ff;#ff0000" dur="3s" repeatCount="indefinite"/>`;
}
function buildOpacityPulseAnim(attrName) {
  return `<animate attributeName="${attrName}" values="1;0.3;1" dur="2s" repeatCount="indefinite"/>`;
}

const FIELD_ANIM_MAP = {
  'x':                 (el) => buildValuePulseAnim('x', el.getAttribute('x') || 0, 20),
  'y':                 (el) => buildValuePulseAnim('y', el.getAttribute('y') || 0, 20),
  'cx':                (el) => buildValuePulseAnim('cx', el.getAttribute('cx') || 0, 20),
  'cy':                (el) => buildValuePulseAnim('cy', el.getAttribute('cy') || 0, 20),
  'x1':                (el) => buildValuePulseAnim('x1', el.getAttribute('x1') || 0, 20),
  'y1':                (el) => buildValuePulseAnim('y1', el.getAttribute('y1') || 0, 20),
  'x2':                (el) => buildValuePulseAnim('x2', el.getAttribute('x2') || 0, 20),
  'y2':                (el) => buildValuePulseAnim('y2', el.getAttribute('y2') || 0, 20),
  'dx':                (el) => buildValuePulseAnim('dx', el.getAttribute('dx') || 0, 10),
  'dy':                (el) => buildValuePulseAnim('dy', el.getAttribute('dy') || 0, 10),
  'width':             (el) => buildScalePulseAnim('width', el.getAttribute('width') || 100, 1.3),
  'height':            (el) => buildScalePulseAnim('height', el.getAttribute('height') || 100, 1.3),
  'r':                 (el) => buildScalePulseAnim('r', el.getAttribute('r') || 50, 1.3),
  'rx':                (el) => buildScalePulseAnim('rx', el.getAttribute('rx') || 10, 1.3),
  'ry':                (el) => buildScalePulseAnim('ry', el.getAttribute('ry') || 10, 1.3),
  'fill':              (el) => buildColorLoopAnim('fill'),
  'stroke':            (el) => buildColorLoopAnim('stroke'),
  'opacity':           (el) => buildOpacityPulseAnim('opacity'),
  'fill-opacity':      (el) => buildOpacityPulseAnim('fill-opacity'),
  'stroke-opacity':    (el) => buildOpacityPulseAnim('stroke-opacity'),
  'stroke-width':      (el) => buildScalePulseAnim('stroke-width', el.getAttribute('stroke-width') || 2, 2),
  'stroke-dashoffset': () => `<animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite"/>`,
  'font-size':         (el) => buildScalePulseAnim('font-size', el.getAttribute('font-size') || 16, 1.3)
};

function getElementCenter(el) {
  if (!el) return { x: 50, y: 50 };
  const tag = el.localName;
  const num = (a, d) => { const v = parseFloat(el.getAttribute(a)); return isFinite(v) ? v : d; };
  if (tag === 'circle' || tag === 'ellipse') return { x: num('cx', 50), y: num('cy', 50) };
  if (tag === 'rect' || tag === 'image' || tag === 'use') {
    const x = num('x', 0), y = num('y', 0);
    const w = num('width', 100), h = num('height', 100);
    return { x: x + w / 2, y: y + h / 2 };
  }
  if (tag === 'line') {
    return { x: (num('x1', 0) + num('x2', 0)) / 2, y: (num('y1', 0) + num('y2', 0)) / 2 };
  }
  return { x: 50, y: 50 };
}

function hasFieldAnim(el, fieldName) {
  if (!el || !fieldName) return false;
  const anims = el.querySelectorAll('animate, animateTransform, animateColor, set');
  for (const a of anims) {
    if (a.getAttribute('attributeName') === fieldName) return true;
  }
  return false;
}
function hasTransformAnim(el, type) {
  if (!el) return false;
  const anims = el.querySelectorAll('animateTransform');
  for (const a of anims) {
    if (a.getAttribute('attributeName') === 'transform' && a.getAttribute('type') === type) return true;
  }
  return false;
}
function hasAnyAnim(el) {
  if (!el) return false;
  return el.querySelector('animate, animateTransform, animateMotion, animateColor, set') !== null;
}

function removeFieldAnims(el, fieldName) {
  if (!selectedPath || !el) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast('无法定位到源码'); return; }

  const parentCloseStart = loc.isSelfClosing ? -1 : skipElementContent(codeEl.value, loc.start, loc.tag);
  if (loc.isSelfClosing || parentCloseStart < 0) { showToast('该元素无动画'); return; }

  const svgRoot = parseSVG(codeEl.value);
  const target = resolvePath(svgRoot, selectedPath);
  if (!target) return;

  const toRemove = [];
  Array.from(target.children).forEach(child => {
    if (!ANIM_TAGS.has(child.localName.toLowerCase())) return;
    if (child.getAttribute('attributeName') === fieldName) toRemove.push(child);
  });

  if (toRemove.length === 0) return;
  toRemove.forEach(c => c.remove());

  const newCode = formatXML(serializeSVG(svgRoot));
  codeEl.value = newCode;
  currentSvg = svgRoot;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  rebuildAttrPanel();
  showToast(`已删除 ${fieldName} 的动画`);
}
function removeTransformAnims(el, type) {
  if (!selectedPath || !el) return;
  const svgRoot = parseSVG(codeEl.value);
  const target = resolvePath(svgRoot, selectedPath);
  if (!target) return;

  const toRemove = [];
  Array.from(target.children).forEach(child => {
    if (child.localName.toLowerCase() !== 'animatetransform') return;
    if (child.getAttribute('attributeName') === 'transform' &&
        child.getAttribute('type') === type) {
      toRemove.push(child);
    }
  });

  if (toRemove.length === 0) return;
  toRemove.forEach(c => c.remove());

  const newCode = formatXML(serializeSVG(svgRoot));
  codeEl.value = newCode;
  currentSvg = svgRoot;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  rebuildAttrPanel();
  showToast(`已删除 ${type} 动画`);
}
function removeAllAnimsOfElement(el) {
  if (!selectedPath || !el) return;
  if (!confirm('删除该元素的所有动画？')) return;

  const svgRoot = parseSVG(codeEl.value);
  const target = resolvePath(svgRoot, selectedPath);
  if (!target) return;

  const toRemove = [];
  Array.from(target.children).forEach(child => {
    if (ANIM_TAGS.has(child.localName.toLowerCase())) toRemove.push(child);
  });

  if (toRemove.length === 0) return;
  toRemove.forEach(c => c.remove());

  const newCode = formatXML(serializeSVG(svgRoot));
  codeEl.value = newCode;
  currentSvg = svgRoot;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  rebuildAttrPanel();
  showToast('已删除所有动画');
}

function parseTransform(str) {
  const result = { tx: 0, ty: 0, rot: 0, scale: 1, extra: '' };
  if (!str) return result;
  let remain = String(str);

  remain = remain.replace(/translate\s*\(\s*([-\d.]+)(?:\s*[, ]\s*([-\d.]+))?\s*\)/gi,
    (_, x, y) => { result.tx += parseFloat(x) || 0; result.ty += parseFloat(y) || 0; return ''; });
  remain = remain.replace(/rotate\s*\(\s*([-\d.]+)(?:\s*[, ]\s*([-\d.]+)\s*[, ]\s*([-\d.]+))?\s*\)/gi,
    (_, a) => { result.rot += parseFloat(a) || 0; return ''; });
  remain = remain.replace(/scale\s*\(\s*([-\d.]+)(?:\s*[, ]\s*([-\d.]+))?\s*\)/gi,
    (match, sx, sy) => {
      const vx = parseFloat(sx);
      const vy = (sy != null) ? parseFloat(sy) : vx;
      if (isFinite(vx) && isFinite(vy) && Math.abs(vx - vy) < 1e-6) {
        result.scale *= vx;
        return '';
      }
      return match;
    });
  result.extra = remain.replace(/\s+/g, ' ').trim();
  return result;
}
function buildTransform(v, cx, cy) {
  const parts = [];
  if (v.tx !== 0 || v.ty !== 0) parts.push(`translate(${v.tx}, ${v.ty})`);
  if (v.rot !== 0) parts.push(`rotate(${v.rot}, ${cx}, ${cy})`);
  if (v.scale !== 1) parts.push(`scale(${v.scale})`);
  if (v.extra) parts.push(v.extra);
  return parts.join(' ');
}

function getElementPath(el) {
  const svgRoot = canvasEl.firstElementChild;
  if (!svgRoot || el === svgRoot || !svgRoot.contains(el)) return null;
  const path = [];
  let cur = el;
  while (cur && cur !== svgRoot) {
    const parent = cur.parentElement;
    if (!parent) return null;
    let idx = -1;
    for (let i = 0; i < parent.children.length; i++) {
      if (parent.children[i] === cur) { idx = i; break; }
    }
    if (idx < 0) return null;
    path.unshift(idx);
    cur = parent;
  }
  return cur === svgRoot ? path : null;
}
function resolvePath(root, path) {
  let cur = root;
  for (const idx of path) {
    if (!cur || !cur.children || idx >= cur.children.length) return null;
    cur = cur.children[idx];
  }
  return cur;
}
function findTagOffsetByPath(code, path) {
  if (!path || path.length === 0) return null;
  const len = code.length;
  let i = 0;
  let svgEnd = -1;
  while (i < len) {
    if (code[i] !== '<') { i++; continue; }
    if (code.startsWith('<!--', i)) { const e = code.indexOf('-->', i + 4); if (e < 0) return null; i = e + 3; continue; }
    if (code.startsWith('<![CDATA[', i)) { const e = code.indexOf(']]>', i + 9); if (e < 0) return null; i = e + 3; continue; }
    if (code.startsWith('<?', i)) { const e = code.indexOf('?>', i + 2); if (e < 0) return null; i = e + 2; continue; }
    if (code[i + 1] === '!') { const e = code.indexOf('>', i + 2); if (e < 0) return null; i = e + 1; continue; }
    const e = findTagEnd(code, i + 1);
    if (e < 0) return null;
    const t = code.slice(i, e + 1);
    if (/^<svg[\s>\/]/i.test(t)) { svgEnd = e; i = e + 1; break; }
    i = e + 1;
  }
  if (svgEnd < 0) return null;
  const stack = [{ count: 0 }];
  let pos = svgEnd + 1;
  while (pos < len) {
    if (code[pos] !== '<') { pos++; continue; }
    if (code.startsWith('<!--', pos)) { const e = code.indexOf('-->', pos + 4); if (e < 0) return null; pos = e + 3; continue; }
    if (code.startsWith('<![CDATA[', pos)) { const e = code.indexOf(']]>', pos + 9); if (e < 0) return null; pos = e + 3; continue; }
    if (code.startsWith('<?', pos)) { const e = code.indexOf('?>', pos + 2); if (e < 0) return null; pos = e + 2; continue; }
    if (code[pos + 1] === '!') { const e = code.indexOf('>', pos + 2); if (e < 0) return null; pos = e + 1; continue; }
    if (code[pos + 1] === '/') {
      const e = findTagEnd(code, pos + 1);
      if (e < 0) return null;
      stack.pop();
      if (stack.length === 0) return null;
      pos = e + 1;
      continue;
    }
    const e = findTagEnd(code, pos + 1);
    if (e < 0) return null;
    const tag = code.slice(pos, e + 1);
    const isSelf = /\/>\s*$/.test(tag);
    const myDepth = stack.length;
    const parent = stack[myDepth - 1];
    const idx = parent.count;
    parent.count++;
    if (myDepth <= path.length && path[myDepth - 1] === idx) {
      if (myDepth === path.length) {
        return { start: pos, end: e + 1, isSelfClosing: isSelf, tag };
      }
      if (isSelf) return null;
      stack.push({ count: 0 });
      pos = e + 1;
      continue;
    } else {
      if (isSelf) { pos = e + 1; continue; }
      const skipEnd = skipElementContent(code, pos, tag);
      if (skipEnd < 0) return null;
      pos = skipEnd;
      continue;
    }
  }
  return null;
}
function skipElementContent(code, startPos, openTag) {
  const m = openTag.match(/^<([^\s>\/]+)/);
  if (!m) return -1;
  const name = m[1].toLowerCase();
  let depth = 1;
  let i = startPos + openTag.length;
  const len = code.length;
  while (i < len && depth > 0) {
    if (code[i] !== '<') { i++; continue; }
    if (code.startsWith('<!--', i)) { const e = code.indexOf('-->', i + 4); if (e < 0) return -1; i = e + 3; continue; }
    if (code.startsWith('<![CDATA[', i)) { const e = code.indexOf(']]>', i + 9); if (e < 0) return -1; i = e + 3; continue; }
    if (code.startsWith('<?', i)) { const e = code.indexOf('?>', i + 2); if (e < 0) return -1; i = e + 2; continue; }
    if (code[i + 1] === '!') { const e = code.indexOf('>', i + 2); if (e < 0) return -1; i = e + 1; continue; }
    const e = findTagEnd(code, i + 1);
    if (e < 0) return -1;
    const t = code.slice(i, e + 1);
    if (t.startsWith('</')) {
      const cm = t.match(/^<\/\s*([^\s>]+)/);
      if (cm && cm[1].toLowerCase() === name) depth--;
      i = e + 1;
    } else if (/\/>\s*$/.test(t)) {
      i = e + 1;
    } else {
      const om = t.match(/^<([^\s>\/]+)/);
      if (om && om[1].toLowerCase() === name) depth++;
      i = e + 1;
    }
  }
  return depth === 0 ? i : -1;
}
function findRootSvgTag(code) {
  const len = code.length;
  let i = 0;
  while (i < len) {
    if (code[i] !== '<') { i++; continue; }
    if (code.startsWith('<!--', i)) { const e = code.indexOf('-->', i + 4); if (e < 0) return null; i = e + 3; continue; }
    if (code.startsWith('<![CDATA[', i)) { const e = code.indexOf(']]>', i + 9); if (e < 0) return null; i = e + 3; continue; }
    if (code.startsWith('<?', i)) { const e = code.indexOf('?>', i + 2); if (e < 0) return null; i = e + 2; continue; }
    if (code[i + 1] === '!') { const e = code.indexOf('>', i + 2); if (e < 0) return null; i = e + 1; continue; }
    const e = findTagEnd(code, i + 1);
    if (e < 0) return null;
    const t = code.slice(i, e + 1);
    if (/^<svg[\s>\/]/i.test(t)) {
      const isSelf = /\/>\s*$/.test(t);
      let end = e + 1;
      if (!isSelf) {
        const closeEnd = skipElementContent(code, i, t);
        if (closeEnd > 0) end = closeEnd;
      }
      return { start: i, end, openStart: i, openEnd: e + 1, isSelfClosing: isSelf, tag: t };
    }
    i = e + 1;
  }
  return null;
}

function escapeReg(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function escapeAttr(v) {
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function patchAttrInTag(tag, name, value) {
  if (value == null || value === '') return removeAttrInTag(tag, name);
  const lower = name.toLowerCase();
  const re = new RegExp('(\\s)' + escapeReg(lower) + '\\s*=\\s*("[^"]*"|\'[^\']*\')', 'i');
  if (re.test(tag)) return tag.replace(re, `$1${name}="${escapeAttr(value)}"`);
  const closeMatch = tag.match(/(\s*\/?>)$/);
  if (!closeMatch) return tag;
  const insertAt = tag.length - closeMatch[1].length;
  return tag.slice(0, insertAt) + ` ${name}="${escapeAttr(value)}"` + tag.slice(insertAt);
}
function removeAttrInTag(tag, name) {
  const lower = name.toLowerCase();
  const re = new RegExp('\\s' + escapeReg(lower) + '\\s*=\\s*("[^"]*"|\'[^\']*\')', 'i');
  return tag.replace(re, '');
}
function applySelectionOutline(el) {
  if (!selectionOverlayEl) return;
  selectionOverlayEl.innerHTML = '';
  if (!el) return;

  let targetEl = el;
  if (ANIM_TAGS.has(el.localName.toLowerCase())) {
    targetEl = el.parentElement;
    if (!targetEl || targetEl === canvasEl.firstElementChild) return;
  } else if (el === canvasEl.firstElementChild) {
    return;
  }

  let bbox;
  try { bbox = targetEl.getBoundingClientRect(); } catch (_) { return; }
  if (!bbox || bbox.width === 0 || bbox.height === 0) return;

  const stageRect = stageEl.getBoundingClientRect();
  const pad = 3;

  const box = document.createElement('div');
  box.className = 'selection-box';
  box.style.left   = (bbox.left - stageRect.left - pad) + 'px';
  box.style.top    = (bbox.top  - stageRect.top  - pad) + 'px';
  box.style.width  = (bbox.width  + pad * 2) + 'px';
  box.style.height = (bbox.height + pad * 2) + 'px';
  selectionOverlayEl.appendChild(box);
}
function refreshSelectionOverlay() {
  if (!selectionOverlayEl) return;
  if (!selectedPath || !currentSvg) { selectionOverlayEl.innerHTML = ''; return; }
  const el = resolvePath(currentSvg, selectedPath);
  if (el) applySelectionOutline(el);
  else selectionOverlayEl.innerHTML = '';
}
function scheduleRefreshSelectionOverlay() {
  if (!selectionOverlayEl) return;
  if (overlayRafId) return;
  overlayRafId = requestAnimationFrame(() => {
    overlayRafId = 0;
    refreshSelectionOverlay();
  });
}
function selectElement(el) {
  if (!el || el === canvasEl.firstElementChild) return;
  const path = getElementPath(el);
  if (!path) return;
  selectedPath = path;
  canvasRootMode = false;
  canvasBackPath = null;
  applySelectionOutline(el);
  openAttrPanel();
}
function clearSelection() {
  selectedPath = null;
  canvasRootMode = false;
  canvasBackPath = null;
  if (selectionOverlayEl) selectionOverlayEl.innerHTML = '';
  closeAttrPanel();
}

function setMobileView(view) {
  if (!isMobileViewport()) return;
  if (view === 'attr' && !attrPanelOpen) return;
  mobileView = view;
  if (view === 'attr') {
    editorEl.hidden = true;
    attrPanel.hidden = false;
  } else {
    editorEl.hidden = false;
    attrPanel.hidden = true;
  }
  updateMobileViewMenu();
}
function updateMobileViewMenu() {
  if (!mobileViewMenu) return;
  menuViewCode.setAttribute('aria-checked', mobileView === 'code' ? 'true' : 'false');
  menuViewAttr.setAttribute('aria-checked', mobileView === 'attr' ? 'true' : 'false');
  menuViewAttr.disabled = !attrPanelOpen && !canvasRootMode;
}

function openAttrPanel() {
  closeFindPanel();
  closeAllMenus();
  closeAnimAddMenu();
  attrPanelOpen = true;
  rebuildAttrPanel();
  if (isMobileViewport()) setMobileView('attr');
  else attrPanel.hidden = false;
  updateMobileViewMenu();
}
function closeAttrPanel() {
  closeAnimAddMenu();
  if (!attrPanelOpen) return;
  attrPanelOpen = false;
  attrPanel.hidden = true;
  attrPanelBody.innerHTML = '';
  canvasRootMode = false;
  canvasBackPath = null;
  if (selectionOverlayEl) selectionOverlayEl.innerHTML = '';
  if (isMobileViewport()) {
    editorEl.hidden = false;
    mobileView = 'code';
  }
  updateMobileViewMenu();
}

function rebuildAttrPanel() {
  if (!attrPanelOpen) return;

  if (canvasRootMode) {
    rebuildCanvasAttrPanel();
    return;
  }

  if (!selectedPath || !currentSvg) return;
  closeAnimAddMenu();

  attrPanelCanvasBtn.classList.remove('is-active');
  attrPanelCanvasBtn.textContent = '画布';

  const el = resolvePath(currentSvg, selectedPath);
  if (!el) { clearSelection(); return; }
  const tagName = el.localName;
  const isAnim = ANIM_TAGS.has(tagName.toLowerCase());

  attrPanelTag.textContent = '<' + tagName + '>';
  const idVal = el.getAttribute('id');
  if (idVal) { attrPanelId.textContent = '#' + idVal; attrPanelId.hidden = false; }
  else { attrPanelId.hidden = true; }

  ensureHeaderAddBtn(isAnim);

  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  const isReadOnly = !loc;
  attrPanelWarning.hidden = !isReadOnly;
  attrPanelBody.innerHTML = '';

  if (tagName === 'image') {
    const href = el.getAttribute('href') || el.getAttribute('xlink:href');
    const clipPath = el.getAttribute('clip-path');
    if (href) {
      const wrap = document.createElement('div');
      wrap.className = 'attr-image-preview';
      const img = document.createElement('img');
      img.src = href; img.alt = '';
      wrap.appendChild(img);
      attrPanelBody.appendChild(wrap);
    }
    if (!isReadOnly && clipPath && /^url\(#clip-/.test(clipPath)) {
      const reconfigBtn = document.createElement('button');
      reconfigBtn.type = 'button';
      reconfigBtn.className = 'attr-fit-btn';
      reconfigBtn.textContent = '重新配置图片';
      reconfigBtn.addEventListener('click', () => {
        const href2 = el.getAttribute('href') || el.getAttribute('xlink:href');
        if (!href2) { showToast('图片内容缺失'); return; }
        try {
          const arr = href2.split(',');
          const mime = arr[0].match(/:(.*?);/)[1];
          const bstr = atob(arr[1]);
          let n = bstr.length;
          const u8 = new Uint8Array(n);
          while (n--) u8[n] = bstr.charCodeAt(n);
          const blob = new Blob([u8], { type: mime });
          const file = new File([blob], 'reconfig.' + (mime === 'image/png' ? 'png' : 'jpg'), { type: mime });
          loadImageForConfig(file);
        } catch (err) {
          showToast('无法重新配置：' + (err.message || '未知错误'));
        }
      });
      attrPanelBody.appendChild(reconfigBtn);
    }
  }

  if (isAnim) {
    attrPanelBody.appendChild(makeGroup('动画', getAnimSpecs().map(a => makeRow(el, a, isReadOnly, false))));
    if (!isReadOnly) attrPanelBody.appendChild(makeStructureGroup());
    attrPanel.dataset.readonly = isReadOnly ? '1' : '';
    return;
  }

  const posAttrs = getPosAttrs(tagName);
  if (posAttrs.length) {
    attrPanelBody.appendChild(makeGroup('位置尺寸', posAttrs.map(a => makeRow(el, a, isReadOnly, false))));
  }
  attrPanelBody.appendChild(makeTransformGroup(el, isReadOnly));

  const fillSpecs = [
    { name: 'fill',              type: 'color' },
    { name: 'fill-opacity',      type: 'number', step: 0.1, min: 0, max: 1 },
    { name: 'fill-rule',         type: 'select', options: ['', 'nonzero', 'evenodd'] },
    { name: 'stroke',            type: 'color' },
    { name: 'stroke-width',      type: 'number' },
    { name: 'stroke-opacity',    type: 'number', step: 0.1, min: 0, max: 1 },
    { name: 'stroke-linecap',    type: 'select', options: ['', 'butt', 'round', 'square'] },
    { name: 'stroke-linejoin',   type: 'select', options: ['', 'miter', 'round', 'bevel'] },
    { name: 'stroke-miterlimit', type: 'number' },
    { name: 'stroke-dasharray',  type: 'text' },
    { name: 'stroke-dashoffset', type: 'number' },
    { name: 'opacity',           type: 'number', step: 0.1, min: 0, max: 1 }
  ];
  attrPanelBody.appendChild(makeGroup('外观', fillSpecs.map(a => makeRow(el, a, isReadOnly, false))));

  const strokeAdvSpecs = [
    { name: 'vector-effect', type: 'select', options: ['', 'none', 'non-scaling-stroke'] },
    { name: 'paint-order',   type: 'select', options: ['', 'normal', 'stroke', 'markers', 'fill', 'stroke markers', 'fill markers', 'fill stroke'] }
  ];
  attrPanelBody.appendChild(makeGroup('描边增强', strokeAdvSpecs.map(a => makeRow(el, a, isReadOnly, false))));

  const refSpecs = [
    { name: 'filter',       defTag: 'filter' },
    { name: 'clip-path',    defTag: 'clipPath' },
    { name: 'mask',         defTag: 'mask' },
    { name: 'marker-start', defTag: 'marker' },
    { name: 'marker-mid',   defTag: 'marker' },
    { name: 'marker-end',   defTag: 'marker' }
  ];
  attrPanelBody.appendChild(makeGroup('引用', refSpecs.map(a => makeRefRow(el, a, isReadOnly, false))));

  const renderSpecs = [
    { name: 'shape-rendering',      type: 'select', options: ['', 'auto', 'optimizeSpeed', 'crispEdges', 'geometricPrecision'] },
    { name: 'text-rendering',       type: 'select', options: ['', 'auto', 'optimizeSpeed', 'optimizeLegibility', 'geometricPrecision'] },
    { name: 'image-rendering',      type: 'select', options: ['', 'auto', 'optimizeQuality', 'optimizeSpeed', 'pixelated', 'smooth', 'high-quality', 'crisp-edges'] },
    { name: 'color-interpolation',  type: 'select', options: ['', 'auto', 'sRGB', 'linearRGB'] },
    { name: 'mix-blend-mode',       type: 'select', options: ['', 'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion', 'hue', 'saturation', 'color', 'luminosity'] },
    { name: 'isolation',            type: 'select', options: ['', 'auto', 'isolate'] }
  ];
  attrPanelBody.appendChild(makeGroup('渲染', renderSpecs.map(a => makeRow(el, a, isReadOnly, false))));

  const interactSpecs = [
    { name: 'class',          type: 'text' },
    { name: 'pointer-events', type: 'select', options: ['', 'auto', 'none', 'visiblePainted', 'visibleFill', 'visibleStroke', 'visible', 'painted', 'fill', 'stroke', 'all'] },
    { name: 'cursor',         type: 'select', options: ['', 'auto', 'default', 'pointer', 'move', 'crosshair', 'text', 'wait', 'help', 'grab', 'grabbing'] }
  ];
  attrPanelBody.appendChild(makeGroup('交互', interactSpecs.map(a => makeRow(el, a, isReadOnly, false))));

  if (tagName === 'text' || tagName === 'tspan') {
    const textBaseSpecs = [
      { name: 'text-anchor', type: 'select', options: ['', 'start', 'middle', 'end'] },
      { name: 'font-family', type: 'text' },
      { name: 'font-size',   type: 'number' },
      { name: 'font-weight', type: 'select', options: ['', 'normal', 'bold', '100','200','300','400','500','600','700','800','900'] },
      { name: 'font-style',  type: 'select', options: ['', 'normal', 'italic', 'oblique'] },
      { name: 'letter-spacing', type: 'text' }
    ];
    attrPanelBody.appendChild(makeGroup('文本', textBaseSpecs.map(a => makeRow(el, a, isReadOnly, false))));

    const textAdvSpecs = [
      { name: 'dominant-baseline',  type: 'select', options: ['', 'auto', 'text-before-edge', 'text-after-edge', 'middle', 'central', 'hanging', 'alphabetic', 'ideographic', 'mathematical', 'inherit'] },
      { name: 'alignment-baseline', type: 'select', options: ['', 'auto', 'baseline', 'before-edge', 'text-before-edge', 'middle', 'central', 'after-edge', 'text-after-edge', 'ideographic', 'alphabetic', 'hanging', 'mathematical', 'inherit'] },
      { name: 'text-decoration',    type: 'select', options: ['', 'none', 'underline', 'overline', 'line-through'] },
      { name: 'textLength',         type: 'number' },
      { name: 'lengthAdjust',       type: 'select', options: ['', 'spacing', 'spacingAndGlyphs'] },
      { name: 'word-spacing',       type: 'text' },
      { name: 'writing-mode',       type: 'select', options: ['', 'horizontal-tb', 'vertical-rl', 'vertical-lr'] },
      { name: 'font-stretch',       type: 'select', options: ['', 'normal', 'ultra-condensed', 'extra-condensed', 'condensed', 'semi-condensed', 'semi-expanded', 'expanded', 'extra-expanded', 'ultra-expanded'] },
      { name: 'xml:space',          type: 'select', options: ['', 'default', 'preserve'] }
    ];
    attrPanelBody.appendChild(makeGroup('文本高级', textAdvSpecs.map(a => makeRow(el, a, isReadOnly, false))));
  }

  const a11ySpecs = [
    { name: 'role',       type: 'text' },
    { name: 'aria-label', type: 'text' },
    { name: 'tabindex',   type: 'number' },
    { name: 'focusable',  type: 'select', options: ['', 'true', 'false'] }
  ];
  attrPanelBody.appendChild(makeGroup('无障碍', a11ySpecs.map(a => makeRow(el, a, isReadOnly, false))));

  const animChildren = [];
  Array.from(el.children || []).forEach((child, idx) => {
    if (ANIM_TAGS.has(child.localName.toLowerCase())) animChildren.push({ child, idx });
  });

  if (animChildren.length > 0) {
    const animGroup = document.createElement('div');
    animGroup.className = 'attr-group';
    const animTitle = document.createElement('div');
    animTitle.className = 'attr-group__title';
    animTitle.textContent = '动画';
    const animItems = document.createElement('div');
    animItems.className = 'attr-group__items';
    animItems.style.gridTemplateColumns = '1fr';

    animChildren.forEach(({ child, idx }) => {
      const row = document.createElement('div');
      row.className = 'attr-anim-row';

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'attr-anim-item';
      const an = child.getAttribute('attributeName') || '';
      btn.textContent = `<${child.localName}>${an ? ' ' + an : ''}`;
      btn.addEventListener('click', () => {
        const newPath = [...selectedPath, idx];
        const target = resolvePath(currentSvg, newPath);
        if (target) {
          selectedPath = newPath;
          applySelectionOutline(target);
          rebuildAttrPanel();
        }
      });
      row.appendChild(btn);

      if (!isReadOnly) {
        const rmBtn = document.createElement('button');
        rmBtn.type = 'button';
        rmBtn.className = 'attr-anim-remove';
        rmBtn.title = '删除此动画';
        rmBtn.textContent = '−';
        rmBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteSelectedElement();
        });
        row.appendChild(rmBtn);
      }

      animItems.appendChild(row);
    });

    animGroup.appendChild(animTitle);
    animGroup.appendChild(animItems);
    attrPanelBody.appendChild(animGroup);
  }

  if (!isReadOnly) {
    attrPanelBody.appendChild(makeStructureGroup());
  }

  attrPanel.dataset.readonly = isReadOnly ? '1' : '';
}

function rebuildCanvasAttrPanel() {
  if (!currentSvg) { clearSelection(); return; }
  closeAnimAddMenu();

  attrPanelTag.textContent = '<svg>';
  attrPanelId.hidden = true;

  attrPanelCanvasBtn.classList.add('is-active');
  attrPanelCanvasBtn.textContent = canvasBackPath ? '返回' : '画布';

  const loc = findRootSvgTag(codeEl.value);
  const isReadOnly = !loc;
  attrPanelWarning.hidden = !isReadOnly;
  attrPanelBody.innerHTML = '';

  attrPanelBody.appendChild(makeViewBoxGroup(isReadOnly));
  attrPanelBody.appendChild(makeCanvasSizeGroup(isReadOnly));

  const a11ySpecs = [
    { name: 'role',       type: 'text' },
    { name: 'aria-label', type: 'text' },
    { name: 'tabindex',   type: 'number' },
    { name: 'focusable',  type: 'select', options: ['', 'true', 'false'] }
  ];
  attrPanelBody.appendChild(makeGroup('无障碍', a11ySpecs.map(a => makeRow(currentSvg, a, isReadOnly, true))));

  attrPanel.dataset.readonly = isReadOnly ? '1' : '';
}

function makeViewBoxGroup(isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const t = document.createElement('div');
  t.className = 'attr-group__title';
  t.textContent = '画布';
  const items = document.createElement('div');
  items.className = 'attr-group__items';

  const vbAttr = currentSvg.getAttribute('viewBox') || '';
  const p = vbAttr.trim().split(/[\s,]+/).map(Number);
  const vbv = (p.length === 4 && p.every(n => isFinite(n))) ? p : [0, 0, 100, 100];

  const vbWrap = document.createElement('div');
  vbWrap.className = 'attr-viewbox';
  const vbLabels = ['minX', 'minY', 'width', 'height'];
  const vbInputs = [];
  vbLabels.forEach((lbl, i) => {
    const row = document.createElement('div');
    row.className = 'attr-row';
    const label = document.createElement('label');
    label.className = 'attr-row__label';
    label.textContent = lbl;
    row.appendChild(label);
    const ctrl = document.createElement('div');
    ctrl.className = 'attr-row__control';
    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'attr-row__input';
    input.value = String(vbv[i]);
    input.step = 1;
    if (isReadOnly) input.disabled = true;
    input.addEventListener('input', () => {
      const vals = vbInputs.map(el => {
        const v = parseFloat(el.value);
        return isFinite(v) ? v : 0;
      });
      scheduleCanvasViewBoxCommit(vals);
    });
    vbInputs.push(input);
    ctrl.appendChild(input);
    row.appendChild(ctrl);
    vbWrap.appendChild(row);
  });
  items.appendChild(vbWrap);

  items.appendChild(makeRow(currentSvg, { name: 'width', type: 'text' }, isReadOnly, true));
  items.appendChild(makeRow(currentSvg, { name: 'height', type: 'text' }, isReadOnly, true));

  const parOptions = [
    '', 'xMidYMid meet', 'xMidYMid slice', 'none',
    'xMinYMin meet', 'xMinYMin slice',
    'xMidYMin meet', 'xMidYMin slice',
    'xMaxYMin meet', 'xMaxYMin slice',
    'xMinYMid meet', 'xMinYMid slice',
    'xMaxYMid meet', 'xMaxYMid slice',
    'xMinYMax meet', 'xMinYMax slice',
    'xMidYMax meet', 'xMidYMax slice',
    'xMaxYMax meet', 'xMaxYMax slice'
  ];
  items.appendChild(makeRow(currentSvg, {
    name: 'preserveAspectRatio', type: 'select', options: parOptions
  }, isReadOnly, true));

  if (!isReadOnly) {
    const fitBtn = document.createElement('button');
    fitBtn.type = 'button';
    fitBtn.className = 'attr-fit-btn';
    fitBtn.textContent = '自动适配内容';
    fitBtn.addEventListener('click', autoFitViewBox);
    items.appendChild(fitBtn);
  }

  g.appendChild(t);
  g.appendChild(items);
  return g;
}

function makeCanvasSizeGroup(isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const t = document.createElement('div');
  t.className = 'attr-group__title';
  t.textContent = '画布大小';
  const items = document.createElement('div');
  items.className = 'attr-group__items';

  const vbAttr = currentSvg.getAttribute('viewBox') || '';
  const p = vbAttr.trim().split(/[\s,]+/).map(Number);
  const vbv = (p.length === 4 && p.every(n => isFinite(n))) ? p : [0, 0, 100, 100];

  const wRow = document.createElement('div');
  wRow.className = 'attr-row';
  const wLabel = document.createElement('label');
  wLabel.className = 'attr-row__label';
  wLabel.textContent = '宽';
  wRow.appendChild(wLabel);
  const wCtrl = document.createElement('div');
  wCtrl.className = 'attr-row__control';
  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.className = 'attr-row__input';
  wInput.value = String(vbv[2]);
  wInput.min = '1';
  wInput.step = '1';
  wInput.inputMode = 'numeric';
  if (isReadOnly) wInput.disabled = true;
  wCtrl.appendChild(wInput);
  wRow.appendChild(wCtrl);
  items.appendChild(wRow);

  const hRow = document.createElement('div');
  hRow.className = 'attr-row';
  const hLabel = document.createElement('label');
  hLabel.className = 'attr-row__label';
  hLabel.textContent = '高';
  hRow.appendChild(hLabel);
  const hCtrl = document.createElement('div');
  hCtrl.className = 'attr-row__control';
  const hInput = document.createElement('input');
  hInput.type = 'number';
  hInput.className = 'attr-row__input';
  hInput.value = String(vbv[3]);
  hInput.min = '1';
  hInput.step = '1';
  hInput.inputMode = 'numeric';
  if (isReadOnly) hInput.disabled = true;
  hCtrl.appendChild(hInput);
  hRow.appendChild(hCtrl);
  items.appendChild(hRow);

  if (!isReadOnly) {
    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'attr-fit-btn';
    applyBtn.textContent = '应用画布大小';
    applyBtn.addEventListener('click', () => {
      const newW = parseFloat(wInput.value);
      const newH = parseFloat(hInput.value);
      if (!isFinite(newW) || newW <= 0 || !isFinite(newH) || newH <= 0) {
        showToast('请输入有效的宽和高（> 0）');
        return;
      }
      if (newW > 10000 || newH > 10000) {
        showToast('画布尺寸过大（上限 10000）');
        return;
      }
      commitCanvasSize(vbv[0], vbv[1], newW, newH);
    });
    items.appendChild(applyBtn);
  }

  g.appendChild(t);
  g.appendChild(items);
  return g;
}

function commitCanvasSize(minX, minY, newW, newH) {
  const loc = findRootSvgTag(codeEl.value);
  if (!loc) { showToast('无法定位到根 <svg>'); return; }

  const vbAttr = currentSvg.getAttribute('viewBox') || '';
  const p = vbAttr.trim().split(/[\s,]+/).map(Number);
  const oldW = (p.length === 4 && isFinite(p[2]) && p[2] > 0) ? p[2] : newW;
  const oldH = (p.length === 4 && isFinite(p[3]) && p[3] > 0) ? p[3] : newH;

  const centerX = minX + oldW / 2;
  const centerY = minY + oldH / 2;
  const newMinX = centerX - newW / 2;
  const newMinY = centerY - newH / 2;

  const fmt = (n) => String(Math.round(n * 100) / 100);

  const oldOpenTag = codeEl.value.slice(loc.openStart, loc.openEnd);
  let newOpenTag = oldOpenTag;
  newOpenTag = patchAttrInTag(newOpenTag, 'viewBox', `${fmt(newMinX)} ${fmt(newMinY)} ${fmt(newW)} ${fmt(newH)}`);
  newOpenTag = patchAttrInTag(newOpenTag, 'width', String(newW));
  newOpenTag = patchAttrInTag(newOpenTag, 'height', String(newH));

  if (newOpenTag === oldOpenTag) return;

  codeEl.value = codeEl.value.slice(0, loc.openStart) + newOpenTag + codeEl.value.slice(loc.openEnd);

  isFitMode = false;

  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot();

  showToast(`画布已设置为 ${newW} × ${newH}（内容保持居中）`);
  setTimeout(() => { if (canvasRootMode) rebuildCanvasAttrPanel(); }, 300);
}

function autoFitViewBox() {
  const svgRoot = canvasEl.firstElementChild;
  if (!svgRoot) { showToast('预览未就绪'); return; }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  let hasAny = false;

  const skipTags = new Set([
    'defs', 'clippath', 'mask', 'filter', 'lineargradient', 'radialgradient',
    'pattern', 'symbol', 'marker', 'title', 'desc', 'metadata',
    'animate', 'animatetransform', 'animatemotion', 'animatecolor', 'set'
  ]);

  const walk = (el) => {
    const tag = (el.localName || '').toLowerCase();
    if (skipTags.has(tag)) return;
    try {
      if (typeof el.getBBox === 'function') {
        const b = el.getBBox();
        if (b && (b.width > 0 || b.height > 0) &&
            isFinite(b.x) && isFinite(b.y) && isFinite(b.width) && isFinite(b.height)) {
          if (b.x < minX) minX = b.x;
          if (b.y < minY) minY = b.y;
          if (b.x + b.width > maxX) maxX = b.x + b.width;
          if (b.y + b.height > maxY) maxY = b.y + b.height;
          hasAny = true;
        }
      }
    } catch (_) {}
    Array.from(el.children || []).forEach(walk);
  };

  Array.from(svgRoot.children).forEach(walk);

  if (!hasAny || !isFinite(minX) || !isFinite(maxX)) {
    showToast('未找到可适配的内容');
    return;
  }

  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) { showToast('内容尺寸异常'); return; }

  const pad = Math.max(w, h) * 0.05;
  const vx = Math.round((minX - pad) * 100) / 100;
  const vy = Math.round((minY - pad) * 100) / 100;
  const vw = Math.round((w + pad * 2) * 100) / 100;
  const vh = Math.round((h + pad * 2) * 100) / 100;

  commitCanvasAttr('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  showToast(`viewBox 已适配：${vx} ${vy} ${vw} ${vh}`);
  setTimeout(() => { if (canvasRootMode) rebuildCanvasAttrPanel(); }, 300);
}

function scheduleCanvasAttrCommit(name, value) {
  clearTimeout(canvasAttrTimer);
  canvasAttrTimer = setTimeout(() => commitCanvasAttr(name, value), 300);
}
function scheduleCanvasViewBoxCommit(vals) {
  clearTimeout(canvasViewBoxTimer);
  canvasViewBoxTimer = setTimeout(() => {
    commitCanvasAttr('viewBox', vals.join(' '));
  }, 120);
}
function commitCanvasAttr(name, value) {
  const loc = findRootSvgTag(codeEl.value);
  if (!loc) { showToast('无法定位到根 <svg>，已忽略本次修改'); return; }
  const openTag = codeEl.value.slice(loc.openStart, loc.openEnd);
  const patched = patchAttrInTag(openTag, name, value);
  if (patched === openTag) return;
  codeEl.value = codeEl.value.slice(0, loc.openStart) + patched + codeEl.value.slice(loc.openEnd);

  if (name === 'viewBox' || name === 'width' || name === 'height') {
    isFitMode = false;
  }

  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
}

function ensureHeaderAddBtn(isAnim) {
  const titleNode = attrPanelTag.parentNode;
  let wrap = titleNode.querySelector('.attr-panel__add-anim-wrap');

  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'attr-panel__add-anim-wrap';

    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'attr-panel__add-anim';
    addBtn.textContent = '+';
    addBtn.title = '为当前元素添加动画';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (animAddMenuEl) closeAnimAddMenu();
      else showAnimAddMenu(wrap);
    });
    wrap.appendChild(addBtn);

    const rmBtn = document.createElement('button');
    rmBtn.type = 'button';
    rmBtn.className = 'attr-panel__remove-anim';
    rmBtn.textContent = '−';
    rmBtn.title = '删除元素所有动画';
    rmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!selectedPath || !currentSvg) return;
      const el = resolvePath(currentSvg, selectedPath);
      if (el) removeAllAnimsOfElement(el);
    });
    wrap.appendChild(rmBtn);

    titleNode.insertBefore(wrap, attrPanelTag.nextSibling);
  }

  const addBtn = wrap.querySelector('.attr-panel__add-anim');
  const rmBtn = wrap.querySelector('.attr-panel__remove-anim');
  const el = selectedPath && currentSvg ? resolvePath(currentSvg, selectedPath) : null;

  if (isAnim || canvasRootMode) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';
  if (addBtn) addBtn.style.display = '';
  if (rmBtn) rmBtn.style.display = (el && hasAnyAnim(el)) ? '' : 'none';
}

function makeTransformGroup(el, isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const t = document.createElement('div');
  t.className = 'attr-group__title';
  t.textContent = '变换';
  const items = document.createElement('div');
  items.className = 'attr-group__items';

  const raw = el.getAttribute('transform') || '';
  const parsed = parseTransform(raw);
  const center = getElementCenter(el);
  const values = { tx: parsed.tx, ty: parsed.ty, rot: parsed.rot, scale: parsed.scale, extra: parsed.extra };

  const specs = [
    { name: '平移 X', key: 'tx', step: 1, value: values.tx, animType: 'translate',
      animBuilder: () => `<animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="2s" repeatCount="indefinite"/>` },
    { name: '平移 Y', key: 'ty', step: 1, value: values.ty, animType: 'translate',
      animBuilder: () => `<animateTransform attributeName="transform" type="translate" values="0,0;0,20;0,0" dur="2s" repeatCount="indefinite"/>` },
    { name: '旋转', key: 'rot', step: 1, value: values.rot, animType: 'rotate',
      animBuilder: (elInner) => {
        const c = getElementCenter(elInner);
        return `<animateTransform attributeName="transform" type="rotate" from="0 ${c.x} ${c.y}" to="360 ${c.x} ${c.y}" dur="4s" repeatCount="indefinite"/>`;
      } },
    { name: '缩放', key: 'scale', step: 0.1, value: values.scale, min: 0, animType: 'scale',
      animBuilder: () => `<animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite"/>` }
  ];

  specs.forEach(spec => {
    const row = document.createElement('div');
    row.className = 'attr-row';
    const label = document.createElement('label');
    label.className = 'attr-row__label';
    label.textContent = spec.name;

    if (!isReadOnly) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'attr-row__anim-add';
      addBtn.title = `为 ${spec.name} 添加动画`;
      addBtn.textContent = '+';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addFieldAnim(el, spec.name, () => spec.animBuilder(el));
      });
      label.appendChild(addBtn);

      if (hasTransformAnim(el, spec.animType)) {
        const rmBtn = document.createElement('button');
        rmBtn.type = 'button';
        rmBtn.className = 'attr-row__anim-remove';
        rmBtn.title = `删除 ${spec.name} 动画`;
        rmBtn.textContent = '−';
        rmBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeTransformAnims(el, spec.animType);
        });
        label.appendChild(rmBtn);
      }
    }

    row.appendChild(label);
    const ctrl = document.createElement('div');
    ctrl.className = 'attr-row__control';

    const input = document.createElement('input');
    input.type = 'number';
    input.className = 'attr-row__input';
    input.value = String(spec.value);
    if (spec.step != null) input.step = spec.step;
    if (spec.min != null) input.min = spec.min;
    if (isReadOnly) input.disabled = true;

    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      values[spec.key] = isFinite(v) ? v : (spec.key === 'scale' ? 1 : 0);
      scheduleTransformCommit(el, values, center);
    });

    ctrl.appendChild(input);
    row.appendChild(ctrl);
    items.appendChild(row);
  });

  if (parsed.extra) {
    const notice = document.createElement('div');
    notice.style.cssText = 'grid-column:1 / -1;font-size:11px;color:#b45309;padding:2px 0;';
    notice.textContent = '额外变换（保留）：' + parsed.extra;
    items.appendChild(notice);
  }

  if (!isReadOnly) {
    const quickWrap = document.createElement('div');
    quickWrap.style.cssText = 'grid-column:1 / -1;display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'attr-action-btn';
    resetBtn.style.cssText = 'flex:1;min-width:0;padding:5px 8px;font-size:11px;';
    resetBtn.textContent = '复位变换';
    resetBtn.addEventListener('click', () => {
      commitTransform(el, { tx: 0, ty: 0, rot: 0, scale: 1, extra: '' }, center);
      rebuildAttrPanel();
    });
    quickWrap.appendChild(resetBtn);
    items.appendChild(quickWrap);
  }

  g.appendChild(t);
  g.appendChild(items);
  return g;
}
function scheduleTransformCommit(el, values, center) {
  clearTimeout(attrCommitTimer);
  attrCommitTimer = setTimeout(() => commitTransform(el, values, center), 300);
}
function commitTransform(el, values, center) {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast('无法定位到源码，已忽略本次修改'); return; }
  const newValue = buildTransform(values, center.x, center.y);
  const original = codeEl.value.slice(loc.start, loc.end);
  const patched = patchAttrInTag(original, 'transform', newValue);
  if (patched === original) return;
  codeEl.value = codeEl.value.slice(0, loc.start) + patched + codeEl.value.slice(loc.end);
  suppressAttrRebuild = true;
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
  setTimeout(() => { suppressAttrRebuild = false; }, 400);
}

function getPosAttrs(tag) {
  switch (tag) {
    case 'rect':    return ['x','y','width','height','rx','ry'].map(n => ({ name: n, type: 'number' }));
    case 'circle':  return ['cx','cy','r'].map(n => ({ name: n, type: 'number' }));
    case 'ellipse': return ['cx','cy','rx','ry'].map(n => ({ name: n, type: 'number' }));
    case 'line':    return ['x1','y1','x2','y2'].map(n => ({ name: n, type: 'number' }));
    case 'image':   return ['x','y','width','height'].map(n => ({ name: n, type: 'number' }));
    case 'use':     return ['x','y','width','height'].map(n => ({ name: n, type: 'number' }));
    case 'text':
    case 'tspan':   return ['x','y','dx','dy'].map(n => ({ name: n, type: 'number' }));
    case 'path':    return [{ name: 'd', type: 'textarea' }];
    case 'polyline':
    case 'polygon': return [{ name: 'points', type: 'textarea' }];
    default: return [];
  }
}
function getAnimSpecs() {
  return [
    { name: 'attributeName',  type: 'text' },
    { name: 'attributeType',  type: 'select', options: ['', 'auto', 'CSS', 'XML'] },
    { name: 'type',           type: 'select', options: ['', 'translate', 'rotate', 'scale', 'skewX', 'skewY'] },
    { name: 'from',           type: 'text' },
    { name: 'to',             type: 'text' },
    { name: 'by',             type: 'text' },
    { name: 'values',         type: 'textarea' },
    { name: 'path',           type: 'textarea' },
    { name: 'dur',            type: 'text' },
    { name: 'begin',          type: 'text' },
    { name: 'end',            type: 'text' },
    { name: 'repeatCount',    type: 'text' },
    { name: 'repeatDur',      type: 'text' },
    { name: 'calcMode',       type: 'select', options: ['', 'discrete', 'linear', 'paced', 'spline'] },
    { name: 'keyTimes',       type: 'text' },
    { name: 'keySplines',     type: 'text' },
    { name: 'keyPoints',      type: 'text' },
    { name: 'fill',           type: 'select', options: ['', 'remove', 'freeze'] },
    { name: 'additive',       type: 'select', options: ['', 'replace', 'sum'] },
    { name: 'accumulate',     type: 'select', options: ['', 'none', 'sum'] },
    { name: 'rotate',         type: 'text' }
  ];
}

function parseAnimValueList(str) {
  if (!str) return [];
  return str.split(';').map(s => s.trim()).filter(Boolean);
}
function parseAnimValueSingle(str) {
  if (!str) return [];
  const t = String(str).trim();
  if (!t) return [];
  return t.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
}
function isNumericComponent(s) {
  if (s == null) return false;
  const t = String(s).trim();
  if (t === '') return false;
  return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(t);
}
function isColorComponent(s) {
  if (s == null) return false;
  const t = String(s).trim().toLowerCase();
  if (!t) return false;
  if (/^#[0-9a-f]{3}$/i.test(t) || /^#[0-9a-f]{6}$/i.test(t) || /^#[0-9a-f]{8}$/i.test(t)) return true;
  if (/^rgb(a)?\(/.test(t)) return true;
  if (/^hsl(a)?\(/.test(t)) return true;
  return false;
}
function detectValuesType(items) {
  if (!items || items.length === 0) return 'mixed';
  if (items.every(isNumericComponent)) return 'number';
  if (items.every(isColorComponent)) return 'color';
  return 'mixed';
}
function computeRangeForNums(nums) {
  const finites = nums.filter(n => isFinite(n));
  if (finites.length === 0) return { min: 0, max: 1, step: 0.01 };
  const lo = Math.min(...finites);
  const hi = Math.max(...finites);
  if (lo >= 0 && hi <= 1) return { min: 0, max: 1, step: 0.01 };
  const span = hi - lo || 1;
  const pad = Math.max(span * 0.2, 1);
  return { min: Math.floor(lo - pad), max: Math.ceil(hi + pad), step: span <= 10 ? 0.1 : 1 };
}
function hexToColorPickerVal(v) {
  const t = String(v || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(t)) return t;
  if (/^#[0-9a-f]{3}$/i.test(t)) return '#' + t[1]+t[1]+t[2]+t[2]+t[3]+t[3];
  return '#000000';
}
function suppressRebuildForSliders() {
  suppressAttrRebuild = true;
  clearTimeout(sliderSuppressTimer);
  sliderSuppressTimer = setTimeout(() => { suppressAttrRebuild = false; }, 1500);
}

function makeValuesSliders(valuesStr, onCommit) {
  const wrap = document.createElement('div');
  wrap.className = 'attr-sliders-wrap';
  const items = parseAnimValueList(valuesStr);
  if (items.length === 0) return wrap;

  const type = detectValuesType(items);
  if (type === 'mixed') {
    const notice = document.createElement('div');
    notice.className = 'attr-sliders-notice';
    notice.textContent = '含坐标对/单位等复合值，不支持拉杆，请编辑上方文本';
    wrap.appendChild(notice);
    return wrap;
  }

  const limit = Math.min(items.length, 10);
  if (items.length > 10) {
    const notice = document.createElement('div');
    notice.className = 'attr-sliders-notice';
    notice.textContent = `值数量 ${items.length}，仅前 10 个可拉杆`;
    wrap.appendChild(notice);
  }

  if (type === 'number') {
    const nums = items.slice(0, limit).map(Number);
    const range = computeRangeForNums(nums);
    for (let i = 0; i < limit; i++) {
      const row = document.createElement('div');
      row.className = 'attr-slider-row';
      const idx = document.createElement('span');
      idx.className = 'attr-slider-row__idx';
      idx.textContent = String(i + 1);
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'attr-slider-row__range';
      slider.min = String(range.min);
      slider.max = String(range.max);
      slider.step = String(range.step);
      slider.value = String(nums[i]);
      const numInput = document.createElement('input');
      numInput.type = 'number';
      numInput.className = 'attr-slider-row__num';
      numInput.step = String(range.step);
      numInput.value = String(nums[i]);

      const commit = () => {
        suppressRebuildForSliders();
        items[i] = String(slider.value);
        onCommit(items.join(';'));
      };
      slider.addEventListener('input', () => {
        numInput.value = slider.value;
        commit();
      });
      numInput.addEventListener('input', () => {
        const v = parseFloat(numInput.value);
        if (isFinite(v)) {
          if (v < parseFloat(slider.min)) slider.min = String(v);
          if (v > parseFloat(slider.max)) slider.max = String(v);
          slider.value = String(v);
          commit();
        }
      });

      row.appendChild(idx);
      row.appendChild(slider);
      row.appendChild(numInput);
      wrap.appendChild(row);
    }
  } else if (type === 'color') {
    for (let i = 0; i < limit; i++) {
      const row = document.createElement('div');
      row.className = 'attr-slider-row';
      const idx = document.createElement('span');
      idx.className = 'attr-slider-row__idx';
      idx.textContent = String(i + 1);
      const picker = document.createElement('input');
      picker.type = 'color';
      picker.className = 'attr-slider-row__color';
      picker.value = hexToColorPickerVal(items[i]);
      const text = document.createElement('input');
      text.type = 'text';
      text.className = 'attr-slider-row__text';
      text.value = items[i];
      const commit = (val) => {
        suppressRebuildForSliders();
        items[i] = val;
        onCommit(items.join(';'));
      };
      picker.addEventListener('input', () => { text.value = picker.value; commit(picker.value); });
      text.addEventListener('input', () => {
        if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value;
        commit(text.value);
      });
      row.appendChild(idx);
      row.appendChild(picker);
      row.appendChild(text);
      wrap.appendChild(row);
    }
  }
  return wrap;
}

function makeFromToSliders(el, fieldName, onCommit) {
  const wrap = document.createElement('div');
  wrap.className = 'attr-sliders-wrap attr-sliders-wrap--fromto';
  const ownItems = parseAnimValueSingle(el.getAttribute(fieldName) || '');
  const otherName = fieldName === 'from' ? 'to' : 'from';
  const otherItems = parseAnimValueSingle(el.getAttribute(otherName) || '');
  if (ownItems.length !== 1 || otherItems.length !== 1) return null;

  if (isNumericComponent(ownItems[0]) && isNumericComponent(otherItems[0])) {
    const nums = [parseFloat(ownItems[0]), parseFloat(otherItems[0])].filter(isFinite);
    const range = computeRangeForNums(nums);
    const ownNum = parseFloat(ownItems[0]);
    const row = document.createElement('div');
    row.className = 'attr-slider-row attr-slider-row--single';
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'attr-slider-row__range';
    slider.min = String(range.min);
    slider.max = String(range.max);
    slider.step = String(range.step);
    slider.value = String(isFinite(ownNum) ? ownNum : 0);
    const numInput = document.createElement('input');
    numInput.type = 'number';
    numInput.className = 'attr-slider-row__num';
    numInput.step = String(range.step);
    numInput.value = String(isFinite(ownNum) ? ownNum : 0);
    const commit = () => { suppressRebuildForSliders(); onCommit(String(slider.value)); };
    slider.addEventListener('input', () => { numInput.value = slider.value; commit(); });
    numInput.addEventListener('input', () => {
      const v = parseFloat(numInput.value);
      if (isFinite(v)) {
        if (v < parseFloat(slider.min)) slider.min = String(v);
        if (v > parseFloat(slider.max)) slider.max = String(v);
        slider.value = String(v);
        commit();
      }
    });
    row.appendChild(slider);
    row.appendChild(numInput);
    wrap.appendChild(row);
    return wrap;
  }

  if (isColorComponent(ownItems[0]) && isColorComponent(otherItems[0])) {
    const row = document.createElement('div');
    row.className = 'attr-slider-row attr-slider-row--single';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'attr-slider-row__color';
    picker.value = hexToColorPickerVal(ownItems[0]);
    const text = document.createElement('input');
    text.type = 'text';
    text.className = 'attr-slider-row__text';
    text.value = ownItems[0];
    const commit = (val) => { suppressRebuildForSliders(); onCommit(val); };
    picker.addEventListener('input', () => { text.value = picker.value; commit(picker.value); });
    text.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value;
      commit(text.value);
    });
    row.appendChild(picker);
    row.appendChild(text);
    wrap.appendChild(row);
    return wrap;
  }
  return null;
}

function makeGroup(title, rows) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const t = document.createElement('div');
  t.className = 'attr-group__title'; t.textContent = title;
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  rows.forEach(r => items.appendChild(r));
  g.appendChild(t); g.appendChild(items);
  return g;
}
function makeRow(el, spec, isReadOnly, isCanvas) {
  const row = document.createElement('div');
  row.className = 'attr-row';

  if (spec.type === 'textarea') row.classList.add('attr-row--full');

  let hasFromToSliders = false;
  if ((spec.name === 'from' || spec.name === 'to') && spec.type === 'text') {
    const ownItems = parseAnimValueSingle(el.getAttribute(spec.name) || '');
    const otherName = spec.name === 'from' ? 'to' : 'from';
    const otherItems = parseAnimValueSingle(el.getAttribute(otherName) || '');
    if (ownItems.length === 1 && otherItems.length === 1) {
      if ((isNumericComponent(ownItems[0]) && isNumericComponent(otherItems[0])) ||
          (isColorComponent(ownItems[0]) && isColorComponent(otherItems[0]))) {
        row.classList.add('attr-row--full');
        hasFromToSliders = true;
      }
    }
  }

  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = spec.name;

  const animBuilder = FIELD_ANIM_MAP[spec.name];
  if (animBuilder && !isReadOnly && !isCanvas && spec.type !== 'textarea') {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'attr-row__anim-add';
    addBtn.title = `为 ${spec.name} 添加动画`;
    addBtn.textContent = '+';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addFieldAnim(el, spec.name, animBuilder);
    });
    label.appendChild(addBtn);

    if (hasFieldAnim(el, spec.name)) {
      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'attr-row__anim-remove';
      rmBtn.title = `删除 ${spec.name} 动画`;
      rmBtn.textContent = '−';
      rmBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFieldAnims(el, spec.name);
      });
      label.appendChild(rmBtn);
    }
  }

  row.appendChild(label);
  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';
  row.appendChild(ctrl);
  let value = el.getAttribute(spec.name) || '';
  if (!value && el.style && el.style.getPropertyValue(spec.name)) {
    value = el.style.getPropertyValue(spec.name);
    label.classList.add('attr-row__label--from-style');
  }
  let input;
  if (spec.type === 'select') {
    input = document.createElement('select');
    input.className = 'attr-row__select';
    spec.options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt === '' ? '(默认)' : opt;
      input.appendChild(o);
    });
    input.value = value;
  } else if (spec.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'attr-row__textarea';
    input.value = value;
  } else if (spec.type === 'color') {
    const wrap = document.createElement('div');
    wrap.className = 'attr-color';
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.className = 'attr-color__picker';
    picker.value = /^#[0-9a-f]{6}$/i.test(value) ? value
                : /^#[0-9a-f]{3}$/i.test(value) ? '#' + value[1]+value[1]+value[2]+value[2]+value[3]+value[3]
                : '#000000';
    const text = document.createElement('input');
    text.type = 'text';
    text.className = 'attr-row__input attr-color__text';
    text.value = value;
    text.placeholder = '#000000 / none / url(#id)';
    picker.addEventListener('input', () => {
      text.value = picker.value;
      if (isCanvas) commitCanvasAttr(spec.name, picker.value);
      else commitAttrChange(el, spec.name, picker.value);
    });
    text.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value;
      if (isCanvas) scheduleCanvasAttrCommit(spec.name, text.value);
      else scheduleAttrCommit(el, spec.name, text.value);
    });
    wrap.appendChild(picker); wrap.appendChild(text);
    ctrl.appendChild(wrap);
    if (isReadOnly) { picker.disabled = true; text.disabled = true; }
    return row;
  } else {
    input = document.createElement('input');
    input.type = spec.type === 'number' ? 'number' : 'text';
    if (spec.type === 'number') {
      if (spec.step != null) input.step = spec.step;
      if (spec.min  != null) input.min  = spec.min;
      if (spec.max  != null) input.max  = spec.max;
    }
    input.className = 'attr-row__input';
    input.value = value;
    if (spec.name === 'd' || spec.name === 'points') {
      input.placeholder = spec.name === 'd' ? 'M 0 0 L 100 0' : '0,0 100,0 100,100';
    }
  }
  input.addEventListener('input', () => {
    if (isCanvas) scheduleCanvasAttrCommit(spec.name, input.value);
    else scheduleAttrCommit(el, spec.name, input.value);
  });
  if (spec.type === 'select') {
    input.addEventListener('change', () => {
      if (isCanvas) {
        clearTimeout(canvasAttrTimer);
        commitCanvasAttr(spec.name, input.value);
      } else {
        commitAttrChange(el, spec.name, input.value);
      }
    });
  }
  if (isReadOnly) input.disabled = true;
  ctrl.appendChild(input);

  if (!isReadOnly && !isCanvas && spec.name === 'values' && spec.type === 'textarea') {
    const sliders = makeValuesSliders(el.getAttribute('values') || '', (newVal) => {
      commitAttrChange(el, 'values', newVal);
    });
    if (sliders.childElementCount > 0) ctrl.appendChild(sliders);
  }
  if (!isReadOnly && !isCanvas && hasFromToSliders) {
    const sliders = makeFromToSliders(el, spec.name, (newVal) => {
      commitAttrChange(el, spec.name, newVal);
    });
    if (sliders && sliders.childElementCount > 0) ctrl.appendChild(sliders);
  }

  return row;
}

function collectDefsIds(tagName) {
  if (!currentSvg) return [];
  const ids = [];
  currentSvg.querySelectorAll(tagName).forEach(el => {
    const id = el.getAttribute('id');
    if (id) ids.push(id);
  });
  return ids;
}
function makeRefRow(el, spec, isReadOnly, isCanvas) {
  const row = document.createElement('div');
  row.className = 'attr-row';
  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = spec.name;
  row.appendChild(label);
  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';

  const targetEl = isCanvas ? currentSvg : el;
  const value = targetEl.getAttribute(spec.name) || '';
  const m = value.match(/url\(#([^)]+)\)/);
  const currentId = m ? m[1] : '';

  const ids = collectDefsIds(spec.defTag);
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'attr-row__input';
  input.value = currentId;
  input.placeholder = ids.length ? ids.slice(0, 2).map(i => '#' + i).join(' / ') : '输入 id';
  if (isReadOnly) input.disabled = true;

  const listId = 'ref-list-' + Math.random().toString(36).slice(2, 8);
  const datalist = document.createElement('datalist');
  datalist.id = listId;
  ids.forEach(id => {
    const opt = document.createElement('option');
    opt.value = id;
    datalist.appendChild(opt);
  });
  input.setAttribute('list', listId);

  const commit = () => {
    const v = input.value.trim().replace(/^#/, '');
    const finalVal = v ? `url(#${v})` : '';
    if (isCanvas) commitCanvasAttr(spec.name, finalVal);
    else commitAttrChange(el, spec.name, finalVal);
  };
  input.addEventListener('change', commit);

  ctrl.appendChild(input);
  ctrl.appendChild(datalist);
  row.appendChild(ctrl);
  return row;
}

function makeStructureGroup() {
  const group = document.createElement('div');
  group.className = 'attr-group';
  const t = document.createElement('div');
  t.className = 'attr-group__title'; t.textContent = '结构';
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  items.style.gridTemplateColumns = '1fr 1fr';

  const dupBtn = document.createElement('button');
  dupBtn.type = 'button';
  dupBtn.className = 'attr-action-btn';
  dupBtn.textContent = '复制元素';
  dupBtn.addEventListener('click', duplicateSelectedElement);

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'attr-action-btn attr-action-btn--danger';
  delBtn.textContent = '删除元素';
  delBtn.addEventListener('click', deleteSelectedElement);

  items.appendChild(dupBtn);
  items.appendChild(delBtn);
  group.appendChild(t);
  group.appendChild(items);
  return group;
}

function scheduleAttrCommit(el, name, value) {
  clearTimeout(attrCommitTimer);
  attrCommitTimer = setTimeout(() => commitAttrChange(el, name, value), 300);
}
function commitAttrChange(el, name, value) {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast('无法定位到源码，已忽略本次修改'); return; }
  const original = codeEl.value.slice(loc.start, loc.end);
  const patched = patchAttrInTag(original, name, value);
  if (patched === original) return;
  const newCode = codeEl.value.slice(0, loc.start) + patched + codeEl.value.slice(loc.end);
  codeEl.value = newCode;
  const wasSuppressed = suppressAttrRebuild;
  suppressAttrRebuild = true;
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
  setTimeout(() => { if (!wasSuppressed) suppressAttrRebuild = false; }, 400);
}

function deleteSelectedElement() {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast('无法定位到源码，无法删除'); return; }
  let endOffset = loc.end;
  if (!loc.isSelfClosing) {
    const end = skipElementContent(codeEl.value, loc.start, loc.tag);
    if (end < 0) { showToast('删除失败：源码结构异常'); return; }
    endOffset = end;
  }
  let start = loc.start;
  while (start > 0 && (codeEl.value[start-1] === ' ' || codeEl.value[start-1] === '\t')) start--;
  if (start > 0 && codeEl.value[start-1] === '\n') start--;
  while (endOffset < codeEl.value.length && (codeEl.value[endOffset] === '\r' || codeEl.value[endOffset] === '\n')) {
    endOffset++;
    break;
  }
  codeEl.value = codeEl.value.slice(0, start) + codeEl.value.slice(endOffset);
  selectedPath = null;
  if (selectionOverlayEl) selectionOverlayEl.innerHTML = '';
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
  closeAttrPanel();
  showToast('已删除');
}
function duplicateSelectedElement() {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast('无法定位到源码，无法复制'); return; }
  let block = codeEl.value.slice(loc.start, loc.end);
  if (!loc.isSelfClosing) {
    const end = skipElementContent(codeEl.value, loc.start, loc.tag);
    if (end < 0) { showToast('复制失败：源码结构异常'); return; }
    block = codeEl.value.slice(loc.start, end);
  }
  const m = block.match(/\sid="([^"]+)"/);
  if (m) {
    const newId = m[1] + '-copy';
    block = block.replace(/\sid="[^"]+"/, ` id="${newId}"`);
  }
  const insertPos = loc.isSelfClosing ? loc.end : skipElementContent(codeEl.value, loc.start, loc.tag);
  codeEl.value = codeEl.value.slice(0, insertPos) + '\n' + block + codeEl.value.slice(insertPos);
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
  showToast('已复制');
}
function locateSelectedInSource() {
  if (canvasRootMode) {
    const rootLoc = findRootSvgTag(codeEl.value);
    if (!rootLoc) { showToast('无法定位到根 <svg>'); return; }
    if (isMobileViewport() && mobileView === 'attr') setMobileView('code');
    try { codeEl.focus(); codeEl.setSelectionRange(rootLoc.start, rootLoc.end); } catch(_) {}
    const lineNo = codeEl.value.slice(0, rootLoc.start).split('\n').length;
    const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
    const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
    codeEl.scrollTop = Math.max(0, (lineNo - 2) * lineHeight - codeEl.clientHeight / 3 + padTop);
    syncScroll();
    updateCurrentLineHighlight();
    return;
  }

  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast('无法定位到源码'); return; }
  let end = loc.end;
  if (!loc.isSelfClosing) {
    const e = skipElementContent(codeEl.value, loc.start, loc.tag);
    if (e > 0) end = e;
  }

  if (isMobileViewport() && mobileView === 'attr') setMobileView('code');

  try { codeEl.focus(); codeEl.setSelectionRange(loc.start, end); } catch(_) {}
  const lineNo = codeEl.value.slice(0, loc.start).split('\n').length;
  const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
  const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
  codeEl.scrollTop = Math.max(0, (lineNo - 2) * lineHeight - codeEl.clientHeight / 3 + padTop);
  syncScroll();
  updateCurrentLineHighlight();
}

function insertAnimChild(parentPath, animMarkup) {
  const loc = findTagOffsetByPath(codeEl.value, parentPath);
  if (!loc) return false;
  const code = codeEl.value;
  const animTag = animMarkup.trim();

  if (loc.isSelfClosing) {
    const m = loc.tag.match(/^<([^\s>\/]+)/);
    const tagName = m ? m[1] : 'g';
    const openTag = loc.tag.replace(/\/>\s*$/, '>');
    const lineStart = code.lastIndexOf('\n', loc.start) + 1;
    const parentIndent = (code.slice(lineStart, loc.start).match(/^[ \t]*/) || [''])[0];
    const childIndent = parentIndent + '  ';
    const indentAnim = animTag.split('\n').map(l => childIndent + l).join('\n');
    const newBlock = `${openTag}\n${indentAnim}\n${parentIndent}</${tagName}>`;
    codeEl.value = code.slice(0, loc.start) + newBlock + code.slice(loc.end);
    return true;
  }

  const closeEnd = skipElementContent(code, loc.start, loc.tag);
  if (closeEnd < 0) return false;
  const closeStart = code.lastIndexOf('</', closeEnd - 1);
  if (closeStart < 0) return false;

  const lineStartBefore = code.lastIndexOf('\n', closeStart - 1) + 1;
  const beforeClose = code.slice(lineStartBefore, closeStart);
  const hasIndentBefore = /^[ \t]*$/.test(beforeClose);

  let parentIndent;
  if (hasIndentBefore) {
    parentIndent = beforeClose;
  } else {
    const openLineStart = code.lastIndexOf('\n', loc.start) + 1;
    parentIndent = (code.slice(openLineStart, loc.start).match(/^[ \t]*/) || [''])[0];
  }
  const childIndent = parentIndent + '  ';
  const indentAnim = animTag.split('\n').map(l => childIndent + l).join('\n');

  if (hasIndentBefore) {
    codeEl.value = code.slice(0, lineStartBefore) + indentAnim + '\n' + code.slice(lineStartBefore);
  } else {
    codeEl.value = code.slice(0, closeStart) + '\n' + indentAnim + '\n' + parentIndent + code.slice(closeStart);
  }
  return true;
}

function addAnimTemplate(templateId) {
  if (!selectedPath || !currentSvg) return;
  const el = resolvePath(currentSvg, selectedPath);
  if (!el) return;
  const template = ANIM_TEMPLATES.find(t => t.id === templateId);
  if (!template) return;

  const parentPath = [...selectedPath];
  const animMarkup = template.build(el);

  if (!insertAnimChild(parentPath, animMarkup)) {
    showToast('插入动画失败：无法定位源码');
    return;
  }

  renderEditor();
  saveDraftDebounced();
  recordSnapshot(true);

  let newSvg;
  try { newSvg = parseSVG(codeEl.value); }
  catch (err) {
    showToast('插入后解析失败：' + (err.message || '未知错误'));
    return;
  }
  const newParent = resolvePath(newSvg, parentPath);
  if (!newParent || newParent.children.length === 0) {
    showToast('插入后未找到新动画');
    return;
  }
  const newIdx = newParent.children.length - 1;

  currentSvg = newSvg;
  selectedPath = [...parentPath, newIdx];

  renderPreview();
  rebuildAttrPanel();
  showToast(template.isCustom ? '已添加空白动画，请填写参数' : `已添加：${template.label}`);
  closeAnimAddMenu();
}

function addFieldAnim(el, fieldName, animBuilder) {
  if (!selectedPath || !currentSvg) return;
  if (!el) return;

  const markup = animBuilder(el);
  if (!markup) { showToast('无法为 ' + fieldName + ' 生成动画'); return; }

  const parentPath = [...selectedPath];

  if (!insertAnimChild(parentPath, markup)) {
    showToast('插入动画失败：无法定位源码');
    return;
  }

  renderEditor();
  saveDraftDebounced();
  recordSnapshot(true);

  let newSvg;
  try { newSvg = parseSVG(codeEl.value); }
  catch (err) {
    showToast('插入后解析失败：' + (err.message || '未知错误'));
    return;
  }
  const newParent = resolvePath(newSvg, parentPath);
  if (!newParent || newParent.children.length === 0) {
    showToast('插入后未找到新动画');
    return;
  }
  const newIdx = newParent.children.length - 1;

  currentSvg = newSvg;
  selectedPath = [...parentPath, newIdx];

  renderPreview();
  rebuildAttrPanel();
  showToast(`已为 ${fieldName} 添加动画`);
}

function showAnimAddMenu(anchorEl) {
  closeAnimAddMenu();
  const menu = document.createElement('div');
  menu.className = 'attr-anim-menu';
  ANIM_TEMPLATES.forEach(t => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t.label;
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addAnimTemplate(t.id);
    });
    menu.appendChild(btn);
  });
  document.body.appendChild(menu);
  const rect = anchorEl.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const gap = 4;
  let left = rect.left;
  if (left + menuRect.width > vw - 8) left = vw - menuRect.width - 8;
  if (left < 8) left = 8;
  let top = rect.bottom + gap;
  if (top + menuRect.height > vh - 8) {
    top = rect.top - menuRect.height - gap;
    if (top < 8) top = 8;
  }
  menu.style.position = 'fixed';
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  menu.style.right = 'auto';
  menu.style.bottom = 'auto';
  menu.style.zIndex = '200';
  menu.style.maxHeight = Math.min(280, vh - 16) + 'px';
  animAddMenuEl = menu;
}
attrPanelLocate.addEventListener('click', locateSelectedInSource);
attrPanelClose.addEventListener('click', clearSelection);

attrPanelCanvasBtn.addEventListener('click', () => {
  if (canvasRootMode) {
    if (canvasBackPath) {
      const path = canvasBackPath;
      canvasBackPath = null;
      canvasRootMode = false;
      selectedPath = path;
      const el = resolvePath(currentSvg, path);
      if (el) applySelectionOutline(el);
      rebuildAttrPanel();
    } else {
      clearSelection();
    }
  } else {
    canvasBackPath = selectedPath;
    selectedPath = null;
    canvasRootMode = true;
    attrPanelOpen = true;
    attrPanel.hidden = false;
    if (selectionOverlayEl) selectionOverlayEl.innerHTML = '';
    rebuildAttrPanel();
    if (isMobileViewport()) setMobileView('attr');
    updateMobileViewMenu();
  }
});

})();