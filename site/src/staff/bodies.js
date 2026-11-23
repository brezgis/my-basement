// The staff's bodies. The same make as the butlers of Anna's House and the clerks of Vesper Street: one smooth
// shell (robokit/shell.js) with everything worn laid on its surface, a rounded-square face screen, a ring of light
// underneath and two floating mitten hands. Nothing here is the lab's FORM kit (faculty/body.js).
//
//   buildStaff(look) -> body
//     look   shape: one of SHAPES, or lathe: [[r, y], ...] (a bell, a wheel of cheese); scale, hover
//            colour, colour2, belly, trim; pattern: 'stripes' | 'speckle' | 'split' | 'band' | 'bark' | 'rind' | 'tweed' |
//            'glitter' | 'knit' | 'vest'
//            hat: 'pillbox' | 'banya' | 'turban' | 'beehive' | 'beret' | 'cosy'; hatColour, hatTrim
//            top: 'cherry' | 'knob' | 'sprout' | 'antennae'; wings: [colour, edge, eye-spot]; ears: 'cups' | 'hoops' | 'bolts'; headphones: colour
//            apron, scarf, bowtie, buttons, collar, badge, cardigan: colours; chain: 'watch' | 'tastevin' | 'key'
//            the face: eye, eyeW, eyeH, eyeR, gap, lashes, brows, moustache, freckles, specs, monocle, blush, faceBg
//            ring (the glow underneath), glove; tools: [[for hands[0]], [for hands[1]]] (names from PROPS)
//            tray: 'brass' | 'oak' | 'slate'
//   body   { root, bob, body, face, ring, hands, tray, slot, D, R, radius, eye, top, hover, bottom, belly,
//            hold(i, what), animate(o), cost() }
//     hold(i, what)   show what hand i holds ('glove' for nothing); false if that hand has no such thing
//     animate(o)      one frame of the body: o = { t, dt, pose, w, moving, speak, expr, look, shut, ly, head, sitK, sitY,
//                     carry (0..1: the tray out in front; 2: offered), mood }  (staff.js and staff.html both drive it)
//
// hands[1] (+x) is the working hand (poses call it R), hands[0] the other. Everyone faces +z. Units are feet.

import { THREE, useThree, paint, xform as T, merge, mesh, sph, cyl } from '../robokit/parts.js';
import { makeFace, talkMouth } from '../robokit/face.js';
import { makeShell, makeLathe, roll } from '../robokit/shell.js';
export { useThree };

const TAU = Math.PI * 2;
const SHAPES = { egg: { R: 0.58, s: [1, 1.2, 0.95] }, squat: { R: 0.66, s: [1.16, 0.82, 1.04] }, round: { R: 0.56, s: [1, 1, 1] }, tall: { R: 0.5, s: [0.95, 1.42, 0.92] },
  pear: { R: 0.56, s: [1.08, 1.16, 1.0] }, pip: { R: 0.44, s: [1, 1.08, 1] }, barrel: { R: 0.6, s: [1.0, 1.05, 1.0] }, cushion: { R: 0.58, s: [1.08, 0.96, 0.94], n: 3.4 }, drop: { R: 0.5, s: [1, 1.22, 0.98] } };
const BRASS = '#c9a45c', CREAM = '#efe4cf', LINEN = '#f4f1ea', OAK = '#b08a58', WALNUT = '#5a3a26', STEEL = '#b9bcc0', SLATE = '#3a3d40';
const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// a soft slab: a folded towel, a cushion, a napkin (a squashed ball of a square section: never a box)
const slab = (w, h, d) => { const g = new THREE.SphereGeometry(1, 14, 8), P = g.attributes.position; for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), k = Math.pow(Math.pow(Math.abs(x), 5) + Math.pow(Math.abs(y), 2.4) + Math.pow(Math.abs(z), 5), -1 / 4); P.setXYZ(i, x * k * w / 2, y * Math.min(k, 1.6) * h / 2, z * k * d / 2); } g.computeVertexNormals(); return g; };

// ---- what the hands hold: built about the glove (at the origin; +z forward, +y up) ------------------------------
const leaf = (x, y, z, r, c, rot = [0, 0, 0]) => paint(T(sph(r, 7, 5), { p: [x, y, z], r: rot, s: [0.7, 1.5, 0.22] }), c);
export const PROPS = {
  // Winnicbott
  notebook: () => [paint(T(box(0.3, 0.38, 0.04), { p: [0.02, 0.12, 0.1], r: [-0.5, 0.15, 0] }), '#3d3028'), paint(T(box(0.27, 0.35, 0.045), { p: [0.02, 0.125, 0.105], r: [-0.5, 0.15, 0] }), '#f1ead8')],
  pen: () => [paint(T(cyl(0.012, 0.012, 0.3, 6), { p: [0, 0.08, 0.1], r: [0.5, 0, 0.2] }), '#1f1b1a'), paint(T(cyl(0.013, 0.004, 0.05, 6), { p: [0.027, -0.045, 0.03], r: [0.5, 0, 0.2] }), BRASS)],
  // Cosima
  ledger: () => [paint(T(box(0.4, 0.5, 0.05), { p: [0, 0.16, 0.1], r: [-0.35, 0, 0] }), '#14433f'), paint(T(box(0.36, 0.46, 0.055), { p: [0, 0.165, 0.105], r: [-0.35, 0, 0] }), '#f1ead8'), paint(T(box(0.03, 0.5, 0.06), { p: [-0.2, 0.16, 0.1], r: [-0.35, 0, 0] }), BRASS)],
  handbell: () => [paint(T(lathe([[0, 0.2], [0.03, 0.2], [0.06, 0.12], [0.1, 0.03], [0.125, 0], [0.11, 0], [0.085, 0.03], [0, 0.17]], 14), { p: [0, -0.22, 0.06] }), BRASS), paint(T(cyl(0.022, 0.03, 0.2, 8), { p: [0, 0.06, 0.06] }), WALNUT), paint(T(sph(0.03, 8, 6), { p: [0, -0.2, 0.06] }), '#8a6a2e')],
  flute: () => [paint(T(lathe([[0, 0], [0.07, 0], [0.012, 0.02], [0.012, 0.22], [0.04, 0.27], [0.052, 0.5], [0.045, 0.5], [0.034, 0.28], [0, 0.25]], 12), { p: [0, -0.02, 0.1] }), '#e9f1ee'), paint(T(cyl(0.04, 0.03, 0.17, 10), { p: [0, 0.345, 0.1] }), '#f1d98a')],
  robe: () => [paint(T(slab(0.62, 0.2, 0.42), { p: [0, 0.02, 0.2] }), '#efe6d6'), paint(T(slab(0.5, 0.07, 0.36), { p: [0, 0.14, 0.2] }), '#e6dac6'), paint(T(cyl(0.03, 0.03, 0.5, 8), { p: [0, 0.1, 0.41], r: [0, 0, Math.PI / 2] }), '#d9cbb2')],
  // Saz
  shaker: () => [paint(T(lathe([[0, 0], [0.075, 0], [0.095, 0.3], [0.09, 0.32], [0.06, 0.4], [0.04, 0.41], [0.045, 0.5], [0, 0.5]], 14), { p: [0, -0.1, 0.08] }), STEEL), paint(T(cyl(0.096, 0.096, 0.012, 14), { p: [0, 0.2, 0.08] }), '#8f9499')],
  coupe: () => [paint(T(lathe([[0, 0], [0.08, 0], [0.012, 0.015], [0.012, 0.2], [0.12, 0.28], [0.13, 0.32], [0.12, 0.32], [0.11, 0.29], [0, 0.22]], 14), { p: [0, -0.02, 0.1] }), '#e9f1ee')],
  cloth: () => [paint(T(slab(0.3, 0.07, 0.24), { p: [0, -0.08, 0.08] }), LINEN), paint(T(slab(0.1, 0.16, 0.2), { p: [0.14, -0.14, 0.08], r: [0, 0, 0.3] }), '#e9e4d8')],
  // Tomme
  iron: () => [paint(T(cyl(0.016, 0.02, 0.5, 8), { p: [0, 0.02, 0.3], r: [Math.PI / 2, 0, 0] }), STEEL), paint(T(cyl(0.02, 0.02, 0.22, 8), { p: [0, 0.02, 0.02], r: [0, 0, Math.PI / 2] }), WALNUT)],
  bottle: () => [paint(T(lathe([[0, 0], [0.085, 0], [0.09, 0.02], [0.09, 0.42], [0.075, 0.52], [0.034, 0.62], [0.032, 0.8], [0.04, 0.81], [0.04, 0.84], [0, 0.84]], 14), { p: [0, -0.3, 0.08] }), '#1f2b22'),
    paint(T(cyl(0.092, 0.092, 0.2, 14, 1, true), { p: [0, -0.1, 0.08] }), '#efe6d0'), paint(T(cyl(0.036, 0.042, 0.13, 10), { p: [0, 0.475, 0.08] }), '#6a1f2a')],
  wineglass: () => [paint(T(lathe([[0, 0], [0.085, 0], [0.012, 0.015], [0.012, 0.2], [0.07, 0.26], [0.1, 0.36], [0.085, 0.5], [0.078, 0.5], [0.09, 0.36], [0, 0.24]], 14), { p: [0, -0.02, 0.1] }), '#e9f1ee'), paint(T(cyl(0.085, 0.06, 0.1, 12), { p: [0, 0.29, 0.1] }), '#5a1424')],
  // Pasha
  venik: () => { const out = [paint(T(cyl(0.03, 0.026, 0.42, 8), { p: [0, 0.14, 0.06] }), '#8a6a44'), paint(T(cyl(0.036, 0.036, 0.06, 8), { p: [0, 0.3, 0.06] }), '#d9cbb2')];
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.03 + (i % 5) * 0.035, y = 0.42 + (i % 7) * 0.085; out.push(leaf(Math.cos(a) * r, y, 0.06 + Math.sin(a) * r, 0.085, ['#5f8a43', '#74a052', '#4f7738', '#86ad5c'][i % 4], [0.5 * Math.sin(a), a, 0.5 * Math.cos(a)])); }
    return out; },
  ladle: () => [paint(T(cyl(0.02, 0.024, 0.9, 8), { p: [0, 0.02, 0.4], r: [Math.PI / 2 - 0.12, 0, 0] }), '#a57f52'), paint(T(new THREE.SphereGeometry(0.11, 12, 8, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, -0.02, 0.9] }), '#8a6a44'), paint(T(cyl(0.11, 0.11, 0.012, 12), { p: [0, -0.022, 0.9] }), '#c8dde0')],
  glass: () => [paint(T(lathe([[0, 0], [0.07, 0], [0.085, 0.3], [0.078, 0.3], [0.064, 0.02], [0, 0.02]], 12), { p: [0, -0.04, 0.1] }), '#e9f1ee'), paint(T(cyl(0.074, 0.064, 0.2, 12), { p: [0, 0.07, 0.1] }), '#8a3a12'),
    paint(T(new THREE.TorusGeometry(0.075, 0.012, 5, 14), { p: [0, -0.02, 0.1], r: [Math.PI / 2, 0, 0] }), '#b9b6ad'), paint(T(new THREE.TorusGeometry(0.06, 0.012, 5, 10, Math.PI), { p: [0.085, 0.06, 0.1], r: [0, 0, -Math.PI / 2] }), '#b9b6ad')],      // a tea glass in its holder
  // Terry
  towels: () => [0, 1, 2].map(i => paint(T(slab(0.56, 0.13, 0.4), { p: [0, -0.02 + i * 0.115, 0.2], r: [0, i * 0.05 - 0.05, 0] }), i === 1 ? '#e9e2d2' : LINEN)),
  towel: () => [paint(T(cyl(0.12, 0.12, 0.5, 14), { p: [0, 0.04, 0.16], r: [0, 0, Math.PI / 2] }), LINEN), paint(T(new THREE.TorusGeometry(0.122, 0.012, 5, 16), { p: [0.1, 0.04, 0.16], r: [0, Math.PI / 2, 0] }), '#9cc5bd')],
  net: () => [paint(T(cyl(0.022, 0.022, 3.4, 8), { p: [0, -0.28, 1.25], r: [Math.PI / 2 - 0.42, 0, 0] }), '#c8cdd0'), paint(T(new THREE.TorusGeometry(0.3, 0.018, 6, 20), { p: [0, -0.98, 3.05], r: [Math.PI / 2 - 0.1, 0, 0] }), '#8f9aa0'),
    paint(T(new THREE.SphereGeometry(0.29, 14, 6, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, -0.98, 3.05], s: [1, 0.5, 1] }), '#dfe9ea')],
  carafe: () => [paint(T(lathe([[0, 0], [0.1, 0], [0.13, 0.12], [0.11, 0.3], [0.055, 0.42], [0.06, 0.52], [0.05, 0.52], [0.045, 0.42], [0.1, 0.3], [0, 0.02]], 14), { p: [0, -0.12, 0.1] }), '#dcebea'), paint(T(cyl(0.105, 0.115, 0.16, 12), { p: [0, 0.02, 0.1] }), '#bfdfe2')],
  // Bijou
  file: () => [paint(T(box(0.045, 0.012, 0.42), { p: [0, 0.02, 0.24], r: [0, 0, 0.3] }), '#e9a8c6'), paint(T(box(0.04, 0.014, 0.3), { p: [0, 0.02, 0.28], r: [0, 0, 0.3] }), '#f4e0ea')],
  polish: () => [paint(T(cyl(0.05, 0.055, 0.11, 10), { p: [0, 0.0, 0.1] }), '#e03a7c'), paint(T(cyl(0.028, 0.034, 0.14, 8), { p: [0, 0.12, 0.1] }), '#1f1b1a'), paint(T(cyl(0.052, 0.052, 0.012, 10), { p: [0, 0.05, 0.1] }), '#ffd1e6')],
  brush: () => [paint(T(cyl(0.024, 0.03, 0.14, 8), { p: [0, 0.06, 0.08] }), '#1f1b1a'), paint(T(cyl(0.008, 0.006, 0.12, 5), { p: [0, -0.06, 0.08] }), '#e03a7c')],
  // Hush
  teapot: () => [paint(T(lathe([[0, 0], [0.11, 0], [0.17, 0.08], [0.17, 0.16], [0.11, 0.24], [0.05, 0.25], [0.05, 0.27], [0, 0.29]], 14), { p: [0, -0.16, 0.14] }), '#2c2e30'), paint(T(sph(0.03, 8, 6), { p: [0, 0.14, 0.14] }), '#2c2e30'),
    paint(T(cyl(0.022, 0.034, 0.16, 8), { p: [0, -0.05, 0.31], r: [0.9, 0, 0] }), '#2c2e30'), paint(T(new THREE.TorusGeometry(0.13, 0.012, 5, 14, Math.PI), { p: [0, 0.07, 0.14], r: [0, Math.PI / 2, 0] }), '#4a4d50')],
  cup: () => [paint(T(lathe([[0, 0], [0.05, 0], [0.075, 0.09], [0.07, 0.09], [0.045, 0.012], [0, 0.012]], 12), { p: [0, 0.0, 0.1] }), '#e9e4d8'), paint(T(cyl(0.065, 0.055, 0.02, 12), { p: [0, 0.07, 0.1] }), '#9a7a2a')],
  taper: () => [paint(T(cyl(0.012, 0.012, 0.7, 6), { p: [0, 0.2, 0.14], r: [0.35, 0, 0] }), BRASS), paint(T(sph(0.03, 8, 6), { p: [0, 0.53, 0.26], s: [1, 1.8, 1] }), '#ffcf70')],
  duster: () => { const out = [paint(T(cyl(0.016, 0.02, 0.44, 6), { p: [0, 0.14, 0.08] }), WALNUT)]; for (let i = 0; i < 12; i++) { const a = i * 2.4; out.push(paint(T(sph(0.07, 6, 5), { p: [Math.cos(a) * 0.06, 0.42 + (i % 4) * 0.07, 0.08 + Math.sin(a) * 0.06], r: [0.4 * Math.sin(a), a, 0.4 * Math.cos(a)], s: [0.6, 1.7, 0.3] }), ['#d8c9a8', '#c4b28c', '#e6dcc4'][i % 3])); } return out; },
  // Luna
  pole: () => [paint(T(cyl(0.017, 0.017, 2.05, 6), { p: [0, 0.57, 0.04] }), '#a8844a'), paint(T(cyl(0.022, 0.022, 0.06, 6), { p: [0, -0.44, 0.04] }), '#7d6036'), paint(T(box(0.09, 0.015, 0.015), { p: [0.04, 1.53, 0.04] }), '#a8844a'),
    paint(T(new THREE.ConeGeometry(0.05, 0.09, 10, 1, true), { p: [0.075, 1.485, 0.04] }), '#b8954f'), paint(T(cyl(0.012, 0.016, 0.05, 6), { p: [0, 1.595, 0.04] }), '#3a2c22'), paint(T(sph(0.026, 8, 6), { p: [0, 1.66, 0.04], s: [1, 2, 1] }), '#ffcf70')],      // a lamplighter's pole: wick-holder, snuffer bell, a small flame
  // Ding
  cushion: () => [paint(T(slab(0.6, 0.24, 0.6), { p: [0.3, 0.02, 0.24], r: [0.3, 0, 0] }), '#d9cbb2')],
  silver: () => [paint(T(lathe([[0, 0], [0.3, 0], [0.31, 0.02], [0.27, 0.16], [0.16, 0.26], [0.04, 0.29], [0.04, 0.32], [0, 0.34]], 20), { p: [0, 0.0, 0.3] }), '#cfd2d4'), paint(T(sph(0.035, 8, 6), { p: [0, 0.34, 0.3] }), BRASS)],      // a cloche
};

// A staff member's body. About six draw calls: the body (all of it merged), the face, the ring of light, two
// hands (each one mesh at a time: the glove alone, or the glove merged with a tool), and the tray when it is out.
export function buildStaff(look) {
  const sh = SHAPES[look.shape ?? 'egg'], R = look.lathe ? Math.max(...look.lathe.map(p => p[0])) : sh.R, S = sh.s, hover = look.hover ?? 3.3, sc = look.scale ?? 1;
  const root = new THREE.Group(), bob = new THREE.Group(); root.add(bob); bob.position.y = hover; bob.scale.setScalar(sc); root.userData.staff = true;
  const C = look.colour ?? '#8a3d6b', BELLY = look.belly ?? CREAM, TRIM = look.trim ?? BRASS, C2 = look.colour2 ?? BELLY, parts = [];
  const SH = look.lathe ? makeLathe(look.lathe, { sides: 36 }) : makeShell(R * S[0], R * S[1], R * S[2], sh.n ?? 2);
  const top = SH.top, low = -SH.bottom, put = (g, c) => parts.push(paint(g, c));
  const hash = (a, b, c) => { const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return s - Math.floor(s); };
  // the coat
  const pat = look.pattern, az = p => Math.atan2(p.x, p.z);
  const coat = p => {
    switch (pat) {
      case 'stripes': return Math.floor((p.y / top + 1) * 4.5) % 2 ? C2 : C;
      case 'speckle': return Math.sin(p.x * 23 + p.y * 7) * Math.sin(p.z * 19 - p.y * 11) * Math.sin(p.y * 29 + p.x * 5) > 0.3 ? C2 : C;
      case 'split': return p.y < -top * 0.12 ? C2 : C;
      case 'band': return Math.abs(p.y - (look.bandAt ?? -0.42) * top) < top * 0.1 ? C2 : C;
      // birch bark: white, with dark lenticels in short dashes round it and a few scars
      case 'bark': { const row = Math.floor(p.y * 16), a = az(p) * 9 + hash(row, 1, 0) * 9, dash = Math.sin(a) > 0.82 - 0.25 * hash(row, 2, 0) && hash(row, 7, 0) > 0.35 && Math.abs(p.y * 16 - row - 0.5) < 0.2; return dash ? C2 : hash(Math.floor(az(p) * 3), row >> 2, 3) > 0.92 ? '#d6cfc0' : C; }
      // a washed rind: straw, a bloom of paler mould, a darker belt where it sat on the board
      case 'rind': { const n = Math.sin(p.x * 31 + p.y * 17) * Math.sin(p.z * 27 - p.y * 13); return Math.abs(p.y) > top * 0.9 ? '#cdb984' : n > 0.45 ? C2 : n < -0.6 ? '#bfa772' : C; }
      // herringbone tweed, near enough: two browns in small broken diagonals
      case 'tweed': { const u = az(p) * 14, v = p.y * 22, k = Math.floor(u) % 2 ? u + v : u - v; return Math.floor(k * 1.5) % 3 === 0 ? C2 : C; }
      case 'glitter': return hash(Math.floor(p.x * 40), Math.floor(p.y * 40), Math.floor(p.z * 40)) > 0.86 ? C2 : C;
      // plain knitting: rows, and a paler rib every few
      case 'knit': return Math.floor(p.y * 26) % 4 === 0 ? C2 : C;
      // a waistcoat over a shirt: dark all round, the shirt showing down the front
      case 'vest': { const a = Math.abs(az(p)); return p.z > 0 && a < 0.42 - 0.18 * (p.y / top) && p.y < top * 0.2 ? BELLY : C; }
      default: return C;
    }
  };
  put(look.lathe ? SH.body(36) : SH.body(30, 20), coat);
  // the face: a rounded-square screen in a soft dark bezel
  const yc = look.faceY ?? top * 0.46, hh = look.faceH ?? top * 0.29, aw = Math.min(1.0, (2 * hh) / SH.front(yc)) * (look.faceW ?? 1);
  const scr = SH.screen(yc, hh, aw, { seg: 36, rings: 4 }); put(scr.bezel, '#221c1f');
  const under = yc - hh - 0.05;
  const ex = SH.side(yc);
  // ears
  if (look.ears === 'cups') for (const sx of [-1, 1]) { put(T(cyl(0.14, 0.12, 0.1, 16), { p: [sx * (ex + 0.035), yc, 0], r: [0, 0, sx * Math.PI / 2] }), TRIM); put(T(new THREE.TorusGeometry(0.1, 0.03, 6, 16), { p: [sx * (ex + 0.085), yc, 0], r: [0, Math.PI / 2, 0] }), TRIM); }
  if (look.ears === 'bolts') for (const sx of [-1, 1]) { put(T(cyl(0.11, 0.11, 0.1, 6), { p: [sx * (ex + 0.025), yc, 0], r: [0, 0, Math.PI / 2] }), TRIM); put(T(cyl(0.05, 0.05, 0.2, 8), { p: [sx * (ex + 0.1), yc, 0], r: [0, 0, Math.PI / 2] }), WALNUT); }
  if (look.ears === 'hoops') for (const sx of [-1, 1]) { put(T(sph(0.035, 8, 6), { p: [sx * (ex + 0.01), yc - 0.02, 0] }), TRIM); put(T(new THREE.TorusGeometry(0.1, 0.014, 5, 18), { p: [sx * (ex + 0.03), yc - 0.14, 0], r: [0, 0.3 * sx, 0] }), TRIM); }
  if (look.headphones) { put(SH.overTop(yc, 0.05, 0.032), '#1d1b18'); for (const sx of [-1, 1]) { put(T(cyl(0.2, 0.2, 0.12, 18), { p: [sx * (ex + 0.04), yc, 0], r: [0, 0, Math.PI / 2] }), look.headphones); put(T(cyl(0.12, 0.12, 0.13, 14), { p: [sx * (ex + 0.045), yc, 0], r: [0, 0, Math.PI / 2] }), '#1d1b18'); } }
  // worn on the front
  if (look.apron) { const ap = SH.apron(under - 0.04); for (const g of ap.cloth) put(g, look.apron); put(ap.pocket, look.apronTrim ?? TRIM); }
  else if (look.shirt !== false && pat !== 'vest') put(SH.plate(-low * 0.45, 0, 0.6, low * 0.34, 0.006, { m: 2.6, rings: 4, seg: 32 }), BELLY);
  if (look.cardigan) {      // open down the front: two soft panels either side of the shirt, a ribbed edge, leather buttons on one
    for (const sx of [-1, 1]) { put(SH.patch(sx > 0 ? 0.2 : -1.5, sx > 0 ? 1.5 : -0.2, -low * 0.82, under + 0.02, (u, v) => 0.012 + 0.022 * roll(u) * roll(v * 0.9 + 0.05), 14, 8), look.cardigan); put(SH.patch(sx * 0.17, sx * 0.24, -low * 0.82, under + 0.02, 0.03, 2, 8), look.cardiganRib ?? '#5b4a3c'); }
    for (let i = 0; i < 3; i++) put(SH.place(cyl(0.032, 0.032, 0.02, 10).translate(0, 0.012, 0), under - 0.14 - i * low * 0.2, 0.3, 0.03), '#3d3028');
  }
  if (look.buttons) { for (let i = 0; i < 3; i++) put(T(sph(0.035, 8, 6), { p: SH.at(under - 0.1 - i * low * 0.2, 0, 0.012) }), look.buttons); if (look.epaulettes !== false) for (const sx of [-1, 1]) put(SH.plate(top * 0.56, sx * 1.35, 0.32, 0.055, 0.016, { m: 6, rings: 2, seg: 24 }), look.buttons); }
  if (look.collar) put(SH.band(under - 0.07, under + 0.01, v => 0.008 + 0.022 * roll(v), 44, 4), look.collar);
  if (look.belt) put(SH.band(-low * 0.16, -low * 0.04, v => 0.004 + 0.022 * roll(v), 44, 3), look.belt);
  if (look.bowtie) { const z = SH.front(under) + 0.04; for (const sx of [-1, 1]) put(T(new THREE.ConeGeometry(0.08, 0.16, 10), { p: [sx * 0.08, under, z - 0.005], r: [0, 0, -sx * Math.PI / 2], s: [1, 1, 0.55] }), look.bowtie); put(T(sph(0.04, 8, 6), { p: [0, under, z + 0.01] }), look.bowtie); }
  if (look.scarf) for (const g of SH.scarf(under - 0.02, { cols: 40, rows: 6 })) put(g, look.scarf);
  if (look.badge) { const [plate, card] = SH.badge(look.scarf || look.bowtie ? under - 0.2 : under - 0.1, 0.42); put(plate, look.badge); put(card, LINEN); }
  // a chain across the front, and what hangs on it
  if (look.chain) {
    const y0 = under - 0.12, sag = 0.16, n = 13, a0 = look.chain === 'watch' ? -0.55 : -0.5, a1 = look.chain === 'watch' ? 0.2 : 0.5;
    for (let i = 0; i <= n; i++) { const u = i / n; put(T(sph(0.016, 5, 4), { p: SH.at(y0 - sag * Math.sin(u * Math.PI), a0 + (a1 - a0) * u, 0.016) }), TRIM); }
    if (look.chain === 'tastevin') { put(SH.place(lathe([[0, 0], [0.06, 0], [0.105, 0.03], [0.11, 0.045], [0.095, 0.04], [0.05, 0.015], [0, 0.015]], 14), y0 - sag - 0.06, 0, 0.012), '#cfd2d4'); }
    if (look.chain === 'watch') put(SH.place(cyl(0.055, 0.055, 0.025, 14).translate(0, 0.014, 0), y0 - 0.02, a1 + 0.08, 0.004), TRIM);
    if (look.chain === 'key') { const p = SH.at(y0 - sag - 0.02, 0, 0.03); put(T(new THREE.TorusGeometry(0.04, 0.012, 5, 12), { p: [p[0], p[1], p[2]] }), TRIM); put(T(box(0.018, 0.13, 0.018), { p: [p[0], p[1] - 0.1, p[2]] }), TRIM); put(T(box(0.05, 0.018, 0.018), { p: [p[0] + 0.022, p[1] - 0.15, p[2]] }), TRIM); put(T(box(0.04, 0.018, 0.018), { p: [p[0] + 0.018, p[1] - 0.115, p[2]] }), TRIM); }
  }
  put(T(new THREE.SphereGeometry(Math.min(SH.A, SH.C) * (look.lathe ? 0.42 : 0.5), 18, 8, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, -low * (look.lathe ? 0.98 : 0.82), 0], s: [1, 0.6, 1] }), look.capColour ?? TRIM);   // the cap underneath
  const bottom = -(low * (look.lathe ? 0.98 : 0.82) + Math.min(SH.A, SH.C) * 0.3);
  // what grows out of the top of the head
  const ty = top - 0.02; let hatTop = top;
  if (look.top === 'cherry') { put(T(cyl(0.008, 0.008, 0.26, 5), { p: [0.03, ty + 0.12, 0], r: [0, 0, -0.25] }), '#5b4630'); put(T(sph(0.075, 12, 10), { p: [0.065, ty + 0.25, 0] }), '#b3202e'); put(T(sph(0.02, 6, 5), { p: [0.045, ty + 0.3, 0.035] }), '#f2a0a8'); hatTop = top + 0.34; }
  if (look.top === 'knob') { put(T(lathe([[0, 0], [0.07, 0], [0.05, 0.05], [0.04, 0.16], [0.075, 0.24], [0.085, 0.3], [0.06, 0.36], [0, 0.38]], 14), { p: [0, ty, 0] }), look.topColour ?? WALNUT); put(T(cyl(0.085, 0.085, 0.03, 14), { p: [0, ty + 0.01, 0] }), TRIM); hatTop = top + 0.38; }
  if (look.top === 'sprout') { put(T(cyl(0.014, 0.02, 0.2, 6), { p: [0, ty + 0.1, 0] }), '#5b4630'); for (const [rz, ry, k] of [[-0.75, 0.3, 1], [0.7, -0.5, 0.82]]) parts.push(paint(T(sph(0.2, 12, 8), { p: [0, 0.2, 0], s: [0.5 * k, 1.25 * k, 0.12] }), '#7fae52').applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, ry, rz)).setPosition(0, ty + 0.16, 0))); hatTop = top + 0.4; }
  // a moth's: feathery antennae, and wings folded down the back like a roof, an eye-spot and a long tail on each
  if (look.top === 'antennae') {
    for (const sx of [-1, 1]) {
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(sx * 0.08, top - 0.03, 0.1), new THREE.Vector3(sx * 0.2, top + 0.16, 0.17), new THREE.Vector3(sx * 0.4, top + 0.2, 0.0));
      put(new THREE.TubeGeometry(curve, 8, 0.011, 4, false), '#5b5a4a');
      const mid = curve.getPoint(0.6), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangent(0.6)), frond = sph(0.1, 10, 6); frond.scale(0.4, 1.8, 0.08); frond.applyQuaternion(q); frond.translate(mid.x, mid.y, mid.z); put(frond, look.frond ?? '#e9dfb0');
    }
    hatTop = top + 0.24;
  }
  if (look.wings) {
    const [WC, WE, WS] = look.wings;      // the wing, its edge and seam, its eye-spot
    for (const sx of [-1, 1]) {
      put(SH.patch(Math.PI + sx * 0.03, Math.PI + sx * 1.25, -low * 0.7, top * 0.72, (u, v) => 0.014 + 0.03 * roll(u) * roll(v), 14, 10), p => {
        const a = Math.abs(Math.atan2(p.x, -p.z)), v = p.y / top;
        if (a < 0.09 || a > 1.12 - 0.25 * Math.max(0, -v)) return WE;
        const d = Math.hypot(a - 0.55, (v - 0.05) * 1.3); return d < 0.07 ? '#3a2c3a' : d < 0.13 ? WS : d < 0.16 ? WE : WC;
      });
      put(T(sph(0.1, 10, 6), { p: [sx * SH.side(-low * 0.6) * 0.5, -low * 0.86, -SH.front(-low * 0.6) * 0.8], r: [0.5, 0, sx * 0.25], s: [0.5, 2.4, 0.16] }), WC);      // the tail
    }
  }
  // hats, fitted to the head
  const HC = look.hatColour ?? '#b8452e', HT = look.hatTrim ?? TRIM, ys = Math.max(yc + hh - 0.03, top * 0.66);
  if (look.hat === 'pillbox') {      // a bellhop's cap, cocked: a short drum, a band of braid, a button on top
    const at = SH.seat(0.24, { phi: 0.3, az: -0.9, sink: 0.05 });
    parts.push(...[paint(T(cyl(0.24, 0.25, 0.2, 24), { p: [0, 0.1, 0] }), HC), paint(T(cyl(0.256, 0.256, 0.05, 24), { p: [0, 0.045, 0] }), HT), paint(T(cyl(0.243, 0.243, 0.014, 24), { p: [0, 0.2, 0] }), HC), paint(T(sph(0.035, 8, 6), { p: [0, 0.21, 0] }), HT)].map(g => g.applyMatrix4(at)));
    hatTop = top + 0.22;
  } else if (look.hat === 'banya') {      // the felt hat of the steam room: a soft bell with a turned-up brim, a stitched band, a loop on top
    const at = SH.seat(0.36, { phi: 0.1, az: 2.6, sink: 0.07 });
    parts.push(...[paint(T(lathe([[0.4, 0.02], [0.44, 0.0], [0.47, 0.07], [0.4, 0.1], [0.37, 0.12], [0.33, 0.3], [0.24, 0.45], [0.1, 0.54], [0, 0.56]], 22), {}), p => (Math.abs(p.y - 0.17) < 0.022 && Math.sin(Math.atan2(p.x, p.z) * 18) > 0 ? HT : HC)),
      paint(T(new THREE.TorusGeometry(0.035, 0.012, 5, 10), { p: [0, 0.58, 0], r: [0, 0.6, 0] }), HT)].map(g => g.applyMatrix4(at)));
    hatTop = top + 0.5;
  } else if (look.hat === 'turban') {      // a towel wound round the head: the head's own top grown out in folds, a twist standing at the front
    put(SH.cap(ys - 0.02, (v, a) => 0.05 + 0.05 * roll(Math.min(1, v * 1.4)) + 0.014 * Math.sin(a * 2 + v * 9)), HC);
    put(T(sph(0.13, 12, 10), { p: [0.02, top + 0.1, SH.front(top * 0.8) * 0.5], s: [0.9, 1.25, 0.8], r: [0.3, 0, 0.2] }), HC); put(T(sph(0.07, 8, 6), { p: [0.03, top + 0.24, SH.front(top * 0.8) * 0.4], s: [0.8, 1.2, 0.8] }), look.hatTrim ?? '#e9e2d2');
    put(SH.band(ys - 0.02, ys + 0.05, v => 0.058 + 0.01 * roll(v), 40, 3), look.hatTrim ?? '#e9e2d2');
    hatTop = top + 0.3;
  } else if (look.hat === 'beehive') {      // hair piled high, in three rolls, with a nail file through it for a pin
    const at = SH.seat(0.3, { phi: 0.16, az: Math.PI, sink: 0.1 });
    parts.push(...[paint(T(sph(0.33, 16, 12), { p: [0, 0.12, 0], s: [1, 0.72, 1] }), HC), paint(T(sph(0.28, 16, 12), { p: [0, 0.36, 0], s: [1, 0.74, 1] }), HC), paint(T(sph(0.2, 14, 10), { p: [0, 0.57, 0], s: [1, 0.8, 1] }), HC),
      paint(T(new THREE.TorusGeometry(0.29, 0.02, 5, 22), { p: [0, 0.24, 0], r: [Math.PI / 2, 0, 0] }), HT), paint(T(box(0.035, 0.012, 0.6), { p: [0.02, 0.45, 0], r: [0.5, 0.9, 0] }), '#f4e0ea')].map(g => g.applyMatrix4(at)));
    hatTop = top + 0.62;
  } else if (look.hat === 'beret') {      // soft, pulled over to one side, a stalk on top (on a flat-topped body it is a made thing, not the head grown out)
    if (look.lathe) { const r = SH.side(top - 0.05) * 0.86; put(T(sph(1, 20, 12), { p: [r * 0.12, top + 0.05, -0.02], r: [0.06, 0, -0.1], s: [r * 1.06, 0.13, r] }), HC); put(T(new THREE.TorusGeometry(r * 0.78, 0.03, 6, 26), { p: [0, top + 0.01, 0], r: [Math.PI / 2, 0, 0] }), HC); put(T(cyl(0.014, 0.014, 0.08, 5), { p: [r * 0.12, top + 0.2, -0.02] }), HC); hatTop = top + 0.22; }
    else { const yb = ys + top * 0.08; put(SH.cap(yb, (v, a) => 0.022 + 0.09 * roll(Math.min(1, v * 1.25)) * (1 + 0.5 * Math.sin(a))), HC); put(T(cyl(0.015, 0.015, 0.08, 5), { p: [0.04, top + 0.13, 0] }), HC); hatTop = top + 0.17; }
  }
  else if (look.hat === 'cosy') {      // a knitted tea cosy, ribbed, with a pompom
    put(SH.cap(ys - 0.04, (v, a) => 0.045 + 0.012 * Math.sin(a * 16) + (v < 0.16 ? 0.03 * roll(v / 0.16) : 0)), p => (Math.floor(p.y * 22) % 3 === 0 ? HT : HC));
    put(T(sph(0.1, 10, 8), { p: [0, top + 0.13, 0] }), HT); hatTop = top + 0.24;
  }
  const fs = { eye: look.eye ?? '#ffe2b0', gap: look.gap ?? 44, eyeW: look.eyeW ?? 36, eyeH: look.eyeH ?? 46, eyeR: look.eyeR, bg: look.faceBg ?? '#120c10', lashes: look.lashes, brows: look.brows, moustache: look.moustache, freckles: look.freckles, monocle: look.monocle };
  if (look.specs) fs.specs = look.specs === true ? 'rgba(255,240,210,.6)' : look.specs; if (look.blush) fs.blush = look.blush === true ? 'rgba(255,120,150,.5)' : look.blush;
  const face = makeFace(fs); face.mesh = mesh(scr.face, face.mat);
  const body = mesh(merge(parts)); bob.add(body, face.mesh);
  const ring = new THREE.Mesh(T(new THREE.TorusGeometry(R * 0.5, 0.032, 6, 24), { r: [Math.PI / 2, 0, 0] }), new THREE.MeshBasicMaterial({ color: look.ring ?? 0xffd9a0, toneMapped: false, transparent: true, opacity: 0.85 }));
  ring.position.y = bottom - 0.16; bob.add(ring);
  // the hands: each a group of variants, one visible (the glove alone, or the glove with a thing in it)
  const gs = look.gloveSize ?? 0.12, glove = () => paint(T(sph(gs, 10, 7), { s: [1, 0.85, 1.15] }), look.glove ?? '#f4eee2'), hy = look.handY ?? -low * 0.18, hx = SH.side(hy) + 0.22;
  const hands = [[-hx, hy, 0.16], [hx, hy, 0.16]].map((p, i) => {
    const h = new THREE.Group(); h.position.set(...p); h.userData.rest = p;
    const v = { glove: mesh(glove()) };
    for (const k of look.tools?.[i] ?? []) { if (!PROPS[k]) { console.warn('staff: no such thing to hold as', k); continue; } v[k] = mesh(merge([glove(), ...PROPS[k]().map(g => (g.index ? g.toNonIndexed() : g))])); v[k].visible = false; }
    for (const k in v) h.add(v[k]);
    h.userData.variants = v; h.userData.holding = 'glove'; bob.add(h); return h;
  });
  const hold = (i, what = 'glove') => { const h = hands[i], v = h.userData.variants; if (!v[what]) return false; if (h.userData.holding !== what) { v[h.userData.holding].visible = false; v[what].visible = true; h.userData.holding = what; } return true; };
  // the tray, and a place on it for a drink
  const f0 = SH.front(-low * 0.3) + 0.12, tray = new THREE.Group(); tray.visible = false; bob.add(tray);
  const tk = look.tray ?? 'brass', ts = 0.34 * (look.trayScale ?? 1);
  tray.add(mesh(tk === 'slate' ? merge([paint(T(cyl(ts * 1.15, ts * 1.15, 0.03, 6), {}), SLATE)]) : merge([paint(T(cyl(ts, ts * 0.92, 0.03, 28), {}), tk === 'oak' ? OAK : BRASS), paint(T(new THREE.TorusGeometry(ts, 0.018, 6, 30), { p: [0, 0.025, 0], r: [Math.PI / 2, 0, 0] }), tk === 'oak' ? '#8f6e44' : '#b8914a')])));
  const slot = new THREE.Group(); slot.position.y = 0.02; tray.add(slot);
  const trayRest = [hx * 0.55, -low * 0.3, f0 + 0.42]; tray.position.set(...trayRest);
  root.traverse(o => { o.castShadow = false; o.receiveShadow = !!o.isMesh; o.userData.staff = true; });
  // measures for the hands' work (bob frame): in front, low (a counter), middle, high (a top shelf)
  const D = { x: hx, y: hy, f: f0, lo: -low * 0.55, mid: -low * 0.05, hi: top * 0.9 };
  const B = { root, bob, body, face, ring, hands, tray, slot, hold, D, R, shell: SH, look, radius: Math.min(0.74, Math.max(SH.A, SH.C) * sc + 0.06), eye: yc * sc, top: hover + (hatTop + 0.15) * sc, hover, bottom: bottom * sc, belly: hover - (low + 0.3) * sc };

  // ---- one frame of the body ---------------------------------------------------------------------------
  const st = { lean: 0, side: 0, rise: 0, pour: 0, twist: 0, head: 0, carry: 0, was: false };
  B.animate = o => {
    const { t, dt, pose: P = null, moving = false, speak = false, sitK = 0, sitY = hover } = o, w = o.w ?? 1, k = Math.min(1, dt * 5);
    st.lean += ((P ? P.lean * w : 0) + (moving ? 0.1 : 0) + (o.bow ?? 0) - st.lean) * k; st.side += ((P?.side ?? 0) - st.side) * k; st.rise += ((P ? P.rise : 0) - st.rise) * k;
    st.pour += ((P ? P.pour * w : 0) - st.pour) * k; st.twist += ((P?.twist ?? 0) * w - st.twist) * k; st.head += ((o.head ?? 0) - st.head) * Math.min(1, dt * 4);
    const calm = P?.calm || sitK > 0.5, by = hover + (sitY - hover) * sitK, bobY = Math.sin(t * (calm ? 0.9 : 1.7)) * (calm ? 0.03 : 0.07) * (1 - sitK);
    bob.position.y = by + bobY + st.rise + (o.lift ?? 0);
    bob.rotation.set(st.lean + (P ? 0 : Math.sin(t * 0.7) * 0.02), st.head + st.twist, Math.sin(t * 0.9) * 0.03 * (1 - sitK) + st.side + (moving ? 0.03 : 0), 'YXZ');
    ring.visible = sitK < 0.5 || !!o.ringOn;      // (ringOn: it hovers over its seat) ring.scale.setScalar(1 + 0.08 * Math.sin(t * 5)); ring.material.opacity = 0.6 + 0.25 * Math.sin(t * 5);
    // the tray: eases out in front, comes forward when offered
    const carry = o.carry ?? 0, on = carry > 0; tray.visible = on;
    if (on && !st.was) { tray.scale.setScalar(0.4); tray.position.set(trayRest[0], trayRest[1] - 0.15, trayRest[2]); }
    st.was = on;
    if (on) { const off = carry > 1.5 ? 1 : 0; tray.position.x += (trayRest[0] - 0.14 * off - tray.position.x) * k; tray.position.y += (trayRest[1] + 0.1 * off - tray.position.y) * k; tray.position.z += (trayRest[2] + 0.3 * off - tray.position.z) * k; tray.scale.setScalar(Math.min(1, tray.scale.x + dt * 2.5)); tray.rotation.z = 0.02 * Math.sin(t * 1.3); }
    hands.forEach((h, i) => {
      const r = h.userData.rest; let tx = r[0], ty = r[1] + Math.sin(t * 2.1 + i * 2) * 0.03, tz = r[2], rx = 0, rz = 0;
      if (P) { const q = i ? P.R : P.L; tx = r[0] + (q[0] - r[0]) * w; ty = r[1] + (q[1] - r[1]) * w; tz = r[2] + (q[2] - r[2]) * w; if (i) { rx = st.pour + (P.tipR ?? 0) * w; rz = (P.rollR ?? 0) * w; } else { rx = (P.tipL ?? 0) * w; rz = (P.rollL ?? 0) * w; } }
      else if (moving) { ty += Math.sin(t * 6 + i * Math.PI) * 0.04; tz += Math.sin(t * 6 + i * Math.PI) * 0.06; }
      if (on) { if (i) { tx = tray.position.x; ty = tray.position.y - 0.13; tz = tray.position.z - 0.02; rx = 0; rz = 0; } else if (!P) { tx = r[0] * 0.92; tz = r[2] + 0.08; } }
      else if (speak && !P) {      // talking with its hands, in the mood of the line
        const m = o.expr, bt = Math.abs(Math.sin(t * 3.4));
        if (m === 'happy' || m === 'love') { ty = r[1] + 0.2 + 0.05 * Math.sin(t * 4.2 + i * 1.3); tz = r[2] + 0.28; }
        else if (m === 'sass' || m === 'wink') { if (i) { tx = r[0] + 0.06; ty = r[1] + 0.3 + 0.1 * bt; tz = r[2] + 0.26; } else { ty = r[1] - 0.1; tz = r[2] - 0.16; } }
        else if (i) { tx = r[0] * 0.86; ty = r[1] + 0.18 + 0.06 * bt; tz = r[2] + 0.34; }
      } else if (speak && i === 0 && w < 0.5) { ty = r[1] + 0.14 + 0.06 * Math.sin(t * 7); tz = r[2] + 0.12; }
      h.position.x += (tx - h.position.x) * k; h.position.y += (ty - h.position.y) * k; h.position.z += (tz - h.position.z) * k;
      h.rotation.x += (rx - h.rotation.x) * k; h.rotation.z += (rz - h.rotation.z) * k;
    });
    face.draw(o.expr ?? 'neutral', o.look ?? 0, o.shut ?? false, { ly: o.ly ?? 0, mouth: speak ? talkMouth(t) : 0 });
  };
  B.cost = () => { let calls = 0, tris = 0; root.traverse(m => { if (m.isMesh && m.visible) { calls++; const g = m.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); return [calls, Math.round(tris)]; };
  return B;
}

// ---- things carried on the tray or in both hands that are not drinks (drinks: faculty/drinks.js) -----------------
export function buildCarried(kind) {
  const g = new THREE.Group(), add = list => g.add(mesh(merge(list.map(q => (q.index ? q.toNonIndexed() : q)))));
  if (kind === 'towel') add([paint(T(slab(0.5, 0.13, 0.36), { p: [0, 0.07, 0] }), LINEN), paint(T(slab(0.46, 0.12, 0.34), { p: [0, 0.18, 0], r: [0, 0.08, 0] }), '#e9e2d2'), paint(T(cyl(0.012, 0.012, 0.36, 5), { p: [0.12, 0.245, 0], r: [Math.PI / 2, 0, 0] }), '#9cc5bd')]);
  else if (kind === 'robe') add([paint(T(slab(0.56, 0.2, 0.4), { p: [0, 0.1, 0] }), '#efe6d6'), paint(T(slab(0.44, 0.07, 0.34), { p: [0, 0.22, 0] }), '#e6dac6'), paint(T(cyl(0.03, 0.03, 0.44, 8), { p: [0, 0.2, 0.19], r: [0, 0, Math.PI / 2] }), '#d9cbb2')]);
  else if (kind === 'cheese') {      // a board for one: a wedge with its rind and a cut face, a blue, a few grapes, a knife
    const wedge = new THREE.CylinderGeometry(0.2, 0.2, 0.09, 10, 1, false, 0, 0.9);
    add([paint(T(cyl(0.3, 0.3, 0.025, 20), { p: [0, 0.012, 0] }), '#6a4a30'),
      paint(T(wedge, { p: [-0.12, 0.07, -0.02] }), p => (Math.hypot(p.x + 0.12, p.z + 0.02) > 0.185 ? '#b9955a' : '#f0d98a')),
      paint(T(slab(0.16, 0.09, 0.12), { p: [0.1, 0.07, -0.08], r: [0, 0.4, 0] }), p => (Math.sin(p.x * 90) * Math.sin(p.z * 70 + p.y * 50) > 0.5 ? '#5b7a8a' : '#efe9d6')),
      ...[0, 1, 2, 3, 4, 5, 6].map(i => paint(T(sph(0.032, 8, 6), { p: [0.06 + (i % 3) * 0.055, 0.05 + (i > 4 ? 0.04 : 0), 0.1 + Math.floor(i / 3) * 0.05] }), i % 2 ? '#5a2440' : '#6d2c4c')),
      paint(T(box(0.012, 0.008, 0.2), { p: [-0.1, 0.03, 0.16], r: [0, 0.5, 0] }), STEEL)]);
  }
  return g;
}
