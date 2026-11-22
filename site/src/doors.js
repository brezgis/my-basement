// Door leaves: what a joiner makes. A leaf is framed (stiles, rails, muntins) and filled with raised and fielded
// panels in bolection mouldings, or with glass in glazing bars, or it is boarded (ledged and braced); it carries a
// knob on a rose with a keyhole plate, butt or strap hinges, a lock's edge, kick and push plates; and one leaf of a
// pair carries the astragal that covers where the two meet.
//
// Nothing here knows about any place. makeLeaf() returns geometry in the leaf's own frame and lists; whoever hangs
// the door (life.js) decides materials and draws them:
//
//   x   from the hinge (0) to the free edge (w)        y   up, from h0 to h1
//   z   across the leaf. The hinge pin is the line x = 0, z = 0, and it lies in the face on the side the leaf opens
//       toward (`swing`: +1 or -1, a sign along z), as a butt hinge's does: the leaf's thickness is all on the
//       other side of it, so an open leaf stands clear of its own jamb.
//
//   makeLeaf({ w, h0, h1, style, swing, pair, exterior, kick, push, metal, seed })
//     -> { wood,        one BufferGeometry (position, normal, uv in feet with the grain along v): one mesh, one material
//          panes,       [{ m: Matrix4, frost }]   glass, as placings of a unit cube: draw them all as ONE instanced mesh
//          fittings,    [{ kind: 'knob' | 'box' | 'pin', m: Matrix4, color }]   metal, likewise: one instanced mesh per kind
//          th }         the leaf's thickness
//   fittingGeometry(kind)   the unit shapes those are placings of.
//
// So a door costs one draw call (its wood); all the glass of all the doors is one more, and all their metal three.
//
// style: a name from STYLES, or an object like its entries (see there). pair: 0 or 1 for the leaves of a pair
// (1 carries the astragal). kick, push: plates. metal: 'brass' | 'bronze' | 'iron'.

import * as THREE from 'three';
import { lathe } from './kit/geom.js';

// rows are listed from the floor up: n panels side by side, f its share of the height; glass: [across, up] makes the
// row a light divided by glazing bars (frost: obscured glass); lock: the rail over this row is the lock rail.
// knob: the knob's height above the leaf's foot (otherwise the middle of the lock rail, or 3 ft).
// th: thickness. mould: 'bolection' (stands proud of the framing) | 'ovolo' (a plain stuck moulding).
// raise: how wide the bevel round a panel's field is (a wide one leaves a small field: the 'ten').
export const STYLES = {
  four: { rows: [{ n: 2, f: 0.36, lock: true }, { n: 2, f: 0.64 }] },                                                    // the common door of the 1880s
  five: { rows: [{ n: 2, f: 0.25 }, { n: 1, f: 0.14 }, { n: 2, f: 0.61 }], knob: 2.85 },                                  // two tall panels over a cross panel over two small
  six: { rows: [{ n: 2, f: 0.3, lock: true }, { n: 2, f: 0.46 }, { n: 2, f: 0.24 }] },
  three: { rows: [{ n: 1, f: 0.31, lock: true }, { n: 1, f: 0.42 }, { n: 1, f: 0.27 }], th: 0.19, raise: 0.13 },           // one leaf of a six-panel pair
  eight: { rows: [{ n: 2, f: 0.24 }, { n: 1, f: 0.16 }, { n: 1, f: 0.16 }, { n: 2, f: 0.22 }, { n: 2, f: 0.22 }], knob: 2.8 },
  ten: { rows: [0, 1, 2, 3, 4].map(() => ({ n: 2, f: 0.2 })), th: 0.19, raise: 0.14, rail: 0.34 },                         // a heavy outer door: two by five deep panels
  ladder: { rows: [0, 1, 2, 3, 4].map(() => ({ n: 1, f: 0.2 })), mould: 'ovolo' },                                         // five cross panels
  half: { rows: [{ n: 2, f: 0.3, lock: true }, { n: 1, f: 0.7, glass: [2, 3] }] },                                        // half-glazed: a schoolroom's or an office's
  frosted: { rows: [{ n: 2, f: 0.3, lock: true }, { n: 1, f: 0.7, glass: [2, 3], frost: true }] },
  light: { rows: [{ n: 2, f: 0.22 }, { n: 1, f: 0.78, glass: [2, 3] }] },                                                 // two small panels under a light of six panes (one great pane read as an open doorway)
  french: { rows: [{ n: 1, f: 0.17 }, { n: 1, f: 0.83, glass: [1, 2] }], stile: 0.3 },                                    // a glazed leaf: a panel at the foot, lights above
  glazed: { rows: [{ n: 1, f: 0.14 }, { n: 1, f: 0.86, glass: [2, 4] }], stile: 0.3 },                                    // (what `glassy` alone used to mean)
  ledged: { boards: true, th: 0.08, metal: 'iron' },                                                                      // ledged and braced, of matched boards
};
const METAL = { brass: 0xc09a50, bronze: 0x9a7a4c, iron: 0x2e3032 };

// ---- an accumulator of flat pieces ------------------------------------------------------------------------
class Pieces {
  constructor(seed = 0) { this.p = []; this.n = []; this.u = []; this.ou = (seed * 0.731) % 2.2; this.ov = (seed * 1.137) % 2.2; }
  // a triangle whose front looks along `face` (the winding is turned to suit); the grain (texture v) runs along axis `grain`
  tri(a, b, c, face, grain, ext) {
    let nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const l = Math.hypot(nx, ny, nz); if (l < 1e-9) return; nx /= l; ny /= l; nz /= l;
    if (nx * face[0] + ny * face[1] + nz * face[2] < 0) { [b, c] = [c, b]; nx = -nx; ny = -ny; nz = -nz; }
    const e = [0, 1, 2].map(k => Math.max(...ext.map(q => q[k])) - Math.min(...ext.map(q => q[k])));
    const va = e[grain] > 1e-6 ? grain : e.indexOf(Math.max(...e)), ua = [0, 1, 2].filter(k => k !== va).sort((p, q) => e[q] - e[p])[0];
    for (const q of [a, b, c]) { this.p.push(q[0], q[1], q[2]); this.n.push(nx, ny, nz); this.u.push(q[ua] + this.ou, q[va] + this.ov); }
  }
  quad(a, b, c, d, face, grain = 1) { const ext = [a, b, c, d]; this.tri(a, b, c, face, grain, ext); this.tri(a, c, d, face, grain, ext); }
  // a rectangle in the plane z = z, looking along z's sign `s`
  rect(x0, x1, y0, y1, z, s, grain = 1) { if (x1 - x0 < 1e-4 || y1 - y0 < 1e-4) return; this.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], [0, 0, s], grain); }
  // a box; `skip`: letters of the faces left out ('x' low x, 'X' high x, and so on)
  box(x0, x1, y0, y1, z0, z1, grain = 1, skip = '') {
    if (!skip.includes('z')) this.rect(x0, x1, y0, y1, z0, -1, grain); if (!skip.includes('Z')) this.rect(x0, x1, y0, y1, z1, 1, grain);
    if (!skip.includes('x')) this.quad([x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1], [-1, 0, 0], grain); if (!skip.includes('X')) this.quad([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], [1, 0, 0], grain);
    if (!skip.includes('y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], grain); if (!skip.includes('Y')) this.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], [0, 1, 0], grain);
  }
  // A moulding mitred round the rectangle x0..x1, y0..y1 on the face that looks along z's sign `s`, whose surface is
  // at |z| = zf. profile: [[out, proud], ...]: `out` from the rectangle's edge (negative: in over the opening),
  // `proud` above the face (negative: sunk). Successive points must differ in `out`.
  mould(x0, x1, y0, y1, zf, s, profile) {
    const at = (cx, cy, [o, d]) => [cx > 0 ? x1 + o : x0 - o, cy > 0 ? y1 + o : y0 - o, s * (zf + d)], C = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let k = 0; k < 4; k++) { const a = C[k], b = C[(k + 1) % 4]; for (let j = 0; j < profile.length - 1; j++) this.quad(at(...a, profile[j]), at(...b, profile[j]), at(...b, profile[j + 1]), at(...a, profile[j + 1]), [0, 0, s], k % 2 ? 1 : 0); }
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2));
    return g;
  }
}

// ---- the leaf ----------------------------------------------------------------------------------------------
export function makeLeaf(spec) {
  const style = typeof spec.style === 'object' && spec.style ? spec.style : STYLES[spec.style] ?? STYLES.four;
  const { w, h0, h1 } = spec, sw = spec.swing < 0 ? -1 : 1, th = style.th ?? (spec.exterior ? 0.17 : 0.15), z = th / 2;
  const P = new Pieces(spec.seed ?? w * 3 + h0), panes = [], fittings = [];
  const color = METAL[spec.metal ?? style.metal ?? (spec.exterior ? 'bronze' : 'brass')] ?? METAL.brass;
  const M = (sx, sy, sz, x, y, zz) => new THREE.Matrix4().makeScale(sx, sy, sz).setPosition(x, y, zz);
  const plate = (x0, x1, y0, y1, s, t = 0.015, c = color) => fittings.push({ kind: 'box', m: M(x1 - x0, y1 - y0, t, (x0 + x1) / 2, (y0 + y1) / 2, s * (z + t / 2)), color: c });
  const knobs = (x, y, k = 1) => { for (const s of [-1, 1]) { fittings.push({ kind: 'knob', m: new THREE.Matrix4().makeRotationY(s < 0 ? Math.PI : 0).scale(new THREE.Vector3(k, k, k)).setPosition(x, y, s * z), color }); plate(x - 0.026, x + 0.026, y - 0.42, y - 0.27, s); } };
  let st = 0;

  if (style.boards) {
    // Ledged and braced: boards (every second one set back a sixth of an inch, so the joints read),
    // three ledges and two braces on the back, the braces rising from the hinge side; strap hinges and a thumb latch.
    const n = Math.max(3, Math.round(w / 0.46)), bw = w / n, back = -sw;
    for (let i = 0; i < n; i++) { const e = i % 2 ? 0.014 : 0; P.box(i * bw, (i + 1) * bw, h0, h1, -z + e, z - e, 1, (i ? 'x' : '') + (i < n - 1 ? 'X' : '')); if (i) for (const s of [-1, 1]) P.quad([i * bw, h0, s * (z - 0.014)], [i * bw, h1, s * (z - 0.014)], [i * bw, h1, s * z], [i * bw, h0, s * z], [i % 2 ? 1 : -1, 0, 0], 1); }
    const lt = 0.07, zb0 = back > 0 ? z : -z - lt, zb1 = back > 0 ? z + lt : -z, ly = [h0 + 0.5, (h0 + h1) / 2 - 0.1, h1 - 0.95], lh = 0.45;
    for (const y of ly) P.box(0.12, w - 0.12, y, y + lh, zb0, zb1, 0, back > 0 ? 'z' : 'Z');
    for (let k = 0; k < 2; k++) {                                    // a brace: a parallelogram with plumb ends, from over one ledge at the hinge side up to under the next at the latch side
      const xa = 0.16, xb = w - 0.16, ya = ly[k] + lh, yb = ly[k + 1], d = 0.42, zo = back > 0 ? zb1 - 0.012 : zb0 + 0.012, zi = back > 0 ? zb0 : zb1;
      P.quad([xa, ya, zo], [xa + d, ya, zo], [xb, yb, zo], [xb - d, yb, zo], [0, 0, back], 0);
      P.quad([xa, ya, zi], [xb - d, yb, zi], [xb - d, yb, zo], [xa, ya, zo], [-1, 1, 0], 0); P.quad([xa + d, ya, zi], [xb, yb, zi], [xb, yb, zo], [xa + d, ya, zo], [1, -1, 0], 0);
    }
    for (const y of [ly[0] + lh / 2, ly[2] + lh / 2]) plate(0.02, Math.min(w - 0.3, 1.5), y - 0.05, y + 0.05, sw);      // straps, on the face the pins are on
    for (const s of [-1, 1]) { plate(w - 0.2, w - 0.13, h0 + 2.75, h0 + 3.2, s); fittings.push({ kind: 'box', m: M(0.035, 0.2, 0.07, w - 0.165, h0 + 3.0, s * (z + 0.05)), color }); }      // the latch's plate and its grip
  } else {
    st = style.stile ?? Math.min(0.42, Math.max(0.3, w * 0.135));
    const rows = style.rows, tr = style.top ?? st, br = style.bottom ?? Math.min(0.75, (h1 - h0) * 0.11), ir = style.rail ?? 0.36, lk = style.lock ?? 0.6, mu = style.muntin ?? Math.min(st, 0.34);
    const free = h1 - h0 - tr - br - rows.slice(0, -1).reduce((a, r) => a + (r.lock ? lk : ir), 0), tot = rows.reduce((a, r) => a + r.f, 0);
    const bol = style.mould !== 'ovolo', rec = Math.min(0.05, z - 0.02), raise = style.raise ?? 0.09;
    const prof = bol ? (spec.exterior || th > 0.17 ? [[-0.07, -rec], [-0.05, 0.02], [-0.012, 0.034], [0.03, 0]] : [[-0.06, -rec], [-0.035, 0.024], [0.026, 0]]) : [[-0.045, -rec], [0, 0]];
    const inn = -prof[0][0] - 0.012;                                // the panel starts this far in, under the moulding
    // the framing: both faces of every member, and the leaf's four edges
    for (const s of [-1, 1]) { P.rect(0, st, h0, h1, s * z, s, 1); P.rect(w - st, w, h0, h1, s * z, s, 1); }
    P.box(0, w, h0, h1, -z, z, 1, 'zZyY'); P.box(0, w, h0, h1, -z, z, 0, 'zZxX');
    const rail = (y0, y1) => { for (const s of [-1, 1]) P.rect(st, w - st, y0, y1, s * z, s, 0); };
    rail(h0, h0 + br);
    let y = h0 + br, lockY = h0 + (style.knob ?? 3);
    rows.forEach((r, i) => {
      const ph = free * r.f / tot, y1 = y + ph, n = r.n ?? 1, pw = (w - 2 * st - (n - 1) * mu) / n;
      for (let c = 0; c < n; c++) {
        const x0 = st + c * (pw + mu), x1 = x0 + pw;
        if (c) for (const s of [-1, 1]) P.rect(x0 - mu, x0, y, y1, s * z, s, 1);      // a muntin
        if (r.glass) {
          // a light: beads sloping in to the glass, glazing bars (the upright ones in lengths between the cross ones), and the pane
          const [cols, up] = r.glass, bwid = 0.05, bz = Math.min(0.045, z - 0.02), gw = (x1 - x0) / cols, gh = (y1 - y) / up;
          for (const s of [-1, 1]) P.mould(x0, x1, y, y1, z, s, [[-0.035, -(z - 0.012)], [0, 0]]);
          for (let q = 1; q < up; q++) P.box(x0 + 0.02, x1 - 0.02, y + q * gh - bwid / 2, y + q * gh + bwid / 2, -bz, bz, 0, 'xX');
          for (let q = 1; q < cols; q++) for (let k = 0; k < up; k++) P.box(x0 + q * gw - bwid / 2, x0 + q * gw + bwid / 2, y + k * gh + (k ? bwid / 2 : 0.02), y + (k + 1) * gh - (k < up - 1 ? bwid / 2 : 0.02), -bz, bz, 1, 'yY');
          panes.push({ m: M(x1 - x0 + 0.03, y1 - y + 0.03, 0.012, (x0 + x1) / 2, (y + y1) / 2, 0), frost: !!r.frost });
          // Glass that comes down low is guarded: a metal bar across the light at the height of a hand, on a stand-off at
          // each end, on both faces (as on the doors of libraries and shops). It keeps hands and trolleys off the glass, and it
          // is what tells a visitor that the clear opening in front of her is a door and shut: with nothing in it but
          // clear glass, a large light read as an open doorway.
          if (y < h0 + 2.8 && y1 > h0 + 3.8) { const gy = h0 + 3.45; for (const s of [-1, 1]) {
            fittings.push({ kind: 'box', m: M(x1 - x0 + 0.1, 0.06, 0.05, (x0 + x1) / 2, gy, s * (z + 0.1)), color });
            for (const xe of [x0 - 0.03, x1 + 0.03]) fittings.push({ kind: 'box', m: M(0.045, 0.045, 0.1, xe, gy, s * (z + 0.05)), color });
          } }
        } else for (const s of [-1, 1]) {
          // a raised and fielded panel in its moulding: the ground it stands on is sunk, the field comes up nearly to the framing
          P.mould(x0, x1, y, y1, z, s, prof);
          const a0 = x0 + inn, a1 = x1 - inn, b0 = y + inn, b1 = y1 - inn, m = Math.min(raise, (a1 - a0) * 0.3, (b1 - b0) * 0.3), zg = s * (z - rec), zt = s * (z - 0.014), gr = a1 - a0 > (b1 - b0) * 1.15 ? 0 : 1;
          P.rect(a0 + m, a1 - m, b0 + m, b1 - m, zt, s, gr);
          P.quad([a0, b0, zg], [a1, b0, zg], [a1 - m, b0 + m, zt], [a0 + m, b0 + m, zt], [0, 0, s], gr); P.quad([a0, b1, zg], [a1, b1, zg], [a1 - m, b1 - m, zt], [a0 + m, b1 - m, zt], [0, 0, s], gr);
          P.quad([a0, b0, zg], [a0, b1, zg], [a0 + m, b1 - m, zt], [a0 + m, b0 + m, zt], [0, 0, s], gr); P.quad([a1, b0, zg], [a1, b1, zg], [a1 - m, b1 - m, zt], [a1 - m, b0 + m, zt], [0, 0, s], gr);
        }
      }
      y = y1;
      if (i < rows.length - 1) { const rh = r.lock ? lk : ir; rail(y, y + rh); if (r.lock && !style.knob) lockY = y + rh / 2; y += rh; }
    });
    rail(y, h1);
    // the furniture: a knob on its rose and a keyhole plate under it, on both faces; the lock's edge; plates
    const big = spec.exterior || th > 0.17;
    knobs(w - st / 2, lockY, big ? 1.2 : 1);
    if (spec.pair === undefined) fittings.push({ kind: 'box', m: M(0.015, 0.55, Math.min(0.08, th - 0.05), w + 0.0075, lockY - 0.08, 0), color });
    if (spec.kick) for (const s of [-1, 1]) plate(st * 0.45, w - st * 0.45, h0 + 0.07, h0 + br - 0.08, s);
    if (spec.push) for (const s of [-1, 1]) plate(w - st / 2 - 0.085, w - st / 2 + 0.085, lockY + 0.42, lockY + 1.3, s);
    // The astragal, on one leaf of a pair: a beaded strip along its free edge, on the side the leaves open toward,
    // lapping over the other leaf's edge. It is what shuts out the light where the two meet (and it opens away from
    // the other leaf, so the two never foul).
    if (spec.pair === 1) { const a = [[w - 0.075, 0], [w - 0.05, 0.034], [w + 0.03, 0.034], [w + 0.05, 0.008], [w + 0.05, 0]];
      for (let j = 0; j < a.length - 1; j++) P.quad([a[j][0], h0, sw * (z + a[j][1])], [a[j][0], h1, sw * (z + a[j][1])], [a[j + 1][0], h1, sw * (z + a[j + 1][1])], [a[j + 1][0], h0, sw * (z + a[j + 1][1])], j === 3 ? [1, 0, 0] : [0, 0, sw], 1);
      P.quad([w - 0.05, h1, sw * z], [w + 0.03, h1, sw * z], [w + 0.03, h1, sw * (z + 0.034)], [w - 0.05, h1, sw * (z + 0.034)], [0, 1, 0], 1);
      P.quad([w, h0, sw * z], [w + 0.05, h0, sw * z], [w + 0.05, h1, sw * z], [w, h1, sw * z], [0, 0, -sw], 1); }      // (its back, which is what is seen in the joint from the other side)
  }
  // hinges: the knuckles of three butts (four on a tall or heavy leaf) on the pin's line
  const nh = h1 - h0 > 7.6 || th > 0.17 ? 4 : 3, pins = [];
  for (let i = 0; i < nh; i++) pins.push(h0 + 0.62 + (h1 - h0 - 1.24) * i / (nh - 1));
  // everything so far was made about the leaf's middle plane: move it so that the pin's line is x = 0, z = 0
  const shift = -sw * z, wood = P.geometry(); wood.translate(0, 0, shift);
  const T = new THREE.Matrix4().makeTranslation(0, 0, shift);
  for (const q of [...panes, ...fittings]) q.m.premultiply(T);
  for (const y of pins) fittings.push({ kind: 'pin', m: new THREE.Matrix4().makeScale(1, style.boards ? 0.5 : 1, 1).setPosition(0.004, y, sw * 0.022), color });
  return { wood, panes, fittings, th, stile: st };
}

// ---- the unit shapes the fittings are placings of ------------------------------------------------------------
// knob: a rose against the face (at z = 0), a neck and a knob, standing out along +z. box: a unit cube.
// pin: a butt hinge's knuckle with its two finials, upright, a third of a foot long.
export function fittingGeometry(kind) {
  if (kind === 'knob') { const g = lathe([[0.082, 0], [0.082, 0.014], [0.028, 0.028], [0.028, 0.085], [0.078, 0.128], [0, 0.185]], { seg: 8 }); return g.index ? g.toNonIndexed() : g; }
  if (kind === 'pin') { const g = lathe([[0, -0.195], [0.026, -0.165], [0.026, 0.165], [0, 0.195]], { seg: 5 }); g.rotateX(-Math.PI / 2); return g.index ? g.toNonIndexed() : g; }
  return new THREE.BoxGeometry(1, 1, 1).toNonIndexed();
}
export const triangles = g => (g.index ? g.index.count : g.attributes.position.count) / 3;
