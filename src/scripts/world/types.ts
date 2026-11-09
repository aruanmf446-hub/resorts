/** Serializable world data passed from the page to the browser. */
export type Vec3 = [number, number, number];
export type TimeName = 'dawn' | 'day' | 'dusk' | 'night';
export type SeasonName = 'spring' | 'summer' | 'autumn' | 'winter';

export interface WorldData {
  mode: 'procedural' | 'model' | 'illustrated' | 'image';
  model?: { src: string; scale: number; position: Vec3; rotationY: number; keepWater: boolean };
  seed: number;
  terrain: { kind: 'island' | 'valley' | 'terraces' | 'dunes'; height: number; contours: boolean; colors: Record<'low' | 'mid' | 'high' | 'shore' | 'peak', string> };
  water: { level: number; shallow: string; deep: string; kind: 'ocean' | 'lake' | 'none' };
  vegetation: { kind: 'palm' | 'pine' | 'broadleaf' | 'cypress' | 'none'; density: number; colors: Partial<Record<SeasonName, string>> };
  architecture: { color: string; accent: string; windowGlow: string };
  atmosphere: { times: TimeName[]; defaultTime: TimeName; seasons: SeasonName[]; defaultSeason?: SeasonName; fog: number; clouds: boolean; particles: 'none' | 'pollen' | 'snow' | 'mist' | 'fireflies' };
  camera: { position: Vec3; target: Vec3; introFrom: Vec3; minDistance: number; maxDistance: number };
}

export interface PoiData {
  id: string;
  name: string;
  category: string;
  position: [number, number];
  structure: { type: string; count: number; size: number; rotation: number; spread: number };
}

export type Quality = 'high' | 'low';
