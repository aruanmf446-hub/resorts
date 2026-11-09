/** Turns the theme config into CSS custom properties + structural data attributes. */
import type { Theme } from '../config/schema';

const hexToRgb = (hex: string) => {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

const rhythm = { airy: 1.25, balanced: 1, dense: 0.78 } as const;

export function themeCss(t: Theme) {
  const c = t.colors;
  const font = (f: Theme['fonts']['display']) => `"${f.family}", ${f.fallback}`;
  const accent = t.fonts.accent ?? t.fonts.display;
  const vars: Record<string, string | number> = {
    '--c-bg': c.bg,
    '--c-bg-alt': c.bgAlt,
    '--c-ink': c.ink,
    '--c-ink-soft': c.inkSoft,
    '--c-line': c.line,
    '--c-accent': c.accent,
    '--c-accent-ink': c.accentInk,
    '--c-dark': c.dark,
    '--c-dark-ink': c.darkInk,
    '--c-dark-soft': c.darkSoft,
    '--rgb-ink': hexToRgb(c.ink),
    '--rgb-bg': hexToRgb(c.bg),
    '--rgb-dark': hexToRgb(c.dark),
    '--rgb-accent': hexToRgb(c.accent),
    '--f-display': font(t.fonts.display),
    '--f-body': font(t.fonts.body),
    '--f-accent': font(accent),
    '--fw-display': t.fonts.display.weight,
    '--fw-body': t.fonts.body.weight,
    '--fv-display': t.fonts.display.variation ?? 'normal',
    '--fv-accent': accent.variation ?? 'normal',
    '--fw-accent': accent.weight,
    '--display-case': t.type.displayCase,
    '--display-tracking': t.type.displayTracking,
    '--display-leading': t.type.displayLeading,
    '--eyebrow-case': t.type.eyebrowCase,
    '--type-scale': t.type.scale,
    '--radius': `${t.layout.radius}px`,
    '--rhythm': rhythm[t.layout.rhythm],
    '--max-w': `${t.layout.maxWidth}px`,
  };
  return `:root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';')}}`;
}

export function themeAttrs(t: Theme) {
  return {
    'data-art': t.artDirection,
    'data-nav': t.nav.style,
    'data-nav-mode': t.nav.mode,
    'data-buttons': t.buttons,
    'data-gallery': t.gallery,
    'data-hero': t.heroComposition,
    'data-tone': t.imageTreatment.tone,
    'data-grain': String(t.imageTreatment.grain),
    'data-motion': t.motion.intensity,
    'data-transition': t.motion.pageTransition,
    'data-italic': String(t.type.italicEmphasis),
  };
}
