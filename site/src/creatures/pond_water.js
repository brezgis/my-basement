// What the koi need of the water (koi.js: sink and U), for a pond whose water is an ordinary sheet of the
// builder's 'water' (grounds.js lays it). At Anna's House this file is the whole basin and surface, drawn by its
// own shaders; here the surface is nearly opaque and the fish would be lost under it, so:
//
//   sink(shader)   patches a material that is under the water. Its depth in the depth buffer is that of the point
//                  where the line of sight to it crosses the surface (a hair above it, and the deeper the thing the
//                  less above, so fish still hide each other properly): it is then drawn over the water, after it,
//                  and anything on or over the water (a lily pad, the bank) still hides it. Its colour sinks into
//                  the water's own with depth.
//
// The material must be transparent and drawn after the water (koi.js gives its mesh renderOrder 42).

import * as THREE from 'three';
import { POND } from './pond_shape.js';

const NFISH = 24;
export const U = {
  uSurfY: { value: POND.y },
  uMurk: { value: new THREE.Color(0.1, 0.19, 0.18) },      // the colour things go as they sink (set by the hour)
  uClear: { value: 1.3 },                                  // how fast, per foot
  uFishA: { value: new Float32Array(NFISH * 4) }, uFishB: { value: new Float32Array(NFISH * 4) },      // (koi.js writes these: the house's water draws the fish's shadows from them)
};

export function sink(sh, { fade = null } = {}) {
  for (const k of ['uSurfY', 'uMurk', 'uClear']) sh.uniforms[k] = U[k];
  sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uSurfY; varying float vDeep;')
    .replace('#include <project_vertex>', `#include <project_vertex>
  { vec4 pw = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    pw = instanceMatrix * pw;
  #endif
    vec3 wp = (modelMatrix * pw).xyz; vDeep = uSurfY - wp.y;
    float top = uSurfY + 0.016 - 0.01 * clamp(vDeep / 1.5, 0.0, 1.0);
    if (wp.y < top && cameraPosition.y > top + 0.02) {
      vec4 c = projectionMatrix * viewMatrix * vec4(cameraPosition + (wp - cameraPosition) * ((cameraPosition.y - top) / (cameraPosition.y - wp.y)), 1.0);
      gl_Position.z = c.z / c.w * gl_Position.w;
    } }`);
  sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSurfY, uClear; uniform vec3 uMurk; varying float vDeep;')
    .replace('#include <dithering_fragment>', `#include <dithering_fragment>
  { float k = 1.0 - 0.92 * exp(-max(vDeep, 0.0) * uClear);      // (a fifth of it is lost at once, to the surface)
    gl_FragColor.rgb = mix(gl_FragColor.rgb, uMurk, 0.92 * k); gl_FragColor.a = ${fade ? `1.0 - smoothstep(80.0, 120.0, ${fade})` : '1.0'}; }`);
}
