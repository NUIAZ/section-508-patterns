// scripts/screenshots.mjs: captures docs/*.png from the live site (or a local
// URL) for the README and social posts. Playwright is not a dependency here;
// point PLAYWRIGHT_DIR at any project that has it, and BROWSER_CHANNEL=msedge
// or chrome to use an installed browser:
//   PLAYWRIGHT_DIR=../x/node_modules/playwright BROWSER_CHANNEL=msedge node scripts/screenshots.mjs
//   SITE_URL=http://localhost:5173/ node scripts/screenshots.mjs   (default: the Pages URL)
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const pw = process.env.PLAYWRIGHT_DIR
  ? pathToFileURL(resolve(process.env.PLAYWRIGHT_DIR, 'index.mjs')).href
  : 'playwright';
const { chromium } = await import(pw);

const root = resolve(import.meta.dirname, '..');
const out = resolve(root, 'docs');
mkdirSync(out, { recursive: true });
const site = process.env.SITE_URL || 'https://nuiaz.github.io/section-508-patterns/';

const browser = await chromium.launch({ channel: process.env.BROWSER_CHANNEL || undefined });

async function shoot(name, { scheme = 'light', width = 1200, height = 800, path = '', prepare, clip, clipHeight } = {}) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
  await page.goto(site + path, { waitUntil: 'networkidle' });
  if (prepare) await prepare(page);
  await page.waitForTimeout(300);
  if (clip && clipHeight) {
    // Social tile: only the top `clipHeight` px of the element. Clip coordinates
    // for a fullPage screenshot are page-relative, so add the scroll offset.
    const box = await page.locator(clip).first().evaluate(el => {
      const r = el.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: r.width, height: r.height };
    });
    await page.screenshot({
      path: resolve(out, name), fullPage: true,
      clip: { x: box.x, y: box.y, width: box.width, height: Math.min(clipHeight, box.height) },
    });
  } else if (clip) {
    await page.locator(clip).first().screenshot({ path: resolve(out, name) });
  } else await page.screenshot({ path: resolve(out, name) });
  console.log('wrote', name);
  await page.close();
}

// Hero: the focus-trap card with the Accessible / Broken switch, light and dark.
const focusTrap = async page => {
  await page.locator('article#focus-trap').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
};
await shoot('screenshot.png', { prepare: focusTrap, clip: 'article#focus-trap' });
await shoot('screenshot-dark.png', { scheme: 'dark', prepare: focusTrap, clip: 'article#focus-trap' });
// Social tile: just the top of the card (title, problem, the switch, the demo).
await shoot('hero.png', { prepare: focusTrap, clip: 'article#focus-trap', clipHeight: 700 });
await shoot('hero-dark.png', { scheme: 'dark', prepare: focusTrap, clip: 'article#focus-trap', clipHeight: 700 });
// Whole page, for context.
await shoot('page.png', { width: 1400, height: 900 });
// The text version, as a plain document.
await shoot('text-version.png', { path: 'text.html', width: 1000, height: 800 });

await browser.close();
