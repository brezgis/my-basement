// pool_chapel: The Pool and The Chapel (see README.md here and the README at the project root).
//
// THE POOL, a tiled bath hall: after the old thermal baths (Gellért and Széchenyi in Budapest), the hammam and the Japanese
// sento, done quietly, with Zumthor's Therme Vals still in its light (lamps lying in the water, steam, amber light washing
// the walls). The shell gives pale glazed tile; here a celadon dado with a deep sea-green cap rail round the room, a
// sea-green frieze high in the tall part, a mosaic border round the water. Low walnut loungers with cream, ochre and
// green linen in pairs (one on the wall, a daybed in the pocket by the courtyard glass, a low table between); robes on
// walnut pegs over a slatted bench with a sheepskin and the tray of water; towels on lit open shelves; in the tall part
// a tiled bench with towels, cushions and a lantern and a tiled planter of ferns, moss and a palm on each side; lit
// shelves on the end wall; one print (Hiroshige). Brass rails down the steps. Over the water: ripples, the lanterns
// broken up in them, steam (pool_chapel_fx.js).
//
// THE CHAPEL, in the hand of the chapel in Anna's garden (~/projects/my_house/site/src/garden/chapel.js) and the one
// on Vesper Street (~/projects/town_walk/site/src/chapel.js): the same glass, the same stone table with candles and a
// bowl of water, the same lectern open at the end of the Origin of Species, MORE IS DIFFERENT over the door and
// Piaget's sentence cut in the table. It is inside the rock, so there are no windows: the glass is set in round-headed
// niches in the walls and lit from behind, as light boxes (the drawing is Vesper Street's, copied into
// pool_chapel_glass.js). For the room itself: Zumthor's Bruder Klaus Field Chapel (Mechernich, 2007), a dark rough
// stone room with one opening to the sky; James Turrell's skyspaces (the sky framed in a plain ceiling, nothing else to
// look at); and the Pantheon's oculus, whose disc of light moves round the floor. The light falls on the table.
//   west wall, from the door:  Life (it moves), Turing, the strange loop, eigen-behaviour
//   east wall, from the door:  Cajal's neuron, broken symmetry, Darwin's tree, the logistic map
//   the far end:               ingressing minds, the great light, behind the lectern
//   over the door:             the murmuration, and MORE IS DIFFERENT cut under it
//   under the shaft:           the stone table: a wide bowl of still water (E: touch it), a singing bowl (E: strike
//                              it), candles, incense; cushions either side of it; two plain oak benches by the door
//
// STAFF POSTS (for whoever brings the robots: nobody is placed here; the plan of 21 November, late, at three quarters)
//   The Pool     X 74.2, Y 69.2, facing east (the towel shelves)        the bath attendant: hands out towels and robes,
//                                                                       folds the used ones
//   The Pool     X 46.5, Y 69.0, facing west (the robes' bench)         pours water from the carafe on the tray (the
//                                                                       tray: X 44.0, Y 69.3, h 1.9) and holds a robe open
//   The Pool     X 60.0, Y 82.5, facing north (the chapel's doors)      keeps the quiet at the far end, by the steam
//   The Chapel   X 70.0, Y 106.0, facing west (the table)               the sacristan: trims the candles, lights the incense;
//                                                                       stands still and says nothing unless spoken to
//   Things to serve from: the tray of water (The Pool, the robes' bench, west wall), the towel shelves (The Pool, east wall).
import { MAT, leaves, pot, palm, fern, pillar, taper, candleCluster, lounger, drumTable, carafeTray, robes, towelShelves, lantern, stoneBench, poolRail, archOutline, zafu, plankBench, lectern, roll } from './pool_chapel_parts.js';
import { flames, poolWater, steam, wash, glassBoxes, oculus, bowl } from './pool_chapel_fx.js';
import * as THREE from 'three';

export default function (f) {
  const K = f.kit, D = f.draw;
  // the basin, as spanya.js cuts it (POOL there): not handed to furnish files, so given here; change both together
  const BASIN = { X0: 52, X1: 68, Y0: 59.5, Y1: 78, deep: 3.6 };
  const POOL = f.room('The Pool'), CH = f.room('The Chapel');
  const F = POOL.floor;                                                    // 0.4 (the Chapel's is the same)
  const L = leaves(K);
  const poolFlames = [], chapelFlames = [], poolLamps = [], poolWash = [], chapelWash = [];

  f.inZone('o:courtyard', () => {
    const left = f.fr(68.7, 15.9, 0.34), right = f.fr(73.3, 16.7, 0.34);
    lounger(K, left, { w: 2.25, len: 5.6, fabric: 'linen#d5cab0', wood: 'oak_light#916f4e', tilt: 0.55 });
    lounger(K, right, { w: 2.25, len: 5.6, fabric: 'linen#9cad9d', wood: 'oak_light#916f4e', tilt: 0.69 });
    const table = f.fr(71, 19.0, 0.34);
    const h = drumTable(K, table, 0, 0, 0.68, 1.27);
    carafeTray(K, table, 0, 0, h);
  });

  // ---- a lining of stone: boxes in front of a wall, cut round its openings ----------------------------------------
  // the rectangle a0..a1 (along the wall) by z0..z1, less the holes [a0, a1, z0, z1]: vertical strips between the
  // holes' sides, each cut where a hole crosses it
  const around = (a0, a1, z0, z1, holes) => {
    const xs = [...new Set([a0, a1, ...holes.flatMap(h => [h[0], h[1]]).filter(v => v > a0 && v < a1)])].sort((p, q) => p - q), out = [];
    for (let i = 0; i < xs.length - 1; i++) {
      const s0 = xs[i], s1 = xs[i + 1], m = (s0 + s1) / 2, cut = holes.filter(h => h[0] < m && h[1] > m).map(h => [h[2], h[3]]).sort((p, q) => p[0] - q[0]);
      let z = z0; for (const [c0, c1] of cut) { if (c0 > z) out.push([s0, s1, z, c0]); z = Math.max(z, c1); } if (z < z1) out.push([s0, s1, z, z1]);
    }
    return out;
  };
  // a flat piece cut to an outline [[X, Y], ...] at height h, face up (or down), with holes: as spanya.js's flat()
  const flat = (mat, pts, h, up = true, holes = []) => {
    const path = (P, q) => { q.moveTo(P[0][0], up ? P[0][1] : -P[0][1]); for (const p of P.slice(1)) q.lineTo(p[0], up ? p[1] : -p[1]); return q; };
    const sh = path(pts, new THREE.Shape()); for (const hp of holes) sh.holes.push(path(hp, new THREE.Path()));
    const g = new THREE.ShapeGeometry(sh, 8).toNonIndexed(); g.rotateX(up ? -Math.PI / 2 : Math.PI / 2); g.translate(0, h, 0); g.computeVertexNormals();
    f.mesh(mat, g);
  };
  const circ = (X, Y, r, n = 32) => Array.from({ length: n }, (_, i) => [X + r * Math.cos(i / n * Math.PI * 2), Y + r * Math.sin(i / n * Math.PI * 2)]);
  // a box of stone whose texture is drawn out long and thin (su along, sv up): the thin courses of Vals and of the
  // poured layers of Bruder Klaus, from a masonry texture made for coursed slate. Building coordinates: x = X, y = h, z = -Y.
  const slab = (mat, X0, X1, Y0, Y1, h0, h1, su = 0.55, sv = 2.4) => {
    const g = new THREE.BoxGeometry(X1 - X0, h1 - h0, Y1 - Y0).toNonIndexed(); g.translate((X0 + X1) / 2, (h0 + h1) / 2, -(Y0 + Y1) / 2);
    const P = g.attributes.position, N = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i)); uv.setXY(i, nx > 0.5 ? -z * su : x * su, ny > 0.5 ? z * su : y * sv); }
    f.mesh(mat, g);
  };
  // along X at Y = y0..y1 (a north or south wall), or along Y at X = x0..x1 (a west or east wall)
  const lineX = (mat, y0, y1, a0, a1, z0, z1, holes = [], k) => { for (const [s0, s1, h0, h1] of around(a0, a1, z0, z1, holes)) slab(mat, s0, s1, y0, y1, h0, h1, ...(k ?? [])); };
  const lineY = (mat, x0, x1, a0, a1, z0, z1, holes = [], k) => { for (const [s0, s1, h0, h1] of around(a0, a1, z0, z1, holes)) slab(mat, x0, x1, s0, s1, h0, h1, ...(k ?? [])); };

  // =================================================================================================================
  // THE POOL, a tiled bath hall: X 43.3..76.7, Y 53..72.5 under the Quiet Room (ceiling 10.6), a great oak beam at Y 73.5,
  // then X 43.75..76.25, Y 74..84.5 at ceiling 15.5, ending in the chapel's doors; a pocket either side south of Y 53,
  // round the courtyard's wall. The basin X 52..68, Y 59.5..78 (BASIN below; its coping 0.5 round it), steps at the west end.
  // Walks: about 6 ft at the sides, 4 at each end. After the old thermal baths (Gellért, Széchenyi), the hammam and the
  // sento, done quietly: the shell's pale glazed tile, a celadon dado with a deep sea-green cap round the room, a
  // sea-green frieze high in the tall part, a mosaic border round the water, tiled benches and planters.
  // =================================================================================================================
  {
    const BX0 = BASIN.X0, BX1 = BASIN.X1, BY0 = BASIN.Y0, BY1 = BASIN.Y1;
    const fl = (X, Y, q) => f.fr(X, Y, F, q), WL = 43.3, WR = 76.7, WL2 = 43.75, WR2 = 76.25, YN = 84.5;
    const DADO = 'tile_subway#a9c6b6', CAP = 'tile_subway#3f6e69', FRIEZE = 'tile_subway#5e8f86', BORDER = 'tile_hex#2f6a63', TILEB = 'tile_subway#cfd9cf';
    // the dado: celadon to 3.3 ft, a deep sea-green cap rail on it; the openings and the chapel's doors left clear
    const dado = (axis, c, out, a0, a1, holes) => {
      const t = out * 0.06, k = out * 0.1;
      if (axis === 'Y') { for (const [s0, s1, h0, h1] of around(a0, a1, F + 0.02, F + 3.3, holes)) f.box(DADO, Math.min(c, c + t), Math.max(c, c + t), s0, s1, h0, h1); for (const [s0, s1] of around(a0, a1, F + 3.3, F + 3.42, holes).map(r => [r[0], r[1]])) f.box(CAP, Math.min(c, c + k), Math.max(c, c + k), s0, s1, F + 3.3, F + 3.42); }
      else { for (const [s0, s1, h0, h1] of around(a0, a1, F + 0.02, F + 3.3, holes)) f.box(DADO, s0, s1, Math.min(c, c + t), Math.max(c, c + t), h0, h1); for (const [s0, s1] of around(a0, a1, F + 3.3, F + 3.42, holes).map(r => [r[0], r[1]])) f.box(CAP, s0, s1, Math.min(c, c + k), Math.max(c, c + k), F + 3.3, F + 3.42); }
    };
    const OPEN = [[61.15, 66.45, F - 1, F + 8.5]];
    dado('Y', WL + 0.02, 1, 46.4, 72.5, OPEN); dado('Y', WR - 0.02, -1, 46.4, 72.5, OPEN);
    const bayY = 28 + Math.sqrt(24 ** 2 - 4.45 ** 2) + 0.75;
    dado('X', bayY, 1, 55.55, 64.45, [[56.66, 63.34, F - 1, F + 10]]);
    // The hall narrows here. Cover each short return as well as its long face.
    dado('X', 72.5, -1, WL, WL2 + 0.02, []);
    dado('X', 72.5, -1, WR2 - 0.02, WR, []);
    dado('Y', WL2 + 0.02, 1, 72.5, YN - 0.05, []); dado('Y', WR2 - 0.02, -1, 72.5, YN - 0.05, []);
    dado('X', YN - 0.02, -1, WL2 + 0.08, WR2 - 0.08, [[57.4, 62.6, F - 1, F + 9.0]]);
    // the frieze high in the tall part
    const FZ = F + 13.4;
    f.box(FRIEZE, WL2 + 0.02, WL2 + 0.08, 74.05, YN - 0.05, FZ, FZ + 0.6); f.box(FRIEZE, WR2 - 0.08, WR2 - 0.02, 74.05, YN - 0.05, FZ, FZ + 0.6);
    f.box(FRIEZE, WL2 + 0.08, WR2 - 0.08, YN - 0.08, YN - 0.02, FZ, FZ + 0.6);
    // a mosaic border round the water, just proud of the floor
    for (const [x0, x1, y0, y1] of [[BX0 - 1.1, BX1 + 1.1, BY0 - 1.1, BY0 - 0.5], [BX0 - 1.1, BX1 + 1.1, BY1 + 0.5, BY1 + 1.1], [BX0 - 1.1, BX0 - 0.5, BY0 - 0.5, BY1 + 0.5], [BX1 + 0.5, BX1 + 1.1, BY0 - 0.5, BY1 + 0.5]]) f.box(BORDER, x0, x1, y0, y1, F - 0.05, F + 0.014);

    // loungers: one along each side wall and a daybed in the pocket beside it, round a low table at the pocket's end
    lounger(K, fl(45.3, 59.9, 2), { w: 2.5, towel: MAT.TERRY, towel2: MAT.TERRY2 });
    lounger(K, fl(74.7, 59.9, 2), { w: 2.5, towel: MAT.TERRY, towel2: MAT.TERRY3, fabric: 'linen#b8893a' });
    lounger(K, fl(48.9, 52.2, 1), { w: 2.3, len: 5.3, towel: MAT.TERRY4, towel2: MAT.TERRY, fabric: 'linen#3f5a44' });
    lounger(K, fl(71.1, 52.2, 3), { w: 2.3, len: 5.3, towel: MAT.TERRY, towel2: MAT.TERRY4 });
    for (const X of [49.95, 70.05]) { const d = fl(X, 52.8, 0), h = drumTable(K, d, 0, 0, 0.45, 1.45); candleCluster(K, d, 0.1, -0.08, h, poolFlames, 2, X > 60 ? 2 : 0); }
    // a bath mat at the head of the steps, bronze-and-brass rails down them into the water
    K.bathMat(f.fr(0, 0, F, 0), BX0 - 2.6, (BY0 + BY1) / 2 - 2.0, 1.6, 2.6, MAT.TERRY2);
    for (const Y of [BY0 + 1.2, BY1 - 1.2]) poolRail(K, f.fr(BX0, Y, F, 3), 0, 6, 1, BASIN.deep / 6);

    // wall frames: west faces +X (x runs to -Y), east faces -X (x runs to +Y)
    const wW = (Y, X = WL) => f.fr(X + 0.08, Y, F, 3), wE = (Y, X = WR) => f.fr(X - 0.08, Y, F, 1);
    // the robes over their slatted bench (west, north of the opening), the towels on lit open shelves (east)
    const rw = wW(69.15);
    robes(K, rw, -2.15, 2.15, { n: 3 });
    rw.cushion('wool#f1ebdf', -2.0, -0.9, 0.15, 1.2, 1.5, 1.66, 0.07, { k: 3, n: [6, 6, 1], crown: 0.05, bulge: 0.03, sag: [[0, 0, 0.02, 0.6]], deform: (q) => { q[2] += 0.012 * Math.sin(q[0] * 23) * Math.sin(q[1] * 19); return q; } });      // (a sheepskin: soft, lumpy)
    carafeTray(K, rw, -0.15, 0.62, 1.5);
    towelShelves(K, wE(69.15), 4.3, { d: 1.25, tall: 6.6, lit: true });
    poolWash.push([WR - 1.33, 67.0, WR - 1.33, 71.3, F, 0.4, 1.0, 1.0]);
    // in the tall part: a tiled bench and a tiled planter on each side, opposite ways round
    const bench = (fr, x0, x1, o = {}) => {
      fr.box(TILEB, x0, x1, 0, 1.35, 0, 1.3); fr.box('tile_hex#e7e1d3', x0 - 0.05, x1 + 0.05, -0.02, 1.42, 1.3, 1.42); fr.box(CAP, x0, x1, 1.32, 1.36, 0.12, 1.2);
      fr.block(x0, x1, 0, 1.42, 0, 1.55);
      for (let x = x0 + 1.0; x < x1 - 0.6; x += 2.2) K.seat(fr, x, 0.75, 1.42, 'sit on the tiled bench');
      K.foldedStack(fr, x1 - 0.8, 0.72, 1.42, 3, [MAT.TERRY, MAT.TERRY2, MAT.TERRY], { w: 1.0, d: 0.8, t: 0.14 });
      roll(K, fr, MAT.TERRY3, x1 - 0.8, 0.72, 1.42 + 0.42 + 0.15, 0.15, 0.85);
      K.cushion(fr, x0 + 1.0, 0.3, 1.42, 1.3, 1.1, o.c1 ?? 'linen#ddd2bb', { tilt: 0.25 }); K.cushion(fr, x0 + 2.3, 0.3, 1.42, 1.2, 1.0, o.c2 ?? 'linen#b8893a', { tilt: 0.3 });
      poolLamps.push({ ...lantern(K, fr.sub((x0 + x1) / 2 + 0.6, 0.75, 1.42), 0, 0, poolFlames, { size: 0.42, h: 1.2, candle: 0.35 }), k: 0.8 });
      poolWash.push([...fr.map(x0 + 0.1, 1.36), ...fr.map(x1 - 0.1, 1.36), F, 0.9, 1.2, 1.2]);
    };
    const planter = (fr, x0, x1, palmX) => {
      fr.box(DADO, x0, x1, 0, 1.25, 0, 1.35); for (const [a, b] of [[-0.02, 0.1], [1.15, 1.31]]) fr.box(CAP, x0 - 0.04, x1 + 0.04, a, b, 1.35, 1.43);
      for (const [a, b] of [[x0 - 0.04, x0 + 0.1], [x1 - 0.1, x1 + 0.04]]) fr.box(CAP, a, b, 0.1, 1.15, 1.35, 1.43);
      fr.box('soilbed', x0 + 0.1, x1 - 0.1, 0.1, 1.15, 1.35, 1.38);
      fr.block(x0, x1, 0, 1.31, 0, 1.6);
      const m = (id, x, sc, turn) => f.model(id, fr, x, 0.62, 1.37, 0, { scale: sc, turn });
      m('fern_clump_b', x0 + 1.0, 0.95, 0.3); m('fern_clump_c', x1 - 1.0, 0.95, 2.0); m('mossy_rock_03', (x0 + x1) / 2 - 0.9, 0.13, 0.7); m('st_river_stone', (x0 + x1) / 2 + 1.1, 1.2, 0.4);
      palm(K, L, fr, palmX, 0.62, 1.37, 1.1, Math.round(palmX * 10));
      poolWash.push([...fr.map(x0 + 0.1, 1.32), ...fr.map(x1 - 0.1, 1.32), F, 1.3, 1.1, 1.3]);
    };
    // (frames on the wall at the middle of the tall part, Y 79.25: x is 79.25 - Y on the west, Y - 79.25 on the east)
    const tW = wW(79.25, WL2), tE = wE(79.25, WR2);
    bench(tW, 0.25, 5.0);  planter(tW, -5.0, -0.3, -2.6);            // west: the bench Y 74.25..79, the planter Y 79.55..84.25
    planter(tE, -5.0, -0.25, -2.4); bench(tE, 0.3, 5.0, { c1: 'linen#3f5a44', c2: 'linen#ddd2bb' });      // east: the planter to the south, the bench by the north wall
    f.framed(tW.sub(0, 0.10), 0, 8.05, 8.15, 5.45, 'nile_boat_mosaic', {
      frame: CAP, mat: 0, border: 0.11, label: 'look at the mosaic', reach: 13,
      title: 'A boat on the Nile', kicker: 'Roman mosaic · National Museum Cardiff',
      text: 'A crew works beneath the mast. Beyond the boat, the river is filled with birds, buildings and a crocodile.',
      foot: 'Photographed by Wolfgang Sauber. Wikimedia Commons · CC BY-SA 3.0.'
    });
    // the north wall, either side of the chapel's doors: lit shelves above head height with jars, a fern in a vase, rolled towels
    for (const [x0, x1] of [[46.4, 55.4], [64.6, 73.6]]) {
      const zs = F + 6.3, sh2 = 'tile_hex#e7e1d3';
      f.box(sh2, x0, x1, YN - 0.62, YN - 0.03, zs - 0.14, zs);
      f.box('e#ffb060/1.8', x0 + 0.2, x1 - 0.2, YN - 0.58, YN - 0.54, zs - 0.18, zs - 0.15);
      poolWash.push([x1 - 0.1, YN - 0.035, x0 + 0.1, YN - 0.035, zs, 2.4, 0, 0.9], [x1 - 0.1, YN - 0.035, x0 + 0.1, YN - 0.035, zs - 0.18, -2.6, 0, 0.6]);
      const s2 = f.fr(x0, YN - 0.33, zs, 0);
      // Build the wall shelf as one room furnishing. Each fern grows from its pot's soil.
      s2.lathe(MAT.CLAY, 1, 0, [[0,0],[0.18,0],[0.27,0.19],[0.24,0.45],[0.13,0.56],[0.14,0.61],[0.11,0.61],[0.1,0.49]], { seg: 20 });
      for (const [x,r,h,glaze] of [[2.25,0.23,0.42,MAT.GLAZE],[4.5,0.27,0.68,MAT.GLAZE2]]) {
        const soil = pot(K,s2,x,0,r,h,glaze);
        fern(K,L,s2,x,0,soil,0.32,h*100);
      }
      for (let k = 0; k < 5; k++) roll(K, s2, [MAT.TERRY, MAT.TERRY2, MAT.TERRY3, MAT.TERRY, MAT.TERRY4][k], 6.4 + (k % 3) * 0.32 + (k > 2 ? 0.16 : 0), 0, 0.16 + (k > 2 ? 0.28 : 0), 0.15, 0.5, { rz: Math.PI / 2 });
    }
    // light: up the tiles from the foot of the low walls; down the tiles of the tall part from a cove under its ceiling
    poolWash.push([WL + 0.08, 72.4, WL + 0.08, 66.7, F, 4, 1.2, 0.7], [WL + 0.08, 60.9, WL + 0.08, 53.1, F, 4, 1.2, 0.7], [WR - 0.08, 53.1, WR - 0.08, 60.9, F, 4, 1.2, 0.7], [WR - 0.08, 66.7, WR - 0.08, 72.4, F, 4, 1.2, 0.7]);
    const HT = POOL.ceil ?? 15.5, topH = Math.max(...(POOL.boxes ?? [POOL]).map(b => b.ceil ?? HT)) - 0.2;
    poolWash.push([WL2 + 0.07, YN - 0.1, WL2 + 0.07, 74.1, topH, -7.5, 0, 1.0], [WR2 - 0.07, 74.1, WR2 - 0.07, YN - 0.1, topH, -7.5, 0, 1.0], [WR2 - 0.1, YN - 0.07, WL2 + 0.1, YN - 0.07, topH, -7.5, 0, 1.0]);
    for (const [x0, x1, y0, y1] of [[WL2 + 0.05, WL2 + 0.25, 74.1, YN - 0.1], [WR2 - 0.25, WR2 - 0.05, 74.1, YN - 0.1], [WL2 + 0.25, WR2 - 0.25, YN - 0.25, YN - 0.05]]) f.box('e#ffb060/1.4', x0, x1, y0, y1, topH + 0.02, topH + 0.06);
    for (const c of poolFlames.slice(0, 4)) poolLamps.push({ X: c.X, Y: c.Y, h: c.h + 0.1, k: 0.35 });
    // one picture, over the west lounger: morning mist
    f.framed(wW(56.7).sub(0, 0.0), 0, 5.6, 3.4, 2.18, 'hiroshige_mishima_mist', { frame: 'oak_light#5a4532', title: 'Mishima: Morning Mist', kicker: 'Utagawa Hiroshige, c. 1833/34',
      text: 'From the Fifty-three Stations of the Tokaido: travellers going out of Mishima into the mist, the shrine gate behind them. A woodblock print.', foot: 'Art Institute of Chicago (CC0).' });
    // the chapel's doors are lit by what can be seen: a bronze lantern either side of them (there was one lamp here with
    // no fitting, high in front of the doors: a bright patch on the oak from nowhere)
    for (const X of [56.75, 63.25]) K.sconce(f.fr(X, YN - 0.03, F, 2), 0, 6.1, { kind: 'lantern', lit: true, size: 1.35, metal: MAT.BRONZE, power: 0.26 });
  }

  // =================================================================================================================
  // THE CHAPEL: X 46..74, Y 86..113, floor 0.4, ceiling 19, the shaft at (60, 99.5) r 3. (Laid out in the plan of the
  // first, larger building, where it stood at X 61..89, Y 96..123, and moved by (DX, DY): cfr() and sh() move a point.)
  // =================================================================================================================
  // (campus.js's OCULUS and MEADOW: not imported, since campus.js loads the furnish files and the import would go round in a
  // circle; the shaft stands over the chapel's middle, 13.5 ft in from its door wall, and comes up 2.2 ft above the meadow at 30)
  const OCULUS = { X: CH.cx, Y: CH.Y0 + 13.5, r: 3 }, MEADOW = 30;
  const panes = [], DX = -15, DY = -10, cfr = (X, Y, h, q) => f.fr(X + DX, Y + DY, h, q), sh = ([X, Y]) => [X + DX, Y + DY];
  {
    const ROCK = 'slate#8a7a68', top = CH.ceil - 0.06;
    flat('limestone#5a5248', [[61.2, 96.2], [88.8, 96.2], [88.8, 122.8], [61.2, 122.8]].map(sh), CH.ceil - 0.04, false, [circ(OCULUS.X, OCULUS.Y, OCULUS.r, 28)]);      // (the hole cut as the shell cuts its own: 28 sides, the shaft's radius)
    // a bronze collar where the rock meets the shaft: a flange on the ceiling round the opening and a sleeve a foot up
    // the throat, so that the junction is a made thing
    { const Cz = CH.ceil - F, r0 = OCULUS.r * Math.cos(Math.PI / 28) - 0.05;
      K.put(f.fr(OCULUS.X, OCULUS.Y, F, 0), MAT.BRONZE, K.geom.lathe([[r0, Cz + 1.3], [r0, Cz - 0.18], [r0 + 0.08, Cz - 0.24], [OCULUS.r + 0.5, Cz - 0.24], [OCULUS.r + 0.56, Cz - 0.18], [OCULUS.r + 0.56, Cz - 0.09], [r0 + 0.05, Cz - 0.09], [r0 + 0.05, Cz + 1.3]], { seg: 56 })); }
    // The rock: a lining of dark stone a foot thick on the side walls and the far wall (half that by the door), and
    // the lights cut through it, so that every opening is a niche in the rock with a deep stone reveal and a sill to
    // stand a candle on. One extruded slab a wall, its texture drawn out in long thin layers like the poured layers of
    // Bruder Klaus. map(a, e, h): a along the wall, e out from it, h up -> plan [X, Y].
    const RK = [0.42, 1.7], T1 = 1.0, T2 = 0.5, Z0 = F + 0.02, Z1 = top;
    const lining = (map, outer, holes, thick) => {
      const ccw = P => { let A = 0; for (let i = 0; i < P.length; i++) { const [x0, y0] = P[i], [x1, y1] = P[(i + 1) % P.length]; A += x0 * y1 - x1 * y0; } return A > 0 ? P : P.slice().reverse(); };
      const sh = new THREE.Shape(ccw(outer).map(([u, v]) => new THREE.Vector2(u, v)));
      for (const h of holes) sh.holes.push(new THREE.Path(ccw(h).reverse().map(([u, v]) => new THREE.Vector2(u, v))));
      const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false, curveSegments: 2 }).toNonIndexed(), P = g.attributes.position, n = P.count;
      const B = (u, e, v) => { const [X, Y] = map(u, e); return [X, v, -Y]; }, o0 = B(0, 0, 0), da = B(1, 0, 0).map((c, i) => c - o0[i]), de = B(0, 1, 0).map((c, i) => c - o0[i]), dh = [0, 1, 0];
      const det = da[0] * (de[1] * dh[2] - de[2] * dh[1]) - da[1] * (de[0] * dh[2] - de[2] * dh[0]) + da[2] * (de[0] * dh[1] - de[1] * dh[0]);
      const src = [], uv = [];
      for (let i = 0; i < n; i++) src.push([P.getX(i), P.getY(i), P.getZ(i)]);
      if (det < 0) for (let i = 0; i < n; i += 3) [src[i + 1], src[i + 2]] = [src[i + 2], src[i + 1]];
      for (let t = 0; t < n; t += 3) {
        const [p0, p1, p2] = [src[t], src[t + 1], src[t + 2]], ux = [p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2]], vx = [p2[0] - p0[0], p2[1] - p0[1], p2[2] - p0[2]];
        const nn = [ux[1] * vx[2] - ux[2] * vx[1], ux[2] * vx[0] - ux[0] * vx[2], ux[0] * vx[1] - ux[1] * vx[0]], m = Math.max(...nn.map(Math.abs));
        for (const q of [p0, p1, p2]) { const [u, v, e] = q; uv.push(m === Math.abs(nn[1]) ? u * RK[0] : m === Math.abs(nn[0]) ? e * RK[0] : u * RK[0], m === Math.abs(nn[1]) ? e * RK[0] * 3 + v * RK[1] : v * RK[1]); }
        for (let k = 0; k < 3; k++) { const [u, v, e] = src[t + k], w = B(u, e, v); P.setXYZ(t + k, w[0], w[1], w[2]); }
      }
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
      f.mesh(ROCK, g);
    };
    const rectP = (a0, a1, z0, z1) => [[a0, z0], [a1, z0], [a1, z1], [a0, z1]];
    const archP = (a, zc, w, ht) => archOutline(w, ht, 28).map(([s2, t]) => [a + s2, zc + t]);
    const roundP = (a, zc, d) => Array.from({ length: 40 }, (_, i) => [a + Math.cos(i / 40 * Math.PI * 2) * d / 2, zc + Math.sin(i / 40 * Math.PI * 2) * d / 2]);

    // the lights: lancets in threes on the side walls (the middle one standing higher), the great light on the far
    // wall with a round light either side of it, a rose over the door
    const LW = 2.1, LHt = LW * 1334 / 260, GW = 8.6, GH = GW * 2016 / 1400, RD = 4.4, ROSE = 5.0;
    const lancetsAt = (Yc) => [[-2.85, 3.0], [0, 3.7], [2.85, 3.0]].map(([d, sill]) => ({ a: Yc + d, zc: F + sill + LHt / 2, sill: F + sill }));
    const WEST = [...lancetsAt(102.7), ...lancetsAt(115.8)], EAST = WEST;
    const west = ['life', 'turing', 'fern', 'loop', 'eigen', 'lorenz'], east = ['neuron', 'symmetry', 'physarum', 'tree', 'logistic', 'calculus'];
    const mW = (a, e) => sh([61.02 + e, a]), mE = (a, e) => sh([88.98 - e, a]), mN = (a, e) => sh([a, 122.98 - e]), mS = (a, e) => sh([a, 96.02 + e]);
    lining(mW, rectP(96.02, 122.98, Z0, Z1), WEST.map(l => archP(l.a, l.zc, LW, LHt)), T1);
    lining(mE, rectP(96.02, 122.98, Z0, Z1), EAST.map(l => archP(l.a, l.zc, LW, LHt)), T1);
    const gz = F + 2.8 + GH / 2, rz = F + 12.6, roseZ = F + 13.2;
    lining(mN, rectP(62.02, 87.98, Z0, Z1), [archP(75, gz, GW, GH), roundP(65.6, rz, RD), roundP(84.4, rz, RD)], T1);
    // Match the structural doorway. The oak jambs and head extend through this facing.
    lining(mS, [[62.02, Z0], [72.75, Z0], [72.75, F + 7.8], [77.25, F + 7.8], [77.25, Z0], [87.98, Z0], [87.98, Z1], [62.02, Z1]], [roundP(75, roseZ, ROSE)], T2);
    // the glass, 0.12 out from the wall at the back of each opening; a candle on each lancet's sill
    const E = 0.12, pane = (id, kind, map, a, zc, w, ht, back) => { const [X, Y] = map(a, E), [X1, Y1] = map(a + 1, E), [Xs, Ys] = map(a, 1); const sx = X1 - X, sy = Y1 - Y, nx = Xs - X, ny = Ys - Y; const right = (nx * sy - ny * sx) > 0 ? [sx, sy] : [-sx, -sy];
      panes.push({ id, kind, X, Y, h: zc, w, ht, ux: right[0], uy: right[1], back }); };
    WEST.forEach((l, i) => { pane(west[i], 'lancet', mW, l.a, l.zc, LW, LHt, T1 - E); const [X, Y] = mW(l.a, 0.6); pillar(K, f.fr(X, Y, l.sill, 0), 0, 0, 0.01, 0.4 + (i % 3 === 1 ? 0.2 : 0), 0.12, chapelFlames); });
    EAST.forEach((l, i) => { pane(east[i], 'lancet', mE, l.a, l.zc, LW, LHt, T1 - E); const [X, Y] = mE(l.a, 0.6); pillar(K, f.fr(X, Y, l.sill, 0), 0, 0, 0.01, 0.4 + (i % 3 === 1 ? 0.2 : 0), 0.12, chapelFlames); });
    const [shelfX, shelfY] = mN(75, 0);
    const ledge = f.fr(shelfX, shelfY, F, 2);
    ledge.bev('oak_light#795c41', -3.1, 3.1, -0.03, 1.38, 2.65, 2.80, 0.035);
    for (const x of [-2.4, 2.4]) ledge.bev('walnut', x - 0.09, x + 0.09, 0.3, 1.27, 2.46, 2.65, 0.035);
    pane('ingression', 'great', mN, 75, gz, GW, GH, T1 - E); for (const [d, t] of [[-2.2, 0.7], [-1.7, 0.45], [1.9, 0.55], [2.4, 0.38]]) { const [X, Y] = mN(75 + d, 1.12); pillar(K, f.fr(X, Y, F + 2.8, 0), 0, 0, 0.01, t, 0.14, chapelFlames); }
    pane('snow', 'round', mN, 65.6, rz, RD, RD, T1 - E); pane('benard', 'round', mN, 84.4, rz, RD, RD, T1 - E);
    pane('rose', 'round', mS, 75, roseZ, ROSE, ROSE, T2 - E);
    // amber light from a cove at the foot of the rock, washing up it
    chapelWash.push(...[[62.02, 121.9, 62.02, 96.6, F, 6, 1.2, 1.0], [87.98, 96.6, 87.98, 121.9, F, 6, 1.2, 1.0], [87.9, 121.98, 62.1, 121.98, F, 6, 1.2, 1.0], [62.1, 96.52, 72.3, 96.52, F, 6, 1.0, 1.0], [77.7, 96.52, 87.9, 96.52, F, 6, 1.0, 1.0]].map(([a, b, c, d, ...r]) => [a + DX, b + DY, c + DX, d + DY, ...r]));
    // what each light is (E on it)
    const CAP = {
      life: ["Conway's Life", 'J. H. Conway, 1970', 'Three neighbours and a cell is born; two or three and it stays. It only steps while someone looks at it.'],
      turing: ['Turing patterns', 'A. M. Turing, 1952', "A daisy's head, and an animal's coat: two chemicals spreading at different speeds, spots running into stripes."],
      fern: ["Barnsley's fern", 'M. Barnsley, Fractals Everywhere, 1988', 'Four simple maps, chosen at random over and over: the points they throw fall into a fern, each frond the whole again.'],
      loop: ['A strange loop', 'D. R. Hofstadter, 1979', "Twelve steps, every one of them up, and you are back where you began. Hofstadter thought an 'I' was something like that."],
      eigen: ['Eigen-behaviour', 'H. von Foerster, 1976', 'A tangle smoothed by the same operation again and again until it is a ball: what stays put when the same thing is done to it.'],
      lorenz: ["Lorenz's attractor", 'E. N. Lorenz, 1963', 'Three equations for a little weather: the line never crosses itself and never repeats.'],
      neuron: ["Cajal's neuron", 'S. Ramón y Cajal', 'A pyramidal cell in black paint on amber, as Cajal drew them from the microscope.'],
      symmetry: ['Broken symmetry', 'P. W. Anderson, 1972', 'Compass needles: hot and every which way above; cold and all agreed below, on a direction nothing in the physics prefers.'],
      physarum: ['A slime mould', 'T. Nakagaki, H. Yamada, A. Tóth, Nature, 2000', 'Physarum spread over oat flakes thins its veins to the short ways between them. In a maze it kept only the shortest path.'],
      tree: ["Darwin's tree", 'C. Darwin, Notebook B, 1837', "He wrote 'I think' above it, and then drew. The jewels are the twigs that came through."],
      logistic: ['The logistic map', 'R. M. May, 1976', 'One line of arithmetic, done over and over: it settles, then splits, then stops settling.'],
      calculus: ['A logical calculus', 'W. S. McCulloch and W. Pitts, 1943', 'Nerve cells drawn as switches, each firing or not: the first nets.'],
      ingression: ['Ingressing minds', 'after M. Levin', 'One solid at the top and one line coming down from it: facets, an egg dividing, a flatworm, a tadpole, a frog. One pattern, trying on bodies.'],
      snow: ['A snow crystal', 'after W. A. Bentley and W. J. Humphreys, Snow Crystals, 1931', 'Six arms grown alike from one middle, each branch where the air allowed it; no two the same.'],
      benard: ['Bénard cells', 'H. Bénard, 1900', 'A thin pan of liquid heated from below falls, of its own accord, into hexagons: hot rising in the middle of each, cool sinking at the edges.'],
      rose: ['More is different', 'P. W. Anderson, Science, 1972', "A murmuration of starlings, as in the round window over the door of the chapel in the garden of Anna's House, and Anderson's title in its ring: at each level of complexity entirely new properties appear."],
    };
    for (const p of panes) { const c = CAP[p.id]; if (!c) continue; const nx = p.uy, ny = -p.ux; f.label(f.fr(p.X + nx * 0.3, p.Y + ny * 0.3, F, 0), 0, 0, p.h - F, { label: 'look at the glass', title: c[0], kicker: c[1], text: c[2], size: Math.min(p.w, 3), reach: 14 }); }

    // the table under the shaft: a block of dark stone; a wide bronze bowl of water on it; candles, a singing bowl
    // on its ring cushion, incense; Piaget's sentence cut in its front, as in the garden's chapel
    const T = cfr(75, 109, F, 0), TH2 = 2.1, half = 1.9;
    T.bev('limestone_smooth#615a50', -half, half, -half, half, 0, TH2 - 0.25, 0.04);
    T.bev('limestone_smooth#615a50', -half - 0.12, half + 0.12, -half - 0.12, half + 0.12, TH2 - 0.25, TH2, 0.05);
    T.block(-half - 0.12, half + 0.12, -half - 0.12, half + 0.12, 0, TH2 + 0.5);
    K.put(T, MAT.BRONZE, K.geom.lathe([[0, 0], [0.5, 0], [0.62, 0.05], [1.05, 0.18], [1.32, 0.32], [1.36, 0.36], [1.3, 0.37], [1.0, 0.24], [0.5, 0.14], [0, 0.12]], { seg: 36 }), { at: [0, 0, TH2 + 0.005] });
    const waterH = F + TH2 + 0.3;
    candleCluster(K, T, -1.45, -1.45, TH2, chapelFlames, 3, 0); candleCluster(K, T, 1.5, -1.45, TH2, chapelFlames, 2, 3);
    // the singing bowl, on its cushion, its striker beside it
    K.put(T, 'wool#7a2f2a', K.geom.lathe([[0, 0], [0.24, 0], [0.3, 0.05], [0.24, 0.1], [0.12, 0.08], [0, 0.07]], { seg: 16 }), { at: [-1.45, 1.4, TH2] });
    K.put(T, MAT.BRASS, K.geom.lathe([[0, 0.07], [0.12, 0.07], [0.24, 0.14], [0.3, 0.28], [0.29, 0.3], [0.23, 0.17], [0.1, 0.11], [0, 0.11]], { seg: 24 }), { at: [-1.45, 1.4, TH2] });
    K.put(T, MAT.OAK, K.geom.sweep([[-1.05, 1.15, TH2 + 0.04], [-1.0, 1.65, TH2 + 0.04]], 0.035, { seg: 6 }));
    // incense in a dish of sand; its smoke
    K.put(T, 'plaster#3b3a36', K.geom.lathe([[0, 0], [0.2, 0], [0.24, 0.07], [0.21, 0.07], [0, 0.04]], { seg: 16 }), { at: [1.45, 1.4, TH2] });
    K.put(T, 'plaster#4a2a1e', K.geom.sweep([[1.45, 1.4, TH2 + 0.05], [1.5, 1.42, TH2 + 0.6]], 0.008, { seg: 3 }));
    { const [a, b] = K.world(T, 1.5, 1.42); K.steam.push({ x: a, y: T.h + TH2 + 0.6, z: b }); }
    f.sign(cfr(75, 109 - half - 0.12, F, 2), 0, TH2 - 0.125, 3.9, 0.42, (g, w, h) => {
      g.fillStyle = '#6f675b'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(${i % 2 ? '200,190,170' : '30,26,22'},${0.05 + (i % 5) * 0.015})`; g.fillRect((i * 131) % w, (i * 71) % h, 2 + (i % 4), 1 + (i % 2)); }
      g.font = `italic ${Math.round(h * 0.42)}px ${D.F.goudy}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      const txt = 'Intelligence organises the world by organising itself.';
      g.fillStyle = 'rgba(20,16,12,.7)'; g.fillText(txt, w / 2 + 1.5, h * 0.5 + 1.5); g.fillStyle = '#d8cfbc'; g.fillText(txt, w / 2, h * 0.5);
    }, { rough: 0.9 });
    f.label(cfr(75, 109 - half - 0.12, F, 2), 0, 0.1, TH2 - 0.125, { label: 'read the edge of the table', title: 'Intelligence organises the world by organising itself.', kicker: 'cut in the table',
      text: "Jean Piaget, The Construction of Reality in the Child (La construction du réel chez l'enfant, 1937).\nThe same sentence is cut in the edge of the stone table in the chapel in the garden of Anna's House.", foot: 'Piaget, 1937.' });

    // cushions either side of the table, facing it
    zafu(K, cfr(69.9, 109, F, 3), 0, 0, { mat: 'wool#5a3b34' });
    zafu(K, cfr(80.1, 109, F, 1), 0, 0, { mat: 'wool#33464a' });
    // two plain oak benches by the door, facing the table and the great light
    plankBench(K, cfr(68.4, 100.7, F, 0), -3.3, 3.3); plankBench(K, cfr(81.6, 100.7, F, 0), -3.3, 3.3);
    // blankets folded on the benches; spare cushions and a fern by the walls
    K.foldedStack(cfr(68.4, 100.7, F, 0), 2.4, 0.6, 1.5, 3, ['wool#7a3b30', 'wool#c9b48e', 'wool#3e4a44'], { w: 1.2, d: 0.9, t: 0.12 });
    K.foldedStack(cfr(81.6, 100.7, F, 0), -2.4, 0.6, 1.5, 2, ['wool#c9b48e', 'wool#5a3b34'], { w: 1.2, d: 0.9, t: 0.12 });
    { const s = cfr(86.6, 98.6, F, 1); for (let i = 0; i < 3; i++) { s.cushion(i % 2 ? 'linen#3c3a36' : 'linen#4a3f38', -1.1, 1.1, -1.1, 1.1, 0.02 + i * 0.19, 0.2 + i * 0.19, 0.07, { k: 3, n: [6, 6, 1], crown: 0.025, bulge: 0.015, welt: 0.01 }); }
      K.put(s, 'wool#33464a', K.geom.lathe([[0, 0], [0.55, 0], [0.62, 0.2], [0.55, 0.42], [0, 0.45]], { seg: 20 }), { at: [0.1, 0, 0.6] }); s.block(-1.1, 1.1, -1.1, 1.1, 0, 1.5); }
    { const p = cfr(86.9, 121.0, F, 0), h = pot(K, p, 0, 0, 0.75, 1.3, 'limestone_smooth#857a6c', 'bowl'); fern(K, L, p, 0, 0, h, 1.15, 77); p.block(-0.75, 0.75, -0.75, 0.75, 0, 1.5); }
    // the lectern, beyond the table: the last paragraph of the Origin of Species (first edition, 1859), its first
    // sentence and its last, set as Vesper Street sets them (checked against the first edition there)
    lectern(K, cfr(75, 115.2, F, 2), 0, 0, (g, w, h) => {
      D.paper(g, w, h, '#efe6cf', 7); const gr = g.createLinearGradient(w * 0.44, 0, w * 0.56, 0); gr.addColorStop(0, 'rgba(60,40,20,0)'); gr.addColorStop(0.5, 'rgba(60,40,20,.32)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); g.fillStyle = gr; g.fillRect(w * 0.44, 0, w * 0.12, h);
      const ink = '#2a1c13', m = w * 0.045, cw = w / 2 - m * 2.1, goudy = (s, x, y, px, col, o = {}) => D.T(g, s, x, y, px, col, { f: D.F.goudy, ...o });
      goudy('ON THE ORIGIN OF SPECIES', w * 0.25, h * 0.07, h * 0.034, '#7a4a2a', { ls: 2 }); goudy('CHAP. XIV.   CONCLUSION.', w * 0.75, h * 0.07, h * 0.034, '#7a4a2a', { ls: 2 });
      D.para(g, 'It is interesting to contemplate an entangled bank, clothed with many plants of many kinds, with birds singing on the bushes, with various insects flitting about, and with worms crawling through the damp earth, and to reflect that these elaborately constructed forms, so different from each other, and dependent on each other in so complex a manner, have all been produced by laws acting around us.', m, h * 0.15, h * 0.041, ink, cw, { f: D.F.goudy, lh: 1.34 });
      D.para(g, 'There is grandeur in this view of life, with its several powers, having been originally breathed into a few forms or into one; and that, whilst this planet has gone cycling on according to the fixed law of gravity, from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.', w / 2 + m * 1.1, h * 0.15, h * 0.041, ink, cw, { f: D.F.goudy, lh: 1.34 });
      goudy('Charles Darwin, 1859.', w * 0.75, h * 0.895, h * 0.032, '#7a4a2a', { it: 1 });
      goudy('489', w * 0.25, h * 0.93, h * 0.036, '#7a4a2a');
    });
    // a stand of votive candles in the north-west corner, by the eigen-behaviour light
    {
      const S = cfr(65.0, 120.6, F, 0);
      K.put(S, 'slate#2b2724', K.geom.lathe([[0, 0], [0.5, 0], [0.5, 0.05], [0.1, 0.12], [0.06, 0.2], [0.05, 3.0], [0, 3.0]], { seg: 14 }));
      for (const [z, r, nC] of [[2.0, 0.95, 9], [2.6, 0.6, 6], [3.05, 0.25, 1]]) {
        K.put(S, 'slate#2b2724', K.geom.lathe([[0, z - 0.04], [r, z - 0.04], [r + 0.03, z + 0.03], [r - 0.03, z + 0.03], [r - 0.03, z], [0, z]], { seg: 20 }));
        for (let i = 0; i < nC; i++) { const a = i / nC * Math.PI * 2 + z; taper(K, S, Math.cos(a) * (r - 0.12), Math.sin(a) * (r - 0.12), z, 0.35 + ((i * 5) % 3) * 0.12, chapelFlames); }
      }
      S.block(-0.95, 0.95, -0.95, 0.95, 0, 3.4);
      f.label(S, 0, 0, 3.4, { label: 'look at the candles', note: 'Someone has lit every one of them.' });
    }
    // the one lamp the engine lights here: the table's candles
    f.lamp(75 + DX, 109 + DY, F + TH2 + 2.6, { power: 0.7, kind: 'candle' });
    f.later(ctx => {
      const Wp = (X, Y, h) => f.world(X, Y, h);
      bowl(ctx, Wp, { X: OCULUS.X, Y: OCULUS.Y, h: waterH, r: 1.22 }, { X: OCULUS.X - 1.45, Y: OCULUS.Y + 1.4, h: F + TH2 + 0.2 }, { flames: chapelFlames.filter(c => Math.hypot(c.X - OCULUS.X, c.Y - OCULUS.Y) < 2.6), X: OCULUS.X, Y: OCULUS.Y, r: OCULUS.r, ceil: CH.ceil, top: MEADOW + 2.2 });
      oculus(ctx, Wp, { X: OCULUS.X, Y: OCULUS.Y, r: OCULUS.r, top: CH.ceil, floor: F, table: { h: F + TH2, r: 1.95 } });
    });
  }
  L.flush();

  // ---- what moves and glows ---------------------------------------------------------------------------------------
  f.later(ctx => {
    const Wp = (X, Y, h) => f.world(X, Y, h);
    flames(ctx, Wp, poolFlames, Wp(60, 68, F + 5));
    flames(ctx, Wp, chapelFlames, Wp(OCULUS.X, OCULUS.Y, F + 6));
    poolWater(ctx, Wp, [BASIN.X0, BASIN.X1, BASIN.Y0, BASIN.Y1], F - 0.42, poolLamps);
    steam(ctx, Wp, [BASIN.X0, BASIN.X1, BASIN.Y0, BASIN.Y1], F - 0.45, 480, { tall: [73.5, 90] });
    wash(ctx, Wp, poolWash, Wp(60, 68, F + 5)); wash(ctx, Wp, chapelWash, Wp(OCULUS.X, OCULUS.Y, F + 6));
    glassBoxes(ctx, Wp, panes, CH);
  });
}
