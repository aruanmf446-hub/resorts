/**
 * Ambient soundscape — synthesised in the browser (no audio files, no licensing),
 * or a licensed file. Never starts without a visitor gesture.
 */
type Kind = 'ocean' | 'forest' | 'wind' | 'bowls' | 'file';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let stopFns: (() => void)[] = [];
let audioEl: HTMLAudioElement | null = null;

function noiseBuffer(c: AudioContext, brown = false) {
  const len = c.sampleRate * 4;
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
  }
  return buf;
}

function noiseLayer(c: AudioContext, out: AudioNode, opts: { brown?: boolean; type: BiquadFilterType; freq: number; q?: number; gain: number; lfo: number; depth: number; fmod?: number }) {
  const src = c.createBufferSource();
  src.buffer = noiseBuffer(c, opts.brown);
  src.loop = true;
  const f = c.createBiquadFilter();
  f.type = opts.type;
  f.frequency.value = opts.freq;
  f.Q.value = opts.q ?? 0.7;
  const g = c.createGain();
  g.gain.value = opts.gain;
  const lfo = c.createOscillator();
  lfo.frequency.value = opts.lfo;
  const lg = c.createGain();
  lg.gain.value = opts.depth;
  lfo.connect(lg).connect(g.gain);
  if (opts.fmod) { const fg = c.createGain(); fg.gain.value = opts.fmod; lfo.connect(fg).connect(f.frequency); }
  src.connect(f).connect(g).connect(out);
  src.start(); lfo.start();
  return () => { src.stop(); lfo.stop(); };
}

function scheduleLoop(fn: () => void, min: number, max: number) {
  let t: number;
  const next = () => { t = window.setTimeout(() => { fn(); next(); }, min + Math.random() * (max - min)); };
  next();
  return () => clearTimeout(t);
}

function bowl(c: AudioContext, out: AudioNode) {
  const base = [196, 220, 261.6, 293.7, 329.6][Math.floor(Math.random() * 5)];
  const now = c.currentTime;
  [1, 2.76, 5.4].forEach((r, i) => {
    const o = c.createOscillator();
    o.type = 'sine';
    o.frequency.value = base * r;
    const g = c.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.22 / (i + 1), now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 9 - i * 2);
    o.connect(g).connect(out);
    o.start(now); o.stop(now + 9);
  });
}

function chirp(c: AudioContext, out: AudioNode) {
  const now = c.currentTime;
  const n = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const o = c.createOscillator();
    const g = c.createGain();
    const t = now + i * 0.14;
    const f = 2400 + Math.random() * 1600;
    o.frequency.setValueAtTime(f, t);
    o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.08);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.03, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(out);
    o.start(t); o.stop(t + 0.15);
  }
}

function start(kind: Kind, volume: number, src?: string) {
  if (kind === 'file' && src) {
    audioEl ??= Object.assign(new Audio(src), { loop: true });
    audioEl.volume = volume;
    void audioEl.play();
    return;
  }
  ctx ??= new AudioContext();
  void ctx.resume();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  master.gain.linearRampToValueAtTime(volume, ctx.currentTime + 2.5);
  const c = ctx, out = master;
  if (kind === 'ocean') {
    stopFns.push(noiseLayer(c, out, { brown: true, type: 'lowpass', freq: 520, gain: 0.5, lfo: 0.09, depth: 0.4, fmod: 260 }));
    stopFns.push(noiseLayer(c, out, { type: 'bandpass', freq: 2600, q: 0.5, gain: 0.03, lfo: 0.09, depth: 0.03 }));
  } else if (kind === 'wind' || kind === 'forest') {
    stopFns.push(noiseLayer(c, out, { brown: true, type: 'bandpass', freq: 420, q: 0.6, gain: 0.45, lfo: 0.05, depth: 0.32, fmod: 220 }));
    if (kind === 'forest') stopFns.push(scheduleLoop(() => chirp(c, out), 3000, 9000));
    else stopFns.push(noiseLayer(c, out, { type: 'highpass', freq: 3000, gain: 0.01, lfo: 0.13, depth: 0.01 }));
  } else if (kind === 'bowls') {
    stopFns.push(noiseLayer(c, out, { brown: true, type: 'lowpass', freq: 300, gain: 0.12, lfo: 0.04, depth: 0.05 }));
    bowl(c, out);
    stopFns.push(scheduleLoop(() => bowl(c, out), 7000, 13000));
  }
}

function stop() {
  if (audioEl) { audioEl.pause(); return; }
  if (!ctx || !master) return;
  const m = master, fns = stopFns;
  m.gain.cancelScheduledValues(ctx.currentTime);
  m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
  m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
  setTimeout(() => { fns.forEach((f) => f()); m.disconnect(); }, 900);
  stopFns = [];
  master = null;
}

document.querySelectorAll<HTMLElement>('[data-sound]').forEach((root) => {
  const btn = root.querySelector<HTMLButtonElement>('[data-sound-toggle]')!;
  const vol = root.querySelector<HTMLInputElement>('[data-sound-volume]');
  const kind = root.dataset.kind as Kind;
  let volume = Number(root.dataset.volume || 0.4);
  let on = false;
  const label = (v: boolean) => btn.setAttribute('aria-label', v ? root.dataset.labelOn! : root.dataset.labelOff!);
  label(false);
  btn.addEventListener('click', () => {
    on = !on;
    btn.setAttribute('aria-pressed', String(on));
    root.classList.toggle('is-on', on);
    label(on);
    on ? start(kind, volume, root.dataset.src) : stop();
  });
  vol?.addEventListener('input', () => {
    volume = Number(vol.value);
    if (master && ctx) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.1);
    if (audioEl) audioEl.volume = volume;
  });
});
