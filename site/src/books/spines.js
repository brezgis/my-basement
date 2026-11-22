// Printed spines. Each TITLE is painted once, into a cell of a shared sheet, and every copy of it on every shelf
// draws that cell: so twenty thousand spines cost the texture memory of the sixteen hundred titles, and the far
// end of a room is the same paint as the shelf under your nose, only smaller (the sheets have mipmaps).
// The painter is the house's (its life.js), with one change: which lettering, rules and label a book has comes
// from the book itself, not from the order of painting, so a book looks the same wherever it stands.
//
//   const sheets = makeSpineSheets(THREE, recs, { maxSize });
//   sheets.cell(rec)  ->  { sheet, u0, u1, v0, v1 }      the spine, upright: u across its thickness, v1 its head
//   sheets.white(i)   ->  [u, v]                         a white texel of sheet i (for faces coloured by vertex)
//   sheets.textures[i], sheets.materials[i]

import { bookKey, hash } from './catalogue.js';

const CW = 32, CH = 256, TALL = 3328;      // a spine's cell; the tallest a sheet may be (13 rows)
const FONTS = ['Georgia, serif', '"Palatino Linotype", Palatino, serif', 'Helvetica, Arial, sans-serif', '"Gill Sans", "Trebuchet MS", sans-serif', '"Times New Roman", serif'];
export const CREAM = '#e9e2d0';

// One spine, into g at (cx, cy), CW by CH.
export function paintSpine(g, rec, cx, cy) {
  let seed = hash('s' + bookKey(rec)) || 1; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const hex = /^#[0-9a-f]{6}$/i.test(rec.colour ?? '') ? rec.colour : '#6b2a25', rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2], ink = lum > 0.5 ? '#1c1a17' : '#f1e9d6';
  g.fillStyle = hex; g.fillRect(cx, cy, CW, CH);
  const sh = g.createLinearGradient(cx, 0, cx + CW, 0); sh.addColorStop(0, 'rgba(0,0,0,.28)'); sh.addColorStop(0.18, 'rgba(0,0,0,0)'); sh.addColorStop(0.82, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,.3)');
  g.fillStyle = sh; g.fillRect(cx, cy, CW, CH);
  const style = Math.floor(r() * 4);
  g.fillStyle = ink; g.globalAlpha = 0.75;
  if (style === 0) { g.fillRect(cx + 3, cy + 16, CW - 6, 1.5); g.fillRect(cx + 3, cy + CH - 18, CW - 6, 1.5); }
  if (style === 1) { g.fillRect(cx, cy + 12, CW, 5); g.fillRect(cx, cy + CH - 17, CW, 5); }
  if (style === 2) { g.globalAlpha = 0.9; g.fillStyle = lum > 0.5 ? '#f1e9d6' : '#1c1a17'; g.fillRect(cx, cy + 30, CW, CH - 96); g.fillStyle = lum > 0.5 ? '#1c1a17' : '#f1e9d6'; }
  g.globalAlpha = 1;
  const title = rec.spine_title ?? rec.title, author = (rec.author ?? '').split(/[ ,]+/).filter(Boolean).pop() ?? '';
  g.save(); g.beginPath(); g.rect(cx, cy, CW, CH); g.clip();
  g.translate(cx + CW / 2, cy + CH / 2); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
  const font = FONTS[Math.floor(r() * FONTS.length)], weight = r() < 0.5 ? 'bold ' : '';
  // The author sits at the foot and the title in what is left, so the two never meet; a long title takes two lines.
  const width = t => g.measureText(t).width, fit = (t, max, hi, lo, w = weight) => { let p = hi; g.font = `${w}${p}px ${font}`; while (width(t) > max && p > lo) { p--; g.font = `${w}${p}px ${font}`; } return p; };
  const END = CH / 2 - 22, by = author.toUpperCase().slice(0, 14);
  const aPx = by ? fit(by, style === 2 ? 38 : 84, 10, 7, '') : 0, aW = by && width(by) <= (style === 2 ? 38 : 84) ? width(by) : 0;
  const T0 = style === 2 ? -92 : -END, T1 = style === 2 ? 56 : aW ? END - aW - 10 : END, room = T1 - T0;
  let lines = [title], px = fit(title, room, 17, 8);
  if ((px < 11 || width(title) > room) && title.includes(' ')) {
    let cut = -1; for (let k = 0; k < title.length; k++) if (title[k] === ' ' && (cut < 0 || Math.abs(k - title.length / 2) < Math.abs(cut - title.length / 2))) cut = k;
    lines = [title.slice(0, cut), title.slice(cut + 1)]; px = Math.min(fit(lines[0], room, 12, 7), fit(lines[1], room, 12, 7));
  }
  g.font = `${weight}${px}px ${font}`;
  lines = lines.map(t => { while (t.length > 4 && width(t) > room) t = t.slice(0, -2).trimEnd() + '…'; return t; });
  lines.forEach((t, k) => g.fillText(t, (T0 + T1) / 2, 1 + (k - (lines.length - 1) / 2) * (px + 1)));
  if (aW) { g.font = `${aPx}px ${font}`; g.globalAlpha = 0.85; g.textAlign = 'right'; g.fillText(by, END, 1); }
  g.restore(); g.globalAlpha = 1;
}

export function makeSpineSheets(THREE, recs, o = {}) {
  // one sheet 4096 wide where the card can (every card that can draw this place can; 2048 is kept for the rest):
  // each sheet is a draw call in every room that has its books
  const W = (o.maxSize ?? 4096) >= 4096 ? 4096 : 2048, COLS = W / CW, PER = COLS * (TALL / CH) - 1;      // (the last cell of each sheet is the white one)
  const uniq = [...new Set(recs)], n = Math.max(1, Math.ceil(uniq.length / PER)), cells = new Map(), textures = [], materials = [], whites = [];
  for (let s = 0; s < n; s++) {
    const batch = uniq.slice(s * PER, (s + 1) * PER), rows = Math.ceil((batch.length + 1) / COLS), H = rows * CH;
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'); g.fillStyle = CREAM; g.fillRect(0, 0, W, H);
    batch.forEach((rec, i) => {
      const cx = (i % COLS) * CW, cy = Math.floor(i / COLS) * CH;
      paintSpine(g, rec, cx, cy);
      cells.set(rec, { sheet: s, u0: (cx + 0.5) / W, u1: (cx + CW - 0.5) / W, v0: 1 - (cy + CH - 0.5) / H, v1: 1 - (cy + 0.5) / H });
    });
    const wi = batch.length, wx = (wi % COLS) * CW, wy = Math.floor(wi / COLS) * CH; g.fillStyle = '#ffffff'; g.fillRect(wx, wy, CW, CH);
    whites.push([(wx + CW / 2) / W, 1 - (wy + CH / 2) / H]);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = o.anisotropy ?? 8;
    textures.push(t);
    materials.push(new THREE.MeshStandardMaterial({ map: t, color: 0xb4b0a8, roughness: 0.85, envMapIntensity: 0.1, vertexColors: true }));
  }
  return { cell: rec => cells.get(rec), white: i => whites[i], textures, materials, titles: uniq.length, bytes: textures.reduce((s, t) => s + t.image.width * t.image.height * 4 * 4 / 3, 0) };
}
