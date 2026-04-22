import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, normalize, sep } from "node:path";
import { promisify } from "node:util";

export const PREVIEW_BASE_PATH = "/api/preview/";
export const HYPERFRAMES_RUNTIME_URL = "/api/runtime.js";
export const PREVIEW_COMPOSITION_DIR = join(
  process.cwd(),
  "public",
  "compositions",
  "product-promo",
);

const execFileAsync = promisify(execFile);

const HTML_CONTENT_TYPE = "text/html; charset=utf-8";
const CONTENT_TYPES = new Map<string, string>([
  [".html", HTML_CONTENT_TYPE],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".wav", "audio/wav"],
  [".mp3", "audio/mpeg"],
  [".mp4", "video/mp4"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

export class PreviewNotFoundError extends Error {
  constructor(path: string) {
    super(`Preview file not found: ${path}`);
  }
}

export function isPreviewRuntimeAliasPath(path: string): boolean {
  return path === "hyperframe-runtime.js" || path === "hyperframe.runtime.iife.js";
}

function resolvePreviewPath(path: string): string {
  const normalized = normalize(path).replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized === "." || normalized.startsWith("../")) {
    throw new Error(`Invalid preview path: ${path}`);
  }

  const abs = join(PREVIEW_COMPOSITION_DIR, normalized);
  const rootWithSep = PREVIEW_COMPOSITION_DIR.endsWith(sep)
    ? PREVIEW_COMPOSITION_DIR
    : `${PREVIEW_COMPOSITION_DIR}${sep}`;
  if (!abs.startsWith(rootWithSep)) {
    throw new Error(`Invalid preview path: ${path}`);
  }

  return abs;
}

function normalizePreviewHtml(html: string): string {
  let nextHtml = html.replace(/<script[^>]*hyperframe\.runtime[^>]*><\/script>/g, "");
  if (!nextHtml.includes("<base")) {
    nextHtml = nextHtml.replace(/<head>/i, `<head><base href="${PREVIEW_BASE_PATH}">`);
  }

  const runtimeTag = `<script data-hyperframes-preview-runtime="1" src="${HYPERFRAMES_RUNTIME_URL}"></script>`;
  if (nextHtml.includes("</body>")) {
    nextHtml = nextHtml.replace("</body>", `${runtimeTag}\n</body>`);
  } else if (nextHtml.includes("</head>")) {
    nextHtml = nextHtml.replace("</head>", `${runtimeTag}\n</head>`);
  } else {
    nextHtml += runtimeTag;
  }

  return nextHtml;
}

function rewriteRelativeUrl(url: string, compPath: string): string {
  if (
    !url ||
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("//") ||
    url.startsWith("data:") ||
    url.startsWith("#") ||
    url.startsWith("/")
  ) {
    return url;
  }

  const rewritten = normalize(join(dirname(compPath), url)).replaceAll("\\", "/");
  return rewritten.startsWith("./") ? rewritten.slice(2) : rewritten;
}

function rewriteSubCompositionPaths(content: string, compPath: string): string {
  const attrPattern = /\b(src|href)=["']([^"'#][^"']*)["']/gi;
  const styleUrlPattern = /url\((['"]?)([^'")]+)\1\)/gi;

  return content
    .replace(attrPattern, (_match, attr: string, value: string) => {
      return `${attr}="${rewriteRelativeUrl(value, compPath)}"`;
    })
    .replace(styleUrlPattern, (_match, quote: string, value: string) => {
      const rewritten = rewriteRelativeUrl(value, compPath);
      return `url(${quote}${rewritten}${quote})`;
    });
}

export async function getPreviewHtml(): Promise<string> {
  const bundledHtml = await tryBundlePreviewHtml();
  if (bundledHtml) {
    return normalizePreviewHtml(bundledHtml);
  }

  const file = await getPreviewFile("index.html");
  return normalizePreviewHtml(file.content.toString("utf8"));
}

async function tryBundlePreviewHtml(): Promise<string | null> {
  try {
    const tsxBin = join(process.cwd(), "node_modules", ".bin", "tsx");
    const bundlerScript = join(process.cwd(), "scripts", "bundle-preview.ts");
    const { stdout } = await execFileAsync(tsxBin, [bundlerScript, PREVIEW_COMPOSITION_DIR], {
      cwd: process.cwd(),
      maxBuffer: 20 * 1024 * 1024,
    });
    return stdout || null;
  } catch {
    return null;
  }
}

export async function getCompositionPreviewHtml(path: string): Promise<string> {
  const file = await getPreviewFile(path);
  const rawComp = file.content.toString("utf8");
  const templateMatch = rawComp.match(/<template[^>]*>([\s\S]*)<\/template>/i);
  const content = templateMatch?.[1] ?? rawComp;
  const rewrittenContent = rewriteSubCompositionPaths(content, path);

  const indexFile = await getPreviewFile("index.html");
  const indexHtml = indexFile.content.toString("utf8");
  const headMatch = indexHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  let headContent = headMatch?.[1] ?? "";

  if (!headContent.includes("<base")) {
    headContent = `<base href="${PREVIEW_BASE_PATH}">\n${headContent}`;
  }
  if (
    !headContent.includes("hyperframe.runtime") &&
    !headContent.includes("hyperframes-preview-runtime")
  ) {
    headContent += `\n<script data-hyperframes-preview-runtime="1" src="${HYPERFRAMES_RUNTIME_URL}"></script>`;
  }
  if (!headContent.includes("gsap")) {
    headContent += '\n<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>';
  }

  return `<!DOCTYPE html>
<html>
<head>
${headContent}
</head>
<body>
<script>window.__timelines=window.__timelines||{};</script>
${rewrittenContent}
</body>
</html>`;
}

export async function getPreviewFile(path: string): Promise<{
  content: Buffer;
  contentType: string;
}> {
  const abs = resolvePreviewPath(path);

  let content: Buffer;
  try {
    content = await readFile(abs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new PreviewNotFoundError(path);
    }
    throw error;
  }

  const ext = extname(abs).toLowerCase();
  return {
    content,
    contentType: CONTENT_TYPES.get(ext) ?? "application/octet-stream",
  };
}

export function isPreviewNotFoundError(error: unknown): error is PreviewNotFoundError {
  return error instanceof PreviewNotFoundError;
}
