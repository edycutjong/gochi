#!/usr/bin/env node
/**
 * Automated screenshots of the live Gochi app using Puppeteer.
 * Captures landing page, play page (demo mode), and the NFT metadata image.
 *
 * Usage:
 *   npm run demo:screenshots           # screenshots prod (gochi.edycu.dev)
 *   npm run demo:screenshots -- --local # screenshots localhost:3000
 */

import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../demo-output/screenshots');
const BASE_URL = process.argv.includes('--local')
  ? 'http://localhost:3000'
  : 'https://gochi.edycu.dev';

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, deviceScaleFactor: 2 },
  mobile:  { width: 390,  height: 844, deviceScaleFactor: 3 },
};

const SHOTS = [
  {
    name: 'landing',
    path: '/',
    waitFor: 'h1',
    delay: 800,
    clip: null,
  },
  {
    name: 'landing-hero',
    path: '/',
    waitFor: 'h1',
    delay: 800,
    clip: { x: 0, y: 0, width: 1440, height: 600 },
  },
  {
    name: 'play-mint',
    path: '/play',
    waitFor: 'body',
    delay: 1200,
    clip: null,
  },
  {
    name: 'play-demo',
    path: '/play?tokenId=1',
    waitFor: 'body',
    delay: 2000,
    clip: null,
  },
  {
    name: 'nft-image',
    path: '/api/metadata/1/image',
    waitFor: 'svg',
    delay: 500,
    clip: null,
    viewport: { width: 400, height: 400, deviceScaleFactor: 2 },
  },
];

async function shoot(browser, shot, viewport, suffix) {
  const page = await browser.newPage();
  await page.setViewport(viewport);

  // Suppress WalletConnect / Web3 console noise
  page.on('console', () => {});
  page.on('pageerror', () => {});

  console.log(`  → ${shot.name}${suffix} (${viewport.width}×${viewport.height})`);
  await page.goto(`${BASE_URL}${shot.path}`, { waitUntil: 'networkidle2', timeout: 30_000 });

  if (shot.waitFor) {
    await page.waitForSelector(shot.waitFor, { timeout: 10_000 }).catch(() => {});
  }
  if (shot.delay) await new Promise(r => setTimeout(r, shot.delay));

  const filename = `${shot.name}${suffix}.png`;
  const opts = { path: join(OUTPUT_DIR, filename) };
  if (shot.clip) opts.clip = shot.clip;

  await page.screenshot(opts);
  await page.close();
  return filename;
}

async function main() {
  await mkdir(OUTPUT_DIR, { recursive: true });

  console.log(`\nGochi screenshot tool`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Output: demo-output/screenshots/\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const saved = [];

  for (const shot of SHOTS) {
    // Desktop
    const vp = shot.viewport ?? VIEWPORTS.desktop;
    saved.push(await shoot(browser, shot, vp, ''));

    // Mobile (skip for API routes)
    if (!shot.path.startsWith('/api') && !shot.viewport) {
      saved.push(await shoot(browser, shot, VIEWPORTS.mobile, '-mobile'));
    }
  }

  await browser.close();

  console.log(`\nDone! ${saved.length} screenshots saved to demo-output/screenshots/`);
  console.log(saved.map(f => `  ${f}`).join('\n'));
}

main().catch(err => {
  console.error('Screenshot failed:', err.message);
  process.exit(1);
});
