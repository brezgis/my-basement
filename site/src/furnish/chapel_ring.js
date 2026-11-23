// chapel_ring.js: the second ring of the oculus's glass, set in the chapel's ceiling round the shaft.
//
// The glass at the mouth of the shaft (skylight_glass.js) is the window of Anna's House's garden seen from below: one
// autopoietic unity, a membrane that keeps making itself, after Varela, Maturana and Uribe (1974). That ring is all
// there is of it up in the grass. Down here the picture goes on outward, as if the same window were wider than the
// hole: what the paper's last pages and the book that followed it (H. R. Maturana and F. J. Varela, "Autopoiesis and
// Cognition: The Realization of the Living", Reidel, 1980) say comes next. A unity does not live alone. Round the first
// one, in its medium, are others like it: small membranes at every stage (one closing, one whole, one grown long and
// pinching in two, two just parted), each with its catalyst; substrate passing between them; and fine gold lines from
// each to its neighbours, which is the book's "structural coupling": each one's changes are the other's weather. Past
// them the medium itself, in long violet swells. The three marks of the paper are kept (star, small circle, square).
//
//   drawChapelRing(size) -> canvas     an annulus, clear inside INNER (of the radius) and outside the rim
//   INNER                              the inner radius as a part of the whole
//   CAPTION2                           the card for it
export const INNER = 0.56;
export const CAPTION2 = {
  title: 'The outer ring', kicker: 'after Maturana & Varela, Autopoiesis and Cognition, 1980',
  text: 'The glass in the shaft is one membrane that keeps making itself. This ring, round it, is what comes next: others like it in the same water, closing, whole, dividing, parted; substrate passing between them; and a gold thread from each to its neighbours, because each one\'s changes are the other\'s weather. The book calls that structural coupling, and says that to live this way is already to know something.',
  foot: 'H. R. Maturana and F. J. Varela, Autopoiesis and Cognition: The Realization of the Living (D. Reidel, 1980).',
};

const TAU = Math.PI * 2;
const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

export function drawChapelRing(size = 1536) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), R = size / 2, u = R, r = rng(1980), LEAD = '#14110f';
  const P = (rad, a) => [R + Math.sin(a) * rad * u, R - Math.cos(a) * rad * u];      // angles clockwise from the top
  const R_IN = INNER, R_FIL = 0.585, R_A = 0.70, R_B = 0.885, R_BORD = 0.935;
  g.clearRect(0, 0, size, size);
  g.save(); g.beginPath(); g.arc(R, R, R - 1, 0, TAU); g.arc(R, R, R_IN * u, 0, TAU, true); g.clip('evenodd');

  // ---- the ground, in quarries: the deep blue of the world outside the first membrane, going to violet, then indigo
  const band = (r0, r1, n, col, off = 0) => { for (let i = 0; i < n; i++) { const a0 = (i + off) / n * TAU, a1 = (i + 1 + off) / n * TAU;
    g.beginPath(); g.arc(R, R, r1 * u, a0 - Math.PI / 2, a1 - Math.PI / 2); g.arc(R, R, r0 * u, a1 - Math.PI / 2, a0 - Math.PI / 2, true); g.closePath();
    g.fillStyle = col(i); g.fill(); g.strokeStyle = LEAD; g.lineWidth = 0.006 * u; g.stroke(); } };
  const mix = (a, b, k) => `rgb(${a.map((v, i) => Math.round((v + (b[i] - v) * k) * (0.86 + r() * 0.28))).join(',')})`;
  band(R_FIL, R_A, 36, () => mix([24, 52, 150], [30, 70, 170], r()));
  band(R_A, 0.795, 44, () => mix([52, 44, 150], [92, 56, 160], r()), 0.5);
  band(0.795, R_B, 52, () => mix([70, 40, 132], [40, 34, 110], r()));
  band(R_B, R_BORD, 60, i => (i % 5 === 0 ? mix([170, 34, 44], [190, 40, 50], r()) : mix([30, 34, 96], [24, 28, 80], r())), 0.5);
  band(R_BORD, 1, 72, i => (i % 3 === 0 ? mix([205, 160, 60], [225, 180, 80], r()) : i % 3 === 1 ? mix([150, 30, 40], [170, 36, 46], r()) : mix([26, 44, 120], [30, 52, 140], r())));
  // the long swells of the medium, in the outer violet: lead lines that wave
  g.strokeStyle = 'rgba(20,17,15,.8)'; g.lineWidth = 0.004 * u;
  for (const [rad, amp, n, ph] of [[0.822, 0.012, 9, 0], [0.852, 0.01, 11, 1.3]]) { g.beginPath(); for (let k = 0; k <= 360; k++) { const a = k / 360 * TAU, [x, y] = P(rad + amp * Math.sin(a * n + ph), a); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.stroke(); }
  // pot-metal streaks, and a light that gathers toward the shaft
  for (let i = 0; i < 260; i++) { const a = r() * TAU, rad = R_FIL + r() * (1 - R_FIL), [x, y] = P(rad, a); g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.035)' : 'rgba(0,0,20,.05)'; g.beginPath(); g.ellipse(x, y, (0.01 + r() * 0.03) * u, 0.004 * u, a, 0, TAU); g.fill(); }
  { const gr = g.createRadialGradient(R, R, R_IN * u, R, R, u); gr.addColorStop(0, 'rgba(255,240,200,.22)'); gr.addColorStop(0.35, 'rgba(255,240,200,0)'); gr.addColorStop(1, 'rgba(0,0,20,.18)'); g.fillStyle = gr; g.fillRect(0, 0, size, size); }

  // ---- the paper's three marks ------------------------------------------------------------------------------------
  const substrate = (x, y, q) => { g.beginPath(); g.arc(x, y, q, 0, TAU); g.fillStyle = '#9fd070'; g.fill(); g.strokeStyle = LEAD; g.lineWidth = q * 0.36; g.stroke(); g.beginPath(); g.arc(x - q * 0.25, y - q * 0.3, q * 0.3, 0, TAU); g.fillStyle = 'rgba(255,255,230,.7)'; g.fill(); };
  const link = (x, y, q, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#e2a83c'; g.strokeStyle = LEAD; g.lineWidth = q * 0.3; g.fillRect(-q, -q, 2 * q, 2 * q); g.strokeRect(-q, -q, 2 * q, 2 * q); g.fillStyle = 'rgba(255,255,230,.5)'; g.fillRect(-q * 0.6, -q * 0.7, q * 0.9, q * 0.3); g.restore(); };
  const star = (x, y, q) => { g.beginPath(); for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, rr = k % 2 ? q * 0.42 : q; g.lineTo(x + Math.sin(a) * rr, y - Math.cos(a) * rr); } g.closePath(); g.fillStyle = '#f4ead0'; g.fill(); g.strokeStyle = LEAD; g.lineWidth = q * 0.16; g.stroke(); g.beginPath(); g.arc(x, y, q * 0.2, 0, TAU); g.fillStyle = '#b0303a'; g.fill(); };

  // ---- the others: small unities round the first, at every stage ---------------------------------------------------
  // kind: 'whole' | 'closing' (a gap, a link coming) | 'dividing' (long, pinched, two catalysts) | 'parted' (two small ones, just apart)
  const N = 9, kinds = ['whole', 'closing', 'whole', 'dividing', 'whole', 'parted', 'whole', 'closing', 'whole'], cells = [];
  const unity = (cx, cy, rad, rot, o = {}) => {
    const sx = o.long ?? 1, n = Math.round(9 * (sx > 1 ? 1.35 : 1) * rad / (0.055 * u));
    g.save(); g.translate(cx, cy); g.rotate(rot);
    const pt = k => { const a = k / n * TAU, pinch = o.pinch ? 1 - o.pinch * Math.exp(-((Math.sin(a) / 0.35) ** 2)) : 1; return [Math.sin(a) * rad * sx, -Math.cos(a) * rad * pinch]; };
    g.beginPath(); for (let k = 0; k <= n; k++) { const [x, y] = pt(k); k ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fillStyle = '#5fb9a6'; g.fill();      // the living interior
    { const gr = g.createRadialGradient(0, 0, 0, 0, 0, rad * sx); gr.addColorStop(0, 'rgba(230,255,235,.5)'); gr.addColorStop(1, 'rgba(20,90,90,.25)'); g.fillStyle = gr; g.fill(); }
    g.strokeStyle = '#d9a43a'; g.lineWidth = rad * 0.1; g.beginPath(); for (let k = 0; k <= n; k++) { if (o.gap === k) continue; const [x, y] = pt(k); (k && o.gap !== k - 1) ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();      // the bonds
    for (let k = 0; k < n; k++) { if (o.gap === k) continue; const [x, y] = pt(k), a = k / n * TAU; link(x, y, rad * 0.13, a); }
    if (o.gap !== undefined) { const [x, y] = pt(o.gap); link(x * 0.72, y * 0.72, rad * 0.13, 0.5); }                                    // the link on its way to the gap
    for (const s of o.stars ?? [0]) star(s * rad * sx * 0.5, 0, rad * 0.3);
    substrate(rad * sx * 0.1 + (o.stars ? 0 : rad * 0.35), rad * 0.38, rad * 0.09);
    g.restore();
  };
  for (let i = 0; i < N; i++) {
    const a = (i + 0.5) / N * TAU + (r() - 0.5) * 0.12, rad = 0.735 + (i % 2 ? 0.022 : -0.012), [x, y] = P(rad, a), q = (0.05 + r() * 0.012) * u, kind = kinds[i];
    cells.push({ x, y, a, q, kind });
  }
  // the gold threads between neighbours (drawn first, so the unities lie over their ends), and substrate along them
  g.setLineDash([0.012 * u, 0.01 * u]); g.strokeStyle = 'rgba(240,200,110,.9)'; g.lineWidth = 0.0045 * u;
  for (let i = 0; i < N; i++) { const A = cells[i], B = cells[(i + 1) % N], am = (A.a + (B.a < A.a ? B.a + TAU : B.a)) / 2, [mx, my] = P(0.69 + 0.03 * (i % 2), am);
    g.beginPath(); g.moveTo(A.x, A.y); g.quadraticCurveTo(mx, my, B.x, B.y); g.stroke(); }
  g.setLineDash([]);
  // and one from each back toward the first membrane, inside the shaft: they are coupled to it too
  g.strokeStyle = 'rgba(240,200,110,.55)'; g.lineWidth = 0.0035 * u; g.setLineDash([0.006 * u, 0.012 * u]);
  for (const A of cells) { const [x, y] = P(R_FIL + 0.004, A.a); g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(x, y); g.stroke(); }
  g.setLineDash([]);
  for (const A of cells) {
    const rot = A.a + Math.PI / 2;
    if (A.kind === 'whole') unity(A.x, A.y, A.q, rot);
    else if (A.kind === 'closing') unity(A.x, A.y, A.q, rot, { gap: 2 });
    else if (A.kind === 'dividing') unity(A.x, A.y, A.q * 0.92, rot, { long: 1.55, pinch: 0.5, stars: [-1, 1] });
    else { const d = A.q * 0.95; unity(A.x - Math.cos(rot) * d, A.y - Math.sin(rot) * d, A.q * 0.7, rot); unity(A.x + Math.cos(rot) * d, A.y + Math.sin(rot) * d, A.q * 0.7, rot + 1); }
  }
  // substrate: everywhere in the medium, thicker near the unities; it passes through all of them
  for (let i = 0; i < 150; i++) { const a = r() * TAU, rad = R_FIL + 0.012 + r() * (R_B - R_FIL - 0.02), [x, y] = P(rad, a);
    if (cells.some(q => Math.hypot(q.x - x, q.y - y) < q.q * 1.75)) continue; substrate(x, y, (0.0065 + r() * 0.003) * u); }

  // ---- the fillets -------------------------------------------------------------------------------------------------
  for (const [rad, w, col] of [[R_FIL, 0.012, '#d9a43a'], [R_B, 0.006, '#d9a43a'], [R_BORD, 0.005, LEAD]]) { g.beginPath(); g.arc(R, R, rad * u, 0, TAU); g.strokeStyle = LEAD; g.lineWidth = (w + 0.006) * u; g.stroke(); g.strokeStyle = col; g.lineWidth = w * u; g.stroke(); }
  g.restore();
  // the lead cames at the two edges
  for (const rad of [R_IN + 0.004, 1 - 0.006]) { g.beginPath(); g.arc(R, R, rad * u, 0, TAU); g.strokeStyle = LEAD; g.lineWidth = 0.012 * u; g.stroke(); }
  return c;
}
