/**
 * Pure booking helpers shared by the build and the browser.
 * Only builds URLs / messages — availability, rates, payment and confirmation
 * always happen on the external system.
 */
export type BookingRequest = {
  checkIn?: string; // YYYY-MM-DD
  checkOut?: string;
  adults?: number;
  children?: number;
  accommodation?: string; // booking code or name
  accommodationName?: string;
  promo?: string;
};

export type EngineConfig = {
  provider: string;
  url: string;
  params: Partial<Record<'checkIn' | 'checkOut' | 'nights' | 'adults' | 'children' | 'accommodation' | 'promo', string>>;
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD-MM-YYYY';
  extra: Record<string, string>;
};

export type Limits = { maxAdults: number; maxChildren: number; minNights: number; maxNights: number; leadDays: number };

const pad = (n: number) => String(n).padStart(2, '0');

export function parseISO(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d ? dt : null;
}

export function toISO(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

export function formatDate(iso: string, fmt: EngineConfig['dateFormat']) {
  const [y, m, d] = iso.split('-');
  switch (fmt) {
    case 'DD/MM/YYYY': return `${d}/${m}/${y}`;
    case 'MM/DD/YYYY': return `${m}/${d}/${y}`;
    case 'DD-MM-YYYY': return `${d}-${m}-${y}`;
    default: return iso;
  }
}

export function nightsBetween(a?: string, b?: string) {
  const da = parseISO(a), db = parseISO(b);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

export type ValidationError = 'required' | 'past' | 'order' | 'min' | 'max' | null;

/** `today` is an ISO date in the visitor's local calendar. */
export function validateDates(req: BookingRequest, limits: Limits, today: string, requireDates = true): ValidationError {
  if (!req.checkIn || !req.checkOut) return requireDates ? 'required' : null;
  const ci = parseISO(req.checkIn), co = parseISO(req.checkOut), td = parseISO(today);
  if (!ci || !co || !td) return 'required';
  const earliest = new Date(td.getTime() + limits.leadDays * 86400000);
  if (ci < earliest) return 'past';
  const n = nightsBetween(req.checkIn, req.checkOut);
  if (n <= 0) return 'order';
  if (n < limits.minNights) return 'min';
  if (n > limits.maxNights) return 'max';
  return null;
}

export function buildEngineUrl(engine: EngineConfig, req: BookingRequest): string {
  const url = new URL(engine.url);
  const p = engine.params;
  const set = (k: string | undefined, v: string | number | undefined) => {
    if (k && v !== undefined && v !== '' && v !== null) url.searchParams.set(k, String(v));
  };
  if (req.checkIn) set(p.checkIn, formatDate(req.checkIn, engine.dateFormat));
  if (req.checkOut) set(p.checkOut, formatDate(req.checkOut, engine.dateFormat));
  if (req.checkIn && req.checkOut) set(p.nights, nightsBetween(req.checkIn, req.checkOut));
  set(p.adults, req.adults);
  set(p.children, req.children);
  set(p.accommodation, req.accommodation);
  set(p.promo, req.promo?.trim());
  for (const [k, v] of Object.entries(engine.extra ?? {})) url.searchParams.set(k, v);
  return url.toString();
}

export function buildMessage(req: BookingRequest, labels: Record<string, string>, resortName: string, intro: string) {
  const lines = [intro, '', resortName];
  if (req.checkIn) lines.push(`${labels.checkIn}: ${req.checkIn}`);
  if (req.checkOut) lines.push(`${labels.checkOut}: ${req.checkOut}`);
  if (req.adults) lines.push(`${labels.adults}: ${req.adults}`);
  if (req.children) lines.push(`${labels.children}: ${req.children}`);
  if (req.accommodationName) lines.push(`${labels.accommodation}: ${req.accommodationName}`);
  if (req.promo) lines.push(`${labels.promo}: ${req.promo}`);
  return lines.join('\n');
}

export const whatsappUrl = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
export const mailtoUrl = (email: string, subject: string, body: string) =>
  `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
