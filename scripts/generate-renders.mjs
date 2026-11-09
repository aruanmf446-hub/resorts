#!/usr/bin/env node
/**
 * Renders assets FROM the real 3D world of each preset (run after a build):
 *  - public/media/<preset>/map-illustrated.webp   top-down map, used as the no-WebGL fallback
 *  - public/media/coastal/flight.mp4|webm         aerial film for the Video Storytelling section
 *  - public/media/mountain/hero.mp4|webm          cinematic hero film
 *  - public/media/coastal/menu-mare.pdf           demo menu PDF
 *   node scripts/generate-renders.mjs [preset]
 */
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, readFileSync } from 'node:fs';
import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const only = process.argv[2];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary' };

function serve(dir, port) {
  return createServer((req, res) => {
    let f = path.join(dir, decodeURIComponent(req.url.split('?')[0]));
    if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
    createReadStream(f).pipe(res);
  }).listen(port);
}

const jobs = {
  coastal: { mapPath: '/map/', film: { name: 'flight', time: 'day', from: [70, 46, 80], target: [0, 2, 4], seconds: 10, orbit: 0.9, descend: 14 } },
  mountain: { mapPath: '/mapa/', film: { name: 'hero', time: 'dusk', from: [30, 42, 40], target: [2, 4, -4], seconds: 10, orbit: 0.8, descend: 8 } },
  wellness: { mapPath: '/map/' },
};

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
let port = 4600;
for (const [preset, job] of Object.entries(jobs)) {
  if (only && only !== preset) continue;
  const dist = path.join(root, 'dist', preset);
  if (!existsSync(dist)) { console.warn(`skip ${preset}: build it first (npm run build:${preset})`); continue; }
  const srv = serve(dist, ++port);
  const outDir = path.join(root, 'public/media', preset);
  await mkdir(outDir, { recursive: true });

  // 1) Top-down illustrated map (square, covering the 120×120 world)
  const page = await browser.newPage({ viewport: { width: 1600, height: 1600 } });
  await page.goto(`http://localhost:${port}${job.mapPath}?capture=1&quality=high`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__world, null, { timeout: 30000 });
  await page.evaluate(() => {
    const w = window.__world;
    w.stop();
    w.setTime('day', false);
    w.scene.fog.density = 0.0012;
    w.scene.traverse((o) => { if (o.material?.uniforms?.uFogDensity) o.material.uniforms.uFogDensity.value = 0.0012; });
    w.camera.fov = 36; w.camera.aspect = 1; w.camera.updateProjectionMatrix();
    w.camera.up.set(0, 0, -1);
    w.renderAt(2, [0, 60 / Math.tan((18 * Math.PI) / 180), 0.001], [0, 0, 0]);
  });
  const canvas = await page.$('.wm__canvas');
  await canvas.screenshot({ path: path.join(outDir, 'map-illustrated.png') });
  await new Promise((r) => spawn('convert', [path.join(outDir, 'map-illustrated.png'), '-quality', '82', path.join(outDir, 'map-illustrated.webp')]).on('close', r));
  await new Promise((r) => spawn('rm', [path.join(outDir, 'map-illustrated.png')]).on('close', r));
  console.log(`${preset}/map-illustrated.webp`);
  await page.close();

  // 2) Film
  if (job.film && !process.env.NOFILM) {
    const f = job.film;
    const p2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await p2.goto(`http://localhost:${port}${job.mapPath}?capture=1&quality=high`, { waitUntil: 'networkidle' });
    await p2.waitForFunction(() => window.__world, null, { timeout: 30000 });
    await p2.evaluate((time) => { const w = window.__world; w.stop(); w.setTime(time, false); }, f.time);
    const fps = 30, frames = f.seconds * fps;
    const mp4 = path.join(outDir, `${f.name}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '24', '-preset', 'slow', '-movflags', '+faststart', '-an', mp4]);
    const el = await p2.$('.wm__canvas');
    for (let i = 0; i < frames; i++) {
      const k = i / (frames - 1);
      const e = k * k * (3 - 2 * k);
      await p2.evaluate(([k, e, f]) => {
        const a = Math.atan2(f.from[2] - f.target[2], f.from[0] - f.target[0]) + e * f.orbit;
        const r = Math.hypot(f.from[0] - f.target[0], f.from[2] - f.target[2]) - e * 12;
        const y = f.from[1] - e * f.descend;
        window.__world.renderAt(k * f.seconds, [f.target[0] + Math.cos(a) * r, y, f.target[2] + Math.sin(a) * r], f.target);
      }, [k, e, f]);
      const buf = await el.screenshot({ type: 'jpeg', quality: 92 });
      if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    }
    ff.stdin.end();
    await new Promise((r) => ff.on('close', r));
    await new Promise((r) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-i', mp4, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-an', path.join(outDir, `${f.name}.webm`)]).on('close', r));
    console.log(`${preset}/${f.name}.mp4 + .webm`);
    await p2.close();
  }
  srv.close();
}

// 3) Demo menu PDF (coastal)
if (!only || only === 'coastal') {
  const p = await browser.newPage();
  await p.setContent(`<html><body style="font-family:Georgia,serif;padding:80px;color:#1b2420;background:#f4efe6">
    <p style="letter-spacing:.3em;font-size:11px">ONDARA · DEMONSTRATION MENU</p><h1 style="font-weight:300;font-size:56px;margin:10px 0 40px">Maré</h1>
    ${['Grilled reef fish, lime & sea salt', 'Charred island vegetables', 'Coconut rice, smoked chilli', 'Mango, cardamom, burnt honey'].map((d) => `<p style="font-size:20px;border-bottom:1px solid #cfc4b2;padding:14px 0">${d}</p>`).join('')}
    <p style="margin-top:40px;font-size:11px;opacity:.7">Fictional menu for template demonstration. Replace with the restaurant's real PDF.</p></body></html>`);
  await p.pdf({ path: path.join(root, 'public/media/coastal/menu-mare.pdf'), format: 'A4', printBackground: true });
  console.log('coastal/menu-mare.pdf');
}
await browser.close();
