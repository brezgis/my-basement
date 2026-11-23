// The open side's two walks and what is at their ends (grounds.js): spanya.js builds the walks, the lookout's balcony and
// the cave; this dresses them.
//
//   the walks      kept clear to walk: a lantern on each parapet, a pot at the west walk's end, ivy on the wing's front
//   the lookout    the half-round balcony on the west walk, over the drop: a curved stone bench against the parapet facing
//                  out, a brass telescope on a tripod (E: look through it), a lantern, a pot of lavender
//   the Old Cave   at the east walk's end, through an arched mouth: a ring of hearth stones with a fire in it, four stones to
//                  sit on with sheepskins, stone lamps (hollowed stones with a flame) on boulders by the wall, a frieze of
//                  paintings round the chamber in ochre and manganese (aurochs, horses, stags, handprints by the way in),
//                  painted with the pigment engine of Anna's Lascaux (grounds_cave_paint.js), lit by the fire's flicker.
//                  Nothing modern. Everything in the cave is built through the builder (it is a room, The Old Cave, and is
//                  drawn with it), except the flames and the frieze, made once the scene exists (caveSetup).
//
// Plan coordinates as spanya.js; the world is x = Y, z = X.

import { burningLogs } from '../kit/firewood.js';
import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { lookout as LOOK, westWalk, eastWalk } from '../buildings/cliff-walks.js';
import { PAINT } from './tools.js';
import { rng } from './cards.js';
import { makeFlames } from '../flame.js';
import { fixedExteriorLight } from '../lighting.js';
import { makePainter } from './grounds_cave_paint.js';
import { beast, handPath } from './grounds_cave_forms.js';

const TAU = Math.PI * 2, PAVE = 0.34, pw = (X, Y) => [Y, X];
const CV = { X: 125.5, Y: 19.5, rx: 10, ry: 9, H: 12.5 }, FIRE = { X: 126.5, Y: 19.5 };
const lookTo = (dX, dY) => Math.atan2(-dY, -dX);

// a rough stone (a dented, squashed ball), its foot sunk a little
function stoneGeo(x, y, z, sx, sy, sz, seed, det = 1) {
  let g = new THREE.IcosahedronGeometry(1, det); g.deleteAttribute('uv'); g.deleteAttribute('normal'); g = mergeVertices(g);
  const p = g.attributes.position, q = rng(seed), ph = [q() * 6, q() * 6, q() * 6];
  for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), k = 0.84 + 0.11 * Math.sin(px * 2.3 + ph[0]) * Math.cos(pz * 2.1 + ph[1]) + 0.08 * Math.sin(py * 3.7 + ph[2]); p.setXYZ(i, px * k, Math.max(-0.4, py) * k, pz * k); }
  g.scale(sx, sy, sz); g.rotateY(q() * TAU); g.translate(x, y, z); g.computeVertexNormals(); return g.toNonIndexed();
}

export function layEdges(E) {
  const { K, B, Wd } = E, r = rng(5150);

  // ---- the walks ----------------------------------------------------------------------------------------------------
  for (const [x,y,,rise] of [westWalk[4],eastWalk[6]]) {
    const [lx,lz] = pw(x,y);
    E.lantern(lx,PAVE+rise+2.75,lz,0.66,0.35);
  }

  {
    const PAVE = 0.34 + westWalk.at(-1)[3];
    const [cx, cz] = pw(LOOK.X, LOOK.Y), STONEB = 'c#b8ab96/0.95', R0 = 5.0, R1 = 5.95, BH = 1.45;
    // a curved bench against the parapet, in two pieces, facing out over the drop (bearings measured as the plan's)
    const ring = (ra, rb, q0, q1, n = 18) => { const sh = new THREE.Shape(); for (let i = 0; i <= n; i++) { const q = q0 + (q1 - q0) * i / n; i ? sh.lineTo(ra * Math.sin(q), -ra * Math.cos(q)) : sh.moveTo(ra * Math.sin(q), -ra * Math.cos(q)); } for (let i = n; i >= 0; i--) { const q = q0 + (q1 - q0) * i / n; sh.lineTo(rb * Math.sin(q), -rb * Math.cos(q)); } return sh; };
    for (const [b0, b1] of [[196, 252], [288, 344]]) {
      const g = new THREE.ExtrudeGeometry(ring(R0 + 0.07, R1 - 0.07, b0 * Math.PI / 180, b1 * Math.PI / 180), { depth: BH - 0.14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 3, curveSegments: 18 });
      g.rotateX(-Math.PI / 2); g.translate(cx, PAVE + 0.07, cz); K.put(STONEB, g);
      const cg = new THREE.ExtrudeGeometry(ring(R0 + 0.2, R1 - 0.2, (b0 + 3) * Math.PI / 180, (b1 - 3) * Math.PI / 180), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 3, curveSegments: 16 });
      cg.rotateX(-Math.PI / 2); cg.translate(cx, PAVE + BH + 0.07, cz); B.mesh('linen#e6dcc6', cg);
      for (let b = b0 + 4; b < b1; b += 9) { const q = b * Math.PI / 180, [bx, bz] = pw(LOOK.X + 5.45 * Math.cos(q), LOOK.Y + 5.45 * Math.sin(q)); K.collide(bx - 0.5, bx + 0.5, bz - 0.5, bz + 0.5, PAVE + BH, PAVE - 0.5); }
      const qm = (b0 + b1) / 2 * Math.PI / 180, [sx, sz] = pw(LOOK.X + 5.3 * Math.cos(qm), LOOK.Y + 5.3 * Math.sin(qm));
      K.seat(sx, PAVE + BH + 0.15, sz, lookTo(Math.cos(qm), Math.sin(qm)), 'sit and look out over the clouds');
    }
    // the telescope: a brass tube on a timber tripod, trained out over the drop; E looks through it
    const tX = LOOK.X, tY = LOOK.Y - 3.2, [tx, tz] = pw(tX, tY), WOOD = 'c#6b4a32/0.85', BRASS = PAINT.brass, head = PAVE + 3.9;
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + 0.4; K.tube(WOOD, [tx + Math.cos(a) * 0.9, PAVE, tz + Math.sin(a) * 0.9], [tx, head, tz], 0.045, 6); }
    K.sphere(BRASS, tx, head, tz, 0.12, 1, 1);
    const dir = new THREE.Vector3(-1, 0.12, 0).normalize(), a0 = new THREE.Vector3(tx, head + 0.18, tz).addScaledVector(dir, -1.1), a1 = a0.clone().addScaledVector(dir, 3.1);
    K.tube(BRASS, a0.toArray(), a1.toArray(), 0.16, 14); K.tube(BRASS, a1.toArray(), a1.clone().addScaledVector(dir, 0.25).toArray(), 0.2, 14);
    K.tube(BRASS, a0.clone().addScaledVector(dir, -0.35).toArray(), a0.toArray(), 0.07, 10); K.tube('c#1e1c1a/0.5', a0.clone().addScaledVector(dir, -0.45).toArray(), a0.clone().addScaledVector(dir, -0.35).toArray(), 0.08, 10);
    K.collide(tx - 0.9, tx + 0.9, tz - 0.9, tz + 0.9, head, PAVE - 0.5);
    E.scope = { x: tx + 1.5, y: head + 0.3, z: tz, yaw: Math.PI / 2, pitch: -0.05, at: [tx, head, tz] };
    // a lantern on the parapet's top at the bench's end, and a pot of lavender by the way in
    { const q = 270 * Math.PI / 180, [lx, lz] = pw(LOOK.X + 6.55 * Math.cos(q), LOOK.Y + 6.55 * Math.sin(q));
      E.lantern(lx, PAVE + 2.62, lz, 0.75, 0);
      fixedExteriorLight(lx, PAVE + 3.06, lz, { power: 7, reach: 8 });
    }
    { const q = 196 * Math.PI / 180, [px, pz] = pw(LOOK.X + 3.6 * Math.cos(q) - 1.6, LOOK.Y + 3.6 * Math.sin(q) + 2.2); const top = E.pot(px, pz, 'pot', 1.4, 'c#b57a5a/0.9', PAVE); for (let k = 0; k < 3; k++) E.plant('lavender', px + (r() - 0.5) * 0.4, top, pz + (r() - 0.5) * 0.4, 0.75); }
    E.perches.push([cx - 6.55, PAVE + 2.62, cz + 2]);
  }

  // ---- the Old Cave ---------------------------------------------------------------------------------------------------
  {
    const PAVE = 0.34 + eastWalk.at(-1)[3];
    const [fx, fz] = pw(FIRE.X, FIRE.Y), ROCKS = ['cliffrock', 'cliffrock', 'cliffrock'];
    // the hearth: a ring of stones, blackened inside, ash, logs, embers
    for (let i = 0; i < 11; i++) { const a = i / 11 * TAU + r() * 0.15; B.mesh(ROCKS[i % 3], stoneGeo(fx + Math.cos(a) * 1.55, PAVE + 0.12, fz + Math.sin(a) * 1.55, 0.42 + r() * 0.15, 0.3 + r() * 0.12, 0.36, 700 + i)); }
    B.mesh('soot', new THREE.CircleGeometry(1.4, 20).rotateX(-Math.PI / 2).translate(fx, PAVE + 0.03, fz));
    B.mesh('c#8a8278/1', new THREE.CircleGeometry(0.9, 16).rotateX(-Math.PI / 2).translate(fx, PAVE + 0.04, fz));
    K.collide(fx - 1.9, fx + 1.9, fz - 1.9, fz + 1.9, PAVE + 0.8, PAVE - 0.5);
    E.cave = { fire: [fx, PAVE + 0.2, fz], centre: pw(CV.X, CV.Y), H: CV.H };
    // four stones to sit on round it, each with a sheepskin
    [[30, 4.4], [110, 4.6], [185, 4.3], [285, 4.5]].forEach(([b, d], i) => {
      const q = b * Math.PI / 180, X = FIRE.X + Math.cos(q) * d, Y = FIRE.Y + Math.sin(q) * d, [sx, sz] = pw(X, Y);
      B.mesh(ROCKS[i % 3], stoneGeo(sx, PAVE + 0.45, sz, 1.05, 0.95, 0.9, 900 + i, 2));
      const skin = stoneGeo(sx, PAVE + 1.36, sz, 1.0, 0.24, 0.85, 950 + i, 2); B.mesh('wool#f2e8d4', skin); B.mesh('wool#e6d8bf', stoneGeo(sx + 0.55, PAVE + 1.0, sz + 0.2, 0.35, 0.5, 0.55, 960 + i, 1));      // (and a fold of it hanging over the side)
      K.collide(sx - 0.9, sx + 0.9, sz - 0.9, sz + 0.9, PAVE + 1.4, PAVE - 0.5);
      K.seat(sx, PAVE + 1.35, sz, lookTo(FIRE.X - X, FIRE.Y - Y), 'sit by the fire');
    });
    // stone lamps: hollowed stones with a flame, on boulders by the wall
    E.caveLamps = [];
    for (const b of [70, 150, 300, 345]) {      // (clear of the way in, which comes from about 235)
      const q = b * Math.PI / 180, X = CV.X + Math.cos(q) * CV.rx * 0.74, Y = CV.Y + Math.sin(q) * CV.ry * 0.74, [bx, bz] = pw(X, Y), h = 1.6 + r() * 1.2;
      B.mesh(ROCKS[b % 3], stoneGeo(bx, PAVE + h * 0.35, bz, 1.0, h * 0.75, 0.9, 1000 + b, 2));
      K.collide(bx - 0.8, bx + 0.8, bz - 0.8, bz + 0.8, PAVE + h, PAVE - 0.5);
      const top = PAVE + h * 0.95; B.mesh('c#7a6e60/0.95', new THREE.CylinderGeometry(0.3, 0.22, 0.2, 10).translate(bx, top + 0.08, bz)); B.mesh('soot', new THREE.CircleGeometry(0.2, 10).rotateX(-Math.PI / 2).translate(bx, top + 0.185, bz));
      E.caveLamps.push([bx, top + 0.2, bz]);
    }
  }
}

// ---- once the scene exists: the flames, the frieze, and the telescope's glass ------------------------------------------
export function caveSetup(ctx, E, root) {
  const uT = { value: 0 };
  ctx.animated.push(t => { uT.value = t; });
  // the flames: the hearth's, and a small one on each stone lamp
  if (E.cave) {
    const [fx, fy, fz] = E.cave.fire, sheets = [];
    const wood = burningLogs(ctx.materials.bark, 1.85, 1.38);
    wood.position.set(fx, fy-.14, fz); root.add(wood);
    for (let k = 0; k < 4; k++) sheets.push([k * Math.PI / 4, fx, fz, 1.3, 2.0 + (k % 2) * 0.4, k * 7.1]);
    for (const [x, y, z] of E.caveLamps ?? []) {
      root.add(makeFlames(THREE, mergeGeometries, uT, [[0,x,z,.16,.32,11],[Math.PI/2,x,z,.16,.32,12]],y));
    }
    const fl = makeFlames(THREE, mergeGeometries, uT, sheets, fy); fl.name = 'cave flames'; fl.renderOrder = 6; root.add(fl);
    frieze(ctx, E, root);
  }
  // the telescope: E to look through it (the glass narrows the view; any step or E again to stop)
  if (E.scope) {
    const S = E.scope, seat = { x: S.x, y: S.y, z: S.z, yaw: S.yaw, label: 'the telescope' };
    const ring = document.createElement('div'); ring.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;opacity:0;transition:opacity .35s;background:radial-gradient(circle at 50% 50%,transparent 0,transparent 39vmin,rgba(10,7,5,.55) 39.6vmin,#050403 41.5vmin)'; document.body.appendChild(ring);
    let on = false;
    ctx.interact.push({ x: S.at[0], y: S.at[1], z: S.at[2], reach: 6, label: () => 'look through the telescope', act: () => { ctx.walker.sit(seat); ctx.walker.pitch = S.pitch; ctx.zoom(true); ring.style.opacity = '1'; on = true; } });
    ctx.animated.push(() => { if (on && ctx.walker.seated !== seat) { on = false; ctx.zoom(false); ring.style.opacity = '0'; } });
  }
}

// The frieze: the animals of a painted cave, round the chamber's wall between 2.4 and 7.6 ft, painted on one long canvas
// and laid on a band that follows the rock a hair inside it (found by casting rays at the built cave from its middle).
function frieze(ctx, E, root) {
  const [ccx, ccz] = E.cave.centre, y0 = E.cave.fire[1] + 2.2, y1 = E.cave.fire[1] + 7.4, NA = 72, rows = [y0, (y0 + y1) / 2, y1];
  // Fit the paint to the chamber lining. The furniture and the island shell can
  // also intersect the room's bounds, but neither carries the painted animals.
  const targets = root.children.filter(m => m.isMesh && m.name === 'cliffrock' && m.userData.zone === 'shell:spanya');
  const ray = new THREE.Raycaster(); ray.far = 16;
  // the way in is toward -z (the plan's -X); the band leaves a gap there
  const gap = a => Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.95;      // (the passage's own walls are left bare)
  const pts = rows.map(y => Array.from({ length: NA + 1 }, (_, i) => { const a = i / NA * TAU, d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)); ray.set(new THREE.Vector3(ccx, y, ccz), d); const hit = ray.intersectObjects(targets, false).find(h => h.distance > 4); const dist = hit ? hit.distance - 0.12 : 8.6; return new THREE.Vector3(ccx + d.x * dist, y, ccz + d.z * dist); }));
  const pos = [], uv = [], idx = [], cols = rows.length;
  for (let i = 0; i <= NA; i++) for (let j = 0; j < cols; j++) { const p = pts[j][i]; pos.push(p.x, p.y, p.z); uv.push(i / NA, j / (cols - 1)); }
  for (let i = 0; i < NA; i++) { if (gap((i + 0.5) / NA * TAU)) continue; if (pts.some(row => row[i].z < 121.3 || row[i + 1].z < 121.3 || row[i].distanceTo(row[i + 1]) > 1.9)) continue; for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + cols; idx.push(a, b, a + 1, b, b + 1, a + 1); } }      // (only the chamber's wall, and nowhere the band would be dragged out along the rock)
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx); geo.computeVertexNormals();
  // the painting, with Lascaux's engine: aurochs, horses, stags, a few dots and signs; handprints either side of the way in
  const W = 3600, H = 520, c = document.createElement('canvas'); c.width = W; c.height = H; const g = makePainter(c.getContext('2d', { willReadFrequently: true }), W, H, 3105, 1);
  const herd = [[0.1, 0.55, 0.075, 'red', { horns: true }], [0.16, 0.5, 0.055, 'char', {}], [0.22, 0.6, 0.05, 'char', {}], [0.3, 0.45, 0.085, 'char', { horns: true }], [0.36, 0.62, 0.05, 'yellow', {}],
    [0.44, 0.5, 0.07, 'red', { antlers: true, flip: true }], [0.5, 0.58, 0.06, 'brown', { flip: true }], [0.57, 0.45, 0.09, 'char', { horns: true, flip: true }], [0.64, 0.62, 0.05, 'red', { flip: true }],
    [0.71, 0.5, 0.065, 'yellow', { antlers: true }], [0.78, 0.55, 0.08, 'red', { horns: true }], [0.85, 0.48, 0.05, 'char', {}], [0.9, 0.6, 0.055, 'brown', { flip: true }]];
  const skip = x => (x < 0.5 ? x * 0.66 : 0.67 + (x - 0.5) * 0.66);      // (clear of the way in, at the middle of the band)
  for (const [x, y, s, color, o] of herd) beast(g, skip(x), y, s, { color, w: 7 + s * 40, alpha: 0.6, ...o });
  for (let i = 0; i < 26; i++) g.dot(0.05 + g.rng() * 0.9, 0.15 + g.rng() * 0.2, 4 + g.rng() * 3, { color: g.rng() < 0.6 ? 'red' : 'char', alpha: 0.5 });
  for (const [x, y, s, rot, col] of [[0.655, 0.45, 0.022, -0.2, 'red'], [0.665, 0.66, 0.02, 0.3, 'rust'], [0.345, 0.42, 0.021, 0.15, 'red'], [0.335, 0.64, 0.02, -0.35, 'yellow']]) g.spray(x, y, s * 1.6, { color: col, excludePath: handPath(g, x, y + 0.03, s * 2.4, rot), density: 1.9, alpha: 0.5 });
  g.weather(0.8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'cave frieze'; mesh.renderOrder = 2; root.add(mesh);
  ctx.animated.push(time => { mat.color.setScalar(0.85 + 0.1 * Math.sin(time * 7.3) + 0.06 * Math.sin(time * 13.1 + 1)); });
}
