import test from "node:test";
import assert from "node:assert/strict";

import {
  getPreviewHtml,
  getPreviewFile,
  getCompositionPreviewHtml,
  PREVIEW_BASE_PATH,
  PREVIEW_COMPOSITION_DIR,
  HYPERFRAMES_RUNTIME_URL,
  isPreviewRuntimeAliasPath,
} from "@/lib/preview";

test("preview constants point at the product promo composition", () => {
  assert.equal(PREVIEW_BASE_PATH, "/api/preview/");
  assert.match(PREVIEW_COMPOSITION_DIR, /public\/compositions\/product-promo$/);
  assert.equal(HYPERFRAMES_RUNTIME_URL, "/api/runtime.js");
});

test("preview runtime aliases match the imported zip artifact", () => {
  assert.equal(isPreviewRuntimeAliasPath("hyperframe-runtime.js"), true);
  assert.equal(isPreviewRuntimeAliasPath("hyperframe.runtime.iife.js"), true);
  assert.equal(isPreviewRuntimeAliasPath("compositions/scene1-logo-intro.html"), false);
});

test("getPreviewHtml injects the preview base and runtime script", async () => {
  const html = await getPreviewHtml();

  assert.match(html, /<base href="\/api\/preview\/">/);
  assert.match(
    html,
    /<script data-hyperframes-preview-runtime="1" src="\/api\/runtime\.js"><\/script>/,
  );
});

test("getPreviewHtml strips the raw runtime tag before reinjecting the pinned preview runtime", async () => {
  const html = await getPreviewHtml();
  const runtimeMatches = html.match(/\/api\/runtime\.js/g) ?? [];

  assert.equal(runtimeMatches.length, 1);
  assert.doesNotMatch(html, /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@hyperframes\/core\/dist\/hyperframe\.runtime\.iife\.js"><\/script>/);
});

test("getPreviewHtml serves bundled preview output", async () => {
  const html = await getPreviewHtml();

  assert.doesNotMatch(html, /data-composition-src=/);
  assert.match(html, /\[data-composition-id="scene1-logo-intro"\] \.canvas/);
  assert.match(html, /\[data-composition-id="scene2-4-canvas"\]/);
  assert.match(html, /\[data-composition-id="scene5-logo-outro"\] \.canvas/);
});

test("getCompositionPreviewHtml serves nested composition html with preview base and runtime", async () => {
  const html = await getCompositionPreviewHtml("compositions/scene1-logo-intro.html");

  assert.match(html, /<base href="\/api\/preview\/">/);
  assert.match(html, /data-composition-id="scene1-logo-intro"/);
  assert.match(html, /data-hyperframes-preview-runtime="1"/);
});

test("getPreviewFile serves static asset bytes with a content type", async () => {
  const file = await getPreviewFile("assets/figma-cursors.svg");

  assert.equal(file.contentType, "image/svg+xml");
  assert.match(file.content.toString("utf8"), /<svg/i);
});

test("getPreviewFile rejects missing files", async () => {
  await assert.rejects(() => getPreviewFile("assets/missing.svg"), /not found/i);
});

test("getPreviewFile rejects path traversal", async () => {
  await assert.rejects(() => getPreviewFile("../package.json"), /invalid preview path/i);
});
