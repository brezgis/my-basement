// laundry.js: The Laundry and The Linen Closet, off the first landing of the stair down (see the README at the root).
//
// THE LAUNDRY, a laundry of dreams thirteen feet square, inside the rock, so lit as if by a skylight. After the
// laundries and sculleries of English country houses (the Victorian laundry at Erddig, the scullery at Lanhydrock: a
// deep fireclay sink under the window, a "Sheila Maid" airer hauled up on a rope, a long table to fold on) and the
// American service rooms of the 1910s and 20s with their floors of one-inch unglazed hexagons, where the shop's name
// was set in the tiles at the door. One idea: a bright, airy room you would happily fold sheets in.
//   the floor   one-inch white hexagons, a black band round the room, black flowers in the field, and ANNA'S /
//               BASEMENT set in black hexes in a ruled panel just inside the door, to be read as you step in
//   north wall  (facing the door) William Morris's Willow Bough (1887) above a white tiled upstand; under an oak
//               counter a washer and a dryer in cream enamel with brass-ringed glass doors (E: a wash, a dry); a
//               Belfast sink with a brass bridge tap (E: the tap) under a "window": a painted drying green, a linen
//               blind lit through; sage cupboards; an oak shelf each side with jars of soap flakes, pegs and blue
//   west wall   the ironing board and the iron, Hokusai's women stretching cloth to dry above it; a Shaker peg rail
//               with a linen apron, a string bag of lemons and a washboard; a stool; a lidded hamper in the corner
//   overhead    the laylight (frosted glass in an oak coffer: daylight by day, warm lamps after dark) over the folding
//               table (oak, a linen pad, baskets beneath); the Sheila Maid over the west aisle with sheets and tea towels
//   east wall   open oak shelves of towels and sheets, baskets, jars and a cream wireless; the closet's door; a clock
//   south wall  lost socks on a line of pegs; and outside, on the landing, the one kitschy laundry plaque (Anna asked)
//   dado        tongue and groove round the plain walls, painted a soft willow green from the paper's leaves
// THE LINEN CLOSET: oak shelves floor to ceiling on two walls: sheets, towels, blankets, spare robes, labelled baskets;
//   brooms, a carpet beater and a dustpan on pegs; a step stool; a schoolhouse light, always on.
//
// STAFF POSTS (for whoever brings the robots: nobody is placed here)
//   The Laundry      X -32.8, Y 40.7, facing south (the folding table)      the laundress: folds sheets and towels on the
//                                                                            linen pad; takes them from the dryer (X -35.9,
//                                                                            Y 40.9, facing north) and from the Sheila Maid
//                                                                            (X -35.6, Y 40.1, facing west: she lowers it)
//   The Laundry      X -33.0, Y 41.9, facing north (the sink)               rinses, soaks, starts a wash (washer X -38.2)
//   The Linen Closet X -23.5, Y 41.8, facing north (the shelves)            puts away and fetches: robes, towels, sheets
//   Things to serve from: the folded stacks on the folding table (X -34.1, Y 38.45, h 23.03), the towel shelves on the
//   laundry's east wall (X -27.2, Y 33.8 to 36.9), the closet's shelves (robes: X -23, Y 44.3, h 26.9).
import { M, machine, dado, basket, hamper, jar, jug, shelving, pegRail, apron, stringBag, washboard, ironingBoard, foldingTable, sheilaMaid, radio, windowFrame, laylightFrame, broom, beater, dustpan, stepStool, stack } from './laundry_parts.js';
import { hexFloor, wallpaper, windowView, laylight, machines, tap, clock } from './laundry_fx.js';
import * as THREE from 'three';

export default function (f) {
  const K = f.kit, D = f.draw, R = f.room('The Laundry'), C = f.room('The Linen Closet');
  const F = R.floor, H = R.ceil - F;                                  // 20, 8.6
  const { X0, X1, Y0, Y1 } = R;                                       // -39.5, -26.5, 32, 45
  const N = X => f.fr(X, Y1, F, 2);                                   // on the north wall, facing the room (x runs to -X)
  const Wf = Y => f.fr(X0, Y, F, 3);                                  // on the west wall (x runs to -Y)
  const S = X => f.fr(X, Y0, F, 0);                                   // on the south wall (x runs to +X)
  const E = Y => f.fr(X1, Y, F, 1);                                   // on the east wall (x runs to +Y)

  // ==== the north wall: the run of counter, machines and sink, the window, the paper ===============================
  // the machines' bay, X -39.45 .. -34.6, under an oak counter with an end panel each side
  const MB = N(-37.0);                                                // x = -37 - X
  const washer = machine(K, MB, 1.2, 'washer'), dryer = machine(K, MB, -1.15, 'dryer');
  MB.bev(M.OAK, 2.32, 2.45, 0.02, 2.04, 0, 2.88, 0.012, { grain: 'z' }); MB.bev(M.OAK, -2.42, -2.3, 0.02, 2.04, 0, 2.88, 0.012, { grain: 'z' });
  MB.bev(M.OAK, -2.4, 2.47, 0.01, 2.08, 2.88, 3.02, 0.02, { grain: 'x' });
  MB.block(-2.4, 2.47, 0, 2.08, 0, 3.02);
  // the sink, and the cupboards to the east (the kit's: fireclay apron sink, brass bridge tap, sage doors, oak top)
  const SK = N(-33.0);
  K.cabinets(SK, 3.1, { top: M.OAK, paint: M.PAINT, sink: { x: 0, apron: true, tap: M.BRASS } });
  const EC = N(-28.95);
  K.cabinets(EC, 4.8, { top: M.OAK, paint: M.PAINT });
  // a white tiled upstand behind the counter, a bullnose on it, the paper above, a cornice
  f.box('c#f1ede4/0.3', X0 + 0.03, X1, Y1 - 0.06, Y1 - 0.002, F + 3.03, F + 3.72);
  for (const [k, z] of [[0, 3.26], [1, 3.49]]) f.box('c#d3cdc1/0.8', X0 + 0.03, X1, Y1 - 0.066, Y1 - 0.06, F + z - 0.008, F + z + 0.008);
  for (let r = 0; r < 3; r++) for (let x = X0 + 0.03 + (r % 2 ? 0.25 : 0.5); x < X1; x += 0.5) f.box('c#d3cdc1/0.8', x - 0.008, x + 0.008, Y1 - 0.066, Y1 - 0.06, F + [3.03, 3.268, 3.498][r], F + [3.252, 3.482, 3.72][r]);
  f.box(M.WHITE, X0 + 0.03, X1, Y1 - 0.1, Y1 - 0.002, F + 3.72, F + 3.8);
  f.box(M.WHITE, X0 + 0.01, X1, Y1 - 0.13, Y1 - 0.002, F + 8.42, F + 8.58);
  const WX = -33.0, WZ0 = 4.1, WH = 3.3, WW = 2.4, BLIND = WZ0 + WH * 0.7;          // the window: its middle, sill, height, width, the blind's foot
  windowFrame(K, SK, 0, WZ0, WW, WH, BLIND);
  // oak shelves each side of the window
  const SW = N(-37.0), SE = N(-28.95);
  K.openShelves(SW, 4.5, [5.35], { fill: false, wood: M.OAK, d: 0.85 });
  K.openShelves(SE, 4.0, [5.35], { fill: false, wood: M.OAK, d: 0.85 });
  const zs = 5.45;
  jar(K, SW, 1.85, 0.42, zs, 0.62, 0.18, 'c#f5f2ea/0.9'); jar(K, SW, 1.38, 0.42, zs, 0.5, 0.16, 'c#b48a58/0.8', 0.8); jar(K, SW, 0.95, 0.42, zs, 0.44, 0.15, 'c#8fa9c9/0.8', 0.6);
  stack(K, SW, 0.05, 0.42, zs, 4, [M.LINEN, M.BLUE, M.LINEN, M.LINEN2], { w: 0.9, d: 0.62, t: 0.07 });
  basket(K, SW, -1.4, 0.42, zs, 1.05, 0.66, 0.42, M.TOWEL);
  K.pottedPlant(SE, 1.4, 0.4, zs, 'trailing', { size: 1.0, pot: 'c#d8cfc0/0.6', block: false });
  stack(K, SE, 0.25, 0.42, zs, 3, [M.TOWEL, M.TOWEL2, M.TOWEL], { w: 1.0, d: 0.66, t: 0.13 });
  jug(K, SE, -0.95, 0.42, zs, 0.7); jar(K, SE, -1.55, 0.42, zs, 0.5, 0.14, 'c#6a4a2c/0.3', 0.85);
  // on the counters: a basket of clean washing on the machines, towels; a fern by the sink (it likes the steam), soap
  basket(K, MB, 1.2, 1.0, 3.02, 1.65, 1.1, 0.5, M.LINEN, { heap: 0.12 });
  stack(K, MB, -1.15, 1.0, 3.02, 4, [M.TOWEL, M.TOWEL, M.TOWEL2, M.TOWEL], { w: 1.1, d: 0.85, t: 0.14 });
  K.pottedPlant(EC, 1.6, 0.85, 3.02, 'fern', { size: 1.45, pot: 'c#b8755a/0.8', block: false });
  K.soapDish(EC, 2.15, 1.55, 3.02); K.posy(EC, -1.3, 0.7, 3.02, ['c#f2ead8/0.8', 'c#e7c64a/0.8', 'c#f2ead8/0.8']);
  stack(K, EC, -0.3, 1.0, 3.02, 3, [M.LINEN, M.BLUE, M.LINEN], { w: 0.85, d: 0.7, t: 0.06 });
  // a rag rug at the sink
  f.rug(-35.0, -30.9, 40.75, 42.55, F + 0.035, 'mat');

  // ==== a ceiling of white-painted boards under the shell's honey ones (fresh, and it throws the light about) =========
  for (const [a0, a1, b0, b1] of [[X0, X1, Y0, Y1], [X1, C.X1, C.Y0, C.Y1]]) {
    f.box('c#f4f0e6/0.8', a0, a1, b0, b1, F + H - 0.04, F + H - 0.008);
    for (let y = b0 + 0.34; y < b1 - 0.1; y += 0.34) f.box('c#cfc8b8/0.8', a0, a1, y - 0.008, y + 0.008, F + H - 0.046, F + H - 0.04);
  }
  // ==== the dado, round the three plain walls =========================================================================
  dado(Wf(37.4), -5.45, 5.4);                                          // west: Y 42.85 .. 32.0
  dado(S(-37.0), -2.33, 2.2);                                          // south, west of the door: X -39.33 .. -34.8
  dado(S(-29.3), -1.5, 1.5);                                           // south, east of the door: X -30.8 .. -27.8
  // ==== the west wall: the ironing, the peg rail =====================================================================
  const IB = Wf(38.1);                                                 // x = 38.1 - Y (Y 36.0 .. 40.2: the washer has 2.7 ft clear before it)
  ironingBoard(K, IB, 1.05);
  f.framed(Wf(38.3), 0, 5.35, 2.4, 1.6, 'la_hokusai_stretching_cloth', { frame: M.OAK, title: 'Women on a Veranda Stretching Cloth to Dry',
    kicker: 'Katsushika Hokusai, about 1799', text: 'A surimono, a privately printed woodblock print for the New Year: women on a veranda pull a long bolt of cloth straight to dry in the wind over the river.', foot: 'Art Institute of Chicago, 1925.3292 (CC0).' });
  const PR = Wf(34.8);                                                 // x = 34.8 - Y
  pegRail(K, PR, -1.4, 2.0, 5.6, [-1.1, -0.1, 0.9, 1.75]);
  apron(K, PR, -1.1, 5.6, M.BLUE); stringBag(K, PR, -0.1, 5.6); washboard(K, PR, 0.9, 5.6);
  K.stool(f.fr(-38.65, 34.75, F, 3), 0, 0, { h: 2.05, wood: M.OAK });
  hamper(K, f.fr(-38.55, 33.0, F, 0), 0, 0, 0.62, 2.0);

  // ==== the folding table, and over it the laylight; the Sheila Maid over the west aisle =================================
  const TC = [-32.8, 38.45], I = f.fr(TC[0], TC[1], F, 0);
  const tb = foldingTable(K, I, 4.4, 2.2);
  stack(K, I, -1.3, 0.05, tb.top, 5, [M.LINEN, M.LINEN, M.BLUE, M.LINEN, M.LINEN2], { w: 1.05, d: 0.8, t: 0.085 });
  basket(K, I, 0.55, 0.0, tb.top, 1.6, 1.1, 0.55, M.LINEN, { heap: 0.14 });
  I.cushion(M.LINEN, 1.35, 2.0, -0.55, 0.5, tb.top, tb.top + 0.03, 0.01, { crown: 0.004 });      // a tea towel, pressed and folded
  for (const [x, fill] of [[-1.4, M.TOWEL], [0, M.LINEN2], [1.4, null]]) basket(K, I, x, 0, tb.shelf, 1.2, 1.45, 0.8, fill);
  const LL = f.fr(TC[0], TC[1], F, 0), lay = laylightFrame(LL, 5.4, 3.4, H, 3, 2);
  f.lamp(TC[0], TC[1], F + 7.1, { power: 0.95, kind: 'lantern' });      // the one lamp the engine lights here: as if from the laylight
  const RK = f.fr(-37.0, 40.1, F, 1);                                  // x = Y - 40.1, y = -(X + 37)
  sheilaMaid(K, RK, 5.0, 6.9, H, Y0 - 40.1, 4.4);
  K.hangingTowel(RK, -0.6, 0, 6.9, 2.8, 0.82, M.LINEN);
  K.hangingTowel(RK, 1.6, -0.6, 6.9, 0.75, 0.62, M.BLUE); K.hangingTowel(RK, 0.7, -0.6, 6.9, 0.75, 0.62, M.LINEN);
  K.hangingTowel(RK, -1.6, 0.6, 6.9, 1.05, 0.58, M.LINEN2); K.hangingTowel(RK, 1.5, 0.3, 6.9, 0.9, 0.7, M.TOWEL);

  // ==== the east wall: towel shelves; the clock over the closet's door ================================================
  const ES = E(35.325), bay = shelving(ES, 6.05, 1.25, [0.32, 1.55, 2.8, 4.05, 5.3, 6.55], 7.4, 2);      // x = Y - 35.325
  for (let i = 0; i < 2; i++) {
    const x = bay(i);
    basket(K, ES, x - 0.72, 0.62, 0.32, 1.3, 1.0, 0.85, i ? M.LINEN2 : M.TOWEL); basket(K, ES, x + 0.72, 0.62, 0.32, 1.3, 1.0, 0.85, i ? null : M.LINEN);
    for (const dx of [-0.72, 0.72]) stack(K, ES, x + dx, 0.6, 1.55, 3, i ? [M.TOWEL2, M.TOWEL, M.TOWEL2, M.TOWEL] : [M.TOWEL, M.TOWEL, M.TOWEL, M.TOWEL], { w: 1.15, d: 0.95, t: 0.17 });
    for (const dx of [-0.72, 0.72]) stack(K, ES, x + dx, 0.6, 2.8, 4, [M.LINEN, M.BLUE, M.LINEN, M.LINEN], { w: 1.15, d: 0.95, t: 0.14 });
  }
  { const x0 = bay(0), x1 = bay(1);
    jar(K, ES, x0 - 0.9, 0.55, 4.05, 0.62, 0.2, 'c#f5f2ea/0.9'); jar(K, ES, x0 - 0.35, 0.55, 4.05, 0.55, 0.18, 'c#b48a58/0.8', 0.8); jar(K, ES, x0 + 0.2, 0.55, 4.05, 0.48, 0.17, 'c#efe6cf/0.9', 0.7);
    K.soapDish(ES, x0 + 0.85, 0.6, 4.05);
    radio(K, ES, x1 - 0.35, 0.6, 4.05); K.pottedPlant(ES, x1 + 0.85, 0.6, 4.05, 'leafy', { size: 0.8, pot: 'c#d8cfc0/0.6', block: false });
    stack(K, ES, x0 - 0.5, 0.6, 5.3, 3, [M.WOOL, M.LINEN, M.WOOL2], { w: 1.2, d: 0.9, t: 0.16 }); basket(K, ES, x0 + 0.75, 0.6, 5.3, 1.0, 0.85, 0.6, M.BLUE);
    stack(K, ES, x1 - 0.6, 0.6, 5.3, 4, [M.TOWEL, M.TOWEL2, M.TOWEL, M.TOWEL], { w: 1.1, d: 0.9, t: 0.15 }); jug(K, ES, x1 + 0.7, 0.6, 5.3, 0.75);
    basket(K, ES, x0, 0.6, 6.55, 1.6, 0.95, 0.65, null); basket(K, ES, x1, 0.6, 6.55, 1.6, 0.95, 0.65, M.LINEN2); }
  const CL = E(40.3);
  f.sign(CL, 0, 7.75, 0.66, 0.66, (g, w) => {
    const c = w / 2; g.fillStyle = '#b8955e'; g.fillRect(0, 0, w, w);
    g.fillStyle = '#f7f3ea'; g.beginPath(); g.arc(c, c, c * 0.99, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#1d1a17'; g.lineWidth = w * 0.012; g.beginPath(); g.arc(c, c, c * 0.86, 0, Math.PI * 2); g.stroke();
    g.fillStyle = '#1d1a17'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Math.round(w * 0.11)}px ${D.F.goudy}`;
    for (let i = 1; i <= 12; i++) { const a = i / 12 * Math.PI * 2; g.fillText(String(i), c + Math.sin(a) * c * 0.68, c - Math.cos(a) * c * 0.68 + w * 0.008); }
    for (let i = 0; i < 60; i++) { const a = i / 60 * Math.PI * 2, r0 = c * (i % 5 ? 0.8 : 0.77); g.lineWidth = i % 5 ? 1 : 2.5; g.beginPath(); g.moveTo(c + Math.sin(a) * r0, c - Math.cos(a) * r0); g.lineTo(c + Math.sin(a) * c * 0.85, c - Math.cos(a) * c * 0.85); g.stroke(); }
  }, { y: 0.05, rough: 0.4, text: 'the clock' });
  K.put(CL, M.OAK, K.geom.lathe([[0.36, 0], [0.47, 0], [0.48, 0.05], [0.45, 0.1], [0.38, 0.1], [0.36, 0.08]], { seg: 28 }), { rx: -Math.PI / 2, at: [0, 0, 7.75] });
  K.put(CL, M.OAK, K.geom.lathe([[0, 0], [0.37, 0], [0.37, 0.04], [0, 0.04]], { seg: 28 }), { rx: -Math.PI / 2, at: [0, 0, 7.75] });

  // ==== the south wall inside: lost socks on a line of pegs (the room's one joke, as Anna allowed) ================================
  { const So = S(-29.3), z = 5.0;
    for (const x of [-1.25, 1.25]) K.put(So, M.BRASS, K.geom.sweep([[x, 0.01, z], [x, 0.12, z], [x, 0.14, z + 0.06]], 0.02, { seg: 5 }));
    K.put(So, M.CORD, K.geom.sweep(Array.from({ length: 11 }, (_, i) => { const u = i / 10; return [-1.25 + 2.5 * u, 0.12, z - Math.sin(u * Math.PI) * 0.08]; }), 0.009, { seg: 3 }));
    const sock = (x, col, flip) => { const s = flip ? -1 : 1, out = [[-0.11, 0], [0.11, 0], [0.11, -0.62], [0.11 + s * 0.02, -0.72], [s * 0.34, -0.74], [s * 0.36, -0.84], [s * 0.3, -0.9], [-0.06 * s, -0.9], [-0.11, -0.8]].map(([a, b]) => [x + a * (flip ? -1 : 1) * (flip ? -1 : 1), b]);
      const zz = z - Math.sin(((x + 1.25) / 2.5) * Math.PI) * 0.08 - 0.03; K.put(So, col, K.geom.extrude(out.map(([a, b]) => [a, zz + b]), 0.1, 0.14));
      So.box(M.OAK, x - 0.03, x + 0.03, 0.08, 0.17, zz - 0.12, zz + 0.1); };
    sock(-0.85, 'c#b5835f/0.95', false); sock(-0.3, 'c#7a93ad/0.95', true); sock(0.25, 'c#e9e2d2/0.95', false); sock(0.8, 'c#8f9f86/0.95', true);
    f.sign(So, 0, 6.0, 2.3, 0.62, (g, w, h) => {
      g.fillStyle = '#f3ecdc'; g.fillRect(0, 0, w, h);
      g.strokeStyle = '#7a93ad'; g.lineWidth = h * 0.04; g.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2f3e52';
      g.font = `600 ${Math.round(h * 0.36)}px ${D.F.caveat}`; g.fillText('Lost socks', w / 2, h * 0.36);
      g.font = `italic ${Math.round(h * 0.24)}px ${D.F.goudy}`; g.fillStyle = '#5d4a36'; g.fillText('seeking their sole mates', w / 2, h * 0.72);
    }, { board: 'c#e9e0cc/0.7', thick: 0.04, text: 'Lost socks, seeking their sole mates' });
  }
  // ==== on the landing, over the door: the kitschy laundry plaque ==========================================================
  { const P = f.fr(-32.8, Y0 - 1.0, F, 2);                               // over the door, on the landing's side of the wall (its face at Y 31)
    f.sign(P, 0, 7.97, 1.4, 0.98, (g, w, h) => {
      // a domed enamel plaque: cream ground, navy rim, a washtub foaming with bubbles, LAUNDRY in a ribbon, the motto
      g.fillStyle = '#1f3552'; g.beginPath(); g.roundRect(0, 0, w, h, h * 0.12); g.fill();
      g.fillStyle = '#f6efdc'; g.beginPath(); g.roundRect(h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1, h * 0.09); g.fill();
      g.strokeStyle = '#c0392b'; g.lineWidth = h * 0.012; g.beginPath(); g.roundRect(h * 0.09, h * 0.09, w - h * 0.18, h - h * 0.18, h * 0.07); g.stroke();
      // the tub
      const cx = w / 2, ty = h * 0.42, tw = w * 0.36;
      g.fillStyle = '#8fa9c9'; g.beginPath(); g.moveTo(cx - tw / 2, ty); g.lineTo(cx + tw / 2, ty); g.lineTo(cx + tw * 0.38, ty + h * 0.2); g.lineTo(cx - tw * 0.38, ty + h * 0.2); g.closePath(); g.fill();
      g.strokeStyle = '#1f3552'; g.lineWidth = h * 0.012; g.stroke();
      g.fillStyle = '#6f8fb5'; for (const k of [0.3, 0.7]) g.fillRect(cx - tw / 2 + tw * 0.08, ty + h * 0.2 * k, tw * 0.84, h * 0.018);
      for (const s of [-1, 1]) { g.beginPath(); g.ellipse(cx + s * tw * 0.53, ty + h * 0.05, h * 0.035, h * 0.025, 0, 0, Math.PI * 2); g.stroke(); }
      // the suds and the bubbles rising
      g.fillStyle = '#ffffff'; g.strokeStyle = '#9fb6d2'; g.lineWidth = h * 0.006;
      for (const [dx, dy, r] of [[-0.14, -0.02, 0.06], [-0.07, -0.05, 0.07], [0.0, -0.03, 0.075], [0.08, -0.05, 0.065], [0.14, -0.02, 0.055], [-0.1, -0.11, 0.035], [0.05, -0.15, 0.03], [0.15, -0.2, 0.025], [-0.02, -0.24, 0.02], [0.22, -0.12, 0.022], [-0.2, -0.17, 0.02]]) { g.beginPath(); g.arc(cx + dx * w, ty + dy * h, r * h, 0, Math.PI * 2); g.fill(); g.stroke(); }
      g.fillStyle = 'rgba(255,255,255,.9)'; for (const [dx, dy, r] of [[0.05, -0.15, 0.03], [0.15, -0.2, 0.025]]) { g.beginPath(); g.arc(cx + dx * w - r * h * 0.3, ty + dy * h - r * h * 0.3, r * h * 0.3, 0, Math.PI * 2); g.fill(); }
      // the ribbon with LAUNDRY on it
      const ry = h * 0.69, rh = h * 0.17;
      g.fillStyle = '#c0392b'; g.beginPath(); g.moveTo(w * 0.1, ry - rh / 2 + h * 0.03); g.lineTo(w * 0.18, ry - rh / 2); g.lineTo(w * 0.82, ry - rh / 2); g.lineTo(w * 0.9, ry - rh / 2 + h * 0.03); g.lineTo(w * 0.86, ry); g.lineTo(w * 0.9, ry + rh / 2 + h * 0.03); g.lineTo(w * 0.1, ry + rh / 2 + h * 0.03); g.lineTo(w * 0.14, ry); g.closePath(); g.fill();
      g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f6efdc'; g.font = `700 ${Math.round(rh * 0.82)}px ${D.F.fraunces}`; g.fillText('L A U N D R Y', w / 2, ry + h * 0.015);
      g.fillStyle = '#1f3552'; g.font = `italic ${Math.round(h * 0.075)}px ${D.F.goudy}`; g.fillText('wash · dry · fold · repeat', w / 2, h * 0.86);
      g.font = `${Math.round(h * 0.05)}px ${D.F.goudy}`; g.fillText('EST. 2026', w / 2, h * 0.16);
      // the enamel's shine and four brass screws
      const sh = g.createLinearGradient(0, 0, w, h); sh.addColorStop(0, 'rgba(255,255,255,.18)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(0, 0, w, h);
      g.fillStyle = '#b08d4a'; for (const [x, y] of [[0.06, 0.1], [0.94, 0.1], [0.06, 0.9], [0.94, 0.9]]) { g.beginPath(); g.arc(x * w, y * h, h * 0.022, 0, Math.PI * 2); g.fill(); }
    }, { board: 'c#1f3552/0.3', thick: 0.03, rough: 0.3, text: 'LAUNDRY: wash, dry, fold, repeat' });
  }

  // ==== THE LINEN CLOSET ===============================================================================================
  { const CF = C.floor, CN = f.fr(-23.0, C.Y1, CF, 2), CE = f.fr(C.X1, 40.0, CF, 1);      // north (x = -23 - X), east (x = Y - 40)
    const zc = [0.32, 1.65, 2.95, 4.25, 5.55, 6.85];
    const bN = shelving(CN, 5.9, 1.45, zc, 8.15, 2), bE = shelving(CE, 6.9, 1.45, zc, 8.15, 2);
    const tags = [];
    const fill = (fr, bx, k) => {
      for (let i = 0; i < 2; i++) {
        const x = bx(i), lo = (a, b) => [x - 0.7, x + 0.7].forEach((xx, j) => a(xx, j, b));
        lo((xx, j) => basket(K, fr, xx, 0.75, zc[0], 1.3, 1.2, 0.9, j ? M.LINEN2 : M.WOOL));
        lo((xx, j) => stack(K, fr, xx, 0.72, zc[1], 3, j ? [M.WOOL2, M.WOOL] : [M.WOOL, M.WOOL3, M.WOOL], { w: 1.25, d: 1.1, t: 0.3 }));      // blankets
        lo((xx) => stack(K, fr, xx, 0.72, zc[2], 5, [M.LINEN, M.LINEN, M.BLUE, M.LINEN, M.LINEN], { w: 1.25, d: 1.05, t: 0.16 }));      // sheets
        lo((xx, j) => stack(K, fr, xx, 0.72, zc[3], 4, j ? [M.TOWEL2, M.TOWEL, M.TOWEL2, M.TOWEL] : [M.TOWEL, M.TOWEL, M.TOWEL, M.TOWEL], { w: 1.2, d: 1.0, t: 0.22 }));
        lo((xx, j) => { basket(K, fr, xx, 0.75, zc[4], 1.2, 1.05, 0.6, j ? M.LINEN : null); tags.push([fr, xx, 1.3, zc[4] + 0.35]); });
        lo((xx, j) => stack(K, fr, xx, 0.72, zc[5], 2, [M.TOWEL, M.TOWEL], { w: 1.25, d: 1.05, t: 0.36 }));      // spare robes, folded
      }
    };
    fill(CN, bN, 0); fill(CE, bE, 1);
    const LABELS = ['TEA TOWELS', 'NAPKINS', 'PILLOWCASES', 'GUEST SOAP', 'CANDLES', 'DUSTERS', 'LAVENDER', 'SPARE SOCKS'];
    tags.forEach(([fr, x, y, z], i) => f.sign(fr.sub(x, y + 0.02, 0, 0), 0, z, 0.62, 0.24, (g, w, h) => {
      g.fillStyle = '#efe6d0'; g.fillRect(0, 0, w, h); g.strokeStyle = '#8a7a62'; g.lineWidth = 2; g.strokeRect(3, 3, w - 6, h - 6);
      g.fillStyle = '#2b2620'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `600 ${Math.round(h * 0.52)}px ${D.F.caveat}`; g.fillText(LABELS[i % LABELS.length].toLowerCase().replace(/^./, c => c.toUpperCase()), w / 2, h * 0.55, w * 0.9);
    }, { text: LABELS[i % LABELS.length] }));
    // two robes on hooks by the door; brooms on a peg rail on the south wall; the step stool; the light
    const RW = f.fr(C.X0, 42.75, CF, 3);                                // x = 42.75 - Y
    for (const x of [-0.42, 0.42]) { K.put(RW, M.BRASS, K.geom.sweep([[x, 0.0, 5.75], [x, 0.16, 5.75], [x, 0.2, 5.85]], 0.022, { seg: 5 })); K.coatOnPeg(RW, x, 0.05, 5.7, x < 0 ? M.TOWEL : M.WOOL, 'coat'); }
    const BR = f.fr(-23.7, C.Y0, CF, 0);                                 // x = X + 23.7
    pegRail(K, BR, -2.1, 2.1, 5.6, [-1.6, -0.6, 0.5, 1.5]);
    broom(K, BR, -1.6, 5.6); beater(K, BR, -0.6, 5.6); dustpan(K, BR, 0.3, 5.6); broom(K, BR, 1.5, 5.6);
    stepStool(f.fr(-22.25, 37.45, CF, 1), 0, 0);
    K.ceilingLight(f.fr(-23.7, 40.3, CF, 0), 0, 0, C.ceil - CF, { kind: 'schoolhouse', lit: true, drop: 1.3 });
    const lp = K.lamps[K.lamps.length - 1]; if (lp) { lp.kind = 'lantern'; lp.power = 0.55; }      // (on at every hour: it is a cupboard)
  }

  // ==== what is drawn on canvases, glows and moves ======================================================================
  const mapPt = (fr, x, y, z) => { const [X, Y] = fr.map(x, y); return [X, Y, fr.h + z]; };
  const wD = mapPt(MB, ...washer.door), dD = mapPt(MB, ...dryer.door), wL = mapPt(MB, ...washer.lamp), dL = mapPt(MB, ...dryer.lamp);
  const mouth = mapPt(SK, 0, 1.05, 3.75), tapAt = mapPt(SK, 0, 0.5, 4.0);
  f.later(ctx => {
    const Wp = (X, Y, h) => f.world(X, Y, h);
    hexFloor(ctx, Wp, { X0: X0, X1: C.X1, Y0: Y0, Y1: Y1, h: F + 0.03, rooms: [[X0 + 0.01, X1, Y0 + 0.02, Y1 - 0.01, 'laundry'], [X1, C.X1 - 0.01, C.Y0 + 0.01, C.Y1 - 0.01, 'plain']], panel: { X: -33.7, Y: 36.0 } });
    wallpaper(ctx, Wp, { y: Y1 - 0.02, tw: 1.443, th: 1.458, url: 'assets/tex/laundry_willow_bough.jpg', room: R,
      rects: [[X0, WX - 1.53, F + 3.8, F + 8.42], [WX + 1.53, X1, F + 3.8, F + 8.42], [WX - 1.53, WX + 1.53, F + WZ0 + WH + 0.34, F + 8.42]] });
    windowView(ctx, Wp, { X0: WX - WW / 2, X1: WX + WW / 2, y: Y1 - 0.03, h0: F + WZ0, h1: F + WZ0 + WH });
    laylight(ctx, Wp, { X0: TC[0] + lay.inner[0], X1: TC[0] + lay.inner[1], Y0: TC[1] + lay.inner[2], Y1: TC[1] + lay.inner[3], h: F + lay.zg, panes: lay.panes.map(([a, b, c, d]) => [TC[0] + a, TC[0] + b, TC[1] + c, TC[1] + d]) });
    machines(ctx, Wp, [{ kind: 'washer', X: wD[0], Y: wD[1], h: wD[2], axis: [0, -1], r: washer.r, depth: 1.25, lamp: wL }, { kind: 'dryer', X: dD[0], Y: dD[1], h: dD[2], axis: [0, -1], r: dryer.r, depth: 1.25, lamp: dL }]);
    tap(ctx, Wp, { mouth, floor: F + 2.25, at: tapAt });
    clockFace(ctx, Wp);
  });
  // the clock's face: white enamel, black numerals, on the lettering sheet; its hands are laundry_fx.js's
  function clockFace(ctx, Wp) { clock(ctx, Wp, { at: [X1 - 0.07, 40.3, F + 7.75], out: [-1, 0], r: 0.33 }); }
}
