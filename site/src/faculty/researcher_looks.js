// How the researchers look: the six makes, built from one profile each, and what each one wears and carries.
// faculty/researchers.js hires them and moves them; this file only makes geometry.
//
// Each make's trunk is described by a PROFILE: at a height y up the trunk, how wide and how deep it is, and how
// square its cross-section is (a superellipse: 2 is an ellipse, 6 a box with well rounded corners). The trunk is
// built from that profile, and so is everything that lies on it: the lanyard runs over the surface from behind the
// neck down to the name tag, the tag lies tilted to the chest, the scarf wraps it, the satchel strap crosses it.
// So nothing floats in front of the chest, and since all of it is one geometry with the trunk it moves with it.
//
// No head has a hard corner: the boxy make's head is a rounded box with a rounded screen, the others are domes and
// balls. The eyes are not part of the head (researchers.js draws them as instances, so that they can blink, glance
// and squint); FACES below says where they sit on each make's visor.
//
// A little personality, on top of make and colour (TOUCHES): glasses, a pencil behind the ear, an antenna of one
// kind or another (or none), a narrower or wider visor, a sticker, a patched panel, a cardigan, a mug always to
// hand. Subtle, a touch or two each; the roster (researcher_cohort.js) may say which.

import { paint, xform as T, merge, sph, cyl } from './models.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const TAU = Math.PI * 2;
export const DARK = '#4a4d52', VISOR = '#1b1517';
export const rng = seed => { let s = (Math.imul((seed | 0) + 0x9e3779b9, 0x85ebca6b) ^ 0x5bd1e995) >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

export function makeLooks(THREE) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const rod = (a, b, r0, r1 = r0, seg = 5) => { const A = V(...a), B = V(...b), d = B.clone().sub(A), L = d.length() || 1e-3, g = new THREE.CylinderGeometry(r1, r0, L, seg, 1); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); g.translate((A.x + B.x) / 2, (A.y + B.y) / 2, (A.z + B.z) / 2); return g; };
  const box = (w, h, d, p = [0, 0, 0], r = [0, 0, 0]) => T(new THREE.BoxGeometry(w, h, d), { p, r });
  const rbox = (w, h, d, rad, p = [0, 0, 0], r = [0, 0, 0], seg = 1) => T(new RoundedBoxGeometry(w, h, d, seg, Math.min(rad, w / 2 - 1e-3, h / 2 - 1e-3, d / 2 - 1e-3)), { p, r });
  let LO = 1;      // (a coarser body, for faculty/outdoors.js, whose walkers each have a fixed number of vertices to spend)
  const ell = (k, c, R) => { const e = (k - c) / R; return Math.sqrt(Math.max(0, 1 - e * e)); };

  // ---- THE MAKES ----
  //   th, thSit   the trunk's height standing and seated        neck, neckSit   a neck's length, if it has one
  //   w, front    half its width at the shoulder, and how far forward its chest is (for the hands)
  //   head        the middle of the head above the top of the trunk (and neck); hr: the head's top above its middle
  //   lift        how far the underside floats off the floor, standing; wheels: it stands on the floor on little wheels
  //   prof(y, th) [half width, half depth, squareness] of the trunk at height y; deco(y, th): extra for a rim there
  //   collar      the height (a fraction of th, or th less a number) where the lanyard goes round behind the neck
  const MAKES = {
    // the round one: short, an egg of a trunk and a ball of a head
    round: { th: 1.24, w: 0.4, front: 0.31, head: 0.26, hr: 0.5, lift: 1.25, weight: 2, collar: th => th * 0.9,
      prof: (y, th) => { const k = ell(y, th / 2, th / 2); return [0.4 * k, 0.33 * k, 2]; },
      trunk(B, C, th) { B(shell(this, th, ellRows(th / 2, th / 2, 10), 16), p => (p.y < 0.2 ? DARK : C)); } },
    // the tall one: a slim column in three sections, which slide into one another when it sits
    tall: { th: 2.9, thSit: 1.3, w: 0.27, front: 0.25, head: 0.3, hr: 0.32, lift: 1.3, weight: 1, collar: th => th - 0.07,
      prof: (y, th) => { const h = th / 3, i = Math.max(0, Math.min(2, Math.floor(y / h))), r = 0.25 - i * 0.022; return [r, r, 2]; },
      deco: (y, th) => { const h = th / 3; for (let i = 0; i < 3; i++) if (Math.abs(y - (h * (i + 1) - 0.03)) < 0.04) return 0.022; return 0; },
      trunk(B, C, th) { const n = 3, h = th / n; for (let i = 0; i < n; i++) { const r = 0.25 - i * 0.022; B(T(cyl(r, r, h + 0.02, 16), { p: [0, h * (i + 0.5), 0] }), i ? C : p => (p.y < 0.22 ? DARK : C)); B(T(cyl(r + 0.02, r + 0.02, 0.05, 16), { p: [0, h * (i + 1) - 0.03, 0] }), DARK); } B(T(sph(0.2, 12, 5), { s: [1, 0.5, 1], p: [0, th, 0] }), C); } },
    // the boxy one: a case with well rounded corners for a trunk, and for a head a rounded screen
    box: { th: 0.95, w: 0.38, front: 0.26, head: 0.36, hr: 0.25, lift: 2.1, weight: 1.5, collar: th => th - 0.05,
      prof: (y, th) => { const rr = 0.08, d = Math.max(0, rr - y, y - (th - rr)), inset = rr - Math.sqrt(Math.max(0, rr * rr - d * d)); return [0.38 - inset, 0.25 - inset, 6]; },
      trunk(B, C, th) { const rows = [0]; for (let i = 0; i <= 4; i++) rows.push(0.08 - 0.08 * Math.cos(i / 4 * Math.PI / 2)); rows.push(th * 0.3, th * 0.6); for (let i = 4; i >= 0; i--) rows.push(th - 0.08 + 0.08 * Math.cos(i / 4 * Math.PI / 2)); rows.push(th);
        B(shell(this, th, rows, 24, true), p => (p.y < 0.16 ? DARK : C)); B(rbox(0.22, 0.1, 0.3, 0.04, [0, th + 0.035, 0]), DARK); for (const sx of [-1, 1]) B(T(cyl(0.06, 0.06, 0.06, 8), { p: [sx * 0.395, th * 0.82, 0], r: [0, 0, Math.PI / 2] }), DARK); } },
    // the wide one: low, a dome on a skirt, on four little wheels when it is on the floor
    wide: { th: 1.4, w: 0.62, front: 0.5, head: 0.16, hr: 0.3, lift: 0.42, wheels: true, weight: 1, collar: th => th * 0.88,
      prof: (y, th) => { const k = ell(y, th * 0.5, th * 0.56); return [0.66 * k, 0.56 * k, 2]; },
      trunk(B, C, th) { B(shell(this, th, ellRows(th * 0.5, th * 0.56, 12).filter(y => y >= 0 && y <= th).concat([0, th]), 20), p => (p.y < th * 0.24 ? DARK : C)); B(T(cyl(0.4, 0.44, 0.08, 16), { p: [0, th + 0.02, 0] }), C); } },
    // the one with a neck: a small round trunk, a long thin neck, and one large eye at the end of it
    neck: { th: 0.95, neck: 1.1, neckSit: 0.5, w: 0.36, front: 0.3, head: 0.16, hr: 0.22, lift: 1.45, weight: 1, collar: th => th * 0.9,
      prof: (y, th) => { const k = ell(y, th / 2, th / 2); return [0.36 * k, 0.33 * k, 2]; },
      trunk(B, C, th, nk) { B(shell(this, th, ellRows(th / 2, th / 2, 9), 16), p => (p.y < 0.2 ? DARK : C)); B(T(cyl(0.045, 0.06, nk + 0.1, 8), { p: [0, th + nk / 2 - 0.03, 0] }), '#8f969b'); for (const u of [0.33, 0.66]) B(T(cyl(0.07, 0.07, 0.05, 8), { p: [0, th + nk * u, 0] }), DARK); } },
    // the drum: a stout cylinder with a dome on it, bolts at the shoulders
    drum: { th: 1.3, w: 0.42, front: 0.42, head: 0.04, hr: 0.38, lift: 1.8, weight: 1.5, collar: th => th - 0.1,
      prof: (y, th) => { const r = 0.4 + 0.02 * Math.min(1, Math.max(0, y / th)); return [r, r, 2]; },
      deco: (y, th) => (Math.abs(y - (th - 0.03)) < 0.04 ? 0.04 : 0),
      trunk(B, C, th) { B(T(cyl(0.42, 0.4, th, 20), { p: [0, th / 2, 0] }), p => (p.y < 0.2 ? DARK : C)); B(T(cyl(0.44, 0.44, 0.05, 20), { p: [0, th - 0.03, 0] }), DARK); for (const sx of [-1, 1]) B(T(cyl(0.08, 0.08, 0.08, 8), { p: [sx * 0.45, th * 0.8, 0], r: [0, 0, Math.PI / 2] }), DARK); } },
  };
  const MAKE_IDS = Object.keys(MAKES);
  // Where the eyes sit on each make's visor. A round visor (R: its radius; sy: how the head is squashed) is
  // walked round from the middle of the face, yaw a and elevation b (radians): so an eye that glances moves over
  // the visor's surface and never sinks into it or stands off it. A flat screen has its eyes at depth z.
  //   x, y   where each eye is (the round kinds: as yaw and elevation)      rx, ry: its half width and height (ry times eyeH)
  const FACES = {
    round: { R: 0.352, sy: 1, a: 0.33, b: 0.14, rx: 0.05, ry: 0.05, mouth: -2 },
    tall: { R: 0.282, sy: 1.15, a: 0.33, b: 0.15, rx: 0.042, ry: 0.055, mouth: -1.4 },
    box: { flat: true, z: 0.239, x: 0.13, y: 0, rx: 0.056, ry: 0.046, mouth: -2.3 },
    wide: { R: 0.433, sy: 0.72, a: 0.4, b: 0.46, rx: 0.07, ry: 0.06, mouth: -1.6 },
    neck: { flat: true, z: 0.245, x: 0, y: 0, rx: 0.08, ry: 0.08, one: true, mouth: -1.55 },
    drum: { R: 0.392, sy: 1, a: 0.32, b: 0.42, rx: 0.055, ry: 0.052, mouth: -1.8 },
  };

  // ---- the surface of a trunk ----
  // a point of the cross-section at angle q (0: straight ahead, +PI/2: its left, the +x side)
  const se = (a, b, n, q) => { const s = Math.sin(q), c = Math.cos(q), e = 2 / n; return [a * Math.sign(s) * Math.abs(s) ** e, b * Math.sign(c) * Math.abs(c) ** e]; };
  const P0 = (M, th, q, y) => { const [a, b, n] = M.prof(y, th); const [x, z] = se(a, b, n, q); return V(x, y, z); };
  // a point `off` proud of the surface at (q, y), and the way out there (rims and bolts counted, if `deco`)
  function surf(M, th, q, y, off = 0, deco = true) {
    const e = 0.004, p = P0(M, th, q, y), dq = P0(M, th, q + e, y).sub(P0(M, th, q - e, y)), dy = P0(M, th, q, y + e).sub(P0(M, th, q, y - e));
    const n = dq.cross(dy); if (n.lengthSq() < 1e-12) n.set(Math.sin(q), 0, Math.cos(q)); n.normalize();
    if (n.x * p.x + n.z * p.z < 0) n.negate();
    return { p: p.addScaledVector(n, off + (deco && M.deco ? M.deco(y, th) : 0)), n };
  }
  // the angle at which the front of the trunk is x across (for flat things laid on the chest: a tag, a patch)
  const qAtX = (M, th, x, y) => { let lo = -Math.PI / 2, hi = Math.PI / 2; for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (P0(M, th, mid, y).x < x) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  // rows of y for an egg: closer together where it curves
  function ellRows(c, R, n) { n = Math.max(6, Math.round(n * LO)); const out = []; for (let i = 0; i <= n; i++) out.push(c + R * Math.sin(-Math.PI / 2 + i / n * Math.PI)); return out; }
  // the trunk itself, from the profile: rings at the given heights, closed top and bottom
  function shell(M, th, ys, cols = 24, cap = false) {
    cols = Math.max(10, Math.round(cols * LO));
    ys = [...new Set(ys.filter(y => y >= -1e-6 && y <= th + 1e-6).map(y => +y.toFixed(5)))].sort((a, b) => a - b);
    const pos = [], idx = [], rows = [];
    if (cap) rows.push({ y: ys[0], pt: true });
    for (const y of ys) rows.push({ y });
    if (cap) rows.push({ y: ys[ys.length - 1], pt: true });
    rows.forEach(({ y, pt }) => { for (let j = 0; j < cols; j++) { if (pt) pos.push(0, y, 0); else { const p = P0(M, th, j / cols * TAU, y); pos.push(p.x, p.y, p.z); } } });
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < cols; j++) { const a = i * cols + j, b = i * cols + (j + 1) % cols, c = a + cols, d = b + cols; idx.push(a, b, d, a, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    // (winding: b is to the +x side of a at the front, d above it, so a-b-d faces out)
    return g;
  }
  // a piece of the surface, from q0 to q1 and y0 to y1, `off` proud: a tag, a sticker, a patch, an apron
  function patch(M, th, q0, q1, y0, y1, off, nu = 6, nv = 4, both = false) {
    const pos = [], nor = [], idx = [];
    for (let i = 0; i <= nv; i++) for (let j = 0; j <= nu; j++) { const s = surf(M, th, q0 + (q1 - q0) * j / nu, y0 + (y1 - y0) * i / nv, off); pos.push(s.p.x, s.p.y, s.p.z); nor.push(s.n.x, s.n.y, s.n.z); }
    const W = nu + 1; for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++) { const a = i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, d, a, d, c); if (both) idx.push(a, d, b, a, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
  }
  // a flat thing on the chest x0..x1 across: the same, by width rather than angle (the front of a box is flat)
  const patchX = (M, th, x0, x1, y0, y1, off, nu = 4, nv = 3) => { const ym = (y0 + y1) / 2; return patch(M, th, qAtX(M, th, x0, ym), qAtX(M, th, x1, ym), y0, y1, off, nu, nv); };
  // a band right round the trunk, with its top and bottom edges closed down to the surface (a scarf, a belt, a cardigan's hem)
  function band(M, th, y0, y1, off, nu = 20) {
    nu = Math.max(10, Math.round(nu * LO));
    const out = [patch(M, th, 0, TAU, y0, y1, off, nu, 2)];
    for (const [y, up] of [[y0, false], [y1, true]]) {
      const pos = [], nor = [], idx = [];
      for (let j = 0; j <= nu; j++) { const q = j / nu * TAU, a = surf(M, th, q, y, 0), b = surf(M, th, q, y, off); pos.push(a.p.x, y, a.p.z, b.p.x, y, b.p.z); nor.push(0, up ? 1 : -1, 0, 0, up ? 1 : -1, 0); }
      for (let j = 0; j < nu; j++) { const a = j * 2; if (up) idx.push(a, a + 2, a + 3, a, a + 3, a + 1); else idx.push(a, a + 3, a + 2, a, a + 1, a + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); out.push(g);
    }
    return out;
  }
  // a ribbon lying on the surface along a path of (q, y): a lanyard, a strap. Both faces, so it never vanishes edge on.
  function ribbon(M, th, path, width, off) {
    const S = path.map(([q, y]) => surf(M, th, q, y, off)), pos = [], nor = [], idx = [];
    S.forEach((s, i) => { const a = S[Math.max(0, i - 1)].p, b = S[Math.min(S.length - 1, i + 1)].p, t = b.clone().sub(a).normalize(), side = t.clone().cross(s.n).normalize().multiplyScalar(width / 2); pos.push(s.p.x - side.x, s.p.y - side.y, s.p.z - side.z, s.p.x + side.x, s.p.y + side.y, s.p.z + side.z); nor.push(s.n.x, s.n.y, s.n.z, s.n.x, s.n.y, s.n.z); });
    for (let i = 0; i < S.length - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2, a, a + 3, a + 1, a, a + 2, a + 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx); return g;
  }
  const between = (a, b, n) => (n = Math.max(3, Math.round(n * LO)), Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n));

  // how one of a make stands or sits: the height of its trunk and neck now, where its head is, its shoulder, its top
  function frame(r) {
    const M = MAKES[r.make] ?? MAKES.round, sit = r.seated, s = r.size, th = sit ? Math.min(M.th, M.thSit ?? M.th) : M.th, nk = M.neck ? (sit ? M.neckSit : M.neck) : 0;
    const hip = sit ? r.seat : (r.lift ?? (r.make && r.make !== 'round' ? M.lift * s : 1.25 * s));
    return { M, th, nk, hip, headY: hip + (th + nk + M.head) * s, topY: hip + (th + nk + M.head + M.hr) * s, shoulder: hip + th * 0.82 * s, w: M.w * s, front: M.front * s, z: sit ? -0.08 : 0 };
  }

  // ---- a body: the trunk and everything on it, in its own frame (y = 0 the underside of the trunk, facing +z,
  // unscaled: the size goes in with the place it stands) ----
  function body(r, seated, lo = false) {
    LO = lo ? 0.6 : 1;
    try { return body1(r, seated); } finally { LO = 1; }
  }
  function body1(r, seated) {
    const M = MAKES[r.make] ?? MAKES.round, th = seated ? Math.min(M.th, M.thSit ?? M.th) : M.th, nk = M.neck ? (seated ? M.neckSit : M.neck) : 0, C = r.shell, tc = r.touches ?? {};
    const parts = [], B = (geo, colour) => parts.push(paint(geo, colour));
    M.trunk(B, C, th, nk);
    // under it, standing: little wheels if it is the kind that rolls, else the cap of whatever holds it up
    if (!seated) { if (M.wheels) { B(T(cyl(0.6, 0.64, 0.2, 16), { p: [0, -0.08, 0], s: [1, 1, 0.86] }), DARK); for (const [x, z] of [[-0.4, 0.3], [0.4, 0.3], [-0.4, -0.3], [0.4, -0.3]]) B(T(sph(0.1, 6, 4), { p: [x, -0.3, z] }), '#2a2622'); } else B(T(new THREE.SphereGeometry(Math.min(0.3, M.w * 0.7), 12, 3, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, 0.03, 0], s: [1, 0.5, 1] }), DARK); }
    // the cardigan: a knitted band round the middle with ribbing and three buttons down the front (under the lanyard)
    if (tc.cardigan) { const y0 = th * 0.2, y1 = th * 0.62, rib = q => (Math.floor((q / TAU) * 48) % 2 ? tc.cardigan : shade(tc.cardigan, 0.86)); for (const g of band(M, th, y0, y1, 0.022, 24)) parts.push(paint(g, p => rib(Math.atan2(p.x, p.z) + Math.PI))); parts.push(paint(patchX(M, th, -0.012, 0.012, y0, y1, 0.026, 1, 6), shade(tc.cardigan, 0.7))); for (const u of [0.25, 0.5, 0.75]) { const s = surf(M, th, qAtX(M, th, 0, y0 + (y1 - y0) * u), y0 + (y1 - y0) * u, 0.03); B(T(sph(0.022, 4, 3), { p: [s.p.x, s.p.y, s.p.z] }), '#e9dfc8'); } }
    // a patched panel: a square of slightly different shell, riveted at the corners
    if (tc.patch) { const [px, py] = tc.patch, y = th * py, x0 = px - 0.08, x1 = px + 0.08; parts.push(paint(patchX(M, th, x0, x1, y - 0.07, y + 0.07, 0.008), shade(C, 0.84))); for (const [x, yy] of [[x0 + 0.02, y - 0.05], [x1 - 0.02, y - 0.05], [x0 + 0.02, y + 0.05], [x1 - 0.02, y + 0.05]]) { const s = surf(M, th, qAtX(M, th, x, yy), yy, 0.012); B(T(sph(0.012, 5, 3), { p: [s.p.x, s.p.y, s.p.z] }), DARK); } }
    // a sticker (a little round one, bright)
    if (tc.sticker) { const [sq, sy, col] = tc.sticker, y = th * sy; parts.push(paint(patch(M, th, sq - 0.09, sq + 0.09, y - 0.05, y + 0.05, 0.006, 4, 2), col)); parts.push(paint(patch(M, th, sq - 0.045, sq + 0.045, y - 0.025, y + 0.025, 0.009, 2, 1), '#f4eee2')); }
    // the name tag, lying on the chest, and its lanyard over the surface from round behind the neck
    const ty = th * 0.6, cy = M.collar(th), tx0 = 0.03, tx1 = 0.23, tTop = ty + 0.07;
    if (r.role !== 'tech' || M !== MAKES.box) {
      parts.push(paint(patchX(M, th, tx0, tx1, ty - 0.065, tTop, 0.014), '#f4eee2')); parts.push(paint(patchX(M, th, tx0, tx1, tTop - 0.035, tTop, 0.018), r.groupColour));
      const qa = qAtX(M, th, tx0 + 0.025, tTop), qb = qAtX(M, th, tx1 - 0.025, tTop), side = Math.PI * 0.42;
      parts.push(paint(ribbon(M, th, between(-side, qa, 7).map((q, i) => [q, cy + (tTop - cy) * (i / 7) ** 1.3]), 0.03, 0.012), r.groupColour));
      parts.push(paint(ribbon(M, th, between(side, qb, 7).map((q, i) => [q, cy + (tTop - cy) * (i / 7) ** 1.3]), 0.03, 0.012), r.groupColour));
      parts.push(paint(ribbon(M, th, between(side, TAU - side, 10).map(q => [q, cy]), 0.03, 0.012), r.groupColour));      // round the back of the neck
    }
    // the scarf: wrapped round at the collar, one end hanging down the front
    if (r.wear === 'scarf') { const y = cy - 0.02; for (const g of band(M, th, y - 0.075, y + 0.075, 0.04, 20)) parts.push(paint(g, r.accent)); const q = qAtX(M, th, -0.14, y - 0.2); parts.push(paint(patch(M, th, q - 0.06 / Math.max(0.2, M.prof(y - 0.2, th)[0]), q + 0.06 / Math.max(0.2, M.prof(y - 0.2, th)[0]), y - 0.42, y - 0.07, 0.05, 2, 5), r.accent)); for (const k of [0.2, 0.32]) { const s = surf(M, th, q, y - 0.42 - k * 0.1 + 0.03, 0.05); B(T(cyl(0.008, 0.008, 0.06, 3), { p: [s.p.x, s.p.y - 0.03, s.p.z] }), r.accent); } }
    // the satchel: its strap across the chest from the left hip to over the right shoulder and round the back, the bag at the hip
    if (r.wear === 'satchel') {
      const yc = th * 0.56, A = Math.min(th * 0.3, cy - yc), path = between(0, TAU, 20).map(q => [q, yc + A * Math.sin(q)]);
      parts.push(paint(ribbon(M, th, path, 0.045, 0.02), '#3a2a20'));
      const yb = Math.max(0.12, yc - A - 0.05), s = surf(M, th, -Math.PI / 2, yb, 0.07, false), yaw = Math.atan2(s.n.x, s.n.z);
      B(T(rbox(0.34, 0.26, 0.1, 0.03), { p: [s.p.x, s.p.y, s.p.z], r: [0, yaw, 0] }), r.accent); B(T(rbox(0.35, 0.1, 0.105, 0.02), { p: [s.p.x + s.n.x * 0.004, s.p.y + 0.09, s.p.z + s.n.z * 0.004], r: [0, yaw, 0] }), shade(r.accent, 0.8));
    }
    // the technical staff: a stiff apron over the front, a belt with its pouches, a screwdriver in it
    if (r.role === 'tech') {
      parts.push(paint(patch(M, th, -0.75, 0.75, th * 0.12, th * 0.62, 0.016, 8, 5), '#5b4a3a'));
      for (const g of band(M, th, th * 0.28, th * 0.34, 0.024, 24)) parts.push(paint(g, '#3a2a20'));
      for (const sx of [-1, 1]) { const s = surf(M, th, sx * Math.PI / 2, th * 0.26, 0.07, false); B(T(rbox(0.08, 0.16, 0.16, 0.025), { p: [s.p.x, s.p.y, s.p.z] }), '#6b4a2e'); }
      const s = surf(M, th, Math.PI * 0.62, th * 0.31, 0.06); B(rod([s.p.x, th * 0.3, s.p.z], [s.p.x, th * 0.52, s.p.z], 0.016, 0.016, 5), '#e0723c');
    }
    return merge(parts);
  }
  const shade = (hex, k) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();

  // ---- a head, about its own middle, in the robot's own colours, with its touches ----
  function head(r) {
    const C = r.shell, tc = r.touches ?? {}, vw = tc.visorW ?? 1, vh = tc.visorH ?? 1, parts = [], B = (g, c) => parts.push(paint(g, c));
    const visor = (R, sy, phi, th0, thL) => B(T(new THREE.SphereGeometry(R, 14, 6, Math.PI / 2 - phi * vw / 2, phi * vw, th0 + thL * (1 - vh) / 2, thL * vh), { s: [1, sy, 1] }), VISOR);
    let topY = 0.34;
    switch (r.make) {
      case 'tall': B(T(sph(0.27, 16, 12), { s: [1, 1.15, 1] }), C); visor(0.276, 1.15, 1.6, 1.05, 0.7); topY = 0.31; break;
      case 'box': B(rbox(0.68, 0.5, 0.46, 0.13, [0, 0, 0], [0, 0, 0], 3), C); { const s = new THREE.Shape(), w = 0.29 * vw, h = 0.19 * vh, k = 0.07; s.moveTo(-w + k, -h); s.lineTo(w - k, -h); s.quadraticCurveTo(w, -h, w, -h + k); s.lineTo(w, h - k); s.quadraticCurveTo(w, h, w - k, h); s.lineTo(-w + k, h); s.quadraticCurveTo(-w, h, -w, h - k); s.lineTo(-w, -h + k); s.quadraticCurveTo(-w, -h, -w + k, -h); B(T(new THREE.ShapeGeometry(s, 4), { p: [0, 0, 0.2345] }), VISOR); } topY = 0.25; break;
      case 'wide': B(T(new THREE.SphereGeometry(0.42, 18, 7, 0, TAU, 0, Math.PI / 2), { s: [1, 0.72, 1] }), C); visor(0.427, 0.72, 1.9, 0.75, 0.62); B(T(cyl(0.42, 0.42, 0.04, 18), { p: [0, -0.02, 0] }), DARK); topY = 0.3; break;
      case 'neck': B(T(sph(0.24, 14, 9), { s: [1.2, 0.9, 1.05] }), C); B(T(cyl(0.17, 0.17, 0.05, 16), { p: [0, 0, 0.215], r: [Math.PI / 2, 0, 0] }), VISOR); B(T(cyl(0.2, 0.2, 0.03, 16), { p: [0, 0, 0.2], r: [Math.PI / 2, 0, 0] }), '#6b5a48'); topY = 0.216; break;
      case 'drum': B(T(new THREE.SphereGeometry(0.38, 18, 7, 0, TAU, 0, Math.PI / 2), {}), C); visor(0.386, 1, 1.7, 0.8, 0.62); topY = 0.38; break;
      default: B(sph(0.34, 18, 12), C); visor(0.346, 1, 1.7, 1.02, 0.78); topY = 0.34;
    }
    // the antenna (or none)
    const ant = tc.antenna ?? 'none', ax = r.make === 'drum' ? 0.12 : 0;
    if (ant === 'stub' || ant === 'ball') { B(T(cyl(0.012, 0.016, 0.16, 5), { p: [ax, topY + 0.06, 0] }), '#6b5a48'); B(T(sph(ant === 'ball' ? 0.045 : 0.03, 8, 6), { p: [ax, topY + 0.15, 0] }), ant === 'ball' ? (tc.bulb ?? '#e0723c') : C); }
    else if (ant === 'bent') { B(rod([ax, topY - 0.02, 0], [ax, topY + 0.12, 0], 0.013, 0.013), '#6b5a48'); B(rod([ax, topY + 0.12, 0], [ax + 0.09, topY + 0.2, -0.03], 0.012, 0.01), '#6b5a48'); B(T(sph(0.026, 6, 4), { p: [ax + 0.09, topY + 0.2, -0.03] }), C); }
    else if (ant === 'two') for (const sx of [-1, 1]) { B(rod([sx * 0.08, topY - 0.03, 0], [sx * 0.15, topY + 0.13, 0], 0.012, 0.01), '#6b5a48'); B(T(sph(0.026, 6, 4), { p: [sx * 0.15, topY + 0.13, 0] }), tc.bulb ?? C); }
    // glasses: a thin round frame round each eye, a little in front of the visor, and the bridge between
    if (tc.glasses) { const F = FACES[r.make] ?? FACES.round, m = new THREE.Matrix4(), pts = [];
      for (const k of F.one ? [0] : [-1, 1]) { eyeLocal(r, k, 0, 0, 1, m, 0.03); m.decompose(_p, _q, _s); m.compose(_p, _q, _s.set(1, 1, 1)); const R = Math.max(F.rx, F.ry * (r.eyeH ?? 1)) * 1.55; const g = new THREE.TorusGeometry(R, 0.009, 3, 14).applyMatrix4(m); B(g, tc.glasses); pts.push(new THREE.Vector3(F.one ? 0 : -k * R, 0, 0).applyMatrix4(m)); }
      if (pts.length === 2) B(rod(pts[0].toArray(), pts[1].toArray(), 0.008, 0.008, 4), tc.glasses); }
    // a pencil behind the ear
    if (tc.pencil) { const side = tc.pencil > 0 ? 1 : -1, R = r.make === 'box' ? 0.35 : r.make === 'wide' ? 0.4 : r.make === 'drum' ? 0.39 : r.make === 'neck' ? 0.29 : 0.3, y = r.make === 'wide' || r.make === 'drum' ? 0.12 : 0.04;
      B(rod([side * R, y + 0.03, -0.15], [side * (R + 0.005), y - 0.02, 0.14], 0.016, 0.016, 6), '#e8b630'); B(rod([side * (R + 0.005), y - 0.02, 0.14], [side * (R + 0.006), y - 0.03, 0.19], 0.016, 0.003, 6), '#d9b98a'); B(rod([side * R, y + 0.03, -0.15], [side * R, y + 0.035, -0.18], 0.017, 0.017, 6), '#d88a8a'); }
    return merge(parts);
  }
  // Where eye k (-1 right, +1 left; 0 the single eye) sits on the head, glancing (gx: yaw, gy: up, radians), `open`
  // its height as a share of open, `fwd` how far proud: into m (the head's own frame, unscaled).
  const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
  function eyeLocal(r, k, gx, gy, open, m, fwd = 0, dy = 0, sx = 1, sy = 1) {
    const F = FACES[r.make] ?? FACES.round, ry = F.ry * (r.eyeH ?? 1) * (F.one ? 1 : 1);
    if (F.flat) {
      _p.set((F.one ? 0 : k * F.x) + gx * 0.16, F.y + gy * 0.12 + dy * ry, F.z + fwd); _e.set(0, 0, 0);
    } else {
      const ext = Math.max(F.rx * Math.max(1, sx), ry * Math.max(1, open * sy)), a = (F.one ? 0 : k * F.a) + gx, b = F.b + gy, R = F.R + fwd + ext * ext / (2 * F.R * Math.min(1, F.sy));      // (a flat disc on a curved visor: stood off by its sag, so its rim never sinks in)
      _p.set(R * Math.sin(a) * Math.cos(b), R * Math.sin(b) * F.sy, R * Math.cos(a) * Math.cos(b)); _e.set(-Math.atan2(Math.tan(b), 1 / F.sy), a, 0, 'YXZ');
      if (dy) { const up = new THREE.Vector3(0, 1, 0).applyEuler(_e); _p.addScaledVector(up, dy * ry); }
    }
    m.compose(_p, _q.setFromEuler(_e), _s.set(F.rx * sx, Math.max(1e-3, ry * open * sy), 1));
    return m;
  }

  return { MAKES, MAKE_IDS, FACES, frame, body, head, eyeLocal, surf, rod, box, rbox, shade };
}
