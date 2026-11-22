// stair_hall: the drawings hung on the stair, painted on canvases from the building's own numbers (spanya.js and
// campus.js, the three-quarter plan of 21 November 2026), in sepia ink on laid paper, as if the staff had measured the
// place themselves: a plan of the ground storey with a red dot on the stair, and a long section along the way in.
// Every line here comes from a figure in spanya.js; nothing is invented except the hand.

import { F, paper, T } from '../boards.js';

const INK = '#3b2a1c', RED = '#9a3324', WASH = 'rgba(120,150,170,0.32)', POCHE = 'rgba(59,42,28,0.82)';

// a wobbly pen: every segment is cut into short lengths that stray a little, the width breathing
function pen(g, seed = 1) {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647) - 0.5;
  const stroke = (pts, lw, col = INK, close = false) => {
    const P = close ? [...pts, pts[0]] : pts;
    g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
    for (let k = 0; k < P.length - 1; k++) {
      const [x0, y0] = P[k], [x1, y1] = P[k + 1], L = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.round(L / 14));
      g.beginPath(); g.moveTo(x0 + r() * 0.8, y0 + r() * 0.8);
      for (let i = 1; i <= n; i++) { const t = i / n; g.lineTo(x0 + (x1 - x0) * t + r() * 0.9, y0 + (y1 - y0) * t + r() * 0.9); }
      g.lineWidth = lw * (0.85 + r() * 0.35); g.stroke();
    }
  };
  return { stroke, r };
}

const arc = (cx, cy, rad, a0, a1, n = 48) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)]; });

// ---- the plan of the ground storey --------------------------------------------------------------------------------
// The figures, as spanya.js: the box of rooms X 12..108, Y 16..74 (walls 1.5 thick, partitions 0.5); the courtyard a
// circle at (60, 28), radius 24 to its wall's middle; the way in Y 25..31 from the cellar doors at X -55.2 (three flights:
// -53.2..-38.2, -26.2..-11.2, -3.2..10.8); the hall | listening room wall at Y 40.5 (opening X 27.5..32.1), the same on
// the east (opening X 88..92.6); the middle's sides at X 43 and 77; the pool basin X 50..70, Y 57.5..67.5; the chapel
// X 46..74 to Y 101 with its shaft at (60, 87.5); the cave X -2.5..12, Y 50..64; the banya's walls at Y 55.3 and X 95.3.
export function drawPlan(g, W, H) {
  paper(g, W, H, '#eee3c9', 11);
  const { stroke } = pen(g, 7);
  const EX0 = -62, EX1 = 112, EY0 = 12, EY1 = 104, top = H * 0.17;
  const m = W * 0.04, s = Math.min((W - 2 * m) / (EX1 - EX0), (H - top - H * 0.04) / (EY1 - EY0));
  const ox = m + ((W - 2 * m) - (EX1 - EX0) * s) / 2, P = (X, Y) => [ox + (X - EX0) * s, top + (EY1 - Y) * s];
  const R = (X0, X1, Y0, Y1) => [P(X0, Y0), P(X1, Y0), P(X1, Y1), P(X0, Y1)];
  const fillR = (X0, X1, Y0, Y1, c) => { const [a, b] = [P(X0, Y1), P(X1, Y0)]; g.fillStyle = c; g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); };
  const lw = Math.max(2.4, s * 0.62), BG = '#eee3c9';
  // the rock, hatched
  g.save(); g.strokeStyle = 'rgba(59,42,28,0.3)'; g.lineWidth = 1;
  for (let x = -H; x < W; x += s * 3.2) { g.beginPath(); g.moveTo(x, top - s * 2); g.lineTo(x + H, top + H); g.stroke(); }
  g.restore();
  const clear = (X0, X1, Y0, Y1) => fillR(X0, X1, Y0, Y1, BG);
  clear(12, 108, 16, 74); clear(-2.5, 12, 50, 64); clear(46, 74, 74, 101); clear(-56, 12, 24.5, 31.5); fillR(-200, 300, 0, 16.75, BG);
  g.fillStyle = BG; g.beginPath(); arc(...P(60, 28), 25 * s, 0, Math.PI * 2).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill();
  stroke([P(EX0, 16.75), P(EX1, 16.75)], lw * 0.8);
  T(g, 'the cliff · the clouds below', ...P(-26, 13.8), s * 3.0, INK, { f: F.caveat, w: 600 });
  const wall = (X0, X1, Y0, Y1) => fillR(X0, X1, Y0, Y1, POCHE);
  // the outer walls (the stair's doorway and the cave's door left open), the south walls with their windows
  wall(12, 13.5, 16, 25.3); wall(12, 13.5, 30.7, 54); wall(12, 13.5, 57, 74); wall(12, 108, 72.5, 74); wall(106.5, 108, 16, 74);
  wall(13.5, 38.8, 16, 17.5); wall(81.2, 106.5, 16, 17.5);
  for (const [a, b] of [[16.5, 23.5], [89.5, 96.5]]) { clear(a, b, 16, 17.5); stroke([P(a, 16.75), P(b, 16.75)], lw * 0.5); }
  // partitions
  wall(13.5, 27.5, 40.25, 40.75); wall(32.1, 38.2, 40.25, 40.75); wall(81.8, 88, 40.25, 40.75); wall(92.6, 106.5, 40.25, 40.75);
  for (const X of [43, 77]) { const y0 = 28 + Math.sqrt(24 * 24 - (X - 60) ** 2) + 0.7; wall(X - 0.25, X + 0.25, y0, 59.2); wall(X - 0.25, X + 0.25, 63.8, 72.5); }
  wall(84.2, 106.5, 55.05, 55.55); clear(86.8, 89.8, 55, 55.6); clear(98, 101, 55, 55.6); wall(84.25, 84.75, 55.3, 72.5); wall(95.05, 95.55, 55.3, 72.5);
  wall(-3.5, -2.5, 49, 65); wall(-2.5, 12, 49, 50); wall(-2.5, 12, 64, 65);
  wall(44.5, 46, 74, 102.5); wall(74, 75.5, 74, 102.5); wall(46, 74, 101, 102.5);
  // the courtyard: its wall with three glazed bays, an old pine, the edge pool at the brink
  const C = P(60, 28), rr = 24 * s;
  g.lineWidth = 1.5 * s; g.strokeStyle = POCHE; g.beginPath(); arc(C[0], C[1], rr, Math.PI + 0.5, Math.PI * 2 - 0.5).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  stroke(arc(C[0], C[1], rr, 0.5, Math.PI - 0.5, 30), lw * 0.7);
  for (const [X, Y] of [[36, 28], [60, 52], [84, 28]]) { g.fillStyle = BG; g.beginPath(); g.arc(...P(X, Y), 3.2 * s, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(70,100,60,0.35)'; g.beginPath(); g.arc(...P(67, 36), 4 * s, 0, Math.PI * 2); g.fill(); stroke(arc(...P(67, 36), 4 * s, 0, Math.PI * 2, 18), lw * 0.4);
  g.fillStyle = WASH; g.beginPath(); arc(C[0], C[1], rr * 0.97, Math.PI - 0.35, 0.35).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill();
  // the pool, and the chapel's shaft
  fillR(50, 70, 57.5, 67.5, WASH); stroke(R(50, 70, 57.5, 67.5), lw * 0.6, INK, true);
  for (let i = 1; i < 6; i++) stroke([P(50 + i, 57.9), P(50 + i, 67.1)], lw * 0.3);
  stroke(arc(...P(60, 87.5), 3 * s, 0, Math.PI * 2, 20), lw * 0.6); stroke(arc(...P(60, 87.5), 3.7 * s, 0, Math.PI * 2, 20), lw * 0.3);
  // the stair to the upper floor (in the listening room), and the way in
  stroke(R(17.5, 32, 68.4, 72.4), lw * 0.5, INK, true); for (let i = 1; i < 16; i++) { const X = 17.5 + i * (14.5 / 16); stroke([P(X, 68.4), P(X, 72.4)], lw * 0.3); }
  stroke([P(-56, 24.5), P(12, 24.5)], lw * 1.3); stroke([P(-56, 31.5), P(12, 31.5)], lw * 1.3); stroke([P(-55.7, 24.5), P(-55.7, 31.5)], lw * 1.3);
  for (const [foot, head, N] of [[-38.2, -53.2, 16], [-11.2, -26.2, 16], [10.8, -3.2, 16]]) { stroke(R(head, foot, 25, 31), lw * 0.4, INK, true); for (let i = 1; i < N; i++) { const X = foot - i * ((foot - head) / N); stroke([P(X, 25), P(X, 31)], lw * 0.25); } }
  stroke([P(-52, 28), P(8, 28)], lw * 0.5, RED); stroke([P(5.8, 29.3), P(8.6, 28), P(5.8, 26.7)], lw * 0.5, RED);
  T(g, 'DOWN', ...P(-46, 34.5), s * 2.8, RED, { f: F.goudy, ls: s * 0.4 });
  stroke([P(-55.2, 25), P(-39.2, 31)], lw * 0.25); stroke([P(-55.2, 31), P(-39.2, 25)], lw * 0.25);
  g.fillStyle = RED; g.beginPath(); g.arc(...P(-32.2, 28), s * 1.1, 0, Math.PI * 2); g.fill();
  // names, by hand
  const name = (t, X, Y, k = 1) => T(g, t, ...P(X, Y), s * 3.4 * k, INK, { f: F.caveat, w: 600 });
  name('The Hall', 22, 34); name('Listening Room', 27, 50); name('Cave', 4.7, 57, 0.8); name('Pool', 60, 70.2, 0.9); name('Chapel', 60, 95, 0.9); name('Courtyard', 60, 33, 1.1);
  name('Tea Room', 95, 33); name('Banya', 95, 48); name('Parnaya', 90, 64, 0.8); name('Treatment', 101, 64, 0.65); name('the way in', -20, 21);
  // the title, a north arrow and a scale
  T(g, 'ANNA’S BASEMENT', W / 2, H * 0.06, H * 0.06, INK, { f: F.goudy, ls: H * 0.012 });
  T(g, 'plan of the ground storey', W / 2, H * 0.115, H * 0.032, INK, { f: F.goudy, it: true });
  const [nx, ny] = [W - m - s * 6, H * 0.08];
  stroke([[nx, ny + s * 5], [nx, ny - s * 3]], lw * 0.6); stroke([[nx - s * 1.4, ny - s * 1], [nx, ny - s * 3.2], [nx + s * 1.4, ny - s * 1]], lw * 0.6); T(g, 'N', nx, ny + s * 7, s * 2.4, INK, { f: F.goudy });
  const [sx, sy] = [m + s * 2, H * 0.09];
  for (let i = 0; i < 3; i++) { g.fillStyle = i % 2 ? BG : INK; g.fillRect(sx + i * 10 * s, sy, 10 * s, s * 0.9); }
  g.strokeStyle = INK; g.lineWidth = 1; g.strokeRect(sx, sy, 30 * s, s * 0.9);
  for (const [i, t] of [[0, '0'], [1, '10'], [3, '30 ft']]) T(g, t, sx + i * 10 * s, sy + s * 2.6, s * 1.8, INK, { f: F.goudy });
}

// ---- the long section along the way in, looking north ----------------------------------------------------------------
export function drawSection(g, W, H) {
  paper(g, W, H, '#efe5cc', 21);
  const { stroke, r } = pen(g, 13);
  const EX0 = -64, EX1 = 112, h0 = -10, h1 = 44;
  const m = W * 0.03, top = H * 0.16, s = Math.min((W - 2 * m) / (EX1 - EX0), (H - top - H * 0.04) / (h1 - h0));
  const P = (X, h) => [m + (X - EX0) * s, top + (h1 - h) * s], lw = Math.max(2.4, s * 0.55);
  const poly = (pts, c) => { g.fillStyle = c; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p)))); g.closePath(); g.fill(); };
  poly([[EX0, 30], [EX1, 30], [EX1, h1], [EX0, h1]], 'rgba(150,180,200,0.18)');
  const rock = [[EX0, h0], [EX1, h0], [EX1, 30], [EX0, 30]];
  poly(rock, 'rgba(110,92,70,0.28)');
  g.save(); g.beginPath(); rock.forEach((p, i) => (i ? g.lineTo(...P(...p)) : g.moveTo(...P(...p)))); g.closePath(); g.clip();
  g.strokeStyle = 'rgba(59,42,28,0.25)'; g.lineWidth = 1; for (let x = -H; x < W; x += s * 2.4) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + H, H); g.stroke(); }
  g.restore();
  const hole = (pts) => poly(pts, '#efe5cc');
  // the way in, the west wing's two storeys, the courtyard under its vault of rock, the east wing
  hole([[-56.2, 30.8], [-39.2, 30.8], [-39.2, 28.6], [-26.2, 28.6], [-11.2, 18.6], [-3.2, 18.6], [12, 9.1], [12, 0.4], [10.8, 0.4], [-3.2, 10], [-11.2, 10], [-26.2, 20], [-38.2, 20], [-53.2, 30]]);
  hole([[13.5, 0.4], [36, 0.4], [36, 10.6], [13.5, 10.6]]); hole([[13.5, 11.5], [36, 11.5], [36, 19.8], [13.5, 19.8]]);
  hole([[36, 0.34], [84, 0.34], [84, 22], [78, 27], [60, 29], [42, 27], [36, 22]]);
  hole([[84, 0.4], [106.5, 0.4], [106.5, 10.6], [84, 10.6]]);
  for (const [foot, head, lo, hi] of [[-38.2, -53.2, 20, 30], [-11.2, -26.2, 10, 20], [10.8, -3.2, 0.4, 10]]) {
    const N = Math.round((hi - lo) / 0.62), rise = (hi - lo) / N, run = (foot - head) / N, pts = [[foot, lo]];
    for (let i = 0; i < N; i++) { const u = foot - i * run; pts.push([u, lo + (i + 1) * rise], [u - run, lo + (i + 1) * rise]); }
    stroke(pts.map(p => P(...p)), lw * 0.7);
  }
  stroke([P(-38.2, 20), P(-26.2, 20)], lw * 0.7); stroke([P(-11.2, 10), P(-3.2, 10)], lw * 0.7); stroke([P(10.8, 0.4), P(36, 0.4)], lw * 0.9);
  stroke([P(EX0, 30), P(-56.2, 30)], lw);
  for (let X = EX0 + 1; X < -57; X += 1.6) stroke([P(X, 30), P(X + r() * 0.8, 30.7 + r() * 0.5)], lw * 0.35, '#5d6b3c');
  stroke([P(-56.2, 30.6), P(-47.7, 36.2), P(-39.2, 30.6)], lw * 1.1, '#39503f');      // the cellar doors, shut
  stroke([P(36, 0.4), P(36, 9.3)], lw * 0.4); stroke([P(84, 0.4), P(84, 9.3)], lw * 0.4); stroke([P(36, 11.5), P(36, 19.8)], lw * 0.6);
  stroke([P(36, 0.34), P(84, 0.34)], lw * 0.8);
  stroke([P(67, 0.34), P(66.4, 8), P(67.6, 14)], lw * 0.9, '#4b3a28');
  g.fillStyle = 'rgba(60,85,55,0.55)'; for (const [X, h, rad] of [[65, 13, 2.8], [69, 15, 3.0], [67, 17, 2.4]]) { g.beginPath(); g.ellipse(...P(X, h), rad * s, rad * s * 0.45, 0, 0, Math.PI * 2); g.fill(); }
  const say = (t, X, h, k = 1, col = INK) => T(g, t, ...P(X, h), s * 3.0 * k, col, { f: F.caveat, w: 600 });
  say('the meadow', -20, 33.5); say('cellar doors', -47.7, 38.8, 0.85); say('landing', -32.2, 23.4, 0.85); say('landing', -7.2, 13.4, 0.85);
  say('The Hall', 24.7, 5.5); say('the suite', 24.7, 15.5, 0.9); say('the courtyard', 60, 4.5, 0.95); say('the rock', -20, -5, 1.1, '#5a4a38');
  T(g, 'Section along the way in, looking north', W / 2, H * 0.06, H * 0.055, INK, { f: F.goudy, it: true });
  T(g, 'from the cellar doors, 30 ft down by three flights and two landings, to the hall', W / 2, H * 0.115, H * 0.034, INK, { f: F.goudy });
}
