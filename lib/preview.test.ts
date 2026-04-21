import test from "node:test";
import assert from "node:assert/strict";

import {
  getPreviewHtml,
  getPreviewFile,
  getCompositionPreviewHtml,
  PREVIEW_BASE_PATH,
  PREVIEW_COMPOSITION_DIR,
} from "@/lib/preview";

test("preview constants point at the product promo composition", () => {
  assert.equal(PREVIEW_BASE_PATH, "/api/preview/");
  assert.match(PREVIEW_COMPOSITION_DIR, /public\/compositions\/product-promo$/);
});

test("getPreviewHtml injects the preview base and runtime script", async () => {
  const html = await getPreviewHtml();

  assert.match(html, /<base href="\/api\/preview\/">/);
  assert.match(
    html,
    /<script data-hyperframes-preview-runtime="1" src="https:\/\/cdn\.jsdelivr\.net\/npm\/@hyperframes\/core\/dist\/hyperframe\.runtime\.iife\.js"><\/script>/,
  );
});

test("getPreviewHtml strips the raw runtime tag before reinjecting the pinned preview runtime", async () => {
  const html = await getPreviewHtml();
  const runtimeMatches = html.match(/hyperframe\.runtime\.iife\.js/g) ?? [];

  assert.equal(runtimeMatches.length, 1);
  assert.doesNotMatch(html, /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@hyperframes\/core\/dist\/hyperframe\.runtime\.iife\.js"><\/script>/);
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
