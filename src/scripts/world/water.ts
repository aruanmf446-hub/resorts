import * as THREE from 'three';
import { WORLD_SIZE, DIORAMA_RADIUS } from './terrain';

/** Stylised water: depth-tinted shallows, shoreline foam, fresnel sky reflection and sun glints. */
export function buildWater(opts: {
  level: number;
  shallow: string;
  deep: string;
  heightTex: THREE.Texture;
  infinite: boolean;
}) {
  const size = opts.infinite ? 2400 : WORLD_SIZE;
  const geo = new THREE.PlaneGeometry(size, size, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const uniforms = {
    uTime: { value: 0 },
    uShallow: { value: new THREE.Color(opts.shallow) },
    uDeep: { value: new THREE.Color(opts.deep) },
    uSky: { value: new THREE.Color('#dfe8ee') },
    uSunDir: { value: new THREE.Vector3(0.4, 0.6, 0.3).normalize() },
    uSunColor: { value: new THREE.Color('#ffffff') },
    uHeight: { value: opts.heightTex },
    uLevel: { value: opts.level },
    uSize: { value: WORLD_SIZE },
    uRadius: { value: opts.infinite ? 99999 : DIORAMA_RADIUS },
    uFogColor: { value: new THREE.Color('#dfe8ee') },
    uFogDensity: { value: 0.006 },
    uNight: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uLevel, uSize, uRadius, uFogDensity, uNight;
      uniform vec3 uShallow, uDeep, uSky, uSunDir, uSunColor, uFogColor;
      uniform sampler2D uHeight;
      varying vec3 vW;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f);
        return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
      void main() {
        if (length(vW.xz) > uRadius) discard;
        vec2 uv = vW.xz / uSize + 0.5;
        float ground = -30.0;
        if (uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) ground = texture2D(uHeight, uv).r;
        float depth = uLevel - ground;
        if (depth < -0.05) discard;
        // animated micro-normals
        vec2 p = vW.xz * 0.35;
        float t = uTime * 0.6;
        float n1 = noise(p * 0.6 + vec2(t * 0.3, t * 0.2));
        float wx = sin(p.x * 1.7 + t * 1.3 + n1 * 3.0) * 0.5 + sin(p.x * 3.1 - p.y * 1.3 + t * 1.9) * 0.25;
        float wz = cos(p.y * 1.5 - t * 1.1 + n1 * 2.0) * 0.5 + cos(p.y * 2.7 + p.x * 1.1 - t * 1.6) * 0.25;
        vec3 N = normalize(vec3(wx * 0.22, 1.0, wz * 0.22));
        vec3 V = normalize(cameraPosition - vW);
        float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 col = mix(uShallow, uDeep, smoothstep(0.2, 7.0, depth));
        col = mix(col, uSky, fres * 0.65);
        // sun glints
        vec3 H = normalize(uSunDir + V);
        float spec = pow(max(dot(N, H), 0.0), 120.0);
        col += uSunColor * spec * 0.9;
        // shoreline foam
        float foam = (1.0 - smoothstep(0.0, 0.55, depth)) * (0.55 + 0.45 * sin(uTime * 1.4 + depth * 14.0 + n1 * 4.0));
        col = mix(col, vec3(1.0, 0.99, 0.96) * mix(1.0, 0.35, uNight), clamp(foam, 0.0, 1.0) * 0.75);
        float alpha = mix(0.72, 0.97, smoothstep(0.0, 3.0, depth));
        // fog
        float d = length(cameraPosition - vW);
        float f = 1.0 - exp(-uFogDensity * uFogDensity * d * d);
        col = mix(col, uFogColor, f);
        gl_FragColor = vec4(col, alpha);
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = opts.level;
  mesh.renderOrder = 2;
  mesh.name = 'water';
  return { mesh, uniforms };
}
