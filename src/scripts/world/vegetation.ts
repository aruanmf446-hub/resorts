import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, smoothstep } from './noise';
import type { HeightField } from './terrain';
import type { WorldData, PoiData, SeasonName } from './types';

const paint = (g: THREE.BufferGeometry, hex: string) => {
  const col = new THREE.Color(hex);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) arr.set([col.r, col.g, col.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return g.toNonIndexed();
};

/** Canopy is painted white so instance colors (season) tint it; trunks stay brown-ish. */
function treeGeometry(kind: WorldData['vegetation']['kind']) {
  const trunkCol = '#6b5a48';
  const parts: THREE.BufferGeometry[] = [];
  if (kind === 'palm') {
    const trunk = new THREE.CylinderGeometry(0.09, 0.16, 3.2, 5, 4);
    trunk.translate(0, 1.6, 0);
    const pos = trunk.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); pos.setX(i, pos.getX(i) + (y / 3.2) ** 2 * 0.6); }
    parts.push(paint(trunk, trunkCol));
    for (let f = 0; f < 7; f++) {
      const leaf = new THREE.ConeGeometry(0.28, 1.9, 3, 1);
      leaf.rotateZ(Math.PI / 2 + 0.55);
      leaf.translate(0.95, -0.35, 0);
      leaf.rotateY((f / 7) * Math.PI * 2);
      leaf.translate(0.6, 3.2, 0);
      parts.push(paint(leaf, '#ffffff'));
    }
  } else if (kind === 'pine') {
    const trunk = new THREE.CylinderGeometry(0.08, 0.14, 1.2, 5);
    trunk.translate(0, 0.6, 0);
    parts.push(paint(trunk, trunkCol));
    [[1.15, 2.0, 1.5], [0.9, 1.7, 2.5], [0.6, 1.4, 3.4]].forEach(([r, h, y]) => {
      const cone = new THREE.ConeGeometry(r, h, 7);
      cone.translate(0, y, 0);
      parts.push(paint(cone, '#ffffff'));
    });
  } else if (kind === 'cypress') {
    const trunk = new THREE.CylinderGeometry(0.06, 0.1, 0.6, 5);
    trunk.translate(0, 0.3, 0);
    parts.push(paint(trunk, trunkCol));
    const body = new THREE.SphereGeometry(0.5, 8, 10);
    body.scale(1, 4.4, 1);
    body.translate(0, 2.4, 0);
    parts.push(paint(body, '#ffffff'));
  } else {
    const trunk = new THREE.CylinderGeometry(0.1, 0.16, 1.4, 5);
    trunk.translate(0, 0.7, 0);
    parts.push(paint(trunk, trunkCol));
    const crown = new THREE.IcosahedronGeometry(1.1, 1);
    crown.scale(1.1, 0.85, 1.1);
    crown.translate(0, 2.1, 0);
    parts.push(paint(crown, '#ffffff'));
  }
  const g = mergeGeometries(parts.map((p) => { p.deleteAttribute('uv'); return p; }))!;
  g.computeVertexNormals();
  return g;
}

const AUTUMN = ['#a5582a', '#c27a2e', '#8e3f24', '#b9922f'];

export function buildVegetation(cfg: WorldData, field: HeightField, pois: PoiData[], quality: 'high' | 'low', season: SeasonName, radius: number) {
  const v = cfg.vegetation;
  if (v.kind === 'none' || v.density <= 0) return null;
  const rnd = mulberry32(cfg.seed * 31 + 7);
  const target = Math.round((quality === 'high' ? 1500 : 600) * v.density);
  const geo = treeGeometry(v.kind);
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, flatShading: true });
  const uTime = { value: 0 };
  mat.onBeforeCompile = (s) => {
    s.uniforms.uTime = uTime;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float ph = instanceMatrix[3].x * 0.31 + instanceMatrix[3].z * 0.17;
          float sw = sin(uTime * 1.2 + ph) * 0.05 * max(position.y - 0.8, 0.0);
          transformed.x += sw; transformed.z += sw * 0.6;
        #endif`,
      );
  };
  mat.customProgramCacheKey = () => 'tree-sway';
  const mesh = new THREE.InstancedMesh(geo, mat, target);
  mesh.castShadow = quality === 'high';
  mesh.receiveShadow = false;

  const blockers = pois.filter((p) => p.structure.type !== 'none').map((p) => ({ x: p.position[0], z: p.position[1], r: 4 + p.structure.spread * (p.structure.count > 1 ? 0.9 : 0.3) + p.structure.size * 2 }));
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const base: THREE.Vector3[] = [];
  let placed = 0, tries = 0;
  while (placed < target && tries < target * 30) {
    tries++;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(rnd()) * radius;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const y = field.height(x, z);
    if (y < field.level + 0.5) continue;
    const t = (y - field.level) / field.H;
    if (t > 0.85) continue;
    const slope = Math.abs(field.height(x + 0.8, z) - y) + Math.abs(field.height(x, z + 0.8) - y);
    if (slope > 1.4) continue;
    if (blockers.some((b) => Math.hypot(x - b.x, z - b.z) < b.r)) continue;
    // Palms like shores, pines like slopes, cypress like terraces — bias the distribution.
    const bias = v.kind === 'palm' ? 1 - smoothstep(0.1, 0.6, t) * 0.8 : v.kind === 'pine' ? 0.35 + smoothstep(0.05, 0.5, t) * 0.65 : 0.8;
    if (rnd() > bias) continue;
    const sc = 0.75 + rnd() * 0.65;
    s.set(sc, sc * (0.85 + rnd() * 0.35), sc);
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd() * Math.PI * 2);
    p.set(x, y - 0.05, z);
    m.compose(p, q, s);
    mesh.setMatrixAt(placed, m);
    base.push(p.clone());
    placed++;
  }
  mesh.count = placed;
  const tint = (seasonName: SeasonName) => {
    const baseHex = v.colors[seasonName] ?? v.colors.summer ?? '#4a6b45';
    const col = new THREE.Color();
    const r2 = mulberry32(99);
    for (let i = 0; i < placed; i++) {
      col.set(baseHex);
      if (seasonName === 'autumn' && r2() < 0.55) col.set(AUTUMN[Math.floor(r2() * AUTUMN.length)]);
      if (seasonName === 'winter' && r2() < 0.5) col.lerp(new THREE.Color('#e8ecea'), 0.55);
      col.offsetHSL((r2() - 0.5) * 0.03, 0, (r2() - 0.5) * 0.08);
      mesh.setColorAt(i, col);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  };
  tint(season);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.name = 'vegetation';
  return { mesh, uTime, tint };
}
