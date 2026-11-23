// stair_hall: The Stair and The Hall, in the house's settled style (notes/STYLE.md, "READ THIS FIRST"): stone rooms
// lit by flame, after the Pool and the Chapel; plain solid things of honey oak, linen and wool; few things, each good.
//
// THE STAIR. Three flights and two landings down from the closed cellar doors, between walls of pale coursed stone
// under a honey board ceiling: the way down into a bath-house. Its floor is clear wall to wall. A runner of madder
// red wool with a cream border laid down it like cloth, held by bronze rods; a round oak handrail on iron brackets on the south wall; small arched niches in
// the stone down both walls, each with a hand lantern and a lit candle in it. On the walls: the place's own plan and
// section (drawn in code from spanya.js's figures, plainly framed), and five pictures of colour down the way (Klimt's birches, two Kandinskys, Franz Marc's mill, Van Gogh's almond blossom); on
// the first landing one larger stone niche with three things in it.
//
// THE HALL. A stone room with a fire. North of the axis (the stair's doorway to the courtyard's glazed doors), the
// desk: a plain block of pale stone with a thick oak top, facing the guest; behind it, in the north wall, an arched
// stone niche where the room keys hang on oak pegs, a candle in a lantern on its sill. South of the axis, the fire in
// a plain stone breast on a low slate hearth, Klimt's sunflower garden over it, a thick oak bench with sheepskins facing it
// and two quiet chairs of oak and linen either side; a standing bronze lantern. Under the cloud window a slab of oak
// with linen cushions; robes on oak pegs in a stone niche, an oak bench under them with slippers; ferns among rocks
// in the north-east corner by the glass. Candles on the desk, the hearth and the window.
//
// STAFF POSTS (for whoever does the staff; nothing here places a robot):
//   The Hall   X 18.6, Y 38.1, h 0.4, facing south (toward the axis)   the CONCIERGE: stands behind the desk (X 15.6..21.6,
//              Y 34.0..36.65, top h 3.95) facing the guest; the aisle behind it, Y 36.65 to the key niche's sill at
//              Y 39.5 (2.85 ft), is open at both ends (X 13.5..15.6 and 21.6..27).
//              Posts: the key niche in the north wall (from X 18.6, Y 38.4, facing north); the desk (from X 18.6, Y 37.8,
//              facing south); the robes (from X 16.6, Y 21.4, facing south: robes on pegs, slippers); the fire (from
//              X 28.2, Y 21.5, facing south-east, beside the hearth; the way in is between the west chair and the bench).
//              Serves from: the desk top (pickup X 20.7, Y 34.8, h 3.95), the robes.
//   The Stair  none: nothing may stand in it.

import { burningLogs, storedLogs } from '../kit/firewood.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFlames, NOISE } from '../flame.js';
import { bev, lathe, sweep, softBox, merge, pillow } from '../kit/geom.js';
import { drawPlan, drawSection } from './stair_hall_drawings.js';
import { MAT, pillar, handLantern, floorLantern, archNiche, leaves, fern, easyChair, jar, fiddleFig } from './stair_hall_parts.js';
import { flames, wash } from './stair_hall_fx.js';

const FRAMEWOOD = MAT.OAKD, SLATE = 'slate_floor', SOOT = 'c#1e1813/0.95', IRON = MAT.IRON;

export default function (f) {
  const K = f.kit, D = f.draw, G = f.fr(0, 0, 0, 0);      // G: x = plan X, y = plan Y, z = h
  const put = (mat, g, t) => K.put(G, mat, g, t);
  const rnd = seed => { let k = seed * 9301 + 49297; return () => ((k = (k * 16807) % 2147483647) / 2147483647); };
  const fl = { stair: [], hall: [] }, washes = [];
  // a box of five faces (no bottom), ten triangles, textured in feet
  const box5 = (x0, x1, y0, y1, z0, z1) => {
    const q = [], n = [], uv = [], F = (a, b, c, d, nn, u) => { for (const p of [a, b, c, a, c, d]) { q.push(...p); n.push(...nn); uv.push(...u(p)); } };
    F([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], p => [p[0], p[1]]);
    F([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], p => [p[0], p[2]]); F([x1, y1, z0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [0, 1, 0], p => [p[0], p[2]]);
    F([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], p => [p[1], p[2]]); F([x0, y1, z0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [-1, 0, 0], p => [p[1], p[2]]);
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
  };
  // a drawing on paper in a plain oak frame, on a wall frame (centre x, z; the paper w by tall)
  const drawing = (fr, x, z, w, tall, draw, label) => {
    const b = 0.12, d = 0.1;
    fr.box(FRAMEWOOD, x - w / 2 - b, x + w / 2 + b, 0.005, d, z + tall / 2, z + tall / 2 + b);
    fr.box(FRAMEWOOD, x - w / 2 - b, x + w / 2 + b, 0.005, d, z - tall / 2 - b, z - tall / 2);
    fr.box(FRAMEWOOD, x - w / 2 - b, x - w / 2, 0.005, d, z - tall / 2, z + tall / 2);
    fr.box(FRAMEWOOD, x + w / 2, x + w / 2 + b, 0.005, d, z - tall / 2, z + tall / 2);
    f.sign(fr, x, z, w, tall, draw, { y: 0.04, res: 300 });
    if (label) f.label(fr, x, 0.15, z, { reach: 7, ...label });
  };
  const print = (fr, x, z, w, tall, slug, cap) => f.framed(fr, x, z, w, tall, slug, { frame: FRAMEWOOD, border: 0.12, mat: 0.3, ...cap });
  // a small arched niche in a wall frame with a hand lantern on its sill (z: the middle of the opening above the frame)
  const lampNiche = (fr, z, list) => {
    const sill = archNiche(K, fr, 0, z, 0.8, 1.25, { face: 0.35, margin: 0.22, cap: 0.28 });
    K.put(fr, MAT.BRONZE, lathe([[0, 0], [0.16, 0], [0.17, 0.03], [0.15, 0.035], [0, 0.02]], { seg: 12 }), { at: [0, 0.2, sill] });
    pillar(K, fr, 0, 0.2, sill + 0.02, 0.42, 0.1, list, { s: 1.15 });
    const [X, Y] = fr.map(0, 0.06), [X1, Y1] = fr.map(0.3, 0.06), d = [X1 - X, Y1 - Y].map(v => v / 0.3), [Xn, Yn] = fr.map(0, 1.06), nn = [Xn - X, Yn - Y];
    washes.push({ a: [X - d[0] * 0.38, Y - d[1] * 0.38, fr.h + sill + 0.05], b: [X + d[0] * 0.38, Y + d[1] * 0.38, fr.h + sill + 0.05], n: nn, d: [0, 0, 1.15], k: 1.1, at: 'stair' });
  };

  stair();
  hall();
  f.later(ctx => {
    const W = (X, Y, h) => f.world(X, Y, h);
    flames(ctx, W, fl.stair, f.world(-20, 28, 16));
    flames(ctx, W, fl.hall, f.world(24, 28, 5));
    wash(ctx, f, washes.filter(w => w.at === 'stair'), [-20, 28, 16]); wash(ctx, f, washes.filter(w => w.at === 'hall'), [24, 28, 5]);
  });

  // =====================================================================================================================
  //  THE STAIR
  // =====================================================================================================================
  function stair() {
    const L1 = 20, L2 = 10, F1 = 0.4, YN = 31, YS = 25;
    // the three flights as spanya.js builds them (building.js stair(): N = round(fall / 0.62), each tread with a 0.08
    // nosing toward the foot), from the foot up
    const FL = [{ foot: -38.2, head: -53.2, lo: 20, hi: 30 }, { foot: -11.2, head: -26.2, lo: 10, hi: 20 }, { foot: 10.8, head: -3.2, lo: 0.4, hi: 10 }]
      .map(q => { const N = Math.round((q.hi - q.lo) / 0.62); return { ...q, N, rise: (q.hi - q.lo) / N, run: (q.foot - q.head) / N }; });
    const nose = X => { for (const q of FL) if (X >= q.head && X <= q.foot) return q.lo + q.rise * (1 + (q.foot - X) / q.run); return X > -38.2 && X < -26.2 ? L1 : X > -11.2 && X < -3.2 ? L2 : X > 10.8 ? F1 : 30; };
    const N_ = (X, h = 0) => f.fr(X, YN, h, 2), S_ = (X, h = 0) => f.fr(X, YS, h, 0);      // wall frames on the north and south walls

    // ---- the runner: one cloth laid the whole way down, madder red with a cream border, over the treads, round the
    // nosings and down the risers, tucked under each nose, and on across both landings; a bronze rod at every tread's back.
    // (A sheet along the stair's profile, three bands across it, and a hem at each edge, after the house's throws.)
    const RW0 = 26.4, RW1 = 29.6, BD = 0.3, rods = [], prof = [];
    const P = (x, z) => prof.push([x, z]);
    const arc = (cx, cz, r, a0, a1, n = 4) => { for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; P(cx + r * Math.cos(a), cz + r * Math.sin(a)); } };
    P(-55.1, 30.035);
    for (const q of FL) {
      for (let i = q.N - 1; i >= 0; i--) {
        const u = q.foot - i * q.run, top = q.lo + (i + 1) * q.rise, lower = top - q.rise, T0 = top + 0.035;
        P(u - 0.02, T0);
        arc(u + 0.085, T0 - 0.075, 0.075, Math.PI / 2, -Math.PI / 2, 8);                               // round the nosing
        P(u + 0.03, top - 0.18); P(u + 0.035, lower + 0.08);
        arc(u + 0.035 + 0.045, lower + 0.08, 0.045, Math.PI, 1.5 * Math.PI, 3);                     // into the tread below
        const rx = u - q.run + 0.07; rods.push(sweep([[rx, RW0 - 0.12, top + 0.065], [rx, RW1 + 0.12, top + 0.065]], 0.018, { seg: 6 }));
      }
      P(q.foot + 0.2, q.lo + 0.035);
    }
    P(11.95, F1 + 0.035); P(12.1, F1 + 0.07); P(13.4, F1 + 0.07);      // on over the threshold to the hall's floor
    const bands = [[RW0, RW0 + 0.2, 'b'], [RW0 + 0.2, RW0 + 0.28, 'o'], [RW0 + 0.28, RW1 - 0.28, 'm'], [RW1 - 0.28, RW1 - 0.2, 'o'], [RW1 - 0.2, RW1, 'b']], geo = { b: [], m: [], o: [] };
    let L = [0]; for (let k = 1; k < prof.length; k++) L.push(L[k - 1] + Math.hypot(prof[k][0] - prof[k - 1][0], prof[k][1] - prof[k - 1][1]));
    for (const [y0, y1, w] of bands) {
      const pos = [], uv = [];
      for (let k = 0; k < prof.length - 1; k++) {
        const [xa, za] = prof[k], [xb, zb] = prof[k + 1], la = L[k], lb = L[k + 1];
        if (lb - la < 1e-4) continue;
        for (const [p, t] of [[[xa, y0, za], [la, y0]], [[xb, y0, zb], [lb, y0]], [[xb, y1, zb], [lb, y1]], [[xa, y0, za], [la, y0]], [[xb, y1, zb], [lb, y1]], [[xa, y1, za], [la, y1]]]) { pos.push(...p); uv.push(...t); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      geo[w].push(g);
    }
    // the hems: the cloth's thickness shown at each edge, rolled under
    for (const y of [RW0, RW1]) {
      const pos = [], uv = [], s = y === RW0 ? -1 : 1;
      for (let k = 0; k < prof.length - 1; k++) {
        const [xa, za] = prof[k], [xb, zb] = prof[k + 1];
        if (L[k + 1] - L[k] < 1e-4) continue;
        const A = [xa, y, za], B = [xb, y, zb], C = [xb, y + s * 0.02, zb - 0.045], Dd = [xa, y + s * 0.02, za - 0.045];
        for (const [p, t] of [[A, [L[k], 0]], [C, [L[k + 1], 0.05]], [B, [L[k + 1], 0]], [A, [L[k], 0]], [Dd, [L[k], 0.05]], [C, [L[k + 1], 0.05]]]) { pos.push(...p); uv.push(...t); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      geo.b.push(g);
    }
    put('wool#3e5232', merge(geo.m)); put('wool#e6dcc4', merge(geo.b)); put('wool#c4902e', merge(geo.o));      // moss green, a cream edge, a line of ochre
    put(MAT.BRONZE, merge(rods));

    // ---- the handrail: round oak on iron brackets, down each flight, its ends returned to the wall -------------------
    const YR = YS + 0.3, rail = [], brk = [];
    for (const q of FL) {
      const zAt = X => q.lo + q.rise * (1 + (q.foot - X) / q.run) + 2.75;
      const Xa = Math.max(q.head + q.run * 0.6, -49.4), Xb = q.foot - 0.1, za = zAt(Xa), zb = zAt(Xb);
      rail.push(sweep([[Xa - 0.9, YS + 0.01, za], [Xa - 0.75, YR, za], [Xa, YR, za], [Xb, YR, zb], [Xb + 0.75, YR, zb], [Xb + 0.9, YS + 0.01, zb]], 0.075, { seg: 10, caps: true }));
      for (let X = Xa + 0.8; X < Xb; X += 4.2) { const z = zAt(X); brk.push(sweep([[X, YS + 0.02, z - 0.4], [X, YS + 0.22, z - 0.36], [X, YR, z - 0.09]], 0.022, { seg: 5 })); brk.push(lathe([[0, 0], [0.09, 0], [0.09, 0.03], [0, 0.04]], { seg: 10 }).rotateX(-Math.PI / 2).translate(X, YS - 0.01, z - 0.4)); }
    }
    put(MAT.OAK, merge(rail)); put(IRON, merge(brk));

    // ---- small arched niches down both walls, a lantern with a candle in each ------------------------------------------
    for (const X of [-36.6, -25.3, -23.0, -15.1, -10.0, -4.3, 3.0, 9.6]) lampNiche(N_(X), nose(X) + 5.4, fl.stair);
    for (const X of [-38.7, -28.6, -21.3, -14.2, -10.4, -3.9, 3.4, 9.9]) lampNiche(S_(X), nose(X) + 5.4, fl.stair);

    // ---- the first landing (h 20, X -38.2..-26.2): the plan; across from it, a stone niche with three things -----------
    drawing(N_(-28.5, L1), 0, 5.0, 3.6, 1.8, drawPlan,      // (east of the laundry's door, X -34.3..-31.3)
      { label: 'look at the plan', title: 'Anna’s Basement: plan of the ground storey', kicker: 'Measured and drawn by the staff',
      text: 'The way in runs east under the meadow from the cellar doors, in three flights and two landings, to the hall; from the foot of the stair you look through the hall and its glazed doors across the courtyard, which is open to the sky and, on its south side, to the clouds. The red dot is this landing.',
      foot: 'Drawn from the building\'s own figures.' });
    {
      const c = S_(-32.2, L1), sill = archNiche(K, c, 0, 4.9, 2.4, 2.2, { face: 0.5, margin: 0.35, cap: 0.4 });
      f.model('si_ammonite_exiteloceras', c, -0.75, 0.25, sill, 0, { scale: 0.85 });
      K.put(c, 'c#efe9da/0.4', lathe([[0, 0], [0.12, 0.03], [0.17, 0.15], [0.16, 0.3], [0.1, 0.42], [0, 0.46]], { seg: 14 }).translate(0, 0.25, sill + 0.05)); K.put(c, MAT.BRONZE, lathe([[0.1, 0], [0.13, 0], [0.13, 0.05], [0.1, 0.05]], { seg: 14 }).translate(0, 0.25, sill));
      f.model('carved_wooden_elephant', c, 0.75, 0.25, sill, 0, { turn: -0.5 });
      pillar(K, c, 0.35, 0.3, sill, 0.22, 0.07, fl.stair, { s: 0.7 });
      f.label(c, 0, 0.6, sill + 0.6, { label: 'look in the niche', reach: 5, title: 'Three things', kicker: 'An ammonite, an ostrich egg, an elephant',
        text: 'A heteromorph ammonite (Exiteloceras jenneyi), from the Smithsonian\'s scan of the fossil; an ostrich egg on a bronze ring; a small elephant carved in wood.', foot: 'Models: Smithsonian Open Access and Poly Haven (CC0).' });
    }

    // ---- the second flight: the section of the place -------------------------------------------------------------------
    drawing(N_(-18.7), 0, nose(-18.7) + 4.9, 3.6, 1.8, drawSection, { label: 'look at the section', title: 'Section along the way in', kicker: 'Looking north',
      text: 'From the cellar doors, 30 ft above the courtyard\'s paving, down three flights, over two landings at 20 and 10 ft, to the hall, the suite over it, and the courtyard under its vault of rock.', foot: 'Drawn by the staff from the building\'s own figures.' });
    // ---- five pictures of colour down the stair, well apart, each with clear stone round it and a candle niche by it (none
    // higher up the first flight: above the meadow's level, under the doors, the stone walls stop) ----------------------------
    const A = (who, what, where, lic) => ({ title: what, kicker: who, text: where, foot: lic });
    const AIC = 'Art Institute of Chicago. Public domain (CC0).';
    const hang = (side, X, w, tall, slug, cap, h) => print(side === 'N' ? N_(X, h ?? 0) : S_(X, h ?? 0), 0, (h !== undefined ? 0 : nose(X)) + 5.2, w, tall, slug, cap);
    hang('N', -41.0, 2.0, 1.98, 'klimt_birch_forest', A('Gustav Klimt, 1903', 'Birch Forest (Birkenwald)', 'Oil on canvas: the forest floor in rust and gold between pale trunks.', 'Via Wikimedia Commons. Public domain.'));
    hang('S', -36.0, 3.0, 2.31, 'aic_kandinsky_murnau', A('Vasily Kandinsky, 1909', 'Houses at Murnau', 'Oil on cardboard.', AIC), L1);
    hang('N', -12.9, 1.85, 2.68, 'aic_marc_mill', A('Franz Marc, 1913', 'The Bewitched Mill', 'Oil on canvas.', AIC));
    hang('N', 0.0, 2.6, 2.61, 'aic_kandinsky_cannons', A('Vasily Kandinsky, 1913', 'Improvisation No. 30 (Cannons)', 'Oil on canvas.', AIC));
    hang('S', 0.5, 2.6, 2.05, 'van_gogh_almond_blossom', A('Vincent van Gogh, 1890', 'Almond Blossom', 'Oil on canvas.', 'Via Wikimedia Commons. Public domain.'));
  }

  // =====================================================================================================================
  //  THE HALL
  // =====================================================================================================================
  function hall() {
    const F = 0.4, CEIL = f.room('The Hall').ceil;

    // ---- the fire: a plain breast of rough stone on the south wall east of the window, a low slate hearth --------------
    const BX0 = 29.42, BX1 = 33.28, BY = 19.4, OX0 = 30.35, OX1 = 32.35, OH = F + 2.4, FX = 31.35, FY = 18.6, STONE = 'coursed';      // (between two of the ceiling's beams, X 29.11 and 33.57, so the breast can rise to the boards)
    G.box(STONE, BX0, OX0, 17.45, BY, F, CEIL - 0.08); G.box(STONE, OX1, BX1, 17.45, BY, F, CEIL - 0.08); G.box(STONE, OX0, OX1, 17.45, BY, OH, CEIL - 0.08);
    G.box(SOOT, OX0, OX1, 17.45, 17.95, F, OH); G.box(SOOT, OX0, OX0 + 0.12, 17.95, BY - 0.02, F, OH); G.box(SOOT, OX1 - 0.12, OX1, 17.95, BY - 0.02, F, OH); G.box(SOOT, OX0, OX1, 17.95, BY - 0.02, OH - 0.08, OH);
    G.box('c#2a2019/0.95', OX0 + 0.12, OX1 - 0.12, 17.95, BY, F - 0.05, F + 0.06);
    put(SLATE, bev(29.2, 33.5, 17.55, 20.1, F - 0.05, F + 0.45, 0.02, { grain: 'x' }));
    G.block(BX0, BX1, 17.5, 20.1, F, F + 4.4);
    const GZ = F + 0.42;
    {
      const g = f.fr(FX, FY, F, 0);
      for (const x of [-0.8, 0.8]) { g.box(IRON, x - 0.05, x + 0.05, -0.45, 0.45, 0, 0.08); g.box(IRON, x - 0.04, x + 0.04, 0.37, 0.45, 0.08, 0.7); }
      for (let i = 0; i < 5; i++) { const y = -0.32 + i * 0.16; g.box(IRON, -0.7, 0.7, y - 0.025, y + 0.025, GZ - F - 0.06, GZ - F - 0.02); }
      g.box(IRON, -0.7, 0.7, 0.33, 0.38, GZ - F - 0.06, GZ - F + 0.3);
      const lb = f.fr(32.95, 19.35, F + 0.45, 0);      // split birch stacked on the hearth's end
      storedLogs(K, lb, 0, 0, 0, .88, .11, 3, 2);
      const h = f.fr(29.75, 19.75, F + 0.45, 0); pillar(K, h, 0, 0, 0, 0.6, 0.17, fl.hall); pillar(K, h, 0.35, -0.2, 0, 0.38, 0.13, fl.hall);      // candles on the hearth's other end
    }
    const fireLamp = f.lamp(FX, FY + 1.6, F + 1.7, { power: 0.9, kind: 'candle' });
    f.later(ctx => {
      fireLamp.kind = 'fire';
      const o = f.world(FX, FY, GZ), x1 = f.world(FX + 1, FY, GZ), dx = [x1.x - o.x, x1.z - o.z];
      const hearth = new THREE.Group(); hearth.position.set(o.x, o.y, o.z); hearth.rotation.y = Math.atan2(-dx[1], dx[0]);      // local x along the opening, local z through it
      const uT = { value: 0 };
      hearth.add(makeFlames(THREE, mergeGeometries, uT, [[0, 0, 0, 1.5, 1.5, 0], [0, 0.18, 0.16, 1.3, 1.3, 3.7], [0, -0.16, -0.14, 1.15, 1.15, 8.1]], 0.1));
      hearth.add(burningLogs(ctx.materials.bark, 1.58, .77));
    const embers = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 0.8).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
        uniforms: { uT }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
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
    print(f.fr(FX, BY + 0.05, 0, 0), 0, F + 6.6, 1.8, 1.82, 'klimt_farm_garden_sunflowers', { mat: 0.2,      // (2.4 ft overall on a breast 3.9 wide: 9 in. of stone each side)
      title: 'Farm Garden with Sunflowers', kicker: 'Gustav Klimt, about 1906',
      text: 'Oil on canvas: a cottage garden packed to its edges, sunflowers standing up out of it.', foot: 'Via Wikimedia Commons. Public domain.' });
    // ---- facing the fire: a thick oak bench with sheepskins, and one quiet chair of oak and linen to the west -----------
    put('wool#d8ccb4', box5(23.2, 35.2, 20.3, 24.9, F - 0.01, F + 0.03));                         // a plain undyed rug, under all of it
    {
      const b = f.fr(31.6, 24.5, F, 2), a = 2.1, d = 1.4;      // faces the fire (south); its back edge on the rug's north edge
      b.bev(MAT.OAK, -a, a, 0, d, 1.2, 1.5, 0.03, { grain: 'x' });
      for (const x of [-a + 0.4, a - 0.4]) b.bev(MAT.OAK, x - 0.22, x + 0.22, 0.12, d - 0.12, 0, 1.2, 0.02, { grain: 'z' });
      for (const [x, rz, sd] of [[-1.0, 0.12, 3], [1.05, -0.08, 7]]) K.put(b, MAT.WOOL, pillow(1.75, 1.35, 0.16, { n: 10, pinch: 0.2, lump: 0.035, dent: 0.02, rng: rnd(sd) }), { rz, at: [x, d / 2, 1.58] });      // two sheepskins, shaggy-edged
      for (const x of [-1.0, 1.0]) K.seat(b, x, 0.75, 1.62, 'sit by the fire');
      b.block(-a, a, 0, d, 0, 1.6);
    }
    { // the chair turned about 32 degrees from square, toward the fire and the bench
      const base = f.fr(25.0, 22.3, F, 3), a = -0.56, ca = Math.cos(a), sa = Math.sin(a), rf = Object.create(base);
      rf.map = (x, y) => base.map(x * ca - y * sa, x * sa + y * ca);
      const o = rf.map(0, 0), e = rf.map(0, 1); rf.dir = [e[0] - o[0], e[1] - o[1]];
      easyChair(K, rf, { pillow: MAT.LINEN2 });
    }      // one chair, 7 ft from the bench, 3 ft clear of everything
    floorLantern(K, f.fr(34.8, 18.9, F, 0), 0, 0, fl.hall, { h: 2.7 });
    // two lanterns hung low on long cords from the beams: over the desk, and over the seats by the fire
    for (const [X, Y, z, s] of [[18.6, 35.3, F + 7.2, 1.5], [28.4, 22.0, F + 7.6, 1.5]]) { const hf = f.fr(X, Y, 0, 0); handLantern(K, hf, 0, 0, z, fl.hall, s); K.put(hf, MAT.IRON, sweep([[0, 0, z + 0.75 * s + 0.3], [0, 0, CEIL - 0.02]], 0.012, { seg: 4 })); }      // and one by the desk, at the foot of the west wall
    washes.push({ a: [BX0 + 0.1, BY + 0.03, F + 0.5], b: [BX1 - 0.1, BY + 0.03, F + 0.5], n: [0, 1], d: [0, 0, 7.5], k: 0.55, at: 'hall' });      // the fire's light up the stone of its breast

    // ---- the bench under the cloud window: an oak slab on two stone blocks, linen cushions, candles -----------------------
    {
      put(MAT.OAK, bev(20.4, 26.6, 17.55, 19.3, F + 1.27, F + 1.52, 0.03, { grain: 'x' }));
      for (const X of [21.0, 26.0]) put(MAT.STONE, bev(X - 0.4, X + 0.4, 17.6, 19.1, F, F + 1.27, 0.02, { grain: 'z' }));
      put(MAT.LINEN, pillow(3.7, 1.5, 0.24, { n: 10, pinch: 0.05, dent: 0.03, rng: rnd(5) }), { at: [22.55, 18.42, F + 1.65] });      // a long linen squab
      const w = f.fr(23.5, 17.5, F, 0);
      K.cushion(w, -2.2, 0.4, 1.7, 1.1, 1.0, MAT.LINEN2, { tilt: 0.3 }); K.cushion(w, -0.9, 0.4, 1.7, 1.0, 0.95, MAT.WOOL, { tilt: 0.35 });
      pillar(K, w, 1.8, 0.7, 1.52, 0.5, 0.15, fl.hall); pillar(K, w, 2.25, 0.55, 1.52, 0.32, 0.12, fl.hall);
      for (const x of [-2.2, -0.5]) K.seat(w, x, 0.9, 1.7, 'sit in the window');
      G.block(20.4, 26.6, 17.5, 19.3, F, F + 1.5);
    }

    // ---- robes on oak pegs in a stone niche west of the window, an oak bench under them, slippers ----------------------
    {
      const X0 = 13.8, X1 = 19.4, MX = (X0 + X1) / 2, d = 1.3, r = f.fr(MX, 17.5, F, 0), hw = (X1 - X0) / 2;
      // the niche: stone piers and a lintel standing out from the wall, a darker stone back
      r.bev(MAT.STONE, -hw, -hw + 0.4, 0, d + 0.1, 0, 7.6, 0.02, { grain: 'z' }); r.bev(MAT.STONE, hw - 0.4, hw, 0, d + 0.1, 0, 7.6, 0.02, { grain: 'z' });
      r.bev(MAT.STONE, -hw, hw, 0, d + 0.1, 7.6, 8.3, 0.02, { grain: 'x' });
      r.box(MAT.STONED, -hw + 0.4, hw - 0.4, 0.01, 0.05, 0, 7.6);
      // the peg rail and the robes
      r.bev(MAT.OAK, -hw + 0.45, hw - 0.45, 0.05, 0.15, 5.65, 6.1, 0.015, { grain: 'x' });
      const cols = [MAT.WOOL, 'wool#e2d8c6', MAT.WOOL, 'wool#c9bca2'];
      for (let i = 0; i < 4; i++) { const x = -hw + 0.9 + i * (2 * hw - 1.8) / 3; K.put(r, MAT.OAK, lathe([[0.05, 0], [0.04, 0.3], [0.06, 0.32], [0.055, 0.36], [0, 0.37]], { seg: 8 }), { rx: -Math.PI / 2 - 0.25, at: [x, 0.15, 5.88] }); K.coatOnPeg(r, x, 0.25, 5.83, cols[i], 'robe'); }
      // the bench under them, slippers below
      for (const x of [-hw + 0.75, hw - 0.75]) r.bev(MAT.OAK, x - 0.08, x + 0.08, 0.2, d - 0.05, 0, 1.4, 0.012, { grain: 'z' });
      r.bev(MAT.OAK, -hw + 0.45, hw - 0.45, 0.15, d, 1.4, 1.55, 0.015, { grain: 'x' });
      K.foldedStack(r, hw - 1.3, 0.7, 1.55, 3, [MAT.WOOL, 'wool#d9cdb5'], { w: 1.0, d: 0.75, t: 0.14 });
      for (const x of [-1.4, 0, 1.4]) K.slippers(r, x, 0.75, 0.0, 'wool#e9e1d2', { turn: Math.PI });
      K.seat(r, -1.0, 0.7, 1.55, 'sit on the bench');
      washes.push({ a: [X0 + 0.45, 17.56, F + 7.55], b: [X1 - 0.45, 17.56, F + 7.55], n: [0, 1], d: [0, 0, -6.8], k: 0.6, at: 'hall' });
      r.block(-hw, hw, 0, d + 0.1, 0, 1.6);
    }

    // ---- the desk: a plain block of pale stone with a thick oak top, facing the axis; the keys in a niche behind it ------
    {
      const DX0 = 15.6, DX1 = 21.6, DY0 = 34.0, DY1 = 36.6, T = F + 3.55;
      put(MAT.STONE, bev(DX0 + 0.1, DX1 - 0.1, DY0 + 0.15, DY1 - 0.05, F, T - 0.3, 0.03, { grain: 'x' }));
      put(MAT.OAK, bev(DX0, DX1, DY0, DY1 + 0.05, T - 0.3, T, 0.04, { grain: 'x' }));
      G.block(DX0, DX1, DY0, DY1 + 0.05, F, T);
      // on the desk: a frame at its back edge, facing the guest (-Y): x runs along it (plan -X), y toward the guest
      const c = f.fr(18.6, DY1, T, 2);
      // the guest book open with a pen in a stand, the bell, the treatments card
      K.openBook(c, 0.3, 1.55, 0.0, { cover: 'c#5a2e26/0.7', turn: 0.06 });
      { const [X, Y] = c.map(0.3, 1.55), w = f.world(X, Y, T + 0.15);      // the guest book is the family's one book (guestbook.js): E opens it
        f.later(ctx => ctx.interact.push({ x: w.x, y: w.y, z: w.z, reach: 5, label: () => 'sign the guest book', act: () => { if (window.__guestbook?.open) window.__guestbook.open(); else ctx.flash('The guest book is on its way. Try again in a moment.'); } })); }
      K.put(c, 'c#1b1612/0.4', lathe([[0, 0], [0.11, 0], [0.11, 0.03], [0.06, 0.05], [0.05, 0.12], [0, 0.13]], { seg: 12 }).translate(1.15, 1.85, 0.0));
      K.put(c, 'c#1b1612/0.5', sweep([[1.15, 1.85, 0.08], [1.18, 1.92, 0.4]], 0.012, { seg: 5 }));
      K.put(c, MAT.BRONZE, lathe([[0, 0], [0.2, 0], [0.21, 0.02], [0.19, 0.05], [0.16, 0.08], [0.17, 0.1], [0.15, 0.13], [0.1, 0.2], [0.04, 0.23], [0.02, 0.24], [0.02, 0.3], [0.04, 0.31], [0.04, 0.33], [0, 0.34]], { seg: 18 }).translate(-0.85, 2.05, 0.0));
      K.put(c, MAT.OAKD, lathe([[0, 0], [0.25, 0], [0.25, 0.03], [0, 0.03]], { seg: 18 }).translate(-0.85, 2.05, -0.012));
      f.label(c, -0.85, 2.05, 0.3, { label: 'ring the bell', reach: 5, note: 'A clear note. Somebody is already on the way.' });
      const cf = c.sub(-1.5, 0.9);      // the card stands on the counter, facing arriving guests
      f.sign(cf, 0, 0.66, 0.95, 1.23, (g, W, H) => {
        D.paper(g, W, H, '#efe7d6', 8);
        D.T(g, 'TREATMENTS', W / 2, H * 0.11, H * 0.069, '#241508', { f: D.F.goudy, ls: H * 0.012 });
        g.fillStyle = '#2a2119'; g.fillRect(W * 0.38, H * 0.145, W * 0.24, Math.max(1, H * 0.003));
        const L = [['Parenie, birch veniks', '40 min'], ['The cold plunge, three rounds', '20 min'], ['Salt and honey scrub', '45 min'], ['Massage', '60 or 90 min'], ['Pedicure', '60 min'], ['Tea at the samovar', '—'], ['The Quiet Room', '1 hour']];
        L.forEach(([a, b], i) => { const y = H * (0.24 + i * 0.09); D.T(g, a, W * 0.1, y, H * 0.042, '#241508', { f: D.F.goudy, a: 'left', max: W * 0.58 }); D.T(g, b, W * 0.9, y, H * 0.039, '#342516', { f: D.F.goudy, it: true, a: 'right' }); });
        D.T(g, 'Coffee in seven minutes.', W / 2, H * 0.91, H * 0.039, '#342516', { f: D.F.goudy, it: true });
      }, { y: 0.026, tilt: 0.1, res: 480 });
      K.put(cf, MAT.OAKD, bev(-0.51, 0.51, -0.047, 0.01, -0.64, 0.64, 0.012, { grain: 'z' }), { rx: 0.1, at: [0, 0.012, 0.66] });
      cf.bev(MAT.OAK, -0.54, 0.54, -0.23, 0.16, 0, 0.06, 0.012, { grain: 'x' });
      f.label(cf, 0, 0.1, 0.6, { label: 'read the treatments', reach: 6, title: 'Treatments', kicker: 'Ask at the desk',
        text: 'Parenie in the Parnaya: steam, and birch veniks soaked in hot water, laid on and swept. 40 minutes, with rests.\nThe cold plunge in the Banya: three rounds, a blanket between. 20 minutes.\nSalt and honey scrub, in the Treatment Room. 45 minutes.\nMassage. 60 or 90 minutes.\nPedicure in the Tea Room\'s corner, facing the clouds. 60 minutes.\nTea at the samovar in the Tea Room, for as long as you like.\nThe Quiet Room. One hour; nobody talks.\nCoffee in seven minutes.',
        foot: 'Anna’s Basement' });
      // a hand lantern at the east end of the counter
      handLantern(K, c, -2.46, 0.56, 0, fl.hall, 1.12); K.lampAt(c, -2.46, 0.56, 0.53, 0.5); { const l = K.lamps[K.lamps.length - 1]; l.kind = 'glow'; l.halo = 0.7; }
      {
        const st = f.fr(23.1, 35.4, F, 2);
        const top = K.sideTable(st, 0, 0, { kind: 'round', wood: MAT.OAK, h: 2.4, r: 1.02 });
        const sc = st.sub(0, 0, top), bx = 0.44, by = -0.14;
        K.put(sc, 'c#e9e2d2/0.25', lathe([[0, 0], [0.19, 0], [0.39, 0.14], [0.42, 0.23], [0.39, 0.23], [0.32, 0.13], [0, 0.055]], { seg: 24 }), { at: [bx, by, 0] });
        const oranges = [], stems = [];
        for (const [dx, dy, dz, r] of [[-0.15, 0.06, 0.22, 0.15], [0.15, 0.05, 0.22, 0.16], [0.02, -0.15, 0.22, 0.15], [0.005, 0.01, 0.421, 0.15]]) {
          oranges.push(lathe([[0, -r * 0.9], [r * 0.66, -r * 0.7], [r, 0], [r * 0.68, r * 0.73], [r * 0.2, r * 0.88], [0, r * 0.85]], { seg: 16 }).translate(bx + dx, by + dy, dz));
          stems.push(sweep([[bx + dx, by + dy, dz + r * 0.85], [bx + dx + 0.018, by + dy, dz + r]], 0.014, { seg: 5, caps: true }));
        }
        K.put(sc, 'c#e68228/0.62', merge(oranges));
        K.put(sc, 'c#5a6132/0.87', merge(stems));
        K.foldedStack(sc, -0.43, 0.11, 0, 3, ['wool#e9e1d2', 'wool#cca982'], { w: 0.79, d: 0.62, t: 0.13 });
      }
      // a tray of room keys on tasselled fobs
      {
        const tx = 0.4, ty = 0.55;
        K.put(c, MAT.OAK, merge([bev(tx - 0.55, tx + 0.55, ty - 0.32, ty + 0.32, 0, 0.04, 0.01), bev(tx - 0.55, tx + 0.55, ty - 0.32, ty - 0.27, 0.04, 0.12, 0.01), bev(tx - 0.55, tx + 0.55, ty + 0.27, ty + 0.32, 0.04, 0.12, 0.01), bev(tx - 0.55, tx - 0.5, ty - 0.27, ty + 0.27, 0.04, 0.12, 0.01), bev(tx + 0.5, tx + 0.55, ty - 0.27, ty + 0.27, 0.04, 0.12, 0.01)]));
        const kk = [], tas = [], tas2 = [];
        for (let i = 0; i < 4; i++) {
          const x = tx - 0.35 + i * 0.23, y = ty + ((i % 2) ? 0.08 : -0.08), a = 0.3 * (i - 1.5);
          kk.push(sweep([[x, y - 0.12, 0.06], [x + 0.03, y + 0.05, 0.06]], 0.012, { seg: 4 }), lathe([[0, 0], [0.035, 0], [0.035, 0.01], [0, 0.01]], { seg: 10 }).translate(x - 0.005, y - 0.15, 0.055));
          (i % 2 ? tas : tas2).push(lathe([[0, 0], [0.04, 0.02], [0.05, 0.15], [0.02, 0.19], [0, 0.2]], { seg: 8 }).rotateX(Math.PI / 2 - 0.15).rotateZ(a).translate(x + 0.03, y + 0.07, 0.07));
        }
        K.put(c, MAT.BRONZE, merge(kk)); K.put(c, 'wool#8a2e22', merge(tas)); K.put(c, 'wool#3f5a3a', merge(tas2));
      }
      // behind the desk, a stool for the concierge; in front, a small rug
      K.stool(f.fr(21.1, 37.9, F, 2), 0, 0, { h: 2.05, wood: MAT.OAK });
      f.rug(15.4, 21.8, 31.9, 33.8, F, 'kilim');
      // a generous vase of flowers at its west end (the lamp at the east); and beyond it a fiddle-leaf fig in a great clay jar
      K.posy(c, 2.23, 0.65, 0, ['c#b84f53/0.55', 'c#e9ab9d/0.6', 'c#f4ddae/0.6'], { kinds: ['tulip'], jar: 'c#ded6c4/0.35', scale: 1.5 });
      { const jf = f.fr(14.6, 38.9, F, 0), top = jar(K, jf, 0, 0, 0.75, 2.3, 'plaster#b86f4e');
        const Lf = leaves(K); fiddleFig(K, Lf, jf, 0, 0, top, 1.0, 5); Lf.flush(); }
      // the keys: an arched stone niche in the north wall behind the desk, oak pegs in two rows
      const n = f.fr(18.6, 40.25, F, 2), sill = archNiche(K, n, 0, 5.4, 3.6, 3.4, { face: 0.65, margin: 0.4, cap: 0.45 });
      const pegs = [], keys = [], tags = [], tags2 = [];
      for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
        const x = -1.45 + i * 0.58, z = sill + 2.75 - r * 0.85;
        pegs.push(lathe([[0.04, 0], [0.035, 0.22], [0.05, 0.24], [0, 0.26]], { seg: 6 }).rotateX(-Math.PI / 2 - 0.2).translate(x, 0.05, z));
        if ((r * 6 + i) % 5 === 3) continue;                                                       // a few keys are out with their guests
        keys.push(bev(x - 0.02, x + 0.02, 0.2, 0.24, z - 0.22, z - 0.02, 0.006));
        (i % 2 ? tags : tags2).push(bev(x - 0.06, x + 0.06, 0.19, 0.24, z - 0.44, z - 0.22, 0.015));
      }
      K.put(n, MAT.OAK, merge(pegs)); K.put(n, MAT.BRONZE, merge(keys)); K.put(n, 'leather#6b4a30', merge(tags)); K.put(n, 'leather#8a6a48', merge(tags2));
      // on the sill, a row of oak pigeonholes with letters and a parcel or two
      {
        const pw = 2.6, ph = 1.0, pd = 0.55, nc = 5, parts = [], paper = [], parcel = [];
        parts.push(bev(-pw / 2, pw / 2, 0.12, pd, sill + 0.005, sill + 0.06, 0.01), bev(-pw / 2, pw / 2, 0.12, pd, sill + ph - 0.06, sill + ph, 0.01), bev(-pw / 2, pw / 2, 0.12, 0.16, sill + 0.005, sill + ph, 0.01));
        for (let k = 0; k <= nc; k++) { const x = -pw / 2 + k * pw / nc; parts.push(bev(x - 0.025, x + 0.025, 0.12, pd, sill + 0.005, sill + ph, 0.008)); }
        parts.push(bev(-pw / 2, pw / 2, 0.12, pd, sill + ph / 2 - 0.025, sill + ph / 2 + 0.025, 0.008));
        for (let k = 0; k < nc; k++) for (let r = 0; r < 2; r++) {
          const x = -pw / 2 + (k + 0.5) * pw / nc, z = sill + 0.06 + r * ph / 2;
          if ((k + r) % 3 === 1) parcel.push(bev(x - 0.17, x + 0.14, 0.15, 0.45, z, z + 0.24, 0.02));
          else if ((k * 2 + r) % 4) for (let q = 0; q < 2; q++) paper.push(bev(x - 0.18 + q * 0.03, x + 0.16, 0.12 + q * 0.06, 0.5 - q * 0.1, z + 0.005 + q * 0.03, z + 0.018 + q * 0.03, 0.003));
        }
        K.put(n, MAT.OAK, merge(parts)); K.put(n, 'c#efe6d2/0.9', merge(paper)); K.put(n, 'c#b08a5a/0.85', merge(parcel));
      }
      washes.push({ a: [16.85, 40.2, sill + 0.05], b: [20.35, 40.2, sill + 0.05], n: [0, -1], d: [0, 0, 3.0], k: 0.9, at: 'hall' });
    }

    // ---- the north-east corner by the glass: ferns among rocks in a low bed --------------------------------------------
    {
      const bd = f.fr(34.0, 38.4, F, 0);
      K.put(bd, MAT.STONED, lathe([[0, 0], [1.6, 0], [1.62, 0.5], [1.5, 0.52], [1.48, 0.42], [0, 0.42]], { seg: 20, sx: 1.0, sy: 1.0 }));
      K.put(bd, 'plaster#3a2a1e', lathe([[0, 0.42], [1.48, 0.42], [0, 0.46]], { seg: 16 }));
      f.model('st_rock_4', bd, -0.5, 0.4, 0.38, 0, { turn: 0.6 }); f.model('moon_rock_02', bd, 0.7, -0.4, 0.38, 0, { turn: 1.4 });
      const L = leaves(K); fern(K, L, bd, 0.2, 0.1, 0.45, 1.25, 3); fern(K, L, bd, -0.8, -0.6, 0.45, 0.9, 7); fern(K, L, bd, 0.9, 0.7, 0.45, 0.85, 11); L.flush();
      bd.block(-1.6, 1.6, -1.6, 1.6, 0, 1.5);
    }
  }
}
