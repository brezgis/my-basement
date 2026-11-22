// larder: shelf furniture and the things collected on it, for the Listening Room (larder.js). Real profiles, one per kind
// (turned on a lathe at 12 to 14 sides), so that every bottle has a shoulder and a punt, every jar its lid or cloth;
// and a shelf unit with thickness, rounded nosings, chamfered uprights, a plinth and a crown.
// Every helper takes a kit frame (x along the shelf, y out from the wall, z up) and a point on a shelf.
import * as THREE from 'three';
import { lathe, sweep } from '../kit/geom.js';

const TAU = Math.PI * 2;
export function goods(K, P, flame = () => {}) {
  const put = (f, m, g, t) => K.put(f, m, g, t), ves = (f, m, x, y, z, prof, seg = 12) => put(f, m, lathe(prof, { seg }), { at: [x, y, z] });
  const tube = (f, m, path, r, seg = 5) => put(f, m, sweep(path, r, { seg }));
  const OAK = 'oak_light#c9a070', OAKD = 'c#7a5636/0.6', LINEN = 'c#e8e0cc/0.9', BRASS = 'c#b08d4a/0.3/1', WIRE = 'c#b9b8b2/0.3/1';

  // ---- the shelf unit: x0..x1 along the wall, d deep; zs the tops of the shelves (taller spaces at the bottom); up to top
  function unit(f, x0, x1, zs, d, top, o = {}) {
    const wood = o.wood ?? OAK, th = 0.1, base = o.base ?? zs[0];
    f.box(o.backMat ?? wood, x0, x1, 0.02, 0.07, base, top);                                                       // the back board
    if (o.planks) for (let x = x0 + 0.5; x < x1; x += 0.55) f.box('c#2e2014/0.7', x - 0.008, x + 0.008, 0.07, 0.075, base, top);
    const ups = o.ups ?? [x0, x1];
    for (const x of ups) f.bev(wood, x - 0.07, x + 0.07, 0.07, d, o.plinth === false ? base : 0, top, 0.025);      // uprights, their edges chamfered
    if (o.plinth !== false) { f.box(OAKD, x0 + 0.06, x1 - 0.06, 0.2, d - 0.1, 0, base - th); f.bev(wood, x0, x1, 0.07, d + 0.02, base - th - 0.04, base - th, 0.01); }
    for (const z of zs) {
      f.bev(wood, x0 + 0.06, x1 - 0.06, 0.07, d - 0.03, z - th, z, 0.012);                                  // the board
      put(f, wood, new THREE.CylinderGeometry(th / 2, th / 2, x1 - x0 - 0.12, 8, 1).rotateZ(Math.PI / 2).translate((x0 + x1) / 2, d - 0.04, z - th / 2));      // its rounded nosing
      if (o.gallery) { f.box(BRASS, x0 + 0.1, x1 - 0.1, d - 0.07, d - 0.05, z + 0.14, z + 0.16); for (let x = x0 + 0.4; x < x1 - 0.2; x += 0.9) f.box(BRASS, x - 0.008, x + 0.008, d - 0.07, d - 0.05, z, z + 0.14); }
    }
    // the crown: a frieze board, a cove and a cap, stepping forward
    f.bev(wood, x0 - 0.02, x1 + 0.02, 0.07, d + 0.02, top, top + 0.28, 0.01);
    f.bev(wood, x0 - 0.08, x1 + 0.08, 0.05, d + 0.08, top + 0.28, top + 0.34, 0.01);
    f.bev(wood, x0 - 0.14, x1 + 0.14, 0.03, d + 0.14, top + 0.34, top + 0.42, 0.015);
    f.block(x0, x1, 0, d, 0, top + 0.42);
  }

  // ---- bottles: Bordeaux, Burgundy, a squat spirit, a tall liqueur; with punt, foil capsule, label
  const BOT = {
    bordeaux: [[0, 0.04], [0.06, 0.012], [0.105, 0], [0.11, 0.02], [0.11, 0.66], [0.1, 0.72], [0.06, 0.78], [0.04, 0.84], [0.036, 0.98], [0.04, 1.0], [0.036, 1.02], [0, 1.02]],
    burgundy: [[0, 0.04], [0.07, 0.012], [0.12, 0], [0.125, 0.02], [0.125, 0.46], [0.11, 0.58], [0.075, 0.7], [0.042, 0.8], [0.036, 0.98], [0.04, 1.0], [0.036, 1.02], [0, 1.02]],
    spirit: [[0, 0.03], [0.1, 0], [0.13, 0.02], [0.13, 0.42], [0.12, 0.47], [0.06, 0.52], [0.04, 0.58], [0.04, 0.66], [0.06, 0.68], [0.06, 0.74], [0, 0.74]],
    liqueur: [[0, 0.03], [0.07, 0], [0.085, 0.02], [0.085, 0.8], [0.07, 0.86], [0.03, 0.92], [0.026, 1.12], [0.032, 1.14], [0, 1.14]],
  };
  function bottle(f, kind, x, y, z, col, o = {}) {
    const p = BOT[kind], h = p[p.length - 1][1], r = Math.max(...p.map(q => q[0]));
    ves(f, col, x, y, z, p, o.seg ?? 10);
    if (o.spout) { tube(f, 'c#c6c2ba/0.2/1', [[x, y, z + h - 0.02], [x, y + 0.02, z + h + 0.1], [x, y + 0.08, z + h + 0.16]], 0.01, 4); }
    if (o.foil) f.cyl(o.foil, x, y, z + h - 0.17, z + h + 0.005, 0.042, 0.04, 8);
    if (o.label) f.cyl(o.label, x, y, z + h * 0.18, z + h * (kind === 'spirit' ? 0.5 : 0.42), r + 0.006, r + 0.006, o.seg ?? 10);
    if (o.neckLabel) f.cyl(o.neckLabel, x, y, z + h * 0.8, z + h * 0.84, 0.05, 0.045, 10);
  }
  // ---- jars: a preserving jar with a glass lid and a wire clip; a jar with a cloth tied over it; a stoneware crock
  function clipJar(f, x, y, z, r, h, fill) {
    ves(f, 'glass', x, y, z + 0.006, [[0, 0], [r * 0.9, 0], [r, 0.04], [r, h * 0.85], [r * 0.86, h * 0.92], [r * 0.82, h], [0, h]], 12);
    ves(f, fill, x, y, z + 0.02, [[r * 0.94, 0], [r * 0.95, h * 0.78], [r * 0.4, h * 0.8], [0, h * 0.8]], 10);
    ves(f, 'glass', x, y, z + h, [[r * 0.88, 0], [r * 0.88, 0.04], [r * 0.5, 0.09], [0, 0.1]], 12);
    f.cyl('c#c96a3a/0.8', x, y, z + h - 0.02, z + h + 0.01, r * 0.9, r * 0.9, 12);                       // the orange rubber seal
    tube(f, WIRE, [[x - r * 0.95, y, z + h - 0.12], [x - r * 0.9, y, z + h + 0.06], [x, y, z + h + 0.12], [x + r * 0.9, y, z + h + 0.06], [x + r * 0.95, y, z + h - 0.12]], 0.009, 3);
  }
  function clothJar(f, x, y, z, r, h, fill, cloth) {
    ves(f, 'glass', x, y, z + 0.006, [[0, 0], [r * 0.9, 0], [r, 0.04], [r, h * 0.88], [r * 0.85, h], [0, h]], 12);
    ves(f, fill, x, y, z + 0.02, [[r * 0.94, 0], [r * 0.95, h * 0.84], [0, h * 0.86]], 10);
    ves(f, cloth, x, y, z + h - 0.1, [[r * 1.22, 0], [r * 1.12, 0.04], [r * 0.98, 0.1], [r * 0.9, 0.13], [r * 0.55, 0.17], [0, 0.18]], 12);
    f.cyl('c#c9a46a/0.85', x, y, z + h - 0.03, z + h + 0.01, r * 0.92, r * 0.92, 12);                    // the string
  }
  function crock(f, x, y, z, s, col) {
    ves(f, col, x, y, z, [[0, 0], [0.24 * s, 0], [0.28 * s, 0.05 * s], [0.32 * s, 0.35 * s], [0.31 * s, 0.6 * s], [0.25 * s, 0.7 * s], [0.25 * s, 0.76 * s], [0.27 * s, 0.78 * s], [0.22 * s, 0.79 * s], [0, 0.78 * s]], 11);
    f.cyl('c#5a3a22/0.5', x, y, z + 0.5 * s, z + 0.54 * s, 0.315 * s, 0.315 * s, 14);                     // a brown glaze band
  }
  function jug(f, x, y, z, s, col) {
    ves(f, col, x, y, z, [[0, 0], [0.16 * s, 0], [0.22 * s, 0.25 * s], [0.2 * s, 0.5 * s], [0.13 * s, 0.68 * s], [0.15 * s, 0.8 * s], [0.13 * s, 0.8 * s], [0, 0.78 * s]], 12);
    tube(f, col, [[x + 0.15 * s, y, z + 0.66 * s], [x + 0.3 * s, y, z + 0.6 * s], [x + 0.3 * s, y, z + 0.35 * s], [x + 0.2 * s, y, z + 0.25 * s]], 0.025 * s, 4);
  }
  // ---- coffee and tea: a tin with a lid lip and a printed band; a tea caddy, square with a domed lid
  function coffeeTin(f, x, y, z, r, h, col, band) {
    f.cyl(col, x, y, z, z + h - 0.04, r, r, 10); f.cyl(BRASS, x, y, z + h - 0.06, z + h, r + 0.01, r + 0.01, 10); f.cyl(BRASS, x, y, z + h, z + h + 0.02, r * 0.4, r * 0.4, 6);
    f.cyl(band, x, y, z + h * 0.3, z + h * 0.62, r + 0.008, r + 0.008, 10); f.cyl('c#efe6d2/0.8', x, y, z + h * 0.4, z + h * 0.52, r + 0.012, r + 0.012, 10);
  }
  function caddy(f, x, y, z, w, h, col) {
    f.bev(col, x - w / 2, x + w / 2, y - w / 2, y + w / 2, z, z + h, 0.015); ves(f, col, x, y, z + h, [[w * 0.7, 0], [w * 0.62, 0.05], [w * 0.3, 0.09], [0.03, 0.1], [0.04, 0.13], [0, 0.14]], 4);
    f.box(BRASS, x - w * 0.3, x + w * 0.3, y + w / 2, y + w / 2 + 0.008, z + h * 0.35, z + h * 0.65);
  }
  // ---- china and glass: cups stacked on saucers, glasses upside down on a folded cloth, a cake stand under a dome
  function cupStack(f, x, y, z, n, col) {
    const sh = n * 0.02; ves(f, col, x, y, z, [[0, 0], [0.12, 0], [0.18, 0.015], [0.19, sh], [0, sh]], 12);      // the saucers, as one stack
    for (let i = 0; i < n; i++) ves(f, col, x, y, z + sh + i * 0.12, [[0.06, 0], [0.11, 0.06], [0.125, 0.17], [0.11, 0.17], [0.09, 0.08], [0, 0.04]], 10);
  }
  function glassesOnCloth(f, x0, x1, y, z, n) {
    f.bev(LINEN, x0, x1, y - 0.28, y + 0.28, z, z + 0.04, 0.012);
    for (let i = 0; i < n; i++) { const x = x0 + 0.2 + i * (x1 - x0 - 0.4) / Math.max(1, n - 1);
      ves(f, 'glass', x, y, z + 0.045, [[0, 0], [0.1, 0], [0.105, 0.12], [0.07, 0.22], [0.012, 0.28], [0.012, 0.52], [0.08, 0.54], [0, 0.555]], 8); }
  }
  function cakeDome(f, x, y, z) {
    ves(f, 'c#efe9dd/0.2', x, y, z, [[0, 0], [0.16, 0], [0.08, 0.04], [0.05, 0.3], [0.52, 0.32], [0.54, 0.35], [0, 0.35]], 16);
    P.cutWheel(f, x, y, z + 0.36, 0.34, 0.24, 0.8, 'c#f1e6cc/0.6', 'c#c99a5a/0.6');                      // a lemon drizzle cake, cut
    ves(f, 'glass', x, y, z + 0.34, [[0.52, 0], [0.52, 0.3], [0.44, 0.52], [0.24, 0.64], [0.06, 0.68], [0.05, 0.75], [0.08, 0.77], [0, 0.8]], 16);
  }
  // ---- a wooden bowl of lemons; a few books lying flat; a candle; a trailing plant; a small framed print leaning
  function lemonBowl(f, x, y, z) {
    ves(f, 'c#8a5a32/0.6', x, y, z, [[0, 0], [0.18, 0], [0.32, 0.08], [0.4, 0.2], [0.38, 0.21], [0.3, 0.1], [0, 0.04]], 16);
    for (const [dx, dy, dz] of [[-0.12, -0.06, 0.04], [0.12, 0.05, 0.04], [0, 0.13, 0.05], [0.03, -0.12, 0.04], [0, 0, 0.14]]) P.fruit(f, 'lemon', x + dx, y + dy, z + dz);
  }
  function booksFlat(f, x, y, z, n, cols) {
    let zz = z; for (let i = 0; i < n; i++) { const w = 0.72 - i * 0.06 + (i % 2) * 0.04, d = 0.5 - (i % 3) * 0.04, t = 0.07 + (i % 2) * 0.03, dx = (i % 2 ? 0.03 : -0.02);
      f.bev(cols[i % cols.length], x - w / 2 + dx, x + w / 2 + dx, y - d / 2, y + d / 2, zz, zz + t, 0.006); f.box('c#efe6d2/0.9', x - w / 2 + dx + 0.03, x + w / 2 + dx - 0.01, y - d / 2 + 0.02, y + d / 2 - 0.02 + 0.004, zz + 0.008, zz + t - 0.008); zz += t; }
    return zz;
  }
  function candle(f, x, y, z, tall = 0.42, r = 0.1) {
    ves(f, BRASS, x, y, z, [[0, 0], [r + 0.08, 0], [r + 0.08, 0.02], [r + 0.02, 0.04], [0, 0.04]], 12);
    ves(f, 'c#efe6d2/0.6', x, y, z + 0.04, [[0, 0], [r, 0], [r, tall], [r * 0.6, tall - 0.02], [0, tall - 0.03]], 12);
    flame(f, x, y, z + 0.04 + tall, 0.85);
  }
  function trailing(f, x, y, z, s = 1) {
    ves(f, 'c#b8755a/0.85', x, y, z, [[0, 0], [0.16 * s, 0], [0.22 * s, 0.32 * s], [0.24 * s, 0.34 * s], [0, 0.32 * s]], 12);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + 0.3, L = (0.8 + (i % 3) * 0.45) * s, pts = [];
      for (let k = 0; k <= 5; k++) { const t = k / 5; pts.push([x + Math.cos(a) * (0.12 + 0.35 * t) * s, y + Math.max(-0.05, Math.sin(a) * (0.12 + 0.3 * t) * s) + t * 0.3, z + 0.32 * s + 0.08 - L * t * t]); }
      tube(f, 'c#3f5a32/0.8', pts, 0.008, 3);
      for (let k = 1; k <= 5; k += 2) { const [px, py, pz] = pts[k]; put(f, k % 2 ? 'c#5d7a45/0.7' : 'c#4f6b3c/0.7', new THREE.SphereGeometry(0.05, 5, 3).scale(1.3, 0.4, 0.9).translate(px, py, pz)); } }
  }
  function leaningPrint(f, x, y, z, w, h, draw) {
    const t = 0.18, sub = f.sub(x, y + 0.12, z, 0);
    put(sub, 'c#3a2a1c/0.5', new THREE.BoxGeometry(w, 0.05, h).translate(0, 0, h / 2), { rx: -t });
    K.sign(sub, 0, 0.03 + Math.sin(t) * h * 0.5, h / 2 * Math.cos(t), w - 0.12, h - 0.12, draw, { cw: 160, ch: Math.round(160 * h / w), tilt: t });
  }

  // ---- a bottle lying in a bin, its neck toward the room: only the shoulder, neck and foil show (the body is in the cell)
  const LIE = [[0.11, 0.5], [0.11, 0.66], [0.1, 0.72], [0.06, 0.78], [0.04, 0.84], [0.036, 0.97], [0.042, 0.99], [0, 1.0]];
  function bottleLying(f, x, yFront, z, col, foil, label) {
    put(f, col, lathe(LIE, { seg: 8 }), { rx: -Math.PI / 2, at: [x, yFront - 1.0, z] });
    put(f, foil, new THREE.CylinderGeometry(0.043, 0.041, 0.15, 8, 1).translate(x, yFront - 0.09, z));
    if (label) put(f, label, new THREE.CylinderGeometry(0.112, 0.112, 0.12, 8, 1, true).translate(x, yFront - 0.44, z));
  }
  // ---- glass for the bar: a coupe; a stack of coupes upside down; a cut-glass punch bowl on its foot with a ladle
  const COUPE = [[0, 0], [0.12, 0], [0.12, 0.012], [0.02, 0.03], [0.014, 0.32], [0.1, 0.36], [0.2, 0.42], [0.195, 0.43], [0.09, 0.37], [0, 0.36]];
  function coupe(f, x, y, z, fill) { ves(f, 'glass', x, y, z + 0.006, COUPE, 12); if (fill) ves(f, fill, x, y, z + 0.37, [[0, 0], [0.09, 0.0], [0.18, 0.05], [0, 0.05]], 10); }
  function coupePyramid(f, x, y, z) { const P2 = [[-0.21, 0], [0.21, 0], [0, 0.36]]; for (const [dx, dy] of P2) ves(f, 'glass', x + dx, y + dy * 0.5 - 0.1, z + 0.006, COUPE, 10); ves(f, 'glass', x, y, z + 0.44, COUPE, 10); }
  function punchBowl(f, x, y, z, fill) {
    ves(f, 'glass', x, y, z + 0.006, [[0, 0], [0.22, 0], [0.22, 0.03], [0.08, 0.08], [0.07, 0.22], [0.3, 0.3], [0.48, 0.48], [0.5, 0.62], [0.47, 0.62], [0.45, 0.48], [0.28, 0.33], [0, 0.3]], 16);
    ves(f, fill, x, y, z + 0.33, [[0, 0], [0.28, 0.02], [0.44, 0.17], [0.45, 0.2], [0, 0.2]], 14);
    tube(f, 'c#c6c2ba/0.25/1', [[x + 0.2, y, z + 0.4], [x + 0.36, y, z + 0.66], [x + 0.42, y, z + 0.85]], 0.015, 4);
  }
  // ---- a small round table: a marble top with a brass edge on a brass pedestal; h the top
  function bistro(f, x, y, h = 2.3, r = 0.95) {
    const IRONS = 'c#2b2724/0.55/1'; f.cyl(IRONS, x, y, 0, 0.06, 0.62, 0.66, 14); f.cyl(IRONS, x, y, 0.06, h - 0.1, 0.06, 0.08, 8); f.cyl(IRONS, x, y, h - 0.12, h - 0.07, 0.35, 0.2, 10);
    f.cyl('oak_light', x, y, h - 0.09, h, r, r, 24);
    f.block(x - r * 0.75, x + r * 0.75, y - r * 0.75, y + r * 0.75, 0, h);
  }
  // ---- a little lamp for a table: a brass column and a pleated shade that glows (the shade material is cream by day)
  function tableLampB(f, x, y, z, h = 1.1) {
    ves(f, BRASS, x, y, z, [[0, 0], [0.16, 0], [0.16, 0.03], [0.05, 0.06], [0.03, h * 0.62], [0.05, h * 0.64], [0, h * 0.66]], 12);
    ves(f, 'shade', x, y, z + h * 0.6, [[0.3, 0], [0.31, 0.02], [0.2, h * 0.38], [0.19, h * 0.4]], 18); ves(f, 'shade', x, y, z + h * 0.6, [[0.185, h * 0.395], [0.195, h * 0.38], [0.3, 0.02], [0.29, 0.005]], 18);
  }

  // ---- the menu, set down: an espresso martini; truffle fries in a copper pan with aioli; a hot chocolate with cream
  function martini(f, x, y, z) { ves(f, 'glass', x, y, z + 0.006, COUPE, 14); ves(f, 'c#2a160c/0.2', x, y, z + 0.366, [[0, 0], [0.09, 0], [0.17, 0.045], [0, 0.045]], 12); f.cyl('c#c9a070/0.6', x, y, z + 0.41, z + 0.418, 0.168, 0.168, 14);
    for (let i = 0; i < 3; i++) put(f, 'c#2a1208/0.4', new THREE.SphereGeometry(0.022, 6, 4).scale(1.3, 1, 0.6).translate(x + Math.cos(i * 2.1) * 0.035, y + Math.sin(i * 2.1) * 0.035, z + 0.425)); }
  function fries(f, x, y, z) {
    ves(f, 'c#b0643a/0.3/1', x, y, z, [[0, 0], [0.16, 0], [0.2, 0.12], [0.19, 0.12], [0.15, 0.015], [0, 0.015]], 14); tube(f, 'c#b0643a/0.3/1', [[x + 0.2, y, z + 0.08], [x + 0.42, y, z + 0.09]], 0.018, 4);
    f.cyl('c#efe6d2/0.9', x, y, z + 0.016, z + 0.03, 0.17, 0.17, 12);
    for (let i = 0; i < 14; i++) put(f, 'c#d9a84a/0.7', new THREE.BoxGeometry(0.028, 0.028, 0.24).rotateX(0.5 + (i % 3) * 0.35).rotateZ(i * 0.8).translate(x + Math.cos(i * 2.3) * 0.07, y + Math.sin(i * 2.3) * 0.06, z + 0.1 + (i % 4) * 0.025));
    for (let i = 0; i < 6; i++) f.box('c#f4efe0/0.8', x + Math.cos(i * 1.7) * 0.05 - 0.01, x + Math.cos(i * 1.7) * 0.05 + 0.01, y + Math.sin(i * 1.7) * 0.05 - 0.01, y + Math.sin(i * 1.7) * 0.05 + 0.01, z + 0.2, z + 0.206);
    ves(f, 'c#efe9dd/0.3', x - 0.3, y + 0.2, z, [[0, 0], [0.07, 0], [0.08, 0.08], [0.075, 0.08], [0, 0.03]], 12); f.cyl('c#f2e6b8/0.5', x - 0.3, y + 0.2, z + 0.03, z + 0.07, 0.07, 0.07, 10);
  }
  function hotChoc(f, x, y, z) {
    ves(f, 'c#efe9dd/0.25', x, y, z, [[0, 0], [0.2, 0], [0.24, 0.025], [0.22, 0.03], [0, 0.02]], 14);
    ves(f, 'c#efe9dd/0.25', x, y, z + 0.02, [[0, 0], [0.12, 0], [0.15, 0.04], [0.15, 0.3], [0.14, 0.3], [0, 0.26]], 14); tube(f, 'c#efe9dd/0.25', [[x + 0.15, y, z + 0.25], [x + 0.24, y, z + 0.2], [x + 0.24, y, z + 0.11], [x + 0.15, y, z + 0.07]], 0.016, 4);
    ves(f, 'c#fbf6ec/0.8', x, y, z + 0.3, [[0.145, 0], [0.13, 0.06], [0.09, 0.12], [0.05, 0.16], [0.02, 0.2], [0, 0.21]], 12);
    for (let i = 0; i < 6; i++) f.box('c#3a1e10/0.5', x + Math.cos(i * 2) * 0.05 - 0.015, x + Math.cos(i * 2) * 0.05 + 0.015, y + Math.sin(i * 2) * 0.05 - 0.006, y + Math.sin(i * 2) * 0.05 + 0.006, z + 0.42 + (i % 3) * 0.02, z + 0.426 + (i % 3) * 0.02);
    f.bev('c#c99a5a/0.8', x - 0.18, x - 0.02, y - 0.2, y - 0.12, z + 0.03, z + 0.05, 0.005);      // a biscuit on the saucer
  }

  // ---- a lush plant in a clay pot: many big leaves on arching stems in three tiers (a fiddle-leaf fig, a rubber plant)
  function lushPlant(f, x, y, z, s = 1, o = {}) {
    const pr = 0.45 * s, ph = 0.8 * s, rr = (() => { let k = Math.round((x * 7 + y * 13 + z * 3) * 1000) % 2147483646 + 1; return () => ((k = (k * 16807) % 2147483647) / 2147483647); })();
    ves(f, o.pot ?? 'c#b8755a/0.85', x, y, z, [[0, 0], [pr * 0.7, 0], [pr * 0.95, ph * 0.85], [pr * 1.05, ph * 0.86], [pr * 1.05, ph], [pr * 0.9, ph * 0.88], [0, ph * 0.86]], 16);
    f.cyl('c#3b2a1f/1', x, y, z + ph * 0.84, z + ph * 0.87, pr * 0.9, pr * 0.9, 12);
    const stems = [], leaves = [], top = ph * 0.86, n = o.n ?? 30, H0 = o.height ?? 2.4;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996 + rr() * 0.5, tier = i / n, H = (0.4 + tier * 0.9 + rr() * 0.25) * H0 * s, lean = (0.25 + (1 - tier) * 0.45) * H * 0.6;
      const end = [Math.cos(a) * lean, Math.sin(a) * lean, top + H];
      stems.push(K.geom.sweep([[0, 0, top], [end[0] * 0.25, end[1] * 0.25, top + H * 0.55], end], 0.014 * s, { seg: 3 }));
      const L = (0.5 + rr() * 0.25) * s * (o.leaf ?? 1);
      leaves.push(K.geom.xf(K.leafGeo(L, L * 0.48, rr, 0.3), { ry: -0.35 - rr() * 0.7, rz: a + (rr() - 0.5) * 0.5, at: end }));
    }
    put(f, 'c#556b3a/0.8', K.geom.merge(stems), { at: [x, y, z] });
    put(f, o.leafMat ?? 'c#3f6a34/0.45', K.geom.merge(leaves), { at: [x, y, z] });
    if (o.block !== false) f.block(x - pr, x + pr, y - pr, y + pr, z, z + Math.max(1.5, ph + 0.5));
  }
  return { lushPlant, martini, fries, hotChoc, bottleLying, coupe, coupePyramid, punchBowl, bistro, tableLampB, unit, bottle, clipJar, clothJar, crock, jug, coffeeTin, caddy, cupStack, glassesOnCloth, cakeDome, lemonBowl, booksFlat, candle, trailing, leaningPrint };
}
