// Spanya: rooms cut into the rock round a circular courtyard, after Villa Vals (SeARCH and Christian Müller
// Architects, Vals, 2009; the drawings are in research/drawings). What is theirs: a plain door somewhere else (a barn
// there, cellar doors on the meadow here), a tunnel of stairs with daylight at its end, and one round cut into the
// land that every room looks into and that is open on one side to the view. What is not: the size (this is twice
// theirs), the way in (theirs climbs, this goes down) and what the rooms are for.
//
// Own coordinates, in feet: X to the right as you stand south of the place looking at its open side, Y back
// (north) into the rock, h up from the COURTYARD's paving. The meadow is the top of the rock, M above it.
//
//   the rock        X ROCK.X0..X1, Y ROCK.Y0..Y1 (campus.js), h 0..M: the meadow on top, a cliff on its south face
//   the courtyard   a circle, centre (XC, YC), radius R to the middle of its wall; open to the sky, and to the
//                   south (the wall stops at the cliff's face and a low parapet runs round the terrace)
//   the rooms       a box X BX0..BX1, Y BY0..BY1 round the north half of the circle: a west wing, the middle behind
//                   the circle, and an east wing that runs on eastward into the rock (to EX1) on the ground storey
//   the way in      cellar doors on the meadow at DOORS, three flights going down eastward under the meadow to a
//                   doorway in the west wing's west wall, on the courtyard's east-west axis: from the foot of the
//                   stair you look through the hall and its glazed doors at the courtyard and the sky
//
// The circle's wall is flat facets (b.arcWall, which has no doors), so the three doors to the courtyard are in short
// straight bays where the circle runs square to the axes: west (the hall), north (the pool), east (the tea room).
//
// THE ROOMS (their names are what furnish files ask for; see the README at the project's root for what each is)
//   ground   The Stair · The Hall · The Listening Room · The Cave · The Pool · The Chapel · The Tea Room · The Nail Salon ·
//            The Banya · The Treatment Room · The Parnaya
//   upper    The Reading Loft (the stair's head) · The West Suite · The Consulting Room · The Quiet Room ·
//            The Dressing Room · The East Suite

import * as THREE from 'three';
import { ROCK, COURT, DOORS, OCULUS, MEADOW as M, HOUSE_ADDRESS } from '../campus.js';

export default function (b) {
  const XC = COURT.X, YC = COURT.Y, R = COURT.r, T = 1.5;                 // the courtyard's wall: two feet of stone
  const BX0 = 12, BX1 = 108, EX1 = BX1, BY0 = 16, BY1 = 74, TO = 1.5, TP = 0.5;     // the box of rooms; outer walls; partitions. (Three quarters of the first plan in every direction: that one was "too huge".)
  const F1 = 0.4, C1 = 12.6, F2 = 13.5, C2 = 21.8;      // (a tall ground storey, a snug upper one)                       // floors and ceilings
  const CY = 0.34;                                                       // the courtyard's paving
  const STONE = 'hewn', ROCKM = 'cliffrock';      /* STONE: the built fronts and the courtyard's wall, now smooth pale concrete under the rough rock (the dark coursed stone read as "dark and a little sad/busy") */
  const WALL = 'plaster', PAVE = 'flagstone', OAK = 'oak_light', TRIM = 'hewn';
  const STONEFLOOR = 'slate_floor', BOARDS = 'floor#a07c58', COURTFLOOR = 'slate_floor#c4bcae';      // (the courtyard is a paved terrace now: the same flags as indoors, paler)
  const HYC = 40.5;                                                      // the wings' cross walls (HY, below)
  const BAY = 4.45, dB = (Math.asin(BAY / R) * 180) / Math.PI;           // half a door bay, and the angle it takes of the circle
  const SC = BY0 + TO / 2, dS = (Math.asin((YC - SC) / R) * 180) / Math.PI;      // where the circle meets the wings' south walls
  const XS = Math.sqrt(R * R - (YC - SC) ** 2);                          // ... and how far from the axis
  const PN = 86, PH = 18;                                             // the pool's hall runs on north of the box, to PN, under a higher ceiling (PH): Anna found the pool "so small", and asked for the chapel to be backed up to make room
  const CH = { X0: XC - 14, X1: XC + 14, Y1: PN + 27, ceil: 19 };                      // the chapel, behind the middle
  const CAVE = { X0: -2.5, Y0: 50, Y1: 64, ceil: F1 + 10.2 };      // (it was 8 ft and "a bit like a dungeon")               // the cave, west of the larder
  const POOL = { X0: XC - 8, X1: XC + 8, Y0: 59.5, Y1: 78, deep: 3.6 };      // (16 by 18.5 ft: 8.7 ft of floor each side and 6.5 at the ends; it was 20 by 22.5 and crowded its room)

  // ---- the finishes: every room's walls, floor and ceiling, in one place (the language is notes/STYLE.md: dark warm
  // wood, slate, rough stone, amber light; one ceiling and one floor to a storey, so the rooms run into one another) ----
  const pl = c => 'plaster#' + c, CLAY = pl('dcc4a2'), AMBER = pl('f0d2a4'), beams = (n, ax = 'X') => ({ ax, n, d: 0.7, w: 0.5, mat: OAK });
  // The house style is the pool's and the chapel's (Anna's favourite rooms: "I want the rest of the rooms to follow
  // that ... not too modern, not too dark wood, not too brutalist"): pale warm stone in thin courses, slate, honey
  // timber overhead, light washing the stone. Winnicbott's room and the bedroom stay as they were; the banya is its own.
  // ONE floor and ONE ceiling to a storey, so that nothing changes underfoot or overhead in a doorway: slate and honey
  // boards below, boards and honey boards above. The exceptions are whole rooms: the pool (tiled, wet), the parnaya
  // (all timber), Winnicbott's room and the suite (their plaster ceilings).
  const stone = (n, ax) => ({ wall: 'coursed', floor: STONEFLOOR, ceil: 'boards', ...(n ? { beams: beams(n, ax) } : {}) }), stoneUp = (n, ax) => ({ wall: 'coursed', floor: BOARDS, ceil: 'boards', ...(n ? { beams: beams(n, ax) } : {}) });
  const POOLWALL = 'tile_subway#e8dfcc', POOLFLOOR = 'tile_hex#b9b5a9';
  b.finishes({
    'The Stair': { wall: 'coursed', ceil: 'boards' },
    'The Laundry': { wall: pl('f3eee2'), floor: 'tile_hex', ceil: 'boards' }, 'The Linen Closet': { wall: pl('f3eee2'), floor: 'tile_hex', ceil: 'boards' },
    'The Hall': stone(5, 'Y'), 'The Listening Room': stone(), 'The Tea Room': stone(5, 'Y'),
    'The Cave': { wall: 'rubble', floor: STONEFLOOR, ceil: 'rubble' },
    'The Pool': { wall: POOLWALL, floor: POOLFLOOR, ceil: 'boards' },      // tiled: "it's wet in there"
    'The Banya': { wall: 'hinoki', floor: STONEFLOOR, ceil: 'boards' },
    'The Treatment Room': { wall: CLAY, floor: STONEFLOOR, ceil: 'boards' },
    'The Parnaya': { wall: 'hinoki', floor: 'hinoki', ceil: 'hinoki' },
    'The Gallery': stoneUp(), 'The Quiet Room': stoneUp(8, 'Y'),
    'The Consulting Room': { wall: 'walnut', floor: BOARDS, ceil: AMBER },
    'The Suite': { wall: CLAY, floor: BOARDS, ceil: AMBER, beams: beams(4) }, 'The East Suite': { wall: CLAY, floor: BOARDS, ceil: AMBER, beams: beams(4) }, 'The Bath': { wall: 'hinoki', floor: BOARDS, ceil: 'boards' }, 'The East Bath': { wall: 'tile_subway#e8dfcc', floor: 'tile_hex#b9b5a9', ceil: 'boards' },
  });




  // ---- flat pieces cut to an outline: [[X, Y], ...] at height h, facing up or down -----------------------------
  const flat = (mat, pts, h, up = true, holes = []) => {
    const path = (P, q) => { q.moveTo(P[0][0], up ? P[0][1] : -P[0][1]); for (const p of P.slice(1)) q.lineTo(p[0], up ? p[1] : -p[1]); return q; };
    const s = path(pts, new THREE.Shape()); for (const hpts of holes) s.holes.push(path(hpts, new THREE.Path()));
    const g = new THREE.ShapeGeometry(s).toNonIndexed(); g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); g.translate(0, h, 0); g.computeVertexNormals();
    b.mesh(mat, g);
  };
  // Rock built as a grid of separate triangles is shaded a facet at a time (every other triangle dark). This gives
  // every point the average of the facets that meet at it, so the surface rolls instead.
  const smoothNormals = g => { g.computeVertexNormals(); const p = g.attributes.position, n = g.attributes.normal, acc = new Map(), key = q => Math.round(p.getX(q) * 50) + ',' + Math.round(p.getY(q) * 50) + ',' + Math.round(p.getZ(q) * 50);
    for (let q = 0; q < p.count; q++) { const k = key(q), a = acc.get(k) ?? [0, 0, 0]; a[0] += n.getX(q); a[1] += n.getY(q); a[2] += n.getZ(q); acc.set(k, a); }
    for (let q = 0; q < p.count; q++) { const a = acc.get(key(q)), l = Math.hypot(a[0], a[1], a[2]) || 1; n.setXYZ(q, a[0] / l, a[1] / l, a[2] / l); } return g; };
  const rect = (X0, X1, Y0, Y1) => [[X0, Y0], [X1, Y0], [X1, Y1], [X0, Y1]];
  const circ = (X, Y, r, n = 28) => Array.from({ length: n }, (_, i) => [X + r * Math.cos((i / n) * Math.PI * 2), Y + r * Math.sin((i / n) * Math.PI * 2)]);
  const arcPts = (r, from, to, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = ((from + ((to - from) * i) / n) * Math.PI) / 180; return [XC + r * Math.cos(a), YC + r * Math.sin(a)]; });

  // ---- the rock: the meadow on top, with the courtyard, the stair and the chapel's light shaft cut out of it --------
  const HOLE = R + T / 2 + 0.05, dH = (Math.asin((YC - ROCK.Y0) / HOLE) * 180) / Math.PI;
  const HATCH = { X0: DOORS.X + 2, X1: DOORS.X + 18, Y0: YC - 3, Y1: YC + 3 };      // the opening the cellar doors cover
  // Nobody stands up there: this place has no top of its own (it is cut into the house's island, and above it is that
  // island's earth and garden). The plane is only what closes the rock, seen from below past the courtyard's rim.
  const fence = () => {};
  // The cliff. The place is carved out of the island's side: so the rock goes on far above it and far to either side
  // (TOPH; the opening view never rises high enough to find a top), the built front stands at its foot, and the
  // courtyard is a grotto in it: a great arched mouth (the vault is below, 'the vault') with the garden inside.
  // The face is a grid pushed out by a few feet of noise; where the mouth is, and where the built walls are, it is left out.
  const TOPH = M + 135, M0 = M + 0.6, R0 = R + T / 2 + 0.3, HD = 27, FRONT = ROCK.Y0 - 7;      // M0: where the vault springs (the top of the circle's wall); HD: its rise; FRONT: how far its brow comes forward of the cliff
  const rho = Y => Math.sqrt(Math.max(0, 1 - ((Y - YC) / R0) ** 2));
  const inMouth = (X, h, Y, grow = 0) => { const q = rho(Y), hw = R0 * q + grow; if (Math.abs(X - XC) >= hw) return false; return h < M0 || ((X - XC) / hw) ** 2 + ((h - M0) / (HD * q + grow)) ** 2 < 1; };
  const rough = (u, v) => Math.sin(u * 0.09 + 1.3) * Math.cos(v * 0.13 + 0.7) * 1.8 + Math.sin(u * 0.21 + v * 0.17 + 2.1) * 0.9 + Math.sin(u * 0.31 - v * 0.27) * 0.45 + Math.cos(u * 0.071 - 0.4) * 1.5 + Math.sin(u * 0.023 + v * 0.031) * 3;
  // The face is ROUND, as the house's island is (island.js there: a drum of earth and coursed stone that narrows
  // downward to a point): part of a cylinder of radius RC about a centre far behind the front, drawing in below the
  // courtyard's level, so that from the first view it curves away to the sky on both sides. u is feet along it from the
  // middle, h height. Round the built front the rock stands forward in heavy shoulders, and it comes down unevenly over
  // the front's top and in over its sides, as if the building had been fitted to the rock that was there.
  { const RC = 265, YCC = ROCK.Y0 + RC, U = 345, h0 = -210, nu = Math.round((2 * U) / 7), nh = Math.round((TOPH - h0) / 5.5), pos = [], uv = [];
    const sm2 = v => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
    const draw = h => (h > -8 ? 1 : 1 - 0.5 * sm2((-8 - h) / 200) - 0.1 * sm2((-8 - h) / 60));                                        // how much of its radius the drum keeps, going down
    const edgeTop = X => M - 3.2 + Math.sin(X * 0.21 + 0.8) * 1.9 + Math.sin(X * 0.57 + 2.2) * 1.1 + Math.sin(X * 0.083) * 1.4;      // where the rock stops over the front, at X
    const edgeSide = h => 1.4 + Math.sin(h * 0.33 + 1.1) * 1.3 + Math.sin(h * 0.9 + 0.3) * 0.6;                                       // how far it comes in over each side, at h
    const shoulder = (X, h) => { const dx = Math.max(BX0 - X, 0, X - BX1), dh = Math.max(h - (M - 3), 0, -4 - h), d = Math.hypot(dx, dh * 1.3); return (1 - sm2(d / 34)) * (5.5 + 3.5 * Math.sin(X * 0.11 + h * 0.07 + 0.5) + 2 * Math.sin(X * 0.29 - h * 0.19)); };
    const flute = (u, h) => 2.2 * Math.sin(u * 0.045 + 0.7) * Math.sin(u * 0.019 + 2) * sm2((20 - h) / 60);                           // the tongues of the outline, hanging down as flutes
    const P = (i, k) => { const u = -U + (2 * U * i) / nu, h = h0 + ((TOPH - h0) * k) / nh, X = XC + u, a = u / RC;
      // a great buttress of rock west of the front, where the stair comes down inside it (the round face cut straight
      // through the stair there: a slab of cliff hung across the tunnel in front of where a visitor begins)
      const butt = 32 * sm2((-u - 42) / 55) * (1 - sm2((-u - 140) / 55)) * sm2((h + 28) / 22) * (1 - sm2((h - (M + 12)) / 28));
      let r = RC * draw(h) + Math.max(0.25, 3 + rough(X, h) + shoulder(X, h)) + butt + flute(u, h) + Math.max(0, h - M) * 0.035;
      // at each end of the front the rock stands forward as far as Y 3 (a porch): the walks along the front end against it,
      // the east one going on into it as a cave
      { const wx = Math.max((1 - sm2((X - 14) / 5)) * sm2((X + 34) / 12), sm2((X - 101) / 5) * (1 - sm2((X - 136) / 10))), wh = sm2((h + 12) / 6) * (1 - sm2((h - 22) / 9)), rP = (YCC - 3) / Math.cos(a) + 0.6 * Math.sin(X * 0.4 + h * 0.3);
        if (wx * wh > 0 && rP > r) r += (rP - r) * wx * wh; }
      return [XC + r * Math.sin(a), h, -(YCC - r * Math.cos(a)), u, h]; };
    for (let i = 0; i < nu; i++) for (let k = 0; k < nh; k++) { const X = XC - U + (2 * U * (i + 0.5)) / nu, h = h0 + ((TOPH - h0) * (k + 0.5)) / nh;
      if (X > BX0 - 1 + edgeSide(h) && X < BX1 + 1 - edgeSide(h + 7) && h < edgeTop(X) && h > -4) continue;      // the built front (and the terrace between the wings)
      if (h > -4 && inMouth(X, h, ROCK.Y0, -3.5)) continue;                                                      // the grotto's mouth (the brow overlaps the edge left here)
      const a = P(i, k), c = P(i + 1, k), d = P(i + 1, k + 1), e = P(i, k + 1); for (const q of [a, c, d, a, d, e]) { pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); } }
    // under the terrace: the rock swells out to carry it, and dies back into the cliff below
    { const N = 28, S = 8, V = (i, k) => { const a = Math.PI + (i / N) * Math.PI, s = k / S, r = (R + T / 2 + 1.2) * Math.pow(1 - s, 0.75) + 0.3, w = Math.sin(a * 5 + s * 4) * 0.8 * s * (1 - s) * 4; return [XC + (r + w) * Math.cos(a), -5.5 - 46 * s, -(YC - 2 * s + (r + w) * Math.sin(a) * (1 - 0.15 * s)), a * 24, 46 * s]; };
      for (let i = 0; i < N; i++) for (let k = 0; k < S; k++) { const A = V(i, k), B = V(i + 1, k), C = V(i + 1, k + 1), D = V(i, k + 1); for (const q of [A, C, B, A, D, C]) { pos.push(q[0], q[1], q[2]); uv.push(q[3], q[4]); } } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); smoothNormals(g); b.mesh('cliffrock', g);
    // the returns: rock from the face's cut edge back to the built front's two ends and its top, so nothing is open
    // Rock packed in behind the front's whole outline, so that from no angle is there sky between the built walls and the
    // face cut round them: at both ends, under the wings and the terrace, and over the wings either side of the mouth.
    const Y0 = ROCK.Y0 + 0.35, Y1 = ROCK.Y0 + 7.4;      // (no deeper than this: the stair comes down just behind, and packed further back the rock stood across its foot and inside the hall's doorway)
    b.box('cliffrock', BX0 - 14, BX0 - 0.05, Y0, Y1, -16, M + 9); b.box('cliffrock', BX1 + 0.05, BX1 + 4.4, Y0, Y1, -16, M + 9); b.box('cliffrock', BX1 + 4.3, BX1 + 14, Y0, Y1, 17.6, M + 9);      /* (no further east: the old cave is there) */
    b.box('cliffrock', BX0 - 14, BX1 + 14, Y0, Y1, -16, F1 - 1.35);
    b.box('cliffrock', BX0 - 14, XC - R0 - 0.4, Y0, Y1, M + 0.85, M + 9); b.box('cliffrock', XC + R0 + 0.4, BX1 + 14, Y0, Y1, M + 0.85, M + 9); }

  // ---- the courtyard: paving, a parapet round the open side of the terrace, a wading pool at the brink --------------
  b.floorArc({ X: XC, Y: YC, r: R - T / 2 + 0.3, from: 0, to: 360, n: 48, h: CY, mat: COURTFLOOR, thick: 1.2, under: null });      // (a lawn: the paths and stones on it are the grounds')
  // ---- the open side: an edge pool at the brink, and a walk along the front each way --------------------------------
  // (Anna: bring the edge pool back; "expand it a touch, and then have a walkway that goes past the windows / side of
  // the house. One stops (for a lookout), the other goes to a cave ... an ancient cave.") The walks are WK wide, in
  // front of the wings' cloud windows; the terrace's parapet runs only between them.
  const WK = { Y0: 9.5, Y1: BY0 - 0.02, XW: 13.7, XE: 108.2 }, aW = (Math.asin((YC - WK.Y0) / R) * 180) / Math.PI;      // aW: where the walks' outer edge meets the circle
  const LOOK = { X: 21.2, Y: WK.Y0, r: 6.5 };
  { // the edge pool: a crescent between the brink and a low kerb (a second circle, centred south of the brink)
    const KD = 30, KY = YC - KD, KR = 14.5, ri = R - T / 2, a = (ri * ri - KR * KR + KD * KD) / (2 * KD), hx = Math.sqrt(ri * ri - a * a), th = (Math.atan2(KD - a, hx) * 180) / Math.PI, ph = (Math.atan2(a, hx) * 180) / Math.PI;
    b.arcWall({ X: XC, Y: KY, r: KR, from: th, to: 180 - th, n: 12, t: 1, h0: CY - 0.4, h1: CY + 1.05, out: STONE, in: STONE });
    const kerb = Array.from({ length: 13 }, (_, i) => { const q = ((th + ((180 - 2 * th) * i) / 12) * Math.PI) / 180; return [XC + (KR - 0.5) * Math.cos(q), KY + (KR - 0.5) * Math.sin(q)]; });
    flat('water', [...arcPts(ri - 0.05, 360 - ph, 180 + ph, 20), ...kerb.reverse()].reverse(), CY + 0.75);
    // the parapet: a wall either side, and along the pool only a rim at the water's level (the water meets the sky)
    const wall = (from, to, n, h1) => b.arcWall({ X: XC, Y: YC, r: R, from, to, n, t: T, h0: -7, h1, out: STONE, in: STONE });
    wall(180 + aW, 180 + ph, 2, CY + 2.6); wall(180 + ph, 360 - ph, 9, CY + 0.7); wall(360 - ph, 360 - aW, 2, CY + 2.6);
    for (let q = 180 + aW; q <= 360 - aW + 0.5; q += 3) { const g = (q * Math.PI) / 180, x = XC + (R + 0.6) * Math.cos(g), y = YC + (R + 0.6) * Math.sin(g); b.block(x - 1.4, x + 1.4, y - 1.4, y + 1.4, CY - 3, CY + 60); } }      // nobody goes over
  { // the walks: paving, a solid base, a parapet; the lookout, a half-round balcony on the west walk
    const rr = R - T / 2 + 0.28, a1 = (Math.asin((YC - WK.Y0) / rr) * 180) / Math.PI, a2 = (Math.asin((YC - WK.Y1) / rr) * 180) / Math.PI;
    flat(COURTFLOOR, [[WK.XW, WK.Y0], ...arcPts(rr, 180 + a1, 180 + a2, 6), [WK.XW, WK.Y1]], CY - 0.006);
    flat(COURTFLOOR, [[WK.XE + 12.6, WK.Y0], [WK.XE + 12.6, WK.Y1], ...arcPts(rr, 360 - a2, 360 - a1, 6)], CY - 0.006);
    b.surface(WK.XW, XC - 14, WK.Y0, WK.Y1 + 0.4, CY); b.surface(XC + 14, WK.XE + 12.6, WK.Y0, WK.Y1 + 0.4, CY);
    b.box(STONE, WK.XW - 0.4, XC - 15, WK.Y0, WK.Y1, -9, CY - 0.03); b.box(STONE, XC + 15, WK.XE + 0.3, WK.Y0, WK.Y1, -9, CY - 0.03);
    const par = (a0, a1x) => b.wall({ ax: 'X', c: WK.Y0 + 0.3, a: a0, b: a1x, t: 0.6, h0: CY - 0.05, h1: CY + 2.6, neg: STONE, pos: STONE, base: false });
    par(LOOK.X + LOOK.r + 0.1, XC - R * Math.cos((aW * Math.PI) / 180) + 0.4); par(XC + R * Math.cos((aW * Math.PI) / 180) - 0.4, WK.XE);
    b.block(LOOK.X + LOOK.r, XC - 14.6, WK.Y0 - 1, WK.Y0 + 0.1, CY - 3, CY + 60); b.block(XC + 14.6, WK.XE + 0.4, WK.Y0 - 1, WK.Y0 + 0.1, CY - 3, CY + 60); b.block(WK.XW - 1.4, WK.XW, 0, WK.Y1 + 0.5, CY - 3, CY + 60);
    b.floorArc({ X: LOOK.X, Y: LOOK.Y, r: LOOK.r, from: 180, to: 360, n: 14, h: CY - 0.006, mat: COURTFLOOR, thick: 0.6, under: null });
    b.arcWall({ X: LOOK.X, Y: LOOK.Y, r: LOOK.r + 0.3, from: 180, to: 360, n: 12, t: 0.6, h0: CY - 0.05, h1: CY + 2.6, out: STONE, in: STONE });
    b.cyl(STONE, LOOK.X, LOOK.Y, -9, CY - 0.03, 3.2, LOOK.r + 0.6, 22);
    for (let q = 180; q <= 360; q += 15) { const g = (q * Math.PI) / 180, x = LOOK.X + (LOOK.r + 1.3) * Math.cos(g), y = LOOK.Y + (LOOK.r + 1.3) * Math.sin(g); b.block(x - 1.2, x + 1.2, y - 1.2, y + 1.2, CY - 3, CY + 60); }
    // the rock that closes each walk's end: a face of the porch, square across the walk (the east one has the cave's mouth in it)
    const end = (X, sign, hole) => { const sh = new THREE.Shape([[3.4, -9], [WK.Y1 + 0.5, -9], [WK.Y1 + 0.5, M + 1], [15.8, 28], [8, 25], [3.4, 22]].map(([u, v]) => new THREE.Vector2(u, v))); if (hole) sh.holes.push(new THREE.Path(hole.map(([u, v]) => new THREE.Vector2(u, v))));
      const g0 = new THREE.ShapeGeometry(sh).toNonIndexed(), p0 = g0.attributes.position, pos = [], uv = []; for (let q = 0; q < p0.count; q += 3) { const tri = [0, 1, 2].map(k => [X, p0.getY(q + k), -p0.getX(q + k)]); if (sign > 0) tri.reverse(); for (const v of tri) { pos.push(...v); uv.push(-v[2], v[1]); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      if (Math.sign(g.attributes.normal.getX(0)) !== sign) { const p = g.attributes.position, u = g.attributes.uv; for (let q = 0; q < p.count; q += 3) { const b1 = [p.getX(q + 1), p.getY(q + 1), p.getZ(q + 1)], u1 = [u.getX(q + 1), u.getY(q + 1)]; p.setXYZ(q + 1, p.getX(q + 2), p.getY(q + 2), p.getZ(q + 2)); p.setXYZ(q + 2, ...b1); u.setXY(q + 1, u.getX(q + 2), u.getY(q + 2)); u.setXY(q + 2, ...u1); } g.computeVertexNormals(); }
      b.mesh('cliffrock', g); };
    const MC = (WK.Y0 + WK.Y1) / 2, MW = (WK.Y1 - WK.Y0) / 2 - 0.15, arch = Array.from({ length: 13 }, (_, i) => { const q = (i / 12) * Math.PI; return [MC - MW * Math.cos(q), CY + 5 + 3.6 * Math.sin(q)]; });
    end(WK.XW - 0.02, 1); end(WK.XE + 0.02, -1, [[MC - MW, CY - 0.02], ...arch, [MC + MW, CY - 0.02]]);

    // ---- the old cave: through the mouth, a short passage in the rock and a round chamber. Bare for now ("you can just
    // build the cave now and we can expand it later"): a floor, rough walls, somewhere for a fire.
    const CV = { X: 125.5, Y: 19.5, rx: 10, ry: 9, H: 12.5, X1: WK.XE + 12.6 }, TH = y => CY + 5 + 3.6 * Math.sqrt(Math.max(0, 1 - ((y - MC) / MW) ** 2));
    const inward = (g, cx, cy, cz) => { const p = g.attributes.position, u = g.attributes.uv; g.computeVertexNormals(); const n = g.attributes.normal; for (let q = 0; q < p.count; q += 3) { const mx = (p.getX(q) + p.getX(q + 1) + p.getX(q + 2)) / 3 - cx(p, q), my = (p.getY(q) + p.getY(q + 1) + p.getY(q + 2)) / 3 - cy, mz = (p.getZ(q) + p.getZ(q + 1) + p.getZ(q + 2)) / 3 - cz; if (n.getX(q) * mx + n.getY(q) * my + n.getZ(q) * mz > 0) { const b1 = [p.getX(q + 1), p.getY(q + 1), p.getZ(q + 1)], u1 = [u.getX(q + 1), u.getY(q + 1)]; p.setXYZ(q + 1, p.getX(q + 2), p.getY(q + 2), p.getZ(q + 2)); p.setXYZ(q + 2, ...b1); u.setXY(q + 1, u.getX(q + 2), u.getY(q + 2)); u.setXY(q + 2, ...u1); } } return smoothNormals(g); };
    const mk = (pos, uv) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g; };
    { // the passage: a rough arch from the mouth to the chamber
      const NS = 9, NT = 12, pos = [], uv = [], V = (i, k) => { const X = WK.XE + ((CV.X1 - WK.XE) * i) / NS, q = (k / NT) * Math.PI, wob = (i === 0 ? 0 : 0.35) * (Math.sin(X * 1.3 + q * 5) + 0.6 * Math.sin(X * 2.9 - q * 3)) * Math.sin(q); return [X, CY - 0.05 + (5 + 3.6 + wob) * Math.sin(q) + (Math.sin(q) > 0.92 ? 0 : 0) , -(MC - (MW + 0.1 + wob * 0.3) * Math.cos(q)), X + q * 3, q * 4]; };
      for (let i = 0; i < NS; i++) for (let k = 0; k < NT; k++) { const A = V(i, k), B = V(i + 1, k), C = V(i + 1, k + 1), D = V(i, k + 1); for (const v of [A, B, C, A, C, D]) { pos.push(v[0], v[1], v[2]); uv.push(v[3], v[4]); } }
      b.mesh('cliffrock', inward(mk(pos, uv), (p, q) => (p.getX(q) + p.getX(q + 1) + p.getX(q + 2)) / 3, CY + 2, -MC)); }
    { // the chamber: a rough dome on an oval floor, open where the passage comes in
      const N = 30, S = 8, pos = [], uv = [], V = (i, k) => { const a = (i / N) * Math.PI * 2, f = (k / S) * (Math.PI / 2), w = 1 + 0.07 * Math.sin(a * 5 + f * 3) + 0.05 * Math.sin(a * 9 - f * 4 + 1) + 0.04 * Math.sin(a * 3 + 2), c = Math.pow(Math.cos(f), 0.55); return [CV.X + CV.rx * w * c * Math.cos(a), CY - 0.05 + CV.H * (0.96 + 0.06 * Math.sin(a * 4)) * Math.sin(f), -(CV.Y + CV.ry * w * c * Math.sin(a)), a * 9, f * 9]; };
      for (let i = 0; i < N; i++) for (let k = 0; k < S; k++) { const A = V(i, k), B = V(i + 1, k), C = V(i + 1, k + 1), D = V(i, k + 1), mx = (A[0] + C[0]) / 2, my = -(A[2] + C[2]) / 2, mh = (A[1] + C[1]) / 2;
        if (mx < CV.X1 + 1.2 && Math.abs(my - MC) < MW - 0.1 && mh < TH(my) - 0.2) continue;      // the passage's way in
        for (const v of [A, B, C, A, C, D]) { pos.push(v[0], v[1], v[2]); uv.push(v[3], v[4]); } }
      b.mesh('cliffrock', inward(mk(pos, uv), () => CV.X, CY + 2, -CV.Y)); }
    { // black behind every joint (a box, inside out), and the floor
      const X0 = WK.XE + 0.3, X1 = CV.X + CV.rx + 2.5, Y0 = WK.Y0 - 1.2, Y1 = CV.Y + CV.ry + 2.5, g = new THREE.BoxGeometry(X1 - X0, CV.H + 4, Y1 - Y0).toNonIndexed(); g.translate((X0 + X1) / 2, CY - 0.5 + (CV.H + 4) / 2, -(Y0 + Y1) / 2);
      { const p = g.attributes.position, u = g.attributes.uv; for (let q = 0; q < p.count; q += 3) { const b1 = [p.getX(q + 1), p.getY(q + 1), p.getZ(q + 1)], u1 = [u.getX(q + 1), u.getY(q + 1)]; p.setXYZ(q + 1, p.getX(q + 2), p.getY(q + 2), p.getZ(q + 2)); p.setXYZ(q + 2, ...b1); u.setXY(q + 1, u.getX(q + 2), u.getY(q + 2)); u.setXY(q + 2, ...u1); } g.computeVertexNormals(); }
      b.mesh('soot', g);
      flat('cliffrock', rect(WK.XE + 0.05, X1, Y0, Y1), CY - 0.002); b.surface(CV.X1 - 0.4, X1, Y0, Y1, CY);      // (rock underfoot from the mouth in: the passage's floor showed black before the chamber)
      // the walker keeps to the passage and the oval
      b.block(WK.XE, CV.X1 + 2.4, WK.Y0 - 1, WK.Y0 + 0.05, CY - 3, CY + 30); b.block(WK.XE, CV.X - CV.rx + 1.5, WK.Y1 - 0.05, WK.Y1 + 1.2, CY - 3, CY + 30);
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, x = CV.X + (CV.rx + 0.5) * Math.cos(a), y = CV.Y + (CV.ry + 0.5) * Math.sin(a); if (x < CV.X1 + 1.6 && Math.abs(y - MC) < MW + 0.9) continue; b.block(x - 1.25, x + 1.25, y - 1.25, y + 1.25, CY - 3, CY + 30); }
      b.room('The Old Cave', WK.XE + 0.4, CV.X + CV.rx + 0.6, WK.Y0 + 0.2, CV.Y + CV.ry + 0.6, CY, CV.H + 1, { over: 0.2 });
      b.portal(WK.XE - 0.2, WK.XE + 0.5, WK.Y0 + 0.2, WK.Y1 - 0.2, CY, CY + 8.6, 'X', 'door');
      b.fill(CV.X, CV.Y, CY + 8, 0.9); b.lamp(CV.X + 1, CV.Y, CY + 2.2, { power: 1.1, kind: 'candle' }); } }

  // ---- the circle's wall: three storeys of it (ground, upper, and the plain stone up to the meadow) ---------------
  // four arcs between the three bays and the wings' south walls; the windows are in the facets
  // six pieces between the three bays and the wings' south walls, cut where the middle's side walls meet the circle, so
  // that each is lined on its room side with that room's own wall (one lining for all put coursed stone in the tiled
  // pool and the timber banya). [from, to, facets, ground room's wall, upper room's wall or null, upper windows]
  const aP = (Math.acos(17 / R) * 180) / Math.PI;                         // the bearing at which the middle's side walls meet the circle
  const aH = (Math.asin((HYC - YC) / R) * 180) / Math.PI;                 // ... and the wings' cross walls (a facet that straddled one had a window cut in half by the wall's end, and the consulting room had no window at all)
  const ARCS = [
    [180 + dS, 180 + dB, 2, 'coursed', CLAY, [0]],                         // the hall | the suite
    [180 - dB, 180 - aH, 2, 'coursed', CLAY, [1]],                         // the hall | the suite
    [180 - aH, 180 - aP, 1, 'coursed', 'walnut', [0]],                     // the listening room | the consulting room
    [180 - aP, 90 + dB, 3, POOLWALL, 'coursed', [1, 2]],                   // the pool | the quiet room (upper windows never in the facet beside a cross wall: one was half behind the corner post)
    [90 - dB, aP, 3, POOLWALL, 'coursed', [0, 1]],
    [aP, aH, 1, 'hinoki', CLAY, [0]],                                      // the banya | the east suite
    [aH, dB, 2, 'coursed', null, []],                                      // the tea room | rock
    [-dB, -dS, 2, 'coursed', null, []],
  ];
  const G1 = i => ({ i, sill: 1.0, head: 11, margin: 0.5 });
  const SILL2 = [2.2, 1.0, 2.8, 0.6, 2.2, 3.0];
  ARCS.forEach(([from, to, n, low, up, wins], k) => {
    const s = { X: XC, Y: YC, r: R, from, to, n, t: T, skin: 0.12, in: STONE, trim: OAK, sash: OAK };      // (oak lintels and sills: in the wall's own rock they showed indoors as slabs of giant marbling over every window)
    b.arcWall({ ...s, out: low, h0: -1, h1: F2, fl: F1, opens: Array.from({ length: n }, (_, i) => ({ ...G1(i), margin: n === 1 ? 1.5 : i === 0 || i === n - 1 ? 1.0 : 0.5 })) });      // (a broad pier of wall at each end of a stretch, where a room's cross wall meets the circle: no wall ever lands on glass)
    b.arcWall({ ...s, out: up ?? STONE, h0: F2, h1: C2 + 1, fl: F2, opens: wins.map((i, j) => ({ i, sill: SILL2[(k * 2 + j) % 6], head: Math.min(7.4, SILL2[(k * 2 + j) % 6] + 4.0 + ((k + j) % 3) * 0.4), margin: 0.9 + ((k + j) % 2) * 0.5 })) });
    b.arcWall({ ...s, out: STONE, h0: C2 + 1, h1: M + 0.9 });
  });
  // the three bays: glazed doors below, a window above
  const DOORW = { kind: 'gdoor', w: 6, head: 9.6, leaves: 2, hinge: 'a', threshold: STONEFLOOR }      /* (outside doors: shut when you arrive; E opens them) */, WINW = { kind: 'win', w: 5, sill: 1.2, head: 6.6, n: 2, bars: [1, 3] };
  const bay = (ax, c, mid, courtPos, low, up, upper = true) => {
    const IN = courtPos ? 'neg' : 'pos', s = { ax, c, a: mid - BAY, b: mid + BAY, t: T, [courtPos ? 'pos' : 'neg']: STONE, [IN]: low, outside: courtPos ? 'pos' : 'neg', trim: OAK, wood: OAK };
    b.wall({ ...s, h0: -1, h1: F2, fl: F1, opens: [{ ...DOORW, at: mid - 3, swing: courtPos ? 'neg' : 'pos' }] });
    b.wall({ ...s, [IN]: up ?? STONE, h0: F2, h1: C2 + 1, fl: F2, opens: upper ? [{ ...WINW, at: mid - 2.5 }] : [] });
    b.wall({ ...s, h0: C2 + 1, h1: M + 0.9, [IN]: STONE });
  };
  const RB = Math.sqrt(R * R - BAY * BAY);
  bay('Y', XC - RB, YC, true, 'coursed', CLAY); bay('X', YC + RB, XC, false, POOLWALL, 'coursed'); bay('Y', XC + RB, YC, false, 'coursed', null, false);      // (each bay's room side in its room's own wall: left to the finishes they stayed bare plaster, a tan strip beside every door)

  // ---- the vault: the grotto's roof --------------------------------------------------------------------------------
  // (Anna: "the earth kind of towering above the courtyard almost like a dome ... set in the side of the floating
  // island/mountain"; and then: it "should go pretty far ... really like it's set into a cliff", with nothing to
  // suggest a half dome set on top.) Half an ellipsoid of rough rock springing from the top of the circle's wall and
  // rising HD above it, cut off at the cliff's face and carried a little forward of it as a brow; the sky and the
  // clouds are seen out through its mouth, to the south. Built in slices from the brow back to the north wall.
  { const NY = 26, NT = 30, Yn = YC + R0 - 0.05, pos = [], uv = [];
    const V = (jy, it) => { const Y = FRONT + ((Yn - FRONT) * jy) / NY, q = Math.max(0.02, rho(Y)), tt = (it / NT) * Math.PI, wob = (Math.sin(tt * 7 + Y * 0.4) * 0.8 + Math.sin(tt * 13 - Y * 0.9 + 1.3) * 0.45 + Math.sin(Y * 0.7 + tt * 3) * 0.6) * Math.sin(tt) * Math.min(1, q * 2);
      return [XC + (R0 * q - wob * 0.4) * Math.cos(tt), M0 + (HD * q - wob) * Math.sin(tt), -Y, tt * R0 * q + Y * 0.3, Y]; };
    for (let jy = 0; jy < NY; jy++) for (let it = 0; it < NT; it++) { const A = V(jy, it), B = V(jy + 1, it), C = V(jy + 1, it + 1), D = V(jy, it + 1); for (const p of [A, B, C, A, C, D]) { pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); } }
    // the brow: from the vault's front edge up and back to the cliff's face, a few feet outside the mouth cut in it
    for (let it = 0; it < NT; it++) { const E = k => { const v = V(0, it + k), tt = ((it + k) / NT) * Math.PI, q = rho(ROCK.Y0), g = 7; return [v, [XC + (R0 * q + g) * Math.cos(tt), M0 - 3 + (HD * q + g + 3) * Math.sin(tt), -(ROCK.Y0 - 1.5), v[3], v[4] - 9]]; }, [a, a2] = E(0), [c, c2] = E(1); for (const p of [a, c, c2, a, c2, a2]) { pos.push(p[0], p[1], p[2]); uv.push(p[3], p[4]); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    // (the vault is looked at from inside: whichever way the winding fell, its facets must face down and in)
    { const p = g.attributes.position, nn = g.attributes.normal, u = g.attributes.uv; for (let q = 0; q < p.count; q += 3) { const cx = (p.getX(q) + p.getX(q + 1) + p.getX(q + 2)) / 3 - XC, cy = (p.getY(q) + p.getY(q + 1) + p.getY(q + 2)) / 3 - (M0 - 20), cz = (p.getZ(q) + p.getZ(q + 1) + p.getZ(q + 2)) / 3 + YC; if (nn.getX(q) * cx + nn.getY(q) * cy + nn.getZ(q) * cz > 0) { const b1 = [p.getX(q + 1), p.getY(q + 1), p.getZ(q + 1)], u1 = [u.getX(q + 1), u.getY(q + 1)]; p.setXYZ(q + 1, p.getX(q + 2), p.getY(q + 2), p.getZ(q + 2)); p.setXYZ(q + 2, ...b1); u.setXY(q + 1, u.getX(q + 2), u.getY(q + 2)); u.setXY(q + 2, ...u1); } } smoothNormals(g); }
    b.mesh('cliffrock', g); }

  // ---- the box of rooms: outer walls against the rock, the wings' south walls in the cliff's face ------------------
  const S1 = { h0: -1, h1: F2, fl: F1 }, S2 = { h0: F2, h1: C2 + 1, fl: F2 }, O = { t: TO, wood: OAK }, EW = BX1 - TO / 2;
  const TUNNEL = { Y0: YC - 3, Y1: YC + 3 }, HY = HYC, PT = TP / 2;                       // HY: the wall between each wing's south room and its north one
  const DOOR = { kind: 'door', w: 3, head: 7, hinge: 'a', swing: 'pos', style: 'ledged', case: 'plain', threshold: OAK }, CASED = { kind: 'cased', w: 4.6, head: 7.4, case: 'plain', threshold: STONEFLOOR };
  const xArc = Y => Math.sqrt(Math.max(0, (R + T / 2) ** 2 - (Y - YC) ** 2));      // how far from the axis the circle's room face is, at Y
  const wX0 = BX0 + TO, wX1 = XC - R - 0.2, eX0 = XC + R + 0.2, eX1 = EW - TO / 2, iY0 = BY0 + TO, iY1 = BY1 - TO;
  const PW = XC - 17, PE = XC + 17, yAt = X => YC + Math.sqrt(R * R - (X - XC) ** 2);      // PW, PE: the middle's side walls; yAt: where one meets the circle
  // west wall: the stair's doorway, and the cave's door
  b.wall({ ...O, ...S1, ax: 'Y', c: BX0 + TO / 2, a: BY0, b: BY1, neg: WALL, pos: WALL, opens: [{ kind: 'cased', at: TUNNEL.Y0 + 0.3, w: 5.4, head: 7.4, threshold: STONEFLOOR, case: 'plain' }, { ...DOOR, at: 55.5, swing: 'neg', inside: true }] });
  b.wall({ ...O, ...S2, ax: 'Y', c: BX0 + TO / 2, a: BY0, b: BY1, neg: ROCKM, pos: WALL, outside: 'neg' });
  // north wall: the chapel's doors in the middle of the pool's wall
  b.wall({ ...O, ...S1, ax: 'X', c: BY1 - TO / 2, a: BX0 + TO, b: XC - 17 - TO / 2, neg: WALL, pos: 'rubble', outside: 'pos' });
  b.wall({ ...O, ...S1, ax: 'X', c: BY1 - TO / 2, a: XC + 17 + TO / 2, b: BX1 - TO, neg: WALL, pos: 'rubble', outside: 'pos' });
  // the pool's hall beyond the box: two side walls and an end wall, taller than the storey, with the chapel's doors in the end
  { const s = { ...O, h0: -1, h1: PH + 0.6, fl: F1 };
    b.wall({ ...s, h0: F1 - 1, ax: 'Y', c: XC - 17, a: BY1 - TO, b: PN - TO, neg: 'coursed', pos: POOLWALL }); b.wall({ ...s, h0: F1 - 1, ax: 'Y', c: XC + 17, a: BY1 - TO, b: PN - TO, neg: POOLWALL, pos: 'hinoki' });      // (their outer faces show for half a foot in the corners of the listening room and the banya's passage: so in those rooms' walls)
    b.wall({ ...s, ax: 'X', c: PN - TO / 2, a: XC - 17 - TO / 2, b: XC + 17 + TO / 2, neg: WALL, pos: 'rubble', outside: 'pos', opens: [{ ...DOOR, at: XC - 2.25, w: 4.5, leaves: 2, head: 7.8, inside: true, threshold: STONEFLOOR }] });
    b.box(OAK, XC - 17 + 0.3, XC + 17 - 0.3, BY1 - TO - 0.1, BY1 + 0.85, C1 - 0.5, F2 + 0.12, { grain: 'long' }); }      // the great beam where the upper storey's wall crosses the hall
  b.wall({ ...O, ...S2, ax: 'X', c: BY1 - TO / 2, a: BX0 + TO, b: PE + TO / 2, neg: WALL, pos: 'rubble', outside: 'pos' });
  // the upper storey's east end is the quiet room's wall; beyond it, over the banya, the second bedroom (Anna: "let's
  // bring back the other suite/bedroom ... we have the room for it now that things are smaller"), ESN deep
  const ESN = 64, ESE = 101, EBX = 90, EBY = 48.2;      // the east suite: its north and east walls (it was 22 by 25 ft: "a bit big"); its bathroom's west and north walls
  b.wall({ t: TO, h0: F2, h1: C2, wood: OAK, ax: 'Y', c: PE, a: yAt(PE) + 0.15, b: BY1 - TO, neg: 'coursed', pos: CLAY, opens: [{ ...DOOR, at: 59.5, inside: true }] });
  b.wall({ ...O, ...S2, ax: 'Y', c: ESE + TO / 2, a: HY - TO, b: ESN + TO, neg: WALL, pos: ROCKM, outside: 'pos' });
  b.wall({ ...O, ...S2, ax: 'X', c: ESN + TO / 2, a: PE + TO / 2, b: ESE, neg: CLAY, pos: ROCKM, outside: 'pos' });
  // its bathroom: a real room in the south-east corner, entered from the bedroom
  b.wall({ t: TP, h0: F2, h1: C2, wood: OAK, ax: 'X', c: EBY, a: EBX - TP / 2, b: ESE, neg: WALL, pos: CLAY, opens: [{ ...DOOR, at: 92, w: 2.8, swing: 'neg', inside: true }] });
  b.wall({ t: TP, h0: F2, h1: C2, wood: OAK, ax: 'Y', c: EBX, a: HY, b: EBY - TP / 2, neg: CLAY, pos: WALL });
  b.wall({ ...O, ...S2, ax: 'X', c: HY - TO / 2, a: XC + xArc(HY) - 0.6, b: ESE, neg: ROCKM, pos: WALL, outside: 'neg' });
  // east wall
  b.wall({ ...O, ...S1, ax: 'Y', c: EW, a: BY0, b: BY1, neg: WALL, pos: ROCKM, outside: 'pos' });
  // south walls, in the cliff's face: each room there has a window over the clouds
  const SWIN = { kind: 'win', sill: 1.2, head: 11, w: 7, n: 3, bars: [0, 0] }, SWIN2 = { kind: 'win', sill: 1.8, head: 6.8, w: 5, n: 2, bars: [0, 0] }, ARCHW = { kind: 'win', w: 3.4, n: 1, sill: 0.8, head: 7.2, arch: true, bars: [0, 0] };
  const south = (s, a, bb, opens) => b.wall({ ...O, ...s, ax: 'X', c: SC, a, b: bb, neg: STONE, pos: WALL, outside: 'neg', trim: TRIM, opens });
  b.wall({ ...O, ...S1, ax: 'X', c: SC, a: BX0 + TO, b: XC - XS, neg: STONE, pos: 'coursed', outside: 'neg', trim: TRIM, opens: [{ ...SWIN, at: 20 }] }); b.wall({ ...O, ...S1, ax: 'X', c: SC, a: XC + XS, b: BX1 - TO, neg: STONE, pos: 'coursed', outside: 'neg', trim: TRIM, opens: [{ ...SWIN, at: 93 }] });
  south(S2, BX0 + TO, XC - XS, [{ ...SWIN2, at: 16.5 }, { ...ARCHW, at: 27.5 }]);
  // the same south walls carried up plain to where the vault and the cliff take over
  b.wall({ ax: 'X', c: SC, a: BX0, b: XC - XS, t: TO, h0: C2 + 1, h1: M + 0.9, neg: STONE, pos: STONE });
  b.wall({ ax: 'X', c: SC, a: XC + XS, b: BX1, t: TO, h0: F2, h1: M + 0.9, neg: STONE, pos: STONE });

  // ---- partitions ---------------------------------------------------------------------------------------------------
  const P1 = { t: TP, h0: F1, h1: C1, neg: WALL, pos: WALL, wood: OAK }, P2 = { t: TP, h0: F2, h1: C2, neg: WALL, pos: WALL, wood: OAK };
  // ground: the hall | the listening room; the tea room | the banya; the middle's two sides (each runs to the circle's wall)
  b.wall({ ...P1, neg: 'coursed', pos: 'coursed', ax: 'X', c: HY, a: BX0 + TO, b: XC - xArc(HY) + 0.6, opens: [{ ...CASED, at: 27.5 }] });
  b.wall({ ...P1, neg: 'coursed', pos: 'hinoki', ax: 'X', c: HY, a: XC + xArc(HY) - 0.6, b: BX1 - TO, opens: [{ ...CASED, at: 88 }] });
  b.wall({ ...P1, neg: 'coursed', pos: POOLWALL, ax: 'Y', c: PW, a: yAt(PW) + 0.15, b: BY1 - TO, opens: [{ ...CASED, at: 61.5 }] });
  b.wall({ ...P1, neg: POOLWALL, pos: 'hinoki', ax: 'Y', c: PE, a: yAt(PE) + 0.15, b: BY1 - TO, opens: [{ ...CASED, at: 61.5 }] });
  // An oak post where each cross wall meets the circle. The circle's facets are mitred on lines through its centre and
  // a cross wall is square to the axes, so at every such corner a sliver of the next room's lining showed past the
  // wall's end (a strip of the pool's tile in the banya). The post stands over the join, floor to ceiling.
  { const yF = YC + Math.sqrt((R + T / 2) ** 2 - 17 ** 2), xF = xArc(HY);
    for (const [f, c] of [[F1, C1], [F2, C2]]) { for (const X of [PW, PE]) b.box(OAK, X - (X < XC ? 0.95 : 0.55), X + (X < XC ? 0.55 : 0.95), yF - 1.25, yF + 0.75, f, c - 0.02, { grain: 'long' });
      for (const sg of [-1, 1]) if (f === F1 || sg < 0) b.box(OAK, XC + sg * xF - 0.75 + (sg < 0 ? 0 : 0.3), XC + sg * xF + 0.45 + (sg < 0 ? 0 : 0.3), HY - 0.5, HY + 0.5, f, c - 0.02, { grain: 'long' }); } }
  // every cased opening's reveal is lined in oak, jambs and head: a wall between two rooms is two leaves, each room's
  // own, and bare in the reveal they showed side by side with the threshold as a third ("like strata")
  { const line = (ax, c, at, w, head, t) => { const e = t / 2 + 0.03, h0 = F1 + 0.04, h1 = F1 + head, L = 0.09, bx = (u0, u1, a0, a1) => (ax === 'X' ? b.box(OAK, u0, u1, c - e, c + e, a0, a1, { grain: 'long' }) : b.box(OAK, c - e, c + e, u0, u1, a0, a1, { grain: 'long' }));
      bx(at - 0.01, at + L, h0, h1); bx(at + w - L, at + w + 0.01, h0, h1); bx(at + L, at + w - L, h1 - L, h1 + 0.01);
      // and a plain oak head board over it on both faces (the piece of wall over an opening was left bare plaster)
      const e2 = t / 2 + 0.2, hb = (u0, u1, a0, a1) => (ax === 'X' ? b.box(OAK, u0, u1, c - e2, c + e2, a0, a1, { grain: 'long' }) : b.box(OAK, c - e2, c + e2, u0, u1, a0, a1, { grain: 'long' })); hb(at - 0.45, at + w + 0.45, h1 - 0.02, h1 + 1.15); };
    line('X', HY, 27.5, 4.6, 7.4, TP); line('X', HY, 88, 4.6, 7.4, TP); line('Y', PW, 61.5, 4.6, 7.4, TP); line('Y', PE, 61.5, 4.6, 7.4, TP); line('Y', BX0 + TO / 2, TUNNEL.Y0 + 0.3, 5.4, 7.4, TO); }
  // the banya's block: the wash room on the courtyard side, the parnaya and the treatment room behind it, side by side
  const BYW = 55.3, BXM = 95.3;
  b.wall({ ...P1, ax: 'X', c: BYW, a: XC + R + 0.2, b: BX1 - TO, opens: [{ ...DOOR, at: 88.3 }, { ...DOOR, at: 99.5 }] });
  b.wall({ ...P1, ax: 'Y', c: XC + R + 0.5, a: BYW + PT, b: BY1 - TO });
  b.wall({ ...P1, ax: 'Y', c: BXM, a: BYW + PT, b: BY1 - TO });
  // upper: only the west wing and the middle have an upper storey. The suite (a bedroom, and a bathroom in its corner)
  // south; the consulting room, small, by the courtyard glass; the quiet room over the pool. The rest of the west wing's
  // north part is open to the listening room below: a gallery along its west wall, from the stair's head, and a bridge
  // across to the quiet room's door.
  const CRX = 25.2, CRY = 53.3, GX = 20.5, BR = { Y0: 59.8, Y1: 64.2 }, BTH = { X1: 24.3, Y1: 27.3 };      // the bath: the suite's south-west corner, under the window over the clouds
  b.wall({ ...P2, ax: 'X', c: HY, a: BX0 + TO, b: XC - xArc(HY) + 0.6, opens: [{ ...DOOR, at: 19.5, swing: 'neg' }] });
  b.wall({ ...P2, ax: 'Y', c: CRX, a: HY + PT, b: CRY - PT, opens: [{ ...DOOR, at: 45, swing: 'pos' }] });
  b.wall({ ...P2, ax: 'X', c: CRY, a: CRX - PT, b: PW - PT });
  b.wall({ ...P2, ax: 'X', c: BTH.Y1, a: BX0 + TO, b: BTH.X1 + PT });
  b.wall({ ...P2, ax: 'Y', c: BTH.X1, a: BY0 + TO, b: BTH.Y1 - PT, opens: [{ ...DOOR, at: 20.5, w: 2.8, swing: 'pos' }] });
  // (in two, each face named: left to the finishes, the end by the curved window stayed bare plaster on the quiet room's side)
  b.wall({ ...P2, neg: 'walnut', pos: 'coursed', ax: 'Y', c: PW, a: yAt(PW) + 0.15, b: CRY });
  b.wall({ ...P2, neg: 'coursed', pos: 'coursed', ax: 'Y', c: PW, a: CRY, b: BY1 - TO, opens: [{ ...DOOR, at: BR.Y0 + 0.7 }] });

  // ---- floors and ceilings: rectangles, and the corners between them and the circle cut to its curve ------------------
  const IN = 0.7, RW = [BX0 + IN, XC - R, BY0 + IN, BY1 - IN], RE = [XC + R, BX1 - IN, BY0 + IN, BY1 - IN], RM = [XC - R, XC + R, YC + R, BY1 - IN];
  const corners = [
    [[XC - R, YC], ...arcPts(R, 180, 90), [XC - R, YC + R]], [[XC + R, YC + R], ...arcPts(R, 90, 0)],
    [[XC - R, SC], [XC - XS, SC], ...arcPts(R, 180 + dS, 180)], [...arcPts(R, 0, -dS), [XC + XS, SC], [XC + R, SC]],
  ];
  const WELL = { X0: 17.5, X1: 37, Y0: 68.4, Y1: 72.4 };      // the stair to the upper floor: in the listening room, against its north wall, rising westward
  // (floors under the wings are thick and of rock below: their edges showed as a white band along the cliff's foot)
  b.floor(...RW, F1, { mat: STONEFLOOR, thick: 0.5, under: null }); b.floor(...RE, F1, { mat: STONEFLOOR, thick: 0.5, under: null });
  for (const r of [RW, RE]) b.box('hewn', r[0] - IN, r[1] + IN, BY0 - 0.05, BY0 + 2.5, -7, F1 - 0.5);
  b.floor(...RM, F1, { mat: STONEFLOOR, thick: 1.2, under: null, holes: [[POOL.X0, POOL.X1, POOL.Y0, BY1 - IN]] });
  b.floor(XC - 17 + 0.3, XC + 17 - 0.3, BY1 - IN, PN - IN, F1, { mat: STONEFLOOR, thick: 1.2, under: null, holes: [[POOL.X0, POOL.X1, BY1 - IN, POOL.Y1]] }); b.ceiling(XC - 17 + 0.3, XC + 17 - 0.3, BY1 - 0.1, PN - IN, PH);      // (from the upper storey's wall: begun at the beam's face it left a slot open along that wall)
  // the upper floor: all of the west wing's south part; in its north part only the gallery and the bridge (the rest is
  // open to the listening room); the middle. None over the east wing: a ceiling there, and rock.
  const VOID = [[GX, XC - R, CRY + PT, BR.Y0], [GX, XC - R, BR.Y1, BY1 - IN], [WELL.X0, GX, WELL.Y0, WELL.Y1]];
  b.floor(...RW, F2, { mat: BOARDS, thick: 0.9, holes: VOID });
  b.floor(...RM, F2, { mat: BOARDS, thick: 0.9, holes: [[XC - R, PW - PT, CRY + PT, BR.Y0], [XC - R, PW - PT, BR.Y1, BY1 - IN]] });      // (the first hole begins at the consulting room's north wall: begun at the floor's own edge it left a slot open in that room's floor)
  b.ceiling(...RW, C2); b.ceiling(...RM, C2); b.ceiling(...RE, C1);
  b.floor(XC + R, ESE + 0.6, HY - 0.6, ESN + 0.6, F2, { mat: BOARDS, thick: 0.85, under: null }); b.ceiling(XC + R, ESE + 0.6, HY - 0.6, ESN + 0.6, C2);      // the east suite's
  // rails: the gallery's edge, both sides of the bridge, the loft's edge, round the stair's head
  { const rail = (ax, from, to, at, ends = ['post', 'post']) => b.rail({ ax, from, to, at, h0: F2, mat: OAK, ends });
    rail('Y', CRY + PT, BR.Y0, GX + 0.1); rail('Y', BR.Y1, WELL.Y0, GX + 0.1); rail('X', GX, PW - PT, BR.Y0 + 0.1, ['post', 'wall']); rail('X', GX, PW - PT, BR.Y1 - 0.1, ['post', 'wall']);
    rail('X', GX, CRX - PT, CRY + PT + 0.1, ['post', 'wall']); rail('X', WELL.X0, GX, WELL.Y0 - 0.1); }
  // each corner in its own room's floor and ceiling; the two big ones are cut at the middle's side walls (the pool's
  // tile and the quiet room's boards on one side, the wing's on the other)
  { const clipX = (P, x, left) => { const out = [], inside = q => (left ? q[0] <= x : q[0] >= x); for (let i = 0; i < P.length; i++) { const a = P[i], c = P[(i + 1) % P.length]; if (inside(a)) out.push(a); if (inside(a) !== inside(c)) { const f = (x - a[0]) / (c[0] - a[0]); out.push([x, a[1] + (c[1] - a[1]) * f]); } } return out; };
    const put = (P, f1, c1, f2, c2) => { if (P.length < 3) return; flat(f1, P, F1); flat(c1, P, C1, false); if (f2) { flat(f2, P, F2); flat(c2, P, C2, false); } };
    put(clipX(corners[0], PW, true), STONEFLOOR, 'boards', BOARDS, AMBER); put(clipX(corners[0], PW, false), POOLFLOOR, 'boards', BOARDS, 'boards');      // listening | consulting; pool | quiet
    put(clipX(corners[1], PE, true), POOLFLOOR, 'boards', BOARDS, 'boards'); put(clipX(corners[1], PE, false), STONEFLOOR, 'boards', BOARDS, AMBER);                 // pool | quiet; banya
    put(corners[2], STONEFLOOR, 'boards', BOARDS, AMBER); put(corners[3], STONEFLOOR, 'boards', null); }                                                      // hall | suite; tea room
  b.surface(XC - R, XC, YC, YC + R, F1); b.surface(XC, XC + R, YC, YC + R, F1); b.surface(XC - R, XC + R, SC, YC, F1);      // (under the courtyard's own floor, the two are within an inch)
  b.surface(XC - R, XC, YC, YC + R, F2); b.surface(XC, XC + R, YC, YC + R, F2); b.surface(XC - R, XC + R, SC, YC, F2);      // (the upper floor's corners; nobody can be in the courtyard at that height)

  // ---- the stair to the upper floor: one flight westward along the listening room's north wall -------------------------
  // (It stood in the hall: Anna asked for it in "the restaurant/bar thing instead of the main room", to clear the hall.)
  b.stair({ ax: 'X', from: WELL.X1, to: WELL.X0 - 1, lo: WELL.Y0, hi: WELL.Y1, h0: F1, h1: F2, steps: 21, mat: OAK, closed: 'coursed' });
  b.rail({ ax: 'X', from: WELL.X1, to: WELL.X0 - 1, at: WELL.Y0 + 0.07, h0: F1, h1: F2, steps: 21, mat: OAK, string: true, sw: 0.2 });

  // ---- the pool: a basin sunk in the middle room's floor, steps down into it at the west end ------------------------------
  { const { X0, X1, Y0, Y1, deep } = POOL, hb = F1 - deep, TILE = 'tile_hex#8fbdb4';
    b.box(TILE, X0 - 0.5, X1 + 0.5, Y0 - 0.5, Y1 + 0.5, hb - 0.6, hb); b.surface(X0, X1, Y0, Y1, hb);
    b.box(TILE, X0 - 0.5, X0, Y0, Y1, hb, F1 - 0.03); b.box(TILE, X1, X1 + 0.5, Y0, Y1, hb, F1 - 0.03); b.box(TILE, X0 - 0.5, X1 + 0.5, Y0 - 0.5, Y0, hb, F1 - 0.03); b.box(TILE, X0 - 0.5, X1 + 0.5, Y1, Y1 + 0.5, hb, F1 - 0.03);
    b.stair({ ax: 'X', from: X0, to: X0 + 6, lo: Y0, hi: Y1, h0: F1, h1: hb, steps: 6, mat: TILE, closed: TILE, top: true });
    // nobody walks out through the basin's sides (they were not solid, and under the floor is eight feet of nothing): solid from
    // the basin's floor to just under the room's, so they stop someone in the water and nobody on the walkways
    for (const [a0, a1, c0, c1] of [[X0 - 0.6, X0 - 0.05, Y0 - 0.6, Y1 + 0.6], [X1 + 0.05, X1 + 0.6, Y0 - 0.6, Y1 + 0.6], [X0 - 0.6, X1 + 0.6, Y0 - 0.6, Y0 - 0.05], [X0 - 0.6, X1 + 0.6, Y1 + 0.05, Y1 + 0.6]]) b.block(a0, a1, c0, c1, hb - 1, F1 - 0.05);
    b.surface(X0 - 0.6, X1 + 0.6, Y0 - 0.6, Y1 + 0.6, hb - 0.02);
    flat('water', rect(X0, X1, Y0, Y1), F1 - 0.45);
    // In the water you float: the basin's floor (for the walker only) rides nine inches up and bobs, so the eye is
    // just over the water and moves with it. And nobody leaves the water except up the steps: anyone below the room's
    // floor is kept inside the basin's rectangle, whatever they jumped at (from the steps one could slip sideways
    // under the floor, and under that is nothing).
    b.later(ctx => { const A = b.world(X0, Y0, 0), B = b.world(X1, Y1, 0), x0 = Math.min(A.x, B.x), x1 = Math.max(A.x, B.x), z0 = Math.min(A.z, B.z), z1 = Math.max(A.z, B.z), yF = b.world(0, 0, F1).y, yB = b.world(0, 0, hb).y;
      const beds = (ctx.house?.surfaces ?? []).filter(s => !s.ramp && Math.abs(s.h - yB) < 0.06 && s.x0 < x1 && s.x1 > x0 && s.z0 < z1 && s.z1 > z0);
      ctx.animated.push(t => { const w = ctx.walker, lift = 0.75 + 0.13 * Math.sin(t * 1.5) + 0.05 * Math.sin(t * 2.7 + 1); for (const s of beds) s.h = yB + lift;
        if (!w || w.pos.y > yF - 0.25 || w.pos.y < yB - 6) return; const p = w.pos, m = 0.8;
        if (p.x > x0 - 14 && p.x < x1 + 14 && p.z > z0 - 14 && p.z < z1 + 14) { p.x = Math.max(x0 + m, Math.min(x1 - m, p.x)); p.z = Math.min(z1 - m, p.z); }      /* (not held at the west end: the steps go out there) */ }); }); }

  // ---- the chapel: one tall room cut back into the rock behind the pool, lit by a round shaft from the meadow --------------
  { const { X0, X1, Y1, ceil } = CH, Y0 = PN, t = 1.5, s = { t, h0: -1, h1: ceil + 0.6, fl: F1, base: false };
    b.wall({ ...s, ax: 'Y', c: X0 - t / 2, a: Y0, b: Y1 + t, neg: ROCKM, pos: 'rubble', outside: 'neg' }); b.wall({ ...s, ax: 'Y', c: X1 + t / 2, a: Y0, b: Y1 + t, neg: 'rubble', pos: ROCKM, outside: 'pos' });
    b.wall({ ...s, ax: 'X', c: Y1 + t / 2, a: X0, b: X1, neg: 'rubble', pos: ROCKM, outside: 'pos' });
    b.box('rubble', X0, X1, Y0 - 0.05, Y0 + 0.02, C2 + 1, ceil + 0.6);                       // (nothing above the box's own north wall: closed by the rock, here in stone)
    b.floor(X0, X1, Y0, Y1, F1, { mat: STONEFLOOR, thick: 1.2, under: null });
    flat('rubble', rect(X0, X1, Y0, Y1), ceil, false, [circ(OCULUS.X, OCULUS.Y, OCULUS.r)]);
    // the shaft: a drum of stone seen from inside, from the ceiling to a kerb standing in the meadow
    const n = 28, h0 = ceil, h1 = TOPH + 1, pos = [], uv = [];
    for (let i = 0; i < n; i++) { const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, P = a => [OCULUS.X + OCULUS.r * Math.cos(a), -(OCULUS.Y + OCULUS.r * Math.sin(a))];
      const [x0, z0] = P(a0), [x1, z1] = P(a1), u0 = a0 * OCULUS.r, u1 = a1 * OCULUS.r;
      pos.push(x0, h0, z0, x0, h1, z0, x1, h1, z1, x0, h0, z0, x1, h1, z1, x1, h0, z1); uv.push(u0, h0, u0, h1, u1, h1, u0, h0, u1, h1, u1, h0); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    { const p = g.attributes.position, nn = g.attributes.normal; if (nn.getX(0) * (p.getX(0) - OCULUS.X) + nn.getZ(0) * (p.getZ(0) + OCULUS.Y) > 0) { const q = g.index; for (let i = 0; i < p.count; i += 3) { const a = [p.getX(i + 1), p.getY(i + 1), p.getZ(i + 1)], u = [g.attributes.uv.getX(i + 1), g.attributes.uv.getY(i + 1)]; p.setXYZ(i + 1, p.getX(i + 2), p.getY(i + 2), p.getZ(i + 2)); p.setXYZ(i + 2, ...a); g.attributes.uv.setXY(i + 1, g.attributes.uv.getX(i + 2), g.attributes.uv.getY(i + 2)); g.attributes.uv.setXY(i + 2, ...u); } g.computeVertexNormals(); void q; } }
    b.mesh('rubble', g);
    /* (the kerb that stood round the shaft's head in the meadow is gone with the meadow: seen from below it was a ragged ring of stone inside the shaft) */ }

  // ---- the cave: a low room west of the larder, for cheese and wine ---------------------------------------------------------
  { const { X0, Y0, Y1, ceil } = CAVE, X1 = BX0, s = { t: 1, h0: -1, h1: ceil + 0.5, fl: F1, base: false };
    b.wall({ ...s, ax: 'Y', c: X0 - 0.5, a: Y0 - 1, b: Y1 + 1, neg: ROCKM, pos: WALL, outside: 'neg' });
    b.wall({ ...s, ax: 'X', c: Y0 - 0.5, a: X0, b: X1, neg: ROCKM, pos: WALL, outside: 'neg' }); b.wall({ ...s, ax: 'X', c: Y1 + 0.5, a: X0, b: X1, neg: WALL, pos: ROCKM, outside: 'pos' });
    b.floor(X0, X1 + 0.1, Y0, Y1, F1, { mat: STONEFLOOR, thick: 1.2, under: null }); b.ceiling(X0, X1, Y0, Y1, ceil); }

  // ---- the way in: cellar doors on the meadow, three flights and two level runs going down eastward -----------------
  const TW0 = TUNNEL.Y0, TW1 = TUNNEL.Y1, HEAD = 8.6;
  const L1 = 20, L2 = 10;
  const LAU = { X0: -39.5, X1: -26.5, Y0: TUNNEL.Y1 + 1, Y1: 45, CX1: -20, CY0: 36.5 };      // the laundry, off the first landing, and its closet                                    // the two landings' heights
  const xA0 = HATCH.X0 + 2, xA1 = xA0 + 15, xB0 = xA1 + 12, xB1 = xB0 + 15, xC0 = xB1 + 8, xC1 = BX0 - 1.2;      // head and foot of each flight
  const TM = STONEFLOOR;      // (paler steps: the stair read dark and sad)
  b.stair({ ax: 'X', from: xA0, to: xA1, lo: TW0, hi: TW1, h0: M, h1: L1, mat: TM, closed: ROCKM, top: true });
  b.stair({ ax: 'X', from: xB0, to: xB1, lo: TW0, hi: TW1, h0: L1, h1: L2, mat: TM, closed: ROCKM, top: true });
  b.stair({ ax: 'X', from: xC0, to: xC1, lo: TW0, hi: TW1, h0: L2, h1: F1, mat: TM, closed: ROCKM, top: true });
  b.floor(xA1, xB0, TW0, TW1, L1, { mat: TM, thick: 1, under: null }); b.floor(xB1, xC0, TW0, TW1, L2, { mat: TM, thick: 1, under: null }); b.floor(xC1, BX0 + 0.1, TW0, TW1, F1, { mat: TM, thick: 1, under: null });
  b.floor(HATCH.X0, xA0, TW0, TW1, M, { mat: TM, thick: 1, under: null }); b.surface(HATCH.X0 - 1.2, xA0, TW0 - 0.4, TW1 + 0.4, M);      // (and no gap between the grass and the stair's head: there was one, four inches wide, and it was eight feet deep)
  // its two sides, the whole height (what is above the ceiling is never seen), and its ends
  b.wall({ ax: 'X', c: TW0 - 0.5, a: HATCH.X0 - 1, b: BX0, t: 1, h0: -1, h1: M - 0.02, neg: ROCKM, pos: WALL, base: false });
  b.wall({ ax: 'X', c: TW1 + 0.5, a: HATCH.X0 - 1, b: BX0, t: 1, h0: -1, h1: M - 0.02, fl: L1, neg: WALL, pos: WALL, base: false, wood: OAK, opens: [{ kind: 'door', at: LAU.X0 + 5.2, w: 3, head: 7, hinge: 'b', swing: 'pos', style: 'half', case: 'plain', inside: true, threshold: OAK }] });      // (the laundry's door, off the first landing)
  b.wall({ ax: 'Y', c: HATCH.X0 - 0.5, a: TW0, b: TW1, t: 1, h0: L1, h1: M - 0.02, neg: ROCKM, pos: WALL, base: false });
  // ceilings: level over the landings, sloping with the flights
  const slope = (x0, hA, x1, hB) => { const len = Math.hypot(x1 - x0, hB - hA), mx = (x0 + x1) / 2, mh = (hA + hB) / 2; b.box('boards', mx - len / 2, mx + len / 2, TW0, TW1, mh, mh + 0.5, { rot: [0, 0, Math.atan2(hB - hA, x1 - x0)] }); };
  /* (no wall across the stair's head: it hung at eye level in front of where you begin, and you walked under it as if through it; the ceiling slopes down from the doors' foot instead) */ b.box('c#2c3832/0.7/0.3', HATCH.X1 - 0.1, HATCH.X1 + 0.5, TW0 - 0.3, TW1 + 0.3, M - 0.1, M + 0.75);                 // the wall the opening ends against
  slope(HATCH.X1 - 0.4, M + 0.5, HATCH.X1 + 8, L1 + HEAD + 0.1); b.ceiling(HATCH.X1 + 7.7, xB0 + 0.3, TW0, TW1, L1 + HEAD); slope(xB0, L1 + HEAD + 0.1, xB1, L2 + HEAD + 0.1); b.ceiling(xB1 - 0.3, xC0 + 0.3, TW0, TW1, L2 + HEAD); slope(xC0, L2 + HEAD + 0.1, BX0, F1 + HEAD + 0.1);
  // The cellar doors, from inside: a steel bulkhead closed over the stair's head (two leaves on a slope, a line of
  // daylight between them), its cheeks and its back. You begin a few steps down, under them (campus.js: spawn);
  // E on the leaves is the way up to the house (b.later, below). Nobody sees it from outside: there is no outside.
  { const X0 = HATCH.X0 - 1, X1 = HATCH.X1, hi = M + 6.2, lo = M + 0.5, STEEL = 'c#3a4a41/0.55/0.5', len = Math.hypot(X1 - X0, hi - lo), mx = (X0 + X1) / 2, mh = (hi + lo) / 2, ang = Math.atan2(lo - hi, X1 - X0);
    for (const [y0, y1] of [[TW0 - 0.3, YC - 0.04], [YC + 0.04, TW1 + 0.3]]) b.box(STEEL, mx - len / 2, mx + len / 2, y0, y1, mh, mh + 0.12, { rot: [0, 0, ang] });
    b.box('e#fff0cc/2.4', mx - len / 2, mx + len / 2, YC - 0.04, YC + 0.04, mh + 0.02, mh + 0.06, { rot: [0, 0, ang] });      // the crack of daylight
    for (const y of [TW0 - 0.35, TW1 + 0.25]) b.box('c#2c3832/0.7/0.3', X0, X1 + 0.5, y, y + 0.1, M - 0.1, hi + 0.2);      // cheeks
    b.box('c#2c3832/0.7/0.3', X0 - 0.1, X0, TW0 - 0.3, TW1 + 0.3, M - 0.1, hi + 0.2);
    b.block(X0 - 1, HATCH.X0 + 5.6, TW0, TW1, M - 6, M + 8);                         // the top few steps are under the low end of the leaves: nobody goes up into them
    b.later(ctx => { const p = b.world(HATCH.X0 + 4.5, YC, M + 3.4); ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 9, label: () => 'go up to the house', act: () => { if (HOUSE_ADDRESS) { document.body.style.transition = 'opacity 0.9s'; document.body.style.opacity = '0'; setTimeout(() => { location.href = HOUSE_ADDRESS + '?from=spanya'; }, 950); } else ctx.flash('The doors are stiff. Not yet.'); } }); }); }

  // ---- the laundry: a small bright room off the stair's first landing, and a linen closet off that -----------------
  // (Anna: "a small but wonderful laundry room of dreams ... off the stairs to the basement".) furnish/laundry.js fills it.
  { const { X0, X1, Y0, Y1, CX1, CY0 } = LAU, f = L1, c = L1 + 8.6, s = { t: 1, h0: f - 1, h1: c + 0.5, fl: f, wood: OAK };
    b.wall({ ...s, ax: 'Y', c: X0 - 0.5, a: Y0, b: Y1 + 1, neg: ROCKM, pos: WALL, outside: 'neg' });
    b.wall({ ...s, ax: 'X', c: Y1 + 0.5, a: X0, b: CX1 + 1, neg: WALL, pos: ROCKM, outside: 'pos' });
    b.wall({ ...s, t: 0.5, ax: 'Y', c: X1 + 0.25, a: Y0, b: Y1, neg: WALL, pos: WALL, opens: [{ kind: 'door', at: 39, w: 2.6, head: 6.8, hinge: 'a', swing: 'pos', style: 'ledged', case: 'plain', threshold: OAK }] });
    b.wall({ ...s, ax: 'Y', c: CX1 + 0.5, a: CY0 - 1, b: Y1, neg: WALL, pos: ROCKM, outside: 'pos' });
    b.wall({ ...s, ax: 'X', c: CY0 - 0.5, a: X1 + 0.5, b: CX1, neg: ROCKM, pos: WALL, outside: 'neg' });
    b.floor(X0, X1 + 0.5, Y0 - 0.05, Y1, f, { thick: 1, under: null }); b.floor(X1 + 0.5, CX1, CY0, Y1, f, { thick: 1, under: null }); b.ceiling(X0, CX1, Y0, Y1, c);
    b.room('The Laundry', X0, X1, Y0, Y1, f, c); b.room('The Linen Closet', X1 + 0.5, CX1, CY0, Y1, f, c);
    b.fill((X0 + X1) / 2, (Y0 + Y1) / 2, c - 1, 1.6); b.fill((X1 + CX1) / 2, (CY0 + Y1) / 2, c - 1, 1); }

  // ---- rooms: captions, what is drawn, the light indoors -------------------------------------------------------------
  const L = { light: false }, yW = yAt(PW) + 0.5, yE = yAt(PE) + 0.5, yM = YC + R + 0.9;
  const yOut = X => YC + Math.sqrt((R + T / 2) ** 2 - (X - XC) ** 2) + 0.1;      // the circle wall's room face, at X
  const yA = yOut(XC + 21) + 0.2, yC = yOut(XC + 10.5) + 0.2;
  // ground
  b.room('The Hall', wX0, wX1, iY0, HY - PT, F1, C1, L);
  b.room('The Listening Room', wX0, wX1, HY + PT, iY1, F1, C1, L); b.room('The Listening Room', wX1, PW - PT, yW, iY1, F1, C1, L); b.room('The Listening Room', wX1, XC - 21, Math.max(yA, HY + PT), yW, F1, C1, L);
  b.room('The Cave', CAVE.X0, BX0, CAVE.Y0, CAVE.Y1, F1, CAVE.ceil);
  b.room('The Chapel', CH.X0, CH.X1, PN, CH.Y1, F1, CH.ceil);
  b.room('The Pool', PW + TO / 2, PE - TO / 2, iY1, PN - TO, F1, PH, L);
  b.room('The Tea Room', eX0, eX1, iY0, HY - PT, F1, C1, L);
  b.room('The Banya', eX0, eX1, HY + PT, BYW - PT, F1, C1, L); b.room('The Banya', PE + PT, eX0, yE, iY1, F1, C1, L); b.room('The Banya', XC + 21, eX0, Math.max(yA, HY + PT), yE, F1, C1, L);
  b.room('The Parnaya', eX0 + 0.6, BXM - PT, BYW + PT, iY1, F1, C1, L); b.room('The Treatment Room', BXM + PT, eX1, BYW + PT, iY1, F1, C1, L);
  // upper
  b.room('The Suite', BTH.X1 + PT, wX1, iY0, HY - PT, F2, C2, L); b.room('The Suite', wX0, BTH.X1 + PT, BTH.Y1 + PT, HY - PT, F2, C2, L);
  b.room('The Bath', wX0, BTH.X1 - PT, iY0, BTH.Y1 - PT, F2, C2, L);
  b.room('The Gallery', wX0, CRX - PT, HY + PT, CRY + PT, F2, C2, L); b.room('The Gallery', wX0, GX, CRY + PT, iY1, F2, C2, L); b.room('The Gallery', GX, PW - PT, BR.Y0, BR.Y1, F2, C2, L);
  b.room('The Consulting Room', CRX + PT, wX1, HY + PT, CRY - PT, F2, C2, L); b.room('The Consulting Room', wX1, PW - PT, yW, CRY - PT, F2, C2, L); b.room('The Consulting Room', wX1, XC - 21, Math.max(yA, HY + PT), yW, F2, C2, L);
  b.room('The East Suite', eX0, ESE, EBY + TP / 2, ESN, F2, C2, L); b.room('The East Suite', eX0, EBX - TP / 2, HY + 0.05, EBY + TP / 2, F2, C2, L); b.room('The East Bath', EBX + TP / 2, ESE, HY + 0.05, EBY - TP / 2, F2, C2, L); b.room('The East Suite', PE + TO / 2, eX0, yE, ESN, F2, C2, L); b.room('The East Suite', XC + 21, eX0, Math.max(yA, HY + 0.05), yE, F2, C2, L);
  // The gallery and the bridge are open to the listening room's tall part along their rails: say so, or from upstairs
  // nothing that stands or hangs in the listening room is drawn ("stuff on the walls disappears when you go to the 2nd floor").
  b.portal(GX - 0.2, GX + 0.5, CRY + PT, iY1, F2, C2, 'X', 'open'); b.portal(GX, PW - PT, BR.Y0 - 0.5, BR.Y0 + 0.2, F2, C2, 'Y', 'open'); b.portal(GX, PW - PT, BR.Y1 - 0.2, BR.Y1 + 0.5, F2, C2, 'Y', 'open');
  // the listening room's tall part: the same room, up to the upper ceiling, either side of the bridge
  b.room('The Listening Room', GX + 0.3, PW - PT, CRY + 0.6, BR.Y0 - 0.3, C1, C2, L); b.room('The Listening Room', GX + 0.3, PW - PT, BR.Y1 + 0.3, iY1, C1, C2, L);
  // the middle of each storey, with the pieces that reach its courtyard windows
  for (const [n, f, c] of [['The Pool', F1, C1], ['The Quiet Room', F2, C2]]) { b.room(n, PW + PT, PE - PT, yM, iY1, f, c, L); b.room(n, PW + PT, XC - 10.5, yC, yM, f, c, L); b.room(n, XC + 10.5, PE - PT, yC, yM, f, c, L); b.room(n, XC - 10.5, XC + 10.5, YC + R + 0.2, yM, f, c, L); }
  b.room('The Stair', HATCH.X1 + 0.5, BX0, TW0, TW1, F1, L1 + HEAD, { ...L, over: 0.2 });
  b.room('The Stair', HATCH.X0, HATCH.X1 + 0.5, TW0, TW1, L1, M + 6, { ...L, over: 0.1 });      // (the first flight, under the cellar doors)
  // The light indoors, a storey of a wing at a time. Each volume reaches a third of a foot into the walls round it and
  // past its floor and ceiling (as b.room's own do): set exactly on the wall's face, every wall was striped, in and
  // out of the light pixel by pixel. The corners between the wings and the circle are stepped in three pieces each.
  const lit = (X0, X1, Y0, Y1, f, c, h0 = f) => b.interior(X0 - 0.35, X1 + 0.35, Y0 - 0.35, Y1 + 0.35, h0 - 0.6, c + 0.45, { floor: f, ceil: c });
  // one volume a storey: the whole box of rooms, less the courtyard's circle (to just inside its wall)
  const HOLE_L = { X: XC, Y: YC, r: R - 0.35 };
  b.interior(wX0 - 0.35, eX1 + 0.35, iY0 - 0.35, iY1 + 0.35, F1 - POOL.deep - 0.6, C1 + 0.45, { floor: F1, ceil: C1, not: HOLE_L });
  b.interior(wX0 - 0.35, PE + 0.1, iY0 - 0.35, iY1 + 0.35, F2 - 0.6, C2 + 0.45, { floor: F2, ceil: C2, not: HOLE_L });
  b.interior(PE - 0.1, ESE + 0.35, HY - 0.4, ESN + 0.4, F2 - 0.6, C2 + 0.45, { floor: F2, ceil: C2, not: HOLE_L });
  lit(PW + TO / 2, PE - TO / 2, iY1 + 0.4, PN - TO, F1, PH, F1 - POOL.deep);
  lit(HATCH.X0, HATCH.X1 + 0.5, TW0, TW1, L1, M + 6);
  lit(HATCH.X1 + 0.5, xB0, TW0, TW1, L1, L1 + HEAD);
  lit(xB0, xC0, TW0, TW1, L2, L1 + HEAD);
  lit(xC0, BX0 + TO + 0.3, TW0, TW1, F1, L2 + HEAD);      // (through the doorway into the hall: stopped short of it, the threshold lay in a strip lit as out of doors)

  // ---- light: one fill a room by day (the furnish files hang the lamps); lamps down the stair ---------------------------
  const FILLS = [[24, 28, 1], [24, 56, 1], [XC, 62, 1], [96, 28, 1], [96, 48, 1], [90, 64, 1], [101, 64, 1], [5, 57, 1, CAVE.ceil], [XC, PN + 13, 1, 14], [XC, 80, 1, PH],
    [29, 30, 2], [18.5, 22, 2], [17, 55, 2], [33, 47, 2], [XC, 62, 2], [31, 66, 2], [92, 56, 2], [95.5, 44.5, 2]];
  b.fill(XC, YC, CY + 7, 0.7); b.fill(XC, YC - 12, CY + 7, 0.5);      // the terrace: under the vault the paving was dim by day
  for (const [X, Y, s, top] of FILLS) b.fill(X, Y, (top ?? (s === 1 ? C1 : C2)) - 1, s === 1 ? 1.5 : 1.3);      // (stronger than a pale room needs: the wood drinks the daylight)
  for (const [X, h] of [[(xA1 + xB0) / 2, L1], [(xB1 + xC0) / 2, L2], [xC1 - 4, F1 + 3]]) { b.lamp(X, YC, h + 7, { power: 1.3, kind: 'candle' }); b.fill(X, YC, h + 6.5, 1.2); }      // (lit at every hour: it is a tunnel)
}
