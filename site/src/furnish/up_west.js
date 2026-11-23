// up_west: The Suite, The Bath, The Consulting Room and The Gallery, the upper floor of the west wing (furnish file
// of the agent `up_west`; pieces in up_west_parts.js), re-fitted to the three-quarter plan (notes/REFIT.md). The
// language is notes/STYLE.md: warm Scandinavian brutalism with the outside in: walnut, low mid-century furniture,
// wool and sheepskin, cream linen and paper, amber light; Japanese where it meets the water.
//
// THE SUITE. The only bedroom, after the podium beds of Villa Vals (research/photos/11.jpg: a bed on a plain
//   platform, a striped wool blanket, a stack of white shades for a lamp, a shaggy pelt): a low walnut podium with a
//   line of light under its edge, the bed on it with its head to the west, so that from the pillow the eye goes out of
//   the east bay window and up to the sky over the courtyard's far rim (lie down with E); four pillows and one
//   blanket; a Noguchi lantern either side. The window daybed Anna loves, now under the arched window over the
//   clouds. A round iron stove (Morsø's) with a chair drawn up to it, a wardrobe, a brass telescope at the bay.
// THE BATH. A small Japanese bathroom in hinoki and slate: an ofuro of hinoki boards under the window over the
//   clouds (get in with E), a duckboard, a floating walnut washstand with a stone basin and an arched mirror, towels
//   on bronze rails, a stool and a bucket, a tall paper lantern, a plant.
// THE CONSULTING ROOM. Small and close: a 1960s analyst's room in walnut, the mood of the listening lounge (STYLE.md
//   picture 3), kept to the bones of Freud's consulting room at Berggasse 19 and 20 Maresfield Gardens: THE COUCH (a
//   Mogensen-style daybed) along the north wall with a Qashqai rug thrown over it and a bolster at its head, which is
//   toward the door, so that whoever lies there looks away from door and chair into the courtyard's light in the low
//   window at the south-east corner; the analyst's lounge chair behind the head, out of sight, and beside it a clock
//   that only the chair can read; tissues and a carafe within reach of the couch, with tact; a small wall of books
//   with one lit bay of antiquities (an Athena, a sphinx, two shabtis); a low case of books under the east wall; one
//   lamp; a rug; a plant at the window. Over the couch three of Paul Klee's ink drawings ("taking a line for a
//   walk"), over the chair two squiggles drawn here, unfinished. "Winnicott for grown-ups": nothing for children, no
//   transitional objects, no blanket.
// THE GALLERY. In the key of the pool and the chapel (STYLE.md, first section), not of the rooms above: a plain honey
//   oak case of books on the landing's west wall, an oak bench with a sheepskin and a candle lantern, two chairs to
//   wait in by the consulting room's door in quiet oak and linen, a candle lantern hanging over the landing, undyed
//   wool runners along the strip and the bridge. Nothing else on the strip or the bridge, which keep their full width.
//
// STAFF POSTS (for the agent who does the staff; plan X, Y; the upper floor is h 13.5, ceiling 21.8 (from f.room); nothing below places a robot):
//   The Consulting Room, WINNICBOTT, the analyst: SITS in the lounge chair (the model mid_century_lounge_chair) behind
//     the couch's head: the chair stands at X 27.8, Y 51.2 (the middle of its seat about there), seat top about
//     h 13.5 + 1.45, facing east-south-east (toward X 34.5, Y 46.5: past the patient's head, never at their face).
//     Reach it from the door (X 25.2, Y 45..48) by X 26..29.5, Y 48.5..49.5. Posts: the bookcase on the south wall
//     (stand at X 30.6, Y 43.3, facing south), the low case on the east wall (X 40.2, Y 49.4, facing east), the window
//     (X 38.6, Y 44.6, facing south-east). Serves from the carafe on the low table at the couch's head (X 31.5,
//     Y 49.4, h 15.0). The clock it alone reads is on the little table at X 28.65, Y 49.05, facing the chair.
//   The Suite, a turn-down attendant (if you like): home X 35.0, Y 33.5, facing west (the bed's foot from its side);
//     posts: the wardrobe (X 19.0, Y 31.6, facing south), the stove (X 18.6, Y 37.8, facing west), the window daybed
//     (X 29.2, Y 22.4, facing south). Serves from the podium's north ledge (X 28.0, Y 35.5, h 14.0).
//   The Bath: none needed; if one draws the bath, it stands at X 19.0, Y 22.3, facing south.
//   The Gallery: none (it is a way through). If a librarian is wanted: X 16.5, Y 47.0, facing west (the books).
import { burningLogs, storedLogs } from '../kit/firewood.js';
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeFlames } from '../flame.js';
import { parts, M, squiggle, qashqai } from './up_west_parts.js';

let F = 13.5, CEIL = 21.8, H = CEIL - F; const XC = 60, YC = 28, TAU = Math.PI * 2;

export default function (f) {
  { const r = f.room('The Suite'); F = r.floor; CEIL = r.ceil; H = CEIL - F; }     // the upper floor's levels, from the building
  const K = f.kit, P = parts(K), G = f.fr(0, 0, F, 0);                // G: x = plan X, y = plan Y, z above the floor
  const later = [];                                                    // things made once the scene exists (f.later)
  // a seat at plan (X, Y), the seat top h above the floor, facing plan angle a
  const seatAt = (X, Y, h, a, label) => { const [x, z] = K.world(G, X, Y); K.seats.push({ x, y: F + h + 2.45, z, yaw: Math.atan2(-Math.cos(a), Math.sin(a)), label }); };
  // lying down: the eye at plan (X, Y, h above the floor) looking toward (TX, TY), tipped up by pitch (E, as chess.js sits)
  const lie = (X, Y, h, TX, TY, pitch, label, more = []) => later.push(ctx => {      // (more: other places [X, Y] on the piece that can be looked at to lie down)
    const p = f.world(X, Y, F + h), q = f.world(TX, TY, F + h);
    const seat = { x: p.x, y: p.y, z: p.z, yaw: Math.atan2(-(q.x - p.x), -(q.z - p.z)), label };
    const act = () => { ctx.walker.sit(seat); ctx.walker.pitch = pitch; };
    const hidden = () => { try { return ctx.walker?.seated?.label === label; } catch { return false; } };      // (not offered again to someone already lying there)
    ctx.interact.push({ x: p.x, y: p.y - 0.7, z: p.z, reach: 6, size: 1.9, label: () => label, hidden, act });
    for (const [MX, MY] of more) { const m = f.world(MX, MY, F + h); ctx.interact.push({ x: m.x, y: m.y - 0.7, z: m.z, reach: 6, size: 1.9, label: () => label, hidden, act }); }
  });
  // a model turned to face plan point (TX, TY) from (X, Y)
  const modelFacing = (id, X, Y, TX, TY, o = {}) => { const face = Math.atan2(TY - Y, TX - X); f.model(id, f.fr(X, Y, F, 0), 0, 0, 0, 0, { ...o, turn: Math.atan2(Math.cos(face), -Math.sin(face)) - Math.PI }); };
  // a drawing on paper in a plain thin walnut frame, on a wall frame (centre x, z; the paper w by tall)
  const drawing = (fr, x, z, w, tall, draw, label) => {
    const b = 0.07, d = 0.08, FR = M.WALD;
    fr.box(FR, x - w / 2 - b, x + w / 2 + b, 0.01, d, z + tall / 2, z + tall / 2 + b); fr.box(FR, x - w / 2 - b, x + w / 2 + b, 0.01, d, z - tall / 2 - b, z - tall / 2);
    fr.box(FR, x - w / 2 - b, x - w / 2, 0.01, d, z - tall / 2, z + tall / 2); fr.box(FR, x + w / 2, x + w / 2 + b, 0.01, d, z - tall / 2, z + tall / 2);
    f.sign(fr, x, z, w, tall, draw, { y: 0.03, res: 260 });
    if (label) f.label(fr, x, 0.12, z, { reach: 7, ...label });
  };
  // a fern (a Poly Haven scan, alpha fronds: notes/ASSETS.md) in a glazed pot, on the floor or (tall) on an oak plant stand
  function fernPot(X, Y, o = {}) {
    const r = 0.5, h = 0.95, z0 = o.tall ? 2.5 : 0, pot = o.pot ?? 'c#2b2622/0.45';
    if (o.tall) f.model('side_table_tall_01', f.fr(X, Y, F, 0), 0, 0, 0, 0, {});
    P.ves(G, pot, X, Y, z0, [[0, 0], [r * 0.7, 0], [r * 0.75, 0.03], [r * 0.98, h * 0.8], [r, h], [r * 0.92, h], [r * 0.88, h * 0.88], [0, h * 0.86]], 18);
    P.ves(G, 'c#3b2a1f/1', X, Y, z0 + h * 0.84, [[0, 0], [r * 0.88, 0], [r * 0.84, 0.02], [0, 0.03]], 14);
    const t0 = (X * 3.7 + Y) % 6.28, sc = (o.scale ?? 0.6) * 1.2;
    f.model(o.model ?? 'fern_clump_b', f.fr(X, Y, F, 0), 0, 0, z0 + h * 0.8, 0, { scale: sc, turn: t0 });      // two clumps to a pot, so that the fronds fill it and spill over
    f.model(o.model === 'fern_clump_a' ? 'fern_clump_d' : 'fern_clump_c', f.fr(X, Y, F, 0), 0.05, -0.05, z0 + h * 0.82, 0, { scale: sc * 0.85, turn: t0 + 2.2 });
    G.block(X - 0.6, X + 0.6, Y - 0.6, Y + 0.6, 0, 1.6);
  }
  // a wall of shelves on a wall frame from x = xa (the reader's left) to xb, d deep, nb bays, floor to top, a cove of
  // light hidden behind its fascia; rows go into the shelf run `run`. skip(i, z): leave that row of bay i empty.
  function wallCase(fr, xa, xb, d, nb, run, top, skip = () => false, o = {}) {
    const W = o.wood ?? M.WAL, WD = o.back ?? M.WALD;
    const SH = []; for (let z = 0.35; z + 1.0 < top - 0.15; z += 1.1) SH.unshift(z);
    const bw = (xa - xb) / nb;
    fr.box(WD, xb + 0.04, xa - 0.04, 0.035, 0.085, 0.02, top - 0.01);
    fr.box(M.BLACK, xb + 0.05, xa - 0.05, 0.13, d - 0.1, 0, 0.27);
    for (let i = 0; i <= nb; i++) { const x = xa - i * bw; fr.bev(W, x - 0.05, x + 0.05, 0.075, d, 0, top, 0.01, { grain: 'z' }); }
    for (let i = 0; i < nb; i++) { const x1 = xa - i * bw, x0 = x1 - bw;
      fr.bev(W, x0 + 0.046, x1 - 0.046, d - 0.035, d + 0.043, top - 0.2, top - 0.011, 0.008, { grain: 'x' });
      for (const z of SH) { fr.bev(W, x0 + 0.045, x1 - 0.045, 0.13, d - 0.02, z - 0.07, z, 0.01, { grain: 'x' }); if (!skip(i, z)) K.shelf(fr, x0 + 0.08, x1 - 0.08, 0.14, z, Math.min(1.02, top - z - 0.25), { front: d - 0.1, run }); } }
    fr.bev(W, xb - 0.05, xa + 0.05, 0.075, d + 0.06, top, top + 0.1, 0.015, { grain: 'x' });
    if (o.cove !== false) P.strip(fr, xb + 0.05, xa - 0.05, d - 0.14, d - 0.08, top - 0.18, top - 0.15);
    fr.block(xb, xa, 0, d + 0.06, 0, top);
    return { bw, SH };
  }

  K.shelfRun('consulting', { subject: ['psychology', 'philosophy', 'classics', 'poetry'], fit: 1, fill: 0.92 });
  K.shelfRun('gallery', { subject: ['literature', 'poetry', 'essays', 'travel', 'nature', 'art', 'history'], fit: 1, fill: 0.93 });

  consulting();
  gallery();
  suite();
  bath();
  f.later(ctx => { for (const fn of later) fn(ctx); });

  // =================================================================================================================
  //  THE CONSULTING ROOM  (X 25.45..35.8 by Y 40.75..53.05, and east to X 42.75 by the courtyard's glass; the door in
  //  the west wall, X 25.2, Y 45..48, from the Gallery's landing, swinging in)
  // =================================================================================================================
  function consulting() {
    // ---- the couch: along the north wall, its head to the west (the door's side), so that whoever lies on it looks
    // away from the door and the chair, toward the courtyard's light in the low window at the south-east corner
    const Cf = f.fr(35.7, 53.0, F, 2);                                   // local x runs west (x = 35.7 - X), y south (53.0 - Y)
    const mz = P.daybed(Cf, 6.6, 2.6, { head: 1 });
    P.bolster(Cf, M.OCHRE, 2.95, 1.3, mz + 0.02, 2.2, 0.26);
    K.cushion(Cf, 2.72, 1.3, mz + 0.16, 1.25, 1.0, M.GREEN, { tilt: 1.0, turn: Math.PI / 2 });      // (laid back on the bolster, behind the head of whoever lies down: propped upright at 2.35 it stood where their face is)
    later.push(ctx => drapeRug(ctx, Cf, { x0: -3.15, x1: 1.9, y0: 0.12, yEdge: 2.52, drop: 0.95, z: mz + 0.05, seed: 23 }));
    // (no label for the rug here: it took E from lying down, and the rug can be read about in the Hall. Here it is just a couch.)
    { const [X, Y] = Cf.map(1.85, 1.3); lie(X, Y, mz + 0.62, 41.3, 42.9, 0.45, 'lie on the couch', [Cf.map(0.2, 1.3), Cf.map(-1.5, 1.3), Cf.map(-2.8, 1.3), Cf.map(-0.6, 2.3)]); }      /* (anywhere along it, and on the rug over its edge: only its head end could be chosen) */      // (toward the courtyard window in the south-east corner)
    f.rug(26.0, 39.6, 46.4, 52.9, F, 'tabriz');      // (it holds the group: couch, chair, the two little tables)

    // ---- the analyst's chair, behind the head; the clock only it can read, on a little table at its elbow; the lamp
    modelFacing('mid_century_lounge_chair', 28.2, 51.3, 35.5, 47.0, { collide: true });      // (behind the couch's head and to one side, 2.5 ft clear of it, as in Freud's room)
    { const t = f.fr(27.0, 48.95, F, 0);
      P.ves(t, M.WAL, 0, 0, 0, [[0, 0], [0.24, 0], [0.24, 0.04], [0.07, 0.08], [0.05, 1.8], [0.4, 1.82], [0.4, 1.9], [0, 1.9]], 18); t.block(-0.4, 0.4, -0.4, 0.4, 0, 1.9);
      P.clock(f.fr(27.0, 48.9, F + 1.9, 0), 0, 0, 0); }                 // its face to the north, toward the chair; the couch's head is behind the dial
    P.phFloorLamp(G, 25.95, 52.55, { lit: true, power: 0.95, h: 4.5 });
    // tissues and a carafe within reach of the couch's head end: not offered, simply there
    { const t = f.fr(33.5, 48.9, F, 0); K.table(t, 1.8, 1.0, 1.5, 'c#8a6440');
      K.tissueBox(t, -0.45, 0.5, 1.5, { turn: 0.25, colour: '#b9a27c' }); P.carafe(t, 0.45, 0.5, 1.5); }

    // ---- over the couch, one tight salon hang on a single centre line (z 5.0), 2 to 3 inch gaps: three Klee drawings
    // and six squiggles and line drawings made here, in mixed plain frames
    const Nw = X => f.fr(X, 53.05, F, 2);                              // x = -(X - its X): the frame's x runs west
    const KF = { frame: M.WALD, border: 0.07, mat: 0.12 };
    f.framed(Nw(35.80), 0, 5.0, 1.4, 1.28, 'uw_klee_rider', { ...KF, title: 'Rider Unhorsed and Bewitched', kicker: 'Paul Klee, 1920. Ink on paper',
      text: 'A rider, a horse, and a line that has stopped being either.\n"A line is a dot that went for a walk." Klee, in his teaching notes at the Bauhaus.', foot: 'The Metropolitan Museum of Art, Berggruen Klee Collection. Public domain.' });
    f.framed(Nw(37.53), 0, 5.0, 0.9, 1.34, 'uw_klee_knotted_net', { ...KF, title: 'Drawing Knotted in the Manner of a Net', kicker: 'Paul Klee, 1920. Ink on paper',
      text: 'One line, knotted and re-knotted until it holds a shape.', foot: 'The Metropolitan Museum of Art, Berggruen Klee Collection (1984.315.20). Public domain.' });
    f.framed(Nw(33.92), 0, 5.66, 1.2, 0.74, 'uw_klee_kairouan_b', { ...KF, title: 'Episode B at Kairouan', kicker: 'Paul Klee, 1931. Ink on paper',
      text: 'Kairouan, in Tunisia, where in 1914 Klee wrote that colour had him. Here, seventeen years on, only the line.', foot: 'The Metropolitan Museum of Art, Berggruen Klee Collection. Public domain.' });
    const SQ = { title: 'A squiggle', kicker: 'Ink on paper, unfinished',
      text: 'One line, put down without lifting the pen and without knowing where it was going. The other person is supposed to turn it into something. Nobody has, yet.\nAfter the squiggle game of D. W. Winnicott, who played it with his patients. These were drawn here.', foot: 'The Consulting Room' };
    const sq = (X, z, w, t, seed, done) => drawing(Nw(X), 0, z, w, t, squiggle(seed, done), { label: 'look at the squiggle', ...SQ });
    sq(34.19, 4.26, 0.9, 1.15, 7, 0.62);                                // under Kairouan
    sq(33.18, 4.25, 0.45, 0.55, 53, 0.8);                               // a small one beside it
    sq(38.99, 5.6, 1.1, 0.85, 31, 0.45);                                // right of the net, above
    sq(38.79, 4.48, 0.7, 0.7, 88, 0.35);                                //   and below
    sq(32.62, 5.25, 0.6, 0.8, 117, 0.7);                                // the far left, over the chair's side
    sq(35.20, 6.44, 0.75, 0.55, 205, 0.5);                               // the top, over the rider
    f.label(Nw(35.80), 0, 0.15, 3.55, { label: 'look at the drawings', reach: 7, title: 'Taking a line for a walk', kicker: 'Paul Klee, and squiggles drawn here',
      text: 'Three ink drawings by Klee, who said a line was a dot that went for a walk, hung close with half a dozen squiggles: single lines put down without knowing where they were going, after the game Winnicott played with his patients, in which one person draws a squiggle and the other turns it into something. None of these has been turned into anything yet.', foot: 'Klee: The Metropolitan Museum of Art, Berggruen Klee Collection (public domain). The squiggles: drawn here.' });

    // ---- the wall the chair and the couch face: books from floor to near the ceiling, one bay lit for a few antiquities
    { const E = f.fr(42.68, 48.95, F, 1);                                 // x = Y - 49.3: +x north, the reader's left
      const { bw } = wallCase(E, 3.35, -3.35, 1.0, 3, 'consulting', 7.4, (i, z) => i === 1 && z > 4.5);
      const xc = 3.35 - 1.5 * bw;
      P.strip(E, xc - bw / 2 + 0.1, xc + bw / 2 - 0.1, 0.75, 0.8, 7.17, 7.2);
      f.model('x_athena_hope', E, xc - 0.35, 0.5, 4.75, 0, { scale: 0.6, turn: 0.2 });
      for (const [dx, c] of [[0.3, 'c#3f8a86/0.35'], [0.55, 'c#4a9a90/0.35']]) P.ushabti(E, xc + dx, 0.5, 4.75, 1.5, c);
      f.model('x_sphinx_four_headed', E, xc, 0.5, 5.85, 0, { scale: 0.62, turn: -0.3 });
      f.label(E, xc, 0.85, 5.3, { reach: 6, label: 'look at the antiquities', title: 'Athena, a sphinx, two shabtis', kicker: 'After the Hope Athena; Roman, 2nd century CE; Egypt, faience',
        text: 'Freud kept his antiquities on every surface of his study and greeted some of them in the mornings; his favourite was a small bronze Athena, the one he sent ahead to Paris when he left Vienna in 1938. This one is a cast of the head of the Hope Athena (SMK, Copenhagen). The four-headed sphinx is from a scan of the marble in the Kunsthistorisches Museum, a short walk from Berggasse 19. The shabtis, little servants buried to work in the afterlife, were modelled here.',
        foot: 'SMK KAS275 (public domain); Three D Scans (no copyright restrictions).' }); }
    // ---- the south wall: a low case of books, a lantern, a bowl and a branch on it; a plant in the corner by the door
    { const S = f.fr(32.4, 40.75, F, 0), d = 1.2, h = 2.6;                // x = X - 32.4: +x east, the reader's left
      S.box(M.WALD, -3.16, 3.16, 0.035, 0.085, 0.02, h - 0.01); S.box(M.BLACK, -3.15, 3.15, 0.13, d - 0.1, 0, 0.22);
      for (const x of [-3.2, 0, 3.2]) S.bev(M.WAL, x - 0.05, x + 0.05, 0.075, d, 0.22, h, 0.01, { grain: 'z' });
      for (const [x1, x0] of [[3.2, 0], [0, -3.2]]) for (const z of [1.45, 0.3]) { S.bev(M.WAL, x0 + 0.045, x1 - 0.045, 0.13, d - 0.02, z - 0.07, z, 0.01, { grain: 'x' }); K.shelf(S, x0 + 0.08, x1 - 0.08, 0.14, z, 1.05, { front: d - 0.1, run: 'consulting' }); }
      S.bev(M.WALP, -3.3, 3.3, 0.075, d + 0.06, h, h + 0.09, 0.012, { grain: 'x' }); S.block(-3.3, 3.3, 0, d + 0.06, 0, h + 0.09);
      P.paperLamp(S, 2.2, 0.6, h + 0.09, 1.1, 0.36);
      P.ves(S, 'c#3a3a36/0.5', 0.2, 0.6, h + 0.09, [[0, 0], [0.32, 0], [0.42, 0.15], [0.44, 0.22], [0.4, 0.22], [0.3, 0.06], [0, 0.05]], 18);
      K.posy(S, -1.9, 0.6, h + 0.09, ['c#f2ead8/0.8', 'c#e8a0a8/0.8', 'c#e7c64a/0.8', 'c#d9534f/0.8']); }      // a jar of ranunculus and tulips
    fernPot(26.4, 41.9, { tall: true, model: 'fern_clump_b', scale: 0.85 });
    // ---- over the low case, centred on it: Klee's Phantom Perspective, large
    f.framed(f.fr(32.4, 40.75, F, 0), 0, 5.05, 2.4, 1.65, 'uw_klee_phantom', { frame: M.WALD, border: 0.08, mat: 0.18, title: 'Phantom Perspective', kicker: 'Paul Klee, 1920. Ink on paper',
      text: 'A room drawn in a single nervous line, its perspective not quite holding: a little house of the mind.', foot: 'The Metropolitan Museum of Art, Berggruen Klee Collection. Public domain.' });
    // ---- the plate by the door, on the Gallery's side (STYLE.md: one small bronze plate where a door needs one)
    f.plate(f.fr(24.95, 49.0, F, 1), 0, 5.0, 'Winnicbott', { style: 'brass', sub: 'by appointment', w: 0.9, tall: 0.38 });
  }

  // =================================================================================================================
  //  THE GALLERY  (the landing X 13.5..24.95 by Y 40.75..53.55; the strip X 13.5..20.5 on to Y 72.5, where the stair
  //  arrives; the bridge X 20.5..42.75 by Y 59.8..64.2. Doors: the Suite's in the landing's south wall, X 19.5..22.5;
  //  the Consulting Room's in its east wall, Y 45..48.) Lightly: the strip and the bridge are left their full width.
  // =================================================================================================================
  function gallery() {
    // in the key of the pool and the chapel (STYLE.md, first section): plain honey oak, linen, a sheepskin, candles, undyed wool
    const OAK = 'oak_light#b08a60', OAKD = 'oak_light#8f6c4c';
    wallCase(f.fr(13.5, 47.15, F, 3), 6.15, -6.15, 1.0, 5, 'gallery', 7.6, () => false, { wood: OAK, back: OAKD, cove: false });      // x = 47.15 - Y: +x south, the reader's left
    // an oak bench on the south wall, west of the suite's door, with a sheepskin and a linen cushion; a candle lantern on it
    { const Bn = f.fr(16.85, 40.75, F, 0), a = -2.15, b = 2.15;         // x = X - 16.85
      for (const x of [a + 0.25, b - 0.25]) Bn.bev(OAKD, x - 0.12, x + 0.12, 0.2, 1.4, 0, 1.3, 0.02, { grain: 'z' });
      Bn.bev(OAK, a, b, 0.12, 1.55, 1.3, 1.5, 0.03, { grain: 'x' });
      Bn.block(a, b, 0.12, 1.55, 0, 1.5);
      P.sheepskin(Bn, a + 0.25, a + 2.2, 0.25, 1.45, 1.51, { drop: 0.25, dropA: Math.PI / 2 });
      K.cushion(Bn, 0.45, 0.35, 1.5, 1.2, 0.9, M.CREAM, { tilt: 0.2 });
      lantern(Bn, 1.6, 0.8, 1.5);
      for (const x of [-1.2, 0.5]) K.seat(Bn, x, 0.9, 1.5, 'sit on the bench'); }
    // a nook by the consulting room's door: one comfortable oak-and-linen chair, a small table with a candle lantern, a plant
    P.loungeChair(f.fr(24.95, 51.0, F, 1), { fabric: 'linen#cfc2a6', wood: OAKD, label: 'sit for a while' });
    K.throwBlanket(f.fr(24.95, 51.0, F, 1), -1.22, -0.99, 0.73, 2.0, 1.79, M.RUST, { over: 'arm', drop: { l: 0.64, r: 0.39 }, rho: 0.06, folds: 0.024 });
    { const t = f.fr(24.35, 49.15, F, 0); P.ves(t, OAK, 0, 0, 0, [[0, 0], [0.3, 0], [0.28, 0.05], [0.06, 0.1], [0.05, 1.7], [0.36, 1.72], [0.36, 1.8], [0, 1.8]], 16); t.block(-0.36, 0.36, -0.36, 0.36, 0, 1.8);
      lantern(t, 0.05, -0.05, 1.8); K.bookStack(t, 0, 0.12, 1.8, 2, { subject: 'poetry' }); }
    fernPot(24.2, 52.85, { model: 'fern_clump_a', scale: 0.95, pot: 'c#9a6a48/0.6' });
    // a candle lantern hanging over the landing (its light), and undyed wool runners along the strip and the bridge
    const bronze = 'c#58432d/0.55/0.78', amberGlass = 'e#dc9a56/0.48';
    K.ceilingLight(f.fr(19.4, 47.6, F, 0), 0, 0, H, { kind: 'lantern', lit: true, drop: 2.1, size: 1.55, metal: bronze, glass: amberGlass, power: 0.72 });
    f.rug(14.2, 19.8, 54.0, 67.8, F, 'runner'); f.rug(21.2, 42.0, 60.6, 63.4, F, 'runner');      // warm striped wool runners
    f.rug(15.0, 22.0, 44.5, 52.0, F, 'kilim');

    // ---- the strip's long stone wall, dressed from the top down (Anna: "something at the top that can go down"): a tall
    // kilim on an oak pole, falling seven feet; two lanterns on oak brackets high either side of it
    hanging(f.fr(13.5, 61.4, F, 3), 3.4, 7.85, 7.0, kilimTall(41), 41);
    for (const Y of [56.9, 65.9]) {
      K.sconce(f.fr(13.5, Y, F, 3), 0, 6.75, { kind: 'lantern', lit: true, size: 1.65, metal: bronze, glass: amberGlass, power: 0.48 });
    }
    // ---- trailing pothos in oak troughs hung over the outside of the strip's rail, their strands falling into the room
    // below (they stop more than eight feet above its floor)
    for (const [Y0, Y1] of [[54.6, 58.9], [64.8, 67.9]]) {
      const zt = 2.5;
      const x0 = 20.72, x1 = 21.38, wall = 0.055;
      G.bev(OAK, x0, x1, Y0, Y1, zt, zt + 0.085, 0.015, { grain: 'y' });
      for (const X of [x0, x1 - wall]) G.bev(OAK, X, X + wall, Y0, Y1, zt + 0.07, zt + 0.42, 0.01, { grain: 'y' });
      for (const Y of [Y0, Y1 - wall]) G.bev(OAK, x0 + wall - 0.008, x1 - wall + 0.008, Y, Y + wall, zt + 0.075, zt + 0.414, 0.01, { grain: 'x' });
      G.box('soilbed', x0 + wall, x1 - wall, Y0 + wall, Y1 - wall, zt + 0.1, zt + 0.35);
      for (const Y of [Y0 + 0.4, Y1 - 0.4]) P.tube(G, M.IRON, [[x0 + 0.05, Y, zt + 0.25], [x0 + 0.05, Y, zt + 0.58], [20.6, Y, zt + 0.58], [20.52, Y, zt + 0.44]], 0.018, 5);
      pothos(21.1, Y0 + 0.16, Y1 - 0.16, zt + 0.35, (Y0 * 7) | 0);
    }
    // ---- Monet's wheatstacks over the bench on the landing
    f.framed(f.fr(16.85, 40.75, F, 0), 0, 5.3, 3.2, 1.89, 'monet_wheatstacks', { frame: 'oak_light#8f6c4c', border: 0.1, mat: 0, title: 'Stacks of Wheat (End of Summer)', kicker: 'Claude Monet, 1890–91',
      text: 'Two stacks in a field at Giverny in the late light, one of the series he painted over and over as the hours and the seasons changed.', foot: 'The Art Institute of Chicago. Public domain.' });
    // ---- Hilma af Klint's Ten Largest, Nos. 1 to 9, small, on the stone wall across the south void from the bridge (the
    // consulting room's north wall, its face at Y 53.55, X 25..42.75): opposite the globes that hang in the north void.
    // In order from the left as you face them from the bridge (looking south, so No. 1 is at the east end), stepping up
    // and down about eye height. (No. 10 is not hung. Read from the bridge, so the captions reach further than usual.)
    { const KW = f.fr(34.0, 53.55, F, 0), TEN = [                       // x = X - 34.0; [number, age, ratio of the image (w : h), a line about it]
        [1, 'Childhood', 0.753, 'The first of ten paintings on the ages of life, made in Stockholm in the last months of 1907: childhood, in deep blue, under wreaths of white and rose.'],
        [2, 'Childhood', 0.743, 'Childhood again: two great discs of orange and dark blue under a crowd of flowers, in tempera on paper pasted to canvas, more than ten feet tall.'],
        [3, 'Youth', 0.750, 'Youth, and the ground turns to orange: spirals and shells unwinding in every direction.'],
        [4, 'Youth', 0.746, 'Youth still: petals of blue, rose and yellow thrown out across the orange.'],
        [5, 'Adulthood', 0.748, 'Adulthood begins, in lilac: a great pink flower over letters in a looping script of her own.'],
        [6, 'Adulthood', 0.743, 'The second of the four lilac canvases of adulthood, written over with words and loops in her own hand.'],
        [7, 'Adulthood', 0.754, 'One of ten great paintings on paper about the ages of life, painted in Stockholm in 1907 and kept unseen for decades by her own wish.'],
        [8, 'Adulthood', 0.753, 'The last of adulthood: the forms grow paler and rounder, and the line begins to curl in on itself.'],
        [9, 'Old Age', 0.751, 'Old age: the colour thins to rose and white, and the forms settle into pairs. No. 10, which ends the series, is not hung here.']];
      for (const [n, age, k, text] of TEN) f.framed(KW, (5 - n) * 1.8, 5.5 + (n % 2 ? 0.28 : -0.28), 1.6 * k, 1.6, 'afklint_ten_largest_' + n, { frame: 'oak_light#8f6c4c', border: 0.07, mat: 0, reach: 12, title: 'The Ten Largest, No. ' + n + ', ' + age, kicker: 'Hilma af Klint, 1907', text, foot: 'Public domain. Image via Wikimedia Commons.' }); }
  }
  // a cloth hung from an oak pole on a wall frame: centred at x 0, its top at z top, w wide, h long, a few soft folds;
  // painted by draw(g, W, H) on its own canvas (f.later)
  function hanging(fr, w, top, h, draw, seed) {
    P.tube(fr, 'oak_light#8f6c4c', [[-w / 2 - 0.3, 0.2, top + 0.06], [w / 2 + 0.3, 0.2, top + 0.06]], 0.045, 10, true);
    for (const x of [-w / 2 - 0.15, w / 2 + 0.15]) fr.bev('oak_light#8f6c4c', x - 0.05, x + 0.05, 0.02, 0.26, top - 0.05, top + 0.12, 0.01);
    later.push(ctx => {
      const T = ctx.THREE, cv = document.createElement('canvas'); cv.width = 384; cv.height = Math.round(384 * h / w); draw(cv.getContext('2d'), cv.width, cv.height);
      const nu = 20, nv = 24, pos = [], uv = [], idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = i / nu, v = j / nv, x = -w / 2 + u * w, z = top - v * h, y = 0.16 + 0.035 * Math.sin(u * TAU * 3 + seed) * (0.4 + 0.6 * v) + 0.012 * Math.sin(v * 9 + u * 5);
        const [X, Y] = fr.map(x, y), p = f.world(X, Y, fr.h + z); pos.push(p.x, p.y, p.z); uv.push(1 - u, 1 - v);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
      const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, roughness: 0.95, side: T.DoubleSide }));
      const [CX, CY] = fr.map(0, 0.2), c0 = f.world(CX, CY, fr.h + top - h / 2); ctx.scene.add(m); ctx.track(m, ctx.zoneAt(c0.x, c0.y, c0.z));
    });
  }
  // a tall kilim: the Qashqai drawing, turned to stand up
  function kilimTall(seed) { return (g, W, H) => { const c = document.createElement('canvas'); c.width = H; c.height = W; qashqai({ seed, fringe: true, red: '#8a3424' })(c.getContext('2d'), H, W); g.save(); g.translate(W, 0); g.rotate(Math.PI / 2); g.drawImage(c, 0, 0); g.restore(); }; }
  // an indigo cloth with a band of white waves (seigaiha) along its foot
  function noren() {
    return (g, W, H) => {
      g.fillStyle = '#26324a'; g.fillRect(0, 0, W, H);
      const r = W / 10, y0 = H * 0.62;
      for (let row = 0; row < 6; row++) for (let i = -1; i <= 10; i++) { const cx = (i + (row % 2) * 0.5) * r * 2 / 2 * 2, cy = y0 + row * r * 0.55;
        for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(cx, cy, r * (1 - k * 0.3), Math.PI, TAU); g.strokeStyle = 'rgba(236,230,214,0.85)'; g.lineWidth = W * 0.008; g.stroke(); } }
      g.fillStyle = 'rgba(236,230,214,0.9)'; g.beginPath(); g.arc(W / 2, H * 0.3, W * 0.12, 0, TAU); g.lineWidth = W * 0.02; g.strokeStyle = 'rgba(236,230,214,0.9)'; g.stroke();
      for (let k = 0; k < 2200; k++) { g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`; g.fillRect(Math.random() * W, Math.random() * H, 2, 2); }
    };
  }
  // pothos: strands from a trough (along Y at plan X, from Y0 to Y1, soil at z) falling 3 to 6 ft, heart leaves along them
  function pothos(X, Y0, Y1, z, seed) {
    let s = seed * 9301 + 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const stems = [], leaves = [[], [], []], LC = ['c#4f7a3a/0.6', 'c#6a9442/0.6', 'c#3f6530/0.6'];
    const surface = (u, v) => {
      const t = u * 2 - 1;
      const w = Math.sin(Math.PI * (0.1 + 0.9 * v)) ** 0.72;
      return [0.33 * v, 0.125 * w * t, 0.035 * Math.sin(v * Math.PI) - 0.13 * v * v + 0.028 * Math.abs(t) * w];
    };
    const leafShape = K.geom.merge([K.geom.sheet(surface, 2, 4), K.geom.sheet(surface, 2, 4, { flip: true })]);
    const leaf = (x, y, zz, a, scale) => leafShape.clone().scale(scale, scale, scale).rotateZ(a).translate(x, y, zz);
    for (let Y = Y0; Y < Y1; Y += 0.32 + r() * 0.24) {
      const len = 2.7 + r() * 3.4, drift = (r() - 0.5) * 0.5, p = r() * TAU;
      const stem = t => {
        const reach = Math.min(1, t / 0.2);
        const fall = Math.max(0, t - 0.16) * len;
        return [X + 0.36 * reach + 0.1 * t * Math.sin(p + 6 * t), Y + drift * t + 0.12 * t * Math.sin(p + 7 * t), z + 0.25 * Math.sin(Math.PI * reach / 1.6) - fall];
      };
      stems.push(K.geom.sweep(Array.from({ length: 19 }, (_, i) => stem(i / 18)), 0.013, { seg: 5 }));
      for (let k = 1; k <= 16; k++) {
        const p0 = stem(k / 17);
        leaves[k % 3].push(leaf(...p0, (k % 2 ? 1 : -1) * (0.55 + r() * 1.12), 1.05 - k * 0.025 + r() * 0.44));
      }
      for (let k = 0; k < 3; k++) leaves[k].push(leaf(X - r() * 0.12, Y, z + 0.06 + r() * 0.13, r() * TAU, 0.9 + r() * 0.5));
    }
    const flat = g => { const n = g.index ? g.toNonIndexed() : g; n.clearGroups(); return n; };
    P.put(G, 'c#4a5a2e/0.8', P.mergeG(stems.map(flat)));
    leaves.forEach((list, k) => P.put(G, LC[k], P.mergeG(list.map(flat))));

  }
  // a candle lantern of oak and glass standing at (x, y) on z of a frame, its candle lightable with E
  function lantern(fr, x, y, z) {
    const s = 0.28, h = 0.9;
    fr.bev('oak_light#8f6c4c', x - s, x + s, y - s, y + s, z, z + 0.06, 0.01); fr.bev('oak_light#8f6c4c', x - s, x + s, y - s, y + s, z + h - 0.06, z + h, 0.01);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) fr.box('oak_light#8f6c4c', x + sx * (s - 0.03) - 0.025, x + sx * (s - 0.03) + 0.025, y + sy * (s - 0.03) - 0.025, y + sy * (s - 0.03) + 0.025, z + 0.06, z + h - 0.06);
    fr.box(M.GLASS, x - s + 0.04, x + s - 0.04, y - s + 0.04, y + s - 0.04, z + 0.07, z + h - 0.07);
    P.tube(fr, M.IRON, [[x - 0.12, y, z + h], [x, y, z + h + 0.15], [x + 0.12, y, z + h]], 0.012, 4);
    K.pillarCandle(fr, x, y, z + 0.06, 0.4, 0.09);
  }

  // =================================================================================================================
  //  THE SUITE  (X 13.5..35.8 by Y 17.5..40.25, less the bath X 13.5..24.3, Y 17.5..27.3; the door north, X 19.5..22.5;
  //  the bath's door in its east wall, Y 20.5..23.3; windows: the arched one south X 27.5..30.9, the bay east
  //  Y 25.5..30.5, a facet at each courtyard corner)
  // =================================================================================================================
  function suite() {
    // ---- the podium and the bed on it, against the north wall in the east half: its head to the wall, so that from the
    // pillow the eye goes south down the room to the arched window and the clouds (and the bay's light falls across it);
    // the west half is left open, a clear way from the door to the bath, the window daybed and the stove
    const X0 = 26.6, X1 = 35.0, Y0 = 31.6, Y1 = 40.1, zp = 0.5, zm = zp + 1.1, BX = 30.75;
    G.box(M.BLACK, X0 + 0.2, X1 - 0.2, Y0 + 0.2, Y1 - 0.2, 0, 0.1);
    P.strip(G, X0 + 0.28, X1 - 0.28, Y0 + 0.28, Y1 - 0.28, 0.03, 0.06);
    G.bev(M.WALD, X0, X1, Y0, Y1, 0.1, zp, 0.02, { grain: 'y' });
    G.block(X0, X1, Y0, Y1, 0, zp);                                      // (low enough to step up onto)
    G.bev(M.WAL, BX - 2.75, BX + 2.75, 32.65, 39.45, zp, zp + 0.3, 0.02, { grain: 'y' });
    G.cushion(M.CREAM, BX - 2.7, BX + 2.7, 32.7, 39.4, zp + 0.3, zm, 0.12, { n: [4, 4, 1], crown: 0.025, welt: 0.012 });
    // the duvet, turned down, and one wool blanket across the foot
    G.cushion('linen#e9e1cf', BX - 2.8, BX + 2.8, 32.6, 37.9, zm - 0.06, zm + 0.16, 0.08, { n: [6, 6, 1], crown: 0.04, sag: [[0.2, -0.3, 0.03, 0.5], [-0.3, 0.4, 0.02, 0.6]] });
    G.cushion('linen#ddd3bd', BX - 2.82, BX + 2.82, 37.6, 38.4, zm - 0.03, zm + 0.22, 0.08, { crown: 0.03 });
    K.cloth(G, 'wool#a8762e', { cx: BX, cy: 33.77, z: zm + 0.19, a: 2.84, b: 1.2, l: 0.6, r: 0.63, bk: 0.48, fr: 0, folds: 0.026, rho: 0.04, fringe: 0.085, fringeSides: ['l', 'r', 'b'],
      pre: (x, y) => [x + 0.039 * Math.sin(2.6 * y), y + 0.043 * Math.sin(1.8 * x) + 0.019 * Math.sin(4.7 * x)] });      // one wool blanket across the foot, falling over its end and sides
    // the headboard: a low walnut panel against the wall
    G.bev(M.WAL, BX - 3.1, BX + 3.1, 39.55, 39.9, zp, zp + 2.6, 0.02, { grain: 'x' });
    G.bev(M.WAL, BX - 3.1, BX + 3.1, 39.5, 40.05, zp + 2.6, zp + 2.7, 0.015, { grain: 'x' });
    // four pillows: two square shams and two to sleep on
    { const Pf = f.fr(BX, 39.5, F + zm, 2);                              // x runs west, y south (toward the foot)
      for (const x of [-1.35, 1.35]) K.cushion(Pf, x, 0.66, 0.04, 2.35, 1.35, M.CREAM, { tilt: 0.57, thick: 0.37 });
      for (const x of [-1.3, 1.3]) K.cushion(Pf, x, 1.36, 0.035, 2.1, 1.07, 'linen#efe8d8', { tilt: 0.8, thick: 0.31 }); }
    K.seat(f.fr(BX - 2.9, 35.5, F, 1), 0, 0, zm - 0.05, 'sit on the bed');
    lie(BX, 38.6, zm + 0.78, BX - 1.0, 20.0, 0.1, 'lie down on the bed');
    G.block(BX - 2.75, BX + 2.75, 32.6, 39.5, zp, zm + 0.3);
    // either side, on the podium: a Noguchi lantern; books on one side, water on the other
    P.paperLamp(G, 27.25, 39.25, zp, 1.0, 0.33); P.paperLamp(G, 34.3, 39.25, zp, 1.0, 0.33);
    K.bookStack(G, 27.3, 37.9, zp, 2, { subject: 'poetry' }); P.carafe(G, 34.3, 38.0, zp);
    // ---- the middle of the room: a big soft rug, a blanket chest at the bed's foot, two low chairs and a round table
    // between them, turned to the window daybed and the clouds; a paper floor lantern. (Ways kept: the lane from the door to
    // the bath west of X 25, and the band in front of the daybed, Y 20 to 25, clear.)
    f.rug(25.6, 35.0, 21.0, 31.2, F, 'tabriz');
    { const C = f.fr(BX, 30.0, F, 0);                                   // x = X - BX; y north toward the podium
      C.box(M.BLACK, -2.15, 2.15, 0.1, 1.4, 0, 0.12);
      C.bev(M.WAL, -2.3, 2.3, 0.0, 1.5, 0.12, 1.45, 0.02, { grain: 'x' });
      C.bev(M.WAL, -2.35, 2.35, -0.03, 1.53, 1.45, 1.55, 0.015, { grain: 'x' });
      for (const x of [-1.3, 1.3]) P.ves(C, M.BRONZE, x, -0.02, 0.85, [[0, 0], [0.08, 0], [0.08, 0.02], [0, 0.03]], 10);
      C.block(-2.35, 2.35, 0, 1.53, 0, 1.55);
      K.cloth(C, 'wool#3f4d38', { cx: 0.6, cy: 0.75, z: 1.57, a: 1.0, b: 0.78, l: 0, r: 0, fr: 0, bk: 0.85, folds: 0.05, fringe: true });      // a green wool throw over the chest's front
      K.foldedStack(C, -1.3, 0.75, 1.55, 2, ['wool#cbbd9c', 'wool#a8762e'], { w: 1.2, d: 0.9, t: 0.14 });
      K.seat(f.fr(BX - 0.4, 29.7, F, 2), 0, 0, 1.55, 'sit on the chest'); }
    for (const [X, colour, turn] of [[27.4, M.GREEN, -0.11], [33.7, M.OCHRE, 0.14]]) {
      const chair = f.fr(X, 28.0, F, 2);
      P.loungeChair(chair, { fabric: 'linen#d9cdb4', w: 2.3, d: 2.4, low: true, label: 'sit and look at the clouds' });
      K.cushion(chair, turn * 2.5, 0.83, 1.37, 1.11, 0.85, colour, { tilt: 0.49, turn, thick: 0.23 });
    }
    { const t = P.ovalTable(G, 30.55, 24.55, 1.0, 1.0, 1.35);
      K.posy(G, 30.35, 24.35, t, ['c#f2ead8/0.8', 'c#e8a0a8/0.8', 'c#d9534f/0.8', 'c#e7c64a/0.8']);
      K.bookStack(G, 30.95, 24.8, t, 3, { subject: 'travel' }); K.cup(G, 30.0, 24.95, t, 'c#efe9dd'); }
    P.paperLamp(G, 25.95, 30.4, 0, 2.6, 0.42, { shape: 'cyl', halo: 1.2 }); G.block(25.5, 26.4, 29.95, 30.85, 0, 1.6);

    // ---- the window daybed, under the arched window over the clouds (Anna: "the daybed by the window is awesome")
    { const Ws = f.fr(29.2, 17.5, F, 0), a = -3.3, b = 3.3, d = 2.35;     // x = X - 29.2
      Ws.box(M.BLACK, a + 0.1, b - 0.1, 0.06, d - 0.2, 0, 0.22);
      Ws.bev(M.WAL, a, b, 0.05, d, 0.22, 1.15, 0.02, { grain: 'x' });
      Ws.box(M.GLOW, a + 0.15, b - 0.15, d - 0.22, d - 0.17, 0.15, 0.18);
      Ws.cushion(M.SAND, a + 0.05, b - 0.05, 0.1, d - 0.05, 1.15, 1.45, 0.1, { n: [6, 2, 1], crown: 0.03, welt: 0.012 });
      Ws.block(a, b, 0, d, 0, 1.45);
      for (const [x, c] of [[-2.4, M.OCHRE], [-0.9, M.CREAM], [0.7, M.GREEN], [2.3, M.OAT]]) K.cushion(Ws, x, 0.32, 1.45, 1.4, 0.72, c, { tilt: 0.2 });
      P.sheepskin(Ws, -2.0, 0.6, 0.6, 2.2, 1.46, { drop: 0.3, dropA: Math.PI / 2 });
      K.foldedStack(Ws, 2.3, 1.5, 1.45, 2, ['wool#a8762e', 'wool#cbbd9c'], { w: 1.2, d: 0.9, t: 0.14 });
      K.openBook(Ws, 0.9, 1.5, 1.45, { cover: 'c#2f3a33/0.7', turn: 0.4 });
      for (const x of [-2.0, 0.0, 2.0]) K.seat(Ws, x, 1.3, 1.45, 'sit in the window'); }
    P.tieredLamp(G, 33.55, 18.6, 6); P.glowAt(G, 33.55, 18.6, 2.2, 1.0);

    // ---- the stove in the north-west corner, a chair drawn up to it; the wardrobe on the bath's wall
    const sv = P.stove(G, 15.3, 37.9, H);
    const fire = f.lamp(15.3, 36.6, F + 1.5, { power: 0.9, kind: 'candle' });      // the fire's light, in front of the glass: it flickers on the floor
    later.push(ctx => {
      fire.kind = 'fire';
      const o = f.world(sv.x, sv.y, F + sv.z), x1 = f.world(sv.x + 1, sv.y, F + sv.z), dx = [x1.x - o.x, x1.z - o.z];
      const g = new THREE.Group(); g.position.set(o.x, o.y, o.z); g.rotation.y = Math.atan2(-dx[1], dx[0]);
      const uT = { value: 0 };
      g.add(makeFlames(THREE, mergeGeometries, uT, [[0, 0, 0.02, 1.05, 0.95, 0], [0, 0.14, 0.12, 0.85, 0.8, 3.7], [0, -0.16, -0.1, 0.8, 0.75, 8.1]], 0.05));
      g.add(burningLogs(ctx.materials.bark, 1.08, .65));
      g.traverse(n => { n.userData.cat = 'fire'; });
      ctx.scene.add(g); ctx.track(g, ctx.zoneAt(o.x, o.y + 0.4, o.z, 0.4));
      ctx.animated.push(t => { uT.value = t; });
    });
    // a basket of logs beside it
    { const b = f.fr(17.75, 38.7, F, 0);
      P.put(b, 'wicker', P.latheG([[0, 0], [0.4, 0], [0.46, 0.5], [0.48, 0.55], [0.45, 0.55], [0.43, 0.51], [0.38, 0.06], [0, 0.06]], 16));
      storedLogs(K, b, 0, 0, .08, .94, .14, 3, 3);
      b.block(-0.5, 0.5, -0.5, 0.5, 0, 1.5); }
    P.loungeChair(f.fr(15.9, 32.3, F, 0), { fabric: M.OCHRE, label: 'sit by the stove' });
    K.throwBlanket(f.fr(15.9, 32.3, F, 0), -1.22, -0.99, 0.76, 2.05, 1.79, M.GREEN, { over: 'arm', drop: { l: 0.7, r: 0.38 }, rho: 0.06, folds: 0.024 });
    P.sheepskin(G, 14.6, 17.2, 35.05, 36.15, 0.03);
    f.rug(13.9, 23.8, 30.4, 36.2, F, 'kilim');
    K.wardrobe(f.fr(19.0, 27.55, F, 0), 5.0, 7.2, { wood: 'c#5a3e2c', d: 2.0, pull: 'wood' });

    // ---- the bay: a brass telescope on a walnut tripod at its south end; a plant by the podium
    { const t = f.fr(34.5, 24.4, F, 0);
      for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.3; P.leg(t, M.WAL, [0, 0, 3.6], [Math.cos(a) * 0.85, Math.sin(a) * 0.85, 0], 0.045, 0.03); }
      P.ves(t, M.BRASS, 0, 0, 3.55, [[0, 0], [0.1, 0], [0.1, 0.12], [0, 0.14]], 10);
      const dir = [1, 0.45, 0.25], L = Math.hypot(...dir), u = dir.map(v => v / L);
      P.tube(t, M.BRASS, [[-u[0] * 1.2, -u[1] * 1.2, 3.75 - u[2] * 1.2], [u[0] * 0.6, u[1] * 0.6, 3.75 + u[2] * 0.6]], 0.1, 12, true);
      P.tube(t, M.BRASS, [[u[0] * 0.6, u[1] * 0.6, 3.75 + u[2] * 0.6], [u[0] * 0.85, u[1] * 0.85, 3.75 + u[2] * 0.85]], 0.14, 12, true);
      P.tube(t, M.BLACK, [[-u[0] * 1.2, -u[1] * 1.2, 3.75 - u[2] * 1.2], [-u[0] * 1.45, -u[1] * 1.45, 3.75 - u[2] * 1.45]], 0.04, 8, true);
      t.block(-0.85, 0.85, -0.85, 0.85, 0, 3.6);
      f.label(t, -u[0] * 1.3, -u[1] * 1.3, 3.75 - u[2] * 1.3, { label: 'look through the telescope', reach: 4, note: 'The far rim of the courtyard, a gull standing on it, and a great deal of sky.' }); }
    fernPot(25.6, 39.2, { tall: true, model: 'fern_clump_c', scale: 0.85 });
    // Van Gogh's bedroom, centred on the headboard
    f.framed(f.fr(BX, 40.25, F, 2), 0, 5.35, 3.0, 2.35, 'van_gogh_bedroom', { frame: 'walnut#5a3e2c', border: 0.12, mat: 0, title: 'The Bedroom', kicker: 'Vincent van Gogh, 1889',
      text: 'His room in the Yellow House at Arles: the blue walls, the red blanket, the two chairs, the shutters closed. He wrote that looking at it should rest the brain.', foot: 'The Art Institute of Chicago (1926.417). Public domain.' });
  }

  // =================================================================================================================
  //  THE BATH  (X 13.5..24.05 by Y 17.5..27.05; the door in its east wall, Y 20.5..23.3, swinging into the suite; the
  //  window over the clouds in the south wall, X 16.5..21.5; walls and ceiling hinoki, floor slate)
  // =================================================================================================================
  function bath() {
    { const B = f.fr(19.0, 17.65, F, 0);
      P.ofuro(B, 4.4, 3.0, 2.0);
      seatAt(18.2, 19.15, 0.45, -Math.PI / 2, 'get into the bath');
      f.label(B, 0, 1.5, 2.2, { label: 'look at the bath', reach: 6, note: 'Hinoki, filled to the brim. The water is kept hot, and the clouds are kept outside.' }); }
    for (let i = 0; i < 8; i++) G.bev(M.HIN, 17.0, 21.0, 20.9 + i * 0.2, 21.04 + i * 0.2, 0.0, 0.08, 0.01, { grain: 'x' });      // a duckboard to step out onto
    for (const y of [21.0, 22.35]) G.bev(M.HIN, 17.1, 20.9, y, y + 0.12, 0, 0.04, 0.005);
    // a stool and a bucket by the tub
    P.ves(G, M.HIN, 22.6, 18.6, 0, [[0, 0], [0.42, 0], [0.42, 0.9], [0.45, 0.9], [0.45, 1.0], [0, 1.0]], 14);
    P.ves(G, M.HIN, 23.45, 19.4, 0, [[0, 0], [0.28, 0], [0.31, 0.45], [0.29, 0.45], [0.26, 0.04], [0, 0.04]], 14); P.ves(G, M.BRONZE, 23.45, 19.4, 0.1, [[0.29, 0], [0.31, 0], [0.31, 0.04], [0.29, 0.04]], 14);
    G.block(22.1, 23.8, 18.0, 19.8, 0, 1.5);
    // the washstand on the west wall: floating walnut, a stone top and basin, a bronze tap, the arched mirror
    { const Wv = f.fr(13.5, 23.7, F, 3);                                 // x = 23.7 - Y; y east
      Wv.bev(M.WAL, -1.4, 1.4, 0.02, 1.6, 1.75, 2.55, 0.015, { grain: 'x' });
      Wv.bev(M.STONE, -1.45, 1.45, 0.02, 1.7, 2.55, 2.68, 0.012);
      Wv.bev(M.WAL, -1.26, 1.26, 0.1, 1.4, 0.42, 0.5, 0.01, { grain: 'x' }); for (const x of [-1.3, 1.3]) Wv.bev(M.WAL, x - 0.04, x + 0.04, 0.1, 1.38, 0.38, 1.76, 0.008);
      K.foldedStack(Wv, -0.55, 0.8, 0.5, 3, ['wool#ebe5d8', 'wool#cbbd9c', 'wool#ebe5d8'], { w: 1.0, d: 0.8, t: 0.14 }); K.foldedStack(Wv, 0.6, 0.8, 0.5, 2, ['wool#ebe5d8', 'wool#ebe5d8'], { w: 1.0, d: 0.8, t: 0.14 });
      P.ves(Wv, M.STONE, 0, 0.95, 2.68, [[0, 0], [0.32, 0], [0.55, 0.2], [0.58, 0.38], [0.55, 0.38], [0.33, 0.1], [0, 0.08]], 20);
      P.tube(Wv, M.BRONZE, [[0, 0.02, 3.55], [0, 0.55, 3.55], [0, 0.72, 3.4]], 0.03, 6, true); P.tube(Wv, M.BRONZE, [[0.35, 0.02, 3.3], [0.35, 0.12, 3.3]], 0.04, 8, true);
      K.soapDish(Wv, 0.95, 0.6, 2.68); K.pumpBottle(Wv, -0.95, 0.55, 2.68); K.vase(Wv, 1.2, 1.2, 2.68, 0.45, 0.07, 'c#2b2622/0.4', 'bud');
      K.mirror(Wv, 0, 5.0, 1.9, 2.7, { kind: 'arch', frame: M.WAL, border: 0.08 });
      Wv.block(-1.45, 1.45, 0, 1.7, 0, 2.7); }
    // towels warming on two bronze rails, on the north wall
    { const Tr = f.fr(18.05, 26.99, F, 2);
      K.towelRail(Tr, 0, 4.25, 2.3, { towels: ['wool#ebe5d8', 'wool#a8762e'], drop: 1.43, mat: M.BRONZE });
      K.towelRail(Tr, 0, 2.58, 2.3, { towels: ['wool#cbbd9c'], drop: 1.17, mat: M.BRONZE });
      Tr.block(-1.2, 1.2, 0, 0.5, 1.2, 4.2);
      f.label(Tr, 0, 0.4, 3.5, { label: 'feel the towels', reach: 5, note: 'Warm. The rail is heated.' }); }
    // the WC, the house's (kit/bath.js), on the north wall facing south (not the door), paper on a bronze holder, a shelf
    { const W = f.fr(21.08, 26.99, F, 2);                                 // x = 21.2 - X; y south
      K.toilet(W, 0, { seat: 'porcelain', metal: M.BRONZE });
      P.tube(W, M.BRONZE, [[-1.35, 0.02, 2.15], [-1.35, 0.3, 2.15]], 0.02, 6); P.hcyl(W, M.BRONZE, 'x', -1.35, 0.3, 2.15, 0.5, 0.012);
      P.hcyl(W, 'c#f4f1ea/0.9', 'x', -1.35, 0.3, 2.15, 0.38, 0.2); P.hcyl(W, 'c#d9d2c2/0.9', 'x', -1.35, 0.3, 2.15, 0.39, 0.05);
      W.bev(M.WAL, -0.95, 0.95, 0.02, 0.52, 4.1, 4.18, 0.012, { grain: 'x' });
      for (const x of [-0.8, 0.8]) W.bev(M.WAL, x - 0.03, x + 0.03, 0.02, 0.4, 3.85, 4.1, 0.008);
      K.pottedPlant(W, -0.55, 0.28, 4.18, 'trailing', { size: 0.45, pot: 'c#d9cfbd/0.5', block: false });
      P.ves(W, 'c#efe9dd/0.3', 0.05, 0.28, 4.18, [[0, 0], [0.13, 0], [0.15, 0.25], [0.11, 0.3], [0, 0.3]], 12);
      K.pillarCandle(W, 0.55, 0.28, 4.18, 0.3, 0.09); }
    // a tall paper lantern in the north-east corner (the bath's light after dark), a plant by the washstand
    P.paperLamp(G, 23.15, 26.05, 0, 2.6, 0.42, { shape: 'cyl', halo: 1.2 }); G.block(22.7, 23.6, 25.6, 26.5, 0, 1.6); K.lampAt(G, 23.15, 26.05, 1.9, 0.55);
    fernPot(15.4, 26.2, { model: 'fern_clump_a', scale: 0.95, pot: 'c#b0643c/0.5' });
    // a small bright picture on the east wall, over the lantern
    f.framed(f.fr(24.05, 25.25, F, 1), 0, 5.1, 1.4, 1.07, 'uw_van_gogh_irises', { frame: 'oak_light#b08a60', border: 0.07, mat: 0.12, title: 'Irises', kicker: 'Vincent van Gogh, 1889',
      text: 'Painted in his first week at the asylum in Saint-Rémy, from the garden: blue irises, and one white one.', foot: 'J. Paul Getty Museum, Los Angeles. Public domain (via Wikimedia Commons).' });
  }

  // a rug thrown over the couch: flat across the mattress (frame x from x0 to x1, y from y0 to the front edge yEdge, at
  // height z), then hanging down its front by drop; drawn with qashqai() on its own canvas. fr: the couch's frame.
  function drapeRug(ctx, fr, o) {
    const T = ctx.THREE, len = o.x1 - o.x0, wTop = o.yEdge - o.y0, wid = wTop + o.drop, nu = 40, nv = 16;
    const cv = document.createElement('canvas'); cv.width = 768; cv.height = Math.round(768 * wid / len); qashqai({ seed: o.seed, fringe: true, red: '#82301f' })(cv.getContext('2d'), cv.width, cv.height);
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, s = v * wid, x = o.x0 + u * len, ph = Math.sin(u * 9.0 + o.seed) * 0.5;
      let y, h;
      if (s <= wTop) { y = o.y0 + s; h = o.z + 0.02 * Math.sin(u * 13 + v * 5) + 0.015 * ph; }
      else { const t = s - wTop; y = o.yEdge + Math.min(t, 0.12) * 0.6 + 0.04 + 0.03 * Math.sin(u * 17 + o.seed) * Math.min(1, t * 3); h = o.z - t; }
      const [X, Y] = fr.map(x, y), w = f.world(X, Y, fr.h + h); pos.push(w.x, w.y, w.z); uv.push(u, 1 - v);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
    const m = new T.Mesh(g, new T.MeshStandardMaterial({ map: tex, roughness: 0.95, side: T.DoubleSide }));
    const [CX, CY] = fr.map((o.x0 + o.x1) / 2, (o.y0 + o.yEdge) / 2), c0 = f.world(CX, CY, fr.h + o.z); ctx.scene.add(m); ctx.track(m, ctx.zoneAt(c0.x, c0.y, c0.z));
  }

}
