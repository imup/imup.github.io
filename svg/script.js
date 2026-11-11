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
  const DANGEROUS = new Set(['script', 'iframe', 'object', 'embed', 'meta', 'link']);
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
const RESOURCE_TAGS = ['image', 'use', 'feimage'];
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
      position: relative;
      width: 100%; height: 100%;
      overflow: hidden;
      background: #ffffff;
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
      position: absolute;
      left: 50%; top: 50%;
      transform-origin: center center;
      will-change: transform;
      transition: opacity .2s;
    }
    .canvas > * { display: block; }
    .canvas a, .canvas a * { pointer-events: none; cursor: default; }
    .stage.is-stale .canvas { opacity: 0.35; }
  </style>
  <div class="stage bg-checker">
    <div class="canvas"></div>
  </div>
`;
const stageEl  = shadow.querySelector('.stage');
const canvasEl = shadow.querySelector('.canvas');
class DomRenderer {
  constructor() { this.host = null; this.type = 'dom'; }
  getType() { return this.type; }
  async mount(hostEl, svgRoot, size) {
    this.host = hostEl;
    const node = document.importNode(svgRoot, true);
    node.setAttribute('width',  String(Math.round(size.width)));
    node.setAttribute('height', String(Math.round(size.height)));
    hostEl.replaceChildren(node);
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
  const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
  if (!blob) throw new Error('图像生成失败');
  return blob;
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
  fitToView();
  updateButtons();
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
  const isAppleMobile = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isIPadOS = navigator.maxTouchPoints > 2 && /Macintosh/.test(navigator.userAgent);
  return isAppleMobile || isIPadOS;
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
    lockRatio: true,
    hasViewBox: !!currentSvg.getAttribute('viewBox')
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
    exportWInput.focus();
    exportWInput.select();
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
let isSplitting = false;
let pointerCaptured = false;
let splitHasMoved = false;
let splitStartY = 0, splitStartH = 0;

let lastSplitDownTime = 0;
let lastSplitDownY = 0;
const DBLCLICK_INTERVAL = 350;
const DBLCLICK_DISTANCE = 10;

function getPreviewHeight() { return previewWrap.getBoundingClientRect().height; }

function onSplitterPointerDown(e) {
  if (e.target.closest('.tool-btn') || e.target.closest('.dropdown')) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  const now = Date.now();
  if (now - lastSplitDownTime < DBLCLICK_INTERVAL &&
      Math.abs(e.clientY - lastSplitDownY) < DBLCLICK_DISTANCE) {
    lastSplitDownTime = 0;
    lastSplitDownY = 0;
    isSplitting = false;
    if (pointerCaptured) {
      try { splitterEl.releasePointerCapture(e.pointerId); } catch(_) {}
      pointerCaptured = false;
    }
    resetSplitToDefault();
    return;
  }
  lastSplitDownTime = now;
  lastSplitDownY = e.clientY;

  isSplitting = true;
  splitHasMoved = false;
  splitStartY = e.clientY;
  splitStartH = getPreviewHeight();
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
  splitRatio = ratio;
  splitState = 'default';

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
  splitterGrips.forEach(g => {
    g.classList.remove('is-snap-preview', 'is-snap-code');
  });

  if (splitHasMoved) {
    lastSplitDownTime = 0;
    lastSplitDownY = 0;
    splitHasMoved = false;

    if (splitRatio <= 0.10) {
      splitState = 'preview-max';
      applySplit();
      showToast('预览已最大化（双击拖动条恢复）');
    } else if (splitRatio >= 0.90) {
      splitState = 'code-max';
      applySplit();
      showToast('代码已最大化（双击拖动条恢复）');
    }
    return;
  }
  splitHasMoved = false;
}
function resetSplitToDefault() {
  splitState = 'default';
  splitRatio = 0.8;
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
let lineNodes = [];
let lastLineHtmls = [];
let currentLineEl = null;
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
  const newLen = lineHtmls.length;
  const oldLen = lineNodes.length;
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
  for (let i = newLen; i < oldLen; i++) {
    container.removeChild(lineNodes[i]);
  }
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
  let i = openEnd + 1;
  let nest = 0;
  const lower = name.toLowerCase();
  while (i < xml.length) {
    const lt = xml.indexOf('<', i);
    if (lt === -1) return -1;
    if (xml.startsWith('<!--', lt)) {
      const c = xml.indexOf('-->', lt + 4);
      if (c === -1) return -1;
      i = c + 3; continue;
    }
    if (xml.startsWith('<![CDATA[', lt)) {
      const c = xml.indexOf(']]>', lt + 9);
      if (c === -1) return -1;
      i = c + 3; continue;
    }
    if (xml.startsWith('<?', lt)) {
      const c = xml.indexOf('?>', lt + 2);
      if (c === -1) return -1;
      i = c + 2; continue;
    }
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
  if (undoIndex >= 0 && undoStack[undoIndex].text !== cur) {
    recordSnapshot(true);
  }
  if (undoIndex <= 0) { showToast('没有可撤销的操作'); return; }
  undoIndex--; applySnapshot(undoStack[undoIndex]);
  showToast('已撤销');
}
function redo() {
  const cur = codeEl.value;
  if (undoIndex >= 0 && undoIndex < undoStack.length - 1 && undoStack[undoIndex].text !== cur) {
    recordSnapshot(true);
  }
  if (undoIndex >= undoStack.length - 1) { showToast('没有可重做的操作'); return; }
  undoIndex++; applySnapshot(undoStack[undoIndex]);
  showToast('已重做');
}
function updateUndoRedoMenu() {
  btnUndo.disabled = undoIndex <= 0;
  btnRedo.disabled = undoIndex >= undoStack.length - 1;
}

function openFindPanel() {
  findPanel.hidden = false;
  positionFindPanel();
  findInput.focus();
  findInput.select();
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
  scrollToSelection();
  updateCurrentLineHighlight();
}
function replaceOne() {
  const query = findInput.value;
  const replacement = replaceInput.value;
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
  const query = findInput.value;
  const replacement = replaceInput.value;
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
  const btnRect = btnFind.getBoundingClientRect();
  const gap = 6;
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  const panelW = findPanel.offsetWidth || 300;
  const panelH = findPanel.offsetHeight || 120;

  let top;
  if (btnRect.top - gap - panelH >= 8) {
    top = btnRect.top - gap - panelH;
  } else if (btnRect.bottom + gap + panelH <= vh - 8) {
    top = btnRect.bottom + gap;
  } else {
    top = Math.max(8, vh - panelH - 8);
  }

  let right = vw - btnRect.right;
  right = Math.min(Math.max(right, 8), vw - panelW - 8);

  findPanel.style.top = top + 'px';
  findPanel.style.right = right + 'px';
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
      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG 无法渲染'));
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
}
function positionDropdown(btn, menu) {
  menu.classList.remove('dropdown--up');
  void menu.offsetHeight;
  const btnRect = btn.getBoundingClientRect();
  const menuH = menu.offsetHeight;
  const vh = window.innerHeight;
  const spaceBelow = vh - btnRect.bottom - 12;
  const spaceAbove = btnRect.top - 12;
  if (menuH > spaceBelow && spaceAbove > spaceBelow) {
    menu.classList.add('dropdown--up');
  }
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
  if (!findPanel.hidden && !e.target.closest('#findPanel')) {
    closeFindPanel();
  }
});
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!historyMask.hidden) { closeHistory(); return; }
  if (!modalMask.hidden) { closeExportModal(); return; }
  if (!findPanel.hidden) { closeFindPanel(); return; }
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
  try {
    const items = e.dataTransfer.items;
    if (items && items.length > 0 && items[0].kind === 'file') {
      const type = items[0].type || '';
      if (/svg/i.test(type)) dropOverlayText.textContent = '松开以载入 SVG 文件';
      else if (type) dropOverlayText.textContent = `松开以载入：${type}`;
    }
  } catch(_) {}
});
window.addEventListener('dragleave', e => {
  e.preventDefault();
  dragCounter--;
  if (dragCounter <= 0) {
    dragCounter = 0;
    dropOverlay.hidden = true;
    dropOverlayText.textContent = '松开以载入文件（SVG）';
  }
});
window.addEventListener('drop', e => {
  e.preventDefault();
  dragCounter = 0;
  dropOverlay.hidden = true;
  dropOverlayText.textContent = '松开以载入文件（SVG）';
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

previewWrap.addEventListener('pointerdown', e => {
  if (!currentSvg || !modalMask.hidden) return;
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.target.closest && e.target.closest('.preview-actions, .view-controls, .warning-bar')) return;
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
    isPanning = true;
    panHasMoved = false;
    panStartX = p.x;
    panStartY = p.y;
    panStartTx = previewPanX;
    panStartTy = previewPanY;
    return;
  }
  if (!isPanning) return;
  isPanning = false;
  try { previewWrap.releasePointerCapture(e.pointerId); } catch(_) {}
}
previewWrap.addEventListener('pointerup', endPan);
previewWrap.addEventListener('pointercancel', endPan);
previewWrap.addEventListener('dblclick', e => {
  if (!currentSvg || !modalMask.hidden) return;
  if (e.target.closest && e.target.closest('.preview-actions, .view-controls, .warning-bar')) return;
  fitToView();
  showToast('已回中');
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
  if (!findPanel.hidden)   positionFindPanel();
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

})();