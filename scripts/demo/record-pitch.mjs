#!/usr/bin/env node
/**
 * Records the Gochi pitch deck as a video.
 * Loads the deck, directly triggers autoplay via page.evaluate(),
 * captures frames via Puppeteer, then encodes to MP4 with ffmpeg.
 *
 * Usage:
 *   npm run demo:pitch             # records from gochi.edycu.dev
 *   npm run demo:pitch -- --local  # records from localhost:3000
 */

import puppeteer from 'puppeteer';
import { mkdir, rm } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname  = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = join(__dirname, '../../demo-output');
const FRAME_DIR  = '/tmp/gochi-pitch-frames';

const BASE_URL   = process.argv.includes('--local')
  ? 'http://localhost:3000'
  : 'https://gochi.edycu.dev';

const WIDTH  = 1280;
const HEIGHT = 720;
const FPS    = 8;
const SLIDE_MS     = 5000;   // must match SLIDE_DURATION in pitch deck JS
const TOTAL_SLIDES = 10;

// Total capture: one full pass (10 slides × 5s) + 4s tail buffer
const RECORD_MS      = (TOTAL_SLIDES * SLIDE_MS) + 4000;
const FRAME_INTERVAL = Math.floor(1000 / FPS);
const TOTAL_FRAMES   = Math.ceil((RECORD_MS / 1000) * FPS);

async function main() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outputFile = join(OUTPUT_DIR, `pitch-video_${timestamp}.mp4`);

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           GOCHI PITCH VIDEO RECORDER                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  console.log(`  Source   → ${BASE_URL}/pitch/index.html`);
  console.log(`  Output   → ${outputFile}`);
  console.log(`  Duration → ~${Math.round(RECORD_MS / 1000)}s  (${TOTAL_SLIDES} slides × ${SLIDE_MS / 1000}s)`);
  console.log(`  FPS      → ${FPS}  (~${TOTAL_FRAMES} frames)\n`);

  // Clean frame dir
  if (existsSync(FRAME_DIR)) await rm(FRAME_DIR, { recursive: true });
  await mkdir(FRAME_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  // Launch browser
  console.log('  [1/4] Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${WIDTH},${HEIGHT}`,
      '--disable-web-security',
      '--force-device-scale-factor=1',
    ],
  });

  const page = await browser.newPage();

  // Collect browser errors for debugging
  const browserErrors = [];
  page.on('console', msg => { if (msg.type() === 'error') browserErrors.push(msg.text()); });
  page.on('pageerror', err => browserErrors.push(err.message));

  console.log('  [2/4] Loading pitch deck...');
  await page.goto(`${BASE_URL}/pitch/index.html`, {
    waitUntil: 'networkidle0',
    timeout: 30_000,
  });

  // Wait for fonts / CSS transitions to settle
  await new Promise(r => setTimeout(r, 1000));

  // Verify the slide deck is ready and start autoplay via evaluate()
  console.log('  [2/4] Starting autoplay via page.evaluate()...');
  const autoplayStarted = await page.evaluate(() => {
    if (typeof window.startAutoplay !== 'function') return false;
    // Hide nav for clean recording
    const nav = document.querySelector('.nav');
    const hint = document.querySelector('.key-hint');
    if (nav)  nav.style.opacity = '0';
    if (hint) hint.style.display = 'none';
    window.startAutoplay();
    // `playing` is a `let` variable — not on window. Just verify the fn exists and ran.
    return true;
  });

  if (!autoplayStarted) {
    await browser.close();
    if (browserErrors.length) {
      console.error('\n  Browser errors detected:');
      browserErrors.forEach(e => console.error('  →', e));
    }
    throw new Error(
      'startAutoplay() not found on window — ' +
      'check that public/pitch/index.html has the autoplay JS and is deployed.'
    );
  }

  console.log('  ✓ Autoplay running — capturing frames...\n');

  // Capture frames
  console.log(`  [3/4] Capturing ${TOTAL_FRAMES} frames...`);
  const captureStart = Date.now();
  let frame = 0;
  let lastSlide = -1;

  while (Date.now() - captureStart < RECORD_MS) {
    const filename = join(FRAME_DIR, `frame_${String(frame).padStart(6, '0')}.png`);
    await page.screenshot({ path: filename, type: 'png' });
    frame++;

    // Read actual current slide from the DOM counter (cur is `let`, not on window)
    const currentSlide = await page.evaluate(() => {
      const txt = document.getElementById('counter')?.textContent ?? '';
      return parseInt(txt.split('/')[0].trim(), 10) || 1;
    });
    if (currentSlide !== lastSlide) {
      lastSlide = currentSlide;
      process.stdout.write(`\r  Slide ${currentSlide}/${TOTAL_SLIDES}  frame ${frame}/${TOTAL_FRAMES}  `);
    }

    // Pace to target FPS
    const elapsed  = Date.now() - captureStart;
    const nextTime = frame * FRAME_INTERVAL;
    const wait     = nextTime - elapsed;
    if (wait > 5) await new Promise(r => setTimeout(r, wait));
  }

  console.log(`\n  Captured ${frame} frames.`);
  await browser.close();

  // Encode with ffmpeg
  console.log('\n  [4/4] Encoding MP4 with ffmpeg...');
  execSync(
    `ffmpeg -v warning -framerate ${FPS} -i "${FRAME_DIR}/frame_%06d.png" ` +
    `-vf "scale=${WIDTH}:${HEIGHT}" ` +
    `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p ` +
    `-movflags +faststart -y "${outputFile}"`,
    { stdio: 'inherit' }
  );

  // Cleanup frames
  await rm(FRAME_DIR, { recursive: true });

  const sizeMb = (statSync(outputFile).size / 1024 / 1024).toFixed(1);
  console.log(`\n  ✓ Done! ${outputFile} (${sizeMb} MB)`);
  console.log('\n  Next steps:');
  console.log('  → Make GIF: npm run demo:gif -- ' + outputFile);
  console.log('  → Upload to YouTube / HackQuest submission\n');
}

main().catch(err => {
  console.error('\nFailed:', err.message);
  process.exit(1);
});
