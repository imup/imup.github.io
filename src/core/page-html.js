/**
 * core/page-html.js — 生成作品 HTML（p5 / three 两种引擎）
 */
import { escapeHtml, escapeScriptClose } from "./dom.js";

const P5_CDN = "https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js";
const THREE_URL = "src/lib/three.module.js";

export function generatePageHtml(a, b, c, d, e) {
  if (arguments.length > 1 && typeof a === "string") {
    return _generateP5Html(a, b, c, d, e);
  }
  const opts = a || {};
  return (opts.engine || "p5") === "three"
    ? _generateThreeHtml(opts)
    : _generateP5Html(
        opts.title,
        opts.code,
        opts.imageDataUrl,
        opts.hasImage,
        opts.maxTitleLen,
      );
}

function _generateP5Html(title, script, imageDataUrl, hasImage, maxTitleLen) {
  const len = typeof maxTitleLen === "number" ? maxTitleLen : 60;
  const safeTitle = escapeHtml((title || "Untitled").slice(0, len));
  let imgVar;
  if (imageDataUrl) imgVar = 'var imageUrl = "' + imageDataUrl + '";';
  else if (hasImage) {
    imgVar =
      "/* 原作品含用户上传的图片，因存储优化未嵌入此文件。\n" +
      "   预览时可在本工具中查看图片效果；\n" +
      "   若要在下载的文件里使用图片，请在工具中重新上传后再导出。 */\n" +
      "    var imageUrl = null;";
  } else imgVar = "var imageUrl = null;";
  const safeImgVar = escapeScriptClose(imgVar);
  const safeScript = escapeScriptClose(script);
  return (
    "<!DOCTYPE html>\n" +
    '<html lang="zh-CN">\n' +
    "<head>\n" +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    "  <title>" + safeTitle + "</title>\n" +
    "  <style>\n" +
    "    html, body { margin: 0; padding: 0; touch-action: none; }\n" +
    "    canvas { display: block; touch-action: none; }\n" +
    "  </style>\n" +
    '  \x3Cscript src="' + P5_CDN + '">\x3C/script>\n' +
    "</head>\n<body>\n" +
    "  \x3Cscript>\n    " +
    safeImgVar +
    "\n    " +
    safeScript +
    "\n  \x3C/script>\n" +
    "</body>\n</html>"
  );
}

function _generateThreeHtml(opts) {
  const len = typeof opts.maxTitleLen === "number" ? opts.maxTitleLen : 60;
  const safeTitle = escapeHtml((opts.title || "Untitled").slice(0, len));

  const imgVar = opts.imageDataUrl
    ? 'var imageUrl = "' + opts.imageDataUrl + '";'
    : "var imageUrl = null;";
  const safeImgVar = escapeScriptClose(imgVar);

  const modelVar = opts.modelDataUrl
    ? 'var modelUrl = "' + opts.modelDataUrl + '";\n    var modelFormat = "' + (opts.modelFormat || "") + '";'
    : "var modelUrl = null;\n    var modelFormat = null;";
  const safeModelVar = escapeScriptClose(modelVar);

  const code = opts.code || "";
  const safeCode = escapeScriptClose(code);
  const hasImport = /^\s*import\s+/m.test(code);

  const injectBlock = hasImport
    ? ""
    : '    import * as _THREE_NS from "' + THREE_URL + '";\n' +
      "    const THREE = Object.assign({}, _THREE_NS);\n" +
      "    {\n" +
      "      const _OrigRenderer = _THREE_NS.WebGLRenderer;\n" +
      "      THREE.WebGLRenderer = class extends _OrigRenderer {\n" +
      "        constructor(params) {\n" +
      "          super(Object.assign({}, params || {}, { preserveDrawingBuffer: true }));\n" +
      "        }\n" +
      "      };\n" +
      "    }\n\n";

  return (
    "<!DOCTYPE html>\n" +
    '<html lang="zh-CN">\n' +
    "<head>\n" +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">\n' +
    "  <title>" + safeTitle + "</title>\n" +
    "  <style>\n" +
    "    html, body { margin: 0; padding: 0; height: 100%; overflow: hidden; background: #000; touch-action: none; }\n" +
    "    canvas { display: block; touch-action: none; }\n" +
    "  </style>\n</head>\n<body>\n" +
    "  \x3Cscript>\n    " +
    safeImgVar +
    "\n    " +
    safeModelVar +
    "\n  \x3C/script>\n" +
    '  \x3Cscript type="module">\n' +
    injectBlock +
    "    " + safeCode +
    "\n  \x3C/script>\n" +
    "</body>\n</html>"
  );
}

export function injectSessionImage(html, dataUrl) {
  if (!html || !dataUrl) return html;
  const escaped = String(dataUrl).replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return html.replace(
    /var imageUrl = (?:null|"[^"]*");/,
    'var imageUrl = "' + escapeScriptClose(escaped) + '";',
  );
}