// up_west: the pieces the Reading Loft, the West Suite and the Consulting Room are furnished with (up_west.js
// places them). Mid-century and a little Scandinavian, after notes/STYLE.md (picture 3: the walnut listening
// lounge): low walnut frames on tapered legs (Finn Juhl, Hans Wegner, Børge Mogensen), wool in deep green and
// ochre, cream linen, sheepskin, Poul Henningsen's layered shades, Noguchi's paper lanterns, concealed amber light.
// Every helper takes a kit frame first (x along, y depth with the front toward +y, z up) and adds through K.put,
// so plain `c#` colours share the room's vertex-coloured meshes and each textured family is one draw call.
import * as THREE from 'three';
import { lathe, sweep, merge, bev, softBox, sheet } from '../kit/geom.js';

const TAU = Math.PI * 2;
export const M = {
  WAL: 'walnut', WALD: 'walnut#5a3e2c', WALP: 'walnut#9a7656',                 // walnut, a darker and a paler tint (one family)
  HIN: 'hinoki',                                                                 // pale cypress: the tub, the bath's duckboard
  BRASS: 'c#b08d4a/0.35/1', BRONZE: 'c#5e4a34/0.4/1', BLACK: 'c#1b1815/0.45', IRON: 'c#221f1c/0.6/0.5', CHROME: 'c#c9cbcc/0.15/1',
  GREEN: 'wool#3f4d38', OCHRE: 'wool#a8762e', RUST: 'wool#8a4a2e', OAT: 'wool#cbbd9c', CHAR: 'wool#3a3633', SHEEP: 'wool#eee6d6',
  CREAM: 'linen#e8dfcb', LINEN: 'linen#d6c9ae', SAND: 'linen#b9a27c',
  LEATHER: 'leather#6e4426', LEATHERD: 'leather#3e2618',
  GLOW: 'e#ffa850/1.25', GLOWS: 'e#ffbf78/0.9', PAPER: 'e#ffe0b0/0.85', EMBER: 'e#ff7a2a/1.6', DIAL: 'e#ffb35a/0.9',
  SHADE: 'c#e9e3d6/0.45', PORC: 'c#efe9dd/0.2', GLASS: 'glass', STONE: 'limestone_smooth#a49b8c', WATER: 'water',
};

export function parts(K) {
  const put = (f, mat, g, t) => K.put(f, mat, g, t);
  const ves = (f, mat, x, y, z, prof, seg = 12) => put(f, mat, lathe(prof, { seg }), { at: [x, y, z] });
  const tube = (f, mat, path, r, seg = 6, caps = false) => put(f, mat, sweep(path, r, { seg, caps }));
  function hcyl(f, mat, ax, x, y, z, len, r0, r1 = r0, seg = 10) {
    const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1); g.clearGroups();
    if (ax === 'x') g.rotateZ(-Math.PI / 2); else if (ax === 'z') g.rotateX(Math.PI / 2);
    g.translate(x, y, z); put(f, mat, g);
  }
  function ball(f, mat, x, y, z, r, seg = 10, sz = 1) { const g = new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.6))); g.rotateX(Math.PI / 2); g.scale(1, 1, sz); g.translate(x, y, z + r * sz); put(f, mat, g); }
  // a leg from a (top) to b (foot), tapering
  const leg = (f, mat, a, b, r0 = 0.06, r1 = 0.035) => put(f, mat, sweep([a, b], t => r0 + (r1 - r0) * t, { seg: 6, caps: true }));
  // the last kit lamp made only glows (its halo after dark): each room has one lamp that casts
  const glowLast = (halo = 0.7) => { const l = K.lamps[K.lamps.length - 1]; l.kind = 'glow'; l.halo = halo; };
  const glowAt = (f, x, y, z, halo = 0.7) => { K.lampAt(f, x, y, z, 0.4); glowLast(halo); };
  // a hidden strip of amber light (a cove, under a shelf, behind a lip)
  const strip = (f, x0, x1, y0, y1, z0, z1) => f.box(M.GLOW, x0, x1, y0, y1, z0, z1);

  // ---- a lounge chair after Finn Juhl and Wegner: a walnut frame on splayed tapered legs, floating arms, a loose seat
  // and a tilted back cushion. w wide; front +y; seat about 1.35. o: { fabric, w, d, sit, label, low }
  function loungeChair(f, o = {}) {
    const w = o.w ?? 2.45, d = o.d ?? 2.6, hw = w / 2, fab = o.fabric ?? M.GREEN, sz = o.seat ?? 1.08, W = o.wood ?? M.WAL;
    for (const sx of [-1, 1]) {
      leg(f, W, [sx * (hw - 0.18), d - 0.35, sz + 0.62], [sx * (hw - 0.08), d - 0.15, 0], 0.065, 0.035);          // front legs run up into the arms
      leg(f, W, [sx * (hw - 0.18), 0.5, sz - 0.02], [sx * (hw - 0.1), 0.12, 0], 0.06, 0.035);
      f.bev(W, sx * (hw - 0.26), sx * (hw - 0.1), 0.35, d - 0.25, sz - 0.12, sz - 0.02, 0.02, { grain: 'y' });   // side rails
      // the arm: a flat paddle, wider at the front
      put(f, W, bev(sx * hw - 0.2, sx * hw + 0.02, 0.45, d - 0.12, sz + 0.62, sz + 0.7, 0.02, { grain: 'y' }));
      leg(f, W, [sx * (hw - 0.1), 0.5, sz + 0.62], [sx * (hw - 0.14), 0.32, sz - 0.04], 0.03, 0.03);
    }
    f.bev(W, -hw + 0.12, hw - 0.12, d - 0.32, d - 0.2, sz - 0.15, sz - 0.03, 0.015);
    f.bev(W, -hw + 0.12, hw - 0.12, 0.38, 0.5, sz - 0.15, sz - 0.03, 0.015);
    f.cushion(fab, -hw + 0.24, hw - 0.24, 0.4, d - 0.1, sz - 0.04, sz + 0.3, 0.1, { crown: 0.04, welt: 0.012, sag: [[0, 0.1, 0.04, 0.7]] });
    // the back: a cushion on two raked posts
    const rake = 0.36, bz = sz + 0.25, bh = o.low ? 1.35 : 1.75;
    for (const sx of [-1, 1]) leg(f, W, [sx * (hw - 0.32), 0.45, sz - 0.1], [sx * (hw - 0.36), 0.45 - Math.sin(rake) * (bh + 0.2), sz - 0.1 + Math.cos(rake) * (bh + 0.2)], 0.045, 0.03);
    put(f, fab, softBox(-hw + 0.3, hw - 0.3, 0, 0.32, 0, bh, 0.1, { crown: 0.03, bulge: 0.02, welt: 0.01 }), { rx: rake, at: [0, 0.42, bz] });
    f.block(-hw, hw, 0, d, 0, 2.0);
    if (o.sit !== false) K.seat(f, 0, 1.25, sz + 0.22, o.label ?? 'sit in the chair');
  }
  // ---- a low sofa to match (Juhl's Poet, Mogensen's 2209): w wide
  function sofa(f, w, o = {}) {
    const d = 2.7, hw = w / 2, fab = o.fabric ?? M.OCHRE, sz = 1.05, W = M.WAL;
    for (const sx of [-1, 1]) for (const [y0, y1] of [[d - 0.3, d - 0.12], [0.35, 0.12]]) leg(f, W, [sx * (hw - 0.25), y0, sz - 0.05], [sx * (hw - 0.15), y1, 0], 0.065, 0.035);
    f.bev(W, -hw + 0.1, hw - 0.1, 0.2, d - 0.1, sz - 0.2, sz - 0.05, 0.02, { grain: 'x' });
    for (const sx of [-1, 1]) { f.cushion(fab, sx * hw - (sx > 0 ? 0.32 : -0.0), sx * hw + (sx > 0 ? 0 : 0.32), 0.2, d - 0.1, sz - 0.05, sz + 0.75, 0.1, { welt: 0.01 }); put(f, W, bev(sx * hw - 0.34 * (sx > 0 ? 1 : 0) + (sx < 0 ? -0.02 : 0), sx * hw + (sx < 0 ? 0.34 : 0.02), 0.25, d - 0.05, sz + 0.75, sz + 0.82, 0.02, { grain: 'y' })); }
    const n = Math.max(2, Math.round((w - 0.7) / 2.2)), cw = (w - 0.7) / n;
    for (let i = 0; i < n; i++) { const x0 = -hw + 0.35 + i * cw; f.cushion(fab, x0 + 0.02, x0 + cw - 0.02, 0.45, d - 0.12, sz - 0.05, sz + 0.32, 0.1, { crown: 0.04, welt: 0.012, sag: [[0, 0.1, 0.04, 0.7]] }); put(f, fab, softBox(x0 + 0.03, x0 + cw - 0.03, 0, 0.36, 0, 1.45, 0.1, { crown: 0.03, bulge: 0.02, welt: 0.01 }), { rx: 0.3, at: [0, 0.12, sz + 0.2] }); }
    f.bev(W, -hw + 0.2, hw - 0.2, 0.05, 0.2, sz - 0.05, sz + 1.55, 0.02, { grain: 'x' });
    for (const [x, c] of o.cushions ?? []) K.cushion(f, x, 0.75, sz + 0.3, 1.3, 1.2, c, { tilt: 0.35 });
    f.block(-hw, hw, 0, d, 0, 2.0);
    for (let i = 0; i < n; i++) K.seat(f, -hw + 0.35 + (i + 0.5) * cw, 1.3, sz + 0.25, 'sit on the sofa');
  }
  // ---- a side chair (Mogensen's J39, the people's chair): for waiting on
  function sideChair(f, o = {}) {
    const W = o.wood ?? M.WAL, sz = 1.48;
    for (const sx of [-1, 1]) { leg(f, W, [sx * 0.68, 1.35, sz], [sx * 0.72, 1.45, 0], 0.05, 0.04); leg(f, W, [sx * 0.66, 0.15, sz + 1.55], [sx * 0.72, 0.05, 0], 0.05, 0.04); }
    for (const sx of [-1, 1]) f.bev(W, sx * 0.7 - 0.03, sx * 0.7 + 0.03, 0.15, 1.4, 0.55, 0.62, 0.01);
    f.bev(W, -0.72, 0.72, 0.08, 1.48, sz - 0.07, sz, 0.02);
    if (o.seat) f.cushion(o.seat, -0.64, 0.64, 0.16, 1.4, sz, sz + 0.14, 0.05, { crown: 0.02, welt: 0.008 });      // a linen pad
    else { f.box('c#b89a62/0.85', -0.64, 0.64, 0.16, 1.4, sz, sz + 0.03);                // a rush (papercord) seat
      for (let i = 0; i < 9; i++) f.box('c#a88a52/0.9', -0.64, 0.64, 0.2 + i * 0.135, 0.25 + i * 0.135, sz + 0.03, sz + 0.045); }
    f.bev(W, -0.66, 0.66, 0.06, 0.16, sz + 1.12, sz + 1.5, 0.02, { grain: 'x' });
    for (let i = 0; i < 5; i++) { const x = -0.48 + i * 0.24; leg(f, W, [x, 0.1, sz + 1.14], [x, 0.16, sz + 0.05], 0.018, 0.018); }
    f.block(-0.75, 0.75, 0, 1.5, 0, 1.6);
    if (o.sit !== false) K.seat(f, 0, 0.8, sz, o.label ?? 'sit and wait');
  }

  // ---- the couch: a daybed after Mogensen's and the Knoll daybed: a walnut frame on tapered legs, a firm buttoned mattress.
  // len along x, the head at +x (or -x: o.head -1); w deep (y), front +y. Returns the mattress top.
  function daybed(f, len = 6.6, w = 2.6, o = {}) {
    const W = M.WAL, top = 1.0, mz = top + 0.42;
    for (const sx of [-1, 1]) for (const sy of [0, 1]) leg(f, W, [sx * (len / 2 - 0.35), sy ? w - 0.3 : 0.3, top - 0.12], [sx * (len / 2 - 0.25), sy ? w - 0.2 : 0.2, 0], 0.07, 0.04);
    f.bev(W, -len / 2, len / 2, 0.05, w - 0.05, top - 0.18, top, 0.025, { grain: 'x' });
    f.cushion(o.mattress ?? M.LEATHER, -len / 2 + 0.08, len / 2 - 0.08, 0.1, w - 0.1, top, mz, 0.12, { n: [6, 2, 1], crown: 0.03, welt: 0.014, sag: [[-0.2, 0, 0.03, 0.8]] });
    for (let i = 1; i < 6; i++) for (const v of [0.33, 0.66]) ball(f, M.LEATHERD, -len / 2 + i * len / 6, 0.1 + v * (w - 0.2), mz - 0.03, 0.025, 6);   // the buttons
    // a raised head: a wedge of leather at the head end (o.head: +1 at +x, -1 at -x)
    const hs = o.head ?? 1;
    put(f, o.mattress ?? M.LEATHER, softBox(-0.65, 0.65, 0.12, w - 0.12, -0.18, 0.18, 0.1, { crown: 0.02 }), { ry: -0.32 * hs, at: [hs * (len / 2 - 0.75), 0, mz + 0.05] });
    f.block(-len / 2, len / 2, 0, w, 0, 1.6);
    return mz;
  }
  // a bolster lying along y (across the bed) at (x, y, z)
  function bolster(f, mat, x, y, z, len, r) {
    const g = lathe([[0, -len / 2], [r * 0.8, -len / 2], [r, -len / 2 + 0.06], [r, len / 2 - 0.06], [r * 0.8, len / 2], [0, len / 2]], { seg: 14 });
    put(f, mat, g, { rx: -Math.PI / 2, at: [x, y, z + r] });
    for (const s of [-1, 1]) ball(f, M.BRASS, x, y + s * (len / 2 + 0.005), z + r - 0.03, 0.03, 6);
  }
  // ---- a low oval table (Juhl's, picture 3): top a by b half-axes, h high, on four splayed legs
  function ovalTable(f, x, y, a, b, h = 1.45) {
    put(f, M.WAL, lathe([[0, h - 0.09], [0.96, h - 0.09], [1, h - 0.06], [1, h - 0.02], [0.97, h], [0, h]], { seg: 32, sx: a, sy: b }), { at: [x, y, 0] });
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) leg(f, M.WAL, [x + sx * a * 0.5, y + sy * b * 0.45, h - 0.09], [x + sx * a * 0.62, y + sy * b * 0.62, 0], 0.06, 0.035);
    f.block(x - a * 0.8, x + a * 0.8, y - b * 0.8, y + b * 0.8, 0, h);
    return h;
  }
  // ---- Poul Henningsen's PH 5, hanging: three dished shades on a cord, the bulb hidden; ceiling zc above the frame
  function phPendant(f, x, y, zc, drop, o = {}) {
    const z = zc - drop, col = o.col ?? 'c#d9d2c2/0.4', inner = 'e#ffcf8a/0.55';
    tube(f, M.BLACK, [[x, y, zc - 0.02], [x, y, z + 0.6]], 0.012, 4);
    f.cyl(M.BLACK, x, y, zc - 0.08, zc, 0.18, 0.18, 10);
    for (const [r, dz, d] of [[0.82, 0.0, 0.32], [0.55, 0.3, 0.22], [0.34, 0.5, 0.14]]) {
      ves(f, col, x, y, z + dz, [[r, 0], [r * 0.82, d * 0.6], [r * 0.5, d], [r * 0.48, d + 0.01], [r * 0.8, d * 0.6 + 0.01], [r - 0.01, 0.01]], 24);
      ves(f, inner, x, y, z + dz - 0.005, [[r * 0.98, 0.0], [r * 0.5, d * 0.95], [r * 0.48, d * 0.96], [r * 0.96, 0.0]], 20);
    }
    ves(f, 'c#a8823a/0.4/1', x, y, z - 0.18, [[0, 0], [0.2, 0.02], [0.24, 0.12], [0, 0.16]], 14);     // the copper bowl under the bulb
    glowAt(f, x, y, z + 0.05, 1.0);
  }
  // ---- a floor lamp with a PH shade on a slim stem: returns the shade's height. lit: the room's one lamp that casts
  function phFloorLamp(f, x, y, o = {}) {
    const h = o.h ?? 4.4;
    ves(f, M.BLACK, x, y, 0, [[0, 0], [0.42, 0], [0.42, 0.06], [0.1, 0.1], [0, 0.1]], 18);
    tube(f, M.BRASS, [[x, y, 0.08], [x, y, h - 0.4], [x + 0.12, y + 0.2, h]], 0.018, 5);
    const s = f.sub(x + 0.12, y + 0.2, h - 0.15);
    for (const [r, dz, d] of [[0.62, 0.0, 0.26], [0.42, 0.22, 0.17], [0.26, 0.38, 0.1]]) {
      ves(s, 'c#2e3a33/0.4', 0, 0, dz, [[r, 0], [r * 0.82, d * 0.6], [r * 0.5, d], [r * 0.48, d + 0.01], [r * 0.8, d * 0.6 + 0.01], [r - 0.01, 0.01]], 22);
      ves(s, 'c#e8dccb/0.5', 0, 0, dz - 0.006, [[r * 0.98, 0], [r * 0.5, d * 0.95], [r * 0.48, d * 0.96], [r * 0.96, 0]], 18);
    }
    ball(s, 'e#ffd59a/1.1', 0, 0, -0.08, 0.08, 8);
    f.block(x - 0.45, x + 0.45, y - 0.45, y + 0.45, 0, 1.6);
    if (o.lit) K.lampAt(s, 0, 0, -0.1, o.power ?? 0.9); else glowAt(s, 0, 0, -0.1, 0.9);
    return h;
  }
  // ---- a paper lantern after Noguchi's Akari: a ribbed glowing paper body on thin legs, z its foot
  function paperLamp(f, x, y, z, h = 1.4, r = 0.45, o = {}) {
    const n = 8, prof = [];
    for (let i = 0; i <= n; i++) { const t = i / n, rr = r * (o.shape === 'cyl' ? 1 : 0.55 + 0.45 * Math.sin(Math.PI * (0.12 + 0.76 * t))); prof.push([rr, 0.2 + t * h]); }
    ves(f, M.PAPER, x, y, z, [[0, 0.2], ...prof, [0, 0.2 + h]], 16);
    for (let i = 1; i < n; i++) f.cyl('c#cfc2a8/0.9', x, y, z + 0.2 + (i / n) * h, z + 0.21 + (i / n) * h, prof[i][0] + 0.006, prof[i][0] + 0.006, 16);
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU; tube(f, M.IRON, [[x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, z + 0.25], [x + Math.cos(a) * r * 0.65, y + Math.sin(a) * r * 0.65, z]], 0.01, 3); }
    glowAt(f, x, y, z + 0.2 + h / 2, o.halo ?? 0.9);
  }
  // ---- the tiered lamp of the Villa Vals bedroom (research/photos/11.jpg): white shades stacked up a stem
  function tieredLamp(f, x, y, n = 6) {
    ves(f, M.BLACK, x, y, 0, [[0, 0], [0.3, 0], [0.3, 0.05], [0, 0.06]], 14);
    for (let i = 0; i < n; i++) { const z = 0.05 + i * 0.62, r0 = 0.42 - i * 0.025, r1 = 0.3 - i * 0.02; ves(f, M.PAPER, x, y, z, [[0, 0], [r0, 0], [r1, 0.6], [0, 0.6]], 16); }
    ves(f, M.PAPER, x, y, 0.05 + n * 0.62, [[0, 0], [0.38, 0], [0.26, 0.55], [0, 0.55]], 16);
    f.block(x - 0.45, x + 0.45, y - 0.45, y + 0.45, 0, 1.6);
  }
  // ---- a slatted screen along x (x0..x1), standing on y = 0..t, h high: vertical slats between a top and bottom rail
  function slatScreen(f, x0, x1, h, o = {}) {
    const t = o.t ?? 0.16, sw = o.slat ?? 0.14, gap = o.gap ?? 0.1, W = o.wood ?? M.WAL, list = [];
    for (let x = x0 + 0.02; x + sw <= x1 - 0.01; x += sw + gap) list.push(bev(x, x + sw, 0.01, t - 0.01, o.z0 ?? 0.06, h - 0.02, 0.012, { grain: 'z' }));
    put(f, W, merge(list));
    if (o.rails !== false) { f.bev(W, x0, x1, -0.02, t + 0.02, 0, 0.12, 0.01, { grain: 'x' }); f.bev(W, x0, x1, -0.02, t + 0.02, h - 0.1, h, 0.01, { grain: 'x' }); }
    f.block(x0, x1, 0, t, 0, h);
  }
  // ---- a sheepskin lying over a seat (x0..x1, y0..y1 at height z): a lumpy pale pelt with a ragged edge
  function sheepskin(f, x0, x1, y0, y1, z, o = {}) {
    const ph = (x0 * 3.1 + y1 * 1.7) % 6;
    const g = sheet((u, v) => {
      const a = u * TAU, rx = (x1 - x0) / 2, ry = (y1 - y0) / 2, e = 1 + 0.07 * Math.sin(a * 5 + ph) + 0.05 * Math.sin(a * 9 + ph * 2);
      const R = v * e, x = (x0 + x1) / 2 + Math.cos(a) * rx * R, y = (y0 + y1) / 2 + Math.sin(a) * ry * R;
      return [x, y, z + 0.06 * (1 - v * v) + 0.025 * Math.sin(u * 40 + v * 9) * v + (o.drop && v > 0.82 ? -(v - 0.82) * o.drop * 5 * Math.max(0, Math.sin(a + (o.dropA ?? 0))) : 0)];
    }, 36, 6, { thick: 0.05 });
    put(f, o.mat ?? M.SHEEP, g);
  }

  // ---- LP spines on a shelf (x0..x1 along x, spines at y = front, z the shelf): about 0.03 ft each, in colours
  const SPINE = ['c#1c1b1a/0.6', 'c#e6dfd0/0.7', 'c#7a2c22/0.6', 'c#2b4a5a/0.6', 'c#c9a043/0.6', 'c#3a4a32/0.6', 'c#d8cfbd/0.7', 'c#5a3a5a/0.6', 'c#b85a2a/0.6', 'c#262a33/0.6'];
  function records(f, x0, x1, front, z, rnd, o = {}) {
    const by = new Map();
    let x = x0; const H = o.h ?? 1.03;
    while (x < x1 - 0.03) {
      if (rnd() < 0.06) { x += 0.08 + rnd() * 0.25; continue; }
      const t = 0.022 + rnd() * 0.02, lean = x > x1 - 0.5 && rnd() < 0.3 ? 0.12 : 0, c = SPINE[Math.floor(rnd() * SPINE.length)];
      if (!by.has(c)) by.set(c, []);
      by.get(c).push(new THREE.BoxGeometry(t, 1.02, H - rnd() * 0.02).translate(x + t / 2, front - 0.53, z + H / 2).toNonIndexed()); by.get(c)[by.get(c).length - 1].clearGroups();
      void lean; x += t + 0.004;
    }
    for (const [c, list] of by) put(f, c, merge(list));
  }
  // ---- a studio monitor (picture 3's big pale-blue baffles): w by h, standing at (x, y) on z, d deep
  function speaker(f, x, y, z, w = 1.9, h = 2.6, d = 1.2) {
    f.bev(M.WAL, x - w / 2, x + w / 2, y, y + d - 0.05, z, z + h, 0.03);
    f.box('c#6f8f9c/0.75', x - w / 2 + 0.08, x + w / 2 - 0.08, y + d - 0.06, y + d - 0.02, z + 0.08, z + h - 0.08);
    const drv = (cx, cz, r) => { put(f, M.BLACK, lathe([[r, 0], [r, 0.02], [r * 0.85, 0.03], [r * 0.25, -0.06], [r * 0.2, 0.0], [0, 0.0]], { seg: 20 }), { rx: -Math.PI / 2, at: [cx, y + d - 0.02, cz] }); put(f, 'c#8f9496/0.3/1', lathe([[r + 0.03, 0], [r + 0.03, 0.015], [r, 0.02], [r, 0]], { seg: 20 }), { rx: -Math.PI / 2, at: [cx, y + d - 0.02, cz] }); };
    drv(x - w * 0.18, z + h * 0.32, w * 0.27); drv(x + w * 0.2, z + h * 0.3, w * 0.2); drv(x + w * 0.24, z + h * 0.72, w * 0.1); drv(x - w * 0.22, z + h * 0.76, 0.07);
    for (const sx of [-1, 1]) put(f, M.BLACK, lathe([[0.06, 0], [0.06, 0.02], [0, 0.02]], { seg: 10 }), { rx: -Math.PI / 2, at: [x + sx * w * 0.34, y + d - 0.02, z + h * 0.55] });
  }
  // ---- a turntable on a plinth (not the site's one record player: still, a Thorens in walnut)
  function turntable(f, x, y, z) {
    f.bev(M.WAL, x - 0.85, x + 0.85, y - 0.62, y + 0.62, z, z + 0.3, 0.02);
    f.box('c#2a2723/0.5', x - 0.8, x + 0.8, y - 0.57, y + 0.57, z + 0.3, z + 0.32);
    f.cyl('c#b9bcbe/0.2/1', x - 0.2, y, z + 0.32, z + 0.4, 0.5, 0.5, 28); f.cyl('c#121110/0.35', x - 0.2, y, z + 0.4, z + 0.42, 0.49, 0.49, 28);
    f.cyl('c#b8562a/0.6', x - 0.2, y, z + 0.42, z + 0.425, 0.15, 0.15, 16);
    f.cyl(M.CHROME, x + 0.55, y + 0.35, z + 0.32, z + 0.5, 0.06, 0.06, 10);
    tube(f, M.CHROME, [[x + 0.55, y + 0.35, z + 0.5], [x + 0.35, y - 0.05, z + 0.48], [x + 0.05, y - 0.25, z + 0.46]], 0.012, 5);
    f.box(M.BLACK, x - 0.02, x + 0.1, y - 0.3, y - 0.2, z + 0.43, z + 0.47);
    // the lid stands open behind it
    put(f, 'c#9aa6a8/0.05', bev(x - 0.84, x + 0.84, -0.01, 0.01, 0, 1.2, 0.005), { rx: 0.25, at: [0, y - 0.6, z + 0.32] });
  }
  // ---- an amplifier and a tuner: a black and brushed front, its dials lit
  function amp(f, x, y, z, w = 1.4, h = 0.42, d = 1.0) {
    f.box('c#222020/0.4', x - w / 2, x + w / 2, y, y + d - 0.03, z, z + h);
    f.box('c#b7b7b0/0.25/1', x - w / 2, x + w / 2, y + d - 0.03, y + d, z + 0.02, z + h - 0.02);
    f.box(M.DIAL, x - w * 0.42, x + w * 0.05, y + d + 0.004, y + d + 0.01, z + h * 0.45, z + h * 0.8);
    for (const dx of [0.18, 0.36]) put(f, M.BLACK, lathe([[0.05, 0], [0.05, 0.05], [0, 0.06]], { seg: 10 }), { rx: -Math.PI / 2, at: [x + w * dx, y + d, z + h * 0.42] });
    f.bev(M.WAL, x - w / 2 - 0.05, x - w / 2 + 0.01, y - 0.01, y + d + 0.012, z, z + h, 0.01); f.bev(M.WAL, x + w / 2 - 0.01, x + w / 2 + 0.05, y - 0.01, y + d + 0.012, z, z + h, 0.01);
  }
  // ---- a carafe and a tumbler on a little tray
  function carafe(f, x, y, z) {
    f.bev(M.WALP, x - 0.42, x + 0.42, y - 0.22, y + 0.22, z + 0.004, z + 0.04, 0.01);
    ves(f, M.GLASS, x - 0.15, y, z + 0.046, [[0, 0], [0.16, 0], [0.17, 0.25], [0.07, 0.48], [0.05, 0.62], [0.06, 0.66], [0, 0.66]], 14);
    ves(f, 'c#cfe0e2/0.05', x - 0.15, y, z + 0.05, [[0, 0], [0.15, 0], [0.155, 0.22], [0, 0.22]], 12);
    ves(f, M.GLASS, x + 0.2, y, z + 0.046, [[0, 0], [0.09, 0], [0.1, 0.3], [0.095, 0.3], [0.085, 0.02], [0, 0.02]], 12);
  }
  // ---- a brass carriage clock facing +y (its face toward whoever is meant to read it)
  function clock(f, x, y, z) {
    f.box(M.BRASS, x - 0.17, x + 0.17, y - 0.11, y + 0.11, z, z + 0.04);
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) f.box(M.BRASS, x + sx * 0.15 - 0.015, x + sx * 0.15 + 0.015, y + sy * 0.09 - 0.015, y + sy * 0.09 + 0.015, z + 0.04, z + 0.46);
    f.box(M.GLASS, x - 0.14, x + 0.14, y - 0.08, y + 0.08, z + 0.045, z + 0.435);
    f.box(M.BRASS, x - 0.17, x + 0.17, y - 0.11, y + 0.11, z + 0.44, z + 0.5);
    tube(f, M.BRASS, [[x - 0.08, y, z + 0.5], [x - 0.06, y, z + 0.6], [x + 0.06, y, z + 0.6], [x + 0.08, y, z + 0.5]], 0.012, 4);
    put(f, 'c#f2ecdf/0.6', lathe([[0.1, 0], [0.1, 0.01], [0, 0.01]], { seg: 16 }), { rx: -Math.PI / 2, at: [x, y + 0.085, z + 0.27] });
    f.box(M.BLACK, x - 0.004, x + 0.004, y + 0.097, y + 0.1, z + 0.27, z + 0.35); f.box(M.BLACK, x, x + 0.06, y + 0.097, y + 0.1, z + 0.265, z + 0.275);
  }
  // ---- the analyst's small things on the antiquities shelf, modelled where no scan would do
  function ushabti(f, x, y, z, s = 1, col = 'c#3f8a86/0.35') {        // a faience shabti: mummiform, blue-green glaze
    ves(f, col, x, y, z, [[0, 0], [0.07 * s, 0], [0.065 * s, 0.05 * s], [0.08 * s, 0.25 * s], [0.07 * s, 0.4 * s], [0.06 * s, 0.45 * s], [0.07 * s, 0.52 * s], [0.06 * s, 0.6 * s], [0, 0.62 * s]], 8);
    for (const sx of [-1, 1]) f.box('c#1f2a2a/0.6', x + sx * 0.03 * s - 0.006, x + sx * 0.03 * s + 0.006, y + 0.055 * s, y + 0.062 * s, z + 0.3 * s, z + 0.4 * s);
  }
  function kylix(f, x, y, z, s = 1) {                                   // a red-figure cup on its foot, the black glaze and the red clay
    ves(f, 'c#1c1714/0.25', x, y, z, [[0, 0], [0.12 * s, 0], [0.12 * s, 0.015 * s], [0.03 * s, 0.03 * s], [0.03 * s, 0.12 * s], [0.3 * s, 0.17 * s], [0.34 * s, 0.22 * s], [0.32 * s, 0.22 * s], [0.03 * s, 0.15 * s], [0, 0.15 * s]], 20);
    f.cyl('c#b0582c/0.55', x, y, z + 0.18 * s, z + 0.2 * s, 0.31 * s, 0.33 * s, 20);
    for (const sx of [-1, 1]) tube(f, 'c#1c1714/0.25', [[x + sx * 0.3 * s, y, z + 0.2 * s], [x + sx * 0.42 * s, y, z + 0.22 * s], [x + sx * 0.33 * s, y, z + 0.18 * s]], 0.012 * s, 4);
  }
  function horse(f, x, y, z, s = 1) {                                   // a Tang tomb horse, sancai glaze, much simplified
    const C = 'c#b07a3a/0.4', G = 'c#4f6a3a/0.4';
    ball(f, C, x, y, z + 0.22 * s, 0.12 * s, 10, 0.75); put(f, C, softBox(-0.18 * s, 0.18 * s, -0.08 * s, 0.08 * s, 0, 0.16 * s, 0.07 * s), { at: [x, y, z + 0.2 * s] });
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) leg(f, C, [x + sx * 0.13 * s, y + sy * 0.05 * s, z + 0.24 * s], [x + sx * 0.15 * s, y + sy * 0.05 * s, z + 0.02 * s], 0.025 * s, 0.018 * s);
    leg(f, C, [x + 0.15 * s, y, z + 0.33 * s], [x + 0.25 * s, y, z + 0.5 * s], 0.05 * s, 0.035 * s); ball(f, C, x + 0.25 * s, y, z + 0.47 * s, 0.05 * s, 8, 1.4);
    f.box(G, x - 0.08 * s, x + 0.08 * s, y - 0.085 * s, y + 0.085 * s, z + 0.34 * s, z + 0.37 * s);
    f.box('c#5a3f2a/0.6', x - 0.22 * s, x + 0.22 * s, y - 0.1 * s, y + 0.1 * s, z, z + 0.03 * s);
  }

  // ---- a library ladder leaning on a brass rail: its feet `foot` out from the wall at x, its top at z
  function ladder(f, x, foot, z, railY) {
    for (const s of [-0.7, 0.7]) tube(f, M.WAL, [[x + s, foot, 0], [x + s, railY + 0.08, z]], 0.06, 6);
    for (let k = 1; k <= Math.floor(z / 0.95); k++) { const t = (k * 0.95) / z, y = foot + (railY + 0.08 - foot) * t; hcyl(f, M.WAL, 'x', x, y, k * 0.95, 1.4, 0.045); }
    for (const s of [-0.7, 0.7]) tube(f, M.BRASS, [[x + s, railY + 0.08, z], [x + s, railY, z + 0.12]], 0.025, 5);
    f.block(x - 0.8, x + 0.8, railY, foot, 0, 3);
  }

  // ---- a Scandinavian stove (after Morsø's and Jøtul's round stoves): black iron drum, a glass door glowing, a flue
  function stove(f, x, y, ceil) {
    // its window faces south (-y of a plan frame): the drum is turned on a lathe with the window's arc left open, a dark
    // firebox behind, logs and embers in it, a curved pane of glass over the opening (the flames: up_west.js, f.later)
    f.box('c#3a3836/0.7', x - 1.6, x + 1.6, y - 1.6, y + 1.6, 0, 0.12);     // a slate hearth
    for (let k = 0; k < 3; k++) { const a = k / 3 * TAU + 0.5; leg(f, M.IRON, [x + Math.cos(a) * 0.55, y + Math.sin(a) * 0.55, 0.62], [x + Math.cos(a) * 0.7, y + Math.sin(a) * 0.7, 0.12], 0.05, 0.04); }
    const L = (pts, seg, p0, pl) => { const g = new THREE.LatheGeometry(pts.map(([r, z]) => new THREE.Vector2(r, z)), seg, p0, pl); g.rotateX(Math.PI / 2); g.translate(x, y, 0); g.clearGroups(); return g; };
    const W0 = 0.78, Z0 = 1.05, Z1 = 2.25;                                // the window: +-0.62 rad about south, from z 1.05 to 2.0
    put(f, M.IRON, L([[0, 0.6], [0.82, 0.6], [0.86, 0.65], [0.86, Z0]], 24));
    put(f, M.IRON, L([[0.86, Z0], [0.86, Z1]], 24, W0, TAU - 2 * W0));
    put(f, M.IRON, L([[0.86, Z1], [0.86, 2.8], [0.8, 2.9], [0.3, 3.0], [0.25, 3.05], [0, 3.05]], 24));
    put(f, 'c#1a1410/0.95', L([[0.74, Z0], [0.74, Z1], [0, Z1]], 16, Math.PI / 2, Math.PI));      // the firebox's back
    put(f, 'c#1a1410/0.95', L([[0, Z0 + 0.01], [0.84, Z0 + 0.01]], 16));
    put(f, M.EMBER, L([[0, Z0 + 0.03], [0.5, Z0 + 0.03]], 12));             // the bed of embers
    for (const [dy, dz, rz] of [[0.05, 0.12, 0.15], [-0.15, 0.13, -0.2], [0.1, 0.3, 0.05]]) { const g = new THREE.CylinderGeometry(0.09, 0.08, 0.95, 8).rotateZ(Math.PI / 2 + rz); g.translate(x, y + dy, Z0 + dz); g.clearGroups(); put(f, 'c#3a2416/0.9', g); }
    put(f, M.GLASS, L([[0.875, Z0], [0.875, Z1]], 8, -W0, 2 * W0));
    for (const sg of [-1, 1]) { const a = -Math.PI / 2 + sg * W0; f.box(M.IRON, x + Math.cos(a) * 0.87 - 0.03, x + Math.cos(a) * 0.87 + 0.03, y + Math.sin(a) * 0.87 - 0.03, y + Math.sin(a) * 0.87 + 0.03, Z0, Z1); }
    tube(f, M.BRASS, [[x + 0.55, y - 0.85, 1.7], [x + 0.7, y - 0.95, 1.6]], 0.02, 4);
    f.cyl(M.IRON, x, y, 3.05, ceil - 0.02, 0.24, 0.24, 14);
    f.block(x - 1.0, x + 1.0, y - 1.0, y + 1.0, 0, 3.1);
    return { x, y, z: Z0 + 0.06 };
  }
  // ---- an ofuro: a deep square tub of hinoki boards with a lid half on, water; the long side along x
  function ofuro(f, len = 4.4, w = 3.0, h = 2.0) {
    const t = 0.15, hl = len / 2;
    f.bev(M.HIN, -hl, hl, 0, t, 0, h, 0.02, { grain: 'x' }); f.bev(M.HIN, -hl, hl, w - t, w, 0, h, 0.02, { grain: 'x' });
    f.bev(M.HIN, -hl, -hl + t, t, w - t, 0, h, 0.02, { grain: 'y' }); f.bev(M.HIN, hl - t, hl, t, w - t, 0, h, 0.02, { grain: 'y' });
    f.box(M.HIN, -hl + t, hl - t, t, w - t, 0.05, 0.25);
    for (const z of [0.45, h - 0.35]) for (const [y0, y1] of [[-0.03, 0.0], [w, w + 0.03]]) f.box(M.BRONZE, -hl - 0.02, hl + 0.02, y0, y1, z, z + 0.1);   // the bronze bands
    f.box(M.WATER, -hl + t + 0.01, hl - t - 0.01, t + 0.01, w - t - 0.01, h - 0.42, h - 0.4);
    // the lid: two boards across one end, and a bench inside to sit on
    f.bev(M.HIN, hl - 1.3, hl - 0.02, -0.02, w + 0.02, h, h + 0.08, 0.01, { grain: 'y' });
    f.box(M.HIN, -hl + t + 0.02, -hl + 1.0, t + 0.02, w - t - 0.02, 0.25, 0.9);
    f.block(-hl, hl, 0, w, 0, h);
  }

  return { latheG: (prof, seg = 16) => lathe(prof, { seg }), bevG: bev, mergeG: merge, put, ves, tube, hcyl, ball, leg, glowLast, glowAt, strip, loungeChair, sofa, sideChair, daybed, bolster, ovalTable, phPendant, phFloorLamp, paperLamp, tieredLamp, slatScreen, sheepskin, records, speaker, turntable, amp, carafe, clock, ushabti, kylix, horse, ladder, stove, ofuro };
}

// ---- drawings, on a canvas (g, W, H) -------------------------------------------------------------------------
// A squiggle: one wandering line of ink on cream paper, taken for a walk and left off half-way (a pencilled start
// mark where the pen went down, the line thinning where the ink ran low). seed: which walk; done: how far it got.
export function squiggle(seed, done = 0.6) {
  return (g, W, H) => {
    let s = seed * 9301 + 49297; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    g.fillStyle = '#efe6d0'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1400; i++) { g.fillStyle = `rgba(120,96,60,${0.03 + r() * 0.04})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    // the walk: a heading that turns smoothly, curling now and then, kept off the edges
    const pts = []; let x = W * (0.3 + r() * 0.4), y = H * (0.35 + r() * 0.3), a = r() * TAU, da = 0;
    const N = 420;
    for (let i = 0; i < N; i++) {
      da += (r() - 0.5) * 0.09; da *= 0.97; if (r() < 0.012) da += (r() < 0.5 ? -1 : 1) * 0.16;
      const cx = W / 2 - x, cy = H / 2 - y, toC = Math.atan2(cy, cx), far = Math.hypot(cx / W, cy / H);
      if (far > 0.3) a += Math.sin(toC - a) * 0.06 * (far - 0.3) * 10;
      a += da; x += Math.cos(a) * W * 0.006; y += Math.sin(a) * W * 0.006; pts.push([x, y]);
    }
    const n = Math.floor(N * done);
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (let i = 1; i < n; i++) {
      const t = i / n, w = W * (0.0055 - 0.0028 * Math.max(0, t - 0.75) * 4) * (0.85 + 0.3 * Math.sin(i * 0.21));
      g.strokeStyle = `rgba(28,22,18,${0.92 - 0.35 * Math.max(0, t - 0.8) * 5})`; g.lineWidth = Math.max(0.6, w);
      g.beginPath(); g.moveTo(...pts[i - 1]); g.lineTo(...pts[i]); g.stroke();
    }
    // the rest of the walk, not drawn: only a faint pencil dot where it might have gone next
    const [ex, ey] = pts[Math.min(N - 1, n + 30)]; g.fillStyle = 'rgba(60,60,60,0.35)'; g.beginPath(); g.arc(ex, ey, W * 0.004, 0, TAU); g.fill();
    const [sx, sy] = pts[0]; g.strokeStyle = 'rgba(70,70,70,0.4)'; g.lineWidth = 1; g.beginPath(); g.moveTo(sx - W * 0.015, sy + W * 0.015); g.lineTo(sx + W * 0.015, sy - W * 0.015); g.stroke();
  };
}

// A Qashqai-style rug (the tribal rugs of south-west Iran that Freud covered his couch with): a madder field,
// three stepped lozenge medallions on a line, small animals and boteh scattered, a wide border of hooked motifs,
// guards, and (if `fringe`) the warp ends left white at both short ends. Drawn long along x.
export function qashqai(o = {}) {
  return (g, W, H) => {
    let s = o.seed ?? 77; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    const RED = o.red ?? '#7e2a20', NAVY = '#1f2a44', IV = '#e8dcc0', OCH = '#c08a32', GRN = '#3f5a3a', BRN = '#3a2418';
    const fr = o.fringe ? W * 0.035 : 0;
    g.fillStyle = IV; g.fillRect(0, 0, W, H);
    if (fr) { g.strokeStyle = '#efe6d2'; g.lineWidth = 2; for (let y = 2; y < H; y += 5) { g.beginPath(); g.moveTo(0, y); g.lineTo(fr, y + (r() - 0.5) * 3); g.moveTo(W, y); g.lineTo(W - fr, y + (r() - 0.5) * 3); g.stroke(); } }
    const X0 = fr, X1 = W - fr, w = X1 - X0;
    g.fillStyle = NAVY; g.fillRect(X0, 0, w, H);
    const b = H * 0.13; g.fillStyle = RED; g.fillRect(X0 + b, b, w - 2 * b, H - 2 * b);
    // the border's hooks
    g.fillStyle = OCH; for (let x = X0 + b * 0.5; x < X1 - b * 0.3; x += b * 0.7) { g.fillRect(x, b * 0.3, b * 0.25, b * 0.4); g.fillRect(x, H - b * 0.7, b * 0.25, b * 0.4); }
    for (let y = b * 0.5; y < H - b * 0.3; y += b * 0.7) { g.fillRect(X0 + b * 0.3, y, b * 0.4, b * 0.25); g.fillRect(X1 - b * 0.7, y, b * 0.4, b * 0.25); }
    g.strokeStyle = IV; g.lineWidth = Math.max(2, H * 0.012); g.strokeRect(X0 + b * 0.92, b * 0.92, w - 1.84 * b, H - 1.84 * b);
    // stepped lozenges
    const loz = (cx, cy, rx, ry, c) => { g.fillStyle = c; g.beginPath(); const st = 6; for (let i = 0; i <= st; i++) { const t = i / st; g.lineTo(cx + rx * t, cy - ry * (1 - t) - (i % 2) * ry * 0.06); } for (let i = 0; i <= st; i++) { const t = i / st; g.lineTo(cx + rx * (1 - t), cy + ry * t); } for (let i = 0; i <= st; i++) { const t = i / st; g.lineTo(cx - rx * t, cy + ry * (1 - t)); } for (let i = 0; i <= st; i++) { const t = i / st; g.lineTo(cx - rx * (1 - t), cy - ry * t); } g.closePath(); g.fill(); };
    const n = 3, iw = w - 2 * b, ih = H - 2 * b;
    for (let i = 0; i < n; i++) { const cx = X0 + b + iw * (i + 0.5) / n, cy = H / 2, rx = iw / n * 0.4, ry = ih * 0.42; loz(cx, cy, rx, ry, NAVY); loz(cx, cy, rx * 0.72, ry * 0.72, IV); loz(cx, cy, rx * 0.5, ry * 0.5, i % 2 ? GRN : OCH); loz(cx, cy, rx * 0.22, ry * 0.22, RED); }
    if (n > 1) { g.strokeStyle = NAVY; g.lineWidth = H * 0.02; g.beginPath(); g.moveTo(X0 + b + iw / (2 * n), H / 2); g.lineTo(X1 - b - iw / (2 * n), H / 2); g.stroke(); }
    // scattered small things: boteh, little animals (a stroke and four legs), stars
    for (let k = 0; k < 40; k++) {
      const x = X0 + b + r() * iw, y = b + r() * ih, c = [IV, OCH, NAVY, GRN, BRN][Math.floor(r() * 5)], sz = H * 0.025;
      g.fillStyle = c;
      if (k % 3 === 0) { g.fillRect(x - sz, y - sz * 0.4, sz * 2, sz * 0.8); for (let l = 0; l < 4; l++) g.fillRect(x - sz + l * sz * 0.6, y + sz * 0.4, sz * 0.2, sz * 0.6); g.fillRect(x + sz, y - sz, sz * 0.4, sz * 0.7); }
      else if (k % 3 === 1) { g.beginPath(); g.arc(x, y, sz * 0.6, 0, TAU); g.fill(); g.fillRect(x, y - sz * 1.1, sz * 0.25, sz * 0.6); }
      else { g.fillRect(x - sz * 0.6, y - sz * 0.15, sz * 1.2, sz * 0.3); g.fillRect(x - sz * 0.15, y - sz * 0.6, sz * 0.3, sz * 1.2); }
    }
    // wool: abrash (the colour drifting row to row) and grain
    for (let x = X0; x < X1; x += 3) { g.fillStyle = `rgba(0,0,0,${0.04 * (0.5 + 0.5 * Math.sin(x * 0.013))})`; g.fillRect(x, 0, 3, H); }
    const img = g.getImageData(0, 0, W, H), d = img.data; for (let i = 0; i < d.length; i += 4) { const nn = (r() - 0.5) * 22; d[i] += nn; d[i + 1] += nn; d[i + 2] += nn; } g.putImageData(img, 0, 0);
  };
}

// A page of a star atlas, open at Orion: the real stars (right ascension in hours, declination in degrees, magnitude),
// in a plain equatorial grid, after the plates of Flamsteed's Atlas Coelestis (1729), without the figure.
export const ORION = [['Betelgeuse', 5.92, 7.41, 0.5], ['Rigel', 5.24, -8.2, 0.1], ['Bellatrix', 5.42, 6.35, 1.6], ['Mintaka', 5.53, -0.3, 2.2], ['Alnilam', 5.6, -1.2, 1.7],
  ['Alnitak', 5.68, -1.94, 1.8], ['Saiph', 5.8, -9.67, 2.1], ['Meissa', 5.59, 9.93, 3.4], ['Hatysa', 5.59, -5.91, 2.8], ['Aldebaran', 4.6, 16.51, 0.9], ['Elnath', 5.44, 28.6, 1.7], ['Sirius', 6.75, -16.72, -1.5], ['Procyon', 7.65, 5.22, 0.4]];
export function atlasPage(D) {
  return (g, W, H) => {
    D.paper(g, W, H, '#ece2c8', 9);
    const L = W * 0.06, R = W * 0.94, T = H * 0.08, B = H * 0.92;
    const px = ra => L + (R - L) * (8.0 - ra) / 4.0, py = dec => T + (B - T) * (32 - dec) / 52;       // RA 8h..4h (east to the left), Dec +32..-20
    g.strokeStyle = 'rgba(80,60,40,0.45)'; g.lineWidth = 1;
    for (let ra = 4; ra <= 8; ra += 0.5) { g.beginPath(); g.moveTo(px(ra), T); g.lineTo(px(ra), B); g.stroke(); }
    for (let dec = -20; dec <= 30; dec += 10) { g.beginPath(); g.moveTo(L, py(dec)); g.lineTo(R, py(dec)); g.stroke(); }
    g.strokeStyle = 'rgba(80,60,40,0.8)'; g.lineWidth = 2; g.strokeRect(L, T, R - L, B - T);
    g.beginPath(); g.moveTo(W / 2, T); g.lineTo(W / 2, B); g.strokeStyle = 'rgba(60,40,20,0.25)'; g.lineWidth = W * 0.02; g.stroke();      // the gutter
    for (const [name, ra, dec, mag] of ORION) {
      const x = px(ra), y = py(dec), rr = W * 0.004 * (4.2 - mag);
      g.fillStyle = '#1e1a16'; g.beginPath(); g.arc(x, y, Math.max(2, rr), 0, TAU); g.fill();
      if (mag < 2) D.T(g, name, x + rr + W * 0.008, y - rr, H * 0.022, '#3a2a1c', { a: 'left', f: D.F.goudy, it: true });
    }
    D.T(g, 'ORION', W * 0.25, B - H * 0.04, H * 0.04, '#5a3a24', { f: D.F.goudy, ls: 6 });
    D.T(g, 'MONOCEROS', W * 0.75, B - H * 0.04, H * 0.03, '#5a3a24', { f: D.F.goudy, ls: 4 });
  };
}
