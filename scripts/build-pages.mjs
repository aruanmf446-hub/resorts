/** Reproducible GitHub Pages bundle; also used by the local subpath smoke test. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, cpSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const output = path.resolve('dist/pages');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const demos = [
  { id: 'coastal', name: 'Ondara', text: 'Luz sobre a lagoa. Sombra sob as palmeiras.', image: 'hero-poster.webp' },
  { id: 'mountain', name: 'Altvale', text: 'Madeira, névoa e o calor da lareira.', image: 'hero-poster.webp' },
  { id: 'wellness', name: 'Ouren', text: 'Água quieta. Pedra morna. Espaço para respirar.', image: 'hero-1.webp' },
];
for (const { id } of demos) {
  const dest = path.resolve(`dist/pages-build/${id}`);
  execFileSync('npm', ['run', 'build', '--', '--outDir', dest], {
    stdio: 'inherit', env: { ...process.env, RESORT_PRESET: id, BASE_PATH: `/resorts/${id}/`, SITE_URL: `https://aruanmf446-hub.github.io/resorts/${id}` },
  });
  cpSync(dest, path.join(output, id), { recursive: true });
}
writeFileSync(path.join(output, '.nojekyll'), '');
const head = `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;background:#f4f0e8;color:#302e27;font:17px/1.6 system-ui}main{max-width:1380px;margin:auto;padding:9vh 5vw}h1,h2{font-family:Georgia,serif;font-weight:400;line-height:1.1}h1{font-size:clamp(38px,6vw,80px);max-width:850px}h2{font-size:36px;margin:24px 0 12px}p{max-width:680px}nav{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:30px;margin-top:60px}a{color:inherit;text-decoration:none}a:focus-visible{outline:3px solid #77603e;outline-offset:8px}img{width:100%;aspect-ratio:4/3;object-fit:cover}small{letter-spacing:.12em}footer{margin-top:60px;border-top:1px solid #ccc4b7;padding-top:24px}</style>`;
writeFileSync(path.join(output, 'index.html'), `<!doctype html><html lang="pt-BR"><head>${head}<title>THE WORLD BEYOND — Três formas de ficar</title><meta name="description" content="Três resorts fictícios, um template estático. Explore Ondara, Altvale e Ouren em demonstrações de design, conteúdo e experiências interativas."></head><body><main><small>THE WORLD BEYOND · RESORT EXPERIENCE 2026</small><h1>Três paisagens.<br>Um convite a ficar.</h1><p>Um template de sites para hotelaria. Explore três vozes, três ritmos e a mesma estrutura flexível.</p><nav aria-label="Demonstrações">${demos.map(d=>`<a href="/resorts/${d.id}/"><img src="/resorts/${d.id}/media/${d.id}/${d.image}" alt="Paisagem ilustrada do resort fictício ${d.name}" loading="lazy"><h2>${d.name}</h2><p>${d.text}</p><span>Explorar demonstração →</span></a>`).join('')}</nav><footer>Marcas, lugares e imagens fictícios · Conteúdo demonstrativo<br><span lang="en">Fictional resorts · demonstration content</span></footer></main></body></html>`);
writeFileSync(path.join(output, '404.html'), `<!doctype html><html lang="pt-BR"><head>${head}<title>Página não encontrada — THE WORLD BEYOND</title></head><body><main><h1>O caminho termina aqui.</h1><p><a href="/resorts/">Voltar às três demonstrações →</a></p></main></body></html>`);
