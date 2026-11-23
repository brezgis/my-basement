// larder: The Listening Room and The Cave (furnish file of the agent `larder`; small goods in larder_parts.js).
// In the house's settled key (notes/STYLE.md, first section): stone rooms of pale coursed stone, slate and honey boards,
// oak furniture, lit by candles and lanterns and by light on stone; and, for this room at Anna's word, PLUSH and warm
// in its furniture: a friend's den for an evening, after Vesper Street's Low Tide Records (its listening room, its
// crates) and Slow Hand Coffee's counter (town_walk/site/src/shops/).
//
// THE LISTENING ROOM (X 13.5 to 35.8 by Y 40.8 to 72.5, east to X 42.75 by the courtyard glass; the north part two
//   storeys high with the stair along the north wall (its foot at X 37), the gallery over the west strip and the
//   bridge at Y 59.8 to 64.2). Three places round clear ways (north from the hall's opening, from the cave's door
//   east to the pool's opening, and to the stair's foot):
//   the bar, north-west under the gallery: a thick oak counter under a stone top, the copper machine, plain oak
//     stools, an oak back shelf of wine, cups and jars against the stone with one wash of light down it;
//   the listening lounge, south-west: the record wall in honey oak (records, two big speakers, a valve amplifier,
//     the house's turntable), a deep velvet sofa piled with cushions and a throw, two leather armchairs, a leather
//     ottoman with a tray, a pouf, a big rug, crates of records, shaded wall lights and candles;
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
//     serve: { machine: [17.6, 66.35] (behind the copper machine, now at the counter's north end), pickup: [21.0, 64.6, 3.85]
//     (the counter's top, kept clear before the barman: 3.45 above the room's floor) }. Drinks: 'brown sugar shaken espresso': { vessel: 'highball',
//     liquid: 0x8a5a33 }, 'espresso': demitasse, 'cortado' and 'flat white': latte, 'filter': mug, 'hot chocolate': mug.
//     A second post at the back counter's grinder [16.0, 67.5].
//   The Listening Room, at the banquette's tables (the tasting is served there): home [35.0, 53.0], faces [39.4, 53.0]
//     (east, to the middle table); posts [35.2, 49.3] and [35.2, 57.4] (the other two tables), the shelf wall [16.0, 49.0]
//     facing west (the quince paste and the apples). Serves the espresso martini, the truffle fries, wine and cheese there.
//   The lounge: a post by the turntable [20.1, 44.4] facing south (2 ft before the record wall).
//   The Cave, the affineur: home [8.5, 60.5], faces [5, 61.5] (the Comté rack); posts [3.6, 59.5] facing north (the
//     rack), [3.6, 52.6] facing south (the bottles), [4.6, 55.0] facing west (the table laid for two).
import { stoveFire } from './banya_fx.js';
import { storedLogs } from '../kit/firewood.js';
import * as THREE from 'three';
import { parts, C, EAT } from './larder_parts.js';
import { goods } from './larder_goods.js';
import { flames, hangingGlobes } from './larder_fx.js';

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
  const WAL = 'walnut#bd9876', WAL2 = 'walnut#ac8966', WALD = 'walnut#8a7059', OAK = 'oak_light#c09c75', HONEY = 'oak_light#d8bb90', STONE = 'limestone_smooth#ccc2ae', STONE2 = 'limestone_smooth#b5ac97', OAKT = 'oak_light', OAKD = 'oak_light#997451';
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

  // A counter slab with a rectangular cutout, covered at the corners by the basin's lip.
  function cutCounter(frame, mat, x0, x1, y0, y1, z0, z1, left, right, back, front) {
    frame.box(mat, x0, left, y0, y1, z0, z1);
    frame.box(mat, right, x1, y0, y1, z0, z1);
    frame.box(mat, left, right, y0, back, z0, z1);
    frame.box(mat, left, right, front, y1, z0, z1);
  }

  prof('back bar');
  // ---- the back bar on the west wall, under the gallery: an old bar's furniture in honey oak, worn: a deep base cabinet of
  //      panelled doors with brass pulls under a working top (ice well, speed rail, glasses on a cloth), and over it an open
  //      hutch: chamfered posts, nosed shelves with brass gallery rails, a back of dark-stained planks so the bottles read,
  //      a stepped crown. Stocked two and three deep, in groups; two little shaded lamps and candles so the glass sparkles.
  { const B = fr(13.5, 64.4, 3), x0 = -3.9, x1 = 3.9, zt = 3.0;     // x = 64.4 - Y (Y 60.5 to 68.3); +y east, into the room
    const iceX = 2.27, iceY = 0.94, wellHalf = 0.61;
    B.box(OAKD, x0 + 0.1, x1 - 0.1, 0.2, 1.8, 0, 0.3);
    B.bev(OAKT, x0, x1, 0.04, 1.95, 0.3, zt - 0.51, 0.02);
    cutCounter(B, OAKT, x0, x1, 0.04, 1.95, zt - 0.53, zt - 0.1, iceX - wellHalf, iceX + wellHalf, iceY - wellHalf, iceY + wellHalf);
    for (let i = 0; i < 4; i++) { const a0 = x0 + 0.08 + i * 1.935, a1 = a0 + 1.86, m = (a0 + a1) / 2;          // four panelled doors, each with a brass bin pull
      B.bev(OAKT, a0, a1, 1.95, 2.0, 0.4, zt - 0.2, 0.012); B.bev(OAKT, a0 + 0.2, a1 - 0.2, 2.0, 2.04, 0.62, zt - 0.42, 0.03);
      K.cupPull(B, m, 2.042, zt - 0.6); }
    cutCounter(B, OAKT, x0 - 0.06, x1 + 0.06, 0.02, 2.12, zt - 0.102, zt + 0.08, iceX - wellHalf, iceX + wellHalf, iceY - wellHalf, iceY + wellHalf); P.put(B, OAKT, new THREE.CylinderGeometry(0.09, 0.09, x1 - x0 + 0.12, 10).rotateZ(Math.PI / 2).translate(0, 2.12, zt - 0.01));      // the worn top and its bullnose
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
    {
      K.basin(B, 'c#908d86/0.32/0.85', iceX, iceY, z + 0.019, 0.675, 0.675, 0.44, { rim: 0.085, e: 10 });
      const ice = K.geom.softBox(-0.065, 0.065, -0.066, 0.066, 0, 0.11, 0.027, { n: [1, 1, 1] });
      for (let i = 0; i < 14; i++) {
        const x = iceX - 0.37 + (i % 5) * 0.154, y = iceY - 0.34 + Math.floor(i / 5) * 0.17;
        K.put(B, i % 3 ? 'c#dce7e2/0.26/0.15' : 'c#ebeeea/0.18/0.2', ice.clone(), { rz: 1.9 * i, at: [x, y, z - 0.39] });
      }
      K.put(B, BRUSH0, K.geom.loft([{ a: 0.025, b: 0.025, z: 0 }, { a: 0.105, b: 0.2, z: 0.035 }, { a: 0.098, b: 0.19, z: 0.1 }, { a: 0.082, b: 0.172, z: 0.092 }, { a: 0.025, b: 0.025, z: 0.015 }], { seg: 16 }), { rz: 0.41, at: [iceX + 0.11, 1.23, z - 0.25] });
      tube(B, BRUSH0, [[iceX + 0.05, 1.39, z - 0.17], [iceX - 0.02, 1.56, z - 0.12], [iceX - 0.1, 1.75, z + 0.07]], 0.031, 8, true);
      const speedRail = zt - 1.25;
      B.bev(BRUSH0, -1.49, 1.49, 2.034, 2.58, speedRail - 0.038, speedRail, 0.016);
      B.bev(BRUSH0, -1.48, 1.48, 2.55, 2.59, speedRail - 0.02, speedRail + 0.44, 0.016);
      for (const x of [-1.47, 1.47]) B.bev(BRUSH0, x - 0.019, x + 0.019, 2.045, 2.571, speedRail - 0.02, speedRail + 0.43, 0.012);
      for (let i = 0; i < 4; i++) G.bottle(B, 'spirit', -1.0 + i * 0.62, 2.31, speedRail, [AMB, CLR, AMB, GRN][i], { label: LAB, spout: true, seg: 8 });
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
    const sinkLeft = -1.46, sinkRight = 0.18, sinkBack = 0.51, sinkFront = 1.62, worktop = 3.1;
    Gs.box(OAKD, x0 + 0.1, x1 - 0.1, 0.2, 1.75, 0, 0.3);
    Gs.bev(WALD, x0, x1, 0.06, 1.88, 0.3, 2.46, 0.019);
    cutCounter(Gs, WAL, x0, x1, 0.06, 1.9, 2.44, 2.983, sinkLeft, sinkRight, sinkBack, sinkFront);
    cutCounter(Gs, STONE, x0 - 0.03, x1 + 0.03, 0.04, 2.06, 2.981, worktop, sinkLeft, sinkRight, sinkBack, sinkFront);
    Gs.bev(STONE, x0 - 0.03, x1 + 0.03, 0.04, 0.13, worktop - 0.005, worktop + 0.3, 0.02, { grain: 'x' });
    K.basin(Gs, 'c#aaa9a2/0.28/0.86', -0.64, 1.065, worktop + 0.018, 0.9, 0.635, 0.55, { rim: 0.105, e: 10 });
    K.tap(Gs, -0.64, 0.26, worktop, { mat: C.CHROME, height: 0.96, reach: 0.79 });
    for (const [left, right] of [[x0 + 0.08, -0.04], [0.04, x1 - 0.08]]) {
      K.shakerDoor(Gs, WAL, left, right, 0.49, 2.65, 1.9, { hinge: left < 0 ? 'left' : 'right', knobZ: 2.39 });
    }
    const apron = Gs.sub(-0.72, 1.955, 2.51, 0);
    tube(apron, BRASS, [[-0.42, -0.025, 0], [-0.42, 0.14, 0], [0.42, 0.14, 0], [0.42, -0.025, 0]], 0.018, 7, true);
    K.hangingTowel(apron, -0.021, 0.14, 0.015, 0.57, 0.79, 'linen#a19a7f');
    Gs.block(x0, x1, 0, 2.06, 0, 3.1);
    // the hatch of the dumb-waiter, in the west wall: an oak door in a brass frame, and its bell-push
    Gs.box(BRASS, 0.35, 1.95, 0.02, 0.07, 3.5, 5.3); Gs.bev(OAK, 0.45, 1.85, 0.07, 0.12, 3.6, 5.2, 0.015); Gs.cyl(BRASS, 1.65, 0.14, 4.4, 4.5, 0.04, 0.04, 8);
    // two racks of clean glasses on the wall above, upside down, and a candle lamp at the end
    for (const z of [6.0, 7.2]) { Gs.bev(OAK, x0 + 0.1, x1 - 0.1, 0.04, 0.85, z - 0.08, z, 0.015); for (let i = 0; i < 6; i++) ves(Gs, 'glass', x0 + 0.45 + i * 0.62, 0.45, z, [[0, 0], [0.1, 0], [0.11, 0.32], [0.1, 0.32], [0, 0.3]], 8); }
    for (let i = 0; i < 4; i++) ves(Gs, 'glass', 1.2 + (i % 2) * 0.3, 1.2 + Math.floor(i / 2) * 0.3, 3.12, [[0, 0], [0.1, 0], [0.11, 0.32], [0.1, 0.32], [0, 0.3]], 8);      // drying on the stone
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
    Cn.bev('marble', -h - 0.22, h + 0.22, -0.08, 2.73, 3.19, TOP, 0.052);      // honed stone, eased on all four edges
    hcyl(Cn, BRASS, 'x', 0, 3.1, 0.6, 2 * h, 0.04, 0.04, 10); for (const x of [-h + 0.3, 0, h - 0.3]) tube(Cn, BRASS, [[x, 2.52, 0.6], [x, 3.1, 0.6]], 0.03, 5);      // the foot rail
    Cn.block(-h - 0.2, h + 0.2, -0.05, 2.8, 0, TOP);
    // the machine, at the north end (the right, from the stools: Anna asked for it there): a two-group lever machine, after the house's (my_house coffee_bar.js), its groups toward the robot:
    // a chrome base on a drip tray with a grate, a copper boiler banded in brass with a domed top and a finial, a gauge,
    // two lever groups with portafilters locked in, a steam wand and a hot-water tap with black knobs, cups warming on top
    { const e = Cn.sub(-1.75, 1.0, TOP, 2), CHR = C.CHROME, STL = 'c#9a9a96/0.25/1', BLK = C.BLACK;
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
    // by the machine, at the counter's north end: two milk jugs (the knock box, tamper and saucers went: the top is kept light)
    { const z = TOP;
      for (const [x, yy, s2] of [[-3.1, 1.45, 1], [-3.25, 1.82, 0.8]]) { ves(Cn, 'c#c6c2ba/0.2/1', x, yy, z, [[0, 0], [0.13 * s2, 0], [0.14 * s2, 0.25 * s2], [0.12 * s2, 0.4 * s2], [0, 0.4 * s2]], 12); tube(Cn, 'c#c6c2ba/0.2/1', [[x + 0.12 * s2, yy, z + 0.35 * s2], [x + 0.22 * s2, yy, z + 0.3 * s2], [x + 0.13 * s2, yy, z + 0.1 * s2]], 0.015, 4); }
    }
    { const x = -3.1, y = 0.7, z = TOP; Cn.box('c#2a2622/0.4', x - 0.22, x + 0.22, y - 0.28, y + 0.28, z, z + 0.95); ves(Cn, 'glass', x, y, z + 0.95, [[0.08, 0], [0.2, 0.4], [0.21, 0.46], [0, 0.46]], 10); ves(Cn, 'c#3a2214/0.9', x, y, z + 0.99, [[0.08, 0], [0.16, 0.28], [0, 0.3]], 8); }
    // the shaker station at the south end (the left, from the stools): brown sugar syrup, a Boston shaker, ice; the cut lemons on their board
    { const z = TOP;
      bottle(Cn, 1.5, 0.5, z, { r: 0.1, h: 0.85, col: 'c#5a2a10/0.2', label: 'c#e8dcc4/0.8', cap: BRASS });
      ves(Cn, C.CHROME, 1.12, 0.45, z, [[0, 0], [0.12, 0], [0.16, 0.6], [0.155, 0.6], [0, 0.04]], 12);
      ves(Cn, C.CHROME, 1.3, 0.95, z, [[0, 0], [0.2, 0], [0.23, 0.35], [0.21, 0.35], [0, 0.03]], 12); for (let i = 0; i < 5; i++) ball(Cn, 'c#e6eef0/0.05', 1.3 + (i % 3 - 1) * 0.08, 0.95 + (i % 2 - 0.5) * 0.08, z + 0.26, 0.05, 5);
      Cn.bev(OAK, 1.95, 3.0, 0.14, 0.64, z, z + 0.06, 0.015); for (const [dx, dy] of [[0.15, 0.08], [0.4, 0.05]]) ves(Cn, 'c#e8c73a/0.5', 2.1 + dx, 0.36 + dy, z + 0.06, [[0, 0], [0.09, 0.03], [0.11, 0.08], [0.1, 0.09], [0, 0.09]], 10);
      tube(Cn, 'c#c6c2ba/0.2/1', [[2.6, 0.32, z + 0.08], [2.9, 0.27, z + 0.08]], 0.016, 4); tube(Cn, OAKD, [[2.4, 0.37, z + 0.08], [2.6, 0.32, z + 0.08]], 0.025, 5);
    }
    // the pastry and the filter coffee stand on the back bar's working top now (Anna: the bar was cluttered): croissants under
    // a glass dome, the carafe; the fries and an espresso martini from the banquette's tables wait there too (walk round by the
    // counter's south end for those). The croissant's and the coffee's reach is longer, so both can still be taken from the
    // guests' side of the counter, by looking at them.
    { const Bb = fr(13.5, 64.4, 3), z = 3.08;
      { const x = 0.6, y = 1.25;      // (between the hutch's uprights at -1.3 and 1.3, clear of the fruit bowl)
        ves(Bb, WAL, x, y, z, [[0, 0], [0.62, 0], [0.64, 0.06], [0, 0.07]], 18);
        for (const [dx, dy, t] of [[-0.18, -0.1, 0.4], [0.2, 0.08, 2.2]]) f.model('croissant', Bb, x + dx, y + dy, z + 0.07, 0, { turn: t });
        ves(Bb, 'glass', x, y, z + 0.07, [[0.6, 0], [0.6, 0.48], [0.5, 0.74], [0.28, 0.88], [0.08, 0.92], [0.05, 1.0], [0, 1.02]], 16);
        help(Bb, x, y, z + 0.3, { name: 'croissant', model: 'croissant', bites: 3, reach: 9.5, note: 'You finish the croissant. The flakes are everywhere, which is correct.' }); }
      { const x = -2.9, y = 0.7;
        ves(Bb, 'glass', x, y, z + 0.006, [[0, 0], [0.2, 0], [0.24, 0.2], [0.1, 0.42], [0.1, 0.5], [0.2, 0.72], [0, 0.72]], 12); ves(Bb, 'c#2e1a0e/0.2', x, y, z + 0.02, [[0, 0], [0.19, 0], [0.22, 0.18], [0.12, 0.34], [0, 0.34]], 10);
        Bb.cyl(WAL, x, y, z + 0.42, z + 0.52, 0.12, 0.12, 10);
        help(Bb, x, y, z + 0.5, { name: 'cup of filter coffee', reach: 9.5, drink: { vessel: 'demitasse', liquid: 0x2e1a0e }, note: 'You finish the coffee. Clean, bright, and a little pleased with itself.' }); }
      G.fries(Bb, -2.35, 1.35, z); help(Bb, -2.35, 1.35, z + 0.25, { name: 'handful of truffle fries', build: EAT.fries, bites: 4, plural: true, note: 'You finish the fries. Parmesan, truffle, salt, and the aioli was the point.' });
      G.martini(Bb, 1.45, 1.8, z); help(Bb, 1.45, 1.8, z + 0.45, { name: 'espresso martini', build: EAT.martini, bites: 3, note: 'You finish the espresso martini: cold, bitter, sweet, awake. The beans are for luck.' });
    }
    pillarLit(Cn, 1.72, 2.3, TOP, 0.4, 0.11);      // one candle, between the first two stools
    // the top is kept bare in front of each stool (stools at x 2.6, 0.85, -0.9, -2.65) and for a foot and a half before the barman (x 0)
    for (const x of [-1.6, 1.6]) tube(Cn, BRASS, [[x, 2.62, TOP - 0.3], [x, 2.75, TOP - 0.32], [x, 2.78, TOP - 0.5], [x, 2.7, TOP - 0.55]], 0.015, 4);      // purse hooks under the top

  }
  prof('stools');
  { const S = fr(23.3, 64.6, 1); for (const x of [-2.6, -0.85, 0.9, 2.65]) barStool(S, x, 0, 2.5, Math.PI); }      // q 1: x runs north, +y west; four stools facing west, to the counter, backs to the room

  prof('record wall');
  // Freestanding listening console on tapered feet, sleeves stored on edge.
  { const S = fr(19.9,40.75), top=2.63;
    for (const x of [-2.64,2.64]) for (const y of [0.47,1.55])
      tube(S,WAL,[[x*1.04,y,0.03],[x,y,0.67]],0.075,10,true);
    S.bev(WAL,-3.05,3.05,0.18,1.95,top-0.12,top,0.035);
    S.bev(WAL,-3,3,0.23,1.9,0.62,0.74,0.022);
    S.box(WALD,-2.92,2.92,0.24,0.32,0.74,top-0.12);
    for (const x of [-2.95,-0.36,2.95]) S.bev(WAL,x-0.05,x+0.05,0.24,1.89,0.74,top-0.12,0.014);
    const paper = ['c#d5c4a5/0.9','c#4d5a53/0.9','c#88574b/0.9','c#41454d/0.9'];
    for (let i=0;i<21;i++) {
      const lean=i<12 ? 0.08 : -0.14, x=-2.83+i*0.085+(i>=12?0.33:0);
      const sleeve = K.geom.bev(-0.029,0.029,-0.51,0.51,0,1.03,0.005).rotateY(lean);
      K.put(S,paper[i%4],sleeve,{at:[x,1.18+0.045*Math.sin(i*2),0.746]});
    }
    // Sliding tambour door on the right, recessed pull and a visible shadow line.
    S.bev(WALD,-0.26,2.86,1.72,1.78,0.80,2.45,0.012);
    for (let i=0;i<30;i++) {
      const x=-0.21+i*0.102;
      S.bev(WAL,x,x+0.091,1.77,1.82,0.81,2.44,0.013,{grain:'z'});
    }
    S.bev(BRASS,2.49,2.53,1.82,1.88,1.42,1.76,0.012);
    S.block(-3.05,3.05,0.2,1.95,0,top);
    f.recordPlayer(S,-1.24,1.03,top);
    S.bev(WAL,0.6,2.38,0.51,1.53,top,top+0.38,0.028);
    S.bev('c#b6a78d/0.48/0.7',0.64,2.34,1.53,1.56,top+0.027,top+0.35,0.012);
    S.box('c#433e34/0.32',0.76,1.73,1.56,1.57,top+0.16,top+0.28);
    for (const x of [1.92,2.17]) hcyl(S,BRUSH0,'y',x,1.61,top+0.19,0.085,0.078,0.078,16);
    for (const side of [-1,1]) {
      const x=side*4.05, turn=side*0.14;
      const cabinet=(mat,g)=>K.put(S,mat,g.rotateZ(turn),{at:[x,1.0,0]});
      cabinet(WALD,K.geom.bev(-0.48,0.48,-0.42,0.42,0,0.25,0.025));
      cabinet(WAL,K.geom.bev(-0.59,0.59,-0.49,0.49,0.25,2.53,0.04));
      cabinet('linen#827867',K.geom.bev(-0.52,0.52,0.49,0.53,0.33,2.45,0.032));
      cabinet(BRASS,K.geom.bev(0.28,0.43,0.529,0.54,0.49,0.53,0.004));
      S.block(x-0.65,x+0.65,0.42,1.61,0,2.53);
    }
    // (Anna: "perhaps the wall can, instead of the lights, be like a grid of framed record covers (find real ones)"; and then,
    // of Golden Autumn in the middle: "I meant instead of golden autumn at all, we just have the records. so it's its own
    // thing." So: a record shop's wall, twelve sleeves in one band over the console, six wide and two high, each a true
    // twelve inches in a thin frame of the room's walnut, evenly spaced, under the pelmet. All twelve are in the public
    // domain in the United States: see assets/credits/larder.md for each one's source and why.)
    { const PD = 'Public domain in the United States. Image via Wikimedia Commons.', COLS = [-3.375, -2.025, -0.675, 0.675, 2.025, 3.375], ROWS = [6.3, 4.95];
      const ORDER = ['lp_giant_steps', 'lp_gershwin_songs', 'lp_soultrane', 'lp_black_brown_beige', 'lp_elvis_presley', 'lp_takin_off', 'lp_blue_train', 'lp_cole_porter_songs', 'lp_hip_harp', 'lp_bossa_nova_pops', 'lp_bing_in_paris', 'lp_ed_higgins_trio'];      // the hang, row by row from the top
      const sleeves = [
        ['lp_giant_steps', 'Giant Steps', 'John Coltrane, 1960', 'Atlantic 1311. Marvin Israel\'s design round Lee Friedlander\'s photograph: the record that made every saxophonist go home and practise.'],
        ['lp_gershwin_songs', 'George Gershwin Songs, Vol. 1', 'Bing Crosby and others, 1939', 'A Decca album of 78s, made two years after Gershwin died: the discs bound in a book, which is why a record is still called an album.'],
        ['lp_black_brown_beige', 'Black, Brown and Beige', 'Duke Ellington, 1946', 'RCA Victor. Ellington at the piano before Carnegie Hall, where the suite was first played in 1943.'],
        ['lp_elvis_presley', 'Elvis Presley', 'Elvis Presley, 1956', 'RCA Victor LPM-1254. Pink and green letters down the side and along the foot: half the sleeves made since have borrowed them.'],
        ['lp_soultrane', 'Soultrane', 'John Coltrane, 1958', 'Prestige 7142. A square of blue, a corner of a face, and nothing else: Esmond Edwards\'s sleeve.'],
        ['lp_blue_train', 'Blue Train', 'John Coltrane, 1958', 'Blue Note 1577. Francis Wolff\'s photograph, taken at the session; Reid Miles made it blue.'],
        ['lp_takin_off', 'Takin\' Off', 'Herbie Hancock, 1962', 'Blue Note 84109. His first record, at twenty-two, with Watermelon Man on it.'],
        ['lp_bossa_nova_pops', 'Fly Me to the Moon and the Bossa Nova Pops', 'Joe Harnell, 1963', 'Kapp KS-3318. A patchwork moon for the year America discovered the bossa nova.'],
        ['lp_hip_harp', 'Hip Harp', 'Dorothy Ashby with Frank Wess, 1958', 'Prestige 7140. A concert harp in a jazz quartet, and it swings.'],
        ['lp_cole_porter_songs', 'Bing Crosby Sings Cole Porter Songs', 'Bing Crosby, 1949', 'Decca. Begin the Beguine, Easy to Love, I Love You.'],
        ['lp_bing_in_paris', 'Bing in Paris', 'Bing Crosby, 1958', 'Decca DL 8780. Bing Crosby sings the French hits, in a straw hat, with Paris behind him.'],
        ['lp_ed_higgins_trio', 'The Ed Higgins Trio', 'Eddie Higgins, 1957', 'Replica. A Chicago piano trio at work, in the dark, under three yellow diamonds.'],
      ];
      ORDER.forEach((slug, i) => { const [, title, kicker, text] = sleeves.find(s => s[0] === slug); f.framed(S, COLS[i % 6], ROWS[Math.floor(i / 6)], 1.08, 1.08, slug, { frame: WALD, mat: 0, border: 0.06, title, kicker, text, foot: PD }); }); }
    // the lanterns are gone from this wall: a walnut pelmet over the whole hang hides a wash that grazes down the stone
    // (the wash glows; one unseen lamp before the pelmet does the lighting)
    S.bev(WAL, -4.5, 4.5, 0.0, 0.42, 7.58, 7.67, 0.015); S.bev(WAL, -4.5, 4.5, 0.36, 0.42, 7.44, 7.6, 0.012);
    wash(S, -4.35, 4.35, 0.1, 0.3, 7.555, 7.58);
    K.lampAt(S, 0, 1.7, 7.2, 0.75);      // (one, in the middle and a little out from the wall: two close in made a hot spot each)
    // on the console: tulips in a jar at the left end, and three books lying on the receiver
    K.posy(S, -2.74, 0.7, top, ['c#e0a23a/0.55', 'c#d9694a/0.55', 'c#f4ddae/0.6'], { kinds: ['tulip'], jar: 'c#ded6c4/0.35', scale: 1.2 });      // (smaller and nearer the wall than they were, to stand under the sleeves and not across them)
    [['c#7a2f2a/0.7', 0.62, 0.9, 0.05], ['c#2f4a44/0.7', 0.56, 0.84, 0.07], ['c#c9a45c/0.6', 0.5, 0.74, -0.04]].forEach(([mat, w, d, turn], i) =>
      K.put(S, mat, K.geom.bev(-w / 2, w / 2, -d / 2, d / 2, 0, 0.11, 0.012).rotateZ(turn), { at: [1.05, 1.0, top + 0.38 + i * 0.112] }));
  }

  prof('shelf wall');
  // ---- the shelf wall on the west wall, south of the cave's door: preserves, teas and coffees, lit under every shelf -----
  { const Pq=fr(13.5,48.4,3), SH=[0.76,1.96,3.22,4.55];
    // An open oak bookcase against the stone. Leave gaps for the ceramics and tray.
    for (const x of [-4.45,0,4.45]) for (const y of [0.12,0.93])
      Pq.bev(WAL,x-0.055,x+0.055,y-0.055,y+0.055,0,4.57,0.014,{grain:'z'});
    for (const z of SH) Pq.bev(OAK,-4.56,4.56,0.07,1.03,z-0.09,z,0.019);
    Pq.block(-4.56,4.56,0.07,1.03,0,4.55);
    // (Anna: "that shelf too could have some love": arranged shelf by shelf, with room left empty on purpose. From the top:
    //  a brass lamp at the north end, a small landscape leaning on the stone, three books lying flat, the celadon jug, and a
    //  pothos at the south end trailing down the side; the larder shelf under it (the things to eat) is left as it was;
    //  then two runs of books each stopped by a brass bookend, a jar of flowers in the gap, the pears; and on the lowest
    //  shelf the music books, a crock and a short stack lying flat.)
    const bookend = (x, z, side) => { Pq.bev(BRASS, x - 0.015, x + 0.015, 0.22, 0.7, z, z + 0.46, 0.006); Pq.bev(BRASS, Math.min(x, x + side * 0.34), Math.max(x, x + side * 0.34), 0.24, 0.68, z, z + 0.02, 0.005); };
    K.bookRow(Pq,-4.32,-1.6,0.1,SH[0],1.04,0.92,{subject:['music','film','poetry']}); bookend(-1.52, SH[0], 1);
    G.crock(Pq,1.0,0.52,SH[0],1.0,'c#aaa38d/0.5');
    K.bookStack(Pq, 3.2, 0.5, SH[0], 3, { subject: 'art' });
    K.bookRow(Pq,0.2,2.5,0.1,SH[1],1.02,0.95,{subject:['cooking','garden','art']}); bookend(2.58, SH[1], 1);
    K.bookRow(Pq,-4.3,-2.3,0.1,SH[1],1.03,0.95,{subject:['literature','travel']}); bookend(-2.22, SH[1], 1);
    K.posy(Pq, -1.05, 0.52, SH[1], ['c#f2ead8/0.8', 'c#e8b0a8/0.8', 'c#d9694a/0.7'], { jar: 'c#889586/0.4', scale: 0.85 });
    // the top
    G.tableLampB(Pq,-3.6,0.53,SH[3],1.05);
    G.leaningPrint(Pq, -1.9, 0.14, SH[3], 0.95, 0.72, (g, W, H) => {      // a small landscape in gouache: a low sun over a field and a far blue hill
      D.fill(g, W, H, '#ead9b8'); g.fillStyle = '#d98a4a'; g.beginPath(); g.arc(W * 0.68, H * 0.36, H * 0.16, 0, 6.3); g.fill();
      g.fillStyle = '#6f8fa3'; g.beginPath(); g.moveTo(0, H * 0.58); g.quadraticCurveTo(W * 0.3, H * 0.36, W * 0.62, H * 0.56); g.quadraticCurveTo(W * 0.82, H * 0.48, W, H * 0.6); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = '#c9a03a'; g.beginPath(); g.moveTo(0, H * 0.7); g.quadraticCurveTo(W * 0.5, H * 0.6, W, H * 0.72); g.lineTo(W, H); g.lineTo(0, H); g.fill();
      g.fillStyle = '#5a6f3c'; g.beginPath(); g.moveTo(0, H * 0.86); g.quadraticCurveTo(W * 0.45, H * 0.76, W, H * 0.88); g.lineTo(W, H); g.lineTo(0, H); g.fill(); });
    G.booksFlat(Pq,-0.6,0.57,SH[3],3,['c#65756a/0.8','c#b59b75/0.85','c#6c4940/0.8']);
    G.jug(Pq,2.5,0.53,SH[3],0.96,'c#889586/0.4');
    K.pottedPlant(Pq, 3.95, 0.55, SH[3], 'trailing', { size: 0.75, pot: 'c#d9cfbd/0.5', block: false });
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
  //      records on the floor, candles and a plant
  f.rug(14.7, 25.8, 43.2, 53.6, F0, 'tabriz'); f.rug(17.2, 22.6, 45.6, 49.6, F0 + 0.025, 'kilim');      // a second rug laid over the first
  K.sofa(fr(20.5, 53.3, 2), 6.5, 'leather#f2b878', ['wool#e8dcc4', 'wool#c9a03a', 'linen#efe6d2', 'wool#a84a2a'], { throw: 'wool#a84a2a' });
  f.model('mid_century_lounge_chair',fr(25.35,47.5,1),0,0,0,0,{turn:-0.34,scale:0.91,seat:1.32,collide:true}); K.pouf(fr(17.0, 46.6, 0), 0, 0, { r: 0.75, h: 1.15, fabric: 'wool#6a7a4a' }); f.seat(fr(17.0, 46.6, 0), 0, 0, 1.15, 'sit on the pouf');
  { const A = fr(20.5, 47.6, 0);
    { const tw = 1.4, td = 0.8, h = 1.3;      // the marble coffee table on four brass legs
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) A.cyl(C.IRON, sx * (tw - 0.2), sy * (td - 0.15), 0, h - 0.08, 0.04, 0.04, 6);
      A.bev(OAKT, -tw, tw, -td, td, h - 0.12, h, 0.03); A.block(-tw, tw, -td, td, 0, h); }
    const z = 1.3 + 0.002;
    G.booksFlat(A, -0.95, 0.15, z, 3, ['c#e8e0cc/0.6', 'c#26364f/0.6', 'c#c9a46a/0.6']);       // art books
    pillarLit(A, 0.9, 0.2, z, 0.4, 0.12);      // (Anna: the tables lighter: the art books, one candle, and a hot chocolate someone has just been brought)
    G.hotChoc(A, -0.6, -0.5, z); help(A, -0.6, -0.5, z + 0.5, { name: 'hot chocolate with whipped cream', build: EAT.hotchoc, bites: 4, note: 'You finish the hot chocolate. Thick, dark, and there is cream on your nose.' });
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
    // (Anna: "tables are a bit cluttered too, there should mostly be only what you ordered there": each table is bare but
    //  for its lamp or candle; the middle one keeps the Poulsard and a glass, as if someone had just been there. The cheese,
    //  the bread and the pears went to the shelf wall, the fries and the martini to the back bar: all still to be taken.)
    pillarLit(A, -0.55, -0.45, z, 0.3, 0.09);
    G.bottle(B, 'burgundy', -0.5, -0.3, z, 'c#2a3a1a/0.15', { foil: 'c#6a1622/0.4', label: 'c#efe6d2/0.8' });
    help(B, -0.5, -0.3, z + 0.8, { name: 'glass of Poulsard', drink: { vessel: 'wine', liquid: 0x8a2230 }, note: 'You finish the Poulsard: pale, red-currant, a little wild. Jura, like the Comté.' });
    wineGlass(B, -0.1, -0.55, z + 0.006, 'c#6a1622/0.2');
  }
  // on the shelf wall, within reach: the cheese board on wax paper (Comté with its stamped rind, Fourme d'Ambert, figs and
  // grapes, a knife), the bread on its board, a bowl of pears
  { const Pq = fr(13.5, 48.4, 3), z = 3.22;
    { const x = -1.2, y = 0.52; Pq.box('c#efe8d8/0.9', x - 0.62, x + 0.5, y - 0.4, y + 0.38, z, z + 0.008); Pq.bev(OAK, x - 0.55, x + 0.55, y - 0.32, y + 0.32, z + 0.008, z + 0.08, 0.02); const zz = z + 0.08;
      P.cheeseWedge(Pq, x - 0.4, y - 0.18, zz, 0.6, 0.3, 0.1, 0.7, 'comte');
      { const g = x + 0.3, h = y - 0.05; ves(Pq, 'c#8a7a5a/0.9', g, h, zz, [[0, 0], [0.16, 0], [0.16, 0.3], [0, 0.3]], 12); P.blueTop(Pq, g, h, zz + 0.3, 0.16); }
      grapes(Pq, x + 0.05, y + 0.18, zz, 'c#4a2a48/0.35', 10); for (let k = 0; k < 2; k++) fruit(Pq, 'fig', x - 0.15 + k * 0.17, y + 0.2, zz, 0.9);
      tube(Pq, 'c#c6c2ba/0.2/1', [[x + 0.2, y - 0.3, zz + 0.02], [x + 0.55, y - 0.36, zz + 0.02]], 0.02, 4); tube(Pq, OAKD, [[x + 0.55, y - 0.36, zz + 0.02], [x + 0.78, y - 0.4, zz + 0.02]], 0.03, 5);
      help(Pq, x - 0.3, y - 0.1, zz + 0.35, { name: 'piece of Comté', build: EAT.comte, bites: 2, note: 'You finish the Comté: hazelnut, brown butter, a crunch of crystals. Twenty-four months on spruce.' });
      help(Pq, x + 0.3, y - 0.05, zz + 0.4, { name: "crumb of Fourme d'Ambert", build: EAT.blue, bites: 2, note: 'You finish the blue. Mild, creamy, and blue only where it matters.' });
      help(Pq, x + 0.05, y + 0.18, zz + 0.15, { name: 'bunch of grapes', build: EAT.grapes, bites: 4, note: 'You finish the grapes. Muscat: they taste of flowers.' });
      help(Pq, x - 0.1, y + 0.2, zz + 0.2, { name: 'fig', build: EAT.fig, bites: 2, note: 'You finish the fig. Jammy, and full of seeds.' }); }
    { const x = 1.9, y = 0.52; Pq.bev(OAK, x - 0.45, x + 0.45, y - 0.25, y + 0.25, z, z + 0.06, 0.02); loaf(Pq, x, y, z + 0.06, 0.72, 0.21);
      help(Pq, x, y, z + 0.3, { name: 'heel of sourdough', build: EAT.bread, bites: 3, note: 'You finish the bread. A good crust is half the cheese.' }); }
    { const x = 3.65, y = 0.52, z1 = 1.96; bowl(Pq, x, y, z1, 0.3, 0.18, 'c#e8dcc4/0.35', 12); for (const [dx, dy] of [[-0.08, 0], [0.1, 0.05], [0, -0.1]]) fruit(Pq, 'pear', x + dx, y + dy, z1 + 0.08);
      help(Pq, x, y, z1 + 0.4, { name: 'pear', build: EAT.pear, bites: 3, note: 'You finish the pear. A Comice, ripe to the minute.' }); }
  }
  function C0b(T, x, y, z) {
    T.box('c#efe8d8/0.9', x - 0.55, x + 0.45, y - 0.42, y + 0.36, z, z + 0.008); T.bev(OAK, x - 0.5, x + 0.5, y - 0.32, y + 0.32, z + 0.008, z + 0.08, 0.02); const zz = z + 0.08;
    P.cheeseWedge(T, x - 0.35, y - 0.15, zz, 0.5, 0.28, 0.15, 0.8, 'manchego');
    P.ashLog(T, x + 0.25, y + 0.15, zz, 0.45); P.clothWheel(T, x + 0.25, y - 0.12, zz, 0.2, 0.22);
  }
  // the outside brought in: a mossy boulder and a fern at the foot of the courtyard glass, south of the table
  f.model('mossy_rock_03', fr(37.4, 43.7, 0, 0.01), 0, 0, 0, 0, { scale: 0.3, turn: 0.8, collide: true });
  { const fpot=fr(40.4,45.1);
    ves(fpot,'c#9e745c/0.7',0,0,0,[[0,0],[0.38,0],[0.42,0.08],[0.55,0.77],[0.56,0.86],[0.49,0.86],[0.47,0.75]],24);
    fpot.cyl('soil',0,0,0.73,0.77,0.47,0.47,20);
    f.model('fern_clump_d',fpot,0,0,0.71,0,{turn:2.0});
    fpot.block(-0.5,0.5,-0.5,0.5,0,1.48);
  }

  f.inZone('r:The Listening Room:big', () => {
    const St = fr(41.9, 72.45, 2), IRONS = 'c#2b2724/0.55/1';      // a small cast-iron wood stove on a stone hearth in the corner east of the stair's foot, its flue up through the double height (it glows: it does not cast)
    St.bev(STONE2, -0.8, 0.8, 0.05, 2.8, 0, 0.16, 0.03);
    // the firebox is hollow behind a real glass door: a firebrick lining, a bed of embers, three split logs burning, live flames
    St.bev(IRONS, -0.62, 0.62, 0.6, 1.75, 0.55, 0.68, 0.03); St.bev(IRONS, -0.66, 0.66, 0.56, 1.8, 2.08, 2.2, 0.04);
    St.box(IRONS, -0.62, 0.62, 0.6, 0.7, 0.68, 2.08); for (const sx of [-1, 1]) St.box(IRONS, sx * 0.52, sx * 0.62, 0.7, 1.75, 0.68, 2.08);
    St.box('e#6a2208/0.5', -0.5, 0.5, 0.7, 0.74, 0.68, 2.0); for (const sx of [-1, 1]) St.box('c#1e100a/0.95', sx * 0.48, sx * 0.52, 0.74, 1.7, 0.68, 2.0);      // firebrick
    St.box(IRONS, -0.62, 0.62, 1.7, 1.8, 0.68, 0.8); St.box(IRONS, -0.62, 0.62, 1.7, 1.8, 1.72, 2.08); for (const sx of [-1, 1]) St.box(IRONS, sx * 0.42, sx * 0.62, 1.7, 1.8, 0.8, 1.72);      // the door's frame
    St.box('e#c0501a/0.25', -0.42, 0.42, 1.765, 1.77, 1.62, 1.72); St.box(BRASS, 0.5, 0.56, 1.8, 1.9, 1.15, 1.45);      // the door stands open a crack: no glass between you and the fire; a warm amber lip of glow along its top; the handle
    St.box('e#e0400a/0.7', -0.47, 0.47, 0.76, 1.68, 0.68, 0.72);      // the embers
    for (const [x, y, r] of [[-0.3, 1.2, 0.06], [0.25, 1.45, 0.05], [0.05, 0.95, 0.055], [-0.1, 1.55, 0.045]]) ball(St, 'e#ff6a1a/0.9', x, y, 0.72, r, 5);
    const [fx,fy] = St.map(0,1.26), [nx,ny] = St.map(0,2.26);
    f.later(ctx => stoveFire(ctx, f.world, { c:[fx,fy,F0+.72], n:[nx-fx,ny-fy], w:.83,d:.63,tall:.92,floor:F0,zone:'r:The Listening Room:big' }));
    for (const sx of [-0.5, 0.5]) for (const sy of [0.75, 1.6]) St.cyl(IRONS, sx, sy, 0.16, 0.55, 0.05, 0.07, 6);
    { const [lx, ly] = St.map(0, 2.9); const lamp = f.lamp(lx, ly, F0 + 0.35, { power: 0.25, kind: 'candle' }); f.later(() => { lamp.kind = 'fire'; }); }      // a warm flicker on the floor in front
    St.cyl(IRONS, 0, 1.15, 2.2, 21.82 - F0, 0.2, 0.2, 12); St.block(-0.8, 0.8, 0.05, 2.0, 0, 2.3);
    // a basket of split logs on the hearth beside it
    ves(St, 'c#8a6038/0.95', -0.4, 2.3, 0.16, [[0, 0], [0.32, 0], [0.38, 0.45], [0.36, 0.47], [0, 0.04]], 14); P.put(St, 'c#6a4626/0.9', new THREE.TorusGeometry(0.37, 0.03, 5, 20).translate(-0.4, 2.3, 0.62));
    storedLogs(K,St,-.4,2.3,.21,.69,.115,3,3);
    storedLogs(K,St,.45,2.35,.16,.75,.12,1,1);
  });
  G.lushPlant(fr(34.0, 43.9, 0), 0, 0, 0, 1.4, { n: 24 });      // a big plant that has grown big, by the way in
  { const Sb = fr(28.8, 68.3, 2);      // a long low bench against the stair's stone side, facing the room; x = 28.8 - X, +y south
    Sb.bev(OAK, -3.6, 3.6, 0.05, 1.7, 0.15, 1.15, 0.03); Sb.box(OAKD, -3.5, 3.5, 0.1, 1.55, 0, 0.15); Sb.block(-3.6, 3.6, 0, 1.7, 0, 1.4);
    for (const x of [-2.4, 0, 2.4]) { pad(Sb, x, 0.9, 1.15, 2.3, 1.55, 'velvet#4a1616', 0.36); f.seat(Sb, x, 0.95, 1.5, 'sit on the bench'); }
    for (const [x, c] of [[-2.9, 'wool#c9b48a'], [-1.9, 'velvet#24402e'], [1.6, 'linen#e8dcc4'], [2.7, 'velvet#b5853a']]) upright(Sb, x, 0.35, 1.5, 1.1, 1.0, c, 0.3, 0.32);
    K.cushion(Sb, 0.6, 0.95, 1.6, 1.4, 1.2, 'wool#e8dcc4', { tilt: Math.PI / 2, thick: 0.2, n: 6 }); }      // a folded blanket

  prof('the void');
  // ---- the double-height part: an olive in a big clay jar by the pool's wall, a cluster of paper lanterns in the void -------
  { const O = fr(34.4, 66.0, 0); G.lushPlant(O, 0, 0, 0, 2.0, { n: 30, height: 3.2, leaf: 1.0 }); }      // a fiddle-leaf fig grown tall in the double height, in a big clay pot
  { const zc = 21.8 - F0, V = fr(29.5, 67.2, 0);
    V.cyl(BRASS, 0, 0, zc - 0.08, zc + 0.02, 1.82, 1.82, 32);
    V.cyl(WALD, 0, 0, zc - 0.14, zc - 0.07, 1.73, 1.78, 32);
    const globes = [[0, 0, 13.6, 0.55], [1.3, 0.4, 14.6, 0.45], [-1.2, 0.6, 14.2, 0.5], [0.5, -1.1, 15.2, 0.42], [-0.6, -0.9, 13.9, 0.48], [1.5, -0.6, 16.0, 0.38], [0.2, 1.4, 15.8, 0.42], [1.0, 1.2, 17.0, 0.34], [0.6, 0.2, 17.6, 0.35]];
    for (const [x, y] of globes) V.cyl(BRASS, x, y, zc - 0.23, zc - 0.12, 0.075, 0.09, 10);
    const world = (x, y, h) => f.world(...V.map(x, y), F0 + h);
    f.later(ctx => hangingGlobes(ctx, world, zc - 0.2, globes, BRASS, BULB));
    K.lampAt(V, 0, 0, 14.6, 2.6);
  }

  // =============================================================================================================
  // THE CAVE (X -2.5 to 12, Y 50 to 64, 8 ft high; its door in the east wall at Y 55.5 to 58.5, swinging in)
  // =============================================================================================================
  const RINDS = ['cheese_rind#d6aa70','cheese_rind#c6a074','cheese_rind#ebc38b','cheese_rind#cca174'];

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
    Z.forEach((z,row)=>{
      for (let slot=0;slot<4;slot++) {
        if ((row*3+slot)%7===5) continue;
        const x=x0+1.49+slot*2.88+0.07*Math.sin(row+slot);
        const y=d/2+0.1*Math.cos(1.8*slot+row), r=0.94+0.09*Math.sin(slot*2.1+row);
        const h=0.31+0.06*Math.cos(row+slot*2), rind=RINDS[(slot+row)%RINDS.length];
        if ((row+slot)%4===1) P.wedge(R,x,y,z,r,h,2.18,7.36,'c#eddbad/0.65',rind);
        else if ((slot+2*row)%6===3) P.clothWheel(R,x,y,z,r*0.79,h*1.28);
        else P.stampedWheel(R,x,y,z,r,h,rind);
      }
    });
  }

  prof('bottle rack');
  // ---- the bottles: a rack of dark timber bins on the south wall, lit behind every third row --------------------------
  { const W = fr(3.6, 50, 0), x0 = -5.9, x1 = 5.6, top = 5.6, d = 1.25, nc = 24, nr = 11, cw = (x1 - x0) / nc, rh = (top - 0.5) / nr;   // x = X - 3.6 (X -2.3 to 9.2)
    W.box(WALD, x0, x1, 0.02, 0.06, 0.3, top);
    for (let i = 0; i <= nc; i++) { const x = x0 + i * cw; W.box(WAL2, x - (i % nc ? 0.025 : 0.08), x + (i % nc ? 0.025 : 0.08), 0.06, d, 0.3, top); }
    for (let j = 0; j <= nr; j++) { const z = 0.4 + j * rh; W.box(WAL2, x0, x1, 0.06, d, z - 0.04, z); if (j % 3 === 1) strip(W, x0 + 0.1, x1 - 0.1, 0.07, 0.11, z + 0.02, z + 0.06); }
    W.box(WAL2, x0 - 0.12, x1 + 0.12, 0.02, d + 0.12, top, top + 0.14); strip(W, x0, x1, 0.06, 0.16, top + 0.14, top + 0.18); W.box(WALD, x0, x1, 0.1, d - 0.05, 0, 0.3);
    for (let i = 0; i < nc; i++) for (let j = 0; j < nr; j++) {
      if (rnd() < 0.2) continue;
      const x = x0 + (i + 0.5) * cw + 0.044 * Math.sin(5.9 * i + 1.5 * j);
      const front = d - 0.05 - 0.09 * (0.5 + 0.5 * Math.cos(4.1 * i - 1.4 * j));
      const kind = (i + j * 3) % 5 < 2 ? 'burgundy' : 'bordeaux';
      G.bottleLying(W, x, front, 0.4 + j * rh, kind, pick(WINE), pick(['c#6a1622/0.4', 'c#1a1a14/0.4', 'c#b08d4a/0.3/1', 'c#e8e0cc/0.5', 'c#6a1622/0.4']), (i + j) % 5 === 0 ? 'c#efe6d2/0.8' : null);
    }
    W.block(x0, x1, 0, d, 0, top);
  }

  prof('stone bench');
  // ---- the built-in stone bench across the west end, with sheepskins and cushions; a light behind it ---------------------
  { const Sb = fr(-2.5, 57.0, 3);                           // x = 57 - Y (Y 61.3 to 52.7); +y east
    Sb.bev(STONE2,-4.15,4.15,0.08,1.59,0,1.23,0.045);
    Sb.bev('limestone_smooth#cdc5b1',-4.32,4.32,0.04,1.91,1.23,1.43,0.055);
    Sb.block(-4.32,4.32,0.03,1.91,0,1.58);
    for (const [x,w] of [[-2.8,2.54],[0,2.65],[2.8,2.55]]) {
      Sb.cushion('linen#b2a388',x-w/2,x+w/2,0.19,1.76,1.43,1.61,0.075);
      f.seat(Sb,x,1.01,1.61,'sit on the bench');
    }
    K.cushion(Sb,-2.7,0.57,1.62,1.42,1.08,'wool#697361',{tilt:0.29,turn:0.11,thick:0.24});
    K.cushion(Sb,2.5,0.56,1.62,1.29,0.94,'linen#b38a72',{tilt:0.21,turn:-0.13,thick:0.21});
  }

  prof('cave table');
  // ---- a table laid for two before the bench: a board of Comté cut into, bread, walnuts and grapes, two glasses, an open
  //      bottle of vin jaune, a jug of branches, candles; a stool opposite; a candle lantern on a chain from the vault
  { const T = fr(1.5, 57.0, 1), z = 2.45;                   // x = Y - 57; +y west (toward the bench)
    T.bev(OAK, -1.3, 1.3, -1.0, 1.0, z - 0.12, z, 0.03); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) T.bev(OAKD, sx * 1.05 - 0.08, sx * 1.05 + 0.08, sy * 0.75 - 0.08, sy * 0.75 + 0.08, 0, z - 0.12, 0.02);
    T.block(-1.3, 1.3, -1.0, 1.0, 0, z);
    { const x = -0.35, y = 0.05; T.box('c#efe8d8/0.9', x - 0.6, x + 0.55, y - 0.42, y + 0.4, z, z + 0.008); T.bev(OAK, x - 0.55, x + 0.55, y - 0.35, y + 0.35, z + 0.008, z + 0.08, 0.02); const zz = z + 0.08;
      P.cheeseWedge(T, x - 0.3, y - 0.2, zz, 0.55, 0.3, 0.15, 0.85, 'comte'); P.wheel(T,x+0.26,y+0.12,zz,0.155,0.18,'cheese_rind#c3bb9d'); P.blueTop(T,x+0.26,y+0.12,zz+0.18,0.153);
      tube(T, 'c#c6c2ba/0.2/1', [[x + 0.15, y - 0.3, zz + 0.02], [x + 0.45, y - 0.32, zz + 0.02]], 0.02, 4); tube(T, OAKD, [[x + 0.45, y - 0.32, zz + 0.02], [x + 0.65, y - 0.34, zz + 0.02]], 0.03, 5);
      help(T, x - 0.1, y - 0.1, zz + 0.4, { name: 'sliver of thirty-month Comté', build: EAT.comte, bites: 2, note: 'You finish the old Comté. Crystals, caramel, a long walk in a damp forest.' }); }
    f.model('st_bread_1',T,0.83,0.48,z+0.003,0,{scale:1.06,turn:-0.47});
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
  { const S=fr(3.6,56.85,1);
    f.model('st_stool_6',S,0,0,0,0,{turn:0.23,scale:1.04});
    S.block(-0.57,0.57,-0.5,0.5,0,1.65); f.seat(S,0,0,1.64,'sit at the table');
  }
  { const S=fr(8.6,52.6);
    f.model('st_stool_6',S,0,0,0,0,{turn:-0.38});
    S.block(-0.57,0.57,-0.5,0.5,0,1.58);
    K.cushion(S, 0, 0, 1.68, 0.8, 0.7, 'linen#d8c8a8', { tilt: Math.PI / 2, thick: 0.14, n: 5 }); tube(S, 'c#d8c8a8/0.9', [[0.35, 0.1, 1.62], [0.5, 0.15, 1.1], [0.48, 0.1, 0.8]], 0.03, 4); }      // the apron, its strings hanging
  { const Bk = fr(0.6, 61.0, 0), basket = 'wicker#c1a681';
    ves(Bk, basket, 0, 0, 0, [[0, 0], [0.38, 0], [0.39, 0.045], [0.47, 0.21], [0.55, 0.35], [0.55, 0.38], [0.51, 0.385], [0.5, 0.35], [0.43, 0.205], [0.355, 0.06], [0, 0.06]], 24);
    const rim = Array.from({ length: 33 }, (_, i) => [0.532 * Math.cos(i * TAU / 32), 0.532 * Math.sin(i * TAU / 32), 0.378]);
    tube(Bk, basket, rim, 0.025, 7);
    const handle = Array.from({ length: 15 }, (_, i) => {
      const t = i * Math.PI / 14;
      return [0.52 * Math.cos(t), -0.11, 0.34 + 0.56 * Math.sin(t)];
    });
    tube(Bk, basket, handle, 0.029, 8);
    const egg = K.geom.lathe([[0, -0.13], [0.058, -0.115], [0.093, -0.063], [0.099, 0.01], [0.075, 0.083], [0.04, 0.121], [0, 0.136]], { seg: 14 });
    const eggs = [[-0.25, -0.10, 0.57, 1.08], [-0.07, -0.19, -0.48, -0.57], [0.16, -0.18, 0.42, 0.84], [0.28, -0.02, 0.64, -0.86], [0.15, 0.17, -0.43, 1.08], [-0.06, 0.19, 0.46, 0.7], [-0.25, 0.14, 0.36, -0.54], [0.02, 0.02, 0.51, 0.44]];
    for (const [i, [x, y, a, tilt]] of eggs.entries()) {
      const g = K.geom.xf(egg.clone(), { ry: tilt, rz: a });
      g.computeBoundingBox();
      K.put(Bk, ['c#e6c6a4/0.6', 'c#f0e6cb/0.55', 'c#c89368/0.63'][i % 3], g, { at: [x, y, 0.062 - g.boundingBox.min.z] });
    }
    Bk.block(-0.54, 0.54, -0.54, 0.54, 0, 0.94);
  }
  { const Hp = fr(3.6, 60.2, 0), zp = 8.2;                    // a pole along the cave under the vault, just south of the Comté rack's front
    hcyl(Hp, OAKD, 'x', 0, 0, zp, 10.5, 0.05, 0.05, 6); for (const x of [-5.2, 5.2]) tube(Hp, C.IRON, [[x, 0, zp], [x, 0, zp + 1.5]], 0.012, 3);
    const HERB = ['c#6a7a4a/0.9', 'c#8a9a6a/0.9', 'c#5a6a3a/0.9', 'c#9a8aa8/0.9'];
    for (let i = 0; i < 7; i++) P.herbBunch(Hp, -4.6 + i * 0.6, 0, zp - 0.04, HERB[i % 4], 0.8 + (i % 3) * 0.15);
    // a cured ham, hung by its hoof on a string: a rounded leg in golden-brown skin, its cut face pale rose
    tube(Hp, 'c#c9b48a/0.9', [[1.3, 0, zp], [1.3, 0, zp - 0.45]], 0.01, 3); Hp.cyl('c#5a3a22/0.6', 1.3, 0, zp - 0.62, zp - 0.45, 0.05, 0.045, 8);
    const ham=K.geom.loft([
      {a:0.18,b:0.17,z:0}, {a:0.33,b:0.25,z:0.16,x:-0.04}, {a:0.39,b:0.28,z:0.47,x:-0.08},
      {a:0.33,b:0.26,z:0.78,x:-0.10}, {a:0.24,b:0.19,z:1.05,x:-0.05},
      {a:0.12,b:0.10,z:1.30}, {a:0.062,b:0.061,z:1.53}],{seg:24,mod:(a,j)=>1+0.03*Math.sin(a*3+j)});
    K.put(Hp,'salami#bb8a67',ham,{at:[1.3,0,zp-2.15]});
    Hp.cyl('c#d5b19b/0.64',1.3,0,zp-2.16,zp-2.145,0.18,0.18,24);
    Hp.cyl('salami#9f5f57',1.29,0,zp-2.164,zp-2.16,0.144,0.144,20);
    // Salt bloom on the casings, puckered ends and a continuous butcher's tie.
    for (let i=0;i<5;i++) {
      const x=2.3+i*0.42, length=0.85+0.28*Math.cos(i*1.65), y=0.09*Math.sin(i*2);
      const tip=zp-0.19-(i%3)*0.075, r=0.085+0.016*(i%3);
      tube(Hp,'linen#b99b75',[[x-0.05,0,zp+0.04],[x+0.04,0.03,zp],[x,y,tip]],0.012,5);
      const rings=[[0,0],[0.036,0.025],[r*0.78,0.08],[r,0.19],[r*1.03,0.55],[r*0.84,0.87],[0.043,0.97],[0.022,1],[0,1]];
      const g=K.geom.lathe(rings.map(([rad,t])=>[rad,t*length]),{seg:16,mod:(a,j)=>1+0.045*Math.sin(a*5+j)});
      const pos=g.attributes.position;
      for (let j=0;j<pos.count;j++) { const t=pos.getZ(j)/length;pos.setX(j,pos.getX(j)+0.085*Math.sin((1-t)*2.3+i)*(1-t)); }
      g.computeVertexNormals(); K.put(Hp,i%2?'salami#c79d8e':'salami#dbc0a7',g,{at:[x,y,tip-length]});
      const cord=[];
      for (let k=0;k<=44;k++) {
        const t=0.15+0.67*k/44, a=k/44*Math.PI*7+i;
        cord.push([x+0.085*Math.sin((1-t)*2.3+i)*(1-t)+r*Math.cos(a),y+r*Math.sin(a),tip-length+t*length]);
      }
      tube(Hp,'linen#b5a88e',cord,0.007,4);
    }
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
