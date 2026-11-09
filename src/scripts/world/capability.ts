import type { Quality } from './types';

/** Decides whether (and how) to run WebGL on this device. */
export function detectCapability(): { webgl: boolean; quality: Quality; reason?: string } {
  const params = new URLSearchParams(location.search);
  if (params.get('webgl') === '0') return { webgl: false, quality: 'low', reason: 'forced' };
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (nav.connection?.saveData) return { webgl: false, quality: 'low', reason: 'save-data' };
  let ok = false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2');
    ok = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    ok = false;
  }
  if (!ok) return { webgl: false, quality: 'low', reason: 'no-webgl2' };
  const mem = nav.deviceMemory ?? 8;
  const cores = navigator.hardwareConcurrency ?? 8;
  const small = Math.min(screen.width, screen.height) < 700;
  if (mem <= 2 || cores <= 2) return { webgl: false, quality: 'low', reason: 'low-power' };
  const forced = params.get('quality');
  if (forced === 'low' || forced === 'high') return { webgl: true, quality: forced };
  return { webgl: true, quality: small || mem <= 4 || cores <= 4 ? 'low' : 'high' };
}

export const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'none';
