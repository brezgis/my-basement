// The courtyard's garden and the meadow (see the README at the project's root). main.js calls layGrounds once the
// building is built; setup(ctx) runs once the scene exists.
//
//   grounds/grounds_court.js    The Courtyard: a Japanese garden of dark wet stone and bright moss (notes/STYLE.md,
//                               research/refs 1, 5, 6, 7): boulders, black pebble beds, moss cushions, a rocky stream,
//                               the old cloud-pruned pine, a red maple, bamboo, the timber hot tub and timber stair
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
// Lights: three lamps the engine lights in the courtyard (the granite lantern, the paper lantern by the garden-side path,
// the lantern by the tub) and one on the meadow (the lantern at the cellar doors); every other light here glows and
// casts nothing. The glows are all 'e#ffe2b4', which lighting.js turns down by day.
//
// The pool attendant's outdoor posts on the coping and beside the tub stairs are in staff/cast.js.
// The two lounge chairs and their drinks table are furnished by furnish/pool_chapel.js.

import { layMonogram } from './furnish/monogram.js';
import { makeFlames } from './flame.js';
import { burningLogs } from './kit/firewood.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeKit, PAINT } from './grounds/tools.js';
import { TREES, MEADOW, COURT, EDGE_POOL } from './campus.js';
import { waterSheet } from './furnish/pool_chapel_fx.js';
import { Wild, WILD, FLOWERING } from './grounds/grounds_flora.js';
import { wind } from './grounds/cards.js';
import { layCourt, FALL } from './grounds/grounds_court.js';
import { layMeadow } from './grounds/grounds_meadow.js';
import { layEdges, caveSetup } from './grounds/grounds_edges.js';

const PAVE = 0.34;
// The meadow on top of the rock (grounds/grounds_meadow.js): its planting, rails, bench, trees and the cellar doors' things.
// false leaves all of it out (Spanya may have no top of its own: the parent decides).
export const MEADOW_ON = false;
const FALLS_ON = false;
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
    flowers: { court: [], meadow: [] }, fireflies: [], pebbles: [], interact: [], glowAt: [], net: [], trees: [], lanterns: [], mounds: [], beds: [], sway: { iron: [], bulb: [], glass: [], candle: [], halo: [] },
    // A cord can give each vertex its own amplitude to keep its fixed end in place.
    swayPart(kind, geo, amp, ph) {
      const g = geo.index ? geo.toNonIndexed() : geo, p = g.attributes.position, n = p.count;
      const sway = new Float32Array(n);
      if (typeof amp === 'function') {
        for (let i = 0; i < n; i++) sway[i] = amp(p.getX(i), p.getY(i), p.getZ(i));
      } else sway.fill(amp);
      g.setAttribute('aSway', new THREE.Float32BufferAttribute(sway, 1));
      g.setAttribute('aPh', new THREE.Float32BufferAttribute(new Float32Array(n).fill(ph), 1));
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      E.sway[kind].push(g);
    },
    clumps: [], stream: null, maple: null, basin: null, perches: [],
    // a lantern: an iron frame, glass, a candle's glow; standing with its foot at y, or hung from a hook at `hang`
    lantern(x, y, z, s = 0.7, power = 0.6, hang = null) {
      const IRON = PAINT.iron, w = s * 0.5, h = s * 0.95;
      K.box(IRON, x - w, x + w, y, y + 0.05 * s, z - w, z + w);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) K.box(IRON, x + dx * w - 0.03, x + dx * w + 0.03, y, y + h, z + dz * w - 0.03, z + dz * w + 0.03);
      B.mesh('glass', new THREE.BoxGeometry(w * 1.9, h * 0.92, w * 1.9).translate(x, y + h * 0.5, z));
      const wick = y + h * 0.47;
      K.cyl('c#eadbbe/0.65', x, y + h * 0.05, wick, z, w * 0.36, w * 0.32, 10);
      B.mesh('e#ffc170/1.85', new THREE.SphereGeometry(0.065 * s, 8, 6).scale(1, 1.9, 1).translate(x, wick + 0.1 * s, z));
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
  // The courtyard sits inside the building footprint, but its furniture is outdoors.
  const previousZone = B.zone;
  try {
    B.zone = 'o:courtyard';
    layCourt(E);
  } finally {
    B.zone = previousZone;
  }
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
    leafFall(ctx, E);
    swinging(ctx, E);
    try { caveSetup(ctx, E, Object.getPrototypeOf(ctx).scene ?? ctx.scene); } catch (e) { console.warn('grounds: cave', e); }
    water(ctx, E);
    edgePoolWater(ctx);
    if (FALLS_ON) falls(ctx);
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
  { float sw = 0.55 + 0.45 * sin(uWind * 0.05 + aPh * 0.7);
    transformed.x += aSway * sw * (0.75 * sin(uWind * 0.24 + aPh) + 0.25 * sin(uWind * 0.53 + aPh * 2.1));
    transformed.z += aSway * sw * 0.6 * cos(uWind * 0.19 + aPh * 1.3); }`); }; mat.customProgramCacheKey = () => 'sway-' + key; return mat; };
  const mats = {
    iron: patch(new THREE.MeshStandardMaterial({ color: 0x1d1b19, roughness: 0.55, metalness: 0.5 }), 'iron'),
    bulb: patch(new THREE.MeshStandardMaterial({ color: 0xfff0d8, emissive: 0xffb45a, emissiveIntensity: 2, roughness: 0.2, transparent: true, opacity: 0.92 }), 'bulb'),
    glass: patch(new THREE.MeshStandardMaterial({ color: 0xd8d2c2, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }), 'glass'),
    candle: patch(new THREE.MeshStandardMaterial({ color: 0xeed9b7, emissive: 0x8e562d, emissiveIntensity: 0.28, roughness: 0.6 }), 'candle'),
  };
  for (const k of ['iron', 'bulb', 'glass', 'candle']) if (E.sway[k].length) { const m = new THREE.Mesh(mergeGeometries(E.sway[k].map(g => { for (const a of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'aSway', 'aPh'].includes(a)) g.deleteAttribute(a); return g; })), mats[k]); m.name = 'hanging ' + k; if (k === 'iron') m.castShadow = true; ctx.scene.add(m); ctx.track?.(m, 'o:courtyard'); }
  // a soft halo round each bulb and candle (points, additive)
  let halo = null;
  if (E.sway.halo.length) {
    const pos = [], sw = [], ph = [], sz = []; for (const [x, y, z, a, p, s] of E.sway.halo) { pos.push(x, y, z); sw.push(a); ph.push(p); sz.push(s); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aSway', new THREE.Float32BufferAttribute(sw, 1)); g.setAttribute('aPh', new THREE.Float32BufferAttribute(ph, 1)); g.setAttribute('aSize', new THREE.Float32BufferAttribute(sz, 1));
    const c = document.createElement('canvas'); c.width = c.height = 64; const q = c.getContext('2d'), grd = q.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,220,160,1)'); grd.addColorStop(0.25, 'rgba(255,190,110,0.45)'); grd.addColorStop(1, 'rgba(255,170,80,0)'); q.fillStyle = grd; q.fillRect(0, 0, 64, 64);
    halo = new THREE.ShaderMaterial({ uniforms: { map: { value: new THREE.CanvasTexture(c) }, uWind: wind, uOn: { value: 1 }, uPx: { value: 400 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute float aSway; attribute float aPh; attribute float aSize; uniform float uWind, uPx; void main(){ vec3 p = position; float sw = 0.55 + 0.45 * sin(uWind * 0.05 + aPh * 0.7);
  p.x += aSway * sw * (0.75 * sin(uWind * 0.24 + aPh) + 0.25 * sin(uWind * 0.53 + aPh * 2.1)); p.z += aSway * sw * 0.6 * cos(uWind * 0.19 + aPh * 1.3);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = min(uPx * aSize / max(0.5, -mv.z), 96.0); gl_Position = projectionMatrix * mv; }`,
      fragmentShader: 'uniform sampler2D map; uniform float uOn; void main(){ vec4 t = texture2D(map, gl_PointCoord); gl_FragColor = vec4(t.rgb * t.a * uOn, 1.0); }' });
    const pts = new THREE.Points(g, halo); pts.name = 'bulb halos'; pts.renderOrder = 5; ctx.scene.add(pts); ctx.track?.(pts, 'o:courtyard');
  }
  ctx.animated.push(() => { const L = ctx.day.light ?? 1, on = 1 - THREE.MathUtils.smoothstep(L, 0.35, 0.95); Wild.night.value = on * 0.55; mats.bulb.emissiveIntensity = 0.7 + 2.4 * on; if (halo) { halo.uniforms.uOn.value = 0.12 + 0.88 * on; halo.uniforms.uPx.value = ctx.renderer.domElement.height * 0.5; } });
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
// A moving ripple normal map on the existing surface also catches light along the glass edge.
function water(ctx, E) {
  const r = rnd(19), c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  g.fillStyle = 'rgb(128,128,255)'; g.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 90; i++) { const x = r() * 128, y = r() * 128, w = 6 + r() * 14, h = 2 + r() * 3; for (const dx of [-128, 0, 128]) for (const dy of [-128, 0, 128]) { const grd = g.createLinearGradient(0, y + dy - h, 0, y + dy + h); grd.addColorStop(0, 'rgb(128,90,255)'); grd.addColorStop(1, 'rgb(128,166,255)'); g.fillStyle = grd; g.beginPath(); g.ellipse(x + dx, y + dy, w, h, 0, 0, 7); g.fill(); } }
  const nm = new THREE.CanvasTexture(c); nm.wrapS = nm.wrapT = THREE.RepeatWrapping; nm.repeat.set(0.6, 0.6);
  const mat=ctx.materials.pool_surface;
  mat.normalMap=nm; mat.normalScale.set(0.49,0.49); mat.needsUpdate=true;
  if (E.stream) {
    const stream=new THREE.Mesh(E.stream.geo,mat);
    stream.name='stream'; stream.receiveShadow=true; ctx.scene.add(stream);
  }
  ctx.animated.push(t => { nm.offset.set(t * 0.03, t * 0.05); });
}
// The edge pool's surface: the warm pool's own sheet of slow ripples (furnish/pool_chapel_fx.js), cut to the crescent
// between the brink and the kerb, a hair over the building's water plane; the terrace's lanterns lie broken on it at night.
function edgePoolWater(ctx) {
  const { brink, coping, water: h } = EDGE_POOL, y = h + 0.03, pos = [];
  for (let i = 0; i < brink.length - 1; i++) for (const [X, Y] of [brink[i], coping[i], coping[i + 1], brink[i], coping[i + 1], brink[i + 1]]) pos.push(Y, y, X);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const lamps = [{ x: 21.3, y: 2.3, z: 71.1, k: 1 }];      // (the paper lantern by the loungers: grounds_court.js)
  waterSheet(ctx, g, lamps, new THREE.Vector3(COURT.Y - COURT.r + 5, h + 1, COURT.X));
  // Light from inside the water (Anna: "needs some light from inside it"): three small lamps set in the bed along the
  // glass, each a warm disc with a pool of light on the tile round it; faint by day, the pool's own glow after dark.
  { const c = document.createElement('canvas'); c.width = c.height = 128; const g2 = c.getContext('2d'), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(255,238,200,1)'); gr.addColorStop(0.12, 'rgba(255,225,170,.75)'); gr.addColorStop(0.45, 'rgba(170,225,215,.28)'); gr.addColorStop(1, 'rgba(150,220,210,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const halo = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -8 });
    const lens = new THREE.MeshBasicMaterial({ color: 0xffe9c0, toneMapped: false, fog: false }), bed = EDGE_POOL.bed;
    for (const i of [1.5, 4, 6.5]) { const a = brink[Math.floor(i)], b2 = brink[Math.ceil(i)], k = i % 1, bx = a[0] + (b2[0] - a[0]) * k, by = a[1] + (b2[1] - a[1]) * k, cp = coping[Math.round(i)], d = Math.hypot(cp[0] - bx, cp[1] - by) || 1, X = bx + (cp[0] - bx) / d * 0.55, Y = by + (cp[1] - by) / d * 0.55;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.17, 16).rotateX(-Math.PI / 2), lens); disc.position.set(Y, bed + 0.03, X); disc.name = 'edge pool lamp'; ctx.scene.add(disc);
      const pool = new THREE.Mesh(new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2), halo); pool.position.set(Y, bed + 0.035, X); pool.renderOrder = 2; ctx.scene.add(pool);
      const glow = new THREE.Mesh(new THREE.PlaneGeometry(5, 5).rotateX(-Math.PI / 2), halo); glow.position.set(Y, h + 0.045, X); glow.renderOrder = 5; ctx.scene.add(glow); }      // (and its light coming up through the surface)
    ctx.animated.push(t => { const nt = ctx.day?.night ?? 0; halo.opacity = (0.16 + 0.5 * nt) * (0.94 + 0.06 * Math.sin(t * 0.8)); const v = 0.55 + 0.45 * nt; lens.color.setRGB(v, v * 0.92, v * 0.76); }); }
  // the house's A on its bed, in the same tesserae as the warm pool's (furnish/monogram.js), its head to the clouds
  { const a = brink[4], c = coping[4]; layMonogram(ctx, a[0] + (c[0] - a[0]) * 0.19, a[1] + (c[1] - a[1]) * 0.19, EDGE_POOL.bed, 2.6, [a[0] - c[0], a[1] - c[1]], 'edge pool monogram'); }
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
    const s = E.stove, time = { value: 0 }, hearth = new THREE.Group();
    hearth.name = 'hot tub stove fire';
    hearth.rotation.y = Math.PI / 2;
    hearth.position.set(s.x, s.y, s.z);
    hearth.add(burningLogs(ctx.materials.bark, 0.62, 0.37));
    const flames = makeFlames(THREE, mergeGeometries, time, [[0, 0.02, 0, 0.50, 0.59, 1], [0.21, 0.09, -0.08, 0.27, 0.39, 4]], 0.055);
    hearth.add(flames); scene.add(hearth);
    let fed = 0;
    animated.push((t, dt = 0.016) => { time.value = t; flames.scale.y = 1 + 0.22 * fed; fed = Math.max(0, fed - 0.24 * dt); });
    ctx.interact.push({
      x: s.x + 0.31, y: s.y + 0.35, z: s.z, reach: 5.5, label: () => 'feed the stove',
      act: () => { fed = 1; ctx.flash('You feed the stove a log.'); },
    });
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
