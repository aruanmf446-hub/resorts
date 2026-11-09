/** Build-time context shared by every component. */
import { site } from '../config';
import { createLinker, pageHref } from './links';
import { useT } from '../i18n/ui';
import type { PageConfig } from '../config/schema';

export { site };
export const link = createLinker(site);
export const t = useT(site.locale);
export const enabledPages = site.pages.filter((p) => p.enabled);
export const pageById = (id: string): PageConfig | undefined => enabledPages.find((p) => p.id === id);

/** Navigation generated from enabled pages — removing a page removes its links. */
export const navItems = (group?: 'primary' | 'secondary') =>
  enabledPages
    .filter((p) => p.nav.show && (!group || p.nav.group === group))
    .sort((a, b) => a.nav.order - b.nav.order)
    .map((p) => ({ id: p.id, label: p.nav.label ?? p.title, href: pageHref(p.path), image: firstImage(p) }));

function firstImage(p: PageConfig) {
  for (const s of p.sections) {
    const c = s.content as Record<string, unknown>;
    const img = (c.image ?? (c.images as unknown[] | undefined)?.[0]) as { src: string } | undefined;
    if (img?.src) return img.src;
  }
  return undefined;
}

export const bookingEnabled = site.booking.mode !== 'disabled';
export const bookingHref = link.resolve('booking');

export const stayById = (slug: string) => site.stays.find((s) => s.slug === slug);
export const categoryLabel = (id: string) => site.experienceCategories.find((c) => c.id === id)?.label ?? id;

/** POI data for the 3D world / map (serialisable). */
export const poiPayload = () =>
  site.pois.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    position: p.position,
    mapPosition: p.mapPosition,
    structure: p.structure,
    summary: p.summary,
    image: p.image ? { src: p.image.src, alt: p.image.alt } : null,
    href: link.resolve(p.link),
    linkLabel: p.link?.startsWith('stay:') ? 'stay' : p.link?.startsWith('experience:') ? 'experience' : 'page',
  }));
