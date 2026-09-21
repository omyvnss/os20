import { chromium } from 'playwright';
import { writeFileSync } from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Renders the hero skyline from city.png: node render.mjs 3200
// Needs Playwright (npx playwright install chromium).
const DIR = dirname(fileURLToPath(import.meta.url));
const WIDTH = Number(process.argv[2] ?? 3200);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(`file://${DIR}/city.png`);

const dataUrl = await page.evaluate(async (WIDTH) => {
  const img = document.querySelector('img');
  await img.decode();
  const HEIGHT = Math.round((WIDTH * img.naturalHeight) / img.naturalWidth);
  const CELL_W = Math.max(5, Math.round(WIDTH / 460));
  const CELL_H = Math.round(CELL_W * 1.55);
  const cols = Math.ceil(WIDTH / CELL_W);
  const rows = Math.ceil(HEIGHT / CELL_H);

  const sample = document.createElement('canvas');
  sample.width = cols;
  sample.height = rows;
  const sctx = sample.getContext('2d');
  sctx.imageSmoothingQuality = 'high';
  sctx.drawImage(img, 0, 0, cols, rows);
  const src = sctx.getImageData(0, 0, cols, rows).data;
  const lum = (x, y) => {
    const i = (Math.min(rows - 1, Math.max(0, y)) * cols + Math.min(cols - 1, Math.max(0, x))) * 4;
    return 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
  };

  const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => a.map((v, k) => v + (b[k] - v) * t);
  const ramp = (stops, t) => {
    const x = Math.min(1, Math.max(0, t)) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(x));
    return mix(stops[i], stops[i + 1], x - i);
  };

  const SKY = ['#e9b3a6', '#efc4a4', '#f3d6a8', '#f6e4b6'].map(hex);
  const SKY_RIGHT = ['#e4a9ab', '#ebbca8', '#f1d2aa', '#f5e2b8'].map(hex);
  const CITY = ['#d9d1ef', '#b4b0ec', '#8f8fe0', '#6f71cc', '#5557ad'].map(hex);
  const SUNLIT = hex('#f0b89a');
  const GRASS = ['#a9c985', '#93ba72', '#7ea764'].map(hex);

  let seed = 7;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  const SKY_LUM = 226;
  const skyline = new Array(cols).fill(rows);
  for (let x = 0; x < cols; x++) {
    for (let y = 0; y < rows; y++) {
      if (lum(x, y) < SKY_LUM) { skyline[x] = y; break; }
    }
  }
  const groundStart = Math.round(rows * 0.9);

  const WINDOW = Math.round(cols * 0.06);
  const localTop = skyline.map((_, x) => {
    let top = rows;
    for (let k = Math.max(0, x - WINDOW); k <= Math.min(cols - 1, x + WINDOW); k++) top = Math.min(top, skyline[k]);
    return top;
  });
  const skySmooth = localTop.map((_, x) => {
    let sum = 0, n = 0;
    for (let k = Math.max(0, x - WINDOW * 2); k <= Math.min(cols - 1, x + WINDOW * 2); k++) { sum += localTop[k]; n++; }
    return Math.min(sum / n, localTop[x]);
  });
  const WHITE = [255, 255, 255];
  const whiteWash = (x, y) => {
    const u = x / cols;
    const clearance = Math.min(1, Math.max(0, (skyline[x] - y) / (rows * 0.08)));
    const toward = Math.max(0, 1 - y / Math.max(1, skySmooth[x]));
    const diagonal = (0.12 + 0.62 * (1 - u) ** 1.3) * toward ** 1.25;
    const topEdge = 0.42 * Math.max(0, 1 - y / (rows * 0.22)) ** 1.8;
    return Math.min(0.72, Math.max(diagonal, topEdge)) * clearance;
  };

  const out = document.createElement('canvas');
  out.width = WIDTH;
  out.height = HEIGHT;
  const ctx = out.getContext('2d');
  ctx.font = `${Math.round(CELL_H * 0.95)}px ui-monospace, Menlo, monospace`;
  ctx.textBaseline = 'top';

  const GLYPHS_LIGHT = '.,:;-=+\'`~';
  const GLYPHS_MID = '{}()[]<>=+*/;:01';
  const GLYPHS_DENSE = '#%@&$8B0WM{}';

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const L = lum(x, y);
      const u = x / cols;
      let base;
      let glyphSet = GLYPHS_MID;
      const isSky = y < skyline[x] || L >= SKY_LUM + 4;

      if (y >= groundStart) {
        const t = (y - groundStart) / (rows - groundStart);
        base = ramp(GRASS, t + (rand() - 0.5) * 0.15);
        const cityAbove = Math.min(1, Math.max(0, (SKY_LUM - L) / 85));
        base = mix(base, ramp(CITY, cityAbove), 0.25 * (1 - t) * cityAbove);
        glyphSet = GLYPHS_MID;
      } else if (isSky) {
        const t = y / Math.max(1, groundStart);
        base = mix(ramp(SKY, t), ramp(SKY_RIGHT, t), u);
        glyphSet = GLYPHS_LIGHT;
      } else {
        const depth = Math.min(1, Math.max(0, (SKY_LUM - L) / 85)) ** 0.85;
        base = ramp(CITY, depth);
        const left = lum(x - 1, y);
        if (L - left > 5) base = mix(base, SUNLIT, 0.4 * (1 - depth * 0.5));
        const skyHere = mix(ramp(SKY, y / groundStart), ramp(SKY_RIGHT, y / groundStart), u);
        base = mix(base, skyHere, 0.62 * (1 - depth) ** 1.6);
        const nearGround = Math.max(0, (y - groundStart * 0.86) / (groundStart * 0.14));
        base = mix(base, GRASS[0], 0.35 * nearGround * nearGround);
        glyphSet = depth > 0.6 ? GLYPHS_DENSE : depth > 0.25 ? GLYPHS_MID : GLYPHS_LIGHT;
      }

      const jitter = (rand() - 0.5) * 8;
      let fill = base.map((v) => Math.max(0, Math.min(255, v + jitter)));
      if (isSky && y < groundStart) fill = mix(fill, WHITE, whiteWash(x, y));
      ctx.fillStyle = `rgb(${fill.join(',')})`;
      ctx.fillRect(x * CELL_W, y * CELL_H, CELL_W + 1, CELL_H + 1);

      const ink = fill.map((v) => v * 0.8);
      ctx.fillStyle = `rgba(${ink.map(Math.round).join(',')},0.85)`;
      ctx.fillText(glyphSet[Math.floor(rand() * glyphSet.length)], x * CELL_W, y * CELL_H);
    }
  }

  return out.toDataURL('image/png');
}, WIDTH);

writeFileSync(`${DIR}/skyline-ascii-${WIDTH}.png`, Buffer.from(dataUrl.split(',')[1], 'base64'));
await browser.close();
console.log('done', WIDTH);
