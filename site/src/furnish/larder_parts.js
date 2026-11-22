// larder: small goods for the Larder and the Cave (larder.js), turned and swept from the kit's geometry. Every
// helper takes a kit frame first (x along, y depth with the front toward +y, z up above the frame) and adds
// through K.put, so plain `c#` colours share the room's vertex-coloured meshes. After Vesper Street's shopkit
// (~/projects/town_walk/site/src/shopkit.js), cut down and grown for cheese, wine and coffee.
import * as THREE from 'three';
import { lathe, sweep } from '../kit/geom.js';

const TAU = Math.PI * 2;
export const C = {
  PORC: 'c#efe9dd/0.18', BRASS: 'c#b08d4a/0.3/1', COPPER: 'c#b0643a/0.3/1', CHROME: 'c#d4d6d8/0.12/1', IRON: 'c#2b2724/0.5/1',
  SPRUCE: 'c#d6bf98/0.85', SPRUCE2: 'c#c9ae84/0.85', OAKP: 'c#8a6440/0.6', WALNUT: 'c#5a3e2a/0.55', GREEN: 'c#2f4b3b/0.45',
  CREAM: 'c#e8dfcb/0.5', BLACK: 'c#18140f/0.35', LEAF: ['c#4f6b3c/0.7', 'c#5d7a45/0.7', 'c#46613a/0.75', 'c#6b8550/0.7'],
};

export function parts(K) {
  const rnd = K.rnd, pick = a => a[Math.floor(rnd() * a.length)];
  const put = (f, mat, g, t) => K.put(f, mat, g, t);
  const ves = (f, mat, x, y, z, prof, seg = 12) => put(f, mat, lathe(prof, { seg }), { at: [x, y, z] });
  // a lying (or upright) cylinder along the frame's 'x', 'y' or 'z', centred at (x, y, z)
  function hcyl(f, mat, ax, x, y, z, len, r0, r1 = r0, seg = 10) {
    const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1);
    if (ax === 'x') g.rotateZ(-Math.PI / 2); else if (ax === 'z') g.rotateX(Math.PI / 2);
    g.translate(x, y, z); put(f, mat, g);
  }
  function ball(f, mat, x, y, z, r, seg = 8, sz = 1, sx = 1) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.6)));
    g.rotateX(Math.PI / 2); g.scale(sx, 1, sz); g.translate(x, y, z + r * sz); put(f, mat, g);
  }
  const tube = (f, mat, path, r, seg = 6, caps = false) => put(f, mat, sweep(path, r, { seg, caps }));

  // ---- bottles, jars, tins, glasses, china -------------------------------------------------------------
  function bottle(f, x, y, z, o = {}) {
    const r = o.r ?? 0.11, h = o.h ?? 1.0, col = o.col ?? 'c#2c4a2a/0.15', neck = o.neck ?? 0.036, sh = o.shoulder ?? 0.62;
    const prof = o.burgundy ? [[0, 0], [r, 0], [r, h * 0.5], [r * 0.75, h * 0.66], [neck, h * 0.8], [neck, h], [0, h]] : [[0, 0], [r, 0], [r, h * sh], [r * 0.6, h * (sh + 0.1)], [neck, h * (sh + 0.18)], [neck, h], [0, h]];
    ves(f, col, x, y, z, prof, 7);
    if (o.cap) f.cyl(o.cap, x, y, z + h - 0.1, z + h + 0.008, neck + 0.01, neck + 0.01, 5);
    if (o.label) f.cyl(o.label, x, y, z + h * 0.16, z + h * 0.42, r + 0.018, r + 0.018, 7);
  }
  // a bottle lying in a rack, its punt toward +y (the room): only what shows, a short stub and the base
  // (only the punt shows: a dark disc facing the room, a paler ring of the bottle's shoulder round it)
  function bottleEnd(f, x, y, z, col, r = 0.105) { const g = new THREE.CircleGeometry(r, 6); g.rotateX(-Math.PI / 2); g.translate(x, y, z); put(f, col, g); const h = new THREE.CircleGeometry(r * 0.45, 5); h.rotateX(-Math.PI / 2); h.translate(x, y + 0.012, z); put(f, 'c#0e0c0a/0.3', h); }
  function jar(f, x, y, z, r, h, fill, o = {}) {
    const sg = o.seg ?? 8;
    ves(f, 'glass', x, y, z + 0.006, [[0, 0], [r, 0], [r, h * 0.9], [r * 0.82, h], [0, h]], sg);
    if (fill) ves(f, fill, x, y, z + 0.012, [[r - 0.014, 0], [r - 0.014, h * (o.lvl ?? 0.82)], [0, h * (o.lvl ?? 0.82)]], Math.max(6, sg - 2));
    if (o.cloth) { ves(f, o.cloth, x, y, z + h - 0.06, [[r * 1.12, 0.0], [r * 0.95, 0.1], [r * 0.6, 0.13], [0, 0.14]], sg); f.cyl('c#c9a46a/0.8', x, y, z + h - 0.02, z + h + 0.025, r * 0.88, r * 0.88, sg); }
    else if (o.lid !== false) f.cyl(o.lid ?? 'c#c9ccd0/0.3/1', x, y, z + h - 0.02, z + h + 0.05, r * 0.86, r * 0.86, sg);
    if (o.label) f.cyl(o.label, x, y, z + h * 0.3, z + h * 0.6, r + 0.02, r + 0.02, sg);
  }
  function tin(f, x, y, z, r, h, label, band, lid = 'c#b9b8b2/0.3/1') {
    f.cyl(lid, x, y, z, z + h, r, r, 8); f.cyl(label, x, y, z + 0.03, z + h - 0.05, r + 0.022, r + 0.022, 8);
    if (band) f.cyl(band, x, y, z + h * 0.42, z + h * 0.58, r + 0.045, r + 0.045, 8);
  }
  // a square tea caddy
  function caddy(f, x, y, z, w, h, col, band) {
    f.box(col, x - w / 2, x + w / 2, y - w / 2, y + w / 2, z, z + h); f.box('c#b9b4aa/0.3/1', x - w / 2 - 0.01, x + w / 2 + 0.01, y - w / 2 - 0.01, y + w / 2 + 0.01, z + h - 0.01, z + h + 0.06);
    if (band) f.box(band, x - w / 2 - 0.02, x + w / 2 + 0.02, y - w / 2 - 0.02, y + w / 2 + 0.02, z + h * 0.35, z + h * 0.62);
  }
  const plate = (f, x, y, z, r = 0.38, col = C.PORC) => ves(f, col, x, y, z, [[0, 0], [r * 0.6, 0], [r * 0.65, 0.015], [r, 0.05], [r, 0.06], [r * 0.6, 0.03], [0, 0.03]], 12);
  const bowl = (f, x, y, z, r, h, col = C.PORC, seg = 12) => ves(f, col, x, y, z, [[0, 0], [r * 0.5, 0], [r * 0.85, h * 0.45], [r, h], [r * 0.93, h], [r * 0.8, h * 0.5], [r * 0.45, h * 0.12], [0, h * 0.12]], seg);
  function wineGlass(f, x, y, z, fill) {
    ves(f, 'glass', x, y, z, [[0, 0], [0.11, 0], [0.11, 0.012], [0.015, 0.03], [0.012, 0.3], [0.07, 0.36], [0.11, 0.46], [0.1, 0.6], [0.095, 0.6], [0.1, 0.46], [0.06, 0.37], [0, 0.34]], 9);
    if (fill) ves(f, fill, x, y, z + 0.33, [[0, 0], [0.06, 0.03], [0.095, 0.1], [0.098, 0.13], [0, 0.13]], 10);
  }
  function tumbler(f, x, y, z, fill) { ves(f, 'glass', x, y, z, [[0, 0], [0.1, 0], [0.11, 0.32], [0.1, 0.32], [0.09, 0.03], [0, 0.03]], 8); if (fill) f.cyl(fill, x, y, z + 0.03, z + 0.2, 0.088, 0.096, 10); }
  function cupSaucer(f, x, y, z, col = C.PORC, coffee = 'c#3b2416/0.2') {
    ves(f, col, x, y, z, [[0, 0], [0.16, 0], [0.19, 0.03], [0.18, 0.035], [0, 0.02]], 10);
    ves(f, col, x, y, z + 0.02, [[0, 0], [0.07, 0], [0.12, 0.08], [0.13, 0.2], [0.12, 0.2], [0.1, 0.06], [0, 0.04]], 10);
    if (coffee) f.cyl(coffee, x, y, z + 0.17, z + 0.18, 0.112, 0.112, 10);
    tube(f, col, [[x + 0.12, y, z + 0.17], [x + 0.2, y, z + 0.15], [x + 0.19, y, z + 0.08], [x + 0.12, y, z + 0.07]], 0.014, 4);
  }
  // a stack of n cups upside down (on the machine's warming tray), or saucers
  function cupStack(f, x, y, z, n, col = C.PORC) { for (let i = 0; i < n; i++) ves(f, col, x, y, z + i * 0.14, [[0.12, 0], [0.13, 0.015], [0.08, 0.15], [0, 0.155]], 9); }

  // ---- fruit, bread, cheese -----------------------------------------------------------------------------
  function fruit(f, kind, x, y, z, s = 1) {
    const r = { apple: 0.13, orange: 0.14, lemon: 0.11, pear: 0.11, fig: 0.09, plum: 0.08, quince: 0.15, apricot: 0.08 }[kind] * s;
    const col = { apple: pick(['c#a8231c/0.45', 'c#b8361f/0.45', 'c#8f1d18/0.45', 'c#c9a33a/0.5']), orange: 'c#e0851f/0.6', lemon: 'c#e8c73a/0.55', pear: pick(['c#b9b24a/0.55', 'c#a88f3a/0.6']),
      fig: 'c#4a2240/0.5', plum: 'c#3d2348/0.35', quince: 'c#d9b84a/0.7', apricot: 'c#e8923a/0.6' }[kind];
    if (kind === 'pear' || kind === 'fig') { const k = kind === 'fig' ? 0.8 : 1; ves(f, col, x, y, z, [[0, 0], [r * 0.7, r * 0.1], [r, r * 0.7], [r * 0.85, r * 1.3 * k], [r * 0.45, r * 1.8 * k], [r * 0.3, r * 2.1 * k], [0, r * 2.2 * k]], 10); tube(f, 'c#4a3a24/0.8', [[x, y, z + r * 2.1 * k], [x + 0.02, y, z + r * 2.45 * k]], 0.012, 3); return; }
    if (kind === 'lemon') { const g = new THREE.SphereGeometry(r, 10, 7); g.scale(1.35, 1, 1); g.rotateZ(rnd() * 3); g.translate(x, y, z + r * 0.95); put(f, col, g); return; }
    const sq = kind === 'apple' ? 0.92 : 0.95;
    ves(f, col, x, y, z, [[0, r * 0.12], [r * 0.6, 0], [r * 0.95, r * 0.45 * sq], [r, r * sq], [r * 0.9, r * 1.55 * sq], [r * 0.45, r * 1.88 * sq], [0, r * 1.75 * sq]], 7);
    if (kind === 'apple' || kind === 'quince') tube(f, 'c#4a3a24/0.8', [[x, y, z + r * 1.7], [x + 0.015, y, z + r * 2.05]], 0.01, 3);
  }
  function grapes(f, x, y, z, col = 'c#4a2a48/0.35', n = 11) {      // a bunch lying on a board, stalk toward -x
    for (let i = 0; i < n; i++) { const k = i / n, rr = 0.12 * (1 - k * 0.55); ball(f, col, x + k * 0.36 - 0.18, y + Math.sin(i * 2.4) * rr, z + Math.max(0, Math.cos(i * 2.4)) * 0.05 * (1 - k), 0.042, 6); }
    tube(f, 'c#5a4a2a/0.8', [[x - 0.2, y, z + 0.06], [x - 0.3, y + 0.02, z + 0.1]], 0.008, 3);
  }
  function loaf(f, x, y, z, len = 0.9, r = 0.22, col = 'c#b07a3a/0.85') {
    const g = new THREE.SphereGeometry(r, 12, 8); g.scale(len / (2 * r), 1, 0.62); g.translate(x, y, z + r * 0.6); put(f, col, g);
    for (let i = -2; i <= 2; i++) f.box('c#e0c48a/0.9', x + i * len * 0.16 - 0.025, x + i * len * 0.16 + 0.025, y - r * 0.55, y + r * 0.55, z + r * 1.14, z + r * 1.18);
  }
  // a cheese wheel, upright, its edge rounded (a Comté, a Gruyère); rind colour
  function wheel(f, x, y, z, r, h, rind = 'c#b98a4a/0.8') { const e = Math.min(0.05, h * 0.3); ves(f, rind, x, y, z, [[0, 0], [r - e, 0], [r, e], [r, h - e], [r - e, h], [0, h]], 18); }
  // a wedge out of a wheel: a sector from angle a0 to a1 (radians), radius r, height h, standing at (x, y) of its point
  function wedgeGeom(r, h, a0, a1) {
    const s = new THREE.Shape(); s.moveTo(0, 0); const n = Math.max(3, Math.ceil((a1 - a0) * 5)); for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; s.lineTo(Math.cos(a) * r, Math.sin(a) * r); } s.lineTo(0, 0);
    return new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 1 });
  }
  function wedge(f, x, y, z, r, h, a0, a1, paste = 'c#ecd38a/0.6', rind = 'c#b98a4a/0.8') {
    put(f, paste, wedgeGeom(r, h, a0, a1), { at: [x, y, z] });
    // the rind: a band round the outer face and a skin over the top, both drawn in a little from the cut faces (the cut is paste)
    const band = new THREE.CylinderGeometry(r + 0.012, r + 0.012, h - 0.004, Math.max(3, Math.round((a1 - a0) * 4)), 1, true, a0 + 0.04 + Math.PI / 2, a1 - a0 - 0.08);
    band.rotateX(Math.PI / 2); band.translate(0, 0, h / 2); put(f, rind, band, { at: [x, y, z] });
    put(f, rind, wedgeGeom(r + 0.01, 0.016, a0 + 0.04, a1 - 0.04), { at: [x, y, z + h - 0.006] });
  }
  // a wheel with a wedge cut out of it, the cut faces showing the paste
  function cutWheel(f, x, y, z, r, h, gap = 0.9, rind, paste) { wedge(f, x, y, z, r, h, gap / 2, TAU - gap / 2, paste, rind); }
  // a small leafy plant in a pot
  function leaves(f, x, y, z, o = {}) {
    const n = o.n ?? 12, len = o.len ?? 0.5, w = o.w ?? 0.06, col = o.col ?? C.LEAF, sp = o.spread ?? 0.06;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.8, L = len * (0.65 + rnd() * 0.55), up = (o.up ?? 0.85) * (0.75 + rnd() * 0.4), out = (o.out ?? 0.55) * (0.6 + rnd() * 0.7), droop = o.droop ?? 0.5;
      const bx = x + Math.cos(a) * sp * rnd(), by = y + Math.sin(a) * sp * rnd(), pts = [];
      for (let k = 0; k <= 4; k++) { const t = k / 4; pts.push([bx + Math.cos(a) * out * L * t, by + Math.sin(a) * out * L * t, z + L * (up * t - droop * out * t * t)]); }
      put(f, pick(col), sweep(pts, t => w * Math.pow(Math.sin(Math.PI * Math.min(0.97, 0.06 + t * 0.94)), 0.75) + 0.003, { seg: 4 }));
    }
  }
  function potted(f, x, y, z, o = {}) {
    const r = o.r ?? 0.2, h = o.h ?? r * 1.4, pot = o.pot ?? 'c#b8755a/0.85';
    ves(f, pot, x, y, z, [[0, 0], [r * 0.72, 0], [r * 0.95, h * 0.9], [r * 1.08, h * 0.92], [r * 1.08, h], [r * 0.93, h], [r * 0.9, h * 0.86], [0, h * 0.86]], 14);
    ves(f, 'c#3b2a1f/1', x, y, z + h * 0.84, [[0, 0], [r * 0.9, 0], [r * 0.85, 0.02], [0, 0.03]], 10);
    leaves(f, x, y, z + h * 0.84, { spread: r * 0.5, ...o });
  }
  // a bunch of herbs hung head down from a rail at z: stalks tied, a cone of leaves below
  function herbBunch(f, x, y, z, col, len = 0.9) {
    tube(f, 'c#c9b48a/0.9', [[x, y, z], [x, y, z - 0.1]], 0.014, 3);
    for (let i = 0; i < 5; i++) {                       // stalks fanning out below the tie, leafy toward their ends
      const a = i / 5 * TAU + rnd(), sp = 0.12 + rnd() * 0.1, L = len * (0.55 + rnd() * 0.3);
      put(f, i % 3 ? col : C.LEAF[i % 4], sweep([[x, y, z - 0.1], [x + Math.cos(a) * sp * 0.5, y + Math.sin(a) * sp * 0.5, z - 0.1 - L * 0.4], [x + Math.cos(a) * sp, y + Math.sin(a) * sp, z - 0.1 - L]], t => 0.008 + 0.05 * Math.pow(t, 1.4), { seg: 4 }));
    }
  }
  // a turned shape lying down: its axis along the frame's x (or 'y'), starting at (x, y, z)
  const lying = (f, mat, x, y, z, prof, seg = 16, ax = 'x') => put(f, mat, lathe(prof, { seg }), ax === 'x' ? { ry: Math.PI / 2, at: [x, y, z] } : { rx: -Math.PI / 2, at: [x, y, z] });
  const latheG = (prof, seg = 16) => lathe(prof, { seg });
  // a croissant: a crescent swept round an arc, fat in the middle, lying at (x, y, z), turned by a
  function croissant(f, x, y, z, a = 0) {
    const pts = []; for (let i = 0; i <= 8; i++) { const t = -1.25 + 2.5 * i / 8; pts.push([x + Math.cos(t + a) * 0.17, y + Math.sin(t + a) * 0.17, z + 0.05 + 0.03 * Math.cos(t * 1.2)]); }
    put(f, 'c#c98a3a/0.55', sweep(pts, t => 0.018 + 0.068 * Math.pow(Math.sin(Math.PI * t), 0.8), { seg: 7, caps: true }));
  }

  // ---- cheese, closer: a wedge with its rind, its paste, a few eyes on the cut faces and the stamp on its rind; the top of
  //      a blue with its veins; a goat's log in ash, cut; a cloth-bound wheel
  const CHEESE = { comte: ['c#e9cf86/0.55', 'c#9a6a34/0.85', true], manchego: ['c#efe2b0/0.6', 'c#4a3a2a/0.85', false], brie: ['c#f3ead2/0.6', 'c#f4f0e6/0.95', false] };
  function cheeseWedge(f, x, y, z, r, h, a0, a1, kind) {
    const [paste, rind, eyes] = CHEESE[kind];
    wedge(f, x, y, z, r, h, a0, a1, paste, rind);
    if (eyes) for (const [a, k, u, v] of [[a0, 0, 0.5, 0.45], [a1, 1, 0.6, 0.55]]) { const rr = r * u, n = (k ? 1 : -1) * 0.0;
      put(f, 'c#d9bc72/0.7', new THREE.SphereGeometry(0.022, 6, 4).scale(1, 1, 0.8).translate(x + Math.cos(a) * rr + n, y + Math.sin(a) * rr, z + h * v)); }
    if (kind === 'comte') { const am = (a0 + a1) / 2, rr = r * 0.62; put(f, 'c#4a6a3a/0.6', new THREE.CircleGeometry(0.05, 8).translate(x + Math.cos(am) * rr, y + Math.sin(am) * rr, z + h + 0.008)); }      // the green casein stamp on the rind
    if (kind === 'manchego') for (let i = 0; i < 4; i++) { const a = a0 + (a1 - a0) * (i + 0.5) / 4; put(f, 'c#2e2418/0.9', new THREE.BoxGeometry(0.01, 0.01, h * 0.8).rotateZ(a).translate(x + Math.cos(a) * (r + 0.018), y + Math.sin(a) * (r + 0.018), z + h / 2)); }      // the plaited rind
  }
  function blueTop(f, x, y, z, r) {
    f.cyl('c#ece4cc/0.7', x, y, z, z + 0.01, r - 0.01, r - 0.01, 12);
    for (let i = 0; i < 9; i++) { const a = i * 2.4, rr = r * (0.2 + (i % 4) * 0.18); put(f, 'c#4a6a6a/0.8', new THREE.SphereGeometry(0.018, 5, 3).scale(1.6, 1, 0.4).rotateZ(a).translate(x + Math.cos(a) * rr, y + Math.sin(a) * rr, z + 0.012)); }
  }
  function ashLog(f, x, y, z, len, r = 0.1) {
    put(f, 'c#4a4844/0.95', new THREE.CylinderGeometry(r, r, len, 12).rotateZ(Math.PI / 2).translate(x, y, z + r));
    put(f, 'c#f2f0ea/0.85', new THREE.CircleGeometry(r * 0.94, 12).rotateY(Math.PI / 2).translate(x + len / 2 + 0.003, y, z + r));
    put(f, 'c#f2f0ea/0.85', new THREE.CylinderGeometry(r * 0.98, r * 0.98, 0.04, 12).rotateZ(Math.PI / 2).translate(x + len / 2 + 0.15, y, z + r));      // a slice cut off, lying by it
  }
  function clothWheel(f, x, y, z, r, h) { ves(f, 'linen#c9b48a', x, y, z, [[0, 0], [r - 0.03, 0], [r, 0.03], [r, h - 0.03], [r - 0.03, h], [0, h]], 14); f.cyl('c#8a7a5a/0.9', x, y, z + h * 0.45, z + h * 0.55, r + 0.006, r + 0.006, 14); }
  // a wheel on a rack, its stamp on top
  function stampedWheel(f, x, y, z, r, h, rind) { wheel(f, x, y, z, r, h, rind); f.box('c#efe6d2/0.8', x + r * 0.2, x + r * 0.5, y - 0.08, y + 0.08, z + h, z + h + 0.006); f.box('c#3e6a3e/0.6', x + r * 0.28, x + r * 0.42, y - 0.03, y + 0.03, z + h + 0.006, z + h + 0.009); }      // a paper label and its small green casein mark
  return { cheeseWedge, blueTop, ashLog, clothWheel, stampedWheel, croissant, latheG, lying, rnd, pick, put, ves, hcyl, ball, tube, bottle, bottleEnd, jar, tin, caddy, plate, bowl, wineGlass, tumbler, cupSaucer, cupStack, fruit, grapes, loaf, wheel, wedge, wedgeGeom, cutWheel, leaves, potted, herbBunch };
}

// ---- what the visitor takes in the hand (f.help build: THREE => Object3D), in feet --------------------------
const mat = (T, color, rough = 0.6, metal = 0) => new T.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
export const EAT = {
  // an espresso martini in a coupe: dark coffee, a pale crema, three beans floating
  martini: T => { const g = new T.Group(), gl = new T.MeshStandardMaterial({ color: 0xe8f2f4, roughness: 0.05, transparent: true, opacity: 0.35 });
    g.add(new T.Mesh(new T.LatheGeometry([[0, 0], [0.11, 0], [0.11, 0.012], [0.02, 0.03], [0.014, 0.32], [0.1, 0.36], [0.2, 0.42], [0.195, 0.43], [0.09, 0.37], [0, 0.36]].map(([r, y]) => new T.Vector2(r, y)), 16), gl));
    const liq = new T.Mesh(new T.CylinderGeometry(0.17, 0.08, 0.05, 16), mat(T, 0x2a160c, 0.2)); liq.position.y = 0.385; g.add(liq);
    const crema = new T.Mesh(new T.CylinderGeometry(0.168, 0.168, 0.01, 16), mat(T, 0xc9a070, 0.6)); crema.position.y = 0.414; g.add(crema);
    for (let i = 0; i < 3; i++) { const b = new T.Mesh(new T.SphereGeometry(0.022, 6, 4), mat(T, 0x2a1208, 0.4)); b.scale.set(1.3, 0.6, 1); b.position.set(Math.cos(i * 2.1) * 0.035, 0.423, Math.sin(i * 2.1) * 0.035); g.add(b); }
    return g; },
  // truffle fries in a little copper pan lined with paper, parmesan over them, a ramekin of aioli
  fries: T => { const g = new T.Group(); const pan = new T.Mesh(new T.CylinderGeometry(0.2, 0.17, 0.12, 14, 1, true), new T.MeshStandardMaterial({ color: 0xb0643a, roughness: 0.3, metalness: 1, side: T.DoubleSide })); pan.position.y = 0.06; g.add(pan);
    const paper = new T.Mesh(new T.CylinderGeometry(0.19, 0.16, 0.02, 14), mat(T, 0xefe6d2, 0.9)); paper.position.y = 0.01; g.add(paper);
    for (let i = 0; i < 16; i++) { const f = new T.Mesh(new T.BoxGeometry(0.03, 0.03, 0.26), mat(T, 0xd9a84a, 0.7)); f.position.set(Math.cos(i * 2.3) * 0.08, 0.1 + (i % 4) * 0.03, Math.sin(i * 2.3) * 0.07); f.rotation.set(0.6 + (i % 3) * 0.3, i * 0.7, 0.2); g.add(f); }
    for (let i = 0; i < 8; i++) { const c = new T.Mesh(new T.BoxGeometry(0.02, 0.006, 0.02), mat(T, 0xf4efe0, 0.8)); c.position.set(Math.cos(i * 1.7) * 0.06, 0.2, Math.sin(i * 1.7) * 0.06); g.add(c); }
    return g; },
  // a hot chocolate: a big mug, whipped cream piled up, chocolate shavings
  hotchoc: T => { const g = new T.Group(); const m = new T.Mesh(new T.CylinderGeometry(0.15, 0.13, 0.3, 16, 1, true), new T.MeshStandardMaterial({ color: 0xefe9dd, roughness: 0.3, side: T.DoubleSide })); m.position.y = 0.15; g.add(m);
    const cream = new T.Mesh(new T.LatheGeometry([[0, 0], [0.14, 0], [0.13, 0.06], [0.09, 0.12], [0.05, 0.16], [0.02, 0.2], [0, 0.21]].map(([r, y]) => new T.Vector2(r, y)), 12), mat(T, 0xfbf6ec, 0.8)); cream.position.y = 0.28; g.add(cream);
    for (let i = 0; i < 7; i++) { const sv = new T.Mesh(new T.BoxGeometry(0.03, 0.005, 0.012), mat(T, 0x3a1e10, 0.5)); sv.position.set(Math.cos(i * 2) * 0.05, 0.42 + (i % 3) * 0.02, Math.sin(i * 2) * 0.05); sv.rotation.y = i; g.add(sv); }
    const h = new T.Mesh(new T.TorusGeometry(0.06, 0.015, 6, 12, Math.PI), new T.MeshStandardMaterial({ color: 0xefe9dd, roughness: 0.3 })); h.position.set(0.15, 0.15, 0); h.rotation.z = -Math.PI / 2; g.add(h);
    return g; },
  // a finger of Comté cut from the wedge: pale gold paste, a brown rind along one edge
  comte: T => { const g = new T.Group(), p = new T.Mesh(new T.BoxGeometry(0.28, 0.07, 0.09), mat(T, 0xe9cf86, 0.55)), r = new T.Mesh(new T.BoxGeometry(0.02, 0.072, 0.092), mat(T, 0x9a6a34, 0.85)); r.position.x = 0.15; g.add(p, r); return g; },
  // a piece of blue (Fourme d'Ambert): cream with blue-green veins
  blue: T => { const g = new T.Group(), p = new T.Mesh(new T.BoxGeometry(0.2, 0.09, 0.14), mat(T, 0xece4cc, 0.7)); g.add(p); for (let i = 0; i < 6; i++) { const v = new T.Mesh(new T.SphereGeometry(0.018, 5, 4), mat(T, 0x4a6a6a, 0.8)); v.position.set(-0.08 + i * 0.032, 0.046, (i % 2 ? 1 : -1) * 0.03); g.add(v); } return g; },
  grapes: T => { const g = new T.Group(), m = mat(T, 0x4a2a48, 0.35); for (let i = 0; i < 14; i++) { const k = i / 14, rr = 0.07 * (1 - k * 0.6), b = new T.Mesh(new T.SphereGeometry(0.035, 7, 5), m); b.position.set(Math.cos(i * 2.4) * rr, -k * 0.22, Math.sin(i * 2.4) * rr); g.add(b); } return g; },
  pear: T => { const pts = [[0, 0], [0.08, 0.01], [0.11, 0.08], [0.095, 0.15], [0.05, 0.2], [0.032, 0.24], [0, 0.25]].map(([r, y]) => new T.Vector2(r, y)); const g = new T.Group(); g.add(new T.Mesh(new T.LatheGeometry(pts, 12), mat(T, 0xb9a84a, 0.55))); const st = new T.Mesh(new T.CylinderGeometry(0.008, 0.01, 0.06, 4), mat(T, 0x4a3a24, 0.8)); st.position.y = 0.27; g.add(st); return g; },
  fig: T => { const pts = [[0, 0], [0.06, 0.01], [0.085, 0.06], [0.07, 0.12], [0.03, 0.16], [0, 0.17]].map(([r, y]) => new T.Vector2(r, y)); return new T.Mesh(new T.LatheGeometry(pts, 10), mat(T, 0x4a2240, 0.5)); },
  // a slice of Sachertorte: dark chocolate glaze over chocolate sponge, a seam of apricot
  sacher: T => { const sh = new T.Shape(); sh.moveTo(0, 0); sh.lineTo(0.32, -0.08); sh.lineTo(0.32, 0.08); sh.lineTo(0, 0); const ex = (d, c) => { const m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false }), mat(T, c, 0.4)); m.rotation.x = -Math.PI / 2; return m; };
    const g = new T.Group(), a = ex(0.08, 0x4a2a1a), b = ex(0.012, 0xc9742a), c = ex(0.08, 0x3a2014), top = ex(0.015, 0x24120a); b.position.y = 0.08; c.position.y = 0.092; top.position.y = 0.172; g.add(a, b, c, top); return g; },
  bread: T => { const m = new T.Mesh(new T.SphereGeometry(0.12, 10, 7), mat(T, 0xb07a3a, 0.9)); m.scale.set(1.4, 0.7, 1); return m; },
  // a square of quince paste on a cracker
  membrillo: T => { const g = new T.Group(), c = new T.Mesh(new T.BoxGeometry(0.2, 0.025, 0.2), mat(T, 0xd9b878, 0.9)), q = new T.Mesh(new T.BoxGeometry(0.14, 0.04, 0.14), mat(T, 0xa8401e, 0.35)); q.position.y = 0.032; g.add(c, q); return g; },
};
