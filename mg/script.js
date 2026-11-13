(function () {
'use strict';

/* ============================================================
   01. 依赖 & DOM 引用
   ============================================================ */
const $ = id => document.getElementById(id);

// 主容器
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

// 预览区菜单
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

// 编辑器工具栏
const btnUndo = $('btnUndo');
const btnRedo = $('btnRedo');
const btnFormat     = $('btnFormat');
const btnFind       = $('btnFind');
const btnEditorMenu = $('btnEditorMenu');
const editorMenu    = $('editorMenu');
const menuWrap      = $('menuWrap');
const menuHighlightLine = $('menuHighlightLine');
const menuAutoIndent = $('menuAutoIndent');
const menuNewBlankCanvas = $('menuNewBlankCanvas');
const menuHistory    = $('menuHistory');
const menuResetExample = $('menuResetExample');
const menuClearDraft = $('menuClearDraft');
const menuThemeAuto  = $('menuThemeAuto');
const menuThemeLight = $('menuThemeLight');
const menuThemeDark  = $('menuThemeDark');

// 视图控制
const zoomInBtn     = $('zoomIn');
const zoomOutBtn    = $('zoomOut');
const zoomResetBtn  = $('zoomReset');
const zoomLabel     = zoomResetBtn;
const bgBtns        = Array.from(document.querySelectorAll('.bg-btn'));

// 分隔条 / 工具栏
const splitterEl    = $('splitter');
const splitterGrips = Array.from(document.querySelectorAll('.tool-grip'));
const btnCreateShape = $('btnCreateShape');

// 警告条
const warningBar   = $('warningBar');
const warningText  = $('warningText');
const warningClose = $('warningClose');

// 查找面板
const findPanel      = $('findPanel');
const findInput      = $('findInput');
const replaceInput   = $('replaceInput');
const findPrev       = $('findPrev');
const findNext       = $('findNext');
const findReplace    = $('findReplace');
const findReplaceAll = $('findReplaceAll');
const findClose      = $('findClose');

// 导出弹窗
const modalMask      = $('modalMask');
const modalTitle     = $('modalTitle');
const modalSubtitle  = $('modalSubtitle');
const exportTopRow   = $('exportTopRow');
const formatRow      = $('formatRow');
const exportPresetGroup = $('exportPresetGroup');
const exportPresetBtns = Array.from(document.querySelectorAll('.export-preset-btn'));
const exportWInput   = $('exportW');
const exportHInput   = $('exportH');
const exportLock     = $('exportLock');
const exportHint     = $('exportHint');
const exportFormat   = $('exportFormat');
const bgRow          = $('bgRow');
const exportWhiteBg  = $('exportWhiteBg');
const viewBoxRow     = $('viewBoxRow');
const exportScaleViewBox = $('exportScaleViewBox');
const exportOriginal = $('exportOriginal');
const exportCancel   = $('exportCancel');
const exportConfirm  = $('exportConfirm');

// 历史版本
const historyMask  = $('historyMask');
const historyList  = $('historyList');
const historyClear = $('historyClear');
const historyClose = $('historyClose');

// 图片插入
const imageFileInput       = $('imageFileInput');
const imageConfigMask      = $('imageConfigMask');
const imageConfigPreview   = $('imageConfigPreview');
const imageConfigRatio     = $('imageConfigRatio');
const imageConfigCustomRow = $('imageConfigCustomRow');
const imageConfigCustomW   = $('imageConfigCustomW');
const imageConfigCustomH   = $('imageConfigCustomH');
const imageConfigClip      = $('imageConfigClip');
const imageConfigCompress  = $('imageConfigCompress');
const imageConfigCancel    = $('imageConfigCancel');
const imageConfigConfirm   = $('imageConfigConfirm');
const imageConfigFillRadios   = Array.from(document.querySelectorAll('input[name="imageConfigFill"]'));
const imageConfigInsertRadios = Array.from(document.querySelectorAll('input[name="imageConfigInsert"]'));

// 属性面板
const attrPanel            = $('attrPanel');
const attrPanelTag         = $('attrPanelTag');
const attrPanelId          = $('attrPanelId');
const attrPanelWarning     = $('attrPanelWarning');
const attrPanelBody        = $('attrPanelBody');
const attrPanelClose       = $('attrPanelClose');
const attrPanelLocate      = $('attrPanelLocate');
const attrPanelCanvasBtn   = $('attrPanelCanvasBtn');

/* ============================================================
   02. 全局状态 & 常量
   ============================================================ */

// 外部资源（由 loadContentAndConfig 异步填充）
let content       = null;
let CONFIG        = null;
let contentLoaded = false;
let currentLocale = 'zh';
let currentTheme  = 'auto';

// 运行时状态
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

// 图片导入状态
const imageImportState = {
  file: null, dataUrl: '', originalW: 0, originalH: 0,
  ratio: 'original', customW: 100, customH: 100,
  clipEnabled: true,
  fillMode: 'slice', insertMode: 'replace',
  compress: true, busy: false
};

// 选中状态
let selectedPath = null;
let attrPanelOpen = false;
let attrCommitTimer = 0;
let suppressAttrRebuild = false;
let mobileView = 'code';

// 画布模式
let canvasRootMode = false;
let canvasBackPath = null;

// 预览区 rect 缓存
let cachedPreviewRect = null;

// 常量
const MAX_SIDE      = 4096;
const RECENT_COLORS_KEY  = 'svg-editor.recent-colors.v1';
const RECENT_COLORS_MAX  = 8;
const DRAFT_KEY     = 'svg-editor.draft.v1';
const HISTORY_KEY   = 'svg-editor.history.v1';
const HISTORY_MAX   = 20;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const SNAPSHOT_DEBOUNCE_MS     = 500;
const SNAPSHOT_MERGE_WINDOW_MS = SNAPSHOT_DEBOUNCE_MS;

const THEME_KEY  = 'svg-editor.theme.v1';
const LOCALE_KEY = 'svg-editor.locale.v1';

// 示例代码兜底（content.json 加载失败时使用）
const FALLBACK_CODE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%">
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

/* ============================================================
   03. 通用工具函数
   ============================================================ */

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

// 错误 / 警告条
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

/* ---- 主题 ---- */

function getSystemTheme() {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

function loadSavedTheme() {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === 'auto' || v === 'light' || v === 'dark') return v;
  } catch (_) {}
  return 'auto';
}

function applyTheme(theme) {
  currentTheme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch (_) {}
  const resolved = theme === 'auto' ? getSystemTheme() : theme;
  if (resolved === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  updateThemeMenuState(theme);
}

function updateThemeMenuState(theme) {
  if (!menuThemeAuto) return;
  menuThemeAuto.setAttribute('aria-checked', theme === 'auto' ? 'true' : 'false');
  menuThemeLight.setAttribute('aria-checked', theme === 'light' ? 'true' : 'false');
  menuThemeDark.setAttribute('aria-checked', theme === 'dark' ? 'true' : 'false');
}

function setupThemeWatcher() {
  if (!window.matchMedia) return;
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (currentTheme === 'auto') applyTheme('auto');
  };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);
}

/* ---- i18n ---- */

function detectLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch (_) {}
  const lang = (navigator.language || '').toLowerCase();
  return /^zh/.test(lang) ? 'zh' : 'en';
}

function t(key, params) {
  const parts = String(key).split('.');
  let cur = content && content[currentLocale];
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') { cur = null; break; }
    cur = cur[p];
  }
  if (cur == null) {
    let fb = content && content.zh;
    for (const p of parts) {
      if (!fb || typeof fb !== 'object') { fb = null; break; }
      fb = fb[p];
    }
    cur = fb != null ? fb : key;
  }
  if (typeof cur !== 'string') cur = key;
  return params
    ? cur.replace(/\{(\w+)\}/g, (_, k) => params[k] != null ? params[k] : '')
    : cur;
}

function buildFallbackConfig() {
  return {
    animSpecs: [],
    posAttrs: {},
    posAttrTextarea: ['d', 'points'],
    pathLengthTags: ['rect','circle','ellipse','line','image','use','text','tspan','path','polyline','polygon'],
    fillSpecs: [
      { name: 'fill', type: 'color' },
      { name: 'stroke', type: 'color' },
      { name: 'opacity', type: 'number', step: 0.1, min: 0, max: 1 }
    ],
    strokeAdvSpecs: [],
    refSpecs: [],
    refUnitSpecs: [],
    renderSpecs: [],
    interactSpecs: [],
    textBaseSpecs: [],
    textAdvSpecs: [],
    transformSpecs: [
      { key: 'tx', labelKey: 'field.translateX', step: 1, animKey: 'translate-tx' },
      { key: 'ty', labelKey: 'field.translateY', step: 1, animKey: 'translate-ty' },
      { key: 'rot', labelKey: 'field.rotation', step: 1, animKey: 'rotate' },
      { key: 'rotCx', labelKey: 'field.rotCenterX', step: 1 },
      { key: 'rotCy', labelKey: 'field.rotCenterY', step: 1 },
      { key: 'scale', labelKey: 'field.scale', step: 0.1, min: 0, animKey: 'scale' },
      { key: 'skewX', labelKey: 'field.skewX', step: 1 },
      { key: 'skewY', labelKey: 'field.skewY', step: 1 }
    ],
    canvasPresets: [
      { key: 'ratio1_1', mode: 'ratio', ratio: 1 }
    ],
    presetColors: ['#000000', '#ffffff', '#2563eb'],
    vbLabels: ['minX', 'minY', 'width', 'height'],
    parOptions: ['', 'xMidYMid meet']
  };
}

async function loadContentAndConfig() {
  currentLocale = detectLocale();
  try { localStorage.setItem(LOCALE_KEY, currentLocale); } catch (_) {}

  try {
    const [contentRes, configRes] = await Promise.all([
      fetch('./content.json', { cache: 'no-cache' }),
      fetch('./config.json', { cache: 'no-cache' })
    ]);
    if (!contentRes.ok) throw new Error('content.json HTTP ' + contentRes.status);
    if (!configRes.ok) throw new Error('config.json HTTP ' + configRes.status);
    content = await contentRes.json();
    CONFIG  = await configRes.json();
    contentLoaded = true;
  } catch (err) {
    console.warn('[i18n] 资源加载失败，回退到内置 fallback：', err);
    content = { zh: {}, en: {} };
    CONFIG  = buildFallbackConfig();
    contentLoaded = false;
  }

  if (!content[currentLocale]) currentLocale = 'zh';
}

function applyI18n() {
  if (!contentLoaded) return;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (key) el.title = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.placeholder = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.dataset.i18nAria;
    if (key) el.setAttribute('aria-label', t(key));
  });

  const titleEl = document.querySelector('title[data-i18n]');
  if (titleEl) {
    const key = titleEl.dataset.i18n;
    if (key) document.title = t(key);
  }
}

function getExampleCode() {
  if (content && content[currentLocale] && content[currentLocale].example && content[currentLocale].example.code) {
    return content[currentLocale].example.code;
  }
  if (content && content.zh && content.zh.example && content.zh.example.code) {
    return content.zh.example.code;
  }
  return FALLBACK_CODE;
}

/* ============================================================
   04. SVG 解析与净化
   ============================================================ */
function parseSVG(code) {
  const doc = new DOMParser().parseFromString(code, 'image/svg+xml');
  const errNode = doc.querySelector('parsererror');
  if (errNode) {
    const detail = (errNode.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 180);
    const lineInfo = extractErrorLine(errNode.textContent || '');
    const linePart = lineInfo ? t('toast.lineNear', { line: lineInfo.line }) : '';
    throw new Error(t('toast.svgSyntaxError', { detail, line: linePart }));
  }
  const root = doc.documentElement;
  if (!root || root.nodeName.toLowerCase() !== 'svg') {
    throw new Error(t('toast.rootMustBeSvg'));
  }
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

    if (tag === 'style' && el.textContent) {
      let css = el.textContent;
      css = css.replace(/@import[^;]*;/gi, '');
      css = css.replace(/javascript\s*:/gi, '');
      css = css.replace(/expression\s*\(/gi, '');
      el.textContent = css;
    }

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

/* ============================================================
   05. 尺寸计算与序列化
   ============================================================ */
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

/* ============================================================
   06. 预览渲染器（Shadow DOM）
   ============================================================ */
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

    .selection-overlay {
      position: absolute; inset: 0;
      pointer-events: none;
      z-index: 10;
    }
    .selection-box {
      position: absolute;
      pointer-events: none;
      box-sizing: border-box;
      background:
        repeating-linear-gradient(to right, #2563eb 0 5px, transparent 5px 9px) 0 0 / 100% 1.5px no-repeat,
        repeating-linear-gradient(to right, #2563eb 0 5px, transparent 5px 9px) 0 100% / 100% 1.5px no-repeat,
        repeating-linear-gradient(to bottom, #2563eb 0 5px, transparent 5px 9px) 0 0 / 1.5px 100% no-repeat,
        repeating-linear-gradient(to bottom, #2563eb 0 5px, transparent 5px 9px) 100% 0 / 1.5px 100% no-repeat,
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
      anims.forEach(a => { try { a.beginElement(); } catch (_) {} });
    } catch (_) {}
  }
  unmount() { if (this.host) this.host.replaceChildren(); }
  destroy() { this.unmount(); this.host = null; }
  async exportBlob({ markup, width, height, format, whiteBg }) {
    return canvas2dExportBlob(markup, width, height, format, whiteBg);
  }
}
const domRenderer = new DomRenderer();

/* 预览尺寸变化兜底刷新高亮（覆盖键盘弹起 / 移动视图切换 / splitter 拖动） */
if (window.ResizeObserver) {
  const previewResizeObserver = new ResizeObserver(() => {
    invalidatePreviewRect();
    if (currentSvg) {
      if (isFitMode) fitToView();
      else applyPreviewTransform();
    } else {
      scheduleRefreshSelectionOverlay();
    }
  });
  previewResizeObserver.observe(previewWrap);
}

/* ============================================================
   07. Canvas 导出（PNG/JPG/WebP）
   ============================================================ */
async function canvas2dExportBlob(markup, width, height, format, whiteBg) {
  const isJpg = format === 'jpg';
  const needWhite = isJpg || whiteBg;
  const mime = isJpg ? 'image/jpeg' : `image/${format}`;
  const quality = (format === 'png') ? undefined : 0.92;
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-canvas');
  if (needWhite) { ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height); }
  const blobUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
  const img = new Image();
  try {
    await new Promise((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('render'));
      img.src = blobUrl;
    });
    ctx.drawImage(img, 0, 0, width, height);
  } finally { URL.revokeObjectURL(blobUrl); }

  /* P1-4：按需补画（仅 slice 裁剪 / clip-path 场景） */
  const needsManualImageDraw = (() => {
    if (!/<image\b[^>]*(?:href|xlink:href)\s*=\s*["']data:/i.test(markup)) return false;
    const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
    const imgs = doc.querySelectorAll('image');
    for (const im of imgs) {
      const par  = im.getAttribute('preserveAspectRatio') || '';
      const clip = im.getAttribute('clip-path') || '';
      if (/slice/i.test(par) || /url\(#/.test(clip)) return true;
    }
    return false;
  })();
  if (needsManualImageDraw) {
    try {
      await drawDataImagesToCanvas(ctx, markup, width, height);
    } catch (err) {
      console.warn('[export] 手动补画图片失败：', err);
    }
  }

  const blob = await new Promise(res => canvas.toBlob(res, mime, quality));
  if (!blob) throw new Error('png');
  return blob;
}

/* 图片缓存（P3-2：blob: URL 淘汰时 revoke） */
const _imgCache = new Map();
function loadImageFromUrl(url) {
  if (!url) return Promise.reject(new Error('url'));
  if (_imgCache.has(url)) return Promise.resolve(_imgCache.get(url));
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      if (_imgCache.size >= 20) {
        const firstKey = _imgCache.keys().next().value;
        _imgCache.delete(firstKey);
        if (typeof firstKey === 'string' && firstKey.startsWith('blob:')) {
          try { URL.revokeObjectURL(firstKey); } catch (_) {}
        }
      }
      _imgCache.set(url, im);
      res(im);
    };
    im.onerror = () => rej(new Error('img'));
    im.src = url;
  });
}

/* 裁剪形状 → ctx 路径（图片裁剪增强：新增 polygon / polyline 支持） */
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
  } else if (tag === 'polygon' || tag === 'polyline') {
    const pointsStr = shapeEl.getAttribute('points') || '';
    const nums = pointsStr.trim().split(/[\s,]+/).map(Number).filter(n => isFinite(n));
    if (nums.length < 4) return;
    ctx.moveTo(nums[0] * sx + offsetX, nums[1] * sy + offsetY);
    for (let i = 2; i < nums.length; i += 2) {
      ctx.lineTo(nums[i] * sx + offsetX, nums[i + 1] * sy + offsetY);
    }
    ctx.closePath();
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

function computeParDrawRectLocal(img, x, y, w, h, par) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  if (!iw || !ih) return null;
  const isSlice = !par.includes('meet');
  let dw, dh, dx, dy;
  const sx = 0, sy = 0, sw = iw, sh = ih;
  if (isSlice) {
    const k = Math.max(w / iw, h / ih);
    dw = iw * k; dh = ih * k;
    dx = x + (w - dw) / 2;
    dy = y + (h - dh) / 2;
  } else {
    const k = Math.min(w / iw, h / ih);
    dw = iw * k; dh = ih * k;
    dx = x + (w - dw) / 2;
    dy = y + (h - dh) / 2;
  }
  return { sx, sy, sw, sh, dx, dy, dw, dh };
}

async function drawDataImagesToCanvas(ctx, markup, canvasW, canvasH) {
  const domRoot = canvasEl.firstElementChild;
  const domHasImages = domRoot
    && domRoot.localName && domRoot.localName.toLowerCase() === 'svg'
    && domRoot.querySelector('image');

  if (domHasImages) {
    try {
      await drawDataImagesFromDom(ctx, domRoot, canvasW, canvasH);
      return;
    } catch (err) {
      console.warn('[export] DOM 方式绘制图片失败，降级到 markup 方式：', err);
    }
  }
  await drawDataImagesFromMarkup(ctx, markup, canvasW, canvasH);
}

async function drawDataImagesFromDom(ctx, svgRoot, canvasW, canvasH) {
  let svgW = 0, svgH = 0;
  try {
    svgW = svgRoot.width.baseVal.value;
    svgH = svgRoot.height.baseVal.value;
  } catch (_) {}
  if (!svgW || svgW <= 0 || !svgH || svgH <= 0) {
    const vb = svgRoot.getAttribute('viewBox');
    if (vb) {
      const p = vb.trim().split(/[\s,]+/).map(Number);
      if (p.length === 4 && p[2] > 0 && p[3] > 0) {
        const firstEl = svgRoot.querySelector('image, rect, circle, path, g');
        if (firstEl) {
          try {
            const c = firstEl.getCTM();
            if (c && c.a > 0 && c.d > 0) {
              svgW = p[2] * c.a;
              svgH = p[3] * c.d;
            }
          } catch (_) {}
        }
      }
    }
  }
  if (!svgW || svgW <= 0) svgW = svgRoot.clientWidth || canvasW;
  if (!svgH || svgH <= 0) svgH = svgRoot.clientHeight || canvasH;
  const scaleX = canvasW / svgW;
  const scaleY = canvasH / svgH;
  const clipMap = {};
  svgRoot.querySelectorAll('clipPath').forEach(cp => {
    const id = cp.getAttribute('id');
    if (id) clipMap[id] = cp.firstElementChild;
  });
  const images = Array.from(svgRoot.querySelectorAll('image'));
  for (const imgEl of images) {
    const href = imgEl.getAttribute('href') || imgEl.getAttribute('xlink:href');
    if (!href || !href.startsWith('data:')) continue;
    let im;
    try { im = await loadImageFromUrl(href); } catch (_) { continue; }
    const x = parseFloat(imgEl.getAttribute('x')) || 0;
    const y = parseFloat(imgEl.getAttribute('y')) || 0;
    const w = parseFloat(imgEl.getAttribute('width'));
    const h = parseFloat(imgEl.getAttribute('height'));
    if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) continue;
    const par = imgEl.getAttribute('preserveAspectRatio') || 'xMidYMid meet';
    const drawRect = computeParDrawRectLocal(im, x, y, w, h, par);
    if (!drawRect) continue;
    let ctm = null;
    try { ctm = imgEl.getCTM(); } catch (_) {}
    if (!ctm) {
      const vb = svgRoot.getAttribute('viewBox');
      if (vb) {
        const p = vb.trim().split(/[\s,]+/).map(Number);
        if (p.length === 4 && p[2] > 0 && p[3] > 0) {
          const s = Math.min(canvasW / p[2], canvasH / p[3]);
          ctm = { a: s, b: 0, c: 0, d: s, e: -p[0] * s, f: -p[1] * s };
        }
      }
      if (!ctm) continue;
    }
    const clipAttr = imgEl.getAttribute('clip-path') || '';
    const cidMatch = clipAttr.match(/url\(#([^)]+)\)/);
    const clipEl = cidMatch ? clipMap[cidMatch[1]] : null;
    ctx.save();
    ctx.setTransform(
      ctm.a * scaleX, ctm.b * scaleY,
      ctm.c * scaleX, ctm.d * scaleY,
      ctm.e * scaleX, ctm.f * scaleY
    );
    if (clipEl) {
      applyClipShapeToCtx(ctx, clipEl, 1, 1, 0, 0);
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

async function drawDataImagesFromMarkup(ctx, markup, canvasW, canvasH) {
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
    images.push({ href, x: isFinite(x) ? x : 0, y: isFinite(y) ? y : 0, w, h, par, clipEl });
  });
  for (const t of images) {
    let im;
    try { im = await loadImageFromUrl(t.href); } catch (_) { continue; }
    const drawRect = computeParDrawRect(
      im, t.x * sx + offsetX, t.y * sy + offsetY, t.w * sx, t.h * sy, t.par
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

/* ============================================================
   08. 预览变换（缩放/平移/旋转）
   ============================================================ */
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

/* ============================================================
   09. 渲染主循环
   ============================================================ */
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
    showError(err.message || t('toast.parseFailed', { msg: '' }));
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
    const suffix = refs.length > 1 ? ' +' + (refs.length - 1) : '';
    showWarning(t('preview.externalRefWarning', { refs: shown + suffix }));
  } else { hideWarning(); }

  const size = getSize(svg);
  try {
    await domRenderer.mount(canvasEl, svg, size);
  } catch (err) {
    console.error(err);
    showToast(t('toast.renderFailed', { msg: err.message || '' }));
    return;
  }
  updateBadge(size.width, size.height);
  if (isFitMode) fitToView();
  updateButtons();

  if (selectedPath) {
    const parsedEl = resolvePath(currentSvg, selectedPath);
    const mismatch = parsedEl && (
      (_selectedElementId && parsedEl.getAttribute('id') !== _selectedElementId) ||
      (!_selectedElementId && _selectedElementTag && parsedEl.localName !== _selectedElementTag)
    );
    const svgVisible = canvasEl.firstElementChild;
    const visibleEl = svgVisible ? resolvePath(svgVisible, selectedPath) : null;
    if (visibleEl && visibleEl !== svgVisible && !mismatch) {
      applySelectionOutline(visibleEl);
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
  const code = codeEl.value;
  const delay = code.length > 500000 ? 600 : 250;
  renderTimer = setTimeout(renderPreview, delay);
}

/* ============================================================
   10. 文件保存 / 导出
   ============================================================ */
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
  showToast(t('toast.saved'));
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
      showToast(t('toast.shareFailed', { msg: (err && err.message) || '' }));
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
    showToast(t('toast.svgSaved', { w: width, h: height }));
  } catch (err) {
    console.error(err);
    showToast(t('toast.svgSaveFailed', { msg: err.message || '' }));
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
    const bgLabel = whiteBg ? t('export.whiteBgLabel') : t('export.transparentLabel');
    showToast(t('toast.imageSaved', {
      ext: ext.toUpperCase(),
      w: width,
      h: height,
      bg: bgLabel
    }));
  } catch (err) {
    console.error(err);
    showToast(t('toast.imageExportFailed', { msg: err.message || '' }));
  }
}

/* ============================================================
   11. 分屏布局（splitter 拖动）
   ============================================================ */
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
      showToast(t('toolbar.previewMax'));
    } else if (splitRatio >= 0.90) {
      splitState = 'code-max'; applySplit();
      showToast(t('toolbar.codeMax'));
    }
    return;
  }
  splitHasMoved = false;
}
function resetSplitToDefault() {
  splitState = 'default'; splitRatio = 0.8;
  applySplit();
  showToast(t('toolbar.layoutRestored'));
}
splitterEl.addEventListener('pointerdown', onSplitterPointerDown);
splitterEl.addEventListener('pointermove', onSplitterPointerMove);
splitterEl.addEventListener('pointerup', onSplitterPointerUp);
splitterEl.addEventListener('pointercancel', onSplitterPointerUp);

/* ============================================================
   12. 编辑器渲染（行号 / 高亮 / 当前行）
   ============================================================ */
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

/* ---- P1-2：行首偏移缓存 + 行号二分 ---- */
let _lineOffsets = null;
let _lineOffsetsStamp = -1;
function invalidateLineOffsets() {
  _lineOffsets = null;
  _lineOffsetsStamp = -1;
}
function getLineOffsets() {
  const text = codeEl.value;
  const stamp = text.length * 31
              + (text.charCodeAt(0) || 0)
              + (text.charCodeAt(text.length - 1) || 0);
  if (_lineOffsets && _lineOffsetsStamp === stamp) return _lineOffsets;
  const offsets = [0];
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) === 10) offsets.push(i + 1);
  }
  _lineOffsets = offsets;
  _lineOffsetsStamp = stamp;
  return offsets;
}
function posToLineNo(pos) {
  const offs = getLineOffsets();
  let lo = 0, hi = offs.length - 1, ans = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offs[mid] <= pos) { ans = mid; lo = mid + 1; }
    else hi = mid - 1;
  }
  return ans + 1;
}

let lineNodes = [], lastLineHtmls = [], currentLineEl = null;
function updateCurrentLineHighlight() {
  if (!highlightCurrentLineEnabled) {
    if (currentLineEl) currentLineEl.classList.remove('current');
    currentLineEl = null;
    highlightCode.querySelectorAll('.line.current').forEach(el => el.classList.remove('current'));
    return;
  }
  const lineNo = posToLineNo(codeEl.selectionStart);
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

/* ============================================================
   13. 语法高亮
   ============================================================ */
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
  if (attrs.length > 1500 && /data:[^"']{500,}/.test(attrs)) {
    return esc(attrs);
  }
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

/* ============================================================
   14. XML 格式化
   ============================================================ */
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

/* ============================================================
   15. 草稿 / 历史 / 撤销重做
   ============================================================ */
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
        showToast(t('toast.historyReduced', { count: cur.length }));
      }
      return;
    }
    cur = cur.slice(0, Math.max(0, Math.floor(cur.length / 2)));
  }
  safeSetItem(HISTORY_KEY, '[]');
  showToast(t('toast.historySaveFailed'));
}

function guessTitle(code) {
  const m = code.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (m && m[1].trim()) return m[1].trim().slice(0, 30);
  const first = code.split('\n').find(l => l.trim());
  if (first) return first.trim().slice(0, 30);
  return t('history.untitled');
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

let _releaseHistoryTrap = null;

function openHistory() {
  const list = getHistoryList();
  historyList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'history-empty';
    empty.textContent = t('history.empty');
    historyList.appendChild(empty);
  } else {
    list.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'history-item';
      const tEl = document.createElement('span');
      tEl.className = 'history-item__title';
      tEl.textContent = item.title || t('history.untitled');
      const time = document.createElement('span');
      time.className = 'history-item__time';
      time.textContent = formatTime(item.time);
      btn.appendChild(tEl); btn.appendChild(time);
      btn.addEventListener('click', () => {
        codeEl.value = item.code;
        selectedPath = null;
        invalidateLineOffsets();
        renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
        closeHistory();
        showToast(t('history.loaded'));
      });
      historyList.appendChild(btn);
    });
  }
  historyMask.hidden = false;
  _releaseHistoryTrap = trapFocusIn(historyMask);
}

function closeHistory() {
  historyMask.hidden = true;
  if (_releaseHistoryTrap) { _releaseHistoryTrap(); _releaseHistoryTrap = null; }
}

/* ---- 撤销 / 重做 ---- */
let undoStack = [];
let undoIndex = -1;
let lastSnapshotTime = 0;

function recordSnapshot(force) {
  const text = codeEl.value;
  if (!force && undoIndex >= 0 && undoStack[undoIndex].text === text) return;
  const now = Date.now();
  const merge = !force && now - lastSnapshotTime < SNAPSHOT_MERGE_WINDOW_MS
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
  invalidateLineOffsets();
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); updateUndoRedoMenu();
}

function undo() {
  const cur = codeEl.value;
  if (undoIndex >= 0 && undoStack[undoIndex].text !== cur) recordSnapshot(true);
  if (undoIndex <= 0) { showToast(t('toast.noUndo')); return; }
  undoIndex--; applySnapshot(undoStack[undoIndex]);
  showToast(t('toast.undone'));
}

function redo() {
  const cur = codeEl.value;
  if (undoIndex >= 0 && undoIndex < undoStack.length - 1 && undoStack[undoIndex].text !== cur) recordSnapshot(true);
  if (undoIndex >= undoStack.length - 1) { showToast(t('toast.noRedo')); return; }
  undoIndex++; applySnapshot(undoStack[undoIndex]);
  showToast(t('toast.redone'));
}

function updateUndoRedoMenu() {
  btnUndo.disabled = undoIndex <= 0;
  btnRedo.disabled = undoIndex >= undoStack.length - 1;
}

/* ============================================================
   16. 查找替换
   ============================================================ */
function isMobileViewport() {
  return window.innerWidth <= 480;
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
  const lineNo = posToLineNo(idx);
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
  if (idx < 0) { showToast(t('toast.notFound')); return; }
  codeEl.focus();
  try { codeEl.setSelectionRange(idx, idx + query.length); } catch(_) {}

  if (isMobileViewport()) {
    const panelRect = findPanel.getBoundingClientRect();
    const codeRect  = codeEl.getBoundingClientRect();
    const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
    const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
    const lineNo = posToLineNo(idx);
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
    invalidateLineOffsets();
    renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot();
  }
  findNextMatch(false);
}
function replaceAll() {
  const query = findInput.value, replacement = replaceInput.value;
  if (!query) return;
  const text = codeEl.value;
  if (!text.includes(query)) { showToast(t('toast.notFound')); return; }
  const parts = []; let i = 0, count = 0;
  while (i <= text.length) {
    const idx = text.indexOf(query, i);
    if (idx < 0) { parts.push(text.slice(i)); break; }
    parts.push(text.slice(i, idx));
    parts.push(replacement);
    i = idx + query.length; count++;
  }
  codeEl.value = parts.join('');
  invalidateLineOffsets();
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot();
  showToast(t('toast.replaced', { count }));
}

function positionFindPanel() {
  if (findPanel.hidden) return;

  if (isMobileViewport()) {
    const splitterRect = splitterEl.getBoundingClientRect();
    findPanel.style.top = splitterRect.bottom + 'px';
    findPanel.style.left = '0';
    findPanel.style.right = '0';
    findPanel.style.width = '';
    findPanel.style.minWidth = '0';
    findPanel.style.maxWidth = 'none';
    return;
  }

  findPanel.style.width = 'auto';
  findPanel.style.minWidth = '';
  findPanel.style.maxWidth = '';
  findPanel.style.left = 'auto';

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
}

/* ============================================================
   17. 文件加载
   ============================================================ */
async function loadFile(file) {
  if (!file) return;
  const isSvg = /\.svg$/i.test(file.name) || file.type === 'image/svg+xml';
  if (!isSvg) { showToast(t('toast.notSvgFile')); return; }
  if (file.size > MAX_FILE_SIZE) {
    const size = (file.size / 1024 / 1024).toFixed(1);
    showToast(t('toast.fileTooLarge', { size, max: MAX_FILE_SIZE / 1024 / 1024 }));
    return;
  }
  try {
    let text = await file.text();
    text = text.replace(/^\uFEFF/, '');
    if (!text.trim()) { showToast(t('toast.fileEmpty')); return; }
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
    const hasParseError = !!doc.querySelector('parsererror');
    codeEl.value = text;
    selectedPath = null;
    invalidateLineOffsets();
    renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
    if (!hasParseError) saveToHistory(text);
    const lineCount = text.split('\n').length;
    const isSingleLine = (lineCount === 1 && text.length > 80);
    let msg;
    if (hasParseError) msg = t('toast.fileLoadedParseError', { name: file.name });
    else if (isSingleLine) msg = t('toast.fileLoadedSingleLine', { name: file.name });
    else msg = t('toast.fileLoaded', { name: file.name });
    showToast(msg);
  } catch (err) {
    showToast(t('toast.readFailed', { msg: err.message || '' }));
  }
}

/* ============================================================
   18. 剪贴板
   ============================================================ */
async function copySVGCode() {
  if (!currentSvg) return;
  const raw = codeEl.value.trim();
  const markup = raw || serializeSVG(currentSvg);
  if (!markup) return;
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    showToast(t('toast.copyUnsupported')); return;
  }
  try {
    await navigator.clipboard.writeText(markup);
    showToast(t('toast.codeCopied'));
  } catch (err) { showToast(t('toast.copyFailed', { msg: err.message || '' })); }
}
async function copyPNGImage() {
  if (!currentSvg) return;
  if (!navigator.clipboard || !window.ClipboardItem) {
    showToast(t('toast.pngUnsupported')); return;
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
    if (!ctx) throw new Error('no-canvas');
    const blobUrl = URL.createObjectURL(new Blob([markup], { type: 'image/svg+xml' }));
    const img = new Image();
    try {
      await new Promise((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('render'));
        img.src = blobUrl;
      });
      ctx.drawImage(img, 0, 0, w, h);
    } finally { URL.revokeObjectURL(blobUrl); }
    const item = new ClipboardItem({
      'image/png': new Promise((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('png')), 'image/png');
      })
    });
    await navigator.clipboard.write([item]);
    showToast(t('toast.pngCopied', { w, h }));
  } catch (err) {
    console.error(err);
    if (isIOSLike() && currentSvg) {
      showToast(t('toast.iosNoCopy'));
      try {
        const size = getSize(currentSvg);
        const w = Math.round(size.width), h = Math.round(size.height);
        const markup = serializeSVG(currentSvg, w, h);
        const blob = await canvas2dExportBlob(markup, w, h, 'png', false);
        downloadBlob(blob, `svg-${stamp()}.png`);
      } catch (_) { showToast(t('toast.pngExportFailed')); }
      return;
    }
    showToast(t('toast.copyFailed', { msg: err.message || '' }));
  }
}

/* ============================================================
   19. 预览交互（背景 / 缩放 / 旋转）
   ============================================================ */
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
  showToast(t('toast.rotated', { deg: previewRotation }));
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
  invalidateLineOffsets();
  scheduleRenderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
});
let snapshotTimer = 0;
codeEl.addEventListener('input', () => {
  clearTimeout(snapshotTimer);
  snapshotTimer = setTimeout(() => recordSnapshot(false), SNAPSHOT_DEBOUNCE_MS);
});
codeEl.addEventListener('scroll', syncScroll);

/* ============================================================
   20. 指针交互（平移 / 捏合 / 点击选中）
   ============================================================ */
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
  showToast(t('toast.centered'));
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

/* ============================================================
   21. 键盘快捷键
   ============================================================ */
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
  invalidateLineOffsets();
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
  invalidateLineOffsets();
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

/* ============================================================
   22. 下拉菜单管理
   ============================================================ */
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

/* ============================================================
   23. 编辑操作（菜单 / 按钮绑定）
   ============================================================ */

/* ---- 创建形状 ---- */
btnCreateShape.addEventListener('click', e => {
  e.stopPropagation();
  if (createShapeMenuEl) closeCreateShapeMenu();
  else openCreateShapeMenu(btnCreateShape);
});

/* ---- 撤销 / 重做 / 格式化 / 查找 ---- */
btnUndo.addEventListener('click', undo);
btnRedo.addEventListener('click', redo);
btnFormat.addEventListener('click', () => {
  const raw = codeEl.value;
  if (!raw.trim()) return;
  try {
    const formatted = formatXML(raw);
    if (formatted === raw) { showToast(t('toast.alreadyFormatted')); return; }
    codeEl.value = formatted;
    invalidateLineOffsets();
    renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
    showToast(t('toast.formatted'));
  } catch (err) { showToast(t('toast.formatFailed', { msg: err.message || '' })); }
});
btnFind.addEventListener('click', e => {
  e.stopPropagation();
  if (findPanel.hidden) openFindPanel();
  else closeFindPanel();
});

/* ---- 文件菜单 ---- */
menuOpenSvg.addEventListener('click', () => { closeAllMenus(); fileInput.click(); });
menuInsertImage.addEventListener('click', () => { closeAllMenus(); imageFileInput.click(); });
menuCopyPng.addEventListener('click', () => { closeAllMenus(); copyPNGImage(); });
menuCopySvg.addEventListener('click', () => { closeAllMenus(); copySVGCode(); });
menuSavePng.addEventListener('click', () => { closeAllMenus(); openExportModal('png'); });
menuSaveSvg.addEventListener('click', () => { closeAllMenus(); openExportModal('svg'); });

/* ---- 编辑器选项菜单 ---- */
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
  closeAllMenus();
});
menuHighlightLine.addEventListener('click', e => {
  e.stopPropagation();
  highlightCurrentLineEnabled = !highlightCurrentLineEnabled;
  menuHighlightLine.setAttribute('aria-checked', String(highlightCurrentLineEnabled));
  updateCurrentLineHighlight();
  closeAllMenus();
});
menuAutoIndent.addEventListener('click', e => {
  e.stopPropagation();
  autoIndentEnabled = !autoIndentEnabled;
  menuAutoIndent.setAttribute('aria-checked', String(autoIndentEnabled));
  closeAllMenus();
});

/* ---- 新建画布 ---- */
menuNewBlankCanvas.addEventListener('click', () => {
  closeAllMenus();
  const current = codeEl.value.trim();
  const emptyMarkup = buildEmptySvgMarkup();
  const isAlreadyEmpty = !current || current === emptyMarkup;
  if (!isAlreadyEmpty) {
    if (!confirm(t('toast.blankCanvasConfirm'))) return;
  }
  codeEl.value = emptyMarkup;
  selectedPath = null;
  _selectedElementTag = null;
  _selectedElementId  = null;
  canvasRootMode = false;
  canvasBackPath = null;
  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  showToast(t('toast.blankCanvasCreated'));
});

/* ---- 恢复示例 / 历史 / 清空草稿 ---- */
menuResetExample.addEventListener('click', () => {
  closeAllMenus();
  codeEl.value = getExampleCode();
  selectedPath = null;
  invalidateLineOffsets();
  renderEditor(); renderPreview(); saveDraftDebounced(); recordSnapshot(true);
  showToast(t('toast.exampleRestored'));
});
menuHistory.addEventListener('click', () => { closeAllMenus(); openHistory(); });
menuClearDraft.addEventListener('click', () => {
  closeAllMenus();
  try { localStorage.removeItem(DRAFT_KEY); } catch(_) {}
  showToast(t('toast.draftCleared'));
});

/* ---- 主题菜单 ---- */
menuThemeAuto.addEventListener('click',  () => { closeAllMenus(); applyTheme('auto'); });
menuThemeLight.addEventListener('click', () => { closeAllMenus(); applyTheme('light'); });
menuThemeDark.addEventListener('click',  () => { closeAllMenus(); applyTheme('dark'); });

/* ---- 全局点击关闭浮层 ---- */
document.addEventListener('click', e => {
  if (!e.target.closest('#previewActions')) {
    previewMenu.hidden = true; btnPreviewMenu.setAttribute('aria-expanded', 'false');
  }
  if (!e.target.closest('#editorActions')) {
    editorMenu.hidden = true; btnEditorMenu.setAttribute('aria-expanded', 'false');
  }
  if (!findPanel.hidden && !e.target.closest('#findPanel')) closeFindPanel();
  closeAnimAddMenu();
  closeCreateShapeMenu();
});

/* ---- Escape：浮层优先级 ---- */
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (createShapeMenuEl) { closeCreateShapeMenu(); return; }
  if (markerPickerEl) { closeMarkerPicker(); return; }
  if (colorPopoverEl) { closeColorPopover(); return; }
  if (gradientEditorMask) {
    const cancelBtn = gradientEditorMask.querySelector('[data-action="cancel"]');
    if (cancelBtn) { cancelBtn.click(); return; }
  }
  if (filterEditorMask) {
    const cancelBtn = filterEditorMask.querySelector('[data-action="cancel"]');
    if (cancelBtn) { cancelBtn.click(); return; }
  }
  if (!imageConfigMask.hidden) { closeImageConfigModal(); return; }
  if (!historyMask.hidden) { closeHistory(); return; }
  if (!modalMask.hidden) { closeExportModal(); return; }
  if (!findPanel.hidden) { closeFindPanel(); return; }
  if (attrPanelOpen) { clearSelection(); return; }
  closeAllMenus();
});

/* ---- 查找面板按钮 ---- */
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

/* ============================================================
   24. 导出弹窗
   ============================================================ */
let _releaseExportTrap = null;

function updatePresetActiveState() {
  if (!exportState) return;
  const curW = parseInt(exportWInput.value, 10);
  const curH = parseInt(exportHInput.value, 10);
  exportPresetBtns.forEach(btn => {
    const factor = parseFloat(btn.dataset.factor);
    const targetW = Math.round(exportState.originWidth * factor);
    const targetH = Math.round(exportState.originHeight * factor);
    btn.classList.toggle('is-active', curW === targetW && curH === targetH);
  });
}

function applyExportPreset(factor) {
  if (!exportState) return;
  const w = Math.round(exportState.originWidth * factor);
  const h = Math.round(exportState.originHeight * factor);
  if (w > MAX_SIDE || h > MAX_SIDE) {
    showToast(t('export.sizeExceeded', { max: MAX_SIDE }));
    return;
  }
  exportWInput.value = w;
  exportHInput.value = h;
  updatePresetActiveState();
}

function openExportModal(format) {
  if (!currentSvg) return;
  const size = getSize(currentSvg);
  const ow = Math.round(size.width), oh = Math.round(size.height);
  exportState = {
    mode: format, originWidth: ow, originHeight: oh,
    lockRatio: true, hasViewBox: !!currentSvg.getAttribute('viewBox')
  };
  const isSvg = format === 'svg';
  modalTitle.textContent = isSvg ? t('export.titleSvg') : t('export.titleImage');
  exportWInput.value = ow;
  exportHInput.value = oh;
  exportLock.textContent = '🔒';
  exportLock.classList.add('is-locked');
  exportLock.setAttribute('aria-pressed', 'true');

  const hasFO = !isSvg && !!currentSvg.querySelector('foreignObject');
  if (hasFO) {
    exportHint.textContent = t('export.hintForeignObject');
    exportHint.hidden = false;
  } else if (!exportState.hasViewBox) {
    exportHint.textContent = t('export.hintNoViewBox');
    exportHint.hidden = false;
  } else exportHint.hidden = true;

  // 格式 + 预设：整行控制显隐
  exportTopRow.hidden = isSvg;
  formatRow.hidden = isSvg;
  exportPresetGroup.hidden = isSvg;

  if (!isSvg && format === 'png') exportFormat.value = 'png';
  const isJpg = !isSvg && exportFormat.value === 'jpg';
  bgRow.hidden = isSvg || isJpg;
  exportWhiteBg.checked = false;
  viewBoxRow.hidden = !(exportState.hasViewBox && !isSvg);
  exportScaleViewBox.checked = false;
  exportConfirm.textContent = isIOSLike() ? t('export.confirmIOS') : t('export.confirm');
  modalSubtitle.textContent = isIOSLike()
    ? t('export.subtitleIOS')
    : (isSvg ? t('export.subtitleSvg') : t('export.subtitleImage'));

  updatePresetActiveState();

  modalMask.hidden = false;
  _releaseExportTrap = trapFocusIn(modalMask);
  if (window.matchMedia('(hover: hover)').matches) {
    exportWInput.focus(); exportWInput.select();
  }
}

function closeExportModal() {
  modalMask.hidden = true;
  exportState = null;
  if (_releaseExportTrap) { _releaseExportTrap(); _releaseExportTrap = null; }
}

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
    showToast(t('export.invalidSize')); return;
  }
  if (w > MAX_SIDE || h > MAX_SIDE) { showToast(t('export.sizeExceeded', { max: MAX_SIDE })); return; }
  const mode = exportState.mode;
  const format = mode === 'svg' ? 'svg' : exportFormat.value;
  const isJpg = format === 'jpg';
  const whiteBg = isJpg || exportWhiteBg.checked;
  const scaleVB = !viewBoxRow.hidden && exportScaleViewBox.checked;
  closeExportModal();
  if (mode === 'svg') exportSVG(w, h, scaleVB);
  else exportImage(w, h, format, whiteBg, scaleVB);
}

exportWInput.addEventListener('input', () => {
  syncHeightFromWidth();
  updatePresetActiveState();
});
exportHInput.addEventListener('input', () => {
  syncWidthFromHeight();
  updatePresetActiveState();
});
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
  updatePresetActiveState();
});
exportPresetBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const factor = parseFloat(btn.dataset.factor);
    applyExportPreset(factor);
  });
});
exportCancel.addEventListener('click', closeExportModal);
exportConfirm.addEventListener('click', confirmExport);
modalMask.addEventListener('click', e => { if (e.target === modalMask) closeExportModal(); });
historyClose.addEventListener('click', closeHistory);
historyMask.addEventListener('click', e => { if (e.target === historyMask) closeHistory(); });
historyClear.addEventListener('click', () => {
  try { localStorage.removeItem(HISTORY_KEY); } catch(_) {}
  historyList.innerHTML = `<div class="history-empty">${t('history.empty')}</div>`;
  showToast(t('history.cleared'));
});
warningClose.addEventListener('click', hideWarning);
fileInput.addEventListener('change', e => {
  const f = e.target.files?.[0];
  if (f) loadFile(f);
  e.target.value = '';
});

/* ---- 拖拽文件 ---- */
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

/* ---- 预览：背景 / 滚轮 / 缩放 / 旋转 ---- */
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
  showToast(t('toast.viewReset'));
});
btnRotate90.addEventListener('click', () => {
  if (!currentSvg) return;
  setPreviewRotation(previewRotation + 90);
});
btnRotateReset.addEventListener('click', () => {
  if (!currentSvg) return;
  setPreviewRotation(0);
});

/* ---- 窗口 resize ---- */
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
});

/* ============================================================
   25. 属性面板核心
   ============================================================ */

function makeGroup(title, rows) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title'; tEl.textContent = title;
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  rows.forEach(r => items.appendChild(r));
  g.appendChild(tEl); g.appendChild(items);
  return g;
}

/* ---- id 就地编辑 ---- */
function renderHeaderId(el, isReadOnly) {
  attrPanelId.innerHTML = '';
  attrPanelId.hidden = false;
  attrPanelId.classList.remove('attr-panel__id--empty', 'attr-panel__id--readonly', 'attr-panel__id--error');

  const idVal = el.getAttribute('id') || '';

  if (isReadOnly) {
    attrPanelId.textContent = idVal ? '#' + idVal : '+ id';
    attrPanelId.classList.add('attr-panel__id--readonly');
    if (!idVal) attrPanelId.classList.add('attr-panel__id--empty');
    attrPanelId.onclick = null;
    return;
  }

  if (!idVal) {
    attrPanelId.textContent = '+ id';
    attrPanelId.classList.add('attr-panel__id--empty');
  } else {
    attrPanelId.textContent = '#' + idVal;
  }

  attrPanelId.onclick = () => {
    if (attrPanelId.querySelector('input')) return;
    startInlineIdEdit(el, idVal);
  };
}

function startInlineIdEdit(el, idVal) {
  attrPanelId.classList.remove('attr-panel__id--error');
  attrPanelId.innerHTML = '';
  const wrap = document.createElement('span');
  wrap.className = 'attr-panel__id-edit';
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'attr-panel__id-input';
  input.value = idVal;
  input.placeholder = 'id';
  wrap.appendChild(input);
  attrPanelId.appendChild(wrap);
  input.focus();
  input.select();

  let committed = false;

  const commit = () => {
    if (committed) return;
    const newId = input.value.trim();
    if (newId === idVal) { committed = true; rebuildAttrPanel(); return; }
    if (newId && hasDuplicateId(newId, el)) {
      attrPanelId.classList.add('attr-panel__id--error');
      showToast(t('toast.idExists', { id: newId }));
      input.focus();
      return;
    }
    committed = true;
    commitAttrChange(el, 'id', newId);
    _selectedElementId = newId || null;
    setTimeout(() => rebuildAttrPanel(), 120);
  };

  const cancel = () => {
    if (committed) return;
    committed = true;
    rebuildAttrPanel();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  });
  input.addEventListener('blur', commit);
}

function hasDuplicateId(id, excludeEl) {
  if (!currentSvg) return false;
  const all = currentSvg.querySelectorAll('[id]');
  for (const node of all) {
    if (node === excludeEl) continue;
    if (node.getAttribute('id') === id) return true;
  }
  return false;
}

/* ---- title / desc 子元素文本 ---- */
let childTextCommitTimer = 0;

function makeChildTextRow(el, childTag, type, isReadOnly) {
  const row = document.createElement('div');
  row.className = 'attr-row attr-row--full';
  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = childTag;
  const _id = nextRowUid();
  label.htmlFor = _id;
  row.appendChild(label);

  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';

  let input;
  if (type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'attr-row__textarea';
    input.rows = 2;
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'attr-row__input';
  }
  input.id = _id;

  const child = el.querySelector(':scope > ' + childTag);
  input.value = child ? (child.textContent || '') : '';
  input.placeholder = child ? '' : t('field.childPlaceholder') || '';

  if (isReadOnly) input.disabled = true;

  input.addEventListener('input', () => {
    scheduleChildTextCommit(el, childTag, input.value);
  });

  ctrl.appendChild(input);
  row.appendChild(ctrl);
  return row;
}

function scheduleChildTextCommit(el, childTag, text) {
  clearTimeout(childTextCommitTimer);
  childTextCommitTimer = setTimeout(() => commitChildText(el, childTag, text), 400);
}

function commitChildText(el, childTag, text) {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.noSourceLocate')); return; }

  const code = codeEl.value;
  const escaped = esc(text);
  const childRe = new RegExp(`<${childTag}\\b[^>]*>([\\s\\S]*?)<\\/${childTag}>`, 'i');

  if (loc.isSelfClosing) {
    if (!text.trim()) return;
    const m = loc.tag.match(/^<([^\s>\/]+)/);
    const tagName = m ? m[1] : '';
    const openTag = loc.tag.replace(/\/>\s*$/, '>');
    const newBlock = `${openTag}<${childTag}>${escaped}</${childTag}></${tagName}>`;
    codeEl.value = code.slice(0, loc.start) + newBlock + code.slice(loc.end);
  } else {
    const closeEnd = skipElementContent(code, loc.start, loc.tag);
    if (closeEnd < 0) { showToast(t('toast.structError')); return; }
    const closeStart = code.lastIndexOf('</', closeEnd - 1);
    if (closeStart < 0) return;
    const openEnd = loc.start + loc.tag.length;
    const innerCode = code.slice(openEnd, closeStart);
    const m2 = innerCode.match(childRe);

    if (m2) {
      const newInner = text.trim()
        ? innerCode.replace(childRe, `<${childTag}>${escaped}</${childTag}>`)
        : innerCode.replace(childRe, '');
      codeEl.value = code.slice(0, openEnd) + newInner + code.slice(closeStart);
    } else if (text.trim()) {
      const newInner = `<${childTag}>${escaped}</${childTag}>` + innerCode;
      codeEl.value = code.slice(0, openEnd) + newInner + code.slice(closeStart);
    } else {
      return;
    }
  }

  invalidateLineOffsets();
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
}

/* ---- style 属性写入 ---- */
function scheduleStyleCommit(el, name, value) {
  clearTimeout(attrCommitTimer);
  attrCommitTimer = setTimeout(() => commitStyleChange(el, name, value), 300);
}

function commitStyleChange(el, name, value) {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.srcMissing')); return; }
  const original = codeEl.value.slice(loc.start, loc.end);
  const patched = patchStyleInTag(original, name, value);
  if (patched === original) return;
  codeEl.value = codeEl.value.slice(0, loc.start) + patched + codeEl.value.slice(loc.end);
  invalidateLineOffsets();
  suppressAttrRebuild = true;
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
  setTimeout(() => { suppressAttrRebuild = false; }, 400);
}

function makeStyleRow(el, spec, isReadOnly) {
  const row = document.createElement('div');
  row.className = 'attr-row';
  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = spec.labelKey ? t(spec.labelKey) : spec.name;
  const _id = nextRowUid();
  label.htmlFor = _id;
  row.appendChild(label);

  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';

  let value = '';
  if (el.style) value = el.style.getPropertyValue(spec.name) || '';
  if (!value) value = el.getAttribute(spec.name) || '';
  if (!value) label.classList.add('attr-row__label--from-style');

  let input;
  if (spec.type === 'select') {
    input = document.createElement('select');
    input.className = 'attr-row__select';
    input.id = _id;
    spec.options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt === '' ? t('field.defaultOption') || '(default)' : opt;
      input.appendChild(o);
    });
    input.value = value;
    input.addEventListener('change', () => commitStyleChange(el, spec.name, input.value));
  } else {
    input = document.createElement('input');
    input.type = 'text';
    input.className = 'attr-row__input';
    input.id = _id;
    input.value = value;
    input.addEventListener('input', () => scheduleStyleCommit(el, spec.name, input.value));
  }

  if (isReadOnly) input.disabled = true;
  ctrl.appendChild(input);
  row.appendChild(ctrl);
  return row;
}

/* ---- 行 / 唯一 id ---- */
let _rowUid = 0;
const nextRowUid = () => 'attr-' + (++_rowUid);

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
  label.textContent = spec.labelKey ? t(spec.labelKey) : spec.name;
  const _id = nextRowUid();
  label.htmlFor = _id;

  const animBuilder = FIELD_ANIM_MAP[spec.name];
  if (animBuilder && !isReadOnly && !isCanvas && spec.type !== 'textarea') {
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'attr-row__anim-add';
    addBtn.title = t('anim.addAnimFor', { field: spec.labelKey ? t(spec.labelKey) : spec.name });
    addBtn.textContent = '+';
    addBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      addFieldAnim(el, spec.labelKey ? t(spec.labelKey) : spec.name, animBuilder);
    });
    label.appendChild(addBtn);
    if (hasFieldAnim(el, spec.name)) {
      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'attr-row__anim-remove';
      rmBtn.title = t('anim.removeAnim');
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
    input.id = _id;
    spec.options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt === '' ? t('field.defaultOption') || '(default)' : opt;
      input.appendChild(o);
    });
    input.value = value;
  } else if (spec.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'attr-row__textarea';
    input.id = _id;
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
    text.id = _id;
    text.value = value;
    text.placeholder = '#000000 / none / url(#id)';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'attr-color__toggle';
    toggle.title = t('color.moreOptions');
    toggle.textContent = '▾';

    picker.addEventListener('input', () => {
      text.value = picker.value;
      if (isCanvas) commitCanvasAttr(spec.name, picker.value);
      else commitAttrChange(el, spec.name, picker.value);
    });
    picker.addEventListener('change', () => {
      pushRecentColor(picker.value);
    });
    text.addEventListener('input', () => {
      if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value;
      if (isCanvas) scheduleCanvasAttrCommit(spec.name, text.value);
      else scheduleAttrCommit(el, spec.name, text.value);
    });
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      setPopoverContext(isCanvas ? null : selectedPath, spec.name);
      openColorPopover(toggle, text.value, (val) => {
        text.value = val;
        if (/^#[0-9a-f]{6}$/i.test(val)) picker.value = val;
        if (isCanvas) {
          clearTimeout(canvasAttrTimer);
          commitCanvasAttr(spec.name, val);
        } else {
          commitAttrChange(el, spec.name, val);
        }
      });
    });

    wrap.appendChild(picker);
    wrap.appendChild(text);
    wrap.appendChild(toggle);
    ctrl.appendChild(wrap);
    if (isReadOnly) { picker.disabled = true; text.disabled = true; toggle.disabled = true; }
    return row;
  } else {
    input = document.createElement('input');
    input.type = spec.type === 'number' ? 'number' : 'text';
    input.id = _id;
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

  if (spec.presets && spec.presets.length > 0 && !isReadOnly) {
    const presetSel = document.createElement('select');
    presetSel.className = 'attr-row__select';
    presetSel.style.cssText = 'margin-top:4px;height:22px;padding:0 4px;font-size:11px;';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = ''; emptyOpt.textContent = t('field.presetPlaceholder') || '…';
    presetSel.appendChild(emptyOpt);
    spec.presets.forEach(p => {
      const o = document.createElement('option');
      o.value = p.value; o.textContent = t(p.labelKey);
      presetSel.appendChild(o);
    });
    presetSel.value = '';
    presetSel.addEventListener('change', () => {
      const hasEmpty = spec.presets.some(p => p.value === '');
      if (presetSel.value === '' && !hasEmpty) return;
      input.value = presetSel.value;
      if (isCanvas) {
        clearTimeout(canvasAttrTimer);
        commitCanvasAttr(spec.name, presetSel.value);
      } else {
        commitAttrChange(el, spec.name, presetSel.value);
      }
    });
    ctrl.appendChild(presetSel);
  }

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

/* ---- onCreate 分发映射 ---- */
const REF_ONCREATE_HANDLERS = {
  filter: (targetEl, attrName) => {
    openFilterEditor({ mode: 'create', targetPath: [...selectedPath], targetAttr: attrName });
  },
  marker: (targetEl, attrName, anchorBtn) => {
    openMarkerPicker(anchorBtn, [...selectedPath], attrName);
  }
};

function makeRefRow(el, spec, isReadOnly, isCanvas) {
  const row = document.createElement('div');
  row.className = 'attr-row';
  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = spec.labelKey ? t(spec.labelKey) : spec.name;
  const _id = nextRowUid();
  label.htmlFor = _id;
  row.appendChild(label);
  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';
  if (spec.onCreate) ctrl.classList.add('attr-row__control--with-extra');

  const targetEl = isCanvas ? currentSvg : el;
  const value = targetEl.getAttribute(spec.name) || '';
  const m = value.match(/url\(#([^)]+)\)/);
  const currentId = m ? m[1] : '';
  const ids = collectDefsIds(spec.defTag);
  const input = document.createElement('input');
  input.type = 'text';
  input.id = _id;
  input.className = 'attr-row__input';
  input.value = currentId;
  input.placeholder = ids.length ? ids.slice(0, 2).map(i => '#' + i).join(' / ') : 'id';
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

  if (spec.onCreate && !isReadOnly) {
    const extraBtn = document.createElement('button');
    extraBtn.type = 'button';
    extraBtn.className = 'attr-row__extra-btn';
    extraBtn.textContent = '＋';
    extraBtn.title = t('btn.newItem') || 'New';
    extraBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const handler = REF_ONCREATE_HANDLERS[spec.onCreate];
      if (handler) handler(el, spec.name, extraBtn);
    });
    ctrl.appendChild(extraBtn);
  }

  ctrl.appendChild(datalist);
  row.appendChild(ctrl);
  return row;
}

function makeStructureGroup(el, isReadOnly) {
  const group = document.createElement('div');
  group.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title'; tEl.textContent = t('group.structure');
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  items.style.gridTemplateColumns = '1fr 1fr';

  items.appendChild(makeChildTextRow(el, 'title', 'text', isReadOnly));
  items.appendChild(makeChildTextRow(el, 'desc',  'textarea', isReadOnly));

  const dupBtn = document.createElement('button');
  dupBtn.type = 'button';
  dupBtn.className = 'attr-action-btn';
  dupBtn.textContent = t('btn.copy');
  dupBtn.addEventListener('click', duplicateSelectedElement);

  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'attr-action-btn attr-action-btn--danger';
  delBtn.textContent = t('btn.delete');
  delBtn.addEventListener('click', deleteSelectedElement);

  const copyAttrBtn = document.createElement('button');
  copyAttrBtn.type = 'button';
  copyAttrBtn.className = 'attr-action-btn';
  copyAttrBtn.textContent = t('btn.copyAttr');
  copyAttrBtn.title = t('btn.copyAttrTitle');
  copyAttrBtn.disabled = isReadOnly;
  copyAttrBtn.addEventListener('click', () => copyElementAttrs(el));

  const pasteAttrBtn = document.createElement('button');
  pasteAttrBtn.type = 'button';
  pasteAttrBtn.className = 'attr-action-btn attr-action-btn--paste';
  pasteAttrBtn.textContent = t('btn.pasteAttr');
  pasteAttrBtn.title = t('btn.pasteAttrTitle');
  pasteAttrBtn.disabled = isReadOnly || !attrClipboard;
  pasteAttrBtn.addEventListener('click', () => pasteElementAttrs(el));

  items.appendChild(dupBtn);
  items.appendChild(delBtn);
  items.appendChild(copyAttrBtn);
  items.appendChild(pasteAttrBtn);

  group.appendChild(tEl);
  group.appendChild(items);
  return group;
}

/* ---- 变换组 ---- */
const TRANSFORM_ANIM_BUILDERS = {
  'translate-tx': () => `<animateTransform attributeName="transform" type="translate" values="0,0;20,0;0,0" dur="2s" repeatCount="indefinite"/>`,
  'translate-ty': () => `<animateTransform attributeName="transform" type="translate" values="0,0;0,20;0,0" dur="2s" repeatCount="indefinite"/>`,
  'rotate': (el) => {
    const c = getElementCenter(el);
    return `<animateTransform attributeName="transform" type="rotate" from="0 ${c.x} ${c.y}" to="360 ${c.x} ${c.y}" dur="4s" repeatCount="indefinite"/>`;
  },
  'scale': () => `<animateTransform attributeName="transform" type="scale" values="1;1.2;1" dur="2s" repeatCount="indefinite"/>`
};

function makeTransformGroup(el, isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title';
  tEl.textContent = t('group.transform');
  const items = document.createElement('div');
  items.className = 'attr-group__items';

  const raw = el.getAttribute('transform') || '';
  const parsed = parseTransform(raw);
  const center = getElementCenter(el);
  const values = {
    tx: parsed.tx, ty: parsed.ty,
    rot: parsed.rot,
    rotCx: parsed.rotCx != null ? parsed.rotCx : center.x,
    rotCy: parsed.rotCy != null ? parsed.rotCy : center.y,
    scale: parsed.scale,
    skewX: parsed.skewX,
    skewY: parsed.skewY,
    extra: parsed.extra
  };

  if (parsed.matrix) {
    const notice = document.createElement('div');
    notice.style.cssText = 'grid-column:1 / -1;font-size:11px;color:#b45309;background:rgba(245,158,11,.08);padding:6px 8px;border-radius:4px;line-height:1.4;word-break:break-all;';
    notice.textContent = `matrix(${parsed.matrix})`;
    items.appendChild(notice);
  }

  CONFIG.transformSpecs.forEach(spec => {
    const row = document.createElement('div');
    row.className = 'attr-row';
    const label = document.createElement('label');
    label.className = 'attr-row__label';
    label.textContent = t(spec.labelKey);
    const _id = nextRowUid();
    label.htmlFor = _id;

    if (!isReadOnly && spec.animKey && TRANSFORM_ANIM_BUILDERS[spec.animKey]) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'attr-row__anim-add';
      addBtn.title = t('anim.addAnimFor', { field: t(spec.labelKey) });
      addBtn.textContent = '+';
      addBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        addFieldAnim(el, t(spec.labelKey), () => TRANSFORM_ANIM_BUILDERS[spec.animKey](el));
      });
      label.appendChild(addBtn);
    }
    row.appendChild(label);

    const ctrl = document.createElement('div');
    ctrl.className = 'attr-row__control';
    const input = document.createElement('input');
    input.type = 'number';
    input.id = _id;
    input.className = 'attr-row__input';
    input.value = String(values[spec.key]);
    if (spec.step != null) input.step = spec.step;
    if (spec.min != null) input.min = spec.min;
    if (isReadOnly) input.disabled = true;

    input.addEventListener('input', () => {
      const v = parseFloat(input.value);
      values[spec.key] = isFinite(v) ? v : (spec.key === 'scale' ? 1 : (spec.key === 'rotCx' || spec.key === 'rotCy' ? null : 0));
      scheduleTransformCommit(el, values, center);
    });
    ctrl.appendChild(input);
    row.appendChild(ctrl);
    items.appendChild(row);
  });

  const cssSpecs = [
    { name: 'transform-origin', type: 'text' },
    { name: 'transform-box',    type: 'select', options: ['', 'view-box', 'fill-box', 'stroke-box', 'content-box', 'border-box'] }
  ];
  cssSpecs.forEach(spec => items.appendChild(makeStyleRow(el, spec, isReadOnly)));

  if (parsed.extra) {
    const notice = document.createElement('div');
    notice.style.cssText = 'grid-column:1 / -1;font-size:11px;color:#b45309;padding:2px 0;';
    notice.textContent = 'extra: ' + parsed.extra;
    items.appendChild(notice);
  }

  if (!isReadOnly) {
    const quickWrap = document.createElement('div');
    quickWrap.style.cssText = 'grid-column:1 / -1;display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;';
    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.className = 'attr-action-btn';
    resetBtn.style.cssText = 'flex:1;min-width:0;padding:5px 8px;font-size:11px;';
    resetBtn.textContent = t('btn.resetTransform');
    resetBtn.addEventListener('click', () => {
      commitTransform(el, { tx: 0, ty: 0, rot: 0, rotCx: null, rotCy: null, scale: 1, skewX: 0, skewY: 0, extra: '' }, center);
      rebuildAttrPanel();
    });
    quickWrap.appendChild(resetBtn);
    items.appendChild(quickWrap);
  }

  g.appendChild(tEl);
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
  if (!loc) { showToast(t('toast.srcMissing')); return; }
  const newValue = buildTransform(values, center.x, center.y);
  const original = codeEl.value.slice(loc.start, loc.end);
  const patched = patchAttrInTag(original, 'transform', newValue);
  if (patched === original) return;
  codeEl.value = codeEl.value.slice(0, loc.start) + patched + codeEl.value.slice(loc.end);
  invalidateLineOffsets();
  suppressAttrRebuild = true;
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
  setTimeout(() => { suppressAttrRebuild = false; }, 400);
}

/* ---- 位置属性 / 动画规格 ---- */
function getPosAttrs(tag) {
  const list = (CONFIG && CONFIG.posAttrs && CONFIG.posAttrs[tag]) || [];
  if (list.length === 0) return [];
  const textareaSet = new Set(CONFIG.posAttrTextarea || []);
  const attrs = list.map(n => ({ name: n, type: textareaSet.has(n) ? 'textarea' : 'number' }));
  if (CONFIG.pathLengthTags && CONFIG.pathLengthTags.includes(tag)) {
    attrs.push({ name: 'pathLength', type: 'number' });
  }
  return attrs;
}

function getAnimSpecs() {
  return (CONFIG && CONFIG.animSpecs) || [];
}

/* ---- 动画值解析 ---- */
function parseAnimValueList(str) {
  if (!str) return [];
  return str.split(';').map(s => s.trim()).filter(Boolean);
}
function parseAnimValueSingle(str) {
  if (!str) return [];
  const s = String(str).trim();
  if (!s) return [];
  return s.split(/[\s,]+/).map(p => p.trim()).filter(Boolean);
}
function isNumericComponent(s) {
  if (s == null) return false;
  const str = String(s).trim();
  if (str === '') return false;
  return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(str);
}
function isColorComponent(s) {
  if (s == null) return false;
  const str = String(s).trim().toLowerCase();
  if (!str) return false;
  if (/^#[0-9a-f]{3}$/i.test(str) || /^#[0-9a-f]{6}$/i.test(str) || /^#[0-9a-f]{8}$/i.test(str)) return true;
  if (/^rgb(a)?\(/.test(str)) return true;
  if (/^hsl(a)?\(/.test(str)) return true;
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
  const s = String(v || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(s)) return s;
  if (/^#[0-9a-f]{3}$/i.test(s)) return '#' + s[1]+s[1]+s[2]+s[2]+s[3]+s[3];
  return '#000000';
}
function suppressRebuildForSliders() {
  suppressAttrRebuild = true;
  clearTimeout(sliderSuppressTimer);
  sliderSuppressTimer = setTimeout(() => { suppressAttrRebuild = false; }, 1500);
}
let sliderSuppressTimer = 0;

function makeValuesSliders(valuesStr, onCommit) {
  const wrap = document.createElement('div');
  wrap.className = 'attr-sliders-wrap';
  const items = parseAnimValueList(valuesStr);
  if (items.length === 0) return wrap;
  const type = detectValuesType(items);
  if (type === 'mixed') {
    const notice = document.createElement('div');
    notice.className = 'attr-sliders-notice';
    notice.textContent = t('anim.mixedValues');
    wrap.appendChild(notice);
    return wrap;
  }
  const limit = Math.min(items.length, 10);
  if (items.length > 10) {
    const notice = document.createElement('div');
    notice.className = 'attr-sliders-notice';
    notice.textContent = t('anim.tooManyValues', { count: items.length });
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

function scheduleAttrCommit(el, name, value) {
  clearTimeout(attrCommitTimer);
  attrCommitTimer = setTimeout(() => commitAttrChange(el, name, value), 300);
}
function commitAttrChange(el, name, value) {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.srcMissing')); return; }
  const original = codeEl.value.slice(loc.start, loc.end);
  const patched = patchAttrInTag(original, name, value);
  if (patched === original) return;
  const newCode = codeEl.value.slice(0, loc.start) + patched + codeEl.value.slice(loc.end);
  codeEl.value = newCode;
  invalidateLineOffsets();
  const wasSuppressed = suppressAttrRebuild;
  suppressAttrRebuild = true;
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
  setTimeout(() => { if (!wasSuppressed) suppressAttrRebuild = false; }, 800);
}
function deleteSelectedElement() {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.srcMissing')); return; }
  let endOffset = loc.end;
  if (!loc.isSelfClosing) {
    const end = skipElementContent(codeEl.value, loc.start, loc.tag);
    if (end < 0) { showToast(t('toast.deleteFailed')); return; }
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
  invalidateLineOffsets();
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
  closeAttrPanel();
  showToast(t('toast.deleted'));
}
function duplicateSelectedElement() {
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.srcMissing')); return; }
  let block = codeEl.value.slice(loc.start, loc.end);
  if (!loc.isSelfClosing) {
    const end = skipElementContent(codeEl.value, loc.start, loc.tag);
    if (end < 0) { showToast(t('toast.duplicateFailed')); return; }
    block = codeEl.value.slice(loc.start, end);
  }
  const m = block.match(/\sid="([^"]+)"/);
  if (m) {
    const newId = m[1] + '-copy';
    block = block.replace(/\sid="[^"]+"/, ` id="${newId}"`);
  }
  const insertPos = loc.isSelfClosing ? loc.end : skipElementContent(codeEl.value, loc.start, loc.tag);
  codeEl.value = codeEl.value.slice(0, insertPos) + '\n' + block + codeEl.value.slice(insertPos);
  invalidateLineOffsets();
  renderEditor(); schedulePreviewRender(); saveDraftDebounced(); recordSnapshot(true);
  showToast(t('toast.duplicated') || t('toast.copied'));
}
function locateSelectedInSource() {
  if (canvasRootMode) {
    const rootLoc = findRootSvgTag(codeEl.value);
    if (!rootLoc) { showToast(t('toast.noSourceLocate')); return; }
    if (isMobileViewport() && mobileView === 'attr') setMobileView('code');
    try { codeEl.focus(); codeEl.setSelectionRange(rootLoc.start, rootLoc.end); } catch(_) {}
    const lineNo = posToLineNo(rootLoc.start);
    const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
    const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
    codeEl.scrollTop = Math.max(0, (lineNo - 2) * lineHeight - codeEl.clientHeight / 3 + padTop);
    syncScroll();
    updateCurrentLineHighlight();
    return;
  }
  if (!selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.noSourceLocate')); return; }
  let end = loc.end;
  if (!loc.isSelfClosing) {
    const e = skipElementContent(codeEl.value, loc.start, loc.tag);
    if (e > 0) end = e;
  }
  if (isMobileViewport() && mobileView === 'attr') setMobileView('code');
  try { codeEl.focus(); codeEl.setSelectionRange(loc.start, end); } catch(_) {}
  const lineNo = posToLineNo(loc.start);
  const lineHeight = parseFloat(getComputedStyle(codeEl).lineHeight) || 21;
  const padTop = parseFloat(getComputedStyle(codeEl).paddingTop) || 0;
  codeEl.scrollTop = Math.max(0, (lineNo - 2) * lineHeight - codeEl.clientHeight / 3 + padTop);
  syncScroll();
  updateCurrentLineHighlight();
}

/* ============================================================
   26. 属性面板：画布模式
   ============================================================ */
function rebuildCanvasAttrPanel() {
  if (!currentSvg) { clearSelection(); return; }
  closeAnimAddMenu();
  attrPanelTag.textContent = '<svg>';
  attrPanelId.hidden = true;
  attrPanelCanvasBtn.classList.add('is-active');
  attrPanelCanvasBtn.textContent = canvasBackPath ? t('attrPanel.back') : t('attrPanel.canvas');
  const loc = findRootSvgTag(codeEl.value);
  const isReadOnly = !loc;
  attrPanelWarning.hidden = !isReadOnly;
  attrPanelBody.innerHTML = '';
  attrPanelBody.appendChild(makeViewBoxGroup(isReadOnly));
  attrPanelBody.appendChild(makeCanvasSizeGroup(isReadOnly));
  attrPanelBody.appendChild(makeCanvasBackgroundGroup(isReadOnly));
  attrPanel.dataset.readonly = isReadOnly ? '1' : '';
}

function makeViewBoxGroup(isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title';
  tEl.textContent = t('group.canvas');
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  const vbAttr = currentSvg.getAttribute('viewBox') || '';
  const p = vbAttr.trim().split(/[\s,]+/).map(Number);
  const vbv = (p.length === 4 && p.every(n => isFinite(n))) ? p : [0, 0, 100, 100];
  const vbWrap = document.createElement('div');
  vbWrap.className = 'attr-viewbox';
  const vbLabels = (CONFIG && CONFIG.vbLabels) || ['minX', 'minY', 'width', 'height'];
  const vbInputs = [];
  vbLabels.forEach((lbl, i) => {
    const row = document.createElement('div');
    row.className = 'attr-row';
    const label = document.createElement('label');
    label.className = 'attr-row__label';
    label.textContent = lbl;
    const _id = nextRowUid();
    label.htmlFor = _id;
    row.appendChild(label);
    const ctrl = document.createElement('div');
    ctrl.className = 'attr-row__control';
    const input = document.createElement('input');
    input.type = 'number';
    input.id = _id;
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
  const parOptions = (CONFIG && CONFIG.parOptions) || [''];
  items.appendChild(makeRow(currentSvg, {
    name: 'preserveAspectRatio', type: 'select', options: parOptions
  }, isReadOnly, true));
  if (!isReadOnly) {
    const fitBtn = document.createElement('button');
    fitBtn.type = 'button';
    fitBtn.className = 'attr-fit-btn';
    fitBtn.textContent = t('btn.autoFitViewBox');
    fitBtn.addEventListener('click', autoFitViewBox);
    items.appendChild(fitBtn);
  }
  g.appendChild(tEl);
  g.appendChild(items);
  return g;
}

function makeCanvasSizeGroup(isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title';
  tEl.textContent = t('group.canvasSize');
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  const vbAttr = currentSvg.getAttribute('viewBox') || '';
  const p = vbAttr.trim().split(/[\s,]+/).map(Number);
  const vbv = (p.length === 4 && p.every(n => isFinite(n))) ? p : [0, 0, 100, 100];
  const wRow = document.createElement('div');
  wRow.className = 'attr-row';
  const wLabel = document.createElement('label');
  wLabel.className = 'attr-row__label';
  wLabel.textContent = t('field.sizeW');
  const _wid = nextRowUid();
  wLabel.htmlFor = _wid;
  wRow.appendChild(wLabel);
  const wCtrl = document.createElement('div');
  wCtrl.className = 'attr-row__control';
  const wInput = document.createElement('input');
  wInput.type = 'number';
  wInput.id = _wid;
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
  hLabel.textContent = t('field.sizeH');
  const _hid = nextRowUid();
  hLabel.htmlFor = _hid;
  hRow.appendChild(hLabel);
  const hCtrl = document.createElement('div');
  hCtrl.className = 'attr-row__control';
  const hInput = document.createElement('input');
  hInput.type = 'number';
  hInput.id = _hid;
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
    const presetsWrap = document.createElement('div');
    presetsWrap.className = 'attr-group__presets';
    presetsWrap.style.gridColumn = '1 / -1';
    (CONFIG.canvasPresets || []).forEach(preset => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'attr-preset-btn';
      btn.textContent = t('canvasPreset.' + preset.key);
      btn.title = t('canvasPreset.' + preset.key);
      btn.addEventListener('click', () => {
        const dims = computePresetSize(preset, vbv[2], vbv[3]);
        if (!dims) return;
        if (dims.w > 10000 || dims.h > 10000) {
          showToast(t('toast.canvasTooLarge'));
          return;
        }
        commitCanvasSize(vbv[0], vbv[1], dims.w, dims.h);
      });
      presetsWrap.appendChild(btn);
    });
    items.appendChild(presetsWrap);

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'attr-fit-btn';
    applyBtn.textContent = t('btn.applyCanvasSize');
    applyBtn.addEventListener('click', () => {
      const newW = parseFloat(wInput.value);
      const newH = parseFloat(hInput.value);
      if (!isFinite(newW) || newW <= 0 || !isFinite(newH) || newH <= 0) {
        showToast(t('toast.invalidCanvasSize'));
        return;
      }
      if (newW > 10000 || newH > 10000) {
        showToast(t('toast.canvasTooLarge'));
        return;
      }
      commitCanvasSize(vbv[0], vbv[1], newW, newH);
    });
    items.appendChild(applyBtn);
  }
  g.appendChild(tEl);
  g.appendChild(items);
  return g;
}

function commitCanvasSize(minX, minY, newW, newH) {
  const loc = findRootSvgTag(codeEl.value);
  if (!loc) { showToast(t('toast.noSourceLocate')); return; }
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

  syncBackgroundRectTo(newMinX, newMinY, newW, newH);

  isFitMode = false;
  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot();
  showToast(t('toast.canvasSet', { w: newW, h: newH }));
  setTimeout(() => { if (canvasRootMode) rebuildCanvasAttrPanel(); }, 300);
}
function autoFitViewBox() {
  const svgRoot = canvasEl.firstElementChild;
  if (!svgRoot) { showToast(t('toast.renderFailed', { msg: '' })); return; }

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
    showToast(t('toast.noContentToFit'));
    return;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) { showToast(t('toast.contentSizeError')); return; }
  const pad = Math.max(w, h) * 0.05;
  const vx = Math.round((minX - pad) * 100) / 100;
  const vy = Math.round((minY - pad) * 100) / 100;
  const vw = Math.round((w + pad * 2) * 100) / 100;
  const vh = Math.round((h + pad * 2) * 100) / 100;
  commitCanvasAttr('viewBox', `${vx} ${vy} ${vw} ${vh}`);
  showToast(t('toast.viewBoxFitted', { v: `${vx} ${vy} ${vw} ${vh}` }));
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
let canvasAttrTimer = 0;
let canvasViewBoxTimer = 0;
function commitCanvasAttr(name, value) {
  const loc = findRootSvgTag(codeEl.value);
  if (!loc) { showToast(t('toast.noSourceLocate')); return; }
  const openTag = codeEl.value.slice(loc.openStart, loc.openEnd);
  const patched = patchAttrInTag(openTag, name, value);
  if (patched === openTag) return;
  codeEl.value = codeEl.value.slice(0, loc.openStart) + patched + codeEl.value.slice(loc.openEnd);
  if (name === 'viewBox' || name === 'width' || name === 'height') {
    isFitMode = false;
  }
  invalidateLineOffsets();
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();
}

function computePresetSize(preset, curW, curH) {
  if (preset.mode === 'fixed') {
    return { w: preset.width, h: preset.height };
  }
  if (preset.mode === 'square') {
    return { w: preset.size, h: preset.size };
  }
  if (preset.mode === 'ratio') {
    const base = Math.max(curW, curH);
    if (preset.ratio >= 1) {
      return { w: base, h: base / preset.ratio };
    }
    return { w: base * preset.ratio, h: base };
  }
  return null;
}

function getCurrentBackgroundRect(svg) {
  if (!svg) return null;
  for (const child of svg.children) {
    if (child.localName === 'rect' && child.getAttribute('data-editor-bg') === '1') {
      return child;
    }
  }
  return null;
}

function getCanvasViewBoxSize(svg) {
  const vbAttr = svg.getAttribute('viewBox') || '';
  const p = vbAttr.trim().split(/[\s,]+/).map(Number);
  if (p.length === 4 && p[2] > 0 && p[3] > 0) {
    return { x: p[0], y: p[1], w: p[2], h: p[3] };
  }
  const w = parseLength(svg.getAttribute('width')) || 800;
  const h = parseLength(svg.getAttribute('height')) || 600;
  return { x: 0, y: 0, w, h };
}

function syncBackgroundRectTo(x, y, w, h) {
  const rectRegex = /<rect\b[^>]*\bdata-editor-bg\s*=\s*["']1["'][^>]*>/i;
  const m = codeEl.value.match(rectRegex);
  if (!m) return;
  const fmt = n => String(Math.round(n * 100) / 100);
  let patched = m[0];
  patched = patchAttrInTag(patched, 'x', fmt(x));
  patched = patchAttrInTag(patched, 'y', fmt(y));
  patched = patchAttrInTag(patched, 'width', fmt(w));
  patched = patchAttrInTag(patched, 'height', fmt(h));
  if (patched !== m[0]) {
    codeEl.value = codeEl.value.replace(rectRegex, patched);
  }
}

function commitCanvasBackground(color) {
  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('toast.parseFailed', { msg: err.message || '' })); return; }

  const vb = getCanvasViewBoxSize(svgRoot);
  let bgRect = getCurrentBackgroundRect(svgRoot);

  if (!color) {
    if (bgRect) bgRect.remove();
    else return;
  } else if (bgRect) {
    bgRect.setAttribute('fill', color);
  } else {
    bgRect = document.createElementNS(SVG_NS, 'rect');
    bgRect.setAttribute('data-editor-bg', '1');
    bgRect.setAttribute('x', String(vb.x));
    bgRect.setAttribute('y', String(vb.y));
    bgRect.setAttribute('width', String(vb.w));
    bgRect.setAttribute('height', String(vb.h));
    bgRect.setAttribute('fill', color);
    svgRoot.insertBefore(bgRect, svgRoot.firstChild);
  }

  codeEl.value = serializeSVG(svgRoot);
  invalidateLineOffsets();
  suppressAttrRebuild = true;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  setTimeout(() => {
    suppressAttrRebuild = false;
    if (canvasRootMode && attrPanelOpen) rebuildCanvasAttrPanel();
  }, 120);

  showToast(color ? t('toast.bgSet') : t('toast.bgCleared'));
}

function makeCanvasBackgroundGroup(isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title';
  tEl.textContent = t('group.background');
  const items = document.createElement('div');
  items.className = 'attr-group__items';

  const bgRect = getCurrentBackgroundRect(currentSvg);
  const currentFill = bgRect ? (bgRect.getAttribute('fill') || '') : '';

  const colorRow = document.createElement('div');
  colorRow.className = 'attr-row attr-row--full';
  const colorLabel = document.createElement('label');
  colorLabel.className = 'attr-row__label';
  colorLabel.textContent = t('field.color');
  const _cid = nextRowUid();
  colorLabel.htmlFor = _cid;
  colorRow.appendChild(colorLabel);

  const colorCtrl = document.createElement('div');
  colorCtrl.className = 'attr-row__control';
  const colorWrap = document.createElement('div');
  colorWrap.className = 'attr-color';

  const picker = document.createElement('input');
  picker.type = 'color';
  picker.className = 'attr-color__picker';
  picker.value = /^#[0-9a-f]{6}$/i.test(currentFill) ? currentFill
               : /^#[0-9a-f]{3}$/i.test(currentFill) ? '#' + currentFill[1]+currentFill[1]+currentFill[2]+currentFill[2]+currentFill[3]+currentFill[3]
               : '#ffffff';

  const text = document.createElement('input');
  text.type = 'text';
  text.className = 'attr-row__input attr-color__text';
  text.id = _cid;
  text.value = currentFill;
  text.placeholder = '#ffffff';

  picker.addEventListener('input', () => {
    text.value = picker.value;
    commitCanvasBackground(picker.value);
  });
  text.addEventListener('change', () => {
    const v = text.value.trim();
    commitCanvasBackground(v);
  });

  colorWrap.appendChild(picker);
  colorWrap.appendChild(text);
  colorCtrl.appendChild(colorWrap);
  colorRow.appendChild(colorCtrl);
  items.appendChild(colorRow);

  if (!isReadOnly && bgRect) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'attr-action-btn attr-action-btn--danger';
    clearBtn.style.gridColumn = '1 / -1';
    clearBtn.textContent = t('btn.clearBackground');
    clearBtn.addEventListener('click', () => commitCanvasBackground(''));
    items.appendChild(clearBtn);
  }

  if (isReadOnly) { picker.disabled = true; text.disabled = true; }

  g.appendChild(tEl);
  g.appendChild(items);
  return g;
}

/* ============================================================
   27. 源码定位（路径↔偏移）
   ============================================================ */
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

/* ---- 阶段 1：style 属性补丁 ---- */
function setCSSProp(styleStr, name, value) {
  const parts = styleStr.split(';').map(s => s.trim()).filter(Boolean);
  const map = {};
  const order = [];
  parts.forEach(p => {
    const idx = p.indexOf(':');
    if (idx < 0) return;
    const k = p.slice(0, idx).trim().toLowerCase();
    const v = p.slice(idx + 1).trim();
    if (k) {
      if (!(k in map)) order.push(k);
      map[k] = v;
    }
  });
  if (value) {
    if (!(name in map)) order.push(name);
    map[name] = String(value);
  } else {
    delete map[name];
    const i = order.indexOf(name);
    if (i >= 0) order.splice(i, 1);
  }
  return order.map(k => `${k}: ${map[k]}`).join('; ');
}

function patchStyleInTag(tag, name, value) {
  const cssName = name.toLowerCase();
  const styleRe = /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/i;
  const m = tag.match(styleRe);

  if (m) {
    const quote = m[0].indexOf('"') >= 0 ? '"' : "'";
    const originalStyle = m[2] != null ? m[2] : m[3];
    const newStyle = setCSSProp(originalStyle, cssName, value);
    if (newStyle.trim() === '') return tag.replace(styleRe, '');
    return tag.replace(styleRe, ` style=${quote}${newStyle}${quote}`);
  }
  if (!value) return tag;
  const closeMatch = tag.match(/(\s*\/?>)$/);
  if (!closeMatch) return tag;
  const insertAt = tag.length - closeMatch[1].length;
  return tag.slice(0, insertAt) + ` style="${cssName}: ${escapeAttr(value)}"` + tag.slice(insertAt);
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

/* ============================================================
   28. 元素选中 / 高亮框
   ============================================================ */
const ANIM_TAGS = new Set(['animate', 'animatetransform', 'animatemotion', 'animatecolor', 'set']);
let animAddMenuEl = null;
let overlayRafId = 0;

/* 高亮框：每次重建，无跨帧缓存状态 */
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

/* 用 canvas 里可见元素解析路径：
   currentSvg 是 parseSVG 解析出的游离副本，getBoundingClientRect() 恒返回 0 */
function refreshSelectionOverlay() {
  if (!selectionOverlayEl) return;
  if (!selectedPath || !currentSvg) { selectionOverlayEl.innerHTML = ''; return; }
  const svgVisible = canvasEl.firstElementChild;
  const el = svgVisible ? resolvePath(svgVisible, selectedPath) : null;
  if (el) applySelectionOutline(el);
  else selectionOverlayEl.innerHTML = '';
}

/* 纯 rAF 合并：同帧多次调用只刷新一次 */
function scheduleRefreshSelectionOverlay() {
  if (!selectionOverlayEl) return;
  if (overlayRafId) return;
  overlayRafId = requestAnimationFrame(() => {
    overlayRafId = 0;
    refreshSelectionOverlay();
  });
}

/* 选中身份校验（用于 renderPreview 恢复选中时检测路径是否已失配） */
let _selectedElementTag = null;
let _selectedElementId  = null;

/* 选中元素：先切布局再同步绘制
   getBoundingClientRect() 会强制 reflow，读到的是 openAttrPanel 后的新坐标 */
function selectElement(el) {
  if (!el || el === canvasEl.firstElementChild) return;
  const path = getElementPath(el);
  if (!path) return;
  selectedPath = path;
  _selectedElementTag = el.localName;
  _selectedElementId  = el.getAttribute('id') || null;
  canvasRootMode = false;
  canvasBackPath = null;
  openAttrPanel();
  applySelectionOutline(el);
}

function clearSelection() {
  selectedPath = null;
  _selectedElementTag = null;
  _selectedElementId  = null;
  canvasRootMode = false;
  canvasBackPath = null;
  if (selectionOverlayEl) selectionOverlayEl.innerHTML = '';
  closeAttrPanel();
}

/* JS-29 动画管理 | 数据驱动：ANIM_TEMPLATES 来自 CONFIG.animTemplates；FIELD_ANIM_MAP 改为 getFieldAnimBuilder + Proxy 兼容层 */
/* ============================================================
   29. 动画管理
   ============================================================ */

/* ---- 底层动画值生成工具（保留，供 FIELD_ANIM_KIND_BUILDERS 使用） ---- */
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

/* ---- 字段动画：kind → 生成函数（新增 kind 时在此追加） ---- */
const FIELD_ANIM_KIND_BUILDERS = {
  valuePulse:   (el, name, spec) => buildValuePulseAnim(name, el.getAttribute(name) || 0, spec.delta || 20),
  scalePulse:   (el, name, spec) => buildScalePulseAnim(name, el.getAttribute(name) || 100, spec.factor || 1.3),
  colorLoop:    (el, name) => buildColorLoopAnim(name),
  opacityPulse: (el, name) => buildOpacityPulseAnim(name),
  dashoffset:   (el, name) => `<animate attributeName="stroke-dashoffset" from="100" to="0" dur="2s" repeatCount="indefinite"/>`
};

function getFieldAnimBuilder(fieldName) {
  const fa = (CONFIG && CONFIG.fieldAnims) || {};
  const spec = fa[fieldName];
  if (!spec) return null;
  const kindBuilder = FIELD_ANIM_KIND_BUILDERS[spec.kind];
  if (!kindBuilder) return null;
  return (el) => kindBuilder(el, fieldName, spec);
}

/* 兼容层：保留 FIELD_ANIM_MAP[spec.name] 的旧引用方式，JS-25 无需修改 */
const FIELD_ANIM_MAP = new Proxy({}, {
  get(_, name) {
    return getFieldAnimBuilder(name) || undefined;
  },
  has(_, name) {
    return !!(CONFIG && CONFIG.fieldAnims && CONFIG.fieldAnims[name]);
  }
});

/* ---- 动画模板：kind + attrs → 标签字符串 ---- */
function buildAnimTag(kind, attrs) {
  const esc = v => String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const attrStr = Object.entries(attrs || {})
    .filter(([k, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}="${esc(v)}"`).join(' ');
  return attrStr ? `<${kind} ${attrStr}/>` : `<${kind}/>`;
}

function buildAnimFromSpec(templateId, el) {
  const templates = CONFIG && CONFIG.animTemplates;
  if (!templates || !templates.builders) return null;
  const spec = templates.builders[templateId];
  if (!spec) return null;
  const attrs = { ...(spec.attrs || {}) };
  if (spec.dynamic === 'rotateCenter') {
    const c = getElementCenter(el);
    attrs.attributeName = attrs.attributeName || 'transform';
    attrs.from = `0 ${c.x} ${c.y}`;
    attrs.to   = `360 ${c.x} ${c.y}`;
  }
  return buildAnimTag(spec.kind, attrs);
}

function getAnimTemplateIds() {
  return (CONFIG && CONFIG.animTemplates && CONFIG.animTemplates.order) || [];
}

function isCustomAnimTemplate(id) {
  const templates = CONFIG && CONFIG.animTemplates;
  if (!templates || !templates.builders) return false;
  const spec = templates.builders[id];
  return !!(spec && spec.isCustom);
}

/* ---- 元素中心（供旋转类动画计算） ---- */
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

/* ---- 动画存在性检测 ---- */
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

/* ---- 删除动画 ---- */
function removeFieldAnims(el, fieldName) {
  if (!selectedPath || !el) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.noSourceLocate')); return; }
  if (loc.isSelfClosing || skipElementContent(codeEl.value, loc.start, loc.tag) < 0) {
    showToast(t('anim.noAnim')); return;
  }
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
  codeEl.value = formatXML(serializeSVG(svgRoot));
  currentSvg = svgRoot;
  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  rebuildAttrPanel();
  showToast(t('anim.deleteFieldAnim', { field: fieldName }));
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
  codeEl.value = formatXML(serializeSVG(svgRoot));
  currentSvg = svgRoot;
  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  rebuildAttrPanel();
  showToast(t('anim.deleteTransformAnim', { type }));
}
function removeAllAnimsOfElement(el) {
  if (!selectedPath || !el) return;
  if (!confirm(t('anim.deleteAllConfirm'))) return;
  const svgRoot = parseSVG(codeEl.value);
  const target = resolvePath(svgRoot, selectedPath);
  if (!target) return;
  const toRemove = [];
  Array.from(target.children).forEach(child => {
    if (ANIM_TAGS.has(child.localName.toLowerCase())) toRemove.push(child);
  });
  if (toRemove.length === 0) return;
  toRemove.forEach(c => c.remove());
  codeEl.value = formatXML(serializeSVG(svgRoot));
  currentSvg = svgRoot;
  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  rebuildAttrPanel();
  showToast(t('anim.deleteAllAnims'));
}

/* ---- 变换解析 / 构建 ---- */
function parseTransform(str) {
  const result = { tx: 0, ty: 0, rot: 0, rotCx: null, rotCy: null, scale: 1, skewX: 0, skewY: 0, matrix: null, extra: '' };
  if (!str) return result;
  let remain = String(str);

  const matrixMatch = remain.match(/matrix\s*\(\s*([^)]+)\s*\)/i);
  if (matrixMatch) {
    result.matrix = matrixMatch[1].trim();
    remain = remain.replace(matrixMatch[0], '');
  }

  remain = remain.replace(/translate\s*\(\s*([-\d.]+)(?:\s*[, ]\s*([-\d.]+))?\s*\)/gi,
    (_, x, y) => { result.tx += parseFloat(x) || 0; result.ty += parseFloat(y) || 0; return ''; });

  remain = remain.replace(/rotate\s*\(\s*([-\d.]+)(?:\s*[, ]\s*([-\d.]+)\s*[, ]\s*([-\d.]+))?\s*\)/gi,
    (_, a, cx, cy) => {
      result.rot += parseFloat(a) || 0;
      if (cx != null && cy != null) {
        result.rotCx = parseFloat(cx);
        result.rotCy = parseFloat(cy);
      }
      return '';
    });

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

  remain = remain.replace(/skewX\s*\(\s*([-\d.]+)\s*\)/gi,
    (_, a) => { result.skewX += parseFloat(a) || 0; return ''; });
  remain = remain.replace(/skewY\s*\(\s*([-\d.]+)\s*\)/gi,
    (_, a) => { result.skewY += parseFloat(a) || 0; return ''; });

  result.extra = remain.replace(/\s+/g, ' ').trim();
  return result;
}
function buildTransform(v, defaultCx, defaultCy) {
  const parts = [];
  if (v.tx !== 0 || v.ty !== 0) parts.push(`translate(${v.tx}, ${v.ty})`);
  if (v.rot !== 0) {
    const cx = (v.rotCx != null && isFinite(v.rotCx)) ? v.rotCx : defaultCx;
    const cy = (v.rotCy != null && isFinite(v.rotCy)) ? v.rotCy : defaultCy;
    parts.push(`rotate(${v.rot}, ${cx}, ${cy})`);
  }
  if (v.scale !== 1) parts.push(`scale(${v.scale})`);
  if (v.skewX !== 0) parts.push(`skewX(${v.skewX})`);
  if (v.skewY !== 0) parts.push(`skewY(${v.skewY})`);
  if (v.extra) parts.push(v.extra);
  return parts.join(' ');
}

/* ---- 动画插入 ---- */
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
  const animMarkup = buildAnimFromSpec(templateId, el);
  if (!animMarkup) { showToast(t('anim.insertFailed')); return; }
  const parentPath = [...selectedPath];
  if (!insertAnimChild(parentPath, animMarkup)) {
    showToast(t('anim.insertFailed'));
    return;
  }
  invalidateLineOffsets();
  renderEditor();
  saveDraftDebounced();
  recordSnapshot(true);
  let newSvg;
  try { newSvg = parseSVG(codeEl.value); }
  catch (err) {
    showToast(t('anim.parseAfterInsert', { msg: err.message || '' }));
    return;
  }
  const newParent = resolvePath(newSvg, parentPath);
  if (!newParent || newParent.children.length === 0) {
    showToast(t('anim.notFoundAfterInsert'));
    return;
  }
  const newIdx = newParent.children.length - 1;
  currentSvg = newSvg;
  selectedPath = [...parentPath, newIdx];
  const newAnimEl = resolvePath(newSvg, selectedPath);
  _selectedElementTag = newAnimEl ? newAnimEl.localName : null;
  _selectedElementId  = newAnimEl ? (newAnimEl.getAttribute('id') || null) : null;
  renderPreview();
  rebuildAttrPanel();
  showToast(isCustomAnimTemplate(templateId) ? t('anim.customHint') : t('anim.added', { label: t('anim.' + templateId) }));
  closeAnimAddMenu();
}

function addFieldAnim(el, fieldName, animBuilder) {
  if (!selectedPath || !currentSvg) return;
  if (!el) return;
  const markup = animBuilder(el);
  if (!markup) { showToast(t('anim.insertFailed')); return; }
  const parentPath = [...selectedPath];
  if (!insertAnimChild(parentPath, markup)) {
    showToast(t('anim.insertFailed'));
    return;
  }
  invalidateLineOffsets();
  renderEditor();
  saveDraftDebounced();
  recordSnapshot(true);
  let newSvg;
  try { newSvg = parseSVG(codeEl.value); }
  catch (err) {
    showToast(t('anim.parseAfterInsert', { msg: err.message || '' }));
    return;
  }
  const newParent = resolvePath(newSvg, parentPath);
  if (!newParent || newParent.children.length === 0) {
    showToast(t('anim.notFoundAfterInsert'));
    return;
  }
  const newIdx = newParent.children.length - 1;
  currentSvg = newSvg;
  selectedPath = [...parentPath, newIdx];
  const newAnimEl = resolvePath(newSvg, selectedPath);
  _selectedElementTag = newAnimEl ? newAnimEl.localName : null;
  _selectedElementId  = newAnimEl ? (newAnimEl.getAttribute('id') || null) : null;
  renderPreview();
  rebuildAttrPanel();
  showToast(t('anim.addedToField', { field: fieldName }));
}

/* ---- 动画添加菜单 ---- */
function showAnimAddMenu(anchorEl) {
  closeAnimAddMenu();
  const menu = document.createElement('div');
  menu.className = 'attr-anim-menu';
  getAnimTemplateIds().forEach(id => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('anim.' + id);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addAnimTemplate(id);
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
function closeAnimAddMenu() {
  if (animAddMenuEl && animAddMenuEl.parentNode) {
    animAddMenuEl.parentNode.removeChild(animAddMenuEl);
  }
  animAddMenuEl = null;
}

/* ---- 属性面板开 / 关 ---- */
function openAttrPanel() {
  closeFindPanel();
  closeAllMenus();
  closeAnimAddMenu();
  attrPanelOpen = true;
  rebuildAttrPanel();
  if (isMobileViewport()) setMobileView('attr');
  else attrPanel.hidden = false;
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
}


/* ---- 属性面板主入口 ---- */
/*
function rebuildAttrPanel() {
  if (!attrPanelOpen) return;
  if (canvasRootMode) {
    rebuildCanvasAttrPanel();
    return;
  }
  if (!selectedPath || !currentSvg) return;
  closeAnimAddMenu();
  */
function rebuildAttrPanel() {
  if (!attrPanelOpen) return;
  const activeEl = document.activeElement;
  if (activeEl && attrPanelBody.contains(activeEl) &&
      (activeEl.tagName === 'INPUT' ||
       activeEl.tagName === 'TEXTAREA' ||
       activeEl.tagName === 'SELECT')) {
    return;
  }

  if (canvasRootMode) {
    rebuildCanvasAttrPanel();
    return;
  }
  if (!selectedPath || !currentSvg) return;
  closeAnimAddMenu();
  
  attrPanelCanvasBtn.classList.remove('is-active');
  attrPanelCanvasBtn.textContent = t('attrPanel.canvas');
  const el = resolvePath(currentSvg, selectedPath);
  if (!el) { clearSelection(); return; }
  const tagName = el.localName;
  const isAnim = ANIM_TAGS.has(tagName.toLowerCase());

  attrPanelTag.textContent = '<' + tagName + '>';

  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  const isReadOnly = !loc;
  renderHeaderId(el, isReadOnly);

  ensureHeaderAddBtn(isAnim);
  attrPanelWarning.hidden = !isReadOnly;
  attrPanelBody.innerHTML = '';

  if (tagName === 'image') {
    const href = el.getAttribute('href') || el.getAttribute('xlink:href');
    const clipAttr = el.getAttribute('clip-path') || '';

    if (href) {
      const wrap = document.createElement('div');
      wrap.className = 'attr-image-preview';
      const img = document.createElement('img');
      img.src = href; img.alt = '';
      wrap.appendChild(img);

      if (!isReadOnly && clipAttr && /^url\(#clip-/.test(clipAttr)) {
        const reconfigBtn = document.createElement('button');
        reconfigBtn.type = 'button';
        reconfigBtn.className = 'attr-image-reconfig';
        reconfigBtn.title = t('attrPanel.reconfigImage');
        reconfigBtn.setAttribute('aria-label', t('attrPanel.reconfigImage'));
        reconfigBtn.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true"' +
          ' fill="none" stroke="currentColor" stroke-width="2"' +
          ' stroke-linecap="round" stroke-linejoin="round">' +
          '<path d="M12 20h9"/>' +
          '<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>' +
          '</svg>';
        reconfigBtn.addEventListener('click', () => {
          const href2 = el.getAttribute('href') || el.getAttribute('xlink:href');
          if (!href2) { showToast(t('attrPanel.imageMissing')); return; }
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
            showToast(t('toast.imageInsertFailed', { msg: err.message || '' }));
          }
        });
        wrap.appendChild(reconfigBtn);
      }

      attrPanelBody.appendChild(wrap);
    }

    if (/url\(#clip-/.test(clipAttr)) {
      attrPanelBody.appendChild(makeImageClipShapeGroup(el, isReadOnly));
    }
  }

  if (isAnim) {
    if (selectedPath && selectedPath.length > 0) {
      const animGroup = makeGroup(t('group.animation'), getAnimSpecs().map(a => makeRow(el, a, isReadOnly, false)));
      const animTitle = animGroup.querySelector('.attr-group__title');
      if (animTitle) {
        animTitle.classList.add('attr-group__title--with-action');
        const backBtn = document.createElement('button');
        backBtn.type = 'button';
        backBtn.className = 'attr-back-btn';
        backBtn.textContent = t('attrPanel.backToParent');
        backBtn.addEventListener('click', () => {
          const parentPath = selectedPath.slice(0, -1);
          const svgVisible = canvasEl.firstElementChild;
          const parentEl = svgVisible ? resolvePath(svgVisible, parentPath) : null;
          if (parentEl) {
            selectedPath = parentPath;
            _selectedElementTag = parentEl.localName;
            _selectedElementId  = parentEl.getAttribute('id') || null;
            applySelectionOutline(parentEl);
            rebuildAttrPanel();
          }
        });
        animTitle.appendChild(backBtn);
      }
      attrPanelBody.appendChild(animGroup);
    } else {
      attrPanelBody.appendChild(makeGroup(t('group.animation'), getAnimSpecs().map(a => makeRow(el, a, isReadOnly, false))));
    }
    if (!isReadOnly) attrPanelBody.appendChild(makeStructureGroup(el, isReadOnly));
    attrPanel.dataset.readonly = isReadOnly ? '1' : '';
    return;
  }

  if (tagName === 'linearGradient' || tagName === 'radialGradient') {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'attr-fit-btn';
    editBtn.textContent = t('attrPanel.editGradient');
    editBtn.style.marginBottom = '10px';
    editBtn.disabled = isReadOnly;
    editBtn.addEventListener('click', () => {
      const id = el.getAttribute('id');
      if (!id) { showToast(t('attrPanel.gradientNoId')); return; }
      openGradientEditor({
        mode: 'edit',
        existingId: id,
        existingPath: [...selectedPath]
      });
    });
    attrPanelBody.appendChild(editBtn);
  }

  if (tagName === 'filter') {
    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'attr-fit-btn';
    editBtn.textContent = t('attrPanel.editFilter');
    editBtn.style.marginBottom = '10px';
    editBtn.disabled = isReadOnly;
    editBtn.addEventListener('click', () => {
      const id = el.getAttribute('id');
      if (!id) { showToast(t('attrPanel.filterNoId')); return; }
      openFilterEditor({
        mode: 'edit',
        existingId: id,
        existingPath: [...selectedPath]
      });
    });
    attrPanelBody.appendChild(editBtn);
  }

  const posAttrs = getPosAttrs(tagName);
  if (posAttrs.length) {
    attrPanelBody.appendChild(makeGroup(t('group.position'), posAttrs.map(a => makeRow(el, a, isReadOnly, false))));
  }
  attrPanelBody.appendChild(makeTransformGroup(el, isReadOnly));

  attrPanelBody.appendChild(makeGroup(t('group.appearance'), (CONFIG.fillSpecs || []).map(a => makeRow(el, a, isReadOnly, false))));
  attrPanelBody.appendChild(makeGroup(t('group.strokeAdvanced'), (CONFIG.strokeAdvSpecs || []).map(a => makeRow(el, a, isReadOnly, false))));

  const refRows = (CONFIG.refSpecs || []).map(a => makeRefRow(el, a, isReadOnly, false))
    .concat((CONFIG.refUnitSpecs || []).map(a => makeRow(el, a, isReadOnly, false)));
  attrPanelBody.appendChild(makeGroup(t('group.reference'), refRows));

  attrPanelBody.appendChild(makeGroup(t('group.render'), (CONFIG.renderSpecs || []).map(a => makeRow(el, a, isReadOnly, false))));
  attrPanelBody.appendChild(makeGroup(t('group.interact'), (CONFIG.interactSpecs || []).map(a => makeRow(el, a, isReadOnly, false))));

  if (tagName === 'text' || tagName === 'tspan') {
    attrPanelBody.appendChild(makeGroup(t('group.text'), (CONFIG.textBaseSpecs || []).map(a => makeRow(el, a, isReadOnly, false))));
    attrPanelBody.appendChild(makeGroup(t('group.textAdv'), (CONFIG.textAdvSpecs || []).map(a => makeRow(el, a, isReadOnly, false))));
  }

  const animChildren = [];
  Array.from(el.children || []).forEach((child, idx) => {
    if (ANIM_TAGS.has(child.localName.toLowerCase())) animChildren.push({ child, idx });
  });
  if (animChildren.length > 0) {
    const animGroup = document.createElement('div');
    animGroup.className = 'attr-group';
    const animTitle = document.createElement('div');
    animTitle.className = 'attr-group__title';
    animTitle.textContent = t('group.animation');
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
        const svgVisible = canvasEl.firstElementChild;
        const target = svgVisible ? resolvePath(svgVisible, newPath) : null;
        if (target) {
          selectedPath = newPath;
          _selectedElementTag = target.localName;
          _selectedElementId  = target.getAttribute('id') || null;
          applySelectionOutline(target);
          rebuildAttrPanel();
        }
      });
      row.appendChild(btn);
      if (!isReadOnly) {
        const rmBtn = document.createElement('button');
        rmBtn.type = 'button';
        rmBtn.className = 'attr-anim-remove';
        rmBtn.title = t('anim.removeAnim');
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
    attrPanelBody.appendChild(makeStructureGroup(el, isReadOnly));
  }
  attrPanel.dataset.readonly = isReadOnly ? '1' : '';
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
    addBtn.title = t('anim.addAnim');
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
    rmBtn.title = t('anim.removeAllAnims');
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

attrPanelCanvasBtn.addEventListener('click', () => {
  if (canvasRootMode) {
    if (canvasBackPath) {
      const path = canvasBackPath;
      canvasBackPath = null;
      canvasRootMode = false;
      selectedPath = path;
      const svgVisible = canvasEl.firstElementChild;
      const el = svgVisible ? resolvePath(svgVisible, path) : null;
      if (el) {
        _selectedElementTag = el.localName;
        _selectedElementId  = el.getAttribute('id') || null;
        applySelectionOutline(el);
      }
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
  }
});


/* ============================================================
   30. 图片插入
   ============================================================ */

/* 裁剪形状生成辅助 */
function polygonPoints(cx, cy, rx, ry, n) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
  }
  return pts;
}
function starPoints(cx, cy, rx, ry, n, ratio) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const k = i % 2 === 0 ? 1 : ratio;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push([cx + rx * k * Math.cos(a), cy + ry * k * Math.sin(a)]);
  }
  return pts;
}
function pointsToStr(pts) {
  return pts.map(p => `${Math.round(p[0] * 100) / 100},${Math.round(p[1] * 100) / 100}`).join(' ');
}

function buildShapeElement(shape, x, y, w, h, params) {
  const ns = 'http://www.w3.org/2000/svg';
  const p = params || {};
  const cx = x + w / 2;
  const cy = y + h / 2;
  const rx = w / 2;
  const ry = h / 2;

  if (shape === 'rect') {
    const el = document.createElementNS(ns, 'rect');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('width', w); el.setAttribute('height', h);
    return el;
  }
  if (shape === 'roundrect') {
    const r = Math.min(Math.max(0, p.rx != null ? p.rx : 12), Math.min(w, h) / 2);
    const el = document.createElementNS(ns, 'rect');
    el.setAttribute('x', x); el.setAttribute('y', y);
    el.setAttribute('width', w); el.setAttribute('height', h);
    el.setAttribute('rx', r); el.setAttribute('ry', r);
    return el;
  }
  if (shape === 'circle') {
    const r = Math.min(w, h) / 2;
    const el = document.createElementNS(ns, 'circle');
    el.setAttribute('cx', cx); el.setAttribute('cy', cy); el.setAttribute('r', r);
    return el;
  }
  if (shape === 'ellipse') {
    const el = document.createElementNS(ns, 'ellipse');
    el.setAttribute('cx', cx); el.setAttribute('cy', cy);
    el.setAttribute('rx', rx); el.setAttribute('ry', ry);
    return el;
  }
  if (shape === 'polygon') {
    const sides = Math.max(3, Math.min(20, p.sides || 6));
    const el = document.createElementNS(ns, 'polygon');
    el.setAttribute('points', pointsToStr(polygonPoints(cx, cy, rx, ry, sides)));
    el.setAttribute('data-sides', String(sides));
    return el;
  }
  if (shape === 'star') {
    const points = Math.max(3, Math.min(20, p.points || 5));
    const ratio = Math.max(0.1, Math.min(0.9, p.ratio || 0.45));
    const el = document.createElementNS(ns, 'polygon');
    el.setAttribute('points', pointsToStr(starPoints(cx, cy, rx, ry, points, ratio)));
    el.setAttribute('data-shape', 'star');
    el.setAttribute('data-points', String(points));
    el.setAttribute('data-ratio', String(ratio));
    return el;
  }
  return null;
}

async function loadImageForConfig(file) {
  if (!file) return;
  if (!/^image\/(png|jpeg)$/.test(file.type)) {
    showToast(t('toast.imageUnsupported')); return;
  }
  if (file.size > MAX_FILE_SIZE) {
    const size = (file.size / 1024 / 1024).toFixed(1);
    showToast(t('toast.imageTooLarge', { size, max: MAX_FILE_SIZE / 1024 / 1024 }));
    return;
  }
  let dataUrl;
  try {
    dataUrl = await new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = () => rej(new Error('read'));
      r.readAsDataURL(file);
    });
  } catch (err) {
    showToast(t('toast.imageReadFailed', { msg: err.message || '' })); return;
  }
  const img = new Image();
  try {
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => rej(new Error(t('toast.imageDecodeFailed')));
      img.src = dataUrl;
    });
  } catch (err) { showToast(err.message); return; }
  imageImportState.file = file;
  imageImportState.dataUrl = dataUrl;
  imageImportState.originalW = img.naturalWidth;
  imageImportState.originalH = img.naturalHeight;
  imageImportState.ratio = 'original';
  imageImportState.clipEnabled = true;
  imageImportState.fillMode = 'slice';
  imageImportState.insertMode = 'replace';
  imageImportState.compress = true;
  openImageConfigModal();
}

function computeImageBox() {
  const { originalW, originalH, ratio, customW, customH, insertMode } = imageImportState;
  let L = 0;
  let explicitW = 0, explicitH = 0;
  if (insertMode === 'replace') {
    L = Math.max(originalW, originalH);
    if (ratio === 'custom' && customW > 0 && customH > 0) {
      explicitW = customW; explicitH = customH;
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
      explicitW = customW; explicitH = customH;
    }
  }
  if (explicitW > 0 && explicitH > 0) {
    let x = 0, y = 0;
    if (insertMode === 'append' && currentSvg) {
      const vb = currentSvg.getAttribute('viewBox');
      if (vb) {
        const p = vb.trim().split(/[\s,]+/).map(Number);
        if (p.length === 4) { x = p[0]; y = p[1]; }
      }
    }
    return { x, y, width: Math.round(explicitW * 100) / 100, height: Math.round(explicitH * 100) / 100 };
  }
  let R;
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
  let width, height;
  if (R >= 1) { width = L; height = L / R; }
  else        { height = L; width = L * R; }
  let x = 0, y = 0;
  if (insertMode === 'append' && currentSvg) {
    const vb = currentSvg.getAttribute('viewBox');
    if (vb) {
      const p = vb.trim().split(/[\s,]+/).map(Number);
      if (p.length === 4) { x = p[0]; y = p[1]; }
    }
  }
  return { x, y, width: Math.round(width * 100) / 100, height: Math.round(height * 100) / 100 };
}

function renderImageConfigPreview() {
  if (!imageImportState.dataUrl) { imageConfigPreview.innerHTML = ''; return; }
  const box = computeImageBox();
  const w = box.width, h = box.height;
  const par = imageImportState.fillMode === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet';
  imageConfigPreview.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
      <image width="${w}" height="${h}" preserveAspectRatio="${par}" href="${imageImportState.dataUrl}"/>
    </svg>`;
}

function buildImageSvgFragment() {
  const box = computeImageBox();
  const { x, y, width, height } = box;
  const par = imageImportState.fillMode === 'slice' ? 'xMidYMid slice' : 'xMidYMid meet';

  if (!imageImportState.clipEnabled) {
    return {
      id: null, defs: '',
      image: `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${par}" href="${imageImportState.dataUrl}"/>`,
      box
    };
  }

  const id = 'clip-' + Math.random().toString(36).slice(2, 10);
  const shapeEl = `<rect x="${x}" y="${y}" width="${width}" height="${height}"/>`;
  return {
    id,
    defs:  `<clipPath id="${id}">${shapeEl}</clipPath>`,
    image: `<image x="${x}" y="${y}" width="${width}" height="${height}" preserveAspectRatio="${par}" clip-path="url(#${id})" href="${imageImportState.dataUrl}"/>`,
    box
  };
}

async function maybeCompressImage(box) {
  if (!imageImportState.compress) return imageImportState.dataUrl;
  const { originalW, originalH, dataUrl, fillMode } = imageImportState;
  const targetW = Math.max(1, Math.round(box.width  * 2));
  const targetH = Math.max(1, Math.round(box.height * 2));
  if (originalW <= targetW && originalH <= targetH) return dataUrl;
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('reload'));
    img.src = dataUrl;
  });
  let k;
  if (fillMode === 'meet') k = Math.min(targetW / originalW, targetH / originalH);
  else k = Math.max(targetW / originalW, targetH / originalH);
  k = Math.min(k, 1);
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

function syncRadioGroupVisual(radios) {
  radios.forEach(r => {
    const lab = r.closest('label');
    if (lab) lab.classList.toggle('is-checked', r.checked);
  });
}

let _releaseImageTrap = null;
function openImageConfigModal() {
  imageConfigRatio.value = imageImportState.ratio;
  imageConfigCustomW.value = imageImportState.customW;
  imageConfigCustomH.value = imageImportState.customH;
  imageConfigClip.checked = imageImportState.clipEnabled;
  imageConfigCompress.checked = imageImportState.compress;
  imageConfigFillRadios.forEach(r => { r.checked = r.value === imageImportState.fillMode; });
  syncRadioGroupVisual(imageConfigFillRadios);
  imageConfigInsertRadios.forEach(r => { r.checked = r.value === imageImportState.insertMode; });
  syncRadioGroupVisual(imageConfigInsertRadios);
  syncImageConfigUI();
  renderImageConfigPreview();
  imageConfigMask.hidden = false;
  _releaseImageTrap = trapFocusIn(imageConfigMask);
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
  imageConfigConfirm.textContent = t('imageConfig.insert');
  if (_releaseImageTrap) { _releaseImageTrap(); _releaseImageTrap = null; }
}
function syncImageConfigUI() {
  const isCustom = imageImportState.ratio === 'custom';
  imageConfigCustomW.disabled = !isCustom;
  imageConfigCustomH.disabled = !isCustom;
}

async function confirmImageInsert() {
  if (!imageImportState.dataUrl || imageImportState.busy) return;
  imageImportState.busy = true;
  imageConfigConfirm.disabled = true;
  imageConfigConfirm.textContent = t('imageConfig.processing');
  try {
    const fragment = buildImageSvgFragment();
    const compressedUrl = await maybeCompressImage(fragment.box);
    if (compressedUrl && compressedUrl !== imageImportState.dataUrl) {
      fragment.image = fragment.image.replace(/href="[^"]*"/, `href="${compressedUrl}"`);
    }
    let finalCode;
    if (imageImportState.insertMode === 'replace') {
      const defsPart = fragment.defs ? `<defs>${fragment.defs}</defs>\n` : '';
      finalCode = formatXML(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${fragment.box.width} ${fragment.box.height}" width="${fragment.box.width}" height="${fragment.box.height}">\n${defsPart}${fragment.image}\n</svg>`
      );
    } else {
      if (!currentSvg) throw new Error('no-svg');
      finalCode = appendImageToSource(fragment.defs, fragment.image);
    }
    codeEl.value = finalCode;
    selectedPath = null;
    invalidateLineOffsets();
    renderEditor();
    renderPreview();
    saveDraftDebounced();
    recordSnapshot(true);
    closeImageConfigModal();
    showToast(t('toast.imageInserted'));
  } catch (err) {
    console.error(err);
    showToast(t('toast.imageInsertFailed', { msg: err.message || '' }));
    imageImportState.busy = false;
    imageConfigConfirm.disabled = false;
    imageConfigConfirm.textContent = t('imageConfig.insert');
  }
}

function appendImageToSource(defsStr, imageStr) {
  const SVG_NS_L = 'http://www.w3.org/2000/svg';
  const clone = currentSvg.cloneNode(true);

  if (defsStr) {
    let defs = null;
    for (let i = 0; i < clone.children.length; i++) {
      if (clone.children[i].localName === 'defs') { defs = clone.children[i]; break; }
    }
    if (!defs) {
      defs = document.createElementNS(SVG_NS_L, 'defs');
      clone.insertBefore(defs, clone.firstChild);
    }
    const tmp = new DOMParser().parseFromString(
      `<svg xmlns="${SVG_NS_L}"><defs>${defsStr}</defs></svg>`, 'image/svg+xml'
    );
    const tmpDefs = tmp.documentElement.querySelector('defs');
    if (tmpDefs) {
      Array.from(tmpDefs.childNodes).forEach(child => {
        defs.appendChild(document.importNode(child, true));
      });
    }
  }

  const tmpImgDoc = new DOMParser().parseFromString(
    `<svg xmlns="${SVG_NS_L}">${imageStr}</svg>`, 'image/svg+xml'
  );
  const tmpImage = tmpImgDoc.documentElement.querySelector('image');
  if (tmpImage) clone.appendChild(document.importNode(tmpImage, true));

  return formatXML(serializeSVG(clone));
}

/* ---- 图片裁剪形状切换 ---- */
function readImageClipShape(imageEl) {
  if (!imageEl || imageEl.localName !== 'image') return null;
  const clipAttr = imageEl.getAttribute('clip-path') || '';
  const m = clipAttr.match(/url\(#(clip-[^)]+)\)/);
  if (!m) return { shape: 'none', params: {} };
  const clipId = m[1];
  if (!currentSvg) return { shape: 'rect', params: {} };

  const clipPathEl = currentSvg.querySelector(`clipPath[id="${clipId}"]`);
  if (!clipPathEl) return { shape: 'rect', params: {} };
  const shapeEl = clipPathEl.firstElementChild;
  if (!shapeEl) return { shape: 'rect', params: {} };

  const tag = shapeEl.localName;
  if (tag === 'rect') {
    const rx = parseFloat(shapeEl.getAttribute('rx')) || 0;
    const ry = parseFloat(shapeEl.getAttribute('ry')) || 0;
    if (rx > 0 || ry > 0) return { shape: 'roundrect', params: { rx: Math.max(rx, ry) } };
    return { shape: 'rect', params: {} };
  }
  if (tag === 'circle')  return { shape: 'circle', params: {} };
  if (tag === 'ellipse') return { shape: 'ellipse', params: {} };
  if (tag === 'polygon') {
    if (shapeEl.getAttribute('data-shape') === 'star') {
      const points = parseInt(shapeEl.getAttribute('data-points'), 10) || 5;
      const ratio  = parseFloat(shapeEl.getAttribute('data-ratio')) || 0.45;
      return { shape: 'star', params: { points, ratio } };
    }
    const sides = parseInt(shapeEl.getAttribute('data-sides'), 10) || 6;
    return { shape: 'polygon', params: { sides } };
  }
  return { shape: 'rect', params: {} };
}

function updateImageClipShape(newShape, params) {
  if (!selectedPath || !currentSvg) return;

  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('toast.parseFailed', { msg: err.message || '' })); return; }

  const imageEl = resolvePath(svgRoot, selectedPath);
  if (!imageEl || imageEl.localName !== 'image') return;

  const clipAttr = imageEl.getAttribute('clip-path') || '';
  const m = clipAttr.match(/url\(#(clip-[^)]+)\)/);
  const existingClipId = m ? m[1] : null;
  const needRebuildPanel = (newShape !== (readImageClipShape(imageEl).shape || 'none'));

  if (newShape === 'none') {
    imageEl.removeAttribute('clip-path');
    writeBackSvg(svgRoot, true);
    showToast(t('clipShape.clipRemoved'));
    return;
  }

  const x = parseFloat(imageEl.getAttribute('x')) || 0;
  const y = parseFloat(imageEl.getAttribute('y')) || 0;
  const w = parseFloat(imageEl.getAttribute('width')) || 0;
  const h = parseFloat(imageEl.getAttribute('height')) || 0;
  if (w <= 0 || h <= 0) { showToast(t('clipShape.sizeError')); return; }

  const newShapeEl = buildShapeElement(newShape, x, y, w, h, params || {});
  if (!newShapeEl) return;

  let clipPathEl = null;
  if (existingClipId) {
    clipPathEl = svgRoot.querySelector(`clipPath[id="${existingClipId}"]`);
  }

  if (!clipPathEl) {
    const newId = 'clip-' + Math.random().toString(36).slice(2, 10);
    imageEl.setAttribute('clip-path', `url(#${newId})`);
    let defs = null;
    for (let i = 0; i < svgRoot.children.length; i++) {
      if (svgRoot.children[i].localName === 'defs') { defs = svgRoot.children[i]; break; }
    }
    if (!defs) {
      defs = document.createElementNS(SVG_NS, 'defs');
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }
    clipPathEl = document.createElementNS(SVG_NS, 'clipPath');
    clipPathEl.setAttribute('id', newId);
    defs.appendChild(clipPathEl);
  }

  while (clipPathEl.firstChild) clipPathEl.removeChild(clipPathEl.firstChild);
  clipPathEl.appendChild(newShapeEl);

  writeBackSvg(svgRoot, needRebuildPanel);
}

function writeBackSvg(svgRoot, rebuildNow) {
  codeEl.value = serializeSVG(svgRoot);
  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot();
  suppressAttrRebuild = true;
  setTimeout(() => {
    suppressAttrRebuild = false;
    if (rebuildNow && attrPanelOpen && !canvasRootMode && selectedPath) {
      rebuildAttrPanel();
    }
  }, rebuildNow ? 80 : 500);
}

function makeImageClipShapeGroup(el, isReadOnly) {
  const g = document.createElement('div');
  g.className = 'attr-group';
  const tEl = document.createElement('div');
  tEl.className = 'attr-group__title';
  tEl.textContent = t('clipShape.groupTitle');
  const items = document.createElement('div');
  items.className = 'attr-group__items';
  items.style.gridTemplateColumns = '1fr';

  const current = readImageClipShape(el) || { shape: 'rect', params: {} };
  const curShape = current.shape;

  const shapeRow = document.createElement('div');
  shapeRow.className = 'attr-row attr-row--full';
  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = t('clipShape.shape');
  const _id = nextRowUid();
  label.htmlFor = _id;
  shapeRow.appendChild(label);
  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';
  const select = document.createElement('select');
  select.className = 'attr-row__select';
  select.id = _id;
  ['none', 'rect', 'roundrect', 'circle', 'ellipse', 'polygon', 'star'].forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = t('clipShape.' + v);
    select.appendChild(opt);
  });
  select.value = curShape;
  if (isReadOnly) select.disabled = true;
  select.addEventListener('change', () => {
    const ns = select.value;
    let params = {};
    if (ns === 'roundrect') params = { rx: 12 };
    else if (ns === 'polygon') params = { sides: 6 };
    else if (ns === 'star')    params = { points: 5, ratio: 0.45 };
    updateImageClipShape(ns, params);
  });
  ctrl.appendChild(select);
  shapeRow.appendChild(ctrl);
  items.appendChild(shapeRow);

  if (curShape === 'roundrect') {
    items.appendChild(makeClipShapeParamRow(t('clipShape.roundRadius'), current.params.rx, isReadOnly, (v) => {
      updateImageClipShape('roundrect', { rx: Math.max(0, v) });
    }));
  } else if (curShape === 'polygon') {
    items.appendChild(makeClipShapeParamRow(t('clipShape.sides'), current.params.sides, isReadOnly, (v) => {
      updateImageClipShape('polygon', { sides: Math.max(3, Math.min(20, v)) });
    }));
  } else if (curShape === 'star') {
    items.appendChild(makeClipShapeParamRow(t('clipShape.points'), current.params.points, isReadOnly, (v) => {
      updateImageClipShape('star', { points: Math.max(3, Math.min(20, v)), ratio: current.params.ratio });
    }));
    items.appendChild(makeClipShapeParamRow(t('clipShape.innerRatio'), current.params.ratio, isReadOnly, (v) => {
      updateImageClipShape('star', { points: current.params.points, ratio: Math.max(0.1, Math.min(0.9, v)) });
    }, 0.05));
  }

  g.appendChild(tEl);
  g.appendChild(items);
  return g;
}

function makeClipShapeParamRow(labelText, value, isReadOnly, onChange, step) {
  const row = document.createElement('div');
  row.className = 'attr-row attr-row--full';
  const label = document.createElement('label');
  label.className = 'attr-row__label';
  label.textContent = labelText;
  const _id = nextRowUid();
  label.htmlFor = _id;
  row.appendChild(label);

  const ctrl = document.createElement('div');
  ctrl.className = 'attr-row__control';
  const input = document.createElement('input');
  input.type = 'number';
  input.className = 'attr-row__input';
  input.id = _id;
  input.value = String(value);
  input.step = String(step != null ? step : 1);
  if (isReadOnly) input.disabled = true;

  let timer = 0;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const v = parseFloat(input.value);
      if (!isFinite(v)) return;
      onChange(v);
    }, 300);
  });

  ctrl.appendChild(input);
  row.appendChild(ctrl);
  return row;
}

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
imageConfigClip.addEventListener('change', () => {
  imageImportState.clipEnabled = imageConfigClip.checked;
});
imageConfigCompress.addEventListener('change', () => {
  imageImportState.compress = imageConfigCompress.checked;
});
imageConfigFillRadios.forEach(r => r.addEventListener('change', () => {
  if (!r.checked) return;
  imageImportState.fillMode = r.value;
  renderImageConfigPreview();
  syncRadioGroupVisual(imageConfigFillRadios);
}));
imageConfigInsertRadios.forEach(r => r.addEventListener('change', () => {
  if (!r.checked) return;
  imageImportState.insertMode = r.value;
  renderImageConfigPreview();
  syncRadioGroupVisual(imageConfigInsertRadios);
}));
imageConfigCancel.addEventListener('click', closeImageConfigModal);
imageConfigConfirm.addEventListener('click', confirmImageInsert);
imageConfigMask.addEventListener('click', e => {
  if (e.target === imageConfigMask) closeImageConfigModal();
});

/* ============================================================
   31. 移动端视图
   ============================================================ */
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
  scheduleRefreshSelectionOverlay();
}

/* ============================================================
   32. 焦点陷阱（模态可访问性）
   ============================================================ */
function trapFocusIn(container) {
  const prev = document.activeElement;
  const getFocusable = () => Array.from(
    container.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => el.offsetParent !== null);

  const onKey = (e) => {
    if (e.key !== 'Tab') return;
    const list = getFocusable();
    if (!list.length) { e.preventDefault(); return; }
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
  container.addEventListener('keydown', onKey);

  const list = getFocusable();
  if (list.length) list[0].focus();

  return () => {
    container.removeEventListener('keydown', onKey);
    if (prev && prev.focus) { try { prev.focus(); } catch (_) {} }
  };
}

/* ============================================================
   33. 启动初始化
   ============================================================ */
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

  // 1. 加载外部资源
(function setupPreventPageZoom() {
  const isPreviewTarget = (target) =>
    !!(target && target.closest && target.closest('#previewWrap'));
  const preventGesture = (e) => {
    if (isPreviewTarget(e.target)) return;
    e.preventDefault();
  };
  document.addEventListener('gesturestart',  preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend',    preventGesture, { passive: false });
})();
(async function bootstrap() {
  // 1. 加载外部资源
  await loadContentAndConfig();

  // 2. 应用 i18n 与主题
  applyI18n();
  applyTheme(loadSavedTheme());
  setupThemeWatcher();

  // 3. 初始化编辑器内容
  const draft = loadDraft();
  codeEl.value = draft || getExampleCode();
  setPreviewBg('checker');
  recordSnapshot(true);
  renderEditor();
  renderPreview();
  applySplit();
  updateUndoRedoMenu();

  // 4. 资源加载失败提示
  if (!contentLoaded) {
    showToast('资源加载失败，部分功能受限（请确认 content.json / config.json 可访问）');
  }
})();

/* ============================================================
   34. 属性复制 / 粘贴
   ============================================================ */
let attrClipboard = null;

function isExcludedAttrForPaste(name) {
  const n = name.toLowerCase();
  if (n === 'id' || n === 'class') return true;
  if (n.startsWith('data-')) return true;
  if (n.startsWith('aria-')) return true;
  if (n === 'role') return true;
  if (n.startsWith('xmlns')) return true;
  if (n.startsWith('xml:')) return true;
  if (n.startsWith('xlink:')) return true;
  return false;
}

function copyElementAttrs(el) {
  if (!el) return;
  const attrs = {};
  Array.from(el.attributes).forEach(a => {
    if (isExcludedAttrForPaste(a.name)) return;
    attrs[a.name] = a.value;
  });
  const keys = Object.keys(attrs);
  if (keys.length === 0) {
    showToast(t('toast.noAttrsToCopy'));
    return;
  }
  attrClipboard = attrs;
  updatePasteButtonState();
  showToast(t('toast.copied', { count: keys.length }));
}

function pasteElementAttrs(el) {
  if (!attrClipboard || !selectedPath) return;
  const loc = findTagOffsetByPath(codeEl.value, selectedPath);
  if (!loc) { showToast(t('toast.noSourceLocate')); return; }

  const original = codeEl.value.slice(loc.start, loc.end);
  let patched = original;
  let applied = 0;

  Object.entries(attrClipboard).forEach(([name, value]) => {
    const before = patched;
    patched = patchAttrInTag(patched, name, value);
    if (patched !== before) applied++;
  });

  if (patched === original) {
    showToast(t('toast.attrsNoChange'));
    return;
  }

  codeEl.value = codeEl.value.slice(0, loc.start) + patched + codeEl.value.slice(loc.end);
  invalidateLineOffsets();
  renderEditor();
  schedulePreviewRender();
  saveDraftDebounced();
  recordSnapshot();

  suppressAttrRebuild = true;
  setTimeout(() => {
    suppressAttrRebuild = false;
    if (attrPanelOpen && !canvasRootMode) rebuildAttrPanel();
  }, 120);

  showToast(t('toast.pasted', { count: applied }));
}

function updatePasteButtonState() {
  document.querySelectorAll('.attr-action-btn--paste').forEach(btn => {
    btn.disabled = !attrClipboard;
  });
}

/* ============================================================
   35. 颜色下拉 popover
   ============================================================ */
let colorPopoverEl = null;
let colorPopoverOutsideClick = null;
let popoverContext = { targetPath: null, targetAttr: null };

function setPopoverContext(path, attr) {
  popoverContext = { targetPath: path ? [...path] : null, targetAttr: attr || null };
}

function getRecentColors() {
  try {
    const s = localStorage.getItem(RECENT_COLORS_KEY);
    const arr = s ? JSON.parse(s) : [];
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}

function pushRecentColor(color) {
  if (!color) return;
  const norm = String(color).trim().toLowerCase();
  if (!/^#[0-9a-f]{3}$/.test(norm) && !/^#[0-9a-f]{6}$/.test(norm)) return;
  const list = getRecentColors().filter(c => c !== norm);
  list.unshift(norm);
  const trimmed = list.slice(0, RECENT_COLORS_MAX);
  try { localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(trimmed)); } catch (_) {}
}

function collectPaintRefs() {
  if (!currentSvg) return [];
  const result = [];
  currentSvg.querySelectorAll('linearGradient, radialGradient, pattern').forEach(g => {
    const id = g.getAttribute('id');
    if (id) result.push({ id, tag: g.localName });
  });
  return result;
}

function openColorPopover(anchorEl, currentValue, onSelect) {
  closeColorPopover();

  const pop = document.createElement('div');
  pop.className = 'color-popover';

  /* 预设 */
  const presetColors = (CONFIG && CONFIG.presetColors) || [];
  if (presetColors.length > 0) {
    const presetsSec = document.createElement('div');
    presetsSec.className = 'color-popover__section';
    const presetsLabel = document.createElement('div');
    presetsLabel.className = 'color-popover__label';
    presetsLabel.textContent = t('color.preset');
    const presetsGrid = document.createElement('div');
    presetsGrid.className = 'color-popover__grid';
    presetColors.forEach(c => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'color-popover__swatch';
      sw.dataset.value = c;
      sw.style.background = c;
      sw.addEventListener('click', () => {
        onSelect(c);
        pushRecentColor(c);
        closeColorPopover();
      });
      presetsGrid.appendChild(sw);
    });
    presetsSec.appendChild(presetsLabel);
    presetsSec.appendChild(presetsGrid);
    pop.appendChild(presetsSec);
  }

  /* 最近 */
  const recent = getRecentColors();
  if (recent.length > 0) {
    const recentSec = document.createElement('div');
    recentSec.className = 'color-popover__section';
    const recentLabel = document.createElement('div');
    recentLabel.className = 'color-popover__label';
    recentLabel.textContent = t('color.recent');
    const recentGrid = document.createElement('div');
    recentGrid.className = 'color-popover__grid';
    recent.forEach(c => {
      const sw = document.createElement('button');
      sw.type = 'button';
      sw.className = 'color-popover__swatch';
      sw.dataset.value = c;
      sw.style.background = c;
      sw.addEventListener('click', () => {
        onSelect(c);
        pushRecentColor(c);
        closeColorPopover();
      });
      recentGrid.appendChild(sw);
    });
    recentSec.appendChild(recentLabel);
    recentSec.appendChild(recentGrid);
    pop.appendChild(recentSec);
  }

  /* 引用 */
  const refs = collectPaintRefs();
  if (refs.length > 0) {
    const refSec = document.createElement('div');
    refSec.className = 'color-popover__section';
    const refLabel = document.createElement('div');
    refLabel.className = 'color-popover__label';
    refLabel.textContent = t('color.reference');
    const refList = document.createElement('div');
    refList.className = 'color-popover__refs';
    refs.forEach(r => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-popover__ref';
      btn.textContent = `url(#${r.id})`;
      btn.addEventListener('click', () => {
        onSelect(`url(#${r.id})`);
        closeColorPopover();
      });
      refList.appendChild(btn);
    });
    refSec.appendChild(refLabel);
    refSec.appendChild(refList);
    pop.appendChild(refSec);
  }

  /* 关键词 */
  const kwSec = document.createElement('div');
  kwSec.className = 'color-popover__section';
  ['none', 'currentColor'].forEach(v => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-popover__action';
    btn.textContent = v;
    btn.addEventListener('click', () => {
      onSelect(v);
      closeColorPopover();
    });
    kwSec.appendChild(btn);
  });
  pop.appendChild(kwSec);

  /* 新建渐变 */
  const gradSec = document.createElement('div');
  gradSec.className = 'color-popover__section';
  [
    { key: 'color.newLinear', type: 'linear' },
    { key: 'color.newRadial', type: 'radial' }
  ].forEach(g => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'color-popover__action';
    btn.textContent = t(g.key);
    btn.addEventListener('click', () => {
      closeColorPopover();
      openGradientEditor({
        mode: 'create',
        type: g.type,
        targetPath: popoverContext.targetPath,
        targetAttr: popoverContext.targetAttr
      });
    });
    gradSec.appendChild(btn);
  });
  pop.appendChild(gradSec);

  document.body.appendChild(pop);

  /* 定位 */
  const rect = anchorEl.getBoundingClientRect();
  const popRect = pop.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = rect.left;
  if (left + popRect.width > vw - 8) left = vw - popRect.width - 8;
  if (left < 8) left = 8;
  let top = rect.bottom + 4;
  if (top + popRect.height > vh - 8) {
    top = rect.top - popRect.height - 4;
    if (top < 8) top = 8;
  }
  pop.style.left = left + 'px';
  pop.style.top = top + 'px';

  colorPopoverEl = pop;

  colorPopoverOutsideClick = (e) => {
    if (!pop.contains(e.target) && e.target !== anchorEl && !anchorEl.contains(e.target)) {
      closeColorPopover();
    }
  };
  setTimeout(() => {
    document.addEventListener('mousedown', colorPopoverOutsideClick, true);
  }, 0);
}

function closeColorPopover() {
  if (colorPopoverEl && colorPopoverEl.parentNode) {
    colorPopoverEl.parentNode.removeChild(colorPopoverEl);
  }
  colorPopoverEl = null;
  if (colorPopoverOutsideClick) {
    document.removeEventListener('mousedown', colorPopoverOutsideClick, true);
    colorPopoverOutsideClick = null;
  }
}

/* ============================================================
   36. 渐变编辑器
   ============================================================ */
const SVG_NS = 'http://www.w3.org/2000/svg';
let gradientEditorMask = null;

function findGradientInSvg(svgRoot, id) {
  if (!svgRoot || !id) return null;
  const all = svgRoot.querySelectorAll('[id]');
  for (const node of all) {
    if (node.getAttribute('id') === id) return node;
  }
  return null;
}

function parseGradientStops(gEl) {
  const stops = [];
  Array.from(gEl.children).forEach(child => {
    if (child.localName !== 'stop') return;
    const offsetRaw = child.getAttribute('offset') || '0';
    let offset = offsetRaw.endsWith('%') ? parseFloat(offsetRaw) / 100 : parseFloat(offsetRaw);
    if (!isFinite(offset)) offset = 0;
    stops.push({
      offset,
      color: child.getAttribute('stop-color') || '#000000',
      opacity: child.hasAttribute('stop-opacity') ? parseFloat(child.getAttribute('stop-opacity')) : 1
    });
  });
  return stops;
}

function openGradientEditor(opts) {
  const mode = opts.mode || 'create';
  let type = opts.type || 'linear';
  let existingId = opts.existingId || '';
  let stops = [
    { offset: 0, color: '#000000', opacity: 1 },
    { offset: 1, color: '#ffffff', opacity: 1 }
  ];
  let attrs = {
    x1: '0%', y1: '0%', x2: '100%', y2: '0%',
    cx: '50%', cy: '50%', r: '50%',
    fx: '50%', fy: '50%',
    gradientUnits: 'objectBoundingBox',
    spreadMethod: 'pad',
    gradientTransform: ''
  };

  if (mode === 'edit' && existingId && currentSvg) {
    const gEl = findGradientInSvg(currentSvg, existingId);
    if (gEl) {
      type = gEl.localName === 'radialGradient' ? 'radial' : 'linear';
      const parsedStops = parseGradientStops(gEl);
      if (parsedStops.length > 0) stops = parsedStops;
      ['x1','y1','x2','y2','cx','cy','r','fx','fy','gradientUnits','spreadMethod','gradientTransform']
        .forEach(k => {
          const v = gEl.getAttribute(k);
          if (v != null) attrs[k] = v;
        });
    }
  }

  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `
    <div class="modal gradient-editor" role="dialog" aria-modal="true" aria-labelledby="gradientEditorTitle">
      <h3 id="gradientEditorTitle" class="modal__title">${mode === 'edit' ? t('gradientEditor.titleEdit') : t('gradientEditor.titleCreate')}</h3>
      <p class="modal__subtitle">${mode === 'edit' ? t('gradientEditor.subtitleEdit') : t('gradientEditor.subtitleCreate')}</p>

      <div class="gradient-editor__row">
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
          <input type="radio" name="gradType" value="linear" ${type === 'linear' ? 'checked' : ''}/> ${t('field.gradientLinear')}
        </label>
        <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;">
          <input type="radio" name="gradType" value="radial" ${type === 'radial' ? 'checked' : ''}/> ${t('field.gradientRadial')}
        </label>
      </div>

      <div class="gradient-editor__preview"></div>

      <div class="modal__label" style="margin-bottom:4px;">${t('group.gradientStops')}</div>
      <div class="gradient-editor__stops"></div>
      <button type="button" class="gradient-editor__add-stop">${t('btn.addStop')}</button>

      <div class="gradient-editor__coords"></div>

      <div class="modal__field" style="margin-top:10px;">
        <label class="modal__label">${t('field.gradientUnits')}</label>
        <select class="modal__select" data-attr="gradientUnits">
          <option value="objectBoundingBox">objectBoundingBox</option>
          <option value="userSpaceOnUse">userSpaceOnUse</option>
        </select>
      </div>
      <div class="modal__field">
        <label class="modal__label">${t('field.spreadMethod')}</label>
        <select class="modal__select" data-attr="spreadMethod">
          <option value="pad">pad</option>
          <option value="reflect">reflect</option>
          <option value="repeat">repeat</option>
        </select>
      </div>
      <div class="modal__field">
        <label class="modal__label">${t('field.gradientTransform')}</label>
        <input class="modal__input" type="text" data-attr="gradientTransform" placeholder="${t('gradientEditor.previewPlaceholder')}" />
      </div>

      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button class="btn btn--primary" type="button" data-action="apply">${t('btn.apply')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(mask);

  const modal = mask.querySelector('.modal');
  const stopsEl = modal.querySelector('.gradient-editor__stops');
  const previewEl = modal.querySelector('.gradient-editor__preview');
  const coordsEl = modal.querySelector('.gradient-editor__coords');
  const gradTypeRadios = modal.querySelectorAll('input[name="gradType"]');
  const attrInputs = modal.querySelectorAll('[data-attr]');

  attrInputs.forEach(inp => {
    const k = inp.dataset.attr;
    if (attrs[k] != null) inp.value = attrs[k];
  });

  function renderPreview() {
    const sorted = [...stops].sort((a, b) => a.offset - b.offset);
    const stopsMarkup = sorted.map(s => {
      const op = s.opacity < 1 ? ` stop-opacity="${s.opacity}"` : '';
      return `<stop offset="${s.offset}" stop-color="${escapeAttr(s.color)}"${op}/>`;
    }).join('');
    let defs;
    if (type === 'linear') {
      defs = `<linearGradient id="prev-grad" x1="${escapeAttr(attrs.x1)}" y1="${escapeAttr(attrs.y1)}" x2="${escapeAttr(attrs.x2)}" y2="${escapeAttr(attrs.y2)}">${stopsMarkup}</linearGradient>`;
    } else {
      defs = `<radialGradient id="prev-grad" cx="${escapeAttr(attrs.cx)}" cy="${escapeAttr(attrs.cy)}" r="${escapeAttr(attrs.r)}" fx="${escapeAttr(attrs.fx)}" fy="${escapeAttr(attrs.fy)}">${stopsMarkup}</radialGradient>`;
    }
    previewEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 20" preserveAspectRatio="none"><defs>${defs}</defs><rect width="100" height="20" fill="url(#prev-grad)"/></svg>`;
  }

  function renderCoords() {
    if (type === 'linear') {
      coordsEl.innerHTML = `
        <div class="gradient-editor__row">
          <div class="modal__field">
            <label class="modal__label">${t('field.startX')}</label>
            <input class="modal__input" type="text" data-coord="x1" value="${escapeAttr(attrs.x1)}"/>
          </div>
          <div class="modal__field">
            <label class="modal__label">${t('field.startY')}</label>
            <input class="modal__input" type="text" data-coord="y1" value="${escapeAttr(attrs.y1)}"/>
          </div>
        </div>
        <div class="gradient-editor__row">
          <div class="modal__field">
            <label class="modal__label">${t('field.endX')}</label>
            <input class="modal__input" type="text" data-coord="x2" value="${escapeAttr(attrs.x2)}"/>
          </div>
          <div class="modal__field">
            <label class="modal__label">${t('field.endY')}</label>
            <input class="modal__input" type="text" data-coord="y2" value="${escapeAttr(attrs.y2)}"/>
          </div>
        </div>
      `;
    } else {
      coordsEl.innerHTML = `
        <div class="gradient-editor__row">
          <div class="modal__field">
            <label class="modal__label">${t('field.centerX')}</label>
            <input class="modal__input" type="text" data-coord="cx" value="${escapeAttr(attrs.cx)}"/>
          </div>
          <div class="modal__field">
            <label class="modal__label">${t('field.centerY')}</label>
            <input class="modal__input" type="text" data-coord="cy" value="${escapeAttr(attrs.cy)}"/>
          </div>
        </div>
        <div class="gradient-editor__row">
          <div class="modal__field">
            <label class="modal__label">${t('field.radius')}</label>
            <input class="modal__input" type="text" data-coord="r" value="${escapeAttr(attrs.r)}"/>
          </div>
          <div class="modal__field">
            <label class="modal__label">${t('field.focusX')}</label>
            <input class="modal__input" type="text" data-coord="fx" value="${escapeAttr(attrs.fx)}"/>
          </div>
          <div class="modal__field">
            <label class="modal__label">${t('field.focusY')}</label>
            <input class="modal__input" type="text" data-coord="fy" value="${escapeAttr(attrs.fy)}"/>
          </div>
        </div>
      `;
    }
    coordsEl.querySelectorAll('[data-coord]').forEach(inp => {
      inp.addEventListener('input', () => {
        attrs[inp.dataset.coord] = inp.value;
        renderPreview();
      });
    });
  }

  function renderStops() {
    stopsEl.innerHTML = '';
    stops.forEach((stop, i) => {
      const row = document.createElement('div');
      row.className = 'gradient-editor__stop';

      const offInput = document.createElement('input');
      offInput.type = 'number';
      offInput.min = '0'; offInput.max = '1'; offInput.step = '0.01';
      offInput.value = String(stop.offset);
      offInput.title = t('field.offset');
      offInput.addEventListener('input', () => {
        const v = parseFloat(offInput.value);
        stops[i].offset = isFinite(v) ? Math.max(0, Math.min(1, v)) : 0;
        renderPreview();
      });

      const colInput = document.createElement('input');
      colInput.type = 'color';
      colInput.value = /^#[0-9a-f]{6}$/i.test(stop.color) ? stop.color : '#000000';
      colInput.addEventListener('input', () => {
        stops[i].color = colInput.value;
        renderPreview();
      });

      const opInput = document.createElement('input');
      opInput.type = 'number';
      opInput.min = '0'; opInput.max = '1'; opInput.step = '0.1';
      opInput.value = String(stop.opacity);
      opInput.style.width = '52px';
      opInput.title = t('field.stopOpacity');
      opInput.addEventListener('input', () => {
        const v = parseFloat(opInput.value);
        stops[i].opacity = isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
        renderPreview();
      });

      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'gradient-editor__stop-remove';
      rmBtn.textContent = '−';
      rmBtn.title = t('field.removeStop');
      rmBtn.disabled = stops.length <= 2;
      rmBtn.addEventListener('click', () => {
        if (stops.length <= 2) return;
        stops.splice(i, 1);
        renderStops();
        renderPreview();
      });

      row.appendChild(offInput);
      row.appendChild(colInput);
      row.appendChild(opInput);
      row.appendChild(rmBtn);
      stopsEl.appendChild(row);
    });
  }

  function renderAll() { renderStops(); renderCoords(); renderPreview(); }
  renderAll();

  gradTypeRadios.forEach(r => {
    r.addEventListener('change', () => {
      if (!r.checked) return;
      type = r.value;
      renderCoords();
      renderPreview();
    });
  });

  attrInputs.forEach(inp => {
    const handler = () => {
      attrs[inp.dataset.attr] = inp.value;
      renderPreview();
    };
    inp.addEventListener('input', handler);
    inp.addEventListener('change', handler);
  });

  modal.querySelector('.gradient-editor__add-stop').addEventListener('click', () => {
    const last = stops[stops.length - 1];
    const prev = stops.length >= 2 ? stops[stops.length - 2] : { offset: 0 };
    const newOffset = Math.min(1, Math.max(0, (last.offset + prev.offset) / 2 + 0.1));
    stops.push({ offset: newOffset, color: last.color, opacity: last.opacity });
    renderStops();
    renderPreview();
  });

  function close() {
    if (mask.parentNode) mask.parentNode.removeChild(mask);
    gradientEditorMask = null;
  }

  modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
  mask.addEventListener('click', (e) => { if (e.target === mask) close(); });

  modal.querySelector('[data-action="apply"]').addEventListener('click', () => {
    applyGradient({
      mode, type,
      existingId: opts.existingId,
      stops, attrs,
      targetPath: opts.targetPath,
      targetAttr: opts.targetAttr
    });
    close();
  });

  gradientEditorMask = mask;
}

function applyGradient(opts) {
  const { mode, type, existingId, stops, attrs, targetPath, targetAttr } = opts;

  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('gradientEditor.parseFailed', { msg: err.message || '' })); return; }

  let targetId = existingId;
  if (mode === 'create') {
    targetId = 'grad-' + Math.random().toString(36).slice(2, 8);
    if (targetPath && targetAttr) {
      const targetEl = resolvePath(svgRoot, targetPath);
      if (targetEl) targetEl.setAttribute(targetAttr, `url(#${targetId})`);
    }
  }

  let gradientEl = mode === 'edit' ? findGradientInSvg(svgRoot, targetId) : null;
  if (!gradientEl) {
    gradientEl = document.createElementNS(SVG_NS, type === 'linear' ? 'linearGradient' : 'radialGradient');
    gradientEl.setAttribute('id', targetId);
    let defs = null;
    for (let i = 0; i < svgRoot.children.length; i++) {
      if (svgRoot.children[i].localName === 'defs') { defs = svgRoot.children[i]; break; }
    }
    if (!defs) {
      defs = document.createElementNS(SVG_NS, 'defs');
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }
    defs.appendChild(gradientEl);
  }

  Array.from(gradientEl.attributes).forEach(a => gradientEl.removeAttribute(a.name));
  while (gradientEl.firstChild) gradientEl.removeChild(gradientEl.firstChild);

  gradientEl.setAttribute('id', targetId);
  if (type === 'linear') {
    gradientEl.setAttribute('x1', attrs.x1);
    gradientEl.setAttribute('y1', attrs.y1);
    gradientEl.setAttribute('x2', attrs.x2);
    gradientEl.setAttribute('y2', attrs.y2);
  } else {
    gradientEl.setAttribute('cx', attrs.cx);
    gradientEl.setAttribute('cy', attrs.cy);
    gradientEl.setAttribute('r', attrs.r);
    gradientEl.setAttribute('fx', attrs.fx);
    gradientEl.setAttribute('fy', attrs.fy);
  }
  if (attrs.gradientUnits) gradientEl.setAttribute('gradientUnits', attrs.gradientUnits);
  if (attrs.spreadMethod) gradientEl.setAttribute('spreadMethod', attrs.spreadMethod);
  if (attrs.gradientTransform) gradientEl.setAttribute('gradientTransform', attrs.gradientTransform);

  const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);
  sortedStops.forEach(s => {
    const stop = document.createElementNS(SVG_NS, 'stop');
    stop.setAttribute('offset', String(s.offset));
    stop.setAttribute('stop-color', s.color);
    if (s.opacity < 1) stop.setAttribute('stop-opacity', String(s.opacity));
    gradientEl.appendChild(stop);
  });

  codeEl.value = serializeSVG(svgRoot);
  invalidateLineOffsets();
  suppressAttrRebuild = true;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  setTimeout(() => {
    suppressAttrRebuild = false;
    if (attrPanelOpen && !canvasRootMode && selectedPath) rebuildAttrPanel();
  }, 120);

  showToast(mode === 'edit' ? t('gradientEditor.updated') : t('gradientEditor.created'));
}

/* JS-37 滤镜编辑器 | 数据驱动：FILTER_PRIMITIVE_DEFS 改为读 CONFIG.filterPrimitives；菜单从 CONFIG.filterPrimitives.order 生成 */
/* ============================================================
   37. 滤镜编辑器
   ============================================================ */
let filterEditorMask = null;

/* 原语规格访问器 */
function getFilterPrimDef(type) {
  const fp = CONFIG && CONFIG.filterPrimitives;
  if (!fp || !fp.defs) return null;
  return fp.defs[type] || null;
}

function getFilterPrimOrder() {
  const fp = CONFIG && CONFIG.filterPrimitives;
  return (fp && fp.order) || [];
}

function createDefaultPrimAttrs(type) {
  const def = getFilterPrimDef(type);
  if (!def) return {};
  const attrs = {};
  (def.fields || []).forEach(f => {
    attrs[f.name] = String(f.default != null ? f.default : '');
  });
  return attrs;
}

function parseFilterPrimitives(filterEl) {
  const result = [];
  Array.from(filterEl.children).forEach(child => {
    const type = child.localName;
    if (type === 'feMerge') {
      const inputs = [];
      Array.from(child.children).forEach(c => {
        if (c.localName === 'feMergeNode') inputs.push(c.getAttribute('in') || '');
      });
      result.push({ type, attrs: { inputs: inputs.join(', ') } });
    } else {
      const attrs = {};
      Array.from(child.attributes).forEach(a => { attrs[a.name] = a.value; });
      result.push({ type, attrs });
    }
  });
  return result;
}

function primitiveToMarkup(prim) {
  const { type, attrs } = prim;
  const localEsc = (v) => String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  if (type === 'feMerge') {
    const inputs = String(attrs.inputs || '').split(',').map(s => s.trim()).filter(Boolean);
    if (inputs.length === 0) inputs.push('SourceGraphic');
    const nodes = inputs.map(i => `<feMergeNode in="${localEsc(i)}"/>`).join('');
    return `<feMerge>${nodes}</feMerge>`;
  }
  const attrStr = Object.entries(attrs)
    .filter(([k, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}="${localEsc(v)}"`).join(' ');
  return attrStr ? `<${type} ${attrStr}/>` : `<${type}/>`;
}

function buildFilterSvg(prims, filterAttrs) {
  const x  = filterAttrs.x || '-10%';
  const y  = filterAttrs.y || '-10%';
  const w  = filterAttrs.width || '120%';
  const h  = filterAttrs.height || '120%';
  const units = filterAttrs.filterUnits || 'objectBoundingBox';
  const primsMarkup = prims.map(primitiveToMarkup).join('');
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id="prev-filter" x="${x}" y="${y}" width="${w}" height="${h}" filterUnits="${units}">
          ${primsMarkup || '<feGaussianBlur stdDeviation="3"/>'}
        </filter>
      </defs>
      <rect x="70" y="30" width="60" height="40" fill="#3b82f6" rx="6" filter="url(#prev-filter)"/>
      <text x="100" y="55" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" font-weight="600" fill="#ffffff" filter="url(#prev-filter)">${t('filterEditor.previewText')}</text>
    </svg>
  `;
}

function openFilterEditor(opts) {
  const mode = opts.mode || 'create';
  let existingId = opts.existingId || '';
  let prims = [];
  let filterAttrs = {
    x: '-10%', y: '-10%', width: '120%', height: '120%',
    filterUnits: 'objectBoundingBox'
  };

  if (mode === 'edit' && existingId && currentSvg) {
    const gEl = findGradientInSvg(currentSvg, existingId);
    if (gEl && gEl.localName === 'filter') {
      prims = parseFilterPrimitives(gEl);
      ['x','y','width','height','filterUnits'].forEach(k => {
        const v = gEl.getAttribute(k);
        if (v != null) filterAttrs[k] = v;
      });
    }
  }

  if (prims.length === 0 && mode === 'create') {
    const firstType = getFilterPrimOrder()[0];
    if (firstType) {
      prims = [{ type: firstType, attrs: createDefaultPrimAttrs(firstType) }];
    }
  }

  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `
    <div class="modal filter-editor" role="dialog" aria-modal="true" aria-labelledby="filterEditorTitle">
      <h3 id="filterEditorTitle" class="modal__title">${mode === 'edit' ? t('filterEditor.titleEdit') : t('filterEditor.titleCreate')}</h3>
      <p class="modal__subtitle">${mode === 'edit' ? t('filterEditor.subtitleEdit') : t('filterEditor.subtitleCreate')}</p>

      <div class="filter-editor__preview"></div>

      <div class="modal__label" style="margin-bottom:4px;">${t('group.filterPrimitives')}</div>
      <div class="filter-editor__prims"></div>
      <button type="button" class="filter-editor__add">${t('filterEditor.addPrim')}</button>

      <div class="modal__label" style="margin-top:14px;margin-bottom:4px;">${t('group.filterRegion')}</div>
      <div class="filter-editor__region">
        <div class="modal__field">
          <label class="modal__label">${t('field.filterRegionX')}</label>
          <input class="modal__input" type="text" data-region="x" value="${escapeAttr(filterAttrs.x)}"/>
        </div>
        <div class="modal__field">
          <label class="modal__label">${t('field.filterRegionY')}</label>
          <input class="modal__input" type="text" data-region="y" value="${escapeAttr(filterAttrs.y)}"/>
        </div>
        <div class="modal__field">
          <label class="modal__label">${t('field.filterRegionW')}</label>
          <input class="modal__input" type="text" data-region="width" value="${escapeAttr(filterAttrs.width)}"/>
        </div>
        <div class="modal__field">
          <label class="modal__label">${t('field.filterRegionH')}</label>
          <input class="modal__input" type="text" data-region="height" value="${escapeAttr(filterAttrs.height)}"/>
        </div>
      </div>

      <div class="modal__field" style="margin-top:10px;">
        <label class="modal__label">${t('field.filterUnits')}</label>
        <select class="modal__select" data-region="filterUnits">
          <option value="objectBoundingBox">objectBoundingBox</option>
          <option value="userSpaceOnUse">userSpaceOnUse</option>
        </select>
      </div>

      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button class="btn btn--primary" type="button" data-action="apply">${t('btn.applyFilter')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(mask);
  let _releaseFilterTrap = trapFocusIn(mask);

  const modal = mask.querySelector('.modal');
  const previewEl = modal.querySelector('.filter-editor__preview');
  const primsEl = modal.querySelector('.filter-editor__prims');

  function renderPreview() { previewEl.innerHTML = buildFilterSvg(prims, filterAttrs); }

  function renderPrims() {
    primsEl.innerHTML = '';
    if (prims.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'filter-editor__prims-empty';
      empty.textContent = t('filterEditor.primsEmpty');
      primsEl.appendChild(empty);
      return;
    }
    prims.forEach((prim, i) => {
      const card = document.createElement('div');
      card.className = 'filter-editor__prim';

      const header = document.createElement('div');
      header.className = 'filter-editor__prim-header';
      const title = document.createElement('span');
      title.className = 'filter-editor__prim-title';
      const def = getFilterPrimDef(prim.type);
      const primLabel = t('filterPrim.' + prim.type);
      title.textContent = `${i + 1}. ${prim.type}${def ? ' · ' + primLabel : ''}`;
      const rmBtn = document.createElement('button');
      rmBtn.type = 'button';
      rmBtn.className = 'filter-editor__prim-remove';
      rmBtn.textContent = '×';
      rmBtn.title = t('filterEditor.removePrim');
      rmBtn.addEventListener('click', () => {
        prims.splice(i, 1);
        renderPrims();
        renderPreview();
      });
      header.appendChild(title);
      header.appendChild(rmBtn);
      card.appendChild(header);

      if (def && def.fields) {
        const fields = document.createElement('div');
        fields.className = 'filter-editor__prim-fields';
        def.fields.forEach(f => {
          const wrap = document.createElement('div');
          wrap.className = 'filter-editor__prim-field' + (f.full ? ' filter-editor__prim-field--full' : '');
          const label = document.createElement('label');
          label.textContent = f.name;
          wrap.appendChild(label);

          let input;
          if (f.type === 'select') {
            input = document.createElement('select');
            f.options.forEach(opt => {
              const o = document.createElement('option');
              o.value = opt; o.textContent = opt;
              input.appendChild(o);
            });
            input.value = prim.attrs[f.name] != null ? prim.attrs[f.name] : f.default;
          } else if (f.type === 'color') {
            input = document.createElement('input');
            input.type = 'color';
            input.value = /^#[0-9a-f]{6}$/i.test(prim.attrs[f.name] || '') ? prim.attrs[f.name] : (f.default || '#000000');
          } else {
            input = document.createElement('input');
            input.type = f.type === 'number' ? 'number' : 'text';
            input.value = prim.attrs[f.name] != null ? prim.attrs[f.name] : f.default;
            if (f.step != null) input.step = f.step;
            if (f.placeholder) input.placeholder = f.placeholder;
          }
          const ev = f.type === 'select' || f.type === 'color' ? 'change' : 'input';
          input.addEventListener(ev, () => {
            prim.attrs[f.name] = input.value;
            renderPreview();
          });
          wrap.appendChild(input);
          fields.appendChild(wrap);
        });
        card.appendChild(fields);
      }
      primsEl.appendChild(card);
    });
  }

  renderPrims();
  renderPreview();

  modal.querySelectorAll('[data-region]').forEach(inp => {
    const k = inp.dataset.region;
    const ev = inp.tagName === 'SELECT' ? 'change' : 'input';
    inp.addEventListener(ev, () => {
      filterAttrs[k] = inp.value;
      renderPreview();
    });
  });

  modal.querySelector('.filter-editor__add').addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const menu = document.createElement('div');
    menu.className = 'attr-anim-menu';
    getFilterPrimOrder().forEach(type => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = `${type} · ${t('filterPrim.' + type)}`;
      item.addEventListener('click', () => {
        prims.push({ type, attrs: createDefaultPrimAttrs(type) });
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        renderPrims();
        renderPreview();
      });
      menu.appendChild(item);
    });
    document.body.appendChild(menu);
    menu.style.position = 'fixed';
    menu.style.zIndex = '300';
    menu.style.maxHeight = '260px';
    let top = rect.bottom + 4;
    const mh = menu.offsetHeight;
    if (top + mh > window.innerHeight - 8) top = Math.max(8, rect.top - mh - 4);
    menu.style.top = top + 'px';
    menu.style.left = rect.left + 'px';

    const outside = (ev) => {
      if (!menu.contains(ev.target) && ev.target !== btn) {
        if (menu.parentNode) menu.parentNode.removeChild(menu);
        document.removeEventListener('mousedown', outside, true);
      }
    };
    setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
  });

  function close() {
    if (_releaseFilterTrap) { _releaseFilterTrap(); _releaseFilterTrap = null; }
    if (mask.parentNode) mask.parentNode.removeChild(mask);
    filterEditorMask = null;
  }
  modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
  mask.addEventListener('click', (e) => { if (e.target === mask) close(); });

  modal.querySelector('[data-action="apply"]').addEventListener('click', () => {
    applyFilter({ mode, existingId: opts.existingId, prims, filterAttrs, targetPath: opts.targetPath, targetAttr: opts.targetAttr });
    close();
  });

  filterEditorMask = mask;
}

function applyFilter(opts) {
  const { mode, existingId, prims, filterAttrs, targetPath, targetAttr } = opts;

  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('filterEditor.parseFailed', { msg: err.message || '' })); return; }

  let targetId = existingId;
  if (mode === 'create') {
    targetId = 'filter-' + Math.random().toString(36).slice(2, 8);
    if (targetPath && targetAttr) {
      const targetEl = resolvePath(svgRoot, targetPath);
      if (targetEl) targetEl.setAttribute(targetAttr, `url(#${targetId})`);
    }
  }

  let filterEl = mode === 'edit' ? findGradientInSvg(svgRoot, targetId) : null;
  if (!filterEl || filterEl.localName !== 'filter') {
    filterEl = document.createElementNS(SVG_NS, 'filter');
    filterEl.setAttribute('id', targetId);
    let defs = null;
    for (let i = 0; i < svgRoot.children.length; i++) {
      if (svgRoot.children[i].localName === 'defs') { defs = svgRoot.children[i]; break; }
    }
    if (!defs) {
      defs = document.createElementNS(SVG_NS, 'defs');
      svgRoot.insertBefore(defs, svgRoot.firstChild);
    }
    defs.appendChild(filterEl);
  }

  Array.from(filterEl.attributes).forEach(a => filterEl.removeAttribute(a.name));
  while (filterEl.firstChild) filterEl.removeChild(filterEl.firstChild);

  filterEl.setAttribute('id', targetId);
  filterEl.setAttribute('x', filterAttrs.x || '-10%');
  filterEl.setAttribute('y', filterAttrs.y || '-10%');
  filterEl.setAttribute('width', filterAttrs.width || '120%');
  filterEl.setAttribute('height', filterAttrs.height || '120%');
  filterEl.setAttribute('filterUnits', filterAttrs.filterUnits || 'objectBoundingBox');

  const primsMarkup = prims.map(primitiveToMarkup).join('');
  const tmpDoc = new DOMParser().parseFromString(
    `<svg xmlns="${SVG_NS}">${primsMarkup}</svg>`, 'image/svg+xml'
  );
  Array.from(tmpDoc.documentElement.childNodes).forEach(node => {
    if (node.nodeType === 1) filterEl.appendChild(document.importNode(node, true));
  });

  codeEl.value = serializeSVG(svgRoot);
  invalidateLineOffsets();
  suppressAttrRebuild = true;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  setTimeout(() => {
    suppressAttrRebuild = false;
    if (attrPanelOpen && !canvasRootMode && selectedPath) rebuildAttrPanel();
  }, 120);

  showToast(mode === 'edit' ? t('filterEditor.updated') : t('filterEditor.created'));
}

/* JS-38 marker 预设生成 | 数据驱动：MARKER_PRESETS 改为读 CONFIG.markerPresets；菜单从 order 生成；markup 模板 {color} 占位替换 */
/* ============================================================
   38. marker 预设生成
   ============================================================ */
let markerPickerEl = null;

/* marker 预设访问器 */
function getMarkerPresetIds() {
  const mp = CONFIG && CONFIG.markerPresets;
  return (mp && mp.order) || [];
}

function getMarkerPresetDef(id) {
  const mp = CONFIG && CONFIG.markerPresets;
  if (!mp || !mp.defs) return null;
  return mp.defs[id] || null;
}

/* 从引用元素读取描边/填充色作为箭头颜色；无有效值时回退黑色 */
function getMarkerSourceColor(el) {
  if (!el) return '#000000';
  const stroke = el.getAttribute('stroke');
  if (stroke && stroke !== 'none' && !/^url\(/.test(stroke)) {
    if (/^#[0-9a-f]{3,8}$/i.test(stroke) || /^rgb/i.test(stroke)) return stroke;
  }
  const fill = el.getAttribute('fill');
  if (fill && fill !== 'none' && !/^url\(/.test(fill)) {
    if (/^#[0-9a-f]{3,8}$/i.test(fill) || /^rgb/i.test(fill)) return fill;
  }
  return '#000000';
}

function openMarkerPicker(anchorEl, targetPath, attrName) {
  closeMarkerPicker();
  const menu = document.createElement('div');
  menu.className = 'attr-anim-menu';

  getMarkerPresetIds().forEach(id => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('marker.' + id);
    btn.addEventListener('click', () => {
      closeMarkerPicker();
      createMarkerPreset(id, targetPath, attrName);
    });
    menu.appendChild(btn);
  });

  const sep = document.createElement('div');
  sep.className = 'dropdown__sep';
  menu.appendChild(sep);

  const customBtn = document.createElement('button');
  customBtn.type = 'button';
  customBtn.textContent = t('marker.custom');
  customBtn.addEventListener('click', () => {
    closeMarkerPicker();
    openMarkerCustomDialog(targetPath, attrName);
  });
  menu.appendChild(customBtn);

  document.body.appendChild(menu);

  const rect = anchorEl.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = rect.right - menuRect.width;
  if (left < 8) left = 8;
  if (left + menuRect.width > vw - 8) left = vw - menuRect.width - 8;
  let top = rect.bottom + 4;
  if (top + menuRect.height > vh - 8) top = Math.max(8, rect.top - menuRect.height - 4);
  menu.style.position = 'fixed';
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
  menu.style.zIndex = '250';

  markerPickerEl = menu;

  const outside = (e) => {
    if (!menu.contains(e.target) && e.target !== anchorEl && !anchorEl.contains(e.target)) {
      closeMarkerPicker();
      document.removeEventListener('mousedown', outside, true);
    }
  };
  setTimeout(() => document.addEventListener('mousedown', outside, true), 0);
}

function closeMarkerPicker() {
  if (markerPickerEl && markerPickerEl.parentNode) {
    markerPickerEl.parentNode.removeChild(markerPickerEl);
  }
  markerPickerEl = null;
}

/* 在 svgRoot 的 defs 内追加 marker，并写入目标元素引用 */
function mountMarkerIntoSvg(svgRoot, targetEl, attrName, markerEl) {
  let defs = null;
  for (let i = 0; i < svgRoot.children.length; i++) {
    if (svgRoot.children[i].localName === 'defs') { defs = svgRoot.children[i]; break; }
  }
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    svgRoot.insertBefore(defs, svgRoot.firstChild);
  }
  defs.appendChild(markerEl);
  targetEl.setAttribute(attrName, `url(#${markerEl.getAttribute('id')})`);
}

function commitMarkerSvg(svgRoot, toastMsg) {
  codeEl.value = serializeSVG(svgRoot);
  invalidateLineOffsets();
  suppressAttrRebuild = true;
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);
  setTimeout(() => {
    suppressAttrRebuild = false;
    if (attrPanelOpen && !canvasRootMode) rebuildAttrPanel();
  }, 120);
  showToast(toastMsg);
}

/* 用 markup 模板构建 marker 内部子元素（{color} 占位替换） */
function buildMarkerInnerContent(markupTemplate, color) {
  const coloredMarkup = String(markupTemplate || '').replace(/\{color\}/g, color);
  const tmp = new DOMParser().parseFromString(
    `<svg xmlns="${SVG_NS}">${coloredMarkup}</svg>`, 'image/svg+xml'
  );
  return Array.from(tmp.documentElement.childNodes)
    .filter(node => node.nodeType === 1);
}

function createMarkerPreset(presetId, targetPath, attrName) {
  const preset = getMarkerPresetDef(presetId);
  if (!preset) {
    console.warn('[marker] unknown preset:', presetId);
    return;
  }

  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('toast.parseFailed', { msg: err.message || '' })); return; }

  const targetEl = resolvePath(svgRoot, targetPath);
  if (!targetEl) { showToast(t('toast.noSourceLocate')); return; }

  const color = getMarkerSourceColor(targetEl);
  const markerId = 'marker-' + Math.random().toString(36).slice(2, 8);

  const markerEl = document.createElementNS(SVG_NS, 'marker');
  markerEl.setAttribute('id', markerId);
  markerEl.setAttribute('viewBox', preset.viewBox || '0 0 10 10');
  markerEl.setAttribute('refX', String(preset.refX != null ? preset.refX : 5));
  markerEl.setAttribute('refY', String(preset.refY != null ? preset.refY : 5));
  markerEl.setAttribute('markerWidth', String(preset.size || 10));
  markerEl.setAttribute('markerHeight', String(preset.size || 10));
  markerEl.setAttribute('orient', 'auto');
  markerEl.setAttribute('markerUnits', 'strokeWidth');

  buildMarkerInnerContent(preset.markup, color).forEach(node => {
    markerEl.appendChild(document.importNode(node, true));
  });

  mountMarkerIntoSvg(svgRoot, targetEl, attrName, markerEl);
  commitMarkerSvg(svgRoot, t('marker.added', { label: t('marker.' + presetId) }));
}

/* 自定义形状 markup 生成：使用 {color} 占位，应用时统一替换 */
function buildCustomShapeMarkup(shape, vbW, vbH) {
  const cx = vbW / 2, cy = vbH / 2;
  if (shape === 'triangle') return `<path d="M0,0 L${vbW},${cy} L0,${vbH} z" fill="{color}"/>`;
  if (shape === 'circle') {
    const r = Math.min(vbW, vbH) * 0.4;
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="{color}"/>`;
  }
  if (shape === 'vee') {
    return `<path d="M${vbW * 0.2},${vbH * 0.2} L${vbW * 0.8},${cy} L${vbW * 0.2},${vbH * 0.8}" fill="none" stroke="{color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return `<rect x="0" y="0" width="${vbW}" height="${vbH}" fill="{color}"/>`;
}

function openMarkerCustomDialog(targetPath, attrName) {
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="markerCustomTitle" style="max-width:400px;">
      <h3 id="markerCustomTitle" class="modal__title">${t('marker.customTitle')}</h3>
      <p class="modal__subtitle">${t('marker.customSubtitle')}</p>

      <div class="modal__field" style="margin-bottom:10px;">
        <label class="modal__label">${t('marker.shape')}</label>
        <select class="modal__select" data-field="shape">
          <option value="triangle">${t('marker.shapeTriangle')}</option>
          <option value="circle">${t('marker.shapeCircle')}</option>
          <option value="vee">${t('marker.shapeVee')}</option>
          <option value="rect">${t('marker.shapeRect')}</option>
        </select>
      </div>
      <div class="modal__row">
        <div class="modal__field">
          <label class="modal__label">${t('marker.viewBoxW')}</label>
          <input class="modal__input" type="number" data-field="vbW" min="1" step="1" value="10"/>
        </div>
        <div class="modal__field">
          <label class="modal__label">${t('marker.viewBoxH')}</label>
          <input class="modal__input" type="number" data-field="vbH" min="1" step="1" value="10"/>
        </div>
      </div>
      <div class="modal__row">
        <div class="modal__field">
          <label class="modal__label">${t('marker.markerWidth')}</label>
          <input class="modal__input" type="number" data-field="mW" min="1" step="1" value="10"/>
        </div>
        <div class="modal__field">
          <label class="modal__label">${t('marker.markerHeight')}</label>
          <input class="modal__input" type="number" data-field="mH" min="1" step="1" value="10"/>
        </div>
      </div>
      <div class="modal__row">
        <div class="modal__field">
          <label class="modal__label">refX</label>
          <input class="modal__input" type="number" data-field="refX" step="1" value="10"/>
        </div>
        <div class="modal__field">
          <label class="modal__label">refY</label>
          <input class="modal__input" type="number" data-field="refY" step="1" value="5"/>
        </div>
      </div>
      <div class="modal__field" style="margin-bottom:10px;">
        <label class="modal__label">${t('marker.orient')}</label>
        <select class="modal__select" data-field="orient">
          <option value="auto">${t('marker.orientAuto')}</option>
          <option value="auto-start-reverse">${t('marker.orientAutoStartReverse')}</option>
          <option value="angle">${t('marker.orientAngle')}</option>
        </select>
      </div>
      <div class="modal__field" style="margin-bottom:10px;">
        <label class="modal__label">${t('marker.orientAngleLabel')}</label>
        <input class="modal__input" type="number" data-field="orientAngle" step="1" value="0"/>
      </div>

      <div class="modal__actions">
        <button class="btn btn--ghost" type="button" data-action="cancel">${t('btn.cancel')}</button>
        <button class="btn btn--primary" type="button" data-action="apply">${t('btn.apply')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(mask);
  let _releaseMarkerTrap = trapFocusIn(mask);

  const modal = mask.querySelector('.modal');
  const fields = {};
  modal.querySelectorAll('[data-field]').forEach(inp => { fields[inp.dataset.field] = inp; });

  function close() {
    if (_releaseMarkerTrap) { _releaseMarkerTrap(); _releaseMarkerTrap = null; }
    if (mask.parentNode) mask.parentNode.removeChild(mask);
  }
  modal.querySelector('[data-action="cancel"]').addEventListener('click', close);
  mask.addEventListener('click', (e) => { if (e.target === mask) close(); });

  modal.querySelector('[data-action="apply"]').addEventListener('click', () => {
    const shape = fields.shape.value;
    const vbW = Math.max(1, parseFloat(fields.vbW.value) || 10);
    const vbH = Math.max(1, parseFloat(fields.vbH.value) || 10);
    const mW = Math.max(1, parseFloat(fields.mW.value) || 10);
    const mH = Math.max(1, parseFloat(fields.mH.value) || 10);
    const refX = parseFloat(fields.refX.value) || 0;
    const refY = parseFloat(fields.refY.value) || 0;
    const orientVal = fields.orient.value;
    const orientAngle = parseFloat(fields.orientAngle.value) || 0;
    const orient = orientVal === 'angle' ? String(orientAngle) : orientVal;

    applyCustomMarker({ targetPath, attrName, shape, vbW, vbH, mW, mH, refX, refY, orient });
    close();
  });
}

function applyCustomMarker(opts) {
  const { targetPath, attrName, shape, vbW, vbH, mW, mH, refX, refY, orient } = opts;

  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('toast.parseFailed', { msg: err.message || '' })); return; }

  const targetEl = resolvePath(svgRoot, targetPath);
  if (!targetEl) { showToast(t('toast.noSourceLocate')); return; }

  const color = getMarkerSourceColor(targetEl);
  const markerId = 'marker-' + Math.random().toString(36).slice(2, 8);

  const markerEl = document.createElementNS(SVG_NS, 'marker');
  markerEl.setAttribute('id', markerId);
  markerEl.setAttribute('viewBox', `0 0 ${vbW} ${vbH}`);
  markerEl.setAttribute('refX', String(refX));
  markerEl.setAttribute('refY', String(refY));
  markerEl.setAttribute('markerWidth', String(mW));
  markerEl.setAttribute('markerHeight', String(mH));
  markerEl.setAttribute('orient', orient);
  markerEl.setAttribute('markerUnits', 'strokeWidth');

  const shapeMarkup = buildCustomShapeMarkup(shape, vbW, vbH);
  buildMarkerInnerContent(shapeMarkup, color).forEach(node => {
    markerEl.appendChild(document.importNode(node, true));
  });

  mountMarkerIntoSvg(svgRoot, targetEl, attrName, markerEl);
  commitMarkerSvg(svgRoot, t('marker.customAdded'));
}

/* JS-39 创建形状 | 数据驱动：形状列表与参数来自 CONFIG.shapes；kind 分发逻辑保留在 JS */
/* ============================================================
   39. 创建形状
   ============================================================ */
let createShapeMenuEl = null;

function buildEmptySvgMarkup() {
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100%" height="100%"></svg>';
}

/* kind → 生成函数（唯一需要 JS 改的地方；新增 kind 时在此追加） */
const SHAPE_KIND_BUILDERS = {
  rect: (cx, cy, L, d) => {
    const size = L * (d.sizeRatio != null ? d.sizeRatio : 1.0);
    const el = document.createElementNS(SVG_NS, 'rect');
    el.setAttribute('x', String(cx - size / 2));
    el.setAttribute('y', String(cy - size / 2));
    el.setAttribute('width', String(size));
    el.setAttribute('height', String(size));
    if (d.rxRatio != null) {
      const rx = Math.max(2, size * d.rxRatio);
      el.setAttribute('rx', String(rx));
      el.setAttribute('ry', String(rx));
    }
    el.setAttribute('fill', '#3b82f6');
    return el;
  },
  circle: (cx, cy, L, d) => {
    const el = document.createElementNS(SVG_NS, 'circle');
    el.setAttribute('cx', String(cx));
    el.setAttribute('cy', String(cy));
    el.setAttribute('r', String(L * (d.radiusRatio != null ? d.radiusRatio : 0.5)));
    el.setAttribute('fill', '#3b82f6');
    return el;
  },
  ellipse: (cx, cy, L, d) => {
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(cx));
    el.setAttribute('cy', String(cy));
    el.setAttribute('rx', String(L * (d.rxRatio != null ? d.rxRatio : 0.5)));
    el.setAttribute('ry', String(L * (d.ryRatio != null ? d.ryRatio : 0.35)));
    el.setAttribute('fill', '#3b82f6');
    return el;
  },
  polygon: (cx, cy, L, d) => {
    const sides = Math.max(3, Math.min(20, d.sides || 6));
    const r = L * (d.radiusRatio != null ? d.radiusRatio : 0.5);
    const el = document.createElementNS(SVG_NS, 'polygon');
    el.setAttribute('points', pointsToStr(polygonPoints(cx, cy, r, r, sides)));
    el.setAttribute('data-sides', String(sides));
    el.setAttribute('fill', '#3b82f6');
    return el;
  },
  'polygon-star': (cx, cy, L, d) => {
    const points = Math.max(3, Math.min(20, d.points || 5));
    const ratio = Math.max(0.1, Math.min(0.9, d.ratio != null ? d.ratio : 0.45));
    const r = L * (d.radiusRatio != null ? d.radiusRatio : 0.5);
    const el = document.createElementNS(SVG_NS, 'polygon');
    el.setAttribute('points', pointsToStr(starPoints(cx, cy, r, r, points, ratio)));
    el.setAttribute('data-shape', 'star');
    el.setAttribute('data-points', String(points));
    el.setAttribute('data-ratio', String(ratio));
    el.setAttribute('fill', '#3b82f6');
    return el;
  },
  line: (cx, cy, L, d) => {
    const half = L * (d.lengthRatio != null ? d.lengthRatio : 1.0) / 2;
    const el = document.createElementNS(SVG_NS, 'line');
    el.setAttribute('x1', String(cx - half));
    el.setAttribute('y1', String(cy));
    el.setAttribute('x2', String(cx + half));
    el.setAttribute('y2', String(cy));
    el.setAttribute('stroke', '#3b82f6');
    el.setAttribute('stroke-width', '2');
    el.setAttribute('stroke-linecap', 'round');
    return el;
  },
  polyline: (cx, cy, L, d) => {
    const r = L * (d.sizeRatio != null ? d.sizeRatio : 1.0) / 2;
    const pts = [
      [cx - r, cy + r * 0.5],
      [cx, cy - r * 0.5],
      [cx + r, cy + r * 0.5]
    ];
    const el = document.createElementNS(SVG_NS, 'polyline');
    el.setAttribute('points', pointsToStr(pts));
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', '#3b82f6');
    el.setAttribute('stroke-width', '2');
    el.setAttribute('stroke-linecap', 'round');
    el.setAttribute('stroke-linejoin', 'round');
    return el;
  }
};

function getShapeIds() {
  const shapes = CONFIG && CONFIG.shapes;
  return (shapes && shapes.order) || [];
}

function buildShapeMarkup(shapeId, cx, cy, L) {
  const shapes = CONFIG && CONFIG.shapes;
  if (!shapes || !shapes.builders) return null;
  const spec = shapes.builders[shapeId];
  if (!spec) return null;
  const builder = SHAPE_KIND_BUILDERS[spec.kind];
  if (!builder) {
    console.warn('[shape] unknown kind:', spec.kind);
    return null;
  }
  return builder(cx, cy, L, spec.defaults || {});
}

function openCreateShapeMenu(anchorEl) {
  closeCreateShapeMenu();
  const menu = document.createElement('div');
  menu.className = 'attr-anim-menu create-shape-menu';
  menu.addEventListener('click', e => e.stopPropagation());

  getShapeIds().forEach(id => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = t('shape.' + id);
    btn.addEventListener('click', () => {
      closeCreateShapeMenu();
      createShape(id);
    });
    menu.appendChild(btn);
  });

  document.body.appendChild(menu);

  const rect = anchorEl.getBoundingClientRect();
  const menuRect = menu.getBoundingClientRect();
  const vh = window.innerHeight;
  const vw = window.innerWidth;
  let left = rect.left;
  if (left + menuRect.width > vw - 8) left = vw - menuRect.width - 8;
  if (left < 8) left = 8;
  let top = rect.bottom + 4;
  if (top + menuRect.height > vh - 8) {
    top = Math.max(8, rect.top - menuRect.height - 4);
  }
  menu.style.position = 'fixed';
  menu.style.top = top + 'px';
  menu.style.left = left + 'px';
  menu.style.zIndex = '200';

  createShapeMenuEl = menu;
}

function closeCreateShapeMenu() {
  if (createShapeMenuEl && createShapeMenuEl.parentNode) {
    createShapeMenuEl.parentNode.removeChild(createShapeMenuEl);
  }
  createShapeMenuEl = null;
}

function createShape(shapeId) {
  if (!currentSvg || !codeEl.value.trim()) {
    codeEl.value = buildEmptySvgMarkup();
    invalidateLineOffsets();
    renderEditor();
  }

  let svgRoot;
  try { svgRoot = parseSVG(codeEl.value); }
  catch (err) { showToast(t('toast.parseFailed', { msg: err.message || '' })); return; }

  const vb = getCanvasViewBoxSize(svgRoot);
  const cx = vb.x + vb.w / 2;
  const cy = vb.y + vb.h / 2;
  const L = Math.min(vb.w, vb.h) * 0.3;

  const shapeEl = buildShapeMarkup(shapeId, cx, cy, L);
  if (!shapeEl) { showToast(t('toast.shapeUnsupported')); return; }

  svgRoot.appendChild(shapeEl);
  codeEl.value = serializeSVG(svgRoot);

  let newSvg;
  try { newSvg = parseSVG(codeEl.value); }
  catch (err) { showToast(t('anim.parseAfterInsert', { msg: err.message || '' })); return; }

  const newIdx = newSvg.children.length - 1;
  currentSvg = newSvg;
  selectedPath = [newIdx];
  const newEl = newSvg.children[newIdx];
  _selectedElementTag = newEl ? newEl.localName : null;
  _selectedElementId  = newEl ? (newEl.getAttribute('id') || null) : null;

  invalidateLineOffsets();
  renderEditor();
  renderPreview();
  saveDraftDebounced();
  recordSnapshot(true);

  openAttrPanel();
  showToast(t('toast.shapeCreated', { label: t('shape.' + shapeId) }));
}

})();