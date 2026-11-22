// banya_fx.js: what moves, glows, hisses or splashes in the banya's four rooms, set going once the scene exists
// (banya.js calls these from f.later). Everything is given in the building's plan (X, Y, h) and turned into the world
// with W = (X, Y, h) => f.world(X, Y, h); each mesh is tracked to its room, so nothing is drawn (or costs anything)
// while its room cannot be seen. Per frame the CPU sets a few uniforms; the bucket and the clock's hands turn.
//
//   flames()      every candle of a room in one draw (the house's candle flame, flame.js, instanced; as the Pool's)
//   steam()       soft puffs drifting in a box of air; burst() makes a cloud rise from a point (water on the stones)
//   glow()        things that burn: the stove's stones and firebox, flickering; dim() darkens them for a moment
//   bucketTip()   the tipping bucket on its bracket: E pulls the rope, it swings over, the water falls, it rights itself
//   clockHands()  the hands of the wash room's clock, at the hour of the place
//   rings()       rings going out on the plunge's water when someone gets in
//   noise()       the hiss of water on hot stones and the slap of a bucket of water: filtered noise, quiet, honouring the
//                 page's mute and volume (the shared sound.js has only struck notes)
//   lieSpots()    places to lie (or sit) where the eye is put somewhere a seat cannot put it: looking up from a table
//   walkOn()      surfaces the walker can step up onto (the polok's tiers)
import * as THREE from 'three';
import { NOISE, makeFlames } from '../flame.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const tone = '#include <tonemapping_fragment>\n#include <colorspace_fragment>';
const addTracked = (ctx, mesh, at, size = 1) => { mesh.frustumCulled = false; ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size)); return mesh; };

// ---- candle flames (pool_chapel_fx.js's, as it does them) -----------------------------------------------------------
export function flames(ctx, W, list, at) {
  if (!list.length) return;
  const uT = { value: 0 }, n = list.length;
  const mk = (w, h, dy) => { const g = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(w, h).translate(0, dy, 0)); const a = new Float32Array(n * 4); list.forEach((c, i) => { const p = W(c.X, c.Y, c.h); a.set([p.x, p.y, p.z, c.s ?? 1], i * 4); }); g.setAttribute('aP', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n; return g; };
  const vert = `attribute vec4 aP; varying vec2 vUv; varying float vS;
void main() { vUv = uv; vec3 c = aP.xyz; float s = aP.w; vS = fract(c.x * 3.71 + c.z * 5.37 + c.y * 1.13) * 40.0;
  vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]) + vec3(1e-5, 0.0, 0.0));
  gl_Position = projectionMatrix * viewMatrix * vec4(c + right * position.x * s + vec3(0.0, position.y * s, 0.0), 1.0); }`;
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
  flame.renderOrder = 3; flame.name = 'banya flames';
  const uK = { value: 0.3 };
  const halo = new THREE.Mesh(mk(1, 1, 0), new THREE.ShaderMaterial({
    uniforms: { uK, uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: `attribute vec4 aP; uniform float uT; varying vec2 vUv; varying float vA;
void main() { vUv = uv * 2.0 - 1.0; vA = 1.0 + 0.06 * sin(uT * 8.0 + aP.x * 3.1 + aP.z * 1.7);
  vec4 mv = viewMatrix * vec4(aP.xyz + vec3(0.0, 0.1, 0.0), 1.0); mv.xy += position.xy * aP.w * 1.1; mv.z += 0.3; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uK; varying vec2 vUv; varying float vA;
void main() { float r = dot(vUv, vUv); if (r > 1.0) discard; float g = 1.0 - r; g = g * g * g; gl_FragColor = vec4(vec3(1.0, 0.62, 0.3) * g * vA * uK, 1.0); }`,
  }));
  halo.renderOrder = 2; halo.name = 'banya candle halos';
  addTracked(ctx, flame, at); addTracked(ctx, halo, at);
  ctx.animated.push(t => { uT.value = t; uK.value = 0.16 + 0.3 * (ctx.day?.night ?? 0); });
}

// ---- steam ------------------------------------------------------------------------------------------------------------
// o: { rect: [X0, X1, Y0, Y1], h, n, rise, size, alpha, warm }. Puffs drift and rise a little, spread and fade, each on
// its own slow cycle, all in the vertex shader. Returns { burst(X, Y, h) }: a cloud that boils up from that point,
// spreads under the ceiling and thins away (the air thickens for a while after: alpha is raised and eases back).
export function steam(ctx, W, o) {
  const [X0, X1, Y0, Y1] = o.rect, n = o.n ?? 40, h = o.h;
  let k = o.seed ?? 11; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  const geo = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1));
  const aB = new Float32Array(n * 4), aC = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { const p = W(X0 + rnd() * (X1 - X0), Y0 + rnd() * (Y1 - Y0), h + rnd() * (o.spread ?? 1.5)); aB.set([p.x, p.y, p.z, rnd()], i * 4); aC.set([0.03 + rnd() * 0.04, rnd() * 6.28, (o.size ?? 2.2) * (0.7 + rnd() * 0.8), (o.rise ?? 1) * (0.5 + rnd() * 0.8)], i * 4); }
  geo.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 4)); geo.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4)); geo.instanceCount = n;
  const U = { uT: { value: 0 }, uCol: { value: new THREE.Color(0.85, 0.8, 0.74) }, uA: { value: o.alpha ?? 0.06 } };
  const vs = `attribute vec4 aB, aC; uniform float uT; varying vec2 vUv; varying float vA; varying float vS;
void main() {
  float u = fract(uT * aC.x + aB.w);
  vec3 c = aB.xyz + vec3(0.7 * sin(uT * 0.11 + aC.y) + 1.1 * u * cos(aC.y), u * aC.w * 1.8, 0.7 * cos(uT * 0.09 + aC.y * 1.3) + 1.1 * u * sin(aC.y));
  float s = aC.z * (0.55 + 0.9 * u);
  vUv = uv * 2.0 - 1.0; vA = sin(3.14159 * u) * smoothstep(0.0, 0.15, u); vS = aC.y;
  vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }`;
  const fs = `uniform vec3 uCol; uniform float uA, uT; varying vec2 vUv; varying float vA; varying float vS;
${NOISE}
void main() { float r = dot(vUv, vUv); if (r > 1.0) discard;
  float n = noise(vUv * 2.2 + vec2(vS, uT * 0.05));
  float a = (1.0 - r) * (1.0 - r) * (0.55 + 0.9 * n) * vA * uA;
  gl_FragColor = vec4(uCol, a);
  ${tone}
}`;
  const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false, fog: false, vertexShader: vs, fragmentShader: fs }));
  m.renderOrder = 4; m.name = 'banya steam';
  const mid = W((X0 + X1) / 2, (Y0 + Y1) / 2, h + 1.5);
  addTracked(ctx, m, mid, 1);
  // the burst: puffs that all start at once from one point
  const NB = o.burstN ?? 0; let burst = () => {};
  if (NB) {
    const bg = new THREE.InstancedBufferGeometry().copy(new THREE.PlaneGeometry(1, 1)), bA = new Float32Array(NB * 4);
    for (let i = 0; i < NB; i++) bA.set([rnd() * 6.28, 0.6 + rnd() * 0.8, 0.5 + rnd() * 1.2, rnd() * 0.5], i * 4);
    bg.setAttribute('aR', new THREE.InstancedBufferAttribute(bA, 4)); bg.instanceCount = NB;
    const BU = { uT: { value: 0 }, uT0: { value: -100 }, uO: { value: new THREE.Vector3() }, uCol: U.uCol, uTop: { value: o.top ?? 4 } };
    const bm = new THREE.Mesh(bg, new THREE.ShaderMaterial({
      uniforms: BU, transparent: true, depthWrite: false, fog: false,
      vertexShader: `attribute vec4 aR; uniform float uT, uT0, uTop; uniform vec3 uO; varying vec2 vUv; varying float vA; varying float vS;
void main() {
  float u = (uT - uT0 - aR.w) / (5.5 * aR.y);
  vS = aR.x; vUv = uv * 2.0 - 1.0;
  if (u < 0.0 || u > 1.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vA = 0.0; return; }
  float up = uTop * (1.0 - exp(-u * 4.5 * aR.y)), spr = (0.4 + 5.0 * aR.z * u) * smoothstep(0.0, 0.5, u);
  vec3 c = uO + vec3(cos(aR.x) * spr, up, sin(aR.x) * spr);
  float s = 1.6 + 7.5 * u * aR.z + 0.8 * aR.y;
  vA = smoothstep(0.0, 0.06, u) * pow(1.0 - u, 1.6);
  vec4 mv = viewMatrix * vec4(c, 1.0); mv.xy += position.xy * s; gl_Position = projectionMatrix * mv; }`,
      fragmentShader: `uniform vec3 uCol; uniform float uT; varying vec2 vUv; varying float vA; varying float vS;
${NOISE}
void main() { float r = dot(vUv, vUv); if (r > 1.0) discard; float n = noise(vUv * 2.4 + vec2(vS, uT * 0.2));
  gl_FragColor = vec4(uCol * 0.95, (1.0 - r) * (1.0 - r) * (0.5 + 0.9 * n) * vA * 0.2);
  ${tone}
}`,
    }));
    bm.renderOrder = 5; bm.name = 'banya steam burst'; addTracked(ctx, bm, mid, 1);
    let thick = 0;
    burst = (X, Y, hh) => { const p = W(X, Y, hh); BU.uO.value.set(p.x, p.y, p.z); BU.uT0.value = BU.uT.value; thick = 1; };
    ctx.animated.push((t, dt) => { BU.uT.value = t; thick = Math.max(0, thick - (dt ?? 0.016) / 40); U.uA.value = (o.alpha ?? 0.06) * (1 + 2.2 * thick); });
  }
  ctx.animated.push(t => { U.uT.value = t; const L = ctx.day?.light ?? 1; const w = o.warm ?? 0; U.uCol.value.setRGB(0.55 + 0.35 * L + 0.1 * w, 0.5 + 0.33 * L + 0.04 * w, 0.45 + 0.3 * L - 0.04 * w); });
  return { burst };
}

// ---- things that burn ---------------------------------------------------------------------------------------------
// list: [{ X0, X1, Y0, Y1, h0, h1, k }] boxes of glowing coals (the gaps between the stones, the firebox's grate): a
// flickering emissive face; returns { dim() } (the stones go dark under the water, then glow back).
export function glow(ctx, W, list, at) {
  const pos = [], col = [];
  for (const b of list) {
    const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), P = g.attributes.position;
    for (let i = 0; i < P.count; i++) { const X = b.X0 + (P.getX(i) + 0.5) * (b.X1 - b.X0), Y = b.Y0 + (P.getZ(i) + 0.5) * (b.Y1 - b.Y0), h = b.h0 + (P.getY(i) + 0.5) * (b.h1 - b.h0), w = W(X, Y, h); pos.push(w.x, w.y, w.z); col.push(b.k ?? 1, (b.X0 * 7.1 + b.Y0 * 3.7) % 6.28, 0); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(col, 3));
  const U = { uT: { value: 0 }, uDim: { value: 0 } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, fog: false,
    vertexShader: 'attribute vec3 aK; varying vec3 vK; varying vec3 vW; void main() { vK = aK; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uT, uDim; varying vec3 vK; varying vec3 vW;
${NOISE}
void main() { float n = noise(vW.xz * 3.0 + vec2(uT * 0.7, -uT * 0.5)) * 0.6 + noise(vec2(vK.y, uT * 3.0)) * 0.4;
  float k = vK.x * (0.55 + 0.6 * n) * (1.0 - 0.8 * uDim);
  gl_FragColor = vec4(vec3(1.0, 0.16 + 0.14 * n, 0.01) * k * 0.2, 1.0);
  ${tone}
}`,
  }));
  m.name = 'banya coals'; addTracked(ctx, m, at, 1);
  let dimT = 0;
  ctx.animated.push((t, dt) => { U.uT.value = t; dimT = Math.max(0, dimT - (dt ?? 0.016) / 6); U.uDim.value = Math.min(1, dimT * 1.5); });
  return { dim: () => { dimT = 1; } };
}

// ---- sound: filtered noise ------------------------------------------------------------------------------------------
let AC = null, NB = null;
export function noise(ctx, kind) {
  try {
    const s = ctx.sound; if (s?.isMuted?.()) return;
    const vol = s?.volume?.() ?? 0.6;
    AC ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume();
    if (!NB) { NB = AC.createBuffer(1, AC.sampleRate * 3, AC.sampleRate); const d = NB.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
    const src = AC.createBufferSource(), flt = AC.createBiquadFilter(), g = AC.createGain(), t = AC.currentTime;
    src.buffer = NB; src.connect(flt); flt.connect(g); g.connect(AC.destination);
    if (kind === 'hiss') {          // water on stones: a sharp crack, then a long falling hiss
      flt.type = 'highpass'; flt.frequency.setValueAtTime(2400, t); flt.frequency.exponentialRampToValueAtTime(5200, t + 2.4);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.32 * vol, t + 0.03); g.gain.exponentialRampToValueAtTime(0.09 * vol, t + 0.5); g.gain.exponentialRampToValueAtTime(0.0005, t + 2.8);
      src.start(t); src.stop(t + 2.9);
    } else {                        // a bucket of water: a low slap and a wash running off
      flt.type = 'lowpass'; flt.frequency.setValueAtTime(900, t); flt.frequency.exponentialRampToValueAtTime(260, t + 1.4);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * vol, t + 0.04); g.gain.exponentialRampToValueAtTime(0.12 * vol, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.8);
      src.start(t); src.stop(t + 1.9);
    }
  } catch { /* no sound */ }
}

// ---- the tipping bucket ---------------------------------------------------------------------------------------------------
// o: { X, Y, h (the bucket's middle, on its axle), ux, uy (plan direction out of the wall), r, tall, handle: [X, Y, h] (where the rope's toggle
// hangs), floor }. The bucket is built here so that it can swing: lime staves, iron hoops, on an iron axle across its
// middle; pulled, it swings over toward the room, the water falls in a sheet and splashes on the floor, and it comes
// back up. E on the rope's toggle.
export function bucketTip(ctx, W, o, lines) {
  const mk = name => ctx.materials?.make?.(name) ?? new THREE.MeshStandardMaterial({ color: 0x9a7a52 });
  const r = o.r ?? 1.0, H = o.tall ?? 1.6, pivot = new THREE.Group(), axle = W(o.X, o.Y, o.h), out = W(o.X + o.ux, o.Y + o.uy, o.h);
  const dir = new THREE.Vector3(out.x - axle.x, 0, out.z - axle.z).normalize();
  pivot.position.set(axle.x, axle.y, axle.z);
  pivot.rotation.y = Math.atan2(dir.x, dir.z);        // the pivot's +z points out of the wall
  const prof = [[0, -H * 0.55], [r * 0.82, -H * 0.55], [r * 0.84, -H * 0.6], [r, H * 0.45], [r * 0.93, H * 0.45], [r * 0.78, -H * 0.48], [0, -H * 0.48]].map(([a, b]) => new THREE.Vector2(a, b));
  const staves = new THREE.LatheGeometry(prof, 22);
  { const P = staves.attributes.position; for (let i = 0; i < P.count; i++) { const a = Math.atan2(P.getZ(i), P.getX(i)), k = 1 + 0.012 * Math.cos(a * 22); P.setX(i, P.getX(i) * k); P.setZ(i, P.getZ(i) * k); } staves.computeVertexNormals(); }
  const body = new THREE.Mesh(staves, mk('oak_light#c9a878')); body.position.z = 0;
  const hoopM = mk('c#2b2724/0.55/0.7');
  for (const t of [-0.35, 0.3]) { const rr = r * (0.88 + 0.12 * (t + 0.5)) + 0.012; const hp = new THREE.Mesh(new THREE.CylinderGeometry(rr, rr, 0.07, 22, 1, true), hoopM); hp.position.set(0, t * H, 0); pivot.add(hp); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(r * 0.9, 20).rotateX(-Math.PI / 2), mk('c#7fa3a6/0.06')); water.position.set(0, H * 0.25, 0);
  const axleM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2 * r + 0.5, 8).rotateZ(Math.PI / 2), hoopM); axleM.position.z = 0;
  pivot.add(body, water, axleM);
  addTracked(ctx, pivot, axle, 2);
  // the falling water: a sheet of streaks from the lip to the floor; then a splash on the floor
  const fallH = o.h - (o.floor ?? 0.4);
  const sheet = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.9, fallH, 18, 1, true).translate(0, -fallH / 2, 0), new THREE.ShaderMaterial({
    uniforms: { uT: { value: 0 }, uA: { value: 0 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uA; varying vec2 vUv;
${NOISE}
void main() { float n = noise(vec2(vUv.x * 40.0, vUv.y * 3.0 + uT * 14.0)); float a = smoothstep(0.35, 0.85, n) * uA * (0.4 + 0.6 * vUv.y);
  gl_FragColor = vec4(vec3(0.86, 0.93, 0.96), a * 0.75); }`,
  }));
  const lip = W(o.X + o.ux * (r + 0.35), o.Y + o.uy * (r + 0.35), o.h - 0.15);
  sheet.position.set(lip.x, lip.y, lip.z); sheet.visible = false; sheet.renderOrder = 4; sheet.name = 'bucket water';
  addTracked(ctx, sheet, axle, 2);
  const fl = W(o.X + o.ux * (r + 0.35), o.Y + o.uy * (r + 0.35), (o.floor ?? 0.4) + 0.14);
  const splash = new THREE.Mesh(new THREE.RingGeometry(0.2, 1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe8f0f0, transparent: true, opacity: 0, depthWrite: false, fog: false }));
  splash.position.set(fl.x, fl.y, fl.z); splash.visible = false; splash.renderOrder = 4; addTracked(ctx, splash, axle, 2);
  let t0 = -100, now = 0, n = 0;
  const ang = u => { if (u < 0) return 0; if (u < 0.55) { const k = u / 0.55; return 1.95 * k * k * (3 - 2 * k); } if (u < 1.7) return 1.95; if (u < 3.4) { const k = (u - 1.7) / 1.7; return 1.95 * (1 - k * k * (3 - 2 * k)) + 0.12 * Math.sin(k * 9) * (1 - k); } return 0; };
  ctx.animated.push(t => {
    now = t; const u = t - t0;
    pivot.rotation.x = ang(u);                         // (about the pivot's x: the bucket's top swings out toward the room)
    water.visible = u > 2.6 || u < 0.25;
    const pour = u > 0.32 && u < 1.6; sheet.visible = pour; sheet.material.uniforms.uT.value = t; sheet.material.uniforms.uA.value = pour ? Math.min(1, (u - 0.32) * 6) * Math.min(1, (1.6 - u) * 3) : 0;
    const sp = (u - 0.45) / 1.4; splash.visible = sp > 0 && sp < 1; if (splash.visible) { const s = 0.6 + 2.6 * sp; splash.scale.set(s, 1, s); splash.material.opacity = 0.55 * (1 - sp); }
  });
  const pull = () => {
    if (now - t0 < 3.5) return;
    t0 = now; setTimeout(() => noise(ctx, 'splash'), 420);
    ctx.flash?.(lines[n++ % lines.length]);
  };
  const hp = W(...o.handle);
  ctx.interact.push({ x: hp.x, y: hp.y, z: hp.z, reach: 6, size: 0.6, label: () => 'pull the rope', act: pull });
}

// ---- the clock --------------------------------------------------------------------------------------------------------
// o: { X, Y, h, ux, uy (plan direction out of the wall), r }: two hands over the face, turning with the place's hour
export function clockHands(ctx, W, o) {
  const c = W(o.X, o.Y, o.h), c1 = W(o.X + o.ux, o.Y + o.uy, o.h), g = new THREE.Group();
  g.position.set(c.x, c.y, c.z); g.lookAt(c1.x, c1.y, c1.z);     // the group's +z points out of the wall
  const m = new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.4, metalness: 0.5 });
  const hand = (len, w, z) => { const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(w, len, 0.02).translate(0, len / 2 - 0.08, 0), m); p.add(b); p.position.z = z; g.add(p); return p; };
  const hr = hand(o.r * 0.55, 0.07, 0.05), mn = hand(o.r * 0.82, 0.045, 0.075);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 10).rotateX(Math.PI / 2), m); pin.position.z = 0.1; g.add(pin);
  addTracked(ctx, g, c, 1);
  ctx.animated.push(() => {
    const H = ctx.hourNow?.() ?? (new Date().getHours() + new Date().getMinutes() / 60);
    hr.rotation.z = -((H % 12) / 12) * Math.PI * 2; mn.rotation.z = -((H % 1)) * Math.PI * 2;
  });
}

// ---- rings on water -----------------------------------------------------------------------------------------------------
export function rings(ctx, W, at, r) {
  const p = W(at[0], at[1], at[2]);
  const geo = new THREE.RingGeometry(0.93, 1, 48).rotateX(-Math.PI / 2);
  const R = [0, 1, 2].map(() => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xf2f2ea, transparent: true, opacity: 0, depthWrite: false, fog: false })); m.position.set(p.x, p.y + 0.01, p.z); m.visible = false; m.renderOrder = 2; return addTracked(ctx, m, p, 1); });
  let t0 = -100, now = 0;
  ctx.animated.push(t => { now = t; R.forEach((m, i) => { const u = (t - t0 - i * 0.4) / 2.6; m.visible = u > 0 && u < 1; if (m.visible) { const s = r * (0.1 + 0.9 * u); m.scale.set(s, 1, s); m.material.opacity = 0.45 * (1 - u) * (1 - u); } }); });
  return () => { t0 = now; };
}

// ---- lying and sitting where a seat cannot put you --------------------------------------------------------------------
// spots: [{ at: [X, Y, h] (where E finds it), eye: [X, Y, h], look: [X, Y, h] (what the eye looks at), label, then }]
export function lieSpots(ctx, W, spots) {
  for (const s of spots) {
    const a = W(...s.at), e = W(...s.eye), l = W(...s.look), dx = l.x - e.x, dy = l.y - e.y, dz = l.z - e.z;
    const yaw = Math.atan2(-dx, -dz), pitch = Math.atan2(dy, Math.hypot(dx, dz));
    ctx.interact.push({ x: a.x, y: a.y, z: a.z, reach: s.reach ?? 6, size: s.size ?? 1.4, label: () => s.label, act: () => {
      let w = null; try { w = ctx.walker; } catch { w = null; } if (!w) return;
      w.sit({ x: e.x, y: e.y, z: e.z, yaw, label: s.label }); w.pitch = pitch;
      s.then?.(ctx);
    } });
  }
}
// rects: [[X0, X1, Y0, Y1, h], ...]: floors the walker can stand on (each a step of at most 1.3 ft from the next)
export function walkOn(ctx, W, rects) {
  // (the walker is made after the buildings' later() run: wait for it)
  let w = null; try { w = ctx.walker; } catch { w = null; }
  if (!w) { setTimeout(() => walkOn(ctx, W, rects), 250); return; }
  const S = w.surfaces; if (!S) return;
  for (const [X0, X1, Y0, Y1, h] of rects) { const a = W(X0, Y0, h), b = W(X1, Y1, h); S.push({ x0: Math.min(a.x, b.x), x1: Math.max(a.x, b.x), z0: Math.min(a.z, b.z), z1: Math.max(a.z, b.z), h: a.y }); }
}

// ---- light washing up a wall from a hidden cove ----------------------------------------------------------------------
// list: [{ a: [X, Y], b: [X, Y], h0, h1, k }] quads on a wall (a hair in front of it), amber and additive, strongest at
// the cove's lip and fading upward (and toward both ends), brighter after dark
export function wash(ctx, W, list, at) {
  if (!list.length) return;
  const pos = [], uv = [];
  for (const q of list) {
    const c = [[q.a, q.h0, 0, 0], [q.b, q.h0, 1, 0], [q.b, q.h1, 1, 1], [q.a, q.h1, 0, 1]].map(([p, h, u, v]) => ({ w: W(p[0], p[1], h), u, v: v * (q.k ?? 1) }));
    for (const i of [0, 1, 2, 0, 2, 3]) { pos.push(c[i].w.x, c[i].w.y, c[i].w.z); uv.push(c[i].u, i === 0 || i === 1 ? 0 : 1, q.k ?? 1); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aU', new THREE.Float32BufferAttribute(uv, 3));
  const U = { uK: { value: 0.5 } };
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'attribute vec3 aU; varying vec3 vU; void main() { vU = aU; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uK; varying vec3 vU;
void main() { float v = vU.y, e = smoothstep(0.0, 0.08, vU.x) * smoothstep(0.0, 0.08, 1.0 - vU.x);
  float f = pow(1.0 - v, 2.2) * e * vU.z; gl_FragColor = vec4(vec3(1.0, 0.58, 0.22) * f * uK, 1.0); }`,
  }));
  m.renderOrder = 1; m.name = 'banya coves'; addTracked(ctx, m, at, 1);
  ctx.animated.push(() => { U.uK.value = 0.32 + 0.4 * (ctx.day?.night ?? 0); });
}

// ---- a fire in a stove ----------------------------------------------------------------------------------------------
// o: { c: [X, Y, h] (the middle of the firebox's floor), n: [dX, dY] (plan direction out of its mouth), w (its width
// across), d (its depth), floor (h of the room's floor, for the glow on it) }. Logs, a bed of embers breathing, live
// flames (flame.js's, the Hall's), the logs' ends glowing; a warm flicker on the floor before the mouth.
export function stoveFire(ctx, W, o) {
  const o0 = W(...o.c), o1 = W(o.c[0] + o.n[0], o.c[1] + o.n[1], o.c[2]);
  const g = new THREE.Group(); g.position.set(o0.x, o0.y, o0.z); g.rotation.y = Math.atan2(o1.x - o0.x, o1.z - o0.z);      // local +z out of the mouth, x across it
  const uT = { value: 0 }, w = o.w ?? 1.1, d = o.d ?? 0.4;
  g.add(makeFlames(THREE, mergeGeometries, uT, [[0, 0, 0, w * 0.85, (o.tall ?? w) * 1.05, 0], [0, w * 0.18, d * 0.25, w * 0.6, (o.tall ?? w) * 0.85, 3.7], [0, -w * 0.2, -d * 0.2, w * 0.55, (o.tall ?? w) * 0.75, 8.1]], 0.12));
  const logMat = new THREE.MeshStandardMaterial({ color: 0x241710, roughness: 1, emissive: 0x9a2c08, emissiveIntensity: 0.15 });
  for (const [dx, dz, up, len, rot, rad] of [[0.02, d * 0.2, 0.08, w * 0.85, 0.08, 0.07], [-0.03, -d * 0.2, 0.08, w * 0.8, -0.1, 0.065], [0.0, 0.0, 0.19, w * 0.7, 0.4, 0.06]]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.9, len, 8).rotateZ(Math.PI / 2), logMat); l.rotation.y = rot; l.position.set(dx, up, dz); g.add(l); }
  const emb = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.95, d * 0.95).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; varying vec2 vUv;
${NOISE}
void main() { vec2 dd = (vUv - 0.5) * 2.0; float edge = 1.0 - smoothstep(0.5, 1.0, max(abs(dd.x), abs(dd.y)));
  float coals = smoothstep(0.4, 0.75, noise(vUv * vec2(14.0, 5.0))), breath = 0.55 + 0.45 * fbm(vUv * 4.0 + vec2(uT * 0.35, -uT * 0.2));
  gl_FragColor = vec4(mix(vec3(0.9, 0.14, 0.01), vec3(1.0, 0.5, 0.1), coals * breath) * (0.3 + coals) * breath * edge, 1.0); }`,
  }));
  emb.position.y = 0.02; g.add(emb);
  // the glow of the fire on the floor before the mouth: a warm pool that flickers
  const fl = new THREE.Mesh(new THREE.CircleGeometry(1.6, 28).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    uniforms: { uT, uK: { value: 0.3 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: 'varying vec2 vP; void main() { vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT, uK; varying vec2 vP;
${NOISE}
void main() { float r = length(vP) / 1.6, f = pow(max(0.0, 1.0 - r), 2.0) * (0.75 + 0.25 * noise(vec2(uT * 3.0, 1.7)) + 0.12 * sin(uT * 11.0));
  gl_FragColor = vec4(vec3(1.0, 0.45, 0.12) * f * uK, 1.0); }`,
  }));
  const fp = W(o.c[0] + o.n[0] * 1.5, o.c[1] + o.n[1] * 1.5, (o.floor ?? 0.4) + 0.02); fl.position.set(fp.x, fp.y, fp.z); fl.renderOrder = 1;
  g.traverse(n => { n.userData.cat = 'fire'; }); fl.userData.cat = 'fire';
  addTracked(ctx, g, o0, 1); addTracked(ctx, fl, fp, 1);
  ctx.animated.push(t => { uT.value = t; logMat.emissiveIntensity = 0.15 + 0.05 * Math.sin(t * 6.3) + 0.03 * Math.sin(t * 14.1); fl.material.uniforms.uK.value = 0.18 + 0.32 * (ctx.day?.night ?? 0); });
}
