/**
 * Controller for <WorldMap>: mounts the 3D world when the device can handle it,
 * keeps HTML hotspots in sync, and degrades gracefully (no WebGL, context loss).
 */
import { detectCapability, prefersReducedMotion } from './world/capability';
import type { WorldData, PoiData, TimeName, SeasonName } from './world/types';

type Payload = { data: WorldData; pois: (PoiData & { href: string | null })[]; interactive: boolean; intro: boolean; variant: string; strings: Record<string, string> };

export function mountWorldMaps() {
  if (new URLSearchParams(location.search).has('capture')) document.documentElement.classList.add('capture');
  document.querySelectorAll<HTMLElement>('[data-world]').forEach((root) => {
    if (root.dataset.mounted) return;
    root.dataset.mounted = '1';
    const cap = detectCapability();
    root.dataset.capability = cap.reason ?? cap.quality;
    setupUi(root); // list, filters and panel work in fallback mode too
    if (!cap.webgl) return;
    const start = () => boot(root, cap.quality).catch((e) => { console.warn('[world] fallback', e); root.dataset.state = 'fallback'; });
    if (root.classList.contains('wm--hero')) start();
    else {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); start(); } }, { rootMargin: '400px' });
      io.observe(root);
    }
  });
}

type WorldLike = {
  focusPoi(id: string): void; select(id: string | null): void; resetView(): void; setTime(t: TimeName): void; setSeason(s: SeasonName): void;
  project(): { id: string; x: number; y: number; visible: boolean; depth: number }[]; dispose(): void; onFrame?: () => void; requestFrame(): void;
};

const controllers = new WeakMap<HTMLElement, { focus: (id: string) => void; world?: WorldLike }>();

function setupUi(root: HTMLElement) {
  const panel = root.querySelector<HTMLElement>('[data-panel]');
  const ctl: { focus: (id: string) => void; world?: WorldLike } = { focus: () => {} };
  controllers.set(root, ctl);
  const open = (id: string | null) => {
    if (!panel) return;
    panel.hidden = !id;
    panel.querySelectorAll<HTMLElement>('[data-panel-for]').forEach((a) => (a.hidden = a.dataset.panelFor !== id));
    root.querySelectorAll<HTMLElement>('[data-poi]').forEach((b) => b.setAttribute('aria-current', String(b.dataset.poi === id)));
    root.querySelectorAll<HTMLElement>('.hs').forEach((h) => h.classList.toggle('is-active', h.dataset.id === id));
  };
  ctl.focus = (id: string) => {
    open(id);
    ctl.world?.focusPoi(id);
    if (history.replaceState && root.classList.contains('wm--full')) history.replaceState(null, '', `#poi-${id}`);
  };
  root.querySelectorAll<HTMLButtonElement>('[data-poi]').forEach((b) => b.addEventListener('click', () => ctl.focus(b.dataset.poi!)));
  root.querySelector('[data-panel-close]')?.addEventListener('click', () => { open(null); ctl.world?.select(null); });
  root.querySelector('[data-reset]')?.addEventListener('click', () => { open(null); ctl.world?.resetView(); });
  root.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    const f = b.dataset.filter;
    root.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    root.querySelectorAll<HTMLElement>('.wm__list li').forEach((li) => (li.hidden = !!f && li.dataset.cat !== f));
    root.querySelectorAll<HTMLElement>('.hs').forEach((h) => h.classList.toggle('is-dim', !!f && h.dataset.cat !== f));
  }));
  // Deep link: /map/#poi-<id>
  const m = location.hash.match(/^#poi-([a-z0-9-]+)$/);
  if (m && root.querySelector(`[data-poi="${m[1]}"]`)) setTimeout(() => ctl.focus(m[1]), 50);
}

async function boot(root: HTMLElement, quality: 'high' | 'low') {
  const payload: Payload = JSON.parse(root.dataset.world!);
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  root.dataset.state = 'loading';
  const { World } = await import('./world/World');
  const reduced = prefersReducedMotion();
  let world: InstanceType<typeof World>;
  try {
    world = new World({
      canvas, data: payload.data, pois: payload.pois, quality,
      interactive: payload.interactive,
      intro: payload.intro,
      drift: payload.variant === 'hero',
      reducedMotion: reduced,
      onReady: () => { root.dataset.state = 'ready'; root.dispatchEvent(new CustomEvent('world:ready', { bubbles: true })); },
      onContextLost: () => {
        root.dataset.state = 'fallback';
        world.dispose();
        // Try once to come back when the GPU recovers.
        canvas.addEventListener('webglcontextrestored', () => { delete root.dataset.mounted; location.reload(); }, { once: true });
      },
    });
  } catch (e) {
    root.dataset.state = 'fallback';
    throw e;
  }
  const ctl = controllers.get(root)!;
  ctl.world = world;
  window.addEventListener('pagehide', () => world.dispose(), { once: true });

  if (!payload.interactive) return;

  // Hotspot layer synchronised with the camera every rendered frame.
  const layer = root.querySelector<HTMLElement>('[data-hotspots]')!;
  const els = new Map<string, HTMLButtonElement>();
  for (const p of payload.pois) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hs';
    b.dataset.id = p.id;
    b.dataset.cat = p.category;
    b.setAttribute('aria-label', p.name);
    b.tabIndex = -1; // keyboard users use the Places list (same actions)
    const dot = document.createElement('span'); dot.className = 'hs__dot';
    const lab = document.createElement('span'); lab.className = 'hs__label'; lab.textContent = p.name;
    b.append(dot, lab);
    b.addEventListener('click', () => ctl.focus(p.id));
    layer.appendChild(b);
    els.set(p.id, b);
  }
  world.onFrame = () => {
    for (const p of world.project()) {
      const el = els.get(p.id)!;
      el.style.visibility = p.visible ? 'visible' : 'hidden';
      el.style.transform = `translate(${p.x - 6}px, ${p.y - 16}px)`;
      el.style.zIndex = String(1000 - Math.round(p.depth));
    }
  };
  world.requestFrame();

  root.querySelectorAll<HTMLButtonElement>('[data-time]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-time]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    world.setTime(b.dataset.time as TimeName);
  }));
  root.querySelectorAll<HTMLButtonElement>('[data-season]').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('[data-season]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
    world.setSeason(b.dataset.season as SeasonName);
  }));
  const m = location.hash.match(/^#poi-([a-z0-9-]+)$/);
  if (m) setTimeout(() => world.focusPoi(m[1]), 400);
}
