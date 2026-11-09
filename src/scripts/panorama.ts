import * as THREE from 'three';
import { detectCapability, prefersReducedMotion } from './world/capability';

/** Equirectangular 360° viewer with drag / touch / keyboard. Falls back to a still image. */
function mount(root: HTMLElement) {
  const cap = detectCapability();
  if (!cap.webgl) return;
  const canvas = root.querySelector('canvas')!;
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); } catch { return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 100);
  const tex = new THREE.TextureLoader().load(root.dataset.src!, () => { root.dataset.state = 'ready'; draw(); });
  tex.colorSpace = THREE.SRGBColorSpace;
  const geo = new THREE.SphereGeometry(50, 64, 32);
  geo.scale(-1, 1, 1);
  scene.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex })));
  let lon = 0, lat = 0, dragging = false, px = 0, py = 0, raf = 0, visible = false;
  const reduced = prefersReducedMotion();
  const draw = () => {
    lat = Math.max(-35, Math.min(35, lat));
    const phi = THREE.MathUtils.degToRad(90 - lat), th = THREE.MathUtils.degToRad(lon);
    camera.lookAt(Math.sin(phi) * Math.cos(th), Math.cos(phi), Math.sin(phi) * Math.sin(th));
    renderer.render(scene, camera);
  };
  const resize = () => { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix(); draw(); };
  new ResizeObserver(resize).observe(canvas);
  canvas.addEventListener('pointerdown', (e) => { dragging = true; px = e.clientX; py = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (!dragging) return; lon -= (e.clientX - px) * 0.15; lat += (e.clientY - py) * 0.15; px = e.clientX; py = e.clientY; draw(); });
  canvas.addEventListener('pointerup', () => (dragging = false));
  canvas.addEventListener('keydown', (e) => {
    const k: Record<string, [number, number]> = { ArrowLeft: [-5, 0], ArrowRight: [5, 0], ArrowUp: [0, 4], ArrowDown: [0, -4] };
    if (k[e.key]) { e.preventDefault(); lon += k[e.key][0]; lat += k[e.key][1]; draw(); }
  });
  const loop = () => { raf = requestAnimationFrame(loop); if (!dragging && !reduced) { lon += 0.02; draw(); } };
  new IntersectionObserver(([e]) => { if (e.isIntersecting && !visible) { visible = true; loop(); } else if (!e.isIntersecting) { visible = false; cancelAnimationFrame(raf); } }).observe(canvas);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(raf); root.dataset.state = 'fallback'; });
}

document.querySelectorAll<HTMLElement>('[data-panorama]').forEach((el) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); mount(el); } }, { rootMargin: '200px' });
  io.observe(el);
});
