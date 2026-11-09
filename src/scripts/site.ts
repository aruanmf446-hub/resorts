/** Global behaviour: floating header, menu, booking drawer, sound. */
import './booking';
import './sound';

const html = document.documentElement;
const header = document.querySelector<HTMLElement>('[data-header]');

/* Header: solid after the hero, hides while scrolling down, returns on scroll up. */
let lastY = scrollY;
let direction = 0;
let travel = 0;
const onScroll = () => {
  const y = Math.max(0, scrollY);
  const delta = y - lastY;
  const nextDirection = Math.sign(delta);
  if (nextDirection && nextDirection !== direction) travel = 0;
  if (nextDirection) direction = nextDirection;
  travel += Math.abs(delta);
  const threshold = html.dataset.overlay === 'true' ? innerHeight * 0.75 : 24;
  header?.classList.toggle('is-solid', y > threshold);
  if (y < 300 || html.classList.contains('menu-open')) header?.classList.remove('is-hidden');
  else if (travel > (direction > 0 ? 48 : 24)) header?.classList.toggle('is-hidden', direction > 0);
  lastY = y;
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Accessible modal helper (menu & drawer) */
function modal(el: HTMLElement, openers: NodeListOf<HTMLElement>, closeSel: string, cls: string) {
  let lastFocus: HTMLElement | null = null;
  const focusables = () => Array.from(el.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')).filter((x) => x.offsetParent !== null);
  const open = () => {
    lastFocus = document.activeElement as HTMLElement;
    el.hidden = false;
    html.classList.add(cls);
    document.body.style.overflow = 'hidden';
    openers.forEach((o) => o.setAttribute('aria-expanded', 'true'));
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
    setTimeout(() => focusables()[0]?.focus(), 60);
  };
  const close = () => {
    el.classList.remove('is-open');
    html.classList.remove(cls);
    document.body.style.overflow = '';
    openers.forEach((o) => o.setAttribute('aria-expanded', 'false'));
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(() => { if (!el.classList.contains('is-open')) el.hidden = true; }, reduce ? 0 : 900);
    lastFocus?.focus();
  };
  openers.forEach((o) => o.addEventListener('click', (e) => { e.preventDefault(); open(); }));
  el.querySelectorAll(closeSel).forEach((c) => c.addEventListener('click', close));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = focusables();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  return { open, close };
}

const menu = document.querySelector<HTMLElement>('[data-menu]');
let menuCtl: ReturnType<typeof modal> | null = null;
if (menu) {
  menuCtl = modal(menu, document.querySelectorAll('[data-menu-open]'), '[data-menu-close]', 'menu-open');
  const preview = menu.querySelector<HTMLImageElement>('[data-menu-preview]');
  menu.querySelectorAll<HTMLAnchorElement>('[data-menu-link]').forEach((a) => {
    const swap = () => { if (preview && a.dataset.image && preview.src !== a.dataset.image) { preview.style.opacity = '0'; setTimeout(() => { preview.src = a.dataset.image!; preview.style.opacity = '1'; }, 250); } };
    a.addEventListener('mouseenter', swap);
    a.addEventListener('focus', swap);
  });
  // Links to the map page from the menu should close the menu (same-page hashes).
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => { if (a.pathname === location.pathname) menuCtl?.close(); }));
}

const drawer = document.querySelector<HTMLElement>('[data-drawer]');
if (drawer) {
  const ctl = modal(drawer, document.querySelectorAll('[data-book-open]'), '[data-drawer-close]', 'drawer-open');
  document.querySelectorAll('[data-book-open]').forEach((o) => o.addEventListener('click', () => menuCtl?.close()));
  // Preselect an accommodation when opened from a residence page
  document.querySelectorAll<HTMLElement>('[data-book-open][data-stay]').forEach((o) => o.addEventListener('click', () => {
    const sel = drawer.querySelector<HTMLSelectElement>('select[name="accommodation"]');
    if (sel) sel.value = o.dataset.stay!;
  }));
  if (location.hash === '#book') ctl.open();
}
