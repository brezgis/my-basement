// larder: The Listening Room and The Cave (furnish file of the agent `larder`; small goods in larder_parts.js).
// In the house's settled key (notes/STYLE.md, first section): stone rooms of pale coursed stone, slate and honey boards,
// oak furniture, lit by candles and lanterns and by light on stone; and, for this room at Anna's word, PLUSH and warm
// in its furniture: a friend's den for an evening, after Vesper Street's Low Tide Records (its listening room, its
// crates), Slow Hand Coffee's counter and the rooftop bar's string of small lights (town_walk/site/src/shops/).
//
// THE LISTENING ROOM (X 13.5 to 35.8 by Y 40.8 to 72.5, east to X 42.75 by the courtyard glass; the north part two
//   storeys high with the stair along the north wall (its foot at X 37), the gallery over the west strip and the
//   bridge at Y 59.8 to 64.2). Three places round clear ways (north from the hall's opening, from the cave's door
//   east to the pool's opening, and to the stair's foot):
//   the bar, north-west under the gallery: a thick oak counter under a stone top, the copper machine, plain oak
//     stools, an oak back shelf of wine, cups and jars against the stone with one wash of light down it;
//   the listening lounge, south-west: the record wall in honey oak (records, two big speakers, a valve amplifier,
//     the house's turntable), a deep velvet sofa piled with cushions and a throw, two leather armchairs, a leather
//     ottoman with a tray, a pouf, a big rug, crates of records, a string of small lights, candles;
//   the tasting table, south-east by the glass: one massive oak table, a bench each side, candles, cheese, bread,
//     fruit, wine; a mossy boulder and a fern at the foot of the glass.
//   In the double height: an olive in a clay jar, and an iron corona of candles hung from the bridge (the room's lamp).
// THE CAVE (X -2.5 to 12 by Y 50 to 64, 8 ft): a shallow stone barrel vault of this file's own, the Comté on spruce
//   boards (after the caves of Fort Saint-Antoine, Jura) with a light washing up the vault from the rack's top, a rack
//   of bottles, a stone bench with sheepskins across the west end, a barrel for a table, candles, a candle lantern.
//
// STAFF POSTS (plan X, Y; floor h 0.4 in both rooms):
//   The Listening Room, behind the bar: home [17.5, 64.6], faces [24, 64.6] (east, across the counter to the stools).
//     The aisle behind the counter is 4 ft (X 15.5 to 19.5), open at its south end (Y 60.5).
//     serve: { machine: [17.6, 62.85] (behind the copper machine), pickup: [21.0, 64.9, 3.85] (the counter's top,
//     between the shaker and the pastry dome) }. Drinks: 'brown sugar shaken espresso': { vessel: 'highball',
//     liquid: 0x8a5a33 }, 'espresso': demitasse, 'cortado' and 'flat white': latte, 'filter': mug, 'hot chocolate': mug.
//     A second post at the back counter's grinder [16.0, 67.5].
//   The Listening Room, at the banquette's tables (the tasting is served there): home [35.0, 53.0], faces [39.4, 53.0]
//     (east, to the middle table); posts [35.2, 49.3] and [35.2, 57.4] (the other two tables), the shelf wall [16.0, 49.0]
//     facing west (the quince paste and the apples). Serves the espresso martini, the truffle fries, wine and cheese there.
//   The lounge: a post by the turntable [20.1, 44.4] facing south (2 ft before the record wall).
//   The Cave, the affineur: home [8.5, 60.5], faces [5, 61.5] (the Comté rack); posts [3.6, 59.5] facing north (the
//     rack), [3.6, 52.6] facing south (the bottles), [4.6, 55.0] facing west (the table laid for two).
import * as THREE from 'three';
import { parts, C, EAT } from './larder_parts.js';
import { goods } from './larder_goods.js';
import { flames } from './larder_fx.js';

export default function (f) {
  const FLAMES = [];      // every wick in the two rooms: [{ X, Y, h, s }], drawn alight by larder_fx.js
  const BRUSH0 = 'c#c6c2ba/0.3/1', BAKE0 = 'c#2a1a10/0.35', BLACK0 = 'c#17140f/0.3';
  const K = f.kit, P = parts(K), G = goods(K, P, (fr0, x, y, z, sc) => flameAt(fr0, x, y, z, sc)), D = f.draw, F0 = 0.4, TAU = Math.PI * 2;
  const { ves, hcyl, ball, tube, bottle, bottleEnd, jar, tin, caddy, plate, bowl, wineGlass, tumbler, cupSaucer, cupStack, fruit, grapes, loaf, wheel, wedge, cutWheel, potted, rnd, pick } = P;
  const fr = (X, Y, q = 0, z = 0) => f.fr(X, Y, F0 + z, q);
  const help = (frame, x, y, z, e) => { const [X, Y] = frame.map(x, y); f.help({ at: [X, Y, frame.h + z], reach: 6, ...e }); };
  // ?larderprof: the triangles each part of this file adds, kept in globalThis.__larderTris (for the rooms' budgets)
  const PROF = typeof location !== 'undefined' && new URLSearchParams(location.search).has('larderprof'), tally = {}; let part = 'start';
  if (PROF && !f.B.add.larder) { const add = f.B.add.bind(f.B); f.B.add = Object.assign((mat, g) => { const n = (g.index ? g.index.count : g.attributes.position.count) / 3; tally[part] = (tally[part] ?? 0) + n; return add(mat, g); }, { larder: true }); }
  const prof = name => { part = name; };

  // the palette
  const WAL = 'c#b08250/0.6', WAL2 = 'c#a07446/0.6', WALD = 'c#6a4a2e/0.6', OAK = 'c#c08a58/0.6', HONEY = 'c#c99a62/0.55', STONE = 'c#b8ae9e/0.6', STONE2 = 'c#b0a492/0.85', OAKT = 'oak_light', OAKD = 'c#7a5636/0.6';
  const SPRUCE = C.SPRUCE, BRASS = C.BRASS, COPPER = C.COPPER, GLOW = 'e#ff9a48/1.1', BULB = 'e#ffc070/1.5';
  const GREEN = 'linen#8a9478', OCHRE = 'linen#c9b48a', CREAMW = 'linen#e8e0cc', SHEEP = 'wool#f2ece0', LEATHER = 'linen#d8ccb4';
  const PRES = ['c#d9822a/0.3', 'c#4a1a2a/0.3', 'c#a8401e/0.3', 'c#7a1020/0.3', 'c#d98a2a/0.3', 'c#7a8a3a/0.35', 'c#d9a43a/0.3', 'c#5a1a3a/0.3'];
  const WINE = ['c#1f3a22/0.15', 'c#2a3a1a/0.15', 'c#1a1a14/0.2', 'c#3a2a14/0.2', 'c#1f3a22/0.15', 'c#1a1a14/0.2', 'c#8a7a3a/0.15', 'c#1a2a1a/0.15'];
  // a strip of concealed light: a thin glowing box, tucked under a lip or behind an edge (it glows; it does not cast)
  // (no glowing strips under shelves: the house is lit by flame and by light on stone. strip() is kept as a no-op so
  //  the joinery code reads as before; wash() is the one or two concealed washes a room may have)
  const strip = () => {}, wash = (frame, x0, x1, y0, y1, z0, z1) => frame.box(GLOW, x0, x1, y0, y1, z0, z1);
  // the ceiling's beams (spanya.js FINISHES: 8 along X in each box of the room): a pendant near one hangs from its underside
  const BEAMS = [56.81, 61.84, 66.86, 71.89, 76.91, 81.94, 86.96, 91.99, 61.08, 65.54, 70.0, 74.45, 78.91, 83.37, 87.82, 92.28];
  const hangZ = Y => (BEAMS.some(b => Math.abs(b - Y) < 0.4) ? 11.2 - 0.7 : 11.2) - F0;

  // ---- furniture of the house's language ---------------------------------------------------------------------
  // a low lounge chair on a walnut frame (after Finn Juhl's and Wegner's), facing its frame's front; seat 1.35
  function lounge(frame, x, y, dq, fabric, o = {}) {
    const s = frame.sub(x, y, 0, dq), w = o.w ?? 2.4, hw = w / 2;
    for (const sx of [-hw + 0.08, hw - 0.08]) {
      tube(s, WAL, [[sx, 0.85, 0], [sx, 0.88, 1.05]], 0.06, 4); tube(s, WAL, [[sx, -0.95, 0], [sx, -0.78, 1.15]], 0.06, 4);
      tube(s, WAL, [[sx, 1.02, 1.9], [sx, 0.3, 1.95], [sx, -0.55, 1.88], [sx, -0.95, 1.72]], t => 0.07 - 0.02 * t, 5);      // the arm, sculpted thinner toward the back
      tube(s, WAL, [[sx, 0.88, 1.05], [sx, 0.95, 1.88]], 0.045, 4);
    }
    s.box(WAL, -hw + 0.08, hw - 0.08, 0.75, 0.9, 0.85, 1.02); s.box(WAL, -hw + 0.08, hw - 0.08, -0.9, -0.75, 0.9, 1.08);
    const n = o.seats ?? 1, cw = (w - 0.36) / n;
    for (let i = 0; i < n; i++) {
      const c0 = -hw + 0.18 + i * cw;
      K.put(s, fabric, K.geom.softBox(c0 + 0.02, c0 + cw - 0.02, -0.8, 0.95, 1.02, 1.38, 0.1, { k: 1, n: [1, 1, 1] }), {});
      K.put(s, fabric, K.geom.softBox(c0 + 0.02, c0 + cw - 0.02, -0.14, 0.14, 0, 1.35, 0.09, { k: 1, n: [1, 1, 1] }), { rx: 0.3, at: [0, -0.8, 1.32] });
      f.seat(s, c0 + cw / 2, 0.15, 1.38, o.label ?? 'sit');
    }
    if (o.cushion) K.put(s, o.cushion, K.geom.softBox(-0.45, 0.45, -0.12, 0.12, 0, 0.8, 0.1), { rx: 0.45, at: [-hw + 0.6, -0.45, 1.4] });
    s.block(-hw, hw, -1.0, 1.05, 0, 1.95);
    return s;
  }
  // a low oval walnut table: rx by ry, its top at h
  function ovalTable(frame, x, y, rx, ry, h = 1.5) {
    K.put(frame, WAL, K.geom.lathe([[0, 0], [1, 0], [1.012, 0.04], [1, 0.1], [0, 0.1]], { seg: 28, sx: rx, sy: ry }), { at: [x, y, h - 0.1] });
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) tube(frame, WAL, [[x + sx * rx * 0.55, y + sy * ry * 0.5, h - 0.1], [x + sx * rx * 0.68, y + sy * ry * 0.64, 0]], t => 0.06 - 0.03 * t, 5);
    frame.block(x - rx * 0.8, x + rx * 0.8, y - ry * 0.8, y + ry * 0.8, 0, h);
  }
  // a filament pendant: a clear glass globe on a rod, a glowing filament; zc the ceiling above the frame
  function filament(frame, x, y, zc, zb, cast) {
    frame.cyl(C.BLACK, x, y, zc - 0.05, zc, 0.12, 0.12, 8); frame.cyl(C.BLACK, x, y, zb + 0.62, zc - 0.05, 0.014, 0.014, 4);
    frame.cyl(BRASS, x, y, zb + 0.52, zb + 0.64, 0.06, 0.06, 8);
    ves(frame, 'glass', x, y, zb, [[0, 0], [0.2, 0.06], [0.3, 0.24], [0.28, 0.42], [0.14, 0.53], [0, 0.55]], 10);
    frame.cyl(GLOW, x, y, zb + 0.14, zb + 0.46, 0.022, 0.022, 4); ball(frame, BULB, x, y, zb + 0.1, 0.045, 6);
    if (cast) K.lampAt(frame, x, y, zb + 0.25, cast);
  }
  // a stool of the bar's: a walnut seat on four splayed black steel legs and a brass foot ring
  // a stool of the bar's: a vintage swivel counter stool: an iron pedestal on a domed foot, a brass foot ring on four
  // spokes, the swivel, a crowned and welted seat in the sofa's leather, a low curved back of bent oak
  function barStool(frame, x, y, h = 2.5, turn = 0) {
    const IRONS = 'c#2b2724/0.5/1', LEA = 'leather#f2b878';
    ves(frame, IRONS, x, y, 0, [[0, 0], [0.5, 0], [0.5, 0.03], [0.3, 0.12], [0.08, 0.25], [0, 0.25]], 12);
    frame.cyl(IRONS, x, y, 0.25, h - 0.3, 0.06, 0.06, 10); frame.cyl(IRONS, x, y, h - 0.3, h - 0.18, 0.18, 0.12, 12);      // the column, the swivel
    P.put(frame, BRASS, new THREE.TorusGeometry(0.42, 0.025, 4, 16).translate(x, y, 0.9)); for (let i = 0; i < 4; i++) { const a = i / 4 * TAU + 0.4; tube(frame, IRONS, [[x, y, 0.9], [x + Math.cos(a) * 0.42, y + Math.sin(a) * 0.42, 0.9]], 0.018, 4); }
    ves(frame, LEA, x, y, h - 0.18, [[0, 0], [0.5, 0], [0.56, 0.04], [0.58, 0.1], [0.56, 0.15], [0.45, 0.19], [0, 0.21]], 14);
    P.put(frame, 'c#5a3a22/0.6', new THREE.TorusGeometry(0.575, 0.012, 3, 16).translate(x, y, h - 0.08));      // the welt
    const b = []; for (let i = 0; i <= 8; i++) { const a = turn + Math.PI / 2 + (i / 8 - 0.5) * 2.0; b.push([x + Math.cos(a) * 0.52, y + Math.sin(a) * 0.52, h + 0.55]); }
    tube(frame, OAKT, b, 0.06, 6); for (const k of [0, 8]) tube(frame, IRONS, [[b[k][0] * 0.9 + x * 0.1, b[k][1] * 0.9 + y * 0.1, h], [b[k][0], b[k][1], h + 0.55]], 0.02, 4);
    frame.block(x - 0.5, x + 0.5, y - 0.5, y + 0.5, 0, h); f.seat(frame, x, y, h, 'sit at the bar');
  }
  // a massive plain timber table: top from z 2.2 to 2.5, two slab legs set in from the ends
  function bigTable(frame, L, W, wood = OAK) {
    frame.box(wood, -L / 2, L / 2, -W / 2, W / 2, 2.2, 2.5);
    for (const sx of [-1, 1]) { const x = sx * (L / 2 - 1.3); frame.box(WALD, x - 0.18, x + 0.18, -W / 2 + 0.4, W / 2 - 0.4, 0.15, 2.2); frame.box(WALD, x - 0.3, x + 0.3, -W / 2 + 0.3, W / 2 - 0.3, 0, 0.15); }
    frame.box(WALD, -L / 2 + 1.4, L / 2 - 1.4, -0.12, 0.12, 0.5, 0.75);
    frame.block(-L / 2, L / 2, -W / 2, W / 2, 0, 2.5);
  }
  // a bench: a thick plank with a leather pad, on two slab legs; along its frame's x, sitters facing its front (+y)
  function bench(frame, x, y, L, labels = 2) {
    frame.box(WALD, x - L / 2, x + L / 2, y - 0.5, y + 0.5, 1.12, 1.36);
    pad(frame, x, y, 1.36, L - 0.1, 0.9, LEATHER, 0.16);
    for (const sx of [-1, 1]) frame.box(WALD, x + sx * (L / 2 - 0.5) - 0.15, x + sx * (L / 2 - 0.5) + 0.15, y - 0.4, y + 0.4, 0, 1.12);
    frame.block(x - L / 2, x + L / 2, y - 0.5, y + 0.5, 0, 1.5);
    for (let i = 0; i < labels; i++) f.seat(frame, x - L / 2 + L * (i + 0.5) / labels, y, 1.5, 'sit on the bench');
  }

  // a tea light in a glass, always burning (a candle you need not light: it glows and does not cast)
  function teaLight(frame, x, y, z) { ves(frame, 'glass', x, y, z + 0.006, [[0, 0], [0.09, 0], [0.1, 0.2], [0.09, 0.2], [0, 0.02]], 10); frame.cyl('c#f2e8d2/0.55', x, y, z + 0.02, z + 0.07, 0.075, 0.075, 10); frame.cyl('c#c6c2ba/0.3/1', x, y, z + 0.02, z + 0.075, 0.078, 0.078, 10); flameAt(frame, x, y, z + 0.075, 0.6); }
  // a paper floor lantern (Noguchi's Akari): a tall glowing paper drum on a walnut foot (cream by day, alight after dark)
  function floorLantern(frame, x, y, h = 4.2, r = 0.62) {
    frame.cyl(WALD, x, y, 0, 0.12, 0.35, 0.4, 10); frame.cyl(WALD, x, y, 0.12, 0.5, 0.03, 0.03, 4);
    ves(frame, 'shade', x, y, 0.5, [[r * 0.7, 0], [r, h * 0.25], [r * 1.02, h * 0.6], [r * 0.85, h * 0.92], [r * 0.6, h]], 16); ves(frame, 'shade', x, y, 0.5, [[r * 0.58, h - 0.004], [r * 0.83, h * 0.92], [r * 1.0, h * 0.6], [r * 0.98, h * 0.25], [r * 0.68, 0.004]], 16);
    for (const zz of [0.5 + h * 0.3, 0.5 + h * 0.62]) frame.cyl(WALD, x, y, zz, zz + 0.02, r * 1.03, r * 1.03, 16);
    frame.block(x - r, x + r, y - r, y + r, 0, h + 0.5);
  }
  // a pillar candle, alight (its flame glows: it does not cast)
  function flameAt(frame, x, y, z, sc = 1) { const [X, Y] = frame.map(x, y); FLAMES.push({ X, Y, h: frame.h + z, s: sc }); }
  // a pillar candle, burning: a slightly tapered wax column with a hollow top, a wick, a few drips, a live flame
  function pillarLit(frame, x, y, z, tall = 0.5, r = 0.13) {
    ves(frame, 'c#f2e8d2/0.55', x, y, z, [[0, 0], [r, 0], [r * 0.97, tall * 0.5], [r * 0.94, tall], [r * 0.8, tall - 0.005], [r * 0.5, tall - 0.03], [0, tall - 0.035]], 12);
    for (const a of [0.6, 2.4, 4.1]) P.put(frame, 'c#f2e8d2/0.55', new THREE.SphereGeometry(r * 0.16, 5, 4).scale(1, 1, 2.6).translate(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95, z + tall * (0.72 + (a % 1) * 0.15)));
    frame.cyl('c#1b1612/0.9', x, y, z + tall - 0.04, z + tall + 0.02, 0.006, 0.005, 4); flameAt(frame, x, y, z + tall + 0.01, r > 0.11 ? 1.0 : 0.85);
  }
  // a candle lantern: a square bronze-and-glass box with a ring, a pillar candle alight in it; standing (z) or hanging (hang: the hook's z)
  function candleLantern(frame, x, y, z, s = 0.55, o = {}) {
    const H = s * 1.7, hs = s / 2, m = o.metal ?? 'c#5a4630/0.4/1';
    frame.box(m, x - hs - 0.04, x + hs + 0.04, y - hs - 0.04, y + hs + 0.04, z, z + 0.08);
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) frame.box(m, x + sx * hs - 0.025, x + sx * hs + 0.025, y + sy * hs - 0.025, y + sy * hs + 0.025, z + 0.08, z + H);
    ves(frame, 'glass', x, y, z + 0.08, [[hs * 1.38, 0], [hs * 1.38, H - 0.1], [0, H - 0.1]], 4);
    frame.box(m, x - hs - 0.06, x + hs + 0.06, y - hs - 0.06, y + hs + 0.06, z + H, z + H + 0.06); ves(frame, m, x, y, z + H + 0.06, [[hs * 1.2, 0], [0.04, s * 0.35], [0, s * 0.36]], 4);
    tube(frame, m, [[x - 0.1, y, z + H + s * 0.35], [x, y, z + H + s * 0.5], [x + 0.1, y, z + H + s * 0.35]], 0.015, 3);
    pillarLit(frame, x, y, z + 0.08, H * 0.42, s * 0.2);
    if (o.cast) K.lampAt(frame, x, y, z + H * 0.55, o.cast);
  }
  const put3 = (frame, m, g) => K.put(frame, m, g);
  // soft things, all through the kit's cushion (geom.pillow): a pad lying flat, a cushion standing, a sheepskin
  const pad = (frame, x, y, z, w, d, mat, t = 0.4) => K.cushion(frame, x, y, z + t / 2, w, d, mat, { tilt: Math.PI / 2, thick: t, n: 4 });
  const upright = (frame, x, y, z, w, h, mat, tilt = 0.25, t = 0.42, n = 5) => K.cushion(frame, x, y, z, w, h, mat, { tilt, thick: t, n });
  const sheepskin = (frame, x, y, z, w, d) => K.cushion(frame, x, y, z + 0.08, w, d, SHEEP, { tilt: Math.PI / 2, thick: 0.16, n: 6, dent: 0.02 });
  // a small low armchair: an oak frame, a deep seat pad and a back cushion
  function tub(frame, x, y, mat, label = 'sit') {
    for (const sx of [-0.95, 0.95]) { frame.bev(OAK, x + sx - 0.08, x + sx + 0.08, y - 0.95, y + 0.9, 0, 1.0, 0.03); frame.bev(OAK, x + sx - 0.09, x + sx + 0.09, y - 0.95, y + 0.75, 1.9, 2.0, 0.03); for (const yy of [-0.85, 0.8]) frame.bev(OAK, x + sx - 0.05, x + sx + 0.05, y + yy - 0.05, y + yy + 0.05, 1.0, 1.9, 0.015); }
    frame.bev(OAK, x - 0.95, x + 0.95, y - 0.95, y - 0.8, 0.85, 2.6, 0.03);
    pad(frame, x, y + 0.05, 1.0, 1.8, 1.75, mat, 0.42); upright(frame, x, y - 0.65, 1.5, 1.75, 1.15, mat, 0.22, 0.4);
    frame.block(x - 1.05, x + 1.05, y - 1.0, y + 0.95, 0, 2.0); f.seat(frame, x, y + 0.1, 1.42, label);
  }
  // a small table lamp: a turned honey-oak foot, a paper globe that glows
  function paperLamp(frame, x, y, z) { ves(frame, HONEY, x, y, z, [[0, 0], [0.18, 0], [0.12, 0.08], [0.06, 0.5], [0.04, 0.62], [0, 0.62]], 10); ball(frame, 'shade', x, y, z + 0.6, 0.36, 12, 0.85); }
  // a slatted timber screen along a frame's x, from x0 to x1, h tall: vertical honey slats between two rails
  function slatScreen(frame, x0, x1, h = 6.4) {
    frame.box(WALD, x0, x1, -0.12, 0.12, 0, 0.12); frame.box(HONEY, x0, x1, -0.1, 0.1, h - 0.1, h);
    for (let x = x0 + 0.08; x < x1 - 0.05; x += 0.36) frame.box(HONEY, x, x + 0.14, -0.08, 0.08, 0.12, h - 0.1);
    frame.block(x0, x1, -0.12, 0.12, 0, h);
  }

  // =============================================================================================================
  // THE LISTENING ROOM (X 13.5 to 35.8, Y 40.8 to 72.5, and east to X 42.75 by the glass; the north part, from Y 53.6,
  // is two storeys high, with the gallery over its west strip (X up to 20.5) and the bridge across at Y 59.8 to 64.2)
  // Three places, round two clear ways: one north from the hall's opening (X 27.5 to 32.1), one from the cave's door
  // (Y 55.5 to 58.5) rising east to the pool's opening (Y 61.5 to 66.1), and the foot of the stair (X 32 to 36) kept open.
  //   the bar: north-west, under the gallery, its back bar on the west wall;
  //   the listening lounge: south-west, before the record wall on the south wall;
  //   the tasting table: south-east, by the courtyard glass.
  // =============================================================================================================

  prof('back bar');
  // ---- the back bar on the west wall, under the gallery: an old bar's furniture in honey oak, worn: a deep base cabinet of
  //      panelled doors with brass pulls under a working top (ice well, speed rail, glasses on a cloth), and over it an open
  //      hutch: chamfered posts, nosed shelves with brass gallery rails, a back of dark-stained planks so the bottles read,
  //      a stepped crown. Stocked two and three deep, in groups; two little shaded lamps and candles so the glass sparkles.
  { const B = fr(13.5, 64.4, 3), x0 = -3.9, x1 = 3.9, zt = 3.0;     // x = 64.4 - Y (Y 60.5 to 68.3); +y east, into the room
    B.box(OAKD, x0 + 0.1, x1 - 0.1, 0.2, 1.8, 0, 0.3); B.bev(OAKT, x0, x1, 0.04, 1.95, 0.3, zt - 0.1, 0.02);
    for (let i = 0; i < 4; i++) { const a0 = x0 + 0.08 + i * 1.935, a1 = a0 + 1.86, m = (a0 + a1) / 2;          // four panelled doors, each with a brass bin pull
      B.bev(OAKT, a0, a1, 1.95, 2.0, 0.4, zt - 0.2, 0.012); B.bev(OAKT, a0 + 0.2, a1 - 0.2, 2.0, 2.04, 0.62, zt - 0.42, 0.03);
      B.box(BRASS, m - 0.14, m + 0.14, 2.04, 2.08, zt - 0.62, zt - 0.56); }
    B.bev(OAKT, x0 - 0.06, x1 + 0.06, 0.02, 2.12, zt - 0.1, zt + 0.08, 0.03); P.put(B, OAKT, new THREE.CylinderGeometry(0.09, 0.09, x1 - x0 + 0.12, 10).rotateZ(Math.PI / 2).translate(0, 2.12, zt - 0.01));      // the worn top and its bullnose
    B.block(x0, x1, 0, 2.2, 0, zt + 0.08);
    const z = zt + 0.08;
    // the hutch above
    G.unit(B, x0, x1, [4.55, 5.75, 6.85, 7.85, 8.75], 1.25, 9.6, { base: z, plinth: false, ups: [x0, -1.3, 1.3, x1], backMat: 'c#4a3220/0.6', planks: true, gallery: true, wood: OAKT });
    const LAB = 'c#efe6d2/0.8', LAB2 = 'c#e8d8b0/0.8', AMB = 'c#a86a1e/0.12', GRN = 'c#2a4a22/0.12', CLR = 'c#e4ece8/0.06', BLU = 'c#2a4a7a/0.12', DK = 'c#1a1a14/0.2';
    const row = (sh, xs, y, kinds, cols, o = {}) => xs.forEach((x, i) => G.bottle(B, kinds[i % kinds.length], x, y, sh, cols[i % cols.length], { label: i % 3 === 2 ? LAB2 : LAB, foil: i % 2 ? C.BLACK : null, seg: o.seg ?? 8, spout: o.spout }));
    // shelf 4.55: spirits two deep in the outer bays, pour spouts on the front row; jars and bitters in the middle
    row(4.55, [-3.55, -2.95, -2.1], 0.4, ['liqueur', 'bordeaux', 'liqueur'], [AMB, CLR, GRN, AMB, BLU], { seg: 6 });
    row(4.55, [-3.4, -3.08, -2.6, -2.28, -1.7], 0.85, ['spirit'], [AMB, CLR, AMB, GRN, CLR], { spout: true });
    row(4.55, [1.7, 2.55, 3.5], 0.4, ['bordeaux', 'liqueur'], [GRN, AMB, CLR, AMB, DK], { seg: 6 });
    row(4.55, [1.85, 2.2, 2.7, 3.05], 0.85, ['spirit'], [AMB, AMB, CLR, GRN], { spout: true });
    G.clipJar(B, -0.85, 0.55, 4.55, 0.16, 0.48, 'c#8a1020/0.3'); G.clipJar(B, -0.45, 0.6, 4.55, 0.15, 0.42, 'c#7a8a3a/0.35'); G.clipJar(B, 0.6, 0.55, 4.55, 0.17, 0.52, 'c#3a2214/0.9');
    ves(B, 'glass', 0.15, 0.85, 4.55, [[0, 0], [0.12, 0], [0.12, 0.45], [0, 0.45]], 10); for (let i = 0; i < 5; i++) tube(B, 'c#8a4a22/0.8', [[0.15 + (i - 2) * 0.03, 0.85, 4.6], [0.15 + (i - 2) * 0.04, 0.86, 4.98]], 0.012, 3);      // cinnamon in a jar
    for (let i = 0; i < 2; i++) G.bottle(B, 'spirit', -0.95 + i * 0.3, 1.0, 4.55, ['c#5a2a10/0.2', 'c#3a2214/0.2', 'c#7a1a10/0.2', 'c#3a2214/0.2'][i], { label: 'c#e8d8b0/0.8', seg: 7 });      // bitters, small: drawn at the spirit's shape, low
    // shelf 5.75: coupes and rocks glasses stacked; a seltzer siphon and two decanters; cookbooks, the cocktail book open, a radio
    for (let k = 0; k < 3; k++) for (let i = 0; i < 2; i++) ves(B, 'glass', -2.3 + i * 0.3, 0.7, 5.75 + k * 0.2, [[0, 0], [0.11, 0], [0.12, 0.2], [0.11, 0.2], [0, 0.03]], 10);
    ves(B, 'c#3a6a8a/0.08', -0.6, 0.55, 5.75, [[0, 0], [0.16, 0], [0.17, 0.62], [0.12, 0.7], [0, 0.7]], 12); B.box(BRUSH0, -0.66, -0.54, 0.45, 0.68, 6.45, 6.62); tube(B, BRUSH0, [[-0.6, 0.66, 6.55], [-0.6, 0.85, 6.5]], 0.02, 4);      // the siphon
    for (const [x, c] of [[0.1, 'c#a86a1e/0.12'], [0.55, 'c#e4ece8/0.06']]) { ves(B, 'glass', x, 0.65, 5.75, [[0, 0], [0.16, 0], [0.2, 0.2], [0.14, 0.42], [0.06, 0.5], [0.06, 0.62], [0, 0.62]], 12); ves(B, c, x, 0.65, 5.76, [[0, 0], [0.15, 0], [0.18, 0.18], [0, 0.18]], 10); ball(B, 'glass', x, 0.65, 6.36, 0.07, 8); }
    G.booksFlat(B, 2.1, 0.6, 5.75, 3, ['c#7a2a1e/0.6', 'c#e8dcc4/0.6', 'c#26364f/0.6']); K.openBook(B, 2.15, 0.75, 5.99, {});
    { const x = 3.3; B.bev('c#5a3a22/0.5', x - 0.38, x + 0.38, 0.4, 0.9, 5.75, 6.25, 0.04); B.box('c#c9b48a/0.9', x - 0.32, x + 0.05, 0.9, 0.92, 5.83, 6.17); B.cyl(BAKE0, x + 0.2, 0.92, 6.08, 6.14, 0.06, 0.06, 10); P.put(B, BAKE0, new THREE.CylinderGeometry(0.06, 0.06, 0.06, 10).rotateX(Math.PI / 2).translate(x + 0.2, 0.93, 5.92)); }      // a little radio
    // shelf 6.85: wine in the south bay; a framed photograph leaning and a bunch of dried flowers in the middle; mugs on hooks
    row(6.85, [1.6, 1.9, 2.8, 3.5], 0.5, ['bordeaux', 'burgundy'], [GRN, DK, AMB, GRN], { seg: 6 });
    G.leaningPrint(B, -0.2, 0.25, 6.85, 0.9, 0.7, (g, W, H) => { D.fill(g, W, H, '#e8dcc4'); g.fillStyle = '#7a6a58'; g.fillRect(W * 0.08, H * 0.08, W * 0.84, H * 0.84); g.fillStyle = '#c9b494'; g.fillRect(W * 0.08, H * 0.55, W * 0.84, H * 0.37); g.fillStyle = '#4a3a2a'; g.fillRect(W * 0.3, H * 0.3, W * 0.12, H * 0.4); g.fillRect(W * 0.55, H * 0.25, W * 0.1, H * 0.45); });      // an old photograph: two people outside a shop
    G.jug(B, 0.65, 0.6, 6.85, 0.8, 'c#cbbd9e/0.4'); for (let i = 0; i < 6; i++) { const a = i * 1.05; tube(B, 'c#9a8a5a/0.9', [[0.65, 0.6, 7.3], [0.65 + Math.cos(a) * 0.2, 0.6 + Math.sin(a) * 0.12, 7.75]], 0.008, 3); ball(B, ['c#c9b48a/0.9', 'c#b56a5a/0.9', 'c#e8dcc4/0.9'][i % 3], 0.65 + Math.cos(a) * 0.22, 0.6 + Math.sin(a) * 0.13, 7.72, 0.06, 5); }      // dried flowers
    { const zr = 7.75 - 0.18; hcyl(B, BRASS, 'x', -2.6, 1.0, zr, 2.4, 0.02, 0.02, 6); for (let i = 0; i < 6; i++) { const x = -3.6 + i * 0.4; tube(B, BRASS, [[x, 1.0, zr], [x, 1.08, zr - 0.08]], 0.01, 3); P.put(B, ['c#8a5a3a/0.5', 'c#cbbd9e/0.5', 'c#3e5a46/0.5'][i % 3], P.latheG([[0, 0], [0.1, 0], [0.12, 0.05], [0.12, 0.28], [0.11, 0.28], [0, 0.26]], 10), { rx: Math.PI, at: [x, 1.08, zr - 0.1] }); } }      // hand-thrown mugs on hooks
    ves(B, C.PORC, -3.2, 0.6, 6.85, [[0, 0], [0.12, 0], [0.18, 0.02], [0.19, 0.32], [0, 0.32]], 12); for (let k = 1; k < 5; k++) B.cyl('c#d8d0c0/0.3', -3.2, 0.6, 6.85 + k * 0.035 - 0.004, 6.85 + k * 0.035, 0.195, 0.195, 10);      // a tower of saucers
    // shelf 7.85: crocks and a jar of olives; bottles; shelf 8.75: a trailing plant and big jars
    G.crock(B, -3.3, 0.6, 7.85, 0.8, 'c#cbbd9e/0.5'); G.crock(B, -2.65, 0.6, 7.85, 0.6, 'c#8a5a2a/0.5'); row(7.85, [2.4, 2.75], 0.6, ['liqueur', 'spirit'], [BLU, AMB], { seg: 6 });
    G.clothJar(B, 0.4, 0.6, 8.75, 0.24, 0.62, 'c#d98a2a/0.3', 'c#e8e0cc/0.9'); G.clothJar(B, 3.0, 0.6, 8.75, 0.22, 0.55, 'c#7a8a3a/0.35', 'c#b83a32/0.9');
    // the working top: a steel ice well with a scoop, a speed rail of pouring bottles on the front, glasses upside down
    // on a cloth, a bell jar of the house's croissants, a bowl of lemons and oranges, a bunch of flowers, two lamps, candles
    { B.box('c#c6c2ba/0.25/1', 0.9, 2.1, 0.35, 1.55, z - 0.35, z + 0.02); for (let i = 0; i < 6; i++) ball(B, 'c#e6eef0/0.05', 1.1 + (i % 3) * 0.4, 0.6 + Math.floor(i / 3) * 0.5, z - 0.08, 0.08, 4); tube(B, 'c#c6c2ba/0.2/1', [[1.3, 0.9, z], [1.5, 1.1, z + 0.15]], 0.04, 6);
      B.box('c#c6c2ba/0.25/1', -1.4, 1.4, 2.12, 2.2, zt - 0.75, zt - 0.6); for (let i = 0; i < 4; i++) G.bottle(B, 'spirit', -1.0 + i * 0.62, 2.3, zt - 1.25, [AMB, CLR, AMB, GRN, CLR, AMB][i], { label: LAB, spout: true, seg: 7 });      // the speed rail
      G.cupStack(B, -1.6, 1.05, z, 3, C.PORC); G.cupStack(B, -1.15, 1.2, z, 2, 'c#3a3632/0.3');
      { const x = -0.5, y = 1.2; ves(B, 'c#8a5a32/0.6', x, y, z, [[0, 0], [0.18, 0], [0.32, 0.08], [0.4, 0.2], [0.38, 0.21], [0.3, 0.1], [0, 0.04]], 14); for (const [dx, dy, k] of [[-0.12, -0.06, 'lemon'], [0.12, 0.05, 'orange'], [0, 0.1, 'lemon']]) P.fruit(B, k, x + dx, y + dy, z + 0.05 + (dx === 0 && dy === 0 ? 0.1 : 0), 0.9); }
      K.posy(B, 3.3, 1.0, z, ['c#f2ead8/0.8', 'c#e8b0a8/0.8', 'c#f4dede/0.8'], { jar: 'c#e8dcc4/0.4' });
      // stemware hanging upside down in a rack under the lowest shelf, over the north end of the working top
      for (const y of [0.75]) { B.box(OAKT, -3.1, -0.4, y - 0.04, y + 0.04, 4.36, 4.45); for (let i = 0; i < 4; i++) P.put(B, 'glass', P.latheG([[0.11, 0], [0.11, 0.012], [0.015, 0.03], [0.012, 0.3], [0.07, 0.36], [0.11, 0.46], [0.1, 0.6], [0, 0.6]], 9), { rx: Math.PI, at: [-2.8 + i * 0.6 + (y > 0.7 ? 0.3 : 0), y, 4.34] }); }
      G.tableLampB(B, -3.55, 1.6, z, 1.05); K.lampAt(B, 0, 1.4, 6.2, 0.9);
      pillarLit(B, 2.55, 1.75, z, 0.4, 0.1); pillarLit(B, 2.75, 1.62, z, 0.26, 0.08); }
  }

  prof('glass station');
  // ---- the corner behind the bar, past the end of the back bar (X 13.5 to 16.5, Y 68.3 to 72.5, under the gallery): the
  //      glass station: a deep sink in a stone top, racks of clean glasses on the wall, the dumb-waiter's hatch, a little lamp
  { const Gs = fr(13.5, 70.4, 3), x0 = -2.05, x1 = 2.05;      // x = 70.4 - Y (Y 68.35 to 72.45); +y east
    Gs.box(WAL, x0, x1, 0.04, 1.9, 0.3, 2.98); Gs.box(OAKD, x0 + 0.1, x1 - 0.1, 0.2, 1.75, 0, 0.3); Gs.box(STONE, x0 - 0.02, x1 + 0.02, 0.02, 2.06, 2.98, 3.1);
    Gs.box('c#c6c2ba/0.25/1', -1.3, 0.1, 0.4, 1.6, 2.6, 3.11); Gs.box('c#8a8680/0.3/1', -1.2, 0.0, 0.5, 1.5, 2.62, 2.66);      // the sink
    tube(Gs, 'c#c6c2ba/0.2/1', [[-0.6, 0.25, 3.1], [-0.6, 0.25, 3.9], [-0.6, 0.55, 4.05], [-0.6, 0.85, 3.85]], 0.03, 6);
    Gs.block(x0, x1, 0, 2.06, 0, 3.1);
    // the hatch of the dumb-waiter, in the west wall: an oak door in a brass frame, and its bell-push
    Gs.box(BRASS, 0.35, 1.95, 0.02, 0.07, 3.5, 5.3); Gs.bev(OAK, 0.45, 1.85, 0.07, 0.12, 3.6, 5.2, 0.015); Gs.cyl(BRASS, 1.65, 0.14, 4.4, 4.5, 0.04, 0.04, 8);
    // two racks of clean glasses on the wall above, upside down, and a candle lamp at the end
    for (const z of [6.0, 7.2]) { Gs.bev(OAK, x0 + 0.1, x1 - 0.1, 0.04, 0.85, z - 0.08, z, 0.015); for (let i = 0; i < 6; i++) ves(Gs, 'glass', x0 + 0.45 + i * 0.62, 0.45, z, [[0, 0], [0.1, 0], [0.11, 0.32], [0.1, 0.32], [0, 0.3]], 8); }
    for (let i = 0; i < 4; i++) ves(Gs, 'glass', 1.2 + (i % 2) * 0.3, 1.2 + Math.floor(i / 2) * 0.3, 3.1, [[0, 0], [0.1, 0], [0.11, 0.32], [0.1, 0.32], [0, 0.3]], 8);      // drying on the stone
    Gs.bev('c#e8e0cc/0.9', 0.95, 1.9, 0.9, 1.7, 3.1, 3.12, 0.005);      // on a linen cloth
    G.tableLampB(Gs, -1.7, 1.2, 3.1, 1.0);
  }

  prof('counter');
  // ---- the counter: walnut slats under a honed stone top, the robot's side to the west; the machine, the pastry ------------
  { const Cn = fr(19.5, 64.6, 3), TOP = 3.45, h = 3.4;   // x = 64.6 - Y (Y 61.2 to 68.0); y 0 the robot's side (X 19.5), 2.6 the guests' (X 22.1)
    Cn.box(WALD, -h + 0.2, h - 0.2, 0.45, 2.25, 0, 0.3); strip(Cn, -h + 0.3, h - 0.3, 2.22, 2.26, 0.05, 0.1);
    Cn.box(OAKT, -h, h, 0.1, 2.4, 0.3, 3.2); for (const x of [-h, h]) Cn.bev(OAKT, x - 0.12, x + 0.12, 0.05, 2.55, 0.3, 3.2, 0.03);
    for (let i = 0; i < 28; i++) { const x = -h + 0.14 + i * (2 * h - 0.28) / 27; Cn.cyl(OAKT, x, 2.4, 0.32, 3.15, 0.105, 0.105, 8); }      // the front, fluted: a row of half-round reeds
    Cn.box(BRASS, -h, h, 2.38, 2.52, 0.3, 0.38); Cn.box(BRASS, -h, h, 2.38, 2.52, 3.12, 3.2);
    Cn.box('marble', -h - 0.2, h + 0.2, -0.05, 2.62, 3.2, TOP); hcyl(Cn, 'marble', 'x', 0, 2.62, (3.2 + TOP) / 2, 2 * h + 0.4, (TOP - 3.2) / 2, (TOP - 3.2) / 2, 12);      // a marble top with a rounded front edge
    hcyl(Cn, BRASS, 'x', 0, 3.1, 0.6, 2 * h, 0.04, 0.04, 10); for (const x of [-h + 0.3, 0, h - 0.3]) tube(Cn, BRASS, [[x, 2.52, 0.6], [x, 3.1, 0.6]], 0.03, 5);      // the foot rail
    Cn.block(-h - 0.2, h + 0.2, -0.05, 2.8, 0, TOP);
    // the machine: a two-group lever machine, after the house's (my_house coffee_bar.js), its groups toward the robot:
    // a chrome base on a drip tray with a grate, a copper boiler banded in brass with a domed top and a finial, a gauge,
    // two lever groups with portafilters locked in, a steam wand and a hot-water tap with black knobs, cups warming on top
    { const e = Cn.sub(1.75, 1.0, TOP, 2), CHR = C.CHROME, STL = 'c#9a9a96/0.25/1', BLK = C.BLACK;
      e.soft(CHR, -1.05, 1.05, -0.62, 0.55, 0, 0.42, 0.06); e.box(BRASS, -1.06, 1.06, -0.63, 0.56, 0.36, 0.4);
      e.box(STL, -0.98, 0.98, 0.55, 0.95, 0.06, 0.14); for (let i = 0; i < 13; i++) e.box('c#b9bab4/0.25/1', -0.92 + i * 0.152, -0.89 + i * 0.152, 0.58, 0.92, 0.14, 0.16); e.box(BRASS, -0.98, 0.98, 0.94, 0.97, 0.06, 0.14);
      ves(e, COPPER, 0, -0.08, 0.4, [[0, 0], [0.5, 0], [0.5, 1.12], [0.47, 1.2], [0.42, 1.2], [0.42, 1.25], [0.38, 1.5], [0.24, 1.7], [0.1, 1.78], [0, 1.8]], 24);
      for (const z of [0.62, 1.2]) e.cyl(BRASS, 0, -0.08, z, z + 0.06, 0.515, 0.515, 24);
      ball(e, BRASS, 0, -0.08, 2.18, 0.07, 10); e.cyl(BRASS, 0, -0.08, 2.18, 2.26, 0.035, 0.035, 8); ball(e, BRASS, 0, -0.08, 2.28, 0.09, 10, 1.3);
      hcyl(e, CHR, 'y', 0, 0.44, 1.32, 0.08, 0.15, 0.15, 20); e.cyl('c#efe9dd/0.3', 0, 0.485, 1.17, 1.47, 0.12, 0.12, 16); e.box(BLK, -0.006, 0.006, 0.49, 0.5, 1.32, 1.43, { rot: [0, 0.6, 0] });      // the gauge
      for (const s2 of [-1, 1]) { const x = s2 * 0.74, y = 0.32;
        hcyl(e, CHR, 'x', s2 * 0.6, -0.02, 1.15, 0.3, 0.08);
        e.cyl(CHR, x, y, 0.95, 1.35, 0.17, 0.2, 16); e.cyl(CHR, x, y, 1.35, 1.75, 0.1, 0.1, 12); e.cyl(BRASS, x, y, 1.72, 1.78, 0.12, 0.12, 12);
        tube(e, CHR, [[x, y, 1.72], [x, y + 0.12, 1.95], [x, y + 0.35, 2.35], [x, y + 0.5, 2.55]], 0.03, 8); ball(e, BLK, x, y + 0.5, 2.5, 0.09, 10);      // the lever, up
        e.cyl(CHR, x, y, 0.8, 0.95, 0.15, 0.16, 14); tube(e, BLK, [[x, y + 0.14, 0.87], [x, y + 0.5, 0.86], [x, y + 0.72, 0.84]], 0.04, 8); e.cyl(CHR, x, y, 0.72, 0.8, 0.04, 0.05, 8);      // the portafilter, locked in
        ves(e, C.PORC, x, y + 0.02, 0.16, [[0, 0], [0.06, 0], [0.09, 0.06], [0.09, 0.18], [0.085, 0.18], [0, 0.05]], 12); }
      tube(e, CHR, [[0.45, -0.02, 1.3], [0.85, 0.2, 1.25], [1.0, 0.45, 1.1], [1.0, 0.5, 0.55]], 0.025, 6); ball(e, BLK, 0.52, 0.02, 1.36, 0.06, 8);      // the steam wand
      tube(e, CHR, [[-0.45, -0.02, 1.3], [-0.85, 0.2, 1.25], [-0.98, 0.45, 1.1], [-0.98, 0.5, 0.65]], 0.025, 6); ball(e, BLK, -0.52, 0.02, 1.36, 0.06, 8);      // the hot-water tap
      { const r0 = []; for (let i = 0; i <= 16; i++) { const a = i / 16 * TAU; r0.push([Math.cos(a) * 0.62, Math.sin(a) * 0.62 - 0.08, 2.0]); } }
      const [sx, sz] = K.world(e, 0.74, 0.34); K.steam.push({ x: sx, y: e.h + 0.4, z: sz });
    }
    // on the robot's side: the knock box, the tamper on its mat, milk jugs, saucers stacked, the sugar
    { const z = TOP; Cn.bev(WALD, 0.0, 0.42, 0.1, 0.5, z, z + 0.35, 0.02); Cn.box('c#2a2622/0.6', 0.05, 0.37, 0.15, 0.45, z + 0.34, z + 0.36); hcyl(Cn, BLACK0, 'y', 0.21, 0.3, z + 0.36, 0.4, 0.025, 0.025, 6);
      Cn.box('c#2a2622/0.8', -0.6, -0.25, 0.1, 0.45, z, z + 0.015); ves(Cn, WAL, -0.42, 0.28, z + 0.015, [[0, 0], [0.12, 0], [0.12, 0.08], [0.04, 0.12], [0.05, 0.32], [0, 0.34]], 12);
      for (const [x, yy, s2] of [[3.1, 1.45, 1], [3.25, 1.82, 0.8]]) { ves(Cn, 'c#c6c2ba/0.2/1', x, yy, z, [[0, 0], [0.13 * s2, 0], [0.14 * s2, 0.25 * s2], [0.12 * s2, 0.4 * s2], [0, 0.4 * s2]], 12); tube(Cn, 'c#c6c2ba/0.2/1', [[x + 0.12 * s2, yy, z + 0.35 * s2], [x + 0.22 * s2, yy, z + 0.3 * s2], [x + 0.13 * s2, yy, z + 0.1 * s2]], 0.015, 4); }
      ves(Cn, C.PORC, -1.0, 0.35, z, [[0, 0], [0.16, 0], [0.19, 0.03], [0.19, 0.22], [0, 0.22]], 12); }
    { const x = 3.1, y = 0.7, z = TOP; Cn.box('c#2a2622/0.4', x - 0.22, x + 0.22, y - 0.28, y + 0.28, z, z + 0.95); ves(Cn, 'glass', x, y, z + 0.95, [[0.08, 0], [0.2, 0.4], [0.21, 0.46], [0, 0.46]], 10); ves(Cn, 'c#3a2214/0.9', x, y, z + 0.99, [[0.08, 0], [0.16, 0.28], [0, 0.3]], 8); }
    // the shaker station: brown sugar syrup, a Boston shaker, ice, highballs
    { const z = TOP, y = 0.6;
      bottle(Cn, 0.1, y, z, { r: 0.1, h: 0.85, col: 'c#5a2a10/0.2', label: 'c#e8dcc4/0.8', cap: BRASS });
      ves(Cn, C.CHROME, -0.35, y, z, [[0, 0], [0.12, 0], [0.16, 0.6], [0.155, 0.6], [0, 0.04]], 12); ves(Cn, 'glass', -0.35, y + 0.4, z + 0.006, [[0, 0], [0.1, 0], [0.14, 0.45], [0.13, 0.45], [0, 0.03]], 10);
      ves(Cn, C.CHROME, -1.15, y + 0.15, z, [[0, 0], [0.05, 0], [0.025, 0.07], [0.045, 0.14], [0, 0.14]], 10); ves(Cn, C.CHROME, -1.15, y + 0.45, z, [[0, 0], [0.12, 0], [0.12, 0.01], [0, 0.012]], 12);
      for (const [dx, dy] of [[-0.95, 0.75], [-0.78, 0.6]]) ves(Cn, 'c#e8c73a/0.5', dx, y + dy, z, [[0, 0], [0.08, 0.03], [0.1, 0.09], [0.095, 0.1], [0, 0.1]], 10);
      ves(Cn, C.CHROME, -0.75, y + 0.25, z, [[0, 0], [0.2, 0], [0.23, 0.35], [0.21, 0.35], [0, 0.03]], 12); for (let i = 0; i < 5; i++) ball(Cn, 'c#e6eef0/0.05', -0.75 + (i % 3 - 1) * 0.08, y + 0.25 + (i % 2 - 0.5) * 0.08, z + 0.26, 0.05, 5);
    }
    // the pastry: croissants under a glass dome
    { const x = -1.9, y = 1.55, z = TOP;
      ves(Cn, WAL, x, y, z, [[0, 0], [0.62, 0], [0.64, 0.06], [0, 0.07]], 18);
      for (const [dx, dy, t] of [[-0.18, -0.1, 0.4], [0.2, 0.08, 2.2]]) f.model('croissant', Cn, x + dx, y + dy, z + 0.07, 0, { turn: t });
      ves(Cn, 'glass', x, y, z + 0.07, [[0.6, 0], [0.6, 0.48], [0.5, 0.74], [0.28, 0.88], [0.08, 0.92], [0.05, 1.0], [0, 1.02]], 16);
      help(Cn, x, y, z + 0.3, { name: 'croissant', model: 'croissant', bites: 3, note: 'You finish the croissant. The flakes are everywhere, which is correct.' });
    }
    // filter coffee for anyone who will not wait, at the guests' edge; and the menu card
    { const x = 0.2, y = 1.45, z = TOP;
      ves(Cn, 'glass', x, y, z + 0.006, [[0, 0], [0.2, 0], [0.24, 0.2], [0.1, 0.42], [0.1, 0.5], [0.2, 0.72], [0, 0.72]], 12); ves(Cn, 'c#2e1a0e/0.2', x, y, z + 0.02, [[0, 0], [0.19, 0], [0.22, 0.18], [0.12, 0.34], [0, 0.34]], 10);
      Cn.cyl(WAL, x, y, z + 0.42, z + 0.52, 0.12, 0.12, 10); 
      help(Cn, x, y, z + 0.5, { name: 'cup of filter coffee', drink: { vessel: 'demitasse', liquid: 0x2e1a0e }, note: 'You finish the coffee. Clean, bright, and a little pleased with itself.' }); }
    pillarLit(Cn, 1.72, 2.3, TOP, 0.4, 0.11);      // one candle, between the first two stools
    // the top is kept bare in front of each stool (stools at x 2.6, 0.85, -0.9, -2.65)
    { const z = TOP;      // the mixing glass and its spoon with the shaker; the cut lemons on their board; one drink made, waiting
      ves(Cn, 'glass', -0.5, 1.5, z + 0.006, [[0, 0], [0.14, 0], [0.16, 0.5], [0.15, 0.5], [0, 0.03]], 12); tube(Cn, 'c#c6c2ba/0.2/1', [[-0.55, 1.5, z + 0.1], [-0.43, 1.47, z + 0.75]], 0.008, 3);
      Cn.bev(OAK, -2.7, -1.6, 0.12, 0.62, z, z + 0.06, 0.015); for (const [dx, dy] of [[0.15, 0.08], [0.4, 0.05]]) ves(Cn, 'c#e8c73a/0.5', -2.5 + dx, 0.35 + dy, z + 0.06, [[0, 0], [0.09, 0.03], [0.11, 0.08], [0.1, 0.09], [0, 0.09]], 10);
      tube(Cn, 'c#c6c2ba/0.2/1', [[-2.0, 0.3, z + 0.08], [-1.7, 0.25, z + 0.08]], 0.016, 4); tube(Cn, OAKD, [[-1.7, 0.25, z + 0.08], [-1.5, 0.22, z + 0.08]], 0.025, 5);
      G.coupe(Cn, -0.05, 2.1, z, 'c#c97a3a/0.25'); }
    for (const x of [-1.6, 1.6]) tube(Cn, BRASS, [[x, 2.62, TOP - 0.3], [x, 2.75, TOP - 0.32], [x, 2.78, TOP - 0.5], [x, 2.7, TOP - 0.55]], 0.015, 4);      // purse hooks under the top

  }
  prof('stools');
  { const S = fr(23.3, 64.6, 1); for (const x of [-2.6, -0.85, 0.9, 2.65]) barStool(S, x, 0, 2.5, Math.PI); }      // q 1: x runs north, +y west; four stools facing west, to the counter, backs to the room

  prof('record wall');
  // ---- the record wall on the south wall, west of the hall's opening (X 13.6 to 26.2). Built in three depths: the record
  //      shelves against the wall; a walnut console standing out of them with the decks on a slate plinth and the amps on
  //      an open shelf at eye height; and two big horn speakers standing free on the floor in front of the side bays,
  //      2 ft out from the shelves. The sofa and the armchair face it.
  { const S = fr(19.9, 40.75, 0), x0 = -6.3, x1 = 6.3, d = 1.25, top = 8.3, cb = 2.35;     // x = X - 19.9; y = Y - 40.75, +y north into the room
    const WSPK = 'c#6a4226/0.45', SLATE = 'c#4a6272/0.75', PLINTH = 'c#34312d/0.55', HORN = 'c#b07840/0.45', METAL = 'c#3a3836/0.35/1', BRUSH = 'c#c6c2ba/0.3/1', BAKE = 'c#2a1a10/0.35', RUB = 'c#141210/0.8';
    const latheY = (fr0, mat, prof, x, y, z, seg = 20) => P.put(fr0, mat, P.latheG(prof, seg), { rx: -Math.PI / 2, at: [x, y, z] });      // turned out along +y (toward the room)
    const ring = (fr0, mat, x, y, z, R, r, seg = 24) => P.put(fr0, mat, new THREE.TorusGeometry(R, r, 5, seg).rotateX(Math.PI / 2).translate(x, y, z));
    // spines: records seen end-on, in n bands (one band per shelf; the shelf boards stand in front of the gaps)
    const spines = (seed, n = 1) => (g, W, H) => { const r = D.rnd(seed); D.fill(g, W, H, '#1a120c');
      for (let b = 0; b < n; b++) { const y0 = H * b / n, bh = H / n; let x = r() * 6;
        while (x < W) { const w = 3 + r() * 5, c = ['#2a2622', '#e8e0cc', '#3e5a46', '#b5853a', '#7a2a1e', '#26364f', '#c9b48a', '#5a3a22', '#8a8278', '#1c1c1c'][Math.floor(r() * 10)];
          if (r() < 0.06) { x += 10 + r() * 14; continue; }      // a gap where records are out
          g.fillStyle = c; g.fillRect(x, y0 + bh * (0.06 + r() * 0.05), w - 0.7, bh * 0.86); if (r() < 0.35) { g.fillStyle = 'rgba(240,230,210,0.55)'; g.fillRect(x + w * 0.3, y0 + bh * 0.25, Math.max(0.8, w * 0.3), bh * (0.2 + r() * 0.35)); } x += w; } } };
    const cover = (bg, fg, kind, title) => (g, W, H) => { D.fill(g, W, H, bg);
      if (kind === 0) { for (let i = 0; i < 5; i++) D.disc(g, W * (0.25 + i * 0.12), H * 0.45, W * (0.16 - i * 0.02), i % 2 ? bg : fg); }
      else if (kind === 1) { for (let i = 0; i < 9; i++) D.rect(g, W * 0.12, H * (0.12 + i * 0.07), W * (0.3 + 0.5 * Math.abs(Math.sin(i))), H * 0.035, fg); }
      else if (kind === 2) { D.poly(g, [[W * 0.15, H * 0.75], [W * 0.5, H * 0.15], [W * 0.85, H * 0.75]], fg); D.disc(g, W * 0.5, H * 0.55, W * 0.12, bg); }
      else { for (let i = 0; i < 4; i++) D.rect(g, W * (0.1 + i * 0.2), H * 0.12, W * 0.12, H * 0.62, i % 2 ? fg : '#c9603a'); }
      D.T(g, title, W / 2, H * 0.88, H * 0.06, fg, { f: D.F.goudy, ls: 2, max: W * 0.86 }); };
    const sleeve = (x, z, bg, fg, k, t, y = 1.0) => { S.box('c#1a1612/0.6', x - 0.5, x + 0.5, y - 0.04, y - 0.01, z, z + 1.0, { rot: [-0.08, 0, 0] }); f.sign(S, x, z + 0.5, 0.98, 0.98, cover(bg, fg, k, t), { y: y + 0.01, res: 128, tilt: 0.08 }); };

    // the shelves: a back, four uprights, the record rows, a ledge of sleeves face-out, a crown
    S.box(WAL2, x0, x1, 0.06, 0.12, 0, top);
    for (const x of [x0, -cb, cb, x1]) S.bev(WAL, x - 0.08, x + 0.08, 0.12, d, 0, top, 0.02);
    S.box(WALD, x0, x1, 0.12, d, 0, 0.22);
    for (const sx of [-1, 1]) { const xa = sx < 0 ? x0 + 0.08 : cb + 0.08, xb = sx < 0 ? -cb - 0.08 : x1 - 0.08;      // the side bays, behind the speakers: four rows of records
      for (const z of [1.33, 2.48, 3.63, 4.78]) S.bev(WAL, xa, xb, 0.12, d, z - 0.07, z, 0.015);
      f.sign(S, (xa + xb) / 2, 0.22 + 4.6 / 2, xb - xa, 4.6, spines(70 + sx, 4), { y: 0.95, res: 90 }); }
    for (const z of [5.5, 6.75]) S.bev(WAL, x0, x1, 0.12, d + 0.05, z - 0.08, z, 0.02);
    // the top row of records, cubbies with dividers standing proud
    f.sign(S, 0, 6.75 + 0.52, x1 - x0 - 0.2, 1.04, spines(41), { y: 0.95, res: 100 });
    for (let i = 1; i < 10; i++) { const x = x0 + i * (x1 - x0) / 10; S.box(WAL, x - 0.04, x + 0.04, 0.5, d, 6.75, 7.85); }
    S.bev(WAL, x0 - 0.12, x1 + 0.12, 0.06, d + 0.2, 7.85, 7.97, 0.02); S.bev(WAL, x0 - 0.18, x1 + 0.18, 0.06, d + 0.28, top - 0.33, top, 0.04);
    // the sleeves face-out on the ledge at 5.5: three over the decks, two over each speaker; the middle one is what is playing
    S.box(WAL, x0 + 0.1, x1 - 0.1, d - 0.02, d + 0.04, 5.5, 5.62);      // the lip that holds them
    [[-1.3, '#b5853a', '#1c1712', 0, 'NIGHT HARBOUR'], [0.0, '#26364f', '#e8e0cc', 1, 'SLOW WATER · TRIO'], [1.3, '#e8e0cc', '#3e5a46', 2, 'PINE AND SALT'],
     [-4.95, '#3e5a46', '#e8dcc4', 3, 'COLUMBIA GORGE'], [-3.7, '#e8dcc4', '#7a2a1e', 1, 'MOSS'], [3.7, '#7a2a1e', '#f0e6d2', 2, 'RAIN CITY'], [4.95, '#1c1712', '#d9a43a', 0, 'AFTER HOURS']]
      .forEach(([x, bg, fg, k, t]) => sleeve(x, 5.5, bg, fg, k, t));
    // the amp shelf over the decks, deeper than the rest so the amps stand out of the wall
    S.bev(WAL, -cb + 0.08, cb - 0.08, 0.12, 1.75, 4.15, 4.27, 0.02); S.bev(WAL, -cb + 0.08, cb - 0.08, 1.6, 1.75, 4.0, 4.15, 0.01);

    // ---- the console: walnut, 2.55 high, standing 0.85 out of the shelves, two rows of records in cubbies in its front,
    //      and on it a slate plinth on brass cones carrying the two decks and the mixer
    { const Cs = S.sub(0, 0, 0), ya = 0.12, yb = 2.1, zt = 2.55;
      Cs.box(RUB, -cb + 0.15, cb - 0.15, ya + 0.1, yb - 0.15, 0, 0.18);      // the toe kick, set back
      for (const x of [-cb, cb - 0.1]) Cs.bev(WSPK, x, x + 0.1, ya, yb, 0.18, zt, 0.02);
      Cs.bev(WSPK, -cb, cb, ya, yb, 0.18, 0.28, 0.02); Cs.bev(WSPK, -cb, cb, ya, yb, 1.33, 1.4, 0.01);
      Cs.bev(WSPK, -cb - 0.06, cb + 0.06, ya, yb + 0.06, zt - 0.1, zt, 0.03);
      for (const z of [0.28, 1.4]) f.sign(Cs, 0, z + 0.52, 2 * cb - 0.2, 1.04, spines(11 + z * 10), { y: yb - 0.35, res: 100 });
      for (let i = 1; i < 4; i++) { const x = -cb + i * cb / 2; Cs.box(WSPK, x - 0.04, x + 0.04, yb - 0.6, yb - 0.02, 0.28, zt - 0.1); }
      Cs.block(-cb - 0.06, cb + 0.06, ya, yb + 0.06, 0, zt);
      for (const [x, y] of [[-2.0, 0.45], [2.0, 0.45], [-2.0, 1.75], [2.0, 1.75]]) ves(Cs, BRASS, x, y, zt, [[0, 0], [0.07, 0], [0.02, 0.1], [0, 0.1]], 8);
      Cs.bev(PLINTH, -cb + 0.05, cb - 0.05, 0.3, 1.95, zt + 0.1, zt + 0.38, 0.04); }
    const zd = 2.93;
    // the left deck is the house's record player (E changes the record); the right one is its twin, built here
    f.recordPlayer(S, -1.3, 1.12, zd);
    { const Tt = S.sub(1.3, 1.12, zd);
      Tt.bev('c#2a2622/0.4', -0.85, 0.85, -0.65, 0.65, 0, 0.17, 0.02); Tt.box(BRUSH, -0.8, 0.8, -0.6, 0.6, 0.17, 0.18);
      Tt.cyl(BRUSH, 0.12, 0, 0.18, 0.25, 0.53, 0.53, 32); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; Tt.box('c#e8e0cc/0.5', 0.12 + Math.cos(a) * 0.535 - 0.014, 0.12 + Math.cos(a) * 0.535 + 0.014, Math.sin(a) * 0.535 - 0.014, Math.sin(a) * 0.535 + 0.014, 0.19, 0.23); }      // strobe dots on the platter's rim
      Tt.cyl('c#17140f/0.2', 0.12, 0, 0.25, 0.262, 0.5, 0.5, 32); Tt.cyl('c#c9603a/0.6', 0.12, 0, 0.262, 0.266, 0.16, 0.16, 18); Tt.cyl(BRUSH, 0.12, 0, 0.266, 0.33, 0.012, 0.012, 6);
      Tt.cyl(BRUSH, -0.62, -0.38, 0.18, 0.37, 0.07, 0.06, 12); tube(Tt, BRUSH, [[-0.8, -0.45, 0.38], [-0.62, -0.38, 0.38], [-0.4, 0.05, 0.37], [-0.32, 0.28, 0.36]], 0.013, 6);
      Tt.cyl(METAL, -0.86, -0.47, 0.34, 0.42, 0.055, 0.055, 10); Tt.box(RUB, -0.36, -0.26, 0.24, 0.36, 0.3, 0.35); Tt.box('c#b5853a/0.4', -0.33, -0.29, 0.26, 0.31, 0.29, 0.3);
      Tt.cyl(BRUSH, -0.45, -0.5, 0.18, 0.28, 0.025, 0.025, 6); Tt.box(BRUSH, -0.48, -0.42, -0.5, -0.35, 0.28, 0.3);
      Tt.cyl(BRUSH, 0.62, 0.5, 0.18, 0.21, 0.04, 0.04, 8); }
    // the mixer between them: big bakelite knobs, two VU meters glowing amber
    { const Mx = S.sub(0, 1.12, zd);
      Mx.bev('c#1a1816/0.4', -0.33, 0.33, -0.55, 0.55, 0, 0.26, 0.02); Mx.box(BRUSH, -0.3, 0.3, -0.52, 0.52, 0.26, 0.27);
      for (const [x, y] of [[-0.14, 0.32], [0.14, 0.32], [-0.14, 0.05], [0.14, 0.05], [0, -0.2]]) { Mx.cyl(BAKE, x, y, 0.27, 0.36, 0.075, 0.065, 12); Mx.box('c#e8e0cc/0.5', x - 0.006, x + 0.006, y + 0.02, y + 0.06, 0.36, 0.362); }
      Mx.bev('c#1a1816/0.4', -0.33, 0.33, -0.55, -0.4, 0.26, 0.62, 0.015);
      for (const x of [-0.15, 0.15]) { Mx.box('e#ffb060/0.9', x - 0.12, x + 0.12, -0.395, -0.385, 0.36, 0.55); Mx.box('c#17140f/0.5', x - 0.004, x + 0.004, -0.385, -0.38, 0.38, 0.52, { rot: [0, 0.4 * (x > 0 ? 1 : -0.6), 0] }); } }
    // the "now playing" sleeve leaning on the shelves behind the mixer, and the record brush
    S.box('c#1a1612/0.6', -0.42, 0.42, 0.42, 0.45, zd + 0.02, zd + 0.86, { rot: [-0.12, 0, 0] }); f.sign(S, 0, zd + 0.44, 0.82, 0.82, cover('#c9603a', '#f0e6d2', 0, 'LATE TRAMS'), { y: 0.47, res: 128, tilt: 0.12 });
    S.bev(OAK, 2.0, 2.22, 1.7, 1.9, zd, zd + 0.06, 0.01); S.box('c#3a3632/0.9', 2.02, 2.2, 1.72, 1.88, zd + 0.06, zd + 0.1);

    // ---- the amps on their shelf at eye height: a big valve amplifier, chrome, four power valves glowing orange in front of
    //      three black transformer cans; beside it a solid one with a black glass face and two blue-green meters
    { const zA = 4.27, Va = S.sub(-1.1, 1.05, zA);
      Va.bev(BRUSH, -1.1, 1.1, -0.6, 0.6, 0, 0.3, 0.03); Va.bev(BAKE, -1.12, 1.12, 0.58, 0.64, 0, 0.32, 0.01);
      for (const x of [-0.72, 0, 0.72]) Va.bev(RUB, x - 0.25, x + 0.25, -0.55, -0.15, 0.3, 0.78, 0.04);
      for (let i = 0; i < 4; i++) { const x = -0.78 + i * 0.52;
        P.put(Va, 'glass', P.latheG([[0.1, 0], [0.12, 0.08], [0.13, 0.3], [0.12, 0.5], [0.08, 0.62], [0.03, 0.66], [0, 0.67]], 12), { at: [x, 0.25, 0.3] });
        Va.cyl(BAKE, x, 0.25, 0.3, 0.38, 0.12, 0.12, 12); Va.box(METAL, x - 0.07, x + 0.07, 0.21, 0.29, 0.42, 0.78); Va.cyl('e#ff7a2a/1.6', x, 0.25, 0.42, 0.74, 0.035, 0.035, 6);
        Va.cyl('c#8a8a86/0.2/1', x, 0.25, 0.84, 0.9, 0.06, 0.06, 8); }      // the silvered getter at the top
      for (const x of [-0.28, 0.28]) { P.put(Va, 'glass', P.latheG([[0.06, 0], [0.065, 0.28], [0.03, 0.34], [0, 0.35]], 10), { at: [x, -0.05, 0.3] }); Va.cyl('e#ff8a3a/1.2', x, -0.05, 0.35, 0.55, 0.02, 0.02, 5); }
      for (const x of [-0.55, 0, 0.55]) hcyl(Va, BAKE, 'y', x, 0.67, 0.16, 0.07, 0.075, 0.075, 12);
      Va.box('e#ffb060/0.9', 0.78, 0.98, 0.645, 0.65, 0.1, 0.22); }
    { const zA = 4.27, Mc = S.sub(1.3, 1.0, zA);
      Mc.bev('c#1a1816/0.4', -0.9, 0.9, -0.55, 0.5, 0, 0.62, 0.02); Mc.box('c#101418/0.08', -0.87, 0.87, 0.5, 0.53, 0.04, 0.6);
      for (const x of [-0.4, 0.4]) { Mc.box('e#5ad0c0/0.7', x - 0.28, x + 0.28, 0.53, 0.535, 0.32, 0.54); Mc.box('c#17140f/0.5', x - 0.005, x + 0.005, 0.536, 0.54, 0.34, 0.5, { rot: [0, 0.35, 0] }); }
      for (let i = 0; i < 5; i++) hcyl(Mc, 'c#d4d6d8/0.15/1', 'y', -0.66 + i * 0.33, 0.57, 0.16, 0.07, 0.06, 0.06, 12);
      Mc.box(BRUSH, -0.9, 0.9, -0.55, 0.5, 0.62, 0.64); }

    // ---- the speakers: free-standing horn speakers 2 ft out from the shelves, each a walnut bass bin on a plinth with one
    //      15-inch woofer deep in a cast ring (you see down into the cone), two bass ports you see into, and on top a big
    //      round wooden horn on a cradle, the compression driver's black can behind its throat, a little tweeter horn above
    function woofer(fr0, x, y, z) {
      latheY(fr0, METAL, [[0.6, 0], [0.74, 0], [0.74, 0.08], [0.7, 0.3], [0.6, 0.3], [0.6, 0]], x, y, z, 18);      // the cast ring, standing 0.3 out of the baffle
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; hcyl(fr0, BRUSH, 'y', x + Math.cos(a) * 0.67, y + 0.31, z + Math.sin(a) * 0.67, 0.03, 0.022, 0.022, 6); }
      ring(fr0, RUB, x, y + 0.27, z, 0.57, 0.035, 16);                                                                         // the surround
      latheY(fr0, 'c#2a2826/0.9', [[0.56, 0.27], [0.45, 0.2], [0.32, 0.12], [0.18, 0.05], [0.13, 0.04], [0, 0.04]], x, y, z, 18);      // the cone, going in deep
      latheY(fr0, 'c#1a1816/0.6', [[0.13, 0.04], [0.1, 0.1], [0.05, 0.125], [0, 0.13]], x, y, z, 12);                        // the dust cap
    }
    for (const sx of [-1, 1]) {
      const Sp = S.sub(sx * 3.85, 3.35, 0), hw = 1.2, dd = 1.9, H = 3.0;      // front at local y 0 (Y 44.1), back at -1.9
      Sp.box(RUB, -hw + 0.15, hw - 0.15, -dd + 0.15, -0.15, 0, 0.22);
      Sp.bev(WSPK, -hw, hw, -dd, -0.1, 0.22, H, 0.06);
      for (const x of [-hw, hw - 0.12]) Sp.bev(WSPK, x, x + 0.12, -0.12, 0, 0.22, H, 0.03);      // the face frame, standing proud
      for (const z of [0.22, H - 0.12]) Sp.bev(WSPK, -hw, hw, -0.12, 0, z, z + 0.12, 0.03);
      Sp.box(SLATE, -hw + 0.12, hw - 0.12, -0.12, -0.08, 0.34, H - 0.12);
      woofer(Sp, 0, -0.08, 1.75);
      for (const x of [-0.6, 0.6]) { latheY(Sp, METAL, [[0.14, 0], [0.19, 0], [0.19, 0.04], [0.14, 0.04], [0.14, -0.35]], x, -0.08, 0.68, 14); latheY(Sp, RUB, [[0, -0.35], [0.14, -0.35], [0, -0.349]], x, -0.08, 0.68, 12); }
      Sp.box(BRASS, -0.25, 0.25, -0.08, -0.065, 2.72, 2.8);
      // the horn: a cradle of two walnut blocks, the horn turned out toward the room (its mouth flush with the bin's face)
      for (const y of [-1.5, -0.55]) Sp.bev(WSPK, -0.5, 0.5, y - 0.15, y + 0.15, H, H + 0.45, 0.03);
      const hz = H + 0.95, hy = -1.35;
      latheY(Sp, HORN, [[0.12, 0], [0.16, 0.1], [0.24, 0.35], [0.38, 0.65], [0.58, 0.95], [0.82, 1.2], [0.92, 1.28], [0.95, 1.32], [0.88, 1.3], [0.78, 1.2], [0.54, 0.95], [0.34, 0.65], [0.2, 0.35], [0.12, 0.1], [0.08, 0.02]], 0, hy, hz, 22);
      latheY(Sp, RUB, [[0, 0.03], [0.09, 0.03], [0, 0.032]], 0, hy, hz, 10);                                  // the dark throat
      hcyl(Sp, RUB, 'y', 0, hy - 0.3, hz, 0.42, 0.24, 0.27, 16); hcyl(Sp, BRUSH, 'y', 0, hy - 0.06, hz, 0.06, 0.13, 0.13, 12);      // the driver's can, its brass-ringed neck
      Sp.box(BRASS, -0.22, 0.22, hy - 0.52, hy - 0.5, hz - 0.08, hz + 0.08);
      // the tweeter: a small horn on a short post on the bin's top, behind the big horn's bell
      { const tz = H + 1.95, ty = -1.0; Sp.cyl(METAL, 0, ty - 0.2, H + 0.45, tz - 0.1, 0.03, 0.03, 6);
        latheY(Sp, 'c#2a2622/0.4', [[0.04, 0], [0.08, 0.08], [0.16, 0.2], [0.2, 0.25], [0.17, 0.24], [0.07, 0.08], [0.03, 0.01]], 0, ty, tz, 14);
        hcyl(Sp, RUB, 'y', 0, ty - 0.12, tz, 0.14, 0.08, 0.08, 10); }
      Sp.block(-hw, hw, -dd, 0, 0, H + 2.2);
    }
  }

  prof('shelf wall');
  // ---- the shelf wall on the west wall, south of the cave's door: preserves, teas and coffees, lit under every shelf -----
  { const Pq = fr(13.5, 48.4, 3), x0 = -5.9, x1 = 5.9, d = 1.0;      // x = 48.4 - Y (Y 42.5 to 54.3); +y east
    const SH = [0.45, 1.85, 3.05, 4.15, 5.15, 6.05];
    G.unit(Pq, x0, x1, SH, d, 6.9, { ups: [x0, 0, x1] });
    { const y = 0.5;
      // south bay (x > 0): preserves. Crocks and a basket at the foot; clip jars in a three and a two; jars under cloth and a
      // trailing plant; books and a candle; two big jars at the top
      G.crock(Pq, 0.9, y, SH[0], 1.4, 'c#cbbd9e/0.5'); G.crock(Pq, 1.9, y, SH[0], 1.05, 'c#8a5a2a/0.5');
      Pq.bev('c#a8784a/0.9', 3.5, 5.2, 0.15, 0.85, SH[0], SH[0] + 0.55, 0.04); for (let i = 0; i < 3; i++) P.fruit(Pq, 'quince', 3.9 + i * 0.4, 0.4 + (i % 2) * 0.25, SH[0] + 0.45, 0.9);
      [[0.6, 'c#d9822a/0.3'], [1.1, 'c#7a1020/0.3'], [3.5, 'c#e8d06a/0.35']].forEach(([x, c]) => G.clipJar(Pq, x, y, SH[1], 0.19, 0.6, c));
      G.jug(Pq, 5.1, y, SH[1], 1.0, 'c#cbbd9e/0.4');
      [[0.6, 'c#a8401e/0.3', 'c#e8e0cc/0.9'], [1.12, 'c#d9a43a/0.3', 'c#3a5a8a/0.9'], [1.64, 'c#5a1a3a/0.3', 'c#e8e0cc/0.9']].forEach(([x, c, cl]) => G.clothJar(Pq, x, y, SH[3], 0.16, 0.5, c, cl));
      G.trailing(Pq, 5.0, 0.7, SH[3], 0.85);
      G.booksFlat(Pq, 1.1, y, SH[4], 4, ['c#5a3a22/0.6', 'c#c9b48a/0.6', 'c#7a2a1e/0.6', 'c#e8dcc4/0.6']); G.candle(Pq, 2.4, y, SH[4], 0.36, 0.09);
      G.clothJar(Pq, 1.3, y, SH[5], 0.28, 0.66, 'c#7a8a3a/0.35', 'c#e8e0cc/0.9'); G.clothJar(Pq, 3.6, y, SH[5], 0.26, 0.6, 'c#c9862a/0.3', 'c#b83a32/0.9');
      // north bay: coffee and tea. Two crocks at the foot; tins; caddies; cups on saucers; glasses on a cloth; a jug and a copper pot
      G.crock(Pq, -1.0, y, SH[0], 1.3, 'c#3a3632/0.5'); G.crock(Pq, -2.0, y, SH[0], 0.9, 'c#cbbd9e/0.5');
      [[-0.6, 0.21, 0.62, 'c#2a2622/0.5', 'c#b5853a/0.5'], [-1.1, 0.21, 0.62, 'c#e8dcc4/0.5', 'c#7a2a1e/0.5'], [-1.6, 0.21, 0.62, 'c#2a2622/0.5', 'c#3e5a46/0.5'], [-2.4, 0.16, 0.42, 'c#3e5a46/0.5', 'c#e8dcc4/0.5'], [-2.78, 0.16, 0.42, 'c#3e5a46/0.5', 'c#e8dcc4/0.5']].forEach(([x, r, h, c, b]) => G.coffeeTin(Pq, x, y, SH[1], r, h, c, b));
      G.caddy(Pq, -1.0, y, SH[2], 0.36, 0.5, 'c#8a1c1c/0.4'); G.caddy(Pq, -1.5, y, SH[2], 0.36, 0.42, 'c#2a2622/0.4');
      { let zz = SH[3]; for (const [w, d2, t, c] of [[1.6, 0.85, 0.22, 'c#26364f/0.6'], [1.4, 0.8, 0.18, 'c#8a3a2a/0.6'], [1.5, 0.75, 0.2, 'c#e8dcc4/0.6'], [1.2, 0.7, 0.12, 'c#3e5a46/0.6']]) { Pq.bev(c, -1.6 - w / 2, -1.6 + w / 2, y - d2 / 2 + 0.05, y + d2 / 2, zz, zz + t, 0.008); zz += t; } }      // board games
      G.booksFlat(Pq, -1.3, y, SH[4], 4, ['c#5a3a22/0.6', 'c#c9b48a/0.6', 'c#26364f/0.6', 'c#7a2a1e/0.6']);
      G.jug(Pq, -1.2, y, SH[5], 0.9, 'c#e8dcc4/0.4'); }
    // the north bay is the room's bookshelf too: real books (every spine can be taken down with E) in runs with gaps, with
    // a lamp, a framed photograph leaning, magazines, ceramics; the south bay gets a run of cookery and gardening books
    K.bookRow(Pq, -5.75, -3.25, 0.1, SH[1], 1.08, 0.92, { subject: ['literature', 'poetry'] });
    K.bookRow(Pq, -5.75, -3.85, 0.1, SH[2], 0.98, 0.9, { subject: ['travel', 'art'] });
    K.bookRow(Pq, -5.75, -2.55, 0.1, SH[3], 0.88, 0.88, { subject: ['music', 'film'] });
    K.bookRow(Pq, -5.75, -2.2, 0.1, SH[4], 0.78, 0.9, { subject: ['mystery', 'scifi'] });
    K.bookRow(Pq, -5.75, -2.05, 0.1, SH[5], 0.75, 0.85, { subject: ['nature', 'essays'] });
    K.bookRow(Pq, 2.95, 5.75, 0.1, SH[4], 0.78, 0.9, { subject: ['cooking', 'garden'] });
    G.tableLampB(Pq, -0.55, 0.5, SH[4], 0.75);
    G.leaningPrint(Pq, -0.5, 0.2, SH[5], 0.7, 0.55, (g, W, H) => { D.fill(g, W, H, '#e8dcc4'); g.fillStyle = '#6a7a6a'; g.fillRect(W * 0.08, H * 0.1, W * 0.84, H * 0.5); g.fillStyle = '#c9a46a'; g.fillRect(W * 0.08, H * 0.6, W * 0.84, H * 0.3); g.fillStyle = '#3a4a3a'; g.beginPath(); g.moveTo(W * 0.1, H * 0.6); g.lineTo(W * 0.4, H * 0.25); g.lineTo(W * 0.7, H * 0.6); g.fill(); });      // a photograph: hills over a field
    K.magazines(Pq, 4.7, 0.5, SH[2], 4);
    for (const [x, c] of [[-3.0, 'c#cbbd9e/0.4'], [-3.4, 'c#3e5a46/0.4']]) ves(Pq, c, x, 0.5, SH[3], [[0, 0], [0.14, 0], [0.2, 0.25], [0.12, 0.5], [0.09, 0.62], [0, 0.62]], 10);
    // within reach on the middle shelf: a bowl of apples, the quince paste on its board
    { const z = SH[2];
      bowl(Pq, 3.0, 0.5, z, 0.45, 0.24, 'c#3a3632/0.35', 14); for (const [dx, dy] of [[-0.15, -0.05], [0.15, 0.05], [0, 0.18], [0.05, -0.15]]) fruit(Pq, 'apple', 3.0 + dx, 0.5 + dy, z + 0.08);
      help(Pq, 3.0, 0.5, z + 0.4, { name: 'apple', build: T => { const m = new T.Mesh(new T.SphereGeometry(0.12, 12, 9), new T.MeshStandardMaterial({ color: 0xa8231c, roughness: 0.45 })); m.scale.y = 0.9; return m; }, bites: 3, note: 'You finish the apple. A Cox, by the taste: the house is particular.' });
      Pq.box(OAK, -3.6, -2.4, 0.15, 0.85, z, z + 0.06); Pq.box('c#a8401e/0.35', -3.4, -2.8, 0.25, 0.75, z + 0.06, z + 0.24); for (let i = 0; i < 4; i++) Pq.box('c#d9b878/0.9', -2.7, -2.5, 0.25 + i * 0.12, 0.33 + i * 0.12, z + 0.06 + i * 0.003, z + 0.08 + i * 0.003);
      help(Pq, -3.0, 0.5, z + 0.3, { name: 'square of quince paste on a cracker', build: EAT.membrillo, bites: 2, note: 'You finish the membrillo. Grainy, rosy, faintly perfumed: the house made it in October.' });
      jar(Pq, 1.0, 0.5, z, 0.16, 0.42, 'c#d9a43a/0.3', { lid: false, lvl: 0.8 }); tube(Pq, OAK, [[1.0, 0.5, z + 0.2], [1.1, 0.55, z + 0.62]], 0.02, 4); }
  }

  prof('lounge');
  // ---- the listening lounge: a friend's den before the record wall, after Low Tide Records' listening room on Vesper Street
  //      (town_walk/site/src/shops/records.js): a deep rolled-arm sofa in rust velvet piled with cushions and a wool throw,
  //      two worn leather armchairs, a big leather ottoman with a tray for a table, a knitted pouf, a big old rug, crates of
  //      records on the floor, candles, a plant, a string of small lights along the front of the record wall
  f.rug(14.7, 25.8, 43.2, 53.6, F0, 'tabriz'); f.rug(17.2, 22.6, 45.6, 49.6, F0 + 0.025, 'kilim');      // a second rug laid over the first
  K.sofa(fr(20.5, 53.3, 2), 6.5, 'leather#f2b878', ['wool#e8dcc4', 'wool#c9a03a', 'linen#efe6d2', 'wool#a84a2a'], { throw: 'wool#a84a2a' });
  K.armchair(fr(26.6, 47.0, 1), 'wool#c9b48a', 'wool#a84a2a'); K.pouf(fr(17.0, 46.6, 0), 0, 0, { r: 0.75, h: 1.15, fabric: 'wool#6a7a4a' }); f.seat(fr(17.0, 46.6, 0), 0, 0, 1.15, 'sit on the pouf');
  { const A = fr(20.5, 47.6, 0);
    { const tw = 1.4, td = 0.8, h = 1.3;      // the marble coffee table on four brass legs
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) A.cyl(C.IRON, sx * (tw - 0.2), sy * (td - 0.15), 0, h - 0.08, 0.04, 0.04, 6);
      A.bev(OAKT, -tw, tw, -td, td, h - 0.12, h, 0.03); A.block(-tw, tw, -td, td, 0, h); }
    const z = 1.3 + 0.002;
    G.booksFlat(A, -0.95, 0.15, z, 3, ['c#e8e0cc/0.6', 'c#26364f/0.6', 'c#c9a46a/0.6']);       // art books
    G.coupe(A, 1.05, 0.55, z, 'c#2a160c/0.2');      // someone's martini, half drunk
    G.hotChoc(A, -0.6, -0.5, z); help(A, -0.6, -0.5, z + 0.5, { name: 'hot chocolate with whipped cream', build: EAT.hotchoc, bites: 4, note: 'You finish the hot chocolate. Thick, dark, and there is cream on your nose.' });
    A.bev(OAK, 0.2, 1.3, -0.45, 0.3, z, z + 0.04, 0.01); G.coupe(A, 0.45, -0.2, z + 0.04, 'c#e8d8a0/0.3'); G.coupe(A, 0.85, -0.15, z + 0.04, 'c#c97a5a/0.3');      // a tray of drinks made up
    ves(A, 'glass', 1.1, 0.05, z + 0.046, [[0, 0], [0.12, 0], [0.16, 0.18], [0.07, 0.42], [0.06, 0.5], [0.08, 0.52], [0, 0.53]], 12); ves(A, 'c#8a4a1a/0.2', 1.1, 0.05, z + 0.06, [[0, 0], [0.11, 0], [0.14, 0.16], [0.09, 0.28], [0, 0.28]], 10); teaLight(A, 0.55, -0.25, z); teaLight(A, 0.8, 0.05, z); pillarLit(A, -0.75, 0.25, z, 0.4, 0.12);
    for (let i = 0; i < 2; i++) cupSaucer(A, -0.35 + i * 0.45, -0.2, z, i ? C.PORC : 'c#3a3632/0.3', 'c#3b2416/0.2');
    for (let i = 0; i < 3; i++) A.box(pick(['c#e8e0cc/0.8', 'c#b5853a/0.7', 'c#26364f/0.7']), -0.6 + i * 0.03, 0.43 + i * 0.03, 0.05 + i * 0.02, 0.6 + i * 0.02, z + 0.08 + i * 0.012, z + 0.09 + i * 0.012, { rot: [0, 0, 0.12 * i] });      // sleeves on the tray
    // a side table at the sofa's east end with a candle lantern on it

  }
  // the sofa made deeper still: a side table and a lamp at each arm, a heap of cushions, a folded blanket, a sheepskin on the floor
  { const So = fr(20.5, 53.3, 2);      // the sofa's own frame: x along it (x = 19.9 - X), +y south, out of it
    for (const [x, c, t] of [[-1.6, 'wool#c9a03a', 0.5], [1.4, 'wool#efe6d2', 0.45], [0.2, 'wool#6a7a4a', 0.55]]) K.cushion(So, x, 1.55, 1.6, 1.3, 1.25, c, { tilt: t, turn: x * 0.08 });
    K.cushion(So, -2.4, 2.1, 1.68, 1.3, 1.0, 'wool#8a3a2a', { tilt: Math.PI / 2, thick: 0.22, n: 6 });      // a folded blanket on the seat
    for (const x of [-3.95, 3.95]) { So.cyl(HONEY, x, 1.6, 0, 1.75, 0.45, 0.45, 16); So.block(x - 0.5, x + 0.5, 1.1, 2.1, 0, 1.75); G.tableLampB(So, x, 1.6, 1.75, 1.3); } }
  sheepskin(fr(20.5, 48.0, 0), 0, 1.2, 0.05, 2.4, 1.2);
  G.lushPlant(fr(26.0, 54.2, 0), 0, 0, 0, 1.15, { n: 20 });
  candleLantern(fr(26.1, 50.6, 0), 0, 0, 0, 0.85); fr(26.1, 50.6, 0).block(-0.5, 0.5, -0.5, 0.5, 0, 1.6);
  // a string of small warm bulbs hung in loops along the front of the record wall's canopy
  { const Sg = fr(19.9, 40.75, 0), y = 1.95, zt = 9.0, pts = [];
    for (let i = 0; i <= 36; i++) { const x = -6.3 + i * 12.6 / 36, u = (i % 12) / 12; pts.push([x, y, zt - 0.7 * Math.sin(Math.PI * u)]); }
    tube(Sg, C.BLACK, pts, 0.008, 3); pts.forEach(([x, yy, zz], i) => { if (i % 2) ball(Sg, BULB, x, yy, zz - 0.12, 0.05, 6); }); }

  prof('banquette');
  // ---- the banquette: a long, deep green-velvet banquette along the pool's wall by the courtyard glass, a row of three
  //      marble tables with little lamps, small oak armchairs opposite, an old mirror over it to double the candlelight.
  //      The tasting is laid out on the tables: cheese, bread, fruit, wine.
  { const BQ = fr(42.75, 53.0, 1), x0 = -6.5, x1 = 6.5, VEL = 'leather#e0a070';      // x = Y - 53 (Y 46.5 to 59.5); +y west, into the room
    BQ.bev(OAK, x0, x1, 0.05, 2.1, 0.15, 1.15, 0.03); BQ.box(OAKD, x0 + 0.08, x1 - 0.08, 0.1, 1.95, 0, 0.15); BQ.box(BRASS, x0, x1, 2.1, 2.12, 0.15, 0.3);
    for (const [c, w] of [[-4.35, 4.2], [0, 4.2], [4.35, 4.2]]) pad(BQ, c, 1.15, 1.15, w, 1.85, VEL, 0.42);
    BQ.box(OAK, x0, x1, 0.04, 0.2, 1.15, 3.62);
    for (let i = 0; i < 6; i++) upright(BQ, x0 + 1.08 + i * 2.17, 0.42, 1.5, 2.25, 2.1, VEL, 0.14, 0.45, 4);      // the back, channel-tufted: a row of upright bolsters
    BQ.bev(OAK, x0 - 0.05, x1 + 0.05, 0.02, 0.55, 3.62, 3.78, 0.02); BQ.block(x0, x1, 0, 2.1, 0, 3.78);
    for (const x of [-5.2, -3.2, -1.0, 1.0, 3.2, 5.2]) f.seat(BQ, x, 1.25, 1.57, 'sit on the banquette');
    K.cushion(BQ, -2.1, 1.25, 1.62, 1.5, 1.2, 'wool#c9b48a', { tilt: Math.PI / 2 - 0.15, thick: 0.18, n: 6, turn: 0.4 });      // a blanket, left where someone was sitting
    for (const [x, c] of [[-5.4, 'wool#8a3a2a'], [3.0, 'wool#c9a46a']]) upright(BQ, x, 0.95, 1.55, 1.1, 1.05, c, 0.45, 0.35);
    // over it, the room's one picture, large
    f.framed(BQ, 1.7, 6.9, 4.0, 5.3, 'afklint_ten_largest_7', { frame: 'c#b08d4a/0.3/1', border: 0.1, mat: 0, title: 'The Ten Largest, No. 7, Adulthood', kicker: 'Hilma af Klint, 1907',
      text: 'One of ten great paintings on paper about the ages of life, painted in Stockholm in 1907 and kept unseen for decades by her own wish.', foot: 'Public domain. Image via Wikimedia Commons.' });
  }
  const tables = [49.3, 53.0, 57.4];
  for (const [i, Y] of tables.entries()) { const T = fr(39.4, Y, 1);           // x = Y - Y0; +y west
    G.bistro(T, 0, 0, 2.3, 0.95); tub(fr(37.1, Y, 3), 0, 0, ['wool#8a3a2a', 'leather#6a4630', 'wool#5a6a4a'][i], 'sit at the table');
    if (i) G.tableLampB(T, 0.45, -0.45, 2.3, i === 1 ? 1.15 : 0.95); if (i === 1) K.lampAt(T, 0.45, -0.45, 3.2, 1.0);
  }
  { const z = 2.3, A = fr(39.4, 49.3, 1), B = fr(39.4, 53.0, 1), Cq = fr(39.4, 57.4, 1);
    // table A: the cheese board on wax paper, a knife, Comté with its stamped rind, Fourme d'Ambert, figs and grapes
    { const x = -0.15, y = 0.1; A.box('c#efe8d8/0.9', x - 0.62, x + 0.5, y - 0.4, y + 0.38, z, z + 0.008); A.bev(OAK, x - 0.55, x + 0.55, y - 0.32, y + 0.32, z + 0.008, z + 0.08, 0.02); const zz = z + 0.08;
      P.cheeseWedge(A, x - 0.4, y - 0.18, zz, 0.6, 0.3, 0.1, 0.7, 'comte');
      { const g = x + 0.3, h = y - 0.05; ves(A, 'c#8a7a5a/0.9', g, h, zz, [[0, 0], [0.16, 0], [0.16, 0.3], [0, 0.3]], 12); P.blueTop(A, g, h, zz + 0.3, 0.16); }
      grapes(A, x + 0.05, y + 0.18, zz, 'c#4a2a48/0.35', 10); for (let k = 0; k < 2; k++) fruit(A, 'fig', x - 0.15 + k * 0.17, y + 0.2, zz, 0.9);
      tube(A, 'c#c6c2ba/0.2/1', [[x + 0.2, y - 0.3, zz + 0.02], [x + 0.55, y - 0.36, zz + 0.02]], 0.02, 4); tube(A, OAKD, [[x + 0.55, y - 0.36, zz + 0.02], [x + 0.78, y - 0.4, zz + 0.02]], 0.03, 5);
      help(A, x - 0.3, y - 0.1, zz + 0.35, { name: 'piece of Comté', build: EAT.comte, bites: 2, note: 'You finish the Comté: hazelnut, brown butter, a crunch of crystals. Twenty-four months on spruce.' });
      help(A, x + 0.3, y - 0.05, zz + 0.4, { name: "crumb of Fourme d'Ambert", build: EAT.blue, bites: 2, note: 'You finish the blue. Mild, creamy, and blue only where it matters.' });
      help(A, x + 0.05, y + 0.18, zz + 0.15, { name: 'bunch of grapes', build: EAT.grapes, bites: 4, note: 'You finish the grapes. Muscat: they taste of flowers.' });
      help(A, x - 0.1, y + 0.2, zz + 0.2, { name: 'fig', build: EAT.fig, bites: 2, note: 'You finish the fig. Jammy, and full of seeds.' }); }
    pillarLit(A, -0.55, -0.45, z, 0.3, 0.09);
    // table B: the bread on its board, a bowl of pears, the Poulsard and two glasses
    { const x = -0.2, y = 0.15; B.bev(OAK, x - 0.45, x + 0.45, y - 0.25, y + 0.25, z, z + 0.06, 0.02); loaf(B, x, y, z + 0.06, 0.72, 0.21);
      help(B, x, y, z + 0.3, { name: 'heel of sourdough', build: EAT.bread, bites: 3, note: 'You finish the bread. A good crust is half the cheese.' }); }
    { const x = 0.4, y = 0.35; bowl(B, x, y, z, 0.3, 0.18, 'c#e8dcc4/0.35', 12); for (const [dx, dy] of [[-0.08, 0], [0.1, 0.05], [0, -0.1]]) fruit(B, 'pear', x + dx, y + dy, z + 0.08);
      help(B, x, y, z + 0.4, { name: 'pear', build: EAT.pear, bites: 3, note: 'You finish the pear. A Comice, ripe to the minute.' }); }
    G.bottle(B, 'burgundy', -0.5, -0.3, z, 'c#2a3a1a/0.15', { foil: 'c#6a1622/0.4', label: 'c#efe6d2/0.8' });
    help(B, -0.5, -0.3, z + 0.8, { name: 'glass of Poulsard', drink: { vessel: 'wine', liquid: 0x8a2230 }, note: 'You finish the Poulsard: pale, red-currant, a little wild. Jura, like the Comté.' });
    wineGlass(B, -0.1, -0.55, z + 0.006, 'c#6a1622/0.2'); wineGlass(B, 0.2, 0.7, z + 0.006, null);
    // table C: an espresso martini and truffle fries, a candle: the table under the picture, the one a guest photographs
    G.fries(Cq, -0.2, 0.3, z); G.martini(Cq, 0.38, 0.32, z); G.martini(Cq, 0.05, -0.2, z); pillarLit(Cq, -0.55, -0.4, z, 0.4, 0.1); pillarLit(Cq, -0.4, -0.62, z, 0.26, 0.08);
    help(Cq, 0.38, 0.32, z + 0.45, { name: 'espresso martini', build: EAT.martini, bites: 3, note: 'You finish the espresso martini: cold, bitter, sweet, awake. The beans are for luck.' });
    help(Cq, -0.2, 0.3, z + 0.25, { name: 'handful of truffle fries', build: EAT.fries, bites: 4, plural: true, note: 'You finish the fries. Parmesan, truffle, salt, and the aioli was the point.' });
  }
  function C0b(T, x, y, z) {
    T.box('c#efe8d8/0.9', x - 0.55, x + 0.45, y - 0.42, y + 0.36, z, z + 0.008); T.bev(OAK, x - 0.5, x + 0.5, y - 0.32, y + 0.32, z + 0.008, z + 0.08, 0.02); const zz = z + 0.08;
    P.cheeseWedge(T, x - 0.35, y - 0.15, zz, 0.5, 0.28, 0.15, 0.8, 'manchego');
    P.ashLog(T, x + 0.25, y + 0.15, zz, 0.45); P.clothWheel(T, x + 0.25, y - 0.12, zz, 0.2, 0.22);
  }
  // the outside brought in: a mossy boulder and a fern at the foot of the courtyard glass, south of the table
  f.model('mossy_rock_03', fr(37.4, 43.7, 0, 0.01), 0, 0, 0, 0, { scale: 0.3, turn: 0.8, collide: true });
  f.model('fern_clump_d', fr(40.4, 45.1, 0, 0.01), 0, 0, 0, 0, { turn: 2.0 });

  { const St = fr(41.9, 72.45, 2), IRONS = 'c#2b2724/0.55/1';      // a small cast-iron wood stove on a stone hearth in the corner east of the stair's foot, its flue up through the double height (it glows: it does not cast)
    St.bev(STONE2, -0.8, 0.8, 0.05, 2.8, 0, 0.16, 0.03);
    // the firebox is hollow behind a real glass door: a firebrick lining, a bed of embers, three split logs burning, live flames
    St.bev(IRONS, -0.62, 0.62, 0.6, 1.75, 0.55, 0.68, 0.03); St.bev(IRONS, -0.66, 0.66, 0.56, 1.8, 2.08, 2.2, 0.04);
    St.box(IRONS, -0.62, 0.62, 0.6, 0.7, 0.68, 2.08); for (const sx of [-1, 1]) St.box(IRONS, sx * 0.52, sx * 0.62, 0.7, 1.75, 0.68, 2.08);
    St.box('e#6a2208/0.5', -0.5, 0.5, 0.7, 0.74, 0.68, 2.0); for (const sx of [-1, 1]) St.box('c#1e100a/0.95', sx * 0.48, sx * 0.52, 0.74, 1.7, 0.68, 2.0);      // firebrick
    St.box(IRONS, -0.62, 0.62, 1.7, 1.8, 0.68, 0.8); St.box(IRONS, -0.62, 0.62, 1.7, 1.8, 1.72, 2.08); for (const sx of [-1, 1]) St.box(IRONS, sx * 0.42, sx * 0.62, 1.7, 1.8, 0.8, 1.72);      // the door's frame
    St.box('e#c0501a/0.25', -0.42, 0.42, 1.765, 1.77, 1.62, 1.72); St.box(BRASS, 0.5, 0.56, 1.8, 1.9, 1.15, 1.45);      // the door stands open a crack: no glass between you and the fire; a warm amber lip of glow along its top; the handle
    St.box('e#e0400a/0.7', -0.47, 0.47, 0.76, 1.68, 0.68, 0.72);      // the embers
    for (const [x, y, r] of [[-0.3, 1.2, 0.06], [0.25, 1.45, 0.05], [0.05, 0.95, 0.055], [-0.1, 1.55, 0.045]]) ball(St, 'e#ff6a1a/0.9', x, y, 0.72, r, 5);
    for (const [y, z, r, rot] of [[1.05, 0.8, 0.1, 0.12], [1.4, 0.8, 0.09, -0.1], [1.22, 0.97, 0.08, 0.05]]) { hcyl(St, 'c#241710/0.95', 'x', rot, y, z, 0.82, r, r, 7); }
    for (const [x, y, z, sc] of [[-0.22, 1.25, 0.92, 2.8], [0.2, 1.3, 0.9, 3.2], [0.0, 1.2, 1.06, 2.5], [-0.32, 1.45, 0.86, 2.0], [0.33, 1.1, 0.86, 1.9], [0.08, 1.5, 0.9, 2.2]]) flameAt(St, x, y, z, sc);
    for (const sx of [-0.5, 0.5]) for (const sy of [0.75, 1.6]) St.cyl(IRONS, sx, sy, 0.16, 0.55, 0.05, 0.07, 6);
    { const [lx, ly] = St.map(0, 2.9); const lamp = f.lamp(lx, ly, F0 + 0.35, { power: 0.25, kind: 'candle' }); f.later(() => { lamp.kind = 'fire'; }); }      // a warm flicker on the floor in front
    St.cyl(IRONS, 0, 1.15, 2.2, 21.4 - F0, 0.2, 0.2, 12); St.block(-0.8, 0.8, 0.05, 2.0, 0, 2.3);
    // a basket of split logs on the hearth beside it
    ves(St, 'c#8a6038/0.95', -0.4, 2.3, 0.16, [[0, 0], [0.32, 0], [0.38, 0.45], [0.36, 0.47], [0, 0.04]], 14); P.put(St, 'c#6a4626/0.9', new THREE.TorusGeometry(0.37, 0.03, 5, 20).translate(-0.4, 2.3, 0.62));
    for (const [dx, dy, dz] of [[-0.12, -0.08, 0.6], [0.12, -0.05, 0.62], [0, 0.12, 0.66], [-0.05, 0.0, 0.78]]) hcyl(St, 'c#8a6a48/0.9', 'y', -0.4 + dx, 2.3 + dy, 0.16 + dz, 0.7, 0.07, 0.07, 6);
    hcyl(St, 'c#8a6a48/0.9', 'y', 0.45, 2.35, 0.3, 0.8, 0.12, 0.12, 7); }
  G.lushPlant(fr(34.0, 43.9, 0), 0, 0, 0, 1.4, { n: 24 });      // a big plant that has grown big, by the way in
  { const Sb = fr(28.8, 68.3, 2);      // a long low bench against the stair's stone side, facing the room; x = 28.8 - X, +y south
    Sb.bev(OAK, -3.6, 3.6, 0.05, 1.7, 0.15, 1.15, 0.03); Sb.box(OAKD, -3.5, 3.5, 0.1, 1.55, 0, 0.15); Sb.block(-3.6, 3.6, 0, 1.7, 0, 1.4);
    for (const x of [-2.4, 0, 2.4]) { pad(Sb, x, 0.9, 1.15, 2.3, 1.55, 'velvet#4a1616', 0.36); f.seat(Sb, x, 0.95, 1.5, 'sit on the bench'); }
    for (const [x, c] of [[-2.9, 'wool#c9b48a'], [-1.9, 'velvet#24402e'], [1.6, 'linen#e8dcc4'], [2.7, 'velvet#b5853a']]) upright(Sb, x, 0.35, 1.5, 1.1, 1.0, c, 0.3, 0.32);
    K.cushion(Sb, 0.6, 0.95, 1.6, 1.4, 1.2, 'wool#e8dcc4', { tilt: Math.PI / 2, thick: 0.2, n: 6 }); }      // a folded blanket

  // colour on the walls: Klimt's farm garden high on the stone over the stair (seen from the floor, the stair and the bridge);
  // Klimt's Poppy Field high over the stair (the af Klint hangs alone by the banquette)
  f.framed(fr(29.5, 72.5, 2), 0, 15.8, 5.0, 5.1, 'klimt_poppy_field', { frame: 'c#c9a070/0.5', border: 0.14, mat: 0, title: 'Poppy Field', kicker: 'Gustav Klimt, 1907',
    text: 'A summer meadow seen close and flat, like a tapestry: red poppies and white daisies all the way up, a few trees, almost no sky. Österreichische Galerie Belvedere, Vienna.', foot: 'Public domain. Image via Wikimedia Commons.' });

  prof('the void');
  // ---- the double-height part: an olive in a big clay jar by the pool's wall, a cluster of paper lanterns in the void -------
  { const O = fr(34.4, 66.0, 0); G.lushPlant(O, 0, 0, 0, 2.0, { n: 30, height: 3.2, leaf: 1.0 }); }      // a fiddle-leaf fig grown tall in the double height, in a big clay pot
  { const zc = 21.8 - F0 - 0.02, V = fr(29.5, 67.2, 0);      // the room's great fixture: twelve smoked-glass globes hanging at different heights in the void, a brass canopy over them
    V.cyl(BRASS, 0, 0, zc - 0.08, zc, 0.9, 0.9, 20);
    [[0, 0, 13.6, 0.55], [1.3, 0.4, 14.6, 0.45], [-1.2, 0.6, 14.2, 0.5], [0.5, -1.1, 15.2, 0.42], [-0.6, -0.9, 13.9, 0.48], [1.5, -0.6, 16.0, 0.38], [0.2, 1.4, 15.8, 0.42], [1.0, 1.2, 17.0, 0.34], [0.6, 0.2, 17.6, 0.35]].forEach(([x, y, zz, r], i) => {
      V.cyl(BRASS, x, y, zz + r * 1.9, zc - 0.08, 0.01, 0.01, 3); V.cyl(BRASS, x, y, zz + r * 1.85, zz + r * 1.98, 0.08, 0.08, 8);
      ves(V, 'glass', x, y, zz, [[0, 0], [r * 0.6, r * 0.2], [r, r], [r * 0.6, r * 1.8], [r * 0.12, r * 1.9], [0, r * 1.9]], 12); V.cyl(GLOW, x, y, zz + r * 0.45, zz + r * 1.35, 0.025, 0.025, 4); ball(V, BULB, x, y, zz + r * 0.4, 0.05, 5); });
    K.lampAt(V, 0, 0, 14.6, 2.6);
  }

  // =============================================================================================================
  // THE CAVE (X -2.5 to 12, Y 50 to 64, 8 ft high; its door in the east wall at Y 55.5 to 58.5, swinging in)
  // =============================================================================================================
  const RINDS = ['c#b98a4a/0.85', 'c#a87a3a/0.85', 'c#c9984a/0.85', 'c#9a6a34/0.85', 'c#b0803e/0.85'];

  prof('vault');
  // ---- the vault: a barrel of pale coursed stone springing from the north and south walls at 7 ft, crowned at 9.5 ------
  { const X0 = -2.48, X1 = 11.98, Y0 = 50.02, Y1 = 63.98, yc = (Y0 + Y1) / 2, half = (Y1 - Y0) / 2, spring = 7.0, rise = 2.5;
    const Rv = (half * half + rise * rise) / (2 * rise), zc = spring + rise - Rv, a0 = Math.asin(half / Rv), n = 18, pos = [], uv = [];
    const pt = i => { const a = -a0 + 2 * a0 * i / n; return [yc + Rv * Math.sin(a), zc + Rv * Math.cos(a), Rv * a]; };
    const V = fr(0, 0, 0);
    for (let i = 0; i < n; i++) { const [ya, za, ua] = pt(i), [yb, zb, ub] = pt(i + 1);
      pos.push(X0, ya, za, X1, yb, zb, X0, yb, zb, X0, ya, za, X1, ya, za, X1, yb, zb); uv.push(X0, ua, X1, ub, X0, ub, X0, ua, X1, ua, X1, ub); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals();
    if (g.attributes.normal.getZ(0) > 0) { const p = g.attributes.position.array, u = g.attributes.uv.array; for (let i = 0; i < p.length; i += 9) for (let k = 0; k < 3; k++) { const t = p[i + 3 + k]; p[i + 3 + k] = p[i + 6 + k]; p[i + 6 + k] = t; } for (let i = 0; i < u.length; i += 6) for (let k = 0; k < 2; k++) { const t = u[i + 2 + k]; u[i + 2 + k] = u[i + 4 + k]; u[i + 4 + k] = t; } g.computeVertexNormals(); }
    K.put(V, 'coursed', g);
    // the lunettes over the two ends (the door's head is at the springing, so the east one stands just over it)
    for (const [X, z0, flip] of [[X0 + 0.01, spring - 0.05, false], [X1 - 0.01, spring + 0.05, true]]) { const sh = new THREE.Shape(); sh.moveTo(Y0, z0); for (let i = 0; i <= n; i++) { const [y, zz] = pt(i); sh.lineTo(y, zz + 0.02); } sh.lineTo(Y1, z0);
      const lg = new THREE.ShapeGeometry(sh); lg.rotateX(Math.PI / 2); lg.rotateZ(flip ? Math.PI / 2 : -Math.PI / 2); if (flip) lg.translate(0, 2 * yc, 0); lg.translate(X, 0, 0); K.put(V, 'coursed', lg.index ? lg.toNonIndexed() : lg); }
  }

  prof('comte rack');
  // ---- the Comté rack on the north wall: spruce boards, two wheels to a bay, a light on its top washing up the vault --------
  { const R = fr(3.6, 64, 2), x0 = -5.8, x1 = 5.8, d = 2.3, Z = [0.45, 1.65, 2.85, 4.05, 5.25], top = 6.2;      // x = 3.6 - X (X 9.4 to -2.2)
    for (const x of [x0, 0, x1]) for (const y of [0.15, d - 0.15]) R.box(C.SPRUCE2, x - 0.12, x + 0.12, y - 0.12, y + 0.12, 0, top);
    for (const z of Z) { R.box(SPRUCE, x0 - 0.1, x1 + 0.1, 0.03, d, z - 0.1, z); R.box(C.SPRUCE2, x0 - 0.12, x1 + 0.12, d - 0.06, d + 0.02, z - 0.13, z + 0.05); }
    R.box(C.SPRUCE2, x0 - 0.15, x1 + 0.15, 0.03, d + 0.05, top, top + 0.12); wash(R, x0, x1, 0.1, 0.2, top + 0.12, top + 0.16); strip(R, x0 + 0.2, x1 - 0.2, 0.05, 0.1, 0.02, 0.07);
    R.block(x0, x1, 0, d, 0, top);
    Z.forEach((z, k) => { for (let b = 0; b < 2; b++) for (let i = 0; i < 2; i++) { if ((k * 3 + b * 2 + i) % 7 === 5) continue; { const wx = x0 + b * 5.8 + 1.5 + i * 2.75 + (rnd() - 0.5) * 0.08, wy = d / 2 + 0.05; if ((k + b + i) % 5 === 2) P.cutWheel(R, wx, wy, z, 1.05, 0.32, 0.6, RINDS[(k + b) % RINDS.length], 'c#e9cf86/0.55'); else { P.stampedWheel(R, wx, wy, z, 1.05, 0.32, RINDS[(k + b + i) % RINDS.length]); }
        R.box('c#d9c07a/0.95', wx - 1.0, wx + 1.0, wy - 0.95, wy + 0.95, z + 0.004, z + 0.014); } } });      // straw under each wheel
  }

  prof('bottle rack');
  // ---- the bottles: a rack of dark timber bins on the south wall, lit behind every third row --------------------------
  { const W = fr(3.6, 50, 0), x0 = -5.9, x1 = 5.6, top = 5.6, d = 1.25, nc = 24, nr = 11, cw = (x1 - x0) / nc, rh = (top - 0.5) / nr;   // x = X - 3.6 (X -2.3 to 9.2)
    W.box(WALD, x0, x1, 0.02, 0.06, 0.3, top);
    for (let i = 0; i <= nc; i++) { const x = x0 + i * cw; W.box(WAL2, x - (i % nc ? 0.025 : 0.08), x + (i % nc ? 0.025 : 0.08), 0.06, d, 0.3, top); }
    for (let j = 0; j <= nr; j++) { const z = 0.4 + j * rh; W.box(WAL2, x0, x1, 0.06, d, z - 0.04, z); if (j % 3 === 1) strip(W, x0 + 0.1, x1 - 0.1, 0.07, 0.11, z + 0.02, z + 0.06); }
    W.box(WAL2, x0 - 0.12, x1 + 0.12, 0.02, d + 0.12, top, top + 0.14); strip(W, x0, x1, 0.06, 0.16, top + 0.14, top + 0.18); W.box(WALD, x0, x1, 0.1, d - 0.05, 0, 0.3);
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) { if (rnd() < 0.2) continue; G.bottleLying(W, x0 + (i + 0.5) * cw, d - 0.04, 0.4 + (j + 0.5) * rh, pick(WINE), pick(['c#6a1622/0.4', 'c#1a1a14/0.4', 'c#b08d4a/0.3/1', 'c#e8e0cc/0.5', 'c#6a1622/0.4']), (i + j) % 5 === 0 ? 'c#efe6d2/0.8' : null); }
    W.block(x0, x1, 0, d, 0, top);
  }

  prof('stone bench');
  // ---- the built-in stone bench across the west end, with sheepskins and cushions; a light behind it ---------------------
  { const Sb = fr(-2.5, 57.0, 3);                           // x = 57 - Y (Y 61.3 to 52.7); +y east
    Sb.box(STONE2, -4.3, 4.3, 0.02, 1.8, 0, 1.25); Sb.box('c#a89e8e/0.85', -4.35, 4.35, 0.02, 1.9, 1.25, 1.4); strip(Sb, -4.2, 4.2, 0.04, 0.1, 1.4, 1.45);
    Sb.block(-4.3, 4.3, 0, 1.9, 0, 1.4);
    for (const [x, w] of [[-2.8, 2.3], [0.0, 2.3], [2.8, 2.3]]) { sheepskin(Sb, x, 1.0, 1.4, w, 1.6); upright(Sb, x, 0.35, 1.5, w - 0.3, 1.2, SHEEP, 0.25, 0.3); f.seat(Sb, x, 1.05, 1.56, 'sit on the bench'); }
    for (const [x, c] of [[-1.4, 'velvet#4a5a3e'], [1.4, 'velvet#5a1e1e']]) upright(Sb, x, 0.6, 1.56, 0.9, 0.9, c, 0.35, 0.3);
  }

  prof('cave table');
  // ---- a table laid for two before the bench: a board of Comté cut into, bread, walnuts and grapes, two glasses, an open
  //      bottle of vin jaune, a jug of branches, candles; a stool opposite; a candle lantern on a chain from the vault
  { const T = fr(1.5, 57.0, 1), z = 2.45;                   // x = Y - 57; +y west (toward the bench)
    T.bev(OAK, -1.3, 1.3, -1.0, 1.0, z - 0.12, z, 0.03); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.bev(OAKD, sx * 1.05 - 0.08, sx * 1.05 + 0.08, sy * 0.75 - 0.08, sy * 0.75 + 0.08, 0, z - 0.12, 0.02);
    T.block(-1.3, 1.3, -1.0, 1.0, 0, z);
    { const x = -0.35, y = 0.05; T.box('c#efe8d8/0.9', x - 0.6, x + 0.55, y - 0.42, y + 0.4, z, z + 0.008); T.bev(OAK, x - 0.55, x + 0.55, y - 0.35, y + 0.35, z + 0.008, z + 0.08, 0.02); const zz = z + 0.08;
      P.cheeseWedge(T, x - 0.3, y - 0.2, zz, 0.55, 0.3, 0.15, 0.85, 'comte'); P.blueTop(T, x + 0.3, y + 0.12, zz + 0.002, 0.14); ves(T, 'c#8a7a5a/0.9', x + 0.3, y + 0.12, zz - 0.25, [[0.14, 0.25], [0.14, 0.25], [0, 0.25]], 4);
      tube(T, 'c#c6c2ba/0.2/1', [[x + 0.15, y - 0.3, zz + 0.02], [x + 0.45, y - 0.32, zz + 0.02]], 0.02, 4); tube(T, OAKD, [[x + 0.45, y - 0.32, zz + 0.02], [x + 0.65, y - 0.34, zz + 0.02]], 0.03, 5);
      help(T, x - 0.1, y - 0.1, zz + 0.4, { name: 'sliver of thirty-month Comté', build: EAT.comte, bites: 2, note: 'You finish the old Comté. Crystals, caramel, a long walk in a damp forest.' }); }
    loaf(T, 0.75, 0.45, z, 0.6, 0.18);
    bowl(T, 0.6, -0.45, z, 0.26, 0.14, 'c#e8dcc4/0.35', 12); for (let i = 0; i < 7; i++) ball(T, 'c#8a6a4a/0.8', 0.6 + Math.cos(i * 1.6) * 0.1, -0.45 + Math.sin(i * 1.6) * 0.1, z + 0.08 + (i % 2) * 0.03, 0.045, 6);      // walnuts
    grapes(T, -0.95, -0.55, z, 'c#b9c26a/0.4', 10);
    G.bottle(T, 'spirit', 0.15, 0.6, z, 'c#3a2a14/0.2', { label: 'c#efe6d2/0.8' }); T.cyl('c#c9a46a/0.8', 0.45, 0.75, z, z + 0.12, 0.03, 0.03, 6);      // the clavelin, open, its cork by it
    help(T, 0.15, 0.6, z + 0.6, { name: 'glass of vin jaune', drink: { vessel: 'wine', liquid: 0xd9a441 }, note: 'You finish the vin jaune: walnuts, curry, the sea. Six years under its veil, and worth it.' });
    wineGlass(T, -0.2, 0.75, z + 0.006, 'c#d9a441/0.25'); wineGlass(T, 0.5, -0.8, z + 0.006, 'c#d9a441/0.25');
    K.posy(T, 1.0, -0.05, z, ['c#f2ead8/0.8', 'c#e8c0b8/0.8', 'c#d9b35a/0.8'], { jar: 'c#e8dcc4/0.4' });      // flowers in a stoneware jug

    pillarLit(T, -1.0, 0.6, z, 0.4, 0.1); pillarLit(T, -0.85, 0.78, z, 0.26, 0.08);
    { const zc = 9.5 - 0.05, zb = 6.0; T.cyl(C.IRON, 0, 0, zb + 1.1, zc, 0.015, 0.015, 3); candleLantern(T, 0, 0, zb, 0.6, { cast: 1.1 }); }      // the cave's one lamp
  }
  // the stool opposite, an apron folded on another by the door; a basket of eggs; herbs, a ham and sausages hung from a pole
  { const S = fr(3.4, 57.0, 1); S.cyl(OAK, 0, 0, 1.6, 1.72, 0.55, 0.55, 14); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU; tube(S, OAKD, [[Math.cos(a) * 0.3, Math.sin(a) * 0.3, 1.6], [Math.cos(a) * 0.5, Math.sin(a) * 0.5, 0]], 0.05, 5); } S.block(-0.55, 0.55, -0.55, 0.55, 0, 1.72); f.seat(S, 0, 0, 1.72, 'sit at the table'); }
  { const S = fr(8.6, 52.6, 0); S.cyl(OAK, 0, 0, 1.5, 1.6, 0.5, 0.5, 14); for (let i = 0; i < 3; i++) { const a = i / 3 * TAU + 0.5; tube(S, OAKD, [[Math.cos(a) * 0.28, Math.sin(a) * 0.28, 1.5], [Math.cos(a) * 0.45, Math.sin(a) * 0.45, 0]], 0.05, 5); } S.block(-0.5, 0.5, -0.5, 0.5, 0, 1.6);
    K.cushion(S, 0, 0, 1.68, 0.8, 0.7, 'linen#d8c8a8', { tilt: Math.PI / 2, thick: 0.14, n: 5 }); tube(S, 'c#d8c8a8/0.9', [[0.35, 0.1, 1.62], [0.5, 0.15, 1.1], [0.48, 0.1, 0.8]], 0.03, 4); }      // the apron, its strings hanging
  { const Bk = fr(0.6, 61.0, 0); Bk.cyl('c#a8784a/0.9', 0, 0, 0, 0.45, 0.42, 0.5, 14); Bk.cyl('c#a8784a/0.9', 0, 0, 0.45, 0.5, 0.52, 0.52, 14); tube(Bk, 'c#a8784a/0.9', [[-0.45, 0, 0.5], [0, 0, 1.3], [0.45, 0, 0.5]], 0.03, 4);
    for (let i = 0; i < 9; i++) ball(Bk, i % 3 ? 'c#e8dcc4/0.6' : 'c#c9a07a/0.6', Math.cos(i * 2.4) * 0.25 * (i % 2 ? 1 : 0.5), Math.sin(i * 2.4) * 0.25 * (i % 2 ? 1 : 0.5), 0.42 + (i % 3) * 0.04, 0.09, 6, 1.25); Bk.block(-0.5, 0.5, -0.5, 0.5, 0, 1.3); }
  { const Hp = fr(3.6, 60.2, 0), zp = 8.2;                    // a pole along the cave under the vault, just south of the Comté rack's front
    hcyl(Hp, OAKD, 'x', 0, 0, zp, 10.5, 0.05, 0.05, 6); for (const x of [-5.2, 5.2]) tube(Hp, C.IRON, [[x, 0, zp], [x, 0, zp + 1.5]], 0.012, 3);
    const HERB = ['c#6a7a4a/0.9', 'c#8a9a6a/0.9', 'c#5a6a3a/0.9', 'c#9a8aa8/0.9'];
    for (let i = 0; i < 7; i++) P.herbBunch(Hp, -4.6 + i * 0.6, 0, zp - 0.04, HERB[i % 4], 0.8 + (i % 3) * 0.15);
    // a cured ham, hung by its hoof on a string: a rounded leg in golden-brown skin, its cut face pale rose
    tube(Hp, 'c#c9b48a/0.9', [[1.3, 0, zp], [1.3, 0, zp - 0.45]], 0.01, 3); Hp.cyl('c#5a3a22/0.6', 1.3, 0, zp - 0.62, zp - 0.45, 0.05, 0.045, 8);
    P.put(Hp, 'c#b07a44/0.55', P.latheG([[0, 0], [0.2, 0.06], [0.34, 0.3], [0.36, 0.6], [0.3, 0.95], [0.18, 1.2], [0.08, 1.38], [0.05, 1.5], [0, 1.52]], 14), { at: [1.3, 0, zp - 2.15] });
    Hp.cyl('c#e0a090/0.55', 1.3, 0, zp - 2.16, zp - 2.14, 0.19, 0.19, 12);
    // a row of saucissons, evenly spaced: straight, rounded at the ends, a dusty white-pink coat, tied with string, a paper tag
    for (let i = 0; i < 5; i++) { const x = 2.4 + i * 0.32, L = 0.95 - (i % 2) * 0.12; tube(Hp, 'c#c9b48a/0.9', [[x, 0, zp], [x, 0, zp - 0.18]], 0.008, 3);
      P.put(Hp, 'c#e8d6cc/0.9', new THREE.CapsuleGeometry(0.07, L, 4, 10).rotateX(Math.PI / 2).translate(x, 0, zp - 0.25 - L / 2 - 0.07));
      Hp.box('c#efe6d2/0.85', x - 0.05, x + 0.05, 0.07, 0.075, zp - 0.55, zp - 0.45); }
  }
  // candles in little stone niches either side of the door, and on the bench's ledge
  { const Ed = fr(12, 57.0, 1); for (const x of [-2.8, 2.8]) {      // little rounded stone corbels either side of the door, each with an iron drip pan and a candle burning
      Ed.cyl(STONE2, x, 0.0, 3.78, 3.95, 0.4, 0.42, 16); P.put(Ed, STONE2, P.latheG([[0, -0.45], [0.12, -0.42], [0.28, -0.3], [0.38, -0.12], [0.4, 0]], 12), { at: [x, 0.0, 3.78] });
      ves(Ed, 'c#2b2724/0.5/1', x, 0.25, 3.95, [[0, 0], [0.16, 0], [0.18, 0.03], [0.17, 0.04], [0, 0.015]], 12); pillarLit(Ed, x, 0.25, 3.97, 0.42, 0.1); } }
  f.framed(fr(-2.5, 57.0, 3), 0.0, 4.4, 1.3, 1.65, 'coorte_strawberries', { frame: 'c#c9a070/0.5', border: 0.1, mat: 0.12, title: 'Strawberries on a Stone Ledge', kicker: 'Adriaen Coorte, 1696', text: 'A bowl of wild strawberries on a ledge, in the dark: the Dutch still life at its smallest and best. Rijksmuseum.', foot: 'Public domain. Image via Wikimedia Commons.' });      // the cave's one small bright picture, over the bench
  { const Sb = fr(-2.5, 57.0, 3); for (const x of [-3.9, 3.9]) teaLight(Sb, x, 0.4, 1.4); wash(Sb, -4.2, 4.2, 0.04, 0.1, 1.4, 1.45); }

  // every candle alight: one draw of live flames and halos per room
  f.later(ctx => { const W = (X, Y, h) => f.world(X, Y, h);
    flames(ctx, W, FLAMES.filter(c => c.X >= 12.5), W(28, 56, 4)); flames(ctx, W, FLAMES.filter(c => c.X < 12.5), W(4.75, 57, 3)); });
  if (PROF) globalThis.__larderTris = Object.fromEntries(Object.entries(tally).map(([k, v]) => [k, Math.round(v)]));
}
