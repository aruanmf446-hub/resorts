#!/usr/bin/env node
/** Exports the procedural demo villa to public/models/villa.glb (proves the GLB pipeline end to end). */
import { writeFile } from 'node:fs/promises';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildVillaModel } from '../src/scripts/villa-model.ts';

// Minimal FileReader for Node (GLTFExporter uses it to read Blobs)
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then((b) => { this.result = b; this.onloadend?.(); this.onload?.({ target: this }); }); }
  readAsDataURL(blob) { blob.arrayBuffer().then((b) => { this.result = `data:${blob.type};base64,` + Buffer.from(b).toString('base64'); this.onloadend?.(); this.onload?.({ target: this }); }); }
};

const villa = buildVillaModel();
const glb = await new GLTFExporter().parseAsync(villa, { binary: true });
await writeFile(new URL('../public/models/villa.glb', import.meta.url), Buffer.from(glb));
console.log('public/models/villa.glb', (glb.byteLength / 1024).toFixed(1), 'KB');
