(function () {
  'use strict';

  /* ============================================================
     §1 常量与配置
     ============================================================ */

  const IMAGE_BASE_URL = 'https://a-g-i.s3.eu-west-3.amazonaws.com';
  const DATA_URL = './data.json';
  const I18N_URL = './i18n.json';

  const FAV_KEY = 'gallery_favorites_v1';
  const THEME_KEY = 'gallery_theme_v1';
  const SEEN_KEY = 'gallery_seen_ids_v1';
  const LANG_KEY = 'gallery_lang_v1';

  const BATCH_SIZE = 300;
  const AUTO_LOAD_THRESHOLD = 50;
  const PILL_AUTO_CLOSE_MS = 5000;

  /** 图片变体目录模板：host/<folder>/<variant>/<file> */
  const VARIANT_TEMPLATES = {
    small:  '_500xAUTO_crop_center-center_75_none',
    medium: '_1600xAUTO_crop_center-center_75_none',
    large:  '_2000xAUTO_crop_center-center_75_none'
  };

  const MIN_COL = 230;
  const MAX_COLS = 6;
  const PHONE_PORTRAIT_MAX = 640;
  const PHONE_LANDSCAPE_MAX = 900;
  const HEADER_EST = 70;   // 卡片头部高度估算（快速选列用，每批实测校正）
  const CHUNK_SIZE = 15;   // 每批渲染基数：窄屏 15，宽屏 30

  const TOKEN_SPLIT_RE = /[\s,，。;；、|\/\\\-_·:：()（）\[\]【】"'“”‘’!！?？]+/;

  /* ============================================================
     §2 图片变体展开
     - 数据只有原图 url，small/medium/large 由前端按 S3 目录规则拼接
     - 非 S3 主机 / data: / blob: 原样透传
     ============================================================ */

  const expandCache = new WeakMap();

  function expandImage(img) {
    if (!img) return null;
    if (img.small || img.large) return img;
    if (expandCache.has(img)) return expandCache.get(img);

    const base = String(img.url || img.src || '').trim();
    if (!base) {
      const empty = Object.assign({}, img, { url: '', small: '', medium: '', large: '' });
      expandCache.set(img, empty);
      return empty;
    }

    if (/^(data|blob):/i.test(base)) {
      const pass = Object.assign({}, img, { url: base, small: base, medium: base, large: base });
      expandCache.set(img, pass);
      return pass;
    }

    let host = '';
    let path = base;
    const m = base.match(/^((?:https?:)?\/\/[^/]+)(\/.*)$/i);
    if (m) { host = m[1]; path = m[2]; }

    if (host && host.indexOf('a-g-i.s3.') === -1) {
      const pass = Object.assign({}, img, { url: base, small: base, medium: base, large: base });
      expandCache.set(img, pass);
      return pass;
    }

    const dir = path.replace(/^\//, '');
    const slash = dir.lastIndexOf('/');
    const folder = slash >= 0 ? dir.slice(0, slash + 1) : '';
    const file = slash >= 0 ? dir.slice(slash + 1) : dir;

    const qIdx = file.indexOf('?');
    const cleanFile = qIdx >= 0 ? file.slice(0, qIdx) : file;
    const query = qIdx >= 0 ? file.slice(qIdx) : '';

    const prefix = host ? host + '/' : '';

    const result = Object.assign({}, img, {
      url: base,
      small:  prefix + folder + VARIANT_TEMPLATES.small  + '/' + cleanFile + query,
      medium: prefix + folder + VARIANT_TEMPLATES.medium + '/' + cleanFile + query,
      large:  prefix + folder + VARIANT_TEMPLATES.large  + '/' + cleanFile + query
    });
    expandCache.set(img, result);
    return result;
  }

  function resolveUrl(url) {
    if (!url) return '';
    const s = String(url).trim();
    if (!s) return '';
    if (/^(https?:)?\/\//i.test(s)) return s;
    if (/^(data|blob):/i.test(s)) return s;
    return IMAGE_BASE_URL + (s.charAt(0) === '/' ? '' : '/') + s;
  }

  /* ============================================================
     §3 通用工具
     ============================================================ */

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function escapeHtml(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  function highlightHtml(text, terms) {
    const safe = escapeHtml(text || '');
    if (!terms || !terms.length) return safe;
    const uniq = [...new Set(terms.filter(Boolean).map(t => escapeHtml(t)))];
    if (!uniq.length) return safe;
    uniq.sort((a, b) => b.length - a.length);
    const pattern = uniq.map(escapeRegExp).join('|');
    return safe.replace(new RegExp('(' + pattern + ')', 'gi'), '<mark>$1</mark>');
  }

  function filterBySet(base, other) {
    if (!base || !base.length || !other || !other.length) return [];
    const set = new Set(other);
    return base.filter(x => set.has(x));
  }

  /* ============================================================
     §4 DOM 引用
     ============================================================ */

  const gallery = document.getElementById('gallery');
  const sentinel = document.getElementById('sentinel');
  const statusEl = document.getElementById('status');
  const lightbox = document.getElementById('lightbox');
  const lbGallery = document.getElementById('lb-gallery');
  const lbCount = document.getElementById('lb-count');
  const lbFav = document.getElementById('lbFav');
  const lbTitle = document.getElementById('lb-title');
  const lbDesigner = document.getElementById('lb-designer');
  const lbMetaGrid = document.getElementById('lb-meta-grid');
  const lbDetails = document.getElementById('lb-details');
  const lbTags = document.getElementById('lb-tags');
  const searchBtn = document.getElementById('searchBtn');
  const searchBox = document.getElementById('searchBox');
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');
  const hamburger = document.getElementById('hamburger');
  const pillMenu = document.getElementById('pillMenu');
  const filterYear = document.getElementById('filterYear');
  const filterType = document.getElementById('filterType');
  const filterCountry = document.getElementById('filterCountry');
  const toastEl = document.getElementById('toast');
  const themeToggle = document.getElementById('themeToggle');

  /* ============================================================
     §5 状态
     ============================================================ */

  const state = {
    allProjects: [],
    recordById: new Map(),
    searchIndex: [],
    inverted: new Map(),

    loadQueue: [],
    currentIndex: 0,
    chunksPerBatch: 1,
    rootMargin: 800,
    loading: false,
    finished: false,

    cardQueue: [],
    columns: [],
    columnHeights: [],
    colWidth: 0,
    gap: 16,
    currentColCount: 0,
    dehydrated: new Set(),
    liveCount: 0,
    io: null,
    ioRootMargin: 0,
    cardIO: null,

    view: 'all',
    savedQueueState: null,

    searchTimer: null,
    searchToken: 0,
    currentTerms: [],
    searchResults: [],
    searchTotal: 0,
    searchDesc: '',

    currentLightboxId: '',
    lbImages: [],
    lbIndex: 0,
    lbIO: null,
    lastFocus: null,
    scrollSyncTimer: null,

    homeFilterType: '',
    homeFilterValue: '',
    discoverRendered: false,
    aboutStats: '',
    initInFlight: false,
    lang: 'zh',
    i18n: {},
    favorites: new Set()
  };

  /* ============================================================
     §6 i18n
     ============================================================ */

  function detectLang() {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'zh' || saved === 'en') return saved;
    } catch (e) {}
    const list = (navigator.languages && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || 'en'];
    for (const raw of list) {
      const l = String(raw || '').toLowerCase();
      if (l.startsWith('zh')) return 'zh';
      if (l.startsWith('en')) return 'en';
    }
    return 'en';
  }

  async function loadI18n() {
    const lang = detectLang();
    state.lang = lang;
    try {
      const res = await fetch(I18N_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      state.i18n = json[lang] || json.zh || json.en || {};
    } catch (e) {
      console.warn('i18n 加载失败，回退到内置 key', e);
      state.i18n = {};
    }
  }

  function t(key, params) {
    let s = state.i18n[key];
    if (s == null) return key;
    if (params) {
      for (const k in params) {
        s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(params[k]));
      }
    }
    return s;
  }

  function tPreparing() {
    const s = t('status.preparing');
    if (s !== 'status.preparing') return s;
    return state.lang === 'zh' ? '正在准备数据…' : 'Preparing data…';
  }

  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const s = t(el.getAttribute('data-i18n'));
      if (s != null && s !== el.getAttribute('data-i18n')) el.textContent = s;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    document.querySelectorAll('[data-i18n-content]').forEach(el => {
      const s = t(el.getAttribute('data-i18n-content'));
      if (s != null && s !== el.getAttribute('data-i18n-content')) el.setAttribute('content', s);
    });
    const title = t('app.title');
    if (title && title !== 'app.title') document.title = title;
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
  }

  /* ============================================================
     §7 收藏
     ============================================================ */

  function loadFavorites() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) state.favorites = new Set(JSON.parse(raw).map(String));
    } catch (e) { console.warn('读取收藏失败', e); }
  }
  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...state.favorites])); }
    catch (e) { console.warn('保存收藏失败', e); }
  }

  function toggleFavorite(id) {
    const key = String(id);
    const isAdding = !state.favorites.has(key);
    if (isAdding) {
      state.favorites.add(key);
    } else {
      state.favorites.delete(key);
      showToast(t('toast.favRemoved'));
    }
    saveFavorites();
    updateFavoriteButtons(key);

    if (state.view === 'favorites') {
      if (!isAdding) {
        for (let i = state.cardQueue.length - 1; i >= 0; i--) {
          const card = state.cardQueue[i];
          if (card && card._item && String(card._item.record.id) === key) {
            removeCard(card);
            break;
          }
        }
        for (let i = state.currentIndex; i < state.loadQueue.length; i++) {
          const it = state.loadQueue[i];
          if (it && String(it.record.id) === key) it.skipped = true;
        }
        if (!state.cardQueue.length && state.currentIndex >= state.loadQueue.length) {
          setStatus(t('favorites.empty'));
        }
      } else {
        const rec = state.recordById.get(key);
        if (rec) {
          const cover = findCoverImage(rec);
          if (cover) {
            state.loadQueue.push({ record: rec, cover });
            if (state.finished) {
              state.finished = false;
              requestAnimationFrame(() => {
                if (state.currentIndex < state.loadQueue.length) loadNextBatch();
              });
            }
          }
        }
      }
    }
  }

  function updateFavoriteButtons(id) {
    const active = state.favorites.has(String(id));
    if (state.currentLightboxId && state.currentLightboxId === String(id)) {
      lbFav.classList.toggle('active', active);
      lbFav.setAttribute('aria-pressed', active ? 'true' : 'false');
    }
  }

  /* ============================================================
     §8 Toast / 状态栏
     ============================================================ */

  let toastTimer;
  function showToast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  function updateSearchClear() {
    searchBox.classList.toggle('has-value', searchInput.value.length > 0);
  }

  function setStatus(text) {
    statusEl.textContent = text || '';
  }

  /**
   * 渲染完成后的底部统计
   * - 搜索：找到 N 个匹配「desc」
   * - 发现点击过滤：标签「值」· 共 N 个作品
   * - 首页随机流 / 收藏：不显示
   */
  function updateResultStats() {
    if (state.view === 'search') {
      if (!state.searchTotal) return;
      statusEl.textContent = t('status.searchDone', {
        total: state.searchTotal,
        desc: state.searchDesc
      });
      return;
    }

    if (state.view === 'all' && state.homeFilterType && state.homeFilterValue) {
      const labelKey = 'filterLabel.' + state.homeFilterType;
      let label = t(labelKey);
      if (label === labelKey) label = state.homeFilterType;
      statusEl.textContent = t('status.filterDone', {
        label,
        value: state.homeFilterValue,
        total: state.loadQueue.length
      });
    }
  }

  /* ============================================================
     §9 视图辅助
     ============================================================ */

  function exitPageViews() {
    document.body.classList.remove('view-discover', 'view-about');
    const dv = document.getElementById('discoverView');
    const av = document.getElementById('aboutView');
    if (dv) dv.hidden = true;
    if (av) av.hidden = true;
  }

  function teardownObserver() {
    if (state.io) { state.io.disconnect(); state.io = null; state.ioRootMargin = 0; }
  }

  function saveCurrentQueueState() {
    state.savedQueueState = {
      view: state.view,
      queue: state.loadQueue.slice(),
      index: state.currentIndex,
      finished: state.finished,
      cards: state.cardQueue.slice()
    };
  }

  function restoreSavedQueueState() {
    const s = state.savedQueueState;
    if (!s) return false;
    state.view = s.view;
    state.loadQueue = s.queue;
    state.currentIndex = s.index;
    state.finished = s.finished;
    state.cardQueue = s.cards.slice();
    state.dehydrated.clear();
    state.liveCount = state.cardQueue.reduce((n, c) => n + (c && c._img ? 1 : 0), 0);
    layoutCards(s.cards);
    setStatus('');
    return true;
  }

  function isGalleryView() {
    return state.view === 'all' || state.view === 'search' || state.view === 'favorites';
  }

  /* ============================================================
     §10 图片与记录辅助
     ============================================================ */

  function hasUsableImage(img) {
    if (!img) return false;
    const s = img.small, l = img.large, u = img.url;
    return !!((u && String(u).trim()) ||
              (s && String(s).trim()) ||
              (l && String(l).trim()));
  }

  function findCoverImage(record) {
    const imgs = Array.isArray(record.images) ? record.images : [];
    for (let i = 0; i < imgs.length; i++) {
      if (hasUsableImage(imgs[i])) {
        return { image: expandImage(imgs[i]), index: i };
      }
    }
    return null;
  }

  function buildProjectQueue(records) {
    const items = [];
    records.forEach(rec => {
      const cover = findCoverImage(rec);
      if (!cover) return;
      items.push({ record: rec, cover });
    });
    return items;
  }

  /* ============================================================
     §11 首页随机批队列
     ============================================================ */

  function loadSeenIds() {
    try {
      const raw = localStorage.getItem(SEEN_KEY);
      return new Set(raw ? JSON.parse(raw).map(String) : []);
    } catch (e) { return new Set(); }
  }
  function saveSeenIds(seen) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seen])); } catch (e) {}
  }

  function buildBatchQueue() {
    const allItems = buildProjectQueue(state.allProjects);
    if (!allItems.length) return [];

    const seen = loadSeenIds();
    let candidates = allItems.filter(it => !seen.has(String(it.record.id)));

    if (candidates.length < BATCH_SIZE) {
      seen.clear();
      candidates = allItems;
      showToast(t('toast.newRound'));
    }

    const batch = shuffleArray(candidates).slice(0, BATCH_SIZE);
    batch.forEach(it => seen.add(String(it.record.id)));
    saveSeenIds(seen);
    return batch;
  }

  function buildFilteredQueue() {
    const records = state.allProjects.filter(matchHomeFilter);
    return shuffleArray(buildProjectQueue(records));
  }

  function appendNextBatch() {
    if (state.view !== 'all') return false;
    if (state.homeFilterType && state.homeFilterValue) return false;
    const newBatch = buildBatchQueue();
    if (!newBatch.length) return false;
    state.loadQueue = state.loadQueue.concat(newBatch);
    return true;
  }

  /** 首页过滤：设计师分支保留，发现页点击走这里 */
  function matchHomeFilter(rec) {
    const tt = state.homeFilterType;
    const v = state.homeFilterValue;
    if (!tt || !v) return true;
    if (tt === 'designer') return String(rec.designer || '').trim() === v;
    if (tt === 'country')  return String(rec.nationalGroup || '').trim() === v;
    if (tt === 'type') {
      const arr = Array.isArray(rec.type) ? rec.type : (rec.type ? [rec.type] : []);
      return arr.map(x => String(x).trim()).includes(v);
    }
    if (tt === 'sector') {
      const arr = Array.isArray(rec.sector) ? rec.sector : (rec.sector ? [rec.sector] : []);
      return arr.map(x => String(x).trim()).includes(v);
    }
    return true;
  }

  function rebuildHomeQueue() {
    if (state.homeFilterType && state.homeFilterValue) {
      state.loadQueue = buildFilteredQueue();
    } else {
      state.loadQueue = buildBatchQueue();
    }
    state.currentIndex = 0;
    state.finished = false;
    state.loading = false;
    state.liveCount = 0;
    state.dehydrated.clear();
  }

  /* ============================================================
     §12 布局
     ============================================================ */

  function computeColumnCount(innerWidth, gap) {
    const vw = window.innerWidth;
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    if (isPortrait && vw <= PHONE_PORTRAIT_MAX) return 2;
    let n = Math.floor((innerWidth + gap) / (MIN_COL + gap));
    n = Math.max(2, Math.min(n, MAX_COLS));
    if (!isPortrait && vw <= PHONE_LANDSCAPE_MAX) n = Math.max(3, n);
    return n;
  }

  function computeLoadConfig(cols, isPhonePortrait) {
    if (cols <= 3) return { chunksPerBatch: 1, rootMargin: isPhonePortrait ? 600 : 800 };
    return { chunksPerBatch: 2, rootMargin: 1000 };
  }

  function layoutCards(cards) {
    gallery.classList.add('js-ready');
    if (state.cardIO) { state.cardIO.disconnect(); state.cardIO = null; }
    gallery.innerHTML = '';
    state.columns = [];
    state.columnHeights = [];

    const style = getComputedStyle(gallery);
    const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    const gap = parseFloat(style.columnGap) || parseFloat(style.gap) || 16;
    let innerWidth = gallery.clientWidth - paddingX;
    if (!innerWidth || innerWidth <= 0) innerWidth = window.innerWidth - paddingX;
    if (!innerWidth || innerWidth <= 0) return false;

    const vw = window.innerWidth;
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const isPhonePortrait = isPortrait && vw <= PHONE_PORTRAIT_MAX;

    const count = computeColumnCount(innerWidth, gap);
    state.currentColCount = count;
    state.gap = gap;
    state.colWidth = (innerWidth - gap * (count - 1)) / count;

    for (let i = 0; i < count; i++) {
      const col = document.createElement('div');
      col.className = 'col';
      gallery.appendChild(col);
      state.columns.push(col);
      state.columnHeights.push(0);
    }

    cards.forEach(card => appendCardToColumn(card));

    const config = computeLoadConfig(count, isPhonePortrait);
    state.chunksPerBatch = config.chunksPerBatch;
    state.rootMargin = config.rootMargin;

    if (isGalleryView()) setupObserver();

    requestAnimationFrame(() => {
      for (let i = 0; i < state.columns.length; i++) {
        const h = state.columns[i].offsetHeight;
        if (h > 0) state.columnHeights[i] = h + state.gap;
      }
    });

    return true;
  }

  function setCards(cards) {
    state.cardQueue = cards.slice();
    state.dehydrated.clear();
    state.liveCount = state.cardQueue.reduce((n, c) => n + (c && c._img ? 1 : 0), 0);
    layoutCards(cards);
  }

  function appendCardToColumn(card) {
    if (!state.columns.length) {
      if (!layoutCards([]) || !state.columns.length) return;
    }
    const ratio = parseFloat(card.dataset.ratio) || 1;
    let minIdx = 0;
    for (let i = 1; i < state.columnHeights.length; i++) {
      if (state.columnHeights[i] < state.columnHeights[minIdx]) minIdx = i;
    }
    state.columns[minIdx].appendChild(card);
    card.dataset.colIndex = String(minIdx);
    state.columnHeights[minIdx] += state.colWidth * ratio + HEADER_EST + state.gap;

    if (!state.cardIO) setupCardObserver();
    state.cardIO.observe(card);
  }

  function removeCard(card) {
    if (!card || !card.isConnected) return;
    if (state.cardIO) state.cardIO.unobserve(card);
    const idx = state.cardQueue.indexOf(card);
    if (idx >= 0) state.cardQueue.splice(idx, 1);
    state.dehydrated.delete(card);
    if (card._img) { card._img = null; state.liveCount = Math.max(0, state.liveCount - 1); }

    const colIdx = parseInt(card.dataset.colIndex, 10);
    if (!Number.isNaN(colIdx) && state.columnHeights[colIdx] != null) {
      const realH = card.offsetHeight;
      if (realH > 0) {
        state.columnHeights[colIdx] = Math.max(0, state.columnHeights[colIdx] - (realH + state.gap));
      } else {
        const ratio = parseFloat(card.dataset.ratio) || 1;
        state.columnHeights[colIdx] = Math.max(
          0,
          state.columnHeights[colIdx] - (state.colWidth * ratio + HEADER_EST + state.gap)
        );
      }
    }
    card.remove();
  }

  /* ============================================================
     §13 卡片生命周期
     - 卡片：small → medium，两者都失败删卡，不碰 large / 原图
     ============================================================ */

  function createCard(item) {
    const record = item && item.record;
    if (!record) return null;
    const cover = item.cover || {};
    const image = cover.image || {};
    const coverIndex = cover.index || 0;
    if (!hasUsableImage(image)) return null;

    const article = document.createElement('article');
    article.className = 'card';
    article.dataset.id = record.id;
    article.setAttribute('tabindex', '0');
    article.setAttribute('aria-label', (record.title || t('card.viewDetails')) + t('card.openHint'));

    const w = parseInt(image.width, 10) || 2000;
    const h = parseInt(image.height, 10) || 1500;
    article.dataset.ratio = (h / w).toFixed(4);
    article._item = item;
    article._coverIndex = coverIndex;
    article._img = null;
    article._imgFailed = false;

    const imgWrap = document.createElement('div');
    imgWrap.className = 'card-img-wrap';
    imgWrap.style.setProperty('--ratio', (h / w) * 100 + '%');
    article._imgWrap = imgWrap;

    const body = document.createElement('div');
    body.className = 'card-body';

    const h2 = document.createElement('h2');
    const displayTitle = record.title || t('card.untitled');
    if (state.currentTerms && state.currentTerms.length) {
      h2.innerHTML = highlightHtml(displayTitle, state.currentTerms);
    } else {
      h2.textContent = displayTitle;
    }
    body.appendChild(h2);

    const meta = document.createElement('div');
    meta.className = 'card-meta';
    const sp1 = document.createElement('span');
    sp1.textContent = record.designer || t('card.unknownDesigner');
    sp1.title = sp1.textContent;
    const sp2 = document.createElement('span');
    sp2.textContent = record.year || '';
    meta.appendChild(sp1);
    meta.appendChild(sp2);
    body.appendChild(meta);

    article.appendChild(imgWrap);
    article.appendChild(body);

    materializeCard(article);
    if (article._imgFailed) return null;

    article.addEventListener('click', () => openLightbox(record, coverIndex));
    article.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openLightbox(record, coverIndex);
      }
    });
    return article;
  }

  /**
   * 卡片图片：small → medium，两次都失败删卡
   * - 不降级到 large / 原图（列表高并发，原图会拖垮带宽和解码内存）
   */
  function materializeCard(card) {
    if (!card || card._img || card._imgFailed) return;
    const item = card._item;
    if (!item) return;
    const image = (item.cover && item.cover.image) || {};

    const candidates = [];
    const add = (u) => { if (u && candidates.indexOf(u) === -1) candidates.push(u); };
    add(resolveUrl(image.small));
    add(resolveUrl(image.medium));

    if (!candidates.length) {
      card._imgFailed = true;
      removeCard(card);
      return;
    }

    const img = document.createElement('img');
    img.alt = item.record.title || t('card.image');
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onload = () => img.classList.add('loaded');

    let attempt = 0;
    img.onerror = () => {
      if (card._img && card._img !== img) return;
      attempt++;
      if (attempt < candidates.length) {
        img.src = candidates[attempt];
        return;
      }
      card._imgFailed = true;
      img.remove();
      if (card._img === img) card._img = null;
      state.liveCount = Math.max(0, state.liveCount - 1);
      removeCard(card);
    };

    img.src = candidates[0];
    if (img.complete && img.naturalWidth > 0) img.classList.add('loaded');

    card._imgWrap.appendChild(img);
    card._img = img;
    state.liveCount++;
    state.dehydrated.delete(card);
  }

  function dematerializeCard(card) {
    if (!card || !card._img) return;
    card._img.onload = null;
    card._img.onerror = null;
    card._img.removeAttribute('src');
    card._img.remove();
    card._img = null;
    state.liveCount = Math.max(0, state.liveCount - 1);
    state.dehydrated.add(card);
  }

  function setupCardObserver() {
    if (state.cardIO) return;
    state.cardIO = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const card = entry.target;
        if (entry.isIntersecting) materializeCard(card);
        else dematerializeCard(card);
      }
    }, { rootMargin: '800px 0px' });
  }

  /* ============================================================
     §14 分帧渲染
     ============================================================ */

  function renderItemsChunked(items, token) {
    return new Promise(resolve => {
      let i = 0, success = 0;
      const CHUNK = 10;
      if (!items.length) { resolve(0); return; }

      const finalize = () => {
        for (let c = 0; c < state.columns.length; c++) {
          const h = state.columns[c].offsetHeight;
          if (h > 0) state.columnHeights[c] = h + state.gap;
        }
        resolve(success);
      };

      const step = () => {
        if (token !== undefined && token !== state.searchToken) { resolve(0); return; }
        const end = Math.min(i + CHUNK, items.length);
        for (; i < end; i++) {
          const card = createCard(items[i]);
          if (!card) continue;
          state.cardQueue.push(card);
          appendCardToColumn(card);
          success++;
        }
        if (i < items.length) requestAnimationFrame(step);
        else requestAnimationFrame(finalize);
      };
      requestAnimationFrame(step);
    });
  }

  /* ============================================================
     §15 分批加载（统一管道）
     ============================================================ */

  async function loadNextBatch() {
    if (state.loading || state.finished) return;
    if (!isGalleryView()) return;

    const token = state.searchToken;

    if (state.view === 'all') {
      const remaining = state.loadQueue.length - state.currentIndex;
      if (remaining < AUTO_LOAD_THRESHOLD) appendNextBatch();
    }

    if (state.currentIndex >= state.loadQueue.length) {
      state.finished = true;
      updateResultStats();
      return;
    }

    state.loading = true;

    if (!state.columns.length) {
      if (!layoutCards([]) || !state.columns.length) {
        state.loading = false;
        setStatus(t('status.layoutFailed'));
        return;
      }
    }

    if (state.view === 'search' && token !== state.searchToken) { state.loading = false; return; }

    const batchSize = state.chunksPerBatch * CHUNK_SIZE;
    let nextItems;

    if (state.view === 'favorites') {
      const batch = state.loadQueue.slice(state.currentIndex, state.currentIndex + batchSize);
      nextItems = batch.filter(it => it && !it.skipped);
      state.currentIndex += batch.length;
    } else {
      nextItems = state.loadQueue.slice(state.currentIndex, state.currentIndex + batchSize);
      state.currentIndex += nextItems.length;
    }

    await renderItemsChunked(nextItems, token);
    if (state.view === 'search' && token !== state.searchToken) { state.loading = false; return; }
    state.loading = false;

    if (state.currentIndex >= state.loadQueue.length) {
      state.finished = true;
      updateResultStats();
      return;
    }

    if (!state.finished) requestAnimationFrame(checkSentinel);
  }

  function checkSentinel() {
    if (!isGalleryView()) return;
    if (state.finished || state.loading) return;
    const rect = sentinel.getBoundingClientRect();
    if (rect.top < window.innerHeight + state.rootMargin) loadNextBatch();
  }

  function setupObserver() {
    if (state.io && state.ioRootMargin === state.rootMargin) return;
    if (state.io) state.io.disconnect();
    state.ioRootMargin = state.rootMargin;
    state.io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) loadNextBatch();
    }, { rootMargin: state.rootMargin + 'px 0px' });
    state.io.observe(sentinel);
  }

  function clearGalleryForSearch() {
    if (state.cardIO) { state.cardIO.disconnect(); state.cardIO = null; }
    gallery.innerHTML = '';
    gallery.classList.remove('js-ready');
    state.columns = [];
    state.columnHeights = [];
    state.cardQueue = [];
    state.dehydrated.clear();
    state.liveCount = 0;
  }

  /* ============================================================
     §16 发现页 / 关于页
     ============================================================ */

  function enterDiscover(opts) {
    const restore = opts && opts.restore;
    if (state.view === 'discover') return;
    exitPageViews();
    closePill();
    if (!restore && state.view !== 'search') saveCurrentQueueState();
    if (state.view === 'search') resetSearchControls();
    teardownObserver();
    state.view = 'discover';
    document.body.classList.add('view-discover');
    const dv = document.getElementById('discoverView');
    dv.hidden = false;
    if (!state.discoverRendered) {
      renderDiscover();
      state.discoverRendered = true;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    syncUrl();
  }

  function renderDiscover() {
    const total = state.allProjects.length;
    const designerMap = new Map();
    const countryMap = new Map();
    const typeMap = new Map();
    const sectorMap = new Map();

    state.allProjects.forEach(rec => {
      if (rec.designer) {
        const n = String(rec.designer).trim();
        if (n) designerMap.set(n, (designerMap.get(n) || 0) + 1);
      }
      const c = String(rec.nationalGroup || '').trim();
      if (c) countryMap.set(c, (countryMap.get(c) || 0) + 1);

      const types = Array.isArray(rec.type) ? rec.type : (rec.type ? [rec.type] : []);
      types.forEach(x => {
        const v = String(x || '').trim();
        if (v) typeMap.set(v, (typeMap.get(v) || 0) + 1);
      });

      const sectors = Array.isArray(rec.sector) ? rec.sector : (rec.sector ? [rec.sector] : []);
      sectors.forEach(x => {
        const v = String(x || '').trim();
        if (v) sectorMap.set(v, (sectorMap.get(v) || 0) + 1);
      });
    });

    document.getElementById('discoverStats').textContent = t('discover.stats', {
      total,
      designers: designerMap.size,
      countries: countryMap.size,
      types: typeMap.size,
      sectors: sectorMap.size
    });

    renderChips('discoverCountryChips', countryMap, 'country', (a, b) => a.localeCompare(b, 'en'));
    renderChips('discoverTypeChips', typeMap, 'type', (a, b) => a.localeCompare(b, 'zh'));
    renderChips('discoverSectorChips', sectorMap, 'sector', (a, b) => a.localeCompare(b, 'zh'));

    const groups = new Map();
    [...designerMap.entries()].forEach(([name, count]) => {
      const first = name.charAt(0).toUpperCase();
      const letter = /[A-Z]/.test(first) ? first : '#';
      if (!groups.has(letter)) groups.set(letter, []);
      groups.get(letter).push({ name, count });
    });
    const letters = [...groups.keys()].sort();

    const az = document.getElementById('designerAZ');
    az.innerHTML = '';

    const nav = document.createElement('div');
    nav.className = 'az-letters';
    letters.forEach(L => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = L;
      btn.addEventListener('click', () => {
        const target = az.querySelector(`[data-letter="${L}"]`);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      nav.appendChild(btn);
    });
    az.appendChild(nav);

    let li = 0;
    const step = () => {
      const end = Math.min(li + 3, letters.length);
      for (; li < end; li++) {
        const L = letters[li];
        const sec = document.createElement('section');
        sec.className = 'az-group';
        sec.dataset.letter = L;
        const h = document.createElement('h3');
        h.textContent = L;
        sec.appendChild(h);
        const list = document.createElement('div');
        list.className = 'az-list';
        groups.get(L).sort((a, b) => a.name.localeCompare(b.name)).forEach(d => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'az-item';
          const nameEl = document.createElement('span');
          nameEl.className = 'az-name';
          nameEl.textContent = d.name;
          const countEl = document.createElement('span');
          countEl.className = 'az-count';
          countEl.textContent = d.count;
          btn.appendChild(nameEl);
          btn.appendChild(countEl);
          btn.addEventListener('click', () => showFilterInHome('designer', d.name));
          list.appendChild(btn);
        });
        sec.appendChild(list);
        az.appendChild(sec);
      }
      if (li < letters.length) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderChips(containerId, map, filterType, sorter) {
    const wrap = document.getElementById(containerId);
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!map.size) {
      wrap.textContent = t('discover.noData');
      return;
    }
    [...map.entries()].sort((a, b) => sorter(a[0], b[0])).forEach(([name, count]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'discover-chip';
      const nameEl = document.createElement('span');
      nameEl.textContent = name;
      const countEl = document.createElement('span');
      countEl.className = 'discover-chip-count';
      countEl.textContent = count;
      btn.appendChild(nameEl);
      btn.appendChild(countEl);
      btn.addEventListener('click', () => showFilterInHome(filterType, name));
      wrap.appendChild(btn);
    });
  }

  function enterAbout(opts) {
    const restore = opts && opts.restore;
    if (state.view === 'about') return;
    exitPageViews();
    closePill();
    if (!restore && state.view !== 'search') saveCurrentQueueState();
    if (state.view === 'search') resetSearchControls();
    teardownObserver();
    state.view = 'about';
    document.body.classList.add('view-about');
    const av = document.getElementById('aboutView');
    av.hidden = false;
    renderAbout();
    window.scrollTo({ top: 0, behavior: 'auto' });
    syncUrl();
  }

  function computeAboutStats() {
    const total = state.allProjects.length;
    const designers = new Set();
    const countries = new Set();
    let minY = Infinity, maxY = -Infinity;
    state.allProjects.forEach(rec => {
      if (rec.designer) designers.add(String(rec.designer).trim());
      if (rec.nationalGroup) countries.add(String(rec.nationalGroup).trim());
      const y = parseInt(rec.year, 10);
      if (!isNaN(y)) { if (y < minY) minY = y; if (y > maxY) maxY = y; }
    });
    const span = (minY !== Infinity && maxY !== -Infinity) ? `${minY}–${maxY}` : '-';
    state.aboutStats = t('about.stats', {
      total,
      designers: designers.size,
      countries: countries.size,
      span
    });
  }

  function renderAbout() {
    document.getElementById('aboutStats').textContent = state.aboutStats || t('about.statsComputing');
  }

  /* ============================================================
     §17 搜索
     ============================================================ */

  function resetSearchControls() {
    document.body.classList.remove('searching');
    clearTimeout(state.searchTimer);
    searchInput.value = '';
    updateSearchClear();
    filterYear.value = '';
    filterType.value = '';
    filterCountry.value = '';
    state.currentTerms = [];
    state.searchResults = [];
    state.searchTotal = 0;
  }

  function enterSearch(preset) {
    if (state.view === 'search') return;
    exitPageViews();
    closePill();
    saveCurrentQueueState();
    state.view = 'search';
    state.currentTerms = [];
    state.searchResults = [];
    state.searchTotal = 0;
    state.loadQueue = [];
    state.currentIndex = 0;
    state.finished = false;
    document.body.classList.add('searching');
    clearGalleryForSearch();
    setStatus(t('status.searchHint'));
    searchInput.value = '';
    updateSearchClear();
    filterYear.value = '';
    filterType.value = '';
    filterCountry.value = '';

    if (preset) {
      if (preset.year) filterYear.value = preset.year;
      if (preset.type) filterType.value = preset.type;
      if (preset.country) filterCountry.value = preset.country;
      if (preset.q) {
        searchInput.value = preset.q;
        updateSearchClear();
      }
    }

    if (!preset || preset.focus !== false) searchInput.focus({ preventScroll: true });
    syncUrl();

    if (preset && (preset.q || preset.year || preset.type || preset.country)) {
      doSearch(preset.q || '');
    }
  }

  function exitSearch() {
    if (state.view !== 'search') return;
    resetSearchControls();
    state.loadQueue = [];
    state.currentIndex = 0;
    state.finished = false;
    clearGalleryForSearch();

    const prevView = state.savedQueueState ? state.savedQueueState.view : 'all';

    if (prevView === 'favorites') {
      state.savedQueueState = null;
      state.view = 'all';
      syncUrl();
      enterFavorites({ restore: true });
      return;
    }
    if (prevView === 'discover') {
      state.savedQueueState = null;
      state.view = 'all';
      syncUrl();
      enterDiscover({ restore: true });
      return;
    }
    if (prevView === 'about') {
      state.savedQueueState = null;
      state.view = 'all';
      syncUrl();
      enterAbout({ restore: true });
      return;
    }

    state.view = 'all';
    if (!restoreSavedQueueState()) {
      rebuildHomeQueue();
      setStatus('');
      setupObserver();
      requestAnimationFrame(() => loadNextBatch());
    } else {
      setupObserver();
      requestAnimationFrame(checkSentinel);
    }
    state.savedQueueState = null;
    syncUrl();
  }

  function lookupInverted(term) {
    if (!/^[a-z0-9]+$/.test(term) || term.length < 2) return null;
    return state.inverted.get(term) || null;
  }

  function doSearch(keyword) {
    const token = ++state.searchToken;
    const q = (keyword || '').trim().toLowerCase();
    const yearFilter = filterYear.value;
    const typeFilter = filterType.value;
    const countryFilter = filterCountry.value;
    const hasQuery = q.length > 0;
    const hasFilter = !!yearFilter || !!typeFilter || !!countryFilter;

    state.currentTerms = hasQuery ? q.split(/\s+/).filter(Boolean) : [];

    if (!hasQuery && !hasFilter) {
      clearGalleryForSearch();
      state.loadQueue = [];
      state.currentIndex = 0;
      state.finished = false;
      state.searchResults = [];
      state.searchTotal = 0;
      setStatus(t('status.searchHint'));
      syncUrl('replace');
      return;
    }

    const terms = state.currentTerms;
    let candidates = null;
    if (terms.length) {
      const lists = [];
      let allIndexed = true;
      for (const term of terms) {
        const inv = lookupInverted(term);
        if (!inv) { allIndexed = false; break; }
        lists.push(inv);
      }
      if (allIndexed && lists.length) {
        lists.sort((a, b) => a.length - b.length);
        candidates = lists[0].slice();
        for (let i = 1; i < lists.length && candidates.length; i++) {
          candidates = filterBySet(candidates, lists[i]);
        }
      }
    }

    const matched = [];
    const testRecord = (i) => {
      const item = state.searchIndex[i];
      if (!item) return;
      const rec = item.record;
      if (terms.length) {
        const hay = item.haystack;
        for (let ti = 0; ti < terms.length; ti++) if (hay.indexOf(terms[ti]) === -1) return;
      }
      if (yearFilter && String(rec.year || '').trim() !== yearFilter) return;
      if (typeFilter) {
        const tt = Array.isArray(rec.type) ? rec.type : (rec.type ? [rec.type] : []);
        if (!tt.map(x => String(x).trim()).includes(typeFilter)) return;
      }
      if (countryFilter && String(rec.nationalGroup || '').trim() !== countryFilter) return;
      matched.push(rec);
    };

    if (candidates) {
      for (let i = 0; i < candidates.length; i++) testRecord(candidates[i]);
    } else {
      for (let i = 0; i < state.searchIndex.length; i++) testRecord(i);
    }

    const items = [];
    matched.forEach(rec => {
      const cover = findCoverImage(rec);
      if (!cover) return;
      items.push({ record: rec, cover });
    });

    state.searchResults = matched;
    state.searchTotal = matched.length;
    state.searchDesc = [q, yearFilter, typeFilter, countryFilter].filter(Boolean).join(' · ');
    state.loadQueue = items;
    state.currentIndex = 0;
    state.finished = false;

    clearGalleryForSearch();
    syncUrl('replace');

    if (!items.length) {
      setStatus(matched.length ? t('status.noMatchNoImage', { total: matched.length }) : t('status.noMatch'));
      state.finished = true;
      return;
    }

    setStatus('');
    requestAnimationFrame(() => loadNextBatch());
  }

  /* ============================================================
     §18 收藏页
     ============================================================ */

  function enterFavorites(opts) {
    const restore = opts && opts.restore;
    if (state.view === 'favorites') return;
    closePill();
    exitPageViews();
    if (!restore && state.view !== 'search') saveCurrentQueueState();
    if (state.view === 'search') resetSearchControls();
    teardownObserver();
    state.view = 'favorites';
    state.currentTerms = [];

    const items = [];
    state.favorites.forEach(id => {
      const rec = state.recordById.get(String(id));
      if (!rec) return;
      const cover = findCoverImage(rec);
      if (!cover) return;
      items.push({ record: rec, cover });
    });

    state.loadQueue = items;
    state.currentIndex = 0;
    state.finished = false;

    syncUrl();
    clearGalleryForSearch();

    if (!items.length) {
      setStatus(t('favorites.empty'));
      state.finished = true;
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    setStatus('');
    requestAnimationFrame(() => loadNextBatch());
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ============================================================
     §19 首页过滤（发现页 / 设计师 A-Z 点击）
     ============================================================ */

  function showFilterInHome(type, value) {
    const v = String(value || '').trim();
    if (!type || !v) return;

    exitPageViews();
    closePill();
    resetSearchControls();
    teardownObserver();
    state.savedQueueState = null;

    state.view = 'all';
    state.homeFilterType = type;
    state.homeFilterValue = v;
    rebuildHomeQueue();
    clearGalleryForSearch();
    syncUrl();

    if (!state.loadQueue.length) {
      state.finished = true;
      const labelKey = 'filterLabel.' + type;
      let label = t(labelKey);
      if (label === labelKey) label = type;
      setStatus(t('status.noFilterResult', { label, value: v }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setStatus('');
    setupObserver();
    requestAnimationFrame(() => loadNextBatch());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ============================================================
     §20 首页 / 重置
     ============================================================ */

  function goHome() {
    closePill();
    exitPageViews();
    if (state.view === 'search') { exitSearch(); return; }
    teardownObserver();

    if (state.view === 'discover' || state.view === 'about') {
      state.view = 'all';
      document.body.classList.remove('searching');
      state.savedQueueState = null;
      rebuildHomeQueue();
      clearGalleryForSearch();
      setStatus('');
      setupObserver();
      requestAnimationFrame(() => loadNextBatch());
      syncUrl();
      return;
    }
    if (state.view === 'favorites') {
      state.view = 'all';
      state.currentTerms = [];
      state.savedQueueState = null;
      rebuildHomeQueue();
      clearGalleryForSearch();
      setStatus('');
      syncUrl();
      setupObserver();
      requestAnimationFrame(() => loadNextBatch());
    }
  }

  function resetToHome() {
    closePill();
    exitPageViews();
    resetSearchControls();
    teardownObserver();
    state.savedQueueState = null;
    state.homeFilterType = '';
    state.homeFilterValue = '';
    state.view = 'all';
    rebuildHomeQueue();
    clearGalleryForSearch();
    syncUrl();

    if (!state.loadQueue.length) {
      state.finished = true;
      setStatus(t('status.noImage'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setStatus('');
    setupObserver();
    requestAnimationFrame(() => loadNextBatch());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ============================================================
     §21 响应式重排
     ============================================================ */

  let resizeTimer;
  function scheduleRelayout() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!isGalleryView()) return;
      const style = getComputedStyle(gallery);
      const paddingX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
      const gap = parseFloat(style.columnGap) || parseFloat(style.gap) || 16;
      let innerWidth = gallery.clientWidth - paddingX;
      if (!innerWidth || innerWidth <= 0) innerWidth = window.innerWidth - paddingX;
      const newColCount = computeColumnCount(innerWidth, gap);
      if (newColCount === state.currentColCount) return;
      const cards = state.cardQueue.slice();
      if (!cards.length) return;
      layoutCards(cards);
      if (!state.finished && !state.loading) requestAnimationFrame(checkSentinel);
    }, 200);
  }

  /* ============================================================
     §22 药丸菜单
     ============================================================ */

  let pillAutoCloseTimer = null;

  function openPill() {
    document.body.classList.add('pill-open');
    pillMenu.setAttribute('aria-hidden', 'false');
    clearTimeout(pillAutoCloseTimer);
    pillAutoCloseTimer = setTimeout(() => closePill(), PILL_AUTO_CLOSE_MS);
  }
  function closePill() {
    document.body.classList.remove('pill-open');
    pillMenu.setAttribute('aria-hidden', 'true');
    clearTimeout(pillAutoCloseTimer);
    pillAutoCloseTimer = null;
  }
  function togglePill() {
    if (document.body.classList.contains('pill-open')) closePill();
    else openPill();
  }

  /* ============================================================
     §23 灯箱
     ============================================================ */

  function setBackgroundInert(on) {
    const els = [
      document.querySelector('.topbar'),
      document.querySelector('.search-filter-bar'),
      document.querySelector('.pill-menu'),
      gallery, statusEl,
      document.getElementById('discoverView'),
      document.getElementById('aboutView')
    ];
    els.forEach(el => {
      if (!el) return;
      if (on) {
        el.setAttribute('aria-hidden', 'true');
        try { el.setAttribute('inert', ''); } catch (_) {}
      } else {
        el.removeAttribute('aria-hidden');
        try { el.removeAttribute('inert'); } catch (_) {}
      }
    });
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const nodes = lightbox.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    const list = [...nodes].filter(el => el.offsetParent !== null && !el.disabled);
    if (!list.length) return;
    const first = list[0], last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /**
   * 灯箱图片：large → medium → 原图，全部失败隐藏并跳过计数
   * - 不用 small（灯箱要看清晰度）
   */
  function loadLbImage(entry) {
    if (!entry || entry.loaded) return;
    entry.loaded = true;

    const candidates = [];
    const add = (u) => { if (u && candidates.indexOf(u) === -1) candidates.push(u); };
    add(resolveUrl(entry.data.large));
    add(resolveUrl(entry.data.medium));
    add(resolveUrl(entry.data.url));

    if (!candidates.length) {
      entry.failed = true;
      entry.wrap.style.display = 'none';
      return;
    }

    let attempt = 0;
    entry.img.onerror = () => {
      attempt++;
      if (attempt < candidates.length) {
        entry.img.src = candidates[attempt];
        return;
      }
      entry.failed = true;
      entry.wrap.style.display = 'none';
    };

    entry.img.src = candidates[0];
  }

  function setupLbLazyLoad() {
    if (state.lbIO) state.lbIO.disconnect();
    state.lbIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const idx = state.lbImages.findIndex(x => x.wrap === e.target);
        if (idx >= 0) loadLbImage(state.lbImages[idx]);
        state.lbIO.unobserve(e.target);
      });
    }, { root: lightbox, rootMargin: '600px 0px' });
    state.lbImages.forEach(entry => {
      if (!entry.loaded && !entry.failed) state.lbIO.observe(entry.wrap);
    });
  }

  function updateLbCount() {
    const valid = state.lbImages.filter(e => !e.failed);
    const n = valid.length;
    const cur = valid.indexOf(state.lbImages[state.lbIndex]);
    lbCount.textContent = n ? `${(cur >= 0 ? cur : 0) + 1} / ${n}` : '';
  }

  function scrollToLightboxImage(index, smooth) {
    const entry = state.lbImages[index];
    if (!entry) { lightbox.scrollTop = 0; return; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const rect = entry.wrap.getBoundingClientRect();
    const lbRect = lightbox.getBoundingClientRect();
    const top = lightbox.scrollTop + (rect.top - lbRect.top) - 8;
    lightbox.scrollTo({ top: Math.max(0, top), behavior: (smooth && !reduced) ? 'smooth' : 'auto' });
  }

  function syncLbIndexFromScroll() {
    if (!state.lbImages.length) return;
    const lbTop = lightbox.getBoundingClientRect().top;
    let best = 0, bestD = Infinity;
    state.lbImages.forEach((e, i) => {
      if (e.failed) return;
      const r = e.wrap.getBoundingClientRect();
      const d = Math.abs(r.top - lbTop - 8);
      if (d < bestD) { bestD = d; best = i; }
    });
    if (best !== state.lbIndex) {
      state.lbIndex = best;
      updateLbCount();
    }
  }

  function attachZoom(wrap, img) {
    const MIN = 1, MAX = 4;
    let scale = 1, tx = 0, ty = 0;
    const pointers = new Map();
    let pinchStartDist = 0, pinchStartScale = 1;
    let panStart = null;
    let lastTap = 0;

    function clampPan() {
      const maxX = Math.max(0, (wrap.clientWidth * (scale - 1)) / 2);
      const maxY = Math.max(0, (wrap.clientHeight * (scale - 1)) / 2);
      tx = Math.max(-maxX, Math.min(maxX, tx));
      ty = Math.max(-maxY, Math.min(maxY, ty));
    }
    function apply() {
      if (scale <= 1.001) { scale = 1; tx = 0; ty = 0; }
      img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${scale})`;
      img.style.cursor = scale > 1 ? 'grab' : 'zoom-in';
      wrap.style.touchAction = scale > 1 ? 'none' : 'manipulation';
    }

    wrap.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (scale > 1 || pointers.size >= 2) {
        try { wrap.setPointerCapture(e.pointerId); } catch (_) {}
      }
      if (pointers.size === 1) {
        panStart = { x: e.clientX - tx, y: e.clientY - ty };
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStartDist = Math.hypot(a.x - b.x, a.y - b.y);
        pinchStartScale = scale;
        panStart = null;
        lastTap = 0;               // 双指开始，取消双击识别
        wrap.style.touchAction = 'none';
      }
    });

    wrap.addEventListener('contextmenu', () => {
      pointers.clear();
      pinchStartDist = 0;
      panStart = null;
    });

    wrap.addEventListener('lostpointercapture', e => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) panStart = null;
      if (pointers.size < 2) pinchStartDist = 0;
    });

    wrap.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchStartDist > 0) {
          scale = Math.max(MIN, Math.min(MAX, pinchStartScale * (d / pinchStartDist)));
          clampPan();
          apply();
        }
        e.preventDefault();
      } else if (pointers.size === 1 && panStart && scale > 1) {
        const nx = e.clientX - panStart.x;
        const ny = e.clientY - panStart.y;
        if (Math.abs(nx - tx) > 3 || Math.abs(ny - ty) > 3) {
          tx = nx;
          ty = ny;
          clampPan();
          apply();
          e.preventDefault();
        }
      }
    });

    function endPointer(e) {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinchStartDist = 0;
      if (pointers.size === 0) {
        panStart = null;
        const now = Date.now();
        if (now - lastTap < 300) {
          scale = scale > 1 ? 1 : 2.5;
          if (scale === 1) { tx = 0; ty = 0; }
          clampPan();
          apply();
        }
        lastTap = now;
      }
    }
    wrap.addEventListener('pointerup', endPointer);
    wrap.addEventListener('pointercancel', endPointer);
    apply();
  }

  function openLightbox(record, coverIndex) {
    state.currentLightboxId = String(record.id);
    state.lastFocus = document.activeElement;

    lbGallery.innerHTML = '';
    state.lbImages = [];
    if (state.lbIO) { state.lbIO.disconnect(); state.lbIO = null; }

    const images = Array.isArray(record.images) ? record.images : [];
    images.forEach((imgData, i) => {
      if (!hasUsableImage(imgData)) return;
      const e = expandImage(imgData);
      if (!hasUsableImage(e)) return;

      const wrap = document.createElement('div');
      wrap.className = 'lb-img-wrap';
      wrap.style.position = 'relative';
      wrap.style.width = '100%';
      wrap.style.overflow = 'hidden';
      wrap.style.background = 'var(--img-bg)';
      wrap.style.touchAction = 'manipulation';
      wrap.style.flex = '0 0 auto';

      const img = document.createElement('img');
      img.alt = record.title || t('card.image');
      img.decoding = 'async';
      img.dataset.srcIndex = String(i);
      img.dataset.fallback = '';
      img.style.transformOrigin = 'center center';
      img.style.willChange = 'transform';
      img.style.display = 'block';
      img.style.width = '100%';
      img.style.height = 'auto';

      wrap.appendChild(img);
      lbGallery.appendChild(wrap);

      const entry = { wrap, img, index: i, loaded: false, failed: false, data: e };
      state.lbImages.push(entry);
      attachZoom(wrap, img);
    });

    const startIdx = state.lbImages.findIndex(e => e.index === (parseInt(coverIndex, 10) || 0));
    state.lbIndex = startIdx >= 0 ? startIdx : 0;
    const preloadIdx = [state.lbIndex - 1, state.lbIndex, state.lbIndex + 1]
      .filter(i => i >= 0 && i < state.lbImages.length);
    preloadIdx.forEach(i => loadLbImage(state.lbImages[i]));
    setupLbLazyLoad();
    updateLbCount();

    const favActive = state.favorites.has(String(record.id));
    lbFav.classList.toggle('active', favActive);
    lbFav.setAttribute('aria-pressed', favActive ? 'true' : 'false');

    lbTitle.textContent = record.title || t('lightbox.untitled');

    const parts = [];
    if (record.designer) parts.push(record.designer);
    const country = String(record.nationalGroup || '').trim();
    if (country) parts.push(country);
    const yb = String(record.yearOfBirth || '').trim();
    if (yb) parts.push(`b. ${yb}`);
    lbDesigner.textContent = parts.length
      ? (t('lightbox.designerLabel') + ' ' + parts.join(' · '))
      : t('lightbox.designerUnknown');

    const types = Array.isArray(record.type) ? record.type.join(', ') : (record.type || '-');
    const sectors = Array.isArray(record.sector) ? record.sector.join(', ') : (record.sector || '-');

    lbMetaGrid.innerHTML = '';
    const addMeta = (label, value) => {
      const item = document.createElement('div'); item.className = 'lb-meta-item';
      const l = document.createElement('span'); l.className = 'lb-meta-label'; l.textContent = label;
      const v = document.createElement('span'); v.className = 'lb-meta-value'; v.textContent = value;
      item.appendChild(l); item.appendChild(v); lbMetaGrid.appendChild(item);
    };
    addMeta(t('lightbox.year'), record.year || '-');
    addMeta(t('lightbox.client'), record.client || '-');
    addMeta(t('lightbox.type'), types);
    addMeta(t('lightbox.sector'), sectors);

    lbDetails.innerHTML = '';
    const detailsText = Array.isArray(record.details) ? record.details.join(', ') : (record.details || '');
    lbDetails.textContent = detailsText ? (t('lightbox.detailsPrefix') + detailsText) : '';

    lbTags.innerHTML = '';
    const tags = Array.isArray(record.tags) ? record.tags.filter(Boolean) : [];
    tags.forEach(tg => {
      const span = document.createElement('span');
      span.className = 'lb-tag';
      span.textContent = String(tg);
      lbTags.appendChild(span);
    });

    lightbox.classList.add('open');
    document.body.classList.add('lightbox-open');
    lightbox.scrollTop = 0;
    setBackgroundInert(true);

    requestAnimationFrame(() => {
      scrollToLightboxImage(state.lbIndex, false);
      const closeBtn = lightbox.querySelector('.lightbox-close');
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    });
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.classList.remove('lightbox-open');
    state.currentLightboxId = '';
    if (state.lbIO) { state.lbIO.disconnect(); state.lbIO = null; }
    setBackgroundInert(false);
    const prev = state.lastFocus;
    state.lastFocus = null;
    if (prev && typeof prev.focus === 'function' && document.contains(prev)) {
      try { prev.focus({ preventScroll: true }); } catch (_) {}
    }
  }

  /* ============================================================
     §24 初始化数据
     ============================================================ */

  async function initData() {
    if (state.initInFlight) return;
    state.initInFlight = true;
    try {
      setStatus(tPreparing());
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);

      const text = await res.text();
      await new Promise(r => setTimeout(r, 30));

      const json = JSON.parse(text);
      if (Array.isArray(json)) {
        state.allProjects = json;
      } else if (json && Array.isArray(json.projects)) {
        state.allProjects = json.projects;
      } else if (json && typeof json === 'object') {
        state.allProjects = Object.values(json).filter(v => v && typeof v === 'object' && v.id != null);
      } else {
        state.allProjects = [];
      }

      state.recordById = new Map();
      state.allProjects.forEach(rec => {
        if (rec && rec.id != null) state.recordById.set(String(rec.id), rec);
      });

      await buildSearchIndexChunked();
      computeAboutStats();
      rebuildFilters();

      const params = new URLSearchParams(location.search);
      const hasUrlParams = params.get('hf') || params.get('view') || params.get('q')
                        || params.get('year') || params.get('type')
                        || params.get('country');

      setStatus('');

      if (!hasUrlParams) {
        rebuildHomeQueue();
        if (!state.loadQueue.length) {
          setStatus(t('status.noImage'));
          return;
        }
        requestAnimationFrame(() => loadNextBatch());
      }
    } catch (err) {
      console.error(err);
      setStatus('');
      if (location.protocol === 'file:') {
        statusEl.append(t('status.loadFailedFile'));
      } else {
        statusEl.append(t('status.loadFailed', {
          msg: (err && err.message ? err.message : err)
        }));
      }
      const btn = document.createElement('button');
      btn.className = 'load-more-btn';
      btn.style.cssText = 'margin-left:8px;padding:4px 14px;font-size:13px;';
      btn.textContent = t('status.retry');
      btn.addEventListener('click', () => { setStatus(t('status.retrying')); initData(); });
      statusEl.appendChild(btn);
    } finally {
      state.initInFlight = false;
    }
  }

  async function buildSearchIndexChunked() {
    const total = state.allProjects.length;
    state.searchIndex = new Array(total);
    state.inverted = new Map();
    const CHUNK = 800;
    for (let i = 0; i < total; i += CHUNK) {
      const end = Math.min(i + CHUNK, total);
      for (let j = i; j < end; j++) {
        const rec = state.allProjects[j] || {};
        const types = Array.isArray(rec.type) ? rec.type.join(' ') : (rec.type || '');
        const details = Array.isArray(rec.details) ? rec.details.join(' ') : (rec.details || '');
        const sectors = Array.isArray(rec.sector) ? rec.sector.join(' ') : (rec.sector || '');
        const tags = Array.isArray(rec.tags) ? rec.tags.join(' ') : '';
        const haystack = [
          rec.title || '', rec.designer || '', rec.client || '', rec.year || '',
          rec.nationalGroup || '', details, sectors, types, tags
        ].join(' ').toLowerCase();
        state.searchIndex[j] = { id: rec.id, haystack, record: rec };

        const seen = new Set();
        const tokens = haystack.split(TOKEN_SPLIT_RE);
        for (let k = 0; k < tokens.length; k++) {
          const tk = tokens[k];
          if (!tk || tk.length < 2 || tk.length > 48 || seen.has(tk)) continue;
          seen.add(tk);
          let arr = state.inverted.get(tk);
          if (!arr) { arr = []; state.inverted.set(tk, arr); }
          arr.push(j);
        }
      }
      await new Promise(r => setTimeout(r, 0));
    }
  }

  function rebuildFilters() {
    const prevYear = filterYear.value;
    const prevType = filterType.value;
    const prevCountry = filterCountry.value;
    filterYear.innerHTML = '';
    filterType.innerHTML = '';
    filterCountry.innerHTML = '';

    const o1 = document.createElement('option');
    o1.value = ''; o1.textContent = t('filter.allYears'); filterYear.appendChild(o1);
    const o2 = document.createElement('option');
    o2.value = ''; o2.textContent = t('filter.allCountries'); filterCountry.appendChild(o2);
    const o3 = document.createElement('option');
    o3.value = ''; o3.textContent = t('filter.allTypes'); filterType.appendChild(o3);

    const years = new Set(), types = new Set(), countries = new Set();
    state.allProjects.forEach(rec => {
      if (rec.year) years.add(String(rec.year).trim());
      const t2 = Array.isArray(rec.type) ? rec.type : (rec.type ? [rec.type] : []);
      t2.forEach(x => { if (x && String(x).trim()) types.add(String(x).trim()); });
      if (rec.nationalGroup) {
        const c = String(rec.nationalGroup).trim();
        if (c) countries.add(c);
      }
    });
    [...years].sort((a, b) => String(b).localeCompare(String(a), 'zh')).forEach(y => {
      const o = document.createElement('option'); o.value = y; o.textContent = y; filterYear.appendChild(o);
    });
    [...types].sort((a, b) => String(a).localeCompare(String(b), 'zh')).forEach(tt => {
      const o = document.createElement('option'); o.value = tt; o.textContent = tt; filterType.appendChild(o);
    });
    [...countries].sort((a, b) => String(a).localeCompare(String(b), 'en')).forEach(c => {
      const o = document.createElement('option'); o.value = c; o.textContent = c; filterCountry.appendChild(o);
    });
    if (prevYear && years.has(prevYear)) filterYear.value = prevYear;
    if (prevType && types.has(prevType)) filterType.value = prevType;
    if (prevCountry && countries.has(prevCountry)) filterCountry.value = prevCountry;
  }

  /* ============================================================
     §25 URL 同步与后退
     ============================================================ */

  let navigatingFromHistory = false;

  function syncUrl(mode) {
    if (navigatingFromHistory) return;

    const params = new URLSearchParams();
    if (state.view === 'search') {
      const q = searchInput.value.trim();
      if (q) params.set('q', q);
      if (filterYear.value) params.set('year', filterYear.value);
      if (filterType.value) params.set('type', filterType.value);
      if (filterCountry.value) params.set('country', filterCountry.value);
    } else if (state.view === 'favorites') {
      params.set('view', 'favorites');
    } else if (state.view === 'discover') {
      params.set('view', 'discover');
    } else if (state.view === 'about') {
      params.set('view', 'about');
    } else if (state.view === 'all' && state.homeFilterType && state.homeFilterValue) {
      params.set('hf', `${state.homeFilterType}:${state.homeFilterValue}`);
    }
    const qs = params.toString();
    const url = location.pathname + (qs ? '?' + qs : '') + location.hash;
    const cur = location.pathname + location.search + location.hash;

    try {
      if (mode === 'replace' || url === cur) {
        history.replaceState(null, '', url);
      } else {
        history.pushState(null, '', url);
      }
    } catch (e) {}
  }

  function restoreFromUrl() {
    if (state.allProjects.length === 0) return;

    const params = new URLSearchParams(location.search);
    const view = params.get('view');
    const q = params.get('q'), year = params.get('year'), type = params.get('type');
    const country = params.get('country');
    const hf = params.get('hf');

    if (view === 'favorites') { enterFavorites({ restore: true }); return; }
    if (view === 'discover') { enterDiscover({ restore: true }); return; }
    if (view === 'about') { enterAbout({ restore: true }); return; }

    if (hf && !view) {
      const idx = hf.indexOf(':');
      if (idx > 0) {
        const ft = hf.slice(0, idx);
        const fv = hf.slice(idx + 1);
        if (ft && fv) {
          exitPageViews();
          closePill();
          resetSearchControls();
          teardownObserver();
          state.savedQueueState = null;
          state.view = 'all';
          state.homeFilterType = ft;
          state.homeFilterValue = fv;
          rebuildHomeQueue();
          clearGalleryForSearch();
          if (!state.loadQueue.length) {
            state.finished = true;
            const labelKey = 'filterLabel.' + ft;
            let label = t(labelKey);
            if (label === labelKey) label = ft;
            setStatus(t('status.noFilterResult', { label, value: fv }));
          } else {
            setupObserver();
            requestAnimationFrame(() => loadNextBatch());
          }
          return;
        }
      }
    }

    if (q || year || type || country) {
      enterSearch({ focus: false });
      if (year) filterYear.value = year;
      if (type) filterType.value = type;
      if (country) filterCountry.value = country;
      searchInput.value = q || '';
      updateSearchClear();
      doSearch(q || '');
    }
  }

  /* ============================================================
     §26 主题
     ============================================================ */

  let themeManual = false;

  function syncThemeAria() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
  }

  function initThemeState() {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') themeManual = true;
    } catch (e) {}
    syncThemeAria();
  }

  const colorSchemeMQ = window.matchMedia('(prefers-color-scheme: dark)');
  const onSystemThemeChange = (e) => {
    if (themeManual) return;
    const next = e.matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', next);
    syncThemeAria();
  };
  if (colorSchemeMQ.addEventListener) colorSchemeMQ.addEventListener('change', onSystemThemeChange);
  else if (colorSchemeMQ.addListener) colorSchemeMQ.addListener(onSystemThemeChange);

  /* ============================================================
     §27 事件绑定
     ============================================================ */

  lbFav.addEventListener('click', e => {
    e.stopPropagation();
    if (!state.currentLightboxId) return;
    toggleFavorite(state.currentLightboxId);
  });

  lightbox.addEventListener('scroll', () => {
    clearTimeout(state.scrollSyncTimer);
    state.scrollSyncTimer = setTimeout(syncLbIndexFromScroll, 120);
  }, { passive: true });

  searchBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (state.view === 'search') exitSearch(); else enterSearch();
  });

  let isComposing = false;
  searchInput.addEventListener('compositionstart', () => { isComposing = true; });
  searchInput.addEventListener('compositionend', () => {
    isComposing = false;
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => { if (state.view === 'search') doSearch(searchInput.value); }, 300);
  });
  searchInput.addEventListener('input', () => {
    updateSearchClear();
    if (isComposing) return;
    clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => { if (state.view === 'search') doSearch(searchInput.value); }, 300);
  });

  searchInput.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); exitSearch(); }
    if (e.key === 'Enter') {
      e.preventDefault();
      clearTimeout(state.searchTimer);
      if (state.view === 'search') doSearch(searchInput.value);
    }
  });

  searchClear.addEventListener('click', e => {
    e.stopPropagation();
    searchInput.value = '';
    updateSearchClear();
    searchInput.focus();
    if (state.view === 'search') {
      clearTimeout(state.searchTimer);
      doSearch('');
    }
  });

  filterYear.addEventListener('change', () => { if (state.view === 'search') doSearch(searchInput.value); });
  filterType.addEventListener('change', () => { if (state.view === 'search') doSearch(searchInput.value); });
  filterCountry.addEventListener('change', () => { if (state.view === 'search') doSearch(searchInput.value); });

  document.getElementById('clearFilters').addEventListener('click', () => {
    filterYear.value = ''; filterType.value = ''; filterCountry.value = '';
    if (state.view === 'search') doSearch(searchInput.value);
  });

  document.addEventListener('click', e => {
    if (state.view !== 'search') return;
    if (e.target.closest('.topbar, .search-filter-bar, .pill-menu, .lightbox, .card, .status, #sentinel, .toast, button, a, input, select')) return;
    exitSearch();
  });

  hamburger.addEventListener('click', e => {
    e.stopPropagation();
    togglePill();
  });

  document.addEventListener('click', e => {
    if (!document.body.classList.contains('pill-open')) return;
    if (e.target.closest('#pillMenu') || e.target.closest('#hamburger')) return;
    closePill();
  });

  pillMenu.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const v = btn.dataset.view;
      closePill();
      if (v === 'discover') enterDiscover();
      else if (v === 'favorites') enterFavorites();
      else if (v === 'about') enterAbout();
    });
  });

  const logoCell = document.getElementById('logoCell');
  if (logoCell) {
    logoCell.addEventListener('click', e => { e.preventDefault(); resetToHome(); });
  }

  themeToggle.addEventListener('click', () => {
    themeManual = true;
    const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', cur);
    try { localStorage.setItem(THEME_KEY, cur); } catch (e) {}
    syncThemeAria();
  });

  document.addEventListener('keydown', e => {
    if (lightbox.classList.contains('open')) {
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
      trapFocus(e);
      return;
    }
    if (e.key === 'Escape') {
      if (document.body.classList.contains('pill-open')) closePill();
      else if (state.view === 'search') exitSearch();
    }
  });

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox || e.target.closest('.lightbox-close')) closeLightbox();
  });

  window.addEventListener('resize', scheduleRelayout);
  const orientationMQ = window.matchMedia('(orientation: portrait)');
  if (orientationMQ.addEventListener) orientationMQ.addEventListener('change', scheduleRelayout);

  window.addEventListener('popstate', () => {
    navigatingFromHistory = true;
    try {
      restoreFromUrl();
    } finally {
      navigatingFromHistory = false;
    }
  });

  /* ============================================================
     §28 初始化
     ============================================================ */

  async function init() {
    initThemeState();
    loadFavorites();
    await loadI18n();
    applyI18n();
    await initData();
    navigatingFromHistory = true;
    try {
      restoreFromUrl();
    } finally {
      navigatingFromHistory = false;
    }
    setupObserver();
  }

  init();

})();