import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { gsap } from 'gsap';
import { createHeightField, buildTerrain, heightTexture, terrainColors, DIORAMA_RADIUS, type HeightField } from './terrain';
import { buildWater } from './water';
import { buildVegetation } from './vegetation';
import { createArchitecture } from './architecture';
import { TIMES, buildSky, buildParticles, buildClouds, type Lighting } from './atmosphere';
import type { WorldData, PoiData, Quality, TimeName, SeasonName, Vec3 } from './types';

export interface WorldOptions {
  canvas: HTMLCanvasElement;
  data: WorldData;
  pois: PoiData[];
  quality: Quality;
  interactive: boolean;
  /** Plays the cinematic arrival flight. */
  intro: boolean;
  /** Gentle autonomous camera drift (hero). */
  drift: boolean;
  reducedMotion: boolean;
  onReady?: () => void;
  onContextLost?: () => void;
  onSelect?: (id: string) => void;
}

export interface ProjectedPoi { id: string; x: number; y: number; visible: boolean; depth: number }

/**
 * A self-contained 3D resort world. Owns its renderer and render loop,
 * pauses offscreen, adapts quality and releases every GPU resource on dispose().
 */
export class World {
  readonly opts: WorldOptions;
  renderer!: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  controls?: OrbitControls;
  field: HeightField;
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private visible = true;
  private disposed = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private sun = new THREE.DirectionalLight('#ffffff', 2);
  private hemi = new THREE.HemisphereLight('#ffffff', '#888888', 1);
  private sky = buildSky();
  private water?: ReturnType<typeof buildWater>;
  private veg?: ReturnType<typeof buildVegetation>;
  private particles?: ReturnType<typeof buildParticles>;
  private clouds?: ReturnType<typeof buildClouds>;
  private arch: ReturnType<typeof createArchitecture>;
  private terrainMesh?: THREE.Mesh;
  private markers = new Map<string, THREE.Mesh>();
  private poiAnchors = new Map<string, THREE.Vector3>();
  private light: Lighting;
  private frameTimes: number[] = [];
  private degraded = false;
  private selected: string | null = null;
  private tweening = false;
  private idleTimer = 0;
  time: TimeName;
  season: SeasonName;

  constructor(opts: WorldOptions) {
    this.opts = opts;
    const d = opts.data;
    this.time = d.atmosphere.defaultTime;
    this.season = d.atmosphere.defaultSeason ?? d.atmosphere.seasons[0] ?? 'summer';
    this.light = { ...TIMES[this.time] };
    this.field = createHeightField(d, opts.pois);
    this.arch = createArchitecture(d, this.field, opts.quality);

    const canvas = opts.canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: opts.quality === 'high', powerPreference: 'high-performance', alpha: false, preserveDrawingBuffer: new URLSearchParams(location.search).has('capture') });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.quality === 'high' ? 1.75 : 1.25));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.shadowMap.enabled = opts.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.camera = new THREE.PerspectiveCamera(36, 1, 0.5, 2400);
    const c = d.camera;
    this.camera.position.set(...c.position);

    canvas.addEventListener('webglcontextlost', this.onLost, false);

    this.build();
    this.applyLighting(this.light);
    this.resize();

    if (opts.interactive) {
      const ctr = new OrbitControls(this.camera, canvas);
      ctr.enableDamping = true;
      ctr.dampingFactor = 0.06;
      ctr.minDistance = c.minDistance;
      ctr.maxDistance = c.maxDistance;
      ctr.maxPolarAngle = 1.36;
      ctr.minPolarAngle = 0.18;
      ctr.screenSpacePanning = false;
      ctr.rotateSpeed = 0.55;
      ctr.zoomSpeed = 0.8;
      ctr.target.set(...c.target);
      ctr.addEventListener('change', () => {
        const t = ctr.target;
        const r = Math.hypot(t.x, t.z);
        if (r > 45) { t.x *= 45 / r; t.z *= 45 / r; }
        t.y = THREE.MathUtils.clamp(t.y, -2, 20);
      });
      ctr.addEventListener('start', () => { this.idleTimer = 0; });
      this.controls = ctr;
      ctr.update();
    } else {
      this.camera.lookAt(...c.target);
    }

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas.parentElement ?? canvas);
    this.io = new IntersectionObserver((e) => { this.visible = e[0].isIntersecting; this.visible ? this.start() : this.stop(); }, { rootMargin: '100px' });
    this.io.observe(canvas);
    document.addEventListener('visibilitychange', this.onVisibility);

    if (opts.intro && !opts.reducedMotion) this.playIntro();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => opts.onReady?.());
    this.start();
    if (new URLSearchParams(location.search).has('capture')) (window as unknown as { __world: World }).__world = this;
  }

  /* ------------------------------------------------------------ */
  private build() {
    const d = this.opts.data;
    const island = d.terrain.kind === 'island' || d.water.kind === 'ocean';
    const diorama = !island;
    const useModel = d.mode === 'model' && !!d.model?.src;
    const seg = this.opts.quality === 'high' ? 240 : 140;
    if (!useModel) {
      const terrain = buildTerrain(d, this.field, seg, this.season, diorama);
      this.terrainMesh = terrain.mesh;
      this.scene.add(terrain.group);
    } else {
      void this.loadModel();
    }
    this.scene.add(this.sky.mesh);
    this.scene.fog = new THREE.FogExp2('#dde8ee', 0.004 + d.atmosphere.fog * 0.009);

    if (d.water.kind !== 'none' && (!useModel || d.model?.keepWater)) {
      this.water = buildWater({ level: d.water.level, shallow: d.water.shallow, deep: d.water.deep, heightTex: heightTexture(this.field), infinite: island });
      this.scene.add(this.water.mesh);
    }
    const veg = useModel ? null : buildVegetation(d, this.field, this.opts.pois, this.opts.quality, this.season, diorama ? DIORAMA_RADIUS - 2 : 46);
    if (veg) { this.veg = veg; this.scene.add(veg.mesh); }

    for (const poi of this.opts.pois) {
      if (!useModel) this.scene.add(this.arch.build(poi));
      const [x, z] = poi.position;
      const y = Math.max(this.field.height(x, z), d.water.level);
      const top = poi.structure.type === 'tower' ? 6.5 : poi.structure.type === 'none' ? 1.5 : 3;
      this.poiAnchors.set(poi.id, new THREE.Vector3(x, y + top, z));
      const ring = new THREE.Mesh(new THREE.RingGeometry(1.6, 1.85, 48), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.0, depthWrite: false, side: THREE.DoubleSide }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, y + 0.12, z);
      ring.renderOrder = 4;
      this.markers.set(poi.id, ring);
      this.scene.add(ring);
    }

    const s = this.sun;
    s.castShadow = this.opts.quality === 'high';
    s.shadow.mapSize.set(2048, 2048);
    const sc = s.shadow.camera;
    sc.left = sc.bottom = -62; sc.right = sc.top = 62; sc.near = 1; sc.far = 260;
    s.shadow.bias = -0.0006;
    s.shadow.normalBias = 0.04;
    this.scene.add(s, s.target, this.hemi);

    const p = buildParticles(d.atmosphere.particles, this.opts.quality, diorama ? DIORAMA_RADIUS : 50);
    if (p) { this.particles = p; this.scene.add(p.points); }
    if (d.atmosphere.clouds) { this.clouds = buildClouds(70); this.scene.add(this.clouds.group); }
    this.setSeasonParticles();
  }

  /** Client-supplied GLB/GLTF world (Meshopt-compressed files supported). */
  private async loadModel() {
    const m = this.opts.data.model!;
    try {
      const [{ GLTFLoader }, { MeshoptDecoder }] = await Promise.all([
        import('three/examples/jsm/loaders/GLTFLoader.js'),
        import('three/examples/jsm/libs/meshopt_decoder.module.js'),
      ]);
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.loadAsync(m.src);
      const root = gltf.scene;
      root.scale.setScalar(m.scale);
      root.position.set(...m.position);
      root.rotation.y = m.rotationY;
      root.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.castShadow = mesh.receiveShadow = this.opts.quality === 'high'; } });
      if (this.disposed) return;
      this.scene.add(root);
      root.updateMatrixWorld(true);
      // Drop hotspot anchors onto the model surface.
      const ray = new THREE.Raycaster();
      for (const [id, a] of this.poiAnchors) {
        ray.set(new THREE.Vector3(a.x, 500, a.z), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObject(root, true)[0];
        if (hit) { a.y = hit.point.y + 3; this.markers.get(id)?.position.setY(hit.point.y + 0.12); }
      }
      this.requestFrame();
    } catch (err) {
      console.warn('[world] model failed to load, using procedural terrain', err);
      const terrain = buildTerrain(this.opts.data, this.field, 160, this.season, true);
      this.terrainMesh = terrain.mesh;
      this.scene.add(terrain.group);
      this.requestFrame();
    }
  }

  private applyLighting(l: Lighting) {
    const el = THREE.MathUtils.degToRad(l.sunElev), az = THREE.MathUtils.degToRad(l.sunAzim);
    const dir = new THREE.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    this.sun.position.copy(dir.clone().multiplyScalar(120));
    this.sun.color.set(l.sun);
    this.sun.intensity = l.sunI;
    this.hemi.color.set(l.hemiSky);
    this.hemi.groundColor.set(l.hemiGround);
    this.hemi.intensity = l.hemiI;
    const horizon = new THREE.Color(l.horizon);
    (this.scene.fog as THREE.FogExp2).color.copy(horizon);
    this.sky.uniforms.uTop.value.set(l.skyTop);
    this.sky.uniforms.uHorizon.value.copy(horizon);
    this.sky.uniforms.uSunDir.value.copy(dir);
    this.sky.uniforms.uSunColor.value.set(l.sun);
    this.sky.uniforms.uNight.value = l.night;
    this.renderer.toneMappingExposure = l.exposure;
    this.arch.mats.glow.emissiveIntensity = 0.05 + l.night * 2.6;
    this.arch.mats.pool.emissiveIntensity = 0.12 + l.night * 0.5;
    if (this.water) {
      const u = this.water.uniforms;
      u.uSky.value.copy(horizon).lerp(new THREE.Color(l.skyTop), 0.3);
      u.uSunDir.value.copy(dir);
      u.uSunColor.value.set(l.sun).multiplyScalar(l.night > 0.9 ? 0.4 : 1);
      u.uFogColor.value.copy(horizon);
      u.uFogDensity.value = (this.scene.fog as THREE.FogExp2).density;
      u.uNight.value = l.night;
    }
    if (this.particles) this.particles.uniforms.uNight.value = l.night;
    if (this.clouds) for (const m of this.clouds.mats) { m.color.set(l.horizon).lerp(new THREE.Color('#ffffff'), 0.5 - l.night * 0.4); m.opacity = 0.32 * (1 - l.night * 0.6); }
  }

  /* ------------------------------------------------------------ */
  setTime(name: TimeName, animate = true) {
    if (!TIMES[name]) return;
    this.time = name;
    const from = { ...this.light };
    const to = TIMES[name];
    const fromC = { sun: new THREE.Color(from.sun), hs: new THREE.Color(from.hemiSky), hg: new THREE.Color(from.hemiGround), top: new THREE.Color(from.skyTop), hor: new THREE.Color(from.horizon) };
    const toC = { sun: new THREE.Color(to.sun), hs: new THREE.Color(to.hemiSky), hg: new THREE.Color(to.hemiGround), top: new THREE.Color(to.skyTop), hor: new THREE.Color(to.horizon) };
    const st = { t: 0 };
    const update = () => {
      const t = st.t;
      const lerpN = (a: number, b: number) => a + (b - a) * t;
      // shortest path for azimuth
      let dAz = to.sunAzim - from.sunAzim; if (dAz > 180) dAz -= 360; if (dAz < -180) dAz += 360;
      this.light = {
        sunElev: lerpN(from.sunElev, to.sunElev), sunAzim: from.sunAzim + dAz * t,
        sun: '#' + fromC.sun.clone().lerp(toC.sun, t).getHexString(), sunI: lerpN(from.sunI, to.sunI),
        hemiSky: '#' + fromC.hs.clone().lerp(toC.hs, t).getHexString(), hemiGround: '#' + fromC.hg.clone().lerp(toC.hg, t).getHexString(), hemiI: lerpN(from.hemiI, to.hemiI),
        skyTop: '#' + fromC.top.clone().lerp(toC.top, t).getHexString(), horizon: '#' + fromC.hor.clone().lerp(toC.hor, t).getHexString(),
        night: lerpN(from.night, to.night), exposure: lerpN(from.exposure, to.exposure),
      };
      this.applyLighting(this.light);
      this.requestFrame();
    };
    if (!animate || this.opts.reducedMotion) { st.t = 1; update(); return; }
    gsap.to(st, { t: 1, duration: 2.4, ease: 'sine.inOut', onUpdate: update });
  }

  setSeason(name: SeasonName) {
    this.season = name;
    if (this.terrainMesh) terrainColors(this.opts.data, this.field, this.terrainMesh.geometry, name);
    this.veg?.tint(name);
    this.setSeasonParticles();
    this.requestFrame();
  }

  private setSeasonParticles() {
    if (!this.particles) return;
    const u = this.particles.uniforms;
    if (this.season === 'winter' && this.opts.data.atmosphere.seasons.length) { u.uMode.value = 1; u.uColor.value.set('#ffffff'); this.particles.points.material.blending = THREE.NormalBlending; }
    else {
      const k = this.opts.data.atmosphere.particles;
      u.uMode.value = k === 'snow' ? 1 : k === 'mist' ? 2 : k === 'fireflies' ? 3 : 0;
      u.uColor.value.set(k === 'fireflies' ? '#ffd88a' : k === 'mist' ? '#f2f0ec' : '#fff3d6');
    }
    (this.particles.points.material as THREE.ShaderMaterial).needsUpdate = true;
  }

  private flyTo(pos: THREE.Vector3, target: THREE.Vector3, duration = 1.9, onDone?: () => void) {
    const ctr = this.controls;
    const tgt = ctr ? ctr.target : new THREE.Vector3(...this.opts.data.camera.target);
    if (this.opts.reducedMotion) {
      this.camera.position.copy(pos); tgt.copy(target); ctr?.update(); this.camera.lookAt(tgt); this.requestFrame(); onDone?.(); return;
    }
    this.tweening = true;
    if (ctr) ctr.enabled = false;
    gsap.killTweensOf([this.camera.position, tgt]);
    gsap.to(tgt, { x: target.x, y: target.y, z: target.z, duration, ease: 'power3.inOut' });
    gsap.to(this.camera.position, {
      x: pos.x, y: pos.y, z: pos.z, duration, ease: 'power3.inOut',
      onUpdate: () => { if (!ctr) this.camera.lookAt(tgt); },
      onComplete: () => { this.tweening = false; if (ctr) ctr.enabled = true; onDone?.(); },
    });
  }

  focusPoi(id: string) {
    const a = this.poiAnchors.get(id);
    if (!a) return;
    this.select(id);
    const target = a.clone().setY(a.y - 2);
    const from = this.camera.position.clone().sub(target).setY(0).normalize();
    if (!isFinite(from.x)) from.set(1, 0, 1).normalize();
    const pos = target.clone().add(from.multiplyScalar(26)).add(new THREE.Vector3(0, 15, 0));
    this.flyTo(pos, target);
  }

  select(id: string | null) {
    this.selected = id;
    this.markers.forEach((m, k) => {
      (m.material as THREE.MeshBasicMaterial).opacity = k === id ? 0.95 : 0.0;
    });
    this.requestFrame();
  }

  resetView() {
    this.select(null);
    const c = this.opts.data.camera;
    this.flyTo(new THREE.Vector3(...c.position), new THREE.Vector3(...c.target), 1.6);
  }

  playIntro() {
    const c = this.opts.data.camera;
    this.camera.position.set(...c.introFrom);
    this.controls?.update();
    this.flyTo(new THREE.Vector3(...c.position), new THREE.Vector3(...c.target), 5.2);
  }

  /** Screen positions of POI anchors for the HTML hotspot layer. */
  project(): ProjectedPoi[] {
    const w = this.opts.canvas.clientWidth, h = this.opts.canvas.clientHeight;
    const out: ProjectedPoi[] = [];
    const v = new THREE.Vector3();
    for (const [id, p] of this.poiAnchors) {
      v.copy(p).project(this.camera);
      const visible = v.z < 1 && v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1;
      out.push({ id, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible, depth: this.camera.position.distanceTo(p) });
    }
    return out;
  }

  /* ------------------------------------------------------------ */
  private resize() {
    const el = this.opts.canvas;
    const w = el.clientWidth || el.parentElement?.clientWidth || 800;
    const h = el.clientHeight || el.parentElement?.clientHeight || 600;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w / h < 0.8 ? 48 : 36;
    this.camera.updateProjectionMatrix();
    this.requestFrame();
  }

  private needsFrame = true;
  requestFrame() { this.needsFrame = true; }

  start() {
    if (this.running || this.disposed || !this.visible || document.hidden) return;
    this.running = true;
    this.clock.getDelta();
    const loop = () => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      this.tick();
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  onFrame?: () => void;

  private tick() {
    const dt = Math.min(this.clock.getDelta(), 0.1);
    const t = this.clock.elapsedTime;
    const animated = !this.opts.reducedMotion;
    if (animated) {
      if (this.water) this.water.uniforms.uTime.value = t;
      if (this.veg) this.veg.uTime.value = t;
      if (this.particles) this.particles.uniforms.uTime.value = t;
      if (this.clouds) this.clouds.group.rotation.y = t * 0.004;
      const pulse = 1 + Math.sin(t * 2.4) * 0.12;
      if (this.selected) this.markers.get(this.selected)?.scale.setScalar(pulse);
    }
    this.idleTimer += dt;
    if (this.opts.drift && animated && !this.tweening) {
      // Slow orbit around the target — the world breathes.
      const tgt = this.controls?.target ?? new THREE.Vector3(...this.opts.data.camera.target);
      const off = this.camera.position.clone().sub(tgt);
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), dt * 0.025);
      this.camera.position.copy(tgt).add(off);
      if (!this.controls) this.camera.lookAt(tgt);
    } else if (this.controls && animated && this.idleTimer > 14 && !this.tweening && !this.selected) {
      this.controls.autoRotate = true;
      this.controls.autoRotateSpeed = 0.25;
    } else if (this.controls) this.controls.autoRotate = false;

    this.controls?.update(dt);
    this.sky.mesh.position.copy(this.camera.position);
    if (!animated && !this.needsFrame && !this.tweening) return;
    this.needsFrame = false;
    const t0 = performance.now();
    this.renderer.render(this.scene, this.camera);
    this.onFrame?.();
    this.watchPerformance(performance.now() - t0, dt);
  }

  private watchPerformance(_cpu: number, dt: number) {
    if (this.degraded) return;
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    this.frameTimes = [];
    if (avg > 1 / 32) {
      // Sustained low frame rate: lower resolution and drop shadows.
      this.degraded = true;
      this.renderer.setPixelRatio(1);
      this.renderer.shadowMap.enabled = false;
      this.sun.castShadow = false;
      this.scene.traverse((o) => { if ((o as THREE.Mesh).material) ((o as THREE.Mesh).material as THREE.Material).needsUpdate = true; });
      this.resize();
    }
  }

  /** Deterministic rendering for asset capture scripts. */
  renderAt(seconds: number, camPos?: Vec3, target?: Vec3) {
    if (this.water) this.water.uniforms.uTime.value = seconds;
    if (this.veg) this.veg.uTime.value = seconds;
    if (this.particles) this.particles.uniforms.uTime.value = seconds;
    if (camPos) this.camera.position.set(...camPos);
    if (target) this.camera.lookAt(...target);
    this.sky.mesh.position.copy(this.camera.position);
    this.renderer.render(this.scene, this.camera);
  }

  private onVisibility = () => { document.hidden ? this.stop() : this.start(); };
  private onLost = (e: Event) => {
    e.preventDefault();
    this.stop();
    this.opts.onContextLost?.();
  };

  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.stop();
    gsap.killTweensOf(this.camera.position);
    if (this.controls) gsap.killTweensOf(this.controls.target);
    this.io?.disconnect();
    this.ro?.disconnect();
    document.removeEventListener('visibilitychange', this.onVisibility);
    this.opts.canvas.removeEventListener('webglcontextlost', this.onLost);
    this.controls?.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose();
      const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : [];
      for (const mat of mats) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        if ((mat as THREE.ShaderMaterial).uniforms) for (const u of Object.values((mat as THREE.ShaderMaterial).uniforms)) if (u.value instanceof THREE.Texture) u.value.dispose();
        mat.dispose();
      }
    });
    this.renderer.dispose();
  }
}
