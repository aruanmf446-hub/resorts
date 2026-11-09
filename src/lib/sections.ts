import type { SectionConfig } from '../config/schema';

/** Enabled sections, sorted by explicit `order` (stable for equal / missing order). */
export function activeSections(list: SectionConfig[]) {
  return list
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.enabled)
    .sort((a, b) => (a.s.order ?? a.i) - (b.s.order ?? b.i) || a.i - b.i)
    .map(({ s }) => s);
}

/** Inline emphasis: *word* → <em>word</em>, line breaks with "|". Escapes HTML first. */
export function rich(text: string) {
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\s*\|\s*/g, '<br/>');
}
