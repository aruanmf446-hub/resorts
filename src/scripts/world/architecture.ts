import * as THREE from 'three';
import type { HeightField } from './terrain';
import type { PoiData, WorldData } from './types';

/** Architectural-model ("maquette") buildings generated from POI structure configs. */
export function createArchitecture(cfg: WorldData, field: HeightField, quality: 'high' | 'low') {
  const a = cfg.architecture;
  const mats = {
    wall: new THREE.MeshStandardMaterial({ color: a.color, roughness: 0.82 }),
    roof: new THREE.MeshStandardMaterial({ color: new THREE.Color(a.color).multiplyScalar(0.86), roughness: 0.9 }),
    wood: new THREE.MeshStandardMaterial({ color: a.accent, roughness: 0.8 }),
    glow: new THREE.MeshStandardMaterial({ color: '#2a2f33', emissive: a.windowGlow, emissiveIntensity: 0.05, roughness: 0.3 }),
    pool: new THREE.MeshStandardMaterial({ color: cfg.water.shallow, emissive: cfg.water.shallow, emissiveIntensity: 0.12, roughness: 0.08, metalness: 0.1 }),
    plant: new THREE.MeshStandardMaterial({ color: '#6c7f55', roughness: 1 }),
    thatch: new THREE.MeshStandardMaterial({ color: '#b39a72', roughness: 1, flatShading: true }),
  };
  const shadow = quality === 'high';
  const box = (w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z);
    m.castShadow = shadow;
    m.receiveShadow = shadow;
    return m;
  };
  const prism = (w: number, h: number, d: number, mat: THREE.Material) => {
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2, 0); shape.lineTo(w / 2, 0); shape.lineTo(0, h); shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = shadow;
    return m;
  };

  const builders: Record<string, (g: THREE.Group, size: number) => void> = {
    villa(g, s) {
      g.add(box(3.2 * s, 1.1, 2.2 * s, mats.wall));
      g.add(box(3.9 * s, 0.16, 2.9 * s, mats.roof, 0, 1.1, 0.2));
      g.add(box(2.6 * s, 0.62, 0.06, mats.glow, 0, 0.25, 1.11 * s));
      g.add(box(3.6 * s, 0.08, 1.4, mats.wood, 0, 0, 1.1 * s + 0.7));
      g.add(box(1.8 * s, 0.1, 0.9, mats.pool, 0.4 * s, 0.02, 1.1 * s + 0.75));
    },
    bungalows(g, s) {
      g.add(box(1.8 * s, 0.9, 1.6 * s, mats.wall));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.55 * s, 1.0, 4), mats.thatch);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 1.4;
      roof.castShadow = shadow;
      g.add(roof);
      g.add(box(0.9 * s, 0.5, 0.05, mats.glow, 0, 0.2, 0.81 * s));
    },
    overwater(g, s) {
      const deckY = cfg.water.level + 0.7;
      for (const [x, z] of [[-0.8, -0.6], [0.8, -0.6], [-0.8, 0.6], [0.8, 0.6]]) {
        const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 5), mats.wood);
        pile.position.set(x * s, deckY - 1.2, z * s);
        g.add(pile);
      }
      const inner = new THREE.Group();
      inner.position.y = deckY - g.position.y;
      g.add(inner);
      inner.add(box(2.6 * s, 0.1, 2.2 * s, mats.wood));
      inner.add(box(1.7 * s, 0.85, 1.4 * s, mats.wall, -0.2, 0.1, -0.2));
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.45 * s, 0.9, 4), mats.thatch);
      roof.rotation.y = Math.PI / 4;
      roof.position.set(-0.2, 1.4, -0.2);
      inner.add(roof);
      inner.add(box(1.0 * s, 0.45, 0.05, mats.glow, -0.2, 0.3, 0.52 * s));
    },
    pavilion(g, s) {
      g.add(box(6 * s, 0.12, 3.4 * s, mats.wood));
      g.add(box(6.6 * s, 0.18, 3.9 * s, mats.roof, 0, 1.6, 0));
      for (let i = -2; i <= 2; i++)
        for (const z of [-1.5, 1.5]) {
          const c = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.5, 6), mats.wall);
          c.position.set(i * 1.4 * s, 0.85, z * s);
          g.add(c);
        }
      g.add(box(4.5 * s, 0.3, 0.06, mats.glow, 0, 1.25, 0));
    },
    pool(g, s) {
      g.add(box(7 * s, 0.14, 3 * s, mats.wall));
      g.add(box(6.2 * s, 0.06, 2.2 * s, mats.pool, 0, 0.12, 0));
      g.add(box(2 * s, 0.9, 1.2 * s, mats.wall, -2.2 * s, 0, -2.3 * s));
      g.add(box(2.4 * s, 0.1, 1.6 * s, mats.roof, -2.2 * s, 0.9, -2.3 * s));
    },
    spa(g, s) {
      g.add(box(5 * s, 0.8, 1.4 * s, mats.wall, 0, 0, -1.6 * s));
      g.add(box(1.4 * s, 0.8, 3.2 * s, mats.wall, -1.8 * s, 0, 0.3 * s));
      g.add(box(5.5 * s, 0.14, 1.9 * s, mats.roof, 0, 0.8, -1.6 * s));
      g.add(box(2.4 * s, 0.06, 1.8 * s, mats.pool, 0.9 * s, 0.02, 0.6 * s));
      g.add(box(3.6 * s, 0.4, 0.05, mats.glow, 0.4, 0.2, -0.89 * s));
    },
    cabin(g, s) {
      const p = prism(2 * s, 2.1 * s, 2.6 * s, mats.wood);
      g.add(p);
      g.add(box(1.2 * s, 1.1 * s, 0.05, mats.glow, 0, 0, 1.31 * s));
      g.add(box(2.4 * s, 0.08, 1.2, mats.wall, 0, 0, 1.3 * s + 0.6));
    },
    lodge(g, s) {
      g.add(box(6 * s, 1.6, 2.6 * s, mats.wall));
      const r = prism(3.2 * s, 1.6, 6.6 * s, mats.wood);
      r.rotation.y = Math.PI / 2;
      r.position.y = 1.6;
      g.add(r);
      g.add(box(0.5, 1.4, 0.5, mats.roof, 1.8 * s, 1.8, -0.4));
      g.add(box(4.8 * s, 0.7, 0.06, mats.glow, 0, 0.4, 1.31 * s));
    },
    tower(g, s) {
      g.add(box(0.9 * s, 4.5, 0.9 * s, mats.wood));
      g.add(box(2.0 * s, 0.12, 2.0 * s, mats.wall, 0, 4.5, 0));
      g.add(box(2.2 * s, 0.1, 2.2 * s, mats.roof, 0, 5.6, 0));
      for (const [x, z] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) g.add(box(0.06, 1.0, 0.06, mats.wall, x * s, 4.6, z * s));
    },
    deck(g, s) {
      g.add(box(4 * s, 0.12, 2.4 * s, mats.wood));
      for (const x of [-1.2, 0, 1.2]) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 4), mats.wood);
        pole.position.set(x * s, 0.8, 0);
        g.add(pole);
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.35, 8), mats.wall);
        top.position.set(x * s, 1.6, 0);
        top.castShadow = shadow;
        g.add(top);
      }
    },
    jetty(g, s) {
      const len = 12 * s;
      const deckY = cfg.water.level + 0.5 - g.position.y;
      g.add(box(1.1, 0.12, len, mats.wood, 0, deckY, len / 2));
      g.add(box(4, 0.12, 2.2, mats.wood, 0, deckY, len));
      g.add(box(1.6, 0.8, 1.2, mats.wall, -0.8, deckY + 0.1, len));
      for (let i = 0; i < len; i += 1.5) {
        const pile = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2, 4), mats.wood);
        pile.position.set(0.5, deckY - 0.9, i);
        g.add(pile);
      }
    },
    garden(g, s) {
      for (let i = -2; i <= 2; i++) g.add(box(0.5, 0.25, 4 * s, mats.plant, i * 1.0 * s, 0, 0));
      g.add(box(2.2, 0.9, 1.4, mats.wall, 4 * s, 0, 0));
    },
  };

  function build(poi: PoiData) {
    const st = poi.structure;
    const builder = builders[st.type];
    const root = new THREE.Group();
    root.name = `poi-${poi.id}`;
    if (!builder) return root;
    const [cx, cz] = poi.position;
    const n = st.count;
    for (let i = 0; i < n; i++) {
      // Clusters spread along a gentle arc facing outward
      const t = n === 1 ? 0 : i / (n - 1) - 0.5;
      const ang = st.rotation + t * 1.4;
      const ox = n === 1 ? 0 : Math.sin(ang) * st.spread * (n / 2.2) * 0.55;
      const oz = n === 1 ? 0 : Math.cos(ang) * st.spread * 0.35 + t * t * st.spread;
      const x = cx + ox, z = cz + oz;
      const g = new THREE.Group();
      g.position.set(x, field.height(x, z), z);
      g.rotation.y = st.rotation + (n > 1 ? -t * 0.5 : 0);
      builder(g, st.size);
      root.add(g);
    }
    return root;
  }

  return { build, mats };
}
