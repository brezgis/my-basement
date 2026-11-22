// The courtyard's garden and the meadow (see the README at the project's root). main.js calls layGrounds once the
// building is built; setup(ctx) runs once the scene exists.
//
//   grounds/grounds_court.js    The Courtyard: a Japanese garden of dark wet stone and bright moss (notes/STYLE.md,
//                               research/refs 1, 5, 6, 7): boulders, black pebble beds, moss cushions, a rocky stream,
//                               the old cloud-pruned pine, a red maple, bamboo, the timber hot tub, two loungers
//   grounds/grounds_meadow.js   The Meadow: long grass with ox-eye daisies and yarrow, mown paths (Great Dixter), the
//                               rail round the cut (Villa Vals), the cliff rail and its bench, the cellar doors, the ring
//   grounds/grounds_flora.js    the plants the lab's atlas has not got, painted; the pine's and the maple's limbs
//
// The lab's planting tools (grounds/tools.js, ground.js, flora.js, cards.js, paint.js) do the drawing: ground
// surfaces one mesh a kind, painted things one mesh, plants as instanced cards. What is built here, and in what:
//   - the builder (zoned with the building): bark, water, dressed stone, glass, the lantern glows
//   - setup(ctx), into the outdoors group: the ground, the paint, the plants, the pebbles and pebble beds, the moss, the stones' uplights, the net
//     round the cut, the stove's fire and the tub's steam; the animals (creatures/swarms.js) once all that is there
//
// Lights: three lamps the engine lights in the courtyard (the granite lantern, the paper lantern by the loungers,
// the lantern by the tub) and one on the meadow (the lantern at the cellar doors); every other light here glows and
// casts nothing. The glows are all 'e#ffe2b4', which lighting.js turns down by day.
//
// Robots (no staff here; for whoever does the staff): a gardener robot would work the courtyard's north-west quarter
// with a rake and a trug (plan X 56, Y 47, facing south-east, among the sea kale: the shingle wants raking, the
// poppies deadheading), and in the meadow at the mown path's turn (plan X -8, Y 43.5); a pool attendant would stand
// at the brink by the loungers (plan X 71.5, Y 25.5, facing west toward the tub and the loungers), serving from the
// side table between the loungers (plan X 65.8, Y 25.9) and tending the tub's stove (plan X 50.1, Y 22.2).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeKit, PAINT } from './grounds/tools.js';
import { TREES, MEADOW, COURT } from './campus.js';
import { Wild, WILD, FLOWERING } from './grounds/grounds_flora.js';
import { wind } from './grounds/cards.js';
import { layCourt, KERB, FALL } from './grounds/grounds_court.js';
import { layMeadow } from './grounds/grounds_meadow.js';
import { layEdges, caveSetup } from './grounds/grounds_edges.js';

const PAVE = 0.34;
// The meadow on top of the rock (grounds/grounds_meadow.js): its planting, rails, bench, trees and the cellar doors' things.
// false leaves all of it out (Spanya may have no top of its own: the parent decides).
export const MEADOW_ON = false;
const FALLS_ON = false;      // the edge pool's ripples and the water falling from its rim (spanya.js no longer has the pool)
// the height of the ground at world (x, z): the courtyard's paving inside the cut, the meadow everywhere else
const level = (x, z) => (Math.hypot(z - COURT.X, x - COURT.Y) < COURT.r + 1.5 ? PAVE : MEADOW);

export function layGrounds(builder, items) {
  try { return lay(builder, items); } catch (e) { console.error('grounds: not laid', e); return { surfaces: [], setup() {} }; }
}

function lay(B, items) {
  const K = makeKit(B, items, TREES), G = K.G, F = K.F, Wd = new Wild(77); Wd.pineLow = PAVE + 3; Wd.pineHigh = PAVE + 21;
  G.lift = level;
  const E = {
    K, G, F, Wd, B, items, WILD, level,
    FLOWERS: new Set([...FLOWERING, 'lavender', 'catmint', 'wildflowers', 'cosmos', 'coneflower', 'rose', 'hydrangea', 'iris', 'spires']),
    flowers: { court: [], meadow: [] }, fireflies: [], pebbles: [], interact: [], glowAt: [], net: [], trees: [], lanterns: [], mounds: [], uplit: [], beds: [], pools: [], washes: [], sway: { iron: [], bulb: [], glass: [], candle: [], halo: [] },
    // a part that swings in the wind: amp ft at its lowest, ph its phase (one lantern, one string: one phase)
    swayPart(kind, geo, amp, ph) { const g = geo.index ? geo.toNonIndexed() : geo, n = g.attributes.position.count; g.setAttribute('aSway', new THREE.Float32BufferAttribute(new Float32Array(n).fill(amp), 1)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(new Float32Array(n).fill(ph), 1)); if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals(); E.sway[kind].push(g); }, clumps: [], stream: null, maple: null, basin: null, perches: [],
    // a lantern: an iron frame, glass, a candle's glow; standing with its foot at y, or hung from a hook at `hang`
    lantern(x, y, z, s = 0.7, power = 0.6, hang = null) {
      const IRON = PAINT.iron, w = s * 0.5, h = s * 0.95;
      K.box(IRON, x - w, x + w, y, y + 0.05 * s, z - w, z + w);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.box(IRON, x + dx * w - 0.03, x + dx * w + 0.03, y, y + h, z + dz * w - 0.03, z + dz * w + 0.03);
      B.mesh('glass', new THREE.BoxGeometry(w * 1.9, h * 0.92, w * 1.9).translate(x, y + h * 0.5, z));
      B.mesh('e#ffe2b4/1.8', new THREE.CylinderGeometry(w * 0.32, w * 0.36, h * 0.42, 8).translate(x, y + h * 0.3, z));
      K.put(IRON, new THREE.ConeGeometry(w * 1.45, s * 0.42, 4).rotateY(Math.PI / 4).translate(x, y + h + s * 0.2, z));
      K.put(IRON, new THREE.TorusGeometry(s * 0.12, 0.025, 5, 10).translate(x, y + h + s * 0.5, z));
      if (hang != null) K.tube(IRON, [x, y + h + s * 0.58, z], [x, hang, z], 0.02, 4);
      if (power > 0) K.lamp(x, y + h * 0.45, z, power);      // (most lanterns only glow: the engine lights three lamps in the courtyard)
      E.glowAt.push([x, y + h * 0.45, z]); E.lanterns.push([x, y + h * 0.45, z]);
    },
    // a candle in a glass jar
    jar(x, y, z) {
      K.lathe('glass', x, y, z, [[0.01, 0], [0.16, 0], [0.17, 0.05], [0.17, 0.36], [0.15, 0.38]], 12);
      K.cyl('c#efe6d2/0.8', x, y, y + 0.12, z, 0.12, 0.12, 10);
      B.mesh('e#ffe2b4/1.8', new THREE.SphereGeometry(0.05, 6, 5).scale(1, 1.7, 1).translate(x, y + 0.19, z));
    },
  };
  layCourt(E);
  layEdges(E);
  if (MEADOW_ON) layMeadow(E);
  for (const t of E.trees) TREES.push({ kind: t.kind, x: t.Y, z: t.X, y: t.y ?? MEADOW, height: t.height, seed: t.seed });      // (trees.js grows them: main.js builds TREES after the grounds are laid)
  for (const p of F.list) if (!p.y) p.y = level(p.x, p.z) + 0.03;

  const setup = ctx => {
    const { scene, renderer, materials, animated } = ctx;
    G.build(scene, renderer, materials.grass);
    K.P.build(scene, mergeGeometries);
    F.build(scene);
    Wd.build(scene);
    pebbles(scene, E.pebbles);
    pebbleBeds(scene, E.beds);
    moss(scene, E.mounds);
    uplights(ctx, E.uplit);
    leafFall(ctx, E);
    warmLight(ctx, E);
    swinging(ctx, E);
    try { caveSetup(ctx, E, Object.getPrototypeOf(ctx).scene ?? ctx.scene); } catch (e) { console.warn('grounds: cave', e); }
    if (FALLS_ON) { water(ctx, E); falls(ctx); }      // (the edge pool and its falling water are gone from the shell: kept, switched off)
    for (const n of E.net) net(scene, n);
    fire(ctx, E);
    for (const it of E.interact) { let k = 0; ctx.interact.push({ x: it.x, y: it.y, z: it.z, reach: it.reach, label: () => it.label, act: () => { ctx.flash(it.say[k++ % it.say.length]); } }); }
    if (new URLSearchParams(location.search).get('creatures') !== '0') import('./grounds/grounds_life.js').then(m => m.animals(ctx, E, MEADOW_ON)).catch(e => console.warn('grounds: no animals', e?.message ?? e));
    void animated;
  };
  return { setup, surfaces: K.surfaces };
}

// The shingle's coarser pebbles: one instanced mesh of squashed stones, each its own colour.
function pebbles(scene, list) {
  if (!list.length) return;
  const g = new THREE.IcosahedronGeometry(1, 0);
  { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < -0.2) p.setY(i, -0.2 + (y + 0.2) * 0.3); } g.computeVertexNormals(); }
  const mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.72, envMapIntensity: 0.6 }), list.length), m = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color();
  list.forEach((p, i) => { q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot); m.compose(new THREE.Vector3(p.x, p.y + p.sy * 0.4, p.z), q, new THREE.Vector3(p.s, p.sy, p.sz)); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.setHex(p.col)); });
  mesh.receiveShadow = true; mesh.castShadow = false; mesh.name = 'pebbles'; mesh.computeBoundingSphere(); scene.add(mesh);
}

// What hangs and swings in the wind: the festoons (cable, sockets, bulbs with a halo each) and the lanterns on their chains
// (iron, glass, candles). Each part's vertices carry how far it swings (aSway) and its phase (aPh); the shader moves them
// with the breeze the planting moves with (cards.js wind), gently and never still. Five draws for all of it.
function swinging(ctx, E) {
  const patch = (mat, key) => { mat.onBeforeCompile = sh => { sh.uniforms.uWind = wind; sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aSway; attribute float aPh; uniform float uWind;').replace('#include <begin_vertex>', `#include <begin_vertex>
  { float sw = 0.55 + 0.45 * sin(uWind * 0.13 + aPh * 0.7);
    transformed.x += aSway * sw * (0.75 * sin(uWind * 0.62 + aPh) + 0.25 * sin(uWind * 1.37 + aPh * 2.1));
    transformed.z += aSway * sw * 0.6 * cos(uWind * 0.48 + aPh * 1.3); }`); }; mat.customProgramCacheKey = () => 'sway-' + key; return mat; };
  const mats = {
    iron: patch(new THREE.MeshStandardMaterial({ color: 0x1d1b19, roughness: 0.55, metalness: 0.5 }), 'iron'),
    bulb: patch(new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffb45a, emissiveIntensity: 2, roughness: 0.2, transparent: true, opacity: 0.92 }), 'bulb'),
    glass: patch(new THREE.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }), 'glass'),
    candle: patch(new THREE.MeshStandardMaterial({ color: 0xfff2dc, emissive: 0xffb050, emissiveIntensity: 2.2, roughness: 0.6 }), 'candle'),
  };
  for (const k of ['iron', 'bulb', 'glass', 'candle']) if (E.sway[k].length) { const m = new THREE.Mesh(mergeGeometries(E.sway[k].map(g => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'aSway', 'aPh'].includes(a)) g.deleteAttribute(a); return g; })), mats[k]); m.name = 'hanging ' + k; m.frustumCulled = false; if (k === 'iron') m.castShadow = true; ctx.scene.add(m); }
  // a soft halo round each bulb and candle (points, additive)
  let halo = null;
  if (E.sway.halo.length) {
    const pos = [], sw = [], ph = [], sz = []; for (const [x, y, z, a, p, s] of E.sway.halo) { pos.push(x, y, z); sw.push(a); ph.push(p); sz.push(s); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(sw, 1)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), grd = q.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,220,160,1)'); grd.addColorStop(0.25, 'rgba(255,190,110,0.45)'); grd.addColorStop(1, 'rgba(255,170,80,0)'); q.fillStyle = grd; q.fillRect(0, 0, 64, 64);
    halo = new THREE.ShaderMaterial({ uniforms: { map: { value: new THREE.CanvasTexture(c) }, uWind: wind, uOn: { value: 1 }, uPx: { value: 400 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aSway; attribute float aPh; attribute float aSize; uniform float uWind, uPx; void main(){ vec3 p = position; float sw = 0.55 + 0.45 * sin(uWind * 0.13 + aPh * 0.7);
  p.x += aSway * sw * (0.75 * sin(uWind * 0.62 + aPh) + 0.25 * sin(uWind * 1.37 + aPh * 2.1)); p.z += aSway * sw * 0.6 * cos(uWind * 0.48 + aPh * 1.3);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = min(uPx * aSize / max(0.5, -mv.z), 96.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: 'uniform sampler2D map; uniform float uOn; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(t.rgb * t.a * uOn, 1.0); }' });
    const pts = new THREE.Points(g, halo); pts.frustumCulled = false; pts.name = 'bulb halos'; pts.renderOrder = 5; ctx.scene.add(pts);
  }
  ctx.animated.push(() => { const L = ctx.day.light ?? 1, on = 1 - THREE.MathUtils.smoothstep(L, 0.35, 0.95); mats.bulb.emissiveIntensity = 0.7 + 2.4 * on; mats.candle.emissiveIntensity = 0.6 + 2.2 * on; if (halo) { halo.uniforms.uOn.value = 0.12 + 0.88 * on; halo.uniforms.uPx.value = ctx.renderer.domElement.height * 0.5; } });
}

// Light that glows and does not cast: pools of warm light on the paving (under the pine's bowl, the pots, the loungers,
// the lanterns, along the parapet's foot) and washes up the rock from the fittings at the foot of the wall. Additive
// soft shapes, strongest at night, golden at dusk, a trace by day. (Two draws.)
function warmLight(ctx, E) {
  const disc = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,255,255,1)'); grd.addColorStop(0.45, 'rgba(255,255,255,0.45)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const fan = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 128; const g = c.getContext('2d'); for (let y = 0; y < 128; y++) { const v = y / 127, a = Math.pow(1 - v, 1.5) * Math.min(1, v * 12); for (let x = 0; x < 64; x++) { const u = Math.abs(x / 63 - 0.5) * 2 / (0.35 + 0.65 * v), w = Math.max(0, 1 - u * u); g.fillStyle = `rgba(255,255,255,${(a * w).toFixed(3)})`; g.fillRect(x, 127 - y, 1, 1); } } return new THREE.CanvasTexture(c); })();      // (brightest just above the fitting, spreading and fading as it climbs)
  const mats = [], add = (parts, map, name) => {
    if (!parts.length) return;
    const mat = new THREE.MeshBasicMaterial({ map, color: 0xffb468, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8, side: THREE.DoubleSide });
    const m = new THREE.Mesh(mergeGeometries(parts), mat); m.name = name; m.renderOrder = 3; ctx.scene.add(m); mats.push([mat, m]);
  };
  add(E.pools.map(([x, z, rad, k = 1, y = PAVE + 0.02]) => { const g = new THREE.PlaneGeometry(rad * 2, rad * 2).rotateX(-Math.PI / 2).translate(x, y, z), n = g.attributes.position.count, col = new Float32Array(n * 3).fill(k); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; }), disc, 'light pools');
  add(E.washes.map(([x, z, yaw, w, h, k = 1]) => { const g = new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0).rotateY(yaw).translate(x, PAVE, z), n = g.attributes.position.count, col = new Float32Array(n * 3).fill(k); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; }), fan, 'rock washes');
  for (const [mat] of mats) mat.vertexColors = true;
  ctx.animated.push(() => { const L = ctx.day.light ?? 1, on = 1 - THREE.MathUtils.smoothstep(L, 0.35, 0.95); Wild.night.value = on * 0.55; for (const [mat, m] of mats) { mat.color.setRGB(1.0, 0.52, 0.2).multiplyScalar(0.03 + (m.name === 'rock washes' ? 0.3 : 0.12) * on); m.visible = true; } });      // (amber, and low enough that overlapping pools never burn to white)
}

// A tile painted on a canvas, seamless (each mark drawn again where it crosses an edge), as a repeating texture.
function tile(size, paint, repeat) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  paint(g, size, (fn) => { for (const dx of [-size, 0, size]) for (const dy of [-size, 0, size]) { g.save(); g.translate(dx, dy); fn(); g.restore(); } });
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / repeat, 1 / repeat); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rnd = seed => { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
// Beds of black river pebbles, polished and a little wet (research/refs/5): flat outlines laid a hair over the lawn.
function pebbleBeds(scene, beds) {
  if (!beds.length) return;
  const r = rnd(41), map = tile(512, (g, S, wrap) => {
    g.fillStyle = '#121110'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 520; i++) { const x = r() * S, y = r() * S, a = 9 + r() * 14, b = a * (0.55 + r() * 0.3), rot = r() * 3.1, l = 9 + r() * 14;
      wrap(() => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, 0, a, b, 0, 0, 7); g.fillStyle = `hsl(30,4%,${l * 0.7}%)`; g.fill(); g.beginPath(); g.ellipse(-a * 0.3, -b * 0.35, a * 0.4, b * 0.22, -0.3, 0, 7); g.fillStyle = `rgba(230,235,240,${0.06 + r() * 0.08})`; g.fill(); g.restore(); }); }
  }, 3.2);
  const parts = beds.map(pts => { const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z))), g = new THREE.ShapeGeometry(sh), p = g.attributes.position, pos = [], uv = [];
    for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), PAVE + 0.06, p.getY(i)); uv.push(p.getX(i), -p.getY(i)); }
    const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); const idx = Array.from(g.index.array); for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]; q.setIndex(idx);
    q.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3)); return q; });
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ map, roughness: 0.85, envMapIntensity: 0.08, color: 0x2e2e2e, polygonOffset: true, polygonOffsetUnits: -12 }));
  mesh.receiveShadow = true; mesh.name = 'pebble beds'; scene.add(mesh);
}
// Moss: the cushions, and the moss on the boulders' shoulders, in one bright green, its texture laid from above.
function moss(scene, list) {
  if (!list.length) return;
  const r = rnd(7), map = tile(256, (g, S, wrap) => {
    g.fillStyle = 'hsl(84,55%,26%)'; g.fillRect(0, 0, S, S);
    for (let i = 0; i < 5200; i++) { const x = r() * S, y = r() * S, rad = 1 + r() * 2.6, col = `hsl(${74 + r() * 26},${50 + r() * 25}%,${22 + r() * 30}%)`; wrap(() => { g.beginPath(); g.arc(x, y, rad, 0, 7); g.fillStyle = col; g.fill(); }); }
  }, 2.5);
  const parts = list.map(g0 => { const g = g0.index ? g0.toNonIndexed() : g0; for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k); const p = g.attributes.position, uv = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) { uv[i * 2] = p.getX(i) + p.getY(i) * 0.5; uv[i * 2 + 1] = p.getZ(i) + p.getY(i) * 0.5; } g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    const tint = [[0.62, 0.66, 0.42], [0.55, 0.78, 0.5], [0.8, 0.9, 0.5], [0.66, 0.72, 0.5]][Math.floor(r() * 4)], col = new Float32Array(p.count * 3); for (let i = 0; i < p.count; i++) col.set(tint, i * 3); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; });      // (olive, emerald, yellow-green)
  const mesh = new THREE.Mesh(mergeGeometries(parts), new THREE.MeshStandardMaterial({ map, roughness: 1, envMapIntensity: 0.4, vertexColors: true }));
  mesh.receiveShadow = mesh.castShadow = true; mesh.name = 'moss'; scene.add(mesh);
}
// The stream's water: dark and clear, its surface broken by small ripples that move downstream and catch the light
// (a painted ripple normal map, slid along). And over the edge pool (spanya.js's flat water) a thin skin of the same
// ripples, so that it glints too. One material for both.
function water(ctx, E) {
  const r = rnd(19), c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) { const x = r() * 128, y = r() * 128, w = 6 + r() * 14, h = 2 + r() * 3; for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) { const grd = g.createLinearGradient(0, y + dy - h, 0, y + dy + h); grd.addColorStop(0, 'rgb(128,90,255)'); grd.addColorStop(1, 'rgb(128,166,255)'); g.fillStyle = grd; g.beginPath(); g.ellipse(x + dx, y + dy, w, h, 0, 0, 7); g.fill(); } }
  const nm = new THREE.CanvasTexture(c); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(0.6, 0.6);
  const mat = new THREE.MeshStandardMaterial({ color: 0x1b2a2a, roughness: 0.08, metalness: 0.2, normalMap: nm, normalScale: new THREE.Vector2(0.5, 0.5), transparent: true, opacity: 0.86, envMapIntensity: 1.4 });
  if (E.stream) { const m = new THREE.Mesh(E.stream.geo, mat); m.name = 'stream'; m.receiveShadow = true; ctx.scene.add(m); }
  // the edge pool's crescent (as spanya.js lays its water: between the wall's inner face and the kerb), a hair above it
  const ri = COURT.r - 0.75 - 0.05, KD = COURT.Y - KERB.Y, KY = KERB.Y, KR = KERB.r, a = (ri * ri - KR * KR + KD * KD) / (2 * KD), hx = Math.sqrt(ri * ri - a * a), th = Math.atan2(KD - a, hx), ph = Math.atan2(-a, hx), pts = [];
  for (let i = 0; i <= 24; i++) { const q = 2 * Math.PI + ph + (Math.PI - ph - (2 * Math.PI + ph)) * i / 24; pts.push([COURT.X + ri * Math.cos(q), COURT.Y + ri * Math.sin(q)]); }
  for (let i = 0; i <= 16; i++) { const q = Math.PI - th - (Math.PI - 2 * th) * i / 16; pts.push([COURT.X + (KR - 0.5) * Math.cos(q), KY + (KR - 0.5) * Math.sin(q)]); }
  const sh = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([X, Y]) => new THREE.Vector2(Y, X)))), p = sh.attributes.position, pos = [], uv = [];
  for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), PAVE + 0.77, p.getY(i)); uv.push(p.getX(i), p.getY(i)); }
  const gq = new THREE.BufferGeometry(); gq.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); gq.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); const idx = Array.from(sh.index.array); gq.setIndex(idx); gq.computeVertexNormals();
  if (gq.attributes.normal.getY(0) < 0) { for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]]; gq.setIndex(idx); gq.computeVertexNormals(); }
  const skin = new THREE.Mesh(gq, mat.clone()); skin.material.opacity = 0.35; skin.material.normalMap = nm; skin.name = 'edge pool ripples'; ctx.scene.add(skin);
  ctx.animated.push(t => { nm.offset.set(t * 0.03, t * 0.05); });
}
// The water falling from the edge pool's rim down the cliff: a thin, broken, translucent sheet hung just outside the rim
// along its bearings, streaks sliding down it at two speeds, brightest at the lip, thinning and fading out over some 28 ft,
// a little mist where it goes. It catches the sky by day and is a faint pale veil at night. (One draw.)
function falls(ctx) {
  const r = rnd(23), c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 110; i++) { const x = r() * 256, w = 1.5 + r() * 5, y = r() * 256, h = 30 + r() * 140, a = 0.25 + r() * 0.75; for (const dy of [-256, 0, 256]) for (const dx of [-256, 0, 256]) { const grd = g.createLinearGradient(0, y + dy, 0, y + dy + h); grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(0.3, `rgba(255,255,255,${a})`); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(x + dx, y + dy, w, h); } }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  const N = 48, DROP = 28, ROWS = 14, pos = [], uv = [], idx = [];
  for (let j = 0; j <= ROWS; j++) {
    const v = j / ROWS, h = FALL.top + 0.02 - DROP * v * v * 0.6 - DROP * v * 0.4, out = FALL.r - 0.15 + Math.sqrt(v) * 1.6 + v * 1.2;      // (it leaves the lip a little outward and falls away from the cliff)
    for (let i = 0; i <= N; i++) { const q = (FALL.from + (FALL.to - FALL.from) * i / N) * Math.PI / 180, X = COURT.X + out * Math.cos(q), Y = COURT.Y + out * Math.sin(q); pos.push(Y, h, X); uv.push(q * FALL.r / 9, v); }
  }
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + N + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uT: { value: 0 }, uL: { value: 1 } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D map; uniform float uT, uL; varying vec2 vUv;
void main(){
  float v = vUv.y;
  float s1 = texture2D(map, vec2(vUv.x, v * 1.6 - uT * 0.55)).r, s2 = texture2D(map, vec2(vUv.x * 1.7 + 0.37, v * 2.3 - uT * 0.85)).r;
  float streak = max(s1, s2 * 0.8);
  float lip = smoothstep(0.08, 0.0, v), fade = 1.0 - smoothstep(0.45, 1.0, v), mist = smoothstep(0.55, 0.85, v) * (1.0 - smoothstep(0.85, 1.0, v));
  float a = (streak * 0.85 + 0.14) * (0.6 * fade + 0.4 * lip) + lip * 0.4 + mist * 0.18 * (0.6 + 0.4 * s2);
  vec3 col = mix(vec3(0.80, 0.88, 0.90), vec3(1.0), lip + streak * 0.4) * (0.25 + 0.75 * uL);
  gl_FragColor = vec4(col, a * (0.55 + 0.45 * uL));
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'falling water'; mesh.frustumCulled = false; mesh.renderOrder = 4; ctx.scene.add(mesh);
  ctx.animated.push(t => { mat.uniforms.uT.value = t; mat.uniforms.uL.value = Math.max(0.12, ctx.day.light ?? 1); });
}
// A few maple leaves coming down now and then, turning as they fall, from the maple's crown to the lawn (one draw).
function leafFall(ctx, E) {
  if (!E.maple) return;
  const N = 7, c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#a3281c';
  for (let f = 0; f < 5; f++) { g.save(); g.translate(16, 22); g.rotate((f - 2) * 0.55); g.beginPath(); g.ellipse(0, -8, 2.6, 8, 0, 0, 7); g.fill(); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.32, 0.32), new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 }), N);
  mesh.name = 'falling leaves'; mesh.frustumCulled = false; ctx.scene.add(mesh);
  const r = rnd(5), L = Array.from({ length: N }, () => ({ t0: r() * 40, T: 9 + r() * 6, dx: (r() - 0.5) * 7, dz: (r() - 0.5) * 7, ph: r() * 6 })), m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), M = E.maple;
  ctx.animated.push(time => {
    for (let i = 0; i < N; i++) {
      const l = L[i], u = ((time + l.t0) % (l.T * 3)) / l.T;      // falling for a third of its cycle, lying unseen the rest
      if (u > 1) { v.set(0, -50, 0); m.compose(v, q.identity(), one); mesh.setMatrixAt(i, m); continue; }
      v.set(M.x + l.dx * u + Math.sin(u * 9 + l.ph) * 0.8, M.y - (M.y - PAVE - 0.05) * u, M.z + l.dz * u + Math.cos(u * 7 + l.ph) * 0.8);
      e.set(u * 11 + l.ph, u * 5, Math.sin(u * 13) * 0.8); q.setFromEuler(e); m.compose(v, q, one); mesh.setMatrixAt(i, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
}
// The boulders lit from below: a skin over each, a hair outside it, that adds a warm wash strongest near the fitting and
// low on the stone, faded out by day. Lights nothing else and casts nothing (one draw for all of them).
function uplights(ctx, list) {
  if (!list.length) return;
  const parts = list.map(({ geo, fx, fy, fz, h, k: gain = 1 }) => {
    const g = geo.clone(), p = g.attributes.position, n = g.attributes.normal, col = new Float32Array(p.count * 3);
    let cx = 0, cz = 0; for (let i = 0; i < p.count; i++) { cx += p.getX(i); cz += p.getZ(i); } cx /= p.count; cz /= p.count;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i); p.setXYZ(i, cx + (x - cx) * 1.012, y + 0.01, cz + (z - cz) * 1.012);
      const dx = fx - x, dy = fy - y, dz = fz - z, d = Math.hypot(dx, dy, dz) || 1, facing = Math.abs((n.getX(i) * dx + n.getY(i) * dy + n.getZ(i) * dz) / d), up = Math.max(0, 1 - (y - fy) / (h * 1.4));
      const k = (gain > 1 ? 0.38 : 1) * gain * (0.06 + 0.94 * facing) * Math.pow(up, gain > 1 ? 1.2 : 2.5) * Math.min(1, 1.6 * gain / d);
      col[i * 3] = 0.9 * k; col[i * 3 + 1] = 0.48 * k; col[i * 3 + 2] = 0.17 * k;
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.deleteAttribute('uv'); return g;
  });
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const mesh = new THREE.Mesh(mergeGeometries(parts), mat); mesh.name = 'stone uplights'; ctx.scene.add(mesh);
  ctx.animated.push(() => { const on = 1 - THREE.MathUtils.smoothstep(ctx.day.light ?? 1, 0.42, 0.97); mat.color.setScalar(on * 0.42); mesh.visible = on > 0.01; });
}

// The wire net between the leaning posts round the cut (Villa Vals): one strip, a painted diamond mesh cut out of it.
function net(scene, { bots, tops }) {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.strokeStyle = 'rgba(60,62,60,1)'; g.lineWidth = 3;
  for (const [a, b] of [[0, 0], [64, 0], [-64, 0], [128, 0]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(a + 128, 128); g.stroke(); g.beginPath(); g.moveTo(a + 128, b); g.lineTo(a, 128); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  const pos = [], uv = [], idx = []; let run = 0;
  for (let i = 0; i < bots.length; i++) {
    if (i) run += Math.hypot(bots[i][0] - bots[i - 1][0], bots[i][2] - bots[i - 1][2]);
    pos.push(...bots[i], ...tops[i]); uv.push(run / 0.5, 0, run / 0.5, Math.hypot(tops[i][0] - bots[i][0], tops[i][1] - bots[i][1], tops[i][2] - bots[i][2]) / 0.5);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 }));
  mesh.name = 'cut net'; scene.add(mesh);
}

// The stove's fire behind its door, flickering, brighter as the light goes; E on the stove feeds it. And the steam off
// the tub: a few soft puffs rising and fading (one set of points).
function fire(ctx, E) {
  const { scene, animated, day } = ctx;
  if (E.stove) {
    const s = E.stove, mat = new THREE.MeshStandardMaterial({ color: 0x1a0d06, emissive: 0xff7a2a, emissiveIntensity: 1.2, roughness: 0.9 });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.42).rotateY(Math.PI / 2), mat); door.position.set(s.x + 0.06, s.y, s.z); door.name = 'stove fire'; scene.add(door);
    let fed = 0;
    animated.push(t => { const on = 1 - THREE.MathUtils.smoothstep(day.light ?? 1, 0.3, 0.95); mat.emissiveIntensity = (0.5 + 1.6 * on + fed * 2) * (0.75 + 0.18 * Math.sin(t * 7.3) + 0.12 * Math.sin(t * 13.1 + 1) + 0.08 * Math.sin(t * 23.7)); fed = Math.max(0, fed - 0.004); });
    const say = ['You feed the stove a log.'];
    let k = 0; ctx.interact.push({ x: s.x - 0.6, y: s.y + 0.4, z: s.z, reach: 5.5, label: () => 'feed the stove', act: () => { fed = 1; ctx.flash(say[k++ % say.length]); } });
  }
  if (E.tub) {
    const N = 140, tb = E.tub, pos = new Float32Array(N * 3), life = new Float32Array(N), seed = [], r = () => Math.random();
    for (let i = 0; i < N; i++) { seed.push([r() * Math.PI * 2, Math.sqrt(r()) * tb.r * 0.85, r() * 0.4 + 0.3]); life[i] = i / N; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('life', new THREE.BufferAttribute(life, 1));
    const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,255,255,0.9)'); grd.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    const mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: new THREE.CanvasTexture(c) }, scale: { value: 400 }, strength: { value: 0.3 } }, transparent: true, depthWrite: false,
      vertexShader: 'attribute float life; varying float vL; uniform float scale; void main(){ vL = life; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = scale * (0.5 + life * 1.3) / -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: 'uniform sampler2D map; uniform float strength; varying float vL; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(vec3(0.93), t.a * strength * sin(3.14159 * vL)); }',
    });
    const pts = new THREE.Points(geo, mat); pts.name = 'tub steam'; pts.frustumCulled = false; scene.add(pts);
    animated.push((t, dt = 0.016) => {
      mat.uniforms.scale.value = ctx.renderer.domElement.height * 0.5;
      mat.uniforms.strength.value = 0.05 + 0.06 * (1 - (day.light ?? 1));      // (a faint haze of many small puffs, as the pool's)      // (more of it in the cold of the evening)
      for (let i = 0; i < N; i++) {
        life[i] += dt * 0.12 * seed[i][2]; if (life[i] > 1) { life[i] -= 1; seed[i][0] = r() * Math.PI * 2; seed[i][1] = Math.sqrt(r()) * tb.r * 0.85; }
        const L = life[i], a = seed[i][0], d = seed[i][1];
        const lean = L * L * (1.8 + 1.2 * Math.sin(t * 0.23) + 0.5 * Math.sin(t * 0.71));
        pos[i * 3] = tb.x + Math.cos(a) * d + lean * 0.6; pos[i * 3 + 1] = tb.water + 0.1 + L * 3.2; pos[i * 3 + 2] = tb.z + Math.sin(a) * d + lean;
      }
      geo.attributes.position.needsUpdate = true; geo.attributes.life.needsUpdate = true;
    });
  }
}
