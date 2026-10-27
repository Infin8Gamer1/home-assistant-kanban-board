/*
 * Photograph the detail dialog at a desktop width and a phone width.
 * Uses the demo page, so this is the real card, not a mock of the markup.
 *
 *   PORT=43123 node demo/serve.mjs
 *   node scripts/shot-detail.mjs
 */
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import puppeteer from "puppeteer-core";

const BASE = process.env.BASE || "http://127.0.0.1:43123/demo/index.html?only=shopping&bare";
const OUT = process.env.OUT || "/opt/cursor/artifacts";
const CHROME = process.env.CHROME || [
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium",
].find((p) => existsSync(p));

if (!CHROME) {
  console.error("No Chrome found. Set CHROME=/path/to/chrome");
  process.exit(1);
}

async function openDetail(page, edit) {
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("todo-kanban-card-plus");
  await page.evaluate((wantEdit) => {
    const card = document.querySelector("todo-kanban-card-plus");
    const row = [...card.shadowRoot.querySelectorAll(".item")]
      .find((item) => item.querySelector(".desc-preview"));
    row.querySelector(".label").click();
    if (wantEdit) card.shadowRoot.querySelector("[data-action=edit]").click();
  }, edit);
  await page.waitForSelector("todo-kanban-card-plus >>> dialog.detail");
  await new Promise((r) => setTimeout(r, 200));
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  args: ["--no-sandbox", "--force-color-profile=srgb", "--hide-scrollbars"],
});

await mkdir(OUT, { recursive: true });
const shots = [
  { file: "detail-desktop.png", width: 1280, height: 900, edit: false },
  { file: "detail-mobile.png", width: 390, height: 844, edit: false },
  { file: "detail-edit-desktop.png", width: 1280, height: 900, edit: true },
  { file: "detail-edit-mobile.png", width: 390, height: 844, edit: true },
];

try {
  for (const shot of shots) {
    const page = await browser.newPage();
    await page.setViewport({ width: shot.width, height: shot.height, deviceScaleFactor: 2 });
    await openDetail(page, shot.edit);
    const path = join(OUT, shot.file);
    await page.screenshot({ path, fullPage: false });
    console.log(path);
    await page.close();
  }
} finally {
  await browser.close();
}
