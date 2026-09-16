import type { FileMap } from "@terrarium/contracts";

const SCRIPT_ORDER = ["app.js"];

function escapeScript(body: string): string {
  return body.replace(/<\/script/gi, "<\\/script");
}

function stripModuleSyntax(body: string): string {
  return body
    .replace(/^\s*import\s+[^;]+;\s*$/gm, "")
    .replace(/\bexport\s+(?=(function|class|const|let|var)\b)/g, "");
}

function orderedScripts(files: FileMap): string[] {
  const scripts = Object.keys(files).filter((path) => path.endsWith(".js"));
  return [
    ...scripts.filter((path) => !SCRIPT_ORDER.includes(path)).sort(),
    ...SCRIPT_ORDER.filter((path) => scripts.includes(path)),
  ];
}

/**
 * Inject progressive reveal styles for smooth transitions.
 * These work in conjunction with the skeleton's loading animations.
 */
function injectProgressiveStyles(): string {
  return `
/* Progressive content loading system */
.terrarium-content-loading {
  animation: terrarium-progressive-load 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes terrarium-progressive-load {
  from {
    opacity: 0;
    filter: blur(6px);
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: scale(1);
  }
}

/* Stagger children reveal for natural loading feel */
.terrarium-content-loading > * {
  animation: terrarium-element-load 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.terrarium-content-loading > *:nth-child(1) { animation-delay: 0.1s; }
.terrarium-content-loading > *:nth-child(2) { animation-delay: 0.15s; }
.terrarium-content-loading > *:nth-child(3) { animation-delay: 0.2s; }
.terrarium-content-loading > *:nth-child(4) { animation-delay: 0.25s; }
.terrarium-content-loading > *:nth-child(5) { animation-delay: 0.3s; }
.terrarium-content-loading > *:nth-child(6) { animation-delay: 0.35s; }
.terrarium-content-loading > *:nth-child(n+7) { animation-delay: 0.4s; }

@keyframes terrarium-element-load {
  from {
    opacity: 0;
    filter: blur(4px);
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}
`;
}

function injectStyles(html: string, files: FileMap): string {
  const css = Object.entries(files)
    .filter(([path]) => path.endsWith(".css"))
    .map(([path, body]) => `\n/* ${path} */\n${body}`)
    .join("\n");
  const runtimeCss = `
.terrarium-preview-flash {
  animation: terrarium-preview-flash 700ms ease;
}
@keyframes terrarium-preview-flash {
  0% { outline: 0 solid rgba(37, 99, 235, 0); }
  18% { outline: 6px solid rgba(37, 99, 235, 0.35); outline-offset: -6px; }
  100% { outline: 0 solid rgba(37, 99, 235, 0); }
}
${injectProgressiveStyles()}
`;
  const withoutLinks = html.replace(/<link\b[^>]*rel=["']?stylesheet["']?[^>]*>/gi, "");
  const styles = `<style data-terrarium-preview-styles>${runtimeCss}${css}</style>`;
  return withoutLinks.includes("</head>")
    ? withoutLinks.replace("</head>", `${styles}\n</head>`)
    : `${styles}\n${withoutLinks}`;
}

function injectScripts(html: string, files: FileMap): string {
  const script = orderedScripts(files)
    .map((path) => `\n// ${path}\n${stripModuleSyntax(files[path] ?? "")}`)
    .join("\n");
  const errorBridge = `
window.addEventListener("error", function (event) {
  window.parent.postMessage({
    type: "terrarium-preview-error",
    message: event.message || "Preview runtime error",
    stack: event.error && event.error.stack,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  }, "*");
});
window.addEventListener("unhandledrejection", function (event) {
  var reason = event.reason || {};
  window.parent.postMessage({
    type: "terrarium-preview-error",
    message: reason.message || String(reason || "Unhandled promise rejection"),
    stack: reason.stack
  }, "*");
});
`;
  const block = `<script data-terrarium-preview-runtime>${escapeScript(`${errorBridge}\n${script}`)}</script>`;
  const withoutExternalScripts = html.replace(/<script\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/gi, "");
  return withoutExternalScripts.includes("</body>")
    ? withoutExternalScripts.replace("</body>", `${block}\n</body>`)
    : `${withoutExternalScripts}\n${block}`;
}

/**
 * Add progressive loading class to main content elements for staged reveal.
 */
function addProgressiveLoadingClasses(html: string): string {
  // Add class to main content containers for progressive reveal
  return html
    .replace(/<body([^>]*)>/i, '<body$1><div class="terrarium-content-loading">')
    .replace(/<\/body>/i, '</div></body>');
}

export function fileMapToPreviewDocument(files: FileMap | null): string | null {
  if (!files) return null;
  const base = files["index.html"];
  if (!base) return null;
  let doc = injectScripts(injectStyles(base, files), files);
  
  // Only add progressive loading if we're transitioning from skeleton
  if (!doc.includes("shimmer")) {
    doc = addProgressiveLoadingClasses(doc);
  }
  
  return doc;
}
