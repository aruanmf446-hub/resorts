#!/usr/bin/env node
/**
 * Generates the original, licence-free demo imagery for the three presets.
 *   node scripts/generate-art.mjs [preset]
 * Output: public/media/<preset>/*.webp
 * Real clients replace these files with their own photography.
 */
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const only = process.argv[2];

const L = { w: 1600, h: 1000 };
const P = { w: 900, h: 1400 };
const SQ = { w: 1200, h: 1500 };

/* ------------------------------------------------------------------ */
const coastal = (() => {
  const base = {
    skyTop: '#6f9bb3', skyHorizon: '#f2dcc2', sunColor: '#ffd49a', haze: '#e7d8c6', cloud: '#fff4e6',
    ridges: ['#a9b4a6', '#7b927f', '#4b6955', '#27402f'], water: '#3d9ba0', waterDeep: '#0f4750', fg: '#0d1a15',
    ground: '#c7b28f', wall: '#e9e1d4', floor: '#b79a78', linen: '#f1ebe1', accent: '#a07850', pool: '#4fb3b5', poolDeep: '#1b6b72',
  };
  const golden = { ...base, sun: { x: 0.68, y: 0.5, r: 0.022, glow: 10 } };
  const dawn = { ...base, skyTop: '#9fb3c4', skyHorizon: '#f6e3d3', sunColor: '#ffe2c4', sun: { x: 0.3, y: 0.56, r: 0.018, glow: 8 }, mist: 0.4 };
  const night = { ...base, skyTop: '#0b1622', skyMid: '#1a2c3c', skyHorizon: '#41546a', sunColor: '#cfe0ff', sunDisc: '#eef3ff', haze: '#3a4b5c', stars: true, moon: true,
    sun: { x: 0.74, y: 0.2, r: 0.016, glow: 6 }, ridges: ['#2a3a48', '#1d2c38', '#13202a', '#0b141b'], water: '#1d3a4a', waterDeep: '#07141c', glitter: '#dfe8ff', clouds: 3, bloom: 0.1, vignette: 0.45 };
  return [
    { name: 'hero-poster', ...L, comp: 'vista', ...golden, horizon: 0.62, hasWater: true, foreground: 'palms', sail: 0.42, seed: 3 },
    { name: 'hero-poster-m', ...P, comp: 'vista', ...golden, sun: { x: 0.6, y: 0.48, r: 0.016, glow: 10 }, horizon: 0.6, hasWater: true, foreground: 'palms', palmSpots: [[0.1, 1.08, 1.0, 0.4], [0.92, 1.12, 1.2, -0.5]], seed: 3 },
    { name: 'vista-dawn', ...L, comp: 'vista', ...dawn, horizon: 0.6, hasWater: true, seed: 11, ridgeOpts: { farAmp: 0.2 } },
    { name: 'vista-lagoon', ...L, comp: 'vista', ...golden, sun: { x: 0.2, y: 0.42, r: 0.02, glow: 12 }, horizon: 0.5, hasWater: true, water: '#56b9b4', waterDeep: '#1e6f74', foreground: 'palms', palmSpots: [[0.94, 1.12, 1.3, -0.5]], seed: 21 },
    { name: 'vista-cliffs', ...L, comp: 'vista', ...golden, horizon: 0.7, hasWater: true, relief: 1.6, ridges: ['#b7b9a9', '#8a9a86', '#536d58', '#2a4232'], seed: 33 },
    { name: 'vista-night', ...L, comp: 'vista', ...night, horizon: 0.62, hasWater: true, foreground: 'palms', palmSpots: [[0.08, 1.12, 1.2, 0.4]], seed: 41 },
    { name: 'villa-cliff', ...L, comp: 'interior', ...golden, furniture: 'bed', plant: true, view: { horizon: 0.55, hasWater: true, sun: { x: 0.62, y: 0.5, r: 0.03, glow: 8 } }, window: { x: 0.12, y: 0.08, w: 0.78, h: 0.66 }, mullions: 3, seed: 51 },
    { name: 'villa-lagoon', ...L, comp: 'pool', ...golden, horizon: 0.44, sea: '#4aa7a6', seaDeep: '#1b5e66', deck: '#c9b597', foreground: 'palms', palmSpots: [[0.92, 1.0, 1.1, -0.4]], seed: 61 },
    { name: 'villa-garden', ...L, comp: 'interior', ...golden, wall: '#ddd2c0', furniture: 'tub', plant: true, view: { horizon: 0.7, hasWater: false, ground: '#5d7a5a', foreground: 'palms', palmSpots: [[0.3, 1.2, 0.9, 0.2], [0.7, 1.25, 1.1, -0.2]], sun: { x: 0.5, y: 0.3, r: 0.03 } }, seed: 71 },
    { name: 'villa-overwater', ...L, comp: 'pool', ...dawn, horizon: 0.5, edgeOffset: 0.03, sea: '#6cc2bf', seaDeep: '#2a8a8a', pool: '#79c9c6', poolDeep: '#2a7f84', seed: 81 },
    { name: 'exp-reef', ...L, comp: 'texture', texture: 'caustics', base: '#2a8f97', light: '#d9fff6', shade: '#0b3d4a', seed: 91 },
    { name: 'exp-sail', ...L, comp: 'vista', ...golden, sun: { x: 0.8, y: 0.46, r: 0.02, glow: 10 }, horizon: 0.56, hasWater: true, sail: 0.36, ridges: ['#b5bcb0', '#8d9f90'], seed: 101 },
    { name: 'exp-forest', ...L, comp: 'path', ...base, ground: '#5f6f45', groundDeep: '#2e3a22', fg: '#16251a', haze: '#c8d3b8', ridges: ['#a8b79e'], sunColor: '#fff0c4', trail: '#cbb48c', grass: true, seed: 111 },
    { name: 'exp-dinner', ...L, comp: 'table', ...golden, sun: { x: 0.5, y: 0.43, r: 0.02, glow: 10 }, horizon: 0.44, hasWater: true, tableTop: '#e9e1d2', candles: true, plate: '#fbf8f2', seed: 121 },
    { name: 'exp-sand', ...L, comp: 'texture', texture: 'sand', base: '#dcc6a3', light: '#fff5e3', shade: '#9c7f58', seed: 131 },
    { name: 'exp-yoga', ...L, comp: 'pool', ...dawn, horizon: 0.5, sea: '#7cbfc0', deck: '#c7b79c', edgeOffset: 0.12, pool: '#c7b79c', poolDeep: '#a99677', seed: 141 },
    { name: 'dining-terrace', ...L, comp: 'table', ...night, horizon: 0.42, hasWater: true, tableTop: '#3a2c22', candles: true, plate: '#e8e2d8', seed: 151 },
    { name: 'dining-bar', ...L, comp: 'interior', ...night, wall: '#3b2f27', floor: '#2a211b', furniture: 'bench', accent: '#9b6b40', lamp: 0.2, view: { horizon: 0.58, hasWater: true }, seed: 161 },
    { name: 'spa-pavilion', ...L, comp: 'interior', ...dawn, wall: '#e6ddcf', furniture: 'tub', plant: true, view: { horizon: 0.58, hasWater: true }, window: { x: 0.08, y: 0.06, w: 0.84, h: 0.7 }, mullions: 1, seed: 171 },
    { name: 'spa-linen', ...L, comp: 'texture', texture: 'linen', base: '#ece4d7', light: '#ffffff', shade: '#3d4b3e', seed: 181 },
    { name: 'arch-pavilion', ...SQ, comp: 'interior', ...golden, wall: '#d9cdb9', furniture: 'bench', view: { horizon: 0.6, hasWater: true, foreground: 'palms', palmSpots: [[0.15, 1.1, 0.9, 0.3]] }, window: { x: 0.12, y: 0.1, w: 0.76, h: 0.62 }, mullions: 0, seed: 191 },
    { name: 'panorama', w: 4096, h: 2048, comp: 'panorama', ...golden, hasWater: true, quality: 0.78, seed: 201 },
  ];
})();

/* ------------------------------------------------------------------ */
const mountain = (() => {
  const base = {
    skyTop: '#5f7189', skyHorizon: '#e9dcd2', sunColor: '#ffd8b0', haze: '#cfd2d6', cloud: '#ffffff',
    ridges: ['#aab3bf', '#808e9b', '#53636b', '#2d3d39', '#17231e'], snow: '#f6f3ee', water: '#62818c', waterDeep: '#1b3038',
    fg: '#0e1814', ground: '#5c6a4c', groundDeep: '#26301f', wall: '#cdb89c', floor: '#7a5c42', linen: '#efe8dc', accent: '#8a5a3a', mist: 0.5,
  };
  const morning = { ...base, sun: { x: 0.24, y: 0.36, r: 0.02, glow: 9 } };
  const dusk = { ...base, skyTop: '#46506b', skyMid: '#9a8495', skyHorizon: '#f0c9a8', sunColor: '#ffb98a', haze: '#c9b3b0', sun: { x: 0.7, y: 0.53, r: 0.02, glow: 12 }, ridges: ['#8f8ea3', '#686b80', '#43495a', '#262c33', '#141a1c'] };
  const winter = { ...base, skyTop: '#8796a8', skyHorizon: '#eef0f2', haze: '#e3e6ea', ground: '#e9ecef', groundDeep: '#b9c1c9', fg: '#26302d', snow: '#ffffff', sun: { x: 0.6, y: 0.3, r: 0.018, glow: 6, disc: false } };
  const night = { ...base, skyTop: '#0b111c', skyMid: '#18213a', skyHorizon: '#3c4560', haze: '#2d3448', sunColor: '#cfdcff', sunDisc: '#eef2ff', stars: true, moon: true,
    sun: { x: 0.3, y: 0.18, r: 0.014, glow: 6 }, ridges: ['#30364a', '#232a3a', '#181e2a', '#10151c', '#090d11'], snow: '#9ea8c0', water: '#1c2a3c', waterDeep: '#070c14', clouds: 2, bloom: 0.08, vignette: 0.45, mist: 0.25 };
  return [
    { name: 'hero-poster', ...L, comp: 'vista', ...dusk, horizon: 0.66, hasWater: true, relief: 1.7, foreground: 'pines', seed: 5 },
    { name: 'hero-poster-m', ...P, comp: 'vista', ...dusk, horizon: 0.62, hasWater: true, relief: 1.6, foreground: 'pines', seed: 5 },
    { name: 'vista-valley', ...L, comp: 'vista', ...morning, horizon: 0.72, relief: 1.8, ground: '#6a7752', seed: 15 },
    { name: 'vista-lake', ...L, comp: 'vista', ...morning, horizon: 0.55, hasWater: true, relief: 1.5, foreground: 'pines', reflect: 0.45, seed: 25 },
    { name: 'vista-winter', ...L, comp: 'vista', ...winter, horizon: 0.66, relief: 1.9, foreground: 'pines', seed: 35 },
    { name: 'vista-night', ...L, comp: 'vista', ...night, horizon: 0.62, hasWater: true, relief: 1.6, foreground: 'pines', seed: 45 },
    { name: 'cabin-ridge', ...L, comp: 'interior', ...morning, wall: '#b99c7a', floor: '#6d4f37', furniture: 'bed', linen: '#ece5d8', accent: '#5b6a52', view: { horizon: 0.68, relief: 1.8, foreground: 'pines', hasWater: false }, window: { x: 0.14, y: 0.08, w: 0.72, h: 0.66 }, mullions: 2, seed: 55 },
    { name: 'cabin-lake', ...L, comp: 'interior', ...dusk, wall: '#a88a6a', floor: '#5d4330', furniture: 'tub', lamp: 0.85, view: { horizon: 0.56, hasWater: true, relief: 1.5 }, seed: 65 },
    { name: 'cabin-forest', ...L, comp: 'interior', ...winter, wall: '#c9b293', floor: '#80613f', furniture: 'bench', view: { horizon: 0.7, relief: 1.6, foreground: 'pines' }, mullions: 1, seed: 75 },
    { name: 'lodge-suite', ...L, comp: 'interior', ...night, wall: '#4a3a2e', floor: '#2d2219', furniture: 'bed', linen: '#d9d0c2', lamp: 0.16, view: { horizon: 0.62, hasWater: true, relief: 1.5 }, seed: 85 },
    { name: 'exp-trail', ...L, comp: 'path', ...morning, ground: '#4f5f3e', groundDeep: '#1f2a18', fg: '#101a12', haze: '#c4ccc2', ridges: ['#a7b0ba', '#7f8c95'], trail: '#a99c84', grass: true, seed: 95 },
    { name: 'exp-canoe', ...L, comp: 'vista', ...morning, horizon: 0.5, hasWater: true, relief: 1.4, sail: 0.6, reflect: 0.5, seed: 105 },
    { name: 'exp-summit', ...L, comp: 'vista', ...winter, horizon: 0.82, relief: 2.2, seed: 115 },
    { name: 'exp-fire', ...L, comp: 'table', ...night, horizon: 0.5, hasWater: true, tableTop: '#3a2a1e', candles: true, plate: '#ddd5c8', seed: 125 },
    { name: 'exp-bark', ...L, comp: 'texture', texture: 'bark', base: '#3a2c21', light: '#8a6c4f', shade: '#1b130d', seed: 135 },
    { name: 'exp-stars', ...L, comp: 'vista', ...night, horizon: 0.78, relief: 1.2, foreground: 'pines', seed: 145 },
    { name: 'dining-hearth', ...L, comp: 'table', ...dusk, horizon: 0.46, hasWater: true, tableTop: '#5a4232', candles: true, seed: 155 },
    { name: 'dining-cellar', ...L, comp: 'interior', ...night, wall: '#3a2b21', floor: '#22180f', furniture: 'bench', accent: '#7a4a2a', lamp: 0.5, view: { horizon: 0.6, relief: 1.6, foreground: 'pines' }, window: { x: 0.3, y: 0.12, w: 0.4, h: 0.5 }, mullions: 1, seed: 165 },
    { name: 'spa-sauna', ...L, comp: 'interior', ...winter, wall: '#a07a54', floor: '#6a4c32', furniture: 'bench', accent: '#5b402a', view: { horizon: 0.64, relief: 1.8, foreground: 'pines' }, seed: 175 },
    { name: 'spa-steam', ...L, comp: 'texture', texture: 'steam', base: '#1d2522', light: '#e6efe9', stone: '#55605a', bowl: true, seed: 185 },
    { name: 'panorama', w: 4096, h: 2048, comp: 'panorama', ...morning, relief: 2.4, hasWater: true, quality: 0.78, seed: 205 },
  ];
})();

/* ------------------------------------------------------------------ */
const wellness = (() => {
  const base = {
    skyTop: '#bfc8c4', skyHorizon: '#f1e8dc', sunColor: '#fff0d8', haze: '#e9e0d3', cloud: '#ffffff',
    ridges: ['#d4c8b8', '#bcab96', '#a08d76', '#7f6e5b'], ground: '#cbbca6', groundDeep: '#a6957d', fg: '#4a4237',
    water: '#a9bdb6', waterDeep: '#5f7a72', wall: '#e8e0d4', floor: '#cdbfab', linen: '#f4efe7', accent: '#9c8a74', pool: '#b8c9c2', poolDeep: '#6f8b83',
    grain: 10, vignette: 0.22, clouds: 3,
  };
  const soft = { ...base, sun: { x: 0.62, y: 0.42, r: 0.02, glow: 12, disc: true } };
  const mist = { ...base, sun: { x: 0.3, y: 0.38, r: 0.02, glow: 14, disc: false }, mist: 0.7, haze: '#efe8de' };
  const dusk = { ...base, skyTop: '#a7a2a8', skyHorizon: '#f0d4bd', sunColor: '#ffcfa0', haze: '#e6d3c3', sun: { x: 0.5, y: 0.5, r: 0.022, glow: 12 } };
  return [
    { name: 'hero-1', ...L, comp: 'pool', ...soft, horizon: 0.5, edgeOffset: 0.05, relief: 0.7, ridgeOpts: { farAmp: 0.1, nearAmp: 0.05 }, seed: 9 },
    { name: 'hero-1-m', ...P, comp: 'pool', ...soft, horizon: 0.48, edgeOffset: 0.05, relief: 0.7, ridgeOpts: { farAmp: 0.1, nearAmp: 0.05 }, seed: 9 },
    { name: 'hero-2', ...L, comp: 'vista', ...mist, horizon: 0.66, relief: 0.8, foreground: 'cypress', seed: 19 },
    { name: 'hero-3', ...L, comp: 'texture', texture: 'stones', base: '#e9e2d6', light: '#f8f4ec', shade: '#4a4237', stone: '#8d8172', seed: 29 },
    { name: 'vista-terraces', ...L, comp: 'vista', ...soft, horizon: 0.58, relief: 0.9, ridges: ['#d6cdbf', '#b7b29c', '#9aa088', '#7b8a6f', '#5f705a'], ground: '#87936f', seed: 39 },
    { name: 'vista-reflecting', ...L, comp: 'vista', ...dusk, horizon: 0.55, hasWater: true, reflect: 0.55, relief: 0.8, foreground: 'cypress', seed: 49 },
    { name: 'room-dawn', ...L, comp: 'interior', ...mist, furniture: 'bed', plant: true, view: { horizon: 0.62, relief: 0.8, foreground: 'cypress' }, window: { x: 0.1, y: 0.06, w: 0.8, h: 0.68 }, mullions: 0, seed: 59 },
    { name: 'room-court', ...L, comp: 'interior', ...soft, wall: '#ddd3c4', furniture: 'tub', plant: true, view: { horizon: 0.6, hasWater: true, relief: 0.8 }, mullions: 1, seed: 69 },
    { name: 'room-garden', ...L, comp: 'interior', ...soft, wall: '#efe8dd', furniture: 'bench', accent: '#a69580', view: { horizon: 0.7, relief: 0.8, foreground: 'cypress', ground: '#9aa382' }, window: { x: 0.25, y: 0.1, w: 0.5, h: 0.6 }, mullions: 0, seed: 79 },
    { name: 'exp-stones', ...L, comp: 'texture', texture: 'stones', base: '#ddd5c9', light: '#f7f2ea', shade: '#4a4237', stone: '#6f665b', stones: [[0.35, 0.72, 0.16], [0.35, 0.58, 0.11], [0.35, 0.48, 0.07], [0.7, 0.76, 0.12], [0.7, 0.66, 0.08]], seed: 89 },
    { name: 'exp-steam', ...L, comp: 'texture', texture: 'steam', base: '#2c2a26', light: '#efe8de', stone: '#7a6f62', bowl: true, seed: 99 },
    { name: 'exp-linen', ...L, comp: 'texture', texture: 'linen', base: '#efe8dd', light: '#ffffff', shade: '#55594a', seed: 109 },
    { name: 'exp-walk', ...L, comp: 'path', ...mist, ground: '#b8ae96', groundDeep: '#8e8470', fg: '#5b5446', ridges: ['#d6cdbf'], trail: '#e4dccd', grass: true, seed: 119 },
    { name: 'exp-pool', ...L, comp: 'pool', ...mist, horizon: 0.4, edgeOffset: 0.08, deck: '#d8cfc0', relief: 0.7, seed: 129 },
    { name: 'exp-dusk', ...L, comp: 'vista', ...dusk, horizon: 0.64, relief: 0.8, grass: true, fg: '#5a4e40', seed: 139 },
    { name: 'dining-table', ...L, comp: 'table', ...dusk, horizon: 0.44, tableTop: '#d8cbb6', candles: true, plate: '#f6f1e8', food: '#7b8a5a', wine: '#a87a4a', seed: 149 },
    { name: 'dining-garden', ...L, comp: 'interior', ...soft, wall: '#e3d9ca', furniture: 'bench', view: { horizon: 0.72, relief: 0.8, foreground: 'cypress', ground: '#93a07c' }, window: { x: 0.08, y: 0.08, w: 0.84, h: 0.62 }, mullions: 4, seed: 159 },
    { name: 'spa-bath', ...L, comp: 'interior', ...mist, wall: '#d9cfc0', furniture: 'tub', water: '#9fbab2', view: { horizon: 0.6, hasWater: true, relief: 0.8 }, mullions: 0, seed: 169 },
    { name: 'arch-light', ...SQ, comp: 'interior', ...soft, wall: '#ece5da', furniture: 'none', plant: true, view: { horizon: 0.65, relief: 0.8, foreground: 'cypress' }, window: { x: 0.36, y: 0.16, w: 0.28, h: 0.5 }, mullions: 0, seed: 179 },
    { name: 'panorama', w: 4096, h: 2048, comp: 'panorama', ...soft, relief: 0.9, quality: 0.8, seed: 209 },
  ];
})();

const sets = { coastal, mountain, wellness };

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('about:blank');
await page.addScriptTag({ path: path.join(root, 'scripts/art/art.js') });

for (const [preset, specs] of Object.entries(sets)) {
  if (only && only !== preset) continue;
  const dir = path.join(root, 'public/media', preset);
  await mkdir(dir, { recursive: true });
  for (const spec of specs) {
    const data = await page.evaluate((s) => window.render(s), spec);
    const buf = Buffer.from(data.split(',')[1], 'base64');
    await writeFile(path.join(dir, `${spec.name}.webp`), buf);
    console.log(`${preset}/${spec.name}.webp  ${(buf.length / 1024).toFixed(0)} KB`);
  }
}
await browser.close();
