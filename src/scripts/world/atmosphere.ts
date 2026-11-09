import * as THREE from 'three';
import type { TimeName, WorldData } from './types';

export type Lighting = {
  sunElev: number; // degrees
  sunAzim: number; // degrees
  sun: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  hemiI: number;
  skyTop: string;
  horizon: string;
  night: number;
  exposure: number;
};

export const TIMES: Record<TimeName, Lighting> = {
  dawn: { sunElev: 7, sunAzim: 70, sun: '#ffc7a3', sunI: 1.9, hemiSky: '#c9d3e6', hemiGround: '#8a7d70', hemiI: 0.9, skyTop: '#8aa2c2', horizon: '#f4d6c4', night: 0.1, exposure: 1.0 },
  day: { sunElev: 52, sunAzim: 140, sun: '#fff3df', sunI: 2.6, hemiSky: '#d5e6fb', hemiGround: '#827d68', hemiI: 1.05, skyTop: '#5f90c2', horizon: '#dde8ee', night: 0, exposure: 1.0 },
  dusk: { sunElev: 6, sunAzim: 250, sun: '#ffa86f', sunI: 2.2, hemiSky: '#a2a7c8', hemiGround: '#5e4c46', hemiI: 0.75, skyTop: '#46557c', horizon: '#f0a67f', night: 0.45, exposure: 1.05 },
  night: { sunElev: 38, sunAzim: 200, sun: '#9fb4ff', sunI: 0.45, hemiSky: '#273760', hemiGround: '#0b0d14', hemiI: 0.45, skyTop: '#050a16', horizon: '#1d2a44', night: 1, exposure: 1.15 },
};

export function buildSky() {
  const uniforms = {
    uTop: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0, 1, 0) },
    uSunColor: { value: new THREE.Color() },
    uNight: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `
      uniform vec3 uTop, uHorizon, uSunColor, uSunDir; uniform float uNight; varying vec3 vDir;
      float hash(vec3 p){ return fract(sin(dot(p, vec3(12.9898,78.233,37.719))) * 43758.5453); }
      void main(){
        float h = clamp(vDir.y, -0.2, 1.0);
        vec3 col = mix(uHorizon, uTop, pow(smoothstep(-0.02, 0.6, h), 0.7));
        float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
        col += uSunColor * (pow(s, 600.0) * 2.0 + pow(s, 12.0) * 0.25 * (1.0 - uNight * 0.6));
        // stars
        vec3 cell = floor(vDir * 220.0);
        float st = step(0.9965, hash(cell)) * smoothstep(0.05, 0.4, h) * uNight;
        col += vec3(st) * 0.9;
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 32, 16), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return { mesh, uniforms };
}

function softTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.4, 'rgba(255,255,255,0.45)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Ambient particles — pollen, fireflies, snow or low mist — animated entirely on the GPU. */
export function buildParticles(kind: WorldData['atmosphere']['particles'], quality: 'high' | 'low', radius: number) {
  if (kind === 'none') return null;
  const count = (kind === 'mist' ? 140 : 900) * (quality === 'high' ? 1 : 0.45);
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * radius;
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = kind === 'mist' ? 1 + Math.random() * 5 : Math.random() * 40;
    pos[i * 3 + 2] = Math.sin(a) * r;
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const uniforms = {
    uTime: { value: 0 },
    uTex: { value: softTexture() },
    uColor: { value: new THREE.Color(kind === 'fireflies' ? '#ffd88a' : kind === 'snow' ? '#ffffff' : kind === 'mist' ? '#f2f0ec' : '#fff3d6') },
    uMode: { value: kind === 'snow' ? 1 : kind === 'mist' ? 2 : kind === 'fireflies' ? 3 : 0 },
    uNight: { value: 0 },
    uPixel: { value: Math.min(window.devicePixelRatio, 2) },
    uOpacity: { value: 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: kind === 'fireflies' ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: `
      uniform float uTime, uMode, uPixel, uNight; attribute float aSeed; varying float vA;
      void main(){
        vec3 p = position;
        float t = uTime;
        if (uMode == 1.0) { p.y = mod(p.y - t * (1.2 + aSeed), 40.0); p.x += sin(t * 0.6 + aSeed * 20.0) * 1.2; }
        else if (uMode == 2.0) { p.x += sin(t * 0.05 + aSeed * 6.28) * 6.0; p.z += cos(t * 0.04 + aSeed * 6.28) * 4.0; }
        else { p.x += sin(t * 0.3 + aSeed * 40.0) * 2.0; p.y = mod(p.y + t * 0.25 * aSeed, 40.0); p.z += cos(t * 0.25 + aSeed * 30.0) * 2.0; }
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float size = uMode == 2.0 ? 900.0 : uMode == 1.0 ? 9.0 : 6.0;
        gl_PointSize = size * uPixel * (0.6 + aSeed * 0.8) / -mv.z;
        gl_Position = projectionMatrix * mv;
        float flicker = uMode == 3.0 ? (0.4 + 0.6 * sin(t * 2.0 + aSeed * 50.0)) * uNight : 1.0;
        vA = (uMode == 2.0 ? 0.13 : uMode == 0.0 ? 0.55 : 0.85) * flicker;
      }`,
    fragmentShader: `
      uniform sampler2D uTex; uniform vec3 uColor; uniform float uOpacity; varying float vA;
      void main(){ vec4 t = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(uColor, t.a * vA * uOpacity); }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 3;
  return { points, uniforms };
}

export function buildClouds(radius: number) {
  const tex = softTexture();
  const group = new THREE.Group();
  const mats: THREE.SpriteMaterial[] = [];
  for (let i = 0; i < 14; i++) {
    const m = new THREE.SpriteMaterial({ map: tex, color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false, fog: true });
    mats.push(m);
    const s = new THREE.Sprite(m);
    const a = Math.random() * Math.PI * 2, r = radius * (0.4 + Math.random() * 1.1);
    s.position.set(Math.cos(a) * r, 30 + Math.random() * 18, Math.sin(a) * r);
    const sc = 30 + Math.random() * 40;
    s.scale.set(sc, sc * 0.35, 1);
    group.add(s);
  }
  return { group, mats };
}
