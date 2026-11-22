// Five pieces of mathematics made as garden craft, and a line of stepping stones. Each is computed here, not drawn:
//
//   the Penrose terrace   the cafe's terrace on the hall's east side, paved in the two rhombs of Penrose's aperiodic
//                         tiling (P3), made by deflating a wheel of ten Robinson triangles six times; no part of it repeats
//   Rule 30               the apron at the foot of the library's steps: setts in two stones, each course the next
//                         generation of Wolfram's rule 30 from a single dark sett at the step
//   the Sunflower bed     a round bed west of the tongue's walk: 233 plants, each 137.5 degrees round from the last and
//                         a little further out (Vogel's model of a sunflower head); its 21 spiral arms in three colours
//   the Hilbert walk      south of the library: a low box labyrinth whose one path is the third Hilbert curve, through
//                         every one of 64 squares
//   the drunkard's walk   the stepping stones from the library's steps to it: a random walk pinned at both ends
//   the binary pear       an espalier on the hall's west wall: five forkings, thirty-two leaders
//   the Trefoil           behind the library, in the angle of its two wings: a knot garden that is a knot, one closed
//                         box hedge with three crossings, the under-strand cut back at each as the old knot gardens did
//
// Each has a small plate on an iron stake (env.stake). They stand beside walks and in corners, never on the green.

import * as THREE from 'three';
import { rng } from './cards.js';
import { PAINT } from './tools.js';
import { TERRACE, groundAt } from '../campus.js';

const PHI = (1 + Math.sqrt(5)) / 2;

// ---- Penrose's rhombs, by deflation -----------------------------------------------------------------------------
// Robinson triangles [kind, A, B, C]: kind 0 is the acute one (apex 36 degrees at A), kind 1 the obtuse (apex 108).
// One step cuts every triangle into smaller ones of the two kinds (the golden ratio does the cutting); two triangles
// back to back on their bases BC make a rhomb: thin from two of kind 0, thick from two of kind 1.
export function penroseRhombs(cx, cz, radius, steps, turn = 0) {
  let tris = [];
  for (let i = 0; i < 10; i++) {
    let b = [cx + radius * Math.cos(turn + (2 * i - 1) * Math.PI / 10), cz + radius * Math.sin(turn + (2 * i - 1) * Math.PI / 10)], c = [cx + radius * Math.cos(turn + (2 * i + 1) * Math.PI / 10), cz + radius * Math.sin(turn + (2 * i + 1) * Math.PI / 10)];
    if (i % 2 === 0) [b, c] = [c, b];      // (mirror every other one, so that the wheel's spokes match)
    tris.push([0, [cx, cz], b, c]);
  }
  const mix = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  for (let s = 0; s < steps; s++) {
    const next = [];
    for (const [k, A, B, C] of tris) {
      if (k === 0) { const P = mix(A, B, 1 / PHI); next.push([0, C, P, B], [1, P, C, A]); }
      else { const Q = mix(B, A, 1 / PHI), R = mix(B, C, 1 / PHI); next.push([1, R, C, A], [1, Q, R, B], [0, R, Q, A]); }
    }
    tris = next;
  }
  const half = new Map(), out = [];
  for (const [k, A, B, C] of tris) {
    const key = k + ':' + Math.round((B[0] + C[0]) * 500) + ',' + Math.round((B[1] + C[1]) * 500), other = half.get(key);
    if (other) { out.push({ thin: k === 0, pts: [A, B, other, C] }); half.delete(key); } else half.set(key, A);
  }
  return out;      // (halves left over lie on the wheel's rim)
}
// a convex polygon cut to a rectangle
const clipRect = (pts, x0, x1, z0, z1) => {
  for (const [ax, s, v] of [[0, 1, x0], [0, -1, x1], [1, 1, z0], [1, -1, z1]]) {
    const out = [], inside = p => s * (p[ax] - v) >= 0;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[(i + 1) % pts.length], ip = inside(p), iq = inside(q);
      if (ip) out.push(p);
      if (ip !== iq) { const t = (v - p[ax]) / (q[ax] - p[ax]); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    pts = out; if (pts.length < 3) return null;
  }
  return pts;
};
const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
const inset = (pts, d) => {      // every side moved in by d (a joint's half width)
  const n = pts.length, c = pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n], [0, 0]), out = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i + n - 1) % n], p = pts[i], p1 = pts[(i + 1) % n];
    const e0 = [p[0] - p0[0], p[1] - p0[1]], e1 = [p1[0] - p[0], p1[1] - p[1]], l0 = Math.hypot(...e0), l1 = Math.hypot(...e1);
    if (l0 < 1e-6 || l1 < 1e-6) { out.push(p); continue; }
    let n0 = [-e0[1] / l0, e0[0] / l0], n1 = [-e1[1] / l1, e1[0] / l1];
    if (n0[0] * (c[0] - p[0]) + n0[1] * (c[1] - p[1]) < 0) n0 = [-n0[0], -n0[1]];
    if (n1[0] * (c[0] - p[0]) + n1[1] * (c[1] - p[1]) < 0) n1 = [-n1[0], -n1[1]];
    const k = 1 + n0[0] * n1[0] + n0[1] * n1[1];
    out.push([p[0] + (n0[0] + n1[0]) * d / k, p[1] + (n0[1] + n1[1]) * d / k]);
  }
  return out;
};

export function penroseTerrace(env) {
  const { G, stake } = env, T = TERRACE, y = T.level, B = 0.75;      // B: a plain border course round the field
  G.rect('settDark', T.x0, T.x1, T.z0, T.z1, { flat: true, y: y + 0.06 });      // (the bed the tiles are laid on: it shows as their joints)
  const EDGE = 1.62, tiles = penroseRhombs(105.3, 92.6, EDGE * Math.pow(PHI, 6), 6, 0.31);
  let n = 0;
  for (const t of tiles) {
    const cut = clipRect(t.pts, T.x0 + B, T.x1 - B, T.z0 + B, T.z1 - B); if (!cut || area(cut) < 0.12) continue;
    G.poly(t.thin ? 'tileDark' : 'tileLight', inset(cut, 0.045), { flat: true, y: y + 0.11 }); n++;
  }
  // the border: long stones, the joints broken
  const course = (x0, x1, z0, z1, along) => { const len = along === 'x' ? x1 - x0 : z1 - z0, m = Math.round(len / 3.1); for (let i = 0; i < m; i++) { const a = i / m, b = (i + 1) / m; if (along === 'x') G.rect('tileDark', x0 + len * a + 0.04, x0 + len * b - 0.04, z0 + 0.05, z1 - 0.05, { flat: true, y: y + 0.11 }); else G.rect('tileDark', x0 + 0.05, x1 - 0.05, z0 + len * a + 0.04, z0 + len * b - 0.04, { flat: true, y: y + 0.11 }); } };
  course(T.x0, T.x1, T.z0, T.z0 + B, 'x'); course(T.x0, T.x1, T.z1 - B, T.z1, 'x'); course(T.x0, T.x0 + B, T.z0 + B, T.z1 - B, 'z'); course(T.x1 - B, T.x1, T.z0 + B, T.z1 - B, 'z');
  stake(T.x0 - 1.3, T.z1 - 2.2, Math.PI / 2 + Math.PI, 'THE PENROSE TERRACE', 'two rhombs, thick and thin, and one rule for cutting them', 'they pave the plane, and the pattern never repeats');
  return n;
}

// ---- Rule 30 -----------------------------------------------------------------------------------------------------
export const rule30 = (cols, rows) => { let row = new Array(cols).fill(0); row[cols >> 1] = 1; const out = [row]; for (let g = 1; g < rows; g++) { row = row.map((c, i) => (row[i - 1] ?? 0) ^ (c | (row[i + 1] ?? 0))); out.push(row); } return out; };
export function rule30Apron(env) {
  // The land is levelled under it (campus.js, LEVELS), so the setts lie on the ground like any other paving.
  const { G, stake } = env, C = 0.66, COLS = 42, ROWS = 12, x1 = -110 * C, z0 = -126 * C, x0 = x1 - COLS * C, z1 = z0 + ROWS * C;      // generation 0 lies against the bottom step; the cells keep to the painted setts' own joints (ground.js)
  const gens = rule30(COLS, ROWS), y = Math.max(groundAt(x0, z0), groundAt(x1, z0), groundAt(x0, z1), groundAt(x1, z1), groundAt((x0 + x1) / 2, (z0 + z1) / 2)) + 0.065;
  G.rect('sett', x0 - 0.42, x1 + 0.42, z0 - 0.25, z1 + 0.42, { flat: true, y: y + 0.03 });
  for (let g = 0; g < ROWS; g++) {
    const za = z0 + g * C, zb = za + C;
    for (let i = 0; i < COLS; i++) { if (!gens[g][i]) continue; let j = i; while (gens[g][j + 1]) j++; G.rect('settDark', x0 + i * C, x0 + (j + 1) * C, za, zb, { flat: true, y: y + 0.055 }); i = j; }      // (a run of dark setts is one piece)
  }
  stake(x1 + 1.35, z0 + 6, -0.6, 'RULE 30', 'each course of setts is the next generation of the one before', 'new = left XOR (center OR right)  ·  from one dark sett, it never settles');
}

// ---- the sunflower bed: Vogel's phyllotaxis ------------------------------------------------------------------------
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));      // 137.50776 degrees
export function sunflowerBed(env, cx, cz, R = 8.2, N = 233) {
  const { G, F, stake } = env, c = R / Math.sqrt(N), ring = (rad, n = 56) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832) * rad, cz + Math.sin(i / n * 6.2832) * rad]);
  G.poly('soil', ring(R + 0.75));
  G.poly('edging', ring(R + 1.4), { holes: [ring(R + 0.75).reverse()] });
  const KINDS = [['marigold', 0.8], ['catmint', 0.5], ['tulipW', 0.72]];
  for (let n = 1; n <= N; n++) {
    const rad = c * Math.sqrt(n), a = n * GOLDEN_ANGLE, x = cx + Math.cos(a) * rad, z = cz + Math.sin(a) * rad;
    const [kind, s] = n <= 5 ? KINDS[0] : KINDS[(n % 21) % 3];      // the 21 arms (21 is a Fibonacci number: plants n and n + 21 are neighbours), in three colours by turns
    F.add(kind, x, z, s * (0.7 + 0.42 * rad / R), { y: groundAt(x, z) + 0.05, rot: a, tilt: 0, tint: 0.95 });
  }
  stake(cx + (R + 2.3) * 0.75, cz + (R + 2.3) * 0.66, Math.atan2(0.75, 0.66), 'THE SUNFLOWER BED', '233 plants, each 137.5° round from the last, a little further out', 'count the spirals: 21 one way, 13 and 34 the other');
}

// ---- the Hilbert walk ------------------------------------------------------------------------------------------------
export function hilbert(order) {      // the cells of the curve in order: [i, j], from (0, 0) to (2^order - 1, 0)
  const n = 1 << order, out = [];
  for (let d = 0; d < n * n; d++) {
    let x = 0, y = 0, t = d;
    for (let s = 1; s < n; s *= 2) { const rx = 1 & (t >> 1), ry = 1 & (t ^ rx); if (ry === 0) { if (rx === 1) { x = s - 1 - x; y = s - 1 - y; } [x, y] = [y, x]; } x += s * rx; y += s * ry; t >>= 2; }
    out.push([x, y]);
  }
  return out;
}
export function hilbertWalk(env, X0, Z0, PITCH = 3.5, ORDER = 3) {
  // the square's north-east corner is (X0, Z0); i runs south (-x), j runs west (-z). The curve starts in the corner
  // cell and ends in the cell at the south-east corner: both mouths are in the east side, toward the green.
  const { G, K, stake } = env, n = 1 << ORDER, path = hilbert(ORDER), step = new Map(path.map(([i, j], d) => [i + ',' + j, d]));
  const joined = (a, b) => Math.abs((step.get(a) ?? -9) - (step.get(b) ?? -9)) === 1;
  const W = 0.95, H = 1.55, walls = [];      // [fixed coordinate, from, to] along x (a wall on a line of constant z) or along z
  // a wall stands on every side of a cell that the path does not cross
  for (const ax of ['x', 'z']) for (let line = 0; line <= n; line++) {
    let run = null;
    for (let k = 0; k <= n; k++) {
      // ax 'x': the wall on the line j = line (constant z), beside cell i = k; ax 'z': on the line i = line, beside cell j = k
      const a = ax === 'x' ? k + ',' + (line - 1) : (line - 1) + ',' + k, b = ax === 'x' ? k + ',' + line : line + ',' + k;
      const mouth = ax === 'x' && line === 0 && (k === 0 || k === n - 1);
      const wall = k < n && !mouth && !joined(a, b);
      if (wall) run = run ?? k; else if (run !== null) { walls.push([ax, line, run, k]); run = null; }
    }
  }
  for (const [ax, line, a, b] of walls) {
    const p = ax === 'x' ? [[X0 - a * PITCH, Z0 - line * PITCH], [X0 - b * PITCH, Z0 - line * PITCH]] : [[X0 - line * PITCH, Z0 - a * PITCH], [X0 - line * PITCH, Z0 - b * PITCH]];
    const pts = []; for (let k = 0; k <= b - a; k++) pts.push([p[0][0] + (p[1][0] - p[0][0]) * k / (b - a), p[0][1] + (p[1][1] - p[0][1]) * k / (b - a)]);
    G.hedge('boxwood', pts, W, H + (ax === 'z' ? 0.035 : 0), { ends: W / 2 - 0.03 - 0.02 * ((line + a) % 3) });      // (walls that meet do not share a face: the two directions differ a little in height, and an end stops short of the wall it meets)
    const xs = [p[0][0], p[1][0]], zs = [p[0][1], p[1][1]], y = Math.min(groundAt(xs[0], zs[0]), groundAt(xs[1], zs[1]));
    K.collide(Math.min(...xs) - W / 2, Math.max(...xs) + W / 2, Math.min(...zs) - W / 2, Math.max(...zs) + W / 2, y + H + 0.6, y - 1);
  }
  stake(X0 - 4.4, Z0 + 1.9, 1.03, 'THE HILBERT WALK', 'one path through all sixty-four squares, turning as Hilbert’s curve turns', 'in at this corner, out at the other: there is no wrong way');
  return { walls: walls.length, cells: path.length, mouth: [X0 - PITCH / 2, Z0], out: [X0 - (n - 0.5) * PITCH, Z0] };
}

// ---- the drunkard's walk ------------------------------------------------------------------------------------------------
// N stones from a to b: a random walk (each step one pace in a direction chosen by lot), pinned at both ends by taking
// from every stone its share of the walk's final error (a discrete Brownian bridge). `ok` refuses a walk that strays
// where a stone cannot lie; the first seed whose walk is allowed is the one laid.
export function drunkardsWalk(env, a, b, N, ok) {
  const { K, stake } = env, pace = Math.hypot(b[0] - a[0], b[1] - a[1]) / N * 1.5;
  for (let seed = 30; seed < 6000; seed++) {
    const r = rng(seed), raw = [[0, 0]]; for (let k = 0; k < N; k++) { const t = r() * 6.2832, p = raw[k]; raw.push([p[0] + Math.cos(t) * pace, p[1] + Math.sin(t) * pace]); }
    const end = raw[N], pts = raw.map((p, k) => [a[0] + p[0] + (b[0] - a[0] - end[0]) * k / N, a[1] + p[1] + (b[1] - a[1] - end[1]) * k / N]);
    const gaps = pts.slice(1).map((p, k) => Math.hypot(p[0] - pts[k][0], p[1] - pts[k][1]));
    if (Math.min(...gaps) < 1.2 || Math.max(...gaps) > 3.6 || !pts.every(p => ok(p[0], p[1]))) continue;
    let far = false; for (let i = 0; i < pts.length; i++) for (let j = i + 2; j < pts.length; j++) if (Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]) < 1.25) far = true;      // (no stone on another)
    if (far) continue;
    pts.forEach(([x, z], k) => K.rock(PAINT.stoneDark, x, groundAt(x, z) - 0.02 + (k % 3) * 0.006, z, 0.86 + r() * 0.22, 0.13, 0.66 + r() * 0.2, r() * 6.28, 1));
    const m = pts[4]; stake(m[0] + 2.4, m[1] + 1.2, Math.PI / 2, 'THE DRUNKARD’S WALK', 'every stone a pace from the last, in a direction chosen by lot', 'and pinned at both ends, so that it arrives all the same');
    return { seed, pts };
  }
  console.warn('grounds: no random walk fits'); return null;
}

// ---- the binary pear -------------------------------------------------------------------------------------------------
// An espalier flat against a wall: a stem that forks in two, five times over, each fork the whole tree again at
// seven tenths the size. cx: the foot of the stem along the wall (world x); z: the plane it is trained in.
export function binaryPear(env, cx, z, y0) {
  const { K, stake } = env, LEAF = ['c#4f6f34/0.9', 'c#5d7d3c/0.9', 'c#46652f/0.9'], r = rng(32);
  let tips = 0, forks = 0;
  const grow = (x, y, len, ang, depth) => {
    const x1 = x + Math.sin(ang) * len, y1 = y + Math.cos(ang) * len, rad = 0.035 + 0.021 * depth;
    K.tube(PAINT.bark, [x, y, z + (depth % 2) * 0.012], [x1, y1, z + ((depth + 1) % 2) * 0.012], rad, 6);
    const leaves = (px, py, s) => { const g = new THREE.IcosahedronGeometry(s, 0); g.scale(1.3, 0.8, 0.4); g.rotateZ(r() * 3); g.translate(px, py, z - 0.02 + (r() - 0.5) * 0.12); K.put(LEAF[Math.floor(r() * 3)], g); };
    if (depth <= 1) for (let k = 1; k <= 2; k++) leaves(x + (x1 - x) * (k / 2.5) + (r() - 0.5) * 0.24, y + (y1 - y) * (k / 2.5) + (r() - 0.5) * 0.2, 0.15 + r() * 0.06);      // spurs of leaf along the last two years' wood only: the forks stay bare, to be counted
    if (depth === 0) { tips++; leaves(x1, y1 + 0.1, 0.2); if (tips % 3 === 1) K.sphere('c#c9b24a/0.7', x1 + 0.14, y1 - 0.42, z - 0.1, 0.16, 1.3, 1); return; }
    forks++;
    for (const sd of [-1, 1]) grow(x1, y1, len * 0.7, ang * 0.3 + sd * 0.56, depth - 1);
  };
  grow(cx, y0 - 0.3, 3.9, 0, 5);
  stake(cx - 3.2, z - 3.4, Math.PI, 'THE BINARY PEAR', 'a pear trained to fork in two, five times: thirty-two leaders', 'every branch is the whole tree again, at seven tenths the size');
  return { tips, forks };
}

// ---- the Trefoil ---------------------------------------------------------------------------------------------------------
// The trefoil knot as a curve in space: x = sin t + 2 sin 2t, y = cos t - 2 cos 2t, height = -sin 3t. Seen from above it
// crosses itself three times; at each crossing the strand that is lower is the one that passes under, and its hedge is
// cut back there. (Over, under, over, under, over, under as you go round: that alternation is what makes it knotted.)
export function trefoil(scale = 1, N = 180) {
  const pts = Array.from({ length: N }, (_, i) => { const t = i / N * Math.PI * 2; return [(Math.sin(t) + 2 * Math.sin(2 * t)) * scale, (Math.cos(t) - 2 * Math.cos(2 * t)) * scale, -Math.sin(3 * t)]; });
  const crossings = [];
  for (let i = 0; i < N; i++) for (let j = i + 2; j < N; j++) {
    if (i === 0 && j === N - 1) continue;
    const a = pts[i], b = pts[(i + 1) % N], c = pts[j], d = pts[(j + 1) % N], rx = b[0] - a[0], ry = b[1] - a[1], sx = d[0] - c[0], sy = d[1] - c[1], den = rx * sy - ry * sx; if (Math.abs(den) < 1e-9) continue;
    const u = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den, v = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den;
    if (u >= 0 && u < 1 && v >= 0 && v < 1) { const hi = a[2] + (b[2] - a[2]) * u, hj = c[2] + (d[2] - c[2]) * v; crossings.push({ at: [a[0] + rx * u, a[1] + ry * u], under: hi < hj ? i + u : j + v, over: hi < hj ? j + v : i + u }); }
  }
  return { pts, crossings };
}
export function trefoilGarden(env, cx, cz, scale = 3.05) {
  const { G, stake } = env, { pts, crossings } = trefoil(scale), N = pts.length, step = Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]);
  const cut = i => crossings.some(c => { let d = Math.abs(i - c.under); d = Math.min(d, N - d); return d * step < 1.25; });      // (the step varies a little round the curve: near enough)
  let start = 0; while (!cut(start)) start++;      // begin in a gap, so that every run is whole
  let run = [];
  for (let k = 1; k <= N; k++) { const i = (start + k) % N; if (cut(i)) { if (run.length > 2) G.sweep('boxwood', run, 1.0, 1.5); run = []; } else run.push([cx + pts[i][0], cz + pts[i][1]]); }
  if (run.length > 2) G.sweep('boxwood', run, 1.0, 1.5);
  stake(cx - 11.6, cz - 1.2, -Math.PI / 2, 'THE TREFOIL', 'one closed hedge and three crossings: the simplest knot there is', 'follow it round: over, under, over, under. It cannot be undone');
  return { crossings: crossings.length, lobes: [[0, -1], [0.866, 0.5], [-0.866, 0.5]].map(([dx, dz]) => [cx + dx * 2.05 * scale, cz + dz * 2.05 * scale]) };      // the middles of its three loops (each lies opposite a crossing)
}
