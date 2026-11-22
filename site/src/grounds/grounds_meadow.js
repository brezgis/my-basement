// The Meadow (grounds.js): the top of the rock, where you arrive beside the cellar doors. The wild edge of a garden
// rather than a lawn: long grass in seed with ox-eye daisies and yarrow in it, with paths mown through it (as Christopher
// Lloyd mowed his through the meadows at Great Dixter), a few hawthorns and an oak far from the cut, boulders
// lying in the grass, a bench at the cliff's edge looking out at the clouds.
//
//   the paths    mown: from the cellar doors round to the rail at the cut's west side; a branch up to the chapel's
//                stone ring; a branch down to the bench at the cliff's edge
//   the cut      a rail round it as at Villa Vals: leaning round timber posts with a wire net strung between them
//   the cliff    a plainer rail along the south edge: square posts, two wire ropes
//   the doors    added to the kerb and the two leaves of spanya.js: a plain coir mat, an old lantern on a post (lit at
//                night), a boot scraper, two pots of herbs
//   the ring     the chapel's light shaft, a low stone ring in the grass: creeping thyme round it, then
//                sedge, grasses and a few daisies, then a mown circle
//
// Plan coordinates as spanya.js; the world is x = Y, z = X; the meadow is h 34.

import * as THREE from 'three';
import { PAINT } from './tools.js';
import { rng } from './cards.js';
import { inPoly } from './flora.js';
import { ROCK, COURT, DOORS, OCULUS, MEADOW as M } from '../campus.js';

const TAU = Math.PI * 2, pw = (X, Y) => [Y, X];
const HATCH = { X0: DOORS.X + 2, X1: DOORS.X + 18, Y0: COURT.Y - 3, Y1: COURT.Y + 3 };      // as spanya.js
const CUT_R = 34.2;                                                                          // the rail round the cut
// the mown paths, as lines of plan points, and their widths
export const MOWN = [
  { pts: [[-79.6, 36], [-81.2, 41.5], [-74, 45.6], [-55, 47], [-32, 46], [-8, 43.5], [14, 40.2], [30, 37.6], [38.8, 36]], w: 4.6 },
  { pts: [[-4, 43], [8, 54], [22, 68], [36, 82], [52, 95.5], [63.5, 102.5]], w: 4.2 },
  { pts: [[-40, 46.6], [-41.5, 38], [-39.5, 30.5], [-36, 26.6]], w: 4.0 },
  { pts: [[-81.2, 41.5], [-86.5, 36], [-92, 31.5], [-99, 29]], w: 4.4 },      // back the way you came: the spawn is here
];
const BENCH = { X: -36, Y: 25.2 };
const RING_MOWN = 10.5;

export function layMeadow(E) {
  const { K, G, F, Wd, B } = E, r = rng(9157);
  const put = (mat, g) => K.put(mat, g);
  const lookTo = (dX, dY) => Math.atan2(-dY, -dX);
  const rock = (X, Y, sx, sy, sz, mat = PAINT.stone, det = 2) => { const [x, z] = pw(X, Y); K.rock(mat, x, M + sy * 0.3, z, sx, sy, sz, r() * TAU, det); };
  const plant = (kind, X, Y, s = 1, y = M + 0.03, o) => { const [x, z] = pw(X, Y); if (kind in E.WILD) Wd.add(kind, x, y, z, s, o); else F.add(kind, x, z, s, { y, ...o }); if (E.FLOWERS.has(kind) && r() < 0.5) E.flowers.meadow.push([x, y + 1.5 * s, z]); };
  const toPath = (X, Y) => { let best = 1e9; for (const p of MOWN) for (let i = 0; i < p.pts.length - 1; i++) { const [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1], dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((X - ax) * dx + (Y - ay) * dy) / (dx * dx + dy * dy))); best = Math.min(best, Math.hypot(X - ax - dx * t, Y - ay - dy * t) - p.w / 2); } return best; };
  const potAt = (X, Y, y, ...a) => { const [x, z] = pw(X, Y); return K.pot(x, y, z, ...a); };
  const cutR = (X, Y) => Math.hypot(X - COURT.X, Y - COURT.Y);
  const keep = [];      // places the long grass keeps off: [X, Y, radius]

  // ---- the ground: the lawn of spanya.js, mown paths laid paler over it; the long grass is cards (below) ------------
  // (a photograph of meadow grass laid over the lawn read as bare earth between the tussocks)
  {
    const d = Math.asin((COURT.Y - 21.7) / 34.6) * 180 / Math.PI, arc = [];
    for (let i = 0; i <= 48; i++) { const a = (180 + d - (180 + 2 * d) * i / 48) * Math.PI / 180; arc.push([COURT.X + 34.6 * Math.cos(a), COURT.Y + 34.6 * Math.sin(a)]); }
    const outer = [[ROCK.X0 + 1.5, 21.7], ...arc, [ROCK.X1 - 1.5, 21.7], [ROCK.X1 - 1.5, ROCK.Y1 - 2.5], [ROCK.X0 + 1.5, ROCK.Y1 - 2.5]];
    const circle = (X, Y, rad, n = 32) => Array.from({ length: n }, (_, i) => [X + rad * Math.cos(i / n * TAU), Y + rad * Math.sin(i / n * TAU)]);
    const apron = Array.from({ length: 36 }, (_, i) => { const a = i / 36 * TAU; return [(HATCH.X0 + HATCH.X1) / 2 - 2 + Math.cos(a) * 16, COURT.Y + Math.sin(a) * 9.5 * (1 + 0.08 * Math.sin(a * 3))]; });
    for (const p of MOWN) G.ribbon('swath', p.pts.map(([X, Y]) => pw(X, Y)), p.w, { wobble: 0.08 });
    E.meadowArea = { outer, holes: [circle(OCULUS.X, OCULUS.Y, RING_MOWN), apron] };
  }

  // ---- the cellar doors -----------------------------------------------------------------------------------------------
  {
    const IRON = PAINT.iron, WOOD = 'c#6f5a44/0.9';
    // the doormat: coir, on the grass before the open end
    const [mx, mz] = pw(-77.6, 36);
    K.box('c#8a6a40/1', mx - 1.75, mx + 1.75, M + 0.005, M + 0.06, mz - 1.15, mz + 1.15);      // a plain coir mat
    // the lantern on its post, at the south-west corner, its arm reaching over toward the steps
    const [lx, lz] = pw(-77.8, 30.9);
    K.box(WOOD, lx - 0.22, lx + 0.22, M - 0.5, M + 7.4, lz - 0.22, lz + 0.22); K.box(WOOD, lx - 0.27, lx + 0.27, M + 7.4, M + 7.55, lz - 0.27, lz + 0.27);
    K.beam(WOOD, [lx + 0.15, M + 6.9, lz], [lx + 1.9, M + 6.9, lz + 0.1], 0.16); K.beam(WOOD, [lx + 0.2, M + 5.9, lz], [lx + 1.1, M + 6.85, lz + 0.05], 0.1);
    E.lantern(lx + 1.75, M + 5.35, lz + 0.1, 0.8, 0.85, M + 6.85);
    K.collide(lx - 0.35, lx + 0.35, lz - 0.35, lz + 0.35, M + 7.5, M - 0.5);
    // the boot scraper: an iron blade between two scrolled uprights, set in a block of stone, at the other corner
    const [bx, bz] = pw(-78.4, 41.1);
    K.box('c#9a948a/0.95', bx - 0.45, bx + 0.45, M - 0.2, M + 0.3, bz - 0.75, bz + 0.75);
    for (const sd of [-1, 1]) { K.tube(IRON, [bx, M + 0.3, bz + sd * 0.55], [bx, M + 1.05, bz + sd * 0.55], 0.04, 6); put(IRON, new THREE.TorusGeometry(0.13, 0.03, 5, 10, Math.PI * 1.5).rotateY(Math.PI / 2).translate(bx, M + 1.13, bz + sd * 0.48)); }
    K.box(IRON, bx - 0.02, bx + 0.02, M + 0.3, M + 0.62, bz - 0.55, bz + 0.55);
    K.collide(bx - 0.45, bx + 0.45, bz - 0.75, bz + 0.75, M + 1.2, M - 0.5);
    // pots of herbs: a cluster at the lantern's foot, another by the sign, and two on the kerb's far corners
    potAt(-79.2, 32.4, M, 1.15, [['herbs', 1.1], ['herbs', 0.8, 0.35, 0.3]], { mat: PAINT.terracottaOld });
    potAt(-80.3, 33.9, M, 0.75, [['herbs', 1.2]], { mat: PAINT.terracotta });
    // grass and thyme along the outside of the kerbs, under the thrown-back leaves
    for (let X = HATCH.X0 + 1; X < HATCH.X1 - 1; X += 1.7) for (const Y of [HATCH.Y0 - 2.6, HATCH.Y1 + 2.6]) plant(r() < 0.6 ? 'longgrass' : 'thyme', X + (r() - 0.5) * 0.6, Y + (r() - 0.5) * 0.4, 0.6 + r() * 0.2);
  }

  // ---- the rail round the cut, after Villa Vals: round timber posts leaning out, a wire net between them --------------
  {
    const a0 = 180 + Math.asin((COURT.Y - 21.5) / CUT_R) * 180 / Math.PI, a1 = -Math.asin((COURT.Y - 21.5) / CUT_R) * 180 / Math.PI, n = Math.round((a0 - a1) * Math.PI / 180 * CUT_R / 6.2);
    const POLE = 'c#8a7456/0.95', LEAN = 0.2, H = 4.6, tops = [], bots = [];
    for (let i = 0; i <= n; i++) {
      const a = (a0 - (a0 - a1) * i / n) * Math.PI / 180, oX = Math.cos(a), oY = Math.sin(a), X = COURT.X + CUT_R * oX, Y = COURT.Y + CUT_R * oY, [x, z] = pw(X, Y), ox = oY, oz = oX;
      const b = [x, M - 0.4, z], t = [x + ox * H * Math.sin(LEAN), M - 0.4 + H * Math.cos(LEAN), z + oz * H * Math.sin(LEAN)];
      K.tube(POLE, b, t, 0.17, 7); K.sphere(POLE, ...t, 0.17, 0.4, 0);
      const at = k => [b[0] + (t[0] - b[0]) * k, b[1] + (t[1] - b[1]) * k, b[2] + (t[2] - b[2]) * k];
      bots.push(at(0.15)); tops.push(at(0.93));
    }
    for (let i = 0; i < n; i++) K.tube('c#4a4a46/0.4/1', tops[i], tops[i + 1], 0.025, 4);      // a wire along the top
    E.net.push({ bots, tops });
  }

  // ---- the rail along the cliff: square posts, two wire ropes -----------------------------------------------------------
  {
    const POST = 'c#7d6a52/0.95', Y = 21.55, runs = [[ROCK.X0 + 2.5, COURT.X - Math.sqrt(CUT_R ** 2 - (COURT.Y - 21.5) ** 2)], [COURT.X + Math.sqrt(CUT_R ** 2 - (COURT.Y - 21.5) ** 2), ROCK.X1 - 2.5]];
    for (const [X0, X1] of runs) {
      const n = Math.max(1, Math.round((X1 - X0) / 8)), ps = [];
      for (let i = 0; i <= n; i++) { const X = X0 + (X1 - X0) * i / n, [x, z] = pw(X, Y); K.box(POST, x - 0.15, x + 0.15, M - 0.4, M + 3.5, z - 0.15, z + 0.15); K.box(POST, x - 0.19, x + 0.19, M + 3.5, M + 3.6, z - 0.19, z + 0.19); ps.push([x, z]); }
      for (const h of [1.7, 3.2]) for (let i = 0; i < n; i++) K.tube('c#9a9a94/0.4/1', [ps[i][0], M + h, ps[i][1]], [ps[i + 1][0], M + h, ps[i + 1][1]], 0.022, 4);
    }
  }

  // ---- the bench at the cliff's edge, under a hawthorn, a boulder beside it --------------------------------------------
  {
    const [x, z] = pw(BENCH.X, BENCH.Y);
    K.bench(x, z, -Math.PI / 2, { y: M, w: 5.5 }); K.seat(x, M + 1.4, z, lookTo(0, -1), 'sit and watch the clouds');
    keep.push([BENCH.X, BENCH.Y, 3.4]);
    rock(BENCH.X + 5.2, BENCH.Y + 1.2, 2.2, 1.4, 1.8); rock(BENCH.X + 6.6, BENCH.Y - 0.2, 1.0, 0.6, 0.9); keep.push([BENCH.X + 5.6, BENCH.Y + 0.8, 2.6]);
    { const [bx, bz] = pw(BENCH.X + 5.2, BENCH.Y + 1.2); K.collide(bx - 1.4, bx + 1.4, bz - 1.6, bz + 1.6, M + 1.8, M - 0.5); }
    E.trees.push({ kind: 'apple', X: BENCH.X - 7.5, Y: BENCH.Y + 7, height: 15, seed: 41 });
  }

  // ---- the chapel's stone ring: thyme round it, then sedge, grasses and a few daisies, then a mown circle ----------------
  {
    const into = Math.atan2(102.5 - OCULUS.Y, 63.5 - OCULUS.X);      // where the path comes in: a gap in the planting
    const gap = a => Math.abs(((a - into + Math.PI * 3) % TAU) - Math.PI) < 0.3;
    for (let k = 0; k < 2; k++) for (let i = 0, n = 15 + k * 6; i < n; i++) { const a = (i + k * 0.5) / n * TAU, rad = 5.0 + k * 1.3; if (!gap(a)) plant('thyme', OCULUS.X + Math.cos(a) * rad, OCULUS.Y + Math.sin(a) * rad, 0.9 + r() * 0.3, M + 0.04 + k * 0.004); }
    for (let i = 0; i < 34; i++) { const a = (i / 34) * TAU + r() * 0.1, rad = 7.2 + r() * 1.4; if (gap(a)) continue; plant(['sedge', 'oxeye', 'hakone', 'sedge', 'meadowmix', 'hakone'][i % 6], OCULUS.X + Math.cos(a) * rad, OCULUS.Y + Math.sin(a) * rad, 0.75 + r() * 0.25); }
    // a few flints round the stone, as in the courtyard below
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU, s = 0.18 + r() * 0.08; if (!gap(a)) rock(OCULUS.X + Math.cos(a) * 4.5, OCULUS.Y + Math.sin(a) * 4.5, s, s * 1.2, s * 0.9, PAINT.stoneDark, 1); }
    keep.push([OCULUS.X, OCULUS.Y, RING_MOWN]);
  }

  // ---- trees, far from the cut: hawthorns along the back, an old oak to the north-west (all west of the cut: the trees' leaves are drawn by
// 160 ft region, and a region of their own on the east side would be two more draws for two trees) ---------------
  for (const t of [{ kind: 'apple', X: -96, Y: 118, height: 16, seed: 11 }, { kind: 'apple', X: -63, Y: 136, height: 17, seed: 12 }, { kind: 'apple', X: -31, Y: 124, height: 14, seed: 13 },
    { kind: 'oak', X: -88, Y: 86, height: 38, seed: 14 }, { kind: 'apple', X: -6, Y: 134, height: 15, seed: 15 }, { kind: 'apple', X: -104, Y: 96, height: 13, seed: 16 }]) E.trees.push(t);
  for (const t of E.trees) keep.push([t.X, t.Y, t.kind === 'oak' ? 3.5 : 2.2]);

  // ---- boulders lying in the grass ---------------------------------------------------------------------------------------
  for (const [X, Y, s] of [[10, 52, 2.3], [-98, 64, 2.8], [128, 96, 2.5], [163, 58, 3.0], [-14, 98, 2.0], [92, 128, 2.4], [205, 140, 2.6], [-60, 104, 1.8]]) {
    rock(X, Y, s, s * 0.6, s * 0.8); rock(X + s * 0.9, Y - s * 0.6, s * 0.45, s * 0.3, s * 0.4, PAINT.stone, 1);
    const [x, z] = pw(X, Y); K.collide(x - s * 0.7, x + s * 0.7, z - s * 0.9, z + s * 0.9, M + s * 0.8, M - 0.5); keep.push([X, Y, s * 1.05]);
  }

  // ---- the long grass and the flowers in it ------------------------------------------------------------------------------
  const area = E.meadowArea, inMeadow = (X, Y) => inPoly(X, Y, area.outer) && !area.holes.some(h => inPoly(X, Y, h));
  const clear = (X, Y, pad = 0) => inMeadow(X, Y) && toPath(X, Y) > 0.6 + pad && cutR(X, Y) > 35 && !keep.some(([kx, ky, kr]) => Math.hypot(X - kx, Y - ky) < kr + pad);
  for (let X = ROCK.X0 + 3; X < ROCK.X1 - 2; X += 2.6) for (let Y = 23; Y < ROCK.Y1 - 3; Y += 2.6) {
    const pX = X + (r() - 0.5) * 2.3, pY = Y + (r() - 0.5) * 2.3;
    if (!clear(pX, pY)) continue;
    const near = toPath(pX, pY) < 14;
    plant('longgrass', pX, pY, (near ? 0.85 : 0.95) + r() * 0.3, M + 0.02, { tint: 0.8 + r() * 0.3 });
    if (near && r() < 0.2) plant('longgrass', pX + (r() - 0.5) * 1.6, pY + (r() - 0.5) * 1.6, 0.6 + r() * 0.3, M + 0.02);
  }
  // drifts of flowers, mostly where they can be seen from the paths
  const KINDS = [['oxeye', 3], ['meadowmix', 2]];
  const tot = KINDS.reduce((a, k) => a + k[1], 0), pickKind = () => { let w = r() * tot; for (const k of KINDS) { w -= k[1]; if (w <= 0) return k[0]; } return 'oxeye'; };
  let made = 0;
  for (let tries = 0; tries < 400 && made < 30; tries++) {
    const p = MOWN[Math.floor(r() * MOWN.length)], i = Math.floor(r() * (p.pts.length - 1)), t = r(), [ax, ay] = p.pts[i], [bx, by] = p.pts[i + 1];
    const along = [ax + (bx - ax) * t, ay + (by - ay) * t], side = r() < 0.5 ? -1 : 1, l = Math.hypot(bx - ax, by - ay), off = p.w / 2 + 3 + r() * (r() < 0.7 ? 10 : 40);
    const cX = along[0] - (by - ay) / l * off * side, cY = along[1] + (bx - ax) / l * off * side;
    if (!clear(cX, cY, 1)) continue;
    const kind = pickKind(), rx = 3 + r() * 4, ry = 2.5 + r() * 3, n = Math.round(rx * ry * 0.45);
    for (let k = 0; k < n; k++) { const a = r() * TAU, d = Math.sqrt(r()), X = cX + Math.cos(a) * rx * d, Y = cY + Math.sin(a) * ry * d; if (clear(X, Y)) plant(kind, X, Y, 0.8 + r() * 0.35); }
    made++;
  }
  // and a scattering of single flowers through all of it
  for (let i = 0; i < 220; i++) { const X = ROCK.X0 + 3 + r() * (ROCK.X1 - ROCK.X0 - 6), Y = 23 + r() * (ROCK.Y1 - 27); if (clear(X, Y)) plant(['oxeye', 'meadowmix'][i % 2], X, Y, 0.7 + r() * 0.3); }
  // fireflies over the grass by the paths
  for (let i = 0; i < 60; i++) { const p = MOWN[i % MOWN.length], k = Math.floor(r() * (p.pts.length - 1)), [ax, ay] = p.pts[k], [bx, by] = p.pts[k + 1], t = r(), [x, z] = pw(ax + (bx - ax) * t + (r() - 0.5) * 16, ay + (by - ay) * t + (r() - 0.5) * 16); E.fireflies.push([x, M + 1.2 + r() * 3.5, z]); }
}
