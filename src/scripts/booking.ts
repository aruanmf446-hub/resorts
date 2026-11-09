import { buildEngineUrl, buildMessage, mailtoUrl, nightsBetween, validateDates, whatsappUrl, toISO, type BookingRequest } from '../lib/booking';

type Payload = {
  mode: string;
  engine: Parameters<typeof buildEngineUrl>[0] & { target: string } | null;
  url: string | null;
  limits: { maxAdults: number; maxChildren: number; minNights: number; maxNights: number; leadDays: number };
  whatsapp: string | null;
  whatsappMessage: string;
  email: string | null;
  concierge: string | null;
  resort: string;
  stays: { slug: string; name: string; code: string; url: string | null }[];
  t: Record<string, string>;
};

const localToday = () => {
  const d = new Date();
  return toISO(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
};
const addDays = (iso: string, n: number) => toISO(new Date(new Date(iso + 'T00:00:00Z').getTime() + n * 86400000));

export function initBookingForm(form: HTMLFormElement) {
  if (form.dataset.ready) return;
  form.dataset.ready = '1';
  const cfg: Payload = JSON.parse(form.dataset.booking!);
  const ci = form.querySelector<HTMLInputElement>('[data-ci]');
  const co = form.querySelector<HTMLInputElement>('[data-co]');
  const err = form.querySelector<HTMLElement>('[data-error]')!;
  const nights = form.querySelector<HTMLElement>('[data-nights]');
  const today = localToday();
  const earliest = addDays(today, cfg.limits.leadDays);
  if (ci) ci.min = earliest;
  const sync = () => {
    if (ci && co) {
      if (ci.value) {
        co.min = addDays(ci.value, cfg.limits.minNights);
        co.max = addDays(ci.value, cfg.limits.maxNights);
        if (!co.value || co.value <= ci.value) co.value = addDays(ci.value, cfg.limits.minNights);
      }
      const n = nightsBetween(ci.value, co.value);
      if (nights) nights.textContent = n > 0 ? `${n} ${n === 1 ? cfg.t.night1 : cfg.t.nights}` : '';
    }
    err.hidden = true;
  };
  ci?.addEventListener('change', sync);
  co?.addEventListener('change', sync);

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const slug = String(fd.get('accommodation') || '');
    const stay = cfg.stays.find((s) => s.slug === slug);
    const req: BookingRequest = {
      checkIn: (fd.get('checkIn') as string) || undefined,
      checkOut: (fd.get('checkOut') as string) || undefined,
      adults: fd.has('adults') ? Number(fd.get('adults')) : undefined,
      children: fd.has('children') ? Number(fd.get('children')) : undefined,
      accommodation: stay?.code,
      accommodationName: stay?.name,
      promo: (fd.get('promo') as string) || undefined,
    };
    const requireDates = cfg.mode === 'engine';
    const v = validateDates(req, cfg.limits, today, requireDates);
    if (v) {
      const map: Record<string, string> = { required: cfg.t.errRequired, past: cfg.t.errPast, order: cfg.t.errDates, min: cfg.t.errMin.replace('{n}', String(cfg.limits.minNights)), max: cfg.t.errMax.replace('{n}', String(cfg.limits.maxNights)) };
      err.textContent = map[v];
      err.hidden = false;
      (v === 'order' || v === 'min' || v === 'max' ? co : ci)?.focus();
      return;
    }
    let url: string | null = null;
    let target = '_blank';
    const msg = () => buildMessage(req, cfg.t, cfg.resort, cfg.whatsappMessage);
    switch (cfg.mode) {
      case 'engine':
        if (cfg.engine) { url = buildEngineUrl(cfg.engine, req); target = cfg.engine.target; }
        break;
      case 'redirect':
        url = cfg.url;
        break;
      case 'direct':
        url = stay?.url ?? cfg.url;
        break;
      case 'whatsapp':
        if (cfg.whatsapp) url = whatsappUrl(cfg.whatsapp, msg());
        break;
      case 'email':
        if (cfg.email) { url = mailtoUrl(cfg.email, `${cfg.resort} — ${cfg.t.accommodation}`, msg()); target = '_self'; }
        break;
      case 'concierge':
        url = cfg.concierge;
        target = cfg.concierge?.startsWith('mailto:') ? '_self' : '_blank';
        break;
    }
    if (!url) return;
    form.dispatchEvent(new CustomEvent('booking:handoff', { bubbles: true, detail: { mode: cfg.mode, url } }));
    (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.('event', 'begin_checkout', { booking_mode: cfg.mode });
    if (target === '_self') location.href = url;
    else window.open(url, '_blank', 'noopener');
  });
}

document.querySelectorAll<HTMLFormElement>('form[data-booking]').forEach(initBookingForm);
