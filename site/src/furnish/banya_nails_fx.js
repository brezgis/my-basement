// banya_nails_fx.js: the nail corner's polish shelf (glitter) and its bell-push, copied from the shelved salon's
// salon_fx.js (by the agent `salon`) and cut down to those two; the hand-over object is NAILS (was SALON).
// Everything is given in the building's plan (X, Y, h) and turned into the world with W = (X, Y, h) => f.world(X, Y, h);
// each mesh is tracked to its room (ctx.track), so it costs nothing while the room cannot be seen.
//
//   bottles()   the polish wall's bottles, lit from behind like a bar's back wall: every bottle glows a little in its
//               own colour; the glitter shelf's bottles also sparkle (flecks that catch the eye as you move, and
//               twinkle by themselves). One mesh, one draw.
//   neon()      the one loud thing: "hello, honey" in the staff's hand, in pink neon, on the north wall
//   letterBoard() TODAY'S GOSSIP in white letters on black felt; a new set each hour, and E changes the letters
//   bells()     the brass bell-push on each throne's paw: a ding, the order called out, and the coffee already on the
//               side table a moment later, to be taken with E
//
// FOR THE STAFF AGENT: `SALON` below is the hand-over. Set `NAILS.onBell = ({ i, drink, ctx, throne }) => true` to take
// the bell over (return true and the default runner does nothing; call `NAILS.deliver(i, drink)` when your runner sets
// the cup down, and it appears on that throne's side table, takeable). `NAILS.thrones[i]` has `bell` and `table`
// ([X, Y, h], plan) and `seat`.
import * as THREE from 'three';
import { buildDrink, useThreeDrinks } from '../faculty/drinks.js';
import { useThree as useThreeParts } from '../faculty/models.js';
import * as TX from './banya_nails_text.js';

export const NAILS = { thrones: [], onBell: null, deliver: () => {}, cups: [] };

const addTracked = (ctx, mesh, at, size = 1) => { mesh.frustumCulled = false; ctx.scene.add(mesh); ctx.track?.(mesh, ctx.zoneAt(at.x, at.y, at.z, size)); return mesh; };
const fmt = (s, a) => s.replace('%s', a);

// ---- the bottles -------------------------------------------------------------------------------------------------
// list: [{ X, Y, h, col (0xrrggbb), glitter, cap (0xrrggbb), w, d }]: the foot of the bottle; boxes are square to the plan
export function bottles(ctx, W, list, at) {
  const pos = [], col = [], gl = [], nrm = [];
  const box = (c, sx, sy, sz, rgb, g, s) => {
    const b = new THREE.BoxGeometry(sx, sy, sz).toNonIndexed(); b.translate(c.x, c.y, c.z);
    const P = b.attributes.position, N = b.attributes.normal;
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); col.push(rgb.r, rgb.g, rgb.b); gl.push(g, s); }
  };
  const cyl = (c, r, hh, rgb) => {
    const b = new THREE.CylinderGeometry(r, r, hh, 4, 1).toNonIndexed(); b.translate(c.x, c.y, c.z);
    const P = b.attributes.position, N = b.attributes.normal;
    for (let i = 0; i < P.count; i++) { pos.push(P.getX(i), P.getY(i), P.getZ(i)); nrm.push(N.getX(i), N.getY(i), N.getZ(i)); col.push(rgb.r, rgb.g, rgb.b); gl.push(0, 0); }
  };
  for (const b of list) {
    const p = W(b.X, b.Y, b.h + 0.085), c = new THREE.Color(b.col).convertSRGBToLinear(), w = b.w ?? 0.12, d = b.d ?? 0.09;
    box(p, w, 0.17, d, c, b.glitter ? 0.35 : 0.5, b.glitter ? 1 : 0);
    const q = W(b.X, b.Y, b.h + 0.255); cyl(q, 0.027, 0.17, new THREE.Color(b.cap ?? 0x141210).convertSRGBToLinear());
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('gl', new THREE.Float32BufferAttribute(gl, 2));
  const uT = { value: 0 };
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.18, metalness: 0.05, envMapIntensity: 1.2 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 gl;\nvarying vec2 vGl;\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGl = gl;\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uT; varying vec2 vGl; varying vec3 vWP;
float hsh(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 cell = floor(vWP * 90.0); float h = hsh(cell);
  float tw = pow(0.5 + 0.5 * sin(uT * (1.5 + h * 4.0) + h * 61.0), 28.0);
  vec3 rd = normalize(vec3(hsh(cell + 1.3) - 0.5, hsh(cell + 2.7) - 0.5, hsh(cell + 4.1) - 0.5));
  float gg = pow(max(dot(rd, normalize(cameraPosition - vWP)), 0.0), 50.0);
  float sp = step(0.55, h) * (tw * 1.2 + gg * 4.0) * vGl.y;
  totalEmissiveRadiance += vColor.rgb * vGl.x + mix(vColor.rgb, vec3(1.0), 0.55) * sp * 2.2; }`);
  };
  m.customProgramCacheKey = () => 'salon-bottles';
  const mesh = new THREE.Mesh(g, m); mesh.name = 'salon polish wall';
  addTracked(ctx, mesh, at, 4);
  ctx.animated.push(t => { uT.value = t; });
}

// ---- the bells and the coffee ----------------------------------------------------------------------------------
export function bells(ctx, W, thrones, pickN) {
  useThreeDrinks(THREE); useThreeParts(THREE);
  NAILS.thrones = thrones;
  const cups = thrones.map(() => null);
  const ding = () => { try { const s = ctx.sound; if (s?.note) { s.note(93, 0, 1.3, 0.09); s.note(100, 0, 0.7, 0.035); s.note(93, 0.32, 1.0, 0.05); } } catch { /* no sound yet */ } };
  function clear(i) { const c = cups[i]; if (!c) return; ctx.scene.remove(c.g); const k = ctx.interact.indexOf(c.ent); if (k >= 0) ctx.interact.splice(k, 1); cups[i] = null; }
  function deliver(i, drink) {
    const T = thrones[i], p = W(...T.table);
    if (cups[i]) { ctx.flash(TX.ALREADY[pickN(TX.ALREADY.length)]); return; }
    const g = buildDrink({ id: drink.name, vessel: drink.vessel, liquid: drink.liquid });
    g.position.set(p.x, p.y + 0.005, p.z); g.rotation.y = 0.6 + i;
    addTracked(ctx, g, p, 0.5);
    const ent = { x: p.x, y: p.y + 0.15, z: p.z, reach: 6, size: 0.45, label: () => fmt(TX.TAKE, drink.name),
      act: () => { if (!ctx.hold) return; const from = g.position.clone(); clear(i); ctx.hold({ name: drink.name, drink: { vessel: drink.vessel, liquid: drink.liquid }, note: fmt(TX.DONE, drink.name) }, null, { from }); } };
    ctx.interact.push(ent); cups[i] = { g, ent, drink };
    ctx.flash(fmt(TX.ARRIVED[pickN(TX.ARRIVED.length)], drink.name));
  }
  NAILS.deliver = deliver; NAILS.cups = cups;
  thrones.forEach((T, i) => {
    const b = W(...T.bell);
    let waiting = false;
    ctx.interact.push({ x: b.x, y: b.y + 0.04, z: b.z, reach: 4.5, size: 0.3, label: () => 'press the bell-push (coffee, honey)',
      act: () => {
        ding();
        if (cups[i]) { ctx.flash(TX.ALREADY[pickN(TX.ALREADY.length)]); return; }
        if (waiting) return;
        const drink = TX.DRINKS[pickN(TX.DRINKS.length)];
        if (NAILS.onBell?.({ i, drink, ctx, throne: T }) === true) return;
        ctx.flash(fmt(TX.RING[pickN(TX.RING.length)], drink.name));
        waiting = true; setTimeout(() => { waiting = false; deliver(i, drink); }, 2600);      // promised in seven minutes; here in under three seconds
      } });
  });
}

// ---- the polish bottles of the nail corner, as bottles ------------------------------------------------------------------
// list: [{ X, Y, h (the surface), shape: 'round' | 'square' | 'slim' | 'tiny', col (0xrrggbb), cap: 'black' | 'gold' |
// 'white', glitter, yaw, lying, open (no cap: the brush is out), brush (a cap lying with its brush) }]
// Each shape has one lathe profile for its glass, its polish, its meniscus and its cap; every bottle is a transformed
// copy, merged into four meshes (glass, polish, caps, gold caps): four draws for the lot. The polish shows through the
// glass with a paler line where it meets the air; the glitter ones twinkle (flecks that catch the eye as you move).
const SHAPES = {
  round: { seg: 12, glass: [[0, 0], [0.055, 0], [0.07, 0.02], [0.076, 0.07], [0.068, 0.12], [0.036, 0.15], [0.022, 0.156], [0.022, 0.18]], fill: 0.11, rIn: 0.066, cap: [[0, 0.172], [0.031, 0.172], [0.033, 0.3], [0.029, 0.312], [0, 0.312]] },
  square: { seg: 4, glass: [[0, 0], [0.08, 0], [0.086, 0.012], [0.086, 0.14], [0.07, 0.16], [0.026, 0.166], [0.026, 0.19]], fill: 0.125, rIn: 0.076, cap: [[0, 0.182], [0.042, 0.182], [0.042, 0.27], [0.036, 0.28], [0, 0.28]], capSeg: 4 },
  slim: { seg: 10, glass: [[0, 0], [0.04, 0], [0.046, 0.02], [0.046, 0.22], [0.032, 0.25], [0.018, 0.256], [0.018, 0.28]], fill: 0.2, rIn: 0.039, cap: [[0, 0.272], [0.021, 0.272], [0.019, 0.45], [0.012, 0.46], [0, 0.46]] },
  tiny: { seg: 10, glass: [[0, 0], [0.04, 0], [0.05, 0.03], [0.046, 0.068], [0.022, 0.085], [0.016, 0.1]], fill: 0.055, rIn: 0.042, cap: [[0, 0.096], [0.026, 0.1], [0.03, 0.13], [0.02, 0.155], [0, 0.162]] },
};
export function polishBottles(ctx, W, list, at) {
  const V = THREE.Vector2, M = new THREE.Matrix4(), out = { glass: [], polish: [], cap: [], gold: [] };
  const lathe = (prof, seg, phase = 0) => { const g = new THREE.LatheGeometry(prof.map(([r, y]) => new V(r, y)), seg, phase).toNonIndexed(); g.computeVertexNormals(); return g; };
  const geo = {};
  for (const [k, s] of Object.entries(SHAPES)) {
    const ph = s.seg === 4 ? Math.PI / 4 : 0;
    geo[k] = {
      glass: lathe(s.glass, s.seg, ph),
      polish: lathe([[0, 0.012], [s.rIn * 0.85, 0.012], [s.rIn, 0.04], [s.rIn, s.fill], [0, s.fill]], s.seg, ph),
      men: lathe([[s.rIn * 0.6, s.fill + 0.002], [s.rIn * 1.005, s.fill - 0.006], [s.rIn * 1.005, s.fill + 0.004], [s.rIn * 0.6, s.fill + 0.004]], s.seg, ph),
      cap: lathe(s.cap, s.capSeg ?? 10, s.capSeg === 4 ? Math.PI / 4 : 0),
      brush: lathe([[0, -0.11], [0.012, -0.105], [0.016, -0.07], [0.006, 0.0], [0, 0.0]], 6),
    };
  }
  const add = (bucket, g, m, col, gl = 0) => {
    const c = g.clone().applyMatrix4(m), n = c.attributes.position.count, C = new Float32Array(n * 3), G = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) { C.set([col.r, col.g, col.b], i * 3); G.set([gl ? 0.35 : 0.08, gl], i * 2); }
    c.setAttribute('color', new THREE.BufferAttribute(C, 3)); c.setAttribute('gl', new THREE.BufferAttribute(G, 2)); bucket.push(c);
  };
  const CAP = { black: new THREE.Color(0x15120f), white: new THREE.Color(0xf2efe8), gold: new THREE.Color(0xd4a54a) }, white = new THREE.Color(1, 1, 1);
  for (const b of list) {
    const s = SHAPES[b.shape], g = geo[b.shape], p = W(b.X, b.Y, b.h + 0.004), col = new THREE.Color(b.col).convertSRGBToLinear(), pale = col.clone().lerp(white, 0.5);
    M.makeTranslation(p.x, p.y, p.z).multiply(new THREE.Matrix4().makeRotationY(b.yaw ?? 0));
    if (b.lying) M.multiply(new THREE.Matrix4().makeTranslation(0, s.glass[3][0], 0)).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2));
    if (b.brush) {                                    // a cap lying on the table, its brush out, wet with the colour
      const L = new THREE.Matrix4().makeTranslation(0, 0.03, 0).multiply(new THREE.Matrix4().makeRotationZ(Math.PI / 2 - 0.08)).multiply(new THREE.Matrix4().makeTranslation(0, -s.cap[0][1], 0));
      const m = M.clone().multiply(L);
      add(b.cap === 'gold' ? out.gold : out.cap, g.cap, m, CAP[b.cap ?? 'black']);
      add(out.polish, g.brush, m.clone().multiply(new THREE.Matrix4().makeTranslation(0, s.cap[0][1], 0)), col, b.glitter ? 1 : 0);
      continue;
    }
    add(out.glass, g.glass, M, white);
    add(out.polish, g.polish, M, col, b.glitter ? 1 : 0);
    if (!b.lying) add(out.polish, g.men, M, pale, b.glitter ? 1 : 0);
    if (!b.open) add(b.cap === 'gold' ? out.gold : out.cap, g.cap, M, CAP[b.cap ?? 'black']);
  }
  const merge = list => { const pos = [], nrm = [], col = [], gl = []; for (const g of list) { pos.push(...g.attributes.position.array); nrm.push(...g.attributes.normal.array); col.push(...g.attributes.color.array); gl.push(...g.attributes.gl.array); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('gl', new THREE.Float32BufferAttribute(gl, 2)); return g; };
  const uT = { value: 0 };
  const polish = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.22, metalness: 0.0 });
  polish.onBeforeCompile = sh => {
    sh.uniforms.uT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 gl;\nvarying vec2 vGl;\nvarying vec3 vWP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGl = gl;\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
uniform float uT; varying vec2 vGl; varying vec3 vWP;
float hsh(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{ vec3 cell = floor(vWP * 160.0); float h = hsh(cell);
  float tw = pow(0.5 + 0.5 * sin(uT * (1.5 + h * 4.0) + h * 61.0), 24.0);
  vec3 rd = normalize(vec3(hsh(cell + 1.3) - 0.5, hsh(cell + 2.7) - 0.5, hsh(cell + 4.1) - 0.5));
  float gg = pow(max(dot(rd, normalize(cameraPosition - vWP)), 0.0), 40.0);
  float sp = step(0.5, h) * (tw * 1.4 + gg * 5.0) * vGl.y;
  totalEmissiveRadiance += vColor.rgb * vGl.x + mix(vColor.rgb, vec3(1.0), 0.6) * sp * 2.4; }`);
  };
  polish.customProgramCacheKey = () => 'banya-nail-polish';
  const mats = {
    glass: new THREE.MeshStandardMaterial({ vertexColors: true, color: 0xffffff, roughness: 0.04, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false, envMapIntensity: 2.2 }),
    polish, cap: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.0 }),
    gold: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 1.0 }),
  };
  for (const k of ['polish', 'cap', 'gold', 'glass']) { if (!out[k].length) continue; const m = new THREE.Mesh(merge(out[k]), mats[k]); m.name = 'nail polish ' + k; if (k === 'glass') m.renderOrder = 3; addTracked(ctx, m, at, 2); }
  ctx.animated.push(t => { uT.value = t; });
}
