// laundry_parts.js: the pieces The Laundry and The Linen Closet are furnished with (laundry.js places them).
// Everything is built in a kit frame (x along, y out toward the front, z up) and goes in through K.put or the frame's
// own box/bev, so it is drawn with the room it stands in. One timber (honey oak), one metal (brass; the Sheila Maid's
// ends are black cast iron, as they always were), one paint (a soft willow green taken from the wallpaper's leaves).
import * as THREE from 'three';

export const M = {
  OAK: 'oak_light#c4a477',                                   // = the kit's HONEY: counters, shelves, the table, frames
  PAINT: 'c#c7d3b8', PAINT_D: 'c#a3b294', GROOVE: 'c#94a386',  // the dado and the cupboards: soft willow green
  WHITE: 'c#f2eee5/0.5',                                    // the window's casing and bars, the cornice
  ENAMEL: 'c#efe9dc/0.28', BRASS: 'c#b08d4a/0.35/1', IRON: 'c#2a2622/0.6/0.4',
  GLASS: 'glass', TILE: 'tile_subway#ebe7de',
  LINEN: 'linen#efe9dc', LINEN2: 'linen#efe9dc', BLUE: 'linen#7a93ad', TICK: 'linen#efe9dc',
  TOWEL: 'wool#eee8dc', TOWEL2: 'wool#c9b79a', WOOL: 'wool#c9b79a', WOOL2: 'wool#8f9f86', WOOL3: 'wool#8f9f86',
  WICKER: 'wicker', CORD: 'c#d9cdb2/0.9', DARK: 'c#3a342e/0.7', CERAM: 'c#e9e3d6/0.3', CREAM: 'c#ece2c8/0.3',
};
const TAU = Math.PI * 2;
const ROUT = { rx: -Math.PI / 2 };                               // a lathe (axis z) turned to point out of a wall (+y)

// ---- a plate with a round hole in it (the machines' fronts), x0..x1 by z0..z1, from y0 to y1 ----------------------
export function holePlate(K, fr, mat, x0, x1, z0, z1, y0, y1, hx, hz, r) {
  const sh = new THREE.Shape([new THREE.Vector2(x0, z0), new THREE.Vector2(x1, z0), new THREE.Vector2(x1, z1), new THREE.Vector2(x0, z1)]);
  const hole = new THREE.Path(); hole.absarc(hx, hz, r, 0, TAU, true); sh.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false, curveSegments: 22 }); g.rotateX(Math.PI / 2); g.translate(0, y1, 0);
  K.put(fr, mat, g.index ? g.toNonIndexed() : g);
}

// ---- a front-loading machine under the counter -----------------------------------------------------------------------
// at x of a frame on the wall (front +y at 2.0). Cream enamel, a brass-ringed glass door, a brass dial, a pilot lamp.
// Returns where its door's middle and its pilot lamp are, in the frame (for laundry_fx.js).
export function machine(K, fr, x, kind) {
  const E = M.ENAMEL, zc = 1.3, R = 0.6;
  fr.box(E, x - 1.08, x + 1.08, 0.15, 0.6, 0.1, 2.8);                                    // the case: its back, sides, top and floor (open in front, round the drum)
  for (const sx of [-1, 1]) fr.box(E, sx > 0 ? x + 1.03 : x - 1.08, sx > 0 ? x + 1.08 : x - 1.03, 0.6, 1.96, 0.1, 2.8);
  fr.box(E, x - 1.03, x + 1.03, 0.6, 1.96, 2.72, 2.8); fr.box(E, x - 1.03, x + 1.03, 0.6, 1.96, 0.1, 0.18);
  fr.box('c#2e2c2a/0.6', x - 1.03, x + 1.03, 0.6, 0.64, 0.18, 2.72);                     // dark inside, behind the drum
  holePlate(K, fr, E, x - 1.1, x + 1.1, 0.1, 2.8, 1.95, 2.0, x, zc, R);
  fr.box(M.DARK, x - 1.0, x + 1.0, 0.3, 1.9, 0.0, 0.1);                                    // the plinth, set back
  fr.box(E, x - 1.08, x + 1.08, 1.97, 2.04, 2.34, 2.78);                                 // the control band, standing proud
  fr.box(M.BRASS, x - 1.08, x + 1.08, 2.03, 2.05, 2.32, 2.35);                            // a brass line under it
  K.put(fr, M.BRASS, K.geom.lathe([[0, 0], [0.15, 0], [0.15, 0.03], [0.12, 0.05], [0.09, 0.09], [0, 0.09]], { seg: 16 }), { ...ROUT, at: [x + (kind === 'dryer' ? -0.55 : 0.55), 2.04, 2.56] });
  K.put(fr, M.DARK, K.geom.sweep([[0, 2.12, 2.56 - 0.1], [0, 2.12, 2.56 + 0.1]], 0.018, { seg: 4 }), { at: [x + (kind === 'dryer' ? -0.55 : 0.55), 0, 0] });
  K.put(fr, M.BRASS, K.geom.lathe([[0.03, 0], [0.06, 0], [0.06, 0.03], [0.03, 0.03]], { seg: 12 }), { ...ROUT, at: [x + (kind === 'dryer' ? 0.2 : -0.2), 2.04, 2.56] });     // the pilot lamp's bezel
  for (const dx of [0.05, 0.25]) K.put(fr, M.BRASS, K.geom.lathe([[0, 0], [0.05, 0], [0.05, 0.02], [0, 0.02]], { seg: 10 }), { ...ROUT, at: [x + (kind === 'dryer' ? 0.5 : -0.5) + dx, 2.04, 2.56] });
  // the door: a brass ring and a domed glass
  K.put(fr, M.BRASS, K.geom.lathe([[R + 0.01, 0], [R + 0.17, 0], [R + 0.19, 0.04], [R + 0.15, 0.11], [R + 0.03, 0.11], [R - 0.01, 0.06]], { seg: 32 }), { ...ROUT, at: [x, 2.0, zc] });
  K.put(fr, M.GLASS, K.geom.lathe([[R + 0.02, 0.05], [R - 0.06, 0.12], [R * 0.6, 0.17], [0, 0.185]], { seg: 24 }), { ...ROUT, at: [x, 2.0, zc] });
  K.put(fr, M.BRASS, K.geom.sweep([[x + R + 0.12, 2.13, zc - 0.25], [x + R + 0.2, 2.2, zc - 0.2], [x + R + 0.2, 2.2, zc + 0.2], [x + R + 0.12, 2.13, zc + 0.25]], 0.025, { seg: 6 }));     // the handle
  for (const dz of [-0.35, 0.35]) fr.box(M.BRASS, x - R - 0.24, x - R - 0.12, 2.0, 2.09, zc + dz - 0.08, zc + dz + 0.08);      // hinges
  fr.block(x - 1.1, x + 1.1, 0, 2.1, 0, 2.8);
  return { door: [x, 2.0, zc], r: R - 0.02, lamp: [x + (kind === 'dryer' ? 0.2 : -0.2), 2.07, 2.56] };
}

// ---- boards round a wall: a tongue-and-groove dado with a skirting and a cap rail --------------------------------
// on a wall frame from x0 to x1 (x along the wall), to height top
export function dado(fr, x0, x1, top = 3.45) {
  fr.box(M.PAINT, x0, x1, 0.005, 0.1, 0.02, top);
  for (let x = Math.ceil((x0 + 0.08) / 0.3) * 0.3; x < x1 - 0.08; x += 0.3) fr.box(M.GROOVE, x - 0.008, x + 0.008, 0.1, 0.106, 0.45, top - 0.02);
  fr.bev(M.PAINT_D, x0, x1, 0.005, 0.15, 0.0, 0.42, 0.012, { grain: 'x' });
  fr.bev(M.PAINT_D, x0, x1, 0.005, 0.17, top, top + 0.14, 0.02, { grain: 'x' });
}

// ---- wicker -------------------------------------------------------------------------------------------------------
// a rounded-oblong basket w by d by h at (x, y, z) of a frame, hollow, a rolled rim, two rope handles; fill: a mat for a
// soft top of folded linen showing in it (or null)
export function basket(K, fr, x, y, z, w, d, h, fill = null, o = {}) {
  const a = w / 2, b = d / 2, k = o.taper ?? 0.9, t = 0.04;
  const rows = [{ a: a * k - 0.04, b: b * k - 0.04, z: 0 }, { a: a * k, b: b * k, z: 0.03 }, { a, b, z: h }, { a: a + 0.02, b: b + 0.02, z: h + 0.03 }, { a: a - t, b: b - t, z: h + 0.04 }, { a: a * k - t, b: b * k - t, z: 0.06 }, { a: 0.001, b: 0.001, z: 0.06 }];
  K.put(fr, M.WICKER, K.geom.loft(rows, { seg: 14, e: 4 }), { at: [x, y, z], rz: o.turn ?? 0 });
  if (fill) fr.sub(x, y, z, 0).cushion(fill, -a + 0.08, a - 0.08, -b + 0.08, b - 0.08, h - 0.22, h - 0.02 + (o.heap ?? 0.06), 0.06, { crown: 0.05, bulge: 0.02 });
  if (o.handles !== false) for (const s of [-1, 1]) K.put(fr, M.CORD, K.geom.sweep([[s * (a + 0.01), -0.12, h - 0.12], [s * (a + 0.06), 0, h - 0.04], [s * (a + 0.01), 0.12, h - 0.12]], 0.018, { seg: 5 }), { at: [x, y, z], rz: o.turn ?? 0 });
}
// a tall round lidded hamper
export function hamper(K, fr, x, y, r = 0.7, h = 2.0) {
  K.put(fr, M.WICKER, K.geom.lathe([[r * 0.85, 0], [r, 0.12], [r * 1.02, h * 0.7], [r * 0.96, h], [0, h]], { seg: 20 }), { at: [x, y, 0] });
  K.put(fr, M.WICKER, K.geom.lathe([[r * 1.03, h - 0.02], [r * 1.05, h + 0.06], [r * 0.7, h + 0.16], [0, h + 0.2]], { seg: 20 }), { at: [x, y, 0] });
  K.put(fr, M.WICKER, K.geom.lathe([[0.08, 0], [0.09, 0.06], [0.04, 0.1], [0, 0.11]], { seg: 10 }), { at: [x, y, h + 0.19] });
  fr.block(x - r, x + r, y - r, y + r, 0, h);
}

// ---- a glass jar with what is in it, and a brass screw lid ---------------------------------------------------------
export function jar(K, fr, x, y, z, h, r, fill, level = 0.75) {
  K.put(fr, fill, K.geom.lathe([[0, 0.02], [r - 0.025, 0.02], [r - 0.025, h * level], [0, h * level + 0.02]], { seg: 14 }), { at: [x, y, z] });
  K.put(fr, M.GLASS, K.geom.lathe([[0, 0], [r, 0], [r, h * 0.86], [r * 0.82, h * 0.92], [r * 0.82, h], [0, h]], { seg: 16 }), { at: [x, y, z] });
  K.put(fr, M.BRASS, K.geom.lathe([[r * 0.86, h - 0.02], [r * 0.88, h + 0.05], [0, h + 0.06]], { seg: 14 }), { at: [x, y, z] });
}
// a stoneware jug
export function jug(K, fr, x, y, z, h = 0.75, mat = M.CERAM) {
  K.put(fr, mat, K.geom.lathe([[0, 0], [0.2, 0], [0.26, h * 0.35], [0.22, h * 0.75], [0.17, h * 0.9], [0.2, h], [0.17, h], [0.14, h * 0.9], [0, h * 0.85]], { seg: 16 }), { at: [x, y, z] });
  K.put(fr, mat, K.geom.sweep([[0.2, 0, z + h * 0.82], [0.36, 0, z + h * 0.7], [0.33, 0, z + h * 0.35], [0.24, 0, z + h * 0.25]], 0.03, { seg: 5 }), { at: [x, y, 0] });
}

// ---- shelves -------------------------------------------------------------------------------------------------------
// open oak shelving standing against a wall: w wide, d deep, the boards at zs, uprights at the ends (and every bay)
export function shelving(fr, w, d, zs, tall, bays = 2) {
  const t = 0.1;
  for (let i = 0; i <= bays; i++) { const x = -w / 2 + (w - t) * i / bays; fr.bev(M.OAK, x, x + t, 0.02, d, 0, tall, 0.012, { grain: 'z' }); }
  fr.bev(M.OAK, -w / 2 + t, w / 2 - t, 0.04, d - 0.04, 0, zs[0] - 0.08, 0.01, { grain: 'x' });      // the plinth
  for (const z of zs) fr.bev(M.OAK, -w / 2 + t - 0.005, w / 2 - t + 0.005, 0.03, d - 0.01, z - 0.08, z, 0.012, { grain: 'x' });
  fr.bev(M.OAK, -w / 2 - 0.04, w / 2 + 0.04, 0.02, d + 0.04, tall, tall + 0.09, 0.015, { grain: 'x' });
  fr.block(-w / 2, w / 2, 0, d, 0, tall);
  return (i) => -w / 2 + t + (w - t) * (i + 0.5) / bays - t / 2;      // the middle of bay i
}

// ---- a Shaker peg rail and what hangs on it -------------------------------------------------------------------------
export function pegRail(K, fr, x0, x1, z, pegs) {
  fr.bev(M.OAK, x0, x1, 0.005, 0.08, z - 0.17, z + 0.17, 0.015, { grain: 'x' });
  for (const x of pegs) K.put(fr, M.OAK, K.geom.lathe([[0.045, 0], [0.035, 0.14], [0.05, 0.19], [0.05, 0.24], [0.02, 0.27], [0, 0.27]], { seg: 10 }), { ...ROUT, at: [x, 0.08, z] });
}
// a linen apron hung by its neck strap from a peg at (x, z): a bib, a full skirt, a pocket, the ties hanging
export function apron(K, fr, x, z, mat) {
  const top = z - 0.5, out = [[-0.32, top], [0.32, top], [0.36, top - 0.75], [0.78, top - 0.85], [0.72, top - 2.55], [-0.72, top - 2.55], [-0.78, top - 0.85], [-0.36, top - 0.75]];
  K.put(fr, mat, K.geom.extrude(out.map(([a, b]) => [x + a, b]), 0.14, 0.17));
  K.put(fr, mat, K.geom.extrude([[-0.25, top - 1.45], [0.25, top - 1.45], [0.25, top - 1.95], [-0.25, top - 1.95]].map(([a, b]) => [x + 0.1 + a, b]), 0.17, 0.185));      // the pocket
  K.put(fr, mat, K.geom.sweep([[x - 0.3, 0.155, top], [x - 0.12, 0.2, z + 0.02], [x, 0.26, z + 0.06], [x + 0.12, 0.2, z + 0.02], [x + 0.3, 0.155, top]], 0.018, { seg: 4 }));
  for (const s of [-1, 1]) K.put(fr, mat, K.geom.sweep([[x + s * 0.76, 0.16, top - 0.9], [x + s * 0.7, 0.2, top - 1.5], [x + s * 0.74, 0.19, top - 2.1]], 0.02, { seg: 4 }));
}
// a string bag on a peg, lemons in it
export function stringBag(K, fr, x, z) {
  const net = [], n = 9, bot = z - 1.35, mid = z - 1.05;
  for (let i = 0; i < n; i++) { const a = i / n * TAU, rx = Math.cos(a) * 0.3, ry = Math.sin(a) * 0.17 + 0.3; net.push(K.geom.sweep([[x, 0.2, z - 0.05], [x + rx * 0.4, ry, z - 0.5], [x + rx, ry, mid], [x + rx * 0.6, ry, bot + 0.05], [x, 0.3, bot]], 0.006, { seg: 3 })); }
  for (const zz of [mid + 0.12, mid - 0.12]) { const ring = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * TAU; ring.push([x + Math.cos(a) * 0.29, 0.3 + Math.sin(a) * 0.17, zz]); } net.push(K.geom.sweep(ring, 0.006, { seg: 3 })); }
  K.put(fr, M.CORD, K.geom.merge(net));
  for (const [dx, dz] of [[-0.12, -1.2], [0.12, -1.18], [0, -1.02]]) K.put(fr, 'c#e3c34a/0.6', K.geom.lathe([[0, -0.11], [0.06, -0.1], [0.1, -0.04], [0.1, 0.04], [0.06, 0.1], [0, 0.12]], { seg: 10, sy: 0.85 }), { at: [x + dx, 0.3, z + dz] });
}
// an oak washboard hung by its top
export function washboard(K, fr, x, z) {
  const w = 1.05, h = 2.1, top = z - 0.12;
  for (const s of [-1, 1]) fr.bev(M.OAK, x + s * w / 2 - 0.05, x + s * w / 2 + 0.05, 0.05, 0.13, top - h, top, 0.01, { grain: 'z' });
  fr.bev(M.OAK, x - w / 2 + 0.05, x + w / 2 - 0.05, 0.06, 0.12, top - 0.42, top, 0.01, { grain: 'x' });
  fr.bev(M.OAK, x - w / 2 + 0.05, x + w / 2 - 0.05, 0.06, 0.12, top - h + 0.25, top - h + 0.4, 0.01, { grain: 'x' });
  const ribs = []; for (let zz = top - 0.5; zz > top - h + 0.45; zz -= 0.075) ribs.push(K.geom.sweep([[x - w / 2 + 0.05, 0.09, zz], [x + w / 2 - 0.05, 0.09, zz]], 0.024, { seg: 5 }));
  K.put(fr, M.OAK, K.geom.merge(ribs));
}

// ---- the ironing board, standing along a wall, with the iron on it ---------------------------------------------------
// frame on the wall; the board runs along x (its point toward +x), its middle y out from the wall
export function ironingBoard(K, fr, y, len = 4.2, top = 2.95) {
  const half = len / 2, wd = 0.58, sh = new THREE.Shape();
  sh.moveTo(-half, y - wd); sh.lineTo(half - 1.2, y - wd); sh.quadraticCurveTo(half - 0.2, y - wd * 0.7, half, y); sh.quadraticCurveTo(half - 0.2, y + wd * 0.7, half - 1.2, y + wd); sh.lineTo(-half, y + wd); sh.lineTo(-half, y - wd);
  const pad = new THREE.ExtrudeGeometry(sh, { depth: 0.09, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.03, bevelSegments: 2, curveSegments: 8 }); pad.translate(0, 0, top - 0.11);
  K.put(fr, M.TICK, pad.index ? pad.toNonIndexed() : pad);
  // the legs: two crossed pairs of oak
  const legs = []; for (const s of [-1, 1]) { const yy = y + s * 0.38; legs.push(K.geom.sweep([[-1.25, yy, 0], [0.85, yy, top - 0.12]], 0.04, { seg: 6 }), K.geom.sweep([[0.95, yy, 0], [-1.15, yy, top - 0.12]], 0.04, { seg: 6 })); }
  legs.push(K.geom.sweep([[-1.25, y - 0.38, 0.03], [-1.25, y + 0.38, 0.03]], 0.035, { seg: 6 }), K.geom.sweep([[0.95, y - 0.38, 0.03], [0.95, y + 0.38, 0.03]], 0.035, { seg: 6 }));
  K.put(fr, M.OAK, K.geom.merge(legs));
  // a pillowcase half pressed, and the iron on its heel
  fr.cushion(M.LINEN, -0.6, 0.6, y - 0.42, y + 0.36, top - 0.01, top + 0.025, 0.01, { crown: 0.003 });
  const ix = -1.4, iy = y, s2 = new THREE.Shape(); s2.moveTo(-0.32, -0.19); s2.lineTo(0.12, -0.19); s2.quadraticCurveTo(0.4, -0.08, 0.46, 0); s2.quadraticCurveTo(0.4, 0.08, 0.12, 0.19); s2.lineTo(-0.32, 0.19); s2.lineTo(-0.32, -0.19);
  const sole = new THREE.ExtrudeGeometry(s2, { depth: 0.05, bevelEnabled: false, curveSegments: 6 }); K.put(fr, 'c#bdb8ae/0.3/1', sole.index ? sole.toNonIndexed() : sole, { at: [ix, iy, top + 0.01], rz: Math.PI });
  const body = new THREE.ExtrudeGeometry(s2, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2, curveSegments: 6 }); body.scale(0.88, 0.85, 1); K.put(fr, M.CREAM, body.index ? body.toNonIndexed() : body, { at: [ix - 0.02, iy, top + 0.06], rz: Math.PI });
  K.put(fr, M.OAK, K.geom.sweep([[ix + 0.2, iy, top + 0.22], [ix + 0.18, iy, top + 0.42], [ix - 0.15, iy, top + 0.42], [ix - 0.25, iy, top + 0.24]], 0.04, { seg: 6 }));
  fr.block(-half, half, y - wd, y + wd, 0, top);
}

// ---- the folding table: honey oak, turned-square legs, a linen pad on top, a slatted shelf of baskets ----------------
export function foldingTable(K, fr, w, d, top = 3.0) {
  const hw = w / 2, hd = d / 2, T = top - 0.12;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) fr.bev(M.OAK, sx * hw - (sx > 0 ? 0.22 : 0) + (sx < 0 ? 0.0 : 0), sx * hw + (sx < 0 ? 0.22 : 0), sy * hd - (sy > 0 ? 0.22 : 0), sy * hd + (sy < 0 ? 0.22 : 0), 0, T, 0.02, { grain: 'z' });
  for (const sy of [-1, 1]) fr.bev(M.OAK, -hw + 0.22, hw - 0.22, sy * hd - (sy > 0 ? 0.12 : -0.04), sy * hd - (sy > 0 ? 0.04 : -0.12), T - 0.45, T, 0.012, { grain: 'x' });
  for (const sx of [-1, 1]) fr.bev(M.OAK, sx * hw - (sx > 0 ? 0.12 : -0.04), sx * hw - (sx > 0 ? 0.04 : -0.12), -hd + 0.22, hd - 0.22, T - 0.45, T, 0.012, { grain: 'y' });
  fr.bev(M.OAK, -hw - 0.08, hw + 0.08, -hd - 0.08, hd + 0.08, T, T + 0.1, 0.02, { grain: 'x' });
  fr.cushion(M.LINEN2, -hw + 0.06, hw - 0.06, -hd + 0.06, hd - 0.06, T + 0.1, top + 0.03, 0.03, { crown: 0.006 });
  for (let i = 0; i < 6; i++) { const y = -hd + 0.25 + i * (d - 0.5) / 5; fr.bev(M.OAK, -hw + 0.18, hw - 0.18, y - 0.11, y + 0.11, 0.42, 0.5, 0.01, { grain: 'x' }); }
  for (const sy of [-1, 1]) fr.bev(M.OAK, -hw + 0.18, hw - 0.18, sy * hd - (sy > 0 ? 0.18 : -0.06), sy * hd - (sy > 0 ? 0.06 : -0.18), 0.34, 0.42, 0.01, { grain: 'x' });
  fr.block(-hw - 0.08, hw + 0.08, -hd - 0.08, hd + 0.08, 0, top);
  return { top: top + 0.03, shelf: 0.5 };
}

// ---- the Sheila Maid: an airer of five oak rails between cast-iron ends, hauled up on a rope over two pulleys ----------
// in a frame whose x runs along the rails; rails at height z; ceil: the ceiling (above the frame); toWall: the x where
// the ropes come down the wall (beyond the rails' -x end) and cleat: the cleat's height there
export function sheilaMaid(K, fr, len, z, ceil, toWall, cleat) {
  const ys = [-0.6, -0.3, 0, 0.3, 0.6], ends = [-len / 2 + 0.25, len / 2 - 0.25];
  K.put(fr, M.OAK, K.geom.merge(ys.map(y => K.geom.sweep([[-len / 2, y, z], [len / 2, y, z]], 0.038, { seg: 6, caps: true }))));
  const iron = [];
  for (const x of ends) {
    iron.push(K.geom.sweep([[x, -0.72, z], [x, 0.72, z]], 0.03, { seg: 5 }));
    iron.push(K.geom.sweep([[x, -0.72, z], [x, -0.62, z + 0.18], [x, -0.36, z + 0.32], [x, 0, z + 0.4], [x, 0.36, z + 0.32], [x, 0.62, z + 0.18], [x, 0.72, z]], 0.022, { seg: 5 }));
    iron.push(K.geom.sweep([[x, -0.3, z + 0.02], [x, -0.18, z + 0.2], [x, -0.04, z + 0.12], [x, -0.12, z + 0.06]], 0.016, { seg: 4 }), K.geom.sweep([[x, 0.3, z + 0.02], [x, 0.18, z + 0.2], [x, 0.04, z + 0.12], [x, 0.12, z + 0.06]], 0.016, { seg: 4 }));
    iron.push(K.geom.sweep(Array.from({ length: 9 }, (_, i) => { const a = i / 8 * TAU; return [x, Math.sin(a) * 0.06, z + 0.47 + Math.cos(a) * 0.06]; }), 0.014, { seg: 4 }));
    // the pulley at the ceiling, on a little plate
    iron.push(K.geom.lathe([[0, 0], [0.13, 0], [0.13, 0.04], [0, 0.04]], { seg: 10 }).translate(x, 0, ceil - 0.075));
    iron.push(K.geom.lathe([[0.02, -0.04], [0.12, -0.04], [0.1, 0], [0.12, 0.04], [0.02, 0.04]], { seg: 12 }).rotateX(Math.PI / 2).translate(x, 0, ceil - 0.2));
    iron.push(K.geom.sweep([[x, 0, ceil - 0.075], [x, 0, ceil - 0.12]], 0.02, { seg: 4 }));
  }
  K.put(fr, M.IRON, K.geom.merge(iron));
  // the ropes: up from each end over its pulley, along under the ceiling to the wall, down the wall to the cleat
  const rope = [];
  ends.forEach((x, i) => { const yy = i ? 0.035 : -0.035, zr = ceil - 0.2 - 0.12; rope.push(K.geom.sweep([[x, yy, z + 0.47], [x, yy, zr], [x - 0.12, yy, ceil - 0.08], [toWall + 0.15, yy, ceil - 0.1], [toWall + 0.04, yy, ceil - 0.25], [toWall + 0.04, yy, cleat + 0.25]], 0.014, { seg: 4 })); });
  K.put(fr, M.CORD, K.geom.merge(rope));
  // the cleat, and the rope's end wound on it and hanging
  K.put(fr, M.IRON, K.geom.merge([K.geom.sweep([[toWall + 0.03, 0, cleat - 0.18], [toWall + 0.08, 0, cleat], [toWall + 0.03, 0, cleat + 0.18]], 0.025, { seg: 5 }), K.geom.sweep([[toWall + 0.01, 0, cleat - 0.08], [toWall + 0.01, 0, cleat + 0.08]], 0.04, { seg: 5 })]));
  K.put(fr, M.CORD, K.geom.sweep([[toWall + 0.09, -0.03, cleat + 0.12], [toWall + 0.1, 0.04, cleat - 0.1], [toWall + 0.09, 0.02, cleat - 0.4], [toWall + 0.1, 0.05, cleat - 0.75]], 0.016, { seg: 4 }));
  return { rails: ys, z };
}

// ---- a cream bakelite wireless of the thirties: an arched case, a cloth grille, a dial, two knobs ----------------------
export function radio(K, fr, x, y, z) {
  const w = 0.95, d = 0.5, h = 0.72, out = [];
  for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; out.push([Math.cos(a) * w / 2, h - 0.22 + Math.sin(a) * 0.22]); }
  out.push([-w / 2, 0], [w / 2, 0]);
  K.put(fr, M.CREAM, K.geom.extrude(out.map(([a, b]) => [x + a, z + b]), y - d / 2, y + d / 2, { bevel: 0.02 }));
  const grille = []; for (let i = 0; i <= 10; i++) { const a = Math.PI * i / 10; grille.push([x + Math.cos(a) * 0.3, z + 0.36 + Math.sin(a) * 0.2]); } grille.push([x - 0.3, z + 0.18], [x + 0.3, z + 0.18]);
  K.put(fr, 'c#b49a6c/0.95', K.geom.extrude(grille, y + d / 2, y + d / 2 + 0.012));
  fr.box(M.BRASS, x - 0.3, x + 0.3, y + d / 2, y + d / 2 + 0.01, z + 0.07, z + 0.14);
  for (const s of [-1, 1]) K.put(fr, 'c#5a3f2a/0.4', K.geom.lathe([[0, 0], [0.06, 0], [0.06, 0.05], [0, 0.06]], { seg: 10 }), { ...ROUT, at: [x + s * 0.38, y + d / 2, z + 0.11] });
}

// ---- the window over the sink: a painted casing, an oak sill, the bars, the blind's rail and cord ----------------------
// on the wall frame, its middle at x: opening ow by oh with its sill at z0 (the view itself is laundry_fx.js's)
export function windowFrame(K, fr, x, z0, ow, oh, blindAt) {
  const c = 0.26, p = 0.08, z1 = z0 + oh;
  fr.bev(M.WHITE, x - ow / 2 - c, x - ow / 2, 0.0, p, z0 - 0.1, z1 + 0.02, 0.01, { grain: 'z' });
  fr.bev(M.WHITE, x + ow / 2, x + ow / 2 + c, 0.0, p, z0 - 0.1, z1 + 0.02, 0.01, { grain: 'z' });
  fr.bev(M.WHITE, x - ow / 2 - c - 0.02, x + ow / 2 + c + 0.02, 0.0, p, z1, z1 + 0.26, 0.01, { grain: 'x' });
  fr.bev(M.WHITE, x - ow / 2 - c - 0.07, x + ow / 2 + c + 0.07, 0.0, p + 0.06, z1 + 0.26, z1 + 0.34, 0.012, { grain: 'x' });
  fr.bev(M.OAK, x - ow / 2 - c - 0.06, x + ow / 2 + c + 0.06, 0.0, 0.1, z0 - 0.1, z0, 0.012, { grain: 'x' });      // the sill (shallow: the tap stands just in front of it)
  fr.bev(M.WHITE, x - ow / 2 - c, x + ow / 2 + c, 0.0, 0.06, z0 - 0.32, z0 - 0.1, 0.008, { grain: 'x' });         // the apron under it
  // the bars: a mullion and a transom below the blind; the frame's own inner edge
  const bar = [[x - 0.03, x + 0.03, z0, blindAt], [x - ow / 2, x + ow / 2, z0 + (blindAt - z0) * 0.48 - 0.03, z0 + (blindAt - z0) * 0.48 + 0.03]];
  for (const [a0, a1, b0, b1] of bar) fr.box(M.WHITE, a0, a1, 0.0, 0.05, b0, b1);
  for (const [a0, a1, b0, b1] of [[x - ow / 2, x - ow / 2 + 0.07, z0, z1], [x + ow / 2 - 0.07, x + ow / 2, z0, z1], [x - ow / 2, x + ow / 2, z0, z0 + 0.07]]) fr.box(M.WHITE, a0, a1, 0.0, 0.06, b0, b1);
  // the blind's bottom rail and its cord and ring
  K.put(fr, M.OAK, K.geom.sweep([[x - ow / 2 + 0.06, 0.07, blindAt], [x + ow / 2 - 0.06, 0.07, blindAt]], 0.025, { seg: 6, caps: true }));
  K.put(fr, M.CORD, K.geom.sweep([[x + ow / 2 - 0.25, 0.08, blindAt], [x + ow / 2 - 0.25, 0.09, blindAt - 0.75]], 0.008, { seg: 3 }));
  K.put(fr, M.BRASS, K.geom.sweep(Array.from({ length: 11 }, (_, i) => { const a = i / 10 * TAU; return [x + ow / 2 - 0.25 + Math.sin(a) * 0.06, 0.09, blindAt - 0.81 + Math.cos(a) * 0.06]; }), 0.01, { seg: 4 }));
}

// ---- a laylight: an oak coffer hung under the boards, glazing bars across it (the glass is laundry_fx.js's) ------------
// in a plan frame (q 0) at its middle: w by d, the ceiling at ceil; returns the panes [[x0, x1, y0, y1]] and the glass's height
export function laylightFrame(fr, w, d, ceil, nx = 3, ny = 2) {
  const dep = 0.42, b = 0.3, bar = 0.07, hw = w / 2, hd = d / 2, zg = ceil - 0.16;
  for (const [x0, x1, y0, y1] of [[-hw, hw, -hd, -hd + b], [-hw, hw, hd - b, hd], [-hw, -hw + b, -hd + b, hd - b], [hw - b, hw, -hd + b, hd - b]]) fr.bev(M.OAK, x0, x1, y0, y1, ceil - dep, ceil - 0.01, 0.015);
  for (const [x0, x1, y0, y1] of [[-hw - 0.06, hw + 0.06, -hd - 0.06, -hd + 0.02], [-hw - 0.06, hw + 0.06, hd - 0.02, hd + 0.06], [-hw - 0.06, -hw + 0.02, -hd, hd], [hw - 0.02, hw + 0.06, -hd, hd]]) fr.bev(M.OAK, x0, x1, y0, y1, ceil - dep - 0.06, ceil - dep + 0.04, 0.012);
  const iw = w - 2 * b, id = d - 2 * b, panes = [];
  for (let i = 1; i < nx; i++) { const x = -hw + b + iw * i / nx; fr.box(M.OAK, x - bar / 2, x + bar / 2, -hd + b, hd - b, zg - 0.1, zg - 0.005); }
  for (let j = 1; j < ny; j++) { const y = -hd + b + id * j / ny; fr.box(M.OAK, -hw + b, hw - b, y - bar / 2, y + bar / 2, zg - 0.1, zg - 0.005); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) panes.push([-hw + b + iw * i / nx, -hw + b + iw * (i + 1) / nx, -hd + b + id * j / ny, -hd + b + id * (j + 1) / ny]);
  return { panes, zg, inner: [-hw + b, hw - b, -hd + b, hd - b] };
}

// ---- a broom, a carpet beater and a dustpan, hung from pegs ---------------------------------------------------------
export function broom(K, fr, x, z) {
  K.put(fr, M.OAK, K.geom.sweep([[x, 0.2, z - 0.05], [x, 0.2, z - 4.0]], 0.05, { seg: 6, caps: true }));
  K.put(fr, M.IRON, K.geom.sweep(Array.from({ length: 9 }, (_, i) => { const a = i / 8 * TAU; return [x + Math.sin(a) * 0.05, 0.2, z + 0.02 + Math.cos(a) * 0.07]; }), 0.008, { seg: 3 }));
  const head = []; for (let i = 0; i < 7; i++) { const a = (i - 3) * 0.07; head.push(K.geom.sweep([[x, 0.2, z - 4.0], [x + Math.sin(a) * 0.5, 0.2 + (i % 2) * 0.03, z - 4.7]], (r) => 0.06 + r * 0.06, { seg: 5 })); }
  K.put(fr, 'c#b9995a/0.95', K.geom.merge(head));
  K.put(fr, 'c#a4402e/0.6', K.geom.sweep([[x, 0.2, z - 3.95], [x, 0.2, z - 4.08]], 0.075, { seg: 8, caps: true }));
}
export function beater(K, fr, x, z) {
  const pts = [[x, 0.16, z - 0.05], [x, 0.16, z - 1.1]];
  for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU * 1.5; const rr = 0.32 + 0.12 * Math.sin(a * 2); pts.push([x + Math.sin(a) * rr, 0.16 + (i % 3) * 0.01, z - 1.55 + Math.cos(a) * rr * 1.25]); }
  K.put(fr, 'c#c8a46a/0.8', K.geom.sweep(pts, 0.022, { seg: 4 }));
  K.put(fr, 'c#a4402e/0.6', K.geom.sweep([[x, 0.16, z - 0.15], [x, 0.16, z - 0.7]], 0.035, { seg: 6, caps: true }));
}
export function dustpan(K, fr, x, z) {
  fr.box('c#5d6b58/0.5/0.3', x - 0.4, x + 0.4, 0.05, 0.08, z - 0.9, z - 0.2);
  K.put(fr, 'c#5d6b58/0.5/0.3', K.geom.sweep([[x, 0.08, z - 0.2], [x, 0.08, z + 0.1]], 0.03, { seg: 5 }));
  K.put(fr, M.OAK, K.geom.sweep([[x + 0.6, 0.1, z - 0.05], [x + 0.6, 0.1, z - 0.7]], 0.04, { seg: 6, caps: true }));
  K.put(fr, 'c#b9995a/0.95', K.geom.sweep([[x + 0.6, 0.12, z - 0.7], [x + 0.6, 0.12, z - 1.05]], (r) => 0.06 + r * 0.04, { seg: 6 }));
}
// a step stool: two treads on splayed oak sides
export function stepStool(fr, x, y) {
  for (const s of [-1, 1]) fr.bev(M.OAK, x + s * 0.62 - 0.05, x + s * 0.62 + 0.05, y - 0.55, y + 0.55, 0, 1.9, 0.01, { grain: 'z' });
  fr.bev(M.OAK, x - 0.68, x + 0.68, y - 0.55, y + 0.15, 1.85, 1.95, 0.015, { grain: 'x' });
  fr.bev(M.OAK, x - 0.68, x + 0.68, y - 0.15, y + 0.6, 0.9, 1.0, 0.015, { grain: 'x' });
  fr.block(x - 0.7, x + 0.7, y - 0.6, y + 0.6, 0, 1.95);
}

// ---- a folded stack of linen or towels: each fold a softly chamfered board (44 triangles, where the kit's soft fold is
// several hundred: the closet holds sixty of them)
export function stack(K, fr, x, y, z, n, mats, o = {}) {
  const w = o.w ?? 1.1, d = o.d ?? 0.8, t = o.t ?? 0.16;
  let h = z, s = Math.round(Math.abs(x * 97 + y * 31 + z * 13)) + 7; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const tt = t * (0.88 + rnd() * 0.24), dx = (rnd() - 0.5) * 0.06, dy = (rnd() - 0.5) * 0.05;
    K.put(fr, mats[i % mats.length], K.geom.bev(-w / 2, w / 2, -d / 2, d / 2, 0, tt, Math.min(tt * 0.42, 0.06)), { rz: (rnd() - 0.5) * 0.05, at: [x + dx, y + dy, h] });
    h += tt - 0.004;
  }
  return h;
}
