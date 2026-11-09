import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ResortConfigZ } from '../../src/config/schema';
import { sectionContentSchemas } from '../../src/sections/schemas';
import { createLinker } from '../../src/lib/links';
import { activeSections, rich } from '../../src/lib/sections';
import coastal from '../../src/presets/coastal/index';
import mountain from '../../src/presets/mountain/index';
import wellness from '../../src/presets/wellness/index';

const presets = { coastal, mountain, wellness };

for (const [id, raw] of Object.entries(presets)) {
  test(`preset "${id}" validates, including every section content`, () => {
    const cfg = ResortConfigZ.parse(raw);
    for (const p of cfg.pages) for (const s of p.sections) {
      const r = sectionContentSchemas[s.type].safeParse(s.content);
      assert.ok(r.success, `${id} › ${p.id} › ${s.type}: ${!r.success && r.error.issues.map((i) => i.path.join('.') + ' ' + i.message).join('; ')}`);
    }
  });

  test(`preset "${id}" has no unresolvable internal links in enabled sections`, () => {
    const cfg = ResortConfigZ.parse(raw);
    const link = createLinker(cfg);
    const hrefs: string[] = [];
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if ((k === 'href' || k === 'link') && typeof x === 'string') hrefs.push(x); else walk(x); }
    };
    cfg.pages.filter((p) => p.enabled).forEach((p) => walk(activeSections(p.sections).map((s) => s.content)));
    cfg.pois.forEach((p) => p.link && hrefs.push(p.link));
    const broken = hrefs.filter((h) => link.resolve(h) === null);
    assert.deepEqual(broken, []);
  });
}

test('presets are genuinely different art directions', () => {
  const c = [coastal, mountain, wellness].map((p) => ResortConfigZ.parse(p));
  assert.equal(new Set(c.map((x) => x.theme.fonts.display.family)).size, 3);
  assert.equal(new Set(c.map((x) => x.hero.mode)).size, 3);
  assert.equal(new Set(c.map((x) => x.theme.nav.style)).size, 3);
  assert.equal(new Set(c.map((x) => x.booking.mode)).size, 3);
});

test('links to disabled pages resolve to null (no broken links)', () => {
  const cfg = ResortConfigZ.parse(structuredClone(coastal));
  cfg.pages.find((p) => p.id === 'dining')!.enabled = false;
  const link = createLinker(cfg);
  assert.equal(link.resolve('page:dining'), null);
  assert.equal(link.resolve('dining:mare'), null);
  assert.equal(link.resolve('page:map'), '/map/');
  assert.equal(link.resolve('poi:spa'), '/map/#poi-spa');
  assert.equal(link.resolve('stay:cliff-villa'), '/stays/cliff-villa/');
  assert.equal(link.resolve('stay:nope'), null);
});

test('sections: disabled removed, explicit order respected, stable otherwise', () => {
  const s = (type: string, extra = {}) => ({ type, enabled: true, content: {}, assets: {}, animation: 'auto', ...extra }) as never;
  const out = activeSections([s('hero'), s('manifesto', { enabled: false }), s('gallery', { order: -1 }), s('contact')]);
  assert.deepEqual(out.map((x: { type: string }) => x.type), ['gallery', 'hero', 'contact']);
});

test('rich text escapes HTML and supports emphasis', () => {
  assert.equal(rich('A *b* <script>'), 'A <em>b</em> &lt;script&gt;');
});
