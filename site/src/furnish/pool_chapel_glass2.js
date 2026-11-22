// pool_chapel_glass2.js: the lights new to Spanya's chapel, in the hand of the others (pool_chapel_glass.js, which is
// Vesper Street's glass): the same glazier's tools, borders, ribbons and leads, so they sit with the rest.
//
//   rose       over the door: the murmuration as a rose, after the round window over the door of the chapel in Anna's
//              garden (~/projects/my_house/site/src/garden/chapel_glass.js, murmuration(), ringBorder(), ringWords(),
//              copied here), with MORE IS DIFFERENT in its ring of words
//   snow       a round light: a snow crystal, six arms grown alike from one middle (W. A. Bentley's photographs)
//   benard     a round light: Bénard's cells, a pan of liquid heated from below falling into hexagons of its own accord
//   fern       a lancet: Barnsley's fern, four affine maps played over and over until a fern appears
//   physarum   a lancet: a slime mould spread between oat flakes, its veins thinned to the shortest ways between them
//              (Nakagaki, Yamada and Tóth, Nature 2000: the mould that solved a maze)
// Every one is a generator that yields now and then, as the others are; rounds are drawn S by S, lancets W by H.
import { TOOLS, FONT, rng } from './pool_chapel_glass.js';
const { C, shift, lerpC, rect, circle, centroid, voronoi, sitesIn, clipPoly, path, inPolyPt, glass, leads, paint, setLine, inscription, tall, ribbon, ribbonTop, saddle, quarries, TAU } = TOOLS;

// ---- rounds: the house's ring border and its ring of words ---------------------------------------------------
function ringBorder(g, cx, cy, R, r, unit, o = {}) {
  const pieces = [], n = o.n ?? 20, r1 = R - unit * 0.5, r2 = R - unit * 1.6, r3 = r2 - unit * 0.22;
  const arc = (ra, rb, a0, a1) => { const p = []; for (let k = 0; k <= 6; k++) { const a = a0 + (a1 - a0) * k / 6; p.push([cx + Math.cos(a) * ra, cy + Math.sin(a) * ra]); } for (let k = 6; k >= 0; k--) { const a = a0 + (a1 - a0) * k / 6; p.push([cx + Math.cos(a) * rb, cy + Math.sin(a) * rb]); } return p; };
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU - Math.PI / 2, a1 = ((i + 1) / n) * TAU - Math.PI / 2, am = a0 + (a1 - a0) * 0.22;
    const f = arc(R, r1, a0, a1); glass(g, f, C.white, r, { matt: 0.18, mattW: 5 }); pieces.push(f);
    const j = arc(r1, r2, a0, am); glass(g, j, i % 2 ? (o.jA ?? C.ruby) : (o.jB ?? C.amber), r, { mattW: 6 }); pieces.push(j);
    const b = arc(r1, r2, am, a1); glass(g, b, o.band ?? C.blue, r, { mattW: 8 }); pieces.push(b);
    const k = arc(r2, r3, a0, a1); glass(g, k, C.gold, r, { matt: 0.2, mattW: 4 }); pieces.push(k);
  }
  return { r: r3, pieces };
}
function ringWords(g, cx, cy, rad, runs, fit) {
  const chars = []; for (const [t, font] of runs) for (const ch of t) { g.font = font; chars.push([ch, font, g.measureText(ch).width]); }
  const total = chars.reduce((a2, c) => a2 + c[2], 0), sp = (fit - total) / chars.length;
  const first = [...runs[0][0]].length, w0 = chars.slice(0, first).reduce((a2, c) => a2 + c[2] + sp, 0);
  let a = -Math.PI / 2 - (w0 / rad) / 2;
  for (const [ch, font, w] of chars) {
    const am = a + (w / 2 + sp / 2) / rad;
    g.save(); g.translate(cx, cy); g.rotate(am + Math.PI / 2); g.font = font; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText(ch, 0, -rad); g.strokeText(ch, 0, -rad); g.restore();
    a += (w + sp) / rad;
  }
}
// the ring, the band of words inside it, and the disc left for the picture
function roundFrame(g, S, r, words, o = {}) {
  const cx = S / 2, cy = S / 2, R = S / 2 - 2, unit = S / 34;
  const ring = ringBorder(g, cx, cy, R, r, unit, o), tb = unit * 3.1, Ri = ring.r - tb, pieces = [...ring.pieces];
  const band = [circle(cx, cy, ring.r, 72), circle(cx, cy, Ri, 72)];
  glass(g, band, [46, 38, 90], r, { matt: 0.14, mattW: 7, lj: 2, hj: 3, streak: 1.2 }); pieces.push(...band);
  const sz = tb * 0.78, f = (i, c) => `${i ? 'italic ' : ''}${c ? (sz * 0.8).toFixed(1) : sz.toFixed(1)}px ${FONT}`;
  g.fillStyle = paint(1); g.strokeStyle = paint(1); g.lineWidth = tb * 0.026; g.lineJoin = 'round';
  ringWords(g, cx, cy, Ri + tb * 0.26, words.map(([t, it, caps]) => [t, f(it, caps)]), Math.PI * 2 * (Ri + tb * 0.26));
  return { cx, cy, Ri, unit, pieces, disc: circle(cx, cy, Ri, 64) };
}

// ---- the rose over the door: a murmuration (the garden chapel's round window, its words now with MORE IS DIFFERENT)
export function* rose(g, S, seed = 11) {
  const r = rng(seed), F = roundFrame(g, S, r, [['MORE IS DIFFERENT', 0], ['  ·  ', 0], ['at each level of complexity entirely new properties appear', 1], ['  ·  ', 0], ['P. W. ANDERSON  ·  1972', 0, 1], ['  ·  ', 0]]);
  const { cx, cy, Ri, unit, disc } = F, pieces = F.pieces;
  const skyAt = y => { const t = (y - (cy - Ri)) / (2 * Ri); return t < 0.45 ? lerpC(C.deep, C.violet, t / 0.45) : t < 0.66 ? lerpC(C.violet, shift(C.rose, 0, 0, -6), (t - 0.45) / 0.21) : lerpC(C.rose, C.gold, Math.min(1, (t - 0.66) / 0.12)); };
  const land = x => cy + Ri * 0.56 + Math.sin(x * 0.05) * unit * 0.4 + Math.sin(x * 0.013 + 1) * unit * 1.1;
  const sky = voronoi(sitesIn((x, y) => inPolyPt(x, y, disc) && y < land(x) + unit, cx - Ri, cy - Ri, cx + Ri, cy + Ri, 70, r, unit * 2.9), disc);
  for (const p of sky) { const [, y] = centroid(p); glass(g, p, skyAt(y + (r() - 0.5) * unit * 1.2), r, { mattW: 10 }); pieces.push(p); }
  yield;
  {
    const pts = []; for (let x = cx - Ri; x <= cx + Ri; x += 6) pts.push([x, land(x)]);
    const ground = clipPoly([...pts, [cx + Ri, cy + Ri + 4], [cx - Ri, cy + Ri + 4]], disc);
    glass(g, ground, shift(C.purple, -20, -10, -6), r, { mattW: 14 }); pieces.push(ground);
    const near = []; for (let x = cx - Ri; x <= cx + Ri; x += 6) near.push([x, land(x) + unit * 1.6 + Math.sin(x * 0.09) * unit * 0.4]);
    const g2 = clipPoly([...near, [cx + Ri, cy + Ri + 4], [cx - Ri, cy + Ri + 4]], disc);
    glass(g, g2, shift(C.green, 0, -10, -12), r, { mattW: 12 }); pieces.push(g2);
    g.strokeStyle = paint(0.75);
    for (let i = 0; i < 70; i++) { const x = cx - Ri + r() * 2 * Ri, y0 = land(x) + unit * (0.6 + r() * 2.2); if (!inPolyPt(x, y0, disc)) continue; const hgt = unit * (0.8 + r() * 1.8), lean = (r() - 0.4) * unit * 0.6; g.lineWidth = 1 + r(); g.beginPath(); g.moveTo(x, y0); g.quadraticCurveTo(x + lean * 0.3, y0 - hgt * 0.6, x + lean, y0 - hgt); g.stroke(); }
  }
  yield;
  const P = Array.from({ length: 80 }, (_, i) => { const t = i / 79, a = t * Math.PI * 1.7 - 0.5; return [cx - Ri * 0.66 + t * Ri * 1.36 + Math.sin(a * 1.4) * Ri * 0.1, cy - Ri * 0.2 + Math.sin(a * 1.15 + 0.5) * Ri * 0.26 - Math.sin(t * Math.PI) * Ri * 0.1]; });
  const wid = t => Ri * (0.06 + 0.15 * Math.sin(Math.PI * t) ** 0.8) * (1 - 0.72 * Math.exp(-((t - 0.5) ** 2) / 0.005));
  const dens = (x, y) => { let d = 0; for (let i = 0; i < 80; i += 2) { const [px, py] = P[i], w = wid(i / 79) + 2, dd = ((x - px) ** 2 + (y - py) ** 2) / (w * w); if (dd < 9) d += Math.exp(-dd) * (0.4 + Ri * 0.035 / w); } return d; };
  g.save(); path(g, [disc]); g.clip();
  for (let i = 0; i < 80; i++) { const [px, py] = P[i], w = wid(i / 79) * 1.1 + 3, k = Math.min(0.2, 0.05 + Ri * 0.003 / w); const gr = g.createRadialGradient(px, py, 0, px, py, w); gr.addColorStop(0, `rgba(30,14,24,${k})`); gr.addColorStop(1, 'rgba(30,14,24,0)'); g.fillStyle = gr; g.fillRect(px - w, py - w, 2 * w, 2 * w); }
  g.restore();
  g.strokeStyle = paint(0.9); g.lineCap = 'round'; g.lineJoin = 'round';
  let n = 0;
  for (let k = 0; k < 90000 && n < 6500; k++) {
    if (k % 15000 === 14999) yield;
    const x = cx - Ri * 0.95 + r() * Ri * 1.9, y = cy - Ri * 0.8 + r() * Ri * 1.2;
    const d = dens(x, y); if (r() > d * d * 0.35 || !inPolyPt(x, y, disc) || y > land(x) - 2) continue;
    n++;
    const s = 1.1 + r() * 1.1, a = Math.sin(x * 0.02 + y * 0.03) * 0.6 + (r() - 0.5) * 0.5, up = 0.2 + r() * 0.9, c = Math.cos(a), sn = Math.sin(a);
    g.lineWidth = 0.8 + s * 0.2; g.beginPath(); g.moveTo(x - c * s * 1.5 + sn * s * up, y - sn * s * 1.5 - c * s * up); g.lineTo(x, y); g.lineTo(x + c * s * 1.5 + sn * s * up, y + sn * s * 1.5 - c * s * up); g.stroke();
  }
  leads(g, pieces, unit * 0.36, r);
  return pieces;
}

// ---- a snow crystal: a stellar dendrite, its six arms alike, each feathered with side branches -----------------
export function* snow(g, S, seed = 61) {
  const r = rng(seed), F = roundFrame(g, S, r, [['SNOW CRYSTAL', 0], ['  ·  ', 0], ['six arms grown alike from one middle', 1], ['  ·  ', 0], ['W. A. BENTLEY  ·  1931', 0, 1], ['  ·  ', 0]], { band: C.azure, jA: C.ice, jB: C.gold });
  const { cx, cy, Ri, unit, disc } = F, pieces = F.pieces;
  // the winter sky: deep blue at the rim to a pale ice blue at the middle
  for (const p of voronoi(sitesIn((x, y) => inPolyPt(x, y, disc), cx - Ri, cy - Ri, cx + Ri, cy + Ri, 90, r, unit * 2.4), disc)) {
    const [x, y] = centroid(p), t = Math.hypot(x - cx, y - cy) / Ri; glass(g, p, lerpC([204, 46, 66], C.deep, Math.min(1, t * 1.15) ** 1.4), r, { mattW: 9 }); pieces.push(p);
  }
  yield;
  // one arm, built along +x from the middle, then turned six ways: a spine of long pieces, branches either side
  const arm = [], L = Ri * 0.86, w = unit * 0.55;
  const bar = (x0, y0, x1, y1, ww) => { const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = -dy / l * ww, ny = dx / l * ww; return [[x0 + nx, y0 + ny], [x1 + nx * 0.4, y1 + ny * 0.4], [x1 + dx / l * ww, y1 + dy / l * ww], [x1 - nx * 0.4, y1 - ny * 0.4], [x0 - nx, y0 - ny]]; };
  for (let k = 0; k < 5; k++) { const a = unit * 2.4 + (L - unit * 2.4) * k / 5, b = unit * 2.4 + (L - unit * 2.4) * (k + 1) / 5; arm.push([bar(a, 0, b - unit * 0.2, 0, w * (1 - k * 0.12)), C.white]); }
  [[0.32, 0.36], [0.5, 0.42], [0.66, 0.34], [0.8, 0.22], [0.9, 0.12]].forEach(([t, len], i) => {
    for (const s of [-1, 1]) { const x0 = L * t, l = L * len, a = s * Math.PI / 3; arm.push([bar(x0, 0, x0 + Math.cos(a) * l, Math.sin(a) * l, w * 0.62), i % 2 ? C.ice : [196, 30, 90]]);
      if (len > 0.3) for (const u of [0.45, 0.75]) { const px = x0 + Math.cos(a) * l * u, py = Math.sin(a) * l * u, b = a + s * (-Math.PI / 3); arm.push([bar(px, py, px + Math.cos(a - s * Math.PI / 3) * l * 0.28, py + Math.sin(a - s * Math.PI / 3) * l * 0.28, w * 0.4), C.white]); void b; } }
  });
  for (let k = 0; k < 6; k++) {
    const q = k * Math.PI / 3 - Math.PI / 2, c = Math.cos(q), s = Math.sin(q);
    for (const [poly, col] of arm) { const p = poly.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]); glass(g, p, col, r, { mattW: 4, matt: 0.22, lj: 4 }); pieces.push(p); }
  }
  // the middle: a hexagonal plate with a smaller one in it
  for (const [rad, col] of [[unit * 2.6, [200, 36, 84]], [unit * 1.3, C.white]]) { const h = circle(cx, cy, rad, 6, -Math.PI / 2); glass(g, h, col, r, { mattW: 5, matt: 0.25 }); pieces.push(h); }
  leads(g, pieces, unit * 0.3, r);
  return pieces;
}

// ---- Bénard's cells: a pan of liquid heated from below falls into hexagons, rising hot in the middle of each ----
export function* benard(g, S, seed = 71) {
  const r = rng(seed), F = roundFrame(g, S, r, [['BÉNARD CELLS', 0], ['  ·  ', 0], ['heated from below, the liquid makes hexagons of its own accord', 1], ['  ·  ', 0], ['H. BÉNARD  ·  1900', 0, 1], ['  ·  ', 0]], { band: C.umber, jA: C.gold, jB: C.ruby });
  const { cx, cy, Ri, unit, disc } = F, pieces = F.pieces, step = Ri / 4.3, sites = [];
  for (let j = -6; j <= 6; j++) for (let i = -6; i <= 6; i++) { const x = cx + (i + (j % 2 ? 0.5 : 0)) * step + (r() - 0.5) * step * 0.22, y = cy + j * step * 0.866 + (r() - 0.5) * step * 0.22; if (Math.hypot(x - cx, y - cy) < Ri + step) sites.push([x, y]); }
  const cells = voronoi(sites, disc);
  yield;
  for (const p of cells) {
    const [x, y] = centroid(p), t = Math.hypot(x - cx, y - cy) / Ri;
    glass(g, p, lerpC([20, 80, 34], [8, 70, 24], t), r, { mattW: step * 0.5, matt: 0.55 }); pieces.push(p);
    // the hot middle of each, where the liquid comes up: a stain of gold, paling to white
    g.save(); path(g, [p]); g.clip(); const gr = g.createRadialGradient(x, y, 0, x, y, step * 0.55); gr.addColorStop(0, 'rgba(255,246,200,.95)'); gr.addColorStop(0.35, 'rgba(255,200,80,.75)'); gr.addColorStop(1, 'rgba(255,140,40,0)'); g.fillStyle = gr; g.fillRect(x - step, y - step, step * 2, step * 2); g.restore();
  }
  leads(g, pieces, unit * 0.3, r);
  return pieces;
}

// ---- Barnsley's fern: four maps, and a fern ---------------------------------------------------------------
export function* fern(g, W, H, seed = 81) {
  const r = rng(seed), f = tall(g, W, H, r, { band: C.green, jewelA: C.gold, jewelB: C.ruby }), { unit, x0, x1, y0, y1 } = f, pieces = [];
  const ins = inscription(unit, ['four maps,', 'played over', 'and over'], 'M. Barnsley · 1988'), rt = ribbonTop(f, ins);
  for (const p of voronoi(sitesIn((x, y) => f.inside(x, y), x0, y0, x1, y1, 110, r, unit * 2.5), f.inner)) { const [, y] = centroid(p), t = (y - y0) / (y1 - y0); glass(g, p, lerpC([196, 60, 26], [160, 48, 34], t), r, { mattW: 10 }); pieces.push(p); }
  leads(g, pieces, unit * 0.22, r); pieces.length = 0;
  yield;
  // the fern itself, in silver stain on the glass: the chaos game, forty thousand throws
  const fx = (x1 - x0 - unit * 2) / 5.6, fy = (rt - unit * 1.2 - (y0 + unit * 1.5)) / 10.2, s = Math.min(fx * 1.25, fy), bx = (x0 + x1) / 2 - 0.25 * s, by = rt - unit * 1.2;
  let x = 0, y = 0; g.save(); path(g, [f.inner]); g.clip();
  for (let pass = 0; pass < 2; pass++) {
    g.fillStyle = pass ? 'rgba(214,248,150,.75)' : 'rgba(10,30,10,.35)';
    for (let i = 0; i < 40000; i++) {
      if (i % 10000 === 9999) yield;
      const k = r(); let nx, ny;
      if (k < 0.01) { nx = 0; ny = 0.16 * y; } else if (k < 0.86) { nx = 0.85 * x + 0.04 * y; ny = -0.04 * x + 0.85 * y + 1.6; } else if (k < 0.93) { nx = 0.2 * x - 0.26 * y; ny = 0.23 * x + 0.22 * y + 1.6; } else { nx = -0.15 * x + 0.28 * y; ny = 0.26 * x + 0.24 * y + 0.44; }
      x = nx; y = ny; if (i < 20) continue;
      const px = bx + x * s, py = by - y * s, d = pass ? 1.1 : 2.4;
      g.fillRect(px - d / 2, py - d / 2, d, d);
    }
  }
  g.restore();
  pieces.push(...ribbon(g, f, ins, r));
  leads(g, pieces, unit * 0.22, r);
  saddle(g, f);
  return pieces;
}

// ---- the slime mould: oat flakes on agar, and the veins it keeps between them --------------------------------
export function* physarum(g, W, H, seed = 91) {
  const r = rng(seed), f = tall(g, W, H, r, { band: C.amber, jewelA: C.ruby, jewelB: C.emerald }), { unit, x0, x1, y0, y1 } = f, pieces = [];
  const ins = inscription(unit, ['no brain,', 'and it finds', 'the shortest way'], 'T. Nakagaki · 2000'), rt = ribbonTop(f, ins);
  for (const p of voronoi(sitesIn((x, y) => f.inside(x, y), x0, y0, x1, y1, 100, r, unit * 2.6), f.inner)) { const [, y] = centroid(p); glass(g, p, lerpC([30, 70, 22], [40, 64, 30], (y - y0) / (y1 - y0)), r, { mattW: 12 }); pieces.push(p); }
  leads(g, pieces, unit * 0.2, r); pieces.length = 0;
  yield;
  // the flakes, spread up the light; the veins: the shortest tree joining them, and a few loops kept for safety
  const food = sitesIn((x, y) => f.inside(x, y, unit * 2) && y < rt - unit * 1.5, x0, y0, x1, rt, 13, r, unit * 4.5), E = [], inT = [0];
  while (inT.length < food.length) { let best = null; for (const i of inT) for (let j = 0; j < food.length; j++) { if (inT.includes(j)) continue; const d = Math.hypot(food[i][0] - food[j][0], food[i][1] - food[j][1]); if (!best || d < best[2]) best = [i, j, d]; } E.push(best); inT.push(best[1]); }
  for (let i = 0; i < food.length; i++) for (let j = i + 1; j < food.length; j++) { const d = Math.hypot(food[i][0] - food[j][0], food[i][1] - food[j][1]); if (d < unit * 6.5 && !E.some(e => (e[0] === i && e[1] === j) || (e[0] === j && e[1] === i)) && r() < 0.35) E.push([i, j, d]); }
  g.save(); path(g, [f.inner]); g.clip(); g.lineCap = 'round'; g.lineJoin = 'round';
  const vein = (a, b, wd, m) => { const mx = m ? m[0] : (a[0] + b[0]) / 2 + (r() - 0.5) * unit * 1.5, my = m ? m[1] : (a[1] + b[1]) / 2 + (r() - 0.5) * unit * 1.5; g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(mx, my, ...b); g.lineWidth = wd; g.stroke(); };
  // the fine search front it left behind: faint fans
  g.strokeStyle = 'rgba(255,214,90,.28)';
  for (let k = 0; k < 140; k++) { const a = food[Math.floor(r() * food.length)], ang = r() * TAU, l = unit * (1 + r() * 2.5); vein(a, [a[0] + Math.cos(ang) * l, a[1] + Math.sin(ang) * l], 1.2); }
  const mid = E.map(([i, j]) => [(food[i][0] + food[j][0]) / 2 + (r() - 0.5) * unit * 1.5, (food[i][1] + food[j][1]) / 2 + (r() - 0.5) * unit * 1.5]);
  E.forEach(([i, j], k) => { g.strokeStyle = paint(0.85); vein(food[i], food[j], unit * 0.75, mid[k]); });
  E.forEach(([i, j], k) => { g.strokeStyle = 'rgba(255,212,70,.95)'; vein(food[i], food[j], unit * 0.42, mid[k]); });
  g.restore();
  yield;
  for (const [x, y] of food) { const p = circle(x, y, unit * (0.75 + r() * 0.25), 12); glass(g, p, C.straw, r, { mattW: 4 }); pieces.push(p); }
  pieces.push(...ribbon(g, f, ins, r));
  leads(g, pieces, unit * 0.22, r);
  saddle(g, f);
  return pieces;
}

// the set: id -> [kind, drawing (g, W, H) => generator]
export const NEW = {
  rose: ['round', (g, S) => rose(g, S)], snow: ['round', (g, S) => snow(g, S)], benard: ['round', (g, S) => benard(g, S)],
  fern: ['lancet', (g, W, H) => fern(g, W, H)], physarum: ['lancet', (g, W, H) => physarum(g, W, H)],
};
