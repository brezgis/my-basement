// Ground surfaces with real textures: gravel, flagstone, soil, bark mulch,
// meadow, sand. Shapes are recorded during layout (ribbons along smooth
// curves, irregular blobs, polygons) and built in setup() with materials made
// here, since materials.js belongs to the house. Texture coordinates are world
// feet, so every piece tiles at true scale and joins seamlessly.

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { rng } from './cards.js';
import { paintHedge } from './paint.js';
import { sharedTexture } from '../materials.js';        // one copy of each photo, shared with the house

const SETS = {
  //          texture      feet/tile  tint       height  rough
  gravel:    ['gravel',     6,        0xd8d2c4,  0.07,   1],
  hoggin:    ['gravel',     5,        0xc8b68e,  0.07,   1],      // buff self-binding gravel: the school's walks
  flagstone: ['flagstone',  6.6,        0xd9cfc2,  0.09,   0.95],
  soil:      ['soil',       6,        0x9a8778,  0.08,   1],
  mulch:     ['mulch',      6.9,        0x6e5444,  0.065,  1],
  meadow:    ['meadow',     8,       0xb8b48a,  0.055,  1],
  sand:      ['gravel',     3,        0xf2e2b8,  0.5,    1],
  bark:      ['mulch',      3,        0x5a3e30,  0.06,   1],
  lawn:      ['grass',      9,        0xd9dc9c,  0.075,  1],
  swath:     ['grass',      9,        0xe4ecb4,  0.045,  1],      // a mown swath lying the other way: the lawn's own grass, a shade paler
  wallstone: ['flagstone',  5.5,        0xb4aca0,  0,      0.95],
  rock:      ['gravel',     2.2,      0xa8a296,  0,      1],
  rockDark:  ['gravel',     2.2,      0x7a7468,  0,      1],
  rockMoss:  ['gravel',     2.2,      0x76825a,  0,      1],
  edging:    ['pavers',     2.6,      [0.98, 0.82, 0.73], 0.1, 0.95],  // a soldier course of brick along a walk (the photograph is dark: lifted a little)
  sett:      [null,         2.64,     0xffffff,  0.095,  0.95, 'sett'],      // small square setts, four to a tile each way (0.66 ft): painted, so that a pattern laid in them can keep to their joints
  settDark:  [null,         2.64,     0xffffff,  0.12,   0.95, 'settDark'],
  paving:    ['flagstone',  7.5,      0xbdb7aa,  0.06,   0.95],     // the bed a patterned pavement is laid on: it shows as the joints
  brick:     [null,         2.667,    0xffffff,  0.1,    0.9, 'herring'],       // the main walks: brick laid herringbone, 8 by 4 in. (painted: eight half-bricks to the tile each way; walks.js gives it coordinates along and across the walk)
  flags:     [null,         8,        0xffffff,  0.1,    0.92, 'flags'],        // sawn stone flags in courses two feet deep, the slabs of random length: the forecourts at the doors
  brickRun:  [null,         2.667,    0xffffff,  0.1,    0.9, 'running'],       // the lesser paths: the same brick in running bond, the bricks lying along the path
  brickEdge: [null,         2.667,    0xffffff,  0.145,  0.9, 'soldier'],       // and the soldier course down each side of every walk
  tileLight: [null,         5,        0xffffff,  0.11,   0.9, 'tileLight'],     // the two stones of a patterned pavement: plain sawn stone, pale and slate (painted: a photograph of crazy paving inside each tile hid the pattern)
  tileDark:  [null,         5,        0xffffff,  0.11,   0.9, 'tileDark'],
  plank:     ['fir',        3,        0xb3a996,  0,      0.9],      // weathered boards (solid)
  yew:       [null,         3,        0xffffff,  0,      0.95],
  boxwood:   [null,         2.2,      0xffffff,  0,      0.95],
};

// Plain stone, painted: 'sett' and 'settDark' are a tile of four setts by four with their joints; 'tileLight' and
// 'tileDark' are sawn slabs with no joints at all (the pattern laid in them makes its own).
function paintStone(kind, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'), r = rng(kind.length * 31 + kind.charCodeAt(4));
  if (kind === 'herring' || kind === 'soldier' || kind === 'running') {      // brick: every one its own red-brown, a few burnt dark; sandy joints
    const n = 8, u = size / n, tone = () => { const k = r(); return k < 0.12 ? `hsl(${8 + r() * 8},${26 + r() * 10}%,${19 + r() * 5}%)` : `hsl(${11 + r() * 12},${40 + r() * 14}%,${28 + r() * 10}%)`; };
    g.fillStyle = 'hsl(34,20%,40%)'; g.fillRect(0, 0, size, size);
    const lay = (x, y, w, h) => { g.fillStyle = tone(); for (const dx of [0, size, -size]) for (const dy of [0, size, -size]) g.fillRect(x * u + 1.5 + dx, y * u + 1.5 + dy, w * u - 3, h * u - 3); };
    if (kind === 'herring') { for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) { const m = (x + y) % 4; if (m === 0) lay(x, y, 2, 1); else if (m === 2) lay(x, y, 1, 2); } }      // (cells x + y = 0, 1 mod 4 are a brick lying along x; 2, 3 one lying along y)
    else if (kind === 'running') { for (let x = 0; x < n; x++) for (let y = 0; y < n; y += 2) lay(x, y + (x % 2), 1, 2); }      // each course a brick wide, breaking joint with the next
    else for (let y = 0; y < n; y += 2) for (let x = 0; x < n; x++) lay(y, x, 2, 1);      // soldiers: each brick lies across the edge (u), side by side along it (v)
    for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '255,235,210' : '30,15,10'},${0.03 + r() * 0.07})`; const w = 1 + r() * 4; g.fillRect(r() * size, r() * size, w, w); }
    return c;
  }
  if (kind === 'flags') {
    g.fillStyle = 'hsl(36,12%,34%)'; g.fillRect(0, 0, size, size);
    const u = size / 8; for (let row = 0; row < 4; row++) { let x = (row % 2) * 1.5; for (const len of [[3, 2, 3], [2, 4, 2], [4, 2, 2], [2, 3, 3]][row]) { g.fillStyle = `hsl(${34 + r() * 10},${14 + r() * 8}%,${50 + r() * 9}%)`; for (const dx of [0, -size]) g.fillRect(x * u + 2 + dx, row * 2 * u + 2, len * u - 4, 2 * u - 4); x += len; } }
    for (let i = 0; i < 2600; i++) { g.fillStyle = `hsla(36,12%,${r() < 0.5 ? 30 : 72}%,${0.04 + r() * 0.08})`; const w = 1 + r() * 5; g.fillRect(r() * size, r() * size, w, w * (0.5 + r())); }
    return c;
  }
  const [h, s, l, joint] = { sett: [37, 30, 50, 'hsl(34,22%,30%)'], settDark: [24, 16, 20, 'hsl(24,14%,12%)'], tileLight: [38, 42, 56], tileDark: [22, 18, 27] }[kind];      // (warmer and darker than they should look: the sky lifts and cools them)
  g.fillStyle = `hsl(${h},${s}%,${l}%)`; g.fillRect(0, 0, size, size);
  if (joint) { const n = 4, u = size / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { g.fillStyle = `hsl(${h + (r() - 0.5) * 8},${s}%,${l + (r() - 0.5) * 9}%)`; g.fillRect(i * u, j * u, u, u); } g.fillStyle = joint; for (let i = 0; i < n; i++) { g.fillRect(i * u - 2, 0, 4, size); g.fillRect(0, i * u - 2, size, 4); } g.fillRect(size - 2, 0, 2, size); g.fillRect(0, size - 2, size, 2); }
  for (let i = 0; i < 2600; i++) { g.fillStyle = `hsla(${h},${s}%,${l + (r() < 0.5 ? -14 : 12)}%,${0.05 + r() * 0.1})`; const w = 1 + r() * 5; g.fillRect(r() * size, r() * size, w, w * (0.5 + r())); }
  return c;
}

export class Ground {
  constructor() { this.parts = Object.fromEntries(Object.keys(SETS).map(k => [k, []])); this.lift = null; }      // lift(x, z): the height of the land there (campus.js); ribbons follow it
  _y(kind, y) { return y ?? SETS[kind][3]; }
  // A strip of width w along a smooth curve through pts [[x, z], ...]
  ribbon(kind, pts, w, o = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), !!o.closed, 'centripetal');
    const n = Math.max(2, Math.ceil(curve.getLength() / 1.2)), y = this._y(kind, o.y), pos = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, p = curve.getPointAt(t), d = curve.getTangentAt(t), nx = -d.z, nz = d.x;
      const ww = (w / 2) * (1 + (o.wobble ?? 0) * Math.sin(i * 1.7) * Math.sin(i * 0.43));
      const off = o.offset ?? 0, ax = p.x + nx * (off + ww), az = p.z + nz * (off + ww), bx = p.x + nx * (off - ww), bz = p.z + nz * (off - ww), L = this.lift;      // offset: the strip lies that far to the curve's left (a kerb along a walk)
      pos.push(ax, y + (L ? L(ax, az) : 0), az, bx, y + (L ? L(bx, bz) : 0), bz);
      if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    }
    this._push(kind, pos, idx);
    return curve;
  }
  // An irregular rounded blob
  blob(kind, cx, cz, rx, rz, o = {}) {
    const r = rng(o.seed ?? Math.round(cx * 31 + cz * 17)), n = 40, pts = [], k = o.wobble ?? 0.12;
    const ph = [r() * 6, r() * 6, r() * 6];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, f = 1 + k * (Math.sin(a * 2 + ph[0]) * 0.6 + Math.sin(a * 3 + ph[1]) * 0.4 + Math.sin(a * 5 + ph[2]) * 0.25); const px = Math.cos(a) * rx * f, pz = Math.sin(a) * rz * f, ct = Math.cos(o.turn ?? 0), st = Math.sin(o.turn ?? 0); pts.push([cx + px * ct - pz * st, cz + px * st + pz * ct]); }
    this.poly(kind, pts, o);
    return pts;
  }
  poly(kind, pts, o = {}) {
    const shape = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, z)));
    if (o.holes) for (const h of o.holes) shape.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, z))));
    const g = new THREE.ShapeGeometry(shape);
    const p = g.attributes.position, y = this._y(kind, o.y), pos = [];
    const L = o.flat ? null : this.lift;      // (each corner takes the land's height: keep a piece small where the land is not level)
    for (let i = 0; i < p.count; i++) pos.push(p.getX(i), y + (L ? L(p.getX(i), p.getY(i)) : 0), p.getY(i));
    let idx = Array.from(g.index.array);
    for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
    // Where the land under it is not level, a piece is cut finer (every triangle into four, until none is longer than
    // about four feet) and every new corner takes the land's height too: otherwise the lawn shows through its middle.
    if (L) {
      let lo = Infinity, hi = -Infinity, far = 0; for (let i = 0; i < pos.length; i += 3) { const h = pos[i + 1]; lo = Math.min(lo, h); hi = Math.max(hi, h); }
      for (let i = 0; i < idx.length; i += 3) for (let k = 0; k < 3; k++) { const a = idx[i + k] * 3, b = idx[i + (k + 1) % 3] * 3; far = Math.max(far, Math.hypot(pos[a] - pos[b], pos[a + 2] - pos[b + 2])); }
      const passes = hi - lo < 0.02 && !o.fine ? 0 : Math.max(0, Math.min(3, Math.ceil(Math.log2(far / 4))));
      for (let n = 0; n < passes; n++) {
        const mids = new Map(), next = [], mid = (a, b) => { const k = a < b ? a * 65536 + b : b * 65536 + a; if (!mids.has(k)) { const x = (pos[a * 3] + pos[b * 3]) / 2, z = (pos[a * 3 + 2] + pos[b * 3 + 2]) / 2; mids.set(k, pos.length / 3); pos.push(x, y + L(x, z), z); } return mids.get(k); };
        for (let i = 0; i < idx.length; i += 3) { const a = idx[i], b = idx[i + 1], c = idx[i + 2], ab = mid(a, b), bc = mid(b, c), ca = mid(c, a); next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca); }
        idx = next;
      }
    }
    this._push(kind, pos, idx);
  }
  rect(kind, x0, x1, z0, z1, o = {}) { this.poly(kind, [[x0, z0], [x1, z0], [x1, z1], [x0, z1]], o); }
  disc(kind, cx, cz, rad, o = {}) { const pts = []; for (let i = 0; i < 48; i++) { const a = (i / 48) * Math.PI * 2; pts.push([cx + Math.cos(a) * rad, cz + Math.sin(a) * rad]); } this.poly(kind, pts, o); }
  // A box with texture coordinates in feet on every face (walls, clipped hedges).
  // round: soften the top edges of a hedge by bulging the top outward a little
  box(kind, x0, x1, y0, y1, z0, z1, o = {}) {
    const sx = x1 - x0, sy = y1 - y0, sz = z1 - z0, g = new THREE.BoxGeometry(sx, sy, sz, o.seg ?? 1, 1, o.seg ?? 1).toNonIndexed();
    const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) + (x0 + x1) / 2, y = p.getY(i) + (y0 + y1) / 2, z = p.getZ(i) + (z0 + z1) / 2;
      if (Math.abs(n.getX(i)) > 0.5) uv.setXY(i, z, y); else if (Math.abs(n.getY(i)) > 0.5) uv.setXY(i, x, z); else uv.setXY(i, x, y);
      p.setXYZ(i, x, y, z);
    }
    if (o.batter) for (let i = 0; i < p.count; i++) if (p.getY(i) > y0 + 0.01) { const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; p.setX(i, cx + (p.getX(i) - cx) * (1 - o.batter)); p.setZ(i, cz + (p.getZ(i) - cz) * (1 - o.batter)); }
    g.computeVertexNormals();
    this.parts[kind].push(g);
  }
  // A clipped hedge, swept along a line of points (closed: a ring). One skin: a rounded cross-section, a little wider
  // at the foot than the shoulder, carried along the line in steps of about a foot and a half, every point of it
  // pushed in or out a little so that no face is a dead plane; its foot follows the land; an open end is rounded off.
  sweep(kind, line, w, h, o = {}) {
    const L = this.lift ?? (() => 0), closed = !!o.closed, sink = 0.3, rough = o.rough ?? 0.075, P = [];
    for (let i = 0; i < line.length - (closed ? 0 : 1); i++) { const a = line[i], b = line[(i + 1) % line.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.round(l / 1.5)); for (let k = 0; k < m; k++) P.push([a[0] + (b[0] - a[0]) * k / m, a[1] + (b[1] - a[1]) * k / m]); }
    if (!closed) P.push(line.at(-1));
    const n = P.length; if (n < 2) return;
    const PROF = [[0.56, -sink], [0.55, h * 0.3], [0.5, h * 0.72], [0.4, h * 0.93], [0.2, h * 1.01], [0, h * 1.035], [-0.2, h * 1.01], [-0.4, h * 0.93], [-0.5, h * 0.72], [-0.55, h * 0.3], [-0.56, -sink]], M = PROF.length;
    const wob = (x, y, z, k) => Math.sin(x * 1.9 + y * 2.3 + k) * Math.sin(z * 1.7 - y * 1.1 + k * 1.7) + 0.5 * Math.sin(x * 4.3 + z * 3.7 + k * 0.6);
    const pos = [], uv = [], idx = []; let run = 0;
    const ring = (x, z, nx, nz, s, drop) => { const g = L(x, z); for (const [f, y] of PROF) { const r = 1 + rough * wob(x + nx * f * w, y, z + nz * f * w, 1.3), px = x + nx * f * w * s * r, pz = z + nz * f * w * s * r, py = g + (y > 0 ? y * drop + rough * 0.8 * wob(px, y, pz, 4.1) * (y > h * 0.5 ? 1 : 0.3) : y); pos.push(px, py, pz); uv.push(run + f * 0.3, y); } };
    const rings = [];
    for (let i = 0; i < n; i++) {
      const a = P[i > 0 ? i - 1 : closed ? n - 1 : 0], b = P[i < n - 1 ? i + 1 : closed ? 0 : n - 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l, [x, z] = P[i];
      if (i) run += Math.hypot(x - P[i - 1][0], z - P[i - 1][1]);
      if (!closed && i === 0) { rings.push(pos.length / 3); ring(x - tx * w * 0.42, z - tz * w * 0.42, -tz, tx, 0.5, 0.78); }      // a rounded end: a smaller, lower ring a little way beyond
      rings.push(pos.length / 3); ring(x, z, -tz, tx, 1, 1);
      if (!closed && i === n - 1) { rings.push(pos.length / 3); ring(x + tx * w * 0.42, z + tz * w * 0.42, -tz, tx, 0.5, 0.78); }
    }
    const R = rings.length;
    for (let i = 0; i < R - (closed ? 0 : 1); i++) { const A = rings[i], Bq = rings[(i + 1) % R]; for (let j = 0; j < M - 1; j++) idx.push(A + j, Bq + j, A + j + 1, Bq + j, Bq + j + 1, A + j + 1); }
    if (!closed) for (const [A, flip] of [[rings[0], false], [rings[R - 1], true]]) for (let j = 1; j < M - 2; j++) { if (flip) idx.push(A, A + j + 1, A + j); else idx.push(A, A + j, A + j + 1); }      // the ends closed
    let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); g = g.toNonIndexed();
    this.parts[kind].push(g);
    // sprays of leaf standing out of the top and the shoulders, so that the outline is leaves and not a line
    if (this.fringe) for (let i = 0; i < n; i++) { const [x, z] = P[i], a = P[Math.max(0, i - 1)], b = P[Math.min(n - 1, i + 1)], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / l, nz = (b[0] - a[0]) / l, k = wob(x, 1, z, 7.7); for (const [f, y] of i % 2 ? [[0.36 * (i % 4 === 1 ? 1 : -1), h * 0.6]] : [[0.08 * k, h * 0.78]]) this.fringe(x + nx * f * w + k * 0.2, L(x, z) + y, z + nz * f * w - k * 0.2, 0.62 + 0.25 * Math.abs(k)); }
  }
  hedge(kind, pts, w, h, o = {}) { this.sweep(kind, pts, w, h, o); }      // (a straight run is a sweep too: there are no boxes of hedge any more)
  // A strip made elsewhere (walks.js): positions, its own texture coordinates in feet, triangles. It lies on the land already.
  strip(kind, pos, uv, idx) {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    g.setAttribute('normal', new THREE.Float32BufferAttribute(pos.map((v, i) => (i % 3 === 1 ? 1 : 0)), 3)); this.parts[kind].push(g);
  }
  // A clipped ball or dome (r wide, sy times as tall), and a clipped cone, standing on y
  ball(kind, x, y, z, r, sy = 1) {      // (a clipped ball is never quite a sphere, and no two are alike: flattened a little, lumpy, leaning)
    const g = new THREE.IcosahedronGeometry(r, 1), p = g.attributes.position, nm = g.attributes.normal, k = x * 0.7 + z * 1.3, q = 0.9 + 0.12 * Math.sin(k * 3.1);
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), d = 1 + 0.07 * Math.sin(px * 4.1 / r + k) * Math.sin(pz * 3.7 / r + k * 1.9) + 0.05 * Math.sin(py * 5.3 / r + k * 0.7); p.setXYZ(i, px * d * (py < 0 ? 1.04 : 1), py * d * sy * q, pz * d * (py < 0 ? 1.04 : 1) + py * 0.05 * Math.sin(k)); }
    for (let i = 0; i < p.count; i++) { const l = Math.hypot(p.getX(i), p.getY(i), p.getZ(i)) || 1; nm.setXYZ(i, p.getX(i) / l, p.getY(i) / l, p.getZ(i) / l); }      // (shaded as a round thing, not as facets)
    g.translate(x, y + r * sy * q * 0.72, z); this.mesh(kind, g);
    // leaf sprays all over it, and a skirt of them where it meets the ground
    if (this.fringe) { const cy = y + r * sy * q * 0.72, N = 10; for (let i = 0; i < N; i++) { const t = (i + 0.5) / N, phi = Math.acos(1 - t * 1.15), th = i * 2.39996 + k, rr = r * 0.82; this.fringe(x + Math.sin(phi) * Math.cos(th) * rr, cy + Math.cos(phi) * rr * sy * q - 0.25, z + Math.sin(phi) * Math.sin(th) * rr, 0.55 + 0.3 * ((i * 7) % 5) / 5); }
      for (let i = 0; i < 5; i++) { const th = i / 5 * 6.2832 + k; this.fringe(x + Math.cos(th) * r * 0.86, y - 0.1, z + Math.sin(th) * r * 0.86, 0.6); } }
  }
  cone(kind, x, y, z, r, h) {
    const g = new THREE.ConeGeometry(r, h, 12, 6), p = g.attributes.position, k = x * 0.9 + z * 0.6;
    for (let i = 0; i < p.count; i++) { const px = p.getX(i), py = p.getY(i), pz = p.getZ(i), t = (py + h / 2) / h, d = 1 + 0.16 * Math.sin(t * 3.14159) + 0.06 * Math.sin(px * 5 / r + py * 2.2 + k) * Math.sin(pz * 4.3 / r + k * 1.7); p.setXYZ(i, px * d, py, pz * d); }
    g.computeVertexNormals(); const q = g.toNonIndexed(); q.translate(x, y + h / 2 - 0.2, z); this.mesh(kind, q);
  }
  // Any non-indexed geometry (rocks): texture coordinates projected from the world
  mesh(kind, g) {
    const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i += 3) {
      // All three corners of a face use one projection. Changing axis halfway
      // across a sloping rim stretched individual stone triangles into streaks.
      const nx = Math.abs(n.getX(i) + n.getX(i + 1) + n.getX(i + 2));
      const ny = Math.abs(n.getY(i) + n.getY(i + 1) + n.getY(i + 2));
      const nz = Math.abs(n.getZ(i) + n.getZ(i + 1) + n.getZ(i + 2));
      const top = ny >= nx && ny >= nz;
      for (let j = i; j < i + 3; j++) {
        uv[j * 2] = !top && nx > nz ? p.getZ(j) : p.getX(j);
        uv[j * 2 + 1] = top ? p.getZ(j) : p.getY(j);
      }
    }
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.parts[kind].push(g);
  }
  _push(kind, pos, idx) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const uv = []; for (let i = 0; i < pos.length; i += 3) uv.push(pos[i], -pos[i + 2]);
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx); g.computeVertexNormals();
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
    this.parts[kind].push(g);
  }

  build(scene, renderer, grassMat) {
    const loader = new THREE.TextureLoader(), aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const tex = (file, size, srgb) => { const t = sharedTexture(file); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / size, 1 / size); t.anisotropy = aniso; if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
    const mats = {};
    let order = 0;
    for (const [kind, [file, size, tint, , rough]] of Object.entries(SETS)) {      // (a sixth entry names a painted stone: paintStone)
      if (!this.parts[kind].length) continue;
      let m;
      if (!file) {
        const t = new THREE.CanvasTexture(SETS[kind][5] ? paintStone(SETS[kind][5]) : paintHedge(kind === 'yew' ? 'yew' : 'box')); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / size, 1 / size); t.anisotropy = aniso;
        m = new THREE.MeshStandardMaterial({ map: t, roughness: rough, envMapIntensity: SETS[kind][5] ? 0.2 : 0.6 });
      } else m = kind === 'lawn' && grassMat ? grassMat.clone() : new THREE.MeshStandardMaterial({ map: tex(file + '_color', size, true), normalMap: tex(file + '_normal', size), color: Array.isArray(tint) ? new THREE.Color().setRGB(...tint, THREE.LinearSRGBColorSpace) : tint, roughness: rough, envMapIntensity: 0.5 });
      const solid = SETS[kind][3] === 0;
      if (kind === 'lawn' && grassMat) { m.transparent = false; m.alphaMap = null; m.depthWrite = true; }
      if (!solid) { m.polygonOffset = true; m.polygonOffsetFactor = 0; m.polygonOffsetUnits = -4 - order * 4; order++; }      // (units only: an offset scaled by the slope pulled paving seen edge-on, from a basement's eye level just over the ground, through two feet of wall, a dark line round the room)
      const mesh = new THREE.Mesh(mergeGeometries(this.parts[kind]), m);
      mesh.receiveShadow = true; mesh.castShadow = solid; mesh.name = 'ground ' + kind;
      scene.add(mesh); mats[kind] = m;
    }
    return mats;
  }
}
