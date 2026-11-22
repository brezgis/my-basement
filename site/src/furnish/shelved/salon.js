// salon: The Nail Salon (furnish file of the agent `salon`; pieces in salon_parts.js, what glows and answers in
// salon_fx.js, every word in salon_text.js).
//
// The loud, happy room of Spanya, in the house's one language (notes/STYLE.md: walnut and honey timber, cream, brass,
// amber light) with the colour coming from the polish, the glitter and one line of neon.
//   Precedents. What it is: an American strip-mall nail salon, the kind anyone who loves nail salons knows at once:
//   pedicure thrones in a row on a plinth with a basin at each one's feet and a technician on a low rolling stool,
//   the wall of polishes in rainbow order, a manicure bar with hand rests and lamps, the dryer bar, magazines, a
//   letter board, the price card, the tip jar, and waxing and threading behind a screen. How it is dressed: a 1960s
//   Palm Springs or Copenhagen salon: walnut, Wegner's Papa Bear chair (1951) for the throne, Finn Juhl's 45 chair
//   for the guest's chair at the bar, Poul Henningsen's PH lamps. The glamour is the 1930s Hollywood beauty parlour's:
//   the Max Factor Salon on Highland Avenue (remodelled by S. Charles Lee, reopened 1935, "the Jewel Box of the
//   Cosmetic World", its make-up studio "the Pink Powder Puff"), here only in the neon and the glitter. The polish
//   wall is lit from behind as a cocktail bar's back bar is, which is the room's showpiece.
//
// THE ROOM (upper floor, north-east): X 107.2..138.5, Y 54.3..94.5, with a piece west to X 98.3 (Y 58.85..94.5) and
// the corner by the courtyard's curved glass (X 103..107.2, Y 53.8..58.85); floor h 12.2, ceiling 22.2. Doors: west
// (X 98, Y 86..89.4) from the Quiet Room; south (Y 54, X 121..124) from the East Suite. Its one window onto the
// courtyard is the circle's facet at the south-west corner (about X 97.6..101, Y 54.7..58.6, sill 4.2 up).
// Clear ways: from the south door north along X 120..124 to Y 90, and from the west door east along Y 85.5..90.
//   south-west, on a walnut plinth (X 103..120, Y 60.8..65.4, 0.6 high: walked on) facing south: three thrones
//     (E: sit; the west one looks out through the courtyard window, the others at a lit shelf of ferns on the south
//     wall), each with a brass bell-push on its right paw (E: coffee, salon_fx.js) and a low walnut table at its right
//     where the coffee arrives; a copper foot basin before each, a technician's stool before that; a tree in a jar
//     by the window
//   west wall (Y 66..83.5): the polish wall, walnut, lit from behind; the glitter on the eye-level shelf;
//     flip-flops and toe separators in the cubbies under it
//   middle: the low walnut manicure bar (two places) on a rug, and behind it a walnut wall of lit shelves carrying
//     the letter board and the neon; on its north face the dryer ledge, dryers, stools, magazines
//   east: a lounge on a rug (a low sofa, two chairs, a round table with the fruit and sweets, E: take) facing a deep
//     built-in bench along the east wall under lit shelves
//   north: a long built-in bench along the north wall; north-east, behind a slatted walnut screen, waxing and
//     threading (couch, wax pot, magnifier, mirror, thread)
//
// STAFF POSTS (for the agent who does the staff; plan X, Y; floor h 12.2; every one calls the guest "honey"):
//   Pedicure technicians, one at each throne's feet, on the low stool facing north (the guest): [106.0, 57.7],
//     [111.5, 57.7], [117.0, 57.7], facing [X, 62.8]. They work at the basin (X, 59.7) and the plinth's front edge
//     (towel, polish, tools at Y 61.15). They reach their stools along the south wall (Y 54.4..57.2) from the south
//     door's side (X 120..121). Lines: "Feet in, honey, it's warm." "Honey, have you HEARD about the samovar?"
//     "Pick a colour, honey. Pick two."
//   Manicure technicians, one at each place of the bar, on the stool north of it facing south: [106.2, 75.3] and
//     [112.7, 75.3], facing [X, 70.4]. Work: the hand rest (X, 72.65), the gel lamp (X + 0.9, 73.15), tools (X - 1.0).
//     Lines: "Give me your hand, honey." "Thirty seconds under the lamp, honey, and no touching." "Honey, the
//     concierge has a NEW SCARF."
//   The threading artist, in the alcove, standing at [133.0, 85.1] facing north (the guest in the chair at
//     [133.0, 86.6], who faces the mirror on the east wall); posts at the wax trolley [130.4, 84.4] facing west and
//     the couch [131.5, 90.3] facing north. Lines: "Hold still, honey." "Brows like a film star, honey."
//   The runner, who brings the coffee: home [121.8, 60.0] facing west (by the plinth's east end, clear of the south
//     door); she serves from the aisle north of the plinth, standing at [X - 2.2, 66.3] facing south, and sets the cup
//     on the side table's top: [103.9, 62.75, 14.71], [109.4, 62.75, 14.71], [114.9, 62.75, 14.71] (h is the top).
//     Lines: "Coffee for honey! Seven minutes!" "Here you go, honey. Told you: seven minutes."
//   The bell: salon_fx.js exports SALON. Set SALON.onBell = ({ i, drink, ctx }) => { ...; return true } to take the
//     order with a robot, and call SALON.deliver(i, drink) when the runner sets it down; without it the bell rings, the
//     order is called in a flash, and the cup is on the table 2.6 s later.
import * as THREE from 'three';
import { parts, C, EAT, BOUCLE, OCHRE, MOSS, WAL, RUG, RUGB } from './salon_parts.js';
import { bottles, neon, letterBoard, bells } from './salon_fx.js';
import * as TX from './salon_text.js';

export default function (f) {
  const K = f.kit, P = parts(K), D = f.draw, F0 = 12.2, TAU = Math.PI * 2;
  const { put, ves, hcyl, ball, tube, cush, jar, plate, bowl, throne, juhl, techStool, basin, phShade, tallPlant, fern, polish, toolJar, towel, gelLamp, flipflops, separator, wheel, fruit, macaron, rnd } = P;
  TX.check();
  // ?salonprof: the triangles this file adds, in globalThis.__salonTris (for keeping to the room's budget)
  const PROF = typeof location !== 'undefined' && new URLSearchParams(location.search).has('salonprof');
  if (PROF) { const add = f.B.add; globalThis.__salonTris = 0; f.B.add = Object.assign((mat, g) => { globalThis.__salonParts ??= {}; globalThis.__salonParts[globalThis.__salonPart] = (globalThis.__salonParts[globalThis.__salonPart] ?? 0) + (g.index ? g.index.count : g.attributes.position.count) / 3; globalThis.__salonTris += (g.index ? g.index.count : g.attributes.position.count) / 3; return add(mat, g); }, add); f.later(() => {}); globalThis.__salonUnprof = () => { f.B.add = add; }; }
  const G = f.fr(0, 0, F0, 0);                       // the plan itself: local x = X, y = Y, z above the floor
  const fr = (X, Y, q = 0, z = 0) => f.fr(X, Y, F0 + z, q);
  const help = (X, Y, z, e) => f.help({ at: [X, Y, F0 + z], reach: 5.5, ...e });
  const note = (X, Y, z, label, say) => f.label(G, X, Y, z, { label, note: say });
  const pickN = n => Math.floor(Math.random() * n);
  const WOOD = C.WALNUT, DARK = C.WALNUTD;
  let cover;                                         // a magazine cover's painter (made with the dryer ledge, used again in the lounge)
  const CEIL = 10.0;                                 // the ceiling, above the floor


  const rug = (X0, X1, Y0, Y1) => { G.box(RUGB, X0, X1, Y0, Y1, 0.012, 0.045); G.box(RUG, X0 + 0.35, X1 - 0.35, Y0 + 0.35, Y1 - 0.35, 0.012, 0.062); };
  const lantern = (X, Y, tall = 3.9, r = 0.42) => {     // a paper floor lantern on a walnut foot: it glows
    G.cyl(C.WALNUTD, X, Y, 0, 0.15, r + 0.03, r + 0.03, 14); G.cyl('e#ffd49a/0.85', X, Y, 0.15, tall, r, r, 16);
    for (let z = 0.6; z < tall - 0.1; z += 0.45) G.cyl('c#d9c6a6/0.6', X, Y, z, z + 0.02, r + 0.01, r + 0.01, 16);
    G.cyl(C.WALNUT, X, Y, tall, tall + 0.1, r + 0.02, r + 0.02, 16); f.block(X - r, X + r, Y - r, Y + r, F0, F0 + tall);
  };
  // a lit wall shelf: a board along X (y0..y1 its depth) or along Y, with a line of light under its front
  const shelfX = (X0, X1, Y0, Y1, z, front) => { G.box(WAL, X0, X1, Y0, Y1, z - 0.1, z); G.box(C.GLOW, X0 + 0.1, X1 - 0.1, front - 0.06, front - 0.02, z - 0.14, z - 0.1); };
  const shelfY = (X0, X1, Y0, Y1, z, front) => { G.box(WAL, X0, X1, Y0, Y1, z - 0.1, z); G.box(C.GLOW, front - 0.06, front - 0.02, Y0 + 0.1, Y1 - 0.1, z - 0.14, z - 0.1); };
  const pot = (X, Y, z, r, h, col) => ves(G, col, X, Y, z, [[0, 0], [r * 0.7, 0], [r, h * 0.35], [r * 0.9, h * 0.85], [r * 0.6, h], [r * 0.55, h * 0.97], [0, h * 0.9]], 8);
  const CLAYS = ['c#b07a52/0.85', 'c#e8dfcc/0.4', 'c#5a4a3e/0.6', 'c#c9a47a/0.7', 'c#efe9dc/0.35'];
  // a deep built-in bench: a walnut box with a toe of light, a bouclé pad and back cushions against the wall, pillows
  // along: 'X' (against a wall at Y = wall, the seat toward +/-Y by sg) or 'Y' (against a wall at X = wall)
  const bench = (along, a0, a1, wall, sg, d = 2.6, z = 1.4) => {
    const R = (u0, u1, v0, v1) => (along === 'X' ? [u0, u1, Math.min(wall + sg * v0, wall + sg * v1), Math.max(wall + sg * v0, wall + sg * v1)] : [Math.min(wall + sg * v0, wall + sg * v1), Math.max(wall + sg * v0, wall + sg * v1), u0, u1]);
    const B = (mat, u0, u1, v0, v1, z0, z1) => { const [x0, x1, y0, y1] = R(u0, u1, v0, v1); G.box(mat, x0, x1, y0, y1, z0, z1); };
    const Cu = (mat, u0, u1, v0, v1, z0, z1, r) => { const [x0, x1, y0, y1] = R(u0, u1, v0, v1); cush(G, mat, x0, x1, y0, y1, z0, z1, r, { crown: 0.03, k: 1 }); };
    B(DARK, a0 + 0.15, a1 - 0.15, 0.05, d - 0.2, 0, 0.18); B(C.GLOW, a0 + 0.2, a1 - 0.2, d - 0.22, d - 0.18, 0.03, 0.15);
    B(WAL, a0, a1, 0.02, d, 0.18, z - 0.2);
    Cu(BOUCLE, a0 + 0.05, a1 - 0.05, 0.05, d - 0.05, z - 0.2, z + 0.1, 0.1);
    const n = Math.max(1, Math.round((a1 - a0) / 3));
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * i / n + 0.06, u1 = a0 + (a1 - a0) * (i + 1) / n - 0.06, um = (u0 + u1) / 2;
      Cu(i % 3 === 1 ? 'wool#7a756c' : BOUCLE, u0, u1, 0.05, 0.6, z + 0.1, z + 1.7, 0.16);
      const [px, , py] = along === 'X' ? [um + 0.6, 0, wall + sg * 0.85] : [wall + sg * 0.85, 0, um + 0.6];
      if (i % 2 === 0) cush(G, i % 4 ? MOSS : OCHRE, px - 0.32, px + 0.32, py - 0.32, py + 0.32, z + 0.1, z + 0.32, 0.1, { crown: 0.03, k: 1 });
      const q = along === 'X' ? (sg > 0 ? 0 : 2) : (sg > 0 ? 3 : 1), [sx, sy] = along === 'X' ? [um, wall + sg * (d * 0.55)] : [wall + sg * (d * 0.55), um];
      f.seat(fr(sx, sy, q), 0, 0, z + 0.1, 'sit on the bench');
    }
    const [x0, x1, y0, y1] = R(a0, a1, 0, d); f.block(x0, x1, y0, y1, F0, F0 + z + 0.1);
  };

  // =============================================================================================================
  // THE THRONES: a walnut plinth, three Papa Bears on it, basins and stools before them, facing south
  globalThis.__salonPart = 'THE THRONES: a walnut pli';
  // =============================================================================================================
  const PL = { X0: 103.0, X1: 120.0, Y0: 60.8, Y1: 65.4, h: 0.6 };
  G.box(DARK, PL.X0 + 0.18, PL.X1 - 0.18, PL.Y0 + 0.18, PL.Y1 - 0.18, 0, 0.16);                    // the recessed toe
  G.box(WAL, PL.X0, PL.X1, PL.Y0, PL.Y1, 0.16, PL.h);
  for (const y of [PL.Y0 + 0.16, PL.Y1 - 0.16]) G.box(C.GLOW, PL.X0 + 0.25, PL.X1 - 0.25, y - 0.012, y + 0.012, 0.03, 0.12);       // amber light under its edge
  // (the plinth is walked on: its top is h 12.8 over X 103..120, Y 60.8..65.4; the building gives it a surface. The
  //  thrones and their tables are obstacles of their own.)
  const THRONES = [106.0, 111.5, 117.0], TY = 64.4, thronesSpec = [];
  const FAB = [[BOUCLE, OCHRE], ['leather#6e5f4a', MOSS], [BOUCLE, MOSS]];
  THRONES.forEach((X, i) => {
    globalThis.__salonPart = 'throne';
    const T = fr(X, TY, 2, PL.h);                    // q 2: faces south; local +x is plan -X (the sitter's right)
    const t = throne(T, { fabric: FAB[i][0], cushion: FAB[i][1] });
    f.seat(T, ...t.seat, 'sit in the pedicure throne');
    // the bell-push on the right paw: a brass rose and its ivory push
    const bx = 1.08, by = 2.5, bz = t.paw + 0.02;
    T.cyl(C.BRASS, bx, by, bz - 0.01, bz + 0.04, 0.085, 0.075, 12); T.cyl('c#efe6d4/0.25', bx, by, bz + 0.04, bz + 0.075, 0.035, 0.03, 10);
    // its table at the sitter's right: a low walnut drum, a coaster, a little fern on the middle one
    const tx = X - 2.2, ty = TY - 1.6, tz = PL.h + 1.9;
    G.cyl(WOOD, tx, ty, PL.h, PL.h + 0.12, 0.42, 0.42, 16); G.cyl(WOOD, tx, ty, PL.h + 0.12, tz - 0.08, 0.12, 0.12, 10); G.cyl(C.HONEY, tx, ty, tz - 0.08, tz, 0.48, 0.48, 20);
    G.cyl('c#d9c6a6/0.8', tx + 0.1, ty - 0.05, tz, tz + 0.012, 0.2, 0.2, 14); f.block(tx - 0.48, tx + 0.48, ty - 0.48, ty + 0.48, F0 + PL.h, F0 + tz);
    if (i === 1) fern(G, tx - 0.22, ty + 0.18, tz, 0.55); else jar(G, tx - 0.25, ty + 0.2, tz, 0.07, 0.22, 'c#e6d9b8/0.4', C.BRASS);
    const [BX, BY] = T.map(bx, by);
    thronesSpec.push({ seat: [X, TY - t.seat[1], F0 + PL.h + t.seat[2]], bell: [BX, BY, F0 + PL.h + bz + 0.08], table: [tx + 0.1, ty - 0.05, F0 + tz + 0.012] });
    globalThis.__salonPart = 'edge';
    // on the plinth's front edge, for the technician: a towel, three polishes, a jar of tools
    const ey = PL.Y0 + 0.35;
    towel(G, X - 0.7, ey, PL.h, 0.7, 0.45); for (let k = 0; k < 3; k++) polish(G, X + 0.35 + k * 0.16, ey - 0.05, PL.h, ['c#c02a4a/0.15', 'c#e8b0b8/0.15', 'c#7a1a3a/0.15', 'c#d9a24a/0.15'][(i + k) % 4], k === 1 ? C.BRASS : C.BLACK);
    toolJar(G, X + 1.0, ey, PL.h);
    globalThis.__salonPart = 'basin+stool';
    // the basin before it, and the technician's stool before that
    basin(G, X, PL.Y0 - 1.1); techStool(G, X, PL.Y0 - 3.1, 1.25);
    note(X, PL.Y0 - 1.1, 1.2, 'look at the foot basin', TX.SAY.basin);
  });
  K.foldedStack(G, 119.2, 62.3, PL.h, 4, ['c#ece4d4/0.9', 'c#d9c6a6/0.9', 'c#ece4d4/0.9', 'c#3f5e34/0.9'], { w: 1.0, d: 0.8, t: 0.15 });
  fern(G, 119.3, 64.4, PL.h, 1.1);
  // what the thrones look at: a long lit shelf of ferns, clay and a branch on the south wall (X 107.6..119.8), a
  // second shelf of pots over it; and by the window, a tree in a jar
  globalThis.__salonPart = 'south shelves';
  shelfX(107.6, 119.8, 54.3, 55.15, 3.4, 55.15); shelfX(109.0, 118.4, 54.3, 54.95, 5.7, 54.95);
  for (const X of [108.6, 113.6, 118.8]) fern(G, X, 54.75, 3.4, 1.0);
  pot(111.2, 54.75, 3.4, 0.3, 0.9, CLAYS[1]); tube(G, 'c#5a4632/0.8', [[111.2, 54.75, 4.1], [111.35, 54.8, 5.0], [111.1, 54.75, 5.6]], 0.025, 4); tube(G, 'c#5a4632/0.8', [[111.3, 54.78, 4.9], [111.7, 54.8, 5.4]], 0.015, 3);
  pot(116.2, 54.75, 3.4, 0.24, 0.55, CLAYS[0]); G.cyl('e#ffd49a/1.0', 115.4, 54.75, 3.4, 3.75, 0.09, 0.09, 10); G.cyl('e#ffd49a/1.0', 117.0, 54.75, 3.4, 3.62, 0.08, 0.08, 10);
  [[109.6, 0.22, 0.5], [110.6, 0.16, 0.36], [112.4, 0.26, 0.6], [114.0, 0.18, 0.42], [115.3, 0.24, 0.48], [116.8, 0.16, 0.32], [117.8, 0.22, 0.55]].forEach(([X, r, h], k) => pot(X, 54.62, 5.7, r, h, CLAYS[k % CLAYS.length]));
  ves(G, 'c#b07a52/0.85', 100.6, 60.6, 0, [[0, 0], [0.45, 0], [0.7, 0.6], [0.68, 1.3], [0.4, 1.75], [0.36, 1.85], [0, 1.8]], 12); f.block(99.9, 101.3, 59.9, 61.3, F0, F0 + 1.85);
  for (const [a, h, b] of [[0.3, 6.6, 1.1], [2.4, 5.8, 0.8], [4.2, 6.2, 0.9]]) { const ex = 100.6 + Math.cos(a) * b, ey = 60.6 + Math.sin(a) * b;
    tube(G, 'c#5a4632/0.8', [[100.6, 60.6, 1.6], [100.6 + Math.cos(a) * b * 0.4, 60.6 + Math.sin(a) * b * 0.4, h * 0.6], [ex, ey, h]], 0.04, 4);
    P.leaves(G, ex, ey, h, { n: 7, len: 0.7, w: 0.1, up: 0.3, out: 0.9, droop: 0.6, spread: 0.2 }); }

  // =============================================================================================================
  // THE POLISH WALL: the west wall, walnut, lit from behind; the glitter shelf at eye level
  globalThis.__salonPart = 'THE POLISH WALL: the east';
  // =============================================================================================================
  const bottleList = [];
  { const E = fr(98.3, 74.75, 3), x0 = -8.75, x1 = 8.75, d = 1.0, top = 7.25, Z = [1.25, 2.1, 2.95, 3.8, 4.65, 5.5, 6.35], GL = 4;      // q 3: faces east; x runs south (x = 74.75 - Y), +y into the room
    E.box('e#ffb866/0.6', x0 + 0.1, x1 - 0.1, 0.03, 0.06, 1.2, top);                             // the frosted panel, lit from behind
    const UP = [-8.75, -5.25, -1.75, 1.75, 5.25, 8.75];
    for (const x of UP) E.box(WAL, x - 0.07, x + 0.07, 0.02, d, 0, top + 0.35);
    for (const z of Z) E.box(WOOD, x0, x1, 0.06, d - 0.04, z - 0.06, z);
    E.box(WAL, x0 - 0.1, x1 + 0.1, 0.02, d + 0.08, top, top + 0.35);                              // the cornice
    E.box(C.GLOW, x0 + 0.2, x1 - 0.2, d - 0.12, d - 0.06, top - 0.04, top - 0.0);                  // and the light under it, washing the top shelf
    // the base: cubbies of flip-flops and toe separators, under a walnut top
    E.box(WAL, x0, x1, 0.02, d + 0.04, 0, 0.12); E.box(WAL, x0, x1, 0.02, d + 0.04, 1.05, 1.19);
    const FF = ['c#e8a0b0/0.7', 'c#f2e6c8/0.7', 'c#a8d0c8/0.7', 'c#d9b86a/0.7', 'c#b8a8d8/0.7', 'c#f0b890/0.7'];
    for (let b = 0; b < 5; b++) { const bx = UP[b] + 1.75;
      if (b % 2 === 0) { for (let k = 0; k < 4; k++) flipflops(E, bx - 0.75 + (k % 2) * 1.1, 0.55, 0.12 + Math.floor(k / 2) * 0.08, FF[(b + k) % FF.length]); }
      else { for (let k = 0; k < 10; k++) separator(E, bx - 1.1 + (k % 5) * 0.5, 0.35 + Math.floor(k / 5) * 0.35, 0.12, FF[(b * 3 + k) % FF.length]); } }
    note(...E.map(-5.5, 0.6), 0.8, 'look at the flip-flops', TX.SAY.flipflops);
    E.block(x0, x1, 0, d, 0, top + 0.35);
    // the bottles: hue along the wall, lighter shelves above
    const LIGHT = [0.82, 0.72, 0.62, 0.52, 0.56, 0.42, 0.32];
    Z.forEach((z, k) => { for (let b = 0; b < 5; b++) for (let i = 0; i < 16; i++) {
      const x = UP[b] + 0.2 + i * 0.205, u = (x - x0) / (x1 - x0), [X, Y] = E.map(x, 0.5), glit = k === GL;
      const hue = (u * 0.95 + 0.98) % 1, sat = k === 0 ? 0.3 : 0.62, li = LIGHT[6 - k] + (rnd() - 0.5) * 0.06;
      const c = hslHex(hue, glit ? 0.85 : sat, glit ? 0.6 : li);
      bottleList.push({ X, Y, h: F0 + z, col: c, glitter: glit, cap: glit ? 0xc9a45a : (i % 7 === 3 ? 0xf2efe8 : 0x141210) });
    } });
    note(...E.map(0, 0.7), Z[GL] + 0.2, 'look at the glitter', TX.SAY.glitter);
  }
  function hslHex(h, s, l) { const k = n => (n + h * 12) % 12, a = s * Math.min(l, 1 - l), c = n => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1)); return (Math.round(c(0) * 255) << 16) | (Math.round(c(8) * 255) << 8) | Math.round(c(4) * 255); }

  // =============================================================================================================
  // THE MANICURE BAR: low walnut, two places, on a rug; behind it a walnut wall of lit shelves with the letter board
  // and the neon on its south face and the dryer ledge on its north face
  globalThis.__salonPart = 'THE MANICURE BAR: low wal';
  // =============================================================================================================
  const BAR = { X0: 103.0, X1: 115.9, Y0: 72.1, Y1: 73.9 }, cx = (BAR.X0 + BAR.X1) / 2;
  rug(101.5, 117.5, 68.6, 76.8);
  { const { X0, X1, Y0, Y1 } = BAR, Z = 2.45;
    G.bev(WAL, X0, X1, Y0, Y1, Z - 0.12, Z, 0.02);
    for (const x of [X0 + 0.4, (X0 + X1) / 2, X1 - 0.4]) G.box(WOOD, x - 0.08, x + 0.08, Y0 + 0.2, Y1 - 0.2, 0, Z - 0.12);
    G.box(WOOD, X0 + 0.4, X1 - 0.4, (Y0 + Y1) / 2 - 0.05, (Y0 + Y1) / 2 + 0.05, 0.3, 0.42);            // a stretcher
    G.box(C.GLOW, X0 + 0.3, X1 - 0.3, Y0 + 0.25, Y0 + 0.28, Z - 0.15, Z - 0.13);                         // light under its lip
    f.block(X0, X1, Y0, Y1, F0, F0 + Z);
    const NAIL = [['c#c02a4a/0.2', 'c#e8b0b8/0.2', 'c#f2ead8/0.2'], ['c#3a5a8a/0.2', 'c#d9a24a/0.2', 'c#1a1a1a/0.2'], ['c#7a1a3a/0.2', 'c#f0c8d0/0.2', 'c#c9a45a/0.2/1']];
    [X0 + 3.2, X0 + 9.7].forEach((x, i) => {
      // the hand rest on its towel, the bowl to soak in, the gel lamp, tools, polishes, a lamp after PH
      towel(G, x, Y0 + 0.55, Z, 1.0, 0.65, 'c#ece4d4/0.9');
      cush(G, C.LEATHER, x - 0.3, x + 0.3, Y0 + 0.35, Y0 + 0.75, Z + 0.16, Z + 0.36, 0.09, { crown: 0.04 });
      bowl(G, x - 0.65, Y0 + 0.45, Z, 0.2, 0.12, 'glass'); G.cyl('c#cfe2de/0.05', x - 0.65, Y0 + 0.45, Z + 0.02, Z + 0.08, 0.17, 0.18, 12);
      gelLamp(G, x + 0.9, Y0 + 1.05, Z); note(x + 0.9, Y0 + 1.05, Z + 0.4, 'look at the gel lamp', TX.SAY.gel);
      toolJar(G, x - 1.0, Y0 + 1.3, Z); for (let k = 0; k < 4; k++) polish(G, x - 0.25 + k * 0.17, Y0 + 1.45, Z, NAIL[i][k % 3], k === 3 ? C.BRASS : C.BLACK);
      const ax = x + 1.55, ay = Y0 + 1.55; G.cyl(C.BRASS, ax, ay, Z, Z + 0.05, 0.14, 0.14, 12); tube(G, C.BRASS, [[ax, ay, Z + 0.05], [ax, ay, Z + 1.65], [ax - 0.4, ay - 0.3, Z + 1.95], [x + 0.7, Y0 + 0.9, Z + 1.95]], 0.022, 5);
      phShade(G, x + 0.7, Y0 + 0.9, Z + 1.55, 0.6);
      juhl(fr(x, Y0 - 1.7, 0), { fabric: i ? C.LEATHER : 'leather#6e5f4a' }); f.seat(fr(x, Y0 - 1.7, 0), 0, 0, 1.5, 'sit at the manicure bar');
      techStool(G, x, Y1 + 1.4, 1.6);
      // a PH pendant over each place (they glow; the room's lamp is the cove light, below)
      const zp = 6.3; tube(G, C.BLACK, [[x, Y0 + 0.9, CEIL], [x, Y0 + 0.9, zp + 0.5]], 0.012, 3); G.cyl(C.BRASS, x, Y0 + 0.9, CEIL - 0.06, CEIL, 0.12, 0.12, 10);
      phShade(G, x, Y0 + 0.9, zp, 1.25);
    });
    // the middle of the bar: the price card on its brass stand, nail-art wheels, the tip jar, a fern
    { const S = fr(cx, Y0 + 0.35, 2, Z); S.box(C.BRASS, -0.4, 0.4, -0.06, 0.06, 0, 0.04); S.box(C.BRASS, -0.36, 0.36, -0.02, 0.0, 0.04, 0.12);
      f.sign(S, 0, 0.62, 0.72, 1.02, (g, W, H) => {
        D.paper(g, W, H, '#efe7d6'); D.T(g, TX.NAME, W / 2, H * 0.07, H * 0.06, '#7a2a4a', { f: D.F.fraunces, it: 1 });
        D.T(g, TX.PRICE_HEAD.toUpperCase(), W / 2, H * 0.13, H * 0.035, '#5a4a3a', { ls: 3 });
        TX.PRICES.forEach(([a, p, s], k) => { const y = H * (0.2 + k * 0.065); D.T(g, a, W * 0.08, y, H * 0.03, '#2a1c13', { a: 'left' }); D.T(g, p, W * 0.92, y, H * 0.03, '#2a1c13', { a: 'right' }); D.T(g, s, W * 0.1, y + H * 0.026, H * 0.022, '#8a4a5a', { a: 'left', f: D.F.caveat, max: W * 0.82 }); });
        D.T(g, TX.PRICE_FOOT, W / 2, H * 0.95, H * 0.024, '#5a4a3a', { it: 1, max: W * 0.9 });
      }, { y: 0.0, tilt: 0.22 });
      f.label(S, 0, 0.05, 0.62, { label: 'read the price card', title: TX.NAME + ': ' + TX.PRICE_HEAD, kicker: 'on the manicure bar',
        text: TX.PRICES.map(([a, p, s]) => `${a}, ${p}: ${s}`).join('\n'), foot: TX.PRICE_FOOT });
      wheel(G, cx - 1.1, Y0 + 1.4, Z, ['c#c02a4a/0.2', 'c#f2ead8/0.2', 'c#d9a24a/0.2/1', 'c#1a1a1a/0.2', 'c#e8b0b8/0.2', 'c#3a5a8a/0.2']);
      wheel(G, cx - 0.45, Y0 + 1.5, Z, ['c#7a1a3a/0.2', 'c#c8d8a0/0.2', 'c#f0c8d0/0.2', 'c#c9a45a/0.2/1', 'c#a8d0c8/0.2', 'c#f2ead8/0.2']);
      note(cx - 0.8, Y0 + 1.45, Z + 0.55, 'look at the nail-art wheels', TX.SAY.wheel);
      // the tip jar, with notes folded in it, and its card
      jar(G, cx + 0.75, Y0 + 0.9, Z, 0.16, 0.42, null); for (let k = 0; k < 6; k++) G.box(k % 2 ? 'c#9ab08a/0.8' : 'c#c9d8b0/0.8', cx + 0.67 + (k % 3) * 0.05, cx + 0.77 + (k % 3) * 0.05, Y0 + 0.84 + (k % 2) * 0.06, Y0 + 0.9 + (k % 2) * 0.06, Z + 0.03 + k * 0.05, Z + 0.07 + k * 0.05);
      f.sign(fr(cx + 0.75, Y0 + 0.72, 2, Z), 0, 0.12, 0.5, 0.18, (g, W, H) => { D.paper(g, W, H, '#f1e9d6'); D.T(g, TX.TIPS, W / 2, H / 2, H * 0.42, '#7a2a4a', { f: D.F.caveat, w: 600, max: W * 0.92 }); }, { tilt: 0.3 });
      note(cx + 0.75, Y0 + 0.9, Z + 0.5, 'look at the tip jar', TX.SAY.tips);
      fern(G, cx + 1.6, Y0 + 1.3, Z, 0.7);
    }
  }
  // the wall of shelves behind the bar (X 102.8..117.5, Y 77.5..78.5, 9.2 high)
  globalThis.__salonPart = 'shelf wall';
  { const X0 = 102.8, X1 = 117.5, Y0 = 77.5, Y1 = 78.5, H = 9.2;
    G.box(WAL, X0, X1, 77.92, 78.08, 0, H);
    for (let x = X0; x <= X1 + 0.01; x += (X1 - X0) / 6) G.box(WOOD, x - 0.07, x + 0.07, Y0, Y1, 0, H);
    G.box(WOOD, X0 - 0.07, X1 + 0.07, Y0, Y1, H, H + 0.14); G.box(WOOD, X0 - 0.07, X1 + 0.07, Y0, Y1, 0, 0.2);
    f.block(X0 - 0.07, X1 + 0.07, Y0, Y1, F0, F0 + H);
    // its south face: lit shelves either side of the letter board, towels, clay, ferns
    for (const [a, b] of [[X0 + 0.1, cx - 2.6], [cx + 2.6, X1 - 0.1]]) for (const [k, z] of [3.6, 5.0, 6.4].entries()) {
      shelfX(a, b, Y0 + 0.02, 77.92, z, Y0 + 0.02);
      const m = (a + b) / 2;
      if (k === 0) { for (let j = 0; j < 3; j++) towel(G, m - 0.9, 77.7, z + j * 0.17, 0.8, 0.36, j === 1 ? 'c#c4935a/0.9' : 'c#ece4d4/0.9'); pot(m + 0.8, 77.72, z, 0.18, 0.45, CLAYS[k + 1]); }
      if (k === 1) { fern(G, m, 77.72, z, 0.6); jar(G, m - 1.2, 77.72, z, 0.12, 0.38, 'c#f4f1ea/0.95', C.BRASS); jar(G, m + 1.2, 77.72, z, 0.12, 0.3, 'c#e8c070/0.3', C.BRASS); }
      if (k === 2) { pot(m - 0.8, 77.72, z, 0.2, 0.55, CLAYS[3]); pot(m + 0.2, 77.72, z, 0.14, 0.35, CLAYS[1]); pot(m + 1.0, 77.72, z, 0.18, 0.48, CLAYS[2]); }
    }
    // the letter board in a walnut frame (its letters are salon_fx.js's), the neon above it
    G.box(WOOD, cx - 2.45, cx + 2.45, 77.42, 77.5, 4.05, 7.05);
    for (const [a, b, c2, d2] of [[cx - 2.45, cx + 2.45, 4.05, 4.2], [cx - 2.45, cx + 2.45, 6.9, 7.05], [cx - 2.45, cx - 2.3, 4.2, 6.9], [cx + 2.3, cx + 2.45, 4.2, 6.9]]) G.box(WAL, a, b, 77.24, 77.42, c2, d2);
    // its north face: the dryer ledge, two dryers, their stools; a lit shelf over it; the magazines in their rack
    const z = 2.9, l0 = 103.5, l1 = 111.6;
    G.bev(WAL, l0, l1, Y1, Y1 + 1.5, z - 0.12, z, 0.02);
    for (const x of [l0 + 0.15, l1 - 0.15]) G.box(WOOD, x - 0.07, x + 0.07, Y1, Y1 + 1.4, 0, z - 0.12);
    G.box(C.GLOW, l0 + 0.3, l1 - 0.3, Y1 + 1.12, Y1 + 1.16, z - 0.16, z - 0.13);
    f.block(l0, l1, Y1, Y1 + 1.5, F0, F0 + z);
    for (const x of [105.3, 109.6]) {
      put(G, 'c#ece6da/0.3', K.geom.softBox(-0.55, 0.55, -0.45, 0.45, 0, 0.55, 0.16, { k: 2, crown: 0.05 }), { at: [x, Y1 + 0.75, z] });
      G.box('e#ffd49a/1.2', x - 0.42, x + 0.42, Y1 + 1.18, Y1 + 1.21, z + 0.06, z + 0.18);
      G.cyl('c#4a4642/0.4', x, Y1 + 0.75, z + 0.58, z + 0.6, 0.28, 0.28, 16);
      techStool(G, x, Y1 + 2.5, 2.05); f.seat(fr(x, Y1 + 2.5, 2), 0, 0, 2.05, 'sit at the dryer');
      note(x, Y1 + 0.75, z + 0.5, 'look at the dryer', TX.SAY.dryer);
    }
    towel(G, 107.45, Y1 + 0.7, z, 0.9, 0.7, 'c#ece4d4/0.9'); toolJar(G, 108.3, Y1 + 0.5, z);
    shelfX(l0, l1, Y1, Y1 + 0.95, 5.0, Y1 + 0.95);
    for (const x of [104.2, 110.9]) for (let k = 0; k < 3; k++) towel(G, x, Y1 + 0.5, 5.0 + k * 0.17, 0.8, 0.7, k === 1 ? 'c#c4935a/0.9' : 'c#ece4d4/0.9');
    jar(G, 106.0, Y1 + 0.5, 5.0, 0.16, 0.45, 'c#f4f1ea/0.95', C.BRASS); fern(G, 107.5, Y1 + 0.5, 5.0, 0.7);
    for (let k = 0; k < 5; k++) G.cyl(['c#d99a3a/0.15', 'c#c4935a/0.15', 'c#e8c070/0.15'][k % 3], 108.6 + k * 0.2, Y1 + 0.5, 5.0, 5.22, 0.05, 0.05, 6);
    cover = ([mast, ground, ink, head, strap]) => (g, W, H) => {
      D.fill(g, W, H, ground); D.T(g, mast, W / 2, H * 0.11, H * 0.1, ink, { f: D.F.fraunces, w: 700, max: W * 0.92 });
      g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.ellipse(W * 0.5, H * 0.5, W * 0.32, H * 0.22, 0, 0, TAU); g.fill();
      D.para(g, head, W * 0.08, H * 0.7, H * 0.06, ink, W * 0.84, { f: D.F.goudy, w: 700 }); D.T(g, strap, W / 2, H * 0.93, H * 0.04, ink, { it: 1, max: W * 0.9 });
    };
    { const R = fr(114.6, Y1, 0), w = 3.2, h = 1.0, z0 = 4.9;
      R.box(WOOD, -w / 2 - 0.1, w / 2 + 0.1, 0.02, 0.1, z0 - h / 2 - 0.15, z0 + h / 2 + 0.1);
      R.box(WAL, -w / 2 - 0.1, w / 2 + 0.1, 0.02, 0.3, z0 - h / 2 - 0.2, z0 - h / 2 - 0.12); R.box(WAL, -w / 2 - 0.1, w / 2 + 0.1, 0.24, 0.3, z0 - h / 2 - 0.12, z0 - h / 2 + 0.05);
      f.sign(R, 0, z0, w, h, (g, W, H) => { const cw = W / 4; D.fill(g, W, H, '#2e1f14'); TX.MAGS.slice(0, 4).forEach((m, k) => { g.save(); g.translate(k * cw + cw * 0.06, H * 0.04); const c = document.createElement('canvas'); c.width = Math.round(cw * 0.88); c.height = Math.round(H * 0.94); cover(m)(c.getContext('2d'), c.width, c.height); g.drawImage(c, 0, 0); g.restore(); }); }, { y: 0.14 });
      f.label(R, 0, 0.2, z0, { label: 'read the magazines', title: 'The magazines', kicker: 'by the dryer ledge',
        text: TX.MAGS.map(([m, , , h, s]) => `${m}: ${h} (${s})`).join('\n'), foot: 'All of them this week. Honey, none of them are true. All of them are true.' }); }
  }

  // =============================================================================================================
  // THE LOUNGE (east): a rug, a low sofa, two chairs and a round table with the fruit, facing a deep built-in bench
  // along the east wall under lit shelves
  globalThis.__salonPart = 'THE MIDDLE';
  // =============================================================================================================
  rug(122.9, 134.8, 59.8, 74.2);
  { const X = 130.0, Y = 67.0, Z = 1.4;
    G.cyl(C.WALNUTD, X, Y, 0.06, 0.2, 0.9, 0.9, 20); G.cyl(C.WALNUT, X, Y, 0.2, Z - 0.1, 0.35, 0.3, 16); G.cyl(C.HONEY, X, Y, Z - 0.1, Z, 1.55, 1.55, 28);
    f.block(X - 1.4, X + 1.4, Y - 1.4, Y + 1.4, F0, F0 + Z);
    f.sign(fr(X - 0.75, Y + 0.6, 1, Z + 0.01), 0, 0, 0.62, 0.82, cover(TX.MAGS[4]), { flat: true, turn: 0.25 });
    f.sign(fr(X - 0.55, Y - 0.75, 1, Z + 0.012), 0, 0, 0.62, 0.82, cover(TX.MAGS[5]), { flat: true, turn: -0.3 });
    bowl(G, X + 0.55, Y - 0.35, Z, 0.42, 0.22, 'c#efe6d6/0.3', 18);
    for (const [dx, dy, k] of [[-0.15, -0.1, 'mandarin'], [0.12, 0.08, 'mandarin'], [0.0, 0.2, 'mandarin'], [0.2, -0.15, 'fig'], [-0.18, 0.15, 'fig']]) fruit(G, k, X + 0.55 + dx, Y - 0.35 + dy, Z + 0.05);
    bowl(G, X + 0.65, Y + 0.6, Z, 0.2, 0.12, C.PORC); for (let k = 0; k < 6; k++) fruit(G, 'strawberry', X + 0.65 + Math.cos(k) * 0.1, Y + 0.6 + Math.sin(k) * 0.1, Z + 0.07);
    plate(G, X - 0.1, Y + 0.95, Z, 0.24); ['c#e8a0b0/0.7', 'c#c8d8a0/0.7', 'c#d9b86a/0.7', 'c#b8a8d8/0.7'].forEach((c, k) => macaron(G, X - 0.18 + (k % 2) * 0.16, Y + 0.88 + Math.floor(k / 2) * 0.14, Z + 0.03, c));
    G.cyl(C.WALNUT, X - 0.2, Y - 0.1, Z, Z + 0.06, 0.24, 0.24, 14); G.cyl('e#ffd49a/0.9', X - 0.2, Y - 0.1, Z + 0.06, Z + 0.78, 0.2, 0.22, 14); G.cyl(C.WALNUT, X - 0.2, Y - 0.1, Z + 0.78, Z + 0.82, 0.21, 0.21, 14);
    help(X + 0.55, Y - 0.35, Z + 0.35, { name: 'mandarin', build: EAT.mandarin, bites: 3, note: 'You finish the mandarin. Bright as the neon, and better for you, honey.' });
    help(X + 0.75, Y - 0.5, Z + 0.3, { name: 'fig', build: EAT.fig, bites: 2, note: 'You finish the fig. Jammy, and full of seeds.' });
    help(X + 0.65, Y + 0.6, Z + 0.25, { name: 'strawberry', build: EAT.strawberry, bites: 1, note: 'You finish the strawberry. Small, sweet, gone.' });
    help(X - 0.1, Y + 0.95, Z + 0.2, { name: 'rose macaron', build: EAT.macaron(0xe8a0b0), bites: 2, note: 'You finish the macaron. Rose and raspberry, and a crumb on your sleeve, honey.' });
    // the low sofa west of it, facing east
    const So = fr(125.4, Y, 3);                    // q 3: faces +X; local x runs -Y
    So.box(C.WALNUT, -2.6, 2.6, -1.2, 1.3, 0.25, 0.55); for (const x of [-2.45, 2.45]) for (const y of [-1.05, 1.1]) So.box(C.WALNUTD, x - 0.07, x + 0.07, y - 0.07, y + 0.07, 0, 0.25);
    for (const x of [-2.75, 2.75]) So.box(C.HONEY, x - 0.15, x + 0.15, -1.2, 1.3, 0.25, 1.55);
    for (const x of [-1.25, 1.25]) { cush(So, BOUCLE, x - 1.22, x + 1.22, -0.65, 1.25, 0.55, 1.05, 0.14, { crown: 0.04, k: 1 }); P.tilted(So, BOUCLE, x - 1.2, x + 1.2, -1.2, -0.75, 0.6, 2.4, 0.16, 0.18, { bulge: 0.03 }); f.seat(So, x, 0.3, 1.05, 'sit on the sofa'); }
    put(So, OCHRE, K.geom.softBox(-0.5, 0.5, -0.12, 0.12, 0, 0.95, 0.12, { k: 2, crown: 0.02 }), { rx: 0.25, at: [-1.9, -0.55, 1.05] }); put(So, MOSS, K.geom.softBox(-0.45, 0.45, -0.12, 0.12, 0, 0.9, 0.12, { k: 2, crown: 0.02 }), { rx: 0.25, rz: 0.15, at: [2.0, -0.55, 1.05] });
    put(So, 'wool#7a756c', K.geom.softBox(-0.6, 0.6, -0.9, 0.9, 0, 0.06, 0.05, { k: 1 }), { at: [2.0, 0.35, 1.06] });
    f.block(124.1, 126.8, Y - 2.9, Y + 2.9, F0, F0 + 1.55);
    // two chairs, one each side of the table
    juhl(fr(X, Y - 4.8, 0), { fabric: 'leather#6e5f4a' }); f.seat(fr(X, Y - 4.8, 0), 0, 0, 1.5, 'sit in the chair');
    juhl(fr(X, Y + 4.8, 2), { fabric: C.LEATHER }); f.seat(fr(X, Y + 4.8, 2), 0, 0, 1.5, 'sit in the chair');
  }
  // the bench along the east wall, and its lit shelves
  globalThis.__salonPart = 'benches';
  bench('Y', 58.6, 79.0, 138.5, -1, 2.9);
  for (const z of [4.6, 6.1]) shelfY(137.7, 138.5, 58.8, 78.8, z, 137.7);
  for (let k = 0; k < 9; k++) { const Y = 59.9 + k * 2.2, z = k % 2 ? 6.1 : 4.6; if (k % 3 === 1) fern(G, 138.1, Y, z, 0.65); else pot(138.1, Y, z, 0.16 + (k % 3) * 0.05, 0.4 + (k % 2) * 0.2, CLAYS[k % CLAYS.length]); }
  for (const Y of [63.2, 71.0]) for (let j = 0; j < 3; j++) towel(G, 138.1, Y, 4.6 + j * 0.17, 0.6, 0.7, j === 1 ? 'c#3f5e34/0.9' : 'c#ece4d4/0.9');
  // the long bench along the north wall, its shelf of clay, a lantern on a walnut cube between its two halves
  bench('X', 101.6, 113.0, 94.5, -1, 2.8); bench('X', 114.4, 125.8, 94.5, -1, 2.8);
  G.box(WAL, 113.05, 114.35, 92.6, 94.45, 0, 1.6); G.cyl('e#ffd49a/0.9', 113.7, 93.5, 1.6, 2.5, 0.28, 0.28, 14); G.cyl(C.WALNUT, 113.7, 93.5, 2.5, 2.56, 0.29, 0.29, 14); f.block(113.05, 114.35, 92.6, 94.45, F0, F0 + 1.6);
  shelfX(101.8, 125.6, 93.7, 94.5, 5.6, 93.7);
  for (let k = 0; k < 10; k++) { const X = 102.8 + k * 2.4; if (k % 4 === 2) fern(G, X, 94.1, 5.6, 0.6); else pot(X, 94.1, 5.6, 0.15 + (k % 3) * 0.05, 0.35 + (k % 2) * 0.25, CLAYS[(k + 2) % CLAYS.length]); }
  // tall things in the corners: a tree in the north-west, a plant and a lantern in the south-east, a lantern by the sofa
  tallPlant(G, 99.7, 93.0, { h: 6.4, r: 0.65 });
  tallPlant(G, 137.3, 55.6, { h: 6.0, r: 0.6 });
  lantern(125.0, 62.7);

  // =============================================================================================================
  // WAXING AND THREADING: the north-east corner, behind a slatted walnut screen
  globalThis.__salonPart = 'WAXING AND THREADING: the';
  // =============================================================================================================
  { const SY = 81.5, SX = 126.5, SE = 134.5, Z = 7.0, YN = 94.45;
    G.box(WOOD, SX, SE, SY - 0.06, SY + 0.06, 0.4, 0.5); G.box(WOOD, SX - 0.06, SX + 0.06, SY, YN, 0.4, 0.5);
    G.box(WOOD, SX, SE, SY - 0.06, SY + 0.06, Z - 0.1, Z); G.box(WOOD, SX - 0.06, SX + 0.06, SY, YN, Z - 0.1, Z);
    for (let x = SX; x <= SE; x += 0.3) G.box(C.HONEY, x - 0.04, x + 0.04, SY - 0.1, SY + 0.1, 0, Z);
    for (let y = SY + 0.3; y <= YN - 0.05; y += 0.3) G.box(C.HONEY, SX - 0.1, SX + 0.1, y - 0.04, y + 0.04, 0, Z);
    f.block(SX, SE, SY - 0.12, SY + 0.12, F0, F0 + Z); f.block(SX - 0.12, SX + 0.12, SY, 94.5, F0, F0 + Z);
    // the couch along the north wall, head to the east: cream leather on a walnut plinth, a roll of paper over it
    { const x0 = 128.0, x1 = 135.3, y0 = 92.1, y1 = 94.3;
      G.box(DARK, x0 + 0.2, x1 - 0.2, y0 + 0.2, y1 - 0.2, 0, 0.2); G.box(WAL, x0, x1, y0, y1, 0.2, 1.95); G.box(C.GLOW, x0 + 0.3, x1 - 0.3, y0 + 0.16, y0 + 0.2, 0.03, 0.15);
      cush(G, C.LEATHER, x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, 1.95, 2.35, 0.12, { crown: 0.03 });
      cush(G, C.LEATHER, x1 - 1.4, x1 - 0.1, y0 + 0.1, y1 - 0.1, 2.3, 2.75, 0.18, { crown: 0.05 });
      G.box('c#f4f1ea/0.9', x0 + 1.0, x1 - 1.6, y0 + 0.25, y1 - 0.25, 2.35, 2.37);
      hcyl(G, 'c#f4f1ea/0.9', 'y', x0 + 0.35, (y0 + y1) / 2, 2.15, y1 - y0 - 0.3, 0.16);
      towel(G, x0 + 1.8, (y0 + y1) / 2, 2.37, 0.9, 0.6, 'c#3f5e34/0.9');
      f.block(x0, x1, y0, y1, F0, F0 + 2.4);
      shelfX(x0, x1, 93.7, 94.5, 5.2, 93.7); for (let k = 0; k < 4; k++) pot(x0 + 0.9 + k * 1.8, 94.1, 5.2, 0.17, 0.4 + (k % 2) * 0.2, CLAYS[k]); }
    // the wax trolley: a walnut cart, the warmer of amber wax, spatulas, strips, towels
    { const x = 128.6, y = 84.4, z = 2.6;
      for (const [dx, dy] of [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.4], [0.6, 0.4]]) { G.cyl(C.BRASS, x + dx, y + dy, 0.12, z, 0.03, 0.03, 6); ball(G, C.BLACK, x + dx, y + dy, 0, 0.06, 6); }
      G.box(WAL, x - 0.7, x + 0.7, y - 0.48, y + 0.48, z - 0.08, z); G.box(WAL, x - 0.7, x + 0.7, y - 0.48, y + 0.48, 0.9, 0.98);
      G.cyl(C.CHROME, x - 0.25, y, z, z + 0.42, 0.22, 0.22, 14); G.cyl('c#d99a3a/0.3', x - 0.25, y, z + 0.4, z + 0.41, 0.19, 0.19, 14); G.cyl(C.CHROME, x - 0.25, y, z + 0.44, z + 0.5, 0.24, 0.2, 14);
      jar(G, x + 0.25, y + 0.15, z, 0.09, 0.3, null); for (let k = 0; k < 5; k++) G.box('c#d9c6a6/0.8', x + 0.22 + (k % 3) * 0.02, x + 0.25 + (k % 3) * 0.02, y + 0.1 + k * 0.02, y + 0.14 + k * 0.02, z + 0.05, z + 0.55);
      for (let k = 0; k < 6; k++) G.box('c#f4f1ea/0.9', x + 0.05, x + 0.55, y - 0.4, y - 0.15, z + k * 0.012, z + k * 0.012 + 0.008);
      for (let k = 0; k < 3; k++) towel(G, x, y, 0.98 + k * 0.17, 0.9, 0.6, k === 1 ? 'c#ece4d4/0.9' : 'c#d9c6a6/0.9');
      note(x - 0.25, y, z + 0.6, 'look at the wax pot', TX.SAY.wax);
      f.block(x - 0.7, x + 0.7, y - 0.5, y + 0.5, F0, F0 + 2.6); }
    // the threading chair, facing the mirror on the east wall; the magnifier on its stand, its arm over the chair
    juhl(fr(133.0, 86.6, 3), { fabric: BOUCLE }); f.seat(fr(133.0, 86.6, 3), 0, 0, 1.5, 'sit in the threading chair');
    { const bx = 137.7, by = 88.4, lx = 134.3, ly = 86.6; G.cyl(DARK, bx, by, 0, 0.08, 0.45, 0.45, 14); G.cyl(C.BRASS, bx, by, 0.08, 4.8, 0.04, 0.04, 8);
      tube(G, C.BRASS, [[bx, by, 4.8], [bx - 1.2, by - 0.8, 4.9], [lx, ly, 4.6]], 0.03, 5);
      put(G, C.BRASS, new THREE.TorusGeometry(0.42, 0.06, 6, 24), { ry: Math.PI / 2, at: [lx, ly, 4.4] });
      G.box('glass', lx - 0.02, lx + 0.02, ly - 0.35, ly + 0.35, 4.05, 4.75);
      f.block(bx - 0.45, bx + 0.45, by - 0.45, by + 0.45, F0, F0 + 4.8);
      note(lx, ly, 4.4, 'look through the magnifier', TX.SAY.magnifier); }
    // the mirror on the east wall (round, in a brass ring) and the shelf of thread under it
    hcyl(G, C.BRASS, 'x', 138.44, 86.6, 5.4, 0.08, 1.25, 1.25, 28); hcyl(G, 'c#7d8688/0.06/1', 'x', 138.38, 86.6, 5.4, 0.05, 1.15, 1.15, 28);
    note(138.3, 86.6, 5.4, 'look in the mirror', TX.SAY.mirror);
    G.box(WAL, 137.75, 138.5, 84.4, 88.8, 3.72, 3.82); G.box(C.GLOW, 137.75, 137.8, 84.5, 88.7, 3.68, 3.72);
    for (let k = 0; k < 7; k++) { const y = 84.7 + k * 0.55; ves(G, k % 3 ? 'c#f4f1ea/0.8' : 'c#e8d6b0/0.8', 138.1, y, 3.82, [[0, 0], [0.12, 0], [0.12, 0.04], [0.07, 0.38], [0.03, 0.4], [0, 0.4]], 10); }
    note(138.1, 85.8, 4.1, 'look at the thread', TX.SAY.thread);
    tallPlant(G, 127.4, 90.4, { h: 4.8, r: 0.5 });
  }

  // a cove of amber light high on the walls: a walnut ledge round the room, a glowing line under its lip
  globalThis.__salonPart = 'cove';
  for (const [X0, X1, Y0, Y1, side] of [[98.3, 138.5, 93.9, 94.5, 'y0'], [137.9, 138.5, 54.3, 93.9, 'x0'], [107.2, 137.9, 54.3, 54.9, 'y1'], [98.3, 98.9, 58.9, 93.9, 'x1']]) {
    G.box(WAL, X0, X1, Y0, Y1, 9.35, 9.48);
    const g = { y0: [X0, X1, Y0 + 0.02, Y0 + 0.06], y1: [X0, X1, Y1 - 0.06, Y1 - 0.02], x0: [X0 + 0.02, X0 + 0.06, Y0, Y1], x1: [X1 - 0.06, X1 - 0.02, Y0, Y1] }[side];
    G.box(C.GLOW, ...g, 9.3, 9.35);
  }

  // the room's one lamp the engine lights: the warm light of a cove, high over the middle of the room
  f.lamp(117.0, 72.0, F0 + 9.0, { power: 1.8 });

  // ---- what glows, sparkles and answers --------------------------------------------------------------------------
  f.later(ctx => {
    const Wp = (X, Y, h) => f.world(X, Y, h);
    bottles(ctx, Wp, bottleList, Wp(99.3, 74.75, F0 + 4));
    neon(ctx, Wp, [cx, 77.44, F0 + 8.3], [1, 0], 6.2, 1.5, D.F.caveat);
    letterBoard(ctx, Wp, [cx, 77.32, F0 + 5.55], [1, 0], 4.6, 2.7, D.F.fraunces, pickN);
    bells(ctx, Wp, thronesSpec, pickN);
  });
  if (PROF) globalThis.__salonUnprof();
}
