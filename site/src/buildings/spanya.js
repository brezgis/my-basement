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
import { lookout as LOOK, westWalk, eastWalk } from './cliff-walks.js';
import { carvedRock } from './carved-rock.js';
import { COURT, EDGE_POOL, DOORS, OCULUS, MEADOW as M, houseAddress } from '../campus.js';

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
  const POOLWALL = 'tile_subway#e8dfcc', POOLFLOOR = 'tile_hex#b9b5a9', BASIN_TILE = 'tile_hex#8fbdb4';
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
    // Match the box and round-floor UVs at every straight-to-curved join.
    const { position, uv } = g.attributes;
    for (let i = 0; i < position.count; i++) uv.setXY(i, position.getX(i), position.getZ(i));
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

  const TOPH = M + 135;
  const HATCH = { X0: DOORS.X + 2, X1: DOORS.X + 18, Y0: YC - 3, Y1: YC + 3 };

  // ---- the courtyard: paving, a parapet round the open side of the terrace, a wading pool at the brink --------------
  const deckRadius = R - T / 2 + 0.3, deckSides = 48;
  const WK = { Y0: 9.5, Y1: BY0 - 0.02, XW: 13.7, XE: 108.2 };
  const deck = circ(XC, YC, deckRadius, deckSides);

  // Vertical masonry, glass and riser faces between matching plan vertices.
  function face(mat, a, b0, lowA, highA, lowB = lowA, highB = highA) {
    const length = Math.hypot(b0[0] - a[0], b0[1] - a[1]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([
      a[0], lowA, -a[1], b0[0], lowB, -b0[1], b0[0], highB, -b0[1], a[0], highA, -a[1]], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0,lowA,length,lowB,length,highB,0,highA], 2));
    g.setIndex([0,1,2,0,2,3]); g.computeVertexNormals(); b.mesh(mat, g.toNonIndexed());
  }
  const barrier = (a, end, h) => {
    const n = Math.ceil(Math.hypot(end[0]-a[0], end[1]-a[1]) / 0.7);
    for (let j = 0; j <= n; j++) {
      const x = THREE.MathUtils.lerp(a[0], end[0], j/n), y = THREE.MathUtils.lerp(a[1], end[1], j/n);
      b.block(x-0.33, x+0.33, y-0.33, y+0.33, h-4, h+12);
    }
  };
  { // Cut the paving to the basin. The outside panes, water and tiled bed use the same vertices.
    const { brink, coping, bed, water:level } = EDGE_POOL;
    const parapetTop = CY + 2.3;      // (one height with the walks' stone parapets either side)
    flat(COURTFLOOR, [...deck.slice(0,32), ...coping, ...deck.slice(41)], CY);
    const poolBack = Math.max(...coping.map(p=>p[1])) + 0.42;
    for (const ax of ['X','Y']) for (const [x0,x1,y0,y1] of b.arcRects(XC,YC,deckRadius,0,360,6,ax)) {
      if (y1>poolBack) b.surface(x0,x1,Math.max(y0,poolBack),y1,CY);
    }
    // The warm pool's own tiles (Anna: the same family as indoors): its floor tile on the kerb, its sea-green mosaic
    // border round the water, its celadon basin tile on every tread, riser and wall under the water.
    const white = POOLFLOOR, blue = 'tile_hex#2f6a63', BRASS = 'c#b08d4a/0.32/1';      // (blue: pool_chapel.js BORDER; BRASS: pool_chapel_parts.js MAT.BRASS)
    const deckLip = CY + 0.60, firstStep = CY + 0.22, rise = (firstStep - bed) / 4;
    const row = (a, b, u) => [a[0], a[1] + (b[1] - a[1]) * u];
    // Four broad steps follow the whole tiled bank, tapering into the ends.
    for (let i = 0; i < coping.length - 1; i++) {
      const a = coping[i], b1 = coping[i + 1];
      const points = u => [row(a, brink[i], u), row(b1, brink[i + 1], u)];
      for (let k = 0; k < 4; k++) {
        const depth = k / 8, next = (k + 1) / 8, h = firstStep - k * rise;
        const [ba, bb] = points(depth), [fa, fb] = points(next);
        flat(BASIN_TILE, [ba, bb, fb, fa], h);
        face(BASIN_TILE, fa, fb, h - rise, h);
        b.surfacePolygon([ba, bb, fb, fa], h);
      }
      b.surfacePolygon([a, b1, [b1[0], b1[1] + 0.39], [a[0], a[1] + 0.39]], deckLip);
      b.surfacePolygon([[a[0], a[1] + 0.39], [b1[0], b1[1] + 0.39], [b1[0], poolBack], [a[0], poolBack]], CY);
      b.surfacePolygon([...points(0.5), brink[i + 1], brink[i]], bed);
    }
    // The brass rail follows the treads from the dry paving to a socket in the bed.
    const side = 2, rx = coping[side][0], ry = coping[side][1], run = (ry - brink[side][1]) / 8;
    const rail = b.fr(rx, ry, CY, 2);
    b.kit.put(rail, BRASS, b.kit.geom.sweep([
      [0, -0.76, 0], [0, -0.76, 2.86], [0, -0.68, 3.07], [0, -0.48, 3.2],
      [0, -0.19, 3.20], [0, run, 3.0], [0, 4 * run + 0.22, 3.0 - 3 * rise],
      [0, 4 * run + 0.39, 2.65 - 3 * rise], [0, 4 * run + 0.39, bed - CY]
    ], 0.066, { seg: 12 }));
    for (const [y, h] of [[-0.76, 0], [4 * run + 0.39, bed - CY]]) rail.cyl(BRASS, 0, y, h, h + 0.05, 0.15, 0.115, 16);
    b.block(rx - 0.066, rx + 0.066, ry - 4 * run - 0.45, ry + 0.83, bed, CY + 3.26);
    const basin = [...brink, ...coping.slice(1,-1).reverse()];
    // The bed ends at the lowest riser to avoid a coplanar sheet under the stairs.
    const bottom = coping.map((p, i) => row(p, brink[i], 0.5));
    flat(BASIN_TILE, [...brink, ...bottom.slice(1, -1).reverse()], bed); flat('water', basin, level);      // (the warm pool's water; its ripples are laid over it in grounds.js)
    // In this water too you float, as in the warm pool indoors (below): its bed, for the walker only, rides up so that
    // the eye is the same height over the water as there, and bobs.
    b.later(ctx => { const pts = brink.map(([X, Y]) => b.world(X, Y, 0)), cps = coping.map(([X, Y]) => b.world(X, Y, 0)), all = [...pts, ...cps];
      const x0 = Math.min(...all.map(q => q.x)) - 0.5, x1 = Math.max(...all.map(q => q.x)) + 0.5, z0 = Math.min(...all.map(q => q.z)) - 0.5, z1 = Math.max(...all.map(q => q.z)) + 0.5, yB = b.world(0, 0, bed).y, yW = b.world(0, 0, level).y;
      const beds = (ctx.house?.surfaces ?? []).filter(q => !q.ramp && Math.abs(q.h - yB) < 0.06 && q.x0 < x1 && q.x1 > x0 && q.z0 < z1 && q.z1 > z0);
      const rise = Math.max(0, (yW - yB) - 2.4);
      ctx.animated.push(t => { const lift = rise + 0.13 * Math.sin(t * 1.5) + 0.05 * Math.sin(t * 2.7 + 1); for (const q of beds) q.h = yB + lift; }); });
    for (let i = 0; i < brink.length-1; i++) {
      const a = brink[i], d = brink[i+1], c = coping[i], e = coping[i+1];
      face('pool_glass', a, d, bed, parapetTop);
      const lip = pt => [pt[0],pt[1]+0.095];
      flat('c#80aea7/0.24', [a, d, lip(d), lip(a)], parapetTop);
      if (i > 0) b.cyl('c#71978e/0.5', a[0], a[1], bed, parapetTop - 0.01, 0.025, 0.025, 8);
      face(STONE, a, d, -8, bed);
      face(BASIN_TILE, c, e, firstStep, level - 0.11);
      face(BASIN_TILE, c, e, level - 0.11, deckLip);
      const back = pt => [pt[0],pt[1]+0.39];
      flat(blue, [c,e,back(e),back(c)], deckLip);
      face(white, back(e),back(c),CY,deckLip);
      barrier(a,d,bed);

    }
    // Set the end panes into bronze channels at the matching stone parapets.
    for (const [x, y] of [brink[0], brink.at(-1)]) b.cyl('c#6c6654/0.49/0.52', x, y, bed, parapetTop, 0.16, 0.16, 12);
    // The stone parapet between each walk and the pool: the walks' own section (0.4 ft thick, 2.3 high) carried along
    // the paving's edge to the end pane. (It was a stub of the courtyard's 1.5 ft wall, taller: "a weird big chunk".)
    const top = CY + 2.3, walkEnd = (i, j) => { const [x, y] = deck[i], [nx, ny] = deck[j]; return [x + (WK.Y0 - y) * (nx - x) / (ny - y), WK.Y0]; };
    for (const pts of [[walkEnd(30, 31), deck[31], brink[0]], [brink.at(-1), deck[41], walkEnd(41, 42)]]) {      // (each in the order of +X: its faces look out)
      const inner = pts.map(([x, y]) => { if (y === WK.Y0) return [x, y + 0.4]; const l = Math.hypot(XC - x, YC - y); return [x + (XC - x) / l * 0.4, y + (YC - y) / l * 0.4]; });
      for (let j = 1; j < pts.length; j++) {
        face(STONE, pts[j - 1], pts[j], -8, top); face(STONE, inner[j], inner[j - 1], CY, top);
        flat(STONE, [pts[j - 1], pts[j], inner[j], inner[j - 1]], top);
        barrier(pts[j - 1], pts[j], CY);
      }
      const k = pts[0][1] === WK.Y0 ? pts.length - 1 : 0;      // the end at the pool: closed
      face(STONE, ...(k ? [pts[k], inner[k]] : [inner[k], pts[k]]), CY, top);
    }
  }
  { // the walks: paving, a solid base, a parapet; the lookout, a half-round balcony on the west walk
    // Trace the actual edges of the courtyard polygon between the walk's two ends.
    // Sampling another circle here left alternating slivers of overlap and daylight.

    function walkEdge(start, end) {
      const edge = [];
      for (let i = start; i < end; i++) {
        const [x, y] = deck[i], [nx, ny] = deck[(i + 1) % deckSides];
        for (const line of [WK.Y0, WK.Y1]) {
          if (line > Math.min(y, ny) && line < Math.max(y, ny))
            edge.push([x + (line - y) * (nx - x) / (ny - y), line]);
        }
        if (y >= WK.Y0 && y <= WK.Y1) edge.push([x, y]);
      }
      return edge.sort((a, b) => a[1] - b[1]);
    }
    for (const [route,west] of [[westWalk,true],[eastWalk,false]]) {
      const x0 = route[0][0], edge = west ? walkEdge(24,36) : walkEdge(36,48);
      flat(COURTFLOOR, [[x0,WK.Y0],...edge,[x0,WK.Y1]], CY);
      b.surface(Math.min(x0,edge[0][0]),Math.max(x0,edge[0][0]),WK.Y0,WK.Y1,CY);
      const apron = west ? [[x0,WK.Y0],edge[0]] : [edge[0],[x0,WK.Y0]];
      face(STONE, ...apron, -8,CY+2.3);
      const cap = apron.map(([x,y])=>[x,y+0.4]);
      flat(STONE,[...apron,...cap.slice().reverse()],CY+2.3);
      face(STONE,cap[1],cap[0],CY,CY+2.3);
      barrier([x0,WK.Y0],edge[0],CY);
      const rail = [];
      for (let i=0;i<route.length-1;i++) {
        const [x,y,back,rise] = route[i], [nx,ny,nb,nextRise] = route[i+1];
        const h = CY+rise, a = [x,y], d = [nx,ny], c = [x,back], e = [nx,nb];
        flat(COURTFLOOR, [a,d,e,c],h);
        // A shallow lip of cut stone rests on rough rock which folds back into the island.
        const cut = (point, height) => [point[0], height - 0.92, -point[1]];
        const [lo,hi] = west ? [d,a] : [a,d];
        const l = cut(lo, west ? CY + nextRise : h), r = cut(hi, west ? h : CY + nextRise);
        face(STONE, lo, hi, l[1], h, r[1], h);
        face(STONE, ...(west ? [c,e] : [e,c]), -8,h);
        if (rise !== nextRise) face(STONE, ...(west ? [d,e] : [e,d]),h,CY+nextRise);
        // The excavation continues into the cliff on the high side of each tread.
        if (Math.min(back,nb)<15.97) {
          const verts = [x,h-0.06,-back,nx,CY+nextRise-0.06,-nb,nx,CY-0.12,-16.25,x,CY-0.12,-16.25];
          const g = new THREE.BufferGeometry();
          g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
          g.setAttribute('uv',new THREE.Float32BufferAttribute([x,back,nx,nb,nx,16.25,x,16.25],2));
          g.setIndex(west ? [0,2,1,0,3,2] : [0,1,2,0,2,3]); g.computeVertexNormals(); b.mesh('cliffrock',g.toNonIndexed());
          barrier(c,e,h);
        }
        const strips = Math.ceil(Math.abs(nx-x)/0.6);
        for (let j=0;j<strips;j++) {
          const t=(j+0.5)/strips, l=x+(nx-x)*j/strips, r=x+(nx-x)*(j+1)/strips;
          b.surface(Math.min(l,r),Math.max(l,r),y+(ny-y)*t,back+(nb-back)*t,h);
        }
        // Leave the full entrance of the lookout open off the last landing.
        if (!(west && x<=LOOK.X+LOOK.r && nx>=LOOK.X-LOOK.r)) {
          barrier(a,d,h);
          rail.push([x,y,h]); rail.push([nx,ny,h]);
        }
      }
      for (let i=0;i<rail.length;i+=2) {
        const [x,y,h] = rail[i], [nx,ny] = rail[i+1];
        if (i===0 || i%4===0 || i===rail.length-2) b.cyl(STONE,x,y,h,h+2.75,0.19,0.15,7);
        const endH = i+2<rail.length && rail[i+2][0]===nx ? rail[i+2][2] : h;
        const start = new THREE.Vector3(x,h+2.6,-y), end = new THREE.Vector3(nx,endH+2.6,-ny);
        const dir=end.clone().sub(start), g=new THREE.CylinderGeometry(0.075,0.075,dir.length(),8);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize()));
        g.translate(...start.lerp(end,0.5).toArray()); b.mesh('c#443b30/0.68',g);
      }
    }
    const lookoutFloor = CY + westWalk.at(-1)[3];
    const [westEnd,front,back] = westWalk.at(-1);
    barrier([westEnd,front],[westEnd,back],lookoutFloor);
    b.floorArc({ X: LOOK.X, Y: LOOK.Y, r: LOOK.r, from: 180, to: 360, n: 14, h: lookoutFloor, mat: COURTFLOOR, thick: 0.6, under: null });
    b.arcWall({ X: LOOK.X, Y: LOOK.Y, r: LOOK.r + 0.3, from: 180, to: 360, n: 12, t: 0.6, h0: lookoutFloor - 0.05, h1: lookoutFloor + 2.6, out: STONE, in: STONE });
    // The lookout sits on a rock spur that returns into the island below the balcony.
    const spur=new THREE.CylinderGeometry(LOOK.r+0.57,3.0,17,24,5);
    const verts=spur.attributes.position;
    for (let i=0;i<verts.count;i++) {
      const t=(8.5-verts.getY(i))/17, x=verts.getX(i), z=verts.getZ(i);
      const rag=1+0.1*Math.sin(x*1.5+z)*Math.sin(Math.PI*t);
      verts.setXYZ(i,LOOK.X+x*rag+0.8*t,lookoutFloor-0.06-17*t,-LOOK.Y+z*rag-8*t);
    }
    spur.deleteAttribute('uv'); spur.computeVertexNormals(); b.mesh('bedrock',spur.toNonIndexed());
    for (let q = 180; q <= 360; q += 15) { const g = (q * Math.PI) / 180, x = LOOK.X + (LOOK.r + 1.3) * Math.cos(g), y = LOOK.Y + (LOOK.r + 1.3) * Math.sin(g); b.block(x - 1.2, x + 1.2, y - 1.2, y + 1.2, lookoutFloor - 3, lookoutFloor + 60); }
    const caveFloor = CY + eastWalk.at(-1)[3];
    const MC = (WK.Y0 + WK.Y1) / 2, MW = (WK.Y1 - WK.Y0) / 2 - 0.15, arch = Array.from({ length: 13 }, (_, i) => { const q = (i / 12) * Math.PI; return [MC - MW * Math.cos(q), caveFloor + 5 + 3.6 * Math.sin(q)]; });
    carvedRock(b, { court: COURT, facadeY: BY0, wallTop: M, shaft: OCULUS, shaftTop: TOPH + 1,
      left: WK.XW - 0.02, right: WK.XE + 0.02, caveDoor: [[MC - MW, caveFloor - 0.05], ...arch, [MC + MW, caveFloor - 0.05]] });

    // ---- the old cave: through the mouth, a short passage in the rock and a round chamber. Bare for now ("you can just
    // build the cave now and we can expand it later"): a floor, rough walls, somewhere for a fire.
    const CV = { X: 125.5, Y: 19.5, rx: 10, ry: 9, H: 12.5 };
    const sides = 30, rings = 8, entryStart = 16, entryEnd = 20, entryHeight = 5;
    const chamberPoint = (i, k) => {
      const a = i / sides * Math.PI * 2, f = k / rings * Math.PI / 2;
      const w = 1 + 0.07 * Math.sin(a * 5 + f * 3) + 0.05 * Math.sin(a * 9 - f * 4 + 1) + 0.04 * Math.sin(a * 3 + 2);
      const radius = w * Math.pow(Math.cos(f), 0.55);
      return [CV.X + CV.rx * radius * Math.cos(a), caveFloor - 0.05 + CV.H * (0.96 + 0.06 * Math.sin(a * 4)) * Math.sin(f),
        -(CV.Y + CV.ry * radius * Math.sin(a)), a * 9, f * 9];
    };
    // Remove a patch from the dome. The last ring of the passage uses the exact
    // positions and UVs around that patch, including the two points at floor level.
    const rim = [];
    for (let k = 0; k < entryHeight; k++) rim.push(chamberPoint(entryEnd, k));
    for (let i = entryEnd; i >= entryStart; i--) rim.push(chamberPoint(i, entryHeight));
    for (let k = entryHeight - 1; k >= 0; k--) rim.push(chamberPoint(entryStart, k));
    const section = [[MC - MW, caveFloor - 0.05], ...arch, [MC + MW, caveFloor - 0.05]];
    const passagePoint = (i, k) => {
      const t = i / 9, q = Math.PI * k / (section.length - 1);
      const [Y, h] = section[k], mouthX = WK.XE + 0.02, [rx, rh, rz, ru, rv] = rim[k];
      const x = mouthX + (rx - mouthX) * t;
      const flare = t * t, wob = 0.35 * Math.sin(Math.PI * t) * Math.sin(q) * Math.sin(x * 1.3 + q * 5);
      return [x, h + (rh - h) * flare + wob, -Y + (rz + Y) * flare,
        ru + x - rx, rv + (1 - t) * q * 4];
    };
    const pos = [], uv = [];
    const quad = (point, i, k) => {
      const a = point(i, k), b = point(i + 1, k), c = point(i + 1, k + 1), d = point(i, k + 1);
      for (const v of [a, d, c, a, c, b]) { pos.push(v[0], v[1], v[2]); uv.push(v[3], v[4]); }
    };
    for (let i = 0; i < 9; i++) for (let k = 0; k < section.length - 1; k++) quad(passagePoint, i, k);
    for (let i = 0; i < sides; i++) for (let k = 0; k < rings; k++) {
      if (i < entryStart || i >= entryEnd || k >= entryHeight) quad(chamberPoint, i, k);
    }
    const cave = new THREE.BufferGeometry();
    cave.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    cave.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    b.mesh('cliffrock', smoothNormals(cave));
    { // black behind every joint (a box, inside out), and the floor
      const X0 = WK.XE + 0.3, X1 = CV.X + CV.rx + 2.5, Y0 = WK.Y0 - 1.2, Y1 = CV.Y + CV.ry + 2.5;
      // A dark backing around the chamber. Leave its entrance face open so the walk
      // remains visible when looking back down the passage.
      const height = CV.H + 4, backing = new THREE.BoxGeometry(X1 - X0, height, Y1 - Y0);
      const faces = [], indices = backing.index.array;
      for (let i = 0; i < indices.length; i += 3) {
        if (backing.attributes.normal.getX(indices[i]) > -0.5) faces.push(indices[i], indices[i + 2], indices[i + 1]);
      }
      backing.setIndex(faces);
      backing.computeVertexNormals();
      backing.translate((X0 + X1) / 2, caveFloor - 0.5 + height / 2, -(Y0 + Y1) / 2);
      b.mesh('soot', backing);
      flat('cliffrock', rect(WK.XE, X1, Y0, Y1), caveFloor); b.surface(WK.XE, X1, Y0, Y1, caveFloor);
      // Follow the same outline with overlapping collision boxes.
      const blockEdge = (from, to) => {
        const steps = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[2] - from[2]) / 0.7));
        for (let i = 0; i <= steps; i++) {
          const t = i / steps, x = from[0] + t * (to[0] - from[0]), y = -from[2] - t * (to[2] - from[2]);
          b.block(x - 0.35, x + 0.35, y - 0.35, y + 0.35, caveFloor - 3, caveFloor + 30);
        }
      };
      for (let i = 0; i < 9; i++) for (const k of [0, section.length - 1]) blockEdge(passagePoint(i, k), passagePoint(i + 1, k));
      for (let i = 0; i < sides; i++) if (i < entryStart || i >= entryEnd) blockEdge(chamberPoint(i, 0), chamberPoint(i + 1, 0));
      b.room('The Old Cave', WK.XE + 0.4, CV.X + CV.rx + 0.6, WK.Y0 + 0.2, CV.Y + CV.ry + 0.6, caveFloor, caveFloor + CV.H + 1, { over: 0.2 });
      b.portal(WK.XE - 0.2, WK.XE + 0.5, WK.Y0 + 0.2, WK.Y1 - 0.2, caveFloor, caveFloor + 8.6, 'X', 'door');
      b.fill(CV.X, CV.Y, caveFloor + 8, 0.9); b.lamp(CV.X + 1, CV.Y, caveFloor + 2.2, { power: 1.1, kind: 'candle' }); } }

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
    b.arcWall({ ...s, out: low, dado: low === POOLWALL ? ['tile_subway#a9c6b6', 'tile_subway#3f6e69'] : null, h0: -1, h1: F2, fl: F1, opens: Array.from({ length: n }, (_, i) => ({ ...G1(i), margin: n === 1 ? 1.5 : i === 0 || i === n - 1 ? 1.0 : 0.5 })) });      // (a broad pier of wall at each end of a stretch, where a room's cross wall meets the circle: no wall ever lands on glass)
    b.arcWall({ ...s, out: up ?? STONE, skirting: !!up, h0: F2, h1: C2 + 1, fl: F2, opens: wins.map((i, j) => ({ i, sill: SILL2[(k * 2 + j) % 6], head: Math.min(7.4, SILL2[(k * 2 + j) % 6] + 4.0 + ((k + j) % 3) * 0.4), margin: 0.9 + ((k + j) % 2) * 0.5 })) });
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

  // ---- the box of rooms: outer walls against the rock, the wings' south walls in the cliff's face ------------------
  const S1 = { h0: -1, h1: F2, fl: F1 }, S2 = { skirting: true, h0: F2, h1: C2 + 1, fl: F2 }, O = { t: TO, wood: OAK }, EW = BX1 - TO / 2;
  const TUNNEL = { Y0: YC - 3, Y1: YC + 3 }, HY = HYC, PT = TP / 2;                       // HY: the wall between each wing's south room and its north one
  const DOOR = { kind: 'door', lined: true, w: 3, head: 7, hinge: 'a', swing: 'pos', style: 'ledged', case: 'plain', threshold: OAK }, CASED = { kind: 'cased', lined: true, w: 4.6, head: 7.4, case: 'plain', threshold: STONEFLOOR };
  const xArc = Y => Math.sqrt(Math.max(0, (R + T / 2) ** 2 - (Y - YC) ** 2));      // how far from the axis the circle's room face is, at Y
  const wX0 = BX0 + TO, wX1 = XC - R - 0.2, eX0 = XC + R + 0.2, eX1 = EW - TO / 2, iY0 = BY0 + TO, iY1 = BY1 - TO;
  const PW = XC - 17, PE = XC + 17, yAt = X => YC + Math.sqrt(R * R - (X - XC) ** 2);      // PW, PE: the middle's side walls; yAt: where one meets the circle
  // west wall: the stair's doorway, and the cave's door
  b.wall({ ...O, ...S1, ax: 'Y', c: BX0 + TO / 2, a: BY0, b: BY1, neg: WALL, pos: WALL, opens: [{ kind: 'cased', lined: true, at: TUNNEL.Y0 + 0.3, w: 5.4, head: 7.4, threshold: STONEFLOOR, case: 'plain' }, { ...DOOR, at: 55.5, swing: 'neg', inside: true }] });
  b.wall({ ...O, ...S2, ax: 'Y', c: BX0 + TO / 2, a: BY0, b: BY1, neg: ROCKM, pos: WALL, outside: 'neg' });
  // north wall: the chapel's doors in the middle of the pool's wall
  b.wall({ ...O, ...S1, ax: 'X', c: BY1 - TO / 2, a: BX0 + TO, b: XC - 17 - TO / 2, neg: WALL, pos: 'rubble', outside: 'pos' });
  b.wall({ ...O, ...S1, ax: 'X', c: BY1 - TO / 2, a: XC + 17 + TO / 2, b: BX1 - TO, neg: WALL, pos: 'rubble', outside: 'pos' });
  // the pool's hall beyond the box: two side walls and an end wall, taller than the storey, with the chapel's doors in the end
  { const s = { ...O, h0: -1, h1: PH + 0.6, fl: F1 };
    b.wall({ ...s, h0: F1 - 1, ax: 'Y', c: XC - 17, a: BY1 - TO, b: PN - TO, neg: 'coursed', pos: POOLWALL }); b.wall({ ...s, h0: F1 - 1, ax: 'Y', c: XC + 17, a: BY1 - TO, b: PN - TO, neg: POOLWALL, pos: 'hinoki' });      // (their outer faces show for half a foot in the corners of the listening room and the banya's passage: so in those rooms' walls)
    b.wall({ ...s, ax: 'X', c: PN - TO / 2, a: XC - 17 - TO / 2, b: XC + 17 + TO / 2, neg: WALL, pos: 'rubble', outside: 'pos', opens: [{ ...DOOR, at: XC - 2.25, w: 4.5, leaves: 2, head: 7.8, inside: true, initialOpen: false, liningPos: 0.52, threshold: STONEFLOOR }] });
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
  for (const [start, end, bottom] of [[BX0, XC - XS, C2 + 1], [XC + XS, BX1, F2]]) {
    const sky = [];
    for (let i = 0; i <= 20; i++) {
      const x = start + (end - start) * i / 20;
      // The masonry returns only into the brow rock at the edge of the vault.
      const wing = Math.max(0, Math.abs(x - XC) - XS);
      const spring = M - 1.7 + 1.25 * Math.sin(x * 0.42) + 0.6 * Math.cos(x * 0.8);
      sky.push([x, Math.max(bottom + 0.05, Math.min(M + 0.9, spring + 0.28 + wing))]);
    }
    b.prism(STONE, [[start, bottom], [end, bottom], ...sky.reverse()], -BY0 - TO, -BY0);
  }

  // ---- partitions ---------------------------------------------------------------------------------------------------
  const P1 = { t: TP, h0: F1, h1: C1, neg: WALL, pos: WALL, wood: OAK }, P2 = { skirting: true, t: TP, h0: F2, h1: C2, neg: WALL, pos: WALL, wood: OAK };
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
  // A board closes the exposed slab edge at the landing and along the bridge.
  for (const [a, end] of [[CRY + PT, BR.Y0], [BR.Y1, WELL.Y0]]) b.box(OAK, GX - 0.04, GX + 0.08, a, end, F2 - 0.92, F2);
  for (const y of [BR.Y0, BR.Y1]) b.box(OAK, GX, PW - PT, y - 0.06, y + 0.06, F2 - 0.92, F2);
  b.box(OAK, WELL.X0, GX, WELL.Y0 - 0.05, WELL.Y0 + 0.05, F2 - 0.92, F2);
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
  { const { X0, X1, Y0, Y1, deep } = POOL, hb = F1 - deep, TILE = BASIN_TILE;
    b.box(TILE, X0 - 0.5, X1 + 0.5, Y0 - 0.5, Y1 + 0.5, hb - 0.6, hb); b.surface(X0, X1, Y0, Y1, hb);
    b.box(TILE, X0 - 0.5, X0, Y0, Y1, hb, F1 - 0.03); b.box(TILE, X1, X1 + 0.5, Y0, Y1, hb, F1 - 0.03); b.box(TILE, X0 - 0.5, X1 + 0.5, Y0 - 0.5, Y0, hb, F1 - 0.03); b.box(TILE, X0 - 0.5, X1 + 0.5, Y1, Y1 + 0.5, hb, F1 - 0.03);
    b.stair({ ax: 'X', from: X0, to: X0 + 6, lo: Y0, hi: Y1, h0: F1, h1: hb, steps: 6, mat: TILE, closed: TILE, top: true });
    // nobody walks out through the basin's sides (they were not solid, and under the floor is eight feet of nothing): solid from
    // the basin's floor to just under the room's, so they stop someone in the water and nobody on the walkways
    for (const [a0, a1, c0, c1] of [[X0 - 0.6, X0 - 0.05, Y0 - 0.6, Y1 + 0.6], [X1 + 0.05, X1 + 0.6, Y0 - 0.6, Y1 + 0.6], [X0 - 0.6, X1 + 0.6, Y0 - 0.6, Y0 - 0.05], [X0 - 0.6, X1 + 0.6, Y1 + 0.05, Y1 + 0.6]]) b.block(a0, a1, c0, c1, hb - 1, F1 - 0.05);
    b.surface(X0 - 0.6, X1 + 0.6, Y0 - 0.6, Y1 + 0.6, hb - 0.02);
    flat('water', rect(X0 - 0.06, X1 + 0.06, Y0 - 0.06, Y1 + 0.06), F1 - 0.45);      // (a little into the basin's walls: ending exactly on their faces, the water's edge flickered against the tile)
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
  b.box(TM, xA1, xB0, TW0, TW1, L1 - 1, L1); b.surface(xA1, xB0, TW0, TW1, L1); b.floor(xB1, xC0, TW0, TW1, L2, { mat: TM, thick: 1, under: null }); b.floor(xC1, BX0 + 0.1, TW0, TW1, F1, { mat: TM, thick: 1, under: null });
  b.floor(HATCH.X0, xA0, TW0, TW1, M, { mat: TM, thick: 1, under: null }); b.surface(HATCH.X0 - 1.2, xA0, TW0 - 0.4, TW1 + 0.4, M);      // (and no gap between the grass and the stair's head: there was one, four inches wide, and it was eight feet deep)
  // its two sides, the whole height (what is above the ceiling is never seen), and its ends
  b.wall({ ax: 'X', c: TW0 - 0.5, a: HATCH.X0 - 1, b: BX0, t: 1, h0: -1, h1: M - 0.02, neg: ROCKM, pos: WALL, base: false });
  b.wall({ ax: 'X', c: TW1 + 0.5, a: HATCH.X0 - 1, b: BX0, t: 1, h0: -1, h1: M - 0.02, fl: L1, neg: WALL, pos: WALL, base: false, wood: OAK, opens: [{ kind: 'door', lined: true, at: LAU.X0 + 5.2, w: 3, head: 7, hinge: 'b', swing: 'pos', style: 'half', case: 'plain', inside: true, threshold: OAK }] });      // (the laundry's door, off the first landing)
  b.wall({ ax: 'Y', c: HATCH.X0 - 0.5, a: TW0, b: TW1, t: 1, h0: L1, h1: M - 0.02, neg: ROCKM, pos: WALL, base: false });
  // The metal hatch and the boarded soffit meet at the same cross section.
  // THE SAME BULKHEAD AS AT THE HOUSE (my_house garden/cellar.js), seen from underneath: there the leaves are 5.9 ft
  // long and 4.6 wide, low (0.75 ft over the lawn) at the end you step in by and rising to 3 ft at the house's wall,
  // which you go down toward. So here: low over the head of the stair, rising eastward the way the stair descends,
  // to the wall's line 5.45 ft on; beyond that the boarded soffit of the tunnel under the house. (It was 17 ft long,
  // the full width of the tunnel, and sloped the other way: down with the stair.) `hi` is its height at X0, `lo` at X1.
  { const X0 = xA0 - 0.2, X1 = xA0 + 5.25, hi = M + 0.75, lo = M + 3.0, HWD = 2.3;
    const left = TW0 - 0.36, right = TW1 + 0.36;
    const profile = [[X1, lo], [X1 + 7.7, L1 + HEAD], [xB0, L1 + HEAD],
      [xB1, L2 + HEAD], [xC0, L2 + HEAD], [BX0 + TO - 0.3, F1 + HEAD]];      // (stopped inside the hall's wall: ended on its face, the boards' end flickered against the stone over the hall's doorway)
    for (let i = 1; i < profile.length; i++) {
      const [xa, ha] = profile[i - 1], [xb, hb] = profile[i];
      b.prism('boards', [[xa, ha], [xb, hb], [xb, hb + 0.32], [xa, ha + 0.32]], -right, -left);
    }

    const sheet = 'oak_light#5c4033', frame = 'oak_light#3f2c22', hardware = 'c#2b2a28/0.5/1';      // (boarded dark timber and wrought iron, as the doors now are at the house: they were steel on both sides)
    const height = X => hi + (lo - hi) * (X - X0) / (X1 - X0);
    function plate(mat, xa, xb, ya, yb, bottom, top) {
      b.prism(mat, [[xa, height(xa) + bottom], [xb, height(xb) + bottom],
        [xb, height(xb) + top], [xa, height(xa) + top]], -yb, -ya);
    }
    function rod(Xa, Ya, da, Xb, Yb, db, radius) {
      const a = new THREE.Vector3(Xa, height(Xa) + da, -Ya), end = new THREE.Vector3(Xb, height(Xb) + db, -Yb);
      const delta = end.clone().sub(a);
      const g = new THREE.CylinderGeometry(radius, radius, delta.length(), 10);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()));
      b.mesh(hardware, g.translate(...a.lerp(end, 0.5).toArray()));
    }
    // An unbroken flashing behind the leaves seals the central joint and their four edges.
    plate(frame, X0 - 0.6, X1 + 0.05, TW0 - 1, TW1 + 1, 0.10, 0.5);
    for (const side of [-1, 1]) {
      const outer = YC + side * HWD, center = YC + side * 0.026;
      const edge = outer - side * 0.10, bounds = [edge, center].sort((a, b) => a - b);
      plate(sheet, X0 + 0.12, X1 - 0.12, ...bounds, 0, 0.10);
      for (const fraction of [0.20, 0.51, 0.82]) {
        const X = X0 + (X1 - X0) * fraction, hinge = outer - side * 0.16;
        const tip = YC + side * 0.48;
        plate(frame, X - 0.12, X + 0.12, Math.min(hinge, tip), Math.max(hinge, tip), -0.058, 0);
        rod(X - 0.28, hinge, -0.055, X + 0.28, hinge, -0.055, 0.063);
        for (const Y of [outer - side * 0.65, tip + side * 0.13])
          b.cyl(hardware, X, Y, height(X) - 0.087, height(X) - 0.054, 0.043, 0.045, 6);
      }
      const x = X0 + 2.3, y = YC + side * 0.48;
      for (const end of [x, x + 0.68]) {
        plate(frame, end - 0.1, end + 0.1, y - 0.12, y + 0.12, -0.055, 0);
        rod(end, y, -0.055, end, y, -0.29, 0.043);
      }
      rod(x - 0.03, y, -0.29, x + 0.71, y, -0.29, 0.051);
    }
    // Return the oak lining directly to the masonry and close the end above the existing wall.
    const masonryTop = M - 0.02;
    const [nextX, nextHeight] = profile[1], soffitAtM = X1 + (nextX - X1) * (lo - masonryTop) / (lo - nextHeight);      // where the soffit comes down to the top of the stair's walls
    const cheekUp = [[X0, masonryTop], [soffitAtM, masonryTop], [X1, lo + 0.3], [X0, hi + 0.3]];
    b.prism('coursed', cheekUp, -TW0, -(TW0 - 1));
    b.prism('coursed', cheekUp, -(TW1 + 1), -TW1);
    for (const Y of [TW0, TW1, YC - HWD, YC + HWD]) plate(frame, X0, X1, Y - 0.075, Y + 0.075, -0.082, 0.145);
    for (const X of [X0, X1 - 0.15]) plate(frame, X, X + 0.15, TW0, TW1, -0.09, 0.125);
    const endX = X0 + 0.02;
    b.box('coursed', X0 - 0.6, endX, TW0 - 1, TW1 + 1, masonryTop, height(endX) + 0.3);      // (a box, not a prism: its courses lie level)
    for (const Y of [TW0, TW1]) {
      b.box(frame, endX, endX + 0.095, Y - 0.07, Y + 0.07, masonryTop, height(endX + 0.095));
    }
    b.block(HATCH.X0 - 2, xA0 + 3.6, TW0, TW1, M - 6, M + 8);                         // the top few steps are under the low end of the leaves: nobody goes up into them
    b.later(ctx => {
      const p = b.world(xA0 + 3.0, YC, M + 1.6);
      let leaving = false;
      // The doors themselves are part of the stair's stone and steel and do not move. What moves, in the two moments
      // of passing through them only, is the daylight: a bright sheet just under the leaves, the width of the open
      // doorway, which narrows from both sides to a line at the meeting edge and goes out as they shut over you
      // (arriving from the house), and opens from that line as they are pushed up (leaving). Arriving, you stand
      // turned back to watch them close, and are then turned to the stair; touching anything gives you the view back.
      const sheet = (() => {
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); g.setIndex([0, 1, 2, 0, 2, 3, 0, 2, 1, 0, 3, 2]);
        const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xfff3dc, toneMapped: false, transparent: true, opacity: 0, depthWrite: false })); m.frustumCulled = false; m.visible = false; m.renderOrder = 6; ctx.scene.add(m);
        const lamp = new THREE.PointLight(0xfff0d6, 0, 26, 1.6); { const q = b.world((X0 + X1) / 2, YC, (hi + lo) / 2 - 1.2); lamp.position.set(q.x, q.y, q.z); } ctx.scene.add(lamp);
        const set = k => {      // k: 1 wide open, 0 shut
          m.visible = k > 0.002; lamp.intensity = 60 * k; if (!m.visible) return;
          const w = HWD * Math.max(0.012, k), P = g.attributes.position, c = [[X0 + 0.15, YC - w, hi - 0.14], [X1 - 0.15, YC - w, lo - 0.14], [X1 - 0.15, YC + w, lo - 0.14], [X0 + 0.15, YC + w, hi - 0.14]];
          c.forEach(([X, Y, h], i) => { const q = b.world(X, Y, h); P.setXYZ(i, q.x, q.y, q.z); }); P.needsUpdate = true; m.material.opacity = Math.min(1, 0.25 + k * 1.2);
        };
        return { set };
      })();
      const ease = x => x * x * (3 - 2 * x), wait = ms => new Promise(r => setTimeout(r, ms));
      const run = (secs, f) => new Promise(done => { const t0 = performance.now(); const step = () => { const k = Math.min(1, (performance.now() - t0) / (secs * 1000)); f(k); if (k < 1) requestAnimationFrame(step); else done(); }; step(); });
      if (new URLSearchParams(location.search).get('from') === 'house' && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        sheet.set(1);
        const start = () => { let w = null; try { w = ctx.walker; } catch { /* not made yet */ } if (!w || !document.body.classList.contains('walking') || window.__ready !== true || document.getElementById('loading')) return void requestAnimationFrame(start);      // (not until the threshold has lifted and she can see it)
          { const q = b.world(xA0 + 10, YC, M - 10 * (M - L1) / 15); w.place(q.x, q.y, q.z, w.yaw, -0.2); }      // (ten feet down the first flight: far enough to see the doors whole)
          const yaw1 = w.yaw, pitch1 = w.pitch, yaw0 = yaw1 + Math.PI, pitch0 = 0.42; let mine = true;
          const stop = () => { mine = false; }; for (const ev of ['keydown', 'mousedown', 'mousemove', 'touchstart']) addEventListener(ev, stop, { once: true });
          w.yaw = yaw0; w.pitch = pitch0;
          (async () => {
            await wait(900);
            await run(1.9, k => sheet.set(1 - ease(k)));                              // the leaves come down: the light narrows to a line, and is gone
            ctx.sound?.note?.(38, 0, 0.5, 0.07); ctx.sound?.note?.(45, 0.05, 0.3, 0.04);     // and they meet
            await wait(350);
            await run(1.5, k => { if (mine) { w.yaw = yaw0 + (yaw1 - yaw0) * ease(k); w.pitch = pitch0 + (pitch1 - pitch0) * ease(k); } });      // and round to the stair
          })();
        };
        start();
      }
      ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 9, label: () => 'go up to the house', act: async () => {
        if (leaving) return;
        leaving = true;
        if (!matchMedia('(prefers-reduced-motion: reduce)').matches) { ctx.sound?.note?.(45, 0, 0.3, 0.05); await run(1.1, k => sheet.set(ease(k))); }      // the leaves are pushed up: daylight opens from the meeting edge
        const veil = document.createElement('div');
        veil.style.cssText = 'position:fixed;inset:0;z-index:1000;background:white;pointer-events:auto;';
        document.body.appendChild(veil);
        addEventListener('pageshow', () => { veil.remove(); leaving = false; }, { once: true });
        const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900;
        await veil.animate([{ opacity: 0 }, { opacity: 1 }], { duration, fill: 'forwards' }).finished;
        location.assign(houseAddress() + '?from=spanya');
      } });
    });
  }

  // ---- a door on the second landing, to something not made yet (Anna, 22 November 2026: "the door is under
  // construction. Idk what we'll put there ... right now I just want to know that there'll be something there.").
  // A plain boarded oak door in a cased frame in the landing's north wall, shut; it does not open. Nothing is behind
  // it but rock: when the room is made, cut a real opening here (as the laundry's, above) and take this away.
  { const XD = (xB1 + xC0) / 2, W2 = 1.5, HD = 6.8, Y = TW1, f = L2, IRON = 'c#2b2a28/0.5/1';
    for (let i = 0; i < 5; i++) b.box(i % 2 ? 'oak_light#a9824f' : OAK, XD - W2 + i * 0.6 + 0.012, XD - W2 + (i + 1) * 0.6 - 0.012, Y - 0.1, Y + 0.02, f + 0.04, f + HD);      // five boards
    b.box('oak_light#7d5f3a', XD - W2, XD + W2, Y - 0.06, Y + 0.02, f + 0.04, f + HD);                                    // the dark between them
    for (const sx of [-1, 1]) b.box(OAK, XD + sx * (W2 + 0.2) - 0.2, XD + sx * (W2 + 0.2) + 0.2, Y - 0.16, Y + 0.02, f, f + HD + 0.4);      // the casing
    b.box(OAK, XD - W2 - 0.4, XD + W2 + 0.4, Y - 0.18, Y + 0.02, f + HD, f + HD + 0.42);
    b.box(STONEFLOOR, XD - W2, XD + W2, Y - 0.14, Y + 0.02, f, f + 0.05);                                                // a stone sill
    for (const h of [1.3, 5.4]) b.box(IRON, XD - W2 + 0.05, XD + W2 - 0.25, Y - 0.125, Y - 0.1, f + h, f + h + 0.16);       // two iron straps
    b.box(IRON, XD + W2 - 0.42, XD + W2 - 0.3, Y - 0.2, Y - 0.1, f + 3.1, f + 3.5); b.box(IRON, XD + W2 - 0.4, XD + W2 - 0.32, Y - 0.3, Y - 0.2, f + 3.22, f + 3.3);      // a latch
    b.later(ctx => { const p = b.world(XD, Y - 0.3, f + 3.4); ctx.interact.push({ x: p.x, y: p.y, z: p.z, reach: 6, size: 1.6, label: () => 'try the door', act: () => ctx.flash('It does not open yet. Something is being made behind it.') }); });
  }

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
    b.interior(X0 + 5.2 - 1.9, X0 + 5.2 + 1.9, TW1, Y0 + 0.1, f - 0.6, f + 7.6, { floor: f, ceil: c });      // (the thickness of its doorway: the stair's light stops at 31.35 and the laundry's begins at 31.7, and the strip of lining between them was lit as out of doors)
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
  for (const [X, h] of [[(xA1 + xB0) / 2, L1], [(xB1 + xC0) / 2, L2], [xC1 - 4, F1 + 3]]) { b.lamp(X, YC, h + 7, { power: 1.8 });      /* (a steady lamp: as a candle it swung the whole wall by a fifth, which read as a fault by the laundry door) */ b.fill(X, YC, h + 6.5, 1.2); }      // (lit at every hour: it is a tunnel)
  // Low wall lanterns rake across the iron door leaves above the first flight.
  for (const [X, wallY, face, h] of [[HATCH.X0 + 6.75, TW0, 0, M + 1.12], [HATCH.X0 + 12.35, TW1, 2, M - 1.18]]) {
    const frame = b.fr(X, wallY, 0, face);
    b.kit.sconce(frame, 0, h, { kind: 'lantern', metal: 'c#52432e/0.5/0.8', glass: 'e#eab880/0.52', size: 0.94 });
    const [a, c] = frame.map(0, 0.92);
    b.lamp(a, c, h - 0.27, { kind: 'candle', power: 0.71, halo: 0.45 });
  }
}
