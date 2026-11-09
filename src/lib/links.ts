/** Resolves internal link tokens against the enabled pages/items. Returns null when the target is unavailable. */
import type { ResortConfig } from '../config/schema';

export function pageHref(path: string) {
  return path === '' ? '/' : `/${path.replace(/^\/|\/$/g, '')}/`;
}

export function createLinker(cfg: ResortConfig) {
  const pages = new Map(cfg.pages.filter((p) => p.enabled).map((p) => [p.id, p]));
  const stayBase = cfg.templates.stay.enabled ? cfg.templates.stay.basePath : null;
  const expBase = cfg.templates.experience.enabled ? cfg.templates.experience.basePath : null;
  const mapPage = pages.get('map');
  const diningPage = pages.get('dining');

  function resolve(href: string | undefined | null): string | null {
    if (!href) return null;
    if (/^(https?:|mailto:|tel:|#)/.test(href)) return href;
    if (href.startsWith('/')) return href;
    const [kind, ref] = href.split(':');
    switch (kind) {
      case 'page': {
        const [id, hash] = (ref ?? '').split('#');
        const p = pages.get(id);
        return p ? pageHref(p.path) + (hash ? `#${hash}` : '') : null;
      }
      case 'stay':
        return stayBase && cfg.stays.some((s) => s.slug === ref) ? `/${stayBase}/${ref}/` : null;
      case 'experience':
        return expBase && cfg.experiences.some((s) => s.slug === ref) ? `/${expBase}/${ref}/` : null;
      case 'dining':
        return diningPage && cfg.dining.some((d) => d.slug === ref) ? `${pageHref(diningPage.path)}#${ref}` : null;
      case 'poi':
        return mapPage && cfg.pois.some((p) => p.id === ref) ? `${pageHref(mapPage.path)}#poi-${ref}` : null;
      case 'booking': {
        if (cfg.booking.mode === 'disabled') {
          const c = pages.get('contact');
          return c ? pageHref(c.path) : null;
        }
        const b = pages.get('booking');
        return b ? pageHref(b.path) : '#book';
      }
      default:
        return null;
    }
  }
  return {
    resolve,
    stay: (slug: string) => resolve(`stay:${slug}`),
    experience: (slug: string) => resolve(`experience:${slug}`),
    page: (id: string) => resolve(`page:${id}`),
    hasPage: (id: string) => pages.has(id),
  };
}

export const isExternal = (href: string) => /^https?:/.test(href);
