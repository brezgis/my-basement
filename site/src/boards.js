// Boards and lettering: chalkboards, painted and engraved signs, door plates, and paper (a notice, a timetable,
// a poster). Everything lettered at the school is painted on a 2D canvas by a small function and put on a plane
// by life.js, which packs a room's canvases into one sheet, so a room's lettering is one texture and one draw
// call, made when the room is first near.
//
// The first half is the town's drawing helpers (Vesper Street's draw.js): each takes a 2D context first.
// The second half is the chalk (helpers for writing and drawing on a slate, laid out by hand, in inches).
// The third is the things themselves, built on a kit frame that lies ON a wall: chalkboard, sign, plate, paper.
// A furnish file reaches all of it through `f` (src/furnish/README.md); `f.draw` is this module.
//
// Canvas sizes are worked out from the size of the thing in feet and a resolution in pixels per foot (RES):
// enough to be sharp at the distance the thing is read from, and no more. Letters meant to be read should be
// at least an inch high on a board (0.08 ft) and half an inch on paper read from two feet.

import { F } from './fonts.js';
export { F };

export const TAU = Math.PI * 2;
export function rnd(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

// Pixels per foot. A chalkboard is read from 6 to 20 ft (and its chalk wants pixels to be grainy in); a sign from 6 to 30; a door plate and paper from 2 to 6.
export const RES = { chalkboard: 128, sign: 128, plate: 256, paper: 240, poster: 144 };
// the canvas for a thing w by tall feet at res pixels per foot (no side longer than cap)
export function canvasSize(w, tall, res, cap = 2048) { const k = Math.min(1, cap / (Math.max(w, tall) * res)); return [Math.max(16, Math.round(w * res * k)), Math.max(16, Math.round(tall * res * k))]; }

// ---- drawing (from the town) --------------------------------------------------------------------------
// Text. o: { f font family, w weight, it italic, a align, base baseline, max width, stroke, lw, ls letter spacing (px), rot, shadow }
//   (o.max squeezes the letters to that width, as the canvas does; o.bleed: true lets a line run off the canvas on purpose)
export function T(g, s, x, y, px, col, o = {}) {
  g.save();
  g.font = fontOf(px, o);
  g.textAlign = o.a ?? 'center'; g.textBaseline = o.base ?? 'middle';
  if (o.ls !== undefined) try { g.letterSpacing = o.ls + 'px'; } catch { /* older browsers */ }
  if (o.max === undefined && !o.rot && !o.bleed) {      // a line that would cross the canvas's edge is set tighter, then smaller, until it does not
    const m = g.getTransform(), CW = g.canvas?.width;
    if (CW && m.b === 0 && m.c === 0 && m.a > 0) {
      const w = g.measureText(s).width * m.a, a = g.textAlign, cx = m.a * x + m.e, pad = Math.min(6, CW * 0.015);
      const room = a === 'center' ? 2 * Math.min(cx, CW - cx) - 2 * pad : a === 'right' || a === 'end' ? cx - pad : CW - cx - pad;
      if (w > room && room > CW * 0.08) {
        let k = room / w;
        if (o.ls > 0) { const n = [...String(s)].length, bare = w - o.ls * n * m.a; try { g.letterSpacing = Math.max(0, (room - bare) / (n * m.a)) + 'px'; } catch { /* older browsers */ } k = Math.min(1, room / Math.max(bare, 1)); }
        if (k < 1) { px *= k; g.font = fontOf(px, o); if (px * m.a < 7) fitWarn('a line', s, 'is too long for its canvas: set at ' + (px * m.a).toFixed(1) + ' px'); }
      }
    }
  }
  if (o.rot) { g.translate(x, y); g.rotate(o.rot); x = 0; y = 0; }
  if (o.shadow) { g.fillStyle = o.shadow; g.fillText(s, x + (o.sx ?? px * 0.05), y + (o.sy ?? px * 0.06), o.max); }
  if (o.stroke) { g.lineJoin = 'round'; g.lineWidth = o.lw ?? px * 0.12; g.strokeStyle = o.stroke; g.strokeText(s, x, y, o.max); }
  g.fillStyle = col; g.fillText(s, x, y, o.max);
  g.restore();
}
// ---- fitting: nothing lettered may run off what it is lettered on -------------------------------------------
const fontOf = (px, o = {}) => `${o.it ? 'italic ' : ''}${o.w ?? 'normal'} ${Math.round(px * 100) / 100}px ${o.f ?? F.goudy}`;
// the width of s at px, without letter spacing (it scales with px)
function textW(g, s, px, o) { g.save(); g.font = fontOf(px, o); try { g.letterSpacing = '0px'; } catch { /* older browsers */ } const w = g.measureText(s).width; g.restore(); return w; }
// Said once for each sign whose words had to go below the size they can be read at, or be cut short
const warned = new Set();
export function fitWarn(kind, s, why) {
  const key = kind + '|' + s + '|' + why.replace(/[\d.]+/g, ''); if (warned.has(key)) return; warned.add(key);
  const text = String(s).length > 70 ? String(s).slice(0, 67) + '...' : String(s);
  console.warn(`lettering: ${kind} "${text}" ${why}`); globalThis.__signAudit?.warnings?.push({ kind, text: String(s), why });
}
const ellipsis = (g, s, px, maxW, o) => { let t = String(s).trimEnd(); while (t.length > 1 && textW(g, t + '…', px, o) > maxW) t = t.slice(0, -1).trimEnd(); return t.replace(/[\s,;:.·-]+$/, '') + '…'; };
// The lines a paragraph makes when wrapped to a width (a word longer than the width is broken)
function paraLines(g, text, px, width, o = {}) {
  g.save(); g.font = fontOf(px, o); try { g.letterSpacing = '0px'; } catch { /* older browsers */ }
  const out = [], wd = t => g.measureText(t).width;
  for (const block of String(text).split('\n')) {
    let line = '';
    for (let word of block.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (wd(t) > width && line) { out.push(line); line = word; } else line = t;
      while (wd(line) > width && line.length > 1) { let n = line.length - 1; while (n > 1 && wd(line.slice(0, n)) > width) n--; out.push(line.slice(0, n)); line = line.slice(n); }
    }
    out.push(line);
  }
  g.restore(); return out;
}
// Fit one line of lettering into a width (and a height, if it may wrap). In order: as it is, if it fits; with the
// letters set closer; in smaller type, down to `floor` (the least that can be read from where that kind of thing is
// read); on more lines, if maxH has room for them; below the floor, with a warning; cut short with an ellipsis, with
// a warning. Returns { lines, px, ls } for drawFit.
//   o: { f, w, it (the face), ls: letter spacing (px, or a function of the type size), floor, maxH, lh (1.12), maxLines,
//        wrapAt: go to more lines as soon as one line would be smaller than this (a plate reads better in two lines of
//        large type than in one of small), oldMax: the width a line was shrunk to before (what fitted is unchanged), what }
export function fit(g, s, px0, maxW, o = {}) {
  s = String(s ?? '');
  const lsOf = px => (typeof o.ls === 'function' ? o.ls(px) : o.ls), n = [...s].length, lh = o.lh ?? 1.12, floor = Math.min(px0, o.floor ?? 10);
  const w0 = textW(g, s, px0, o), wAt = px => w0 * px / px0;
  if (!s || maxW <= 0) return { lines: [s], px: px0, ls: lsOf(px0) };
  const pxOld = w0 > (o.oldMax ?? maxW) ? px0 * (o.oldMax ?? maxW) / w0 : px0;
  if (pxOld >= floor && wAt(pxOld) + (lsOf(pxOld) ?? 0) * n <= maxW + 0.5) return { lines: [s], px: pxOld, ls: lsOf(pxOld) };      // as it always was
  if (w0 <= maxW) return { lines: [s], px: px0, ls: Math.min(lsOf(px0) ?? 0, (maxW - w0) / n) };                  // closer letters
  const px1 = px0 * maxW / w0;
  if (px1 >= Math.max(floor, o.wrapAt ?? 0)) return { lines: [s], px: px1, ls: 0 };                               // smaller type
  // more lines: the split of the words into k lines whose longest line is shortest, for each k there is room for
  let best = { lines: [s], px: px1 };
  const words = s.split(' ').filter(Boolean), kMax = Math.min(o.maxLines ?? 4, words.length, o.maxH ? Math.floor(o.maxH / (floor * 0.7 * lh)) : 1);
  if (kMax >= 2) {
    const ww = words.map(w => textW(g, w, px0, o)), sp = textW(g, 'a a', px0, o) - textW(g, 'aa', px0, o), m = words.length;
    const span = (i, j) => { let t = 0; for (let q = i; q < j; q++) t += ww[q]; return t + sp * (j - i - 1); };
    for (let k = 2; k <= kMax; k++) {
      // cost[c][j]: the least longest-line for the first j words in c lines
      const cost = [new Array(m + 1).fill(Infinity)], cut = [[]]; cost[0][0] = 0;
      for (let c = 1; c <= k; c++) { cost[c] = new Array(m + 1).fill(Infinity); cut[c] = []; for (let j = c; j <= m; j++) for (let i = c - 1; i < j; i++) { const v = Math.max(cost[c - 1][i], span(i, j)); if (v < cost[c][j]) { cost[c][j] = v; cut[c][j] = i; } } }
      const lines = []; for (let c = k, j = m; c >= 1; c--) { const i = cut[c][j]; lines.unshift(words.slice(i, j).join(' ')); j = i; }
      const widest = Math.max(...lines.map(l => textW(g, l, px0, o))), px = Math.min(px0, px0 * maxW / widest, o.maxH / (k * lh));
      if (px > best.px * 1.04) best = { lines, px };
    }
  }
  if (best.px >= floor) return { ...best, ls: 0 };
  if (best.px >= floor * 0.7) { fitWarn(o.what ?? 'a sign', s, `is too long for it: set at ${best.px.toFixed(1)} px, under the ${floor.toFixed(1)} px it can be read at`); return { ...best, ls: 0 }; }
  // the last resort: as many lines as there is room for at the least size, the last cut short
  const px = floor * 0.7, lines = paraLines(g, s, px, maxW, o).slice(0, Math.max(1, o.maxH ? Math.min(o.maxLines ?? 4, Math.floor(o.maxH / (px * lh))) : 1));
  lines[lines.length - 1] = ellipsis(g, s.slice(lines.slice(0, -1).join(' ').length).trim(), px, maxW, o);
  fitWarn(o.what ?? 'a sign', s, `is far too long for it: cut short at "${lines.at(-1)}"`);
  return { lines, px, ls: 0, cut: true };
}
// Draw what fit returned, its lines centred on (x, y) (or on y alone: o.a as T's); returns the height it took
export function drawFit(g, L, x, y, col, o = {}) {
  const lh = L.px * (o.lh ?? 1.12), t = { ...o, ...(L.ls === undefined ? {} : { ls: L.ls }) };
  L.lines.forEach((s, i) => T(g, s, x, y + (i - (L.lines.length - 1) / 2) * lh, L.px, col, t));
  return L.lines.length * lh;
}
// Lines of text wrapped to a width; returns the y after the last line. o.maxY: nothing is set below it (the last
// line that fits ends with an ellipsis, and the console says so).
export function para(g, text, x, y, px, col, width, o = {}) {
  const lines = paraLines(g, text, px, width, o), lh = px * (o.lh ?? 1.28);
  g.save(); g.font = fontOf(px, o); g.textAlign = o.a ?? 'left'; g.textBaseline = 'top'; g.fillStyle = col;
  for (let i = 0; i < lines.length; i++) {
    if (o.maxY !== undefined && i < lines.length - 1 && y + lh + px > o.maxY + 0.5) { g.fillText(ellipsis(g, lines[i], px, width - px * 0.5, o), x, y); y += lh; fitWarn(o.what ?? 'a paper', text, 'is too long for it: cut short'); break; }
    g.fillText(lines[i], x, y); y += lh;
  }
  g.restore(); return y;
}
// A column of paragraphs set between y and maxY: at px if they fit, else smaller (all alike) down to floor, then
// below it with a warning, then cut short. gap: space after each paragraph, in type sizes. Returns the y after it.
export function column(g, list, x, y, px, col, width, maxY, o = {}) {
  const lh = o.lh ?? 1.28, gap = o.gap ?? 0, floor = Math.min(px, o.floor ?? 9), tall = p => list.reduce((a, s) => a + paraLines(g, s, p, width, o).length * p * lh + p * gap, 0) - p * gap - p * (lh - 1);
  let p = px; while (tall(p) > maxY - y && p > floor * 0.7) p = Math.max(floor * 0.7, p * 0.96);
  if (p < floor - 0.01) fitWarn(o.what ?? 'a paper', list.join(' / '), `has too much on it: set at ${p.toFixed(1)} px, under the ${floor.toFixed(1)} px it can be read at`);
  for (const s of list) { if (y + p > maxY + 0.5) break; y = para(g, s, x, y, p, col, width, { ...o, maxY }) + p * gap; }
  return y;
}
export const fill = (g, w, h, c) => { g.fillStyle = c; g.fillRect(0, 0, w, h); };
export const rect = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
export const disc = (g, x, y, r, c, stroke, lw) => { g.beginPath(); g.arc(x, y, r, 0, TAU); if (c) { g.fillStyle = c; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw ?? r * 0.1; g.stroke(); } };
export const line = (g, pts, c, lw = 2, close = false) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); g.strokeStyle = c; g.lineWidth = lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
export const poly = (g, pts, c) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = c; g.fill(); };
export function rrect(g, x, y, w, h, r, c, stroke, lw = 2) { g.beginPath(); g.roundRect(x, y, w, h, r); if (c) { g.fillStyle = c; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
// A little tooth and wear over whatever is there: paper, card, a painted board
export function grain(g, w, h, amt = 0.06, seed = 5) {
  const r = rnd(seed);
  for (let i = 0; i < (w * h) / 220; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,255,255'},${r() * amt})`; g.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2); }
}
export function paper(g, w, h, c = '#efe7d3', seed = 3) { fill(g, w, h, c); grain(g, w, h, 0.05, seed); }
// A sign-painter's board: flat colour, a thin lined border, a little weathering
export function board(g, w, h, c, edge, o = {}) {
  fill(g, w, h, c); grain(g, w, h, o.wear ?? 0.05, o.seed ?? 9);
  if (edge) { g.strokeStyle = edge; g.lineWidth = o.lw ?? Math.max(2, h * 0.02); const m = o.inset ?? h * 0.07; g.strokeRect(m, m, w - 2 * m, h - 2 * m); }
}
// The board's tooth: a tile of fine speckle, made once and used for every slate and every stroke of chalk.
// tile('tooth'): mostly faint, a fifth of it strong (where the slate shows through a stroke); tile('press'): a coarse
// one, stretched, for where the chalk was pressed harder or lighter.
const TILES = {};
function tile(kind) {
  if (TILES[kind]) return TILES[kind];
  const n = kind === 'tooth' ? 256 : 48, c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d'), d = g.createImageData(n, n), r = rnd(kind === 'tooth' ? 77 : 78);
  for (let i = 0; i < n * n; i++) { const v = r(), a = kind === 'tooth' ? (v < 0.2 ? 0.5 + r() * 0.45 : r() * 0.2) : r() * r(); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = 255; d.data[i * 4 + 3] = a * 255; }
  g.putImageData(d, 0, 0); return (TILES[kind] = c);
}
const GHOSTS = ['x = ?', 'Σ', '∂/∂t', 'n → ∞', '= 0', '(a + b)²', 'f(x)', '→', '∴', 'π r²', 'see p. 14', 'Tues.', 'λ', 'dx', 'k + 1', 'why?', '1/2', 'cf.'];
// A slate: charcoal with a little mottling, the broad swipes of the cloth, the ghosts of what was written before,
// dust settled toward the tray and in the corners, and the tooth of the stone.
export function slate(g, w, h, c = '#262b29', seed = 4) {
  fill(g, w, h, c); const r = rnd(seed * 7 + 3), u = h / 100;
  for (let i = 0; i < 34; i++) { g.fillStyle = i % 3 ? `rgba(255,255,255,${0.008 + r() * 0.016})` : `rgba(0,0,0,${0.03 + r() * 0.05})`; g.beginPath(); g.ellipse(r() * w, r() * h, w * (0.06 + r() * 0.22), h * (0.05 + r() * 0.16), r() * 3, 0, 7); g.fill(); }
  // what was there before, half legible, under the swipes that took it off
  g.save(); try { g.filter = `blur(${Math.max(0.6, u * 0.35).toFixed(1)}px)`; } catch { /* older browsers */ }
  for (let i = 0, n = 5 + Math.floor(r() * 5); i < n; i++) {
    const x = w * (0.04 + r() * 0.7), y = h * (0.15 + r() * 0.75); g.globalAlpha = 0.03 + r() * 0.045; g.fillStyle = g.strokeStyle = '#eceadf';
    if (r() < 0.7) { g.save(); g.translate(x, y); g.rotate((r() - 0.5) * 0.2); g.font = `600 ${(u * (7 + r() * 9)).toFixed(1)}px ${F.caveat}`; g.fillText(GHOSTS[Math.floor(r() * GHOSTS.length)], 0, 0); g.restore(); }
    else { g.lineWidth = u * 0.5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + u * 14 * (r() - 0.3), y - u * 10 * r(), x + u * (12 + r() * 30), y + u * 8 * (r() - 0.5)); g.stroke(); }
  }
  g.restore();
  // the cloth: broad soft swipes, lighter where it passed (chalk rubbed into the stone), each a few passes of different widths
  g.save(); g.lineCap = 'round';
  for (let i = 0, n = 9 + Math.floor(r() * 7); i < n; i++) {
    const x = w * (r() * 1.1 - 0.1), y = h * (0.08 + r() * 0.84), len = w * (0.12 + r() * 0.3), bow = h * (r() - 0.5) * 0.22, tilt = h * (r() - 0.5) * 0.16, wd = h * (0.07 + r() * 0.1), al = 0.009 + r() * 0.016;
    for (const k of [1, 0.72, 0.45]) { g.strokeStyle = `rgba(232,230,220,${al.toFixed(3)})`; g.lineWidth = wd * k; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y + bow, x + len, y + tilt); g.stroke(); }
  }
  g.restore();
  // dust: toward the bottom, in the corners, and a lighter band along the tray
  let gr = g.createLinearGradient(0, h * 0.55, 0, h); gr.addColorStop(0, 'rgba(236,234,224,0)'); gr.addColorStop(0.85, 'rgba(236,234,224,0.035)'); gr.addColorStop(1, 'rgba(236,234,224,0.085)'); g.fillStyle = gr; g.fillRect(0, h * 0.55, w, h * 0.45);
  for (const [x, y] of [[0, 0], [w, 0], [0, h], [w, h]]) { gr = g.createRadialGradient(x, y, 0, x, y, h * 0.3); gr.addColorStop(0, `rgba(236,234,224,${y ? 0.07 : 0.04})`); gr.addColorStop(1, 'rgba(236,234,224,0)'); g.fillStyle = gr; g.fillRect(x ? w - h * 0.3 : 0, y ? h * 0.7 : 0, h * 0.3, h * 0.3); }
  g.save(); g.globalAlpha = 0.07; g.fillStyle = g.createPattern(tile('tooth'), 'repeat'); g.translate(Math.floor(r() * 200), Math.floor(r() * 200)); g.fillRect(-200, -200, w + 200, h + 200); g.restore();
}
// Little pictures: each is drawn about (x, y) at size s (roughly its height), in colour c
export const ICON = {
  cup(g, x, y, s, c) {
    g.save(); g.translate(x, y); g.fillStyle = c; g.strokeStyle = c; g.lineWidth = s * 0.07; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-s * 0.3, -s * 0.12); g.lineTo(s * 0.22, -s * 0.12); g.quadraticCurveTo(s * 0.22, s * 0.32, -s * 0.04, s * 0.32); g.quadraticCurveTo(-s * 0.3, s * 0.32, -s * 0.3, -s * 0.12); g.fill();
    g.beginPath(); g.arc(s * 0.25, s * 0.04, s * 0.12, -1.2, 1.5); g.stroke();
    g.beginPath(); g.moveTo(-s * 0.4, s * 0.42); g.lineTo(s * 0.32, s * 0.42); g.stroke();
    for (const dx of [-0.16, 0.04]) { g.beginPath(); g.moveTo(s * dx, -s * 0.22); g.bezierCurveTo(s * (dx - 0.08), -s * 0.32, s * (dx + 0.08), -s * 0.38, s * dx, -s * 0.48); g.stroke(); }
    g.restore();
  },
  book(g, x, y, s, c, bg = '#0000') {
    g.save(); g.translate(x, y); g.strokeStyle = c; g.fillStyle = c; g.lineWidth = s * 0.06; g.lineJoin = 'round';
    for (const k of [-1, 1]) { g.beginPath(); g.moveTo(0, -s * 0.24); g.quadraticCurveTo(k * s * 0.22, -s * 0.36, k * s * 0.46, -s * 0.26); g.lineTo(k * s * 0.46, s * 0.3); g.quadraticCurveTo(k * s * 0.22, s * 0.2, 0, s * 0.32); g.closePath(); g.fill(); }
    g.strokeStyle = bg; g.lineWidth = s * 0.04; g.beginPath(); g.moveTo(0, -s * 0.24); g.lineTo(0, s * 0.32); g.stroke();
    g.restore();
  },
  leaf(g, x, y, s, c, bg = '#0000') {
    g.save(); g.translate(x, y); g.rotate(-0.5); g.fillStyle = c;
    g.beginPath(); g.moveTo(0, s * 0.46); g.bezierCurveTo(-s * 0.42, s * 0.1, -s * 0.3, -s * 0.36, 0, -s * 0.46); g.bezierCurveTo(s * 0.3, -s * 0.36, s * 0.42, s * 0.1, 0, s * 0.46); g.fill();
    g.strokeStyle = bg === '#0000' ? 'rgba(0,0,0,.3)' : bg; g.lineWidth = s * 0.03; g.beginPath(); g.moveTo(0, s * 0.46); g.lineTo(0, -s * 0.36); for (const k of [-0.2, 0, 0.2]) { g.moveTo(0, s * k + s * 0.1); g.lineTo(-s * 0.18, s * k - s * 0.04); g.moveTo(0, s * k + s * 0.1); g.lineTo(s * 0.18, s * k - s * 0.04); } g.stroke();
    g.restore();
  },
  star(g, x, y, s, c) { g.save(); g.translate(x, y); g.fillStyle = c; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, r = i % 2 ? s * 0.2 : s * 0.48; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.restore(); },
  hand(g, x, y, s, c) {                                           // a pointing hand, the kind sign-painters love
    g.save(); g.translate(x, y); g.fillStyle = c; rrect(g, -s * 0.5, -s * 0.16, s * 0.3, s * 0.34, s * 0.03, c); rrect(g, -s * 0.2, -s * 0.2, s * 0.34, s * 0.4, s * 0.1, c); rrect(g, 0, -s * 0.2, s * 0.5, s * 0.12, s * 0.06, c);
    for (let i = 0; i < 3; i++) rrect(g, 0, -s * 0.07 + i * s * 0.09, s * 0.22, s * 0.085, s * 0.04, c); g.restore();
  },
};

// ---- chalk ------------------------------------------------------------------------------------------------
// The tools a chalkboard's drawing function is given. Everything is in INCHES on the slate: (0, 0) is its top
// left corner, x to the right, y down; c.W and c.H are its size. Text is placed by its baseline, so that a
// formula can be laid out by hand: c.text returns the x where the text ended, and so do sup, sub, frac, sqrt.
// A size is the height of the line of writing (capitals are about 0.6 of it): 3 is small, 4 ordinary board
// writing, 6 a heading. o everywhere: { col, lw }.
// Real coloured chalk is pale and dusty.
export const CHALK = { white: '#eeece3', yellow: '#eadb9c', pink: '#e2aab1', blue: '#b3cadb', green: '#b9d3b1', orange: '#e7c09a' };
// Whose writing it is. jit: how unevenly the letters sit; slant; drift: how far a line wanders up or down; wob: how
// far a ruled line strays; lw: how hard the chalk is pressed; twice: how often a stroke is gone over.
export const HANDS = {
  neat: { jit: 0.55, slant: 0, drift: 0.5, wob: 0.6, lw: 1, twice: 0.06 },
  plain: { jit: 1, slant: 0.035, drift: 1, wob: 1, lw: 1, twice: 0.16 },
  hurried: { jit: 1.7, slant: 0.12, drift: 1.9, wob: 1.6, lw: 0.92, twice: 0.26 },
  bold: { jit: 0.9, slant: 0.02, drift: 0.8, wob: 0.9, lw: 1.3, twice: 0.34, firm: true },
  light: { jit: 0.8, slant: 0.06, drift: 0.9, wob: 0.8, lw: 0.86, twice: 0.05, faint: 0.9 },
};
const WHITES = ['#eeece3', '#e9e8e1', '#f1eee2', '#ebe9dc'];
// ho: { seed, hand: 'neat' | 'plain' | 'hurried' | 'bold' | 'light' (by the seed, if not given) }
export function chalkTools(g, W, H, ho = {}) {
  const R = rnd((ho.seed ?? 4) * 13 + 5), hand = HANDS[ho.hand] ?? Object.values(HANDS)[(ho.seed ?? 4) % 4], white = WHITES[(ho.seed ?? 4) % WHITES.length];
  const plain = !!globalThis.__signAudit?.cur;      // (tools/signs_audit.py measures each string whole, as it was laid out, when it paints a board itself)
  const font = (size, o = {}) => `${o.it ? 'italic ' : ''}${o.w ?? 600} ${size}px ${o.f ?? F.caveat}`;
  const pen = (o = {}) => { g.strokeStyle = g.fillStyle = o.col ?? white; g.lineWidth = (o.lw ?? 0.22) * hand.lw; g.lineCap = 'round'; g.lineJoin = 'round'; g.setLineDash(o.dash ? [o.dash, o.dash] : []); };
  // A line through points as a hand draws it: it strays a little from true, is pressed harder here and lighter there,
  // runs on a little past its end, and is sometimes gone over. o.exact: the ends are where they are given (an arrow's).
  function hand_(pts, o = {}, closed = false) {
    g.save(); pen(o);
    if (plain || pts.length < 2) { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (closed) g.closePath(); g.stroke(); g.restore(); return; }
    const src = closed ? [...pts, pts[0]] : pts, out = []; let len = 0;
    for (let i = 0; i + 1 < src.length; i++) { const [x0, y0] = src[i], [x1, y1] = src[i + 1], d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 2.2)); for (let k = i ? 1 : 0; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, len + d * k / n]); len += d; }
    const amp = Math.min(src.length > 8 ? 0.045 : 0.13, len * 0.012) * hand.wob, p1 = R() * 6.3, p2 = R() * 6.3, f1 = 0.16 + R() * 0.14, f2 = 0.5 + R() * 0.4;
    const q = out.map(([x, y, t], i) => { const a = out[Math.max(0, i - 1)], b = out[Math.min(out.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, e = amp * (Math.sin(t * f1 + p1) * 0.7 + Math.sin(t * f2 + p2) * 0.3) * (closed || o.exact ? Math.min(1, t, len - t) : 1); return [x - dy / l * e, y + dx / l * e]; });
    if (!closed && !o.exact && len > 5 && !o.dash) { const n = q.length, over = 0.08 + R() * 0.22, [ax, ay] = q[n - 2], [bx, by] = q[n - 1], l = Math.hypot(bx - ax, by - ay) || 1; q.push([bx + (bx - ax) / l * over, by + (by - ay) / l * over]); }
    const lw = g.lineWidth, base = g.globalAlpha * (hand.faint ?? 1);
    for (let i = 0; i + 1 < q.length; i += 3) { g.globalAlpha = base * (0.8 + R() * 0.2); g.lineWidth = lw * (0.86 + R() * 0.3); g.beginPath(); g.moveTo(q[i][0], q[i][1]); for (let k = i + 1; k <= Math.min(i + 3, q.length - 1); k++) g.lineTo(q[k][0], q[k][1]); g.stroke(); }
    if (len > 7 && !o.dash && R() < hand.twice) { const i0 = Math.floor(R() * q.length * 0.4), i1 = Math.min(q.length - 1, i0 + 2 + Math.floor(q.length * (0.3 + R() * 0.3))), off = 0.05 + R() * 0.05; g.globalAlpha = base * 0.5; g.lineWidth = lw * 0.9; g.beginPath(); for (let i = i0; i <= i1; i++) g[i === i0 ? 'moveTo' : 'lineTo'](q[i][0] + off, q[i][1] + off); g.stroke(); }
    g.restore();
  }
  const shade = (o, trace) => { if (!o.fill) return; g.save(); g.beginPath(); trace(); g.globalAlpha = 0.35; g.fillStyle = o.fill; g.fill(); g.restore(); };
  const c = {
    g, W, H, col: { ...CHALK, white }, hand,
    width(s, size = 4, o) { g.font = font(size, o); return g.measureText(s).width; },
    // writing: a: 'left' (default) | 'center' | 'right'; rot (radians); returns the x after the last letter.
    // Each letter is set a little off its line, its size and its slant, so that it is a hand and not a face; a
    // heading (size 5.5 and up) is gone over.
    text(s, x, y, size = 4, o = {}) {
      s = String(s); g.save(); pen(o); g.font = font(size, o); g.textBaseline = 'alphabetic'; const w = g.measureText(s).width, a = o.a ?? 'left', x0 = a === 'center' ? x - w / 2 : a === 'right' ? x - w : x;
      g.translate(x, y); if (o.rot) g.rotate(o.rot);
      if (plain) g.fillText(s, x0 - x, 0);
      else {
        const j = hand.jit, drift = (R() - 0.5) * 0.009 * hand.drift, firm = size >= 5.5 || hand.firm, al = g.globalAlpha * (hand.faint ?? 1); let i = 0, lean = hand.slant + (R() - 0.5) * 0.03;
        for (const ch of s) {
          const cx = x0 - x + (i ? g.measureText(s.slice(0, i)).width : 0); i += ch.length; if (ch === ' ') { lean = hand.slant + (R() - 0.5) * 0.03; continue; }
          const k = 1 + (R() - 0.5) * 0.06 * j;
          g.save(); g.translate(cx + (R() - 0.5) * size * 0.022 * j, drift * (cx - (x0 - x)) + (R() - 0.5) * size * 0.04 * j); g.transform(1, 0, -(lean + (R() - 0.5) * 0.04 * j), 1, 0, 0); g.rotate((R() - 0.5) * 0.035 * j); g.scale(k, k);
          g.globalAlpha = al * (0.84 + R() * 0.16); g.fillText(ch, 0, 0);
          if (firm || R() < hand.twice * 0.35) { g.globalAlpha = al * 0.5; g.fillText(ch, size * 0.014, -size * 0.008); }
          g.restore();
        }
      }
      g.restore(); return x0 + w;
    },
    // several lines under one another, `lead` apart (default 1.15 of the size); returns the y of the next line
    lines(list, x, y, size = 4, o = {}) { const lead = o.lead ?? size * 1.15; for (const s of list) { c.text(s, x, y, size, o); y += lead; } return y; },
    sup(s, x, y, size = 4, o) { return c.text(s, x + size * 0.03, y - size * 0.38, size * 0.62, o); },
    sub(s, x, y, size = 4, o) { return c.text(s, x + size * 0.02, y + size * 0.18, size * 0.62, o); },
    // a fraction standing at x with its bar on the writing's middle line; returns the x after it
    frac(num, den, x, y, size = 4, o = {}) {
      const s2 = size * 0.82, w = Math.max(c.width(num, s2, o), c.width(den, s2, o)) + size * 0.3, mid = y - size * 0.24;
      c.text(num, x + w / 2, mid - size * 0.2, s2, { ...o, a: 'center' }); c.text(den, x + w / 2, mid + size * 0.72, s2, { ...o, a: 'center' });
      c.line(x, mid, x + w, mid, { ...o, exact: true }); return x + w + size * 0.12;
    },
    // a square root over some writing; returns the x after it
    sqrt(s, x, y, size = 4, o = {}) {
      const w = c.width(s, size, o), top = y - size * 0.78;
      c.path([[x, y - size * 0.3], [x + size * 0.12, y - size * 0.36], [x + size * 0.26, y + size * 0.05], [x + size * 0.42, top], [x + size * 0.5 + w, top]], o);
      c.text(s, x + size * 0.47, y, size, o); return x + size * 0.58 + w;
    },
    line(x0, y0, x1, y1, o) { hand_([[x0, y0], [x1, y1]], o); },
    arrow(x0, y0, x1, y1, o = {}) {
      const t = Math.atan2(y1 - y0, x1 - x0), h = o.head ?? 1.1; hand_([[x0, y0], [x1, y1]], { ...o, exact: true });
      hand_([[x1 - h * Math.cos(t - 0.42), y1 - h * Math.sin(t - 0.42)], [x1, y1], [x1 - h * Math.cos(t + 0.42), y1 - h * Math.sin(t + 0.42)]], { ...o, exact: true });
    },
    // a line through points [[x, y], ...]; close: true joins the ends; fill: a colour fills it (faintly, as chalk laid on its side)
    path(pts, o = {}) { shade(o, () => { pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); }); hand_(pts, o, !!o.close); },
    // the same, rounded: a smooth curve through the points
    curve(pts, o = {}) {
      const trace = () => { g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2); g.lineTo(pts.at(-1)[0], pts.at(-1)[1]); if (o.close) g.closePath(); };
      shade(o, trace);
      const q = [pts[0]]; let [px, py] = pts[0];      // the same curve as points, for the hand
      for (let i = 1; i < pts.length - 1; i++) { const [cx, cy] = pts[i], ex = (cx + pts[i + 1][0]) / 2, ey = (cy + pts[i + 1][1]) / 2; for (let k = 1; k <= 6; k++) { const t = k / 6; q.push([(1 - t) * (1 - t) * px + 2 * t * (1 - t) * cx + t * t * ex, (1 - t) * (1 - t) * py + 2 * t * (1 - t) * cy + t * t * ey]); } px = ex; py = ey; }
      q.push(pts.at(-1)); hand_(q, { ...o, exact: true }, !!o.close);
    },
    // a circle as a hand draws one: not quite round, and its ends do not quite meet
    circle(x, y, r, o = {}) {
      const ry = o.ry ?? r; shade(o, () => g.ellipse(x, y, r, ry, 0, 0, TAU));
      if (plain || Math.max(r, ry) < 0.7) { g.save(); pen(o); g.beginPath(); g.ellipse(x, y, r, ry, 0, 0, TAU); g.stroke(); g.restore(); return; }
      const a0 = R() * TAU, sweep = TAU + (R() - 0.35) * 0.3, n = Math.max(14, Math.round(Math.max(r, ry) * 3)), ph = R() * TAU, e = 0.025 * hand.wob, q = [];
      for (let i = 0; i <= n; i++) { const a = a0 + sweep * i / n, k = 1 + e * Math.sin(2 * a + ph) + 0.03 * hand.wob * (i / n - 0.5); q.push([x + Math.cos(a) * r * k, y + Math.sin(a) * ry * k]); }
      hand_(q, { ...o, exact: true });
    },
    arc(x, y, r, a0, a1, o) { const n = Math.max(6, Math.round(Math.abs(a1 - a0) * r * 0.6)), q = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; q.push([x + Math.cos(a) * r, y + Math.sin(a) * r]); } hand_(q, { ...o, exact: true }); },
    rect(x, y, w, h, o = {}) { c.path([[x, y], [x + w, y], [x + w, y + h], [x, y + h]], { ...o, close: true }); },
    dot(x, y, r = 0.3, o) { g.save(); pen(o); g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.restore(); },
    underline(x0, x1, y, o) { c.line(x0, y + 0.5, x1, y + 0.5, o); },
    // axes with their origin at the bottom left of the box (x, y, w, h); o: { xl, yl: labels, size }
    axes(x, y, w, h, o = {}) {
      c.arrow(x, y + h, x + w, y + h, o); c.arrow(x, y + h, x, y, o);
      if (o.xl) c.text(o.xl, x + w, y + h + (o.size ?? 3) * 0.95, o.size ?? 3, { ...o, a: 'right' }); if (o.yl) c.text(o.yl, x - 0.6, y + (o.size ?? 3) * 0.3, o.size ?? 3, { ...o, a: 'right' });
    },
    // the graph of fn over [x0, x1] drawn in the box (x, y, w, h), whose height spans [y0, y1]
    plot(fn, x, y, w, h, o = {}) {
      const { x0 = 0, x1 = 1, y0 = 0, y1 = 1, n = 48 } = o, pts = [];
      for (let i = 0; i <= n; i++) { const u = x0 + (x1 - x0) * i / n, v = fn(u); if (Number.isFinite(v)) pts.push([x + w * i / n, y + h - h * Math.max(-0.05, Math.min(1.05, (v - y0) / (y1 - y0)))]); }
      c.path(pts, { ...o, exact: true });
    },
    // a patch wiped with the rubber: what was there is half gone, and a smear of its dust is left
    smudge(x, y, w, h, k = 0.7) { g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = k; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, TAU); g.fill(); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.045; g.fillStyle = white; g.fill(); g.restore(); },
  };
  return c;
}
// The painter of a slate w by tall feet: draw(c, g) is given the chalk tools (above) and the raw 2D context,
// both in inches. The chalk is drawn on a layer of its own; the board's tooth is then taken out of it (a fine speckle,
// and broader patches where the chalk pressed lighter), so that it reads as chalk and not as paint, and it is laid
// over the slate on a soft halo of its own dust. o: { ground, seed, hand }
export function chalkPainter(w, tall, draw, o = {}) {
  return (g, W, H) => {
    const seed = o.seed ?? 4, r = rnd(seed + 11);
    slate(g, W, H, o.ground ?? '#262b29', seed);
    const L = document.createElement('canvas'); L.width = W; L.height = H; const lg = L.getContext('2d'), u = W / (w * 12);
    lg.save(); lg.scale(u, u);
    try { draw(chalkTools(lg, w * 12, tall * 12, { seed, hand: o.hand }), lg); } catch (e) { console.warn('chalkboard', e); }
    lg.restore();
    g.save(); try { g.filter = `blur(${Math.max(1, u * 0.28).toFixed(1)}px)`; } catch { /* older browsers */ } g.globalAlpha = 0.2; g.drawImage(L, 0, 0); g.restore();      // the dust beside heavy marks
    lg.globalCompositeOperation = 'destination-out';
    lg.save(); lg.translate(-Math.floor(r() * 250), -Math.floor(r() * 250)); lg.fillStyle = lg.createPattern(tile('tooth'), 'repeat'); lg.globalAlpha = 0.85; lg.fillRect(0, 0, W + 250, H + 250); lg.restore();
    lg.save(); lg.imageSmoothingEnabled = true; lg.globalAlpha = 0.5; lg.translate(-r() * 100, -r() * 100); lg.scale(7, 7); lg.fillStyle = lg.createPattern(tile('press'), 'repeat'); lg.fillRect(0, 0, W / 7 + 20, H / 7 + 20); lg.restore();
    g.globalAlpha = 0.97; g.drawImage(L, 0, 0); g.globalAlpha = 1; L.width = L.height = 0;
  };
}

// ---- lettered things: painters ------------------------------------------------------------------------
// The least type (px) that can be read on each kind of thing, from its resolution in pixels per foot: a door plate
// is read from 2 to 6 ft (letters 0.07 ft), a large sign from 6 to 30 (0.12 ft), paper from 2 ft (half an inch)
// and a poster from 3 or 4 (0.06 ft).
const FLOOR = { plate: res => (res >= 200 ? 0.07 : 0.12) * res, paper: res => Math.max(8, (res >= 200 ? 0.042 : 0.06) * res) };
// A door plate or a small sign: one line (and an optional smaller second line, `sub`) centred on a ground.
//   style 'brass' (dark letters cut into brass), 'engraved' (letters cut into pale stone or wood: give ground),
//   'painted' (a sign-painter's board: ground, ink and a lined border), 'enamel' (white letters on dark enamel)
// The type is sized from the plate's height and then from its width: a name too long for one line is set closer,
// then smaller, then (with no `sub`) on two lines.
export function platePainter(text, o = {}) {
  const style = o.style ?? 'brass';
  const P = { brass: ['#b99a55', '#2a2118'], engraved: ['#cfc6b3', '#5a5347'], painted: ['#27382f', '#e9dfc4'], enamel: ['#1f2a36', '#f1ece0'] }[style] ?? ['#b99a55', '#2a2118'];
  const ground = o.ground ?? P[0], ink = o.ink ?? P[1];
  return (g, W, H) => {
    if (style === 'brass') { const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#c9ab63'); gr.addColorStop(0.5, ground); gr.addColorStop(1, '#9c8044'); g.fillStyle = gr; g.fillRect(0, 0, W, H); grain(g, W, H, 0.05, 7); }
    else if (style === 'painted') board(g, W, H, ground, ink, { inset: H * 0.09, lw: Math.max(1.5, H * 0.018) });
    else { fill(g, W, H, ground); grain(g, W, H, 0.05, 7); }
    if (style === 'enamel') { g.strokeStyle = ink; g.lineWidth = Math.max(1.5, H * 0.02); g.strokeRect(H * 0.07, H * 0.07, W - H * 0.14, H - H * 0.14); }
    const f = { f: o.f ?? F.goudy, it: o.it }, max = Math.max(W - H * 0.5, W * 0.6), floor = FLOOR.plate(o.res ?? RES.plate), y = o.sub ? H * 0.4 : H * 0.53;
    const L = fit(g, text, H * (o.sub ? 0.4 : 0.52), max, { ...f, ls: o.ls ?? H * (o.sub ? 0.035 : 0.045), oldMax: max * 0.94, floor, wrapAt: o.sub ? 0 : H * 0.3, maxH: o.sub ? H * 0.42 : H * 0.72, maxLines: o.sub ? 1 : 3, lh: 1.06, what: 'the plate' });
    if (style === 'brass' || style === 'engraved') { drawFit(g, L, W / 2, y + L.px * 0.035, 'rgba(255,255,255,.4)', { ...f, lh: 1.06 }); drawFit(g, L, W / 2, y - L.px * 0.02, 'rgba(0,0,0,.35)', { ...f, lh: 1.06 }); }      // the cut catches the light below and is dark above
    drawFit(g, L, W / 2, y, ink, { ...f, lh: 1.06 });
    if (o.sub) drawFit(g, fit(g, o.sub, H * 0.2, max, { it: true, floor: floor * 0.75, what: 'the plate' }), W / 2, H * 0.74, ink, { f: F.goudy, it: true });
    if (style === 'brass') for (const [x, yy] of [[H * 0.16, H * 0.16], [W - H * 0.16, H * 0.16], [H * 0.16, H * 0.84], [W - H * 0.16, H * 0.84]]) { disc(g, x, yy, H * 0.045, '#8a7038'); line(g, [[x - H * 0.03, yy - H * 0.02], [x + H * 0.03, yy + H * 0.02]], '#5e4a22', Math.max(1, H * 0.012)); }
  };
}
const pins = (g, W, H, col = '#8a2f25') => { for (const x of [W * 0.5]) { disc(g, x, Math.max(5, H * 0.035), Math.max(2.5, W * 0.018), col); disc(g, x - 1, Math.max(5, H * 0.035) - 1, Math.max(1, W * 0.006), 'rgba(255,255,255,.5)'); } };
// A notice: a heading, a rule, and a few lines, on cream paper with a pin through its head.
//   { title, lines: ['...'], foot, colour (paper), ink, hand: true (written by hand instead of printed) }
// The heading is fitted to the paper's width (on two lines if need be); the lines wrap, and if there are too many
// for the paper they are all set smaller.
export function noticePainter(o = {}) {
  return (g, W, H) => {
    paper(g, W, H, o.colour ?? '#efe7d3', o.seed ?? 3); const ink = o.ink ?? '#2a1c13', m = W * 0.1, f = o.hand ? { f: F.caveat, w: 600 } : { f: F.goudy }, floor = FLOOR.paper(o.res ?? RES.paper);
    let y = H * 0.13;
    if (o.title) { const L = fit(g, o.title, H * 0.085, W - 2 * m, { ...f, ls: px => (o.hand ? 0 : px * 0.06), floor: floor * 1.2, maxH: H * 0.24, maxLines: 2, what: 'the notice' }), px = L.px, more = (L.lines.length - 1) * px * 1.12; drawFit(g, L, W / 2, y + px / 2 + more / 2, ink, f); y += px * 1.5 + more; rect(g, m, y, W - 2 * m, Math.max(1, H * 0.004), ink); y += H * 0.045; }
    const px = o.px ?? H * (o.hand ? 0.062 : 0.05), foot = o.foot ? fit(g, o.foot, H * 0.042, W - 2 * m, { it: true, floor: floor * 0.8, what: 'the notice' }) : null;
    column(g, o.lines ?? [], m, y, px, ink, W - 2 * m, foot ? H * 0.93 - foot.px * 0.9 : H * 0.97, { ...f, lh: 1.3, gap: 0.35, floor, what: 'the notice' });
    if (foot) T(g, foot.lines[0], W - m, H * 0.93, foot.px, ink, { f: F.goudy, it: true, a: 'right' });
    pins(g, W, H);
  };
}
// A timetable: { title, cols: ['', 'Mon', ...], rows: [['9', 'Phonetics', ...], ...], colour, ink, accent }
// Every cell is fitted to its own box: smaller, then on two or three lines.
export function timetablePainter(o = {}) {
  return (g, W, H) => {
    paper(g, W, H, o.colour ?? '#efe7d3', o.seed ?? 6); const ink = o.ink ?? '#2a1c13', acc = o.accent ?? '#7a2f2a', m = W * 0.06, cols = o.cols ?? [], rows = o.rows ?? [], floor = FLOOR.paper(o.res ?? RES.paper);
    let y = H * 0.07;
    if (o.title) { const L = fit(g, o.title, H * 0.07, W - 2 * m, { ls: px => px * 0.08, floor: floor * 1.2, what: 'the timetable' }); T(g, L.lines[0], W / 2, y + L.px / 2, L.px, acc, { ls: L.ls }); y += L.px * 1.7; }
    const n = Math.max(cols.length, ...rows.map(r => r.length), 1), first = (W - 2 * m) * (n > 1 ? 0.14 : 1), cw = n > 1 ? (W - 2 * m - first) / (n - 1) : 0, rh = (H * 0.95 - y) / (rows.length + 1);
    const cx = i => (i === 0 ? m + first / 2 : m + first + cw * (i - 0.5)), px = Math.min(rh * 0.42, cw ? cw * 0.2 : rh);
    const cell = (s, i, yy, p, col, fo) => drawFit(g, fit(g, s, p, (i ? cw : first) * 0.9, { ...fo, floor: Math.min(floor, px), maxH: rh * 0.9, maxLines: 3, lh: 1.05, what: 'the timetable' }), cx(i), yy, col, { ...fo, lh: 1.05 });
    cols.forEach((s, i) => { if (s) cell(s, i, y + rh / 2, px * 1.05, acc, { ls: px * 0.04 }); });
    g.strokeStyle = ink; g.lineWidth = Math.max(1, H * 0.003);
    for (let r = 0; r <= rows.length; r++) { const yy = y + rh * (r + 1); g.globalAlpha = r === 0 ? 0.9 : 0.35; g.beginPath(); g.moveTo(m, yy); g.lineTo(W - m, yy); g.stroke(); }
    g.globalAlpha = 0.35; for (let i = 1; i < n; i++) { const xx = m + first + cw * (i - 1); g.beginPath(); g.moveTo(xx, y + rh * 0.2); g.lineTo(xx, y + rh * (rows.length + 1)); g.stroke(); } g.globalAlpha = 1;
    rows.forEach((row, r) => row.forEach((s, i) => { if (s) cell(s, i, y + rh * (r + 1.5), px, ink, i ? {} : { it: true }); }));
    pins(g, W, H);
  };
}
// A poster: a large title, a line under it and a few lines of detail, on a coloured sheet with a ruled border.
//   { title, sub, lines, foot, colour, ink, accent, f (the title's face: F.fraunces by default) }
// Each line of the title is fitted to the sheet's width; if the whole is too tall for the sheet, the detail is set
// smaller, and then the title.
export function posterPainter(o = {}) {
  return (g, W, H) => {
    paper(g, W, H, o.colour ?? '#e9dfc4', o.seed ?? 8); const ink = o.ink ?? '#2a1c13', acc = o.accent ?? '#7a2f2a', m = W * 0.09, floor = FLOOR.paper(o.res ?? RES.poster), tf = { f: o.f ?? F.fraunces, w: 600 };
    g.strokeStyle = ink; g.lineWidth = Math.max(1.5, W * 0.006); g.strokeRect(m * 0.5, m * 0.5, W - m, H - m);
    const foot = o.foot ? fit(g, o.foot, H * 0.04, W - 2 * m, { ls: H * 0.004, floor: floor * 0.8, what: 'the poster' }) : null, bottom = foot ? H * 0.9 - foot.px * 0.8 : H - m * 0.5 - H * 0.02;
    const titles = String(o.title ?? '').split('\n'), body = o.lines ?? [], bp0 = o.px ?? H * 0.045;
    // the whole of it at a title scale k and a detail size bp: draw it, or only measure it; returns the y it ends at
    const flow = (k, bp, draw) => {
      let y = H * 0.14;
      for (const s of titles) { const L = fit(g, s, H * 0.13 * k, W - 2 * m, { ...tf, floor: floor * 1.6, wrapAt: H * 0.062 * k, maxH: H * 0.2 * k, maxLines: 2, what: 'the poster' }), tall = L.lines.length * L.px * 1.12; if (draw) drawFit(g, L, W / 2, y + L.px / 2 + (tall - L.px * 1.12) / 2, acc, tf); y += tall; }
      if (o.sub) { y += H * 0.015; const L = fit(g, o.sub, H * 0.055 * Math.max(k, 0.8), W - 2 * m, { it: true, floor, maxH: H * 0.13, maxLines: 2, what: 'the poster' }), tall = L.lines.length * L.px * 1.12; if (draw) drawFit(g, L, W / 2, y + L.px / 2 + (tall - L.px * 1.12) / 2, ink, { it: true }); y += tall + L.px * 0.48; }
      if (draw) rect(g, W * 0.3, y, W * 0.4, Math.max(1, H * 0.004), ink); y += H * 0.05;
      for (const s of body) y = (draw ? para(g, s, W / 2, y, bp, ink, W - 2 * m, { a: 'center', lh: 1.3, maxY: bottom, what: 'the poster' }) : y + paraLines(g, s, bp, W - 2 * m).length * bp * 1.3) + H * 0.012;
      return y - H * 0.012 - bp * 0.3;
    };
    let k = 1, bp = bp0; const low = Math.min(bp0, floor);
    while (flow(k, bp) > bottom && bp > low) bp = Math.max(low, bp * 0.96);
    while (flow(k, bp) > bottom && k > 0.6) k -= 0.04;
    while (flow(k, bp) > bottom && bp > low * 0.7) bp = Math.max(low * 0.7, bp * 0.96);
    if (bp < low - 0.01) fitWarn('the poster', String(o.title ?? '').replace(/\n/g, ' '), `has too much on it: its lines are set at ${bp.toFixed(1)} px, under the ${low.toFixed(1)} px they can be read at`);
    flow(k, bp, true);
    if (foot) T(g, foot.lines[0], W / 2, H * 0.9, foot.px, ink, { ls: foot.ls });
  };
}

// Every lettered thing made here is marked (on the kit's record of it) with what it is, its whole size on the wall
// (ow by oh ft, frame and all) and, when tools/signs_audit.py is looking, where in the furnish files it was made.
export function tag(K, n0, t) { const at = globalThis.__signAudit ? new Error().stack : undefined; for (let i = n0; i < K.extras.length; i++) K.extras[i].tag ??= { ...t, at }; }

// ---- the things themselves, on a kit frame that lies ON a wall (y = 0 the wall, +y into the room) -------------
// Each takes the kit K, the wall's frame f, and the CENTRE of the thing: x along the wall, z above the frame.
// Nothing here shares a plane with the wall or with its own parts.

// A framed slate: w by tall feet of slate, a wooden frame round it, a chalk tray under it with chalk and a rubber.
//   draw(c, g)   the writing (chalk tools above, in inches)
//   o: { frame: paint for the wood ('c#4d3a2b'), border: its width (0.24), tray: false for none, ground: the
//        slate's colour ('#262b29' black, '#2c3a33' green), res, seed }
export function chalkboard(K, f, x, z, w, tall, draw, o = {}) {
  const wood = o.frame ?? 'c#4d3a2b/0.6', b = o.border ?? 0.24, x0 = x - w / 2, x1 = x + w / 2, z0 = z - tall / 2, z1 = z + tall / 2;
  f.box('c#1f2321/0.9', x0, x1, 0.03, 0.07, z0, z1);                                  // what the slate is fixed to (seen until the writing is painted)
  f.box(wood, x0 - b, x1 + b, 0.02, 0.17, z1, z1 + b); f.box(wood, x0 - b, x1 + b, 0.02, 0.17, z0 - b, z0);          // rails
  f.box(wood, x0 - b, x0, 0.02, 0.17, z0, z1); f.box(wood, x1, x1 + b, 0.02, 0.17, z0, z1);                          // stiles
  const seed = o.seed ?? (Math.round(w * 97 + tall * 31 + x * 13 + z * 7) + K.extras.length * 3);      // each board its own slate and its own hand
  if (o.tray !== false) {
    f.box(wood, x0 - b * 0.5, x1 + b * 0.5, 0.17, 0.5, z0 - b * 0.62, z0 - b * 0.62 + 0.07); f.box(wood, x0 - b * 0.5, x1 + b * 0.5, 0.45, 0.5, z0 - b * 0.62 + 0.07, z0 - b * 0.62 + 0.12);
    const zt = z0 - b * 0.62 + 0.07, r = rnd(seed), CH = ['c#eeece3/0.95', 'c#eadb9c/0.95', 'c#eeece3/0.95', 'c#e2aab1/0.95', 'c#b3cadb/0.95', 'c#e9e8e1/0.95'];
    f.box('c#d9d7cd/0.98', x0 + 0.1, x1 - 0.1, 0.2, 0.44, zt, zt + 0.016);                                                    // dust lying in the tray (thick enough to stand clear of the tray's top: a skin of it flickered)
    for (let i = 0, n = Math.max(3, Math.min(7, Math.round(w * 0.6))); i < n; i++) { const cx = x0 + 0.4 + r() * (w - 1.9), len = r() < 0.35 ? 0.07 + r() * 0.06 : 0.2 + r() * 0.1, y = 0.23 + r() * 0.14; f.box(CH[Math.floor(r() * CH.length)], cx, cx + len, y, y + 0.04, zt + 0.004, zt + 0.045 + (i % 3) * 0.012); }      // sticks of chalk, some broken (not all of a height: two that overlap would share a top and flicker)
    const ex = x1 - 0.9; f.box('c#6b5440/0.8', ex, ex + 0.42, 0.22, 0.4, zt + 0.004, zt + 0.07); f.box('c#3a3a3c/0.95', ex + 0.01, ex + 0.41, 0.23, 0.39, zt + 0.07, zt + 0.12); f.box('c#a9a79f/0.98', ex + 0.04, ex + 0.38, 0.25, 0.37, zt + 0.12, zt + 0.124);      // the rubber: wood back, felt, and the dust on it
    if (w > 6) { const cx = x0 + 0.35 + r() * 0.5; f.box('c#c9c3b2/0.98', cx, cx + 0.5, 0.21, 0.42, zt + 0.004, zt + 0.03); f.box('c#bdb7a6/0.98', cx + 0.04, cx + 0.46, 0.23, 0.4, zt + 0.03, zt + 0.05); }      // a cloth, folded
    if (w > 10) { const e2 = x0 + w * 0.45 + r() * 1.2; f.box('c#6b5440/0.8', e2, e2 + 0.42, 0.24, 0.42, zt + 0.004, zt + 0.07); f.box('c#3a3a3c/0.95', e2 + 0.01, e2 + 0.41, 0.25, 0.41, zt + 0.07, zt + 0.12); }      // a second rubber on a long board
  }
  const [cw, ch] = canvasSize(w, tall, o.res ?? RES.chalkboard), n0 = K.extras.length;
  K.sign(f, x, 0.09, z, w, tall, chalkPainter(w, tall, draw, { ...o, seed }), { cw, ch, rough: 0.97 });
  tag(K, n0, { kind: 'chalkboard', ow: w + 2 * b, oh: tall + 2 * b + (o.tray !== false ? b * 0.62 : 0), dz: o.tray !== false ? -b * 0.31 : 0, proud: 0.5 });
}
// Anything drawn, on a wall: draw(g, W, H) paints a canvas of W by H pixels (worked out from the size and o.res).
//   o: { res (pixels per foot: RES.sign), y: how far off the wall (0.03, or on the face of its board),
//        board: a material for a board behind it (thick: 0.06 deep, lip: how far the board shows round the drawing),
//        rough (0.85 matt; 0.35 for brass, enamel, glazed), flat: true lies face up at height z (w along x, tall along y), turn,
//        tilt: radians it leans back from upright (a card on a rail, a label standing in a case: 0.3 to 0.6) }
export function sign(K, f, x, z, w, tall, draw, o = {}) {
  const [cw, ch] = canvasSize(w, tall, o.res ?? RES.sign), th = o.board ? (o.thick ?? 0.06) : 0, lip = o.lip ?? 0, n0 = K.extras.length;
  if (o.board && !o.flat) f.box(o.board, x - w / 2 - lip, x + w / 2 + lip, 0.012, 0.012 + th, z - tall / 2 - lip, z + tall / 2 + lip);
  if (o.flat) K.sign(f, x, o.y ?? 0, z, w, tall, draw, { cw, ch, rough: o.rough ?? 0.85, flat: true, turn: o.turn });
  else K.sign(f, x, o.y ?? (o.board ? 0.012 + th + 0.012 : 0.03), z, w, tall, draw, { cw, ch, rough: o.rough ?? 0.85, turn: o.turn, tilt: o.tilt });
  tag(K, n0, { kind: o.kind ?? 'sign', text: o.text, ow: w + 2 * lip, oh: tall + 2 * lip });
}
// A door plate or small lettered sign (platePainter): text, and o: { w (1.3), tall (0.36), style, sub, ground, ink }
export function plate(K, f, x, z, text, o = {}) {
  const w = o.w ?? 1.3, tall = o.tall ?? (o.sub ? 0.5 : 0.36), style = o.style ?? 'brass';
  const body = { brass: 'c#b08d4a/0.35/1', engraved: 'c#bdb5a3/0.8', painted: 'c#27382f/0.6', enamel: 'c#1f2a36/0.3' }[style];
  const res = o.res ?? (Math.max(w, tall) > 3 ? RES.sign : RES.plate);
  sign(K, f, x, z, w, tall, platePainter(text, { ...o, res }), { kind: 'plate', text: text + (o.sub ? ' / ' + o.sub : ''), res, board: o.body ?? body, thick: style === 'engraved' ? 0.08 : 0.03, lip: style === 'brass' || style === 'enamel' ? 0 : 0.03, rough: style === 'brass' || style === 'enamel' ? 0.35 : 0.85 });
}
// Paper on a wall. what: a drawing function (g, W, H), or { kind: 'notice' | 'timetable' | 'poster', ... } (the painters above).
export function paperOn(K, f, x, z, w, tall, what, o = {}) {
  const res = o.res ?? (Math.max(w, tall) > 2.2 ? RES.poster : RES.paper), wh = typeof what === 'function' ? null : { ...what, res };
  const draw = !wh ? what : wh.kind === 'timetable' ? timetablePainter(wh) : wh.kind === 'poster' ? posterPainter(wh) : noticePainter(wh);
  sign(K, f, x, z, w, tall, draw, { res, y: o.y ?? 0.03, rough: 0.9, ...o, kind: wh ? wh.kind ?? 'notice' : 'paper', text: wh?.title });
}
