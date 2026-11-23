// up_east_parts.js: the pieces the Quiet Room, the Dressing Room and the East Suite are furnished with (up_east.js
// places them). The language is notes/STYLE.md: dark warm wood, mid-century and a little Scandinavian, low and
// horizontal, wool, linen and sheepskin, amber light from hidden coves and paper shades.
// Every builder works in a kit frame (x along the piece, y out toward its front, z up) and goes in through K.put or
// the frame's own methods, so it is drawn with the room it stands in.
import { burningLogs, storedLogs } from '../kit/firewood.js';
import * as THREE from 'three';
import { merge } from '../kit/geom.js';
export { merge };

// ---- materials: few families, so few draw calls ------------------------------------------------------------
export const M = {
  TEAK: 'oak_light#b9875a', TEAKD: 'oak_light#8a5e3c', WAL: 'walnut', WALD: 'oak_light#9a7048', OAKP: 'oak_light#d2b48a',
  BRASS: 'c#b48c46/0.3/1', IRON: 'c#232120/0.55/0.6', BLACK: 'c#1c1a19/0.6/0.3', GLASS: 'glass', WATER: 'c#6f8f8a/0.06',
  STONE: 'limestone_smooth#9c968c', SLATE: 'c#3a3c3e/0.7', SOOT: 'c#1a1512/0.95', CHINA: 'c#f1ece2/0.2', CLAY: 'c#8a5a3e/0.6',
  CREAM: 'linen#e8e0cf', OAT: 'linen#cbbc9f', GREEN: 'wool#3c5a44', OCHRE: 'wool#b98a36', RUST: 'wool#9a4a2a', CHAR: 'wool#3a3836',
  SHEEP: 'wool#f2ece0', SHEEP2: 'wool#d9cdb6', LEATHER: 'leather#6b4228', CANE: 'wicker', TATAMI: 'tatami',
  SHADE: 'shade', LINING: 'e#ffe2b4/1.7', COVE: 'e#ffb866/1.25', BULB: 'e#fff4e0/3', EMBER: 'e#ff8a3a/2.2',
  LEAF: 'c#3f5a35/0.7', LEAF2: 'c#5a7040/0.7', TWIG: 'c#4a3828/0.8',
};

// ---- small geometry ---------------------------------------------------------------------------------------------
export const vessel = (K, f, mat, x, y, z, prof, seg = 16, o = {}) => K.put(f, mat, K.geom.lathe(prof, { seg, ...o }), { at: [x, y, z], rx: o.rx, rz: o.rz });
export const tube = (K, f, mat, path, r, seg = 5) => K.put(f, mat, K.geom.sweep(path, r, { seg }));
export const ball = (K, f, mat, x, y, z, r, s = [1, 1, 1], seg = 10) => K.put(f, mat, new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))).scale(...s), { at: [x, y, z] });
// a cylinder lying along x, centred at (x, y, z) (a bolster, a log, a rolled towel); rz turns it about z
export function roll(K, f, mat, x, y, z, r, len, o = {}) {
  const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? 12, 1, false); g.rotateZ(Math.PI / 2); if (o.rz) g.rotateZ(o.rz);
  K.put(f, mat, g, { at: [x, y, z] });
}
// SOFT THINGS (STYLE.md, "No primitives where a guest looks closely"): the kit's pillow, never a box.
// A pad: a pillow filling x0..x1, y0..y1, z0..z1 of a frame (a mattress, a seat cushion), crowned and welted at its seam
export function pad(K, f, mat, x0, x1, y0, y1, z0, z1, o = {}) {
  const g = K.geom.pillow(x1 - x0, y1 - y0, z1 - z0, { n: o.n ?? 10, pinch: o.pinch ?? 0.035, lump: o.lump ?? 0.012, dent: o.dent ?? 0.02, rng: rng((x0 + y0 * 7 + z0 * 13) * 101) });
  K.put(f, mat, g, { at: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2] });
}
// A pad tipped up (a back or head cushion): w along x, d along y, t thick, hinged at its foot edge (-x side by default
// for ry, -y side for rx), its foot at (x, y, z)
export function tiltedPad(K, f, mat, w, d, t, at, rot) {
  const g = K.geom.pillow(w, d, t, { n: 9, pinch: 0.04, lump: 0.012, dent: 0.02, rng: rng(at[0] * 31 + at[1] * 7) });
  if (rot.ry !== undefined) g.translate(-w / 2, 0, t / 2); else g.translate(0, d / 2, t / 2);
  K.put(f, mat, g, { ry: rot.ry, rx: rot.rx, at });
}
// A bolster: a round cushion lying along x (rz turns it), its ends gathered into a button
export function bolster(K, f, mat, x, y, z, r, len, o = {}) {
  const L = len / 2, P = [[0, -L + 0.01], [r * 0.35, -L], [r * 0.8, -L + r * 0.18], [r * 0.97, -L + r * 0.55], [r, -L + r], [r * 1.01, 0], [r, L - r], [r * 0.97, L - r * 0.55], [r * 0.8, L - r * 0.18], [r * 0.35, L], [0, L - 0.01]];
  const g = K.geom.lathe(P, { seg: 16, mod: (t, j) => (j <= 2 || j >= 8 ? 1 + 0.06 * Math.sin(t * 10) : 1) });
  g.rotateY(Math.PI / 2); if (o.rz) g.rotateZ(o.rz);
  K.put(f, mat, g, { at: [x, y, z] });
  if (o.button !== false) for (const sx of [-1, 1]) { const b = new THREE.SphereGeometry(r * 0.16, 8, 6).scale(0.5, 1, 1).translate(sx * (L + 0.005), 0, 0); if (o.rz) b.rotateZ(o.rz); K.put(f, o.buttonMat ?? mat, b, { at: [x, y, z] }); }
}
// a lamp that glows (a halo after dark) but casts no light: the brief allows each room one lamp
export function glowAt(K, f, x, y, z, halo = 0.6) { K.lampAt(f, x, y, z, 0.5); const l = K.lamps[K.lamps.length - 1]; l.kind = 'glow'; l.halo = halo; }
// a tapered square leg from (x, y) at the floor to z, splayed outward by (sx, sy)
function leg(K, f, mat, x, y, z, r = 0.07, sx = 0, sy = 0) { K.put(f, mat, K.geom.sweep([[x + sx, y + sy, 0], [x, y, z]], t => r * (0.65 + 0.35 * t), { seg: 6 })); }

// =================================================================================================================
// LAMPS AND SMALL TABLES
// =================================================================================================================
// A PH-style lamp (after Poul Henningsen's PH 4/3, 1927): three nested opal shades over a bulb, on a brass stem.
export function phLamp(K, f, x, y, z, o = {}) {
  const s = o.s ?? 1, base = o.base ?? M.BRASS;
  vessel(K, f, base, x, y, z, [[0, 0], [0.24 * s, 0], [0.25 * s, 0.03 * s], [0.2 * s, 0.06 * s], [0, 0.07 * s]], 18);
  vessel(K, f, base, x, y, z, [[0.02 * s, 0.06 * s], [0.02 * s, 1.05 * s], [0, 1.06 * s]], 6);
  // the three shades: a wide low one, a middle one, a small top one (each a thin lathe, opal outside, glowing inside)
  for (const [r0, r1, z0, z1] of [[0.62, 0.3, 0.98, 1.2], [0.42, 0.18, 1.16, 1.36], [0.24, 0.05, 1.32, 1.5]]) {
    const prof = [[r0 * s, z0 * s], [(r0 * 0.6 + r1 * 0.4) * s, (z0 * 0.4 + z1 * 0.6) * s], [r1 * s, z1 * s]];
    vessel(K, f, M.SHADE, x, y, z, prof, 22);
    vessel(K, f, M.LINING, x, y, z, prof.map(([r, h]) => [r * 0.97, h - 0.01]), 18, { flip: true });
  }
  ball(K, f, M.BULB, x, y, z + 1.08 * s, 0.07 * s, [1, 1, 1.3], 8);
  glowAt(K, f, x, y, z + 1.1 * s, o.halo ?? 0.6);
}
// A paper lantern lamp (after Noguchi's Akari): a column of washi on a fine frame, on three thin legs
export function paperLamp(K, f, x, y, z, o = {}) {
  const h = o.h ?? 1.5, r = o.r ?? 0.42, feet = o.feet ?? 0.25, n = 9, prof = [];
  for (let i = 0; i <= n; i++) { const t = i / n; prof.push([r * (0.82 + 0.18 * Math.sin(t * Math.PI)) * (1 + 0.025 * (i % 2)), feet + h * t]); }
  vessel(K, f, M.SHADE, x, y, z, prof, 20);
  vessel(K, f, M.LINING, x, y, z, prof.map(([q, hh]) => [q * 0.96, hh]), 14, { flip: true });
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; tube(K, f, M.BLACK, [[x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, z], [x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, z + feet + 0.1]], 0.012, 4); }
  glowAt(K, f, x, y, z + feet + h * 0.5, o.halo ?? 0.8);
}
// A low round (or oval) timber side table on three splayed legs; returns the top's height
export function lowTable(K, f, x, y, o = {}) {
  const r = o.r ?? 0.75, h = o.h ?? 1.7, sy = o.oval ?? 1, mat = o.mat ?? M.TEAK;
  vessel(K, f, mat, x, y, h - 0.08, [[0, 0], [r - 0.03, 0], [r, 0.03], [r, 0.06], [r - 0.02, 0.08], [0, 0.08]], 28, { sy });
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + (o.a ?? 0.3); leg(K, f, mat, x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55 * sy, h - 0.08, 0.05, Math.cos(a) * 0.18, Math.sin(a) * 0.18); }
  if (o.shelf) vessel(K, f, mat, x, y, h * 0.35, [[0, 0], [r * 0.62, 0], [r * 0.62, 0.05], [0, 0.05]], 20, { sy });
  f.block(x - r, x + r, y - r * sy, y + r * sy, 0, 1.6);
  return h;
}
// A tumbler of water, a little dish, a book or two: what is on every bedside table
export function bedside(K, f, x, y, z, o = {}) {
  vessel(K, f, M.GLASS, x + 0.28, y + 0.12, z, [[0, 0], [0.1, 0], [0.11, 0.34], [0.105, 0.34], [0, 0.03]], 12);
  vessel(K, f, M.WATER, x + 0.28, y + 0.12, z + 0.02, [[0, 0], [0.095, 0], [0.1, 0.22], [0, 0.22]], 10);
  if (o.book !== false) K.bookStack(f, x - 0.25, y + 0.2, z, o.n ?? 2, { subject: o.subject ?? 'poetry' });
  if (o.dish) vessel(K, f, M.CLAY, x + 0.05, y - 0.3, z, [[0, 0], [0.13, 0], [0.17, 0.05], [0.16, 0.06], [0, 0.02]], 12);
}
// A sheepskin lying on the floor or a seat: a soft, irregular pelt (rx/rz to lay it over something)
export function sheepskin(K, f, x, y, z, w = 2.4, d = 1.7, o = {}) {
  const g = K.geom.pillow(w, d, 0.13, { n: 12, pinch: 0.22, lump: 0.035, rng: rng(x * 13 + y * 7 + (o.ph ?? 0)) });
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const a = Math.atan2(p.getY(i) / d, p.getX(i) / w), k = 1 + 0.09 * Math.sin(a * 5 + (o.ph ?? 0)) + 0.06 * Math.sin(a * 11 + 1.3) + 0.03 * Math.sin(a * 23);
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) + 0.012 * Math.sin(p.getX(i) * 17) * Math.sin(p.getY(i) * 13)); }
  g.computeVertexNormals();
  K.put(f, o.mat ?? M.SHEEP, g, { at: [x, y, z + 0.065], rz: o.rz ?? 0, rx: o.rx ?? 0 });
}
// A branch of something green in a stoneware bottle: the room's one ikebana
export function branch(K, f, x, y, z, o = {}) {
  const s = o.s ?? 1, rnd = rng(o.seed ?? 3);
  vessel(K, f, o.pot ?? M.CLAY, x, y, z, [[0, 0], [0.16 * s, 0], [0.22 * s, 0.2 * s], [0.2 * s, 0.5 * s], [0.08 * s, 0.68 * s], [0.07 * s, 0.8 * s], [0.09 * s, 0.82 * s], [0, 0.82 * s]], 16);
  const lean = o.lean ?? 0.6, tall = (o.tall ?? 2.4) * s, P = t => [x + Math.sin(lean) * tall * t * t * 0.8, y + 0.1 * t, z + 0.8 * s + Math.cos(lean * 0.6) * tall * t];
  tube(K, f, M.TWIG, [P(0), P(0.3), P(0.6), P(1)], 0.018 * s, 4);
  const leaves = [];
  for (let i = 0; i < 26; i++) {
    const t = 0.25 + 0.75 * rnd(), [bx, by, bz] = P(t), a = rnd() * 6.28, L = (0.12 + 0.1 * rnd()) * s;
    leaves.push(K.geom.bev(-L, L, -0.02, 0.02, -0.04 * s, 0.04 * s, 0.01).rotateZ(a).rotateY(rnd() - 0.5).translate(bx + Math.cos(a) * L * 0.8, by + Math.sin(a) * L * 0.8, bz));
  }
  K.put(f, o.leaf ?? M.LEAF, merge(leaves));
}
const rng = seed => { let k = (Math.abs(Math.floor(seed * 9301 + 49297)) % 2147483646) + 1; return () => ((k = (k * 16807) % 2147483647) / 2147483647); };


// =================================================================================================================
// DAYBEDS: one family, five hands. Each lies along its frame's x, its middle at the origin, its front toward +y,
// the head at -x. Each returns the height of its top, for the lie spot.
// =================================================================================================================
// After Børge Mogensen's Spoke-Back sofa (1945): an oak frame, arms and back of turned spokes, a long box cushion.
export function spokeback(K, f, o = {}) {
  const len = o.len ?? 6.6, w = o.w ?? 2.9, hl = len / 2, hw = w / 2, wood = o.wood ?? M.OAKP, fab = o.fabric ?? M.OAT, z1 = 0.78, top = 1.5;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(wood, sx * hl - 0.08 - (sx > 0 ? 0.04 : -0.04), sx * hl + 0.08 - (sx > 0 ? 0.04 : -0.04), sy * hw - 0.08, sy * hw + 0.08, 0, sy < 0 ? 2.75 : 2.05, 0.02, { grain: 'z' });
  for (const sy of [-1, 1]) f.bev(wood, -hl, hl, sy * hw - 0.06, sy * hw + 0.06, z1 - 0.2, z1, 0.02);
  for (const sx of [-1, 1]) { f.bev(wood, sx * hl - 0.06 - sx * 0.04, sx * hl + 0.06 - sx * 0.04, -hw, hw, z1 - 0.2, z1, 0.02); f.bev(wood, sx * hl - 0.07 - sx * 0.04, sx * hl + 0.07 - sx * 0.04, -hw, hw + 0.04, 1.95, 2.09, 0.025); }
  f.bev(wood, -hl - 0.04, hl + 0.04, -hw - 0.08, -hw + 0.07, 2.62, 2.78, 0.03);
  const sp = [];
  for (const sx of [-1, 1]) for (let i = 1; i < 6; i++) { const y = -hw + (w * i) / 6, x = sx * (hl - 0.04); sp.push(K.geom.sweep([[x, y, z1], [x, y, 1.95]], 0.024, { seg: 6 })); }
  for (let i = 1; i < 22; i++) { const x = -hl + (len * i) / 22; sp.push(K.geom.sweep([[x, -hw, z1], [x, -hw - 0.02, 2.62]], 0.022, { seg: 6 })); }
  K.put(f, wood, merge(sp));
  // the cushion: a long box cushion and two loose ones against the spokes
  pad(K, f, fab, -hl + 0.12, hl - 0.12, -hw + 0.12, hw - 0.04, z1 - 0.05, top + 0.05);
  for (const [x, c] of [[-1.6, o.c1 ?? M.GREEN], [0.3, o.c2 ?? M.OCHRE]]) K.cushion(f, x, -hw + 0.45, top, 1.5, 1.2, c, { tilt: 0.35 });
  bolster(K, f, o.bolster ?? M.CREAM, -hl + 0.45, 0.05, top + 0.24, 0.24, w - 0.4, { rz: Math.PI / 2 });
  f.block(-hl - 0.1, hl + 0.1, -hw - 0.1, hw + 0.1, 0, 1.6);
  return top;
}
// After Finn Juhl's chaise longues: a sculpted teak frame on splayed legs, the upholstered body floating above it, the
// head end raised.
export function juhlChaise(K, f, o = {}) {
  const len = o.len ?? 6.4, w = o.w ?? 2.6, hl = len / 2, hw = w / 2, wood = o.wood ?? M.TEAK, fab = o.fabric ?? M.OCHRE, z0 = 0.95, top = 1.42, hinge = -hl + 2.3;
  for (const sy of [-1, 1]) {
    K.put(f, wood, K.geom.sweep([[-hl, sy * hw, z0 + 0.25], [-hl + 1.5, sy * hw, z0 - 0.02], [hl - 0.9, sy * hw, z0 - 0.05], [hl, sy * hw, z0 + 0.08]], t => 0.07 - 0.02 * Math.sin(t * 3), { seg: 6 }));
    for (const [x, dx] of [[-hl + 0.6, -0.22], [hl - 0.7, 0.22]]) leg(K, f, wood, x, sy * (hw - 0.05), z0 - 0.02, 0.08, dx, sy * 0.12);
    // arm boards at the head end, a Juhl wing
    K.put(f, wood, K.geom.bev(-hl + 0.3, -hl + 2.4, sy * hw - 0.07, sy * hw + 0.07, 1.85, 1.97, 0.03, { grain: 'x' }));
    leg(K, f, wood, -hl + 2.2, sy * hw, 1.86, 0.04, 0.02, 0);
  }
  for (const x of [-hl + 0.5, 0, hl - 0.4]) f.bev(wood, x - 0.06, x + 0.06, -hw, hw, z0 - 0.15, z0 - 0.02, 0.015);
  pad(K, f, fab, hinge - 0.05, hl - 0.08, -hw + 0.06, hw - 0.06, z0, top + 0.06);
  tiltedPad(K, f, fab, 2.25, w - 0.14, 0.46, [hinge, 0, z0 + 0.02], { ry: 0.5 });
  bolster(K, f, o.bolster ?? M.CHAR, hinge - 1.4, 0, top + 0.86, 0.21, w - 0.45, { rz: Math.PI / 2 });
  f.block(-hl, hl, -hw - 0.1, hw + 0.1, 0, 1.6);
  return top;
}
// After Hans Wegner's GE 258 daybed (Getama, 1954): a plain oak frame on tapered legs, a slatted headrest that tilts
// up, a mattress and a bolster; a sheepskin thrown along it.
export function geDaybed(K, f, o = {}) {
  const len = o.len ?? 6.5, w = o.w ?? 2.8, hl = len / 2, hw = w / 2, wood = o.wood ?? M.OAKP, fab = o.fabric ?? M.GREEN, z1 = 0.95, top = 1.38;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) leg(K, f, wood, sx * (hl - 0.25), sy * (hw - 0.2), z1 - 0.1, 0.08, sx * 0.05, sy * 0.05);
  for (const sy of [-1, 1]) f.bev(wood, -hl, hl, sy * hw - 0.07, sy * hw + 0.07, z1 - 0.3, z1, 0.025);
  for (const sx of [-1, 1]) f.bev(wood, sx * hl - 0.07, sx * hl + 0.07, -hw, hw, z1 - 0.3, z1, 0.025);
  for (let x = -hl + 0.3; x < hl - 0.2; x += 0.45) f.bev(wood, x, x + 0.22, -hw + 0.07, hw - 0.07, z1 - 0.12, z1 - 0.06, 0.01);
  // the headrest: a slatted board tilted up on its hinge, its cushion over it
  const hb = -hl + 2.0;
  K.put(f, wood, K.geom.bev(-1.9, 0, -hw + 0.08, hw - 0.08, 0, 0.06, 0.01), { ry: 0.45, at: [hb, 0, z1 - 0.04] });
  pad(K, f, fab, hb - 0.05, hl - 0.06, -hw + 0.05, hw - 0.05, z1 - 0.04, top + 0.04);
  tiltedPad(K, f, fab, 1.95, w - 0.12, 0.42, [hb, 0, z1 + 0.02], { ry: 0.45 });
  bolster(K, f, o.bolster ?? M.OCHRE, hb - 1.2, 0, top + 0.82, 0.21, w - 0.45, { rz: Math.PI / 2 });
  sheepskin(K, f, 0.9, 0.1, top + 0.01, 2.3, 2.0, { ph: 1.3 });
  f.block(-hl, hl, -hw, hw, 0, 1.6);
  return top;
}
// A low walnut platform with a tatami top and a futon on it, as in a ryokan: a buckwheat pillow, a folded blanket
export function futonPlatform(K, f, o = {}) {
  const len = o.len ?? 7, w = o.w ?? 4, hl = len / 2, hw = w / 2, z1 = 0.62, top = z1 + 0.42;
  f.bev(o.wood ?? M.WALD, -hl, hl, -hw, hw, 0.12, z1, 0.03);
  f.box(M.BLACK, -hl + 0.25, hl - 0.25, -hw + 0.25, hw - 0.25, 0, 0.13);                   // a shadow gap: the platform floats
  f.box(M.TATAMI, -hl + 0.1, hl - 0.1, -hw + 0.1, hw - 0.1, z1, z1 + 0.04);
  f.cushion(o.fabric ?? M.CREAM, -hl + 0.3, hl - 0.4, -hw + 0.35, hw - 0.35, z1 + 0.04, top, 0.14, { crown: 0.04, welt: 0.01 });
  f.cushion(M.OAT, -hl + 0.45, -hl + 1.6, -0.75, 0.75, top - 0.02, top + 0.3, 0.13, { crown: 0.06 });
  K.foldedStack(f, hl - 1.2, -0.5, top, 1, [o.blanket ?? M.RUST], { w: 1.8, d: 1.3, t: 0.22 });
  f.block(-hl, hl, -hw, hw, 0, 1.6);
  return top;
}
// A wool blanket folded across the foot of a daybed (frame of the daybed; foot at +x)
export function footBlanket(K, f, hl, hw, top, mat) {
  K.throwBlanket(f, hl - 2.0, hl - 0.6, -hw - 0.02, hw + 0.02, top + 0.02, mat, { over: 'foot', rho: 0.1 });
}

// =================================================================================================================
// THE FIRE: a plain stone breast with a raised slate hearth and logs stacked under it; the fire itself as the Hall's
// =================================================================================================================
// f: a wall frame on the face of the wall (y into the room), x along the wall. Returns where the fire burns (in f).
export function fireBreast(K, f, o = {}) {
  const W = o.w ?? 6.4, D = o.d ?? 1.8, H = o.tall ?? 9.95, ox = o.ox ?? 1.6, z0 = 1.35, z1 = 3.75, S = o.stone ?? 'rubble';
  const a = W / 2;
  f.box(S, -a, -ox, 0.02, D, 0, H); f.box(S, ox, a, 0.02, D, 0, H); f.box(S, -ox, ox, 0.02, D, z1, H); f.box(S, -ox, ox, 0.02, D - 0.03, 0, z0 - 0.33);
  // the firebox: soot inside, an iron lintel, a slate floor
  f.box(M.SOOT, -ox + 0.03, ox - 0.03, 0.04, 0.1, z0 - 0.27, z1 - 0.03); f.box(M.SOOT, -ox + 0.03, -ox + 0.1, 0.12, D - 0.07, z0 - 0.27, z1 - 0.03); f.box(M.SOOT, ox - 0.1, ox - 0.03, 0.12, D - 0.07, z0 - 0.27, z1 - 0.03); f.box(M.SOOT, -ox + 0.12, ox - 0.12, 0.12, D - 0.07, z1 - 0.11, z1 - 0.03);
  f.box(M.IRON, -ox - 0.05, ox + 0.05, D - 0.06, D + 0.02, z1 - 0.12, z1 + 0.06);
  // the hearth: a long slate slab standing out from the breast, a seat to warm your back on; logs stacked under one end
  const ha = a + (o.hearth ?? 1.8), HD = D + 1.0;
  f.bev(o.hearthMat ?? M.SLATE, -ha, ha, 0.02, HD, z0 - 0.3, z0 - 0.06, 0.015);
  f.box(S, -ha + 0.05, -ha + 0.35, 0.05, HD - 0.1, 0, z0 - 0.3); f.box(S, -a, a, 0.05, HD - 0.4, 0, z0 - 0.3);
  const columns = Math.max(1, Math.floor((ha-a-.15)/.27));
  storedLogs(K, f, (ha+a)/2, HD/2, 0, HD-.5, .13, columns, 3);
  f.block(-ha, ha, 0, HD, 0, z0);
  f.block(-a, a, 0, D, 0, H);
  return { x: 0, y: (D + 0.15) / 2, z: z0 - 0.3 + 0.06 };
}
export function lightFire(f, X, Y, h, alongX, alongY, makeFlames, mergeGeometries, NOISE, scale = 1) {
  const lamp = f.lamp(X, Y, h + 1.4, { power: 0.9, kind: 'candle' });
  f.later(ctx => {
    const THREE_ = ctx.THREE; lamp.kind = 'fire';
    const o = f.world(X, Y, h), x1 = f.world(X + alongX, Y + alongY, h), dx = [x1.x - o.x, x1.z - o.z];
    const hearth = new THREE_.Group(); hearth.position.set(o.x, o.y, o.z); hearth.rotation.y = Math.atan2(-dx[1], dx[0]); hearth.scale.setScalar(scale);
    const uT = { value: 0 };
    hearth.add(makeFlames(THREE_, mergeGeometries, uT, [[0, 0, 0, 1.7, 1.5, 0], [0, 0.2, 0.14, 1.4, 1.25, 3.7], [0, -0.18, -0.12, 1.25, 1.1, 8.1]], 0.1));
    hearth.add(burningLogs(ctx.materials.bark, 1.65, .70));
    const embers = new THREE_.Mesh(new THREE_.PlaneGeometry(1.6, 0.8).rotateX(-Math.PI / 2), new THREE_.ShaderMaterial({
      uniforms: { uT }, transparent: true, depthWrite: false, blending: THREE_.AdditiveBlending, fog: false,
      vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uT; varying vec2 vUv;
${NOISE}
void main() {
  vec2 d = (vUv - 0.5) * 2.0; float edge = 1.0 - smoothstep(0.45, 1.0, length(d));
  float coals = smoothstep(0.42, 0.75, noise(vUv * vec2(16.0, 8.0))), breath = 0.55 + 0.45 * fbm(vUv * 4.0 + vec2(uT * 0.35, -uT * 0.2));
  gl_FragColor = vec4(mix(vec3(0.9, 0.12, 0.01), vec3(1.0, 0.55, 0.12), coals * breath) * (0.25 + coals) * breath * edge, 1.0);
}`,
    }));
    embers.position.set(0, 0.03, 0); hearth.add(embers);
    hearth.traverse(n => { n.userData.cat = 'fire'; });
    ctx.scene.add(hearth); ctx.track(hearth, ctx.zoneAt(o.x, o.y + 0.5, o.z, 0.4));
    ctx.animated.push(t => { uT.value = t; });
  });
}

// =================================================================================================================
// THE RECORD WALL: a long low cabinet with the hi-fi on it, two speakers, shelves of records lit from under each shelf
// =================================================================================================================
// f: a wall frame (y into the room). x0..x1 along the wall.
export function recordWall(K, f, x0, x1, o = {}) {
  const wood = o.wood ?? M.TEAK, d = 1.45, ch = 2.1, rnd = rng(o.seed ?? 7);
  // the cabinet: on a recessed black plinth, sliding doors of teak, a top
  f.box(M.BLACK, x0 + 0.2, x1 - 0.2, 0.05, d - 0.25, 0, 0.35);
  f.box(wood, x0, x1, 0.04, d - 0.04, 0.35, ch - 0.08);
  f.bev(wood, x0 - 0.04, x1 + 0.04, 0.03, d, ch - 0.08, ch, 0.015, { grain: 'x' });
  const nd = Math.round((x1 - x0) / 2.4);
  for (let i = 0; i < nd; i++) { const a = x0 + 0.05 + ((x1 - x0 - 0.1) * i) / nd, b = x0 + 0.05 + ((x1 - x0 - 0.1) * (i + 1)) / nd - 0.03; f.bev(i % 2 ? M.TEAKD : wood, a, b, d - 0.06, d - 0.02, 0.42, ch - 0.14, 0.008, { grain: 'z' }); f.box(M.BRASS, (a + b) / 2 - 0.25, (a + b) / 2 + 0.25, d - 0.02, d + 0.005, ch - 0.42, ch - 0.38); }
  f.block(x0, x1, 0, d, 0, ch);
  // on it: a turntable (lid up), an amplifier with two lit dials, a small stack of sleeves
  const tx = (x0 + x1) / 2 - 1.2, T = ch;
  f.bev(M.TEAKD, tx - 0.85, tx + 0.85, 0.2, 1.3, T, T + 0.3, 0.02);
  vessel(K, f, M.BLACK, tx - 0.15, 0.75, T + 0.3, [[0, 0], [0.5, 0], [0.5, 0.04], [0, 0.04]], 24);
  vessel(K, f, 'c#8a2a22/0.5', tx - 0.15, 0.75, T + 0.34, [[0, 0], [0.15, 0], [0.15, 0.005], [0, 0.005]], 16);
  tube(K, f, 'c#c8c4b8/0.25/1', [[tx + 0.6, 1.05, T + 0.42], [tx + 0.55, 0.65, T + 0.4], [tx + 0.25, 0.55, T + 0.38]], 0.012, 4);
  K.put(f, M.GLASS, K.geom.bev(tx - 0.83, tx + 0.83, 0, 0.03, 0, 1.0, 0.005), { rx: -0.35, at: [0, 0.22, T + 0.32] });
  const ax = (x0 + x1) / 2 + 1.0;
  f.bev(M.BLACK, ax - 0.75, ax + 0.75, 0.3, 1.25, T, T + 0.45, 0.02);
  f.box('c#c8c4b8/0.25/1', ax - 0.72, ax + 0.72, 1.25, 1.27, T + 0.02, T + 0.43);
  for (const dx of [-0.35, 0.35]) f.box(M.COVE, ax + dx - 0.2, ax + dx + 0.2, 1.27, 1.285, T + 0.18, T + 0.36);
  for (const dx of [-0.55, -0.1, 0.1, 0.55]) vessel(K, f, 'c#c8c4b8/0.25/1', ax + dx * 1.15, 1.29, T + 0.1, [[0, 0], [0.04, 0], [0.04, 0.03], [0, 0.03]], 8, { rx: -Math.PI / 2 });
  // the speakers, standing either end of the cabinet on low plinths: teak boxes, wool fronts
  for (const sx of [x0 - 1.45, x1 + 0.15]) {
    f.box(M.BLACK, sx + 0.15, sx + 1.15, 0.15, 1.05, 0, 0.4);
    f.bev(wood, sx, sx + 1.3, 0.05, 1.2, 0.4, 3.4, 0.03);
    f.box(M.CHAR, sx + 0.1, sx + 1.2, 1.2, 1.23, 0.55, 3.25);
    f.block(sx, sx + 1.3, 0, 1.2, 0, 3.4);
  }
  // the shelves of records above, each lit from a strip under its front
  const sh = o.shelves ?? [3.2, 4.45, 5.7, 6.95], sd = 1.15;
  for (const sx of [x0, x1]) f.bev(wood, sx - 0.06, sx + 0.06, 0.03, sd, sh[0] - 0.1, sh[sh.length - 1] + 1.15, 0.01, { grain: 'z' });
  f.box(M.WALD, x0 + 0.06, x1 - 0.06, 0.02, 0.06, sh[0], sh[sh.length - 1] + 1.15);
  const sleeves = [[], [], [], [], []], COLS = ['c#2d2a28/0.8', 'c#d8cdb6/0.8', 'c#6a3a26/0.8', 'c#3c4a4a/0.8', 'c#9a7a3e/0.8'];
  for (const z of sh) {
    f.bev(wood, x0 + 0.06, x1 - 0.06, 0.04, sd, z - 0.07, z, 0.01, { grain: 'x' });
    f.box(M.COVE, x0 + 0.1, x1 - 0.1, sd - 0.12, sd - 0.06, z - 0.085, z - 0.075);
    // the records: sleeves standing on edge, in runs, some leaning, now and then one turned face-out
    for (let x = x0 + 0.15; x < x1 - 0.2;) {
      if (rnd() < 0.008) { const c = Math.floor(rnd() * 5); sleeves[c].push(K.geom.bev(x, x + 1.03, 0.25, 0.28, z + 0.01, z + 1.04, 0.004).rotateX(0).translate(0, 0, 0)); x += 1.12; continue; }
      const c = Math.floor(rnd() * 5), t = 0.012 + rnd() * 0.012;
      sleeves[c].push(K.geom.bev(x, x + t, 0.08, 1.06, z + 0.01, z + 1.04, 0.002));
      x += t + 0.004 + (rnd() < 0.04 ? 0.25 : 0);
    }
  }
  sleeves.forEach((list, i) => { if (list.length) K.put(f, COLS[i], merge(list)); });
}

// =================================================================================================================
// THE TEA TROLLEY: teak and brass, two trays, a teapot under a cosy, cups, a kettle
// =================================================================================================================
export function teaTrolley(K, f, o = {}) {
  const w = 2.6, d = 1.5, h = 2.7, a = w / 2, wood = o.wood ?? M.TEAK;
  for (const sx of [-1, 1]) {
    for (const sy of [0.08, d - 0.08]) f.bev(wood, sx * (a - 0.08) - 0.05, sx * (a - 0.08) + 0.05, sy - 0.05, sy + 0.05, 0.25, h, 0.01, { grain: 'z' });
    K.put(f, wood, K.geom.sweep([[sx * (a - 0.05), 0.08, h + 0.05], [sx * (a + 0.2), d / 2, h + 0.1], [sx * (a - 0.05), d - 0.08, h + 0.05]], 0.03, { seg: 6 }));
  }
  for (const sy of [0.08, d - 0.08]) for (const sx of [-1, 1]) { vessel(K, f, M.BLACK, sx * (a - 0.08), sy, 0.06, [[0, -0.06], [0.12, -0.04], [0.12, 0.04], [0, 0.06]], 10, { rx: Math.PI / 2 }); }
  for (const z of [0.75, h - 0.06]) { f.bev(wood, -a, a, 0, d, z - 0.06, z, 0.015, { grain: 'x' }); f.box(wood, -a, a, 0, 0.04, z, z + 0.15); f.box(wood, -a, a, d - 0.04, d, z, z + 0.15); }
  f.block(-a - 0.2, a + 0.2, 0, d, 0, h + 0.2);
  // on top: the teapot (a Japanese iron pot), four cups, a lidded caddy; below, a kettle and folded napkins
  const T = h;
  vessel(K, f, M.IRON, -0.6, d / 2, T, [[0, 0], [0.24, 0], [0.32, 0.12], [0.33, 0.24], [0.27, 0.36], [0.12, 0.4], [0.13, 0.44], [0.04, 0.47], [0, 0.48]], 16);
  tube(K, f, M.IRON, [[-0.88, d / 2, T + 0.2], [-1.03, d / 2, T + 0.32], [-1.08, d / 2, T + 0.38]], 0.035);
  tube(K, f, M.BRASS, [[-0.85, d / 2, T + 0.4], [-0.6, d / 2, T + 0.75], [-0.35, d / 2, T + 0.4]], 0.015);
  for (let i = 0; i < 4; i++) vessel(K, f, M.CHINA, 0.05 + (i % 2) * 0.35, 0.45 + Math.floor(i / 2) * 0.55, T, [[0, 0], [0.08, 0], [0.12, 0.05], [0.14, 0.2], [0.13, 0.2], [0, 0.03]], 12);
  vessel(K, f, 'c#3c5a44/0.4', 0.95, 0.75, T, [[0, 0], [0.16, 0], [0.16, 0.4], [0.17, 0.42], [0.17, 0.5], [0, 0.5]], 14);
  vessel(K, f, M.BRASS, -0.5, d / 2, 0.75, [[0, 0], [0.3, 0], [0.33, 0.25], [0.25, 0.48], [0.08, 0.55], [0, 0.56]], 16);
  K.foldedStack(f, 0.55, d / 2, 0.75, 4, ['linen#efe8da', 'linen#d9cdb2'], { w: 0.9, d: 0.9, t: 0.06 });
  return T;
}

// =================================================================================================================
// THE DRESSING ROOM'S PIECES
// =================================================================================================================
// A bay of open wardrobe: slatted teak sides, a hanging rail lit from a strip under the shelf above it, a shelf of
// slippers at the foot. f: a wall frame; x0..x1 along the wall. Returns nothing; puts the clothes on.
export function wardrobeBay(K, f, x0, x1, o = {}) {
  const d = o.d ?? 2.0, H = o.tall ?? 8.2, wood = o.wood ?? M.TEAK, zr = 5.7;
  // the sides: slats
  for (const sx of [x0, x1]) for (let k = 0; k < 6; k++) { const y = 0.08 + k * (d - 0.16) / 5; f.bev(wood, sx - 0.05, sx + 0.05, y - 0.05, y + 0.05, 0.05, H, 0.012, { grain: 'z' }); }
  f.bev(wood, x0 - 0.06, x1 + 0.06, 0.02, d, H - 0.1, H, 0.015, { grain: 'x' });                // the top
  f.bev(wood, x0 + 0.05, x1 - 0.05, 0.02, d - 0.05, 6.75, 6.85, 0.012, { grain: 'x' });          // the shelf over the rail
  f.box(M.COVE, x0 + 0.1, x1 - 0.1, d - 0.35, d - 0.25, 6.73, 6.745);                             // its light, washing down over the clothes
  f.bev(wood, x0 + 0.05, x1 - 0.05, 0.05, d - 0.05, 0.28, 0.36, 0.012, { grain: 'x' });           // the slipper shelf
  tube(K, f, M.BRASS, [[x0 + 0.05, d / 2, zr], [x1 - 0.05, d / 2, zr]], 0.035, 8);
  if (o.clothes !== false) K.clothes(f, x0 + 0.1, x1 - 0.1, d / 2, zr, { kinds: o.kinds ?? ['coat', 'coat', 'dress'], colours: o.colours, gap: 0.12 });
  if (o.slippers) for (let i = 0; i < o.slippers; i++) K.slippers(f, x0 + 0.5 + i * ((x1 - x0 - 0.8) / Math.max(1, o.slippers - 1)), 0.75, 0.36, o.slipperCol?.[i % o.slipperCol.length]);
  f.block(x0 - 0.06, x1 + 0.06, 0, d, 0, H);
}
// Hats. A felt banya hat (the Russian bath's pointed felt cap with a turned-up brim), a turban, a top hat, a
// wide sun hat, a fez, a bowler; the kit's fedora, cloche and beanie besides.
export function hatOf(K, f, x, y, z, kind, mat, o = {}) {
  const P = {
    banya: [[0, 0], [0.3, 0], [0.32, 0.03], [0.3, 0.12], [0.24, 0.14], [0.2, 0.35], [0.1, 0.56], [0.02, 0.62], [0, 0.62]],
    top: [[0, 0], [0.36, 0], [0.37, 0.02], [0.34, 0.04], [0.22, 0.05], [0.21, 0.1], [0.22, 0.62], [0.2, 0.64], [0, 0.64]],
    sun: [[0, 0], [0.72, 0], [0.74, 0.02], [0.7, 0.05], [0.25, 0.08], [0.22, 0.14], [0.2, 0.3], [0.12, 0.35], [0, 0.36]],
    fez: [[0, 0], [0.2, 0], [0.18, 0.3], [0.16, 0.34], [0, 0.34]],
    bowler: [[0, 0], [0.3, 0.03], [0.32, 0.05], [0.28, 0.06], [0.22, 0.07], [0.23, 0.22], [0.17, 0.31], [0, 0.34]],
    turban: [[0, 0], [0.24, 0], [0.31, 0.08], [0.32, 0.18], [0.27, 0.3], [0.17, 0.36], [0.07, 0.4], [0, 0.41]],
  }[kind];
  if (!P) return K.hat(f, x, y, z, kind, mat, o);
  vessel(K, f, mat, x, y, z, P, kind === 'turban' ? 18 : 16, { sy: kind === 'sun' ? 0.92 : 0.9, mod: kind === 'turban' ? (t, j) => 1 + 0.05 * Math.sin(t * 3 + j * 1.7) : undefined, rz: o.turn, rx: o.tilt });
  if (kind === 'top' || kind === 'bowler') vessel(K, f, o.band ?? 'c#2a2420/0.8', x, y, z, kind === 'top' ? [[0.222, 0.07], [0.222, 0.16]] : [[0.232, 0.08], [0.232, 0.13]], 16, { sy: 0.9 });
  if (kind === 'fez') tube(K, f, 'c#1a1612/0.9', [[x, y, z + 0.34], [x + 0.08, y, z + 0.32], [x + 0.16, y, z + 0.12]], 0.012, 3);
  if (kind === 'turban' && o.jewel) ball(K, f, o.jewel, x, y + 0.29, z + 0.22, 0.04, [1, 0.5, 1.2], 8);
}
// A plain big mirror on the wall: a thin teak frame, a long glass. f: a wall frame; centred at x, its foot at z0
export function bigMirror(K, f, x, z0, w, h, o = {}) {
  const a = w / 2, b = 0.12, wood = o.wood ?? M.TEAKD;
  f.box(wood, x - a - b, x + a + b, 0.02, 0.16, z0 - b, z0); f.box(wood, x - a - b, x + a + b, 0.02, 0.16, z0 + h, z0 + h + b);
  f.box(wood, x - a - b, x - a, 0.02, 0.16, z0, z0 + h); f.box(wood, x + a, x + a + b, 0.02, 0.16, z0, z0 + h);
  f.box('c#a9b2b4/0.12', x - a, x + a, 0.06, 0.1, z0, z0 + h);
}
// A dressing table with a three-leaf mirror lined in bulbs, as in a theatre's dressing room: teak, a shallow drawer,
// the leaves' outer two folded in a little. f: a wall frame; centred at its origin. Returns the top's height.
export function vanity(K, f, o = {}) {
  const w = o.w ?? 5, d = 1.7, h = 2.5, a = w / 2, wood = o.wood ?? M.TEAK;
  f.bev(wood, -a, a, 0.05, d, h - 0.1, h, 0.02, { grain: 'x' });
  f.bev(wood, -a + 0.1, a - 0.1, 0.1, d - 0.08, h - 0.45, h - 0.1, 0.01, { grain: 'x' });
  for (const sx of [-1, 1]) for (const y of [0.2, d - 0.2]) leg(K, f, wood, sx * (a - 0.2), y, h - 0.45, 0.06, sx * 0.08, 0);
  f.box(M.BRASS, -0.35, 0.35, d - 0.08, d - 0.05, h - 0.3, h - 0.26);
  f.block(-a, a, 0, d, 0, h);
  // the mirror: a middle leaf on the wall, two side leaves angled out from it
  const MIR = 'c#a9b2b4/0.12', mw = 1.9, mh = 3.1, z0 = h + 0.25, bulbs = [];
  const leaf = (fr, x0, x1) => {
    fr.box(wood, x0 - 0.18, x1 + 0.18, 0.02, 0.18, z0 - 0.18, z0); fr.box(wood, x0 - 0.18, x1 + 0.18, 0.02, 0.18, z0 + mh, z0 + mh + 0.18);
    fr.box(wood, x0 - 0.18, x0, 0.02, 0.18, z0, z0 + mh); fr.box(wood, x1, x1 + 0.18, 0.02, 0.18, z0, z0 + mh);
    fr.box(MIR, x0, x1, 0.07, 0.11, z0, z0 + mh);
  };
  leaf(f, -mw / 2, mw / 2);
  for (let i = 0; i < 6; i++) { const z = z0 + 0.15 + (mh - 0.3) * i / 5; for (const x of [-mw / 2 - 0.09, mw / 2 + 0.09]) bulbs.push(new THREE.SphereGeometry(0.07, 8, 6).translate(x, 0.24, z)); }
  for (let i = 0; i < 5; i++) bulbs.push(new THREE.SphereGeometry(0.07, 8, 6).translate(-mw / 2 + 0.2 + (mw - 0.4) * i / 4, 0.24, z0 + mh + 0.09));
  K.put(f, M.BULB, merge(bulbs));
  // the side leaves, swung forward 30 degrees, built in their own turned geometry
  for (const s of [-1, 1]) {
    const g = [];
    const lw = 0.95, P = (x0, x1, y0, y1, zz0, zz1) => g.push(K.geom.bev(x0, x1, y0, y1, zz0, zz1, 0.008));
    P(0, lw + 0.18, 0.02, 0.16, z0 - 0.18, z0); P(0, lw + 0.18, 0.02, 0.16, z0 + mh - 0.2, z0 + mh - 0.02); P(lw, lw + 0.18, 0.02, 0.16, z0, z0 + mh - 0.2);
    const m = [K.geom.bev(0, lw, 0.06, 0.1, z0, z0 + mh - 0.2, 0.004)];
    const xf = gg => gg.rotateZ(s > 0 ? 0.5 : -0.5).translate(0, 0, 0);
    const T = gm => { if (s < 0) gm.scale(-1, 1, 1); xf(gm); gm.translate(s * (mw / 2 + 0.18), 0.02, 0); return gm; };
    K.put(f, wood, merge(g.map(T))); K.put(f, MIR, merge(m.map(T)));
  }
  // on the top: brushes, bottles, a dish of hairpins, a powder puff in its bowl
  const T = h;
  for (const [x, y, hh, r, c] of [[-1.7, 0.6, 0.55, 0.09, 'c#c4922e/0.1'], [-1.45, 0.45, 0.4, 0.11, 'c#7fa3a6/0.08'], [-1.2, 0.65, 0.65, 0.07, 'c#8a3a26/0.1'], [1.25, 0.5, 0.32, 0.13, 'c#e2d7c0/0.1']]) {
    vessel(K, f, M.GLASS, x, y, T, [[0, 0], [r, 0], [r, hh * 0.75], [r * 0.4, hh * 0.85], [r * 0.35, hh], [0, hh]], 12);
    vessel(K, f, c, x, y, T + 0.01, [[0, 0], [r * 0.9, 0], [r * 0.9, hh * 0.55], [0, hh * 0.55]], 10);
    vessel(K, f, M.BRASS, x, y, T + hh, [[0, 0], [r * 0.45, 0], [r * 0.45, 0.07], [0, 0.08]], 8);
  }
  for (const [x, y, rz] of [[0.3, 0.8, 0.3], [0.75, 0.9, -0.2]]) {
    K.put(f, M.TEAKD, K.geom.bev(-0.08, 0.08, -0.3, 0.12, 0, 0.08, 0.03), { rz, at: [x, y, T] });
    K.put(f, 'c#2a2420/0.9', K.geom.bev(-0.06, 0.06, -0.08, 0.1, 0.08, 0.16, 0.01), { rz, at: [x, y, T] });
  }
  vessel(K, f, M.CHINA, 1.75, 0.7, T, [[0, 0], [0.18, 0], [0.24, 0.12], [0.23, 0.13], [0, 0.05]], 14);
  ball(K, f, 'wool#ecd5c8', 1.75, 0.7, T + 0.14, 0.14, [1, 1, 0.55], 10);
  vessel(K, f, M.BRASS, -0.4, 0.5, T, [[0, 0], [0.14, 0], [0.16, 0.03], [0, 0.02]], 12);
  return T;
}
// A low teak stool with a woven seat (for the dressing table); sittable
export function lowStool(K, f, x, y, o = {}) {
  const h = o.h ?? 1.5, a = 0.65, b = 0.5, s = f.sub(x, y, 0, o.dq ?? 0);
  s.bev(o.wood ?? M.TEAK, -a, a, -b, b, h - 0.12, h - 0.04, 0.015);
  s.box(o.seat ?? M.CANE, -a + 0.06, a - 0.06, -b + 0.06, b - 0.06, h - 0.04, h);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) leg(K, s, o.wood ?? M.TEAK, sx * (a - 0.1), sy * (b - 0.1), h - 0.12, 0.05, sx * 0.08, sy * 0.06);
  s.block(-a, a, -b, b, 0, 1.5);
  if (o.sit !== false) K.seat(s, 0, 0, h, o.label ?? 'sit');
}
// A long low bench: a thick teak board on two slab legs, a sheepskin along it. f: a frame; centred at its origin.
export function lowBench(K, f, w, o = {}) {
  const a = w / 2, d = o.d ?? 1.35, b = d / 2, h = o.h ?? 1.45, wood = o.wood ?? M.TEAK;
  f.bev(wood, -a, a, -b, b, h - 0.18, h, 0.04, { grain: 'x' });
  for (const sx of [-1, 1]) f.bev(wood, sx * (a - 0.5) - 0.12, sx * (a - 0.5) + 0.12, -b + 0.1, b - 0.1, 0, h - 0.18, 0.02, { grain: 'z' });
  sheepskin(K, f, o.skinAt ?? -a * 0.3, 0, h, 2.2, d + 0.25, { ph: 0.7 });
  f.block(-a, a, -b, b, 0, 1.6);
  return h;
}
// A tailor's dummy on a turned stand, wearing a splendid robe (a dressing gown of quilted silk, its sash tied)
export function dummy(K, f, x, y, o = {}) {
  const s = f.sub(x, y, 0, 0), robe = o.robe ?? 'velvet#6a2a3a', trim = o.trim ?? 'velvet#c4922e';
  vessel(K, s, M.TEAKD, 0, 0, 0, [[0, 0], [0.55, 0], [0.56, 0.05], [0.4, 0.08], [0.05, 0.1], [0, 0.1]], 3);
  vessel(K, s, M.BRASS, 0, 0, 0, [[0.04, 0.1], [0.04, 3.4], [0, 3.4]], 8);
  // the torso inside the robe, and the robe itself, falling to the knee and wider at the hem
  vessel(K, s, 'linen#d9cdb2', 0, 0, 3.3, [[0, 0], [0.42, 0.05], [0.48, 0.5], [0.42, 1.1], [0.5, 1.6], [0.45, 1.85], [0.2, 2.0], [0.12, 2.05], [0.13, 2.25], [0, 2.3]], 18, { sy: 0.7 });
  const R = [[0.8, 1.5], [0.72, 2.0], [0.6, 2.8], [0.52, 3.5], [0.56, 4.1], [0.58, 4.7], [0.5, 5.05], [0.3, 5.25], [0.17, 5.3]];
  vessel(K, s, robe, 0, 0, 0, [[0, 1.5], ...R], 22, { sy: 0.72, mod: (t, j) => 1 + (j < 4 ? 0.06 * Math.sin(t * 7) : 0) });
  vessel(K, s, trim, 0, 0, 0, R.slice(3, 8).map(([r, z]) => [r * 1.03, z]), 22, { sy: 0.74, th0: Math.PI / 2 - 0.9, th1: Math.PI / 2 + 0.9 });
  vessel(K, s, trim, 0, 0, 3.92, [[0.565, 0], [0.575, 0.12], [0.565, 0.24]], 22, { sy: 0.74 });
  for (const sx of [-1, 1]) tube(K, s, trim, [[0.2 * sx, 0.42, 4.02], [0.3 * sx, 0.5, 3.6], [0.25 * sx, 0.48, 3.25]], 0.05, 6);
  // the sleeves, hanging
  for (const sx of [-1, 1]) K.put(s, robe, K.geom.sweep([[0.5 * sx, 0, 4.95], [0.68 * sx, 0.02, 4.4], [0.72 * sx, 0.06, 3.7]], t => 0.16 + 0.08 * t, { seg: 10 }));
  s.block(-0.6, 0.6, -0.6, 0.6, 0, 5.4);
}
// A kimono spread on a lacquered ikō stand (the Japanese kimono rack: two posts, a long top bar, the sleeves stretched
// out along it), so that the back of the robe is seen whole. f: a frame; the stand along x, the kimono's back at +y.
export function ikoKimono(K, f, draw, o = {}) {
  const W = 5.6, a = W / 2, H = 6.0, wood = o.wood ?? 'c#2a1612/0.35';
  for (const sx of [-1, 1]) { f.box(wood, sx * a - 0.08, sx * a + 0.08, -0.08, 0.08, 0, H); f.box(wood, sx * a - 0.12, sx * a + 0.12, -0.7, 0.7, 0, 0.14); }
  f.box(wood, -a - 0.45, a + 0.45, -0.07, 0.07, H - 0.1, H + 0.05); f.box(wood, -a, a, -0.06, 0.06, 1.3, 1.42);
  for (const sx of [-1, 1]) f.box(wood, sx * (a + 0.45) - 0.04, sx * (a + 0.45) + 0.04, -0.09, 0.09, H + 0.02, H + 0.14);
  // the kimono: a T of cloth hung over the bar (sleeves along it, the body down to the floor), its back painted
  return { at: [0, 0.13, H - 0.12], W, H };
}
// A three-leaf folding screen of slatted teak with paper panels (shoji proportions). f: a frame; leaves along x
export function screen3(K, f, w, h, o = {}) {
  const lw = w / 3, wood = o.wood ?? M.TEAK;
  for (let i = 0; i < 3; i++) {
    const x0 = -w / 2 + i * lw + 0.03, x1 = x0 + lw - 0.06, y = (i % 2) * 0.35;
    for (const x of [x0, x1 - 0.1]) f.bev(wood, x, x + 0.1, y, y + 0.1, 0, h, 0.01, { grain: 'z' });
    for (const z of [0.3, h - 0.1]) f.bev(wood, x0, x1, y, y + 0.1, z - 0.08, z, 0.01);
    f.box(o.paper ?? 'shade', x0 + 0.12, x1 - 0.12, y + 0.03, y + 0.07, 0.32, h - 0.2);
    for (let k = 1; k < 4; k++) f.box(wood, x0 + 0.1, x1 - 0.1, y + 0.08, y + 0.1, 0.3 + (h - 0.48) * k / 4 - 0.02, 0.3 + (h - 0.48) * k / 4 + 0.02);
    f.box(wood, (x0 + x1) / 2 - 0.02, (x0 + x1) / 2 + 0.02, y + 0.08, y + 0.1, 0.3, h - 0.18);
  }
  f.block(-w / 2, w / 2, 0, 0.45, 0, h);
}
// A coat tree (a mid-century hall stand): a teak pole on three splayed legs, ball-tipped pegs up its top
export function coatTree(K, f, x, y, o = {}) {
  const wood = o.wood ?? M.TEAK, H = 5.9;
  for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; leg(K, f, wood, x + Math.cos(a) * 0.08, y + Math.sin(a) * 0.08, 1.4, 0.05, Math.cos(a) * 0.75, Math.sin(a) * 0.75); }
  vessel(K, f, wood, x, y, 0, [[0.05, 1.0], [0.055, H], [0, H + 0.03]], 8);
  for (let k = 0; k < 6; k++) { const a = k * 1.047 + (k % 2) * 0.3, z = H - 0.55 - (k % 2) * 0.45, ex = x + Math.cos(a) * 0.42, ey = y + Math.sin(a) * 0.42;
    tube(K, f, wood, [[x, y, z - 0.2], [ex, ey, z + 0.08]], 0.022, 5); ball(K, f, M.BRASS, ex, ey, z + 0.08, 0.05, [1, 1, 1], 8); }
  f.block(x - 0.5, x + 0.5, y - 0.5, y + 0.5, 0, H);
}
// A steamer trunk lying on its side against the wall, lid shut, brass corners and two leather straps; its front
// covered in travel labels (drawn by the caller on the front). f: a frame; centred at its origin, front toward +y.
export function trunk(K, f, w = 3.2, d = 1.8, h = 2.0, o = {}) {
  const a = w / 2, b = d / 2, body = o.body ?? 'c#3c4a3c/0.6';
  f.box(body, -a + 0.01, a - 0.01, -b + 0.01, b - 0.01, 0.12, h - 0.01);
  for (const z of [0.12, h - 0.62, h - 0.06]) f.box(M.TEAKD, -a - 0.02, a + 0.02, -b - 0.02, b + 0.02, z, z + 0.08);
  for (const x of [-a + 0.6, a - 0.6]) f.box(M.LEATHER, x - 0.12, x + 0.12, -b - 0.045, b + 0.045, 0.1, h + 0.04);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const z of [0.12, h - 0.2]) f.box(M.BRASS, sx * a - 0.12 - (sx > 0 ? 0 : -0.12) * 0, sx * a + (sx > 0 ? 0.03 : -0.03), sy * b - 0.12, sy * b + 0.12, z, z + 0.2);
  f.box(M.BRASS, -0.15, 0.15, b + 0.02, b + 0.05, h - 0.5, h - 0.2);
  for (const sx of [-1, 1]) f.box(M.TEAKD, sx * (a - 0.3) - 0.1, sx * (a - 0.3) + 0.1, -b + 0.1, b - 0.1, 0, 0.12);
  f.block(-a, a, -b, b, 0, h);
}
// A shoe-shine box: a teak box with a foot-rest on its lid, brushes and two tins beside it
export function shineBox(K, f, x, y, o = {}) {
  const s = f.sub(x, y);
  s.bev(M.TEAKD, -0.6, 0.6, -0.4, 0.4, 0, 0.9, 0.02);
  s.bev(M.TEAK, -0.45, 0.45, -0.15, 0.15, 0.9, 1.0, 0.01);
  K.put(s, M.TEAK, K.geom.bev(-0.08, 0.08, -0.4, 0.4, 0, 0.14, 0.02), { at: [0, 0, 1.0] });
  K.put(s, M.TEAK, K.geom.bev(-0.1, 0.1, -0.5, 0.5, 0, 0.1, 0.02), { at: [0, 0, 1.14] });
  for (const [dx, c] of [[-0.25, 'c#2a1d16/0.5/0.6'], [0.25, 'c#8a5a3a/0.5/0.6']]) vessel(K, s, c, dx, 0.25, 0.9, [[0, 0], [0.12, 0], [0.12, 0.08], [0, 0.08]], 12);
  for (const [dx, dy] of [[0.8, 0.1], [0.85, -0.25]]) { K.put(s, M.TEAK, K.geom.bev(-0.25, 0.25, -0.08, 0.08, 0, 0.12, 0.03), { at: [dx, dy, 0] }); K.put(s, 'c#2a2420/0.9', K.geom.bev(-0.23, 0.23, -0.07, 0.07, 0.12, 0.22, 0.01), { at: [dx, dy, 0] }); }
  s.block(-0.6, 0.6, -0.4, 0.4, 0, 1.25);
}
// A low chest of drawers in teak, its drawers pulled out at different lengths, silk scarves spilling from them.
// f: a wall frame; centred at its origin. Returns the top's height.
export function scarfChest(K, f, w = 5, o = {}) {
  const a = w / 2, d = 1.7, h = 2.6, wood = o.wood ?? M.TEAK, n = 4, out = o.out ?? [0.15, 0.7, 0.35, 1.0], cols = o.colours ?? ['c#a8322a/0.35', 'c#c4922e/0.35', 'c#3c5a5a/0.35', 'c#e8d8c0/0.35', 'c#6a2a5a/0.35', 'c#2a3a6a/0.35'];
  f.box(M.BLACK, -a + 0.2, a - 0.2, 0.1, d - 0.2, 0, 0.3);
  f.bev(wood, -a, a, 0.03, d, 0.3, h, 0.02);
  f.box(M.WALD, -a + 0.08, a - 0.08, d - 0.1, d - 0.02, 0.38, h - 0.08);
  const dh = (h - 0.46) / n;
  for (let i = 0; i < n; i++) {
    const z0 = 0.38 + i * dh + 0.02, z1 = z0 + dh - 0.04, y = d + out[i % out.length];
    for (const [x0, x1] of [[-a + 0.1, -0.02], [0.02, a - 0.1]]) {
      const pull = (i + (x0 < 0 ? 0 : 1)) % 3 === 0 ? 0 : out[(i + (x0 < 0 ? 0 : 2)) % out.length];
      const yy = d + pull;
      f.bev(wood, x0, x1, yy - 0.06, yy, z0, z1, 0.01, { grain: 'x' });
      f.box(M.BRASS, (x0 + x1) / 2 - 0.2, (x0 + x1) / 2 + 0.2, yy, yy + 0.04, z1 - 0.12, z1 - 0.06);
      if (pull > 0.2) {
        f.box(wood, x0 + 0.04, x0 + 0.08, d - 0.3, yy - 0.06, z0, z1 - 0.06); f.box(wood, x1 - 0.08, x1 - 0.04, d - 0.3, yy - 0.06, z0, z1 - 0.06);
        // silk: a heap in the drawer, and a long tail falling over its front
        const c = cols[(i * 2 + (x0 < 0 ? 0 : 1)) % cols.length];
        K.put(f, c, K.geom.softBox(x0 + 0.1, x1 - 0.1, d - 0.25, yy - 0.1, z1 - 0.2, z1 - 0.02, 0.06, { crown: 0.06, bulge: 0.05 }));
        if ((i + (x0 < 0 ? 1 : 0)) % 2) K.put(f, c, K.geom.sweep([[x0 + 0.5, yy - 0.2, z1 - 0.05], [x0 + 0.55, yy + 0.05, z1 - 0.02], [x0 + 0.6, yy + 0.09, z1 - 0.35], [x0 + 0.52, yy + 0.12, Math.max(0.15, z0 - 0.7)]], 1, { shape: [[-0.2, -0.01], [0.2, -0.01], [0.2, 0.01], [-0.2, 0.01]], up: [1, 0, 0] }));
      }
    }
  }
  f.block(-a, a, 0, d + 1.0, 0, h);
  return h;
}

// =================================================================================================================
// THE EAST SUITE'S PIECES
// =================================================================================================================
// A round black stove of the Danish kind (after the 1960s cylindrical stoves of Morsø and Jøtul): a drum of cast iron
// on a pedestal, a tall glass door with the fire behind it, a black flue straight up to the ceiling, on a slate plate.
// f: a floor frame, the door toward +y. Returns the fire's place in f.
export function drumStove(K, f, ceil, o = {}) {
  const r = 0.85, h0 = 0.7, h1 = 3.9;
  f.bev(M.SLATE, -1.9, 1.9, -1.6, 2.2, 0, 0.08, 0.02);
  vessel(K, f, M.BLACK, 0, 0, 0.08, [[0, 0], [0.5, 0], [0.45, 0.1], [0.3, h0 - 0.2], [0.6, h0 - 0.08], [r, h0], [r, h0 + 0.2], [0, h0 + 0.2]], 24);
  vessel(K, f, M.BLACK, 0, 0, 0.08, [[r, h0 + 0.2], [r, h0 + 1.75]], 24, { th0: Math.PI / 2 + 0.62, th1: Math.PI / 2 - 0.62 + 2 * Math.PI });      // the drum, open at the front
  vessel(K, f, M.BLACK, 0, 0, 0.08, [[0, h0 + 1.75], [r, h0 + 1.75], [r, h1], [r - 0.08, h1 + 0.15], [0.3, h1 + 0.25], [0, h1 + 0.25]], 24);
  vessel(K, f, M.BLACK, 0, 0, h1 + 0.3, [[0.26, 0], [0.26, ceil - h1 - 0.35], [0.3, ceil - h1 - 0.33], [0.3, ceil - h1 - 0.31]], 14);
  // the door stands open: a dark firebox in the drum (soot inside, a glowing bed of embers), the iron leaf swung aside on
  // its hinge; the fire itself (logs and live flames) is laid by lightFire in the caller
  vessel(K, f, M.SOOT, 0, 0, 0.08, [[r * 0.92, h0 + 0.2], [r * 0.92, h0 + 1.75]], 14, { th0: Math.PI / 2 + 0.62, th1: Math.PI / 2 - 0.62 + 2 * Math.PI, flip: true });
  vessel(K, f, M.SOOT, 0, 0, 0.08, [[0, h0 + 0.2], [r * 0.93, h0 + 0.2]], 14);
  vessel(K, f, M.EMBER, 0, 0, 0.08, [[0, h0 + 0.22], [r * 0.7, h0 + 0.22]], 12, { th0: Math.PI / 2 - 0.9, th1: Math.PI / 2 + 0.9 });
  const hinge = [r * Math.sin(0.62), r * Math.cos(0.62), 0.08 + h0 + 0.2];
  const span = 2 * hinge[0], height = 1.55;
  const onDoor = (mat, g) => K.put(f, mat, g, { rz: -0.95, at: hinge });
  for (const x of [-span, -0.06]) onDoor(M.BLACK, K.geom.bev(x, x + 0.06, -0.04, 0.04, 0, height, 0.012));
  for (const z of [0, height - 0.07]) onDoor(M.BLACK, K.geom.bev(-span + 0.06, -0.06, -0.04, 0.04, z, z + 0.07, 0.012));
  onDoor('glass', K.geom.bev(-span + 0.05, -0.05, -0.012, 0.012, 0.06, height - 0.06, 0.005));
  onDoor(M.BRASS, K.geom.sweep([[-span + 0.03, 0.03, 0.64], [-span + 0.03, 0.13, 0.64], [-span + 0.03, 0.13, 0.98], [-span + 0.03, 0.03, 0.98]], 0.03));
  for (const z of [0.12, 1.13]) f.cyl(M.BLACK, hinge[0], hinge[1], hinge[2] + z, hinge[2] + z + 0.24, 0.065, 0.065, 8);
  f.cyl(M.BLACK, 0, 0, ceil - 0.12, ceil + 0.03, 0.38, 0.38, 16);
  f.block(-r, r, -r, r, 0, ceil);
  // a basket of logs beside it
  vessel(K, f, M.CANE, 1.45, 0.6, 0.08, [[0, 0], [0.38, 0], [0.42, 0.6], [0.39, 0.6], [0.35, 0.06], [0, 0.06]], 14);
  storedLogs(K,f,1.45,.6,.15,.86,.13,3,3);
  f.block(1.05, 1.85, 0.2, 1.0, 0, 1.5);
  return { x: 0, y: r * 0.3, z: h0 + 0.42 };
}
// A low lounge chair after Finn Juhl and Grete Jalk: a teak frame, a floating seat and back in wool, open arms.
// f: a frame; the chair's seat at its origin, facing +y. Sittable.
export function loungeChair(K, f, x, y, fab, o = {}) {
  const base = f.sub(x, y, 0, o.dq ?? 0), wood = o.wood ?? M.TEAK, a = 1.25, sz = 1.25;
  const turn = o.turn ?? 0, c = Math.cos(turn), n = Math.sin(turn);
  const map = (lx, ly) => base.map(lx * c - ly * n, lx * n + ly * c);
  const origin = map(0, 0), front = map(0, 1);
  const s = turn ? { ...base, map, dir: [front[0] - origin[0], front[1] - origin[1]] } : base;
  for (const sx of [-1, 1]) {
    leg(K, s, wood, sx * (a - 0.1), 0.95, 1.9, 0.07, sx * 0.08, 0.15);
    leg(K, s, wood, sx * (a - 0.1), -0.9, 1.65, 0.07, sx * 0.08, -0.2);
    K.put(s, wood, K.geom.sweep([[sx * (a - 0.1), 1.05, 1.9], [sx * (a - 0.05), 0.2, 2.0], [sx * (a - 0.1), -0.9, 1.65]], t => 0.07 - 0.02 * t, { seg: 6 }));
    K.put(s, wood, K.geom.sweep([[sx * (a - 0.1), 0.9, sz - 0.2], [sx * (a - 0.1), -0.95, sz - 0.25]], 0.05, { seg: 5 }));
  }
  // Two raked uprights carry the back cushion into the rear frame.
  for (const side of [-1, 1]) {
    const postX = side * (a - 0.34);
    K.put(s, wood, K.geom.sweep([[postX, -0.94, 1.12], [postX, -1.52, 2.65]], 0.055, { seg: 6, caps: true }));
  }
  s.bev(wood, -a + 0.1, a - 0.1, -1.01, -0.88, 1.04, 1.18, 0.02);
  s.bev(wood, -a + 0.1, a - 0.1, 0.83, 0.96, 1.04, 1.18, 0.02);
  s.bev(wood, -a + 0.32, a - 0.32, -1.57, -1.47, 2.57, 2.67, 0.025);
  s.cushion(fab, -a + 0.18, a - 0.18, -0.96, 1.04, sz - 0.11, sz + 0.2, 0.105,
    { crown: 0.055, bulge: 0.025, welt: 0.011, sag: [[0, -0.1, 0.045, 0.65]] });
  const back = K.geom.softBox(-a + 0.21, a - 0.21, -0.78, 0.78, -0.16, 0.16, 0.115,
    { crown: 0.04, bulge: 0.022, welt: 0.012 });
  K.put(s, fab, back, { rx: -Math.PI / 2 + 0.32, at: [0, -1.075, sz + 0.84] });
  if (o.pillow) K.cushion(s, 0.15, -0.84, sz + 0.21, 1.17, 1.0, o.pillow, { tilt: 0.38, turn: -0.07, thick: 0.34 });
  const halfDepth = 1.34, midDepth = -0.21;
  const hx = a * Math.abs(c) + halfDepth * Math.abs(n), hy = a * Math.abs(n) + halfDepth * Math.abs(c);
  base.block(-midDepth * n - hx, -midDepth * n + hx, midDepth * c - hy, midDepth * c + hy, 0, 1.6);
  if (o.sit !== false) K.seat(s, 0, 0.05, sz + 0.1, o.label ?? 'sit');
}
// A soaking tub of hinoki, sunk to its waist in a slate surround, a wooden lid rolled back at one end, a bucket and a
// stool beside it. f: a frame; the tub along x, its back at y = 0. Returns where to sit.
export function ofuro(K, f, w = 4.8, d = 3.0, o = {}) {
  const a = w / 2, h = 2.1, t = 0.18, H = 'hinoki';
  f.box(H, -a, a, 0.05, 0.05 + t, 0, h); f.box(H, -a, a, d - t, d, 0, h); f.box(H, -a + 0.01, -a + t, 0.06 + t, d - t - 0.01, 0.01, h - 0.01); f.box(H, a - t, a - 0.01, 0.06 + t, d - t - 0.01, 0.01, h - 0.01);
  f.box(H, -a + t, a - t, 0.05 + t, d - t, 0, 0.35);
  for (const z of [0.4, h - 0.35]) for (const [y0, y1] of [[0.0, 0.05], [d, d + 0.05]]) f.box(M.BRASS, -a, a, y0, y1, z, z + 0.1);
  f.box(M.WATER, -a + t, a - t, 0.05 + t, d - t, 1.6, 1.62);
  // the lid, rolled up at the far end
  roll(K, f, H, a - 0.45, d / 2, h + 0.35, 0.33, d - 0.2, { rz: Math.PI / 2, seg: 14 });
  // a wooden bucket and a low stool, a towel folded on it
  vessel(K, f, H, -a - 0.75, d - 0.6, 0, [[0, 0], [0.38, 0], [0.42, 0.75], [0.39, 0.75], [0.35, 0.05], [0, 0.05]], 14);
  for (const z of [0.18, 0.6]) vessel(K, f, M.BRASS, -a - 0.75, d - 0.6, z, [[0.386 + z * 0.05, 0], [0.392 + z * 0.05, 0.05]], 14);
  f.block(-a, a, 0, d, 0, h);
  return { x: -a + 1.1, y: d / 2, z: 0.95 };
}
// A washstand: a stone basin on a plain teak stand with a shelf of folded towels, a jug, a round mirror above
export function washstand(K, f, o = {}) {
  const w = o.w ?? 3, d = 1.6, h = 2.75, a = w / 2;
  for (const sx of [-1, 1]) for (const y of [0.15, d - 0.15]) f.bev(M.TEAK, sx * (a - 0.15) - 0.07, sx * (a - 0.15) + 0.07, y - 0.07, y + 0.07, 0, h - 0.1, 0.012, { grain: 'z' });
  f.bev(M.TEAK, -a, a, 0.05, d, h - 0.12, h, 0.02, { grain: 'x' });
  f.bev(M.TEAK, -a + 0.1, a - 0.1, 0.1, d - 0.05, 0.55, 0.63, 0.01, { grain: 'x' });
  K.foldedStack(f, -0.6, d / 2, 0.63, 4, ['wool#ebe5d8', 'wool#d9cdb5'], { w: 1.1, d: 1.0, t: 0.12 }); K.foldedStack(f, 0.65, d / 2, 0.63, 3, ['wool#9a4a2a', 'wool#ebe5d8'], { w: 1.1, d: 1.0, t: 0.12 });
  vessel(K, f, M.STONE, 0.1, d / 2, h, [[0, 0], [0.3, 0], [0.55, 0.12], [0.62, 0.3], [0.58, 0.32], [0.5, 0.18], [0, 0.12]], 20);
  vessel(K, f, M.WATER, 0.1, d / 2, h + 0.2, [[0, 0], [0.5, 0], [0.5, 0.005], [0, 0.005]], 16);
  vessel(K, f, M.CLAY, -1.05, 0.9, h, [[0, 0], [0.16, 0], [0.22, 0.25], [0.2, 0.55], [0.12, 0.7], [0.14, 0.78], [0, 0.78]], 14);
  f.block(-a, a, 0, d, 0, h);
  return h;
}
// A Danish writing bureau (a fall-front secretary on legs): teak, the flap down and the pigeonholes showing, a pad of
// the house's paper, a pen, a stack of envelopes. f: a wall frame; centred at its origin. Returns the flap's height.
export function bureau(K, f, o = {}) {
  const w = o.w ?? 3.4, a = w / 2, d = 1.5, wood = o.wood ?? M.TEAK, z0 = 1.2, zf = 2.45, z1 = 4.2;
  for (const sx of [-1, 1]) for (const y of [0.15, d - 0.15]) leg(K, f, wood, sx * (a - 0.15), y, z0, 0.06, sx * 0.05, y > 0.5 ? 0.06 : 0);
  for (const x of [-a, a - 0.12]) f.bev(wood, x, x + 0.12, 0.06, d, z0, z1 - 0.1, 0.016, { grain: 'z' });
  f.bev(wood, -a + 0.11, a - 0.11, 0.065, d - 0.065, z0, z0 + 0.12, 0.012);
  f.bev(wood, -a + 0.11, a - 0.11, 0.068, d - 0.055, zf - 0.12, zf + 0.012, 0.012);
  f.bev(wood, -a - 0.025, a + 0.025, 0.05, d + 0.03, z1 - 0.115, z1, 0.019, { grain: 'x' });
  f.box(M.WALD, -a + 0.105, a - 0.105, 0.067, 0.149, z0 + 0.11, z1 - 0.11);
  for (let i = 0; i < 2; i++) { const zz = z0 + 0.13 + i * 0.5; f.bev(M.TEAKD, -a + 0.115, a - 0.115, d - 0.08, d + 0.053, zz, zz + 0.44, 0.01, { grain: 'x' }); f.box(M.BRASS, -0.2, 0.2, d + 0.05, d + 0.08, zz + 0.3, zz + 0.34); }
  // the upper part, open: a recess with pigeonholes, the flap let down onto two lopers
  for (let i = 1; i < 6; i++) {
    const x = -a + 0.15 + i * (w - 0.3) / 6;
    f.bev(wood, x - 0.022, x + 0.022, 0.145, 0.92, zf + 0.616, z1 - 0.113, 0.006);
  }
  f.bev(wood, -a + 0.113, a - 0.113, 0.144, 0.94, zf + 0.56, zf + 0.622, 0.01, { grain: 'x' });
  K.put(f, wood, K.geom.bev(-a + 0.05, a - 0.05, d - 0.05, d + 1.05, zf - 0.06, zf, 0.01, { grain: 'x' }));
  f.box(M.LEATHER, -a + 0.3, a - 0.3, d + 0.05, d + 0.95, zf + 0.012, zf + 0.03);
  const papers = [];
  for (let i = 0; i < 6; i++) { const x = -a + 0.15 + (i + 0.5) * (w - 0.3) / 6; if (i % 3 !== 1) papers.push(K.geom.bev(x - 0.17, x + 0.17, 0.15, 0.8, zf + 0.64, zf + 0.64 + 0.3 + (i % 2) * 0.15, 0.003)); }
  K.put(f, 'c#efe8da/0.9', merge(papers));
  f.block(-a, a, 0, d + 1.05, 0, z1);
  return zf;
}
// A plain chair to write at: tapered teak legs, a paper-cord seat, a curved back rail (after Wegner's CH chairs)
export function writingChair(K, f, x, y, o = {}) {
  const s = f.sub(x, y, 0, o.dq ?? 0), wood = o.wood ?? M.TEAK, a = 0.8, h = 1.55;
  for (const sx of [-1, 1]) { leg(K, s, wood, sx * (a - 0.1), 0.6, h - 0.05, 0.05, sx * 0.04, 0.05); leg(K, s, wood, sx * (a - 0.12), -0.55, 2.75, 0.05, sx * 0.04, -0.15); }
  s.bev(wood, -a, a, -0.65, 0.7, h - 0.12, h - 0.04, 0.015);
  s.box(M.CANE, -a + 0.08, a - 0.08, -0.58, 0.63, h - 0.04, h);
  K.put(s, wood, K.geom.sweep([[-a + 0.08, -0.62, 2.7], [-0.3, -0.75, 2.78], [0.3, -0.75, 2.78], [a - 0.08, -0.62, 2.7]], 0.06, { seg: 6 }));
  s.block(-a, a, -0.7, 0.75, 0, 1.6);
  if (o.sit !== false) K.seat(s, 0, 0, h, 'sit at the bureau');
}
// The house's writing paper, a pad of it lying on the flap: a drawing for f.sign with flat: true
export function drawPaper(D) {
  return (g, W, H) => {
    D.paper(g, W, H, '#f3ecdc', 5);
    D.T(g, "ANNA'S BASEMENT", W / 2, H * 0.11, H * 0.04, '#5a3e2a', { f: D.F.goudy, ls: 0.25 });
    g.fillStyle = '#8a6a4a'; g.fillRect(W * 0.44, H * 0.135, W * 0.12, Math.max(1, H * 0.003));
    D.T(g, 'under the cellar doors', W / 2, H * 0.17, H * 0.022, '#8a6a4a', { f: D.F.goudy, it: true });
    g.strokeStyle = 'rgba(40,30,20,0.55)'; g.lineWidth = Math.max(1, H * 0.002);
    g.beginPath(); let y = H * 0.27; const words = [0.6, 0.82, 0.74, 0.4];
    for (const k of words) { g.moveTo(W * 0.12, y); for (let x = W * 0.12; x < W * (0.12 + 0.76 * k); x += W * 0.02) g.lineTo(x + W * 0.01, y - H * 0.006 * Math.sin(x * 0.7)); y += H * 0.06; }
    g.stroke();
  };
}
// Travel labels for the trunk's front: round and oblong stickers of places in this world
export function drawLabels(D) {
  return (g, W, H) => {
    g.fillStyle = '#3c4a3c'; g.fillRect(0, 0, W, H);
    const L = [
      [0.17, 0.48, 0.13, '#c4922e', '#2a1d16', 'VESPER', 'STREET', 'round'],
      [0.42, 0.4, 0.15, '#e8dcc2', '#7a2f2a', 'CLOUD SPRING', 'HARBOR', 'oval'],
      [0.68, 0.55, 0.12, '#7a2f2a', '#f1e6cf', "ANNA'S", 'HOUSE', 'round'],
      [0.88, 0.38, 0.1, '#2f5f6b', '#f1e6cf', 'SPANYA', 'BAGGAGE', 'oval'],
    ];
    for (const [cx, cy, r, bg, ink, a, b, kind] of L) {
      const x = cx * W, y = cy * H, rr = r * W;
      g.save(); g.translate(x, y); g.rotate((cx - 0.5) * 0.5);
      g.fillStyle = bg; g.beginPath(); if (kind === 'round') g.arc(0, 0, rr, 0, Math.PI * 2); else g.ellipse(0, 0, rr * 1.25, rr * 0.8, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = ink; g.lineWidth = rr * 0.06; g.beginPath(); if (kind === 'round') g.arc(0, 0, rr * 0.85, 0, Math.PI * 2); else g.ellipse(0, 0, rr * 1.08, rr * 0.66, 0, 0, Math.PI * 2); g.stroke();
      D.T(g, a, 0, -rr * 0.08, rr * 0.32, ink, { f: D.F.goudy, max: rr * 1.8 });
      D.T(g, b, 0, rr * 0.34, rr * 0.22, ink, { f: D.F.goudy, max: rr * 1.6 });
      g.restore();
    }
    // scuffs
    g.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 40; i++) g.fillRect((i * 97) % W, (i * 53) % H, W * 0.02, H * 0.01);
  };
}
// The back of a kimono, painted: indigo, with white cranes over stylised waves (seigaiha) along the hem
export function drawKimono(D) {
  return (g, W, H) => {
    g.fillStyle = '#1f2a44'; g.fillRect(0, 0, W, H);
    // the T: cut the shoulders' corners away under the sleeves (painted as the wall would be: transparent is not available)
    // waves along the hem of the body
    g.save(); g.beginPath(); g.rect(0, H * 0.7, W, H * 0.3); g.clip();
    const s = W * 0.09;
    for (let row = 0; row < 8; row++) for (let i = -1; i < 12; i++) {
      const x = i * s * 2 + (row % 2) * s, y = H * 0.72 + row * s * 0.6;
      for (let k = 3; k > 0; k--) { g.fillStyle = k % 2 ? '#f1ece2' : '#2c4a7a'; g.beginPath(); g.arc(x, y + s, s * k / 3, Math.PI, 0); g.fill(); }
    }
    g.restore();
    // cranes
    const crane = (x, y, s2, a) => {
      g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = '#f1ece2';
      g.beginPath(); g.ellipse(0, 0, s2 * 0.5, s2 * 0.18, 0, 0, Math.PI * 2); g.fill();
      for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(-s2 * 0.1, 0); g.quadraticCurveTo(-s2 * 0.3, sg * s2 * 0.7, s2 * 0.4, sg * s2 * 0.9); g.quadraticCurveTo(s2 * 0.2, sg * s2 * 0.3, s2 * 0.25, 0); g.fill(); }
      g.strokeStyle = '#f1ece2'; g.lineWidth = s2 * 0.05; g.beginPath(); g.moveTo(s2 * 0.45, 0); g.quadraticCurveTo(s2 * 0.75, -s2 * 0.1, s2 * 0.85, -s2 * 0.25); g.stroke();
      g.fillStyle = '#b8322a'; g.beginPath(); g.arc(s2 * 0.86, -s2 * 0.27, s2 * 0.05, 0, Math.PI * 2); g.fill();
      g.restore();
    };
    crane(W * 0.42, H * 0.2, W * 0.26, -0.3); crane(W * 0.2, H * 0.58, W * 0.16, 0.2); crane(W * 0.75, H * 0.45, W * 0.18, -0.6);
    // the obi's knot showing at the waist, gold
    g.fillStyle = '#c4922e'; g.fillRect(0, H * 0.33, W, H * 0.07);
    g.fillStyle = '#8a5a1a'; for (let i = 0; i < 12; i++) g.fillRect(W * (0.03 + i * 0.08), H * 0.34, W * 0.02, H * 0.05);
  };
}

// =================================================================================================================
// FILLING THE ROOMS: dividers between places, lit joinery along the walls, an island of drawers
// =================================================================================================================
// A few things for a shelf, chosen by a seed: books lying and standing, a stoneware bottle, a bowl, a jar candle
const SHELF_POTS = ['c#e8e0cf/0.4', 'c#8a5a3e/0.6', 'c#3c4a44/0.4', 'c#c9b48e/0.5', 'c#2a2826/0.4'];
export function shelfThings(K, f, x0, x1, y, z, seed = 1, o = {}) {
  const rnd = rng(seed);
  for (let x = x0 + 0.2; x < x1 - 0.4;) {
    const k = rnd(), c = SHELF_POTS[Math.floor(rnd() * SHELF_POTS.length)];
    if (k < 0.34) { K.bookStack(f, x + 0.35, y, z, 2 + Math.floor(rnd() * 3), { subject: o.subject }); x += 0.9; }
    else if (k < 0.58) { const h = 0.4 + rnd() * 0.5, r = 0.12 + rnd() * 0.08; vessel(K, f, c, x + r, y, z, [[0, 0], [r * 0.7, 0], [r, h * 0.35], [r * 0.9, h * 0.7], [r * 0.35, h * 0.85], [r * 0.3, h], [0, h]], 12); x += r * 2 + 0.35; }
    else if (k < 0.78) { const r = 0.2 + rnd() * 0.12; vessel(K, f, c, x + r, y, z, [[0, 0], [r * 0.5, 0], [r, r * 0.5], [r * 0.95, r * 0.55], [0, 0.03]], 14); x += r * 2 + 0.3; }
    else if (k < 0.88 && o.candles !== false) { vessel(K, f, M.GLASS, x + 0.14, y, z, [[0, 0], [0.13, 0], [0.13, 0.28], [0, 0.28]], 12); vessel(K, f, 'c#efe6d2/0.6', x + 0.14, y, z + 0.01, [[0, 0], [0.12, 0], [0.12, 0.18], [0, 0.18]], 10); x += 0.55; }
    else { K.bookRow(f, x, x + 0.9, y - 0.35, z, 1.0, 0.95, { subject: o.subject }); x += 1.1; }
  }
}
// A low divider between two places: an open shelf unit of honey timber, lit under its top, with a tall slatted screen
// rising at one end. Along the frame's x (len), its middle at the origin; open both sides; the screen at the +x end.
export function divider(K, f, len, o = {}) {
  const a = len / 2, b = 0.6, h = o.h ?? 2.9, wood = o.wood ?? M.OAKP, sw = o.screen ?? 2.4, sh = o.screenH ?? 7.4;
  f.bev(wood, -a, a, -b, b, h - 0.1, h, 0.02, { grain: 'x' });
  f.bev(wood, -a + 0.05, a - 0.05, -b + 0.05, b - 0.05, 0.1, 0.2, 0.01, { grain: 'x' });
  f.box(M.BLACK, -a + 0.2, a - 0.2, -b + 0.2, b - 0.2, 0, 0.1);
  for (const x of [-a, -a / 3, a / 3, a]) f.bev(wood, Math.max(-a, x - 0.06), Math.min(a, x + 0.06), -b, b, 0.1, h - 0.1, 0.01, { grain: 'z' });
  f.bev(wood, -a + 0.06, a - 0.06, -b + 0.03, b - 0.03, 1.45, 1.53, 0.01, { grain: 'x' });
  for (const z of [1.42, h - 0.12]) f.box(M.COVE, -a + 0.15, a - 0.15, -0.05, 0.05, z - 0.012, z);
  shelfThings(K, f, -a + 0.1, a - 0.1, 0, 0.2, (o.seed ?? 1) * 3, o);
  shelfThings(K, f, -a + 0.1, a - 0.1, 0, 1.53, (o.seed ?? 1) * 7 + 1, o);
  // on top: a branch or a bowl, and the screen
  if (o.top !== false) vessel(K, f, M.CLAY, -a + 0.8, 0, h, [[0, 0], [0.25, 0], [0.32, 0.12], [0.3, 0.14], [0, 0.04]], 14);
  if (sw > 0) {
    const x0 = a - sw, slats = [];
    for (let x = x0 + 0.06; x <= a - 0.05; x += 0.22) slats.push(K.geom.bev(x - 0.045, x + 0.045, -0.06, 0.06, h, sh, 0.01, { grain: 'z' }));
    slats.push(K.geom.bev(x0, a, -0.08, 0.08, sh, sh + 0.1, 0.01, { grain: 'x' }));
    K.put(f, o.slat ?? M.TEAK, merge(slats));
  }
  f.block(-a, a, -b, b, 0, sw > 0 ? sh : h);
}
// A tall paper floor lantern (Akari's floor lanterns), its own obstacle
export function floorLantern(K, f, x, y, o = {}) {
  paperLamp(K, f, x, y, 0, { h: o.h ?? 3.6, r: o.r ?? 0.55, feet: 0.45, halo: o.halo ?? 1.0 });
  f.block(x - (o.r ?? 0.55), x + (o.r ?? 0.55), y - (o.r ?? 0.55), y + (o.r ?? 0.55), 0, 4.0);
}
// Lit joinery along a wall: a long low credenza with sliding doors and things on it, two floating shelves over it,
// each lit from a strip under its front. f: a wall frame; x0..x1 along the wall.
export function wallJoinery(K, f, x0, x1, o = {}) {
  const wood = o.wood ?? M.TEAK, d = o.d ?? 1.35, h = o.h ?? 2.3, seed = o.seed ?? 5;
  f.box(M.BLACK, x0 + 0.15, x1 - 0.15, 0.05, d - 0.2, 0, 0.3);
  f.box(wood, x0, x1, 0.04, d - 0.04, 0.3, h - 0.08);
  f.bev(o.top ?? M.OAKP, x0 - 0.03, x1 + 0.03, 0.03, d, h - 0.08, h, 0.015, { grain: 'x' });
  const nd = Math.max(1, Math.round((x1 - x0) / 2.2));
  for (let i = 0; i < nd; i++) { const a = x0 + 0.05 + ((x1 - x0 - 0.1) * i) / nd, b = x0 + 0.05 + ((x1 - x0 - 0.1) * (i + 1)) / nd - 0.03; f.bev(i % 2 ? M.TEAKD : wood, a, b, d - 0.02, d + 0.02, 0.38, h - 0.14, 0.008, { grain: 'z' }); }
  f.block(x0, x1, 0, d, 0, h);
  if (o.things !== false) shelfThings(K, f, x0 + 0.1, x1 - 0.1, d / 2, h, seed, o);
  for (const z of o.shelves ?? [4.3, 5.7]) {
    f.bev(o.top ?? M.OAKP, x0 + 0.2, x1 - 0.2, 0.02, 0.95, z - 0.1, z, 0.015, { grain: 'x' });
    f.box(M.COVE, x0 + 0.3, x1 - 0.3, 0.78, 0.86, z - 0.112, z - 0.1);
    shelfThings(K, f, x0 + 0.3, x1 - 0.3, 0.5, z, seed * 3 + Math.round(z * 10), o);
  }
}
// An island of drawers in the middle of a dressing room: honey timber, a pale stone top, drawers on both long sides
// (some pulled out, gloves and folded silk in them), trays and things on the top. Centred at the origin along x.
export function drawerIsland(K, f, w = 7, d = 3.2, o = {}) {
  const a = w / 2, b = d / 2, h = 3.0, wood = o.wood ?? M.TEAK, cols = ['c#a8322a/0.35', 'c#c4922e/0.35', 'c#3c5a5a/0.35', 'c#e8d8c0/0.35', 'c#2a3a6a/0.35'];
  f.box(M.BLACK, -a + 0.25, a - 0.25, -b + 0.25, b - 0.25, 0, 0.3);
  f.bev(wood, -a, a, -b + 0.05, b - 0.05, 0.3, h - 0.12, 0.02);
  f.bev(M.STONE, -a - 0.1, a + 0.1, -b - 0.1, b + 0.1, h - 0.12, h, 0.02, { grain: 'x' });
  const n = 4, cw = (w - 0.3) / n;
  for (const s of [-1, 1]) for (let i = 0; i < n; i++) for (let j = 0; j < 3; j++) {
    const x0 = -a + 0.15 + i * cw + 0.03, x1 = x0 + cw - 0.06, z0 = 0.4 + j * 0.78, z1 = z0 + 0.72, out = ((i * 3 + j + (s > 0 ? 1 : 0)) % 5 === 0) ? 0.75 : 0;
    const y = s * (b - 0.05) + s * out;
    f.bev(i % 2 ? M.TEAKD : wood, x0, x1, Math.min(y, y + s * 0.06), Math.max(y, y + s * 0.06), z0, z1, 0.01, { grain: 'x' });
    f.box(M.BRASS, (x0 + x1) / 2 - 0.18, (x0 + x1) / 2 + 0.18, Math.min(y + s * 0.06, y + s * 0.09), Math.max(y + s * 0.06, y + s * 0.09), z1 - 0.18, z1 - 0.12);
    if (out) {
      for (const x of [x0 + 0.03, x1 - 0.07]) f.box(wood, x, x + 0.04, Math.min(s * (b - 0.4), y), Math.max(s * (b - 0.4), y), z0 + 0.02, z1 - 0.1);
      K.put(f, cols[(i + j) % cols.length], K.geom.softBox(x0 + 0.1, x1 - 0.1, Math.min(s * (b - 0.3), y - s * 0.1), Math.max(s * (b - 0.3), y - s * 0.1), z1 - 0.3, z1 - 0.1, 0.05, { crown: 0.05 }));
    }
  }
  f.block(-a - 0.1, a + 0.1, -b - 0.85, b + 0.85, 0, h);
  // on the top: a long oak tray of gloves and cufflinks, a hat on a stand, folded silk, a paper lamp, a branch
  const T = h;
  f.bev(M.OAKP, -2.6, -0.6, -0.55, 0.55, T, T + 0.06, 0.01); f.box(M.OAKP, -2.6, -0.6, -0.55, -0.5, T + 0.06, T + 0.14); f.box(M.OAKP, -2.6, -0.6, 0.5, 0.55, T + 0.06, T + 0.14);
  for (const [x, c] of [[-2.25, 'leather#2a1d16'], [-1.8, 'leather#8a5a3a'], [-1.35, 'linen#e8e0cf']]) for (const dy of [-0.18, 0.12]) f.cushion(c, x - 0.14, x + 0.14, dy - 0.12, dy + 0.12, T + 0.06, T + 0.1, 0.02);
  vessel(K, f, M.BRASS, -0.9, 0.0, T + 0.06, [[0, 0], [0.16, 0], [0.18, 0.04], [0, 0.02]], 12);
  vessel(K, f, M.TEAKD, 0.6, 0, T, [[0, 0], [0.22, 0], [0.22, 0.04], [0.04, 0.06], [0.04, 0.9], [0.18, 1.0], [0.2, 1.15], [0.1, 1.3], [0, 1.32]], 12);
  hatOf(K, f, 0.6, 0, T + 0.95, 'fedora', 'wool#9a8a6a');
  K.foldedStack(f, 1.7, -0.3, T, 4, ['c#a8322a/0.35', 'c#c4922e/0.35', 'c#e8d8c0/0.35'], { w: 0.9, d: 0.7, t: 0.05 });
  paperLamp(K, f, 2.9, 0.3, T, { h: 0.9, r: 0.26, feet: 0.12, halo: 0.6 });
  branch(K, f, 2.8, -0.5, T, { s: 0.6, lean: -0.5, seed: 4, pot: M.CHINA });
}

// =================================================================================================================
// THE SETTLED STYLE (notes/STYLE.md, "READ THIS FIRST"): the pool's and the chapel's things, for the Quiet Room
// =================================================================================================================
// A candle that is always alight: a wax pillar, its wick, a small flame that glows (it lights nothing; a halo after dark)
export function flameCandle(K, f, x, y, z, tall = 0.5, r = 0.11, o = {}) {
  vessel(K, f, o.wax ?? 'c#efe6d2/0.6', x, y, z, [[0, 0], [r, 0], [r, tall], [r - 0.02, tall + 0.008], [r * 0.55, tall - 0.025], [0, tall - 0.03]], 12);
  K.put(f, 'c#1b1612/0.9', K.geom.lathe([[0.006, tall - 0.03], [0.005, tall + 0.03], [0, tall + 0.03]], { seg: 4 }), { at: [x, y, z] });
  vessel(K, f, 'e#ffd49a/2.6', x, y, z + tall + 0.02, [[0, 0], [0.025, 0.02], [0.032, 0.06], [0.02, 0.11], [0, 0.15]], 8);
  glowAt(K, f, x, y, z + tall + 0.1, o.halo ?? 0.35);
}
// A candle lantern of oak and glass with a candle burning in it (the pool's bronze lanterns, in timber): on a table
// (h about 1) or on the floor (h about 3). Its foot at (x, y, z) of a frame.
export function candleLantern(K, f, x, y, z, o = {}) {
  const s = o.size ?? 0.5, H = o.h ?? 1.05, hs = s / 2, b = Math.max(0.03, s * 0.06), wood = o.wood ?? M.TEAKD;
  f.bev(wood, x - hs - 0.04, x + hs + 0.04, y - hs - 0.04, y + hs + 0.04, z, z + 0.08, 0.01);
  f.bev(wood, x - hs - 0.04, x + hs + 0.04, y - hs - 0.04, y + hs + 0.04, z + H - 0.08, z + H, 0.01);
  vessel(K, f, wood, x, y, z + H, [[hs * 0.9, 0], [hs * 0.5, s * 0.25], [0.04, s * 0.35], [0, s * 0.36]], 4, { rz: Math.PI / 4 });
  K.put(f, M.IRON, new THREE.TorusGeometry(s * 0.18, 0.012, 5, 12).rotateX(Math.PI / 2), { at: [x, y, z + H + s * 0.45] });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(wood, x + sx * hs - b, x + sx * hs + b, y + sy * hs - b, y + sy * hs + b, z + 0.08, z + H - 0.08, 0.005);
  for (const sy of [-1, 1]) { f.box(M.GLASS, x - hs + b, x + hs - b, y + sy * (hs - 0.01) - 0.004, y + sy * (hs - 0.01) + 0.004, z + 0.08, z + H - 0.08); f.box(M.GLASS, x + sy * (hs - 0.01) - 0.004, x + sy * (hs - 0.01) + 0.004, y - hs + b, y + hs - b, z + 0.08, z + H - 0.08); }
  flameCandle(K, f, x, y, z + 0.08, Math.min(H * 0.45, o.candle ?? 0.45), Math.min(0.16, hs * 0.55), { halo: o.halo ?? (H > 2 ? 0.8 : 0.45) });
  if (o.floor) f.block(x - hs, x + hs, y - hs, y + hs, z, z + Math.max(H, 1.6));
}
// A drum of pale stone, a side table (the pool's tables); returns its top
export function stoneDrum(K, f, x, y, r = 0.7, h = 1.6, mat = 'limestone_smooth#c9c0ab') {
  vessel(K, f, mat, x, y, 0, [[0, 0], [r * 0.82, 0], [r * 0.8, h - 0.12], [r, h - 0.08], [r, h], [0, h]], 20);
  f.block(x - r, x + r, y - r, y + r, 0, 1.6);
  return h;
}
// A small plain oak table, four square legs, a thick top; returns its top
export function oakTable(K, f, x, y, w = 1.3, d = 1.3, h = 1.75, wood = M.OAKP) {
  const a = w / 2, b = d / 2;
  f.bev(wood, x - a, x + a, y - b, y + b, h - 0.14, h, 0.02, { grain: 'x' });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(wood, x + sx * (a - 0.12) - 0.07, x + sx * (a - 0.12) + 0.07, y + sy * (b - 0.12) - 0.07, y + sy * (b - 0.12) + 0.07, 0, h - 0.14, 0.01, { grain: 'z' });
  f.bev(wood, x - a + 0.15, x + a - 0.15, y - b + 0.15, y + b - 0.15, 0.35, 0.42, 0.01, { grain: 'x' });
  f.block(x - a, x + a, y - b, y + b, 0, 1.6);
  return h;
}
// A bed of ferns and mossy rocks at the foot of a wall, in a low kerb of pale stone (the pool's planting). f: a wall
// frame; x0..x1 along the wall, d out from it.
export function fernBed(K, f, x0, x1, d = 2.0, o = {}) {
  const S = o.stone ?? 'limestone_smooth#c9c0ab', h = 0.55;
  f.bev(S, x0, x1, d - 0.25, d, 0, h, 0.02, { grain: 'x' });
  f.bev(S, x0, x0 + 0.25, 0.02, d - 0.25, 0, h, 0.02); f.bev(S, x1 - 0.25, x1, 0.02, d - 0.25, 0, h, 0.02);
  f.box('c#3a2a1e/0.95', x0 + 0.25, x1 - 0.25, 0.02, d - 0.25, 0, h - 0.08);
  f.block(x0, x1, 0, d, 0, 1.6);
  const n = Math.max(2, Math.round((x1 - x0) / 2.2));
  const L = leafKit(K);
  for (let i = 0; i < n; i++) { const x = x0 + 0.9 + i * ((x1 - x0 - 1.8) / Math.max(1, n - 1)); bostonFern(K, L, f, x, d * 0.45 + (i % 2 ? 0.15 : -0.1), h - 0.05, 0.85 + (i % 3) * 0.1, 11 + i); }
  L.flush();
  return h;
}

// =================================================================================================================
// REAL PLANTS AND FLOWERS (STYLE.md, "No sticks in vases"): leaves of real shapes, many of them, as the Pool's planting
// is made (pool_chapel_parts.js, banya_parts.js: written again here so the files stay each its own)
// =================================================================================================================
export function leafKit(K) {
  const B = new Map();
  const add = (f, col, list) => { let m = B.get(f); if (!m) B.set(f, (m = {})); (m[col] ??= []).push(...list); };
  const SHAPE = { oval: [[0, 0], [0.35, 1], [0.72, 0.78], [1, 0]], lance: [[0, 0.25], [0.4, 1], [1, 0]], fiddle: [[0, 0.15], [0.25, 0.7], [0.55, 0.82], [0.8, 1], [0.95, 0.6], [1, 0]], heart: [[0, 0], [0.1, 0.85], [0.42, 1], [1, 0]], petal: [[0, 0.2], [0.3, 0.95], [0.7, 1], [1, 0]] };
  function leaf(f, col, base, az, pitch, L, W, o = {}) {
    const st = SHAPE[o.shape ?? 'oval'], fold = o.fold ?? 0.3, droop = o.droop ?? 0.4, out = [];
    const ca = Math.cos(az), sa = Math.sin(az), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const P = (u, s, lift) => { const up = lift - droop * u * u / L, al = u * cp - up * sp; return [base[0] + ca * al - sa * s, base[1] + sa * al + ca * s, base[2] + u * sp + up * cp]; };
    const rows = st.map(([t, w]) => { if (!w) { const p = P(t * L, 0, 0); return [p, p, p]; } return [P(t * L, -w * W, w * W * fold), P(t * L, 0, 0), P(t * L, w * W, w * W * fold)]; });
    const tri = (a, b, c) => { if (a !== b && b !== c && a !== c) out.push(a, b, c, a, c, b); };
    for (let j = 0; j < rows.length - 1; j++) for (let i = 0; i < 2; i++) { const a = rows[j][i], b = rows[j][i + 1], c = rows[j + 1][i + 1], d = rows[j + 1][i]; tri(a, b, c); tri(a, c, d); }
    add(f, col, out);
  }
  const flush = () => { for (const [f, m] of B) for (const [col, list] of Object.entries(m)) if (list.length) K.put(f, col, K.geom.tris(list)); B.clear(); };
  return { leaf, flush };
}
const GREENS = ['c#3f6233/0.55', 'c#4d7339/0.55', 'c#365a30/0.5'], FIG = ['c#2f5226/0.4', 'c#3c6630/0.4', 'c#284a22/0.45'];
// A Boston fern: fronds arching out and over, many leaflets each
export function bostonFern(K, L, f, x, y, z, s = 1, seed = 2) {
  const rnd = rng(seed + 7);
  for (let i = 0; i < 26; i++) {
    const az = i * 2.4 + rnd() * 0.4, ll = (1.2 + rnd() * 0.9) * s, up = 0.6 + rnd() * 0.9, c = Math.cos(az), sn = Math.sin(az), col = GREENS[i % 3];
    const pt = t => [x + c * ll * t * 0.95, y + sn * ll * t * 0.95, z + ll * (up * t - (up + 0.55) * t * t)];
    tube(K, f, 'c#4a6a32/0.8', [pt(0), pt(0.3), pt(0.6), pt(0.95)], 0.008 * s, 3);
    for (let j = 1; j <= 9; j++) { const t = 0.06 + 0.92 * j / 9, p = pt(t), q = 0.24 * s * Math.sin(Math.PI * Math.min(1, 0.12 + t)); for (const sd of [-1, 1]) L.leaf(f, col, p, az + sd * 1.25, -0.2, q, 0.045 * s, { shape: 'oval', fold: 0.2, droop: 0.3 }); }
  }
}
// A fiddle-leaf fig in a big jar: a trunk branching twice, big glossy fiddle-shaped leaves all up it
export function fiddleFig(K, L, f, x, y, z, s = 1, seed = 4) {
  const rnd = rng(seed), stems = [];
  for (let k = 0; k < 3; k++) { const a = k * 2.1 + rnd(), lean = 0.25 + rnd() * 0.3, tall = (3.6 + rnd() * 1.4) * s; stems.push(t => [x + Math.cos(a) * lean * t * t * tall * 0.4, y + Math.sin(a) * lean * t * t * tall * 0.4, z + tall * t]); }
  for (const P of stems) {
    tube(K, f, 'c#6a5a44/0.85', [P(0), P(0.35), P(0.7), P(1)], 0.045 * s, 6);
    for (let j = 0; j < 11; j++) { const t = 0.25 + 0.75 * j / 10, p = P(t), az = j * 2.4 + rnd() * 0.6, L0 = (0.75 + rnd() * 0.25) * s * (1.05 - 0.3 * t);
      L.leaf(f, FIG[j % 3], p, az, 0.35 + rnd() * 0.5, L0, L0 * 0.36, { shape: 'fiddle', fold: 0.12, droop: 0.25 }); }
  }
}
// A full bunch of flowers in a stoneware jug: ranunculus and peonies, their leaves, a few eucalyptus stems
export function bouquet(K, L, f, x, y, z, o = {}) {
  const s = o.s ?? 1, rnd = rng(o.seed ?? 5), cols = o.colours ?? ['c#f0d4d0/0.6', 'c#e8a8a0/0.6', 'c#f6efe4/0.6', 'c#d8786a/0.6', 'c#f2e2c2/0.6'];
  vessel(K, f, o.jug ?? 'c#e8e0cf/0.35', x, y, z, [[0, 0], [0.16 * s, 0], [0.24 * s, 0.18 * s], [0.25 * s, 0.4 * s], [0.16 * s, 0.6 * s], [0.13 * s, 0.68 * s], [0.16 * s, 0.74 * s], [0.14 * s, 0.75 * s], [0, 0.7 * s]], 18);
  const top = z + 0.72 * s, heads = [];
  for (let i = 0; i < 15; i++) {
    const a = i * 2.4 + rnd() * 0.5, r = (0.08 + rnd() * 0.42) * s, h = top + (0.45 + rnd() * 0.55 - r * 0.5) * s, hx = x + Math.cos(a) * r * 1.1, hy = y + Math.sin(a) * r * 1.1;
    tube(K, f, 'c#5a7a3a/0.8', [[x + Math.cos(a) * 0.03, y + Math.sin(a) * 0.03, top - 0.15 * s], [(x + hx) / 2, (y + hy) / 2, (top + h) / 2], [hx, hy, h]], 0.01 * s, 3);
    const R0 = (0.09 + rnd() * 0.06) * s, c = cols[i % cols.length];
    // a head: layered petals, a cup of them, its middle denser (ranunculus / peony)
    heads.push([c, K.geom.lathe([[0, -R0 * 0.45], [R0 * 0.7, -R0 * 0.35], [R0, 0], [R0 * 0.92, R0 * 0.3], [R0 * 0.6, R0 * 0.48], [R0 * 0.35, R0 * 0.42], [R0 * 0.15, R0 * 0.5], [0, R0 * 0.45]], { seg: 14, mod: (t, j) => 1 + 0.08 * Math.sin(t * (7 + j)) }).rotateX(rnd() * 0.5 - 0.25).translate(hx, hy, h)]);
    if (i % 2) L.leaf(f, GREENS[i % 3], [hx, hy, h - 0.2 * s], a + 0.6, -0.1, 0.32 * s, 0.1 * s, { shape: 'lance', fold: 0.25, droop: 0.4 });
  }
  const byCol = {}; for (const [c, g] of heads) (byCol[c] ??= []).push(g);
  for (const [c, list] of Object.entries(byCol)) K.put(f, c, merge(list));
  for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.3, P = t => [x + Math.cos(a) * 0.55 * t * s, y + Math.sin(a) * 0.55 * t * s, top + (0.9 * t - 0.5 * t * t) * s]; tube(K, f, 'c#6a7a6a/0.8', [P(0), P(0.5), P(1)], 0.007, 3); for (let j = 1; j <= 6; j++) L.leaf(f, 'c#8a9a8a/0.7', P(j / 6.5), a + j, 0, 0.09 * s, 0.07 * s, { shape: 'heart', fold: 0.1, droop: 0.05 }); }
}
