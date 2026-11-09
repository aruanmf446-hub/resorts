import * as THREE from 'three';

/**
 * Procedural demonstration villa (illustrative, not a technical plan).
 * Used by the 3D Villa Explorer when no GLB is provided, and exported to
 * public/models/villa.glb by scripts/generate-glb.mjs to demo GLB loading.
 */
export function buildVillaModel(opts: { wall?: string; wood?: string; water?: string; linen?: string } = {}) {
  const wall = new THREE.MeshStandardMaterial({ color: opts.wall ?? '#efe9de', roughness: 0.85, name: 'lime-wall' });
  const stone = new THREE.MeshStandardMaterial({ color: '#d8cdbb', roughness: 0.95, name: 'stone' });
  const wood = new THREE.MeshStandardMaterial({ color: opts.wood ?? '#9b7653', roughness: 0.75, name: 'oak' });
  const dark = new THREE.MeshStandardMaterial({ color: '#3b3a36', roughness: 0.6, name: 'bronze' });
  const linen = new THREE.MeshStandardMaterial({ color: opts.linen ?? '#f6f2ea', roughness: 1, name: 'linen' });
  const water = new THREE.MeshStandardMaterial({ color: opts.water ?? '#5cc2bf', roughness: 0.05, metalness: 0.1, emissive: opts.water ?? '#5cc2bf', emissiveIntensity: 0.15, name: 'pool-water' });
  const glass = new THREE.MeshStandardMaterial({ color: '#cfe3e6', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.25, name: 'glass' });
  const leaf = new THREE.MeshStandardMaterial({ color: '#5b7a4e', roughness: 0.9, flatShading: true, name: 'leaf' });

  const g = new THREE.Group();
  g.name = 'villa';
  const box = (name: string, w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
    mesh.name = name;
    mesh.position.set(x, y + h / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    g.add(mesh);
    return mesh;
  };

  // Plinth, interior floor, terrace
  box('plinth', 12, 0.35, 10, stone, 0, -0.35, 0.5);
  box('floor', 9, 0.05, 4.2, wood, 0, 0, -1);
  box('terrace', 11, 0.06, 3.6, wood, 0, 0, 3.0);
  // Walls (open to the south)
  box('wall-back', 9.2, 3, 0.25, wall, 0, 0, -3.1);
  box('wall-west', 0.25, 3, 4.4, wall, -4.5, 0, -1);
  box('wall-east', 0.25, 3, 4.4, wall, 4.5, 0, -1);
  box('partition', 0.18, 2.6, 2.6, wall, 0.4, 0, -1.8);
  box('glazing', 8.8, 2.8, 0.04, glass, 0, 0, 1.12);
  for (const x of [-4.35, -1.5, 1.5, 4.35]) box('mullion', 0.06, 2.8, 0.06, dark, x, 0, 1.12);
  // Roof with deep overhang
  box('roof', 11.6, 0.22, 7.6, wall, 0, 3, 0.2);
  box('soffit', 11.2, 0.06, 7.2, wood, 0, 2.94, 0.2);
  // Bedroom
  box('bed-base', 2.2, 0.35, 2.3, wood, -2.2, 0.05, -1.4);
  box('bed', 2.0, 0.28, 2.1, linen, -2.2, 0.4, -1.35);
  box('pillows', 1.7, 0.18, 0.4, linen, -2.2, 0.68, -2.3);
  box('throw', 2.02, 0.05, 0.5, wood, -2.2, 0.66, -0.55);
  box('headboard', 2.4, 1.1, 0.12, wood, -2.2, 0, -2.85);
  // Living
  box('sofa', 2.4, 0.42, 0.9, linen, 2.6, 0.05, -2.3);
  box('sofa-back', 2.4, 0.4, 0.2, linen, 2.6, 0.45, -2.7);
  box('table', 1.2, 0.35, 0.7, wood, 2.6, 0.05, -1.2);
  // Bath (outdoor tub at west terrace)
  const tub = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.1, 6, 16), stone);
  tub.name = 'tub';
  tub.rotation.z = Math.PI / 2;
  tub.scale.set(0.8, 1, 1);
  tub.position.set(-3.6, 0.4, 2.3);
  tub.castShadow = true;
  g.add(tub);
  // Plunge pool and daybeds
  box('pool-edge', 3.8, 0.12, 2.2, stone, 2.6, 0.02, 2.6);
  box('pool', 3.4, 0.06, 1.8, water, 2.6, 0.1, 2.6);
  for (const x of [-0.4, 0.8]) {
    box('daybed', 0.8, 0.25, 1.9, wood, x, 0.06, 3.3);
    box('daybed-cushion', 0.74, 0.12, 1.84, linen, x, 0.31, 3.3);
  }
  // Planting
  for (const [x, z, s] of [[-5.3, 4, 1], [5.3, 4.2, 1.2], [-5.4, -2.5, 0.9]] as const) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 1.6 * s, 6), wood);
    trunk.position.set(x, 0.8 * s, z);
    g.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 * s, 1), leaf);
    crown.position.set(x, 1.8 * s, z);
    crown.castShadow = true;
    g.add(crown);
  }
  return g;
}
