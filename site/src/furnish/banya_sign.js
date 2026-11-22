// banya_sign.js: the one sign of Anna's Basement: СПАНЬЯ over the way from the Tea Room into the banya, lettered as a
// Moscow scribe or the Printing Yard of the seventeenth century would have lettered a heading: ustav capitals, tall
// and narrow, the strokes thick on the uprights and hairline on the joins, wedge serifs, the first letter a great
// cinnabar initial (a kinovar') with a sprig coming off it, Н and Ь sharing a stem as vyaz (ligatured lettering)
// does, the я written in the old way as ꙗ (an і joined to an а), a titlo over the word and stops of four dots either
// side. No font: every letter is drawn here as strokes. Black and cinnabar on pale lime-wood, a ruled border.
const INK = '#1d1712', RED = '#b3261b', GOLD = '#b8913a';

// draw(g, W, H): the whole board
export function drawSpanya(g, W, H) {
  // the board: pale lime-wood, a little grain, a double rule in cinnabar and ink
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#eadbb8'); gr.addColorStop(1, '#dcc89c'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 70; i++) { g.strokeStyle = `rgba(120,86,40,${0.04 + (i % 5) * 0.012})`; g.lineWidth = 1 + (i % 3); g.beginPath(); const y = (i * 37) % H; g.moveTo(0, y); g.bezierCurveTo(W * 0.3, y + 6 * Math.sin(i), W * 0.7, y - 5 * Math.cos(i), W, y + 3); g.stroke(); }
  const m = H * 0.07;
  g.strokeStyle = RED; g.lineWidth = H * 0.025; g.strokeRect(m, m, W - 2 * m, H - 2 * m);
  g.strokeStyle = INK; g.lineWidth = H * 0.008; g.strokeRect(m + H * 0.035, m + H * 0.035, W - 2 * m - H * 0.07, H - 2 * m - H * 0.07);
  // little knots at the corners of the rule
  for (const [x, y] of [[m, m], [W - m, m], [m, H - m], [W - m, H - m]]) { g.fillStyle = RED; g.beginPath(); g.arc(x, y, H * 0.035, 0, Math.PI * 2); g.fill(); g.fillStyle = GOLD; g.beginPath(); g.arc(x, y, H * 0.015, 0, Math.PI * 2); g.fill(); }

  // the letters: a box each, x0 and width, the line from top y0 to the base y1
  const y0 = H * 0.3, y1 = H * 0.8, h = y1 - y0, T = h * 0.15, t = h * 0.035;       // thick stroke, hairline
  const stem = (x, top = y0, bot = y1, w = T) => { g.fillRect(x - w / 2, top, w, bot - top); wedge(x, top, w, -1); wedge(x, bot, w, 1); };
  const wedge = (x, y, w, s) => { g.beginPath(); g.moveTo(x - w * 0.95, y); g.lineTo(x + w * 0.95, y); g.lineTo(x + w * 0.5, y - s * w * 0.55); g.lineTo(x - w * 0.5, y - s * w * 0.55); g.closePath(); g.fill(); };
  const hair = (ax, ay, bx, by, w = t) => { g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); };
  const diag = (ax, ay, bx, by, w) => { const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2; g.beginPath(); g.moveTo(ax + nx, ay + ny); g.lineTo(bx + nx, by + ny); g.lineTo(bx - nx, by - ny); g.lineTo(ax - nx, ay - ny); g.closePath(); g.fill(); };

  // the word's width: the initial is larger and set lower (it hangs below the line, as initials do)
  const total = W * 0.68, x0 = (W - total) / 2 + W * 0.02, cw = total / 6.2;
  let x = x0;
  // С: the cinnabar initial, a full head taller, with a sprig curling out of its top terminal
  { g.fillStyle = RED; g.strokeStyle = RED; const cx = x + cw * 0.55, cy = (y0 + y1) / 2 + h * 0.05, R = h * 0.62;
    g.lineWidth = T * 1.15; g.lineCap = 'butt'; g.beginPath(); g.arc(cx, cy, R, Math.PI * 0.32, Math.PI * 1.68); g.stroke();
    g.lineWidth = t * 1.2; g.beginPath(); g.arc(cx, cy, R * 0.72, Math.PI * 0.4, Math.PI * 1.6); g.stroke();
    // the sprig: a curl and three leaves, in gold edged with cinnabar
    const sx = cx + R * Math.cos(Math.PI * 1.68), sy = cy + R * Math.sin(Math.PI * 1.68);
    g.lineWidth = t * 1.4; g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + cw * 0.35, sy - h * 0.25, sx + cw * 0.05, sy - h * 0.5, sx + cw * 0.35, sy - h * 0.55); g.stroke();
    for (const [lx, ly, a] of [[sx + cw * 0.2, sy - h * 0.18, -0.6], [sx + cw * 0.12, sy - h * 0.38, 0.7], [sx + cw * 0.36, sy - h * 0.56, -0.3]]) { g.save(); g.translate(lx, ly); g.rotate(a); g.fillStyle = GOLD; g.beginPath(); g.ellipse(0, 0, cw * 0.11, cw * 0.05, 0, 0, Math.PI * 2); g.fill(); g.lineWidth = t * 0.6; g.stroke(); g.restore(); }
    // and a lower curl off the bottom terminal
    const bx = cx + R * Math.cos(Math.PI * 0.32), by = cy + R * Math.sin(Math.PI * 0.32);
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(bx + cw * 0.25, by + h * 0.08, bx + cw * 0.12, by - h * 0.02); g.stroke();
    x += cw * 1.45; }
  g.fillStyle = INK; g.strokeStyle = INK;
  // П: two stems under a heavy roof that overhangs both
  { stem(x + cw * 0.12); stem(x + cw * 0.78); g.fillRect(x - cw * 0.06, y0 - T * 0.15, cw * 1.02, T * 0.75); x += cw * 1.12; }
  // А: the ustav A, narrow and peaked: a thick right leg, a hairline left one, a low crossbar with a hook
  { const top = [x + cw * 0.5, y0 - T * 0.2]; diag(top[0], top[1], x + cw * 0.92, y1, T); hair(top[0] - t, top[1] + t, x + cw * 0.06, y1, t * 1.6); wedge(x + cw * 0.92, y1, T, 1); wedge(x + cw * 0.06, y1, T * 0.7, 1);
    hair(x + cw * 0.22, y0 + h * 0.66, x + cw * 0.8, y0 + h * 0.6, t * 1.3); x += cw * 1.12; }
  // НЬ in vyaz: Н's right stem is Ь's stem; Н's bar runs up to the right, as in the old hand
  { stem(x + cw * 0.12); stem(x + cw * 0.82); diag(x + cw * 0.12, y0 + h * 0.62, x + cw * 0.82, y0 + h * 0.38, T * 0.38);
    // the soft sign's bowl, hung off the shared stem
    g.lineWidth = T * 0.8; g.beginPath(); g.moveTo(x + cw * 0.82, y0 + h * 0.5); g.bezierCurveTo(x + cw * 1.55, y0 + h * 0.46, x + cw * 1.55, y1 + T * 0.1, x + cw * 0.82, y1 - T * 0.25); g.stroke();
    x += cw * 1.6; }
  // ꙗ: the iotated a: a short і stem joined by a hairline to an а
  { stem(x + cw * 0.08, y0, y1, T * 0.8); hair(x + cw * 0.08, y0 + h * 0.5, x + cw * 0.42, y0 + h * 0.5, t * 1.6);
    const top = [x + cw * 0.72, y0 - T * 0.1]; diag(top[0], top[1], x + cw * 1.08, y1, T); hair(top[0] - t, top[1] + t, x + cw * 0.36, y1, t * 1.6); wedge(x + cw * 1.08, y1, T, 1); wedge(x + cw * 0.36, y1, T * 0.7, 1);
    hair(x + cw * 0.5, y0 + h * 0.66, x + cw * 1.0, y0 + h * 0.6, t * 1.3); x += cw * 1.2; }

  // the titlo over the word: a wavy stroke with hooked ends, in ink
  { const tx0 = x0 + cw * 1.4, tx1 = x - cw * 0.2, ty = y0 - h * 0.28; g.lineWidth = t * 1.8; g.lineCap = 'round'; g.beginPath(); g.moveTo(tx0, ty + h * 0.06);
    for (let k = 0; k <= 24; k++) { const u = k / 24; g.lineTo(tx0 + (tx1 - tx0) * u, ty - Math.sin(u * Math.PI * 3) * h * 0.035); } g.lineTo(tx1, ty + h * 0.06); g.stroke(); }
  // stops of four dots (the ⁛ of the old books) either side, cinnabar
  for (const sx of [x0 - cw * 0.55, x + cw * 0.35]) for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { g.fillStyle = RED; g.beginPath(); g.arc(sx + dx * h * 0.07, (y0 + y1) / 2 + dy * h * 0.07, h * 0.035, 0, Math.PI * 2); g.fill(); }
}
