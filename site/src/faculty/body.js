// Bodies. A robot here is not one of a few fixed shapes: it is put together, from one kit of parts, by a FORM,
// a short recipe built round an object or an idea (a teapot, a herm, a spinning top, a honeycomb, a book, a
// horseshoe magnet ...), and every form takes continuous proportions, so no two robots need be the same build
// and a new one is made by giving numbers, or by writing ten lines of a new form. After Anna's House, whose
// gardener is a plant pot and whose physicist is nobody else (my_house/site/src/staff/models.js): the same
// merged, vertex-coloured mesh and glowing face, with the shape left open.
//
//   buildBody(look) -> { root, bob, face, hands, top, eye, radius, animate({ t, dt, moving, speed, busy, speak, point, nod }) }
//
// look (faculty/roster.js):
//   form        which recipe (FORMS below); with it, any of the form's own numbers (each form lists them)
//   size        the whole body scaled (1); tall, wide, deep: its proportions stretched (1 each)
//   lift        how far the underside is off the floor, for those that float
//   gait        how it gets about, where the form leaves it open: 'hover' (a ring of light under it), 'wheel' (one),
//               'wheels' (a pair on an axle), 'tracks', 'skirt' (a base that glides), 'legs' (two short ones), 'tripod'
//   arms        true for arms from the shoulder to the mittens; else the mittens float
//   colour, colour2, belly, trim; pattern: 'stripes' | 'speckle' | 'split' | 'band'
//   top         what grows out of the head: 'sprout' | 'flame' | 'coil' | 'quill' | 'dish' | 'pleats' | 'prop' | 'halo' | 'bulb'
//   hat         'beanie' | 'beret' | 'cap' | 'straw' | 'bun' | 'mortar' | 'toque', hatColour; antenna; headphones: colour
//   ears        'cups' | 'bolts' | 'fins'; buttons, bowtie, scarf, apron: colours
//   the face    eye (colour), eyeW, eyeH, eyeR, gap, lashes, brows, moustache, freckles, specs, monocle, blush; ring: the glow underneath
//   tool        in the right hand (TOOLS below); tool2 in the left
//
// A robot is at most five draw calls: the body (everything that does not move by itself, merged), the face, the
// two hands, and one thing that moves (the ring of light, a wheel, a pendulum, a propeller, a flock).
// lookFromSeed(n) makes a plausible new look from a number.

import { useThree as use0, paint, makeFace, xform as T, merge, mesh, sph, cyl } from './models.js';
import { latheGeometry as lathe, cornerR } from '../robokit/shell.js';
import { makeFaceLife, talkMouth } from '../robokit/face.js';
let THREE;
const TAU = Math.PI * 2;
export function useThreeBody(T3) { THREE = T3; use0(T3); }
const CREAM = '#efe4cf', BRASS = '#c9a45c', DARK = '#2a2622', WOOD = '#6b4a2e';

// ---- the kit ---------------------------------------------------------------------------------------------
// The turned solid (a profile [[r, y], ...], round or with a few flat sides; four sides make a rounded square) and
// the corner radius of a rounded-square section are robokit's now: robokit/shell.js latheGeometry and cornerR.

// A slab w by h, d deep, about its middle, with corners of radius r in its face and its edges bevelled (a
// rounded tile: a face's frame, a book's cover, a panel)
function slab(w, h, d, r = Math.min(w, h) * 0.22, p = [0, 0, 0], rot = [0, 0, 0], bevel = Math.min(0.02, d * 0.3)) {
  const x = w / 2 - bevel, y = h / 2 - bevel; r = Math.max(0.005, Math.min(r - bevel, x, y) );
  const sh = new THREE.Shape(); sh.moveTo(-x + r, -y); sh.lineTo(x - r, -y); sh.quadraticCurveTo(x, -y, x, -y + r); sh.lineTo(x, y - r); sh.quadraticCurveTo(x, y, x - r, y); sh.lineTo(-x + r, y); sh.quadraticCurveTo(-x, y, -x, y - r); sh.lineTo(-x, -y + r); sh.quadraticCurveTo(-x, -y, -x + r, -y);
  const g = new THREE.ExtrudeGeometry(sh, { depth: Math.max(0.001, d - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -(d - bevel * 2) / 2); g.clearGroups();
  return T(g, { p, r: rot });
}
// a rod from a to b, r0 thick at a and r1 at b
function rod(a, b, r0, r1 = r0, seg = 6) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length() || 1e-3, g = new THREE.CylinderGeometry(r1, r0, L, seg, 1);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2);
  return g;
}
// a bent tube through points
// colour a geometry triangle by triangle (by where each one's middle is): a clean edge to a band, a pane, a stripe
function paintTri(geo, fn) {
  const g = geo.index ? geo.toNonIndexed() : geo, P = g.attributes.position, n = P.count, a = new Float32Array(n * 3), c = new THREE.Color(), p = new THREE.Vector3();
  for (let i = 0; i < n; i += 3) { p.set((P.getX(i) + P.getX(i + 1) + P.getX(i + 2)) / 3, (P.getY(i) + P.getY(i + 1) + P.getY(i + 2)) / 3, (P.getZ(i) + P.getZ(i + 1) + P.getZ(i + 2)) / 3); c.set(fn(p)); for (let k = 0; k < 3; k++) { a[(i + k) * 3] = c.r; a[(i + k) * 3 + 1] = c.g; a[(i + k) * 3 + 2] = c.b; } }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
  return g;
}
// a profile with no step longer than `max`, so that a colour can change part way up a long side
const fine = (pts, max = 0.1) => { const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const [r0, y0] = pts[i - 1], [r1, y1] = pts[i], n = Math.max(1, Math.ceil(Math.abs(y1 - y0) / max)); for (let k = 1; k <= n; k++) out.push([r0 + (r1 - r0) * k / n, y0 + (y1 - y0) * k / n]); } return out; };
const tube = (pts, r, seg = 10, rad = 6) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), seg, r, rad, false);
const box = (w, h, d, p = [0, 0, 0], r = [0, 0, 0]) => T(new THREE.BoxGeometry(w, h, d), { p, r });
const ball = (r, p = [0, 0, 0], s = [1, 1, 1], w = 10, h = 7) => T(sph(r, w, h), { p, s });
const torus = (R, r, p = [0, 0, 0], rot = [Math.PI / 2, 0, 0], seg = 24, arc = TAU, s = [1, 1, 1]) => T(new THREE.TorusGeometry(R, r, 6, seg, arc), { p, r: rot, s });
// the profile of an egg, a barrel, a pear, a wedge: h tall from y0, g at its widest, which is `waist` of the way up
// (0 low, 1 high); `shoulder` and `belly` square off (4) or sharpen (1.3) the upper and lower halves
function ovoid(y0, h, g, { waist = 0.5, shoulder = 2, belly = 2, n = 9 } = {}) {
  const pts = [], yw = y0 + h * waist;
  for (let i = 0; i <= n; i++) { const u = 1 - i / n; pts.push([i ? g * Math.pow(Math.max(0, 1 - Math.pow(u, belly)), 1 / belly) : 0, yw - (yw - y0) * u]); }
  for (let i = 1; i <= n; i++) { const u = i / n; pts.push([i < n ? g * Math.pow(Math.max(0, 1 - Math.pow(u, shoulder)), 1 / shoulder) : 0, yw + (y0 + h - yw) * u]); }
  return pts;
}

export const TOOLS = {
  chalk: () => [paint(T(cyl(0.024, 0.024, 0.22, 8), { p: [0, 0.16, 0.1], r: [0.3, 0, -0.2] }), '#f4f1ea')],
  pointer: () => [paint(T(cyl(0.012, 0.02, 1.25, 6), { p: [0, 0.55, 0.12], r: [0.22, 0, 0] }), WOOD), paint(ball(0.03, [0, 1.16, 0.26]), BRASS)],
  flask: () => [paint(T(cyl(0.035, 0.14, 0.24, 14), { p: [0, 0.12, 0.1] }), p => (p.y < 0.1 ? '#6fae9c' : '#dfe9ea')), paint(T(cyl(0.035, 0.035, 0.12, 10), { p: [0, 0.3, 0.1] }), '#dfe9ea'), paint(T(cyl(0.045, 0.045, 0.015, 10), { p: [0, 0.365, 0.1] }), '#dfe9ea')],
  magnifier: () => [paint(T(new THREE.TorusGeometry(0.13, 0.02, 6, 18), { p: [0, 0.42, 0.1], r: [0, 0.3, 0] }), BRASS), paint(T(cyl(0.02, 0.024, 0.3, 6), { p: [0, 0.14, 0.1] }), '#3a2a20')],
  cup: () => [paint(T(cyl(0.11, 0.085, 0.2, 14), { p: [0, 0.12, 0.1] }), '#efe6d2'), paint(T(new THREE.TorusGeometry(0.06, 0.016, 5, 10, Math.PI), { p: [0.12, 0.12, 0.1], r: [0, 0, -Math.PI / 2] }), '#efe6d2'), paint(T(cyl(0.095, 0.095, 0.01, 12), { p: [0, 0.215, 0.1] }), '#4a2c1a')],
  book: () => [paint(box(0.34, 0.46, 0.07, [0, 0.18, 0.1], [0.3, 0.2, 0]), '#7a2f2a'), paint(box(0.31, 0.43, 0.075, [0.012, 0.18, 0.1], [0.3, 0.2, 0]), '#efe6d2')],
  can: () => [paint(T(cyl(0.15, 0.17, 0.3, 14), { p: [0, -0.16, 0.12] }), '#9aa4a8'), paint(T(cyl(0.02, 0.032, 0.46, 8), { p: [0, -0.1, 0.4], r: [1.0, 0, 0] }), '#9aa4a8'), paint(T(new THREE.TorusGeometry(0.12, 0.018, 6, 12, Math.PI), { p: [0, 0.0, 0.08], r: [0, Math.PI / 2, 0] }), '#8a9498')],
  duster: () => [paint(T(cyl(0.018, 0.018, 0.5, 6), { p: [0, 0.2, 0.08] }), '#5b4630'), paint(ball(0.14, [0, 0.52, 0.08], [1, 1.5, 1], 10, 8), '#e9c46a')],
  wrench: () => [paint(box(0.05, 0.5, 0.03, [0, 0.2, 0.08]), '#b9bcc0'), paint(T(new THREE.TorusGeometry(0.07, 0.025, 5, 10, Math.PI * 1.5), { p: [0, 0.48, 0.08], r: [0, 0, 0.8] }), '#b9bcc0')],
  candle: () => [paint(T(cyl(0.06, 0.06, 0.34, 10), { p: [0, 0.2, 0.08] }), '#efe6d2'), paint(T(cyl(0.12, 0.14, 0.04, 12), { p: [0, 0.02, 0.08] }), BRASS), paint(ball(0.035, [0, 0.42, 0.08], [1, 1.8, 1], 8, 6), '#ffcf70')],
  clipboard: () => [paint(box(0.36, 0.48, 0.03, [0, 0.16, 0.12], [0.35, 0, 0]), '#7a5a3a'), paint(box(0.31, 0.4, 0.035, [0, 0.15, 0.125], [0.35, 0, 0]), '#f4eee2'), paint(box(0.14, 0.05, 0.05, [0, 0.37, 0.05], [0.35, 0, 0]), '#b9bcc0')],
  blowpipe: () => [paint(T(cyl(0.014, 0.014, 1.3, 6), { p: [0, 0.2, 0.3], r: [1.1, 0, 0] }), '#b9bcc0'), paint(ball(0.13, [0, 0.5, 0.88], [1, 1, 1.15], 12, 8), '#ffb469'), paint(ball(0.07, [0, 0.5, 0.9], [1, 1, 1], 8, 6), '#fff1b8')],
  case: () => [paint(box(0.46, 0.34, 0.14, [0, -0.3, 0.06]), '#a8442e'), paint(box(0.48, 0.05, 0.15, [0, -0.3, 0.06]), '#e9dcc0'), paint(T(new THREE.TorusGeometry(0.07, 0.014, 5, 10, Math.PI), { p: [0, -0.13, 0.06] }), DARK), paint(box(0.12, 0.09, 0.012, [0.1, -0.36, 0.137]), '#f4eee2')],
  pipette: () => [paint(T(cyl(0.012, 0.004, 0.42, 6), { p: [0, 0.05, 0.12], r: [0.25, 0, 0] }), '#dfe9ea'), paint(T(cyl(0.03, 0.022, 0.2, 8), { p: [0, 0.34, 0.2], r: [0.25, 0, 0] }), '#3d6e9a'), paint(ball(0.03, [0, 0.45, 0.228]), '#e9e2d0')],
  notebook: () => [paint(box(0.3, 0.4, 0.05, [0, 0.16, 0.1], [0.3, -0.2, 0]), '#2f4a40'), paint(box(0.27, 0.37, 0.055, [0.012, 0.16, 0.1], [0.3, -0.2, 0]), '#f4eee2')],
  // a second, smaller top (Delphine's: the same law, started a hair differently)
  // (out of doors: the gardener's, the harbour master's)
  trowel: () => [paint(T(cyl(0.022, 0.026, 0.2, 6), { p: [0, 0.02, 0.14], r: [1.2, 0, 0] }), WOOD), paint(T(sph(0.07, 8, 5), { p: [0, -0.1, 0.36], r: [1.2, 0, 0], s: [0.8, 0.22, 1.9] }), '#aeb4b8')],
  secateurs: () => [paint(box(0.03, 0.2, 0.03, [-0.03, 0.02, 0.14], [1.1, 0, 0.12]), '#b8452e'), paint(box(0.03, 0.2, 0.03, [0.03, 0.02, 0.14], [1.1, 0, -0.12]), '#b8452e'), paint(box(0.022, 0.13, 0.04, [0, -0.05, 0.29], [1.1, 0, 0]), '#aeb4b8')],
  rake: () => [paint(rod([0, 1.3, -0.75], [0, -1.62, 1.9], 0.03, 0.026, 6), WOOD), paint(box(1.3, 0.05, 0.07, [0, -1.64, 1.92]), '#4a4d52'), ...Array.from({ length: 9 }, (_, i) => paint(box(0.025, 0.17, 0.025, [(i - 4) * 0.155, -1.74, 1.93], [0.25, 0, 0]), '#4a4d52'))],
  trug: () => [paint(T(new THREE.SphereGeometry(0.3, 12, 5, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, -0.3, 0.1], s: [0.72, 0.5, 1.25] }), '#a8845a'), paint(T(new THREE.TorusGeometry(0.2, 0.015, 5, 12, Math.PI), { p: [0, -0.3, 0.1], s: [1, 1.5, 1] }), '#8a6a44'), paint(ball(0.07, [0.05, -0.33, 0.2], [1, 0.5, 1], 6, 4), '#d8758e'), paint(ball(0.07, [-0.06, -0.33, 0], [1, 0.5, 1], 6, 4), '#e0b14a'), paint(ball(0.08, [0.02, -0.34, -0.12], [1, 0.4, 1.4], 6, 4), '#6f8f3e')],
  logbook: () => [paint(box(0.4, 0.5, 0.09, [0, 0.16, 0.12], [0.5, 0, 0]), '#1f2a44'), paint(box(0.37, 0.47, 0.095, [0.014, 0.16, 0.12], [0.5, 0, 0]), '#f4eee2'), paint(box(0.06, 0.5, 0.1, [-0.18, 0.16, 0.12], [0.5, 0, 0]), BRASS), paint(T(cyl(0.012, 0.012, 0.3, 5), { p: [0.16, 0.3, 0.22], r: [0.5, 0, 0.5] }), '#d9a520')],
  spyglass: () => [paint(T(cyl(0.05, 0.06, 0.3, 10), { p: [0, 0.08, 0.2], r: [1.0, 0, 0] }), BRASS), paint(T(cyl(0.04, 0.045, 0.3, 10), { p: [0, 0.23, 0.43], r: [1.0, 0, 0] }), '#3a2a20'), paint(T(cyl(0.065, 0.05, 0.12, 10), { p: [0, 0.34, 0.6], r: [1.0, 0, 0] }), BRASS)],
  // a lantern carried by its ring: a brass frame, four warm panes (it is the one light she works by at night)
  lantern: () => [paint(T(new THREE.TorusGeometry(0.06, 0.012, 5, 10), { p: [0, 0.05, 0.12] }), BRASS), paint(T(cyl(0.11, 0.13, 0.04, 8), { p: [0, -0.04, 0.12] }), BRASS), paint(T(cyl(0.085, 0.085, 0.2, 8), { p: [0, -0.16, 0.12] }), '#ffd88a'), paint(T(cyl(0.12, 0.13, 0.04, 8), { p: [0, -0.28, 0.12] }), BRASS), ...[0, 1, 2, 3].map(i => paint(rod([Math.sin(i * Math.PI / 2 + 0.78) * 0.1, -0.27, 0.12 + Math.cos(i * Math.PI / 2 + 0.78) * 0.1], [Math.sin(i * Math.PI / 2 + 0.78) * 0.1, -0.05, 0.12 + Math.cos(i * Math.PI / 2 + 0.78) * 0.1], 0.012, 0.012, 4), BRASS))],
  thermos: () => [paint(T(cyl(0.075, 0.075, 0.42, 12), { p: [0, 0.16, 0.1] }), '#3f5a48'), paint(T(cyl(0.08, 0.08, 0.1, 12), { p: [0, 0.42, 0.1] }), '#b9bcc0'), paint(T(cyl(0.077, 0.077, 0.03, 12), { p: [0, 0.1, 0.1] }), '#b9bcc0')],
  top: () => [paint(lathe([[0, -0.2], [0.14, 0.02], [0.15, 0.08], [0.04, 0.2], [0.03, 0.3], [0, 0.3]], 12), p => (p.y > 0.03 && p.y < 0.09 ? CREAM : '#b8452e')).translate(0, 0.16, 0.1)],
};

// What a form is given: K. It adds painted parts with K.put, says where the face is, where a hat sits, where the
// hands rest, and how it gets about.
function makeKit(L) {
  const parts = [], C = L.colour ?? '#8a3d6b', BELLY = L.belly ?? CREAM, TRIM = L.trim ?? BRASS, C2 = L.colour2 ?? BELLY;
  const K = { L, parts, C, C2, BELLY, TRIM, mover: null, ring: null, pivot: 0, floats: false, wobble: 0 };
  K.add = (...g) => { for (const x of g.flat()) parts.push(x); };
  K.put = (geo, colour) => { parts.push(paint(geo, colour)); };
  // the coat of the main shell between y0 and y1: plain, striped, speckled, two-tone, or with one band
  K.coat = (y0, y1, o = {}) => { const pat = o.pattern ?? L.pattern, h = y1 - y0, bandAt = o.bandAt ?? 0.62, split = o.splitAt ?? 0.42;
    return p => (pat === 'stripes' ? (Math.floor(((p.y - y0) / h) * (o.stripes ?? 9)) % 2 ? C2 : C)
      : pat === 'speckle' ? (Math.sin(p.x * 23 + p.y * 7) * Math.sin(p.z * 19 - p.y * 11) * Math.sin(p.y * 29 + p.x * 5) > 0.3 ? C2 : C)
      : pat === 'split' ? (p.y < y0 + h * split ? C2 : C) : pat === 'band' ? (Math.abs(p.y - (y0 + h * bandAt)) < h * (o.bandW ?? 0.045) ? C2 : C) : C); };
  // the main shell: remembered, so that things can be laid on its surface
  K.shell = (pts, o = {}) => { K.S = { pts, sides: o.sides ?? 26, sx: o.sx ?? 1, sz: o.sz ?? 1 }; const ys = pts.map(p => p[1]); K.S.y0 = Math.min(...ys); K.S.y1 = Math.max(...ys);
    const col = o.colour ?? (L.pattern || o.pattern ? K.coat(o.c0 ?? K.S.y0, o.c1 ?? K.S.y1, o) : C);
    if (typeof col !== 'function') K.put(lathe(pts, K.S.sides, K.S.sx, K.S.sz), col);
    else if ((o.pattern ?? L.pattern) === 'speckle' && !o.colour) K.put(lathe(fine(pts, 0.07), K.S.sides, K.S.sx, K.S.sz), col);
    else parts.push(paintTri(lathe(fine(pts, o.step ?? 0.1), K.S.sides, K.S.sx, K.S.sz), col));
    return K.S; };
  K.rad = y => { const p = K.S.pts; let r = 0; for (let i = 1; i < p.length; i++) { const [r0, y0] = p[i - 1], [r1, y1] = p[i], lo = Math.min(y0, y1), hi = Math.max(y0, y1); if (y >= lo - 1e-6 && y <= hi + 1e-6) r = Math.max(r, hi - lo < 1e-6 ? Math.max(r0, r1) : r0 + (r1 - r0) * (y - y0) / (y1 - y0)); } return r; };
  K.side = y => K.rad(y) * K.S.sx; K.front = y => K.rad(y) * K.S.sz;
  // how far forward the shell's surface is at (x, y), or 0 off it: a rounded square, a round body, or (six sides and
  // more) near enough the circle through its flats
  K.surfZ = (x, y) => { const S = K.S; if (!S || y < S.y0 - 1e-3 || y > S.y1 + 1e-3) return 0; const r = K.rad(y); if (r < 1e-3) return 0;
    if (S.sides === 4) { const a = r * S.sx, b = r * S.sz, c = cornerR(a, b), ax = Math.abs(x); return ax <= a - c ? b : ax >= a ? 0 : b - c + Math.sqrt(Math.max(0, c * c - (ax - a + c) ** 2)); }
    const xr = x / S.sx; return Math.abs(xr) >= r ? 0 : S.sz * Math.sqrt(r * r - xr * xr); };
  // the half-width of a four-sided shell's flat front at y (inside its rounded corners)
  K.flat = y => { const S = K.S, a = K.side(y), b = K.front(y); return S.sides === 4 ? a - cornerR(a, b) : a; };
  // a strip of the shell's own surface, `off` proud of it: a band, a rim, a seam
  K.band = (ya, yb, off, colour) => { const ys = [ya, ...K.S.pts.map(p => p[1]).filter(y => y > ya + 0.01 && y < yb - 0.01).sort((a, b) => a - b), yb]; K.put(lathe(ys.map(y => [K.rad(y) + off, y]), K.S.sides, K.S.sx, K.S.sz), colour); };
  // a patch of the shell's front, w wide and h tall about yc, `off` proud of it (a screen, a shirt front, an apron)
  K.patch = (yc, w, h, off = 0.012, nu = 12, nv = 5) => {
    const S = K.S, poly = S.sides <= 8, pos = [], uv = [], idx = [], a = poly ? 0 : Math.min(1.25, (w / 2) / Math.max(0.05, K.side(yc)));
    if (poly) { nu = 1; nv = 2; }
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const y = yc + h / 2 - (h * j) / nv, u = i / nu;
      if (poly) pos.push((u - 0.5) * w, y, K.front(y) + off); else { const f = (u * 2 - 1) * a, r = K.rad(y) + off; pos.push(Math.sin(f) * r * S.sx, y, Math.cos(f) * r * S.sz); }
      uv.push(u, 1 - j / nv);
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const p = j * (nu + 1) + i, q = p + nu + 1; idx.push(p, q, p + 1, p + 1, q, q + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  };
  K.panel = (yc, w, h, colour, off = 0.008) => K.put(K.patch(yc, w, h, off), colour);
  // the face: a screen on the shell (or, flat: [x, y, z] of its middle, on anything)
  K.faceAt = (yc, w, h, o = {}) => {
    if (!o.flat && K.S?.sides === 4) { const f = 2 * (K.flat(yc) - 0.035); if (w > f) { h *= f / w; w = f; } }      // (on a rounded square, within its flat front, frame and all)
    K.face = o.flat ? T(new THREE.PlaneGeometry(w, h), { p: o.flat }) : K.patch(yc, w, h, o.off ?? 0.014); K.eye = yc;
    if (o.frame === false || !(o.flat || K.S.sides <= 8)) return;
    const t = 0.03, z = o.flat ? o.flat[2] : K.front(yc) + 0.014, tilt = o.flat ? 0 : Math.atan2(K.front(yc - h / 2) - K.front(yc + h / 2), h);
    K.put(slab(w + t * 2, h + t * 2, 0.026, h * 0.2 + t, [o.flat ? o.flat[0] : 0, o.flat ? o.flat[1] : yc, z - 0.019], [-tilt, 0, 0], 0.008), o.frame ?? TRIM);      // (a rounded frame, to the screen's own round corners)
  };
  // what is worn on the head, its brim at height y, for a head about hr in radius
  K.hat = (y, hr, o = {}) => {
    const HC = L.hatColour ?? '#b8452e', R = hr, hat = [], kind = L.hat;
    if (kind === 'beanie') hat.push(paint(T(new THREE.SphereGeometry(R * 0.78, 20, 10, 0, TAU, 0, Math.PI / 2), { s: [1, 0.72, 1] }), HC), paint(torus(R * 0.76, 0.06, [0, 0, 0], [Math.PI / 2, 0, 0], 26), HC), ...(L.pom === false ? [] : [paint(ball(0.085, [0, R * 0.58, 0]), BELLY)]));
    else if (kind === 'beret') hat.push(paint(T(sph(R * 0.72, 20, 10), { p: [0.06, 0.06, 0], s: [1.08, 0.3, 1.02], r: [0, 0, -0.18] }), HC), paint(T(cyl(0.015, 0.015, 0.08, 5), { p: [0.06, 0.26, 0] }), HC));
    else if (kind === 'cap') hat.push(paint(T(new THREE.SphereGeometry(R * 0.72, 20, 10, 0, TAU, 0, Math.PI / 2), { s: [1, 0.62, 1] }), HC), paint(T(cyl(R * 0.5, R * 0.5, 0.025, 20, 1), { p: [0, 0.02, R * 0.52], s: [1, 1, 0.9] }), HC));
    else if (kind === 'toque') hat.push(paint(T(cyl(R * 0.52, R * 0.48, 0.3, 20), { p: [0, 0.14, 0] }), '#f4f1ea'), paint(T(sph(R * 0.62, 18, 10), { p: [0, 0.42, 0], s: [1, 0.62, 1] }), '#f4f1ea'));
    else if (kind === 'straw') hat.push(paint(T(cyl(R * 1.25, R * 1.28, 0.03, 28), {}), '#d9b866'), paint(T(cyl(R * 0.5, R * 0.6, 0.24, 22), { p: [0, 0.13, 0] }), '#d4b25e'), paint(T(cyl(R * 0.61, R * 0.61, 0.06, 22), { p: [0, 0.05, 0] }), HC));
    else if (kind === 'mortar') hat.push(paint(T(new THREE.SphereGeometry(R * 0.62, 18, 8, 0, TAU, 0, Math.PI / 2), { s: [1, 0.5, 1] }), HC), paint(box(R * 1.7, 0.035, R * 1.7, [0, R * 0.33, 0], [0, 0.5, 0]), HC), paint(ball(0.035, [0, R * 0.36, 0]), TRIM), paint(T(cyl(0.012, 0.012, 0.34, 5), { p: [R * 0.55, R * 0.2, R * 0.5] }), TRIM), paint(T(cyl(0.035, 0.02, 0.1, 6), { p: [R * 0.55, R * 0.02, R * 0.5] }), TRIM));
    else if (kind === 'peaked') hat.push(paint(T(cyl(R * 0.86, R * 0.66, 0.2, 20), { p: [0, 0.1, 0] }), HC), paint(T(cyl(R * 0.67, R * 0.67, 0.07, 20), { p: [0, 0.035, 0] }), TRIM), paint(T(cyl(R * 0.62, R * 0.62, 0.02, 16, 1), { p: [0, 0.0, R * 0.42], s: [1, 1, 0.8], r: [0.22, 0, 0] }), '#17140f'), paint(ball(0.05, [0, 0.12, R * 0.7], [1, 1.2, 0.5], 8, 6), TRIM));
    else if (kind === 'bun') hat.push(paint(ball(R * 0.3, [0, 0.1, -0.05], [1, 1, 1], 12, 10), HC), paint(T(cyl(0.012, 0.012, 0.5, 5), { p: [0, 0.14, -0.05], r: [0, 0, 1.2] }), TRIM));
    for (const g of hat) K.add(T(T(g, { r: o.tilt ?? [kind === 'straw' ? 0.1 : -0.1, 0, kind === 'beret' ? 0 : -0.12] }), { p: [o.x ?? 0, y, o.z ?? -0.02] }));
    return hat.length ? y + (kind === 'mortar' ? R * 0.45 : kind === 'toque' ? 0.6 : kind === 'peaked' ? 0.24 : kind === 'straw' ? 0.3 : R * 0.5) : y;
  };
  // what grows out of the top, from height ty; returns how high it reaches
  K.topper = (ty, o = {}) => {
    const tp = L.top, x = o.x ?? 0, R = o.r ?? 0.56, at = g => K.add(T(g, { p: [x, 0, o.z ?? 0] }));
    if (tp === 'sprout') { at(paint(T(cyl(0.014, 0.02, 0.2, 6), { p: [0, ty + 0.1, 0] }), '#5b4630')); for (const [rz, ry, sc] of [[-0.75, 0.3, 1], [0.7, -0.5, 0.82], [0.1, 1.9, 0.62]]) at(paint(T(sph(0.2, 12, 8), { p: [0, 0.2, 0], s: [0.5 * sc, 1.25 * sc, 0.12] }), '#7fae52').applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, ry, rz)).setPosition(0, ty + 0.16, 0))); return ty + 0.55; }
    if (tp === 'flame') { at(paint(T(cyl(0.02, 0.03, 0.12, 6), { p: [0, ty + 0.05, 0] }), '#3a2a20')); at(paint(ball(0.1, [0, ty + 0.24, 0], [0.8, 1.7, 0.8], 10, 8), '#ffb347')); at(paint(ball(0.055, [0, ty + 0.22, 0.01], [0.8, 1.6, 0.8], 8, 6), '#fff1b8')); return ty + 0.45; }
    if (tp === 'coil') { for (let i = 0; i < 4; i++) at(paint(T(new THREE.TorusGeometry(0.09 - i * 0.012, 0.016, 5, 14), { p: [0, ty + 0.05 + i * 0.07, 0], r: [Math.PI / 2 + 0.18, 0, 0] }), TRIM)); at(paint(ball(0.05, [0, ty + 0.36, 0]), '#e0723c')); return ty + 0.42; }
    if (tp === 'quill') { at(paint(T(cyl(0.01, 0.014, 0.6, 5), { p: [0.2, ty + 0.14, -0.1], r: [0.2, 0, -0.75] }), '#efe4cf')); at(paint(T(sph(0.12, 10, 6), { p: [0.34, ty + 0.3, -0.13], r: [0.2, 0, -0.75], s: [0.45, 2.1, 0.12] }), '#f4eee2')); return ty + 0.5; }
    if (tp === 'dish') { at(paint(T(cyl(0.014, 0.02, 0.2, 6), { p: [0, ty + 0.1, 0] }), '#5b4630')); at(paint(T(new THREE.SphereGeometry(0.2, 14, 6, 0, TAU, 0, 1.0), { p: [0, ty + 0.36, 0.02], r: [Math.PI - 0.5, 0, 0] }), TRIM)); return ty + 0.5; }
    if (tp === 'pleats') { for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; at(paint(T(sph(0.07, 6, 5), { p: [Math.cos(a) * 0.2, ty + 0.03, Math.sin(a) * 0.2], r: [0, -a, 0], s: [1.5, 1.1, 0.5] }), BELLY)); } at(paint(ball(0.13, [0, ty + 0.1, 0], [1, 0.85, 1], 10, 8), BELLY)); return ty + 0.22; }
    if (tp === 'halo') { at(paint(torus(R * 0.5, 0.025, [0, ty + 0.28, 0], [Math.PI / 2 + 0.12, 0, 0], 28), '#ffe0a0')); return ty + 0.34; }
    if (tp === 'bulb') { at(paint(T(cyl(0.04, 0.05, 0.08, 8), { p: [0, ty + 0.04, 0] }), TRIM)); at(paint(ball(0.11, [0, ty + 0.18, 0], [1, 1, 1], 10, 8), '#fff1b8')); return ty + 0.3; }
    if (tp === 'posy') { [['#d8758e', -0.16, 0.05, 0.5], ['#e0b14a', 0.12, -0.08, 0.62], ['#f4eee2', 0.02, 0.14, 0.44], ['#b88cd8', 0.2, 0.1, 0.4], ['#d8758e', -0.05, -0.14, 0.7]].forEach(([c, dx, dz, hh], i) => { at(paint(rod([dx * 0.4, ty - 0.05, dz * 0.4], [dx, ty + hh, dz], 0.012, 0.01, 4), '#5f8a48')); at(paint(ball(0.085, [dx, ty + hh, dz], [1, 0.8, 1], 7, 5), c)); at(paint(T(sph(0.09, 6, 4), { p: [dx * 0.7 + (i % 2 ? 0.07 : -0.07), ty + hh * 0.5, dz * 0.7], s: [1.2, 0.25, 0.5], r: [0, i, 0.5] }), '#6f9a52')); }); return ty + 0.8; }
    if (tp === 'prop') { at(paint(T(cyl(0.02, 0.025, 0.16, 6), { p: [0, ty + 0.08, 0] }), '#5b4630')); K.move(merge([0, Math.PI / 2].map(ry => paint(box(0.62, 0.015, 0.09, [0, 0, 0], [0.12, ry, 0]), TRIM))), [x, ty + 0.17, o.z ?? 0], 'spinY', 9); return ty + 0.22; }
    return ty;
  };
  // small things laid on, each where the form says
  K.buttons = (ys, z, x = 0) => { if (L.buttons) for (const y of ys) K.put(ball(0.035, [x, y, typeof z === 'function' ? z(y) : z], [1, 1, 1], 8, 6), L.buttons); };
  // (each wing and the knot laid on the shell where it is at that height, if there is shell there; else at z)
  K.bowtie = (y, z) => { if (L.bowtie) { const on = x => { const s = K.surfZ(x, y); return s > 0 ? s + 0.03 : z; }; for (const sx of [-1, 1]) K.put(T(new THREE.ConeGeometry(0.08, 0.16, 10), { p: [sx * 0.08, y, on(sx * 0.12)], r: [0, 0, -sx * Math.PI / 2], s: [1, 1, 0.55] }), L.bowtie); K.put(ball(0.04, [0, y, on(0) + 0.01]), L.bowtie); } };
  K.ears = (y, x) => {
    if (L.ears === 'cups') for (const sx of [-1, 1]) { K.put(torus(0.13, 0.04, [sx * (x + 0.035), y, 0], [0, Math.PI / 2, 0], 14), TRIM); K.put(T(cyl(0.11, 0.12, 0.05, 14), { p: [sx * (x + 0.02), y, 0], r: [0, 0, Math.PI / 2] }), BELLY); }      // (an ear cup turned out to the side, against it)
    if (L.ears === 'bolts') for (const sx of [-1, 1]) { K.put(T(cyl(0.11, 0.11, 0.1, 6), { p: [sx * (x + 0.03), y, 0], r: [0, 0, Math.PI / 2] }), TRIM); K.put(T(cyl(0.05, 0.05, 0.2, 8), { p: [sx * (x + 0.1), y, 0], r: [0, 0, Math.PI / 2] }), '#5b4630'); }
    if (L.ears === 'fins') for (const sx of [-1, 1]) K.put(T(new THREE.ConeGeometry(0.16, 0.36, 4), { p: [sx * (x + 0.08), y, -0.05], r: [0, 0, -sx * 1.1], s: [1, 1, 0.3] }), TRIM);
    if (L.headphones) {
      // the band up the sides and over the top of the head, close to it all the way (round over a round head, square over a square one)
      const top = Math.max(y + 0.2, (K.S && y >= K.S.y0 && y <= K.S.y1 ? K.S.y1 : y + x) + 0.04), X = x + 0.03, rc = K.S?.sides === 4 ? Math.min(0.2, X * 0.5, top - y) : Math.min(X, top - y) * 0.95, path = [[-X, y], [-X, top - rc]];
      for (let k = 1; k < 6; k++) { const a = Math.PI - (k / 6) * Math.PI / 2; path.push([-X + rc + Math.cos(a) * rc, top - rc + Math.sin(a) * rc]); }
      path.push([-X + rc, top], [X - rc, top]); for (let k = 1; k < 6; k++) { const a = Math.PI / 2 - (k / 6) * Math.PI / 2; path.push([X - rc + Math.cos(a) * rc, top - rc + Math.sin(a) * rc]); } path.push([X, top - rc], [X, y]);
      K.put(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(path.map(([px, py]) => new THREE.Vector3(px, py, 0)), false, 'centripetal'), 40, 0.035, 6, false), '#1d1b18');
      for (const sx of [-1, 1]) K.put(T(cyl(0.2, 0.2, 0.12, 16), { p: [sx * (x + 0.03), y - 0.02, 0], r: [0, 0, Math.PI / 2] }), L.headphones); }
  };
  K.antenna = y => { if (L.antenna) { K.put(T(cyl(0.012, 0.016, 0.3, 6), { p: [0, y + 0.15, 0] }), '#5b4630'); K.put(ball(0.05, [0, y + 0.32, 0]), TRIM); return y + 0.37; } return y; };
  // A scarf: a band round the shell at y, and its tail laid on the front from under the band, following the shell
  // while it bulges out and hanging straight down where it falls away, so it neither floats nor sinks in
  K.scarf = (y, tail = true, o = {}) => { if (!L.scarf) return; const hw = o.h ?? 0.07; K.band(y - hw, y + hw, 0.035, L.scarf); if (tail) K.put(K.ribbon(o.x ?? Math.min(K.side(y) * 0.4, K.S.sides === 4 ? K.flat(y) - 0.09 : 1), y - hw * 0.4, o.len ?? 0.46, 0.14, 0.03), L.scarf); };
  K.ribbon = (x0, yTop, len, w, off = 0.03, t = 0.024) => {
    const n = 8, rows = []; let zPrev = -1e9;
    for (let j = 0; j <= n; j++) { const y = yTop - len * j / n, x = x0 + 0.05 * (j / n) ** 2, s = Math.max(K.surfZ(x - w / 2, y), K.surfZ(x + w / 2, y), K.surfZ(x, y)); const z = Math.max(s > 0 ? s + off : zPrev, zPrev); zPrev = z; rows.push([x, y, z]); }
    const q = [], quad = (a, b, c, d) => q.push(...a, ...b, ...c, ...a, ...c, ...d);
    for (let j = 0; j < n; j++) { const [xa, ya, za] = rows[j], [xb, yb, zb] = rows[j + 1], h = w / 2;
      quad([xa - h, ya, za], [xb - h, yb, zb], [xb + h, yb, zb], [xa + h, ya, za]);                                    // the front
      quad([xa + h, ya, za - t], [xb + h, yb, zb - t], [xb - h, yb, zb - t], [xa - h, ya, za - t]);                    // the back
      quad([xa - h, ya, za - t], [xb - h, yb, zb - t], [xb - h, yb, zb], [xa - h, ya, za]); quad([xa + h, ya, za], [xb + h, yb, zb], [xb + h, yb, zb - t], [xa + h, ya, za - t]); }
    const [xe, ye, ze] = rows[n]; quad([xe - w / 2, ye, ze], [xe - w / 2, ye, ze - t], [xe + w / 2, ye, ze - t], [xe + w / 2, ye, ze]);      // its end
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(q, 3)); g.computeVertexNormals(); return g; };
  // the one thing that moves by itself: a geometry about its own origin, where it sits, and how it moves
  K.move = (geo, at, kind, rate = 1, o = {}) => { K.mover = { geo, at, kind, rate, ...o }; };
  // ---- ways of getting about, under a body whose underside is at y0 and about w half across ----------------
  K.gait = (kind, y0, w, o = {}) => {
    K.gaitKind = kind;
    if (kind === 'hover') { K.floats = true; K.put(T(new THREE.SphereGeometry(Math.min(w * 0.55, 0.42), 16, 6, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, y0 + 0.02, 0], s: [1, 0.5, 1] }), o.cap ?? TRIM); K.ring = { y: y0 - 0.26, r: o.ring ?? Math.min(0.42, w * 0.55) }; return; }
    if (kind === 'wheel') {                                                     // one wheel, in a fork
      const r = o.r ?? Math.min(0.55, Math.max(0.34, y0 * 0.4));
      for (const sx of [-1, 1]) K.put(rod([sx * 0.13, y0 + 0.1, 0], [sx * 0.13, r, 0], 0.035, 0.03), TRIM);
      K.put(T(cyl(0.2, 0.26, 0.16, 12), { p: [0, y0, 0] }), TRIM);
      K.move(merge([paint(torus(r - 0.07, 0.07, [0, 0, 0], [0, Math.PI / 2, 0], 20), DARK), paint(T(cyl(0.09, 0.09, 0.2, 10), { r: [0, 0, Math.PI / 2] }), TRIM), ...[0, 1, 2].map(i => paint(box(0.03, (r - 0.08) * 2, 0.03, [0, 0, 0], [i * Math.PI / 3, 0, 0]), TRIM))]), [0, r, 0], 'rollX', 1 / r); return;
    }
    if (kind === 'wheels') {                                                    // a pair on an axle, and a little caster behind
      const r = o.r ?? 0.3, x = o.x ?? w + 0.05;
      if (y0 > r + 0.15) K.put(T(cyl(Math.min(0.2, w * 0.5), Math.min(0.3, w * 0.7), y0 - r, 10), { p: [0, (y0 + r) / 2, 0] }), o.stem ?? TRIM);
      K.put(T(cyl(0.035, 0.035, x * 2, 6), { p: [0, r, 0], r: [0, 0, Math.PI / 2] }), DARK);
      K.put(rod([0, Math.min(y0, r + 0.1), -w * 0.5], [0, 0.09, -w * 0.9], 0.03), DARK); K.put(ball(0.09, [0, 0.09, -w * 0.9]), DARK);
      K.move(merge([-1, 1].flatMap(sx => [paint(torus(r - 0.06, 0.06, [sx * x, 0, 0], [0, Math.PI / 2, 0], 18), DARK), paint(T(cyl(r - 0.07, r - 0.07, 0.05, 8), { p: [sx * x, 0, 0], r: [0, 0, Math.PI / 2] }), o.hub ?? TRIM), paint(box(0.07, r * 1.5, 0.05, [sx * (x + 0.03), 0, 0]), DARK)])), [0, r, 0], 'rollX', 1 / r); return;
    }
    if (kind === 'tracks') {                                                    // two treads and a deck
      const len = o.len ?? w * 1.9, x = o.x ?? w * 0.8;
      for (const sx of [-1, 1]) { K.put(box(0.26, 0.26, len, [sx * x, 0.22, 0]), DARK); for (const sz of [-1, 1]) K.put(T(cyl(0.22, 0.22, 0.26, 12), { p: [sx * x, 0.22, sz * len / 2], r: [0, 0, Math.PI / 2] }), DARK); for (let i = 0; i < 4; i++) K.put(T(cyl(0.08, 0.08, 0.28, 8), { p: [sx * x, 0.2, (i - 1.5) * len / 4], r: [0, 0, Math.PI / 2] }), TRIM); }
      K.put(box(x * 2, 0.1, len * 0.8, [0, 0.47, 0]), o.deck ?? TRIM); if (y0 > 0.6) K.put(T(cyl(w * 0.4, w * 0.55, y0 - 0.5, 10), { p: [0, (y0 + 0.5) / 2, 0] }), o.deck ?? TRIM); return;
    }
    if (kind === 'skirt') { const S = K.S ?? { sides: 20, sx: 1, sz: 1 }; K.put(lathe([[w * (o.foot ?? 1.2), 0.05], [w * (o.foot ?? 1.2), 0.14], [w * 0.92, y0 + 0.02]], S.sides, S.sx, S.sz), o.colour ?? C2); K.put(lathe([[w * (o.foot ?? 1.2) + 0.03, 0.04], [w * (o.foot ?? 1.2) + 0.03, 0.1]], S.sides, S.sx, S.sz), TRIM); return; }
    if (kind === 'legs') {                                                      // two short legs, which waddle
      const x = o.x ?? w * 0.5, c = o.colour ?? TRIM;
      K.move(merge([-1, 1].flatMap(sx => [paint(rod([sx * x, 0, 0], [sx * x, -y0 + 0.12, 0], 0.075, 0.06), c), paint(ball(0.1, [sx * x, -y0 * 0.5, 0]), c), paint(T(sph(0.17, 10, 6), { p: [sx * x, -y0 + 0.09, 0.08], s: [1, 0.55, 1.5] }), o.shoe ?? DARK)])), [0, y0, 0], 'waddle', 1); return;
    }
    if (kind === 'tripod') {                                                    // three legs spread from a collar, on little feet
      const R = o.spread ?? 0.8, c = o.colour ?? TRIM;
      K.put(T(cyl(0.16, 0.2, 0.14, 10), { p: [0, y0 - 0.05, 0] }), c);
      for (let i = 0; i < 3; i++) { const a = Math.PI / 2 + Math.PI + i * TAU / 3, fx = Math.cos(a) * R, fz = Math.sin(a) * R; K.put(rod([fx * 0.12, y0 - 0.08, fz * 0.12], [fx, 0.1, fz], 0.045, 0.03), c); K.put(ball(0.09, [fx, 0.09, fz]), DARK); K.put(rod([fx * 0.55, y0 * 0.48, fz * 0.55], [0, y0 * 0.34, 0], 0.016), c); }
      K.put(rod([0, y0 - 0.1, 0], [0, y0 * 0.34, 0], 0.03), c); return;
    }
  };
  return K;
}

// ---- the forms ---------------------------------------------------------------------------------------------
// Each is given K (the kit, with K.L the look) and its own numbers, read from the look with a default. It must
// call K.faceAt, set K.hands = [[x, y, z] left, right], K.top, K.r (how far it reaches sideways, for getting about).
const N = (v, d) => v ?? d;
export const FORMS = {
  // An egg, a barrel, a pear, a bean: the plain parametric body. h, g (girth), waist, shoulder, belly_, deep; with
  // head: { r, neck } a separate head on a neck; any gait.
  egg(K, L) {
    const g = N(L.g, 0.58), h = N(L.h, 1.4), gk = L.gait ?? 'hover', y0 = N(L.lift, gk === 'hover' ? 2.7 : gk === 'skirt' ? 1.0 : gk === 'tracks' ? 0.6 : gk === 'wheels' ? 0.75 : gk === 'legs' ? 1.0 : 2.3), deep = N(L.deep, 0.95);
    K.shell(ovoid(y0, h, g, { waist: N(L.waist, 0.5), shoulder: N(L.shoulder, 2), belly: N(L.belly_, 2) }), { sz: deep });
    const body = K.S, onBody = f => { const s = K.S; K.S = body; const v = f(); K.S = s; return v; };
    let fy = y0 + h * N(L.faceAt, 0.66), top = y0 + h, hr = g;
    if (L.head) { const r = N(L.head.r, g * 0.62), nk = N(L.head.neck, 0.12), hy = y0 + h + nk + r * 0.8;
      if (nk > 0.02) K.put(T(cyl(r * 0.36, r * 0.42, nk + 0.2, 10), { p: [0, y0 + h + nk / 2 - 0.05, 0] }), K.TRIM);
      K.panel(y0 + h * 0.45, g * 1.0, h * 0.42, K.BELLY);
      K.shell(ovoid(hy - r, r * 2, r, { shoulder: 2.2, belly: 2.2, n: 7 }), { sz: 0.95, pattern: 'none' }); fy = hy + r * 0.05; top = hy + r; hr = r;
      K.faceAt(fy, r * 1.5, r * 0.78, { frame: false });
    } else { K.panel(y0 + h * 0.28, g * 1.05, h * 0.34, K.BELLY); K.band(y0 + h * 0.47, y0 + h * 0.5, 0.02, K.TRIM); K.faceAt(fy, g * 1.6, g * 0.84, { frame: false }); }
    K.buttons([0.36, 0.26, 0.16].map(u => y0 + h * u), y => onBody(() => K.front(y) + 0.02));
    K.bowtie(fy - (L.head ? hr * 0.62 : g * 0.52), K.front(fy - (L.head ? hr * 0.55 : g * 0.5)) + 0.03); K.ears(fy, K.side(fy));
    if (L.scarf) K.scarf(fy - (L.head ? hr * 0.7 : g * 0.6));
    const seat = top - hr * 0.26; K.top = Math.max(K.hat(seat, hr), K.topper(top - 0.02, { r: hr }), K.antenna(top));
    K.gait(gk, y0, g, L.gaitO); K.pivot = gk === 'hover' ? y0 + h / 2 : 0;
    K.hands = [-1, 1].map(s => [s * (onBody(() => K.side(y0 + h * 0.42)) + 0.22), y0 + h * 0.42, 0.16]); K.r = g + 0.08; K.shoulder = y0 + h * 0.6;
  },
  // A card catalogue: a tall narrow cabinet of little drawers, on a pair of wheels (Alder)
  cabinet(K, L) {
    const w = N(L.w, 0.5), d = N(L.d, 0.4), h = N(L.h, 4.5), y0 = 0.5, y1 = y0 + h, rows = N(L.rows, 6);
    K.shell([[0, y0], [w - 0.03, y0], [w, y0 + 0.05], [w, y1 - 0.14], [w + 0.04, y1 - 0.1], [w + 0.04, y1], [0, y1]], { sides: 4, sz: d / w, colour: K.C });
    const dy = (h * 0.6) / rows;
    for (let r = 0; r < rows; r++) for (const sx of [-1, 1]) { const y = y0 + 0.22 + (r + 0.5) * dy, x = sx * w * 0.47; K.put(box(w * 0.86, dy * 0.82, 0.03, [x, y, d + 0.012]), K.C2); K.put(box(0.2, 0.09, 0.02, [x, y + 0.03, d + 0.035]), K.TRIM); K.put(box(0.15, 0.05, 0.022, [x, y + 0.03, d + 0.037]), '#f4eee2'); K.put(ball(0.03, [x, y - dy * 0.22, d + 0.04]), K.TRIM); }
    K.faceAt(y1 - 0.62, w * 1.6, w * 0.82, { frame: K.TRIM }); K.buttons([y1 - 1.2], d + 0.03);
    K.top = Math.max(K.hat(y1 - 0.02, w * 1.1), K.topper(y1, {}), K.antenna(y1)); K.ears(y1 - 0.62, w);
    K.gait('wheels', y0, w, { r: 0.26, x: w + 0.08 }); K.hands = [-1, 1].map(s => [s * (w + 0.3), y0 + h * 0.62, 0.22]); K.r = w + 0.16; K.shoulder = y0 + h * 0.72;
  },
  // A stack of six-sided cells that holds a shape, with a flock of loose ones going round under it (Cedric)
  cells(K, L) {
    const g = N(L.g, 0.7), y0 = N(L.lift, 2.0), tiers = L.tiers ?? [[0.8, 0.52], [1, 0.62], [1.05, 0.66], [0.84, 0.5]];
    let y = y0; const ys = [];
    tiers.forEach(([k, th], i) => { const r = g * k; K.put(lathe([[0, y], [r - 0.06, y], [r, y + 0.06], [r, y + th - 0.06], [r - 0.06, y + th], [0, y + th]], 6), i % 2 || !L.colour2 ? K.C : K.C2); if (i) K.put(lathe([[r * 0.8, y - 0.02], [r * 0.8, y + 0.02]], 6), K.TRIM); ys.push([y, y + th, r]); y += th; });
    K.S = { pts: tiers.flatMap((t, i) => [[ys[i][2], ys[i][0] + 0.001], [ys[i][2], ys[i][1] - 0.001]]), sides: 6, sx: 1, sz: 1 };
    const f = ys[Math.min(2, ys.length - 1)], b = ys[Math.min(1, ys.length - 1)];
    K.faceAt((f[0] + f[1]) / 2, f[2] * 1.0, (f[1] - f[0]) * 0.74, { frame: K.TRIM });
    K.buttons([b[1] - 0.3, b[1] - 0.45], b[2] + 0.02); K.bowtie(b[1] - 0.1, b[2] + 0.04); K.ears((f[0] + f[1]) / 2, f[2] / Math.cos(Math.PI / 6) - 0.04);
    K.top = Math.max(K.hat(y - 0.04, g * 0.8), K.topper(y, {}), K.antenna(y));
    K.put(T(new THREE.SphereGeometry(0.3, 12, 5, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, y0 + 0.02, 0], s: [1, 0.5, 1] }), K.TRIM);
    const n = N(L.flock, 11), fl = []; for (let i = 0; i < n; i++) { const a = i / n * TAU + (i % 3) * 0.13, R = 0.6 + (i % 4) * 0.09, cy = ((i * 7) % 5 - 2) * 0.07; fl.push(paint(T(lathe([[0, -0.05], [0.085, -0.05], [0.085, 0.05], [0, 0.05]], 6), { p: [Math.cos(a) * R, cy, Math.sin(a) * R], r: [0.4 * (i % 3), a, 0.3 * (i % 2)] }), i % 3 ? K.TRIM : K.C)); }
    K.move(merge(fl), [0, y0 - 0.42, 0], 'spinY', 0.7); K.floats = true; K.pivot = (y0 + y) / 2;
    K.hands = [-1, 1].map(s => [s * (g + 0.3), b[1] - 0.1, 0.2]); K.r = g + 0.12; K.shoulder = f[0];
  },
  // A spinning top, standing on its point in the air and leaning slowly round (Delphine)
  top(K, L) {
    const g = N(L.g, 0.95), y0 = N(L.lift, 0.75), h = N(L.h, 3.3), yw = y0 + h * 0.42, y1 = y0 + h;
    K.shell([[0, y0], [0.05, y0 + 0.06], [g * 0.5, y0 + h * 0.2], [g * 0.9, yw - 0.22], [g, yw - 0.06], [g, yw + 0.06], [g * 0.93, yw + 0.2], [g * 0.74, y0 + h * 0.62], [g * 0.52, y0 + h * 0.78], [g * 0.24, y0 + h * 0.88], [0.1, y0 + h * 0.9], [0.09, y1 - 0.1], [0.15, y1 - 0.06], [0.15, y1], [0, y1]], { colour: p => (Math.abs(p.y - yw) < 0.085 ? K.C2 : p.y < y0 + h * 0.2 ? K.TRIM : K.C) });
    K.band(yw + 0.2, yw + 0.235, 0.012, K.TRIM); K.band(yw - 0.235, yw - 0.2, 0.012, K.TRIM);
    const fy = y0 + h * 0.64; K.faceAt(fy, 0.95, 0.5, { frame: false }); K.ears(fy, K.side(fy));
    K.top = Math.max(K.hat(y1 - 0.06, 0.62), K.topper(y1, {}), K.antenna(y1)) + 0.05;
    K.ring = { y: y0 - 0.22, r: 0.3 }; K.floats = true; K.pivot = y0; K.wobble = 0.05;
    K.hands = [-1, 1].map(s => [s * (K.side(fy - 0.5) + 0.26), fy - 0.5, 0.3]); K.r = g + 0.05; K.shoulder = fy - 0.2;
  },
  // A cube inside the frame of an octahedron, which turns about it (Euclid)
  solid(K, L) {
    const a = N(L.a, 0.42), cy = N(L.lift, 3.05) + a, R = a * 2.25;
    K.shell([[0, cy - a], [a - 0.04, cy - a], [a, cy - a + 0.04], [a, cy + a - 0.04], [a - 0.04, cy + a], [0, cy + a]], { sides: 4, splitAt: 0.5 });
    K.faceAt(cy + a * 0.36, a * 1.6, a * 0.86, { frame: K.TRIM });
    K.top = Math.max(K.hat(cy + a - 0.02, a * 1.3), K.topper(cy + a, {}), K.antenna(cy + a), cy + R * 0.9);
    const v = [[R, 0, 0], [-R, 0, 0], [0, R, 0], [0, -R, 0], [0, 0, R], [0, 0, -R]], fr = [];
    for (let i = 0; i < 6; i++) { fr.push(paint(ball(0.05, v[i], [1, 1, 1], 8, 6), K.C)); for (let j = i + 1; j < 6; j++) if (!v[i].some((c, k) => c && c === -v[j][k])) fr.push(paint(rod(v[i], v[j], 0.016, 0.016, 5), K.TRIM)); }
    K.move(merge(fr), [0, cy, 0], 'tumble', 0.35); K.floats = true; K.pivot = cy;
    K.hands = [-1, 1].map(s => [s * (a + 0.3), cy - a * 0.5, a + 0.25]); K.r = a + 0.3; K.shoulder = cy; K.glove = 0.095;
  },
  // A plant pot on a stand, with what grows in it, and a line of ants going round the rim (Greta)
  pot(K, L) {
    const g = N(L.g, 0.82), y0 = N(L.lift, 1.25), h = N(L.h, 1.6), y1 = y0 + h, b = g * 0.62;
    K.shell([[0, y0], [b, y0], [b + 0.03, y0 + 0.05], [g - 0.06, y1 - 0.3], [g + 0.03, y1 - 0.27], [g + 0.03, y1], [g - 0.07, y1], [g - 0.09, y1 - 0.08], [0, y1 - 0.08]], { colour: p => (p.y > y1 - 0.09 && Math.hypot(p.x, p.z) < g - 0.075 ? '#3b2a1e' : p.y > y1 - 0.29 ? K.C : K.coat(y0, y1 - 0.3)(p)) });
    const fy = y0 + h * 0.5; K.faceAt(fy, K.side(fy) * 1.45, K.side(fy) * 0.76, { frame: false }); K.ears(y1 - 0.5, K.side(y1 - 0.5));
    const lf = N(L.leaves, 9); for (let i = 0; i < lf; i++) { const a = i / lf * TAU + 0.3, out = 0.5 + (i % 3) * 0.14; K.add(paint(T(sph(0.3, 8, 5), { s: [0.34, 1.25 + (i % 2) * 0.3, 0.1], p: [0, 0.34, 0] }), i % 2 ? '#6f9a4a' : '#86b05a').applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(out, a, 0, 'YXZ')).setPosition(Math.sin(a) * 0.2, y1 - 0.1, Math.cos(a) * 0.2))); }
    K.top = Math.max(K.hat(y1 + 0.42, g * 0.62, { tilt: [0.16, 0, -0.1] }), K.topper(y1 + 0.3, {}), y1 + 0.9); if (L.hat) K.put(T(cyl(0.05, 0.07, 0.5, 6), { p: [0, y1 + 0.18, 0] }), '#5b7a3a');
    K.put(T(cyl(b + 0.14, b + 0.14, 0.09, 20), { p: [0, y0 - 0.045, 0] }), WOOD); for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + Math.PI / 6, x = Math.cos(a) * b, z = Math.sin(a) * b; K.put(rod([x, y0 - 0.08, z], [x * 1.25, 0.14, z * 1.25], 0.05, 0.035), WOOD); K.put(ball(0.11, [x * 1.25, 0.11, z * 1.25]), DARK); }
    K.put(torus(b * 0.9, 0.025, [0, y0 * 0.5, 0], [Math.PI / 2, 0, 0], 18), WOOD);
    const ants = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU + (i % 2) * 0.1; ants.push(paint(T(sph(0.03, 6, 4), { s: [1, 0.8, 2.2], r: [0, -a, 0], p: [Math.cos(a) * (g + 0.04), 0.025, Math.sin(a) * (g + 0.04)] }), DARK)); }
    K.move(merge(ants), [0, y1, 0], 'spinY', 0.5);
    K.hands = [-1, 1].map(s => [s * (g + 0.28), y0 + h * 0.62, 0.3]); K.r = g + 0.1; K.shoulder = y0 + h * 0.7;
  },
  // A herm: a square pillar, wider at the shoulder, with a head on it (Horatio)
  herm(K, L) {
    const w = N(L.w, 0.42), h = N(L.h, 3.5), y0 = 0.3, y1 = y0 + h, r = N(L.headR, 0.5);
    K.put(lathe([[0, 0.05], [w + 0.2, 0.05], [w + 0.2, 0.2], [w + 0.06, y0], [0, y0]], 4), N(L.plinth, '#cfc6b4'));
    K.shell([[w * 0.74, y0], [w, y1 - 0.2], [w + 0.2, y1 - 0.14], [w + 0.2, y1 + 0.1], [w * 0.6, y1 + 0.16], [0, y1 + 0.16]], { sides: 4, sz: 0.82, colour: K.C });
    K.buttons([0.35, 0.5, 0.65, 0.8].map(u => y0 + h * u), y => K.front(y) + 0.02); if (L.buttons) for (const sx of [-1, 1]) K.put(box(0.3, 0.05, 0.3, [sx * (w + 0.06), y1 + 0.12, 0]), L.buttons);
    const zb = K.front(y1 - 0.05), hy = y1 + 0.2 + r * 0.9; K.put(T(cyl(r * 0.4, r * 0.5, 0.2, 10), { p: [0, y1 + 0.22, 0] }), K.C);
    K.shell(ovoid(hy - r, r * 2, r, { shoulder: 2.3, belly: 2.3, n: 7 }), { sz: 0.95, colour: K.C }); K.faceAt(hy + 0.03, r * 1.55, r * 0.8, { frame: false }); K.ears(hy, r);
    K.bowtie(y1 + 0.02, zb + 0.04); K.top = Math.max(K.hat(hy + r * 0.74, r), K.topper(hy + r, { r }), K.antenna(hy + r));
    K.hands = [-1, 1].map(s => [s * (w + 0.48), y1 - 0.55, 0.2]); K.r = w + 0.26; K.shoulder = y1;
  },
  // A lantern: six panes in a frame, a roof, a ring to carry it by (Isolde)
  lantern(K, L) {
    const g = N(L.g, 0.5), y0 = N(L.lift, 2.45), h = N(L.h, 1.25), ya = y0 + 0.2, yb = ya + h;
    K.shell([[0, y0], [g * 0.84, y0], [g + 0.04, y0 + 0.1], [g + 0.04, ya], [g - 0.04, ya], [g - 0.04, yb], [g + 0.12, yb], [g + 0.12, yb + 0.07], [g * 0.45, yb + 0.42], [0.1, yb + 0.5], [0, yb + 0.5]], { sides: 6, colour: p => (p.y > ya + 0.005 && p.y < yb - 0.005 ? N(L.glass, '#f3d9a0') : K.coat(y0, yb + 0.5)(p)) });
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + Math.PI / 6, R = (g - 0.02) / Math.cos(Math.PI / 6); K.put(rod([Math.sin(a) * R, ya, Math.cos(a) * R], [Math.sin(a) * R, yb, Math.cos(a) * R], 0.03), K.C); }
    K.faceAt((ya + yb) / 2 + 0.05, g * 1.0, g * 0.56, { frame: false });
    K.put(torus(0.12, 0.022, [0, yb + 0.6, 0], [0, 0, 0], 14), K.TRIM);
    K.top = Math.max(K.hat(yb + 0.3, g * 0.9), K.topper(yb + 0.62, { r: g * 1.3 }), K.antenna(yb + 0.5));
    K.gait('hover', y0, g, {}); K.pivot = (ya + yb) / 2;
    K.hands = [-1, 1].map(s => [s * (g + 0.36), ya + h * 0.3, 0.2]); K.r = g + 0.16; K.shoulder = yb;
  },
  // A toolbox with a round lid, on two short legs, with arms (Jasper)
  toolbox(K, L) {
    const w = N(L.w, 0.86), d = N(L.d, 0.5), h = N(L.h, 0.95), y0 = N(L.lift, 1.2), y1 = y0 + h;
    K.shell([[0, y0], [d - 0.03, y0], [d, y0 + 0.03], [d, y1], [0, y1]], { sides: 4, sx: w / d, colour: K.C });
    K.put(T(new THREE.CylinderGeometry(d, d, w * 2, 16, 1, false, 0, Math.PI), { r: [0, 0, Math.PI / 2], s: [0.62, 1, 1], p: [0, y1, 0] }), K.C);
    K.put(box(w * 2 + 0.03, 0.09, d * 2 + 0.03, [0, y1 - 0.02, 0]), K.C2);
    for (const sx of [-1, 1]) { K.put(box(0.16, 0.2, 0.04, [sx * w * 0.62, y1 - 0.04, d + 0.03]), K.TRIM); K.put(box(0.05, 0.3, d * 2 + 0.04, [sx * (w - 0.1), y0 + h * 0.5, 0]), K.TRIM); }
    K.put(tube([[-0.34, y1 + d * 0.56, 0], [-0.3, y1 + d * 0.62 + 0.2, 0], [0.3, y1 + d * 0.62 + 0.2, 0], [0.34, y1 + d * 0.56, 0]], 0.035, 10, 5), DARK);
    K.faceAt(y0 + h * 0.52, 0.9, 0.48, { frame: K.TRIM });
    K.top = Math.max(K.hat(y1 + d * 0.5, 0.6, { x: w * 0.42, tilt: [-0.05, 0, -0.3] }), K.topper(y1 + d * 0.62, { x: -w * 0.5 }), K.antenna(y1 + d * 0.62), y1 + d * 0.62 + 0.24);
    K.gait(L.gait ?? 'legs', y0, w, { x: w * 0.5, colour: K.TRIM }); K.arms = L.arms ?? true;
    K.hands = [-1, 1].map(s => [s * (w + 0.36), y0 + h * 0.45, 0.34]); K.r = w + 0.06; K.shoulder = y0 + h * 0.8; K.armX = w;
  },
  // A book, standing up in the air (Linnet)
  book(K, L) {
    const w = N(L.w, 0.5), h = N(L.h, 1.3), d = N(L.d, 0.17), y0 = N(L.lift, 3.0), y1 = y0 + h, cy = y0 + h / 2;
    K.put(box(w * 2 - 0.1, h - 0.08, d * 2 - 0.05, [0.03, cy, 0]), '#f1e9d6');
    for (const sz of [-1, 1]) K.put(slab(w * 2, h, 0.045, 0.1, [0, cy, sz * d]), K.coat(y0, y1));      // (its boards, with their corners rounded by wear)
    K.put(T(cyl(d + 0.02, d + 0.02, h, 10, 1, false, Math.PI, Math.PI), { p: [-w + 0.02, cy, 0] }), K.C); for (const u of [0.2, 0.8]) K.put(T(cyl(d + 0.03, d + 0.03, 0.03, 10, 1, false, Math.PI, Math.PI), { p: [-w + 0.02, y0 + h * u, 0] }), K.TRIM);
    K.faceAt(cy + h * 0.14, w * 1.5, w * 0.78, { flat: [0.02, cy + h * 0.14, d + 0.036], frame: K.TRIM });
    K.put(box(w * 0.9, 0.1, 0.012, [0.02, y0 + h * 0.2, d + 0.024]), K.TRIM); K.put(box(0.07, 0.5, 0.012, [w * 0.4, y0 - 0.18, 0]), '#b8452e');
    K.ears(cy + h * 0.14, w - 0.04); K.top = Math.max(K.hat(y1, w), K.topper(y1 - 0.06, { x: -0.05 }), K.antenna(y1));
    K.S = { pts: [[w, y0], [w, y1]], sides: 4, sx: 1, sz: d / w }; K.gait('hover', y0, 0.5, { ring: 0.24 }); K.pivot = cy;
    K.hands = [-1, 1].map(s => [s * (w + 0.24), y0 + h * 0.3, d + 0.12]); K.r = w + 0.08; K.shoulder = cy; K.glove = 0.085;
  },
  // A teapot: spout, handle, a lid with a knob (Mabel)
  teapot(K, L) {
    const g = N(L.g, 0.95), y0 = N(L.lift, 2.25), h = N(L.h, 1.75), y1 = y0 + h;
    K.shell([[0, y0], [g * 0.48, y0], [g * 0.52, y0 + 0.05], [g * 0.5, y0 + 0.1], [g * 0.84, y0 + h * 0.22], [g, y0 + h * 0.46], [g, y0 + h * 0.6], [g * 0.88, y0 + h * 0.82], [g * 0.62, y0 + h * 0.96], [g * 0.54, y1], [g * 0.5, y1 + 0.06], [g * 0.3, y1 + 0.17], [0, y1 + 0.2]], { bandAt: 0.56, bandW: 0.03, c1: y1 });
    K.band(y1 - 0.01, y1 + 0.03, 0.015, K.C2);
    K.put(tube([[g * 0.86, y0 + h * 0.36, 0], [g * 1.22, y0 + h * 0.5, 0], [g * 1.34, y0 + h * 0.78, 0], [g * 1.52, y0 + h * 0.95, 0]], 0.1, 8, 7), K.C); K.put(torus(0.1, 0.022, [g * 1.52, y0 + h * 0.95, 0], [Math.PI / 2, 0.6, 0], 10), K.C2);
    K.put(tube([[-g * 0.9, y0 + h * 0.76, 0], [-g * 1.36, y0 + h * 0.8, 0], [-g * 1.45, y0 + h * 0.5, 0], [-g * 0.96, y0 + h * 0.3, 0]], 0.06, 10, 6), K.C);
    const fy = y0 + h * 0.76; K.faceAt(fy, 0.92, 0.46, { frame: false });
    if (L.apron) { K.panel(y0 + h * 0.33, g * 1.2, h * 0.4, L.apron, 0.012); K.band(y0 + h * 0.52, y0 + h * 0.545, 0.016, L.apron); K.panel(y0 + h * 0.27, 0.36, 0.16, K.TRIM, 0.024); }      // (the pocket, on the apron)
    K.top = Math.max(K.hat(y1 + 0.16, 0.56), K.topper(y1 + 0.18, {}), K.antenna(y1 + 0.2), y1 + 0.45); if (!L.hat) K.put(ball(0.1, [0, y1 + 0.27, 0]), K.C2);
    K.gait('hover', y0, g * 0.8, {}); K.pivot = y0 + h * 0.5;
    K.hands = [-1, 1].map(s => [s * g * 0.72, y0 + h * 0.34, g * 0.86]); K.r = g + 0.1; K.shoulder = y0 + h * 0.6;
  },
  // A metronome: a tall four-sided spire with its pendulum ticking on the front (Odette)
  metronome(K, L) {
    const w = N(L.w, 0.62), h = N(L.h, 5.0), y0 = 0.5, y1 = y0 + h, wt = N(L.wTop, 0.24);
    K.put(lathe([[0, 0.05], [w + 0.05, 0.05], [w + 0.07, 0.12], [w + 0.05, y0], [0, y0]], 4, 1, 0.85), K.C2);
    K.shell([[w, y0], [wt, y1 - 0.1], [wt - 0.05, y1], [0, y1]], { sides: 4, sz: 0.85, splitAt: 0.16 });
    const fy = y0 + h * 0.8; K.faceAt(fy, K.side(fy) * 1.72, K.side(fy) * 0.9, { frame: K.TRIM });
    const pa = y0 + h * 0.2, pb = y0 + h * 0.66, slope = Math.atan2(K.front(pa) - K.front(pb), pb - pa);
    K.put(T(new THREE.BoxGeometry(0.2, pb - pa, 0.015), { r: [-slope, 0, 0], p: [0, (pa + pb) / 2, (K.front(pa) + K.front(pb)) / 2 + 0.012] }), K.BELLY);
    for (let i = 0; i < 9; i++) { const y = pa + (pb - pa) * (i + 0.5) / 9; K.put(box(i % 2 ? 0.09 : 0.14, 0.014, 0.012, [0, y, K.front(y) + 0.026]), DARK); }
    K.move(merge([paint(rod([0, 0, 0], [0, (pb - pa) * 0.96, 0], 0.014, 0.014, 5), K.TRIM), paint(box(0.2, 0.15, 0.06, [0, (pb - pa) * N(L.weight, 0.62), 0]), K.TRIM), paint(ball(0.04, [0, 0, 0]), K.TRIM)]), [0, pa, K.front(pa) + 0.07], 'swing', 2.6, { tilt: -slope, amp: 0.15 });
    K.scarf(fy - 0.3, true, { h: 0.06, len: 0.44 });
    K.ears(fy, K.side(fy)); K.top = Math.max(K.hat(y1 - 0.03, wt * 2), K.topper(y1, {}), K.antenna(y1));
    K.hands = [-1, 1].map(s => [s * (K.side(y0 + h * 0.52) + 0.3), y0 + h * 0.52, 0.2]); K.r = w + 0.08; K.shoulder = y0 + h * 0.6;
  },
  // A nerve cell: a round body, a crown of branching dendrites, and an axon trailing behind (Quince)
  neuron(K, L) {
    const g = N(L.g, 0.6), cy = N(L.lift, 2.75) + g, n = N(L.dendrites, 7);
    K.shell(ovoid(cy - g, g * 2, g, {}), {}); K.panel(cy - g * 0.5, g * 0.9, g * 0.5, K.BELLY);
    K.faceAt(cy + g * 0.22, g * 1.56, g * 0.8, { frame: false }); K.ears(cy + 0.05, g);
    for (let i = 0; i < n; i++) { const a = Math.PI * (0.62 + 0.76 * i / (n - 1)) + Math.PI / 2 + (i % 2) * 0.2, el = 0.35 + (i % 3) * 0.3, dir = [Math.cos(a) * Math.cos(el), Math.sin(el), Math.sin(a) * Math.cos(el)], len = 0.5 + (i % 3) * 0.16;
      const p0 = dir.map((c, k) => c * g * 0.92 + (k === 1 ? cy : 0)), p1 = dir.map((c, k) => c * (g + len) + (k === 1 ? cy : 0)); K.put(rod(p0, p1, 0.06, 0.028, 5), K.C);
      for (const s of [-1, 1]) { const q = [p1[0] + dir[0] * 0.22 + s * dir[2] * 0.2, p1[1] + dir[1] * 0.22 + 0.1 * s, p1[2] + dir[2] * 0.22 - s * dir[0] * 0.2]; K.put(rod(p1, q, 0.026, 0.014, 4), K.C); K.put(ball(0.04, q, [1, 1, 1], 6, 4), K.TRIM); } }
    K.put(tube([[0, cy - g * 0.9, -g * 0.3], [0, cy - g * 1.5, -g * 0.9], [0, cy - g * 2.4, -g * 1.0], [0, cy - g * 3.0, -g * 0.6]], 0.05, 10, 5), K.C);
    for (const u of [1.55, 2.1, 2.62]) K.put(ball(0.11, [0, cy - g * u, -g * (u < 2 ? 0.93 : u < 2.4 ? 1.0 : 0.86)], [0.9, 1.5, 0.9], 8, 6), K.BELLY);
    K.top = Math.max(K.hat(cy + g * 0.74, g), K.topper(cy + g - 0.02, { r: g }), K.antenna(cy + g), cy + g + 0.5);
    K.gait('hover', cy - g, g, {}); K.pivot = cy; K.hands = [-1, 1].map(s => [s * (g + 0.24), cy - g * 0.3, 0.3]); K.r = g + 0.2; K.shoulder = cy;
  },
  // A bucket in a hat, riding a floor polisher whose brush goes round (Rowan)
  bucket(K, L) {
    const g = N(L.g, 0.78), y0 = N(L.lift, 1.0), h = N(L.h, 1.6), y1 = y0 + h, b = g * 0.68;
    K.put(lathe([[0, 0.14], [g + 0.1, 0.14], [g + 0.14, 0.24], [g + 0.12, 0.44], [g * 0.5, 0.62], [0.26, y0 + 0.02], [0, y0 + 0.02]], 20), '#4a4d52'); K.put(torus(g + 0.13, 0.03, [0, 0.3, 0], [Math.PI / 2, 0, 0], 26), K.TRIM);
    K.shell([[0, y0], [b, y0], [b + 0.02, y0 + 0.04], [g, y1 - 0.08], [g + 0.035, y1 - 0.06], [g + 0.035, y1], [0, y1]], { colour: K.C });
    K.band(y0 + h * 0.2, y0 + h * 0.23, 0.012, K.TRIM);
    const fy = y0 + h * 0.6; K.faceAt(fy, K.side(fy) * 1.5, K.side(fy) * 0.78, { frame: false }); K.ears(fy, K.side(fy));
    K.put(tube([[-g - 0.03, y1 - 0.2, 0], [-g * 0.8, y1 - 0.75, -g * 0.75], [0, y1 - 0.95, -g * 1.08], [g * 0.8, y1 - 0.75, -g * 0.75], [g + 0.03, y1 - 0.2, 0]], 0.022, 14, 5), '#b9bcc0');
    if (L.scarf) K.scarf(y0 + h * 0.3);
    K.top = Math.max(K.hat(y1 - 0.02, g * 1.27, { tilt: [-0.04, 0, -0.05] }), K.topper(y1, {}), K.antenna(y1));
    const br = []; for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; br.push(paint(new THREE.CylinderGeometry(g + 0.1, g + 0.12, 0.11, 3, 1, false, a, TAU / 12), i % 2 ? '#d9c58a' : '#b89a55')); }
    K.move(merge(br), [0, 0.075, 0], 'spinY', 2.2);
    K.hands = [-1, 1].map(s => [s * (K.side(fy) + 0.3), y0 + h * 0.4, 0.3]); K.r = g + 0.14; K.shoulder = y0 + h * 0.7;
  },
  // A horseshoe magnet, poles down, held up by nothing (Sorrel)
  magnet(K, L) {
    const R = N(L.w, 0.5), t = N(L.t, 0.2), leg = N(L.h, 0.75), y0 = N(L.lift, 2.75), ya = y0 + leg, dz = 1.25;
    K.put(T(new THREE.TorusGeometry(R, t, 8, 18, Math.PI), { p: [0, ya, 0], s: [1, 1, dz] }), K.C);
    for (const sx of [-1, 1]) { K.put(T(cyl(t, t, leg * 0.62, 10), { p: [sx * R, ya - leg * 0.31, 0], s: [1, 1, dz] }), K.C); K.put(T(cyl(t + 0.012, t + 0.012, leg * 0.4, 10), { p: [sx * R, y0 + leg * 0.2, 0], s: [1, 1, dz] }), K.C2); }
    const fy = ya + R * 0.98; K.put(slab(0.8, 0.46, 0.08, 0.13, [0, fy - 0.02, t * dz - 0.02]), K.C); K.faceAt(fy, 0.74, 0.4, { flat: [0, fy - 0.02, t * dz + 0.04], frame: K.TRIM });
    for (const [x, y, a] of [[-0.17, y0 - 0.14, 0.5], [0.02, y0 - 0.3, 0], [0.2, y0 - 0.12, -0.6], [-0.05, y0 + 0.05, 1.2]]) K.put(box(0.022, 0.13, 0.022, [x, y, 0], [0, 0, a]), '#8a8f96');      // filings, held between the poles
    K.top = Math.max(K.hat(ya + R + t - 0.04, 0.5), K.topper(ya + R + t - 0.02, {}), K.antenna(ya + R + t));
    K.S = { pts: [[R + t, y0], [R + t, ya + R]], sides: 20, sx: 1, sz: 0.5 }; K.ring = { y: y0 - 0.5, r: 0.3 }; K.floats = true; K.pivot = ya;
    K.hands = [-1, 1].map(s => [s * (R + t + 0.26), ya - 0.1, 0.24]); K.r = R + t + 0.06; K.shoulder = ya + 0.2; K.glove = 0.1;
  },
  // A rack of lamps wired layer to layer, on tracks (Tobias)
  rack(K, L) {
    const w = N(L.w, 0.62), d = N(L.d, 0.3), h = N(L.h, 3.5), y0 = 0.56, y1 = y0 + h, rows = N(L.rows, 4), cols = N(L.cols, 4);
    K.shell([[0, y0], [d, y0], [d, y1 - 0.05], [d - 0.05, y1], [0, y1]], { sides: 4, sx: w / d, bandAt: 0.79, bandW: 0.014 });
    const fy = y1 - 0.42; K.faceAt(fy, w * 1.5, w * 0.78, { frame: K.TRIM });
    const ya = y0 + 0.3, yb = y0 + h * 0.7, lamps = [], px = c => (c - (cols - 1) / 2) * (w * 1.5 / (cols - 1)), py = r => ya + (yb - ya) * r / (rows - 1);
    K.put(box(w * 1.8, yb - ya + 0.3, 0.02, [0, (ya + yb) / 2, d + 0.01]), '#23262b');
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { K.put(T(cyl(0.06, 0.06, 0.03, 8), { p: [px(c), py(r), d + 0.03], r: [Math.PI / 2, 0, 0] }), K.TRIM); (((r * 3 + c * 5) % 3) ? lamps : K.parts).push(paint(ball(0.05, [px(c), py(r), d + 0.05], [1, 1, 0.7], 8, 5), ((r + c) % 2) ? '#ffd9a0' : '#ffb07a'));
      if (r < rows - 1) for (const c2 of [c - 1, c + 1]) if (c2 >= 0 && c2 < cols && (r + c + c2) % 2) K.put(rod([px(c), py(r), d + 0.026], [px(c2), py(r + 1), d + 0.026], 0.007, 0.007, 3), '#8a8f96'); }
    K.move(merge(lamps), [0, 0, 0], 'blink', 1);
    K.ears(fy, w); K.top = Math.max(K.hat(y1 - 0.02, w), K.topper(y1, {}), K.antenna(y1), L.headphones ? y1 + 0.1 : y1);
    K.gait('tracks', y0, w, { len: 1.25, x: w * 0.72, deck: '#3a3f46' });
    K.hands = [-1, 1].map(s => [s * (w + 0.3), y0 + h * 0.55, 0.26]); K.r = w + 0.14; K.shoulder = y0 + h * 0.66;
  },
  // An egg on a surveyor's tripod, with a collar (Percival): the plain egg, with the tripod for a gait
  instrument(K, L) { FORMS.egg(K, { ...L, gait: 'tripod', lift: N(L.lift, 2.75), gaitO: { spread: N(L.spread, 0.78) } }); K.r = Math.max(K.r, N(L.spread, 0.78) * 0.95); },
  // An hourglass in its frame, the sand run half through (Ansel)
  hourglass(K, L) {
    const g = N(L.g, 0.52), h = N(L.h, 2.1), y0 = N(L.lift, 2.0), y1 = y0 + h, m = y0 + h / 2, glass = N(L.glass, '#dfe9ea'), sand = N(L.sand, '#d9a05a');
    for (const y of [y0, y1 - 0.1]) K.put(T(cyl(g + 0.14, g + 0.14, 0.1, 18), { p: [0, y + 0.05, 0] }), K.C); for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + Math.PI / 3; K.put(rod([Math.sin(a) * (g + 0.06), y0 + 0.1, Math.cos(a) * (g + 0.06)], [Math.sin(a) * (g + 0.06), y1 - 0.1, Math.cos(a) * (g + 0.06)], 0.035), K.C); }
    K.shell([[0, y0 + 0.1], [g, y0 + 0.1], [g, y0 + 0.34], [g * 0.8, m - 0.34], [0.07, m - 0.02], [0.07, m + 0.02], [g * 0.8, m + 0.34], [g, y1 - 0.34], [g, y1 - 0.1], [0, y1 - 0.1]], { colour: p => (p.y < y0 + h * 0.3 || (p.y > m + 0.1 && p.y < m + 0.3) ? sand : glass) });
    const fy = y1 - 0.4; K.faceAt(fy, g * 1.5, g * 0.76, { frame: false }); K.ears(fy, g);
    K.top = Math.max(K.hat(y1 - 0.02, g * 1.2), K.topper(y1, {}), K.antenna(y1));
    K.gait(L.gait ?? 'hover', y0, g, {}); K.pivot = m; K.hands = [-1, 1].map(s => [s * (g + 0.42), m - 0.1, 0.24]); K.r = g + 0.18; K.shoulder = m + 0.3;
  },
  // An oscilloscope on a trolley: the screen is the face (Ottoline)
  scope(K, L) {
    const w = N(L.w, 0.62), d = N(L.d, 0.55), h = N(L.h, 1.1), y0 = N(L.lift, 2.2), y1 = y0 + h;
    K.shell([[0, y0], [d - 0.04, y0], [d, y0 + 0.04], [d, y1 - 0.04], [d - 0.04, y1], [0, y1]], { sides: 4, sx: w / d, colour: K.C });
    K.put(slab(w * 2 - 0.08 - 2 * cornerR(w, d), h - 0.08, 0.03, 0.08, [0, y0 + h / 2, d + 0.01]), K.C2);
    K.put(T(cyl(0.38, 0.4, 0.06, 20), { p: [-w * 0.3, y0 + h * 0.56, d + 0.03], r: [Math.PI / 2, 0, 0] }), K.TRIM);
    K.faceAt(y0 + h * 0.56, 0.62, 0.36, { flat: [-w * 0.3, y0 + h * 0.56, d + 0.066], frame: false });
    for (const [x, y, r] of [[0.62, 0.78, 0.07], [0.62, 0.5, 0.07], [0.62, 0.24, 0.05], [0.84, 0.24, 0.05], [-0.3, 0.13, 0.04], [0.1, 0.13, 0.04]]) { K.put(T(cyl(r, r, 0.07, 10), { p: [w * x, y0 + h * y, d + 0.05], r: [Math.PI / 2, 0, 0] }), DARK); K.put(box(0.012, r * 0.9, 0.012, [w * x, y0 + h * y + r * 0.4, d + 0.09]), '#f4eee2'); }
    K.put(tube([[-w * 0.6, y1, 0], [-w * 0.5, y1 + 0.2, 0], [w * 0.5, y1 + 0.2, 0], [w * 0.6, y1, 0]], 0.03, 8, 5), DARK);
    K.top = Math.max(K.hat(y1, 0.55, { x: -w * 0.3 }), K.topper(y1, { x: w * 0.55 }), K.antenna(y1), y1 + 0.24);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) K.put(rod([sx * (w - 0.08), y0, sz * (d - 0.08)], [sx * (w - 0.02), 0.5, sz * (d - 0.04)], 0.03), K.TRIM); K.put(box(w * 2, 0.04, d * 2, [0, y0 * 0.45, 0]), K.TRIM);
    K.gait('wheels', 0.5, w - 0.1, { r: 0.24, x: w + 0.02 }); K.ears(y0 + h * 0.56, w);
    K.hands = [-1, 1].map(s => [s * (w + 0.3), y0 + h * 0.3, d + 0.1]); K.r = w + 0.16; K.shoulder = y0 + h * 0.6;
  },
  // A pencil, point down, a hand's breadth off the floor (Pim)
  pencil(K, L) {
    const g = N(L.g, 0.3), h = N(L.h, 3.4), y0 = N(L.lift, 0.5), tip = N(L.tip, 0.75), y1 = y0 + h;
    K.put(lathe([[0, y0], [0.06, y0 + tip * 0.2], [g * 0.94, y0 + tip]], 12), p => (p.y < y0 + tip * 0.24 ? '#2a2622' : '#e2c79a'));
    K.shell([[g, y0 + tip], [g, y1 - 0.5]], { sides: 6, colour: K.coat(y0 + tip, y1 - 0.5) });
    K.put(T(cyl(g * 1.1, g * 1.1, 0.22, 14), { p: [0, y1 - 0.39, 0] }), K.TRIM); K.put(T(cyl(g * 1.02, g * 0.98, 0.26, 14), { p: [0, y1 - 0.15, 0] }), N(L.rubber, '#e79a8f')); K.put(ball(g * 0.98, [0, y1 - 0.02, 0], [1, 0.3, 1], 14, 6), N(L.rubber, '#e79a8f'));
    const fy = y1 - 1.05; K.faceAt(fy, g * 1.08, g * 0.58, { frame: false }); K.ears(fy, g / Math.cos(Math.PI / 6) - 0.02);
    K.top = Math.max(K.hat(y1 - 0.02, g * 1.5), K.topper(y1, {}), K.antenna(y1));
    K.ring = { y: y0 - 0.16, r: 0.2 }; K.floats = true; K.pivot = y0 + h * 0.5; K.wobble = 0.03;
    K.hands = [-1, 1].map(s => [s * (g + 0.3), y1 - 1.6, 0.18]); K.r = g + 0.22; K.shoulder = y1 - 1.3; K.glove = 0.095;
  },
  // A straw skep, with its bees (Tansy)
  skep(K, L) {
    const g = N(L.g, 0.56), h = N(L.h, 1.15), y0 = N(L.lift, 2.6), y1 = y0 + h, coils = N(L.coils, 6), pts = [[0, y0]];
    for (let i = 0; i < coils; i++) { const u0 = i / coils, u1 = (i + 1) / coils, r = u => g * Math.pow(1 - Math.pow(u, 2.4), 1 / 2.2), rm = r((u0 + u1) / 2) + 0.035; pts.push([r(u0) - 0.01, y0 + h * u0 + 0.01], [rm, y0 + h * (u0 + u1) / 2]); }
    pts.push([0.04, y1], [0, y1]); K.shell(pts, { stripes: coils, pattern: L.pattern ?? 'stripes' });
    K.put(T(cyl(g + 0.12, g + 0.12, 0.07, 18), { p: [0, y0 - 0.02, 0] }), WOOD);
    const fy = y0 + h * 0.42; K.faceAt(fy, g * 1.35, g * 0.7, { frame: false, off: 0.05 }); K.put(ball(0.07, [0, y0 + 0.1, K.front(y0 + 0.1)], [1.4, 1, 0.5], 8, 5), DARK);
    K.top = Math.max(K.hat(y1 - 0.1, g * 0.7), K.topper(y1, {}), K.antenna(y1));
    const bees = []; for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, R = g + 0.28 + (i % 3) * 0.12, y = ((i * 3) % 5) * 0.16; bees.push(paint(T(sph(0.05, 6, 5), { s: [1, 1, 1.6], r: [0, -a, 0], p: [Math.cos(a) * R, y, Math.sin(a) * R] }), i % 2 ? '#e9b83a' : '#3a2a20'), paint(T(sph(0.04, 5, 3), { s: [1.6, 0.15, 0.8], r: [0, -a, 0], p: [Math.cos(a) * R, y + 0.05, Math.sin(a) * R] }), '#f4f1ea')); }
    K.move(merge(bees), [0, y0 + 0.3, 0], 'spinY', 1.6); K.floats = true; K.pivot = y0 + h / 2; K.put(T(new THREE.SphereGeometry(0.26, 12, 5, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, y0 - 0.05, 0], s: [1, 0.5, 1] }), K.TRIM);
    K.hands = [-1, 1].map(s => [s * (g + 0.2), y0 + h * 0.2, 0.3]); K.r = g + 0.2; K.shoulder = y0 + h * 0.5; K.glove = 0.095;
  },
  // A mug of something hot, with a handle (Nettle)
  mug(K, L) {
    const g = N(L.g, 0.5), h = N(L.h, 1.15), y0 = N(L.lift, 2.3), y1 = y0 + h;
    K.shell([[0, y0], [g * 0.9, y0], [g * 0.96, y0 + 0.05], [g, y0 + 0.2], [g, y1], [g - 0.05, y1], [g - 0.06, y1 - 0.08], [0, y1 - 0.08]], { colour: p => (p.y > y1 - 0.085 && Math.hypot(p.x, p.z) < g - 0.055 ? N(L.drink, '#4a2c1a') : K.coat(y0, y1)(p)) });
    K.put(tube([[g - 0.02, y0 + h * 0.8, 0], [g + 0.34, y0 + h * 0.78, 0], [g + 0.36, y0 + h * 0.3, 0], [g - 0.02, y0 + h * 0.24, 0]], 0.055, 10, 6), K.C);
    const fy = y0 + h * 0.55; K.faceAt(fy, g * 1.5, g * 0.76, { frame: false });
    for (const [x, y, s] of [[-0.12, 0.2, 0.07], [0.08, 0.42, 0.09], [-0.04, 0.68, 0.06]]) K.put(ball(s, [x, y1 + y, 0.02 - x * 0.3], [1, 1.5, 1], 7, 5), '#f4f1ea');
    K.top = Math.max(K.hat(y1 - 0.03, g * 1.25), K.topper(y1 - 0.08, {}), K.antenna(y1), y1 + 0.8);
    K.gait(L.gait ?? 'hover', y0, g, {}); K.pivot = y0 + h / 2; K.hands = [-1, 1].map(s => [s * (g + (s > 0 ? 0.5 : 0.22)), y0 + h * 0.3, 0.3]); K.r = g + 0.2; K.shoulder = y0 + h * 0.6; K.glove = 0.095;
  },
  // A pressure vessel on casters: a drum, a domed lid with its clamps, a gauge (Winifred)
  drum(K, L) {
    const g = N(L.g, 0.9), h = N(L.h, 2.5), y0 = 0.55, y1 = y0 + h;
    K.shell([[0, y0], [g - 0.08, y0], [g, y0 + 0.1], [g, y1 - 0.02], [g + 0.06, y1], [g + 0.06, y1 + 0.1], [g * 0.9, y1 + 0.2], [g * 0.5, y1 + 0.42], [0, y1 + 0.48]], { colour: p => (p.y > y1 ? K.C2 : K.coat(y0, y1)(p)) });
    K.band(y0 + h * 0.3, y0 + h * 0.33, 0.014, K.TRIM); K.band(y1 - 0.02, y1 + 0.1, 0.02, K.TRIM);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.39; K.put(box(0.1, 0.2, 0.08, [Math.sin(a) * (g + 0.09), y1 + 0.05, Math.cos(a) * (g + 0.09)], [0, a, 0]), DARK); }
    const fy = y0 + h * 0.72; K.faceAt(fy, 1.0, 0.52, { frame: false }); K.panel(y0 + h * 0.3, 0.7, 0.5, K.BELLY, 0.01); K.buttons([y0 + h * 0.36, y0 + h * 0.26], y => K.front(y) + 0.03);
    K.put(T(cyl(0.03, 0.03, 0.2, 6), { p: [0.3, y1 + 0.42, 0] }), K.TRIM); K.put(T(cyl(0.15, 0.15, 0.05, 14), { p: [0.3, y1 + 0.58, 0.02], r: [Math.PI / 2 - 0.3, 0, 0] }), '#f4eee2'); K.put(torus(0.15, 0.02, [0.3, y1 + 0.58, 0.02], [-0.3, 0, 0], 14), K.TRIM);
    K.put(torus(0.2, 0.025, [-0.2, y1 + 0.52, 0], [Math.PI / 2, 0, 0], 14), DARK); K.put(T(cyl(0.03, 0.03, 0.16, 6), { p: [-0.2, y1 + 0.44, 0] }), DARK);
    K.ears(fy, g); K.top = Math.max(K.hat(y1 + 0.34, g * 0.8), K.topper(y1 + 0.46, {}), K.antenna(y1 + 0.46), y1 + 0.75);
    K.gait('wheels', y0, g * 0.8, { r: 0.24, x: g * 0.86, stem: DARK }); K.hands = [-1, 1].map(s => [s * (g + 0.26), y0 + h * 0.52, 0.34]); K.r = g + 0.1; K.shoulder = y0 + h * 0.75;
  },
  // A cut stone: two pyramids base to base, from another maker altogether (Caspian)
  gem(K, L) {
    const g = N(L.g, 0.66), h = N(L.h, 2.0), y0 = N(L.lift, 2.2), y1 = y0 + h, yw = y0 + h * N(L.waist, 0.56), sides = N(L.sides, 5);
    K.shell([[0, y0], [g * 0.5, y0 + (yw - y0) * 0.5], [g, yw - 0.14], [g, yw + 0.14], [g * 0.62, yw + (y1 - yw) * 0.55], [g * 0.22, y1], [0, y1]], { sides, bandAt: (yw - y0) / h, bandW: 0.07 });
    const fy = yw + (y1 - yw) * 0.34; K.faceAt(fy, K.side(fy) * 1.34, K.side(fy) * 0.7, { frame: K.TRIM }); K.ears(fy, K.side(fy));
    K.top = Math.max(K.hat(y1 - 0.1, g * 0.6), K.topper(y1, {}), K.antenna(y1));
    if ((L.gait ?? 'hover') === 'hover') { K.ring = { y: y0 - 0.24, r: 0.3, seg: 5 }; K.floats = true; } else K.gait(L.gait, y0, g * 0.5, {});
    K.pivot = yw; K.hands = [-1, 1].map(s => [s * (g + 0.26), yw - 0.25, 0.3]); K.r = g + 0.12; K.shoulder = yw;
  },
  // A retort: a round flask with a long beak bent down to one side (Barnaby)
  retort(K, L) {
    const g = N(L.g, 0.6), y0 = N(L.lift, 2.4), cy = y0 + g;
    K.shell(ovoid(y0, g * 2, g, { shoulder: 1.9 }), { splitAt: 0.38 });
    K.put(tube([[g * 0.2, cy + g * 0.86, 0], [g * 0.7, cy + g * 1.5, 0], [g * 1.6, cy + g * 1.3, 0], [g * 2.3, cy + g * 0.3, 0]], 0.12, 12, 7), K.C); K.put(torus(0.09, 0.03, [g * 2.3, cy + g * 0.3, 0], [Math.PI / 2, 0.9, 0], 10), K.TRIM);
    K.put(T(cyl(0.11, 0.14, 0.2, 10), { p: [-g * 0.1, cy + g * 0.98, 0] }), K.TRIM); K.put(T(cyl(0.09, 0.1, 0.1, 10), { p: [-g * 0.1, cy + g * 0.98 + 0.14, 0] }), '#a8763e');
    const fy = cy + g * 0.2; K.faceAt(fy, g * 1.5, g * 0.78, { frame: false }); K.ears(fy, K.side(fy));
    K.top = Math.max(K.hat(cy + g * 0.98 + 0.2, 0.4, { x: -g * 0.1 }), K.topper(cy + g * 0.98 + 0.18, { x: -g * 0.1 }), K.antenna(cy + g), cy + g * 1.6);
    K.gait(L.gait ?? 'tripod', y0, g, { spread: 0.72, colour: '#4a4d52' }); K.put(torus(g * 0.62, 0.03, [0, y0 + 0.12, 0], [Math.PI / 2, 0, 0], 18), '#4a4d52');
    K.hands = [-1, 1].map(s => [s * (g + 0.26), cy - g * 0.35, 0.34]); K.r = Math.max(g + 0.14, 0.72); K.shoulder = cy;
  },
  // ---- out of doors ----
  // a watering can: a drum, a hoop to carry it by, the long spout and its rose out to one side; it waters from itself
  can(K, L) {
    const g = N(L.g, 0.56), h = N(L.h, 1.15), y0 = N(L.lift, 1.5), y1 = y0 + h;
    K.shell([[0, y0], [g * 0.94, y0], [g, y0 + 0.06], [g, y1 - 0.05], [g + 0.035, y1 - 0.03], [g + 0.035, y1 + 0.02], [g - 0.04, y1 + 0.02], [g - 0.05, y1 - 0.1], [0, y1 - 0.1]], { colour: p => (p.y > y1 - 0.11 && Math.hypot(p.x, p.z) < g - 0.045 ? '#3b3026' : K.coat(y0, y1, { bandAt: 0.2, bandW: 0.05 })(p)), step: 0.06 });
    K.put(tube([[g * 0.9, y0 + h * 0.2, 0], [g + 0.45, y0 + h * 0.62, 0], [g + 0.95, y1 + 0.16, 0]], 0.065, 8, 7), K.C); K.put(rod([g * 0.98, y1 - 0.1, 0], [g + 0.6, y0 + h * 0.8, 0], 0.016), K.TRIM);
    K.put(T(cyl(0.2, 0.07, 0.2, 12), { p: [g + 1.03, y1 + 0.23, 0], r: [0, 0, -0.86] }), K.TRIM); K.put(T(cyl(0.2, 0.2, 0.02, 12), { p: [g + 1.11, y1 + 0.3, 0], r: [0, 0, -0.86] }), '#8a7440');
    K.put(torus(g * 0.66, 0.03, [0, y1 - 0.02, 0], [0, 0, 0], 16, Math.PI), K.TRIM);
    K.put(tube([[-g + 0.02, y0 + h * 0.82, 0], [-g - 0.34, y0 + h * 0.8, 0], [-g - 0.36, y0 + h * 0.34, 0], [-g + 0.02, y0 + h * 0.26, 0]], 0.045, 10, 6), K.TRIM);
    const fy = y0 + h * 0.58; K.faceAt(fy, g * 1.5, g * 0.78, { frame: false });
    K.top = Math.max(K.hat(y1, g), K.topper(y1 - 0.1, {}), K.antenna(y1), y1 + g * 0.66);
    K.floats = true; K.put(T(new THREE.SphereGeometry(g * 0.5, 14, 5, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, y0 + 0.02, 0], s: [1, 0.4, 1] }), K.TRIM); K.pivot = y0 + h / 2;
    K.spout = [g + 1.12, y1 + 0.3, 0];
    K.hands = [-1, 1].map(s => [s * g * 0.7, y0 + h * 0.3, g * 0.8 + 0.14]); K.r = g + 0.14; K.shoulder = y0 + h * 0.6;
  },
  // a lighthouse on its rock: a tapering tower in bands, a gallery with a rail, the lamp room and its light
  lighthouse(K, L) {
    const w = N(L.w, 0.56), h = N(L.h, 2.4), y0 = 0.4, y1 = y0 + h, wt = w * 0.7, lr = wt * 0.8;
    K.put(lathe([[0, 0.04], [w + 0.36, 0.04], [w + 0.32, 0.18], [w + 0.08, y0], [0, y0]], 7), N(L.rock, '#8c8478'));
    K.shell([[w, y0], [wt, y1], [wt + 0.17, y1 + 0.02], [wt + 0.17, y1 + 0.07], [0, y1 + 0.07]], { pattern: 'stripes', stripes: N(L.bands, 5), c0: y0, c1: y1 + 0.001 });
    K.put(torus(wt + 0.15, 0.014, [0, y1 + 0.3, 0], [Math.PI / 2, 0, 0], 16), K.TRIM); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; K.put(rod([Math.sin(a) * (wt + 0.15), y1 + 0.07, Math.cos(a) * (wt + 0.15)], [Math.sin(a) * (wt + 0.15), y1 + 0.3, Math.cos(a) * (wt + 0.15)], 0.012, 0.012, 4), K.TRIM); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; K.put(rod([Math.sin(a) * lr, y1 + 0.07, Math.cos(a) * lr], [Math.sin(a) * lr, y1 + 0.52, Math.cos(a) * lr], 0.018, 0.018, 4), K.C2); }
    K.move(paint(T(cyl(lr * 0.9, lr * 0.9, 0.42, 10), {}), '#ffffff'), [0, y1 + 0.3, 0], 'glow');
    K.put(lathe([[0, y1 + 0.5], [lr + 0.09, y1 + 0.5], [lr + 0.07, y1 + 0.54], [0.05, y1 + 0.78], [0, y1 + 0.78]], 12), K.C2);
    const fy = y0 + h * 0.66; K.faceAt(fy, K.side(fy) * 1.5, K.side(fy) * 0.8, { frame: false }); K.buttons([0.3, 0.42].map(u => y0 + h * u), y => K.front(y) + 0.02);
    K.top = Math.max(K.hat(y1 + 0.62, lr * 1.5), y1 + 0.8);
    K.hands = [-1, 1].map(s => [s * (w + 0.3), y0 + h * 0.5, 0.26]); K.r = w + 0.22; K.shoulder = y0 + h * 0.7;
  },
  // a cylinder mower: a roller behind, the reel of blades in front (it turns as it goes), the grass box before that, and its own handles
  mower(K, L) {
    const w = N(L.w, 0.8), r = 0.34;
    K.put(box(w * 2, 0.34, 0.9, [0, 0.52, -0.1]), K.C); K.put(T(cyl(r, r, w * 2 - 0.1, 14), { p: [0, r, -0.42], r: [0, 0, Math.PI / 2] }), '#4a4d52');
    for (const sx of [-1, 1]) K.put(box(0.07, 0.7, 1.25, [sx * (w + 0.02), 0.44, 0.02]), K.C2 === K.BELLY ? K.TRIM : K.C2);
    K.put(box(w * 2 - 0.1, 0.5, 0.55, [0, 0.42, 0.82], [0.12, 0, 0]), K.BELLY); K.put(box(w * 2 - 0.06, 0.05, 0.6, [0, 0.69, 0.8], [0.12, 0, 0]), K.C);      // the grass box
    K.put(ball(0.2, [0, 0.72, 0.8], [2.6, 0.5, 1.2], 8, 5), '#6f9a52');                                                                                      // what is in it
    K.move(merge([...Array.from({ length: 5 }, (_, i) => paint(box(w * 2 - 0.2, 0.02, 0.09, [0, Math.cos(i * TAU / 5) * 0.24, Math.sin(i * TAU / 5) * 0.24], [i * TAU / 5 + 0.5, 0, 0]), '#b8452e')), paint(T(cyl(0.035, 0.035, w * 2 - 0.1, 6), { r: [0, 0, Math.PI / 2] }), '#4a4d52')]), [0, 0.27, 0.36], 'rollX', 5);
    K.S = { pts: [[w, 0.7], [w * 0.8, 1.5]], sides: 4, sx: 1, sz: 0.5, y0: 0.7, y1: 1.5 };
    K.put(slab(w * 1.5, 0.74, 0.5, 0.16, [0, 1.06, -0.2], [0, 0, 0], 0.04), K.C); K.put(slab(w * 1.5 + 0.06, 0.06, 0.56, 0.03, [0, 1.42, -0.2], [0, 0, 0], 0.012), K.TRIM);                                     // the engine cover, where the face is
    K.faceAt(1.06, w * 1.2, 0.5, { flat: [0, 1.06, 0.056], frame: K.TRIM });
    for (const sx of [-1, 1]) { K.put(rod([sx * w * 0.7, 0.7, -0.4], [sx * w * 0.62, 2.5, -1.25], 0.03), K.TRIM); K.put(T(cyl(0.045, 0.045, 0.34, 8), { p: [sx * w * 0.62, 2.5, -1.25], r: [0, 0, Math.PI / 2] }), DARK); }
    K.put(rod([-w * 0.62, 2.1, -1.06], [w * 0.62, 2.1, -1.06], 0.022), K.TRIM);
    K.top = Math.max(K.antenna(1.48), 2.6);
    K.hands = [-1, 1].map(s => [s * w * 0.62, 2.5, -1.25]); K.r = w + 0.25; K.shoulder = 1.4; K.glove = 0.1;
  },
};

// ---- putting one together -------------------------------------------------------------------------------
export function buildBody(look) {
  const L = look, K = makeKit(L), form = FORMS[L.form] ?? FORMS.egg;
  form(K, L);
  const root = new THREE.Group(), bob = new THREE.Group(), inner = new THREE.Group(), size = L.size ?? 1, sc = [size * (L.wide ?? 1), size * (L.tall ?? 1), size * (L.deep_ ?? L.wide ?? 1)];
  root.add(bob); bob.add(inner); root.scale.set(...sc); bob.position.y = K.pivot; inner.position.y = -K.pivot;
  const fs = { eye: L.eye ?? '#ffe2b0', gap: L.gap ?? 44, eyeW: L.eyeW ?? 36, eyeH: L.eyeH ?? 46, eyeR: L.eyeR, bg: L.faceBg ?? '#120c10', lashes: L.lashes, brows: L.brows, moustache: L.moustache, freckles: L.freckles, monocle: L.monocle };
  if (L.specs) fs.specs = 'rgba(255,240,210,.6)'; if (L.blush) fs.blush = 'rgba(255,120,150,.5)';
  const face = makeFace(fs); face.mesh = mesh(K.face, face.mat);
  const body = mesh(merge(K.parts)); inner.add(body, face.mesh);
  let ring = null, mover = null;
  if (K.mover) { mover = mesh(K.mover.geo, K.mover.kind === 'blink' || K.mover.kind === 'glow' ? new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }) : undefined); mover.position.set(...K.mover.at); if (K.mover.tilt) mover.rotation.x = K.mover.tilt; inner.add(mover); }
  else if (K.ring) { ring = new THREE.Mesh(T(new THREE.TorusGeometry(K.ring.r, 0.032, 8, K.ring.seg ?? 30), { r: [Math.PI / 2, 0, 0] }), new THREE.MeshBasicMaterial({ color: L.ring ?? 0x8fe3d1, toneMapped: false, transparent: true, opacity: 0.85 })); ring.position.y = K.ring.y; inner.add(ring); }
  const gs = (K.glove ?? 0.12) / 0.12, glove = paint(T(sph(0.12, 10, 7), { s: [gs, 0.85 * gs, 1.15 * gs] }), L.glove ?? '#f4eee2');
  const armGeo = p => ((K.arms ?? L.arms) ? [paint(rod([0, 0, 0], [(Math.sign(p[0]) * (K.armX ?? Math.abs(p[0]) - 0.3)) - p[0], K.shoulder - p[1], -p[2]], 0.05, 0.065, 6), L.armColour ?? K.TRIM)] : []);
  const hands = K.hands.map((p, i) => {
    const h = new THREE.Group(); h.position.set(...p); h.userData.rest = p;
    const tool = TOOLS[i === 1 ? L.tool : L.tool2], g = [glove.clone(), ...(tool ? tool() : []), ...armGeo(p)];
    h.add(mesh(merge(g))); inner.add(h); return h;
  });
  root.traverse(o => { o.castShadow = false; o.receiveShadow = !!o.isMesh; });
  body.geometry.computeBoundingBox();
  const M = K.mover, hover = K.floats, eyeY = K.eye, sh = K.shoulder, front = Math.max(0.2, ...K.hands.map(p => p[2]));
  const st = { roll: 0, walk: 0, lean: 0, blinkAt: 0, head: 0, sit: 0, tilt: 0, lastYaw: null, turn: 0, hp: hands.map(h => h.position.clone()) };
  const tgt = new THREE.Vector3();
  // Where the hands go for what it is doing (in the body's own frame: +z ahead, +x its left as you face it ... its
  // right hand is hands[1]). act: 'write' (on a board in front of it, chalk going along a line), 'point' (up at the
  // board), 'gesture' (both hands out to the room), 'ask' (a hand up: a question to the room), 'sip' (a cup to the
  // face), 'read' (a book held low in both hands, head bent), 'type' (hands on a desk), 'think' (a hand to the
  // chin), 'reach' (up to a shelf), 'wave', 'shrug'
  function handTarget(i, r, a, t, busy, speak, point, u) {
    const s = i ? 1 : -1, cupHand = L.tool === 'cup' ? 1 : 0;
    tgt.set(r[0], r[1] + Math.sin(t * 2.1 + i * 2) * 0.03, r[2]);
    switch (a) {
      case 'write': if (i) { const ph = (t * 0.45) % 1; tgt.set(0.05 + 0.5 * ph - 0.1, eyeY - 0.05 + Math.sin(t * 11) * 0.05 + Math.sin(t * 2.3) * 0.08, front + 0.5); } else tgt.set(r[0] * 0.8, sh - 0.25, r[2] + 0.1); return tgt;
      case 'point': if (i) tgt.set(r[0] * 0.55, eyeY + 0.45 + Math.sin(t * 3) * 0.04, front + 0.55); return tgt;
      case 'gesture': tgt.set(r[0] * 1.3 + s * 0.08 * Math.sin(t * 1.4), sh + 0.05 + 0.14 * Math.sin(t * 1.7 + i * Math.PI), r[2] + 0.28); return tgt;
      case 'ask': if (i) tgt.set(r[0] * 0.95, eyeY + 0.55 + Math.sin(t * 2.5) * 0.03, r[2] + 0.12); else tgt.set(r[0], r[1] + 0.12, r[2] + 0.12); return tgt;
      case 'sip': if (i === cupHand) { const up = Math.max(0, Math.sin(t * 1.3)) ** 0.5; tgt.set(r[0] * (1 - up * 0.75), r[1] + (eyeY - 0.3 - r[1]) * up, r[2] + (front + 0.25 - r[2]) * up); } return tgt;
      case 'read': tgt.set(s * 0.2, sh - 0.2, front + 0.32); return tgt;
      case 'type': tgt.set(s * 0.22, sh - 0.45 + Math.max(0, Math.sin(t * 17 + i * 2.2)) * 0.035, front + 0.38); return tgt;
      case 'think': if (i) tgt.set(0.14, eyeY - 0.42, front + 0.12); else tgt.set(-0.05, sh - 0.3, front + 0.15); return tgt;
      case 'reach': tgt.set(r[0] * 0.7, eyeY + 0.55 + 0.08 * Math.sin(t * 2.4 + i), front + 0.45); return tgt;
      case 'wave': if (i) tgt.set(r[0] + 0.12 * Math.sin(t * 9), eyeY + 0.3, r[2] + 0.1); return tgt;
      case 'shrug': tgt.set(r[0] * 1.35, r[1] + 0.3, r[2] + 0.12); return tgt;
    }
    if (busy) tgt.set(r[0] - s * 0.12, r[1] + 0.16 + 0.1 * Math.sin(t * 6 + i * 3), r[2] + 0.26);
    else if (point && i === 1) tgt.y += 0.5, tgt.z += 0.3;
    else if (speak && i === 0) tgt.y += 0.14 + 0.06 * Math.sin(t * 7);
    else if (speak && i === 1) tgt.y += 0.06 * Math.max(0, Math.sin(t * 1.9)), tgt.z += 0.08 * Math.max(0, Math.sin(t * 1.9));      // (a hand that moves with what it says)
    return tgt;
  }
  // a: { t, dt, moving, speed, busy, speak, point, nod } as before, and now:
  //   act, actU      what the hands are doing (above), and how far through it
  //   head           radians to turn the head (the whole upper body, where there is no neck) from the body
  //   sit, drop      0..1 how far it has settled onto a seat, and how far (feet, its own scale) the body comes down to it
  //   yaw            the body's yaw in the world, so that it leans a little into a turn
  //   look           'down' bends it to what is in its hands
  const animate = ({ t, dt = 0.016, moving, speed = 0, busy, speak, point, nod = 0, act = null, actU = 0, head = 0, sit = 0, drop = 0, yaw = null, bend = 0 }) => {
    st.lean += ((busy || act === 'write' || act === 'type' ? 0.11 : act === 'read' ? 0.16 : moving ? (hover ? 0.1 : 0.035) : 0) - st.lean) * Math.min(1, dt * 5);
    if (yaw !== null) { if (st.lastYaw !== null) { const d = Math.atan2(Math.sin(yaw - st.lastYaw), Math.cos(yaw - st.lastYaw)) / Math.max(dt, 1e-3); st.turn += (Math.max(-2, Math.min(2, d)) - st.turn) * Math.min(1, dt * 4); } st.lastYaw = yaw; }
    st.sit += (sit - st.sit) * Math.min(1, dt * 3); st.head += (head - st.head) * Math.min(1, dt * 4);
    st.tilt += ((act === 'ask' ? 0.09 : act === 'think' ? -0.07 : 0) - st.tilt) * Math.min(1, dt * 3);
    const k = 1 - st.sit, hv = hover ? k : 0;
    bob.position.y = K.pivot + Math.sin(t * 1.7) * 0.07 * hv - drop * st.sit;
    bob.rotation.x = st.lean + bend + nod * 0.2 + Math.sin(t * 0.7) * 0.02 * hv + (K.wobble ? Math.cos(t * 0.8) * K.wobble * k : 0);
    bob.rotation.z = (hover ? Math.sin(t * 0.9) * 0.03 * k : Math.sin(t * 0.6) * 0.008) + (K.wobble ? Math.sin(t * 0.8) * K.wobble * k : 0) - st.turn * (hover ? 0.05 : 0.02) + st.tilt;
    bob.rotation.y = st.head;
    if (ring) { ring.visible = st.sit < 0.9; ring.scale.setScalar(1 + 0.08 * Math.sin(t * 5)); ring.material.opacity = (0.6 + 0.25 * Math.sin(t * 5)) * k; }
    if (M) {
      if (M.kind === 'spinY') mover.rotation.y = t * M.rate;
      else if (M.kind === 'tumble') { mover.rotation.y = t * M.rate; mover.rotation.x = Math.sin(t * M.rate * 0.6) * 0.5; }
      else if (M.kind === 'swing') mover.rotation.z = Math.sin(t * M.rate) * M.amp;
      else if (M.kind === 'rollX') { st.roll += speed * dt * M.rate; mover.rotation.x = st.roll; }
      else if (M.kind === 'waddle') { st.walk += Math.min(speed, 3) * dt * 3.4; const k = Math.min(1, speed / 0.6); mover.rotation.y = Math.sin(st.walk) * 0.34 * k; bob.rotation.z += Math.sin(st.walk) * 0.05 * k; bob.position.y += Math.abs(Math.sin(st.walk)) * 0.04 * k; }
      else if (M.kind === 'blink' && t > st.blinkAt) { st.blinkAt = t + 0.18 + ((t * 7.3) % 1) * 0.5; mover.material.color.setScalar(((t * 13.7) % 1) > 0.4 ? 1 : 0.4); }
    }
    const e = Math.min(1, dt * (act ? 7 : 5));
    hands.forEach((h, i) => { const p = handTarget(i, h.userData.rest, act, t, busy, speak, point, actU); st.hp[i].lerp(p, e); h.position.copy(st.hp[i]); });
  };
  // The face, every frame: its own rhythm of blinking (each robot's own, now and then twice: robokit/face.js
  // makeFaceLife), the mouth moving while it speaks, the eyes where it looks (the caller says where). Redrawn only
  // when something has changed by a visible step.
  const life = makeFaceLife(`${L.form}|${L.colour}|${L.eye}`, 0);
  const faceTick = ({ t, dt = 0.016, expr = 'neutral', look = 0, lookY = 0, speak = false }) => {
    const lid = expr === 'sleepy' || expr === 'happy' || expr === 'love' ? 0 : life.step(t, dt, { w: 1, eye: look }).shut;      // (eyes already half shut or curved: no blink to draw)
    face.draw(expr, look, lid, speak ? talkMouth(t) : 0, lookY);
  };
  // (another tool in a hand: the gardener's, who changes them; the arm, if it has one, stays)
  const toolGeo = {}, setTool = (i, name) => { if (hands[i].userData.tool === (name ?? null)) return; hands[i].userData.tool = name ?? null; hands[i].children[0].geometry = toolGeo[i + '|' + (name ?? '')] ??= merge([glove.clone(), ...(TOOLS[name] ? TOOLS[name]() : []), ...armGeo(hands[i].userData.rest)]); };
  hands.forEach((h, i) => { h.userData.tool = (i === 1 ? L.tool : L.tool2) ?? null; });
  const maxS = Math.max(sc[0], sc[2]);
  return { root, bob, inner, body, face, ring, mover, hands, animate, faceTick, setTool, spout: K.spout ?? null, form: L.form ?? 'egg', gait: K.gaitKind ?? (hover ? 'hover' : 'glide'), floats: !!hover,
    under: body.geometry.boundingBox.min.y * sc[1], top: K.top * sc[1] + 0.12, eye: K.eye * sc[1], radius: Math.min(1.1, Math.max(0.4, K.r * maxS)), belly: 0 };
}

// ---- a new one, from a number ---------------------------------------------------------------------------
// A plausible look nobody has yet: a form, its proportions, a way of getting about, colours, a face, a headpiece, a tool.
export function lookFromSeed(n) {
  let s = (Math.imul((n | 0) + 0x9e3779b9, 0x85ebca6b) ^ 0x5bd1e995) >>> 0; const R = () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }, pick = a => a[Math.floor(R() * a.length)], between = (a, b) => +(a + (b - a) * R()).toFixed(2);
  const form = pick(['egg', 'egg', 'egg', 'egg', 'cells', 'top', 'solid', 'pot', 'herm', 'lantern', 'toolbox', 'book', 'teapot', 'metronome', 'neuron', 'bucket', 'magnet', 'rack', 'hourglass', 'scope', 'pencil', 'skep', 'mug', 'drum', 'gem', 'retort', 'cabinet', 'instrument']);
  const hue = R(), col = (h, sat, l) => '#' + new THREE.Color().setHSL(h % 1, sat, l).getHexString();
  const L = { form, size: between(0.82, 1.12), tall: between(0.9, 1.14), wide: between(0.9, 1.12), colour: col(hue, between(0.3, 0.55), between(0.24, 0.42)), colour2: R() < 0.5 ? CREAM : col(hue + 0.08, 0.3, 0.3), belly: CREAM, trim: pick([BRASS, BRASS, '#5b4630', '#d9d2c2', '#b9bcc0']),
    pattern: pick([undefined, undefined, 'stripes', 'speckle', 'split', 'band']), eye: col(hue + 0.5, 0.9, 0.86), eyeW: Math.round(between(22, 44)), eyeH: Math.round(between(18, 50)), gap: Math.round(between(36, 54)), ring: new THREE.Color().setHSL((hue + 0.45) % 1, 0.7, 0.75).getHex(),
    tool: pick([undefined, 'book', 'chalk', 'pointer', 'flask', 'magnifier', 'cup', 'wrench', 'clipboard', 'pipette', 'notebook']) };
  if (R() < 0.5) L.top = pick(['sprout', 'flame', 'coil', 'quill', 'dish', 'pleats', 'prop', 'halo', 'bulb']); else if (R() < 0.8) { L.hat = pick(['beanie', 'beret', 'cap', 'straw', 'mortar', 'toque']); L.hatColour = col(hue + 0.3, 0.35, 0.3); } else L.antenna = true;
  if (R() < 0.3) L.eyeR = Math.round(between(2, 20)); for (const k of ['specs', 'blush', 'lashes']) if (R() < 0.25) L[k] = true; if (R() < 0.2) L.bowtie = BRASS; if (R() < 0.2) L.ears = pick(['cups', 'bolts', 'fins']);
  if (form === 'egg') { Object.assign(L, { g: between(0.42, 0.74), h: between(0.95, 1.9), waist: between(0.28, 0.7), shoulder: between(1.4, 4), belly_: between(1.5, 3.4), deep: between(0.82, 1), gait: pick(['hover', 'hover', 'wheel', 'wheels', 'tracks', 'skirt', 'legs', 'tripod']), arms: R() < 0.35 }); if (R() < 0.4) L.head = { r: +(L.g * between(0.5, 0.8)).toFixed(2), neck: R() < 0.5 ? 0 : between(0.08, 0.3) }; }
  return L;
}
