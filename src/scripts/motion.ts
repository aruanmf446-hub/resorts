/**
 * Motion language — "calm discovery".
 * Declarative: components describe intent with data attributes, this module
 * choreographs them with GSAP + ScrollTrigger. Honors prefers-reduced-motion,
 * the theme intensity and per-section overrides.
 *
 *   data-reveal="lines|words|mask|fade|rise|chars"   data-delay="0.2"
 *   data-parallax="0.12"                              (scrubbed depth)
 *   data-scrub-words                                  (manifesto: words light up with scroll)
 *   data-chapters                                     (pinned crossfading chapters)
 *   data-hscroll                                      (pinned horizontal track, desktop)
 *   data-count="14"                                   (number roll)
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

type Intensity = 'none' | 'subtle' | 'cinematic';
const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const globalIntensity = (reduced ? 'none' : root.dataset.motion || 'cinematic') as Intensity;

const intensityOf = (el: Element): Intensity => {
  if (reduced) return 'none';
  const sec = el.closest<HTMLElement>('[data-animation]');
  const v = sec?.dataset.animation;
  return v && v !== 'auto' ? (v as Intensity) : globalIntensity;
};

const EASE = 'expo.out';
const show = (el: Element) => el.classList.add('is-revealed');

function reveal(el: HTMLElement) {
  const kind = el.dataset.reveal;
  const level = intensityOf(el);
  const delay = Number(el.dataset.delay || 0);
  if (level === 'none') { show(el); el.style.clipPath = 'none'; return; }
  const k = level === 'cinematic' ? 1 : 0.55;
  const start = el.dataset.start || 'top 86%';

  const run = (fn: () => void) => ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn });

  switch (kind) {
    case 'lines':
    case 'chars': {
      document.fonts.ready.then(() => {
        const split = SplitText.create(el, { type: kind === 'chars' ? 'lines,chars' : 'lines', mask: 'lines', linesClass: 'line', autoSplit: true,
          onSplit(self) {
            const targets = kind === 'chars' ? self.chars : self.lines;
            gsap.set(targets, { yPercent: 110 });
            show(el);
            return gsap.to(targets, {
              yPercent: 0, duration: 1.5 * k + 0.2, ease: EASE, delay,
              stagger: kind === 'chars' ? 0.025 : 0.11,
              scrollTrigger: { trigger: el, start, once: true },
            });
          },
        });
        void split;
      });
      break;
    }
    case 'words': {
      const split = SplitText.create(el, { type: 'words' });
      gsap.set(split.words, { opacity: 0, y: 14 * k, filter: `blur(${6 * k}px)` });
      show(el);
      run(() => gsap.to(split.words, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.2, ease: 'power2.out', stagger: 0.03, delay }));
      break;
    }
    case 'mask': {
      const img = el.querySelector('img, video, canvas');
      gsap.set(el, { clipPath: 'inset(0 0 100% 0)' });
      if (img) gsap.set(img, { scale: 1 + 0.18 * k });
      show(el);
      run(() => {
        gsap.to(el, { clipPath: 'inset(0 0 0% 0)', duration: 1.6 * k + 0.3, ease: 'expo.inOut', delay });
        if (img) gsap.to(img, { scale: 1, duration: 2.2 * k + 0.4, ease: 'expo.out', delay });
      });
      break;
    }
    case 'rise': {
      gsap.set(el, { y: 60 * k, opacity: 0 });
      show(el);
      run(() => gsap.to(el, { y: 0, opacity: 1, duration: 1.4, ease: EASE, delay }));
      break;
    }
    case 'stagger': {
      const kids = Array.from(el.children);
      gsap.set(kids, { y: 30 * k, opacity: 0 });
      show(el);
      run(() => gsap.to(kids, { y: 0, opacity: 1, duration: 1.1, ease: EASE, stagger: 0.08, delay }));
      break;
    }
    default: {
      gsap.set(el, { opacity: 0, y: 18 * k });
      show(el);
      run(() => gsap.to(el, { opacity: 1, y: 0, duration: 1.2, ease: 'power2.out', delay }));
    }
  }
}

function parallax(el: HTMLElement) {
  if (intensityOf(el) !== 'cinematic') return;
  const amount = Number(el.dataset.parallax || 0.12);
  gsap.fromTo(el, { yPercent: -amount * 50 }, {
    yPercent: amount * 50, ease: 'none',
    scrollTrigger: { trigger: el.parentElement || el, start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

function scrubWords(el: HTMLElement) {
  if (intensityOf(el) === 'none') return;
  const split = SplitText.create(el, { type: 'words' });
  gsap.set(split.words, { opacity: 0.16 });
  gsap.to(split.words, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: 0.6 },
  });
}

function chapters(el: HTMLElement) {
  const panes = gsap.utils.toArray<HTMLElement>(el.querySelectorAll('[data-chapter-media]'));
  const texts = gsap.utils.toArray<HTMLElement>(el.querySelectorAll('[data-chapter-text]'));
  const progress = el.querySelector<HTMLElement>('[data-chapter-progress]');
  if (intensityOf(el) === 'none' || panes.length < 2 || matchMedia('(max-width: 760px)').matches) {
    el.classList.add('chapters--static');
    return;
  }
  el.classList.add('chapters--pinned');
  gsap.set(panes.slice(1), { clipPath: 'inset(100% 0 0 0)' });
  gsap.set(texts.slice(1), { opacity: 0, y: 40 });
  const tl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${window.innerHeight * (panes.length - 0.3)}`, scrub: 0.8, pin: el.querySelector('[data-chapter-stage]') as HTMLElement, anticipatePin: 1 },
  });
  panes.forEach((p, i) => {
    if (i === 0) return;
    tl.to(texts[i - 1], { opacity: 0, y: -40, duration: 0.4 }, i - 0.6)
      .to(p, { clipPath: 'inset(0% 0 0 0)', duration: 1 }, i - 1)
      .fromTo(p.querySelector('img'), { scale: 1.2 }, { scale: 1, duration: 1.2 }, i - 1)
      .to(texts[i], { opacity: 1, y: 0, duration: 0.4 }, i - 0.35);
  });
  if (progress) tl.fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: panes.length - 1, ease: 'none' }, 0);
}

function hscroll(el: HTMLElement) {
  const track = el.querySelector<HTMLElement>('[data-hscroll-track]');
  if (!track || intensityOf(el) === 'none') return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const dist = () => Math.max(0, track.scrollWidth - el.clientWidth + 64);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: () => `+=${dist()}`, scrub: 0.6, pin: true, invalidateOnRefresh: true },
    });
  });
}

function counter(el: HTMLElement) {
  const raw = el.dataset.count || '';
  const m = raw.match(/^([^\d]*)(\d+(?:\.\d+)?)(.*)$/);
  if (!m || intensityOf(el) === 'none') return;
  const [, pre, num, post] = m;
  const obj = { v: 0 };
  ScrollTrigger.create({
    trigger: el, start: 'top 90%', once: true,
    onEnter: () => gsap.to(obj, { v: Number(num), duration: 2, ease: 'power2.out', onUpdate: () => { el.textContent = `${pre}${Math.round(obj.v)}${post}`; } }),
  });
}

function init() {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(reveal);
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach(parallax);
  document.querySelectorAll<HTMLElement>('[data-scrub-words]').forEach(scrubWords);
  document.querySelectorAll<HTMLElement>('[data-chapters]').forEach(chapters);
  document.querySelectorAll<HTMLElement>('[data-hscroll]').forEach(hscroll);
  document.querySelectorAll<HTMLElement>('[data-count]').forEach(counter);
  (window as unknown as { __motion: boolean }).__motion = true;
  // Late layout changes (fonts, images) — keep triggers accurate.
  window.addEventListener('load', () => ScrollTrigger.refresh());
}

if (globalIntensity === 'none') {
  root.classList.remove('motion-ready');
  (window as unknown as { __motion: boolean }).__motion = true;
} else {
  init();
}

window.addEventListener('pagehide', () => ScrollTrigger.getAll().forEach((t) => t.kill()));
