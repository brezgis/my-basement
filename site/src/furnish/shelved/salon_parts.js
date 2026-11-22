// salon: the pieces of the Nail Salon (salon.js), built from the kit's geometry on kit frames (x along, y depth
// with the front toward +y, z up). Small helpers after the larder's (larder_parts.js), copied and cut down rather
// than imported, so that the two rooms do not lean on each other.
//
// The furniture is mid-century, in the house's one language (notes/STYLE.md): walnut frames, cream bouclé and
// leather, brass. The pedicure throne is Hans Wegner's Papa Bear chair (AP19, A. P. Stolen, 1951) grown into a
// throne: a tall winged back, the arms ending in walnut "paws", here raised on a walnut plinth; the guest chairs at
// the manicure bar are after Finn Juhl's 45 chair (Niels Vodder, 1945), the wooden frame carrying the upholstery as
// if it floated.
import * as THREE from 'three';
import { lathe, sweep, softBox } from '../../kit/geom.js';

const TAU = Math.PI * 2;
export const C = {
  WALNUT: 'c#8a5e38/0.5', WALNUT2: 'c#74502f/0.55', WALNUTD: 'c#4e3826/0.6', TEAK: 'c#b07c4a/0.5', HONEY: 'c#c4935a/0.5',
  BRASS: 'c#b08d4a/0.3/1', BRASS2: 'c#c9a45a/0.25/1', COPPER: 'c#b0643a/0.3/1', CHROME: 'c#d4d6d8/0.12/1',
  SLATE: 'c#3a3a3c/0.7', CREAM: 'c#e9dfcc/0.6', LEATHER: 'c#d9c6a6/0.45', PORC: 'c#f1ece2/0.2', BLACK: 'c#18140f/0.35',
  GLOW: 'e#ffb866/2', GLOWS: 'e#ffd49a/1.4',           // (amber concealed light: these two hexes are left lit by day, materials.js)
  LEAF: ['c#3f5e34/0.7', 'c#4d6d3c/0.7', 'c#355229/0.75', 'c#5b7a45/0.7'],
};
export const BOUCLE = 'c#ece2cf/0.95', OCHRE = 'wool#6a4a1c', MOSS = 'wool#2c3a26', WAL = 'oak_light#8a6844', RUG = 'c#e4d9c6/0.95', RUGB = 'c#a88a62/0.95';

export function parts(K) {
  const rnd = K.rnd, pick = a => a[Math.floor(rnd() * a.length)];
  const put = (f, mat, g, t) => K.put(f, mat, g, t);
  const ves = (f, mat, x, y, z, prof, seg = 12) => put(f, mat, lathe(prof, { seg }), { at: [x, y, z] });
  function hcyl(f, mat, ax, x, y, z, len, r0, r1 = r0, seg = 10) {
    const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1);
    if (ax === 'x') g.rotateZ(-Math.PI / 2); else if (ax === 'z') g.rotateX(Math.PI / 2);
    g.translate(x, y, z); put(f, mat, g);
  }
  function ball(f, mat, x, y, z, r, seg = 10, sz = 1, sx = 1) {
    const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.6)));
    g.rotateX(Math.PI / 2); g.scale(sx, 1, sz); g.translate(x, y, z + r * sz); put(f, mat, g);
  }
  const tube = (f, mat, path, r, seg = 6, caps = false) => put(f, mat, sweep(path, r, { seg, caps }));
  const cush = (f, mat, x0, x1, y0, y1, z0, z1, r = 0.12, o = {}) => put(f, mat, softBox(x0, x1, y0, y1, z0, z1, r, { k: 2, n: [1, 1, 1], ...o }));
  // a soft box tilted back about x by a (radians) round the point (x, y0, z0): the back of a chair
  const tilted = (f, mat, x0, x1, y0, y1, z0, z1, r, a, o = {}) => { const g = softBox(x0, x1, -(y1 - y0), 0, 0, z1 - z0, r, { k: 2, n: [1, 1, 1], ...o }); put(f, mat, g, { rx: a, at: [0, y1, z0] }); };
  const jar = (f, x, y, z, r, h, fill, lid) => { ves(f, 'glass', x, y, z + 0.005, [[0, 0], [r, 0], [r, h * 0.92], [r * 0.85, h], [0, h]], 10); if (fill) ves(f, fill, x, y, z + 0.01, [[r - 0.012, 0], [r - 0.012, h * 0.6], [0, h * 0.6]], 8); if (lid) f.cyl(lid, x, y, z + h - 0.01, z + h + 0.04, r * 0.88, r * 0.88, 10); };
  const plate = (f, x, y, z, r = 0.38, col = C.PORC) => ves(f, col, x, y, z, [[0, 0], [r * 0.6, 0], [r * 0.65, 0.015], [r, 0.05], [r, 0.06], [r * 0.6, 0.03], [0, 0.03]], 16);
  const bowl = (f, x, y, z, r, h, col = C.PORC, seg = 18) => ves(f, col, x, y, z, [[0, 0], [r * 0.5, 0], [r * 0.85, h * 0.45], [r, h], [r * 0.93, h], [r * 0.8, h * 0.5], [r * 0.45, h * 0.12], [0, h * 0.12]], seg);

  // ---- the pedicure throne: Papa Bear, on a plinth. Frame at the middle of its back foot line, front toward +y. ----
  // Returns { seat: [x, y, z], bell: [x, y, z], paw: z } in the frame (the bell is on the RIGHT paw of the sitter,
  // i.e. local -x when the frame faces the way the sitter does... see salon.js, which passes which side).
  function throne(f, o = {}) {
    const up = o.fabric ?? BOUCLE, wood = C.WALNUT, S = 1.35;          // S: seat height
    // the walnut legs, splayed, and the rails between them
    for (const [x, y] of [[-1.25, 0.35], [1.25, 0.35], [-1.3, 2.55], [1.3, 2.55]]) tube(f, wood, [[x * 1.06, y + (y > 1 ? 0.12 : -0.08), 0], [x, y, S - 0.35]], 0.075, 7, true);
    f.box(wood, -1.3, 1.3, 0.25, 0.45, S - 0.5, S - 0.32); f.box(wood, -1.32, 1.32, 2.45, 2.65, S - 0.5, S - 0.32);
    for (const s of [-1, 1]) f.box(wood, s * 1.33 - 0.09, s * 1.33 + 0.09, 0.35, 2.6, S - 0.5, S - 0.32);
    // the seat: a deep cushion on a sprung base
    cush(f, up, -1.25, 1.25, 0.4, 2.65, S - 0.32, S - 0.05, 0.12, { k: 1 });
    cush(f, up, -1.0, 1.0, 0.85, 2.75, S - 0.07, S + 0.2, 0.12, { crown: 0.05, welt: 0.012 });
    // the back: tall, leaning, with the wings swept forward at the top (the bear's ears)
    tilted(f, up, -1.05, 1.05, 0.15, 0.75, S - 0.2, S + 3.0, 0.2, 0.2, { crown: 0, bulge: 0.04 });
    for (const s of [-1, 1]) {
      const g = softBox(-0.18, 0.18, -0.6, 0.4, 0, 2.2, 0.15, { k: 2, n: [1, 1, 2], taper: -0.3 });
      put(f, up, g, { rz: s * -0.45, rx: 0.2, at: [s * 1.1, 0.55, S + 0.85] });
      // the arms: upholstered, sweeping down to the paws
      cush(f, up, s * 1.08 - 0.2, s * 1.08 + 0.2, 0.55, 2.4, S - 0.1, S + 0.75, 0.14, { crown: 0.04, k: 1 });
      // the paws: carved walnut ends of the arms
      put(f, wood, softBox(-0.21, 0.21, -0.2, 0.42, 0, 0.16, 0.06, { k: 1, crown: 0.03 }), { at: [s * 1.08, 2.4, S + 0.66] });
      tube(f, wood, [[s * 1.08, 2.62, S + 0.7], [s * 1.08, 2.75, S + 0.45], [s * 1.12, 2.7, S - 0.3]], 0.07, 6);
    }
    // a lumbar cushion in ochre or moss, and a sheepskin over the back
    cush(f, o.cushion ?? OCHRE, -0.7, 0.7, 0.75, 1.1, S + 0.25, S + 1.05, 0.14, { crown: 0.03, k: 1 });
    f.block(-1.4, 1.4, 0, 2.85, 0, S + 2.9);
    return { seat: [0, 1.75, S + 0.18], paw: S + 0.82 };
  }

  // ---- the guest chair at the manicure bar (after Juhl's 45): frame at its seat's middle, front toward +y --------
  function juhl(f, o = {}) {
    const wood = C.TEAK, S = 1.45;
    for (const [x, y] of [[-0.85, -0.7], [0.85, -0.7], [-0.9, 0.75], [0.9, 0.75]]) tube(f, wood, [[x * 1.04, y * 1.08, 0], [x, y, S - 0.1]], 0.055, 6, true);
    for (const s of [-1, 1]) { tube(f, wood, [[s * 0.92, 0.8, S - 0.05], [s * 0.95, 0.4, S + 0.62], [s * 0.94, -0.3, S + 0.75], [s * 0.88, -0.72, S + 0.55]], 0.06, 6); f.box(wood, s * 0.9 - 0.06, s * 0.9 + 0.06, -0.7, 0.75, S - 0.2, S - 0.1); }
    cush(f, o.fabric ?? C.LEATHER, -0.78, 0.78, -0.7, 0.75, S - 0.12, S + 0.12, 0.1, { crown: 0.03 });
    tilted(f, o.fabric ?? C.LEATHER, -0.75, 0.75, -0.85, -0.65, S + 0.25, S + 1.55, 0.09, 0.22, { bulge: 0.03 });
    f.block(-1.0, 1.0, -0.9, 0.9, 0, 2.6);
  }

  // ---- a low rolling technician's stool: walnut seat on a brass column and five casters -----------------------
  function techStool(f, x, y, h = 1.25, seat = C.LEATHER) {
    for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + 0.3; tube(f, C.BRASS, [[x, y, 0.22], [x + Math.cos(a) * 0.55, y + Math.sin(a) * 0.55, 0.12]], 0.03, 4); f.box(C.BLACK, x + Math.cos(a) * 0.55 - 0.05, x + Math.cos(a) * 0.55 + 0.05, y + Math.sin(a) * 0.55 - 0.05, y + Math.sin(a) * 0.55 + 0.05, 0, 0.1); }
    f.cyl(C.BRASS, x, y, 0.2, h - 0.12, 0.05, 0.05, 8);
    f.cyl(C.WALNUT, x, y, h - 0.14, h - 0.06, 0.48, 0.5, 12); ves(f, seat, x, y, h - 0.06, [[0, 0], [0.47, 0], [0.5, 0.05], [0.48, 0.12], [0.3, 0.15], [0, 0.155]], 12);
    f.block(x - 0.5, x + 0.5, y - 0.5, y + 0.5, 0, 1.5);
  }

  // ---- a hammered copper foot basin on a walnut ring, with water and a few petals ----------------------------------
  function basin(f, x, y, o = {}) {
    const r = 0.85, h = 0.95;
    ves(f, C.WALNUT, x, y, 0, [[0, 0], [r * 0.9, 0], [r * 0.95, 0.08], [r * 0.82, 0.12], [r * 0.82, h * 0.55], [0, h * 0.55]], 12);
    ves(f, C.COPPER, x, y, h * 0.5, [[0, 0], [r * 0.7, 0], [r * 0.95, 0.2], [r, h * 0.5], [r * 0.96, h * 0.5], [r * 0.9, 0.22], [r * 0.6, 0.06], [0, 0.06]], 12);
    f.cyl('c#7fb6b4/0.04/0.2', x, y, h * 0.5 + 0.3, h * 0.5 + 0.32, r * 0.9, r * 0.9, 18);
    for (let i = 0; i < 7; i++) { const a = rnd() * TAU, rr = rnd() * r * 0.75; ball(f, pick(['c#f1ece2/0.6', 'c#e8d2a8/0.6', 'c#c8d8a0/0.6']), x + Math.cos(a) * rr, y + Math.sin(a) * rr, h * 0.5 + 0.31, 0.05, 6, 0.25, 1.4); }      // (petals: cream, and a few citrus leaves)
    f.block(x - r, x + r, y - r, y + r, 0, 1.5);
  }

  // ---- a lamp shade after Poul Henningsen's PH 2/1 (three nested glowing shells), glowing only --------------------
  function phShade(f, x, y, z, s = 1, mat = C.GLOWS) {
    const shells = [[0.5, 0.0, 0.16], [0.36, 0.17, 0.12], [0.22, 0.31, 0.09]];
    for (const [r, dz, d] of shells) ves(f, 'c#efe6d6/0.5', x, y, z + dz * s, [[r * s * 0.35, d * s], [r * s * 0.7, d * s * 0.6], [r * s, 0], [r * s * 0.96, -0.012], [r * s * 0.66, d * s * 0.56], [r * s * 0.32, d * s * 0.98]], 12);
    ball(f, mat, x, y, z + 0.04 * s, 0.1 * s, 10);
  }

  // ---- plants: a fiddle-leaf fig or a monstera in a slate pot ---------------------------------------------------
  function leaves(f, x, y, z, o = {}) {
    const n = o.n ?? 12, len = o.len ?? 0.5, w = o.w ?? 0.06, col = o.col ?? C.LEAF, sp = o.spread ?? 0.06;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rnd() * 0.8, L = len * (0.65 + rnd() * 0.55), up = (o.up ?? 0.85) * (0.75 + rnd() * 0.4), out = (o.out ?? 0.55) * (0.6 + rnd() * 0.7), droop = o.droop ?? 0.5;
      const bx = x + Math.cos(a) * sp * rnd(), by = y + Math.sin(a) * sp * rnd(), pts = [];
      for (let k = 0; k <= 4; k++) { const t = k / 4; pts.push([bx + Math.cos(a) * out * L * t, by + Math.sin(a) * out * L * t, z + L * (up * t - droop * out * t * t)]); }
      put(f, pick(col), sweep(pts, t => w * Math.pow(Math.sin(Math.PI * Math.min(0.97, 0.06 + t * 0.94)), 0.75) + 0.003, { seg: 3 }));
    }
  }
  // a tall plant: a slate cylinder pot, a few stems, big leaves up them
  function tallPlant(f, x, y, o = {}) {
    const r = o.r ?? 0.6, ph = o.pot ?? 1.3, H = o.h ?? 5.2;
    ves(f, C.SLATE, x, y, 0, [[0, 0], [r * 0.9, 0], [r, 0.08], [r, ph], [r * 0.92, ph], [r * 0.92, ph - 0.1], [0, ph - 0.1]], 16);
    for (let s = 0; s < 3; s++) {
      const a = s * 2.1 + rnd(), lean = 0.12 + rnd() * 0.15, top = H * (0.75 + rnd() * 0.25), pts = [[x, y, ph - 0.1], [x + Math.cos(a) * lean * top * 0.3, y + Math.sin(a) * lean * top * 0.3, ph + top * 0.5], [x + Math.cos(a) * lean * top * 0.5, y + Math.sin(a) * lean * top * 0.5, ph + top]];
      tube(f, 'c#5a4a32/0.8', pts, 0.03, 5);
      for (let k = 0; k < 5; k++) { const t = 0.35 + k / 5 * 0.65, p = [pts[0][0] + (pts[2][0] - pts[0][0]) * t, pts[0][1] + (pts[2][1] - pts[0][1]) * t, ph + top * t]; leaves(f, p[0], p[1], p[2], { n: 2, len: 0.6, w: 0.12, up: 0.45, out: 0.8, droop: 0.45 }); }
    }
    f.block(x - r, x + r, y - r, y + r, 0, 1.5 + 0.1);
  }
  // a fern in a low bowl, for a shelf or table
  function fern(f, x, y, z, s = 1) { ves(f, 'c#2e2a26/0.6', x, y, z, [[0, 0], [0.18 * s, 0], [0.26 * s, 0.2 * s], [0.25 * s, 0.24 * s], [0, 0.22 * s]], 14); leaves(f, x, y, z + 0.2 * s, { n: 10, len: 0.8 * s, w: 0.07 * s, up: 0.6, out: 0.9, droop: 0.9, spread: 0.08 }); }

  // ---- small things ---------------------------------------------------------------------------------------------
  // a bottle of polish (for tables and carts; the polish wall's are salon_fx.js's)
  function polish(f, x, y, z, col, cap = C.BLACK) { f.box(col, x - 0.05, x + 0.05, y - 0.04, y + 0.04, z, z + 0.13); f.cyl(cap, x, y, z + 0.13, z + 0.27, 0.025, 0.025, 6); }
  // a jar of tools: orange sticks, files, brushes
  function toolJar(f, x, y, z) {
    jar(f, x, y, z, 0.1, 0.32, null);
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU, dx = Math.cos(a) * 0.05, dy = Math.sin(a) * 0.05; tube(f, pick(['c#d9a86a/0.8', 'c#e8e2d4/0.8', C.BLACK, 'c#b0643a/0.5']), [[x + dx * 0.4, y + dy * 0.4, z + 0.02], [x + dx * 2.2, y + dy * 2.2, z + 0.55 + rnd() * 0.15]], 0.012, 3); }
  }
  // a folded towel (terry)
  const towel = (f, x, y, z, w = 0.8, d = 0.5, col = C.CREAM) => { f.bev(col, x - w / 2, x + w / 2, y - d / 2, y + d / 2, z, z + 0.15, 0.04); };
  // a UV gel lamp: a low arch with a violet glow inside
  function gelLamp(f, x, y, z) {
    put(f, 'c#f2eee8/0.3', softBox(-0.4, 0.4, -0.3, 0.3, 0, 0.32, 0.12, { k: 2, crown: 0.06 }), { at: [x, y, z] });
    f.box('e#9a6cff/1.8', x - 0.3, x + 0.3, y + 0.18, y + 0.305, z + 0.03, z + 0.2);
  }
  // the pair of flip-flops, toes toward +y
  function flipflops(f, x, y, z, col) { for (const s of [-1, 1]) { f.bev(col, x + s * 0.16 - 0.13, x + s * 0.16 + 0.13, y - 0.42, y + 0.42, z, z + 0.06, 0.025); tube(f, 'c#f4efe6/0.6', [[x + s * 0.16 - 0.1, y - 0.1, z + 0.07], [x + s * 0.16, y + 0.25, z + 0.12], [x + s * 0.16 + 0.1, y - 0.1, z + 0.07]], 0.015, 3); } }
  // toe separators: a little foam comb
  function separator(f, x, y, z, col) { f.box(col, x - 0.14, x + 0.14, y - 0.03, y + 0.03, z, z + 0.04); for (let i = 0; i < 4; i++) f.cyl(col, x - 0.105 + i * 0.07, y, z + 0.04, z + 0.1, 0.03, 0.025, 5); }
  // a nail-art sample wheel: a disc of tips round a hub, standing on a little foot
  function wheel(f, x, y, z, cols, r = 0.32) {
    f.box(C.WALNUT, x - 0.12, x + 0.12, y - 0.08, y + 0.08, z, z + 0.05); f.box(C.BRASS, x - 0.012, x + 0.012, y - 0.012, y + 0.012, z + 0.05, z + 0.2);
    const zc = z + 0.2 + r;
    hcyl(f, 'c#f4f1ea/0.4', 'y', x, y, zc, 0.024, r * 0.35, r * 0.35, 12);
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, g = new THREE.SphereGeometry(0.06, 5, 3); g.scale(0.7, 0.18, 1.25); g.rotateY(-a + Math.PI / 2); g.translate(Math.cos(a) * r * 0.72, 0, Math.sin(a) * r * 0.72); put(f, cols[i % cols.length], g, { at: [x, y, zc] }); }
  }
  // fruit for the tray
  function fruit(f, kind, x, y, z) {
    const r = { mandarin: 0.11, apple: 0.13, fig: 0.09, strawberry: 0.06 }[kind];
    const col = { mandarin: 'c#e0851f/0.6', apple: 'c#b8361f/0.45', fig: 'c#4a2240/0.5', strawberry: 'c#c0201c/0.4' }[kind];
    if (kind === 'strawberry') { ves(f, col, x, y, z, [[0, 0], [0.035, 0.01], [0.06, 0.06], [0.055, 0.1], [0, 0.11]], 8); f.cyl('c#3f5e34/0.7', x, y, z + 0.1, z + 0.12, 0.04, 0.02, 6); return; }
    ves(f, col, x, y, z, [[0, r * 0.12], [r * 0.6, 0], [r * 0.95, r * 0.45], [r, r * 0.95], [r * 0.9, r * 1.5], [r * 0.45, r * 1.82], [0, r * 1.7]], 8);
  }
  const macaron = (f, x, y, z, col) => { for (const [dz, c, rr] of [[0, col, 0.08], [0.045, 'c#f4ece0/0.7', 0.07], [0.06, col, 0.08]]) f.cyl(c, x, y, z + dz, z + dz + (c === col ? 0.045 : 0.018), rr, rr * 0.95, 10); };

  return { rnd, pick, put, ves, hcyl, ball, tube, cush, tilted, jar, plate, bowl, throne, juhl, techStool, basin, phShade, leaves, tallPlant, fern, polish, toolJar, towel, gelLamp, flipflops, separator, wheel, fruit, macaron };
}

// ---- what the visitor takes in the hand (f.help build: THREE => Object3D), in feet ------------------------------
const mat = (T, color, rough = 0.6) => new T.MeshStandardMaterial({ color, roughness: rough });
export const EAT = {
  macaron: col => T => { const g = new T.Group(); [[0, col, 0.08, 0.045], [0.045, 0xf4ece0, 0.07, 0.018], [0.063, col, 0.08, 0.045]].forEach(([y, c, r, h]) => { const m = new T.Mesh(new T.CylinderGeometry(r * 0.95, r, h, 14), mat(T, c, 0.7)); m.position.y = y + h / 2; g.add(m); }); return g; },
  mandarin: T => { const m = new T.Mesh(new T.SphereGeometry(0.11, 12, 9), mat(T, 0xe0851f, 0.6)); m.scale.y = 0.85; return m; },
  fig: T => { const pts = [[0, 0], [0.06, 0.01], [0.085, 0.06], [0.07, 0.12], [0.03, 0.16], [0, 0.17]].map(([r, y]) => new T.Vector2(r, y)); return new T.Mesh(new T.LatheGeometry(pts, 10), mat(T, 0x4a2240, 0.5)); },
  strawberry: T => { const pts = [[0, 0], [0.035, 0.01], [0.06, 0.06], [0.055, 0.1], [0, 0.11]].map(([r, y]) => new T.Vector2(r, y)); const m = new T.Mesh(new T.LatheGeometry(pts, 10), mat(T, 0xc0201c, 0.4)); m.rotation.x = Math.PI; return m; },
};
