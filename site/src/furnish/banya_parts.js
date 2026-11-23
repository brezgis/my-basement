// banya_parts.js: the pieces the Tea Room, the Banya, the Parnaya and the Treatment Room are furnished with
// (banya.js places them). Everything is built in a kit frame (x along, y out toward the front, z up) and goes in
// through K.put, so it is drawn with the room it stands in. Leaves, palms and candles are grown and lit the way the
// Pool next door does them (pool_chapel_parts.js), written again here so that the two files stay each its own.
import { storedLogs } from '../kit/firewood.js';
import * as THREE from 'three';

const TAU = Math.PI * 2;

// ---- materials: few families, so few draw calls -------------------------------------------------------------
export const MAT = {
  OAK: 'oak_light#b8875a', OAKD: 'walnut', HONEY: 'oak_light#c99a62', OAKP: 'oak_light#c9a87e', HINOKI: 'oak_light#e6cfa4', CEDAR: 'oak_light#b07a52', LIME: 'oak_light#e2c99c', LIMED: 'oak_light#c9a878',   // fumed oak; linden for the steam room, new and weathered
  BRASS: 'c#c89a50/0.3/0.75', BRASSD: 'c#8c6a36/0.4/1', NICKEL: 'c#c8c4b8/0.25/1', COPPER: 'c#b06a40/0.32/1', IRON: 'c#2b2724/0.55/0.7', ZINC: 'c#a9aaa4/0.35/0.9',
  CHINA: 'c#ece4d4/0.35', GZHEL: 'c#3a3632/0.3', SLATE: 'slate#7a746c', SLATED: 'slate#5a5550', BRONZE: 'c#6a5034/0.4/1', GLASS: 'glass', TEA: 'c#6e2a0a/0.08', WATER: 'c#7fa3a6/0.06', WATERD: 'c#3e6a72/0.05',
  WAX: 'plaster#f3e8d0', WICK: 'plaster#1b1612', SOIL: 'plaster#3a2214', CLAY: 'plaster#b8704e', CLAYD: 'plaster#7e5240', GLAZE: 'plaster#2f4a44',
  TILEW: 'plaster#f1ebdd', TILEG: 'plaster#3c6a52', MARBLE: 'limestone_smooth#8a847a', MARBLED: 'slate#5a5650', STONE: 'limestone_smooth#b7ad9a',
  LINEN: 'linen#ece5d4', LINEN2: 'linen#d9cdb2', LINENR: 'linen#a8322a', SAGE: 'linen#8f9a7e', OCHRE: 'linen#c08a3a',
  TERRY: 'wool#ebe5d8', TERRY2: 'wool#d9cdb5', TERRY3: 'wool#9aa58c', TERRY4: 'wool#b98a6a',
  SHEEP: 'wool#f0e8da', FELT: 'wool#e6dcc6', FELT2: 'wool#b7a88c', FELT3: 'wool#6a5e52', FELT4: 'wool#4a4a46',
  BIRCH: 'c#56703a/0.75', BIRCH2: 'c#6a8040/0.75', OAKLEAF: 'c#4a5a2c/0.75', DRY: 'c#8a7d44/0.8', TWIG: 'c#5a4230/0.8', JUNIPER: 'c#3a5040/0.8',
};
const LEAF = ['c#3f6233/0.55', 'c#4d7339/0.55', 'c#365a30/0.5'], FROND = ['c#4f7a3a/0.6', 'c#5f8a42/0.6', 'c#46703a/0.6'];

// ---- small geometry ---------------------------------------------------------------------------------------------
export const vessel = (K, f, mat, x, y, z, prof, seg = 16, o = {}) => K.put(f, mat, K.geom.lathe(prof, { seg, ...o }), { at: [x, y, z], rz: o.rz, rx: o.rx });
export const tube = (K, f, mat, path, r, seg = 5) => K.put(f, mat, K.geom.sweep(path, r, { seg }));
export const ball = (K, f, mat, x, y, z, r, s = [1, 1, 1], seg = 10) => K.put(f, mat, new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))).scale(...s), { at: [x, y, z] });
// a cylinder lying along x, centred at (x, y, z) (a bolster, a rolled towel); rz turns it about z
export function roll(K, f, mat, x, y, z, r, len, o = {}) {
  const g = new THREE.CylinderGeometry(r, r, len, o.seg ?? 12, 1, false); g.rotateZ(Math.PI / 2); if (o.rz) g.rotateZ(o.rz);
  K.put(f, mat, g, { at: [x, y, z] });
}
// a lathe turned to lie on its side: its axis along the frame's x
export const lying = (K, f, mat, x, y, z, prof, seg = 14) => K.put(f, mat, K.geom.lathe(prof, { seg }), { ry: Math.PI / 2, at: [x, y, z] });
const rng = seed => { let k = (Math.abs(Math.floor(seed * 9301 + 49297)) % 2147483646) + 1; return () => ((k = (k * 16807) % 2147483647) / 2147483647); };

// The kit's leaf collector: triangles in a frame's feet, both faces, one mesh per colour
export function leaves(K) {
  const B = new Map();
  const add = (f, col, list) => { let m = B.get(f); if (!m) B.set(f, (m = {})); (m[col] ??= []).push(...list); };
  const SHAPE = { oval: [[0, 0], [0.35, 1], [0.72, 0.78], [1, 0]], lance: [[0, 0.25], [0.4, 1], [1, 0]], strap: [[0, 0.9], [0.55, 1], [1, 0]], heart: [[0, 0], [0.1, 0.85], [0.42, 1], [1, 0]], petal: [[0, 0.2], [0.3, 0.95], [0.7, 1], [1, 0]] };
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

// ---- pots and plants -----------------------------------------------------------------------------------------
export function pot(K, f, x, y, r, h, mat = MAT.CLAY, style = 'urn') {
  const P = style === 'urn'
    ? [[0, 0], [r * 0.55, 0], [r * 0.6, h * 0.06], [r * 0.5, h * 0.1], [r * 0.82, h * 0.35], [r, h * 0.7], [r * 0.95, h * 0.88], [r * 1.06, h * 0.92], [r * 1.06, h], [r * 0.96, h], [r * 0.94, h * 0.93], [0, h * 0.93]]
    : style === 'bowl' ? [[0, 0], [r * 0.5, 0], [r * 0.85, h * 0.35], [r, h], [r * 0.93, h], [r * 0.9, h * 0.9], [0, h * 0.9]]
      : [[0, 0], [r * 0.78, 0], [r * 0.92, h * 0.85], [r * 1.02, h * 0.87], [r * 1.02, h], [r * 0.95, h], [r * 0.92, h * 0.92], [0, h * 0.92]];
  const [innerRadius, soilHeight] = P.at(-2);
  vessel(K,f,mat,x,y,0,P.slice(0,-1),r>0.6?24:18);
  f.cyl(MAT.SOIL,x,y,soilHeight-0.025,soilHeight+0.005,innerRadius,innerRadius,24);
  return soilHeight;
}
// A kentia palm, after Frond's on Vesper Street
export function palm(K, L, f, x, y, z, s = 1, seed = 1) {
  const rnd = rng(seed), n = 14;
  for (let c = 0; c < 4; c++) { const a = c * 2.1 + rnd(), top = [x + Math.cos(a) * 0.18 * s, y + Math.sin(a) * 0.18 * s, z + (1.6 + c * 0.5) * s]; tube(K, f, 'c#6b6a3a/0.8', [[x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05, z], [(x + top[0]) / 2, (y + top[1]) / 2, z + (top[2] - z) * 0.55], top], 0.035 * s, 5); }
  for (let i = 0; i < n; i++) {
    const az = i * 2.4 + rnd() * 0.5, ll = 3.2 * s * (0.7 + rnd() * 0.45), rs = 1.25 * (0.7 + rnd() * 0.5), dr = 0.85, c = Math.cos(az), sn = Math.sin(az), col = FROND[i % 3], h0 = z + (1.4 + rnd() * 1.4) * s;
    const pt = t => [x + c * ll * 0.8 * t, y + sn * ll * 0.8 * t, h0 + ll * (rs * t - dr * t * t)];
    tube(K, f, 'c#5d7a3a/0.8', [[x, y, z + 0.3 * s], pt(0), pt(0.35), pt(0.7), pt(1)], 0.018 * s, 3);
    for (let j = 1; j <= 8; j++) { const t = 0.16 + 0.8 * j / 8, p = pt(t), sl = Math.atan(rs - 2 * dr * t) * 0.5, q = 0.85 * s * (1 - 0.6 * t * t); for (const sd of [-1, 1]) L.leaf(f, col, p, az + sd * 1.0, sl - 0.15, q, 0.055 * s, { shape: 'lance', fold: 0.15, droop: 0.5 }); }
  }
}
// A Boston fern
export function fern(K, L, f, x, y, z, s = 1, seed = 2) {
  const rnd = rng(seed + 7);
  for (let i = 0; i < 20; i++) {
    const az = i * 2.4 + rnd() * 0.4, ll = (1.3 + rnd() * 0.9) * s, up = 0.7 + rnd() * 0.9, c = Math.cos(az), sn = Math.sin(az), col = LEAF[i % 3];
    const pt = t => [x + c * ll * t * 0.95, y + sn * ll * t * 0.95, z + ll * (up * t - (up + 0.55) * t * t)];
    K.put(f, col, K.geom.sweep([0,0.16,0.3,0.44,0.58,0.72,0.86,1].map(pt), 0.014*s, {seg: 4}));
    for (let j = 1; j <= 7; j++) { const t = 0.08 + 0.9 * j / 7, p = pt(t), q = 0.26 * s * Math.sin(Math.PI * Math.min(1, 0.15 + t)); for (const sd of [-1, 1]) L.leaf(f, col, p, az + sd * 1.25, -0.2, q, 0.045 * s, { shape: 'oval', fold: 0.2, droop: 0.3 }); }
  }
}
// A geranium (pelargonium) in a clay pot: the plant of every Russian windowsill. Returns nothing; stands at z.
export function geranium(K, L, f, x, y, z, seed = 3, bloom = 'c#c8323a/0.6') {
  const rnd = rng(seed);
  vessel(K, f, MAT.CLAY, x, y, z, [[0, 0], [0.17, 0], [0.22, 0.32], [0.24, 0.33], [0.24, 0.38], [0.21, 0.38], [0, 0.35]], 12);
  for (let i = 0; i < 14; i++) { const a = i * 2.4 + rnd(), r = 0.06 + rnd() * 0.16, h = z + 0.4 + rnd() * 0.35; tube(K, f, 'c#5a7a3a/0.8', [[x, y, z + 0.35], [x + Math.cos(a) * r, y + Math.sin(a) * r, h]], 0.012, 3); L.leaf(f, LEAF[i % 3], [x + Math.cos(a) * r, y + Math.sin(a) * r, h], a, 0.15, 0.2, 0.11, { shape: 'heart', fold: 0.25, droop: 0.1 }); }
  for (let i = 0; i < 5; i++) { const a = i * 1.3 + rnd(), r = 0.05 + rnd() * 0.12, h = z + 0.85 + rnd() * 0.2, c = [x + Math.cos(a) * r, y + Math.sin(a) * r, h]; tube(K, f, 'c#5a7a3a/0.8', [[x, y, z + 0.4], c], 0.008, 3); ball(K, f, bloom, c[0], c[1], c[2] + 0.04, 0.085, [1, 1, 0.75], 7); }
}
// A moth orchid (Phalaenopsis) in a glazed pot: broad leaves at the foot, an arching stem of white flowers on a cane
export function orchid(K, L, f, x, y, z, o = {}) {
  vessel(K, f, o.pot ?? MAT.GZHEL, x, y, z, [[0, 0], [0.16, 0], [0.22, 0.08], [0.24, 0.42], [0.26, 0.45], [0.2, 0.45], [0, 0.42]], 16);
  for (let i = 0; i < 5; i++) L.leaf(f, 'c#3e5e30/0.45', [x, y, z + 0.44], i * 1.3 + 0.4, 0.15, 0.6, 0.16, { shape: 'strap', fold: 0.3, droop: 0.55 });
  tube(K, f, 'c#6a5a3a/0.8', [[x, y, z + 0.4], [x, y, z + 1.55]], 0.01, 3);
  const st = [[x, y, z + 0.45], [x + 0.02, y, z + 1.1], [x + 0.1, y, z + 1.55], [x + 0.32, y, z + 1.65], [x + 0.55, y, z + 1.55]];
  tube(K, f, 'c#5a6a3a/0.8', st, 0.012, 3);
  const pet = o.colour ?? 'c#f4f0f2/0.5', lip = 'c#c0407a/0.5';
  for (let i = 0; i < 7; i++) {
    const t = 0.35 + i * 0.1, j = Math.min(3, Math.floor(t * 4)), a = st[j], b = st[j + 1], u = t * 4 - j, c = [a[0] + (b[0] - a[0]) * u, a[1] + 0.08 * (i % 2 ? 1 : -1), a[2] + (b[2] - a[2]) * u - 0.06];
    for (let k = 0; k < 5; k++) L.leaf(f, pet, c, k * TAU / 5 + 0.3, -1.25 + (k % 2) * 0.12, 0.13, 0.08, { shape: 'petal', fold: 0.05, droop: 0.02 });
    ball(K, f, lip, c[0], c[1] - 0.02, c[2], 0.03, [1, 1, 1], 6);
  }
}

// ---- candles (lit by banya_fx.js's flames, one draw for a room) ---------------------------------------------------
export function pillar(K, f, x, y, z, tall, r, flames, o = {}) {
  vessel(K, f, o.wax ?? MAT.WAX, x, y, z, [[0, 0], [r, 0], [r, tall], [r - 0.02, tall + 0.008], [r * 0.55, tall - 0.025], [0, tall - 0.03]], r > 0.15 ? 16 : 12);
  K.put(f, MAT.WICK, K.geom.lathe([[0.006, tall - 0.03], [0.005, tall + 0.03], [0, tall + 0.03]], { seg: 4 }), { at: [x, y, z] });
  const [X, Y] = f.map(x, y); flames.push({ X, Y, h: f.h + z + tall + 0.02, s: o.s ?? (r > 0.15 ? 1.1 : 0.85) });
}
export function candleCluster(K, f, x, y, z, flames, n = 3, seed = 3) {
  const P = [[0, 0, 0.62, 0.16], [0.3, 0.12, 0.42, 0.13], [-0.18, 0.26, 0.3, 0.11], [0.12, -0.28, 0.5, 0.12], [-0.3, -0.12, 0.24, 0.1]];
  for (let i = 0; i < n; i++) { const [dx, dy, t, r] = P[((i + seed) % P.length + P.length) % P.length]; pillar(K, f, x + dx, y + dy, z, t * (0.9 + ((seed * 7 + i * 3) % 5) * 0.05), r, flames); }
}

// =================================================================================================================
// THE TEA ROOM
// =================================================================================================================
// A daybed (kushetka) along a frame's x, its middle at the frame's origin: an oak frame on turned feet, scrolled
// upholstered ends, a mattress, a bolster against each end, cushions, a wool blanket folded over the foot end.
// o: { len, w, fabric, blanket, cushions: [colour...], head: +1 | -1 (which end the head goes) }. Returns where to lie.
export function daybed(K, f, o = {}) {
  const len = o.len ?? 6.8, w = o.w ?? 3.0, hl = len / 2, hw = w / 2, rail = 1.05, top = 1.55, fab = o.fabric ?? 'velvet#7a2e2a', wood = o.wood ?? MAT.OAKD;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) vessel(K, f, wood, sx * (hl - 0.25), sy * (hw - 0.22), 0, [[0, 0], [0.09, 0], [0.13, 0.08], [0.15, 0.2], [0.1, 0.32], [0.12, 0.4], [0.12, 0.48], [0, 0.48]], 10);
  for (const sy of [-1, 1]) f.bev(wood, -hl + 0.1, hl - 0.1, sy * hw - 0.12, sy * hw + 0.02 * sy, 0.48, rail, 0.03);
  f.bev(wood, -hl + 0.1, hl - 0.1, -hw + 0.02, hw - 0.02, 0.55, rail - 0.05, 0.02);
  // the ends: scrolls of upholstery standing on the frame, a carved oak cap on each
  for (const sx of [-1, 1]) {
    f.cushion(fab, sx * hl - (sx > 0 ? 0.55 : 0), sx * hl + (sx < 0 ? 0.55 : 0), -hw, hw, rail - 0.05, 2.55, 0.18, { crown: 0.02, welt: 0.015 });
    roll(K, f, fab, sx * (hl - 0.27), 0, 2.55, 0.3, w + 0.02, { rz: Math.PI / 2, seg: 14 });
    for (const sy of [-1, 1]) vessel(K, f, wood, sx * (hl - 0.27), sy * (hw + 0.03), 2.55, [[0, -0.05], [0.2, -0.05], [0.23, 0], [0.2, 0.05], [0, 0.05]], 12, { rx: Math.PI / 2 });
  }
  // the mattress, tufted
  f.cushion(fab, -hl + 0.55, hl - 0.55, -hw + 0.05, hw - 0.05, rail - 0.02, top, 0.12, { crown: 0.04, welt: 0.015 });
  for (let i = 0; i < 6; i++) for (const sy of [-0.5, 0.5]) ball(K, f, MAT.BRASS, -hl + 1.1 + i * (len - 2.2) / 5, sy * (hw - 0.4), top + 0.04, 0.025, [1, 1, 0.6], 5);
  // bolsters against the ends, their ends gathered in tassels
  for (const sx of [-1, 1]) { roll(K, f, o.bolster ?? 'velvet#c39a4a', sx * (hl - 0.85), 0, top + 0.27, 0.27, w - 0.3, { rz: Math.PI / 2, seg: 14 }); for (const sy of [-1, 1]) ball(K, f, MAT.BRASS, sx * (hl - 0.85), sy * (hw - 0.12), top + 0.27, 0.06, [1, 1, 1], 6); }
  // cushions at the head end: an embroidered one, a plain one
  const hd = o.head ?? -1, C = o.cushions ?? ['linen#e9e1cf', 'wool#3c5a4a'];
  C.forEach((c, i) => K.cushion(f.sub(hd * (hl - 1.25 - i * 0.55), -0.2 + i * 0.35, 0, hd > 0 ? 1 : 3), 0, 0, top + 0.02, 1.3, 1.25, c, { tilt: 0.55 + i * 0.1 }));
  // the wool blanket, folded double across the foot end and hanging down the sides
  K.throwBlanket(f, -hd * hl + (hd < 0 ? -2.3 : 0.7), -hd * hl + (hd < 0 ? -0.7 : 2.3), -hw - 0.02, hw + 0.02, top + 0.02, o.blanket ?? 'wool#b4532a', { over: 'foot', rho: 0.1 });
  f.block(-hl, hl, -hw, hw, 0, 1.6);
  return { x: hd * (hl - 1.2), z: top + 0.75, dirx: -hd };      // where the eye rests lying back, and which way along x it looks
}

// A tiled stove (izraztsovaya pech) standing in a corner: a plinth, a body clad in glazed tiles (drawn on the room's
// sheet: drawTiles), a stepped cornice, a cast-iron door with the fire behind it, a warm bench round its foot.
// The frame: its back corner at the origin, the body along +x (w) and +y (d). Returns the fire's place and the faces.
export function tiledStove(K, f, w, d, tall, o = {}) {
  const W = MAT.TILEW, G = MAT.TILEG;
  f.bev(G, -0.05, w + 0.15, -0.05, d + 0.15, 0, 0.6, 0.03);                       // the plinth, green-glazed
  f.box(W, 0.02, w, 0.02, d, 0.6, tall - 0.9);                                        // the body
  for (let k = 0; k < 4; k++) f.bev(k % 2 ? W : G, -0.04 - k * 0.05, w + 0.04 + k * 0.05, -0.04 - k * 0.05, d + 0.04 + k * 0.05, tall - 0.9 + k * 0.15, tall - 0.75 + k * 0.15, 0.02);      // the cornice, stepped out
  f.bev(W, 0.1, w - 0.1, 0.1, d - 0.1, tall - 0.3, tall, 0.04);
  // a crown of tiles along the top, scalloped
  for (let i = 0; i < Math.floor(w / 0.6); i++) vessel(K, f, G, 0.35 + i * 0.6, d - 0.05, tall, [[0, 0], [0.26, 0], [0.22, 0.25], [0.12, 0.42], [0, 0.46]], 6, { sy: 0.25 });
  // the door: iron, with a brass knob and a slot of fire under it
  const dx = w * 0.5;
  f.box(MAT.IRON, dx - 0.65, dx + 0.65, d + 0.0, d + 0.09, 1.5, 2.6);
  f.box(MAT.IRON, dx - 0.55, dx + 0.55, d + 0.09, d + 0.13, 1.6, 2.5);
  for (let i = 0; i < 5; i++) f.box('e#ff8a3a/2.2', dx - 0.42 + i * 0.2, dx - 0.34 + i * 0.2, d + 0.125, d + 0.14, 1.72, 1.86);
  ball(K, f, MAT.BRASS, dx + 0.4, d + 0.17, 2.05, 0.05, [1, 1, 1], 6);
  // the warm bench round its foot (lezhanka), a striped runner on it
  f.bev(MAT.OAKD, -0.05, w + 0.15, d + 0.15, d + 1.35, 1.2, 1.4, 0.02);
  for (const x of [0.2, w - 0.1]) f.bev(MAT.OAKD, x - 0.1, x + 0.1, d + 0.3, d + 1.25, 0, 1.2, 0.02);
  f.block(-0.05, w + 0.15, -0.05, d + 1.35, 0, tall);
  return { fire: [dx, d + 0.2, 2.0], faces: { front: [0, w, d], side: [0, d, w] } };
}
// The stove's tiles, drawn: Yaroslavl tiles of the seventeenth century (the polychrome tiles of St John the Baptist at
// Tolchkovo), as a grid of white tiles each with a blue and ochre flower in a green frame. On a canvas W by H.
export function drawTiles(g, W, H, n = 4) {
  const s = W / n, rows = Math.round(H / s);
  g.fillStyle = '#d9d2c2'; g.fillRect(0, 0, W, H);
  for (let r = 0; r < rows; r++) for (let c = 0; c < n; c++) {
    const x = c * s, y = r * s, m = s * 0.04;
    const gr = g.createLinearGradient(x, y, x + s, y + s); gr.addColorStop(0, '#f6f1e4'); gr.addColorStop(1, '#e4dccb');
    g.fillStyle = gr; g.fillRect(x + m, y + m, s - 2 * m, s - 2 * m);
    g.strokeStyle = '#3c6a52'; g.lineWidth = s * 0.05; g.strokeRect(x + s * 0.1, y + s * 0.1, s * 0.8, s * 0.8);
    const cx = x + s / 2, cy = y + s / 2;
    g.fillStyle = '#2c4a9a';
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.16, cy + Math.sin(a) * s * 0.16, s * 0.13, s * 0.06, a, 0, TAU); g.fill(); }
    g.fillStyle = '#c98a2a'; g.beginPath(); g.arc(cx, cy, s * 0.08, 0, TAU); g.fill();
    g.fillStyle = '#3c6a52'; for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; g.beginPath(); g.ellipse(cx + Math.cos(a) * s * 0.27, cy + Math.sin(a) * s * 0.27, s * 0.07, s * 0.03, a, 0, TAU); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x + m * 2, y + m * 2, s * 0.35, s * 0.05);
  }
}

// The samovar: a Tula samovar of the 1890s in brass, its medals stamped on its shoulder, on its tray, the teapot
// warming on its crown, its slop bowl under the tap. On a table top at z of a frame, its tap toward +y. ~2,000 tris.
export function samovar(K, f, x, y, z, s = 1.25) {
  const B = MAT.BRASS, BD = MAT.BRASSD, P = (r, h) => [r * s, h * s];
  // the tray, the slop bowl
  vessel(K, f, B, x, y, z, [[0, 0], [0.7, 0], [0.78, 0.04], [0.8, 0.06], [0.74, 0.03], [0, 0.03]].map(([r, h]) => [r * s, h * s]), 24, { sy: 0.8 });
  vessel(K, f, B, x, y + 0.62 * s, z + 0.03 * s, [[0, 0], [0.14, 0], [0.2, 0.08], [0.22, 0.12], [0.2, 0.12], [0, 0.04]].map(([r, h]) => P(r, h)), 14);
  // the body: four feet on a square base, a waisted neck, the urn, the shoulder, the crown
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; vessel(K, f, BD, x + Math.cos(a) * 0.24 * s, y + Math.sin(a) * 0.24 * s, z + 0.03 * s, [[0, 0], [0.05, 0], [0.06, 0.04], [0.035, 0.1], [0, 0.1]].map(([r, h]) => P(r, h)), 6); }
  vessel(K, f, B, x, y, z + 0.13 * s, [[0, 0], [0.3, 0], [0.31, 0.04], [0.24, 0.08], [0.15, 0.14], [0.12, 0.3], [0.16, 0.34], [0.3, 0.4], [0.4, 0.5], [0.45, 0.7], [0.46, 0.92], [0.43, 1.08], [0.36, 1.18], [0.27, 1.24], [0.24, 1.26], [0.24, 1.3], [0.17, 1.33], [0.14, 1.42], [0.19, 1.45], [0.19, 1.49], [0, 1.49]].map(([r, h]) => P(r, h)), 28, { mod: (t, j) => (j >= 9 && j <= 12 ? 1 + 0.025 * Math.cos(t * 12) : 1) });
  // bands round the urn, and the medals (Tula samovars carried their makers' exhibition medals stamped in a row)
  for (const h of [0.52, 1.1]) vessel(K, f, BD, x, y, z + (0.13 + h) * s, [[0.0, 0], [0.43 + (h > 1 ? -0.02 : 0.01), 0], [0.45 + (h > 1 ? -0.03 : 0.015), 0.025], [0.43 + (h > 1 ? -0.02 : 0.01), 0.05], [0, 0.05]].map(([r, hh]) => P(r, hh)), 28);
  for (let i = 0; i < 5; i++) { const a = Math.PI / 2 + (i - 2) * 0.22; K.put(f, BD, new THREE.CylinderGeometry(0.06 * s, 0.06 * s, 0.015, 10).rotateZ(a - Math.PI / 2), { at: [x + Math.cos(a) * 0.395 * s, y + Math.sin(a) * 0.395 * s, z + 1.2 * s] }); }
  // two handles, black wooden grips on brass loops
  for (const sx of [-1, 1]) { tube(K, f, B, [[x + sx * 0.44 * s, y, z + 1.02 * s], [x + sx * 0.6 * s, y, z + 1.08 * s], [x + sx * 0.64 * s, y, z + 1.22 * s], [x + sx * 0.4 * s, y, z + 1.28 * s]], 0.018 * s, 5); roll(K, f, 'c#1e1714/0.5', x + sx * 0.64 * s, y, z + 1.15 * s, 0.035 * s, 0.14 * s, { rz: Math.PI / 2, seg: 8 }); }
  // the tap: a spout out to the front, its key on top, a little scroll under
  tube(K, f, B, [[x, y + 0.4 * s, z + 0.52 * s], [x, y + 0.56 * s, z + 0.52 * s], [x, y + 0.62 * s, z + 0.44 * s], [x, y + 0.63 * s, z + 0.38 * s]], 0.035 * s, 8);
  vessel(K, f, B, x, y + 0.5 * s, z + 0.54 * s, [[0, 0], [0.04, 0], [0.035, 0.08], [0.09, 0.1], [0.09, 0.12], [0, 0.12]].map(([r, h]) => P(r, h)), 8, { sy: 0.4 });
  // the chimney cap with its little lid and the teapot on the crown
  const tz = z + (0.13 + 1.49) * s;
  teapot(K, f, x, y, tz, 0.95 * s);
  return { tap: [x, y + 0.63 * s, z + 0.4 * s], top: tz, h: 1.62 * s };
}
// a painted china teapot (zavarnik), Gzhel blue on white, gilt rim; sits at z
export function teapot(K, f, x, y, z, s = 1) {
  vessel(K, f, MAT.CHINA, x, y, z, [[0, 0], [0.13, 0], [0.18, 0.05], [0.22, 0.16], [0.21, 0.26], [0.15, 0.32], [0.1, 0.33], [0.1, 0.35], [0, 0.35]].map(([r, h]) => [r * s, h * s]), 18);
  vessel(K, f, MAT.GZHEL, x, y, z + 0.14 * s, [[0, 0], [0.222 * s, 0], [0.226 * s, 0.05 * s], [0.218 * s, 0.1 * s], [0, 0.1 * s]], 18);
  vessel(K, f, MAT.CHINA, x, y, z + 0.33 * s, [[0, 0], [0.11 * s, 0], [0.08 * s, 0.05 * s], [0.03 * s, 0.07 * s], [0.04 * s, 0.11 * s], [0, 0.12 * s]], 12);
  tube(K, f, MAT.CHINA, [[x, y + 0.18 * s, z + 0.1 * s], [x, y + 0.3 * s, z + 0.18 * s], [x, y + 0.36 * s, z + 0.3 * s]], 0.03 * s, 6);
  tube(K, f, MAT.CHINA, [[x, y - 0.2 * s, z + 0.24 * s], [x, y - 0.32 * s, z + 0.22 * s], [x, y - 0.31 * s, z + 0.1 * s], [x, y - 0.2 * s, z + 0.08 * s]], 0.022 * s, 5);
}
// A glass of tea in its podstakannik (a filigree holder with a handle), a spoon standing in it
export function teaGlass(K, f, x, y, z, turn = 0, full = 0.8) {
  vessel(K, f, MAT.NICKEL, x, y, z, [[0, 0], [0.11, 0], [0.12, 0.03], [0.1, 0.05], [0.105, 0.16], [0.115, 0.18], [0.1, 0.18], [0, 0.05]], 12);
  K.put(f, MAT.NICKEL, K.geom.sweep([[0.11, 0, 0.17], [0.18, 0, 0.17], [0.2, 0, 0.12], [0.17, 0, 0.06], [0.1, 0, 0.05]], 0.012, { seg: 4 }), { rz: turn, at: [x, y, z] });
  vessel(K, f, MAT.GLASS, x, y, z + 0.04, [[0, 0], [0.085, 0], [0.098, 0.34], [0.092, 0.34], [0.08, 0.02], [0, 0.02]], 12);
  vessel(K, f, MAT.TEA, x, y, z + 0.06, [[0, 0], [0.08, 0], [0.088, 0.3 * full], [0, 0.3 * full]], 10);
  tube(K, f, MAT.NICKEL, [[x + 0.03, y + 0.02, z + 0.1], [x + 0.05, y + 0.03, z + 0.45]], 0.008, 3);
}
// a jar of jam (varenye), a paper cap tied over it; and a glass rosette of jam with a spoon
export function jamJar(K, f, x, y, z, jam = 'c#7a1020/0.25', cap = 'c#efe2c4/0.9') {
  vessel(K, f, MAT.GLASS, x, y, z, [[0, 0], [0.12, 0], [0.13, 0.02], [0.13, 0.3], [0.1, 0.34], [0.1, 0.37], [0, 0.37]], 12);
  vessel(K, f, jam, x, y, z + 0.01, [[0, 0], [0.12, 0], [0.122, 0.28], [0, 0.28]], 10);
  vessel(K, f, cap, x, y, z + 0.34, [[0, -0.06], [0.135, -0.07], [0.13, 0.0], [0.115, 0.04], [0, 0.045]], 10, { mod: (t, j) => (j < 2 ? 1 + 0.08 * Math.sin(t * 7) : 1) });
  vessel(K, f, 'c#a8322a/0.8', x, y, z + 0.33, [[0.105, 0], [0.108, 0], [0.108, 0.02], [0.105, 0.02]], 10);
}
export function rosette(K, f, x, y, z, jam = 'c#7a1020/0.25') {
  vessel(K, f, MAT.GLASS, x,y,z, [[0,0],[0.08,0],[0.09,0.025],[0.18,0.085],[0.19,0.12],[0.17,0.12],[0.15,0.08],[0,0.035]], 24);
  vessel(K, f, jam, x,y,z, [[0,0.036],[0.145,0.082],[0.159,0.099],[0.13,0.095],[0,0.094]], 24);
  for (let i=0;i<6;i++) {
    const a=i*2.4, r=0.044*Math.sqrt(i);
    ball(K,f,jam,x+r*Math.cos(a),y+r*Math.sin(a),z+0.097,0.044,[1,0.86,0.68],10);
  }
  ball(K,f,MAT.NICKEL,x+0.105,y+0.032,z+0.11,0.038,[1.3,0.8,0.24]);
  tube(K,f,MAT.NICKEL,[[x+0.13,y+0.045,z+0.11],[x+0.18,y+0.065,z+0.13],[x+0.29,y+0.10,z+0.145]],0.009,6);
}
// a turned honey pot (a little lime-wood barrel) with its dipper
export function honeyPot(K, f, x, y, z) {
  vessel(K, f, MAT.LIMED, x, y, z, [[0, 0], [0.18, 0], [0.22, 0.15], [0.22, 0.3], [0.18, 0.44], [0.19, 0.46], [0, 0.46]], 14);
  for (const h of [0.06, 0.4]) vessel(K, f, MAT.OAKD, x, y, z + h, [[0.19, 0], [0.205, 0], [0.205, 0.03], [0.19, 0.03]], 14);
  vessel(K, f, 'c#d99a2a/0.15', x, y, z + 0.44, [[0, 0], [0.17, 0], [0, 0.03]], 12);
  tube(K, f, MAT.LIMED, [[x + 0.04, y, z + 0.45], [x + 0.12, y + 0.06, z + 0.85]], 0.015, 4);
  vessel(K, f, MAT.LIMED, x + 0.05, y + 0.005, z + 0.46, [[0, 0], [0.04, 0.01], [0.045, 0.04], [0.04, 0.07], [0, 0.08]], 8);
}
// A plate (china, a blue rim)
export function plate(K, f, x, y, z, r = 0.33, c = MAT.CHINA) {
  K.put(f, c, K.geom.lathe([[0, 0], [r * 0.6, 0], [r * 0.62, 0.012], [r * 0.7, 0.012], [r, 0.035], [r * 0.98, 0.045], [r * 0.7, 0.024], [0, 0.022]], { seg: 18 }), { at: [x, y, z] });
  K.put(f, MAT.GZHEL, K.geom.lathe([[r * 0.86, 0.031], [r * 0.95, 0.038], [r * 0.95, 0.041], [r * 0.86, 0.034]], { seg: 18 }), { at: [x, y, z] });
}
// sushki: little hard rings of dough, a dozen strung on a string over a hook, or heaped on a plate
const sushkaGeo = () => new THREE.TorusGeometry(0.06, 0.022, 5, 10);
export function sushkiHeap(K, f, x, y, z, n = 14, seed = 4) {
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * 0.2, l = Math.floor(i / 6); K.put(f, 'c#c48a46/0.7', sushkaGeo(), { rx: (rnd() - 0.5) * 0.6, ry: (rnd() - 0.5) * 0.6, at: [x + Math.cos(a) * r, y + Math.sin(a) * r, z + 0.03 + l * 0.04] }); }
}
export function sushkiString(K, f, x, y, z, n = 16) {
  for (let i = 0; i < n; i++) { const t = i / (n - 1), a = (t - 0.5) * Math.PI * 0.9; K.put(f, 'c#c48a46/0.7', sushkaGeo(), { rx: Math.PI / 2, rz: a, at: [x + Math.sin(a) * 0.45, y + 0.03, z - Math.cos(a) * 0.45 + 0.45 - 0.5] }); }
  tube(K, f, 'c#e6dcc4/0.9', [[x - 0.4, y + 0.03, z - 0.25], [x, y + 0.03, z + 0.05], [x + 0.4, y + 0.03, z - 0.25]], 0.006, 3);
}
// pryaniki: a Tula pryanik (a slab of printed gingerbread with a glaze over it) and little round glazed ones
export function tulaPryanik(K, f, x, y, z, turn = 0) {
  K.put(f, 'c#8a5228/0.6', K.geom.bev(-0.32, 0.32, -0.22, 0.22, 0, 0.09, 0.03), { rz: turn, at: [x, y, z] });
  K.put(f, 'c#d6b07a/0.35', K.geom.bev(-0.26, 0.26, -0.16, 0.16, 0.09, 0.1, 0.01), { rz: turn, at: [x, y, z] });
}
export function pryanikiHeap(K, f, x, y, z, n = 10, seed = 5) {
  const rnd = rng(seed);
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = rnd() * 0.18, l = i < 6 ? 0 : 1; ball(K, f, i % 3 ? 'c#ece2cc/0.45' : 'c#a8642e/0.5', x + Math.cos(a) * r * (l ? 0.5 : 1), y + Math.sin(a) * r * (l ? 0.5 : 1), z + 0.035 + l * 0.06, 0.08, [1, 1, 0.5], 8); }
}
// a saucer of sliced lemon, a whole one beside
export function lemons(K, f, x, y, z) {
  plate(K, f, x, y, z, 0.24);
  for (let i = 0; i < 5; i++) K.put(f, 'c#f0d040/0.5', new THREE.CylinderGeometry(0.075, 0.075, 0.018, 10).rotateX(Math.PI / 2 + 0.15), { rz: i, at: [x - 0.08 + i * 0.04, y + (i % 2) * 0.04, z + 0.035 + i * 0.008] });
  ball(K, f, 'c#e6c23a/0.55', x + 0.14, y - 0.1, z + 0.09, 0.075, [1.25, 1, 1], 8);
}
// Fruit, as fruit: a lathe profile each (an apple's dimpled top, a pear's neck, a mandarin's squat, a pomegranate's
// crown), shared by the bowl and by what comes away in the hand (EAT below)
export const FRUIT = {
  apple: { r: 0.13, prof: [[0, 0.01], [0.05, 0], [0.1, 0.03], [0.128, 0.09], [0.125, 0.16], [0.09, 0.205], [0.035, 0.205], [0.012, 0.185], [0, 0.18]] },
  pear: { r: 0.11, prof: [[0, 0.005], [0.06, 0], [0.1, 0.04], [0.112, 0.1], [0.095, 0.17], [0.06, 0.23], [0.045, 0.28], [0.03, 0.31], [0, 0.315]] },
  mandarin: { r: 0.1, prof: [[0, 0.01], [0.06, 0], [0.095, 0.03], [0.102, 0.075], [0.09, 0.12], [0.05, 0.145], [0.015, 0.146], [0, 0.14]] },
  pomegranate: { r: 0.13, prof: [[0, 0.01], [0.07, 0], [0.12, 0.05], [0.133, 0.12], [0.115, 0.2], [0.06, 0.24], [0.035, 0.25], [0.04, 0.29], [0.028, 0.29], [0, 0.26]] },
};
const FCOL = { apple: ['c#b8322a/0.4', 'c#8ca83a/0.4', 'c#c8502a/0.4'], pear: ['c#c8b03a/0.5', 'c#b8a038/0.5'], mandarin: ['c#e8781e/0.55'], pomegranate: ['c#8e1a22/0.4'] };
export function fruitBowl(K, f, x, y, z, seed = 6) {
  const rnd = rng(seed), out = {};
  vessel(K, f, MAT.CHINA, x, y, z, [[0, 0], [0.22, 0], [0.24, 0.03], [0.12, 0.08], [0.1, 0.18], [0.3, 0.24], [0.55, 0.36], [0.68, 0.46], [0.66, 0.48], [0.5, 0.36], [0, 0.3]], 24);
  vessel(K, f, MAT.GZHEL, x, y, z + 0.4, [[0.6, 0], [0.685, 0.06], [0.68, 0.075], [0.6, 0.02]], 24);
  const Z = z + 0.3;
  // Fit the lowest point of each tilted fruit to the inside curve of the dish.
  const fruit = (kind, dx, dy, tilt, turn) => {
    const F = FRUIT[kind], px = x+dx, py = y+dy;
    const orient = g => g.rotateY(tilt).rotateZ(turn);
    const body = orient(K.geom.lathe(F.prof,{ seg:20, mod:(a,j)=>1+0.025*Math.cos(5*a+j*0.2) }));
    body.computeBoundingBox();
    const pz = Z + 0.12*Math.hypot(dx,dy) - body.boundingBox.min.z;
    const at = [px,py,pz], col = FCOL[kind];
    K.put(f,col[Math.floor(rnd()*col.length)],body,{at});
    const crown = F.prof.at(-1)[1];
    if (kind==='apple' || kind==='pear') {
      K.put(f,MAT.TWIG,orient(K.geom.sweep([[0,0,crown-0.009],[0.008,0,crown+0.028],[0.019,0.005,crown+0.052]],0.007,{seg:5})),{at});
    }
    (out[kind] ??= []).push(at);
  };
  fruit('pear', -0.37,-0.11,1.24,0.7); fruit('pear',0.29,0.23,1.1,2.1);
  fruit('apple',-0.23,0.22,0.8,0.32); fruit('apple',0.15,-0.20,0.65,1.9);
  fruit('apple',0.03,0.08,0.9,2.7); fruit('pomegranate',-0.12,-0.36,1.0,0.75);
  fruit('mandarin',0.40,-0.07,0.41,1.7); fruit('mandarin',-0.46,0.16,0.63,2.0);
  // a bunch of black grapes over the rim, on a stalk
  const gx = x + 0.45, gy = y - 0.3;
  tube(K, f, MAT.TWIG, [[gx - 0.1, gy + 0.05, Z + 0.34], [gx, gy, Z + 0.3]], 0.008, 3);
  for (let i = 0; i < 18; i++) { const l = Math.floor(i / 4), a = i * 1.7; ball(K, f, i % 5 ? 'c#3a1a3a/0.3' : 'c#4a2448/0.3', gx + Math.cos(a) * 0.07 * (3 - l * 0.6) / 3 + l * 0.04, gy + Math.sin(a) * 0.07, Z + 0.28 - l * 0.08, 0.045, [1, 1, 1.1], 8); }
  out.grapes = [[gx + 0.06, gy, Z + 0.15]];
  return out;
}
// half a watermelon on a plate, cut face to the room (the green rind, the white band, the red flesh and its seeds), and
// a slice cut from it lying beside (from the table in Kustodiev's Merchant's Wife at Tea)
export function watermelon(K, f, x, y, z) {
  plate(K, f, x, y, z, 0.62);
  const zc = z + 0.445, at = [x,y,zc];
  K.put(f,'c#355c2e/0.58',new THREE.SphereGeometry(0.42,36,15,0,TAU,0,Math.PI/2).rotateX(-Math.PI/2),{at});
  for (let i=0;i<12;i++) {
    const stripe = new THREE.SphereGeometry(0.421,4,12,i*TAU/12,0.082+0.035*Math.sin(i),0,Math.PI/2);
    K.put(f,'c#637d3b/0.57',stripe.rotateX(-Math.PI/2),{at});
  }
  K.put(f,'c#e2e0aa/0.7',new THREE.RingGeometry(0.372,0.42,36),{at});
  K.put(f,'melon_flesh',new THREE.CircleGeometry(0.372,36),{at});
  for (let i=0;i<19;i++) {
    const a=i*2.4, r=0.16+0.12*Math.sin(i*1.8)**2;
    K.put(f,'c#492d25/0.5',new THREE.SphereGeometry(0.012,7,5).scale(1.55,0.7,0.28).rotateZ(a),{at:[x+r*Math.cos(a),y+r*Math.sin(a),zc+0.003]});
  }
  // the slice beside it
  K.put(f, MAT.CHINA, K.geom.lathe([[0, 0], [0.2, 0], [0.24, 0.02], [0, 0.015]], { seg: 14 }), { at: [x + 0.72, y - 0.3, z] });
  slice(K, f, x + 0.72, y - 0.3, z + 0.02, 0.6);
}
// a watermelon slice: three nested wedges of a disc (rind, white, flesh) standing on the rind, seeds on both faces
const sliceParts = (r = 0.3, t = 0.07) => [['c#2e5a2a/0.45', r, t], ['c#f0ead6/0.6', r * 0.93, t + 0.004], ['melon_flesh', r * 0.87, t + 0.008]];
export function slice(K, f, x, y, z, turn = 0) {
  for (const [m,r,t] of sliceParts()) {
    const g = new THREE.CylinderGeometry(r,r,t,20,1,false,-0.54,1.08).rotateX(Math.PI/2).translate(0,0.15,0).rotateZ(turn);
    K.put(f,m,g,{at:[x,y,z+0.039]});
  }
  for (let i=0;i<6;i++) {
    const a = -0.36+i*0.14, r=0.13+(i%2)*0.052;
    const g = new THREE.SphereGeometry(0.009,6,4).scale(0.7,1.55,0.28);
    g.translate(r*Math.sin(a),0.15-r*Math.cos(a),0).rotateZ(turn);
    K.put(f,'c#492d25/0.5',g,{at:[x,y,z+0.079]});
  }
}
// The salon of pictures above a sideboard (a buffet): oak, panelled doors, a shelf-back with plates on it
export function buffet(K, f, w, o = {}) {
  const d = o.d ?? 1.7, h = o.h ?? 3.0, hw = w / 2, wood = o.wood ?? MAT.OAKD;
  f.bev(wood, -hw, hw, 0.02, d, 0.25, h - 0.1, 0.02);
  f.bev(wood, -hw - 0.08, hw + 0.08, 0.0, d + 0.08, h - 0.1, h, 0.03);
  for (const sx of [-1, 1]) for (const sy of [0.2, d - 0.2]) vessel(K, f, wood, sx * (hw - 0.2), sy, 0, [[0, 0], [0.08, 0], [0.11, 0.1], [0.08, 0.25], [0, 0.25]], 8);
  const n = Math.round(w / 1.6);
  for (let i = 0; i < n; i++) { const x0 = -hw + 0.1 + i * (w - 0.2) / n, x1 = x0 + (w - 0.2) / n - 0.1; f.bev(MAT.OAK, x0, x1, d, d + 0.05, 0.4, h - 0.3, 0.015); f.bev(wood, x0 + 0.15, x1 - 0.15, d + 0.05, d + 0.08, 0.6, h - 0.5, 0.01); ball(K, f, MAT.BRASS, i % 2 ? x0 + 0.2 : x1 - 0.2, d + 0.12, 1.7, 0.04, [1, 1, 1], 6); }
  // the back: a shelf of plates standing up
  f.bev(wood, -hw + 0.1, hw - 0.1, 0.04, 0.16, h, h + 1.8, 0.02);
  f.bev(wood, -hw + 0.1, hw - 0.1, 0.04, 0.65, h + 1.0, h + 1.08, 0.015);
  f.bev(wood, -hw + 0.05, hw - 0.05, 0.04, 0.7, h + 1.8, h + 1.9, 0.02);
  f.block(-hw, hw, 0, d + 0.1, 0, h);
  return h;
}

// A round table on a turned pedestal with three feet; returns its top
export function roundTable(K, f, x, y, r, h = 2.5, wood = MAT.OAKD) {
  vessel(K, f, wood, x, y, 0, [[0, 0.3], [0.25, 0.3], [0.22, 0.5], [0.14, 0.7], [0.18, 1.2], [0.12, 1.8], [0.16, 2.2], [0.3, h - 0.12], [0, h - 0.12]], 14);
  for (let k = 0; k < 3; k++) { const a = k * TAU / 3; tube(K, f, wood, [[x + Math.cos(a) * 0.15, y + Math.sin(a) * 0.15, 0.45], [x + Math.cos(a) * 0.8, y + Math.sin(a) * 0.8, 0.15], [x + Math.cos(a) * 1.1, y + Math.sin(a) * 1.1, 0.06]], 0.07, 6); }
  vessel(K, f, wood, x, y, h - 0.12, [[0, 0], [r - 0.05, 0], [r, 0.05], [r, 0.1], [r - 0.03, 0.12], [0, 0.12]], 32);
  f.block(x - r, x + r, y - r, y + r, 0, h);
  return h;
}
// A fringed silk lampshade (abazhur) on a cord: the lamp over every Russian tea table; hangs from ceiling zc
export function abazhur(K, f, x, y, zc, drop = 3.4, col = 'c#d0782a/0.6') {
  const z = zc - drop;
  tube(K, f, 'c#2a2420/0.6', [[x, y, zc], [x, y, z + 0.9]], 0.012, 3);
  vessel(K, f, 'shade', x, y, z, [[1.25, 0], [1.3, 0.05], [1.1, 0.35], [0.6, 0.75], [0.15, 0.9], [0, 0.92]], 24, { mod: (t, j) => 1 + 0.05 * Math.abs(Math.sin(t * 4)) });
  vessel(K, f, col, x, y, z + 0.005, [[1.27, -0.02], [1.32, 0.05], [1.12, 0.36], [1.06, 0.36], [1.24, 0.05]], 24, { mod: (t, j) => 1 + 0.05 * Math.abs(Math.sin(t * 4)) });
  // the fringe: a skirt of silk threads, long
  vessel(K, f, 'c#b85a1e/0.7', x, y, z - 0.75, [[1.3, 0], [1.31, 0.75], [1.29, 0.75], [1.28, 0]], 36, { mod: (t, j) => 1 + 0.05 * Math.abs(Math.sin(t * 4)) + 0.008 * Math.sin(t * 90) });
  return z;
}
// Felt banya hats: a bell crown and a turned-up brim, some with a band of red braid. Upright, on a shelf at z.
export function feltHat(K, f, x, y, z, col = MAT.FELT, band = null, s = 1) {
  vessel(K, f, col, x, y, z, [[0, 0.02], [0.36, 0.0], [0.4, 0.05], [0.37, 0.14], [0.27, 0.16], [0.27, 0.3], [0.24, 0.48], [0.16, 0.58], [0, 0.6]].map(([r, h]) => [r * s, h * s]), 14, { mod: (t, j) => 1 + 0.03 * Math.sin(t * 3 + j) });
  if (band) vessel(K, f, band, x, y, z + 0.17 * s, [[0.272 * s, 0], [0.276 * s, 0], [0.27 * s, 0.06 * s], [0.266 * s, 0.06 * s]], 14);
}
// a hat hanging on a wall peg: tipped forward off the wall
export function hatOnPeg(K, f, x, z, col, band) {
  K.put(f, MAT.OAK, K.geom.lathe([[0.05, 0], [0.04, 0.32], [0.06, 0.34], [0, 0.36]], { seg: 8 }), { rx: -Math.PI / 2 - 0.25, at: [x, 0.04, z] });
  const g = K.geom.lathe([[0, 0.02], [0.36, 0.0], [0.4, 0.05], [0.37, 0.14], [0.27, 0.16], [0.27, 0.3], [0.24, 0.48], [0.16, 0.58], [0, 0.6]], { seg: 14 });
  K.put(f, col, g, { rx: -1.25, at: [x, 0.36, z + 0.1] });
  if (band) K.put(f, band, K.geom.lathe([[0.272, 0.17], [0.276, 0.17], [0.27, 0.23], [0.266, 0.23]], { seg: 14 }), { rx: -1.25, at: [x, 0.36, z + 0.1] });
}

// ---- veniks ------------------------------------------------------------------------------------------------------
// A venik: a bundle of birch (or oak, or juniper) branches, the handle bound in twine, the leafy end fanned flat.
// Built along the frame's +z from (x, y, z) (handle at the bottom), turned by rx/rz. ~300 tris.
export function venik(K, L, f, x, y, z, o = {}) {
  const len = o.len ?? 2.0, col = o.col ?? MAT.BIRCH, rnd = rng(o.seed ?? 1), g = new THREE.Group();
  const T = (lx, ly, lz) => { const v = new THREE.Vector3(lx, ly, lz).applyEuler(new THREE.Euler(o.rx ?? 0, 0, o.rz ?? 0, 'ZYX')); return [x + v.x, y + v.y, z + v.z]; };
  const hl = len * 0.32;
  tube(K, f, MAT.TWIG, [T(0, 0, 0), T(0, 0, hl)], 0.065, 6);
  for (let i = 0; i < 3; i++) tube(K, f, 'c#d8ccae/0.9', [T(-0.07, 0, 0.05 + i * hl * 0.35), T(0.07, 0, 0.06 + i * hl * 0.35)], 0.012, 3);
  // twigs fanning out from the binding, leaves along them
  const nT = o.twigs ?? 7;
  for (let i = 0; i < nT; i++) {
    const s = (i / (nT - 1) - 0.5), a = T(s * 0.08, 0, hl), b = T(s * 0.32, (rnd() - 0.5) * 0.08, len * 0.65), c = T(s * 0.5 + (rnd() - 0.5) * 0.08, (rnd() - 0.5) * 0.1, len);
    tube(K, f, MAT.TWIG, [a, b, c], 0.012, 3);
    for (let j = 0; j < (o.leaves ?? 6); j++) {
      const t = 0.15 + j / (o.leaves ?? 6) * 0.85, p = [a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, a[2] + (c[2] - a[2]) * t];
      const az = rnd() * TAU, kind = o.kind ?? 'birch';
      L.leaf(f, rnd() < 0.3 ? (o.col2 ?? MAT.BIRCH2) : col, p, az, (rnd() - 0.5) * 1.6, kind === 'oak' ? 0.3 : kind === 'juniper' ? 0.18 : 0.22, kind === 'oak' ? 0.12 : kind === 'juniper' ? 0.03 : 0.1, { shape: kind === 'oak' ? 'oval' : kind === 'juniper' ? 'lance' : 'heart', fold: 0.2, droop: 0.05 });
    }
  }
  return g;
}

// ---- wash things ------------------------------------------------------------------------------------------------
// A shayka: the round wash basin of a public banya, here in brass (Sanduny's were zinc) with two handles. Hollow.
export function shayka(K, f, x, y, z, o = {}) {
  const m = o.mat ?? MAT.ZINC, r = o.r ?? 0.55, h = o.h ?? 0.45;
  vessel(K, f, m, x, y, z, [[0, 0], [r * 0.85, 0], [r * 0.9, 0.03], [r, h], [r * 1.05, h + 0.02], [r * 0.97, h + 0.02], [r * 0.9, 0.06], [0, 0.06]], 20);
  for (const h2 of [h * 0.3, h * 0.75]) vessel(K, f, m, x, y, z + h2, [[r * 0.9 + (r * 0.1) * h2 / h, 0], [r * 0.93 + (r * 0.1) * h2 / h, 0.01], [r * 0.93 + (r * 0.1) * h2 / h, 0.03], [r * 0.9 + (r * 0.1) * h2 / h, 0.04]], 20);
  for (const sx of [-1, 1]) tube(K, f, m, [[x + sx * r * 0.98, y - 0.12, z + h - 0.1], [x + sx * (r + 0.1), y - 0.08, z + h - 0.02], [x + sx * (r + 0.1), y + 0.08, z + h - 0.02], [x + sx * r * 0.98, y + 0.12, z + h - 0.1]], 0.02, 4);
  if (o.water !== false) vessel(K, f, MAT.WATER, x, y, z + 0.06, [[0, 0], [r * 0.86, 0], [r * 0.9, h * 0.6], [0, h * 0.6]], 16);
}
// A wooden bucket: lime staves, two iron hoops, a rope handle (or, with `ears`, two staves standing up as handles)
export function bucket(K, f, x, y, z, o = {}) {
  const r = o.r ?? 0.5, h = o.h ?? 0.9, wood = o.wood ?? MAT.LIMED;
  vessel(K, f, wood, x, y, z, [[0, 0.04], [r * 0.85, 0.04], [r * 0.86, 0], [r, h], [r * 0.92, h], [r * 0.8, 0.1], [0, 0.1]], 18, { mod: (t, j) => 1 + 0.012 * Math.cos(t * 18) });
  for (const t of [0.18, 0.78]) { const rr = r * (0.86 + 0.14 * t); vessel(K, f, MAT.IRON, x, y, z + h * t, [[rr - 0.005, 0], [rr + 0.012, 0], [rr + 0.012, 0.05], [rr - 0.005, 0.05]], 18); }
  if (o.ears) for (const sx of [-1, 1]) f.bev(wood, x + sx * r * 0.95 - 0.1, x + sx * r * 0.95 + 0.1, y - 0.04, y + 0.04, z + h - 0.2, z + h + 0.35, 0.02);
  if (o.water !== false) vessel(K, f, MAT.WATERD, x, y, z + 0.1, [[0, 0], [r * 0.78, 0], [r * 0.83, h * 0.62], [0, h * 0.62]], 14);
}
// A kovsh: a wooden ladle with a long handle, lying in or over something; from (x, y, z) along the frame's +x
export function kovsh(K, f, x, y, z, o = {}) {
  const len = o.len ?? 1.4, rz = o.rz ?? 0, tilt = o.tilt ?? 0.5;
  K.put(f, o.mat ?? MAT.LIMED, K.geom.lathe([[0, 0], [0.12, 0.005], [0.17, 0.06], [0.18, 0.13], [0.16, 0.13], [0.15, 0.07], [0.1, 0.03], [0, 0.03]], { seg: 12 }), { rz, at: [x, y, z] });
  const c = Math.cos(rz), s = Math.sin(rz);
  tube(K, f, o.mat ?? MAT.LIMED, [[x + c * 0.15, y + s * 0.15, z + 0.12], [x + c * len * 0.5, y + s * len * 0.5, z + 0.12 + tilt * 0.5], [x + c * len, y + s * len, z + 0.12 + tilt]], 0.03, 5);
}
// Brass wall taps over a wash bench (hot, cold), on a marble plate, a spout between; a wall frame
export function taps(K, f, x, z) {
  f.bev(MAT.MARBLE, x - 0.75, x + 0.75, 0.0, 0.08, z - 0.5, z + 0.45, 0.02);
  for (const [dx, cap] of [[-0.45, 'c#b02a2a/0.4'], [0.45, 'c#2a4ab0/0.4']]) {
    vessel(K, f, MAT.BRASS, x + dx, 0.08, z, [[0, 0], [0.06, 0], [0.05, 0.18], [0, 0.18]], 10, { rx: -Math.PI / 2 });
    for (let k = 0; k < 4; k++) roll(K, f, MAT.BRASS, x + dx, 0.24, z + 0.05, 0.015, 0.2, { rz: k * Math.PI / 4 + Math.PI / 2, seg: 5 });
    ball(K, f, cap, x + dx, 0.24, z + 0.05, 0.035, [1, 0.6, 1], 6);
  }
  tube(K, f, MAT.BRASS, [[x, 0.08, z - 0.15], [x, 0.32, z - 0.15], [x, 0.42, z - 0.3], [x, 0.43, z - 0.42]], 0.04, 8);
}
// Open oak shelves on a wall frame: folded sheets and towels, rolled ones in a pyramid
export function linenShelves(K, f, w, o = {}) {
  const d = o.d ?? 1.4, tall = o.tall ?? 7.0, zs = o.zs ?? [0.4, 1.95, 3.5, 5.05, 6.6], hw = w / 2;
  for (const x of [-hw, hw - 0.12, -0.06]) f.bev(MAT.OAK, x, x + 0.12, 0.05, d, 0, tall, 0.015);
  for (const z of zs) f.bev(MAT.OAKP, -hw, hw, 0.05, d, z - 0.1, z, 0.012);
  f.box('plaster#4a3b2c', -hw, hw, 0.02, 0.06, 0, tall);
  const C = [MAT.TERRY, MAT.LINEN, MAT.TERRY2, MAT.LINEN2, MAT.TERRY, MAT.TERRY4, 'linen#c9d0d8'];
  zs.slice(0, 4).forEach((z, i) => {
    for (const side of [-1, 1]) {
      const cx = side * hw / 2;
      if ((i + (side > 0 ? 1 : 0)) % 2) { const rr = 0.17, per = Math.floor((hw - 0.3) / (rr * 2.1)); for (let row = 0; row < 3; row++) for (let k = 0; k < per - row; k++) roll(K, f, C[(k + row + i) % C.length], cx - (per - row - 1) * rr * 1.05 + k * rr * 2.1, d / 2 + 0.05, z + rr + row * rr * 1.75, rr, d - 0.25, { seg: 10, rz: Math.PI / 2 }); }
      else K.foldedStack(f, cx, d / 2 + 0.05, z + 0.01, 5, [C[i % 7], C[(i + 3) % 7], MAT.LINEN], { w: hw - 0.45, d: d - 0.3, t: 0.15 });
    }
  });
  f.block(-hw, hw, 0, d, 0, tall);
}
// A row of oak pegs on a board (a wall frame), robes on them, a slatted bench under; returns nothing
export function robeRail(K, f, x0, x1, o = {}) {
  const zr = o.z ?? 5.9, n = o.n ?? 5, cols = o.cols ?? ['wool#ece6da', 'wool#e2d8c6', 'wool#b98a6a', 'wool#ece6da', 'wool#a9b39c'];
  f.bev(MAT.OAK, x0, x1, 0.02, 0.12, zr - 0.25, zr + 0.25, 0.015);
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / n;
    K.put(f, MAT.OAK, K.geom.lathe([[0.05, 0], [0.04, 0.3], [0.06, 0.32], [0.055, 0.36], [0, 0.37]], { seg: 8 }), { rx: -Math.PI / 2 - 0.25, at: [x, 0.12, zr] });
    if (i !== o.empty) K.coatOnPeg(f, x, 0.22, zr - 0.05, cols[i % cols.length], 'robe');
  }
  if (o.bench === false) return;
  const d = 1.25, h = 1.5;
  for (const x of [x0 + 0.3, x1 - 0.3]) f.bev(MAT.OAK, x - 0.08, x + 0.08, 0.15, d - 0.05, 0, h - 0.08, 0.012);
  f.bev(MAT.OAK, x0 + 0.2, x1 - 0.2, 0.25, d - 0.15, 0.35, 0.45, 0.01);
  for (let y = 0.1; y < d - 0.05; y += 0.2) f.bev(MAT.OAK, x0 + 0.1, x1 - 0.1, y, y + 0.15, h - 0.08, h, 0.01);
  f.block(x0, x1, 0, d, 0, 1.55);
  K.shoes?.(f, x0 + 1.0, 0.55, 0.0, 'slipper', 'wool#e9e1d2'); K.shoes?.(f, x0 + 2.4, 0.6, 0.0, 'slipper', 'wool#c9b49a');
  for (let i = 0; i < Math.floor((x1 - x0) / 2.2); i++) K.seat(f, x0 + 1.2 + i * 2.2, 0.7, h, 'sit on the bench');
}
// A slatted duckboard on the floor (a floor frame): x0..x1 by y0..y1, 0.12 high, walkable
export function duckboard(K, f, x0, x1, y0, y1, wood = MAT.LIMED) {
  for (const y of [y0 + 0.2, (y0 + y1) / 2, y1 - 0.35]) f.box(wood, x0 + 0.1, x1 - 0.1, y, y + 0.15, 0.0, 0.05);
  for (let x = x0; x < x1 - 0.2; x += 0.42) f.bev(wood, x, x + 0.32, y0, y1, 0.05, 0.12, 0.01);
}

// ---- the treatment room's pieces --------------------------------------------------------------------------------------
// A massage table along the frame's +y (its foot at y = 0, its head at y = len, the face cradle past it): oak legs and
// rails, a padded top dressed in a linen sheet, a towel folded at the foot, a bolster, a shelf of towels underneath.
// Returns { top, head } for the lie spot.
export function massageTable(K, f, o = {}) {
  const len = o.len ?? 6.3, w = o.w ?? 2.4, hw = w / 2, top = o.top ?? 2.55, wood = o.wood ?? MAT.OAK, pad = o.pad ?? 'leather#6a4a3a';
  for (const sx of [-1, 1]) for (const y of [0.3, len - 0.3]) f.bev(wood, sx * (hw - 0.2) - 0.08, sx * (hw - 0.2) + 0.08, y - 0.08, y + 0.08, 0, top - 0.35, 0.015);
  for (const sx of [-1, 1]) f.bev(wood, sx * (hw - 0.2) - 0.05, sx * (hw - 0.2) + 0.05, 0.3, len - 0.3, 0.55, 0.65, 0.01);
  f.bev(wood, -hw + 0.2, hw - 0.2, 0.3, len - 0.3, 0.6, 0.66, 0.01);      // the shelf
  f.bev(wood, -hw, hw, 0, len, top - 0.4, top - 0.3, 0.015);
  f.cushion(pad, -hw, hw, 0, len, top - 0.3, top - 0.05, 0.08, { crown: 0.02, welt: 0.012, k: 4, n: [3, 8, 2] });
  // the sheet over it, hanging a little down the sides
  K.cloth(f, o.sheet ?? MAT.LINEN, { cx: 0, cy: len / 2, z: top - 0.04, a: hw, b: len / 2 - 0.05, l: 0.35, r: 0.35, fr: 0.1, bk: 0.1, rho: 0.03, folds: 0.03, freq: 1.2, thick: 0.03, res: 0.3 });
  // the face cradle: a padded horseshoe on a bracket past the head end
  f.bev(wood, -0.1, 0.1, len - 0.05, len + 0.45, top - 0.45, top - 0.35, 0.01);
  const ring = new THREE.TorusGeometry(0.33, 0.1, 6, 14, Math.PI * 1.55); ring.rotateZ(-Math.PI / 2 - Math.PI * 0.775 + Math.PI);
  K.put(f, pad, ring, { at: [0, len + 0.5, top - 0.15] });
  K.put(f, o.sheet ?? MAT.LINEN, new THREE.TorusGeometry(0.33, 0.103, 6, 14, Math.PI * 1.55).rotateZ(-Math.PI / 2 - Math.PI * 0.775 + Math.PI), { at: [0, len + 0.5, top - 0.13], s: [1, 1, 0.7] });
  // a bolster for under the knees, a towel at the foot, towels on the shelf
  bolster(K, f, o.bolster ?? 'linen#a8b39c', 0, 1.6, top + 0.17, 0.2, w - 0.6, 0);
  K.foldedStack(f, 0, 0.55, top - 0.02, 2, [MAT.TERRY, MAT.TERRY3], { w: 1.3, d: 0.8, t: 0.13 });
  K.foldedStack(f, 0, len / 2, 0.66, 4, [MAT.TERRY, MAT.TERRY2, MAT.TERRY, MAT.TERRY3], { w: 1.4, d: 1.0, t: 0.15 });
  f.block(-hw, hw, 0, len + 0.85, 0, top);
  return { top, head: len - 0.7 };
}
// A two-tier oak and brass trolley of oils, scrubs, clays and hot stones; the frame at its middle
export function trolley(K, f, flames, o = {}) {
  const w = 2.6, d = 1.5, hw = w / 2, hd = d / 2, B = MAT.BRASS;
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { f.cyl(B, sx * (hw - 0.06), sy * (hd - 0.06), 0.2, 2.9, 0.035, 0.035, 6); ball(K, f, 'c#1e1a16/0.5', sx * (hw - 0.06), sy * (hd - 0.06), 0.1, 0.09, [1, 1, 1], 6); }
  for (const z of [0.9, 2.65]) { f.bev(MAT.OAKP, -hw, hw, -hd, hd, z - 0.06, z, 0.01); for (const sy of [-1, 1]) tube(K, f, B, [[-hw, sy * hd, z + 0.14], [hw, sy * hd, z + 0.14]], 0.018, 4); }
  tube(K, f, B, [[-hw - 0.05, -hd + 0.1, 2.95], [-hw - 0.25, -hd + 0.1, 2.95], [-hw - 0.25, hd - 0.1, 2.95], [-hw - 0.05, hd - 0.1, 2.95]], 0.025, 6);
  const z = 2.65;
  // amber bottles of oil, a pump of honey, a bowl of salt scrub with its scoop, bowls of blue and green clay, a brush
  [[-1.0, -0.4, 0.55, 'c#8a4a12/0.1'], [-0.82, -0.42, 0.45, 'c#6a3a0a/0.1'], [-0.64, -0.4, 0.62, 'c#8a4a12/0.1'], [-1.05, -0.12, 0.38, 'c#3a5a2a/0.1']].forEach(([x, y, h, c]) => { vessel(K, f, c, x, y, z, [[0, 0], [0.07, 0], [0.075, 0.03], [0.075, h * 0.7], [0.04, h * 0.85], [0.025, h], [0, h]], 10); vessel(K, f, 'c#1e1a16/0.4', x, y, z + h, [[0, 0], [0.027, 0], [0.027, 0.06], [0, 0.06]], 6); });
  vessel(K, f, MAT.CHINA, -0.25, 0.2, z, [[0, 0], [0.12, 0], [0.24, 0.12], [0.27, 0.2], [0.24, 0.2], [0, 0.06]], 16);
  vessel(K, f, 'c#ece6dc/0.95', -0.25, 0.2, z + 0.06, [[0, 0.06], [0.22, 0.08], [0.18, 0.14], [0, 0.16]], 14);
  vessel(K, f, 'c#e0b440/0.15', 0.2, -0.35, z, [[0, 0], [0.13, 0], [0.15, 0.25], [0.1, 0.3], [0, 0.3]], 12);
  for (const [x, y, c] of [[0.35, 0.25, 'c#7a92a8/0.95'], [0.75, 0.28, 'c#7a8a5a/0.95']]) { vessel(K, f, 'plaster#d8cbb0', x, y, z, [[0, 0], [0.1, 0], [0.2, 0.1], [0.22, 0.16], [0.19, 0.16], [0, 0.05]], 14); vessel(K, f, c, x, y, z + 0.05, [[0, 0], [0.18, 0.08], [0, 0.1]], 12); }
  candleCluster(K, f, 0.95, -0.35, z, flames, 2, 1);
  // below: the hot stones, basalt, in a copper roaster of water; folded towels
  vessel(K, f, MAT.COPPER, -0.45, 0, 0.9, [[0, 0], [0.5, 0], [0.55, 0.3], [0.58, 0.32], [0.52, 0.32], [0.48, 0.04], [0, 0.04]], 18, { sy: 0.7 });
  vessel(K, f, MAT.WATERD, -0.45, 0, 0.92, [[0, 0], [0.5, 0], [0, 0.22]], 14, { sy: 0.68 });
  for (let i = 0; i < 7; i++) ball(K, f, 'c#24221f/0.25', -0.45 + Math.cos(i * 2.3) * 0.25, Math.sin(i * 2.3) * 0.14, 1.12, 0.12, [1.25, 0.9, 0.5], 7);
  K.foldedStack(f, 0.65, 0, 0.9, 4, [MAT.TERRY, MAT.TERRY3, MAT.TERRY, MAT.TERRY2], { w: 0.95, d: 0.9, t: 0.14 });
  f.block(-hw, hw, -hd, hd, 0, 2.9);
}
// A towel warmer: a tall oak cabinet with a glazed door, rolled towels glowing warm inside (a wall frame)
export function towelWarmer(K, f, w, tall) {
  const hw = w / 2, d = 1.5;
  f.bev(MAT.OAK, -hw, hw, 0.02, d, 0, tall, 0.02);
  f.box('e#ffd6a0/0.35', -hw + 0.2, hw - 0.2, d - 0.3, d - 0.25, 0.6, tall - 0.4);
  for (let i = 0; i < 4; i++) { const z = 0.75 + i * (tall - 1.3) / 4; f.bev(MAT.OAKP, -hw + 0.18, hw - 0.18, d - 0.25, d - 0.02, z - 0.04, z, 0.01); for (let k = 0; k < 5; k++) roll(K, f, k % 2 ? MAT.TERRY : MAT.TERRY2, -hw + 0.4 + k * (w - 0.8) / 4, d - 0.13, z + 0.12, 0.12, 0.2, { rz: Math.PI / 2, seg: 10 }); }
  f.box(MAT.OAK, -hw + 0.08, hw - 0.08, d, d + 0.06, 0.4, 0.55); f.box(MAT.OAK, -hw + 0.08, hw - 0.08, d, d + 0.06, tall - 0.35, tall - 0.2);
  for (const sx of [-1, 1]) f.box(MAT.OAK, sx * hw - (sx > 0 ? 0.2 : -0.08) - 0.06, sx * hw - (sx > 0 ? 0.08 : -0.2), d, d + 0.06, 0.4, tall - 0.2);
  f.box(MAT.GLASS, -hw + 0.2, hw - 0.2, d + 0.025, d + 0.035, 0.55, tall - 0.35);
  ball(K, f, MAT.BRASS, hw - 0.3, d + 0.12, tall / 2, 0.05, [1, 1, 1], 6);
  f.block(-hw, hw, 0, d + 0.1, 0, tall);
}
// A folding screen of three oak-framed linen panels, zig-zag, along the frame's x from its middle
export function screen(K, f, o = {}) {
  const pw = o.pw ?? 2.1, tall = o.tall ?? 6.0, fab = o.fabric ?? 'linen#d6cdb6';
  for (let i = 0; i < 3; i++) {
    const a = (i % 2 ? -1 : 1) * 0.35, cx = (i - 1) * pw * Math.cos(0.35), cy = (i % 2) * 0.35 - 0.15, g = new THREE.Group();
    const s = f.sub(cx, cy, 0, 0);
    K.put(s, MAT.OAK, K.geom.bev(-pw / 2, pw / 2, -0.06, 0.06, 0.05, 0.25, 0.01), { rz: a });
    K.put(s, MAT.OAK, K.geom.bev(-pw / 2, pw / 2, -0.06, 0.06, tall - 0.2, tall, 0.01), { rz: a });
    for (const sx of [-1, 1]) K.put(s, MAT.OAK, K.geom.bev(sx * pw / 2 - 0.07, sx * pw / 2 + 0.07, -0.07, 0.07, 0, tall + 0.08, 0.01), { rz: a });
    K.put(s, fab, K.geom.bev(-pw / 2 + 0.07, pw / 2 - 0.07, -0.02, 0.02, 0.25, tall - 0.2, 0.004), { rz: a });
    void g;
  }
  f.block(-pw * 1.5, pw * 1.5, -0.6, 0.6, 0, tall);
}
// A copper basin on a turned oak stand, a jug in it
export function basinStand(K, f, x, y) {
  vessel(K, f, MAT.OAK, x, y, 0, [[0, 0], [0.5, 0], [0.5, 0.08], [0.22, 0.2], [0.12, 0.5], [0.15, 1.2], [0.1, 2.0], [0.14, 2.4], [0.35, 2.55], [0, 2.55]], 14);
  vessel(K, f, MAT.COPPER, x, y, 2.55, [[0, 0], [0.3, 0], [0.55, 0.15], [0.75, 0.32], [0.8, 0.34], [0.72, 0.34], [0.5, 0.18], [0.28, 0.06], [0, 0.06]], 22);
  vessel(K, f, MAT.WATER, x, y, 2.6, [[0, 0], [0.62, 0.2], [0, 0.21]], 18);
  vessel(K, f, MAT.COPPER, x + 0.2, y + 0.1, 2.61, [[0, 0], [0.16, 0], [0.2, 0.2], [0.14, 0.5], [0.12, 0.65], [0.16, 0.72], [0, 0.72]], 14);
  tube(K, f, MAT.COPPER, [[x + 0.06, y + 0.1, 3.25], [x - 0.1, y + 0.1, 3.15], [x - 0.08, y + 0.1, 2.9], [x + 0.06, y + 0.1, 2.85]], 0.02, 4);
  f.block(x - 0.8, x + 0.8, y - 0.8, y + 0.8, 0, 2.9);
}

// ---- things to eat and drink: built for the hand (hold.js) --------------------------------------------------------
const std = (T, c, r = 0.5) => new T.MeshStandardMaterial({ color: c, roughness: r });
const lath = (T, prof, col, seg = 14, r = 0.5) => { const g = new T.LatheGeometry(prof.map(([a, b]) => new T.Vector2(a, b)), seg); g.computeVertexNormals(); return new T.Mesh(g, std(T, col, r)); };
const fruitMesh = (T, kind, col) => { const g = new T.Group(), F = FRUIT[kind], m = lath(T, F.prof, col, 16, kind === 'pomegranate' ? 0.4 : 0.45); g.add(m);
  const top = F.prof[F.prof.length - 2][1];
  if (kind === 'mandarin') { const st = new T.Mesh(new T.SphereGeometry(0.014, 6, 4), std(T, 0x4d6d3c)); st.position.y = 0.146; g.add(st); const lf = new T.Mesh(new T.SphereGeometry(0.05, 8, 4), std(T, 0x3f6233)); lf.scale.set(1, 0.12, 0.45); lf.position.set(0.035, 0.15, 0); g.add(lf); }
  else { const st = new T.Mesh(new T.CylinderGeometry(0.006, 0.008, 0.07, 5), std(T, 0x5a4230, 0.8)); st.position.set(0.006, top + 0.02, 0); st.rotation.z = -0.2; g.add(st); }
  if (kind === 'apple') { const lf = new T.Mesh(new T.SphereGeometry(0.05, 8, 4), std(T, 0x4d7339)); lf.scale.set(1, 0.1, 0.45); lf.position.set(0.04, top + 0.04, 0); lf.rotation.z = 0.4; g.add(lf); }
  return g; };
export const EAT = {
  pryanik: T => { const g = new T.Group(); g.add(lath(T, [[0, 0], [0.09, 0], [0.105, 0.02], [0.1, 0.045], [0.07, 0.065], [0, 0.07]], 0xa8642e, 16, 0.65)); const gl = lath(T, [[0, 0.06], [0.07, 0.058], [0.095, 0.04], [0.1, 0.03], [0.102, 0.033], [0.072, 0.066], [0, 0.072]], 0xf2ead8, 16, 0.3); g.add(gl); return g; },
  tula: T => { const g = new T.Group(); const sh = new T.Shape(); const w = 0.21, d = 0.15, rr = 0.04; sh.moveTo(-w + rr, -d); sh.lineTo(w - rr, -d); sh.quadraticCurveTo(w, -d, w, -d + rr); sh.lineTo(w, d - rr); sh.quadraticCurveTo(w, d, w - rr, d); sh.lineTo(-w + rr, d); sh.quadraticCurveTo(-w, d, -w, d - rr); sh.lineTo(-w, -d + rr); sh.quadraticCurveTo(-w, -d, -w + rr, -d);
    const b = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3 }), std(T, 0x8a5228, 0.6)); b.rotation.x = -Math.PI / 2; g.add(b);
    const gl = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: 0.004, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.01, bevelSegments: 2 }), std(T, 0xd6b07a, 0.3)); gl.rotation.x = -Math.PI / 2; gl.scale.set(0.85, 0.85, 1); gl.position.y = 0.085; g.add(gl); return g; },
  sushka: T => new T.Mesh(new T.TorusGeometry(0.06, 0.022, 8, 18), std(T, 0xc48a46, 0.7)),
  apple: T => fruitMesh(T, 'apple', 0xb8322a),
  mandarin: T => fruitMesh(T, 'mandarin', 0xe8781e),
  pear: T => fruitMesh(T, 'pear', 0xc8b03a),
  pomegranate: T => { const g = fruitMesh(T, 'pomegranate', 0x8e1a22); return g; },
  grapes: T => { const g = new T.Group(); for (let i = 0; i < 14; i++) { const l = Math.floor(i / 4), a = i * 1.7; const m = new T.Mesh(new T.SphereGeometry(0.04, 10, 8), std(T, 0x3a1a3a, 0.3)); m.scale.y = 1.12; m.position.set(Math.cos(a) * 0.06 * (1 - l * 0.2), -l * 0.06, Math.sin(a) * 0.06 * (1 - l * 0.2)); g.add(m); } const st = new T.Mesh(new T.CylinderGeometry(0.006, 0.008, 0.12, 5), std(T, 0x5a4230, 0.8)); st.position.y = 0.08; g.add(st); return g; },
  jam: T => { const g = new T.Group(); const a = new T.Mesh(new T.CylinderGeometry(0.13, 0.05, 0.05, 18), new T.MeshStandardMaterial({ color: 0xd8e4e4, roughness: 0.05, transparent: true, opacity: 0.6 })); const b = new T.Mesh(new T.CylinderGeometry(0.1, 0.06, 0.02, 18), std(T, 0x7a1020, 0.2)); b.position.y = 0.015; g.add(a, b); for (let i = 0; i < 4; i++) { const c = new T.Mesh(new T.SphereGeometry(0.025, 8, 6), std(T, 0x5a0a14, 0.2)); c.position.set(Math.cos(i * 1.6) * 0.05, 0.03, Math.sin(i * 1.6) * 0.05); g.add(c); } return g; },
  watermelon: T => { const g = new T.Group(), t = 0.07;
    [[0x2e5a2a, 0.3, t], [0xf0ead6, 0.279, t + 0.004], [0xd8343a, 0.261, t + 0.008]].forEach(([c, r, th]) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, th, 16, 1, false, -0.45, 0.9), std(T, c, c === 0xd8343a ? 0.55 : 0.45)); m.rotation.x = Math.PI / 2; g.add(m); });
    for (let i = 0; i < 6; i++) for (const s of [-1, 1]) { const a = -0.3 + i * 0.12, r = 0.13 + (i % 2) * 0.05, sd = new T.Mesh(new T.SphereGeometry(0.012, 5, 3), std(T, 0x1a1410, 0.3)); sd.scale.set(1, 1.6, 0.3); sd.position.set(Math.sin(a) * r, -Math.cos(a) * r, s * 0.04); g.add(sd); }
    const w = new T.Group(); w.add(g); return w; },
};

// =================================================================================================================
// THE SPANYA LANGUAGE (notes/STYLE.md): low walnut, slate, cream wool and sheepskin, hidden amber light
// =================================================================================================================
// A low platform daybed after a Danish one of the 1950s (Børge Mogensen's): a walnut platform on a recessed plinth that
// glows amber underneath, a thick cream futon, a bolster at each end, a sheepskin, a wool blanket folded at the foot.
// Along the frame's x, its middle at the origin. Returns where the eye lies. o: { len, w, futon, bolster, blanket, head }
export function lowDaybed(K, f, o = {}) {
  const len = o.len ?? 6.8, w = o.w ?? 3.0, hl = len / 2, hw = w / 2, base = 0.75, top = base + 0.5, wood = o.wood ?? MAT.OAKD;
  f.box('c#1c1712/0.8', -hl + 0.35, hl - 0.35, -hw + 0.35, hw - 0.35, 0, 0.18);
  if (o.glow) f.box('e#ff9440/1.1', -hl + 0.4, hl - 0.4, -hw + 0.33, hw - 0.33, 0.04, 0.06);          // (a glow under it, out of sight)
  f.bev(wood, -hl, hl, -hw, hw, 0.18, base, 0.04);
  f.cushion(o.futon ?? 'linen#e4dccb', -hl + 0.12, hl - 0.12, -hw + 0.1, hw - 0.1, base, top, 0.16, { crown: 0.05, bulge: 0.03, welt: 0.014, k: 5, n: [8, 4, 2] });
  for (const sx of [-1, 1]) bolster(K, f, o.bolster ?? 'wool#3c4a3a', sx * (hl - 0.45), 0, top + 0.27, 0.27, w - 0.35, Math.PI / 2);
  const hd = o.head ?? -1;
  K.cushion(f.sub(hd * (hl - 1.05), 0, 0, hd > 0 ? 1 : 3), 0, 0, top + 0.02, 1.5, 1.2, o.cushion ?? 'wool#b0782e', { tilt: 0.6 });
  sheepskin(K, f, hd * (hl - 3.1), -0.2, top + 0.02, 1.9, w - 0.4, 0.3);
  K.throwBlanket(f, -hd * hl + (hd < 0 ? -2.0 : 0.6), -hd * hl + (hd < 0 ? -0.6 : 2.0), -hw - 0.02, hw + 0.02, top + 0.02, o.blanket ?? 'wool#8a5a2a', { over: 'foot', rho: 0.1 });
  f.block(-hl, hl, -hw, hw, 0, 1.6);
  return { x: hd * (hl - 1.2), z: top + 0.75 };
}
// A low lounge chair after Finn Juhl and Hans Wegner: a walnut frame on splayed legs, arms that float, a deep seat
// cushion and a tall back cushion in wool. The sitter faces +y; its seat at the frame's origin. Sittable.
export function loungeChair(K, f, fab = 'wool#33463a', o = {}) {
  const wood = o.wood ?? MAT.OAKD, w = 2.6, hw = w / 2;
  for (const sx of [-1, 1]) {
    tube(K, f, wood, [[sx * (hw - 0.15), 1.1, 0], [sx * (hw - 0.12), 0.95, 0.6], [sx * (hw - 0.1), 0.9, 1.25]], 0.06, 6);
    tube(K, f, wood, [[sx * (hw - 0.15), -1.15, 0], [sx * (hw - 0.12), -1.0, 0.6], [sx * (hw - 0.1), -0.9, 1.0]], 0.06, 6);
    K.put(f, wood, K.geom.bev(sx * hw - 0.12, sx * hw + 0.12, -1.0, 1.15, 1.95, 2.05, 0.03), {});
    tube(K, f, wood, [[sx * (hw - 0.05), 0.9, 1.3], [sx * (hw - 0.02), 0.95, 1.95]], 0.04, 5);
    tube(K, f, wood, [[sx * (hw - 0.05), -0.8, 1.05], [sx * (hw - 0.02), -0.85, 1.95]], 0.04, 5);
  }
  f.bev(wood, -hw + 0.1, hw - 0.1, -1.0, 0.95, 0.95, 1.08, 0.02);
  f.cushion(fab, -hw + 0.2, hw - 0.2, -0.85, 1.0, 1.08, 1.5, 0.12, { crown: 0.04, welt: 0.012 });
  K.put(f, fab, K.geom.softBox(-hw + 0.25, hw - 0.25, -0.2, 0.25, 0, 1.9, 0.14, { crown: 0.03, welt: 0.012 }), { rx: -0.3, at: [0, -0.95, 1.3] });
  f.block(-hw, hw, -1.15, 1.15, 0, 1.6);
  K.seat(f, 0, 0.1, 1.45, o.label ?? 'sit in the lounge chair');
}
// A low oval table in walnut on four splayed legs, top at h; returns h
export function ovalTable(K, f, x, y, a, b, h = 1.4, wood = MAT.OAKD) {
  vessel(K, f, wood, x, y, h - 0.1, [[0, 0], [a - 0.04, 0], [a, 0.04], [a, 0.08], [a - 0.03, 0.1], [0, 0.1]], 36, { sy: b / a });
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tube(K, f, wood, [[x + sx * a * 0.62, y + sy * b * 0.62, 0], [x + sx * a * 0.5, y + sy * b * 0.5, h - 0.1]], 0.06, 6);
  f.block(x - a, x + a, y - b, y + b, 0, h);
  return h;
}
// A plain massive walnut table on two slab trestles (picture 2's), top at 2.5; and a plain bench with a sheepskin
export function slabTable(K, f, w, d, h = 2.5, wood = MAT.OAKD) {
  f.bev(wood, -w / 2, w / 2, -d / 2, d / 2, h - 0.28, h, 0.03);
  for (const sx of [-1, 1]) { f.bev(wood, sx * (w / 2 - 1.0) - 0.22, sx * (w / 2 - 1.0) + 0.22, -d / 2 + 0.35, d / 2 - 0.35, 0.18, h - 0.28, 0.02); f.bev(wood, sx * (w / 2 - 1.0) - 0.3, sx * (w / 2 - 1.0) + 0.3, -d / 2 + 0.2, d / 2 - 0.2, 0, 0.18, 0.02); }
  f.bev(wood, -w / 2 + 1.0, w / 2 - 1.0, -0.12, 0.12, 0.5, 0.75, 0.02);
  f.block(-w / 2, w / 2, -d / 2, d / 2, 0, h);
  return h;
}
export function slabBench(K, f, w, o = {}) {
  const h = o.h ?? 1.5, d = o.d ?? 1.2, wood = o.wood ?? MAT.OAKD;
  f.bev(wood, -w / 2, w / 2, -d / 2, d / 2, h - 0.2, h, 0.03);
  for (const sx of [-1, 1]) f.bev(wood, sx * (w / 2 - 0.6) - 0.15, sx * (w / 2 - 0.6) + 0.15, -d / 2 + 0.12, d / 2 - 0.12, 0, h - 0.2, 0.02);
  for (const x of o.skins ?? []) sheepskin(K, f, x, 0.02, h + 0.01, 1.9, d + 0.15, 0.1 + x * 0.05);
  f.block(-w / 2, w / 2, -d / 2, d / 2, 0, h);
  for (let x = -w / 2 + 1.2; x < w / 2 - 0.6; x += 2.2) K.seat(f, x, 0, h, o.label ?? 'sit on the bench');
}
// A modern wood stove after the Scandinavian ones of the 1960s (Morsø, Jøtul): a black steel drum on a slate hearth,
// a tall window onto the fire, a flue straight up to the ceiling. At the frame's origin. Returns the fire's middle.
export function drumStove(K, f, o = {}) {
  const r = o.r ?? 1.0, h = o.h ?? 3.6, ceil = o.ceil ?? 10.8, STEEL = 'c#1b1918/0.5/0.6';
  f.bev(MAT.SLATED, -2.0, 2.0, -2.0, 2.0, 0, 0.3, 0.03);
  for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + (k - 1) * 2.1; tube(K, f, STEEL, [[Math.cos(a) * r * 0.75, Math.sin(a) * r * 0.75, 0.3], [Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 0.9]], 0.05, 5); }
  vessel(K, f, STEEL, 0, 0, 0.85, [[0, 0], [r, 0], [r, h], [r * 0.92, h + 0.1], [0.3, h + 0.15], [0, h + 0.15]], 24);
  f.cyl(STEEL, 0, 0, h + 0.95, ceil, 0.28, 0.28, 14);
  // the firebox: a steel box standing out of the drum's front, dark inside (the fire itself is banya_fx.js's
  // stoveFire), a pane of glass across its mouth in a steel frame, a brass knob
  const fy0 = r - 0.025, fy1 = r + 0.49;
  f.box('c#140c08/0.9', -0.6, 0.6, fy0, fy0 + 0.04, 1.2, 2.95);
  for (const sx of [-1, 1]) f.box(STEEL, sx * 0.6 - (sx > 0 ? 0 : 0.08), sx * 0.6 + (sx > 0 ? 0.08 : 0), fy0, fy1, 1.12, 3.03);
  f.box(STEEL, -0.68, 0.68, fy0, fy1, 1.12, 1.2); f.box(STEEL, -0.68, 0.68, fy0, fy1, 2.95, 3.03);
  f.box('c#2a1208/0.9', -0.6, 0.6, fy0, fy1 - 0.03, 1.2, 1.25);
  f.box(MAT.GLASS, -0.6, 0.6, fy1 - 0.025, fy1 - 0.015, 1.2, 2.95);
  for (const [x0, x1, z0, z1] of [[-0.68, -0.58, 1.12, 3.03], [0.58, 0.68, 1.12, 3.03], [-0.68, 0.68, 1.12, 1.22], [-0.68, 0.68, 2.93, 3.03]]) f.box(STEEL, x0, x1, fy1 - 0.015, fy1 + 0.03, z0, z1);
  ball(K, f, MAT.BRASS, 0.62, fy1 + 0.06, 2.1, 0.05, [1, 1, 1], 6);
  // a stack of birch logs beside it
  storedLogs(K,f,1.86,-.6,.30,1.35,.15,3,3);
  f.block(-1.2, 1.2, -1.2, 1.2, 0, ceil);
  f.block(1.4, 2.4, -1.4, 0.2, 0, 1.4);
  return { fire: [0, r, 2.1], box: { y: (fy0 + fy1) / 2, z: 1.25, w: 1.15, d: fy1 - fy0 - 0.1 } };
}
// A paper lantern after Isamu Noguchi's Akari: a tall ribbed globe of washi on a cord, glowing (not a lamp)
export function akari(K, f, x, y, zc, drop, r = 0.9, tall = 1.6) {
  const z = zc - drop - tall, P = [];
  for (let k = 0; k <= 16; k++) { const t = k / 16, rr = r * Math.pow(Math.sin(Math.PI * (0.06 + 0.88 * t)), 0.55) * (1 - 0.035 * Math.pow(Math.sin(t * Math.PI * 9), 2)); P.push([Math.max(0.12, rr), t * tall]); }
  P.unshift([0, 0]); P.push([0, tall]);
  tube(K, f, 'c#1e1a16/0.6', [[x, y, zc], [x, y, z + tall]], 0.012, 3);
  vessel(K, f, 'shade', x, y, z, P, 24);

}
// A strip of concealed amber light behind a walnut fascia along a wall frame (a cove): x0..x1 at height z
export const COVES = [];
export function cove(K, f, x0, x1, z, o = {}) {
  COVES.push({ a: f.map(x0, 0.03), b: f.map(x1, 0.03), h0: f.h + z + 0.18, h1: f.h + z + (o.up ?? 0.95), k: o.k ?? 1 });
  f.box('e#ffb060/2', x0, x1, 0.05, 0.14, z, z + 0.08);
  f.bev(o.wood ?? MAT.OAKD, x0 - 0.05, x1 + 0.05, 0.26, 0.34, z - 0.25, z + 0.18, 0.012);
  f.box(o.wood ?? MAT.OAKD, x0 - 0.05, x1 + 0.05, 0.02, 0.34, z - 0.3, z - 0.25);
  for (const [a0, a1] of [[x0 - 0.05, x0 + 0.02], [x1 - 0.02, x1 + 0.05]]) f.box(o.wood ?? MAT.OAKD, a0, a1, 0.02, 0.26, z - 0.25, z + 0.18);      // (its ends closed, so the strip never shows)
}
// A slatted screen of three timber panels (vertical laths), zig-zag along the frame's x
export function slatScreen(K, f, o = {}) {
  const pw = o.pw ?? 2.1, tall = o.tall ?? 6.0, wood = o.wood ?? MAT.OAKD;
  for (let i = 0; i < 3; i++) {
    const a = (i % 2 ? -1 : 1) * 0.35, s = f.sub((i - 1) * pw * Math.cos(0.35), (i % 2) * 0.35 - 0.15, 0, 0);
    for (const z of [0.15, tall - 0.1]) K.put(s, wood, K.geom.bev(-pw / 2, pw / 2, -0.06, 0.06, z - 0.1, z + 0.08, 0.01), { rz: a });
    for (let k = 0; k < 9; k++) { const x = -pw / 2 + 0.05 + k * (pw - 0.1) / 8; K.put(s, wood, K.geom.bev(x - 0.05, x + 0.05, -0.04, 0.04, 0.05, tall, 0.008), { rz: a }); }
  }
  f.block(-pw * 1.5, pw * 1.5, -0.6, 0.6, 0, tall);
}
// A cedar plunge tub, raised: staves and bronze hoops round a round tub, water in it. At the frame's origin.
export function cedarTub(K, f, R, H) {
  vessel(K, f, MAT.CEDAR, 0, 0, 0, [[R - 0.08, 0], [R, 0.1], [R, H], [R - 0.22, H], [R - 0.22, 0.4], [0, 0.4]], 48, { mod: (t, j) => (j >= 1 && j <= 3 ? 1 + 0.006 * Math.cos(t * 96) : 1) });
  for (const t of [0.12, 0.5, 0.88]) vessel(K, f, MAT.BRONZE, 0, 0, H * t, [[R + 0.005, 0], [R + 0.04, 0], [R + 0.04, 0.14], [R + 0.005, 0.14]], 48);
  vessel(K, f, MAT.HINOKI, 0, 0, H, [[R - 0.24, 0], [R + 0.08, 0], [R + 0.08, 0.1], [R - 0.24, 0.1]], 48);
  f.box('e#ff9440/1.1', -R * 0.6, R * 0.6, -R * 0.6, R * 0.6, 0.01, 0.03);
}
// Birch branches in a tall stoneware jar: a few bare-ish branches with small leaves near their tips (ikebana-plain)
export function branchJar(K, L, f, x, y, tall = 2.6, seed = 1) {
  const rnd = rng(seed);
  vessel(K, f, MAT.GZHEL, x, y, 0, [[0, 0], [0.4, 0], [0.55, 0.5], [0.58, 1.1], [0.45, 1.55], [0.3, 1.7], [0.32, 1.78], [0.26, 1.78], [0, 1.7]], 18);
  for (let i = 0; i < 6; i++) {
    const a = i * 2.3 + rnd(), lean = 0.25 + rnd() * 0.3, top = [x + Math.cos(a) * lean * tall, y + Math.sin(a) * lean * tall, 1.7 + tall * (0.75 + rnd() * 0.35)];
    const mid = [x + Math.cos(a) * lean * tall * 0.4, y + Math.sin(a) * lean * tall * 0.4, 1.7 + tall * 0.45];
    tube(K, f, 'c#d8d0c2/0.7', [[x, y, 1.0], mid, top], 0.022, 4);
    for (let j = 0; j < 9; j++) { const t = 0.45 + j * 0.06, p = [mid[0] + (top[0] - mid[0]) * t, mid[1] + (top[1] - mid[1]) * t, mid[2] + (top[2] - mid[2]) * t]; L.leaf(f, j % 3 ? MAT.BIRCH2 : MAT.BIRCH, p, rnd() * TAU, (rnd() - 0.3) * 1.2, 0.16, 0.08, { shape: 'heart', fold: 0.2, droop: 0.05 }); }
  }
}

// A floor lantern after Noguchi's Akari: a tall column of washi on three thin legs, glowing (not a lamp). At (x, y).
export function floorLantern(K, f, x, y, tall = 4.2, r = 0.55) {
  for (let k = 0; k < 3; k++) { const a = k * TAU / 3; tube(K, f, 'c#1e1a16/0.6', [[x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, 0], [x + Math.cos(a) * r * 0.75, y + Math.sin(a) * r * 0.75, 0.6]], 0.02, 3); }
  const P = []; for (let k = 0; k <= 10; k++) { const t = k / 10; P.push([r * (0.92 + 0.08 * Math.sin(Math.PI * t)) * (1 - 0.03 * Math.pow(Math.sin(t * Math.PI * 7), 2)), 0.6 + t * tall]); }
  vessel(K, f, 'shade', x, y, 0, [[0, 0.6], ...P, [0, 0.6 + tall]], 20);
  for (let i=0;i<=12;i++) {
    const t=i/12, rr=r*(0.92+0.08*Math.sin(Math.PI*t));
    vessel(K,f,'c#987c59/0.85',x,y,0.6+t*tall,[[rr-0.012,-0.014],[rr+0.004,-0.008],[rr+0.004,0.008],[rr-0.012,0.014]],24);
  }
  f.block(x - r, x + r, y - r, y + r, 0, 2);
}
// Built-in open shelves on a wall frame, lit: honey timber, a strip of amber light under each shelf, and on them the
// house's things: stoneware jars and bowls, stacks of linen, a row of books, small stones, candles. w wide, d deep.
export function litShelves(K, f, w, zs, flames, o = {}) {
  const d = o.d ?? 1.1, hw = w / 2, wood = o.wood ?? MAT.HONEY, rnd = rng(o.seed ?? 3), top = zs[zs.length - 1] + 0.1;
  for (const x of [-hw, hw - 0.12]) f.bev(wood, x, x + 0.12, 0.02, d, 0, top, 0.012);
  f.box(o.back ?? MAT.OAKD, -hw + 0.12, hw - 0.12, 0.02, 0.06, 0, top);
  const items = o.items ?? ['jar', 'bowls', 'linen', 'books', 'stones', 'candle', 'jar', 'books', 'bowls', 'linen'];
  zs.forEach((z, i) => {
    f.bev(wood, -hw, hw, 0.02, d, z - 0.1, z, 0.012);
    if (i > 0 && o.glow !== false) f.box('e#ff9440/1.1', -hw + 0.15, hw - 0.15, d - 0.25, d - 0.15, z - 0.13, z - 0.1);
    if (i === zs.length - 1 && !o.topItems) return;
    const nb = Math.max(2, Math.floor((w - 0.4) / 1.3));
    for (let k = 0; k < nb; k++) {
      const x = -hw + 0.4 + (k + 0.5) * (w - 0.8) / nb, it = items[(k + i * 3) % items.length], y = d * 0.5;
      if (it === 'jar') vessel(K, f, ['c#d8cdb8/0.5', 'c#8a6a4a/0.6', 'c#3a3632/0.35'][(k + i) % 3], x, y, z, [[0, 0], [0.2, 0], [0.26, 0.2], [0.27, 0.45], [0.16, 0.62], [0.12, 0.66], [0, 0.66]], 14);
      else if (it === 'bowls') for (let j = 0; j < 3; j++) vessel(K, f, MAT.CHINA, x, y, z + j * 0.07, [[0, 0], [0.12, 0], [0.24, 0.06], [0.3, 0.11], [0.27, 0.11], [0, 0.03]], 14);
      else if (it === 'linen') K.foldedStack(f, x, y, z, 4, [MAT.LINEN, MAT.TERRY2, MAT.LINEN, 'wool#b0782e'], { w: 0.9, d: d - 0.35, t: 0.12 });
      else if (it === 'books') K.bookRow(f, x - 0.5, x + 0.5, 0.1, z, 1.0, 0.95, { subject: o.subject ?? 'nature' });
      else if (it === 'stones') for (let j = 0; j < 4; j++) ball(K, f, 'c#3a3836/0.3', x - 0.3 + j * 0.2, y + (j % 2) * 0.12, z + 0.06, 0.09 + (j % 2) * 0.03, [1.3, 1, 0.55], 8);
      else if (it === 'candle' && flames) candleCluster(K, f, x, y, z, flames, 2, k + i);
      else if (it === 'plant') { vessel(K, f, MAT.CLAY, x, y, z, [[0, 0], [0.18, 0], [0.22, 0.34], [0, 0.32]], 12); for (let j = 0; j < 7; j++) tube(K, f, 'c#4d7339/0.6', [[x, y, z + 0.3], [x + Math.cos(j * 0.9) * 0.25, y + Math.sin(j * 0.9) * 0.12, z + 0.7 + (j % 3) * 0.12]], 0.015, 3); }
    }
  });
  f.block(-hw, hw, 0, d, 0, top);
}
// A low walnut cabinet (a credenza) with slatted doors on a recessed plinth, on a wall frame, top at h; returns h
export function credenza(K, f, w, o = {}) {
  const d = o.d ?? 1.5, h = o.h ?? 2.2, hw = w / 2;
  f.box('c#1c1712/0.8', -hw + 0.2, hw - 0.2, 0.1, d - 0.2, 0, 0.35);
  f.bev(MAT.OAKD, -hw, hw, 0.02, d, 0.35, h, 0.02);
  for (let x = -hw + 0.12; x < hw - 0.1; x += 0.22) f.box(MAT.HONEY, x, x + 0.12, d, d + 0.04, 0.5, h - 0.15);
  f.block(-hw, hw, 0, d + 0.05, 0, h);
  return h;
}
// A bed of moss at the foot of a wall or by the glass: a low green mound, a stone, ferns (the outside brought in)
export function mossBed(K, L, f, x, y, r = 1.8, seed = 7) {
  vessel(K, f, 'c#4a6a32/0.85', x, y, 0, [[0, 0.22], [r * 0.5, 0.2], [r * 0.85, 0.12], [r, 0.02], [0, 0.02]], 22, { mod: (t, j) => 1 + 0.08 * Math.sin(t * 3 + seed) });
  K.model?.('mossy_rock_03', f, x + r * 0.25, y - r * 0.1, 0.05, 0, { scale: r * 0.18, turn: seed });
  fern(K, L, f, x - r * 0.4, y + r * 0.2, 0.15, 0.85, seed);
  f.block(x - r * 0.8, x + r * 0.8, y - r * 0.8, y + r * 0.8, 0, 1.5);
}

// A hanging lantern with a candle in it: an oak frame round glass, an iron cap and ring, on a chain from the ceiling
// (zc above the frame); its flame goes on `flames`.
export function hangingLantern(K, f, x, y, zc, drop, flames, o = {}) {
  const s = o.size ?? 0.7, H = o.h ?? 1.3, hs = s / 2, z = zc - drop - H, wood = o.wood ?? MAT.OAK;
  tube(K, f, MAT.IRON, [[x, y, zc], [x, y, z + H + 0.35]], 0.015, 4);
  K.put(f, MAT.IRON, new THREE.TorusGeometry(0.1, 0.02, 5, 12).rotateX(Math.PI / 2), { at: [x, y, z + H + 0.3] });
  K.put(f, MAT.IRON, K.geom.lathe([[hs * 1.15, 0], [hs * 0.6, 0.18], [0.06, 0.28], [0, 0.3]], { seg: 4, rz: Math.PI / 4 }), { at: [x, y, z + H] });
  f.bev(wood, x - hs - 0.04, x + hs + 0.04, y - hs - 0.04, y + hs + 0.04, z, z + 0.1, 0.01);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(wood, x + sx * hs - 0.04, x + sx * hs + 0.04, y + sy * hs - 0.04, y + sy * hs + 0.04, z + 0.1, z + H, 0.008);
  for (const sy of [-1, 1]) { f.box(MAT.GLASS, x - hs + 0.03, x + hs - 0.03, y + sy * (hs - 0.02) - 0.005, y + sy * (hs - 0.02) + 0.005, z + 0.1, z + H); f.box(MAT.GLASS, x + sy * (hs - 0.02) - 0.005, x + sy * (hs - 0.02) + 0.005, y - hs + 0.03, y + hs - 0.03, z + 0.1, z + H); }
  pillar(K, f, x, y, z + 0.1, o.candle ?? 0.55, 0.13, flames, { s: 1.2 });
  return z + 0.1 + (o.candle ?? 0.55);
}
// A standing lantern on the floor: an oak frame round glass, three candles inside (for a corner)
export function floorCandleLantern(K, f, x, y, flames, o = {}) {
  const s = o.size ?? 0.9, H = o.h ?? 2.6, hs = s / 2, wood = o.wood ?? MAT.OAK;
  f.bev(wood, x - hs - 0.08, x + hs + 0.08, y - hs - 0.08, y + hs + 0.08, 0, 0.15, 0.02);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(wood, x + sx * hs - 0.05, x + sx * hs + 0.05, y + sy * hs - 0.05, y + sy * hs + 0.05, 0.15, H, 0.01);
  f.bev(wood, x - hs - 0.06, x + hs + 0.06, y - hs - 0.06, y + hs + 0.06, H, H + 0.12, 0.015);
  for (const sy of [-1, 1]) { f.box(MAT.GLASS, x - hs + 0.04, x + hs - 0.04, y + sy * (hs - 0.02) - 0.005, y + sy * (hs - 0.02) + 0.005, 0.15, H); f.box(MAT.GLASS, x + sy * (hs - 0.02) - 0.005, x + sy * (hs - 0.02) + 0.005, y - hs + 0.04, y + hs - 0.04, 0.15, H); }
  candleCluster(K, f, x, y, 0.15, flames, 3, o.seed ?? 2);
  f.block(x - hs, x + hs, y - hs, y + hs, 0, 2);
}

// A bolster: a long round cushion, its ends rounded and gathered to a button, lying along the frame's x (turned by rz
// about z), its middle at (x, y, z)
export function bolster(K, f, mat, x, y, z, r, len, rz = 0) {
  const P = [], N = 14;
  for (let i = 0; i <= N; i++) { const t = -1 + 2 * i / N, e = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t), 7)), 0.22), sag = 1 - 0.04 * Math.cos(t * Math.PI * 0.5); P.push([Math.max(0.03, r * e * sag), t * len / 2]); }
  P.unshift([0, -len / 2 - 0.01]); P.push([0, len / 2 + 0.01]);
  K.put(f, mat, K.geom.lathe(P, { seg: 16 }), { ry: Math.PI / 2, rz, at: [x, y, z] });
  for (const s of [-1, 1]) K.put(f, mat, K.geom.lathe([[0, 0], [0.05, 0], [0.04, 0.03], [0, 0.035]], { seg: 10 }), { ry: s * Math.PI / 2, rz, at: [x + Math.cos(rz) * s * len / 2, y + Math.sin(rz) * s * len / 2, z] });
}
// A sheepskin thrown over a bench or a daybed: a soft lumpy fleece, its edge wandering, thick and pale
export function sheepskin(K, f, x, y, z, w, d, turn = 0) {
  K.put(f, MAT.SHEEP, K.geom.pillow(w, d, 0.2, { n: 10, pinch: 0.14, lump: 0.035, rng: rng(Math.round(x * 13 + y * 7 + 3)) }), { rz: turn, at: [x, y, z + 0.08] });
}
// A wall sconce for a candle: an oak back plate, a brass arm, a drip cup, a pillar candle (on a wall frame)
export function sconce(K, f, x, z, flames) {
  f.bev(MAT.OAK, x - 0.12, x + 0.12, 0.02, 0.07, z - 0.3, z + 0.25, 0.012);
  tube(K, f, MAT.BRASS, [[x, 0.07, z - 0.1], [x, 0.25, z - 0.12], [x, 0.36, z - 0.02]], 0.018, 5);
  vessel(K, f, MAT.BRASS, x, 0.36, z - 0.02, [[0, 0], [0.04, 0], [0.11, 0.04], [0.1, 0.05], [0.04, 0.02], [0, 0.02]], 12);
  pillar(K, f, x, 0.36, z, 0.35, 0.07, flames, { s: 0.8 });
}
