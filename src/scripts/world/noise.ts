import { createNoise2D } from 'simplex-noise';

export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeNoise(seed: number) {
  const n = createNoise2D(mulberry32(seed));
  const fbm = (x: number, y: number, oct = 5) => {
    let v = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { v += amp * n(x * f, y * f); amp *= 0.5; f *= 2.02; }
    return v; // ~ -1..1
  };
  const ridged = (x: number, y: number, oct = 5) => {
    let v = 0, amp = 0.5, f = 1;
    for (let i = 0; i < oct; i++) { v += amp * (1 - Math.abs(n(x * f, y * f))); amp *= 0.5; f *= 2.03; }
    return v; // ~ 0..1
  };
  return { n, fbm, ridged };
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
