// stair_hall: concealed light, and candle flames. An amber wash laid on a wall (or a ceiling, or a floor) from a hidden strip: bright at
// the strip and falling away from it, additive, drawn after the wall it lies on. It lights nothing itself (the room's
// one casting lamp is elsewhere): it is the look of light from a cove, after the lounges and stairs of Anna's
// pictures (research/refs/3). The same idea as pool_chapel_fx.js's wash, written here so that a line may slope (the
// stair's handrail and cove follow the pitch) and may wash downward as well as up.
//
//   wash(ctx, f, items, at)
//     items: { a: [X, Y, h], b: [X, Y, h], n: [nx, ny], d: [dx, dy, dh], k }
//       a, b  the strip's two ends (plan X, Y and height h);  n  the plan direction into the room (the quad is laid
//       0.03 ft off the surface that way);  d  the direction and length the light spreads over the surface from the
//       strip (e.g. [0, 0, -3] down a wall, [0, -2.2, 0] across a ceiling);  k  brightness
//     at: [X, Y, h], a point of the room the wash belongs to (for the zones)

import * as THREE from 'three';
import { NOISE } from '../flame.js';

const addTracked = (ctx, mesh, at, size = 1) => { mesh.frustumCulled = false; ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size)); return mesh; };

export function wash(ctx, f, items, at) {
  const pos = [], q = [];
  for (const { a, b, n, d, k = 1 } of items) {
    const off = [n[0] * 0.03, n[1] * 0.03], W = (X, Y, h) => f.world(X + off[0], Y + off[1], h);
    const A = W(a[0], a[1], a[2]), B = W(b[0], b[1], b[2]), C = W(b[0] + d[0], b[1] + d[1], b[2] + d[2]), Dd = W(a[0] + d[0], a[1] + d[1], a[2] + d[2]);
    for (const [p, t] of [[A, [0, 0]], [B, [1, 0]], [C, [1, 1]], [A, [0, 0]], [C, [1, 1]], [Dd, [0, 1]]]) { pos.push(p.x, p.y, p.z); q.push(t[0], t[1], k); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 3));
  const uK = { value: 1 };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uK }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'attribute vec3 aQ; varying vec3 vQ; void main() { vQ = aQ; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uK; varying vec3 vQ;
void main() { float v = vQ.y, edge = 0.035 + 0.09 * v;
  float ends = smoothstep(0.0, edge, vQ.x) * smoothstep(0.0, edge, 1.0 - vQ.x);
  float fall = pow(1.0 - v, 2.8) / (1.0 + 4.0 * v * v);
  gl_FragColor = vec4(vec3(1.0, 0.58, 0.24) * fall * ends * vQ.z * uK, 1.0); }`,
  }));
  m.name = 'stair_hall concealed light'; m.renderOrder = 1; m.frustumCulled = false;
  const w = f.world(...at);
  ctx.scene.add(m); ctx.track(m, ctx.zoneAt(w.x, w.y, w.z, 0.4));
  ctx.animated.push(() => { uK.value = 0.3 + 0.35 * (ctx.day?.night ?? 0); });
}

// ---- candle flames (the Chapel's way, pool_chapel_fx.js, copied here): every candle of a room in one draw, with a halo ----
// list: [{ X, Y, h, s }] (plan; the wick's tip); W = (X, Y, h) => f.world(X, Y, h); at: a world point of the room
export function flames(ctx, W, list, at) {
  if (!list.length) return;
  const uT = { value: 0 }, n = list.length;
  const mk = (w, h, dy) => { const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(w, h).translate(0, dy, 0)); const a = new Float32Array(n * 4); list.forEach((c, i) => { const p = W(c.X, c.Y, c.h); a.set([p.x, p.y, p.z, c.s ?? 1], i * 4); }); g.setAttribute('aP', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n; return g; };
  const vert = `attribute vec4 aP; varying vec2 vUv; varying float vS;
void main() { vUv = uv; vec3 c = aP.xyz; float s = aP.w; vS = fract(c.x * 3.71 + c.z * 5.37 + c.y * 1.13) * 40.0;
  vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
  gl_Position = projectionMatrix * viewMatrix * vec4(c + right * position.x * s + vec3(0.0, position.y * s, 0.0), 1.0); }`;
  // (the fragment is flame.js's makeCandleFlame, word for word)
  const flame = new THREE.Mesh(mk(0.14, 0.24, 0.108), new THREE.ShaderMaterial({
    uniforms: { uT }, transparent: true, depthWrite: false, fog: false, vertexShader: vert,
    fragmentShader: `uniform float uT; varying vec2 vUv; varying float vS;
${NOISE}
void main() {
  float t = uT + vS, y = vUv.y, x = (vUv.x - 0.5) * 2.0;
  float lean = noise(vec2(vS, t * 1.3)) - 0.5, quick = noise(vec2(vS + 9.0, t * 6.0)) - 0.5, lick = noise(vec2(x * 2.0 + vS, y * 3.0 - t * 4.5)) - 0.5;
  x -= (lean * 0.5 + quick * 0.16) * y * y + lick * 0.14 * y;
  float yy = y / (0.84 + 0.1 * noise(vec2(vS + 3.0, t * 5.0)) + 0.06 * lean);
  if (yy >= 1.0) discard;
  float w = 1.1 * sqrt(yy) * pow(1.0 - yy, 0.75) + 0.05 * (1.0 - yy);
  float d = abs(x) / w;
  float a = (1.0 - smoothstep(0.5, 1.0, d)) * smoothstep(0.0, 0.05, yy) * (1.0 - smoothstep(0.86, 1.0, yy));
  vec3 col = mix(vec3(1.0, 0.82, 0.42), vec3(1.0, 0.42, 0.06), smoothstep(0.25, 1.0, d));
  col = mix(col, vec3(1.0, 0.96, 0.82), (1.0 - smoothstep(0.0, 0.55, d)) * smoothstep(0.16, 0.42, yy) * (1.0 - smoothstep(0.55, 0.92, yy)));
  float foot = 1.0 - smoothstep(0.02, 0.26, yy);
  col = mix(col, vec3(0.28, 0.42, 1.0), foot * 0.8);
  a *= mix(1.0, 0.5, foot);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col * 1.2, a);
}`,
  }));
  flame.renderOrder = 3; flame.name = 'stair_hall flames';
  // a soft halo round each, stronger after dark (the house's halos only come on at dusk, and only for its own candles)
  const uK = { value: 0.3 };
  const halo = new THREE.Mesh(mk(1, 1, 0), new THREE.ShaderMaterial({
    uniforms: { uK, uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute vec4 aP; uniform float uT; varying vec2 vUv; varying float vA;
void main() { vUv = uv * 2.0 - 1.0; vA = 1.0 + 0.06 * sin(uT * 8.0 + aP.x * 3.1 + aP.z * 1.7);
  vec4 mv = viewMatrix * vec4(aP.xyz + vec3(0.0, 0.1, 0.0), 1.0); mv.xy += position.xy * aP.w * 1.1; mv.z += 0.3; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; varying vec2 vUv; varying float vA;
void main() { float r = dot(vUv, vUv); if (r > 1.0) discard; float g = 1.0 - r; g = g * g * g; gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * g * vA * uK, 1.0); }`,
  }));
  halo.renderOrder = 2; halo.name = 'stair_hall candle halos';
  addTracked(ctx, flame, at); addTracked(ctx, halo, at);
  ctx.animated.push(t => { uT.value = t; uK.value = 0.16 + 0.3 * (ctx.day?.night ?? 0); });
}

