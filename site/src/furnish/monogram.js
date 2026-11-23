// monogram.js: the house's A, in the bath-house's own tile.
//
// At Anna's House an A is set in a round of glazed tile in the brick of the front walk. Down here it is made of what the
// pools are made of: small square tesserae in the basin's celadon, the border's deep sea-green and a line of ochre.
//   layMonogram   the A in a round of tesserae, laid flat: on the bed of the warm pool and of the edge pool (seen
//                 through the water), and set into the paving at the head of the warm pool's steps
//   layFrieze     the pool room's high frieze: a running band in which the A is the unit (upright ones joined foot to
//                 foot, so that the spaces between them are the same letter upside down)
//   layLife       a few odd tiles in a floor or a wall: a glider, or the pulsar (the one that looks like a flower), from
//                 Conway's game, in the border's blue-green. Small: found, not shown.
// Everything is laid a hair proud of its ground with a polygon offset (coplanar sheets flicker).
import * as THREE from 'three';

const rng = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const CELADON = [143, 189, 180], DEEP = [38, 92, 86], OCHRE = [196, 150, 62], CREAM = [232, 223, 204], GROUT = '#3b4a47';
const shade = (rgb, k) => `rgb(${rgb.map(v => Math.round(Math.max(0, Math.min(255, v * k)))).join(',')})`;

// The letter: a Roman A drawn as three strokes (a hairline up, a stem down, a bar), with small flat serifs.
function letterA(g, cx, cy, h) {
  const w = h * 0.86, top = cy - h / 2, bot = cy + h / 2, thin = h * 0.075, thick = h * 0.17, ser = h * 0.05;
  g.beginPath();
  g.moveTo(cx - thin * 0.2, top); g.lineTo(cx + thick * 0.55, top);                                    // the apex, a little flat
  g.lineTo(cx + w / 2, bot - ser); g.lineTo(cx + w / 2 + ser * 1.4, bot - ser); g.lineTo(cx + w / 2 + ser * 1.4, bot); g.lineTo(cx + w / 2 - thick - ser * 1.8, bot); g.lineTo(cx + w / 2 - thick - ser * 1.8, bot - ser); g.lineTo(cx + w / 2 - thick, bot - ser);      // the stem and its foot
  g.lineTo(cx + thick * 0.05, top + h * 0.3);                                                          // up the inside of the stem
  g.lineTo(cx - w / 2 + thin + ser * 0.4, bot - ser); g.lineTo(cx - w / 2 + thin + ser * 1.6, bot - ser); g.lineTo(cx - w / 2 + thin + ser * 1.6, bot); g.lineTo(cx - w / 2 - ser * 1.4, bot); g.lineTo(cx - w / 2 - ser * 1.4, bot - ser); g.lineTo(cx - w / 2, bot - ser);      // the hairline's foot
  g.closePath(); g.fill();
  const yb = cy + h * 0.2, k = y => (y - top) / (bot - ser - top);                                     // the bar, from stroke to stroke
  g.fillRect(cx - (w / 2) * k(yb) + thin * 0.3, yb - h * 0.035, w * k(yb) - thick * 0.9, h * 0.07);
}

// A round of tesserae, N px across, n tiles across; outside the round it is clear.
export function drawMonogram(N = 1024, n = 64, seed = 71) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), r = rng(seed);
  const m = document.createElement('canvas'); m.width = m.height = N; const mg = m.getContext('2d', { willReadFrequently: true });
  mg.fillStyle = '#000'; mg.fillRect(0, 0, N, N); mg.fillStyle = '#fff'; letterA(mg, N / 2, N / 2 + N * 0.01, N * 0.5);
  const M = mg.getImageData(0, 0, N, N).data, inA = (x, y) => x >= 0 && y >= 0 && x < N && y < N && M[((y | 0) * N + (x | 0)) * 4] > 127;
  const s = N / n, R = N / 2 - 2;
  g.clearRect(0, 0, N, N); g.fillStyle = GROUT; g.beginPath(); g.arc(N / 2, N / 2, R, 0, 7); g.fill();
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = (i + 0.5) * s, y = (j + 0.5) * s, d = Math.hypot(x - N / 2, y - N / 2) / R;
    if (d > 0.985) continue;
    let near = false; for (const [a, b] of [[s, 0], [-s, 0], [0, s], [0, -s], [s, s], [-s, -s], [s, -s], [-s, s]]) near ||= inA(x + a, y + b);
    const col = inA(x, y) ? shade(DEEP, 0.82 + r() * 0.36) : near ? shade(CREAM, 0.9 + r() * 0.14)
      : d > 0.93 ? shade(DEEP, 0.85 + r() * 0.3) : d > 0.875 ? shade(OCHRE, 0.88 + r() * 0.22) : d > 0.82 ? shade(DEEP, 0.85 + r() * 0.3)
      : shade(CELADON, 0.9 + r() * 0.16 + (r() < 0.06 ? 0.1 : 0));
    const gap = s * 0.09, jx = (r() - 0.5) * s * 0.06, jy = (r() - 0.5) * s * 0.06;
    g.fillStyle = col; g.fillRect(i * s + gap + jx, j * s + gap + jy, s - gap * 2, s - gap * 2);
    g.fillStyle = 'rgba(255,255,255,0.10)'; g.fillRect(i * s + gap + jx, j * s + gap + jy, s - gap * 2, (s - gap * 2) * 0.3);      // the glaze, catching the light
  }
  return c;
}

const tex = (canvas, repeat) => { const t = new THREE.CanvasTexture(canvas); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; if (repeat) { t.wrapS = THREE.RepeatWrapping; t.repeat.set(repeat, 1); } return t; };
const tileMat = (map, o = {}) => new THREE.MeshStandardMaterial({ map, roughness: 0.32, metalness: 0, envMapIntensity: 0.5, transparent: !!o.clear, alphaTest: o.clear ? 0.5 : 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6 });
// a rectangle in the world: centre c, half-vectors u (the picture's right) and v (the picture's top)
const quad = (c, u, v) => { const g = new THREE.BufferGeometry(), P = (a, b) => [c[0] + u[0] * a + v[0] * b, c[1] + u[1] * a + v[1] * b, c[2] + u[2] * a + v[2] * b];
  g.setAttribute('position', new THREE.Float32BufferAttribute([...P(-1, -1), ...P(1, -1), ...P(1, 1), ...P(-1, 1)], 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.computeVertexNormals(); return g; };
const add = (ctx, g, m, name) => { const mesh = new THREE.Mesh(g, m);      // (drawn from both sides: the caller's vectors may wind it either way)
  mesh.name = name; mesh.receiveShadow = true; m.side = THREE.DoubleSide; ctx.scene.add(mesh); return mesh; };

let roundTex = null;
// The round, at plan [X, Y], height h, `size` feet across; `top` is the plan direction [dX, dY] of the letter's head.
export function layMonogram(ctx, X, Y, h, size, top = [1, 0], name = 'monogram') {
  roundTex ??= tex(drawMonogram());
  const k = size / 2 / Math.hypot(top[0], top[1]), vX = top[0] * k, vY = top[1] * k;      // v (the head) in plan; u is v turned a quarter (the letter read from above)
  return add(ctx, quad([Y, h + 0.012, X], [-vX, 0, vY], [vY, 0, vX]), tileMat(roundTex, { clear: true }), name);      // (world x = plan Y, world z = plan X)
}

// The frieze: one period is an A and the gap after it (the same letter upside down), `ph` px high.
function drawFrieze(ph = 192) {
  const n = 12, s = ph / n, pw = s * 14, c = document.createElement('canvas'); c.width = pw; c.height = ph; const g = c.getContext('2d'), r = rng(909);
  g.fillStyle = GROUT; g.fillRect(0, 0, pw, ph);
  for (let i = 0; i < 14; i++) for (let j = 0; j < n; j++) {
    // rows 0 and n-1: a line of ochre; between them a zigzag (up over seven tiles, down over seven) two tiles thick, and a bar across the upright A
    const edge = j === 0 || j === n - 1, t = i < 7 ? i : 13 - i, yz = 9.6 - t * 1.33, on = !edge && j >= 1.4 && Math.abs(j - yz) < 1.05, bar = !edge && j === 7 && t >= 3;
    const col = edge ? shade(OCHRE, 0.85 + r() * 0.25) : on || bar ? shade(CREAM, 0.88 + r() * 0.14) : shade(DEEP, 0.95 + r() * 0.4);
    const gap = s * 0.09; g.fillStyle = col; g.fillRect(i * s + gap, j * s + gap, s - gap * 2, s - gap * 2);
  }
  return c;
}
// A length of it on a wall: from plan [X0, Y0] to [X1, Y1] (along the wall's face, as seen left to right), bottom h, `tall` feet.
export function layFrieze(ctx, X0, Y0, X1, Y1, h, tall = 0.6) {
  const L = Math.hypot(X1 - X0, Y1 - Y0), period = tall * 14 / 12, t = tex(drawFrieze(), Math.max(1, Math.round(L / period)));
  return add(ctx, quad([(Y0 + Y1) / 2, h + tall / 2, (X0 + X1) / 2], [(Y1 - Y0) / 2, 0, (X1 - X0) / 2], [0, tall / 2, 0]), tileMat(t), 'A frieze');
}

// ---- mosaic from a cartoon -----------------------------------------------------------------------------------------
// As a mosaicist works: the design is painted first, flat (the cartoon), and then set in tesserae, each taking the
// colour under its middle. Here the tesserae lie in a square grid, or (polar: a part of the radius) in a grid at the
// centre and in concentric rings outside that, which is how a round emblem's borders are laid. Clear where the cartoon is.
function mosaic(cartoon, px, o = {}) {
  const W = cartoon.width, H = cartoon.height, src = cartoon.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, W, H).data;
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), r = rng(o.seed ?? 5), gap = px * 0.085;
  const at = (x, y) => { const i = ((y | 0) * W + (x | 0)) * 4; return x < 0 || y < 0 || x >= W || y >= H || src[i + 3] < 128 ? null : [src[i], src[i + 1], src[i + 2]]; };
  const tess = (x, y, rot, w, h) => { const col = at(x, y); if (!col) return; const k = 0.88 + r() * 0.24;
    g.save(); g.translate(x + (r() - 0.5) * px * 0.05, y + (r() - 0.5) * px * 0.05); g.rotate(rot + (r() - 0.5) * 0.05);
    g.fillStyle = GROUT; g.fillRect(-w / 2 - 0.5, -h / 2 - 0.5, w + 1, h + 1); g.fillStyle = shade(col, k); g.fillRect(-w / 2 + gap, -h / 2 + gap, w - 2 * gap, h - 2 * gap);
    g.fillStyle = 'rgba(255,255,255,0.09)'; g.fillRect(-w / 2 + gap, -h / 2 + gap, w - 2 * gap, (h - 2 * gap) * 0.3); g.restore(); };
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) / 2, pol = o.polar ? o.polar * R : Infinity;
  for (let j = 0; j < H / px; j++) for (let i = 0; i < W / px; i++) { const x = (i + 0.5) * px, y = (j + 0.5) * px; if (Math.hypot(x - cx, y - cy) < pol - px * 0.35) tess(x, y, 0, px, px); }
  if (o.polar) for (let rad = pol + px * 0.5; rad < R; rad += px) { const m = Math.round(2 * Math.PI * rad / px), w = 2 * Math.PI * rad / m; for (let k = 0; k < m; k++) { const a = (k + (Math.round(rad / px) % 2) * 0.5) / m * Math.PI * 2; tess(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad, a + Math.PI / 2, w, px); } }
  return c;
}
const rgb = c => `rgb(${c.join(',')})`, SAGE = [150, 185, 140], LEAF = [60, 120, 96], CHAR = [44, 52, 62], TERRA = [196, 120, 84], PALE = [196, 222, 212];
const ell = (g, x, y, rx, ry, rot, col) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, 7); g.fillStyle = rgb(col); g.fill(); };
const tri = (g, pts, col) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fillStyle = rgb(col); g.fill(); };
// a leaf on a stem: from (x, y), pointing along angle a, length l
const leafAt = (g, x, y, a, l, col = LEAF, vein = SAGE) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(l * 0.5, -l * 0.42, l, 0); g.quadraticCurveTo(l * 0.5, l * 0.42, 0, 0); g.fillStyle = rgb(col); g.fill(); g.strokeStyle = rgb(vein); g.lineWidth = l * 0.07; g.beginPath(); g.moveTo(l * 0.1, 0); g.lineTo(l * 0.85, 0); g.stroke(); g.restore(); };
// The four creatures of the house's medallion (the front walk's round of tile: a moth, a bee, a starling, a kitten),
// drawn plainly enough to be set in tesserae. (x, y) is the middle, s a size in px.
const CREATURE = {
  starling(g, x, y, s) { tri(g, [[x - 0.7 * s, y + 0.05 * s], [x - 1.5 * s, y + 0.5 * s], [x - 0.6 * s, y + 0.4 * s]], CHAR); ell(g, x, y, 0.95 * s, 0.55 * s, -0.3, CHAR); ell(g, x - 0.12 * s, y + 0.06 * s, 0.6 * s, 0.3 * s, -0.12, [52, 84, 96]);
    ell(g, x + 0.72 * s, y - 0.5 * s, 0.34 * s, 0.32 * s, 0, CHAR); tri(g, [[x + 0.98 * s, y - 0.62 * s], [x + 1.55 * s, y - 0.42 * s], [x + 0.98 * s, y - 0.36 * s]], OCHRE); ell(g, x + 0.8 * s, y - 0.56 * s, 0.07 * s, 0.07 * s, 0, CREAM);
    for (const [dx, dy] of [[-0.3, -0.2], [0.1, -0.28], [0.35, 0.05], [-0.05, 0.25], [-0.5, 0.12], [0.5, -0.2], [0.2, 0.3], [-0.2, 0.02]]) ell(g, x + dx * s, y + dy * s, 0.055 * s, 0.055 * s, 0, CREAM);
    g.strokeStyle = rgb(OCHRE); g.lineWidth = 0.09 * s; for (const dx of [0.0, 0.3]) { g.beginPath(); g.moveTo(x + dx * s, y + 0.45 * s); g.lineTo(x + (dx + 0.05) * s, y + 0.95 * s); g.stroke(); } },
  bee(g, x, y, s) { for (const sx of [-1, 1]) { ell(g, x + sx * 0.15 * s, y - 0.62 * s, 0.62 * s, 0.32 * s, sx * 0.55 - 0.2, CREAM); ell(g, x + sx * 0.15 * s, y - 0.62 * s, 0.4 * s, 0.17 * s, sx * 0.55 - 0.2, PALE); }
    g.save(); g.beginPath(); g.ellipse(x - 0.35 * s, y, 0.75 * s, 0.48 * s, 0.12, 0, 7); g.clip(); g.fillStyle = rgb(OCHRE); g.fillRect(x - 1.3 * s, y - s, 2.6 * s, 2 * s); g.fillStyle = rgb(CHAR); for (const k of [-0.85, -0.42, 0.0]) g.fillRect(x + k * s, y - s, 0.2 * s, 2 * s); g.restore();
    ell(g, x + 0.5 * s, y - 0.08 * s, 0.36 * s, 0.34 * s, 0, CHAR); ell(g, x + 0.95 * s, y - 0.1 * s, 0.24 * s, 0.24 * s, 0, CHAR); ell(g, x + 1.02 * s, y - 0.16 * s, 0.06 * s, 0.06 * s, 0, CREAM);
    g.strokeStyle = rgb(CHAR); g.lineWidth = 0.06 * s; for (const d of [-1, 1]) { g.beginPath(); g.moveTo(x + 1.05 * s, y - 0.28 * s); g.quadraticCurveTo(x + 1.3 * s, y - (0.6 + d * 0.12) * s, x + 1.5 * s, y - (0.5 + d * 0.15) * s); g.stroke(); } },
  moth(g, x, y, s) { for (const sx of [-1, 1]) { tri(g, [[x, y - 0.25 * s], [x + sx * 1.35 * s, y - 0.85 * s], [x + sx * 1.0 * s, y + 0.15 * s], [x, y + 0.1 * s]], SAGE); tri(g, [[x, y + 0.05 * s], [x + sx * 0.95 * s, y + 0.2 * s], [x + sx * 0.6 * s, y + 0.8 * s], [x + sx * 0.5 * s, y + 1.35 * s], [x + sx * 0.25 * s, y + 0.7 * s]], [176, 205, 160]);
      g.strokeStyle = rgb(TERRA); g.lineWidth = 0.1 * s; g.beginPath(); g.moveTo(x, y - 0.27 * s); g.lineTo(x + sx * 1.35 * s, y - 0.87 * s); g.stroke(); ell(g, x + sx * 0.7 * s, y - 0.32 * s, 0.14 * s, 0.14 * s, 0, OCHRE); ell(g, x + sx * 0.7 * s, y - 0.32 * s, 0.06 * s, 0.06 * s, 0, CHAR); ell(g, x + sx * 0.5 * s, y + 0.5 * s, 0.09 * s, 0.09 * s, 0, OCHRE);
      g.strokeStyle = rgb(CREAM); g.lineWidth = 0.06 * s; g.beginPath(); g.moveTo(x + sx * 0.06 * s, y - 0.5 * s); g.quadraticCurveTo(x + sx * 0.3 * s, y - 0.95 * s, x + sx * 0.55 * s, y - 0.9 * s); g.stroke(); }
    ell(g, x, y, 0.15 * s, 0.55 * s, 0, CREAM); },
  kitten(g, x, y, s) { const FUR = [214, 150, 96], DARK = [170, 104, 62];
    g.strokeStyle = rgb(FUR); g.lineWidth = 0.22 * s; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 0.45 * s, y + 0.75 * s); g.quadraticCurveTo(x - 1.3 * s, y + 0.9 * s, x - 1.15 * s, y + 0.1 * s); g.stroke(); g.lineCap = 'butt';
    ell(g, x, y + 0.3 * s, 0.62 * s, 0.72 * s, 0, FUR); ell(g, x + 0.1 * s, y - 0.55 * s, 0.5 * s, 0.44 * s, 0, FUR);
    for (const sx of [-1, 1]) { tri(g, [[x + 0.1 * s + sx * 0.45 * s, y - 0.75 * s], [x + 0.1 * s + sx * 0.42 * s, y - 1.25 * s], [x + 0.1 * s + sx * 0.08 * s, y - 0.92 * s]], FUR); ell(g, x + 0.1 * s + sx * 0.2 * s, y - 0.58 * s, 0.065 * s, 0.085 * s, 0, CHAR); ell(g, x + sx * 0.25 * s, y + 0.95 * s, 0.2 * s, 0.12 * s, 0, CREAM); }
    ell(g, x + 0.1 * s, y - 0.42 * s, 0.06 * s, 0.045 * s, 0, TERRA); ell(g, x + 0.02 * s, y + 0.3 * s, 0.3 * s, 0.42 * s, 0, CREAM);
    g.strokeStyle = rgb(DARK); g.lineWidth = 0.08 * s; for (const k of [-0.1, 0.15, 0.4]) { g.beginPath(); g.moveTo(x - 0.6 * s, y + k * s); g.lineTo(x - 0.33 * s, y + (k + 0.06) * s); g.stroke(); } },
};

// The emblem on the warm pool's bed: a script A, written as with a pointed pen (hairline going up, swelling coming
// down), its three strokes ending in loops, and a vine growing out of two of them. Not in a round, not on a ground of
// its own: the letter and the leaves are set straight into the bed's tile, with a line of cream round the strokes so
// that they read through the water.
export function drawEmblem(N = 2048, n = 150) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), U = N * 0.345, C = N / 2, tile = N / n;
  const P = ([x, y]) => [C + x * U, C + y * U];
  const bez = (p0, p1, p2, p3, t) => { const m = 1 - t; return [m * m * m * p0[0] + 3 * m * m * t * p1[0] + 3 * m * t * t * p2[0] + t * t * t * p3[0], m * m * m * p0[1] + 3 * m * m * t * p1[1] + 3 * m * t * t * p2[1] + t * t * t * p3[1]]; };
  // a pen stroke along a chain of cubics [[p0, c1, c2, p1], ...]: thin going up or across, swelling going down
  const pts = segs => { const out = []; for (const sg of segs) for (let k = 0; k <= 60; k++) out.push(bez(...sg, k / 60)); return out; };
  const pen = (segs, col, thin, thick, grow = 0) => { const q = pts(segs); g.fillStyle = col;
    for (let i = 0; i < q.length; i++) { const a = q[Math.max(0, i - 1)], b2 = q[Math.min(q.length - 1, i + 1)], dx = b2[0] - a[0], dy = b2[1] - a[1], d = Math.hypot(dx, dy) || 1, down = Math.max(0, dy / d), ends = Math.min(1, i / 14, (q.length - 1 - i) / 14);
      const w = (thin + (thick - thin) * Math.pow(down, 1.6)) * (0.55 + 0.45 * ends) + grow, [x, y] = P(q[i]); g.beginPath(); g.arc(x, y, w * U / 2, 0, 7); g.fill(); } };
  // the three strokes (x right, y down; the letter about 2 units high)
  const UP = [[[-0.62, 0.86], [-1.02, 0.98], [-1.12, 0.5], [-0.78, 0.44]], [[-0.78, 0.44], [-0.48, 0.4], [-0.5, 0.74], [-0.3, 0.3]], [[-0.3, 0.3], [-0.12, -0.1], [0.06, -0.62], [0.2, -0.98]]];
  const DOWN = [[[0.2, -0.98], [0.24, -0.5], [0.34, 0.2], [0.46, 0.68]], [[0.46, 0.68], [0.54, 0.98], [0.86, 1.0], [0.98, 0.72]], [[0.98, 0.72], [1.04, 0.56], [0.9, 0.46], [0.8, 0.56]]];
  const BAR = [[[-0.98, 0.02], [-0.9, -0.22], [-0.6, -0.16], [-0.42, 0.06]], [[-0.42, 0.06], [-0.1, 0.42], [0.36, 0.3], [0.7, 0.02]], [[0.7, 0.02], [0.92, -0.16], [1.12, -0.12], [1.06, 0.06]], [[1.06, 0.06], [1.0, 0.2], [0.84, 0.12], [0.9, 0.0]]];
  // the vine: a tendril from the foot loop round under the letter, and one from the bar's end up and over it
  const V1 = [[[-0.92, 0.86], [-1.3, 1.1], [-0.7, 1.36], [-0.1, 1.22]], [[-0.1, 1.22], [0.4, 1.1], [0.9, 1.3], [1.24, 1.08]]];
  const V2 = [[[1.08, -0.02], [1.4, -0.3], [1.18, -0.86], [0.76, -1.02]], [[0.76, -1.02], [0.4, -1.16], [0.0, -1.3], [-0.42, -1.14]], [[-0.42, -1.14], [-0.74, -1.02], [-0.86, -0.72], [-0.66, -0.6]]];
  const DEEPc = rgb(DEEP), CR = rgb(CREAM), k1 = 2.3 * tile / U;                       // (the cream line: a little over two tesserae wide in all)
  const leaves = (segs, every, len, start = 0) => { const q = pts(segs); for (let i = 10 + start; i < q.length - 6; i += every) { const a = q[i - 2], b2 = q[i + 2], t = Math.atan2(b2[1] - a[1], b2[0] - a[0]), side = (Math.round(i / every) % 2 ? 1 : -1), [x, y] = P(q[i]);
    leafAt(g, x, y, t - side * 0.95, len * U, (Math.round(i / every) % 3) ? LEAF : [84, 150, 118]); if (Math.round(i / every) % 3 === 0) { g.beginPath(); g.arc(x + Math.cos(t + side * 1.3) * 0.07 * U, y + Math.sin(t + side * 1.3) * 0.07 * U, 0.028 * U, 0, 7); g.fillStyle = rgb(OCHRE); g.fill(); } } };
  // cream first, everywhere a little wider; then the vine; then the letter over it
  for (const sg of [V1, V2]) pen(sg, CR, 0.03, 0.03, k1 * 0.8);
  pen(UP, CR, 0.034, 0.06, k1); pen(BAR, CR, 0.034, 0.075, k1); pen(DOWN, CR, 0.04, 0.2, k1);
  for (const sg of [V1, V2]) pen(sg, rgb(LEAF), 0.03, 0.03);
  leaves(V1, 15, 0.2); leaves(V2, 16, 0.19, 4);
  pen(UP, DEEPc, 0.034, 0.06); pen(BAR, DEEPc, 0.034, 0.075); pen(DOWN, DEEPc, 0.04, 0.2);
  // a line of gold down the swell of the stem, and a drop of it in each loop
  { const q = pts([DOWN[0]]); g.strokeStyle = rgb(OCHRE); g.lineWidth = 1.15 * tile; g.beginPath(); for (let i = 14; i < q.length - 8; i++) { const [x, y] = P([q[i][0] - 0.035, q[i][1]]); i === 14 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    for (const d of [[-0.82, 0.68], [0.86, 0.74], [0.97, -0.02]]) { const [x, y] = P(d); g.beginPath(); g.arc(x, y, 0.036 * U, 0, 7); g.fillStyle = rgb(OCHRE); g.fill(); } }
  return mosaic(c, tile, { seed: 71 });
}
// A small round with one of the creatures in it, for paving
export function drawCreatureRound(kind, N = 1024, n = 52) {
  const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), R = N / 2;
  for (const [rad, col] of [[0.995, DEEP], [0.93, OCHRE], [0.885, DEEP], [0.84, PALE]]) { g.beginPath(); g.arc(R, R, rad * R, 0, 7); g.fillStyle = rgb(col); g.fill(); }
  CREATURE[kind](g, R - 0.04 * R, R + 0.08 * R, 0.36 * R);
  return mosaic(c, N / n, { polar: 0.84, seed: 19 });
}
// A panel for a wall: the vine running its length, and two of the creatures on it. `w` by `h` feet, tesserae `t` feet.
export function drawPanel(kinds, w, h, t = 0.055) {
  const px = 16, W = Math.round(w / t) * px, H = Math.round(h / t) * px, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), u = px / t, r = rng(kinds.join('').length * 7 + 3);
  g.fillStyle = rgb(DEEP); g.fillRect(0, 0, W, H); g.fillStyle = rgb(OCHRE); g.fillRect(px * 3, px * 3, W - px * 6, H - px * 6); g.fillStyle = rgb(PALE); g.fillRect(px * 4, px * 4, W - px * 8, H - px * 8);
  // the vine: one long stem in slow curves, side shoots, leaves, berries
  const y0 = H * 0.6, A = H * 0.12, K = Math.PI * 2 / (W * 0.4), stem = x => y0 + A * Math.sin(x * K + 0.6) + 0.04 * H * Math.sin(x * K * 2.3);
  g.strokeStyle = rgb(LEAF); g.lineWidth = 0.1 * u; g.beginPath(); for (let x = px * 5; x <= W - px * 5; x += 4) (x === px * 5 ? g.moveTo(x, stem(x)) : g.lineTo(x, stem(x))); g.stroke();
  for (let x = px * 8; x < W - px * 8; x += 0.36 * u) { const y = stem(x), sl = Math.atan2(stem(x + 4) - stem(x - 4), 8), side = (Math.round(x / (0.36 * u)) % 2 ? 1 : -1);
    leafAt(g, x, y, sl - side * 1.05, (0.5 + r() * 0.16) * u, r() < 0.5 ? LEAF : [84, 150, 118]);
    if (r() < 0.45) { const bx = x + Math.cos(sl + side * 1.2) * 0.22 * u, by = y + Math.sin(sl + side * 1.2) * 0.22 * u; ell(g, bx, by, 0.06 * u, 0.06 * u, 0, r() < 0.6 ? OCHRE : TERRA); } }
  // the creatures: the first on the stem (or under it), the second in the air
  const xa = W * 0.3, xb = W * 0.72, s = 0.72 * u;
  if (kinds[0] === 'starling') CREATURE.starling(g, xa, stem(xa) - 0.95 * s, s); else CREATURE.kitten(g, xa, H - px * 5 - 1.05 * s, s);
  CREATURE[kinds[1]](g, xb, H * 0.3, kinds[1] === 'bee' ? s * 0.55 : s * 0.62);
  return mosaic(c, px, { seed: kinds[0].length });
}
const made = {};
// The warm pool's emblem, or a creature's round, laid flat as layMonogram's
export function layRound(ctx, what, X, Y, h, size, top = [1, 0]) {
  const t = made[what] ??= tex(what === 'emblem' ? drawEmblem() : drawCreatureRound(what));
  const k = size / 2 / Math.hypot(top[0], top[1]), vX = top[0] * k, vY = top[1] * k;
  return add(ctx, quad([Y, h + 0.012, X], [-vX, 0, vY], [vY, 0, vX]), tileMat(t, { clear: true }), 'tile round: ' + what);
}
// A panel on a wall that runs along plan Y at plan X = `X` (its face toward +X if face > 0): centre Y, centre height
export function layPanel(ctx, kinds, X, Y, face, hc, w, h) {
  const t = tex(drawPanel(kinds, w, h));
  return add(ctx, quad([Y, hc, X], [-face * w / 2, 0, 0], [0, h / 2, 0]), tileMat(t), 'tile panel: ' + kinds.join(' and '));      // (u: the picture's right is the viewer's right as she faces the wall)
}

// Conway's game, in a handful of tiles.
const GLIDER = ['.#.', '..#', '###'];
const PULSAR = ['..###...###..', '.............', '#....#.#....#', '#....#.#....#', '#....#.#....#', '..###...###..', '.............', '..###...###..', '#....#.#....#', '#....#.#....#', '#....#.#....#', '.............', '..###...###..'];
function drawLife(rows, seed) {
  const n = rows.length, s = 24, c = document.createElement('canvas'); c.width = c.height = n * s; const g = c.getContext('2d'), r = rng(seed);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) if (rows[j][i] === '#') {
    g.fillStyle = GROUT; g.fillRect(i * s, j * s, s, s); g.fillStyle = shade(r() < 0.5 ? DEEP : [47, 106, 99], 0.9 + r() * 0.5); g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(i * s + 2, j * s + 2, s - 4, 6);
  }
  return c;
}
// kind 'glider' | 'pulsar'; on a floor at plan [X, Y], height h, each tile `cell` feet, turned `turn` quarter turns
export function layLife(ctx, kind, X, Y, h, cell = 0.17, turn = 0) {
  const rows = kind === 'pulsar' ? PULSAR : GLIDER, half = rows.length * cell / 2, a = turn * Math.PI / 2, u = [Math.cos(a) * half, Math.sin(a) * half];
  return add(ctx, quad([Y, h + 0.01, X], [u[1], 0, u[0]], [u[0], 0, -u[1]]), tileMat(tex(drawLife(rows, 31 + rows.length + turn)), { clear: true }), 'life ' + kind);
}
