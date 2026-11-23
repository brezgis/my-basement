// pool_chapel_fx.js: what moves or glows in the Pool and the Chapel, set going once the scene exists
// (pool_chapel.js calls these from f.later). Everything is given in the building's plan (X, Y, h) and turned into
// the world with W = (X, Y, h) => f.world(X, Y, h); each mesh is tracked to its room, so nothing is drawn (or
// costs anything) while its room cannot be seen. Nothing here runs on the CPU per frame but a few uniforms,
// except the Life window's step (once a second, only while it is being looked at).
//
//   flames()     every candle of a room in one draw: the house's candle flame (flame.js), instanced, with a halo
//   poolWater()  a sheet just over the pool's water: slow ripples, the lanterns reflected and broken up in them
//   steam()      warm water's breath, drifting low over the pool
//   glassBoxes() the Chapel's leaded glass, lit from behind as light boxes in their niches (the drawing is Vesper
//                Street's: pool_chapel_glass.js), and their colour thrown on the floor in front of each
//   oculus()     daylight down the shaft: a pool of it on the floor and the table, a faint beam, dust turning in it
//   bowl()       the water in the bowl under the shaft: touch it and rings go out; and the singing bowl beside it
import * as THREE from 'three';
import { drawSkylightGlass, EYE, CAPTION } from './skylight_glass.js';
import { NOISE } from '../flame.js';
import { DRAW, LIFE, makeLife, poolCopy, greatPlan, GREATPX, FONT, LOOP_EYE } from './pool_chapel_glass.js';
import { NEW } from './pool_chapel_glass2.js';

const smooth = THREE.MathUtils.smoothstep;
const V = p => new THREE.Vector3(p.x, p.y, p.z);
const tone = '#include <tonemapping_fragment>\n#include <colorspace_fragment>';
const addTracked = (ctx, mesh, at, size = 1) => { mesh.frustumCulled = false; ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size)); return mesh; };

// ---- candle flames --------------------------------------------------------------------------------------------------
// list: [{ X, Y, h, s }] (the wick's tip; s a size). The flame card and its colours are flame.js's makeCandleFlame,
// with the wick's place given per instance instead of by a mesh's matrix, so a whole room of them is one draw.
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
  flame.renderOrder = 3; flame.name = 'pool_chapel flames';
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
  halo.renderOrder = 2; halo.name = 'pool_chapel candle halos';
  addTracked(ctx, flame, at); addTracked(ctx, halo, at);
  ctx.animated.push(t => { uT.value = t; uK.value = 0.16 + 0.3 * (ctx.day?.night ?? 0); });
}

// ---- the pool's water -----------------------------------------------------------------------------------------------
// A sheet 0.03 ft over the building's water plane (spanya.js), added on top of it: slow crossing ripples, a sheen that
// grows at a slant (fresnel), and every lantern's flame reflected where the ripples turn it toward the eye, so a
// lamp lies on the water as a broken column of light. lamps: [{ X, Y, h, k }] (k: brightness).
export function poolWater(ctx, W, rect, h, lamps) {
  const [X0, X1, Y0, Y1] = rect, a = W(X0, Y0, h), b = W(X1, Y0, h), c = W(X1, Y1, h), d = W(X0, Y1, h);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([a, b, c, a, c, d].flatMap(p => [p.x, p.y, p.z]), 3));
  return waterSheet(ctx, g, lamps.map(l => { const p = W(l.X, l.Y, l.h); return { x: p.x, y: p.y, z: p.z, k: l.k }; }), W((X0 + X1) / 2, (Y0 + Y1) / 2, h + 1));
}
// The same sheet over any outline of water (the courtyard's edge pool is a crescent): g in the world, lamps
// [{ x, y, z, k }] in the world, `at` a point over the water (for the zone it is drawn with).
export function waterSheet(ctx, g, lamps, at) {
  const L = lamps.slice(0, 8).map(l => new THREE.Vector4(l.x, l.y, l.z, l.k ?? 1));
  while (L.length < 8) L.push(new THREE.Vector4(0, -999, 0, 0));
  const U = { uT: { value: 0 }, uL: { value: L }, uSheen: { value: new THREE.Color(0.2, 0.17, 0.13) }, uNight: { value: 0 } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT, uNight; uniform vec4 uL[8]; uniform vec3 uSheen; varying vec3 vW;
${NOISE}
void main() {
  vec2 p = vW.xz; float t = uT;
  // the slope of a few long slow swells crossing, and a finer shiver on them
  vec2 gr = vec2(0.0);
  gr += 0.016 * vec2(0.55, 0.30) * cos(dot(p, vec2(0.55, 0.30)) + t * 0.55);
  gr += 0.012 * vec2(-0.32, 0.61) * cos(dot(p, vec2(-0.32, 0.61)) + t * 0.47 + 1.3);
  gr += 0.008 * vec2(1.10, -0.70) * cos(dot(p, vec2(1.10, -0.70)) + t * 0.83 + 2.1);
  gr += 0.005 * vec2(-1.7, -1.2) * cos(dot(p, vec2(-1.7, -1.2)) + t * 1.2 + 0.4);
  float n1 = noise(p * 1.6 + vec2(t * 0.21, -t * 0.17)), n2 = noise(p * 1.6 + vec2(3.1, 1.7) + vec2(-t * 0.19, t * 0.23));
  gr += vec2(n1 - 0.5, n2 - 0.5) * 0.022;
  vec3 N = normalize(vec3(-gr.x, 1.0, -gr.y));
  vec3 Vd = normalize(cameraPosition - vW);
  vec3 R = reflect(-Vd, N);
  float fr = 0.02 + 0.98 * pow(1.0 - max(dot(N, Vd), 0.0), 5.0);
  vec3 col = uSheen * fr * 1.4;
  for (int i = 0; i < 8; i++) {
    vec3 Ld = uL[i].xyz - vW; float dl = length(Ld); Ld /= dl;
    float c = max(dot(R, Ld), 0.0);
    float s = pow(c, 3000.0) * 5.0 + pow(c, 300.0) * 2.4 + pow(c, 50.0) * 0.1;
    col += vec3(1.0, 0.68, 0.34) * s * uL[i].w * (0.12 + 0.88 * uNight);
  }
  gl_FragColor = vec4(col, 1.0);
}`,
  }));
  m.renderOrder = 2; m.name = 'pool water ripples';
  addTracked(ctx, m, at, 1);
  ctx.animated.push(t => { U.uT.value = t; U.uNight.value = ctx.day?.night ?? 0; });
  return m;
}

// ---- steam ----------------------------------------------------------------------------------------------------------
// A thin haze off warm water, barely there: several hundred small soft puffs, each a few percent opaque and with no
// outline, overlapping so that none can be picked out. Most stay in a low veil within a foot or two of the water
// (born as nothing a few inches over it: no lower edge); a few rise and thin into curls that are gone by 6 to 8 ft
// (faint traces higher in the tall part). They drift sideways as well as up. Each fades as the eye comes near it, so
// it never cuts hard across the view from in the water. All in the vertex shader: the CPU sets two numbers a frame.
// o.tall: [Y0, Y1] of the part with a high ceiling.
export function steam(ctx, W, rect, h, n = 480, o = {}) {
  const [X0, X1, Y0, Y1] = rect;
  let k = 7; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  const aB = new Float32Array(n * 4), aC = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const Y = Y0 + 0.4 + rnd() * (Y1 - Y0 - 0.8), p = W(X0 + 0.4 + rnd() * (X1 - X0 - 0.8), Y, h + 0.2), tall = o.tall && Y > o.tall[0];
    const up = 0.8 + 1.6 * rnd() + (rnd() < 0.12 ? (tall ? 9 : 5.5) * rnd() : 0);      // most stay low; one in eight rises
    aB.set([p.x, p.y, p.z, rnd()], i * 4); aC.set([0.028 + rnd() * 0.026, rnd() * 6.28, 0.7 + rnd() * 0.9, up], i * 4);      // (a wisp lives 20 to 35 seconds: at 40 to 80 the steam looked still)
  }
  geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); geo.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); geo.instanceCount = n;
  const U = { uT: { value: 0 }, uCol: { value: new THREE.Color(0.8, 0.76, 0.7) }, uA: { value: 0.03 } };
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, fog: false,
    vertexShader: `attribute vec4 aB, aC; uniform float uT; varying vec2 vUv; varying float vA; varying float vS;
void main() {
  float u = fract(uT * aC.x + aB.w);
  float rise = aC.w * u;
  vec3 c = aB.xyz + vec3(1.4 * u * sin(aC.y) + 0.35 * sin(uT * 0.31 + aC.y), rise, 1.4 * u * cos(aC.y) + 0.35 * cos(uT * 0.26 + aC.y * 1.7));
  float s = aC.z * (0.5 + 0.9 * u) * (1.0 + 0.08 * rise);
  vec4 mv = viewMatrix * vec4(c, 1.0);
  vUv = uv * 2.0 - 1.0; vS = aC.y;
  vA = smoothstep(0.0, 0.18, u) * (1.0 - smoothstep(0.35, 1.0, u)) * (1.0 - 0.65 * smoothstep(0.5, 6.0, rise)) * smoothstep(0.6, 3.0, -mv.z);
  mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uA, uT; varying vec2 vUv; varying float vA; varying float vS;
${NOISE}
void main() {
  float r = dot(vUv, vUv); if (r > 1.0) discard;
  float g = exp(-r * 3.0) - exp(-3.0);
  float a = g * (0.55 + 0.45 * noise(vUv * 1.7 + vec2(vS * 3.0, uT * 0.03))) * vA * uA;
  if (a < 0.001) discard;
  gl_FragColor = vec4(uCol, a);
  ${tone}
}`,
  }));
  m.renderOrder = 4; m.name = 'pool steam';
  addTracked(ctx, m, W((X0 + X1) / 2, (Y0 + Y1) / 2, h + 1.5), 1);
  ctx.animated.push(t => { U.uT.value = t; const L = ctx.day?.light ?? 1, nt = ctx.day?.night ?? 0, eve = 1 - Math.abs(((ctx.day?.hour ?? 12) - 19.5) / 3.5);
    U.uCol.value.setRGB(0.5 + 0.3 * L + 0.12 * nt, 0.47 + 0.29 * L + 0.07 * nt, 0.43 + 0.27 * L + 0.02 * nt);      // (by day no brighter than the tile behind; at night a little of the candles' warmth)
    U.uA.value = 0.075 + 0.035 * nt + 0.025 * Math.max(0, Math.min(1, eve)); });
}

// ---- concealed light: an amber wash up a wall (or up a bench's front) from a cove at its foot, and a little on the floor
// list: [[X0, Y0, X1, Y1, h, up, out, k]]: a line along the foot (the room on its right going from 0 to 1, as seen from
// above with +Y up... either way: both faces are drawn), the height it washes, how far out on the floor, brightness
export function wash(ctx, W, list, at) {
  const pos = [], q = [];
  for (const [X0, Y0, X1, Y1, h, up, out, k] of list) {
    const dx = X1 - X0, dy = Y1 - Y0, l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l;      // (the side it faces: the caller orders the ends so this points into the room)
    const P = (X, Y, hh) => W(X + nx * 0.03, Y + ny * 0.03, hh);
    const quad = (a, b, c, d, qa, qb, qc, qd) => { for (const [p, t] of [[a, qa], [b, qb], [c, qc], [a, qa], [c, qc], [d, qd]]) { pos.push(p.x, p.y, p.z); q.push(...t); } };
    // up the wall: v from 0 at the foot to 1 at the top; u along for the fade at the ends
    quad(P(X0, Y0, h), P(X1, Y1, h), P(X1, Y1, h + up), P(X0, Y0, h + up), [0, 0, k, 0], [1, 0, k, 0], [1, 1, k, 0], [0, 1, k, 0]);
    // on the floor (or seat) in front
    if (out > 0) { const F2 = (X, Y, e) => W(X + nx * e, Y + ny * e, h + 0.015); quad(F2(X0, Y0, 0.03), F2(X1, Y1, 0.03), F2(X1, Y1, out), F2(X0, Y0, out), [0, 0, k, 1], [1, 0, k, 1], [1, 1, k, 1], [0, 1, k, 1]); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 4));
  const uK = { value: 1 };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { uK }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'attribute vec4 aQ; varying vec4 vQ; void main() { vQ = aQ; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uK; varying vec4 vQ;
void main() { float v = vQ.y, ends = smoothstep(0.0, 0.04, vQ.x) * smoothstep(0.0, 0.04, 1.0 - vQ.x);
  float f = vQ.w > 0.5 ? pow(1.0 - v, 2.0) * 0.5 : (0.08 * exp(-v * 60.0) + pow(1.0 - v, 2.6));
  gl_FragColor = vec4(vec3(1.0, 0.6, 0.26) * f * ends * vQ.z * uK, 1.0); }`,
  }));
  m.name = 'concealed light'; m.renderOrder = 1; addTracked(ctx, m, at, 1);
  ctx.animated.push(() => { uK.value = 0.32 + 0.4 * (ctx.day?.night ?? 0); });
}

// ---- slits of daylight in the pool's ceiling ------------------------------------------------------------------------
// list: [[X0, X1, Y0, Y1, h], ...] thin strips facing down; bright and a little cool by day, a faint glow at night
export function slits(ctx, W, list, at) {
  const pos = [];
  for (const [X0, X1, Y0, Y1, h] of list) { const a = W(X0, Y0, h), b = W(X1, Y0, h), c = W(X1, Y1, h), d = W(X0, Y1, h); for (const p of [a, c, b, a, d, c]) pos.push(p.x, p.y, p.z); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, fog: false }));
  m.name = 'pool ceiling slits'; addTracked(ctx, m, at, 1);
  ctx.animated.push(() => { const L = smooth(ctx.day?.light ?? 1, 0.45, 0.95); m.material.color.setRGB(0.035 + 0.9 * L, 0.03 + 0.92 * L, 0.025 + 0.95 * L); });
}

// ---- the Chapel's glass: light boxes in niches --------------------------------------------------------------------
// panes: [{ id, X, Y, h, w, ht, ux, uy, great }]: the middle of the glass, its size, the plan direction of the
// picture's right as seen from the room. The end window and the tall ones are drawn on ONE sheet (4096 by 2048, laid
// out as Vesper Street lays out its own), the Life window on a canvas of its own, a little at a time after start-up.
// A light box shines the same by day and by night, warm, a little brighter at its middle than at its rim.
export function glassBoxes(ctx, W, panes, room) {
  const Q = new URLSearchParams(location.search);
  // This chapel's sheet: the great light (drawn at Vesper Street's size and set in at four fifths), the lancets drawn at
  // this chapel's own proportion (LW by LH: taller and narrower than the town's), and the round lights under them.
  const AW = 4096, AH = 2048, LW = 260, LH = 1334, RS = 512, [GW0, GH0] = GREATPX, GK = 0.8, GW = Math.ceil(GW0 * GK), GHT = Math.ceil(GH0 * GK), [TLW, TLH] = [LW, LH];
  const CELL = {}; let k = 0, kr = 0;
  for (const p of panes) {
    if (p.id === 'life') continue;
    if (p.kind === 'great') CELL[p.id] = [0, 0, GW, GHT, GK, 0];
    else if (p.kind === 'round') { CELL[p.id] = [GW + 4 + kr * (RS + 8), LH + 8, RS, RS, 1, 0]; kr++; }
    else { CELL[p.id] = [GW + 4 + k * (LW + 8), 0, LW, LH, 1, 0]; k++; }
  }
  const drawer = id => (NEW[id] ? (NEW[id][0] === 'round' ? g => NEW[id][1](g, RS) : g => NEW[id][1](g, LW, LH)) : id === 'ingression' ? g => DRAW.ingression(g, GW0, GH0) : g => DRAW[id](g, LW, LH));
  LIFE.rows = Math.round(LIFE.cols * (LH - LW * 0.3) / (LW * 0.82));      // (square quarries in the taller light)
  const SOFT = { willReadFrequently: true };
  const sheet = document.createElement('canvas'); sheet.width = AW; sheet.height = AH;
  const sg = sheet.getContext('2d', SOFT); sg.fillStyle = '#2a2622'; sg.fillRect(0, 0, AW, AH);
  const lifeCanvas = document.createElement('canvas'); lifeCanvas.width = TLW; lifeCanvas.height = TLH;
  const lg = lifeCanvas.getContext('2d', SOFT); lg.fillStyle = '#2a2622'; lg.fillRect(0, 0, TLW, TLH);
  const mkTex = c => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const sheetTex = mkTex(sheet), lifeTex = mkTex(lifeCanvas);
  const uK = { value: 1.0 };
  const mat = tex => new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uK }, side: THREE.DoubleSide,
    vertexShader: 'attribute vec2 aQ; varying vec2 vUv; varying vec2 vQ; void main() { vUv = uv; vQ = aQ; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float uK; varying vec2 vUv; varying vec2 vQ;
void main() {
  vec3 t = texture2D(map, vUv).rgb;
  // the lamps behind the glass: even, a little stronger at the middle and toward the head
  vec2 q = vQ - vec2(0.5, 0.55); float lamp = 1.0 - 0.32 * dot(q * vec2(1.6, 1.1), q * vec2(1.6, 1.1));
  gl_FragColor = vec4(t * uK * lamp * vec3(1.05, 1.0, 0.92), 1.0);
  ${tone}
}`,
  });
  // the outline of a light, round-headed, centred: [[s, t], ...] (t up) in feet
  const outline = p => (p.kind === 'round' ? Array.from({ length: 48 }, (_, i) => [Math.cos(i / 48 * Math.PI * 2) * p.w / 2, Math.sin(i / 48 * Math.PI * 2) * p.w / 2]) : greatPlan(p.w, p.ht).out.map(([x, y]) => [x - p.w / 2, p.ht / 2 - y]));
  const paneGeo = (p, [cx, cy, cw, ch, , rot], tw, th) => {
    const sh = new THREE.Shape(outline(p).map(([x, y]) => new THREE.Vector2(x, y)));
    const g = new THREE.ShapeGeometry(sh, 6).toNonIndexed(), pos = g.attributes.position, n = pos.count;
    const P = new Float32Array(n * 3), UV = new Float32Array(n * 2), AQ = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const s = pos.getX(i), t = pos.getY(i), a = s / p.w + 0.5, b = t / p.ht + 0.5;
      if (rot) { UV[i * 2] = (cx + (1 - b) * ch) / tw; UV[i * 2 + 1] = 1 - (cy + (1 - a) * cw) / th; } else { UV[i * 2] = (cx + a * cw) / tw; UV[i * 2 + 1] = 1 - (cy + (1 - b) * ch) / th; }
      AQ[i * 2] = a; AQ[i * 2 + 1] = b;
      const w = W(p.X + s * p.ux, p.Y + s * p.uy, p.h + t); P.set([w.x, w.y, w.z], i * 3);
    }
    const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.BufferAttribute(P, 3)); out.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); out.setAttribute('aQ', new THREE.BufferAttribute(AQ, 2));
    return out;
  };
  const merge = list => { const pos = [], uv = [], aq = []; for (const g of list) { pos.push(...g.attributes.position.array); uv.push(...g.attributes.uv.array); aq.push(...g.attributes.aQ.array); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(aq, 2)); return g; };
  const mid = W(room.cx, room.cy, room.floor + 6);
  const main = addTracked(ctx, new THREE.Mesh(merge(panes.filter(p => p.id !== 'life').map(p => paneGeo(p, CELL[p.id], AW, AH))), mat(sheetTex)), mid, 1); main.name = 'chapel light boxes';
  const lifeP = panes.find(p => p.id === 'life');
  const lifePane = lifeP ? addTracked(ctx, new THREE.Mesh(paneGeo(lifeP, [0, 0, TLW, TLH, 1, 0], TLW, TLH), mat(lifeTex)), mid, 1) : null;
  if (lifePane) lifePane.name = 'chapel light box life';

  // ---- the colour each throws on the floor in front of it: a quad per pane, lit from a strip of blurred copies
  const SLOT = [32, 64], NP = panes.length;
  const strip = document.createElement('canvas'); strip.width = SLOT[0] * NP; strip.height = SLOT[1];
  { const a = strip.getContext('2d'); a.fillStyle = '#000'; a.fillRect(0, 0, strip.width, strip.height); }
  const stripTex = mkTex(strip);
  const spill = (() => {
    const pos = [], uv = [], dd = [];
    panes.forEach((p, i) => {
      if (p.kind === 'round') return;
      const nx = p.uy, ny = -p.ux;                                   // into the room: the picture's right turned a quarter clockwise
      const reach = p.kind === 'great' ? 6 : 4.2, hw = p.w / 2 + 0.5, fl = room.floor + 0.016, back = p.back ?? 0.5;
      const q = (s, e) => W(p.X + s * p.ux + e * nx, p.Y + s * p.uy + e * ny, fl);
      const c = [[-hw, back], [hw, back], [hw, back + reach], [-hw, back + reach]].map(([s, e]) => q(s, e));
      const u = [[0, 0], [1, 0], [1, 1], [0, 1]];
      for (const j of [0, 1, 2, 0, 2, 3]) { pos.push(c[j].x, c[j].y, c[j].z); uv.push((i + u[j][0]) / NP, u[j][1]); dd.push(u[j][0], u[j][1]); }
    });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aD', new THREE.Float32BufferAttribute(dd, 2));
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
      uniforms: { map: { value: stripTex }, uK: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      vertexShader: 'attribute vec2 aD; varying vec2 vUv; varying vec2 vD; void main() { vUv = uv; vD = aD; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform sampler2D map; uniform float uK; varying vec2 vUv; varying vec2 vD;
void main() { vec3 c = texture2D(map, vec2(vUv.x, 0.3 + 0.3 * vD.y)).rgb;
  float f = pow(1.0 - vD.y, 2.2) * smoothstep(0.0, 0.25, vD.x) * smoothstep(0.0, 0.25, 1.0 - vD.x);
  gl_FragColor = vec4(c * c * f * uK, 1.0); }`,
    }));
    m.renderOrder = 1; m.name = 'chapel glass on the floor'; m.visible = false;
    return addTracked(ctx, m, mid, 1);
  })();

  // ---- drawing the glass a little at a time (Vesper Street's chapelLife, as it does it) --------------------------
  let job = null, life = null, lastStep = 0, seenAt = -1;
  const fonts = Promise.all([`20px ${FONT}`, `italic 20px ${FONT}`].map(f => document.fonts?.load?.(f) ?? Promise.resolve())).catch(() => {});
  function* run() {
    if (lifeP) { life = makeLife(lg, TLW, TLH); lifeTex.needsUpdate = true; yield; }
    const set = function* (to, [cx, cy, cw, ch, kk = 1, rot], draw, after) {
      const c = document.createElement('canvas'); c.width = cw; c.height = ch;
      const g = c.getContext('2d', SOFT); g.scale(kk, kk);
      const it = draw(g);
      while (!it.next().done) yield;
      after?.();
      if (rot) { to.save(); to.translate(cx, cy + cw); to.rotate(-Math.PI / 2); to.drawImage(c, 0, 0); to.restore(); } else to.drawImage(c, cx, cy);
      c.width = c.height = 1;
    };
    let done = 0;
    const order = panes.filter(p => p.id !== 'life').map(p => p.id);
    for (const id of order) {
      const [cx, cy, cw, ch] = CELL[id];
      yield* set(sg, CELL[id], drawer(id), id !== 'loop' ? null : (() => { sg.fillStyle = '#e8dcc0'; sg.beginPath(); sg.arc(cx + LOOP_EYE.u * cw, cy + (LW / 2 / LH) * ch, LOOP_EYE.r * cw, 0, Math.PI * 2); sg.fill(); }));      // (the loop's clear roundel: here, the lamp seen through plain glass)
      if (++done % 3 === 0) sheetTex.needsUpdate = true;
      yield;
    }
    sheetTex.needsUpdate = true; yield;
    const a = strip.getContext('2d'), cut = document.createElement('canvas');
    panes.forEach((p, i) => {
      let src = lifeCanvas;
      if (p.id !== 'life') { const [cx, cy, cw, ch, , rot] = CELL[p.id], q = cut.getContext('2d'); cut.width = cw; cut.height = ch; if (rot) { q.save(); q.translate(cw, 0); q.rotate(Math.PI / 2); q.drawImage(sheet, cx, cy, ch, cw, 0, 0, ch, cw); q.restore(); } else q.drawImage(sheet, cx, cy, cw, ch, 0, 0, cw, ch); src = cut; }
      a.drawImage(poolCopy(src, SLOT[0], SLOT[1]), i * SLOT[0], 0);
    });
    stripTex.needsUpdate = true; spill.visible = true; spill.material.uniforms.uK.value = 0.55;
  }
  Promise.resolve(fonts).then(() => { if (Q.has('chapelnow')) { const it = run(); while (!it.next().done); } else job = run(); });
  if (lifePane) lifePane.onBeforeRender = () => { seenAt = performance.now(); };
  ctx.animated.push(t => {
    if (job) { const t0 = performance.now(); while (performance.now() - t0 < 4) { if (job.next().done) { job = null; break; } } }
    if (life && performance.now() - seenAt < 400 && t - lastStep > 1.1) { lastStep = t; life.step(); lifeTex.needsUpdate = true; }
  });
  if (Q.has('lifesteps')) { const n = Number(Q.get('lifesteps')); const wait = () => { if (life) { for (let i = 0; i < n; i++) life.step(); lifeTex.needsUpdate = true; } else setTimeout(wait, 200); }; wait(); }
}

// The oculus's glass (skylight_glass.js), once: sharp, for the glass itself and its image in the bowl; and soft, as the
// chapel's other windows are copied small and blurred for the light they throw (pool_chapel_glass.js poolCopy): black
// outside the rim, white in the clear eye.
let GLASS = null;
function oculusGlass() {
  if (GLASS) return GLASS;
  const src = drawSkylightGlass(1024), sharp = new THREE.CanvasTexture(src); sharp.colorSpace = THREE.SRGBColorSpace; sharp.anisotropy = 8;
  const a = document.createElement('canvas'); a.width = a.height = 256; { const g = a.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#fff'; g.beginPath(); g.arc(128, 128, 128 * EYE, 0, 7); g.fill(); g.drawImage(src, 0, 0, 256, 256); }
  const b = document.createElement('canvas'); b.width = b.height = 44; b.getContext('2d').drawImage(a, 0, 0, 44, 44);
  const c = document.createElement('canvas'); c.width = c.height = 176; { const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(b, 0, 0, 176, 176); }
  const soft = new THREE.CanvasTexture(c); soft.colorSpace = THREE.SRGBColorSpace;
  return (GLASS = { sharp, soft });
}

// ---- the oculus: daylight down the shaft ---------------------------------------------------------------------------
// o: { X, Y, r, top (the ceiling), floor, table: { h, r } }. A soft pool of light on the floor under the shaft and on the
// table's top; a faint column of it in the air, brightest where you look through most of it; motes turning slowly
// in it. By day only (a little of the moon's at night).
export function oculus(ctx, W, o) {
  // The light comes down the shaft as a column that leans away from the sun (or the moon), as far as the shaft lets it
  // (uLean: where its foot is, in world feet, from straight under the oculus), brightest at noon, warm and faint toward
  // evening, a thin silver-blue one when the moon is up, nothing on a moonless night. Where it lands, a pool of light.
  const c0 = W(o.X, o.Y, o.floor), GL = oculusGlass(), U = { uK: { value: 0 }, uT: { value: 0 }, uCol: { value: new THREE.Color(1, 0.96, 0.88) }, uLean: { value: new THREE.Vector2() }, uW: { value: 1 }, uSoft: { value: GL.soft } };
  const H = o.top - o.floor, cone = new THREE.CylinderGeometry(o.r * 0.97, o.r * 1.08, H, 40, 1, true).translate(0, H / 2, 0);
  const lean = `uniform vec2 uLean; uniform float uW; vec3 leanP(vec3 p) { float u = 1.0 - p.y / ${H.toFixed(2)}; p.xz *= mix(1.0, uW, u); p.xz += uLean * u; return p; }`;
  // The column is two: the white light the clear eye lets down, and round it a sleeve of the ring's colours, each side of
  // it taking the colour of the glass above it (so the amber and the blues stand in the air, as light through any
  // of the chapel's windows does), a little uneven, as air is.
  const beamMat = tint => new THREE.ShaderMaterial({
    uniforms: { ...U, uTint: { value: tint } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    vertexShader: `${lean} varying vec3 vW; varying vec3 vN; varying float vY; varying vec2 vP; void main() { vP = normalize(position.xz); vec3 p = leanP(position); vec4 w = modelMatrix * vec4(p, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vY = position.y; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform float uK, uT, uTint; uniform vec3 uCol; uniform sampler2D uSoft; varying vec3 vW; varying vec3 vN; varying float vY; varying vec2 vP;
${NOISE}
void main() { vec3 V = normalize(cameraPosition - vW); float f = abs(dot(normalize(vec3(vN.x, 0.0, vN.z)), V));
  float body = pow(f, 1.6) * smoothstep(0.0, 1.5, vY) * (0.6 + 0.4 * smoothstep(0.0, ${H.toFixed(1)}, vY));
  body *= 0.8 + 0.35 * noise(vec2(atan(vN.z, vN.x) * 3.0, vY * 0.15 - uT * 0.05));      // a little uneven, as air is
  vec3 gc = texture2D(uSoft, 0.5 + vec2(vP.x, -vP.y) * 0.41).rgb; vec3 tint = mix(vec3(1.0), gc * gc * 2.6 + 0.06, uTint);
  gl_FragColor = vec4(uCol * tint * body * uK * mix(0.5, 0.75, uTint), 1.0); }`,
  });
  const beam = new THREE.Mesh(cone, beamMat(1)), core = new THREE.Mesh(new THREE.CylinderGeometry(o.r * EYE * 0.95, o.r * EYE * 1.06, H, 32, 1, true).translate(0, H / 2, 0), beamMat(0));
  core.position.set(c0.x, c0.y, c0.z); core.name = 'chapel oculus beam core'; core.renderOrder = 5;
  beam.position.set(c0.x, c0.y, c0.z); beam.name = 'chapel oculus beam'; beam.renderOrder = 5;
  const disc = (h, r, k) => { const p = W(o.X, o.Y, h); const g = new THREE.CircleGeometry(r, 48).rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: { ...U, uR: { value: r }, uKk: { value: k } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uK, uR, uKk; uniform vec3 uCol; varying vec2 vP; void main() { float d = length(vP) / uR; float f = 1.0 - smoothstep(0.55, 1.0, d); gl_FragColor = vec4(uCol * f * uK * uKk, 1.0); }',
  })); m.position.set(p.x, p.y, p.z); m.renderOrder = 1; return m; };
  const floorPool = disc(o.floor + 0.018, o.r * 1.2, 1.1), tablePool = o.table ? disc(o.table.h + 0.014, o.table.r, 0.7) : null, tK = tablePool?.material.uniforms.uKk;
  // The glass in the oculus (skylight_glass.js: autopoiesis, the same glass that lies in the grass at Anna's House):
  // seen from below at the shaft's mouth, a clear eye with the coloured ring round it; and on the floor, round the
  // white pool that the eye lets down, the ring's colours as a halo that goes where the pool goes.
  const glassMat = new THREE.MeshBasicMaterial({ map: GL.sharp, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
  const glassRing = new THREE.Mesh(new THREE.RingGeometry(o.r * EYE - 0.01, o.r * 1.02, 96, 1).rotateX(-Math.PI / 2), glassMat);
  { const p = W(o.X, o.Y, o.top + 0.22); glassRing.position.set(p.x, p.y, p.z); glassRing.rotation.y = Math.PI / 2; glassRing.name = 'chapel oculus glass';
    const uv = glassRing.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i)); }      // (turned over, so that from underneath its lettering reads the right way)
  // On the floor it is light, not a picture: the blurred copy, squared as the other windows' spill is, its colours
  // swimming a little, fading at its rim; the white of the eye is the pool's own.
  const haloMat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D uSoft; uniform vec3 uCol; uniform float uK, uT; varying vec2 vUv;
${NOISE}
void main() { vec2 p = (vUv - 0.5) * 1.5; p += (vec2(noise(vUv * 7.0 + uT * 0.11), noise(vUv * 7.0 + 3.1 - uT * 0.09)) - 0.5) * 0.05;
  float r = length(p) * 2.0; vec3 c = texture2D(uSoft, 0.5 + p).rgb;
  float f = smoothstep(0.44, 0.66, r) * (1.0 - smoothstep(0.9, 1.3, r));
  gl_FragColor = vec4(c * c * 1.7 * uCol * uK * f * (0.82 + 0.36 * noise(vUv * 11.0 - uT * 0.07)), 1.0); }`,
  });
  const halo = new THREE.Mesh(new THREE.CircleGeometry(o.r * 1.7, 72).rotateX(-Math.PI / 2), haloMat); halo.position.set(c0.x, c0.y + 0.024, c0.z); halo.renderOrder = 2; halo.name = 'chapel oculus halo';
  ctx.interact?.push({ x: c0.x, y: c0.y + 10.5, z: c0.z, reach: 20, size: 3.4, label: () => 'look up at the glass', act: () => import('../card.js').then(m => m.showCard(CAPTION)).catch(() => ctx.flash?.(`${CAPTION.title}. ${CAPTION.kicker}.`)) });
  const N = 320, pos = new Float32Array(N * 3), sd = new Float32Array(N);
  let k = 3; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * o.r * 0.95; pos.set([Math.cos(a) * r, 1 + rnd() * (H - 2), Math.sin(a) * r], i * 3); sd[i] = rnd(); }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); mg.setAttribute('aS', new THREE.BufferAttribute(sd, 1));
  const motes = new THREE.Points(mg, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `${lean} attribute float aS; uniform float uT; varying float vA;
void main() { vec3 p = position; float t = uT * (0.04 + 0.05 * aS) + aS * 40.0;
  p.x += 0.35 * sin(t * 1.3 + aS * 7.0); p.z += 0.35 * cos(t * 1.1 + aS * 5.0); p.y += mod(t * 0.9 + aS * 13.0, 2.0) - 1.0; p = leanP(p);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vA = 0.5 + 0.5 * sin(uT * (0.7 + aS) + aS * 20.0);
  gl_PointSize = clamp(20.0 / -mv.z, 1.0, 4.0); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'uniform float uK; uniform vec3 uCol; varying float vA; void main() { vec2 d = gl_PointCoord - 0.5; if (dot(d, d) > 0.25) discard; gl_FragColor = vec4(uCol * vA * uK * 0.9, 1.0); }',
  }));
  motes.position.set(c0.x, c0.y, c0.z); motes.name = 'chapel motes';
  const at = W(o.X, o.Y, o.floor + 6);
  for (const m of [beam, core, floorPool, tablePool, motes, glassRing, halo]) if (m) addTracked(ctx, m, at, 1);
  const warm = new THREE.Color(1.0, 0.6, 0.32), gold = new THREE.Color(1.0, 0.9, 0.7), moon = new THREE.Color(0.62, 0.74, 1.0), dir = new THREE.Vector3();
  ctx.animated.push(t => {
    U.uT.value = t; const day = ctx.day ?? {}, L = day.light ?? 1, sd2 = day.sunDir ?? new THREE.Vector3(0, 1, 0);
    let kk = smooth(sd2.y, 0.06, 0.85) * smooth(L, 0.2, 0.9), col = warm.clone().lerp(gold, smooth(sd2.y, 0.12, 0.6)), wdt = 1;
    dir.copy(sd2);
    if (kk < 0.03 && day.moonUp && day.moonDir) { dir.copy(day.moonDir); kk = 0.3 * smooth(day.moonDir.y, 0.05, 0.5); col = moon.clone(); wdt = 0.55; }
    else if (kk < 0.03) kk = 0;
    // the foot of the column: away from the light, as far as the shaft lets it lean
    const y = Math.max(0.2, dir.y), lx = -dir.x / y * H * 0.18, lz = -dir.z / y * H * 0.18, ll = Math.hypot(lx, lz), cap = Math.min(1, 3.2 / Math.max(ll, 1e-6));
    U.uLean.value.set(lx * cap, lz * cap); U.uK.value = kk; U.uCol.value.copy(col); U.uW.value = wdt;
    floorPool.position.set(c0.x + U.uLean.value.x, c0.y + 0.018, c0.z + U.uLean.value.y); floorPool.scale.setScalar(wdt);
    halo.position.set(floorPool.position.x, c0.y + 0.024, floorPool.position.z); halo.scale.setScalar(wdt);
    glassMat.color.setScalar(0.2 + 0.85 * smooth(L, 0.1, 0.9));      // lit by the sky behind it: dim after dark, never black
    if (tK) tK.value = 0.7 * (1 - smooth(Math.hypot(U.uLean.value.x, U.uLean.value.y), 0.8, 2.6));
  });
}

// ---- the bowl of water and the singing bowl ------------------------------------------------------------------------
// water: { X, Y, h, r }; bell: { X, Y, h }. E on the water sends three rings out across it (the house's ripples.js);
// E on the singing bowl strikes it: a long hum, a few inharmonic partials, and the water shivers.
// The water's own shader: a dark mirror. What it shows is faked, cheaply: the shaft's round opening of sky (the hour's
// colour; stars and a faint moonlit disc at night) set a little way over the water, so that it lies in the bowl from the
// benches and the door as well as from over it (a true mirror would show it only from straight above), the pale stone
// of the shaft round it, the dark ceiling beyond; the candles' flames; all of it broken by the rings when the water is
// touched or the bowl struck, and by a faint shiver of the air. sky: { flames: [{ X, Y, h }] }
export function bowl(ctx, W, water, bell, sky = {}) {
  const p = W(water.X, water.Y, water.h);
  const L = (sky.flames ?? []).slice(0, 6).map(l => { const q = W(l.X, l.Y, l.h); return new THREE.Vector4(q.x, q.y, q.z, 1); }); while (L.length < 6) L.push(new THREE.Vector4(0, -999, 0, 0));
  const U = { uT: { value: 0 }, uC: { value: V(p) }, uR: { value: water.r }, uRing: { value: new THREE.Vector2(-100, 0) }, uSky: { value: new THREE.Color() }, uNight: { value: 0 }, uDrum: { value: new THREE.Color() }, uL: { value: L }, uCeil: { value: p.y + Math.min(6.5, (sky.ceil ?? 19) - water.h) }, uTop: { value: p.y + Math.min(12, (sky.top ?? 36.2) - water.h) }, uOR: { value: sky.r ?? 3 }, uMoon: { value: 0 }, uGlass: { value: oculusGlass().sharp } };
  // (uCeil, uTop: the shaft brought down to a third of its height in the mirror, so that its opening shows from anywhere near
  // the bowl, not only from straight over it; it still slides across the water as you move)
  { const o = W(sky.X ?? water.X, sky.Y ?? water.Y, 0); U.uC.value.x = o.x; U.uC.value.z = o.z; }      // (the oculus is over the bowl: one centre for both)
  const surf = new THREE.Mesh(new THREE.CircleGeometry(water.r, 48).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: U, fog: false,
    vertexShader: 'varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT, uR, uNight, uCeil, uTop, uOR, uMoon; uniform vec3 uC, uSky, uDrum; uniform vec2 uRing; uniform vec4 uL[6]; uniform sampler2D uGlass; varying vec3 vW;
${NOISE}
void main() {
  vec2 d = vW.xz - uC.xz; float r = length(d); vec2 dir = d / max(r, 1e-4);
  // a shiver of the air, and the rings going out (three, a third of a second apart, each 2.2 s across the bowl)
  vec2 gr = (vec2(noise(vW.xz * 7.0 + uT * 0.6), noise(vW.xz * 7.0 + 3.7 - uT * 0.5)) - 0.5) * 0.012;
  for (int i = 0; i < 3; i++) {
    float u = (uT - uRing.x - float(i) * 0.35) / 2.2;
    if (u > 0.0 && u < 1.0) { float rf = uR * (0.06 + 0.92 * u), x = r - rf; gr += dir * uRing.y * (1.0 - u) * (1.0 - u) * exp(-x * x * 90.0) * sin(x * 55.0) * 0.5; }
  }
  vec3 N = normalize(vec3(-gr.x, 1.0, -gr.y)), Vd = normalize(cameraPosition - vW), R = reflect(-Vd, N);
  float fr = 0.04 + 0.96 * pow(1.0 - max(dot(N, Vd), 0.0), 5.0);
  // what a mirror shows: the reflected ray carried up to the ceiling (uCeil) and on to the shaft's top in the meadow
  // (uTop): sky where it comes out of the opening, the shaft's lit stone throat where it meets the drum on the way, the
  // dark ceiling elsewhere. All of it in the world, so it slides across the water as you move, and the rim clips it.
  vec3 env = vec3(0.012, 0.011, 0.010);
  if (R.y > 0.0) {
    vec3 Hc = vW + R * ((uCeil - vW.y) / R.y), Ht = vW + R * ((uTop - vW.y) / R.y);
    float dc = length(Hc.xz - uC.xz), dt = length(Ht.xz - uC.xz);
    if (dc < uOR && dc > uOR * 0.60) {      // the ring of glass in the opening, lit by the sky behind it
      vec3 gc = texture2D(uGlass, vec2(0.5 + (Hc.x - uC.x) / (2.0 * uOR), 0.5 - (Hc.z - uC.z) / (2.0 * uOR))).rgb;
      env = gc * (0.2 + 1.5 * dot(uSky, vec3(0.3, 0.6, 0.1)));
    } else if (dc < uOR) {
      if (dt < uOR) {
        vec3 skyc = uSky;
        vec2 sp = (Ht.xz - uC.xz) * 4.0; float hs = hash(floor(sp));
        skyc += vec3(0.55, 0.6, 0.7) * uNight * step(0.965, hs) * (1.0 - smoothstep(0.0, 0.18, length(fract(sp) - 0.5)));      // a few tiny stars, only in the opening
        skyc += vec3(0.07, 0.08, 0.11) * uNight * uMoon;
        env = skyc * (1.0 - smoothstep(uOR * 0.93, uOR, dt));
      }
      env += uDrum * smoothstep(uOR * 0.9, uOR, dt) * (0.4 + 0.6 * (uTop - min(uTop, vW.y + R.y * (dc > 0.0 ? 0.0 : 0.0))) / uTop);
    }
  }
  vec3 col = vec3(0.010, 0.018, 0.020) + env * (0.22 + 0.55 * fr);      // a mirror of dark water: dimmer than the sky itself
  for (int i = 0; i < 6; i++) { vec3 Ld = uL[i].xyz - vW; float dl = length(Ld); Ld /= dl; float c = max(dot(R, Ld), 0.0); col += vec3(1.0, 0.68, 0.34) * (pow(c, 900.0) * 4.0 + pow(c, 120.0) * 0.5) * uL[i].w; }
  // the bronze lip shades the very edge
  col *= 0.55 + 0.45 * (1.0 - smoothstep(uR * 0.86, uR, r));
  gl_FragColor = vec4(col, 1.0);
  ${tone}
}`,
  }));
  surf.position.set(p.x, p.y, p.z); surf.name = 'chapel bowl water'; addTracked(ctx, surf, p, 0.6);
  ctx.animated.push(t => {
    U.uT.value = t; const day = ctx.day ?? {}, Lt = day.light ?? 1, nt = day.night ?? 0, low = 1 - smooth(day.sunDir?.y ?? 1, 0.02, 0.4);
    // the sky straight up: blue by day, warm and rosy at either end of it, dark blue at night
    U.uSky.value.setRGB(0.42, 0.62, 1.0).lerp(new THREE.Color(1.0, 0.56, 0.5), low * smooth(Lt, 0.05, 0.6) * 0.85).multiplyScalar(0.06 + 0.95 * Lt).lerp(new THREE.Color(0.02, 0.03, 0.08), nt * 0.9);
    U.uDrum.value.setRGB(0.55, 0.52, 0.46).multiplyScalar(0.03 + 0.55 * Lt); U.uNight.value = nt; U.uMoon.value = day.moonUp && (day.moonDir?.y ?? 0) > 0.05 ? 1 : 0;
  });
  const geo = new THREE.RingGeometry(0.93, 1, 48).rotateX(-Math.PI / 2);
  const rings = [0, 1, 2].map(() => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xf2ead8, transparent: true, opacity: 0, depthWrite: false, fog: false })); m.position.set(p.x, p.y + 0.008, p.z); m.visible = false; m.renderOrder = 2; return addTracked(ctx, m, p, 0.6); });
  let t0 = -1, going = false, now = 0, amp = 1;
  const run = t => {
    if (t0 < 0) t0 = t;
    let live = false;
    rings.forEach((m, i) => {
      const u = (t - t0 - i * 0.35) / 2.2;
      if (u < 0) { live = true; m.visible = false; return; }
      if (u > 1) { m.visible = false; return; }
      live = true; m.visible = true;
      const s = water.r * (0.06 + 0.92 * u); m.scale.set(s, 1, s); m.material.opacity = 0.5 * amp * (1 - u) * (1 - u);
    });
    if (!live) { going = false; const k = ctx.animated.indexOf(run); if (k >= 0) ctx.animated.splice(k, 1); }
  };
  const ripple = a => { amp = a; t0 = -1; U.uRing.value.set(now, a); if (!going) { going = true; ctx.animated.push(run); } };
  ctx.animated.push(t => { now = t; });
  ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 6, size: Math.min(1, water.r), label: () => 'touch the water', act: () => ripple(1) });
  if (bell) {
    const q = W(bell.X, bell.Y, bell.h); let struck = -10;
    // a Himalayan bowl's partials stand at about 1, 2.7 and 5.2 times its fundamental, and the bowl beats a little
    const ring = () => {
      if (now - struck < 1.5) return; struck = now;
      try { const s = ctx.sound; if (s?.note) { const m0 = 57; s.note(m0, 0, 9, 0.12); s.note(m0 + 0.12, 0, 8, 0.06); s.note(m0 + 17.2, 0, 6, 0.05); s.note(m0 + 28.5, 0, 3.5, 0.025); } } catch { /* no sound yet */ }
      ripple(0.55); ctx.flash?.('The bowl hums a long time after it is struck.');
    };
    ctx.interact.push({ x: q.x, y: q.y, z: q.z, reach: 6, size: 0.4, label: () => 'strike the singing bowl', act: ring });
  }
}
