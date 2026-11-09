import * as THREE from 'three';
import { makeNoise, smoothstep, lerp } from './noise';
import type { WorldData, PoiData, SeasonName } from './types';

export const WORLD_SIZE = 120;
export const DIORAMA_RADIUS = 58;

const LAND_STRUCTURES = new Set(['villa', 'bungalows', 'pavilion', 'pool', 'spa', 'cabin', 'lodge', 'tower', 'deck', 'garden']);

/** Builds the height function for the configured landscape, with flattened pads under buildings. */
export function createHeightField(cfg: WorldData, pois: PoiData[]) {
  const { fbm, ridged } = makeNoise(cfg.seed);
  const H = cfg.terrain.height;
  const level = cfg.water.level;

  const raw = (x: number, z: number): number => {
    switch (cfg.terrain.kind) {
      case 'island': {
        const a = Math.atan2(z, x);
        const d = Math.hypot(x, z);
        const R = 31 + fbm(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 3) * 7;
        const core = Math.pow(Math.max(0, 1 - (d / R) ** 2), 1.15);
        const hill = Math.exp(-(((x + 16) ** 2) + ((z + 16) ** 2)) / 260) * 0.75;
        let h = H * (core * (0.45 + 0.35 * (fbm(x * 0.035, z * 0.035) + 1) * 0.5) + hill * core) + fbm(x * 0.08, z * 0.08, 3) * 0.6;
        h -= 0.6;
        const shelf = lerp(-1.1, -9, smoothstep(R - 2, R + 26, d));
        return d < R ? Math.max(h, shelf) : shelf + fbm(x * 0.1, z * 0.1, 2) * 0.4;
      }
      case 'valley': {
        const lx = x - 4, lz = z * 1.25;
        const r = Math.hypot(lx, lz);
        const rise = Math.pow(smoothstep(12, 62, r + fbm(x * 0.03, z * 0.03, 3) * 9), 1.35);
        let h = H * rise * (0.55 + 0.75 * ridged(x * 0.03, z * 0.03, 5)) + fbm(x * 0.07, z * 0.07, 3) * 1.4 + 0.8;
        if (r < 15) h = lerp(-3.5, h, smoothstep(6, 15, r));
        return h;
      }
      case 'terraces': {
        const slope = smoothstep(-55, 50, -z * 0.9 + x * 0.25 + fbm(x * 0.03, z * 0.03, 3) * 14);
        let h = H * slope + 0.8;
        const step = 1.6;
        const f = h / step;
        h = step * (Math.floor(f) + smoothstep(0.82, 1, f - Math.floor(f)));
        const pond = Math.hypot(x + 4, z - 36);
        if (pond < 11) h = lerp(-2.4, h, smoothstep(5, 11, pond));
        return h + fbm(x * 0.2, z * 0.2, 2) * 0.12;
      }
      case 'dunes':
      default: {
        return 1 + H * 0.3 * (Math.sin(x * 0.12 + fbm(x * 0.02, z * 0.02) * 4) * 0.5 + 0.5) * (0.6 + 0.4 * fbm(x * 0.05, z * 0.05));
      }
    }
  };

  // Building pads
  const pads = pois
    .filter((p) => LAND_STRUCTURES.has(p.structure.type))
    .map((p) => {
      const [x, z] = p.position;
      const r = 1.8 + p.structure.size * 1.6 + (p.structure.count > 1 ? p.structure.spread * 0.55 : 0);
      return { x, z, r, h: Math.max(raw(x, z), level + 1.1) };
    });

  const height = (x: number, z: number) => {
    let h = raw(x, z);
    for (const p of pads) {
      const d = Math.hypot(x - p.x, z - p.z);
      if (d < p.r + 9) h = lerp(h, p.h, 1 - smoothstep(p.r, p.r + 9, d));
    }
    return h;
  };

  return { height, raw, H, level };
}

export type HeightField = ReturnType<typeof createHeightField>;

const c = (hex: string) => new THREE.Color(hex);

export function terrainColors(cfg: WorldData, field: HeightField, geo: THREE.BufferGeometry, season: SeasonName) {
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const nor = geo.attributes.normal as THREE.BufferAttribute;
  const col = (geo.attributes.color as THREE.BufferAttribute) ?? new THREE.BufferAttribute(new Float32Array(pos.count * 3), 3);
  const k = cfg.terrain.colors;
  let low = c(k.low), mid = c(k.mid);
  const high = c(k.high), shore = c(k.shore), peak = c(k.peak), snow = c('#f3f4f2');
  if (season === 'autumn') { mid = mid.clone().lerp(c('#8a6a3a'), 0.45); low = low.clone().lerp(c('#a08550'), 0.35); }
  if (season === 'spring') { mid = mid.clone().lerp(c('#6f9a52'), 0.3); }
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const slope = 1 - nor.getY(i);
    const t = (y - field.level) / Math.max(1, field.H);
    if (y < field.level + 0.7) tmp.copy(shore).lerp(low, smoothstep(field.level - 1, field.level + 0.7, y) * 0.3);
    else if (t < 0.3) tmp.copy(low).lerp(mid, smoothstep(0.02, 0.3, t));
    else if (t < 0.75) tmp.copy(mid).lerp(high, smoothstep(0.3, 0.75, t));
    else tmp.copy(high).lerp(peak, smoothstep(0.75, 1.1, t));
    if (slope > 0.35) tmp.lerp(high, smoothstep(0.35, 0.7, slope) * 0.6);
    if (season === 'winter') {
      const s = smoothstep(0.08, 0.3, t) * (1 - smoothstep(0.45, 0.8, slope));
      tmp.lerp(snow, Math.max(s, smoothstep(0.6, 0.9, t) * 0.9));
    }
    col.setXYZ(i, tmp.r, tmp.g, tmp.b);
  }
  col.needsUpdate = true;
  geo.setAttribute('color', col);
}

export function buildTerrain(cfg: WorldData, field: HeightField, segments: number, season: SeasonName, diorama: boolean) {
  const geo = new THREE.PlaneGeometry(WORLD_SIZE, WORLD_SIZE, segments, segments);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) pos.setY(i, field.height(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  terrainColors(cfg, field, geo, season);

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 });
  const uniforms = {
    uContour: { value: cfg.terrain.contours ? 1 : 0 },
    uStep: { value: cfg.terrain.kind === 'valley' ? 1.6 : 0.9 },
    uLevel: { value: field.level },
    uRadius: { value: diorama ? DIORAMA_RADIUS : 9999 },
  };
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;\nuniform float uContour; uniform float uStep; uniform float uLevel; uniform float uRadius;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (length(vWPos.xz) > uRadius) discard;
        float hh = vWPos.y / uStep;
        float cl = abs(fract(hh - 0.5) - 0.5) / max(fwidth(hh), 1e-4);
        float line = 1.0 - min(cl, 1.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.8, line * uContour * smoothstep(uLevel, uLevel + 0.4, vWPos.y) * 0.8);`,
      );
  };
  mat.customProgramCacheKey = () => 'terrain-contours';
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.name = 'terrain';

  const group = new THREE.Group();
  group.add(mesh);

  if (diorama) {
    // Cross-section skirt and plinth: the world presented as an architectural model.
    const segs = 256;
    const skirtPos: number[] = [];
    const idx: number[] = [];
    const bottom = -10;
    for (let i = 0; i <= segs; i++) {
      const a = (i / segs) * Math.PI * 2;
      const x = Math.cos(a) * DIORAMA_RADIUS, z = Math.sin(a) * DIORAMA_RADIUS;
      skirtPos.push(x, field.height(x, z), z, x, bottom, z);
      if (i < segs) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(skirtPos, 3));
    sg.setIndex(idx);
    sg.computeVertexNormals();
    const skirt = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ color: c(cfg.terrain.colors.high).multiplyScalar(0.55), roughness: 1, side: THREE.DoubleSide }));
    group.add(skirt);
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(DIORAMA_RADIUS + 1.5, DIORAMA_RADIUS + 1.5, 1.2, 128),
      new THREE.MeshStandardMaterial({ color: cfg.architecture.color, roughness: 0.7 }),
    );
    plinth.position.y = bottom - 0.6;
    plinth.receiveShadow = true;
    group.add(plinth);
  }
  return { group, mesh };
}

/** Heights sampled into a texture so the water shader knows the depth (shore foam, shallows). */
export function heightTexture(field: HeightField, res = 256) {
  const data = new Uint16Array(res * res);
  for (let j = 0; j < res; j++)
    for (let i = 0; i < res; i++) {
      const x = (i / (res - 1) - 0.5) * WORLD_SIZE;
      const z = (j / (res - 1) - 0.5) * WORLD_SIZE;
      data[j * res + i] = THREE.DataUtils.toHalfFloat(field.height(x, z));
    }
  const tex = new THREE.DataTexture(data, res, res, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}
