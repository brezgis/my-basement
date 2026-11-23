// pool_chapel_parts.js: the pieces the Pool and the Chapel are furnished with (pool_chapel.js places them).
// Everything is built in a kit frame (x along, y out toward the front, z up) and goes in through K.put, so it is
// drawn with the room it stands in. Plants are grown the way Frond grows them on Vesper Street (the leaf and the
// palm of ~/projects/town_walk/site/src/shops/plants.js, written again here for this kit).
import * as THREE from 'three';

const TAU = Math.PI * 2;

// ---- materials: few families, so few draw calls -------------------------------------------------------------
export const MAT = {
  OAK: 'oak_light#5e4330', OAKP: 'oak_light#8a6748',                    // walnut-dark oak, and a lighter one for trays and shelves
  BRASS: 'c#b08d4a/0.32/1', BRONZE: 'c#5a4632/0.45/1', IRON: 'c#2b2724/0.55/0.7',
  WAX: 'plaster#f3e8d0', WICK: 'plaster#1b1612', GLASS: 'glass', WATER: 'c#9fb8b4/0.08',     // (plaster: one textured family a room, where plain paints cost a draw per 8 ft of floor)
  TERRY: 'wool#ebe5d8', TERRY2: 'wool#d9cdb5', TERRY3: 'wool#9aa58c', TERRY4: 'wool#b98a6a',     // towels: white, oat, sage, clay
  LINEN: 'linen#ddd2bb', LINEN2: 'linen#8f9a84', LINEN3: 'linen#a8765c',
  CLAY: 'plaster#c07a58', CLAYD: 'plaster#8a5a44', SOIL: 'plaster#3a2214', GLAZE: 'plaster#2f4a44', GLAZE2: 'plaster#6b5a3e',
  STONE: 'limestone_smooth#b7ad9a', STONED: 'limestone_smooth#7c7366',     // a pale bench stone and a dark one
};
const LEAF = ['c#3f6233/0.55', 'c#4d7339/0.55', 'c#365a30/0.5'], FROND = ['c#4f7a3a/0.6', 'c#5f8a42/0.6', 'c#46703a/0.6'];

// ---- small geometry ---------------------------------------------------------------------------------------------
// The kit's leaf collector: triangles in a frame's feet, both faces, one mesh per colour (as Frond's buckets)
export function leaves(K) {
  const B = new Map();
  const add = (f, col, list) => { let m = B.get(f); if (!m) B.set(f, (m = {})); (m[col] ??= []).push(...list); };
  // one leaf from base, heading az, pitched up by pitch, L long, W half-wide: shape [[t, w], ...] along it
  const SHAPE = { oval: [[0, 0], [0.35, 1], [0.72, 0.78], [1, 0]], lance: [[0, 0.25], [0.4, 1], [1, 0]], strap: [[0, 0.9], [0.55, 1], [1, 0]], heart: [[0, 0], [0.1, 0.85], [0.42, 1], [1, 0]] };
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

// a turned vessel: profile [[r, z], ...]
const vessel = (K, f, mat, x, y, z, prof, seg = 16) => K.put(f, mat, K.geom.lathe(prof, { seg }), { at: [x, y, z] });
const tube = (K, f, mat, path, r, seg = 5) => K.put(f, mat, K.geom.sweep(path, r, { seg }));
// a cylinder lying along x (a rolled towel), centred at (x, y, z)
export function roll(K, f, mat, x, y, z, r, len, o = {}) {
  const h = len / 2, P = [[0, -h], [r * 0.55, -h], [r * 0.86, -h + r * 0.08], [r * 0.98, -h + r * 0.3], [r, -h + r * 0.6], [r * 1.01, 0], [r, h - r * 0.6], [r * 0.98, h - r * 0.3], [r * 0.86, h - r * 0.08], [r * 0.55, h], [0, h]];
  const g = K.geom.lathe(P.map(([a, b]) => [a, b]), { seg: o.seg ?? 18, sx: 0.9 });      // (lathe runs round z: the roll lies along z here, then is laid down)
  g.rotateY(Math.PI / 2); if (o.rz) g.rotateZ(o.rz);
  K.put(f, mat, g, { at: [x, y, z - r * 0.05] });
  // the spiral of the rolled cloth at each end, a line of darker paint
  const sp = [], turns = 2.6;
  for (const e of [-1, 1]) { const pts = []; for (let i = 0; i <= 26; i++) { const t = i / 26, a = t * turns * Math.PI * 2, rr = r * (0.12 + 0.8 * t); pts.push([e * (h + 0.003), Math.cos(a) * rr, Math.sin(a) * rr * 0.9]); } sp.push(K.geom.sweep(pts, 0.006, { seg: 3 })); }
  const sg = K.geom.merge(sp); if (o.rz) sg.rotateZ(o.rz);
  K.put(f, 'c#8a8172/0.9', sg, { at: [x, y, z - r * 0.05] });
}

// ---- pots and plants -----------------------------------------------------------------------------------------
// A big pot standing at (x, y) of a floor frame; returns the soil height
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
// A kentia palm: arching fronds of narrow leaflets from a few canes, after Frond's palm()
export function palm(K, L, f, x, y, z, s = 1, seed = 1) {
  let k = seed * 9301 + 49297; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  const n = 15, canes = [], ribs = [];
  for (let c = 0; c < 4; c++) {                                     // the canes
    const a = c * 2.1 + rnd(), top = [x + Math.cos(a) * 0.18 * s, y + Math.sin(a) * 0.18 * s, z + (1.6 + c * 0.5) * s];
    canes.push(K.geom.sweep([[x + Math.cos(a) * 0.05, y + Math.sin(a) * 0.05, z], [(x + top[0]) / 2, (y + top[1]) / 2, z + (top[2] - z) * 0.55], top], 0.035 * s, { seg: 5 }));
  }
  for (let i = 0; i < n; i++) {
    const az = i * 2.4 + rnd() * 0.5, ll = 3.2 * s * (0.7 + rnd() * 0.45), rs = 1.25 * (0.7 + rnd() * 0.5), dr = 0.85, c = Math.cos(az), sn = Math.sin(az), col = FROND[i % 3];
    const h0 = z + (1.4 + rnd() * 1.4) * s;
    const pt = t => [x + c * ll * 0.8 * t, y + sn * ll * 0.8 * t, h0 + ll * (rs * t - dr * t * t)];
    ribs.push(K.geom.sweep([[x, y, z + 0.3 * s], pt(0), pt(0.35), pt(0.7), pt(1)], 0.018 * s, { seg: 3 }));
    const m = 9;
    for (let j = 1; j <= m; j++) { const t = 0.16 + 0.8 * j / m, p = pt(t), sl = Math.atan(rs - 2 * dr * t) * 0.5, q = 0.85 * s * (1 - 0.6 * t * t); for (const sd of [-1, 1]) L.leaf(f, col, p, az + sd * 1.0, sl - 0.15, q, 0.055 * s, { shape: 'lance', fold: 0.15, droop: 0.5 }); }
  }
  K.put(f, 'c#6b6a3a/0.8', K.geom.merge(canes)); K.put(f, 'c#5d7a3a/0.8', K.geom.merge(ribs));      // (one piece each, so the plant is drawn with the room its pot stands in)
}
// A Boston fern: a fountain of long arching fronds with leaflets down both sides
export function fern(K, L, f, x, y, z, s = 1, seed = 2) {
  let k = seed * 7919 + 13; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 22; i++) {
    const az = i * 2.4 + rnd() * 0.4, ll = (1.3 + rnd() * 0.9) * s, up = 0.7 + rnd() * 0.9, c = Math.cos(az), sn = Math.sin(az), col = LEAF[i % 3];
    const pt = t => [x + c * ll * t * 0.95, y + sn * ll * t * 0.95, z + ll * (up * t - (up + 0.55) * t * t)];
    K.put(f, col, K.geom.sweep([0,0.16,0.3,0.44,0.58,0.72,0.86,1].map(pt), 0.014*s, {seg: 4}));
    const m = 8;
    for (let j = 1; j <= m; j++) { const t = 0.08 + 0.9 * j / m, p = pt(t), q = 0.26 * s * Math.sin(Math.PI * Math.min(1, 0.15 + t)); for (const sd of [-1, 1]) L.leaf(f, col, p, az + sd * 1.25, -0.2, q, 0.045 * s, { shape: 'oval', fold: 0.2, droop: 0.3 }); }
  }
}

// ---- candles ---------------------------------------------------------------------------------------------------
// A pillar candle standing at (x, y, z) of a frame, r and tall; its flame (world) goes on `flames`
export function pillar(K, f, x, y, z, tall, r, flames, o = {}) {
  vessel(K, f, o.wax ?? MAT.WAX, x, y, z, [[0, 0], [r, 0], [r, tall], [r - 0.02, tall + 0.008], [r * 0.55, tall - 0.025], [0, tall - 0.03]], r > 0.15 ? 16 : 12);
  K.put(f, MAT.WICK, K.geom.lathe([[0.006, tall - 0.03], [0.005, tall + 0.03], [0, tall + 0.03]], { seg: 4 }), { at: [x, y, z] });
  const [X, Y] = f.map(x, y); flames.push({ X, Y, h: f.h + z + tall + 0.02, s: o.s ?? (r > 0.15 ? 1.15 : 0.9) });
}
// A taper in a plain brass stick
export function taper(K, f, x, y, z, tall, flames) {
  vessel(K, f, MAT.BRASS, x, y, z, [[0, 0], [0.12, 0], [0.12, 0.02], [0.05, 0.05], [0.03, 0.2], [0.06, 0.22], [0.05, 0.25], [0, 0.25]], 12);
  vessel(K, f, MAT.WAX, x, y, z + 0.24, [[0, 0], [0.035, 0], [0.03, tall], [0, tall + 0.01]], 8);
  const [X, Y] = f.map(x, y); flames.push({ X, Y, h: f.h + z + 0.24 + tall + 0.03, s: 0.7 });
}
// A cluster of pillar candles on a stone or brass dish
export function candleCluster(K, f, x, y, z, flames, n = 3, seed = 3) {
  const P = [[0, 0, 0.62, 0.16], [0.3, 0.12, 0.42, 0.13], [-0.18, 0.26, 0.3, 0.11], [0.12, -0.28, 0.5, 0.12], [-0.3, -0.12, 0.24, 0.1]];
  for (let i = 0; i < n; i++) { const [dx, dy, t, r] = P[(i + seed) % P.length]; pillar(K, f, x + dx, y + dy, z, t * (0.9 + ((seed * 7 + i * 3) % 5) * 0.05), r, flames); }
}

// ---- the Pool's pieces -----------------------------------------------------------------------------------------
// A teak-and-linen lounger: its foot at y = 0, its head at y = len, the back raised; a rolled towel at the head,
// folded ones at the foot. The frame's +y runs from foot to head.
export function lounger(K, f, o = {}) {
  const len = o.len ?? 6.4, w = o.w ?? 2.5, hw = w / 2, z0 = 0.95, hinge = len - 2.3, tilt = o.tilt ?? 0.62, wood = o.wood ?? MAT.OAK, cush = o.fabric ?? MAT.LINEN;
  for (const sx of [-1, 1]) {
    f.bev(wood, sx * hw - 0.09, sx * hw + 0.09, 0, len, z0 - 0.26, z0, 0.02);                    // the side rails
    for (const y of [0.12, len - 0.3]) f.bev(wood, sx * (hw - 0.2) - 0.08, sx * (hw - 0.2) + 0.08, y, y + 0.16, 0, z0 - 0.26, 0.015);      // legs
  }
  for (const y of [0, len - 0.12]) f.bev(wood, -hw, hw, y, y + 0.12, z0 - 0.26, z0, 0.02);     // the ends
  for (let y = 0.3; y < hinge; y += 0.42) f.bev(wood, -hw + 0.09, hw - 0.09, y, y + 0.26, z0 - 0.08, z0 - 0.02, 0.01);     // slats
  // the back: a slatted board raised on a strut, the cushion on it
  K.put(f, wood, K.geom.bev(-hw + 0.1, hw - 0.1, 0, 2.3, 0, 0.06, 0.01), { rx: tilt, at: [0, hinge, z0 - 0.04] });
  f.bev(wood, -0.08, 0.08, hinge + 1.4, hinge + 1.55, z0 - 0.26, z0 + 1.0, 0.01);
  f.cushion(cush, -hw + 0.06, hw - 0.06, 0.06, hinge + 0.05, z0, z0 + 0.36, 0.11, { k: 3, n: [6, 10, 2], crown: 0.045, bulge: 0.025, welt: 0.012, sag: [[0, -0.2, 0.025, 0.6]] });
  K.put(f, cush, K.geom.softBox(-hw + 0.06, hw - 0.06, 0.04, 2.25, 0.02, 0.36, 0.11, { k: 3, n: [6, 5, 2], crown: 0.04, bulge: 0.025, welt: 0.012 }), { rx: tilt, at: [0, hinge + 0.05, z0] });
  // a rolled towel at the head, as at Vals: laid across the back, near its top
  const s = 1.85, ty = hinge + 0.05 + s * Math.cos(tilt) - 0.36 * Math.sin(tilt), tz = z0 + s * Math.sin(tilt) + 0.36 * Math.cos(tilt) + 0.15;
  roll(K, f, o.towel ?? MAT.TERRY, 0, ty, tz, 0.17, w - 0.5);
  // two towels folded at the foot
  K.foldedStack(f, 0, 0.75, z0 + 0.33, 2, [o.towel2 ?? MAT.TERRY2, o.towel ?? MAT.TERRY], { w: 1.25, d: 0.85, t: 0.14 });
  f.block(-hw, hw, 0, len, 0, 1.6);
  const seat = f.sub(0, hinge - 0.2, 0, 2); K.seat(seat, 0, 0, z0 + 0.35, o.label ?? 'lie back on the lounger');
}
// A low round side table, mid-century: a walnut top with a rounded edge on three splayed tapered legs
export function drumTable(K, f, x, y, r = 0.7, h = 1.6) {
  vessel(K, f, MAT.OAK, x, y, h - 0.08, [[0, 0], [r - 0.03, 0], [r, 0.03], [r, 0.05], [r - 0.03, 0.08], [0, 0.08]], 28);
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + 0.5, c = Math.cos(a), s = Math.sin(a); tube(K, f, MAT.OAK, [[x + c * r * 0.8, y + s * r * 0.8, 0], [x + c * r * 0.45, y + s * r * 0.45, h - 0.08]], 0.035, 6); }
  f.block(x - r, x + r, y - r, y + r, 0, 1.6);
  return h;
}
// A carafe of water, two glasses and a dish of lemons on an oak tray: at (x, y, z) of a frame
export function carafeTray(K, f, x, y, z) {
  f.bev(MAT.OAKP, x - 0.7, x + 0.7, y - 0.45, y + 0.45, z, z + 0.05, 0.01);
  for (const s of [-1, 1]) f.bev(MAT.OAKP, x + s * 0.7 - (s > 0 ? 0.05 : 0), x + s * 0.7 + (s < 0 ? 0.05 : 0), y - 0.45, y + 0.45, z, z + 0.14, 0.008);
  const zt = z + 0.05;
  vessel(K, f, MAT.GLASS, x - 0.3, y, zt, [[0, 0], [0.18, 0], [0.2, 0.08], [0.19, 0.3], [0.1, 0.5], [0.065, 0.62], [0.075, 0.7], [0, 0.7]], 16);
  vessel(K, f, MAT.WATER, x - 0.3, y, zt + 0.01, [[0, 0], [0.17, 0], [0.18, 0.08], [0.175, 0.28], [0, 0.29]], 14);
  for (const [dx, dy] of [[0.12, 0.18], [0.3, -0.12]]) {
    vessel(K, f, MAT.GLASS, x + dx, y + dy, zt, [[0, 0], [0.09, 0], [0.1, 0.3], [0.095, 0.3], [0, 0.02]], 12);
    vessel(K, f, MAT.WATER, x + dx, y + dy, zt + 0.02, [[0, 0], [0.085, 0], [0.09, 0.16], [0, 0.16]], 10);
  }
  vessel(K, f, 'c#e8e2d4/0.3', x + 0.42, y + 0.2, zt, [[0, 0], [0.08, 0], [0.16, 0.06], [0.17, 0.07], [0, 0.03]], 12);
  for (const [dx, dy] of [[0.4, 0.17], [0.46, 0.25], [0.38, 0.27]]) K.put(f, 'c#e6c23a/0.6', new THREE.SphereGeometry(0.055, 8, 6).scale(1, 0.8, 0.8), { at: [x + dx, y + dy, zt + 0.08] });
}
// A row of oak pegs on a board on the wall (a wall frame), robes on them, a slatted bench under them
export function robes(K, f, x0, x1, o = {}) {
  const zr = 5.9, n = o.n ?? 5, cols = o.cols ?? ['wool#ece6da', 'wool#e2d8c6', 'wool#ece6da', 'wool#a9b39c', 'wool#ece6da', 'wool#d8c3a8'];
  f.bev(MAT.OAK, x0, x1, 0.02, 0.12, zr - 0.25, zr + 0.25, 0.015);
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * (i + 0.5) / n;
    K.put(f, MAT.OAK, K.geom.lathe([[0.05, 0], [0.04, 0.3], [0.06, 0.32], [0.055, 0.36], [0, 0.37]], { seg: 8 }), { rx: -Math.PI / 2 - 0.25, at: [x, 0.12, zr] });
    if (i !== o.empty) K.coatOnPeg(f, x, 0.22, zr - 0.05, cols[i % cols.length], 'robe');
  }
  // the bench
  const d = 1.25, h = 1.5;
  for (const x of [x0 + 0.3, x1 - 0.3]) f.bev(MAT.OAK, x - 0.08, x + 0.08, 0.15, d - 0.05, 0, h - 0.08, 0.012);
  f.bev(MAT.OAK, x0 + 0.2, x1 - 0.2, 0.25, d - 0.15, 0.35, 0.45, 0.01);
  for (let y = 0.1; y < d - 0.05; y += 0.2) f.bev(MAT.OAK, x0 + 0.1, x1 - 0.1, y, y + 0.15, h - 0.08, h, 0.01);
  f.block(x0, x1, 0, d, 0, 1.55);
  // slippers under it, a towel folded on it
  K.shoes?.(f, x0 + 1.2, 0.55, 0.0, 'slipper', 'wool#e9e1d2');
  K.shoes?.(f, x0 + 3.0, 0.6, 0.0, 'slipper', 'wool#c9b49a');
  K.foldedStack(f, x1 - 1.0, 0.65, h, 2, [MAT.TERRY, MAT.TERRY3], { w: 1.1, d: 0.8, t: 0.14 });
  for (let i = 0; i < Math.floor((x1 - x0) / 2.2); i++) K.seat(f, x0 + 1.2 + i * 2.2, 0.7, h, 'sit on the bench');
}
// Open oak shelves on a wall frame, w wide, d deep: folded and rolled towels in the colours of the place
export function towelShelves(K, f, w, o = {}) {
  const d = o.d ?? 1.3, tall = o.tall ?? 6.6, zs = [0.35, 1.9, 3.35, 4.8, 6.25], hw = w / 2;
  for (const x of [-hw, hw - 0.12, -0.06]) f.bev(MAT.OAK, x, x + 0.12, 0.05, d, 0, tall, 0.015);
  for (const z of zs) f.bev(MAT.OAKP, -hw, hw, 0.05, d, z - 0.1, z, 0.012);
  if (o.lit) for (const z of zs.slice(1)) f.box('e#ffb060/1.6', -hw + 0.2, hw - 0.2, d - 0.16, d - 0.11, z - 0.13, z - 0.105);      // (a strip of light under the front of each shelf)
  f.box('plaster#4a3b2c', -hw, hw, 0.02, 0.06, 0, tall);                                         // the back, dark
  const C = [MAT.TERRY, MAT.TERRY, MAT.TERRY2, MAT.TERRY3, MAT.TERRY, MAT.TERRY4];
  zs.slice(0, 4).forEach((z, i) => {
    for (const side of [-1, 1]) {
      const cx = side * hw / 2;
      if ((i + (side > 0 ? 1 : 0)) % 2) {                                                     // rolled towels, in a pyramid
        const rr = 0.17, per = Math.floor((hw - 0.3) / (rr * 2.1));
        for (let row = 0; row < 3; row++) for (let k = 0; k < per - row; k++) roll(K, f, C[(k + row + i) % C.length], cx - (per - row - 1) * rr * 1.05 + k * rr * 2.1, d / 2 + 0.05, z + rr + row * rr * 1.75, rr, d - 0.25, { seg: 10, rz: Math.PI / 2 });
      } else K.foldedStack(f, cx, d / 2 + 0.05, z + 0.01, 5, [C[i % 6], C[(i + 2) % 6], MAT.TERRY], { w: hw - 0.45, d: d - 0.3, t: 0.15 });
    }
  });
  // on top: a basket of rolled hand towels and a fern
  f.block(-hw, hw, 0, d, 0, tall);
}
// A big standing lantern: a bronze frame round glass, a pillar candle inside; returns the candle's flame
export function lantern(K, f, x, y, flames, o = {}) {
  const s = o.size ?? 1.1, H = o.h ?? 3.2, hs = s / 2, b = 0.06;
  // base and top: stepped bronze plates
  f.bev(MAT.BRONZE, x - hs - 0.06, x + hs + 0.06, y - hs - 0.06, y + hs + 0.06, 0, 0.18, 0.02);
  f.bev(MAT.BRONZE, x - hs, x + hs, y - hs, y + hs, 0.18, 0.26, 0.01);
  f.bev(MAT.BRONZE, x - hs - 0.05, x + hs + 0.05, y - hs - 0.05, y + hs + 0.05, H - 0.1, H, 0.015);
  K.put(f, MAT.BRONZE, K.geom.lathe([[hs * 1.2, 0], [hs * 0.9, 0.12], [hs * 0.3, 0.42], [0.08, 0.5], [0.08, 0.6], [0, 0.62]], { seg: 4, rz: Math.PI / 4 }), { at: [x, y, H] });
  K.put(f, MAT.BRONZE, new THREE.TorusGeometry(0.16, 0.025, 6, 16).rotateX(Math.PI / 2), { at: [x, y, H + 0.78] });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(MAT.BRONZE, x + sx * hs - b, x + sx * hs + b, y + sy * hs - b, y + sy * hs + b, 0.26, H - 0.1, 0.01);
  for (const z of [0.95, H - 0.55]) for (const sy of [-1, 1]) { f.box(MAT.BRONZE, x - hs, x + hs, y + sy * hs - 0.03, y + sy * hs + 0.03, z - 0.03, z + 0.03); f.box(MAT.BRONZE, x + sy * hs - 0.03, x + sy * hs + 0.03, y - hs, y + hs, z - 0.03, z + 0.03); }
  // the glass, a little inside the frame
  for (const sy of [-1, 1]) { f.box(MAT.GLASS, x - hs + 0.03, x + hs - 0.03, y + sy * (hs - 0.02) - 0.005, y + sy * (hs - 0.02) + 0.005, 0.26, H - 0.1); f.box(MAT.GLASS, x + sy * (hs - 0.02) - 0.005, x + sy * (hs - 0.02) + 0.005, y - hs + 0.03, y + hs - 0.03, 0.26, H - 0.1); }
  pillar(K, f, x, y, 0.27, o.candle ?? 0.9, 0.2, flames, { s: 1.4 });
  f.block(x - hs, x + hs, y - hs, y + hs, 0, 3);
  const [X, Y] = f.map(x, y); return { X, Y, h: f.h + 0.27 + (o.candle ?? 0.9) + 0.15 };
}
// A long low block of stone to sit on: from x0 to x1 along a frame, d deep, seat h
export function stoneBench(K, f, x0, x1, d = 1.4, h = 1.35, o = {}) {
  const m = o.mat ?? MAT.STONE;
  f.bev(m, x0, x1, 0, d, h - 0.32, h, 0.03);
  for (const x of [x0 + 0.5, x1 - 1.4]) f.bev(m, x, x + 0.9, 0.12, d - 0.12, 0, h - 0.32, 0.02);
  f.block(x0, x1, 0, d, 0, 1.55);
  if (o.seats !== false) for (let x = x0 + 1.4; x < x1 - 0.8; x += 2.6) K.seat(f, x, d * 0.55, h, o.label ?? 'sit on the stone bench');
}
// A brass grab rail down into the water at a pool's steps: from the deck (y = 0) out over the steps along +y
// (a frame whose +y runs down the steps), the treads falling `rise` each `run`
export function poolRail(K, f, x, n, run, rise) {
  const P = [[x, -0.55, 0.0], [x, -0.55, 3.0], [x, -0.42, 3.32], [x, -0.12, 3.45], [x, 0.3, 3.38]];
  for (let k = 1; k <= n - 1; k++) P.push([x, 0.3 + k * run, 3.38 - k * rise + 0.15 * (k === 1 ? 0.5 : 0)]);
  const end = P[P.length - 1]; P.push([x, end[1] + 0.3, end[2] - 0.25], [x, end[1] + 0.42, end[2] - 0.7], [x, end[1] + 0.45, -(n - 0.6) * rise]);
  K.put(f, MAT.BRASS, K.geom.sweep(P, 0.065, { seg: 10 }));
  K.put(f, MAT.BRASS, K.geom.lathe([[0.15, 0], [0.15, 0.03], [0.08, 0.06], [0, 0.06]], { seg: 14 }), { at: [x, -0.55, 0] });
}

// ---- the Chapel's pieces -------------------------------------------------------------------------------------
// The outline of a round-headed light w by h, centred on (0, 0), as [[s, t], ...] (t up): the opening of tall()
export function archOutline(w, h, n = 24) {
  const R = w / 2, out = [[w / 2, -h / 2], [-w / 2, -h / 2]];
  for (let k = 0; k <= n; k++) { const a = Math.PI - k * Math.PI / n; out.push([R * Math.cos(a), h / 2 - R + R * Math.sin(a)]); }
  return out;
}
// A niche: a stone surround proud of the wall (a wall frame), with a round-headed opening for a light w by h whose
// middle is z above the floor; the opening goes back `deep` to the glass, a sill ledge under it
export function niche(K, f, x, z, w, h, o = {}) {
  const mat = o.mat ?? MAT.STONED, d0 = o.back ?? 0.04, d1 = o.face ?? 0.8, m = o.margin ?? 0.75, cap = o.cap ?? 0.9;
  const outer = [[x - w / 2 - m, z - h / 2 - 0.3], [x + w / 2 + m, z - h / 2 - 0.3], [x + w / 2 + m, z + h / 2 + cap], [x - w / 2 - m, z + h / 2 + cap]];
  const hole = archOutline(w, h, 28).map(([s, t]) => [x + s, z + t]);
  const shape = new THREE.Shape(outer.map(([a, b]) => new THREE.Vector2(a, b)));
  shape.holes.push(new THREE.Path(hole.slice().reverse().map(([a, b]) => new THREE.Vector2(a, b))));
  const g = new THREE.ExtrudeGeometry(shape, { depth: d1 - d0, bevelEnabled: false, curveSegments: 2 });
  g.rotateX(Math.PI / 2); g.translate(0, d1, 0);
  K.put(f, mat, g.index ? g.toNonIndexed() : g);
  // the sill: a ledge that runs out of the niche into the room
  f.bev(mat, x - w / 2 - 0.25, x + w / 2 + 0.25, d0, d1 + 0.35, z - h / 2 - 0.42, z - h / 2 - 0.02, 0.02);
  // behind the glass: a dark box (the light box itself), so nothing of the wall shows round the glass
  f.box('plaster#14110e', x - w / 2 - 0.05, x + w / 2 + 0.05, d0, d0 + 0.06, z - h / 2 - 0.02, z + h / 2 + 0.02);
}
// A low meditation cushion (a zafu on a zabuton) at (x, y) of a floor frame, sittable, facing the frame's front
export function zafu(K, f, x, y, o = {}) {
  const mat = o.mat ?? 'wool#5a3b34', pad = o.pad ?? 'linen#3c3a36';
  f.cushion(pad, x - 1.25, x + 1.25, y - 1.25, y + 1.25, 0.02, 0.2, 0.07, { k: 3, n: [8, 8, 1], crown: 0.025, bulge: 0.015, welt: 0.01, sag: [[0, -0.1, 0.02, 0.7]] });
  const prof = []; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + i / 8 * Math.PI; prof.push([0.62 * Math.pow(Math.max(0, Math.cos(a)), 0.3), 0.21 + 0.24 + 0.24 * Math.sign(Math.sin(a)) * Math.pow(Math.abs(Math.sin(a)), 0.8)]); }
  prof[0] = [0, 0.21]; prof[8] = [0, 0.69];
  K.put(f, mat, K.geom.lathe(prof, { seg: 24, mod: (t, j) => 1 + 0.04 * Math.abs(Math.sin(t * 12)) * Math.sin(j / 8 * Math.PI) }), { at: [x, y - 0.25, 0] });
  K.seat(f, x, y - 0.25, 0.62, o.label ?? 'sit, and be still');
}
// A plain oak bench, after the one in Bruder Klaus: a thick plank on two slab ends; seats along it
export function plankBench(K, f, x0, x1, o = {}) {
  const d = o.d ?? 1.2, h = o.h ?? 1.5, wood = o.wood ?? MAT.OAK;
  f.bev(wood, x0, x1, 0, d, h - 0.2, h, 0.025);
  for (const x of [x0 + 0.45, x1 - 0.65]) f.bev(wood, x, x + 0.2, 0.1, d - 0.1, 0, h - 0.2, 0.02);
  f.bev(wood, x0 + 0.6, x1 - 0.6, d / 2 - 0.08, d / 2 + 0.08, 0.3, 0.45, 0.01);
  f.block(x0, x1, 0, d, 0, 1.55);
  for (let x = x0 + 1.3; x < x1 - 0.7; x += 2.4) K.seat(f, x, d / 2, h, o.label ?? 'sit for a while');
}
// A lectern: a turned oak post, a sloping desk, the book on it (drawn by draw(g, W, H)); the reader stands at +y
export function lectern(K, f, x, y, draw, o = {}) {
  const t = 0.95, cy = 3.7, wood = o.wood ?? MAT.OAK;
  f.bev(wood, x - 0.75, x + 0.75, y - 0.55, y + 0.55, 0, 0.12, 0.02); f.bev(wood, x - 0.14, x + 0.14, y - 0.1, y + 0.1, 0.12, 3.55, 0.02);      // (plain: a slab foot and a square post)
  K.put(f, wood, K.geom.bev(-1.25, 1.25, -0.85, 0.85, -0.045, 0.045, 0.012), { rx: -t, at: [x, y, cy] });
  // (the desk leans back from the reader: turned about x by t from flat, its low edge toward +y, a lip along it)
  K.put(f, wood, K.geom.bev(-1.25, 1.25, 0.73, 0.83, 0.04, 0.15, 0.008), { rx: -t, at: [x, y, cy] });
  f.block(x - 0.8, x + 0.8, y - 0.8, y + 0.8, 0, 4.3);
  // the book: two cream pages bowed up from a spine, the text on a card laid on them
  K.put(f, 'c#5a2a22/0.7', K.geom.bev(-1.08, 1.08, -0.72, 0.72, 0.045, 0.075, 0.006), { rx: -t, at: [x, y, cy] });
  for (const sd of [-1, 1]) K.put(f, 'c#efe6cf/0.9', K.geom.grid([0, 1, 2, 3].map(j => [0, 1, 2, 3, 4, 5].map(i => { const u = i / 5, v = j / 3, xx = sd * (0.01 + u * 1.0); return [xx, -0.68 + v * 1.36, 0.08 + 0.045 * Math.sin(Math.min(1, u * 4.5) * Math.PI / 2) * (1 - u * 0.2)]; })), { flip: sd < 0 }), { rx: -t, at: [x, y, cy] });
  // the printed page: a sign standing on the desk's slope (leaned back pi/2 - t from upright), just over the pages
  const ny = Math.sin(t), nz = Math.cos(t), lift = 0.14;
  K.sign(f, x, y + ny * lift, cy + nz * lift, 2.02, 1.3, draw, { cw: 792, ch: 510, rough: 0.9, tilt: Math.PI / 2 - t });
}
