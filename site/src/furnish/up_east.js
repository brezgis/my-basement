// up_east: The Quiet Room, the day room upstairs (see README.md here and the README at the project's root, and
// notes/STYLE.md and notes/REFIT.md). The Dressing Room and the East Suite that this file once furnished no longer exist;
// THE EAST SUITE is back (the second bedroom, east of the Quiet Room through the door in its east wall).
//
// THE QUIET ROOM, over the pool, along the circle's glass: X 43.3..76.7, Y ~47..72.5, 8.3 ft clear; its one door in the
// west wall (X 43, Y 60.5..63.5) at the end of the bridge from the Gallery. The upstairs sister of the Pool (notes/STYLE.md,
// "READ THIS FIRST"): pale coursed stone, honey boards and oak beams overhead, lit by a fire, candles and the courtyard.
// Precedents: the rest rooms of Therme Vals (loungers facing the view, nobody talking) and the Scandinavian bed-alcove.
// Three daybeds on plain oak frames at the three courtyard windows, head to the north (E: lie down, and you look out at
// the courtyard's sky): cream linen at the west and east windows; in the bay, in a plain oak alcove, the rust daybed Anna
// liked in the old East Suite. Beside each a small stone drum or oak table with a candle lantern, a book and a glass of
// water; wool blankets, bolsters and sheepskins. A fire in a stone breast on the east wall facing down the room, on a
// stone hearth with candles on it and logs stacked under its end, two oak-and-linen chairs before it. On the north wall
// a plain oak case of books, the tea trolley, a bed of ferns and mossy rocks; at the west end a chest of folded wool with
// Hammershøi's Rest over it. A tree in a big clay jar in the south-east corner. A long oak bench with sheepskins between
// two tall candle lanterns on a cream rug. Kept clear: 4 ft into the room from the door, and the way to the fire.
//
// STAFF POSTS (for whoever does the staff; nothing here places a robot):
//   The Quiet Room   home X 63.7, Y 69.6, h 13.5, facing north (the tea trolley)   the TEA ROBOT: silent, brings tea
//                    without being asked and leaves. The trolley: X 62.4..65.0, Y 71.0..72.5, its top tray h 16.2:
//                    the pickup is X 63.7, Y 71.7, h 16.2. Route: south past the bench's east lantern (X 62.5..66) to the
//                    open floor at Y 58..62, then to the table by each daybed: X 47.9 Y 56.8 (stand at X 47.9, Y 58.9,
//                    facing south), X 53.0 Y 57.3 (stand at X 53.0, Y 59.4), X 72.0 Y 57.0 (stand at X 72.0, Y 59.1);
//                    and the fireside drum X 69.3 Y 64.0 (stand at X 67.2, Y 64.0, facing east). Each table top about
//                    h 15.2. Never in the 4 ft inside the door (X 43.3..47.3, Y 59..65). Also: tends the fire (from
//                    X 72.8, Y 59.4, facing north-east, beside the hearth). Serves from: the tea trolley (an iron teapot,
//                    four cups, a caddy).
//   The East Suite   home X 88.0, Y 56.0, h 13.5, facing east (the box bed)   the TURN-DOWN robot, quiet. Posts: the box
//                    bed (from X 93.8, Y 56.2, facing east, beyond the step: turns the duvet down, lights the lantern in
//                    the alcove), the stove (from X 89.0, Y 57.6, facing north: feeds it from the log basket), the sitting group (a
//                    tray on the stone table at X 85.9, Y 53.0, top h 14.8, from X 85.9, Y 56.2), the bureau
//                    (from X 83.4, Y 59.4, facing north: leaves a letter on the flap), the window chair (from X 86.4,
//                    Y 48.6, facing south-west: a cup on the stone drum at X 85.3, Y 46.2, top h 15.0). Never in the
//                    Quiet Room door's leaf swing (X 77.75..81, Y 58.5..63.5) nor in front of the bath door (X 92..94.8,
//                    Y 48.5..51.5).
//   The East Bath    from X 96.0, Y 45.0, h 13.5, facing south (the tub: runs the bath, lights the candles on its rim);
//                    the towel rail and stool (from X 93.3, Y 43.6, facing south). Not in the door leaf's swing (X 92..94.8,
//                    Y 45.1..48). Serves from: the towels on the stool, the robes on the pegs, the linen cupboard.
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFlames, NOISE } from '../flame.js';
import {
  pad,
  M, vessel, bedside, sheepskin, geDaybed, juhlChaise, spokeback, footBlanket, fireBreast, lightFire, teaTrolley, lowBench, loungeChair,
  flameCandle, candleLantern, stoneDrum, oakTable, fernBed, leafKit, bostonFern, fiddleFig, lowStool, bigMirror, drumStove, ofuro, washstand, bureau, writingChair, drawPaper, screen3, bolster,
} from './up_east_parts.js';

export default function (f) {
  const K = f.kit, D = f.draw, QR = f.room('The Quiet Room'), F = QR.floor, CEIL = QR.ceil;      // (floor h 13.5, ceiling 21.8: 8.3 ft clear)
  // ---- lying down: a seat with the eye low and the look turned to a point, the head tipped up a little ---------------
  const lies = [];
  const lie = (X, Y, eye, tX, tY, pitch, label) => {
    K.seat(f.fr(X, Y, 0, 0), 0, 0, eye - 2.45, label);
    const s = K.seats[K.seats.length - 1];
    s.yaw = Math.atan2(-(tX - X), tY - Y);
    s.pitch = pitch; s.lie = true; lies.push(s);      // (the yaw in the kit's own terms, as kit.js seat(): the building's turn is added to it later)
  };
  // (walker.sit tips the head to -0.05; a lie spot carries its own pitch, put on once the visitor has lain down)
  f.later(ctx => { let done = false; ctx.animated.push(() => { if (done) return; let w; try { w = ctx.walker; } catch (e) { return; } if (!w) return; done = true;
    const sit = w.sit.bind(w); w.sit = seat => { sit(seat); if (seat?.lie) w.pitch = seat.pitch; }; }); });
  // a plain thick wool rug, a little rounded at its edges, a border woven darker
  const woolRug = (X0, X1, Y0, Y1, mat, edge, h = F) => { const G = f.fr(0, 0, h, 0); K.put(G, edge, K.geom.softBox(X0, X1, Y0, Y1, 0.012, 0.055, 0.03, { crown: 0.005 })); K.put(G, mat, K.geom.softBox(X0 + 0.35, X1 - 0.35, Y0 + 0.35, Y1 - 0.35, 0.03, 0.07, 0.03, { crown: 0.008 })); };
  // wall frames: on the face of a wall, y into the room, x along it
  const north = (X, Y = 72.48) => f.fr(X, Y, F, 2), east = (Y, X = 76.23) => f.fr(X, Y, F, 1), west = (Y, X = 43.32) => f.fr(X, Y, F, 3);

  quietRoom();
  eastSuite();
  eastBath();

  function quietRoom() {
    const OAK = M.OAKP, STONE = 'limestone_smooth#cfc6b2';
    // ---- the daybeds at the windows, head to the north: plain oak frames, cream linen, wool and sheepskin ---------------
    // the west window (its facet's middle at X 48.8, Y 49.2; sill 2.2)
    { const b = f.fr(51.0, 55.0, F, 3), top = juhlChaise(K, b, { fabric: M.OCHRE, bolster: M.CREAM, wood: M.TEAK });
      footBlanket(K, b, 3.2, 1.3, top, M.CREAM); K.cushion(b.sub(-1.9, 0.35, 0, 3), 0, 0, top + 0.4, 1.3, 1.2, M.GREEN, { tilt: 0.9 });
      lie(51.0, 56.8, F + top + 1.05, 51.0, 48.5, 0.3, 'lie back on the chaise'); }
    // the bay window (X 57.5..62.5, its face at Y 52.3; sill 1.2): Anna's rust daybed from the old East Suite, in a
    // plain oak alcove across the bay, a candle lantern on the ledge at its head
    {
      const X0 = 55.0, X1 = 65.0, Y0 = 52.42, Y1 = 56.4, G = f.fr(0, 0, F, 0);
      for (const [a, b] of [[X0, X0 + 0.5], [X1 - 0.5, X1]]) { G.bev(OAK, a, b, Y0, Y1, 0, 7.0, 0.02, { grain: 'z' }); G.block(a, b, Y0, Y1, 0, 7.0); }
      G.bev(OAK, X0 + 0.51, X1 - 0.51, Y0 + 0.03, Y1 - 0.03, 6.62, 7.0, 0.02, { grain: 'x' });
      G.bev(OAK, X0 + 0.5, X0 + 1.35, Y0 + 0.1, Y0 + 1.4, 2.6, 2.7, 0.01);
      candleLantern(K, G, X0 + 0.92, Y0 + 0.75, 2.7, { size: 0.42, h: 0.9 });
      const b = f.fr(60.0, 54.25, F, 0), top = geDaybed(K, b, { fabric: M.RUST, bolster: M.OAT, wood: M.TEAK });
      footBlanket(K, b, 3.25, 1.4, top, M.CREAM);
      lie(57.6, 54.3, F + top + 0.95, 60.5, 40.0, 0.15, 'lie back in the window');
    }
    // the east window (its facet's middle at X 71.2, Y 49.2; sill 2.2)
    { const b = f.fr(69.0, 54.3, F, 3), top = spokeback(K, b, { fabric: M.OAT, c1: M.GREEN, c2: M.CREAM, bolster: M.OCHRE, wood: OAK });
      footBlanket(K, b, 3.3, 1.45, top, M.RUST);
      lie(69.1, 56.6, F + top + 1.25, 69.0, 48.5, 0.22, 'lie down on the daybed'); }
    // beside each, a small table of oak or stone with a candle lantern, a book, a glass of water
    { const t = f.fr(0, 0, F, 0), h = stoneDrum(K, t, 47.9, 56.8, 0.62, 1.6, STONE); candleLantern(K, t, 47.75, 56.95, h); bedside(K, t, 47.9, 56.5, h, { subject: 'poetry', n: 1 }); }
    { const t = f.fr(0, 0, F, 0), h = oakTable(K, t, 53.0, 57.3, 1.25, 1.25, 1.75, OAK); candleLantern(K, t, 52.8, 57.45, h); bedside(K, t, 53.05, 57.0, h, { subject: 'nature', n: 1 }); }
    { const t = f.fr(0, 0, F, 0), h = stoneDrum(K, t, 72.0, 57.0, 0.62, 1.6, STONE); candleLantern(K, t, 71.85, 57.15, h); bedside(K, t, 72.0, 56.7, h, { subject: 'travel', n: 1 }); }
    sheepskin(K, f.fr(53.6, 54.2, F, 0), 0, 0, 0.0, 1.7, 2.6, { ph: 0.3 });
    // the south-east corner, under the high window: a tree in a big clay jar
    { const c = f.fr(74.6, 52.2, F, 0); vessel(K, c, 'c#a8704e/0.85', 0, 0, 0, [[0, 0], [0.6, 0], [0.95, 0.6], [1.0, 1.2], [0.8, 1.8], [0.55, 2.0], [0.6, 2.1], [0.5, 2.12], [0.48, 2.0], [0, 1.98]], 20);
      vessel(K, c, 'soilbed', 0, 0, 0, [[0.487, 2.03], [0.25, 2.039], [0, 2.04]], 20);
      { const L = leafKit(K); fiddleFig(K, L, c, 0, 0, 2.035, 1.0, 7); L.flush(); } c.block(-1.0, 1.0, -1.0, 1.0, 0, 3); }

    // ---- the fire: a stone breast on the east wall facing down the room, a stone hearth, logs under its end -------------
    { const b = east(68.3), at = fireBreast(K, b, { w: 5.4, d: 1.6, tall: CEIL - F - 0.03, hearth: 0.9, ox: 1.4, stone: 'limestone', hearthMat: STONE });
      const [X, Y] = b.map(at.x, at.y);
      lightFire(f, X, Y, F + at.z, 0, 1, makeFlames, mergeGeometries, NOISE);
      for (const [x, tall] of [[-2.2, 0.55], [-1.85, 0.35], [2.15, 0.45]]) flameCandle(K, b, x, 2.05, 1.31, tall, 0.13); }
    loungeChair(K, f.fr(70.4, 65.7, F, 3), 0, 0, M.GREEN, { label: 'sit by the fire', wood: M.TEAK, turn: 0.34, pillow: M.CREAM });
    loungeChair(K, f.fr(70.4, 69.4, F, 3), 0, 0, M.OAT, { label: 'sit by the fire', wood: M.TEAK, turn: -0.23 });
    { const t = f.fr(0, 0, F, 0), h = stoneDrum(K, t, 68.6, 67.55, 0.45, 1.45, STONE);
      vessel(K, t, M.CHINA, 68.7, 67.65, h, [[0, 0], [0.08, 0], [0.12, 0.05], [0.14, 0.2], [0.13, 0.2], [0, 0.03]], 12); K.bookStack(t, 68.45, 67.35, h, 2, { subject: 'poetry' }); }
    sheepskin(K, f.fr(72.7, 67.6, F, 0), 0, 0, 0.0, 2.2, 3.2, { ph: 0.5, rz: 1.5708 });

    // ---- the north wall: a plain oak case of books, the trolley, a bed of ferns and rocks; the picture over a chest -----
    { const b = north(56.0); K.bookcase(b, 11.0, 6.6, { d: 1.15, wood: OAK, fill: 0.85, subject: ['poetry', 'nature', 'travel', 'literature'] });
      for (const x of [-4.6, 4.6]) candleLantern(K, b, x, 0.55, 6.75, { size: 0.4, h: 0.85 }); }
    teaTrolley(K, north(63.7), { wood: OAK });
    { const b = north(67.15); fernBed(K, b, -1.75, 1.75, 1.4);
      f.model('st_rock_4', b, 0.6, 0.75, 0.45, 0, { scale: 0.8 }); }
    { const b = north(47.0); b.bev(OAK, -2.4, 2.4, 0.04, 1.5, 0.15, 2.2, 0.02, { grain: 'x' }); b.box(M.TEAKD, -2.3, 2.3, 1.5, 1.52, 0.3, 2.05); b.block(-2.4, 2.4, 0, 1.5, 0, 2.2);
      K.foldedStack(b, -1.2, 0.8, 2.2, 3, ['wool#ebe5d8', 'wool#c9b48e', M.RUST], { w: 1.4, d: 1.1, t: 0.17 });
      vessel(K, b, 'c#a8704e/0.85', 1.2, 0.75, 2.2, [[0, 0], [0.2, 0], [0.3, 0.3], [0.26, 0.6], [0.12, 0.75], [0.1, 0.85], [0, 0.85]], 14);
      f.framed(north(47.0, 72.18), 0, 5.0, 2.0, 2.21, 'ue_hammershoi_rest', { frame: OAK, mat: 0.2, border: 0.18, title: 'Rest', kicker: 'Vilhelm Hammershøi, 1905',
        text: 'A woman seen from behind, sitting very still in a grey room: Hvile, painted in Copenhagen. Oil on canvas.', foot: 'Musée d\'Orsay, Paris. Public domain.' }); }
    // ---- colour on the walls (STYLE.md, "Colour and life"): Monet's lilies over the trolley and the ferns; Larsson's breakfast
    // under the birch over the fire, seen as you come in at the door -------------------------------------------------
    f.framed(north(65.8), 0, 5.25, 3.0, 2.88, 'monet_water_lilies', { frame: OAK, mat: 0.22, title: 'Water Lilies', kicker: 'Claude Monet, 1906',
      text: 'The lily pond at Giverny, painted from the bank: no sky, no edge, only the water and what floats on it and what it reflects. Oil on canvas.', foot: 'Art Institute of Chicago. Public domain.' });
    f.framed(f.fr(74.6, 68.3, F, 1), 0, 5.5, 3.2, 2.18, 'larsson_breakfast_birch', { frame: OAK, mat: 0.2, title: 'Breakfast under the Big Birch', kicker: 'Carl Larsson, 1896',
      text: 'The family at Sundborn eating out of doors under the birch, the table laid, the dog waiting: from A Home, Larsson\'s watercolours of his own house.', foot: 'Nationalmuseum, Stockholm. Public domain.' });
    // ---- on the rug: a long low oak bench with sheepskins, a tall candle lantern either end ------------------------
    { const bb = f.fr(57.6, 67.4, F, 0), h = lowBench(K, bb, 6.4, { d: 1.4, wood: OAK }); K.seat(bb, -1.6, 0, h, 'sit on the bench'); K.seat(bb, 1.6, 0, h, 'sit on the bench');
      K.bookStack(bb, 2.5, 0.1, h, 3, { subject: 'art' }); K.foldedStack(bb, 0.6, 0, h, 2, [M.OAT, M.RUST], { w: 1.2, d: 1.0, t: 0.16 }); }
    candleLantern(K, f.fr(0, 0, F, 0), 53.5, 67.4, 0, { size: 0.75, h: 2.8, floor: true });
    candleLantern(K, f.fr(0, 0, F, 0), 61.7, 67.4, 0, { size: 0.75, h: 2.4, floor: true });
    f.rug(49.0, 67.6, 58.4, 70.4, F, 'garden');      // a big faded Persian, rust, blue and gold, under the bench and its lanterns
  }

  // =====================================================================================================================
  //  THE EAST SUITE   the bedroom: X 84.2..101 by Y 48.5..64, a window nook south of it (X 84.2..89.7 to the courtyard's
  //  wall), and the piece west to the Quiet Room's door (X 77.8..84.2). Doors: from the Quiet Room (X 77, Y 59.5..62.5, the
  //  leaf swinging in), to The East Bath (Y 48.2, X 92..94.8, the leaf swinging into the bath). Clay walls, boards, beams.
  // =====================================================================================================================
  function eastSuite() {
    const ES = f.room('The East Suite'), FS = ES.floor, H = ES.ceil - FS - 0.03, OAK = M.OAKP, STONE = 'limestone_smooth#cfc6b2';
    const fr = (X, Y, q = 0) => f.fr(X, Y, FS, q);
    // ---- the box bed: an oak wall along the east side, the bed in its alcove, a cupboard either side ----------------
    {
      const b = fr(100.98, 56.2, 1), Y = 4.9, xa = -3.5, xb = 3.5, z0 = 1.0, z1 = 6.5, L = -7.0, R = 7.0, W = OAK, WD = M.TEAK;
      b.box(W, L, xa, Y - 0.1, Y, 0, H); b.box(W, xb, R, Y - 0.1, Y, 0, H); b.box(W, xa, xb, Y - 0.1, Y, z1, H); b.box(W, xa, xb, Y - 0.1, Y, 0.25, z0);
      b.box(M.TEAKD, xa + 0.12, xb - 0.12, Y - 0.3, Y - 0.12, 0, 0.24);
      for (let x = L + 0.6; x < R; x += 0.62) if (x < xa - 0.1 || x > xb + 0.1) b.box(WD, x - 0.015, x + 0.015, Y + 0.01, Y + 0.025, 0.2, H - 0.2);
      b.box(W, L, L + 0.1, 0, Y - 0.1, 0, H); b.box(W, R - 0.1, R, 0, Y - 0.1, 0, H);
      for (const x of [xa, xb]) b.box(W, x - 0.1, x + 0.1, 0, Y - 0.1, 0, H);
      b.bev(W, L - 0.04, R + 0.04, Y - 0.12, Y + 0.12, H - 0.35, H - 0.05, 0.02, { grain: 'x' });
      b.box(WD, xa + 0.1, xb - 0.1, 0.02, 0.1, z0, z1); b.box(WD, xa + 0.1, xb - 0.1, 0.02, Y - 0.12, z1, z1 + 0.08);
      b.bev(W, xa + 0.1, xb - 0.1, 0.1, Y - 0.12, 0.25, 1.62, 0.02);
      pad(K, b, M.CREAM, xa + 0.16, xb - 0.16, 0.2, Y - 0.22, 1.62, 2.25);
      pad(K, b, M.OAT, xa + 0.18, xb - 1.5, 0.16, Y - 0.16, 2.18, 2.5, { lump: 0.025, dent: 0.04 });
      K.throwBlanket(b, xa + 0.3, xa + 1.6, 0.1, Y - 0.17, 2.5, M.RUST, { over: 'foot', rho: 0.1 });
      for (const y of [1.2, 3.4]) K.cushion(b.sub(xb - 0.75, y, 0, 3), 0, 0, 2.25, 2.0, 1.35, M.CREAM, { tilt: 0.55 });
      K.cushion(b.sub(xb - 1.1, 2.3, 0, 3), 0, 0, 2.25, 1.2, 1.0, M.GREEN, { tilt: 0.75 });
      b.bev(W, xb - 1.7, xb - 0.12, 0.1, 0.75, 3.3, 3.38, 0.01, { grain: 'x' });
      candleLantern(K, b, xb - 0.55, 0.42, 3.38, { size: 0.42, h: 0.85 }); K.bookStack(b, xb - 1.25, 0.42, 3.38, 2, { subject: 'mystery' });
      K.put(b, M.BRASS, K.geom.sweep([[xa + 0.12, Y - 0.28, z1 - 0.12], [xb - 0.12, Y - 0.28, z1 - 0.12]], 0.025, { seg: 6 }));
      for (const [c0, c1] of [[xa + 0.12, xa + 0.95], [xb - 0.95, xb - 0.12]]) K.put(b, 'linen#e2d6bc', K.geom.lathe([[0.42, 0], [0.43, (z1 - z0) * 0.5], [0.42, z1 - z0 - 0.15]], { seg: 18, sx: (c1 - c0) / 0.84, sy: 0.25, mod: t => 1 + 0.13 * Math.sin(t * 9) }), { at: [(c0 + c1) / 2, Y - 0.28, z0] });
      b.block(L, R, 0, Y, 0, H);
      { const st = fr(...b.map(0, Y + 0.55), 1); st.bev(OAK, -2.3, 2.3, -0.5, 0.5, 0.62, 0.8, 0.02, { grain: 'x' }); for (const x of [-1.8, 1.8]) st.bev(OAK, x - 0.12, x + 0.12, -0.4, 0.4, 0, 0.62, 0.01); st.block(-2.3, 2.3, -0.5, 0.5, 0, 0.8); }
      const [bx, by] = b.map(2.4, 2.45);
      lie(bx, by, FS + 2.25 + 0.65, 80.0, 44.0, 0.05, 'lie down in the box bed');
      K.hingedDoor(b, xb + 0.1, R - 0.1, Y + 0.02, 0.25, H - 0.4, { hinge: 'right', mat: 'c#b8925f/0.7', handle: M.BRASS, label: 'wardrobe' });
      K.hingedDoor(b, L + 0.1, xa - 0.1, Y + 0.02, 0.25, H - 0.4, { mat: 'c#b8925f/0.7', handle: M.BRASS, label: 'linen cupboard' });
      { const r = fr(0, 61.45); K.put(r, M.BRASS, K.geom.sweep([[96.3, 0, 6.0], [100.8, 0, 6.0]], 0.03, { seg: 6 }));
        K.clothes(r, 96.4, 100.7, 0, 6.0, { kinds: ['coat', 'dress', 'coat'], colours: ['wool#ebe5d8', 'linen#e8e0cf', 'wool#3c5a44', 'linen#c4922e'], gap: 0.2 }); }
      { const r = fr(98.5, 50.95); r.bev(WD, -2.3, 2.3, -1.6, 1.6, 3.12, 3.2, 0.01); r.bev(WD, -2.3, 2.3, -1.6, 1.6, 5.6, 5.68, 0.01);
        K.foldedStack(r, 0, 0, 3.2, 5, ['wool#ebe5d8', 'linen#d9cdb2', 'wool#9a4a2a'], { w: 2.0, d: 1.4, t: 0.15 }); K.foldedStack(r, 0, 0, 5.68, 3, ['linen#e8e0cf', 'wool#3c5a44'], { w: 2.0, d: 1.4, t: 0.18 }); }
    }
    // ---- the stove against the north wall, one deep chair facing it, a sheepskin --------------------------------
    {
      const s = fr(89.0, 62.0, 2), at = drumStove(K, s, H);
      const [X, Y] = s.map(at.x, at.y);
      lightFire(f, X, Y, FS + at.z, 1, 0, makeFlames, mergeGeometries, NOISE, 0.5);      // logs and live flames in the open firebox (it is the room's lamp)
      loungeChair(K, fr(92.7, 60.6, 1), 0, 0, M.OCHRE, { label: 'sit by the stove', wood: M.TEAK });
      K.cushion(fr(92.7, 60.6, 1).sub(0, -0.55, 0, 0), 0, 0, 1.35, 1.2, 1.0, M.CREAM, { tilt: 0.7 });
      sheepskin(K, fr(90.4, 58.6), 0, 0, 0.0, 1.8, 2.4, { ph: 1.4, rz: 0.4 });
    }
    // ---- the writing bureau on the north wall west of the stove, its chair, the house's paper, flowers -----------------
    {
      const b = fr(83.4, 63.98, 2), zf = bureau(K, b, { w: 3.2, wood: OAK });
      writingChair(K, b, -0.12, 3.21, { dq: 2, wood: OAK });
      const paper = b.sub(-0.28, 2.05);
      paper.bev('c#e3dac7/0.9', -0.38, 0.38, -0.48, 0.48, zf + 0.032, zf + 0.05, 0.006);
      f.sign(paper, 0, zf + 0.052, 0.74, 0.96, drawPaper(D), { y: 0, flat: true, res: 300 });
      K.put(b, 'c#30201b/0.4', K.geom.sweep([[0.47, 1.82, zf + 0.045], [0.55, 2.34, zf + 0.045]], 0.018, { seg: 7, caps: true }));
      K.bookStack(b, 1.06, 1.98, zf + 0.034, 2, { subject: 'poetry' });
      candleLantern(K, b, -1.01, 0.64, 4.2, { size: 0.42, h: 0.85 });
      K.posy(b, 0.96, 0.77, 4.2, ['c#e8b18d/0.65', 'c#dec887/0.65', 'c#bc665b/0.6'], { kinds: ['tulip', 'ranunculus'], jar: 'c#bcaa90/0.45', scale: 1.13 });
    }
    // ---- Redon's flowers over the stove chair, the first thing seen from the door ---------------------------
    f.framed(fr(93.3, 63.98, 2), 0, 5.2, 1.9, 2.78, 'aic_redon_flowers', { frame: OAK, mat: 0.2, title: 'Still Life with Flowers', kicker: 'Odilon Redon, about 1905',
      text: 'A vase of wild flowers in pastel, the colours set floating on the paper as if in a dream.', foot: 'Art Institute of Chicago. Public domain (CC0).' });
    // ---- the one picture, on the Quiet Room's wall south of the door ---------------------------------------------
    f.framed(fr(77.77, 54.0, 3), 0, 5.2, 1.5, 2.28, 'ue_hiroshige_shower', { frame: M.TEAKD, mat: 0.2, title: 'Sudden Shower over Shin-Ōhashi Bridge and Atake', kicker: 'Utagawa Hiroshige, 1857',
      text: 'From One Hundred Famous Views of Edo: a summer storm coming down in lines over the bridge, people running under it. Woodblock print.', foot: 'The Metropolitan Museum of Art. Public domain (CC0).' });
    // ---- the window nook: a deep chair facing the courtyard window, a stone drum with a lantern, a fern in a jar -----
    {
      loungeChair(K, fr(82.6, 47.0, 2), 0, 0, M.GREEN, { label: 'sit at the window', wood: M.TEAK });
      K.cushion(fr(82.6, 47.0, 2).sub(0, -0.55, 0, 0), 0, 0, 1.35, 1.2, 1.0, M.OAT, { tilt: 0.7 });
      const t = fr(0, 0), h = stoneDrum(K, t, 85.3, 46.2, 0.5, 1.5, STONE); candleLantern(K, t, 85.2, 46.3, h, { size: 0.4, h: 0.8 }); K.bookStack(t, 85.45, 46.0, h, 1, { subject: 'poetry' });
      sheepskin(K, fr(82.6, 45.3), 0, 0, 0, 2.0, 2.6, { ph: 2.0 });
      const j = fr(88.6, 42.4); vessel(K, j, 'c#a8704e/0.85', 0, 0, 0, [[0, 0], [0.45, 0], [0.7, 0.45], [0.72, 0.9], [0.55, 1.3], [0.45, 1.4], [0.5, 1.45], [0.44, 1.45], [0.42, 1.33], [0, 1.32]], 18);
      vessel(K, j, 'soilbed', 0, 0, 0, [[0.43, 1.375], [0.25, 1.38], [0, 1.387]], 18);
      { const L = leafKit(K); bostonFern(K, L, j, 0, 0, 1.38, 1.05, 21); L.flush(); } j.block(-0.75, 0.75, -0.75, 0.75, 0, 2);
    }
    // ---- the middle: a small sitting group on a kilim: two soft chairs facing across a low stone table, a tall lantern ----
    f.rug(81.4, 90.2, 48.9, 57.1, FS, 'kilim');
    loungeChair(K, fr(83.6, 53.0, 3), 0, 0, M.CREAM, { label: 'sit down', wood: M.TEAK });
    loungeChair(K, fr(88.2, 53.0, 1), 0, 0, M.RUST, { label: 'sit down', wood: M.TEAK, pillow: M.OCHRE });
    { const t = fr(0, 0), h = stoneDrum(K, t, 85.9, 53.0, 0.7, 1.3, STONE);
      vessel(K, t, M.IRON, 85.7, 53.15, h, [[0, 0], [0.2, 0], [0.27, 0.1], [0.28, 0.2], [0.22, 0.3], [0.1, 0.33], [0, 0.36]], 14);
      for (const [x, y] of [[86.2, 52.8], [86.15, 53.35]]) vessel(K, t, M.CHINA, x, y, h, [[0, 0], [0.07, 0], [0.11, 0.05], [0.12, 0.17], [0.11, 0.17], [0, 0.03]], 12);
      K.bookStack(t, 85.6, 52.6, h, 2, { subject: 'travel' }); }
    candleLantern(K, fr(0, 0), 82.9, 50.2, 0, { size: 0.6, h: 2.6, floor: true });
  }

  // =====================================================================================================================
  //  THE EAST BATH   X 90.25..101 by Y 40.6..47.95, against the rock (no window); the door from the bedroom in its north
  //  wall (X 92..94.8), the leaf swinging in. Cream glazed tile, a mosaic floor, boards over. Warm: two lantern sconces at
  //  the glass (one lights the room), candles, a lantern by the tub.
  // =====================================================================================================================
  function eastBath() {
    const EB = f.room('The East Bath'), FB = EB.floor, OAK = M.OAKP;
    const fr = (X, Y, q = 0) => f.fr(X, Y, FB, q);
    // the soaking tub along the south wall, east end (sit in it with E)
    { const b = fr(98.1, 40.62, 0), seat = ofuro(K, b, 4.6, 2.85); const [X, Y] = b.map(seat.x, seat.y);
      lie(X, Y, FB + 0.4 + 2.45, 101.0, 41.0, 0.0, 'get into the bath');
      for (const [x, t] of [[2.1, 0.5], [1.85, 0.35]]) flameCandle(K, b, x, 2.76, 2.1, t, 0.075); }
    K.bathMat(fr(98.2, 44.4), 0, 0, 2.6, 1.5, 'wool#ebe5d8');
    candleLantern(K, fr(0, 0), 95.0, 44.6, 0, { size: 0.55, h: 1.6, floor: true });
    // the washstand on the east wall, the glass over it, a lantern sconce either side
    { const w = fr(100.98, 46.0, 1); washstand(K, w, { w: 2.6 });
      bigMirror(K, w, 0.1, 4.15, 1.6, 2.1, { wood: OAK });
      for (const [x, lit] of [[-1.35, true], [1.35, false]]) { K.sconce(w, x, 5.4, { kind: 'lantern', glass: 'e#ffd49a/1.2' }); K.lampAt(w, x, 0.45, 5.6, lit ? 0.7 : 0.4); const l = K.lamps[K.lamps.length - 1]; if (!lit) l.kind = 'glow'; l.halo = 0.55; } }
    // the WC on the west wall, its side to the door
    K.toilet(fr(90.31, 42.61, 3), 0, { seat: 'porcelain' });
    // over it, an oak shelf: bottles, a jar candle, a trailing pothos (it likes the steam)
    { const s = fr(90.27, 42.6, 3); s.bev(OAK, -1.4, 1.4, 0.02, 0.75, 5.6, 5.7, 0.015, { grain: 'x' });
      for (const [x, h, c] of [[-1.0, 0.55, 'c#c4922e/0.1'], [-0.7, 0.42, 'c#7fa3a6/0.08'], [-0.42, 0.62, 'c#e8e0cf/0.2']]) { vessel(K, s, M.GLASS, x, 0.4, 5.7, [[0, 0], [0.1, 0], [0.11, h * 0.7], [0.05, h * 0.85], [0.04, h], [0, h]], 12); vessel(K, s, c, x, 0.4, 5.71, [[0, 0], [0.09, 0], [0.1, h * 0.5], [0, h * 0.5]], 10); vessel(K, s, M.BRASS, x, 0.4, 5.7 + h, [[0, 0], [0.045, 0], [0.045, 0.06], [0, 0.07]], 8); }
      flameCandle(K, s, 0.1, 0.4, 5.7, 0.3, 0.12);
      K.pottedPlant(s, 0.85, 0.4, 5.7, 'trailing', { size: 0.9, pot: 'c#a8704e/0.85', block: false }); }
    // the north wall east of the door: oak pegs with two robes; the south wall west of the tub: a towel rail, a stool
    { const n = fr(97.6, 47.93, 2); n.bev(OAK, -2.2, 0.6, 0.02, 0.12, 5.6, 6.0, 0.015, { grain: 'x' });
      for (const [x, c] of [[-1.6, 'wool#ebe5d8'], [-0.1, 'wool#9a4a2a']]) { K.put(n, OAK, K.geom.lathe([[0.05, 0], [0.04, 0.3], [0.06, 0.32], [0, 0.34]], { seg: 8 }), { rx: -Math.PI / 2 - 0.25, at: [x, 0.12, 5.8] }); K.coatOnPeg(n, x, 0.22, 5.75, c, 'robe'); } }
    { const s = fr(93.3, 40.62, 0); K.towelRail(s, 0.48, 3.75, 2.0, { towels: ['wool#ebe5d8', 'wool#c9b48e'], drop: 1.38 });
      lowStool(K, s, -0.34, 1.04, { dq: 2, h: 1.45, label: 'sit on the stool' });
      f.framed(s, 0, 5.35, 1.5, 1.24, 'van_gogh_grapes_lemons', { frame: OAK, mat: 0.14, title: 'Grapes, Lemons, Pears, and Apples', kicker: 'Vincent van Gogh, 1887', text: 'Fruit on a yellow cloth, painted in Paris in short strokes of pure colour.', foot: 'Art Institute of Chicago. Public domain (CC0).' });
      K.foldedStack(s, -0.34, 1.04, 1.46, 3, ['wool#ebe5d8', 'wool#d9cdb5', 'wool#9a4a2a'], { w: 1.0, d: 0.8, t: 0.14 }); }
  }
}
