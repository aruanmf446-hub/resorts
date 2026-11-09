import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const dir=path.resolve('dist/pages');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.mp4':'video/mp4','.webm':'video/webm','.vtt':'text/vtt','.glb':'model/gltf-binary'};
const server=createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(!url.pathname.startsWith('/resorts/')){res.writeHead(404);return res.end();}
 let f=path.join(dir,decodeURIComponent(url.pathname.slice('/resorts/'.length)));
 if(existsSync(f)&&statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!existsSync(f)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(readFileSync(f));
});
await new Promise(r=>server.listen(0,r));
const origin=`http://localhost:${server.address().port}`;
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--use-angle=swiftshader','--ignore-gpu-blocklist']});
const errors=[];
try{
 const portal = await fetch(origin+'/resorts/');
 assert.equal(portal.status,200);
 const portalHtml=await portal.text();
 for(const m of portalHtml.matchAll(/(?:href|src)="(\/resorts\/[^"#]*)"/g))assert.equal((await fetch(origin+m[1])).status,200,m[1]);
 assert.equal((await fetch(origin+'/resorts/404.html')).status,200);
 for(const id of ['coastal','mountain','wellness']){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(`${id}: ${e.message}`));
  page.on('response',r=>{if(r.url().startsWith(origin)&&r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  const files=readdirSync(path.join(dir,id),{recursive:true}).filter(f=>f.endsWith('.html')&&!f.includes('404'));
  const urls=new Set();
  console.log(`${id}: checking ${files.length} pages under /resorts/${id}/`);
  for(const file of files){
   const route=`/resorts/${id}/`+file.replace(/index\.html$/,'');
   await page.goto(origin+route+'?webgl=0',{waitUntil:'load'});
   // Fetch every image without introducing artificial scrolling into the URL audit.
   await page.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('img').forEach(img => { img.loading = 'eager'; }); });
   await page.waitForTimeout(350);
   const found=await page.evaluate(()=>{
    const result=[];
    function walk(v){if(typeof v==='string'&&v.startsWith('/'))result.push(v);else if(v&&typeof v==='object')Object.values(v).forEach(walk);}
    document.querySelectorAll('[href],[src],[poster],[data-src],[data-world],[data-planner],[data-booking],[data-gallery-items]').forEach(el=>{
     for(const a of el.attributes){if(['href','src','poster','data-src','data-src-mobile','data-webm'].includes(a.name)&&a.value.startsWith('/'))result.push(a.value);
      if(['data-world','data-planner','data-booking'].includes(a.name))walk(JSON.parse(a.value));}
     if(el.matches('[data-gallery-items]'))walk(JSON.parse(el.textContent));
    });return result;
   });
   found.forEach(u=>urls.add(u));
   const seo=await page.locator('meta[name="description"]').getAttribute('content');
   assert.ok(seo.length>=120&&seo.length<=160,`${id} ${file}: SEO length ${seo.length}`);
  }
  for(const u of urls){assert.ok(u.startsWith(`/resorts/${id}/`),`Unbased URL: ${u}`);const res=await fetch(origin+u);assert.equal(res.status,200,u);await res.arrayBuffer();}
  // Mount the actual world, villa and panorama with the same base path.
  for (const route of (id === 'coastal' ? ['map/', 'stays/cliff-villa/', 'discover/'] : id === 'mountain' ? ['mapa/', 'acomodacoes/cabana-da-crista/'] : ['map/', 'sanctuary/'])) {
    await page.goto(`${origin}/resorts/${id}/${route}`, { waitUntil: 'load' });
    for (const selector of ['main [data-world]', 'main [data-villa-explorer]', 'main [data-panorama]']) {
      if (!await page.locator(selector).count()) continue;
      await page.locator(selector).first().scrollIntoViewIfNeeded();
      await page.waitForFunction(sel => document.querySelector(sel)?.dataset.state === 'ready', selector, { timeout: 45000 });
    }
  }
  console.log(`${id}: ${files.length} pages, ${urls.size} local URLs checked; interactive assets loaded`);
  await ctx.close();
  for (const mode of ['no-js', 'reduced', 'failed-bundle']) {
    const fallback = await browser.newContext({ javaScriptEnabled: mode !== 'no-js', reducedMotion: mode === 'reduced' ? 'reduce' : 'no-preference', viewport: { width: mode === 'reduced' ? 390 : 1440, height: 900 } });
    if (mode === 'failed-bundle') await fallback.route('**/_astro/*.js', route => route.abort());
    const view = await fallback.newPage();
    await view.goto(`${origin}/resorts/${id}/?webgl=0`, { waitUntil: 'load' });
    if (mode === 'failed-bundle') await view.waitForTimeout(3700);
    assert.ok(await view.locator('[data-reveal]').evaluateAll(elements => elements.every(el => getComputedStyle(el).visibility !== 'hidden')), `${id}: visible content in ${mode}`);
    if (mode !== 'failed-bundle') assert.equal(await view.locator('.chapters--pinned').count(), 0, `${id}: stacked chapters in ${mode}`);
    await fallback.close();
  }
 }
 assert.deepEqual(errors,[]);
 console.log('GitHub Pages subpath smoke checks passed');
}finally{await browser.close();await new Promise(r=>server.close(r));}
