// stair_hall: the pieces the Stair and the Hall are furnished with, in the house's settled style (notes/STYLE.md, "READ
// THIS FIRST"): stone rooms lit by flame, plain solid timeless things in honey oak, linen and wool, ferns. The way the
// candles, the arched niches and the ferns are made is the Pool's and the Chapel's (pool_chapel_parts.js), written
// again here in this file. Every piece is in a kit frame: x along it, y out toward its front, z up.

import * as THREE from 'three';
import { bev, lathe, sweep, softBox, merge, pillow } from '../kit/geom.js';

export const MAT = {
  OAK: 'oak_light', OAKD: 'oak_light#6b4e36',                                    // the house's one oak, and one darker accent (frames)
  STONE: 'coursed', STONED: 'coursed',                                            // the house's own pale coursed stone
  BRONZE: 'c#5a4632/0.45/1', IRON: 'c#2b2724/0.55/0.7', GLASS: 'glass', LIT: 'e#ffd49a/0.35',      // LIT: the hand lanterns' chimneys, lit by their candles at every hour (see-through 'glass' sorted badly against the flame)
  WAX: 'plaster#f3e8d0', WICK: 'plaster#1b1612', BACK: 'plaster#5a4a3a',
  LINEN: 'linen#ddd2bb', LINEN2: 'linen#c8b99c', WOOL: 'wool#eee8dc', OAT: 'wool#d8ccb4',
  CLAY: 'plaster#c07a58', SOIL: 'plaster#3a2214',
};
const LEAF = ['c#3f6233/0.55', 'c#4d7339/0.55', 'c#365a30/0.5'];
const FIG = ['c#2f5226/0.45', 'c#3b6230/0.45', 'c#4a7436/0.45', 'c#5f8a3e/0.5'];

// ---- candles ---------------------------------------------------------------------------------------------------
// A pillar candle at (x, y, z) of a frame; its flame (plan X, Y, h) goes on `flames` (stair_hall_fx.js draws them)
export function pillar(K, f, x, y, z, tall, r, flames, o = {}) {
  K.put(f, o.wax ?? MAT.WAX, lathe([[0, 0], [r, 0], [r, tall], [r - 0.02, tall + 0.008], [r * 0.55, tall - 0.025], [0, tall - 0.03]], { seg: r > 0.15 ? 16 : 12 }), { at: [x, y, z] });
  K.put(f, MAT.WICK, lathe([[0.006, tall - 0.03], [0.005, tall + 0.03], [0, tall + 0.03]], { seg: 4 }), { at: [x, y, z] });
  const [X, Y] = f.map(x, y); flames.push({ X, Y, h: f.h + z + tall + 0.02, s: o.s ?? (r > 0.15 ? 1.15 : 0.9) });
}
// A small hand lantern: a bronze base and cap round a glass chimney, a candle inside (stands on a sill or a table)
export function handLantern(K, f, x, y, z, flames, s = 1) {
  const r = 0.2 * s, h = 0.75 * s;
  K.put(f, MAT.BRONZE, lathe([[0, 0], [r + 0.03, 0], [r + 0.03, 0.05], [r, 0.07], [0, 0.07]], { seg: 12 }), { at: [x, y, z] });
  K.put(f, MAT.LIT, lathe([[r * 0.85, 0.07], [r, h * 0.45], [r * 0.85, h - 0.05]], { seg: 12 }), { at: [x, y, z] });
  K.put(f, MAT.BRONZE, lathe([[r * 0.95, h - 0.06], [r + 0.02, h - 0.02], [r * 0.5, h + 0.08], [0.04, h + 0.12], [0, h + 0.13]], { seg: 12 }), { at: [x, y, z] });
  K.put(f, MAT.BRONZE, sweep([[x - r * 0.7, y, z + h + 0.1], [x, y, z + h + 0.34], [x + r * 0.7, y, z + h + 0.1]], 0.012, { seg: 4 }));
  pillar(K, f, x, y, z + 0.07, 0.32 * s, 0.08 * s, flames, { s: 0.85 });
}
// A big standing lantern: a bronze frame round glass, a pillar candle inside
export function floorLantern(K, f, x, y, flames, o = {}) {
  const s = o.size ?? 0.9, H = o.h ?? 2.8, hs = s / 2, b = 0.05;
  f.bev(MAT.BRONZE, x - hs - 0.05, x + hs + 0.05, y - hs - 0.05, y + hs + 0.05, 0, 0.16, 0.02);
  f.bev(MAT.BRONZE, x - hs - 0.04, x + hs + 0.04, y - hs - 0.04, y + hs + 0.04, H - 0.1, H, 0.015);
  K.put(f, MAT.BRONZE, lathe([[hs * 1.2, 0], [hs * 0.9, 0.1], [hs * 0.3, 0.36], [0.07, 0.44], [0.07, 0.52], [0, 0.54]], { seg: 4, rz: Math.PI / 4 }), { at: [x, y, H] });
  K.put(f, MAT.BRONZE, new THREE.TorusGeometry(0.14, 0.022, 6, 14).rotateX(Math.PI / 2), { at: [x, y, H + 0.68] });
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.bev(MAT.BRONZE, x + sx * hs - b, x + sx * hs + b, y + sy * hs - b, y + sy * hs + b, 0.16, H - 0.1, 0.01);
  for (const sy of [-1, 1]) { f.box(MAT.GLASS, x - hs + 0.03, x + hs - 0.03, y + sy * (hs - 0.02) - 0.005, y + sy * (hs - 0.02) + 0.005, 0.16, H - 0.1); f.box(MAT.GLASS, x + sy * (hs - 0.02) - 0.005, x + sy * (hs - 0.02) + 0.005, y - hs + 0.03, y + hs - 0.03, 0.16, H - 0.1); }
  pillar(K, f, x, y, 0.17, o.candle ?? 0.8, 0.18, flames, { s: 1.3 });
  f.block(x - hs, x + hs, y - hs, y + hs, 0, 2.5);
}

// ---- niches in the stone ------------------------------------------------------------------------------------------
// The outline of a round-headed opening w by h, centred on (0, 0), as [[s, t], ...]
export function archOutline(w, h, n = 20) {
  const R = w / 2, out = [[w / 2, -h / 2], [-w / 2, -h / 2]];
  for (let k = 0; k <= n; k++) { const a = Math.PI - k * Math.PI / n; out.push([R * Math.cos(a), h / 2 - R + R * Math.sin(a)]); }
  return out;
}
// An arched niche on a wall frame: a stone surround standing `face` proud of the wall with a round-headed opening
// w by h whose middle is z above the frame; inside, a back of warmer stone and a sill. Returns the sill's height.
export function archNiche(K, f, x, z, w, h, o = {}) {
  const mat = o.mat ?? MAT.STONE, face = o.face ?? 0.4, m = o.margin ?? 0.3, cap = o.cap ?? 0.35;
  const outer = [[x - w / 2 - m, z - h / 2 - 0.15], [x + w / 2 + m, z - h / 2 - 0.15], [x + w / 2 + m, z + h / 2 + cap], [x - w / 2 - m, z + h / 2 + cap]];
  const hole = archOutline(w, h).map(([s, t]) => [x + s, z + t]);
  const shape = new THREE.Shape(outer.map(([a, b]) => new THREE.Vector2(a, b)));
  shape.holes.push(new THREE.Path(hole.slice().reverse().map(([a, b]) => new THREE.Vector2(a, b))));
  const g = new THREE.ExtrudeGeometry(shape, { depth: face - 0.02, bevelEnabled: false, curveSegments: 2 });
  g.rotateX(Math.PI / 2); g.translate(0, face, 0);
  K.put(f, mat, g.index ? g.toNonIndexed() : g);
  f.box(o.back ?? MAT.STONED, x - w / 2 - 0.02, x + w / 2 + 0.02, 0.06, 0.09, z - h / 2 + 0.05, z + h / 2);      // the back of the niche (its back face inside the surround)
  f.bev(mat, x - w / 2 - m - 0.05, x + w / 2 + m + 0.05, -0.02, face + 0.1, z - h / 2 - 0.25, z - h / 2 + 0.05, 0.02);      // the sill, a little proud, its top a little above the opening's foot
  return z - h / 2 + 0.05;
}

// ---- plants ----------------------------------------------------------------------------------------------------
// leaves collected per frame and colour, both faces, one mesh each (as the Pool's)
const SHAPES = { oval: [[0, 0], [0.35, 1], [0.72, 0.78], [1, 0]], fiddle: [[0, 0.15], [0.2, 0.55], [0.45, 0.7], [0.7, 1], [0.88, 0.85], [1, 0]], round: [[0, 0], [0.2, 0.8], [0.5, 1], [0.8, 0.8], [1, 0]] };
export function leaves(K) {
  const B = new Map();
  const add = (f, col, list) => { let m = B.get(f); if (!m) B.set(f, (m = {})); (m[col] ??= []).push(...list); };
  function leaf(f, col, base, az, pitch, L, W, o = {}) {
    const st = SHAPES[o.shape ?? 'oval'], fold = o.fold ?? 0.2, droop = o.droop ?? 0.3, out = [];
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
// A fern: a fountain of arching fronds with leaflets down both sides
export function fern(L, f, x, y, z, s = 1, seed = 2) {
  let k = seed * 7919 + 13; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 18; i++) {
    const az = i * 2.4 + rnd() * 0.4, ll = (1.2 + rnd() * 0.8) * s, up = 0.7 + rnd() * 0.9, c = Math.cos(az), sn = Math.sin(az), col = LEAF[i % 3];
    const pt = t => [x + c * ll * t * 0.95, y + sn * ll * t * 0.95, z + ll * (up * t - (up + 0.55) * t * t)];
    for (let j = 1; j <= 7; j++) { const t = 0.08 + 0.9 * j / 7, p = pt(t), q = 0.26 * s * Math.sin(Math.PI * Math.min(1, 0.15 + t)); for (const sd of [-1, 1]) L.leaf(f, col, p, az + sd * 1.25, -0.2, q, 0.045 * s); }
  }
}
// A big clay jar at (x, y) of a floor frame; returns the height of its soil
export function jar(K, f, x, y, r, h, mat = MAT.CLAY) {
  K.put(f, mat, lathe([[0, 0], [r * 0.55, 0], [r * 0.6, h * 0.06], [r * 0.82, h * 0.35], [r, h * 0.7], [r * 0.95, h * 0.88], [r * 1.06, h * 0.92], [r * 1.06, h], [r * 0.96, h], [r * 0.94, h * 0.93], [0, h * 0.93]], { seg: 20 }), { at: [x, y, 0] });
  K.put(f, MAT.SOIL, lathe([[0, h * 0.9], [r * 0.9, h * 0.9], [0, h * 0.905]], { seg: 12 }), { at: [x, y, 0] });
  f.block(x - r, x + r, y - r, y + r, 0, Math.max(h, 1.5));
  return h * 0.9;
}

// ---- seats -----------------------------------------------------------------------------------------------------
const leg = (x, y, h, r = 0.065, lean = [0, 0]) => sweep([[x, y, 0], [x + lean[0], y + lean[1], h]], (t) => r * (0.7 + 0.3 * t), { seg: 6, caps: true });
// A quiet easy chair of honey oak and linen: a square frame, loose seat and back cushions. o: { fabric, wood, pillow }
export function easyChair(K, fr, o = {}) {
  const wood = o.wood ?? MAT.OAK, fab = o.fabric ?? MAT.LINEN, w = 2.4, D = 2.5, a = w / 2, b = D / 2, SH = 1.35, frame = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) frame.push(leg(sx * (a - 0.12), sy * (b - 0.12), sy < 0 ? 2.6 : 2.0, 0.07));
  for (const sx of [-1, 1]) frame.push(bev(sx * (a - 0.12) - 0.07, sx * (a - 0.12) + 0.07, -b + 0.05, b - 0.05, 1.95, 2.08, 0.02, { grain: 'y' }));      // the arms
  for (const sy of [-1, 1]) frame.push(bev(-a + 0.12, a - 0.12, sy * (b - 0.12) - 0.05, sy * (b - 0.12) + 0.05, 0.95, 1.07, 0.02, { grain: 'x' }));
  for (const sx of [-1, 1]) frame.push(bev(sx * (a - 0.12) - 0.05, sx * (a - 0.12) + 0.05, -b + 0.12, b - 0.12, 0.95, 1.07, 0.02, { grain: 'y' }));
  frame.push(bev(-a + 0.12, a - 0.12, -b + 0.07, -b + 0.17, 2.45, 2.62, 0.02, { grain: 'x' }));
  K.put(fr, wood, merge(frame));
  let k = 4271; const rr = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  K.put(fr, fab, pillow(w - 0.42, D - 0.45, 0.32, { n: 9, pinch: 0.06, dent: 0.045, rng: rr }), { at: [0, 0.08, 1.07 + 0.15] });                 // the seat cushion: crowned, a dent where one sits
  K.put(fr, fab, pillow(w - 0.46, 1.3, 0.28, { n: 9, pinch: 0.08, dent: 0.03, rng: rr }), { rx: -Math.PI / 2 + 0.2, at: [0, -b + 0.36, SH + 0.7] });      // the back cushion, leaning back
  if (o.pillow) K.cushion(fr, 0.25, -b + 0.7, SH, 0.95, 0.85, o.pillow, { tilt: 0.4, turn: 0.15 });
  K.seat(fr, 0, 0.2, SH, 'sit');
  fr.block(-a, a, -b, b, 0, 2.0);
}

// A fiddle-leaf fig, 6 to 7 ft, in a jar whose soil is at z: a slender trunk branching twice, big wavy leaves held out
// and up along the top two thirds, darker and older below, a few fresh pale ones at the tips
export function fiddleFig(K, L, f, x, y, z, s = 1, seed = 5) {
  let k = seed * 7919 + 101; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  const wood = [], H = 4.4 * s;
  const stems = [[0, 0, H], [0.5, 0.6, H * 0.85], [-0.55, 0.3, H * 0.75]].map(([dx, dy, h], i) => {
    const P = [[x, y, z], [x + dx * 0.2, y + dy * 0.2, z + h * 0.4], [x + dx * 0.7, y + dy * 0.7, z + h * 0.8], [x + dx, y + dy, z + h]];
    wood.push(sweep(i ? P.slice(1) : P, (t) => 0.05 * s * (1 - 0.6 * t), { seg: 5 }));
    return P;
  });
  K.put(f, 'c#5a4a36/0.9', merge(wood));
  for (const P of stems) {
    const [a, b] = [P[1], P[3]];
    for (let i = 0; i < 16; i++) {
      const t = 0.15 + 0.85 * (i / 15), p = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
      const az = i * 2.4 + rnd() * 0.6, young = t > 0.9, len = (young ? 0.6 : 0.95 + rnd() * 0.25) * s;
      L.leaf(f, young ? FIG[3] : FIG[i % 3], p, az, 0.35 + rnd() * 0.5 - (t < 0.4 ? 0.3 : 0), len, len * 0.36, { shape: 'fiddle', fold: 0.12, droop: 0.15 });
    }
  }
}
// A generous vase of flowers: peonies and ranunculus in cream, blush and deep pink with eucalyptus, in a cream
// stoneware vase at (x, y, z) of a frame; its reach about 1.2 * s across and 2 * s high
export function bouquet(K, L, f, x, y, z, s = 1, seed = 9) {
  let k = seed * 9301 + 49297; const rnd = () => ((k = (k * 16807) % 2147483647) / 2147483647);
  const vh = 0.85 * s;
  K.put(f, 'c#e9e1d0/0.3', lathe([[0, 0], [0.16 * s, 0], [0.24 * s, vh * 0.3], [0.22 * s, vh * 0.75], [0.15 * s, vh * 0.92], [0.17 * s, vh], [0.15 * s, vh], [0, vh * 0.95]], { seg: 20 }), { at: [x, y, z] });
  const stems = [], heads = { 'c#f1e6d4/0.6': [], 'c#e9b4b4/0.6': [], 'c#c76f7e/0.6': [], 'c#f3d9c2/0.6': [] }, cols = Object.keys(heads), cores = [];
  const top = z + vh;
  for (let i = 0; i < 15; i++) {
    const az = i * 2.4 + rnd() * 0.5, out = (0.15 + rnd() * 0.45) * s, up = (0.6 + rnd() * 0.55) * s;
    const end = [x + Math.cos(az) * out, y + Math.sin(az) * out, top + up];
    stems.push(sweep([[x + Math.cos(az) * 0.05, y + Math.sin(az) * 0.05, top - 0.3], [x + Math.cos(az) * out * 0.4, y + Math.sin(az) * out * 0.4, top + up * 0.5], end], 0.012 * s, { seg: 4 }));
    const r = (i % 3 ? 0.16 : 0.24) * s, col = cols[i % cols.length];
    // a head: three rings of ruffled petals cupped round a centre
    heads[col].push(lathe([[0, -r * 0.55], [r * 0.45, -r * 0.5], [r * 0.85, -r * 0.15], [r, r * 0.2], [r * 0.92, r * 0.45], [r * 0.7, r * 0.62], [r * 0.5, r * 0.55], [r * 0.38, r * 0.72], [r * 0.15, r * 0.82], [0, r * 0.76]], { seg: 16, mod: (t, j) => 1 + (j > 2 ? 0.16 : 0.05) * Math.sin(t * (j > 5 ? 7 : 11) + i * 1.7) }).translate(...end));      // a full, ruffled head: outer guard petals, a cupped heart
    if (i % 3 === 0) cores.push(lathe([[0, 0], [r * 0.25, r * 0.1], [0, r * 0.25]], { seg: 8 }).translate(end[0], end[1], end[2] + r * 0.55));
    for (let j = 0; j < 3; j++) L.leaf(f, 'c#4f6e3e/0.55', [end[0] * 0.7 + x * 0.3, end[1] * 0.7 + y * 0.3, top + up * 0.45], az + (j - 1) * 0.9, 0.2, 0.32 * s, 0.07 * s, { droop: 0.3 });
  }
  // eucalyptus: round grey-green leaves along arching stems
  for (let i = 0; i < 7; i++) {
    const az = i * 0.9 + rnd(), ll = (0.9 + rnd() * 0.5) * s;
    for (let j = 1; j <= 7; j++) { const t = j / 7, p = [x + Math.cos(az) * ll * t * 0.8, y + Math.sin(az) * ll * t * 0.8, top + ll * (0.9 * t - 0.75 * t * t)]; L.leaf(f, 'c#8fa59a/0.6', p, az + (j % 2 ? 1.3 : -1.3), 0.1, 0.13 * s, 0.065 * s, { shape: 'round', droop: 0.1 }); }
  }
  K.put(f, 'c#5d7a45/0.7', merge(stems));
  for (const c of cols) if (heads[c].length) K.put(f, c, merge(heads[c]));
  K.put(f, 'c#d9b45a/0.6', merge(cores));
}
