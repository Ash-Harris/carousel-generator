// Export carousel slides to 1080x1440 PNGs (3:4) for Instagram. Runs in ~10 seconds.
//
// Node port of export.py, for machines where Python is unavailable or broken.
// Usage: drop this file into the carousel folder (next to carousel.html) and run:
//     npm install playwright   # one time, browsers are usually already cached
//     node export.mjs
//
// Outputs slide_1.png ... slide_N.png into ./slides/
import { chromium } from "playwright";
import { readFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const INPUT_HTML = join(HERE, "carousel.html");
const OUTPUT_DIR = join(HERE, "slides");
mkdirSync(OUTPUT_DIR, { recursive: true });

const VIEW_W = 420;
const VIEW_H = 560;
const SCALE = 1080 / 420; // -> 1080x1440 output via deviceScaleFactor

const html = readFileSync(INPUT_HTML, "utf-8");
const total = (html.match(/class=["']([^"']*\s)?slide(\s[^"']*)?["']/g) || []).length;
if (total === 0) {
  console.error("No .slide elements found in carousel.html");
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: VIEW_W, height: VIEW_H }, deviceScaleFactor: SCALE });
await page.setContent(html, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // fonts

await page.evaluate(() => {
  document
    .querySelectorAll(".ig-header,.ig-dots,.ig-actions,.ig-caption,.nav-btn,.dots")
    .forEach((el) => (el.style.display = "none"));
  const frame = document.querySelector(".ig-frame");
  if (frame) frame.style.cssText = "width:420px;height:560px;max-width:none;border-radius:0;box-shadow:none;overflow:hidden;margin:0;";
  const viewport = document.querySelector(".carousel-viewport");
  if (viewport) viewport.style.cssText = "width:420px;height:560px;aspect-ratio:unset;overflow:hidden;cursor:default;";
  document.body.style.cssText = "padding:0;margin:0;display:block;overflow:hidden;";
});
await page.waitForTimeout(500);

for (let i = 0; i < total; i++) {
  await page.evaluate((idx) => {
    const track =
      document.querySelector(".carousel-track") ||
      document.querySelector(".slide-track") ||
      document.getElementById("track");
    if (!track) throw new Error("No carousel track element found");
    track.style.transition = "none";
    track.style.transform = "translateX(" + -idx * 420 + "px)";
  }, i);
  await page.waitForTimeout(400);
  await page.screenshot({
    path: join(OUTPUT_DIR, `slide_${i + 1}.png`),
    clip: { x: 0, y: 0, width: VIEW_W, height: VIEW_H },
  });
  console.log(`Exported slide ${i + 1}/${total}`);
}

await browser.close();
console.log(`\nDone. ${total} slides at ${OUTPUT_DIR}`);
