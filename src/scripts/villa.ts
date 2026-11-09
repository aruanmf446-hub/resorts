import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { buildVillaModel } from './villa-model';
import { detectCapability, prefersReducedMotion } from './world/capability';

type Hotspot = { label: string; text: string; position: [number, number, number] };

/** 3D Villa Explorer — rotate, zoom and discover highlighted spaces. Loads a GLB when configured. */
function mount(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('canvas')!;
  const layer = root.querySelector<HTMLElement>('[data-villa-hotspots]')!;
  const info = root.querySelector<HTMLElement>('[data-villa-info]')!;
  const cap = detectCapability();
  if (!cap.webgl) { root.dataset.state = 'fallback'; return; }
  const src = root.dataset.src || '';
  const hotspots: Hotspot[] = JSON.parse(root.dataset.hotspots || '[]');
  const reduced = prefersReducedMotion();

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch { root.dataset.state = 'fallback'; return; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = cap.quality === 'high';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  camera.position.set(14, 11, 16);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.minDistance = 8;
  controls.maxDistance = 34;
  controls.maxPolarAngle = 1.3;
  controls.enablePan = false;
  controls.target.set(0, 1, 0.5);
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.5;
  controls.addEventListener('start', () => (controls.autoRotate = false));

  scene.add(new THREE.HemisphereLight('#f4f1ea', '#8a7f72', 1.4));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.6);
  sun.position.set(-10, 16, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12 });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.ShadowMaterial({ opacity: 0.18 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.36;
  ground.receiveShadow = true;
  scene.add(ground);

  const addProcedural = () => scene.add(buildVillaModel());
  if (src) {
    Promise.all([import('three/examples/jsm/loaders/GLTFLoader.js'), import('three/examples/jsm/libs/meshopt_decoder.module.js')])
      .then(async ([{ GLTFLoader }, { MeshoptDecoder }]) => {
        const loader = new GLTFLoader();
        loader.setMeshoptDecoder(MeshoptDecoder);
        const gltf = await loader.loadAsync(src);
        const s = Number(root.dataset.scale || 1);
        gltf.scene.scale.setScalar(s);
        gltf.scene.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) m.castShadow = m.receiveShadow = true; });
        scene.add(gltf.scene);
        root.dataset.source = 'glb';
      })
      .catch((e) => { console.warn('[villa] GLB failed, using procedural model', e); addProcedural(); root.dataset.source = 'procedural'; });
  } else { addProcedural(); root.dataset.source = 'procedural'; }

  const buttons = hotspots.map((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'villa-hotspot';
    const dot = document.createElement('span'); dot.className = 'villa-hotspot__dot';
    const lab = document.createElement('span'); lab.className = 'villa-hotspot__label'; lab.textContent = h.label;
    b.append(dot, lab);
    b.setAttribute('aria-label', h.label);
    b.addEventListener('click', () => focus(i));
    layer.appendChild(b);
    return b;
  });
  const focus = (i: number) => {
    const h = hotspots[i];
    buttons.forEach((b, k) => b.classList.toggle('is-active', k === i));
    const n = document.createElement('p'); n.className = 'eyebrow eyebrow--plain'; n.textContent = String(i + 1).padStart(2, '0');
    const t = document.createElement('h3'); t.className = 't-m'; t.textContent = h.label;
    const d = document.createElement('p'); d.className = 'muted'; d.textContent = h.text;
    info.replaceChildren(n, t, d);
    info.hidden = false;
    controls.autoRotate = false;
    const target = new THREE.Vector3(...h.position);
    const dir = camera.position.clone().sub(controls.target).normalize();
    const to = target.clone().add(dir.multiplyScalar(12));
    const from = camera.position.clone(), fromT = controls.target.clone();
    const t0 = performance.now(), dur = reduced ? 1 : 1400;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(from, to, e);
      controls.target.lerpVectors(fromT, target, e);
      if (k < 1) requestAnimationFrame(step);
    };
    step();
  };

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();
  let visible = false, raf = 0;
  const v = new THREE.Vector3();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    controls.update();
    renderer.render(scene, camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    hotspots.forEach((hs, i) => {
      v.set(...hs.position).project(camera);
      buttons[i].style.transform = `translate(${(v.x * 0.5 + 0.5) * w}px, ${(-v.y * 0.5 + 0.5) * h}px)`;
    });
  };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !visible) { visible = true; loop(); }
    else if (!e.isIntersecting && visible) { visible = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); cancelAnimationFrame(raf); root.dataset.state = 'fallback'; });
  root.dataset.state = 'ready';
}

document.querySelectorAll<HTMLElement>('[data-villa-explorer]').forEach((el) => {
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); mount(el); } }, { rootMargin: '300px' });
  io.observe(el);
});
