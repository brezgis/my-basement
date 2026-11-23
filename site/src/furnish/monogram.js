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
