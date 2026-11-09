#!/usr/bin/env node
/**
 * End-to-end validation of every preset build (run `npm run build:all` first; `npm test` does both).
 * Also builds a VARIANT preset (sections removed/reordered, page disabled, GLB world,
 * editorial hero, booking disabled) to prove the white-label contract.
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { existsSync, statSync, createReadStream, readFileSync, readdirSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.glb': 'model/gltf-binary', '.mp4': 'video/mp4', '.webm': 'video/webm', '.vtt': 'text/vtt', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf', '.png': 'image/png' };

let failures = 0, passes = 0;
const ok = (cond, msg) => { if (cond) { passes++; } else { failures++; console.log(`  ✗ ${msg}`); } };
const section = (s) => console.log(`\n▸ ${s}`);

function serve(dir, port) {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      let f = path.join(dir, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
      if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!existsSync(f)) { res.writeHead(404, { 'Content-Type': 'text/html' }); return res.end(existsSync(path.join(dir, '404.html')) ? readFileSync(path.join(dir, '404.html')) : ''); }
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' });
      createReadStream(f).pipe(res);
    }).listen(port, () => resolve(srv));
  });
}

const htmlFiles = (dir) => readdirSync(dir, { recursive: true }).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f));
const pathFromFile = (dir, f) => '/' + path.relative(dir, f).replace(/index\.html$/, '').replace(/\\/g, '/');

const launch = () => chromium.launch({ args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function newPage(ctx) {
  const page = await ctx.newPage();
  page.errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith('http://localhost')) page.errors.push(`HTTP ${r.status()} ${r.url()}`); });
  await page.addInitScript(() => {
    window.__handoffs = [];
    document.addEventListener('booking:handoff', (e) => window.__handoffs.push(e.detail));
    window.open = (u) => { window.__opened = u; return null; };
  });
  return page;
}

async function testPreset(id, opts = {}) {
  const dir = path.join(root, 'dist', id);
  if (!existsSync(dir)) { ok(false, `${id}: dist missing — run npm run build:${id}`); return; }
  const port = 4800 + Math.floor(Math.random() * 500);
  const srv = await serve(dir, port);
  const base = `http://localhost:${port}`;
  const browser = await launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  section(`${id}: static output`);
  const files = htmlFiles(dir);
  const routes = files.map((f) => pathFromFile(dir, f)).filter((r) => !r.startsWith('/404'));
  ok(routes.length >= (opts.minPages ?? 10), `${id}: expected many pages, got ${routes.length}`);
  ok(existsSync(path.join(dir, 'sitemap-index.xml')), `${id}: sitemap-index.xml`);
  ok(existsSync(path.join(dir, 'robots.txt')) && readFileSync(path.join(dir, 'robots.txt'), 'utf8').includes('Sitemap:'), `${id}: robots.txt with sitemap`);
  // No secrets in the bundle
  const bundle = readdirSync(dir, { recursive: true }).filter((f) => /\.(js|html|css|json)$/.test(f)).map((f) => readFileSync(path.join(dir, f), 'utf8')).join('\n');
  ok(!/(sk_live_|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]{20,}|xox[bp]-)/.test(bundle), `${id}: no credentials in bundle`);

  // Internal links resolve
  const known = new Set(routes);
  const broken = [];
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
      const href = m[1];
      if (/\.(xml|svg|webp|pdf|png|ico|css|js|mp4|webm|vtt|txt)$/.test(href)) { if (!existsSync(path.join(dir, href))) broken.push(`${pathFromFile(dir, f)} → ${href}`); continue; }
      const norm = href.endsWith('/') ? href : href + '/';
      if (!known.has(norm) && !known.has(href)) broken.push(`${pathFromFile(dir, f)} → ${href}`);
    }
    ok(!/href=""|href="#"(?!book)/.test(html.replace(/href="#book"/g, '')), `${id}: empty link in ${pathFromFile(dir, f)}`);
  }
  ok(broken.length === 0, `${id}: broken internal links:\n    ${[...new Set(broken)].slice(0, 10).join('\n    ')}`);

  section(`${id}: every page (no WebGL, no console errors, SEO)`);
  for (const r of routes) {
    const page = await newPage(ctx);
    const res = await page.goto(`${base}${r}?webgl=0`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    ok(res.status() === 200, `${id} ${r}: status ${res.status()}`);
    const seo = await page.evaluate(() => ({
      title: document.title,
      desc: document.querySelector('meta[name=description]')?.content,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      og: document.querySelector('meta[property="og:image"]')?.content,
      h1: document.querySelectorAll('h1').length,
      lang: document.documentElement.lang,
      ld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { JSON.parse(s.textContent); return true; } catch { return false; } }),
      imgsNoAlt: [...document.querySelectorAll('img:not([alt])')].length,
    }));
    ok(seo.title && seo.desc && seo.canonical && seo.og, `${id} ${r}: SEO tags`);
    ok(seo.h1 === 1, `${id} ${r}: exactly one h1 (got ${seo.h1})`);
    ok(seo.lang, `${id} ${r}: html lang`);
    ok(seo.ld.every(Boolean), `${id} ${r}: valid JSON-LD`);
    ok(seo.imgsNoAlt === 0, `${id} ${r}: images without alt`);
    ok(page.errors.length === 0, `${id} ${r}: console errors:\n    ${page.errors.join('\n    ')}`);
    await page.close();
  }

  const home = await newPage(ctx);
  await home.goto(`${base}/?webgl=0`, { waitUntil: 'load' });
  const jsonld = await home.evaluate(() => [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => JSON.parse(s.textContent)['@type']));
  ok(jsonld.includes('Resort'), `${id}: Resort JSON-LD on home`);

  section(`${id}: menu & keyboard`);
  const menuBtn = home.locator('.hdr__menu');
  await menuBtn.click();
  await home.waitForTimeout(400);
  ok(await home.locator('[data-menu]').isVisible(), `${id}: menu opens`);
  ok(await home.evaluate(() => document.querySelector('[data-menu]').contains(document.activeElement)), `${id}: focus moves into menu`);
  await home.keyboard.press('Escape');
  await home.waitForTimeout(1100);
  ok(await home.locator('[data-menu]').isHidden(), `${id}: Escape closes menu`);
  await home.close();

  if (opts.booking) {
    section(`${id}: booking hand-off (${opts.booking.mode})`);
    const p = await newPage(ctx);
    await p.goto(`${base}/?webgl=0`, { waitUntil: 'load' });
    if (opts.booking.mode === 'disabled') {
      ok(await p.locator('[data-book-open]').count() === 0, `${id}: no reserve buttons when booking disabled`);
    } else {
      await p.locator('.hdr__book').click();
      await p.waitForTimeout(500);
      const form = p.locator('#drawer-booking');
      ok(await form.isVisible(), `${id}: booking drawer opens`);
      const fmt = (d) => d.toISOString().slice(0, 10);
      const day = (n) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
      if (opts.booking.mode === 'engine') {
        await form.locator('button[type=submit]').click();
        ok(await form.locator('[data-error]').isVisible(), `${id}: missing dates rejected`);
        await form.locator('[name=checkIn]').fill(day(-3));
        await form.locator('[name=checkOut]').fill(day(5));
        await form.locator('button[type=submit]').click();
        ok(await form.locator('[data-error]').isVisible(), `${id}: past check-in rejected`);
      }
      await form.locator('[name=checkIn]').fill(day(20));
      await form.locator('[name=checkIn]').dispatchEvent('change');
      await form.locator('[name=checkOut]').fill(day(25));
      if (await form.locator('[name=accommodation]').count()) await form.locator('[name=accommodation]').selectOption({ index: 1 });
      await form.locator('button[type=submit]').click();
      await p.waitForTimeout(300);
      const h = await p.evaluate(() => window.__handoffs[0]);
      ok(h && h.mode === opts.booking.mode, `${id}: hand-off fired (${JSON.stringify(h)})`);
      if (h) ok(opts.booking.expect.test(h.url), `${id}: hand-off URL ${h.url} matches ${opts.booking.expect}`);
    }
    await p.close();
  }

  if (opts.planner) {
    section(`${id}: stay planner`);
    const p = await newPage(ctx);
    await p.goto(`${base}${opts.planner}?webgl=0`, { waitUntil: 'load' });
    await p.locator('[data-interest]').first().click();
    await p.locator('.pc__add').first().click();
    await p.locator('.pc__add').nth(1).click();
    ok((await p.locator('[data-selection] li').count()) === 2, `${id}: two experiences selected`);
    await p.locator('[data-selection] li').nth(1).locator('[data-up]').click();
    ok(await p.locator('[data-itinerary] h3').count() >= 1, `${id}: itinerary rendered`);
    ok(/p=/.test(await p.evaluate(() => location.hash)), `${id}: selection stored in shareable URL`);
    const wa = await p.locator('[data-wa]').count() ? await p.locator('[data-wa]').getAttribute('href') : await p.locator('[data-mail]').getAttribute('href');
    ok(/^(https:\/\/wa\.me|mailto:)/.test(wa), `${id}: share link built`);
    await p.reload({ waitUntil: 'load' });
    ok((await p.locator('[data-selection] li').count()) === 2, `${id}: selection restored from URL`);
    ok(p.errors.length === 0, `${id}: planner console errors ${p.errors.join(' | ')}`);
    await p.close();
  }

  if (opts.map) {
    section(`${id}: 3D map (WebGL)`);
    const p = await newPage(ctx);
    await p.goto(`${base}${opts.map}?quality=low`, { waitUntil: 'load' });
    await p.waitForFunction(() => document.querySelector('[data-world]')?.dataset.state === 'ready', null, { timeout: 45000 }).catch(() => {});
    ok(await p.evaluate(() => document.querySelector('[data-world]').dataset.state) === 'ready', `${id}: WebGL world ready`);
    const nPois = await p.locator('[data-poi]').count();
    ok(await p.locator('.hs').count() === nPois && nPois > 0, `${id}: one hotspot per place (${nPois})`);
    await p.waitForTimeout(800);
    await p.locator('[data-poi]').nth(1).click();
    await p.waitForTimeout(400);
    ok(await p.locator('[data-panel]').isVisible(), `${id}: place panel opens`);
    ok(await p.locator('.hs.is-active').count() === 1, `${id}: active hotspot highlighted`);
    const tbtn = p.locator('[data-time]').last();
    if (await tbtn.count()) { await tbtn.click(); ok((await tbtn.getAttribute('aria-pressed')) === 'true', `${id}: atmosphere switch`); }
    const sbtn = p.locator('[data-season]').last();
    if (await sbtn.count()) { await sbtn.click(); ok((await sbtn.getAttribute('aria-pressed')) === 'true', `${id}: season switch`); }
    ok(p.errors.length === 0, `${id}: map console errors ${p.errors.join(' | ')}`);
    await p.close();

    section(`${id}: map without WebGL (fallback)`);
    const f = await newPage(ctx);
    await f.goto(`${base}${opts.map}?webgl=0`, { waitUntil: 'load' });
    ok(await f.evaluate(() => document.querySelector('[data-world]').dataset.state) === 'fallback', `${id}: fallback state`);
    ok(await f.locator('.wm__fallback img').isVisible(), `${id}: illustrated map visible`);
    await f.locator('[data-poi]').first().click();
    ok(await f.locator('[data-panel]').isVisible(), `${id}: places still work without WebGL`);
    await f.close();
  }

  if (opts.villa) {
    section(`${id}: 3D villa explorer`);
    const p = await newPage(ctx);
    await p.goto(`${base}${opts.villa}?quality=low`, { waitUntil: 'load' });
    await p.locator('[data-villa-explorer]').scrollIntoViewIfNeeded();
    await p.waitForFunction(() => document.querySelector('[data-villa-explorer]')?.dataset.state === 'ready', null, { timeout: 30000 }).catch(() => {});
    await p.waitForFunction(() => document.querySelector('[data-villa-explorer]')?.dataset.source, null, { timeout: 30000 }).catch(() => {});
    ok(await p.evaluate(() => document.querySelector('[data-villa-explorer]').dataset.state) === 'ready', `${id}: villa explorer ready`);
    const src = await p.evaluate(() => document.querySelector('[data-villa-explorer]').dataset.source);
    ok(src === opts.villaSource, `${id}: villa model source ${src} (expected ${opts.villaSource})`);
    await p.locator('.villa-hotspot').first().click();
    ok(await p.locator('[data-villa-info]').isVisible(), `${id}: villa hotspot info`);
    ok(p.errors.length === 0, `${id}: villa console errors ${p.errors.join(' | ')}`);
    await p.close();
  }

  section(`${id}: reduced motion & mobile`);
  const rmCtx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const rm = await newPage(rmCtx);
  await rm.goto(`${base}/?webgl=0`, { waitUntil: 'load' });
  await rm.waitForTimeout(400);
  ok(await rm.evaluate(() => [...document.querySelectorAll('[data-reveal]')].every((e) => getComputedStyle(e).visibility !== 'hidden')), `${id}: all content visible with reduced motion`);
  ok(await rm.evaluate(() => !document.documentElement.classList.contains('motion-ready')), `${id}: motion disabled under prefers-reduced-motion`);
  await rmCtx.close();

  const mCtx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  for (const r of routes.slice(0, opts.mobilePages ?? 6)) {
    const m = await newPage(mCtx);
    await m.goto(`${base}${r}?webgl=0`, { waitUntil: 'load' });
    await m.waitForTimeout(200);
    const over = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(over <= 1, `${id} ${r}: no horizontal overflow on mobile (${over}px)`);
    ok(await m.locator('.dock').isVisible(), `${id} ${r}: mobile dock visible`);
    await m.close();
  }
  await mCtx.close();

  // Motion bundle runs without errors on a real (motion-enabled) load
  const mot = await newPage(ctx);
  await mot.goto(`${base}/?webgl=0`, { waitUntil: 'load' });
  await mot.waitForFunction(() => window.__motion === true, null, { timeout: 8000 }).catch(() => {});
  ok(await mot.evaluate(() => window.__motion === true), `${id}: motion system initialised`);
  for (let i = 0; i < 8; i++) { await mot.mouse.wheel(0, 900); await mot.waitForTimeout(150); }
  ok(mot.errors.length === 0, `${id}: errors while scrolling ${mot.errors.join(' | ')}`);
  await browser.close();
  srv.close();
}

/* ------------------------------------------------------------------ */
const only = process.argv[2];
const run = async (id, o) => { if (!only || only === id) await testPreset(id, o); };

await run('coastal', { map: '/map/', planner: '/planner/', villa: '/stays/cliff-villa/', villaSource: 'glb', booking: { mode: 'engine', expect: /^https:\/\/booking\.example\.com\/ondara\?arrival=\d{4}-\d{2}-\d{2}&departure=.*adults=2.*room=.*lang=en/ } });
await run('mountain', { map: '/mapa/', planner: '/planejador/', villa: '/acomodacoes/cabana-da-crista/', villaSource: 'procedural', booking: { mode: 'whatsapp', expect: /^https:\/\/wa\.me\/\d+\?text=.*Check-in/ } });
await run('wellness', { map: '/map/', planner: '/planner/', booking: { mode: 'email', expect: /^mailto:arrivals@ouren\.example\.com\?subject=/ } });

// White-label variant: remove/reorder sections, disable a page, GLB world, editorial hero, booking disabled.
if (!only || only === 'variant') {
  section('variant preset: build');
  const dirV = path.join(root, 'src/presets/_e2e');
  mkdirSync(dirV, { recursive: true });
  writeFileSync(path.join(dirV, 'index.ts'), `
import base from '../coastal/index';
const c = structuredClone(base);
c.id = '_e2e';
c.hero = { ...c.hero, mode: 'editorial' };
c.booking = { ...c.booking, mode: 'disabled' };
c.world = { ...c.world!, mode: 'model', model: { src: '/models/villa.glb', scale: 4, position: [0, 0, 0], rotationY: 0, keepWater: true } };
c.pages = c.pages.filter((p) => p.id !== 'gallery');
const dining = c.pages.find((p) => p.id === 'dining')!; dining.enabled = false;
const home = c.pages.find((p) => p.id === 'home')!;
home.sections = home.sections.filter((s) => s.type !== 'landscape');
home.sections.find((s) => s.type === 'gallery')!.order = 1.5;
export default c;
`);
  try {
    execSync('npx astro build --outDir dist/_e2e', { cwd: root, env: { ...process.env, RESORT_PRESET: '_e2e' }, stdio: 'pipe' });
    ok(true, 'variant builds');
    const dir = path.join(root, 'dist/_e2e');
    ok(!existsSync(path.join(dir, 'dining')), 'disabled page is not generated');
    ok(!existsSync(path.join(dir, 'gallery')), 'removed page is not generated');
    const homeHtml = readFileSync(path.join(dir, 'index.html'), 'utf8');
    ok(!homeHtml.includes('data-section="landscape"'), 'removed section absent');
    ok(homeHtml.indexOf('data-section="gallery"') < homeHtml.indexOf('data-section="introduction"'), 'gallery reordered before introduction');
    ok(homeHtml.indexOf('data-section="gallery"') > homeHtml.indexOf('data-section="manifesto"'), 'order is stable for other sections');
    ok(!/href="\/dining\//.test(htmlFiles(dir).map((f) => readFileSync(f, 'utf8')).join('')), 'no links to the disabled page');
    ok(homeHtml.includes('hero--editorial'), 'hero modality switched by config');
    await testPreset('_e2e', { map: '/map/', booking: { mode: 'disabled' }, minPages: 8, mobilePages: 2 });
  } catch (e) {
    ok(false, `variant build failed: ${e.stderr?.toString().slice(-800) ?? e.message}`);
  } finally {
    rmSync(dirV, { recursive: true, force: true });
  }
}

console.log(`\n${passes} checks passed, ${failures} failed`);
process.exit(failures ? 1 : 0);
