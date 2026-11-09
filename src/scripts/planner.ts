/**
 * Stay planner — a discovery and wish-list tool, not a scheduler.
 * State lives in the URL hash (shareable) with a localStorage convenience copy.
 */
type Exp = { slug: string; title: string; summary: string; interests: string[]; time: 'morning' | 'afternoon' | 'evening' | 'any'; duration: string; img: string; href: string | null };
type Payload = { resort: string; whatsapp: string | null; email: string | null; interests: { id: string; label: string }[]; experiences: Exp[]; t: Record<string, string> };

const KEY = 'twb-planner';
const SLOTS = ['morning', 'afternoon', 'evening'] as const;

export function buildItinerary(sel: Exp[], days: number) {
  const plan: Record<string, Exp | null>[] = Array.from({ length: days }, () => ({ morning: null, afternoon: null, evening: null }));
  const extra: Exp[] = [];
  for (const e of sel) {
    let placed = false;
    const slots = e.time === 'any' ? SLOTS : [e.time];
    for (let d = 0; d < days && !placed; d++) for (const s of slots) if (!plan[d][s]) { plan[d][s] = e; placed = true; break; }
    if (!placed) extra.push(e);
  }
  return { plan, extra };
}

function init(root: HTMLElement) {
  const P: Payload = JSON.parse(root.dataset.planner!);
  const T = P.t;
  const bySlug = new Map(P.experiences.map((e) => [e.slug, e]));
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const grid = $('[data-suggestions]'), selList = $('[data-selection]'), itin = $('[data-itinerary]'), actions = $('[data-actions]'), empty = $('[data-empty]');
  const daysSel = $<HTMLSelectElement>('[data-days]'), status = $('[data-status]'), count = $('[data-count-sel]');

  let interests = new Set<string>();
  let selection: string[] = [];

  // Restore: URL hash first (shared link), then local convenience copy
  const restore = () => {
    const h = new URLSearchParams(location.hash.slice(1));
    let src: URLSearchParams | null = h.has('p') || h.has('i') ? h : null;
    if (!src) { try { const raw = localStorage.getItem(KEY); if (raw) src = new URLSearchParams(raw); } catch { /* storage unavailable */ } }
    if (!src) return;
    interests = new Set((src.get('i') || '').split(',').filter(Boolean));
    selection = (src.get('p') || '').split(',').filter((s) => bySlug.has(s));
    const d = Number(src.get('d'));
    if (d >= 1 && d <= 7) daysSel.value = String(d);
  };
  const persist = () => {
    const q = new URLSearchParams();
    if (interests.size) q.set('i', [...interests].join(','));
    if (selection.length) q.set('p', selection.join(','));
    q.set('d', daysSel.value);
    const s = q.toString();
    history.replaceState(null, '', s ? `#${s}` : location.pathname);
    try { localStorage.setItem(KEY, s); } catch { /* ignore */ }
  };
  const announce = (m: string) => { status.textContent = m; };

  const renderSuggestions = () => {
    const scored = P.experiences.map((e) => ({ e, score: e.interests.filter((i) => interests.has(i)).length })).sort((a, b) => b.score - a.score);
    grid.replaceChildren(...scored.map(({ e, score }) => {
      const li = document.createElement('li');
      li.className = 'pc' + (score > 0 && interests.size ? ' is-match' : '');
      const media = document.createElement('div'); media.className = 'pc__media';
      const img = document.createElement('img'); img.src = e.img; img.alt = ''; img.loading = 'lazy'; img.width = 400; img.height = 300;
      media.append(img);
      const title = document.createElement(e.href ? 'a' : 'span'); title.className = 't-s'; title.textContent = e.title; if (e.href) (title as HTMLAnchorElement).href = e.href;
      const sum = document.createElement('p'); sum.className = 'small muted'; sum.textContent = e.summary;
      const meta = document.createElement('p'); meta.className = 'micro muted'; meta.textContent = [T[e.time === 'any' ? 'anytime' : e.time], e.duration].filter(Boolean).join(' · ');
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pc__add';
      const on = selection.includes(e.slug);
      btn.setAttribute('aria-pressed', String(on));
      btn.textContent = on ? `✓ ${T.plannerRemove}` : `+ ${T.plannerAdd}`;
      btn.setAttribute('aria-label', `${on ? T.plannerRemove : T.plannerAdd}: ${e.title}`);
      btn.addEventListener('click', () => { toggle(e.slug); });
      li.append(media, title, sum, meta, btn);
      return li;
    }));
  };

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= selection.length) return;
    [selection[i], selection[j]] = [selection[j], selection[i]];
    update();
    (selList.children[j]?.querySelector(d < 0 ? '[data-up]' : '[data-down]') as HTMLElement | null)?.focus();
  };

  let dragFrom = -1;
  const renderSelection = () => {
    selList.replaceChildren(...selection.map((slug, i) => {
      const e = bySlug.get(slug)!;
      const li = document.createElement('li');
      li.draggable = true;
      const name = document.createElement('span'); name.textContent = `${i + 1}. ${e.title}`;
      const btns = document.createElement('span'); btns.className = 'ps__btns';
      const mk = (label: string, txt: string, fn: () => void, attr: string) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', `${label}: ${e.title}`); b.dataset[attr] = ''; b.addEventListener('click', fn); return b; };
      btns.append(mk(T.plannerUp, '↑', () => move(i, -1), 'up'), mk(T.plannerDown, '↓', () => move(i, 1), 'down'), mk(T.plannerRemove, '×', () => toggle(slug), 'remove'));
      li.append(name, btns);
      li.addEventListener('dragstart', () => { dragFrom = i; li.classList.add('is-drag'); });
      li.addEventListener('dragend', () => li.classList.remove('is-drag'));
      li.addEventListener('dragover', (ev) => ev.preventDefault());
      li.addEventListener('drop', (ev) => { ev.preventDefault(); if (dragFrom < 0 || dragFrom === i) return; const [x] = selection.splice(dragFrom, 1); selection.splice(i, 0, x); dragFrom = -1; update(); });
      return li;
    }));
    count.textContent = String(selection.length);
    empty.hidden = selection.length > 0;
    actions.hidden = itin.hidden = selection.length === 0;
  };

  const itineraryText = () => {
    const { plan, extra } = buildItinerary(selection.map((s) => bySlug.get(s)!), Number(daysSel.value));
    const lines = [`${P.resort} — ${T.plannerItinerary}`, ''];
    plan.forEach((day, d) => {
      const items = SLOTS.filter((s) => day[s]);
      if (!items.length) return;
      lines.push(`${T.plannerDay} ${d + 1}`);
      items.forEach((s) => lines.push(`  ${T[s]}: ${day[s]!.title}`));
    });
    if (extra.length) { lines.push('', T.anytime); extra.forEach((e) => lines.push(`  ${e.title}`)); }
    lines.push('', T.plannerDisclaimer);
    return { plan, extra, text: lines.join('\n') };
  };

  const renderItinerary = () => {
    const { plan, extra } = itineraryText();
    const nodes: HTMLElement[] = [];
    const h = document.createElement('p'); h.className = 'micro muted'; h.textContent = T.plannerItinerary; nodes.push(h);
    plan.forEach((day, d) => {
      const items = SLOTS.filter((s) => day[s]);
      if (!items.length) return;
      const wrap = document.createElement('div');
      const title = document.createElement('h3'); title.textContent = `${T.plannerDay} ${d + 1}`;
      const dl = document.createElement('dl');
      items.forEach((s) => { const dt = document.createElement('dt'); dt.textContent = T[s]; const dd = document.createElement('dd'); dd.textContent = day[s]!.title; dl.append(dt, dd); });
      wrap.append(title, dl);
      nodes.push(wrap);
    });
    if (extra.length) { const p = document.createElement('p'); p.className = 'small muted'; p.textContent = `${T.anytime}: ${extra.map((e) => e.title).join(', ')}`; nodes.push(p); }
    itin.replaceChildren(...nodes);
    const { text } = itineraryText();
    const wa = root.querySelector<HTMLAnchorElement>('[data-wa]');
    if (wa && P.whatsapp) wa.href = `https://wa.me/${P.whatsapp}?text=${encodeURIComponent(text)}`;
    const mail = root.querySelector<HTMLAnchorElement>('[data-mail]');
    if (mail && P.email) mail.href = `mailto:${P.email}?subject=${encodeURIComponent(`${P.resort} — ${T.plannerItinerary}`)}&body=${encodeURIComponent(text)}`;
  };

  const update = () => { renderSuggestions(); renderSelection(); renderItinerary(); persist(); };
  const toggle = (slug: string) => {
    const e = bySlug.get(slug)!;
    if (selection.includes(slug)) { selection = selection.filter((s) => s !== slug); announce(`${T.plannerRemove}: ${e.title}`); }
    else { selection.push(slug); announce(`${T.plannerAdd}: ${e.title}`); }
    update();
  };

  root.querySelectorAll<HTMLButtonElement>('[data-interest]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.interest!;
    interests.has(id) ? interests.delete(id) : interests.add(id);
    b.setAttribute('aria-pressed', String(interests.has(id)));
    // Gentle auto-suggestion: add the best matches when the selection is empty.
    update();
  }));
  daysSel.addEventListener('change', update);
  $('[data-clear]').addEventListener('click', () => { selection = []; update(); });
  const copyBtn = $('[data-copy]');
  copyBtn.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(itineraryText().text); announce(T.plannerCopied); copyBtn.querySelector('span')!.textContent = T.plannerCopied; setTimeout(() => (copyBtn.querySelector('span')!.textContent = T.plannerCopy), 2000); }
    catch { announce('—'); }
  });
  const share = root.querySelector<HTMLButtonElement>('[data-share]');
  if (share && 'share' in navigator) {
    share.hidden = false;
    share.addEventListener('click', () => navigator.share({ title: P.resort, text: itineraryText().text, url: location.href }).catch(() => {}));
  }

  restore();
  root.querySelectorAll<HTMLButtonElement>('[data-interest]').forEach((b) => b.setAttribute('aria-pressed', String(interests.has(b.dataset.interest!))));
  update();
}

document.querySelectorAll<HTMLElement>('[data-planner]').forEach(init);
