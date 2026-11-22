// A worked example, and for now the stand-in on the Stone Library's site: a plain brick schoolhouse, 30 ft
// along the front by 24 deep, two storeys, two rooms on each, a stair, a slate gable roof. It uses every part
// of the interface a real building needs (README.md in this folder) and nothing else. It will be replaced.
//
// Own coordinates, in feet: X to the right along the front, Y back from the front, h up from the ground line.

export default function (b) {
  const O = b.site.door[0] - 15;              // the building's left end, so that its door is where the site's path arrives
  const W = 30, D = 24, T = 1.2, TP = 0.5;    // outside walls 14 in., partitions 6 in.
  const F1 = 1.2, C1 = F1 + 9, F2 = C1 + 1, C2 = F2 + 9, EAVE = C2 + 0.6;
  const PX = O + 18;                          // the partition between the two rooms of each floor
  const ST = { X0: O + 14.2, X1: PX - TP / 2, Y0: 5, Y1: 19.4 };      // the stair, against the partition, rising toward the back
  const BRICK = 'brick_red', STONE = 'brownstone';

  // ---- floors -----------------------------------------------------------------------------------------
  // (kept just inside the outer faces of the walls: run out to the face, their edges would flicker against the brick)
  const IN = 0.65;
  b.floor(O + IN, O + W - IN, IN, D - IN, F1, { thick: 0.25 });
  b.box(BRICK, O + IN, O + W - IN, IN, D - IN, 0, F1 - 0.25);                          // solid under the ground floor
  b.floor(O + IN, O + W - IN, IN, D - IN, F2, { holes: [[ST.X0, ST.X1, ST.Y0, ST.Y1]] });   // 1 ft deep: boards above, the ceiling of the rooms below
  b.ceiling(O + IN, O + W - IN, IN, D - IN, C2);

  // ---- outside walls: brick without, plaster within, brownstone sills and heads --------------------------
  const WIN = { kind: 'win', sill: 2.6, head: 7.6, w: 3.6, n: 2 }, ARCH = { ...WIN, arch: 0.7 };
  const out = { t: T, trim: STONE };
  const s1 = { ...out, h0: 0, h1: F2, fl: F1 }, s2 = { ...out, h0: F2, h1: EAVE };
  // front and back run the full width; the sides butt in between them
  b.wall({ ...s1, ax: 'X', c: T / 2, a: O, b: O + W, neg: BRICK, pos: 'plaster', opens: [
    { ...WIN, at: O + 4.2 },
    { kind: 'door', at: O + 13.3, w: 3.4, head: 8.6, arch: true, hinge: 'a', swing: 'pos' },      // a round-headed doorway, glass in the head
    { ...WIN, at: O + 21.8 },
  ] });
  b.wall({ ...s2, ax: 'X', c: T / 2, a: O, b: O + W, neg: BRICK, pos: 'plaster', opens: [
    { ...ARCH, at: O + 4.2 }, { ...WIN, at: O + 13.2, arch: true, head: 8.2, n: 1, bars: [2, 3] }, { ...ARCH, at: O + 21.8 },
  ] });
  b.wall({ ...s1, ax: 'X', c: D - T / 2, a: O, b: O + W, neg: 'plaster', pos: BRICK, opens: [{ ...WIN, at: O + 5 }, { ...WIN, at: O + 21.8 }] });
  b.wall({ ...s2, ax: 'X', c: D - T / 2, a: O, b: O + W, neg: 'plaster', pos: BRICK, opens: [{ ...ARCH, at: O + 5 }, { ...ARCH, at: O + 21.8 }] });
  for (const [s, wn] of [[s1, WIN], [s2, ARCH]]) {
    b.wall({ ...s, ax: 'Y', c: O + T / 2, a: T, b: D - T, neg: BRICK, pos: 'plaster', opens: [{ ...wn, at: 10.2 }] });
    b.wall({ ...s, ax: 'Y', c: O + W - T / 2, a: T, b: D - T, neg: 'plaster', pos: BRICK, opens: [{ ...wn, at: 10.2 }] });
  }
  // a brownstone water table and a string course at the upper floor, all round (proud of the brick, never in its plane)
  for (const [h0, h1, p] of [[0, F1, 0.1], [F2 - 0.5, F2, 0.07]]) {
    b.box(STONE, O - p, O + W + p, -p, 0, h0, h1); b.box(STONE, O - p, O + W + p, D, D + p, h0, h1);
    b.box(STONE, O - p, O, 0, D, h0, h1); b.box(STONE, O + W, O + W + p, 0, D, h0, h1);
  }

  // ---- partitions, with a door on each floor at the back, beyond the stair ------------------------------------
  const DOOR = { kind: 'door', at: 19.8, w: 2.8, head: 7, hinge: 'a', swing: 'pos' };
  b.wall({ ax: 'Y', c: PX, a: T, b: D - T, t: TP, h0: F1, h1: C1, neg: 'plaster', pos: 'plaster', opens: [DOOR] });
  b.wall({ ax: 'Y', c: PX, a: T, b: D - T, t: TP, h0: F2, h1: C2, neg: 'plaster', pos: 'plaster', opens: [DOOR] });

  // ---- the stair: sixteen risers, closed underneath; a rail up its open side and round the well above ---------
  b.stair({ ax: 'Y', from: ST.Y0, to: ST.Y1, lo: ST.X0, hi: ST.X1, h0: F1, h1: F2, steps: 16 });
  {
    const rise = (F2 - F1) / 16, run = (ST.Y1 - ST.Y0) / 16, X = ST.X0, G = b.G;
    b.box('fir', X - 0.3, X + 0.1, ST.Y0 - 0.45, ST.Y0 - 0.05, F1, F1 + 3.9, { ...G, collide: true });                                   // newel
    const mid = (ST.Y0 + ST.Y1) / 2, half = Math.hypot(ST.Y1 - ST.Y0, F2 - F1) / 2, hm = (F1 + F2) / 2 + 3.1;
    b.box('fir', X - 0.2, X, mid - half, mid + half, hm, hm + 0.16, { rot: [Math.atan2(rise, run), 0, 0], ...G });      // handrail: a level board turned to the pitch about its middle
    for (let y = ST.Y0 + 0.45; y < ST.Y1; y += 0.9) { const base = F1 + ((y - ST.Y0) / run) * rise; b.box('fir', X - 0.15, X - 0.05, y - 0.05, y + 0.05, base, base + 2.75 + rise / 2, G); }
    b.block(X - 0.15, X - 0.05, ST.Y0 + 1.6, ST.Y1, F1, F2 + 3);                                                                       // nobody steps off the side
    // upstairs: a guard along the well and across its front end
    const guard = (X0, X1, Y0, Y1) => { b.box('fir', X0, X1, Y0, Y1, F2 + 2.85, F2 + 3); b.box('fir', X0, X1, Y0, Y1, F2 + 0.25, F2 + 0.37); b.block(X0, X1, Y0, Y1, F2, F2 + 3); };
    guard(X - 0.14, X, ST.Y0 - 0.14, ST.Y1 - 0.2); guard(X, ST.X1, ST.Y0 - 0.14, ST.Y0);
    for (let y = ST.Y0; y < ST.Y1 - 0.3; y += 0.45) b.box('fir', X - 0.11, X - 0.03, y - 0.04, y + 0.04, F2 + 0.37, F2 + 2.85, G);
    for (let x = X + 0.4; x < ST.X1; x += 0.45) b.box('fir', x - 0.04, x + 0.04, ST.Y0 - 0.11, ST.Y0 - 0.03, F2 + 0.37, F2 + 2.85, G);
  }

  // ---- the stoop: a stone landing and two steps down to the path ------------------------------------------------
  b.box('limestone_smooth', O + 12, O + 18, -2.6, 0, 0, F1, { collide: false }); b.surface(O + 12, O + 18, -2.6, 0.7, F1);
  b.steps({ ax: 'Y', from: -5, to: -2.6, lo: O + 12.4, hi: O + 17.6, h0: 0, h1: F1, steps: 2 });

  // ---- rooms: captions, what is drawn, and the light indoors -------------------------------------------------------
  const iX0 = O + T, iX1 = O + W - T, iY0 = T, iY1 = D - T, L = PX - TP / 2, R = PX + TP / 2;
  b.room('Schoolroom', iX0, L, iY0, iY1, F1, C1); b.room('Master’s room', R, iX1, iY0, iY1, F1, C1);
  b.room('Upper schoolroom', iX0, L, iY0, iY1, F2, C2); b.room('Book room', R, iX1, iY0, iY1, F2, C2);

  // ---- one lamp in each room (a schoolhouse globe on a stem, lit from dusk), and soft fills for daylight ---------------
  for (const [X, Y, fl, cl] of [[O + 7.5, 12, F1, C1], [O + 23.6, 12, F1, C1], [O + 7.5, 12, F2, C2], [O + 23.6, 12, F2, C2]]) {
    b.kit.ceilingLight(b.fr(X, Y, fl), 0, 0, cl - fl, { kind: 'schoolhouse', lit: true, drop: 2 });
    b.fill(X, Y, cl - 0.6, 0.9);
  }

  // ---- the roof: slate, the ridge along the front, brick gables carried up at the two ends -------------------------------
  b.roof.gable({ X0: O, X1: O + W, Y0: 0, Y1: D, eave: EAVE, pitch: 0.8, ridge: 'X', over: 1.1, overG: 0.7, mat: 'slate', gable: BRICK, gt: T });
}
