/**
 * Loads the active preset (RESORT_PRESET env var, default "coastal"),
 * validates it with zod and cross-checks references. Build-time only.
 */
import { ResortConfigZ, type ResortConfig } from './schema';
import { sectionContentSchemas } from '../sections/schemas';

const modules = import.meta.glob<{ default: unknown }>('../presets/*/index.ts', { eager: true });

export const PRESET_ID = (process.env.RESORT_PRESET || 'coastal').trim();

function load(): ResortConfig {
  const key = `../presets/${PRESET_ID}/index.ts`;
  const mod = modules[key];
  if (!mod) {
    const available = Object.keys(modules).map((k) => k.split('/')[2]).join(', ');
    throw new Error(`[config] Preset "${PRESET_ID}" not found. Available: ${available}`);
  }
  const parsed = ResortConfigZ.safeParse(mod.default);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`);
    throw new Error(`[config] Invalid configuration in preset "${PRESET_ID}":\n${lines.join('\n')}`);
  }
  const cfg = parsed.data;
  crossCheck(cfg);
  return cfg;
}

function crossCheck(cfg: ResortConfig) {
  const errors: string[] = [];
  const dupes = (label: string, values: string[]) => {
    const seen = new Set<string>();
    for (const v of values) {
      if (seen.has(v)) errors.push(`Duplicate ${label}: "${v}"`);
      seen.add(v);
    }
  };
  dupes('page id', cfg.pages.map((p) => p.id));
  dupes('page path', cfg.pages.filter((p) => p.enabled).map((p) => p.path));
  dupes('stay slug', cfg.stays.map((s) => s.slug));
  dupes('experience slug', cfg.experiences.map((s) => s.slug));
  dupes('dining slug', cfg.dining.map((s) => s.slug));
  dupes('poi id', cfg.pois.map((s) => s.id));

  const poiIds = new Set(cfg.pois.map((p) => p.id));
  const catIds = new Set(cfg.experienceCategories.map((c) => c.id));
  const interestIds = new Set(cfg.plannerInterests.map((c) => c.id));
  for (const s of cfg.stays) if (s.poi && !poiIds.has(s.poi)) errors.push(`stay "${s.slug}" references unknown poi "${s.poi}"`);
  for (const e of cfg.experiences) {
    if (e.poi && !poiIds.has(e.poi)) errors.push(`experience "${e.slug}" references unknown poi "${e.poi}"`);
    if (!catIds.has(e.category)) errors.push(`experience "${e.slug}" uses unknown category "${e.category}"`);
    for (const i of e.interests) if (!interestIds.has(i)) errors.push(`experience "${e.slug}" uses unknown planner interest "${i}"`);
  }
  for (const d of cfg.dining) if (d.poi && !poiIds.has(d.poi)) errors.push(`dining "${d.slug}" references unknown poi "${d.poi}"`);
  if (cfg.booking.mode === 'engine' && !cfg.booking.engine) errors.push('booking.mode "engine" requires booking.engine');
  if (cfg.booking.mode === 'redirect' && !cfg.booking.url) errors.push('booking.mode "redirect" requires booking.url');
  if (cfg.booking.mode === 'whatsapp' && !cfg.contacts.whatsapp) errors.push('booking.mode "whatsapp" requires contacts.whatsapp');
  if (cfg.booking.mode === 'email' && !cfg.contacts.email) errors.push('booking.mode "email" requires contacts.email');
  if (cfg.booking.mode === 'concierge' && !cfg.contacts.concierge) errors.push('booking.mode "concierge" requires contacts.concierge');
  if (cfg.hero.mode === 'video' && !cfg.hero.video) errors.push('hero.mode "video" requires hero.video');
  if (cfg.world?.mode === 'model' && !cfg.world.model) errors.push('world.mode "model" requires world.model.src');
  if (!cfg.pages.some((p) => p.enabled && p.path === '')) errors.push('An enabled home page (path: "") is required');

  // Per-section content schemas
  const allSections = [
    ...cfg.pages.flatMap((p) => p.sections.map((s) => ({ s, where: `page "${p.id}"` }))),
    ...cfg.templates.stay.after.map((s) => ({ s, where: 'templates.stay' })),
    ...cfg.templates.experience.after.map((s) => ({ s, where: 'templates.experience' })),
  ];
  for (const { s, where } of allSections) {
    const schema = sectionContentSchemas[s.type];
    if (!schema) continue;
    const r = schema.safeParse(s.content);
    if (!r.success) {
      for (const i of r.error.issues) errors.push(`${where} › section "${s.id ?? s.type}" content.${i.path.join('.')}: ${i.message}`);
    } else {
      s.content = r.data;
    }
  }

  if (errors.length) throw new Error(`[config] Preset "${PRESET_ID}" has ${errors.length} problem(s):\n  • ${errors.join('\n  • ')}`);
}

export const site: ResortConfig = load();
export default site;
