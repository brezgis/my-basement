// What a building is made with. Each building of the school is one file in src/buildings/, a function
// that receives `b` (made here by makeSite) and builds itself in its OWN plan coordinates, in feet:
//
//   X   left to right as you stand in front of the building, facing its entrance front
//   Y   from the entrance front (0) back into the building
//   h   height above the building's own ground line
//
// exactly as house.js of Anna's House is written. Where the building stands on the island, which way it
// faces and how high its ground is are the site's business (campus.js): everything made through `b` is
// turned and moved into place here, so a building's author never does world arithmetic.
//
// The whole interface is described, with signatures, in src/buildings/README.md. Keep the two in step.

import * as THREE from 'three';
import { Builder } from './builder.js';
import { makeKit } from './kit.js';

const TURNS = { east: 0, north: 1, west: 2, south: 3 };      // quarter turns of the entrance front from east (+z)
const INTERIOR = /^(plaster|ceil|painted_wood|fir|oak_light|tile_subway|c#)/;      // faces that are a room's wall, not the weather's
const TH = { up: 0.05, deep: 0.2, out: 0.06 };      // a threshold: how far it stands above the floor, goes down into the wall, and comes out past each face of it

// lists: { surfaces, rooms, lamps, doors, windows, portals, boxes, footprints, later, kits } (campus.js owns them)
export function makeSite(B, site, lists) {
  const k = TURNS[site.facing] ?? 0, th = k * Math.PI / 2, cos = Math.round(Math.cos(th)), sin = Math.round(Math.sin(th));
  const [ox, oz] = site.origin, g0 = site.ground ?? 0;
  const M = new THREE.Matrix4().makeRotationY(th).setPosition(ox, g0, oz);
  // plan point -> world [x, z]; plan direction -> world [dx, dz]
  const P = (X, Y) => [ox + X * cos - Y * sin, oz - X * sin - Y * cos];
  const Dir = (dX, dY) => [dX * cos - dY * sin, -dX * sin - dY * cos];
  // a plan box -> a world box { x0, x1, z0, z1, y0, y1 }
  const wbox = (X0, X1, Y0, Y1, h0, h1) => { const [ax, az] = P(X0, Y0), [bx, bz] = P(X1, Y1); return { x0: Math.min(ax, bx), x1: Math.max(ax, bx), z0: Math.min(az, bz), z1: Math.max(az, bz), y0: g0 + Math.min(h0, h1), y1: g0 + Math.max(h0, h1) }; };
  const worldAxis = ax => ((ax === 'X') === (k % 2 === 0) ? 'x' : 'z');      // which world axis a plan axis lies along

  // ---- the Builder, in the building's own coordinates -------------------------------------------
  // The same methods as the engine's Builder (pbox, pcyl, prbox, prism, mesh, block, wbox in the building's own
  // three.js space: x = X, y = h, z = -Y). Geometry is made there, texture coordinates and all, then turned and
  // moved to the site and handed to the real Builder, which merges it by material.
  class Local extends Builder {
    add(mat, geom) { const q = geom.index ? geom.toNonIndexed() : geom; q.applyMatrix4(M); B.add(mat, q); }
  }
  const L = new Local();
  L.colliders = { push: (...cs) => { for (const c of cs) { const a = new THREE.Vector3(c.x0, c.y0 ?? 0, c.z0).applyMatrix4(M), d = new THREE.Vector3(c.x1, c.y1 ?? 0, c.z1).applyMatrix4(M); B.colliders.push({ x0: Math.min(a.x, d.x), x1: Math.max(a.x, d.x), y0: Math.min(a.y, d.y), y1: Math.max(a.y, d.y), z0: Math.min(a.z, d.z), z1: Math.max(a.z, d.z) }); } } };

  const G = { grain: 'long' };
  const bounds = { X0: Infinity, X1: -Infinity, Y0: Infinity, Y1: -Infinity };
  const grow = (X0, X1, Y0, Y1) => { bounds.X0 = Math.min(bounds.X0, X0, X1); bounds.X1 = Math.max(bounds.X1, X0, X1); bounds.Y0 = Math.min(bounds.Y0, Y0, Y1); bounds.Y1 = Math.max(bounds.Y1, Y0, Y1); };

  // ---- finishes: what each room's walls, floor and ceiling are finished in ------------------------------------
  // b.finishes({ 'Room name': { wall, dado: [height, mat], rail, frieze: [height, mat], picture, base, floor, ceil,
  // beams, datum }, ... }): one table for a building, keyed by the rooms' names (README, "Finishes"). Nothing is laid
  // ON anything: when the walls are built (finish, below) each plastered face is made of the finishes of the room it
  // looks into (its leaf is cut into a dado, a field and a frieze, with a dado rail and a picture rail standing
  // proud), and each floor's boards and the ceiling under it are cut to the rooms over and under them.
  const planRooms = [], slabs = [], wellsOver = [];      // every room, in plan coordinates; the tops and undersides of floors, kept until the rooms are known; the holes in floors and how low each floor's underside is (layBeams)
  let FIN = null;
  const finishes = t => { if (new URLSearchParams(globalThis.location?.search ?? '').get('finishes') === '0') return false; FIN = { ...(FIN ?? {}), ...t }; return true; };      // (?finishes=0: every room as the building file's own materials have it, for comparing)
  // The finished rooms a wall's face looks into: the face lies at `face` across a wall along `ax`, looking toward sg.
  // (A room's box may stop a foot short of the wall, in a bay, or on a partition's middle line: two probes.)
  function facing(ax, face, sg, a, e, h0, h1) {
    const out = [];
    for (const r of planRooms) {
      const fin = FIN[r.name]; if (!fin) continue;
      const [u0, u1, v0, v1] = ax === 'X' ? [r.X0, r.X1, r.Y0, r.Y1] : [r.Y0, r.Y1, r.X0, r.X1];
      if (![0.35, 1.5].some(d => face + sg * d > v0 && face + sg * d < v1)) continue;
      if (Math.min(u1, e) - Math.max(u0, a) < 0.05 || Math.min(r.ceil, h1) - Math.max(r.floor, h0) < 1) continue;
      out.push({ r, fin, ua: Math.max(a, u0 - 0.2), ub: Math.min(e, u1 + 0.2), base: fin.datum ?? r.floor });
    }
    return out;
  }
  // The bands of a face at one place along it, from h0 to h1: [[from, to, material], ...] (dflt where no finished room is)
  function skin(F, um, h0, h1, dflt) {
    const rs = F.filter(q => um > q.ua && um < q.ub).sort((p, q) => p.r.floor - q.r.floor), out = [];
    let h = h0;
    rs.forEach((q, i) => {
      const nx = rs[i + 1], lo = Math.max(h, q.r.floor - 1.2);
      let hi = Math.min(h1, q.r.ceil + 1.2); if (nx) hi = Math.min(hi, nx.r.floor > q.r.ceil ? (q.r.ceil + nx.r.floor) / 2 : q.r.ceil + 0.07);
      if (hi - lo < 0.02) return;
      if (lo - h > 0.004) out.push([h, lo, dflt]);
      const f = q.fin; let a = lo;
      for (const [top, m] of [[f.dado ? q.base + f.dado[0] : -Infinity, f.dado?.[1]], [f.frieze ? q.base + f.frieze[0] : Infinity, f.wall], [Infinity, f.frieze?.[1]]]) { const b2 = Math.min(hi, top); if (b2 - a > 0.004) { out.push([a, b2, m ?? f.wall ?? dflt]); a = b2; } }
      h = hi;
    });
    if (h1 - h > 0.004) out.push([h, h1, dflt]);
    return out;
  }
  // A box without some of its faces: skip = [[nx, ny, nz], ...], the normals (in the building's three.js space) of
  // the faces left out. The bands of a finished wall are these: the faces between two leaves and between one band
  // and the next are never seen, and a wall of three bands on both sides would otherwise be six whole boxes.
  const partBox = (mat, X0, X1, Y0, Y1, h0, h1, skip) => {
    if (X1 - X0 < 0.004 || Y1 - Y0 < 0.004 || h1 - h0 < 0.004) return;
    const g = new THREE.BoxGeometry(X1 - X0, h1 - h0, Y1 - Y0).toNonIndexed(); g.translate((X0 + X1) / 2, (h0 + h1) / 2, -(Y0 + Y1) / 2);
    const p = g.attributes.position, n = g.attributes.normal, pos = [], nor = [], uv = [];
    for (let i = 0; i < p.count; i++) {
      const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i); if (skip.some(q => q[0] * nx + q[1] * ny + q[2] * nz > 0.5)) continue;
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i); pos.push(x, y, z); nor.push(nx, ny, nz);
      if (Math.abs(nx) > 0.5) uv.push(z, y); else if (Math.abs(ny) > 0.5) uv.push(x, z); else uv.push(x, y);      // (as the Builder's boxes: the plaster runs on unbroken)
    }
    const q = new THREE.BufferGeometry(); q.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); q.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); q.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); L.add(mat, q);
  };
  // the part of an outline [[u, h], ...] above (sg 1) or below (sg -1) the height h
  const clipH = (pts, h, sg) => { const out = [], f = p => sg * (p[1] - h);
    pts.forEach((p, i) => { const q = pts[(i + 1) % pts.length], fp = f(p), fq = f(q); if (fp >= 0) out.push(p); if ((fp > 0 && fq < 0) || (fp < 0 && fq > 0)) { const k = fp / (fp - fq); out.push([p[0] + k * (q[0] - p[0]), h]); } });
    return out; };
  // A floor's top or its underside (or a ceiling), cut to the rooms: each piece is given to the nearest room at that
  // level within 1.8 ft (so a room's floor runs in under its walls and out into its bays), and takes that room's
  // `floor` or `ceil`. A floor may be { tiles: [size, a, b], border: [[width, mat], ...], well: [X0, X1, Y0, Y1, mat, rim] }:
  // a chequer of plain colours inside a border of bands (given from the wall inward), with a mat well in it, laid as
  // one flat sheet over a slab of the outermost band's material that stops just under it.
  function laySlab(q) {
    const key = q.top ? 'floor' : 'ceil', lvl = q.top ? q.h1 : q.h0, R = 1.8;
    const rs = FIN ? planRooms.filter(r => Math.abs(r[key] - lvl) < 0.03 && r.X1 > q.a - R && r.X0 < q.b + R && r.Y1 > q.c - R && r.Y0 < q.d + R) : [];
    if (!rs.some(r => FIN[r.name]?.[key])) return L.pbox(q.mat, q.a, q.b, q.c, q.d, q.h0, q.h1, q.o);
    const tiled = r => { const f = FIN[r.name]?.[key]; return f && typeof f === 'object' ? f : null; };
    const cuts = (lo, hi, k0, k1) => [...new Set([lo, hi, ...rs.flatMap(r => [r[k0] - R, r[k0], r[k1], r[k1] + R])])].filter(v => v >= lo && v <= hi).sort((p, n) => p - n);
    const xs = cuts(q.a, q.b, 'X0', 'X1'), ys = cuts(q.c, q.d, 'Y0', 'Y1');
    const roomAt = (x, y) => { let best = null, bd = R + 1e-6; for (const r of rs) { const d = Math.max(r.X0 - x, x - r.X1, r.Y0 - y, y - r.Y1, 0); if (d < bd) { bd = d; best = r; } } return best; };
    const groups = []; let prev = null;
    for (let i = 0; i < xs.length - 1; i++) {
      if (xs[i + 1] - xs[i] < 0.004) continue;
      const runs = [];
      for (let j = 0; j < ys.length - 1; j++) { if (ys[j + 1] - ys[j] < 0.004) continue; const r = roomAt((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2), l = runs.at(-1); if (l && l[2] === r) l[1] = ys[j + 1]; else runs.push([ys[j], ys[j + 1], r]); }
      const k = runs.map(v => [v[0], v[1], v[2] ? planRooms.indexOf(v[2]) : -1]).join(';');
      if (prev && prev.k === k) prev.x1 = xs[i + 1]; else groups.push(prev = { x0: xs[i], x1: xs[i + 1], runs, k });
    }
    const quads = {};      // the tiles: flat pieces in the floor's plane, by colour
    const quad = (m, x0, x1, y0, y1) => { if (x1 - x0 > 0.004 && y1 - y0 > 0.004) (quads[m] ??= []).push(x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1); };
    for (const g of groups) for (const [y0, y1, r] of g.runs) {
      const f = r ? FIN[r.name]?.[key] : null, t = r && q.top ? tiled(r) : null;
      if (!t) { L.pbox(typeof f === 'string' ? f : q.mat, g.x0, g.x1, y0, y1, q.h0, q.h1, q.o); continue; }
      // The setting-out, as a tiler does it: the field is a whole, odd number of tiles each way, centred on the room
      // (so a tile lies on each axis and the pattern ends alike at both walls); the border's bands run round it, each
      // a rectangle about the last, so they turn the corners; the outermost band takes up what is left over to the
      // walls, and runs on under them to the thresholds. `well`: a mat sunk in the field ([X0, X1, Y0, Y1, mat, rim]),
      // its edges moved to the nearest joints.
      const [sz, ca, cb] = t.tiles, bands = (Array.isArray(t.border?.[0]) ? t.border : t.border ? [t.border] : [[0, ca]]), bw = bands.reduce((s, v) => s + v[0], 0), bm = bands[0][1];
      const odd = len => { const n = Math.max(1, Math.floor((len - 2 * bw) / sz + 1e-6)); return n % 2 ? n : n - 1; };
      const nx = odd(r.X1 - r.X0), ny = odd(r.Y1 - r.Y0), mx = (r.X0 + r.X1) / 2, my = (r.Y0 + r.Y1) / 2, fx0 = mx - nx * sz / 2, fx1 = mx + nx * sz / 2, fy0 = my - ny * sz / 2, fy1 = my + ny * sz / 2;
      L.pbox(bm, g.x0, g.x1, y0, y1, q.h0, q.h1 - 0.02);
      const cell = [g.x0, g.x1, y0, y1];
      const clipQ = (m, a, b2, c, d) => quad(m, Math.max(a, cell[0]), Math.min(b2, cell[1]), Math.max(c, cell[2]), Math.min(d, cell[3]));
      const ring = (m, o, i) => { clipQ(m, o[0], i[0], o[2], o[3]); clipQ(m, i[1], o[1], o[2], o[3]); clipQ(m, i[0], i[1], o[2], i[2]); clipQ(m, i[0], i[1], i[3], o[3]); };      // the rectangle o less the rectangle i within it, as far as this piece of floor goes
      let inner = [fx0, fx1, fy0, fy1];
      for (let k = bands.length - 1; k >= 1; k--) { const w = bands[k][0], outer = [inner[0] - w, inner[1] + w, inner[2] - w, inner[3] + w]; ring(bands[k][1], outer, inner); inner = outer; }
      ring(bm, [-1e6, 1e6, -1e6, 1e6], inner);
      const snap = (v, o) => o + Math.round((v - o) / sz) * sz, wl = t.well ? [Math.max(fx0, snap(t.well[0], fx0)), Math.min(fx1, snap(t.well[1], fx0)), Math.max(fy0, snap(t.well[2], fy0)), Math.min(fy1, snap(t.well[3], fy0))] : null;
      if (wl) { const e = 0.06, wi = [wl[0] + e, wl[1] - e, wl[2] + e, wl[3] - e]; ring(t.well[5] ?? bm, wl, wi); clipQ(t.well[4], ...wi); }
      const ax0 = Math.max(g.x0, fx0), ax1 = Math.min(g.x1, fx1), ay0 = Math.max(y0, fy0), ay1 = Math.min(y1, fy1);      // the part of this piece that lies in the field
      if (ax1 - ax0 < 0.004 || ay1 - ay0 < 0.004) continue;
      const line = (lo, hi, o) => { const v = [lo]; for (let k = Math.floor((lo - o) / sz) + 1; o + k * sz < hi - 1e-6; k++) if (o + k * sz > lo + 1e-6) v.push(o + k * sz); v.push(hi); return v; };
      const tx = line(ax0, ax1, fx0), ty = line(ay0, ay1, fy0);
      for (let i = 0; i < tx.length - 1; i++) for (let j = 0; j < ty.length - 1; j++) { const cx = (tx[i] + tx[i + 1]) / 2, cy = (ty[j] + ty[j + 1]) / 2; if (wl && cx > wl[0] && cx < wl[1] && cy > wl[2] && cy < wl[3]) continue; quad((Math.floor((cx - fx0) / sz) + Math.floor((cy - fy0) / sz)) % 2 ? cb : ca, tx[i], tx[i + 1], ty[j], ty[j + 1]); }
    }
    for (const [m, v] of Object.entries(quads)) {
      const n = v.length / 2, pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) { pos[i * 3] = v[i * 2]; pos[i * 3 + 1] = q.h1; pos[i * 3 + 2] = -v[i * 2 + 1]; nor[i * 3 + 1] = 1; uv[i * 2] = v[i * 2]; uv[i * 2 + 1] = v[i * 2 + 1]; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); L.add(m, g);
    }
  }
  // Beams under a room's ceiling: beams: { ax, n | at: [...], d, w, mat }: along `ax`, n of them evenly (or at the
  // plan coordinates `at` across), d deep and w wide, their ends in the walls and their tops in the ceiling.
  // Where the floor over the room has a hole in it (a stairwell), the beams are framed round it as a carpenter frames
  // a well: the beams that would cross it stop at a header just outside it, and the header is carried by a trimmer
  // along each side, a beam like the others but placed at the hole's edge. (They ran straight across the well before,
  // a bar at head height over the flight, and the treads came up through them.)
  function layBeams() {
    if (FIN) for (const r of planRooms) {
      const bm = FIN[r.name]?.beams; if (!bm) continue;
      const isX = bm.ax === 'X', [v0, v1] = isX ? [r.Y0, r.Y1] : [r.X0, r.X1], [u0, u1] = isX ? [r.X0 - 0.1, r.X1 + 0.1] : [r.Y0 - 0.1, r.Y1 + 0.1], d = bm.d ?? 0.8, w = bm.w ?? 0.6, m = bm.mat ?? 'fir';
      const beam = (a, e, va, vb) => { if (e - a > 0.05) isX ? L.pbox(m, a, e, va, vb, r.ceil - d, r.ceil + 0.06, G) : L.pbox(m, va, vb, a, e, r.ceil - d, r.ceil + 0.06, G); };
      // the wells over this room, along and across the beams: [ua, ub, va, vb]
      const wells = wellsOver.filter(q => Math.abs(q.under - r.ceil) < 0.3 && q.X1 > r.X0 && q.X0 < r.X1 && q.Y1 > r.Y0 && q.Y0 < r.Y1).map(q => (isX ? [q.X0, q.X1, q.Y0, q.Y1] : [q.Y0, q.Y1, q.X0, q.X1]));
      const trim = wells.flatMap(([, , va, vb]) => [va - w / 2, vb + w / 2]).filter(v => v > v0 + w && v < v1 - w);
      for (const v of (bm.at ?? Array.from({ length: bm.n ?? 2 }, (_, i) => v0 + (v1 - v0) * (i + 0.5) / (bm.n ?? 2))).filter(v => v > v0 + w && v < v1 - w && !trim.some(t => Math.abs(t - v) < w * 1.5))) {
        let cuts = [[u0, u1]];
        for (const [ua, ub, va, vb] of wells) if (v + w / 2 > va && v - w / 2 < vb) cuts = cuts.flatMap(([a, e]) => [[a, Math.min(e, ua - w + 0.02)], [Math.max(a, ub + w - 0.02), e]]);
        for (const [a, e] of cuts) beam(a, e, v - w / 2, v + w / 2);
      }
      for (const t of trim) beam(u0, u1, t - w / 2, t + w / 2);
      // the headers, a little deeper than the beams (so that no two undersides lie in one plane), between the trimmers
      for (const [ua, ub, va, vb] of wells) for (const [a, e] of [[ua - w, ua], [ub, ub + w]]) if (a > u0 + 0.2 && e < u1 - 0.2)
        isX ? L.pbox(m, a, e, va - w, vb + w, r.ceil - d - 0.04, r.ceil + 0.03, G) : L.pbox(m, va - w, vb + w, a, e, r.ceil - d - 0.04, r.ceil + 0.03, G);
    }
  }

  // ---- small things -------------------------------------------------------------------------
  const surface = (X0, X1, Y0, Y1, h) => { const w = wbox(X0, X1, Y0, Y1, h, h); lists.surfaces.push({ x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1, h: g0 + h }); };
  // A convex landing or tread whose walking surface follows its visible edge.
  function surfacePolygon(points, height) {
    const corners = points.map(([x, y]) => P(x, y));
    const xs = corners.map(p => p[0]), zs = corners.map(p => p[1]);
    const edges = corners.map(([x, z], i) => {
      const next = corners[(i + 1) % corners.length];
      return [next[0] - x, next[1] - z, x, z];
    });
    function contains(x, z) {
      let lo = 0, hi = 0;
      for (const [dx, dz, ax, az] of edges) {
        const side = dx * (z - az) - dz * (x - ax);
        lo = Math.min(lo, side); hi = Math.max(hi, side);
      }
      return lo >= -1e-6 || hi <= 1e-6;
    }
    lists.surfaces.push({ x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), h: g0 + height, contains });
  }
  // a sloping surface (a flight): along plan axis ax, from height h0 at u0 to h1 at u1; lo..hi is its width
  const ramp = (ax, u0, u1, lo, hi, h0, h1) => {
    const w = ax === 'X' ? wbox(u0, u1, lo, hi, 0, 0) : wbox(lo, hi, u0, u1, 0, 0), wa = worldAxis(ax);
    const [sx, sz] = ax === 'X' ? P(u0, lo) : P(lo, u0), [ex, ez] = ax === 'X' ? P(u1, lo) : P(lo, u1);
    const startHigh = wa === 'x' ? sx > ex : sz > ez;                    // is the start of the flight at the high-coordinate end?
    lists.surfaces.push({ x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1, ramp: true, ax: wa, h: g0 + (startHigh ? h0 : h1), h2: g0 + (startHigh ? h1 : h0) });
  };
  const portal = (X0, X1, Y0, Y1, h0, h1, n, kind = 'open') => { const w = wbox(X0, X1, Y0, Y1, h0, h1); lists.portals.push({ ...w, n: n === 'h' ? 'y' : worldAxis(n), kind }); };
  // (o.not: { X, Y, r } leaves a round hole in the volume: a courtyard the rooms stand round. Stepped boxes along a
  // curved wall left wedges of floor lit as out of doors.)
  const interior = (X0, X1, Y0, Y1, h0, h1, o = {}) => { const w = wbox(X0, X1, Y0, Y1, h0, h1), box = [w.x0, w.x1, w.z0, w.z1, w.y0, w.y1, g0 + (o.floor ?? h0), g0 + (o.ceil ?? h1)]; if (o.not) { const [nx, nz] = P(o.not.X, o.not.Y); box.push([nx, nz, o.not.r]); } lists.boxes.push(box); };
  // A room: its name is the caption while you stand in it; what is in it is drawn only when it can be seen; and
  // (unless light: false) the box of it is lit as indoors. ceil is the ceiling's height (not the room's).
  const room = (name, X0, X1, Y0, Y1, floor, ceil, o = {}) => {
    const w = wbox(X0, X1, Y0, Y1, floor - 0.6, ceil + (o.over ?? 0.6));      // (reaching into the floor above, so that an eye passing up a stairwell is never in no room)
    lists.rooms.push({ name, x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1, y0: w.y0, y1: w.y1, site: site.id, floor: g0 + floor, ceil: g0 + ceil });      // (floor, ceil: the true levels, for the furnishing layer)
    planRooms.push({ name, X0: Math.min(X0, X1), X1: Math.max(X0, X1), Y0: Math.min(Y0, Y1), Y1: Math.max(Y0, Y1), floor, ceil });      // (for the finishes)
    if (o.light !== false) { const p = o.pad ?? 0.3; interior(Math.min(X0, X1) - p, Math.max(X0, X1) + p, Math.min(Y0, Y1) - p, Math.max(Y0, Y1) + p, floor - 0.6, ceil + 0.45, { floor, ceil }); }
  };
  const world = (X, Y, h = 0) => { const [x, z] = P(X, Y); return { x, y: g0 + h, z }; };
  // lamp: a light that comes on at dusk (kind 'lamp'), a candle, or a daylight fill ('fill': invisible, by day only)
  const lamp = (X, Y, h, o = {}) => { const p = world(X, Y, h), l = { ...p, power: o.power ?? 1, kind: o.kind ?? 'lamp' }; if (o.halo) l.halo = o.halo; lists.lamps.push(l); return l; };
  const fill = (X, Y, h, power = 1) => lamp(X, Y, h, { power, kind: 'fill' });

  // ---- floors -------------------------------------------------------------------------------------
  // A floor whose top is at h: boards (mat) on top, the ceiling of the room below (under) beneath, and somewhere
  // to stand. holes: [[X0, X1, Y0, Y1], ...] are left open (stairwells); each is recorded as an opening to see through.
  function floor(X0, X1, Y0, Y1, h, o = {}) {
    const mat = o.mat ?? 'floor', thick = o.thick ?? 1, under = o.under === undefined ? 'ceil' : o.under, holes = o.holes ?? [];
    const xs = [...new Set([X0, X1, ...holes.flatMap(q => [q[0], q[1]])])].filter(v => v >= X0 && v <= X1).sort((p, q) => p - q);
    const ys = [...new Set([Y0, Y1, ...holes.flatMap(q => [q[2], q[3]])])].filter(v => v >= Y0 && v <= Y1).sort((p, q) => p - q);
    const open = (x, y) => holes.some(q => x > q[0] && x < q[1] && y > q[2] && y < q[3]);
    for (let i = 0; i < xs.length - 1; i++) {
      // (cells that lie side by side along Y are joined into one piece, so a plain floor is one box)
      let run = null;
      const flush = () => { if (!run) return; const [a, b, c, d] = run; slabs.push({ top: true, mat, a, b, c, d, h0: h - Math.min(0.25, thick), h1: h, o: o.swap ? { swap: true } : undefined }); if (under && thick > 0.25) slabs.push({ mat: under, a, b, c, d, h0: h - thick, h1: h - 0.25 }); if (o.surface !== false) surface(a, b, c, d, h); run = null; };      // (the boards and the ceiling under them are laid at the end, cut to the rooms' finishes: laySlab)
      for (let j = 0; j < ys.length - 1; j++) {
        if (open((xs[i] + xs[i + 1]) / 2, (ys[j] + ys[j + 1]) / 2)) { flush(); continue; }
        if (run) run[3] = ys[j + 1]; else run = [xs[i], xs[i + 1], ys[j], ys[j + 1]];
      }
      flush();
    }
    for (const q of holes) { portal(q[0], q[1], q[2], q[3], h - thick - 0.2, h + 0.2, 'h', 'stair'); wellsOver.push({ X0: q[0], X1: q[1], Y0: q[2], Y1: q[3], under: h - thick }); }
    grow(X0, X1, Y0, Y1);
  }
  // ---- round ends ----------------------------------------------------------------------------------
  // Everything the walker and the lighting know is a box square to the axes. A round or polygonal end is given to
  // them as a few strips that lie inside it: arcRects(X, Y, r, from, to) -> [[X0, X1, Y0, Y1], ...] for the part of
  // the circle of radius r about (X, Y) between the two angles (degrees; 0 along +X, 90 along +Y), as a pie from
  // the centre. floorArc and roomArc use them (cut both ways, so that hardly a sliver is left over); so can anything else.
  function arcRects(X, Y, r, from, to, n = 4, axis = null) {      // axis 'X' or 'Y': which way the strips are cut (default: the way the end bulges)
    const lo = Math.min(from, to) * Math.PI / 180, hi = Math.max(from, to) * Math.PI / 180, mid = (lo + hi) / 2, alongX = axis ? axis === 'X' : Math.abs(Math.cos(mid)) >= Math.abs(Math.sin(mid));
    const inside = (u, v) => { const dx = (alongX ? u : v) - X, dy = (alongX ? v : u) - Y; if (dx * dx + dy * dy > r * r) return false; if (hi - lo >= Math.PI * 2 - 1e-6) return true; let a = Math.atan2(dy, dx); while (a < lo - 1e-9) a += Math.PI * 2; return a <= hi + 1e-9 || dx * dx + dy * dy < 1e-6; };
    const uc = alongX ? X : Y, vc = alongX ? Y : X, S = 96, cuts = [];
    for (let i = 0; i <= S; i++) { const u = uc - r + (2 * r * i) / S; let v0 = Infinity, v1 = -Infinity; for (let j = 0; j <= 240; j++) { const v = vc - r + (2 * r * j) / 240; if (inside(u, v)) { v0 = Math.min(v0, v); v1 = Math.max(v1, v); } } cuts.push([u, v0, v1]); }
    const live = cuts.filter(c => c[2] - c[1] > 0.6); if (live.length < 2) return [];
    const u0 = live[0][0], u1 = live.at(-1)[0], out = [];
    for (let k = 0; k < n; k++) {
      const a = u0 + ((u1 - u0) * k) / n, b2 = u0 + ((u1 - u0) * (k + 1)) / n, mine = live.filter(c => c[0] >= a - 1e-6 && c[0] <= b2 + 1e-6); if (!mine.length) continue;
      const v0 = Math.max(...mine.map(c => c[1])), v1 = Math.min(...mine.map(c => c[2])); if (v1 - v0 < 0.5) continue;
      out.push(alongX ? [a, b2, v0, v1] : [v0, v1, a, b2]);
    }
    return out;
  }
  // The floor of a round end: boards cut to the curve (a fan of n flat pieces), the ceiling below, and strips to stand on.
  function floorArc({ X, Y, r, from, to, h, mat = 'floor', thick = 1, under = 'ceil', n = 16, surface: stand = true }) {
    const a0 = from * Math.PI / 180, da = (to - from) * Math.PI / 180 / n;
    // A complete disk has a perimeter only. A centre vertex on its outline
    // would extrude two coincident radial walls through the slab.
    const full = Math.abs(Math.abs(to - from) - 360) < 1e-6;
    const pts = full ? [] : [[X, Y]];
    for (let i = 0; i < (full ? n : n + 1); i++) pts.push([X + r * Math.cos(a0 + i * da), Y + r * Math.sin(a0 + i * da)]);
    const slabOf = (m, hb, ht) => { const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y))), g = new THREE.ExtrudeGeometry(sh, { depth: ht - hb, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, hb, 0);
      // (texture coordinates as a box's, so that the boards run on unbroken where the round floor meets a straight one:
      // the extrusion's own were mirrored, and the joint showed as a line across the room)
      const q = g.index ? g.toNonIndexed() : g; q.computeVertexNormals(); const pp = q.attributes.position, nn = q.attributes.normal, uv = q.attributes.uv;
      for (let i = 0; i < pp.count; i++) { if (Math.abs(nn.getY(i)) > 0.5) uv.setXY(i, pp.getX(i), pp.getZ(i)); else uv.setXY(i, Math.abs(nn.getX(i)) > Math.abs(nn.getZ(i)) ? pp.getZ(i) : pp.getX(i), pp.getY(i)); }
      L.add(m, q); };      // (x, y) of the outline -> (x, -z): plan
    slabOf(mat, h - Math.min(0.25, thick), h); if (under && thick > 0.25) slabOf(under, h - thick, h - 0.25);
    if (stand) for (const ax of ['X', 'Y']) for (const q of arcRects(X, Y, r, from, to, 6, ax)) surface(q[0], q[1], q[2], q[3], h);
    grow(X - r, X + r, Y - r, Y + r);
  }
  // A room in a round end (or the round part of a room: give it the same name as the rest and it is one room)
  // r is the radius of the wall's inside face; t the wall's thickness (the light's volume is round, and reaches
  // to the middle of the wall).
  const roomArc = (name, { X, Y, r, from, to, floor: fl, ceil, n = 3, t = 1.5 }) => {
    for (const ax of ['X', 'Y']) for (const q of arcRects(X, Y, r, from, to, n, ax)) room(name, q[0], q[1], q[2], q[3], fl, ceil, { light: false });
    const mid = (from + to) / 2 * Math.PI / 180, [x, z] = P(X, Y), [dx, dz] = Dir(Math.cos(mid), Math.sin(mid));
    lists.boxes.push({ round: true, x, z, r: r + t / 2, y0: g0 + fl - 0.6, y1: g0 + ceil + 0.45, dx, dz, cos: Math.cos(Math.min(Math.PI, Math.abs(to - from) / 2 * Math.PI / 180 + 0.02)), floor: g0 + fl, ceil: g0 + ceil });
  };

  const ceiling = (X0, X1, Y0, Y1, h, o = {}) => { slabs.push({ mat: o.mat ?? 'ceil', a: Math.min(X0, X1), b: Math.max(X0, X1), c: Math.min(Y0, Y1), d: Math.max(Y0, Y1), h0: h, h1: h + (o.thick ?? 0.14) }); };

  // ---- stairs -------------------------------------------------------------------------------------
  // One straight flight along plan axis ax, from height h0 at `from` to h1 at `to` (either end may be the higher,
  // and either coordinate the larger), lo..hi wide. Treads and risers in mat; closed: the material filling the space underneath (null leaves it open).
  // Landings are floors (b.floor or b.box with b.surface); winders and spirals are built by hand.
  //   top: true   the flight makes its own top tread (level with h1, over the last run). Otherwise the last run is
  //               left to the floor or landing above, which must cover it.
  //   foot: 3     the solid under a closed flight goes this far down below h0: outside steps stand IN the ground,
  //               which is not level (b.steps does this by itself).
  // Under its last run a flight that makes its own top tread, and any b.steps, is solid like the rest of it, so that
  // nothing can be seen under the top tread or behind the top riser whatever the landing is made of. (An indoor
  // flight without `top` leaves its last run, tread and all, to the floor above.)
  function stair(s) {
    if (s.h1 < s.h0) return stair({ ...s, from: s.to, to: s.from, h0: s.h1, h1: s.h0 });      // (given from the top down: the same flight, from its foot)
    const { ax = 'Y', from, to, lo, hi, h0, h1 } = s, mat = s.mat ?? 'fir', closed = s.closed === undefined ? 'plaster' : s.closed, foot = closed ? (s.foot ?? 0) : 0;
    const N = s.steps ?? Math.max(2, Math.round(Math.abs(h1 - h0) / 0.62)), rise = (h1 - h0) / N, run = (to - from) / N, d = Math.sign(run);
    const bx = (m, u0, u1, a, c, o) => { if (Math.abs(u1 - u0) < 0.004 || c - a < 0.004) return; ax === 'X' ? L.pbox(m, Math.min(u0, u1), Math.max(u0, u1), lo, hi, a, c, o) : L.pbox(m, lo, hi, Math.min(u0, u1), Math.max(u0, u1), a, c, o); };
    for (let i = 0; i < N; i++) {
      const u = from + i * run, top = h0 + (i + 1) * rise, last = i === N - 1, own = !last || s.top === true;      // own: this step's tread is the flight's (the last one is the floor above, unless top: true)
      if (own) bx(mat, u - d * 0.08, u + run, top - 0.1, top, G);                      // tread, with a nosing
      bx(mat, u, u + d * 0.06, top - rise, top - (own ? 0.1 : 0.26), G);              // riser
      if (closed && (own || s.stoop)) {
        bx(closed, u, u + run, h0 - foot, top - rise); bx(closed, u + d * 0.06, u + run, top - rise, top - 0.1);      // (under the riser too: no slits between the steps)
        if (top - h0 > 1.5) { const a = Math.min(u, u + run), c = Math.max(u, u + run); ax === 'X' ? L.block(a, c, lo, hi, h0, top - 0.2) : L.block(lo, hi, a, c, h0, top - 0.2); }
      }
    }
    ramp(ax, from, to, lo, hi, h0, h1);
  }
  // Solid outside steps (a stoop): the same, in stone, standing three feet into the ground.
  const steps = s => stair({ mat: 'limestone_smooth', foot: 3, stoop: true, ...s, closed: s.mat ?? 'limestone_smooth' });

  // ---- rails ------------------------------------------------------------------------------------------
  // A handrail that meets what carries it, level or raking: along plan axis ax from `from` (where the floor, or the
  // pitch line of a flight, is at h0) to `to` (h1; the same as h0 if left out), at `at` across. It is cut to the true
  // length of the slope, runs into a newel post at each end, and stands on balusters.
  //   height   the top of the rail above the floor or the pitch line (2.9)
  //   steps    the flight's number of risers: balusters then stand on its treads, `per` to a tread (2; 0.5 is one to
  //            every second tread)
  //   bal      the spacing of balusters where there are no steps (0.45); 0 for none
  //   ends     [at from, at to]: 'post' (a newel, the default), 'wall' (the rail runs on 0.1 ft, into a wall or
  //            another post), 'none' (it stops)
  //   foot     how far the newel at `from` goes down below h0 (outside: into the ground)
  //   string   true or a material: a raking string board under the balusters, closing the ends of the treads (needs steps);
  //            sw: its thickness (0.11), centred on the rail: enough to take in the treads' ends
  //   mat, w, d (the rail's width and depth), newel, bw (the posts' and balusters' thickness), block: false for no obstacle
  function rail(s) {
    const { ax = 'Y', from, to, at, h0 } = s, h1 = s.h1 ?? h0, mat = s.mat ?? 'fir', H = s.height ?? 2.9, isX = ax === 'X';
    const rw = s.w ?? 0.2, rd = s.d ?? 0.14, nw = s.newel ?? 0.3, bw = s.bw ?? 0.08, ends = s.ends ?? ['post', 'post'], N = s.steps;
    const run = to - from, d = Math.sign(run) || 1, dh = h1 - h0, len = Math.hypot(run, dh), th = Math.atan2(dh, run), cs = Math.abs(run) / len, tan = Math.abs(dh / run);
    const line = u => h0 + dh * (u - from) / run;                                    // the floor, or the flight's pitch line
    const stand = u => (N ? h0 + (Math.min(N - 1, Math.max(0, Math.floor((u - from) / (run / N) + 1e-6))) + 1) * dh / N : line(u));      // what a baluster stands on here
    const bx = (m, u0, u1, w0, w1, a, c, o) => (isX ? L.pbox(m, Math.min(u0, u1), Math.max(u0, u1), at + w0, at + w1, a, c, o) : L.pbox(m, at + w0, at + w1, Math.min(u0, u1), Math.max(u0, u1), a, c, o));
    const rot = isX ? [0, 0, th] : [th, 0, 0];
    // the rail itself: its top H above the line, measured plumb; into the middle of each newel (or 0.15 on, into a wall)
    const ua = from - (ends[0] === 'wall' ? d * 0.1 : 0), ub = to + (ends[1] === 'wall' ? d * 0.1 : 0), um = (ua + ub) / 2, rl = Math.abs(ub - ua) / cs, hm = line(um) + H - rd / cs / 2;
    bx(mat, um - rl / 2, um + rl / 2, -rw / 2, rw / 2, hm - rd / 2, hm + rd / 2, { rot, grain: 'long' });
    // newels
    [[from, ends[0], h0 - (s.foot ?? 0)], [to, ends[1], h1]].forEach(([u, kind, base]) => { if (kind !== 'post') return; bx(mat, u - nw / 2, u + nw / 2, -nw / 2, nw / 2, base, line(u) + H + 0.22, G); bx(mat, u - nw / 2 - 0.04, u + nw / 2 + 0.04, -nw / 2 - 0.04, nw / 2 + 0.04, line(u) + H + 0.22, line(u) + H + 0.3); });
    // balusters: on the treads of a flight, or evenly along a level rail
    const us = [];
    if (s.bal !== 0) {
      const per = s.per ?? 2;
      if (N) for (let i = 0; i < N; i++) { if (per >= 1) for (let k = 0; k < per; k++) us.push(from + (i + (k + 0.56) / per) * run / N); else if ((i + 1) % Math.round(1 / per) === 0) us.push(from + (i + 0.5) * run / N); }
      else { const n = Math.max(1, Math.round(Math.abs(run) / (s.bal ?? 0.45))); for (let k = 1; k < n; k++) us.push(from + run * k / n); }
    }
    for (const u of us) {
      if ((ends[0] === 'post' && Math.abs(u - from) < nw / 2 + bw) || (ends[1] === 'post' && Math.abs(u - to) < nw / 2 + bw)) continue;
      bx(mat, u - bw / 2, u + bw / 2, -bw / 2, bw / 2, stand(u), line(u) + H - rd / cs + bw * tan / 2 + 0.02, G);
    }
    // a string board: from under the treads' inner corners to over their nosings, cut level at the foot; at the head
    // its top runs level, just above the landing (carried on up the slope to the newel it stood a rise above the top
    // tread, a wedge beside the landing). sw: its thickness, which must take in the ends of the treads: with the rail
    // set in from the flight's edge by x, give sw of 2x and a little more, or the treads' ends stand out through it.
    if (s.string && N) {
      const r = dh / N, lo_ = u => line(u) - 0.3, up = u => line(u) + r + 0.12, u0 = from - d * 0.1, uf = from + 0.3 * run / dh, sw = s.sw ?? 0.11;
      const pts = [[u0, h0], [uf, h0], [to, lo_(to)], [to, h1 + 0.12], [to - run / N, h1 + 0.12], [u0, up(u0)]];
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([u, h]) => new THREE.Vector2(u, h))), { depth: sw, bevelEnabled: false });
      if (isX) g.translate(0, 0, -(at + sw / 2)); else { g.rotateY(Math.PI / 2); g.translate(at - sw / 2, 0, 0); }
      L.add(s.string === true ? mat : s.string, g);
    }
    if (s.block !== false) {
      const n = N ?? Math.max(1, Math.ceil(Math.abs(run) / 1.5));
      for (let i = 0; i < n; i++) { const p = from + i * run / n, q = from + (i + 1) * run / n, a = Math.min(p, q), c = Math.max(p, q), b0 = Math.min(line(p), line(q)) - 0.2, b1 = Math.max(line(p), line(q)) + H + 0.5; isX ? L.block(a, c, at - 0.06, at + 0.06, b0, b1) : L.block(at - 0.06, at + 0.06, a, c, b0, b1); }
    }
  }

  // ---- walls -----------------------------------------------------------------------------------------
  // Walls are recorded as they are asked for and built together at the end (finish), when it is known which
  // ends stand free at a corner of the building and which butt into another wall.
  const walls = [], arcs = [];
  const wall = s => { walls.push({ t: 1.5, ...s }); };

  // points along an arch from (u0, spring) up over the crown and down to (u1, spring); off: a ring that far outside it
  function archPts(u0, u1, spring, rise, off = 0, n = 14) {
    const hw = (u1 - u0) / 2, R = (hw * hw + rise * rise) / (2 * rise), cy = spring + rise - R, a = Math.asin(Math.min(1, hw / R)), pts = [];
    for (let i = 0; i <= n; i++) { const t = -a + (2 * a * i) / n; pts.push([(u0 + u1) / 2 + (R + off) * Math.sin(t), cy + (R + off) * Math.cos(t)]); }
    return pts;
  }

  function buildWall(s) {
    const t = s.t, fl = s.fl ?? s.h0, isX = s.ax === 'X', c = s.c;
    const W = (u0, u1, h0, h1, w0, w1, mat, o) => { if (u1 - u0 < 0.004 || h1 - h0 < 0.004) return; isX ? L.pbox(mat, u0, u1, c + Math.min(w0, w1), c + Math.max(w0, w1), h0, h1, o) : L.pbox(mat, c + Math.min(w0, w1), c + Math.max(w0, w1), u0, u1, h0, h1, o); };
    const BACK = sg => ({ ...G, skip: [isX ? [0, 0, sg] : [-sg, 0, 0]] });      // joinery on the face of the wall on side sg: no back, which lay in the plaster's plane
    // a flat piece cut to an outline in the wall's own plane ([[u, h], ...]), from w0 to w1 across the wall
    const slab = (mat, pts, w0, w1) => {
      const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts.map(([u, h]) => new THREE.Vector2(u, h))), { depth: Math.abs(w1 - w0), bevelEnabled: false, curveSegments: 1 });
      if (isX) g.translate(0, 0, -(c + Math.max(w0, w1))); else { g.rotateY(Math.PI / 2); g.translate(c + Math.min(w0, w1), 0, 0); }
      L.add(mat, g);
    };
    // Does the next storey's wall stand on this one's top, over the whole of u0..u1 and w0..w1 (across: absolute)? Not
    // where it has an opening down to its foot with nothing in it (a window to the floor, or no threshold).
    const capped = (u0, u1, w0, w1) => walls.some(o => o !== s && o.ax === s.ax && Math.abs(o.h0 - s.h1) < 0.01 && o.a <= u0 + 0.01 && o.b >= u1 - 0.01 && o.c - o.t / 2 <= w0 + 0.01 && o.c + o.t / 2 >= w1 - 0.01
      && !(o.opens ?? []).some(p => p.at < u1 && p.at + p.w > u0 && (o.fl ?? o.h0) + (p.sill ?? 0) < o.h0 + 0.01 && (p.kind === 'win' || p.threshold === false)));
    const blockU = (u0, u1, h0, h1, half = t / 2) => (isX ? L.block(u0, u1, c - half, c + half, h0, h1) : L.block(c - half, c + half, u0, u1, h0, h1));
    const mn = s.neg ?? null, mp = s.pos ?? null, one = mn === mp || !mn || !mp;
    const outSg = s.outside === 'neg' ? -1 : s.outside === 'pos' ? 1 : (mn && mp && INTERIOR.test(mn) !== INTERIOR.test(mp)) ? (INTERIOR.test(mn) ? 1 : -1) : 0;      // which face is the weather's (0: neither)
    const trim = s.trim ?? 'limestone_smooth', wood = s.wood ?? 'fir', sashM = s.sash ?? 'sash';

    // The finished rooms each plastered face looks into (b.finishes): where there are any, the wall's pieces are made
    // by `finished`, leaf by leaf, of those rooms' dados, fields and friezes.
    const declOf = sd => (one ? mn ?? mp : sd < 0 ? mn : mp), FACE = { [-1]: [], 1: [] };
    if (FIN) for (const sd of [-1, 1]) if (/^plaster/.test(declOf(sd) ?? '')) FACE[sd] = facing(s.ax, c + sd * t / 2, sd, s.a, s.b, s.h0, s.h1);
    const fin = FACE[-1].length + FACE[1].length > 0;
    const leafRects = (sd, a, e, h0, h1) => {      // one leaf from a to e: [[u0, u1, h0, h1, material], ...]
      const F = FACE[sd], decl = declOf(sd); if (!F.length) return [[a, e, h0, h1, decl]];
      const xs = [...new Set([a, e, ...F.flatMap(q => [q.ua, q.ub])])].filter(v => v >= a && v <= e).sort((p, q) => p - q), out = [];
      let prev = null;
      for (let i = 0; i < xs.length - 1; i++) {
        if (xs[i + 1] - xs[i] < 0.004) continue;
        const bands = skin(F, (xs[i] + xs[i + 1]) / 2, h0, h1, decl), key = bands.join(';');
        if (prev && prev.key === key) prev.e = xs[i + 1]; else out.push(prev = { a: xs[i], e: xs[i + 1], bands, key });
      }
      return out.flatMap(p => p.bands.map(([ha, hb, m]) => [p.a, p.e, ha, hb, m]));
    };
    const finished = (u0, u1, h0, h1) => {
      const so = outSg || -1, mo = one ? mn ?? mp : so > 0 ? mp : mn;
      for (const sd of [-1, 1]) {
        const outer = one || sd === so, a = outer ? u0 : Math.max(u0, inner[0]), e = outer ? u1 : Math.min(u1, inner[1]);
        for (const [ua, ub, ha, hb, m] of leafRects(sd, a, e, h0, h1)) {      // (without the face between the leaves, or those between one band and the next)
          const w0 = c + Math.min(0, sd * t / 2), w1 = c + Math.max(0, sd * t / 2);
          const skip = [isX ? [0, 0, sd] : [-sd, 0, 0]]; if (ha > h0 + 0.004 || ha < s.h0 + 0.004) skip.push([0, -1, 0]);      // (nor the foot of the wall, which stands on something,
          if (hb < h1 - 0.004 || (hb > s.h1 - 0.004 && capped(ua, ub, w0, w1))) skip.push([0, 1, 0]);                       // nor the top of a band with another on it, or of a wall with the next storey's standing on it)
          isX ? partBox(m, ua, ub, w0, w1, ha, hb, skip) : partBox(m, w0, w1, ua, ub, ha, hb, skip);
        }
        if (!outer) { W(u0, Math.min(u1, inner[0]), h0, h1, 0, sd * t / 2, mo); W(Math.max(u0, inner[1]), u1, h0, h1, 0, sd * t / 2, mo); }
      }
      blockU(u0, u1, h0, h1);
    };
    const finishedSlab = pts => {      // the wall over an arch: cut level where one band of a face gives way to the next
      const us = pts.map(p => p[0]), hs = pts.map(p => p[1]), um = (Math.min(...us) + Math.max(...us)) / 2, lo = Math.min(...hs), hi = Math.max(...hs);
      for (const sd of [-1, 1]) {
        const bands = FACE[sd].length ? skin(FACE[sd], um, lo, hi, declOf(sd)) : [[lo, hi, declOf(sd)]];
        for (const [ha, hb, m] of bands) { const q = bands.length === 1 ? pts : clipH(clipH(pts, ha, 1), hb, -1); if (q.length > 2) slab(m, q, 0, sd * t / 2); }
      }
    };

    // Where an outside wall ends free at a corner, its inner leaf stops half a wall short and the outside material
    // turns the corner in its place: otherwise the end of the plaster shows as a stripe up the corner outside.
    const inner = [s.a, s.b];
    if (!one && outSg) {
      const iw = c - outSg * t / 4, hm = (s.h0 + s.h1) / 2;
      const covered = u => walls.some(o => o !== s && hm > o.h0 && hm < o.h1 && (o.ax === s.ax
        ? Math.abs(o.c - c) < (o.t + t) / 2 && u > o.a && u < o.b
        : u > o.c - o.t / 2 && u < o.c + o.t / 2 && iw > o.a && iw < o.b))
        || arcs.some(o => { if (hm < o.h0 || hm > o.h1) return false; const px = (isX ? u : iw) - o.X, py = (isX ? iw : u) - o.Y, d = Math.hypot(px, py); if (Math.abs(d - o.r) > o.t) return false; let a = Math.atan2(py, px); while (a < o.lo - 0.15) a += Math.PI * 2; return a < o.hi + 0.15; });      // (a straight wall running into a round one)
      if (!covered(s.a - 0.05)) inner[0] = s.a + t / 2;
      if (!covered(s.b + 0.05)) inner[1] = s.b - t / 2;
    }
    const piece = (u0, u1, h0, h1) => {
      if (u1 - u0 < 0.01 || h1 - h0 < 0.01) return;
      if (fin) return finished(u0, u1, h0, h1);
      if (h1 > s.h1 - 0.004 && capped(u0, u1, c - t / 2, c + t / 2)) {      // (the storey above stands on it: its top is not drawn, it lay in the plane of the floor that runs in under that wall)
        const cut = (a, e, w0, w1, m) => { if (e - a > 0.004) isX ? partBox(m, a, e, c + Math.min(w0, w1), c + Math.max(w0, w1), h0, h1, [[0, 1, 0]]) : partBox(m, c + Math.min(w0, w1), c + Math.max(w0, w1), a, e, h0, h1, [[0, 1, 0]]); };
        blockU(u0, u1, h0, h1);
        if (one) return cut(u0, u1, -t / 2, t / 2, mn ?? mp);
        const mo = outSg > 0 ? mp : mn, mi = outSg > 0 ? mn : mp, so = outSg || -1;
        cut(u0, u1, 0, so * t / 2, mo); cut(Math.max(u0, inner[0]), Math.min(u1, inner[1]), -so * t / 2, 0, mi);
        cut(u0, Math.min(u1, inner[0]), -so * t / 2, 0, mo); cut(Math.max(u0, inner[1]), u1, -so * t / 2, 0, mo);
        return;
      }
      if (one) return W(u0, u1, h0, h1, -t / 2, t / 2, mn ?? mp, { collide: true });
      const mo = outSg > 0 ? mp : mn, mi = outSg > 0 ? mn : mp, so = outSg || -1;      // (two inside faces: neg counts as "outer", nothing is cut)
      W(u0, u1, h0, h1, 0, so * t / 2, mo, { collide: true });
      const a = Math.max(u0, inner[0]), b = Math.min(u1, inner[1]);
      W(a, b, h0, h1, -so * t / 2, 0, mi, { collide: true });
      W(u0, Math.min(u1, inner[0]), h0, h1, -so * t / 2, 0, mo, { collide: true }); W(Math.max(u0, inner[1]), u1, h0, h1, -so * t / 2, 0, mo, { collide: true });
    };
    const leafSlab = (pts) => { if (fin) return finishedSlab(pts); if (one) slab(mn ?? mp, pts, -t / 2, t / 2); else { slab(mn, pts, -t / 2, 0); slab(mp, pts, 0, t / 2); } };

    const opens = [...(s.opens ?? [])].sort((p, q) => p.at - q.at), runs = [];
    let u = s.a;
    for (const o of opens) {
      const u0 = o.at, u1 = o.at + o.w, hs = fl + (o.sill ?? 0), hh = fl + o.head;
      const rise = o.arch === true ? o.w / 2 : (o.arch || 0), spring = hh - rise;
      piece(u, u0, s.h0, s.h1); if (u0 > u) runs.push([u, u0]);
      // An opening you walk through has a floor of its own, the threshold (made in fit, below). The wall under it
      // stops short of the floor: carried up to it, its top lay in the plane of the floors that run in under the wall.
      const thr = o.kind !== 'win' && Math.abs(hs - fl) < 0.01 && o.threshold !== false;
      if (hs > s.h0) { piece(u0, u1, s.h0, thr ? hs - TH.deep : hs); if (o.kind === 'win') runs.push([u0, u1]); }
      if (rise > 0) { if (s.h1 > spring + 0.01) leafSlab([[u0, spring], ...archPts(u0, u1, spring, rise).slice(1, -1), [u1, spring], [u1, s.h1], [u0, s.h1]]); blockU(u0, u1, spring, s.h1); }
      else piece(u0, u1, hh, s.h1);
      fit(o, u0, u1, hs, hh, rise, spring, thr);
      u = u1;
    }
    piece(u, s.b, s.h0, s.h1); if (s.b > u) runs.push([u, s.b]);
    grow(...(isX ? [s.a, s.b, c - t / 2, c + t / 2] : [c - t / 2, c + t / 2, s.a, s.b]));

    // skirting along the foot of every plastered face
    if (s.base !== false) for (const [sg, m] of [[-1, mn], [1, mp]]) {
      if (!m || (!/^plaster/.test(m) && !(s.skirting && sg !== outSg))) continue;
      const f = sg * t / 2;
      // (it stops just inside the plinth blocks of a doorcase: run on to the opening, its end lay in the plane of the plinth's face in the reveal)
      const plinth = sg !== outSg ? opens.filter(o => o.kind !== 'win' && o.trim !== false && Math.abs(o.sill ?? 0) < 0.01) : [], P0 = new Set(plinth.map(o => o.at)), P1 = new Set(plinth.map(o => o.at + o.w));
      // (and where its run ends inside a wall that crosses this one, at that wall's face: carried on to this wall's end it
      // came out through the far face of the other, a sliver of skirting in its plaster, or stood in its skirting)
      const wv = c + f + sg * 0.03, hm = fl + 0.3, across = walls.filter(o => o !== s && o.ax !== s.ax && o.a < wv && o.b > wv && o.h0 < hm && o.h1 > hm);
      for (const [r0, r1] of runs) {
        let a = one || sg === outSg ? r0 : Math.max(r0, inner[0]), b = one || sg === outSg ? r1 : Math.min(r1, inner[1]); if (P1.has(r0)) a = Math.max(a, r0 + 0.365); if (P0.has(r1)) b = Math.min(b, r1 - 0.365);
        for (const o of across) { const lo = o.c - o.t / 2, hi = o.c + o.t / 2; if (b > lo + 0.001 && b < hi + 0.01 && a < lo) b = lo; if (a < hi - 0.001 && a > lo - 0.01 && b > hi) a = hi; }
        if (b - a > 0.004) W(a, b, fl, fl + 0.6, f, f + sg * 0.055, s.base ?? wood, BACK(sg));
      }
    }

    // a finished room's dado rail and picture rail on this wall: each stops inside the casings of whatever opening
    // crosses its height (and inside the ring of an arch), as the skirting stops in the plinths
    if (fin) for (const sd of [-1, 1]) for (const q of FACE[sd]) {
      const f = sd * t / 2, [ia, ib] = one || sd === outSg ? [s.a, s.b] : inner;
      for (const [H, m, lo, hi, d] of [[q.fin.dado && q.base + q.fin.dado[0], q.fin.rail ?? wood, -0.02, 0.12, 0.045], [q.fin.frieze && q.base + q.fin.frieze[0], q.fin.picture ?? wood, -0.1, 0.02, 0.04]]) {
        if (!H || !m || H + lo < Math.max(s.h0, q.r.floor) || H + hi > Math.min(s.h1, q.r.ceil)) continue;
        let spans = [[Math.max(q.ua, ia), Math.min(q.ub, ib)]];
        for (const o of opens) {
          const u0 = o.at, u1 = o.at + o.w, hs = fl + (o.sill ?? 0), hh = fl + o.head, rise = o.arch === true ? o.w / 2 : (o.arch || 0), spring = hh - rise;
          if (H + hi <= hs - 0.15 || H + lo >= hh + (rise > 0 ? 0.36 : o.kind === 'win' ? 0.42 : 0.68) - 0.005) continue;
          let c0 = u0 - (o.trim === false ? 0 : 0.2), c1 = u1 + (o.trim === false ? 0 : 0.2);
          if (rise > 0 && H + lo > spring) { const hw = o.w / 2, R = (hw * hw + rise * rise) / (2 * rise), dy = H + lo - (spring + rise - R), half = Math.sqrt(Math.max(0, (R + 0.2) ** 2 - dy * dy)); c0 = (u0 + u1) / 2 - half; c1 = (u0 + u1) / 2 + half; }
          spans = spans.flatMap(([a, e]) => [[a, Math.min(e, c0)], [Math.max(a, c1), e]]).filter(([a, e]) => e - a > 0.02);
        }
        for (const [a, e] of spans) if (e - a > 0.02) W(a, e, H + lo, H + hi, f, f + sd * d, m, BACK(sd));
      }
    }

    // ---- a doorcase: the joinery round a doorway on a room's face -------------------------------------------
    // An architrave 0.36 wide in three members (a bead at the opening, a flat fascia, a back band that stands proudest)
    // on plinth blocks that the skirting butts against; round the head of an arch the same three as rings. Over a
    // flat head, where there is wall for it, `case` on the opening (or `doorcase` on the wall) chooses:
    //   'cornice' (the default)  the architrave turned across, then a frieze, a bed mould and a cap
    //   'blocks'                 corner blocks with a turned roundel, the architrave between them
    //   'plain'                  the architrave turned across, nothing more
    //   'jambs'                  nothing over the head (a ceiling comes down close over it)
    // Nothing reaches further than 0.39 beyond the jambs below the head (a brass plate hangs beside most doors),
    // nor higher than 0.68 above it.
    function doorcase(o, sg, f, u0, u1, hs, hh, rise, spring) {
      const kind = o.case ?? s.doorcase ?? 'cornice', room = s.h1 - hh, flat = !(rise > 0) && room > 0.45 && kind !== 'jambs', blocks = flat && kind === 'blocks';
      const P = (a, b, h0, h1, d) => W(Math.min(a, b), Math.max(a, b), h0, h1, f, f + sg * d, wood, BACK(sg));
      const ring = (m, off0, off1, w0, w1) => slab(m, [...archPts(u0, u1, spring, rise, off1), ...archPts(u0, u1, spring, rise, off0).reverse()], w0, w1);
      const foot = Math.abs(hs - fl) < 0.01 ? hs + 0.74 : hs;      // (an opening with a sill has no plinths)
      const [tb, tf, tk] = flat && !blocks ? [hh, hh + 0.05, hh + 0.29] : [spring, spring, spring];      // how far up each member of a jamb goes: under a turned head they run on to meet it
      for (const [e, d] of [[u0, -1], [u1, 1]]) {
        if (foot > hs) P(e, e + d * 0.385, hs, foot, 0.14);
        P(e, e + d * 0.05, foot, tb, 0.095); P(e + d * 0.05, e + d * 0.29, foot, tf, 0.07); P(e + d * 0.29, e + d * 0.36, foot, tk, 0.12);
      }
      if (rise > 0) { ring(wood, 0, 0.05, f, f + sg * 0.095); ring(wood, 0.05, 0.29, f, f + sg * 0.07); ring(wood, 0.29, 0.36, f, f + sg * 0.12); return; }
      if (!flat) return;
      const [a, b] = blocks ? [u0, u1] : [u0 - 0.05, u1 + 0.05];
      P(a, b, hh, hh + 0.05, 0.095); P(blocks ? a : u0 - 0.29, blocks ? b : u1 + 0.29, hh + 0.05, hh + 0.29, 0.07); P(blocks ? a : u0 - 0.36, blocks ? b : u1 + 0.36, hh + 0.29, hh + 0.36, 0.12);
      if (blocks) for (const [e, d] of [[u0, -1], [u1, 1]]) {
        P(e, e + d * 0.385, hh, hh + 0.385, 0.14);
        const g = new THREE.CylinderGeometry(0.12, 0.12, 0.03, 8), uc = e + d * 0.1925, wc = c + f + sg * 0.155;      // the roundel
        if (isX) { g.rotateX(Math.PI / 2); g.translate(uc, hh + 0.1925, -wc); } else { g.rotateZ(Math.PI / 2); g.translate(wc, hh + 0.1925, -uc); }
        L.add(wood, g);
      } else if (kind === 'cornice' && room > 0.8) {
        P(u0 - 0.36, u1 + 0.36, hh + 0.36, hh + 0.54, 0.07); P(u0 - 0.39, u1 + 0.39, hh + 0.54, hh + 0.6, 0.13); P(u0 - 0.43, u1 + 0.43, hh + 0.6, hh + 0.68, 0.19);
      }
    }

    // ---- what goes in an opening --------------------------------------------------------------------
    function fit(o, u0, u1, hs, hh, rise, spring, thr) {
      isX ? portal(u0, u1, c - t / 2, c + t / 2, hs, hh, 'Y', o.kind === 'win' ? 'win' : 'door') : portal(c - t / 2, c + t / 2, u0, u1, hs, hh, 'X', o.kind === 'win' ? 'win' : 'door');
      const ring = (m, off0, off1, w0, w1) => slab(m, [...archPts(u0, u1, spring, rise, off1), ...archPts(u0, u1, spring, rise, off0).reverse()], w0, w1);
      // trim: stone outside (a sill under a window; a lintel, or the ring of an arch), wood casing inside
      for (const [sg, m] of [[-1, mn], [1, mp]]) {
        if (!m || o.trim === false) continue;
        const f = sg * t / 2 + (sg > 0 ? o.liningPos ?? 0 : 0);
        if (!o.lined && (sg === outSg || !INTERIOR.test(m))) {
          const tm = o.trim ?? trim;
          if (o.kind === 'win' && hs > s.h0 + 0.3) W(u0 - 0.3, u1 + 0.3, hs - 0.38, hs + 0.02, f, f + sg * 0.3, tm);
          if (rise > 0) ring(tm, 0, 0.85, f, f + sg * 0.09); else if (s.h1 > hh + 0.9) W(u0 - 0.45, u1 + 0.45, hh - 0.02, hh + 0.95, f, f + sg * 0.09, tm);
        } else if (o.kind === 'win') {
          for (const [a, b] of [[u0 - 0.36, u0], [u1, u1 + 0.36]]) W(a, b, hs, spring, f, f + sg * 0.07, wood, BACK(sg));
          if (rise > 0) ring(wood, 0, 0.36, f, f + sg * 0.07); else if (s.h1 > hh + 0.45) W(u0 - 0.5, u1 + 0.5, hh, hh + 0.42, f, f + sg * 0.09, wood, BACK(sg));
          W(u0 - 0.44, u1 + 0.44, hs - 0.12, hs + 0.02, f, f + sg * 0.24, wood, G);
        } else doorcase(o, sg, f, u0, u1, hs, hh, rise, spring);
      }
      // The threshold: one piece from jamb to jamb and a little beyond both faces of the wall, standing TH.up proud of
      // the floors. It is the only thing that lies in the doorway: the wall below stops under it, and whatever floors
      // run in under the wall (or stop short of it) are covered. Stone in an outside wall, the wall's wood indoors;
      // `threshold: <material>` on the opening for another, `threshold: false` for none.
      if (thr) {
        const stone = (outSg && !o.inside) || !(INTERIOR.test(mn ?? mp) || INTERIOR.test(mp ?? mn)), e = t / 2 + TH.out;
        W(u0, u1, fl - TH.deep, fl + TH.up, -e, e, typeof o.threshold === 'string' ? o.threshold : stone ? (typeof o.trim === 'string' ? o.trim : trim) : wood, stone ? undefined : G);
        isX ? surface(u0, u1, c - e, c + e, fl + TH.up) : surface(c - e, c + e, u0, u1, fl + TH.up);
      }
      if (o.kind === 'cased') {
        if (o.lined) {
          const depth = t / 2 + 0.024;
          W(u0, u0 + 0.09, hs, hh, -depth, depth, wood, G);
          W(u1 - 0.09, u1, hs, hh, -depth, depth, wood, G);
          W(u0 + 0.09, u1 - 0.09, hh - 0.09, hh, -depth, depth, wood, G);
        }
        return;
      }

      if (o.kind === 'win') {
        blockU(u0, u1, fl, hh, 0.1);
        if (outSg && hs - 0 < 12 && !o.inside) { const mid = (u0 + u1) / 2, [x, z] = isX ? P(mid, c + outSg * t / 2) : P(c + outSg * t / 2, mid), [nx, nz] = isX ? Dir(0, outSg) : Dir(outSg, 0); lists.windows.push({ x, z, nx, nz, w: o.w, y: g0 }); }
        // frame, mullions between the lights, a transom at the springing of an arch, glazing bars, glass
        const r = 0.14, d0 = -0.07, d1 = 0.07, n = o.n ?? 1, top = rise > 0 ? spring : hh - r;
        W(u0, u0 + r, hs, top, d0, d1, sashM, G); W(u1 - r, u1, hs, top, d0, d1, sashM, G); W(u0 + r, u1 - r, hs, hs + r, d0, d1, sashM, G);
        if (rise > 0) { ring(sashM, -r, 0, d0, d1); W(u0 + r, u1 - r, spring - 0.06, spring + 0.06, -0.05, 0.05, sashM, G); } else W(u0 + r, u1 - r, hh - r, hh, d0, d1, sashM, G);
        const lw = (u1 - u0 - 2 * r) / n;
        for (let i = 1; i < n; i++) W(u0 + r + i * lw - 0.07, u0 + r + i * lw + 0.07, hs + r, top, d0, d1, sashM, G);
        const [cols, rows] = o.bars ?? [1, 2];
        for (let i = 0; i < n; i++) {
          const a = u0 + r + i * lw + (i ? 0.07 : 0), b = u0 + r + (i + 1) * lw - (i < n - 1 ? 0.07 : 0);
          for (let q = 1; q < cols; q++) W(a + ((b - a) * q) / cols - 0.025, a + ((b - a) * q) / cols + 0.025, hs + r, top, -0.035, 0.035, sashM, G);
          for (let q = 1; q < rows; q++) W(a, b, hs + r + ((top - hs - r) * q) / rows - 0.03, hs + r + ((top - hs - r) * q) / rows + 0.03, -0.04, 0.04, sashM, G);
        }
        // (the glass runs 0.03 into the frame all round: cut to the frame's inside, its edges lay in the planes of the frame's faces)
        const gi = r - 0.03;
        if (rise > 0) slab('glass', [[u0 + gi, hs + gi], [u1 - gi, hs + gi], [u1 - gi, spring], ...archPts(u0, u1, spring, rise, -gi).reverse().slice(1, -1), [u0 + gi, spring]], -0.01, 0.01);
        else W(u0 + gi, u1 - gi, hs + gi, hh - gi, -0.01, 0.01, 'glass');
        return;
      }

      // A door: a frame, one leaf or a pair (made by doors.js and hung by life.js, so they open), and fixed glass
      // over it: in the head of an arch, or as a transom light (`transom`: the height of the bar's underside above
      // the floor, or true for 6.9 ft) where a tall storey leaves room for one, as the schools of the 1880s had.
      //   style     which door (doors.js, STYLES): by default a glazed pair is 'french', a single glazed door 'half',
      //             an outer door 'six', any other 'four'; `doorstyle` on the wall changes the default for its doors
      //   kick, push, metal   plates on the leaf, and what its furniture is made of ('brass', 'bronze', 'iron')
      //   headBars  upright glazing bars in the head of an arch: a number of equal lights, or where they stand as
      //             fractions of the width (a glazed pair has one, in the middle); dentils: a dentil course on the
      //             head of the frame outside
      const J = 0.12, lt = rise > 0 ? spring : hh, leaves = o.leaves ?? 1;
      const tr = rise > 0 || !o.transom ? 0 : o.transom === true ? 6.9 : o.transom, top = tr && hh - fl - tr > 0.8 ? fl + tr : lt;      // top: the top of the leaves' own opening
      const depth = o.lined ? t / 2 + 0.024 : 0.16;
      const innerDepth = depth + (o.liningPos ?? 0);
      W(u0, u0 + J, fl, lt, -depth, innerDepth, wood, G); W(u1 - J, u1, fl, lt, -depth, innerDepth, wood, G); W(u0 + J, u1 - J, lt - 0.09, lt, -depth, innerDepth, wood, G);
      const bars = (a, b, h0, h1, list) => { for (const q of list) W(a + (b - a) * q - 0.026, a + (b - a) * q + 0.026, h0, typeof h1 === 'function' ? h1(a + (b - a) * q) : h1, -0.04, 0.04, wood, G); };
      if (top < lt) {
        // the transom: a bar that stands proud of the frame, a light over it with a margin of small panes
        const g0_ = top + 0.13, g1 = hh - 0.09, a = u0 + J, b = u1 - J, m = Math.min(0.34, (b - a) * 0.16), cross = g1 - g0_ > 1.05;
        W(a, b, top - 0.09, g0_, -0.2, 0.2, wood, G); W(a - 0.03, b + 0.03, g0_ - 0.03, g1 + 0.03, -0.01, 0.01, 'glass');      // (the bar comes down to just over the leaves, as the head of the frame does)
        bars(a, b, g0_, g1, [m / (b - a), 1 - m / (b - a)]);
        if (cross) for (const h of [g0_ + 0.26, g1 - 0.26]) for (const [p, q] of [[a, a + m - 0.026], [a + m + 0.026, b - m - 0.026], [b - m + 0.026, b]]) W(p, q, h - 0.026, h + 0.026, -0.04, 0.04, wood, G);
      }
      if (rise > 0) {
        ring(wood, -J, 0, -0.16, 0.16); slab('glass', [[u0 + J - 0.03, spring - 0.03], [u1 - J + 0.03, spring - 0.03], ...archPts(u0, u1, spring, rise, -J + 0.03).reverse().slice(1, -1)], -0.01, 0.01);      // (its foot let into the head of the frame, its edges into the frame)
        const hw = (u1 - u0) / 2, R = (hw * hw + rise * rise) / (2 * rise), under = u => spring + rise - R + Math.sqrt(Math.max(0, (R - J) ** 2 - (u - (u0 + u1) / 2) ** 2));      // the underside of the frame's ring
        const hb = o.headBars ?? (o.kind === 'gdoor' && leaves === 2 ? 2 : 0), list = Array.isArray(hb) ? hb : Array.from({ length: Math.max(0, hb - 1) }, (_, i) => (i + 1) / hb);
        bars(u0 + J, u1 - J, spring, u => Math.min(under(u - 0.026), under(u + 0.026)) + 0.03, list);
        if (o.dentils && outSg) { const n = Math.floor((u1 - u0 - 2 * J) / 0.15), d = (u1 - u0 - 2 * J) / n, w0 = outSg * 0.16, w1 = outSg * 0.205;
          for (let i = 0; i < n; i++) W(u0 + J + i * d + d * 0.25, u0 + J + i * d + d * 0.75, spring - 0.085, spring - 0.01, w0, w1, wood, G);
          W(u0 + J, u1 - J, spring - 0.01, spring + 0.06, w0, outSg * 0.23, wood, G); }
      }
      const w = wbox(...(isX ? [u0, u1, c - 0.1, c + 0.1] : [c - 0.1, c + 0.1, u0, u1]), fl, top);
      const stop = { x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1, y0: w.y0, y1: w.y1 };
      B.colliders.push(stop);
      const sg = o.swing === 'neg' ? -1 : 1, ang = o.angle ?? 1.62, lwid = (o.w - 2 * J) / leaves, exterior = !o.inside && !!outSg;
      const style = o.style ?? s.doorstyle ?? (o.kind === 'gdoor' ? (leaves === 2 ? 'french' : 'half') : exterior ? 'six' : 'four');
      for (let i = 0; i < leaves; i++) {
        const atB = leaves === 2 ? i === 1 : o.hinge === 'b', hu = atB ? u1 - J : u0 + J;
        const base = (isX ? 0 : Math.PI / 2) + (atB ? Math.PI : 0), turn = (isX ? 1 : -1) * (atB ? -1 : 1) * sg * ang;
        const [hx, hz] = isX ? P(hu, c) : P(c, hu);
        lists.doors.push({ x: hx, z: hz, closed: base + th, open: base + turn + th, w: lwid - (leaves === 2 ? 0.008 : 0.03),      // (the leaves of a pair meet: at 0.03 short each, daylight showed between them; the astragal on one of them covers what is left)
          y0: g0 + fl + (thr ? TH.up + 0.02 : 0.03), y1: g0 + top - 0.11, glassy: o.kind === 'gdoor', stop,
          cx: (stop.x0 + stop.x1) / 2, cz: (stop.z0 + stop.z1) / 2, fixed: o.fixed ?? false, initialOpen: o.initialOpen, exterior, site: site.id, pair: leaves === 2 ? i : undefined, wood: o.leaf ?? s.wood,      // (wood: what the leaf is made of: the opening's `leaf`, else the wall's `wood`, else life.js's dark fir)
          style, fit: { kick: o.kick, push: o.push, metal: o.metal } });
      }
    }
  }

  // ---- a curved wall, in flat facets (the round end of a room; a polygonal bay or apse) ---------------------
  // Centre (X, Y), radius r to the middle of the wall, from angle `from` to `to` in degrees (0 points along +X,
  // 90 along +Y, into the building), n facets. out, in: the materials of its two faces. opens: [{ i, sill, head,
  // margin }] puts a flat-headed window in facet i (heights above fl). Arched heads here are built by hand.
  function arcWall(s) {
    const { X, Y, r, h0, h1 } = s, t = s.t ?? 1.5, n = s.n ?? 12, fl = s.fl ?? h0, a0 = (s.from * Math.PI) / 180, da = ((s.to - s.from) * Math.PI) / 180 / n, flip = da < 0 ? -1 : 1;
    const sinHalf = Math.sin(Math.abs(da) / 2), cosHalf = Math.cos(da / 2);
    const len = 2 * (r + t / 2) * sinHalf, trim = s.trim ?? 'limestone_smooth', sashM = s.sash ?? 'sash';
    arcs.push({ X, Y, r, t, h0, h1, lo: Math.min(s.from, s.to) * Math.PI / 180, hi: Math.max(s.from, s.to) * Math.PI / 180 });
    for (let i = 0; i < n; i++) {
      const phi = a0 + (i + 0.5) * da, cx = X + r * cosHalf * Math.cos(phi), cy = Y + r * cosHalf * Math.sin(phi), o = (s.opens ?? []).find(q => q.i === i);
      // a box in the facet's own frame: u along it, w across (out is +), then turned and set in place
      const F = (mat, u0, u1, a, b, w0, w1) => {
        if (!mat || u1 - u0 < 0.004 || b - a < 0.004) return;
        const g = new THREE.BoxGeometry(u1 - u0, b - a, w1 - w0).toNonIndexed(), p = g.attributes.position, nn = g.attributes.normal, uv = g.attributes.uv;
        g.translate((u0 + u1) / 2, (a + b) / 2, (w0 + w1) / 2);
        for (let q = 0; q < p.count; q++) { const side = Math.abs(nn.getX(q)) > 0.5, topF = Math.abs(nn.getY(q)) > 0.5; uv.setXY(q, side ? p.getZ(q) : p.getX(q) + i * len * flip, topF ? p.getZ(q) : p.getY(q)); }
        // A piece that reaches a joint with the next facet is mitred there: its end turned to the line through the
        // centre, so that the two meet without overlapping. (Square ends, cut to the length of the outer face, overlapped
        // in a wedge at every joint, and the overlapping tops and soffits lay in one plane.)
        // Set each leaf's ends on its radius. Adjacent stretches can have
        // different facet angles, but share the same radial edge.
        for (let q = 0; q < p.count; q++) {
          const x = p.getX(q), w = p.getZ(q);
          if (Math.abs(Math.abs(x) - h) < 1e-5) p.setX(q, Math.sign(x) * (r + w) * sinHalf);
          p.setZ(q, w * cosHalf);
        }
        g.rotateY(phi + Math.PI / 2); g.translate(cx, 0, -cy); L.add(mat, g);
      };
      // (s.skin: the 'out' leaf only that thick, the rest of the wall the 'in' material: so that a window's reveal shows one
      // stone and a thin edge of lining, not two materials half and half with the frame as a third)
      const sk = s.skin ?? t / 2, leaf = (u0, u1, a, b) => { F(s.out, u0, u1, a, b, t / 2 - sk, t / 2); F(s.in ?? s.out, u0, u1, a, b, -t / 2, t / 2 - sk); };
      const h = len / 2;
      if (s.dado || s.skirting) {
        const band = (u0, u1, limit) => {
          const end = Math.min(limit, fl + (s.dado ? 3.3 : 0.6));
          F(s.dado?.[0] ?? s.trim, u0, u1, fl, end, t / 2, t / 2 + 0.06);
          if (s.dado && end + 0.1 <= limit) F(s.dado[1], u0, u1, end, end + 0.12, t / 2, t / 2 + 0.10);
        };
        if (o) {
          const margin = o.margin ?? 0.5;
          band(-h, -h + margin, h1); band(h - margin, h, h1);
          band(-h + margin, h - margin, fl + o.sill - 0.32);
        } else band(-h, h, h1);
      }
      if (!o) leaf(-h, h, h0, h1);
      else {
        const m = o.margin ?? 0.5, hs = fl + (o.sill ?? 0), hh = fl + o.head, e = 0.13;
        leaf(-h, -h + m, h0, h1); leaf(h - m, h, h0, h1); leaf(-h + m, h - m, h0, hs); leaf(-h + m, h - m, hh, h1);
        F(trim, -h + m - 0.25, h - m + 0.25, hs - 0.36, hs + 0.02, t / 2, t / 2 + 0.28); F(trim, -h + m - 0.3, h - m + 0.3, hh - 0.02, Math.min(h1, hh + 0.9), t / 2, t / 2 + 0.09);
        F(sashM, -h + m, -h + m + e, hs, hh, -0.07, 0.07); F(sashM, h - m - e, h - m, hs, hh, -0.07, 0.07); F(sashM, -h + m + e, h - m - e, hs, hs + e, -0.07, 0.07); F(sashM, -h + m + e, h - m - e, hh - e, hh, -0.07, 0.07);
        F(sashM, -h + m + e, h - m - e, (hs + hh) / 2 - 0.03, (hs + hh) / 2 + 0.03, -0.04, 0.04); F('glass', -h + m + e - 0.03, h - m - e + 0.03, hs + e - 0.03, hh - e + 0.03, -0.01, 0.01);      // (the glass into the frame all round)
        const nx = Math.cos(phi), ny = Math.sin(phi), across = Math.abs(nx) > Math.abs(ny) ? 'X' : 'Y', hw = (len / 2 - m) * (across === 'X' ? Math.abs(nx) : Math.abs(ny)) + 0.2;
        across === 'X' ? portal(cx - t / 2, cx + t / 2, cy - hw, cy + hw, hs, hh, 'X', 'win') : portal(cx - hw, cx + hw, cy - t / 2, cy + t / 2, hs, hh, 'Y', 'win');
        if (hs < 12 && s.out && !INTERIOR.test(s.out)) { const [x, z] = P(cx + nx * t / 2, cy + ny * t / 2), [wx, wz] = Dir(nx, ny); lists.windows.push({ x, z, nx: wx, nz: wz, w: len - 2 * m, y: g0 }); }
      }
      // the walker is stopped by a row of small boxes along the facet (colliders are square to the axes)
      const k2 = Math.max(1, Math.ceil(len / 1.1));
      for (let q = 0; q < k2; q++) { const uu = -h + ((q + 0.5) * len) / k2, px = cx - Math.sin(phi) * uu, py = cy + Math.cos(phi) * uu, e2 = Math.max(t / 2, len / k2 / 2) * 0.8; L.block(px - e2, px + e2, py - e2, py + e2, h0, h1); }
      grow(cx - t, cx + t, cy - t, cy + t);
    }
  }

  // ---- roofs --------------------------------------------------------------------------------------------
  // face: one flat piece of roof through the plan points [[X, Y, h], ...] (three or more, in one plane, any order
  // round the outline; convex). It is `thick` deep, slated on top (courses level, running up the slope) with
  // `under` on its underside. Every other roof here is made of these; so are dormers, valleys and anything odd.
  const V = (X, Y, h) => new THREE.Vector3(X, h, -Y);
  function face(mat, pts, o = {}) {
    const thick = o.thick ?? 0.3, under = o.under === undefined ? 'timber' : o.under;
    let p = pts.map(q => V(...q));
    let nrm = new THREE.Vector3().crossVectors(p[1].clone().sub(p[0]), p[2].clone().sub(p[0])).normalize();
    if (nrm.y < 0) { p = p.reverse(); nrm.negate(); }
    let eu = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), nrm); if (eu.lengthSq() < 1e-8) eu.set(1, 0, 0); eu.normalize();
    const ev = new THREE.Vector3().crossVectors(nrm, eu);
    const sheet = (verts, flipped, nn) => {
      const pos = [], uv = [], nor = [];
      for (let i = 1; i < verts.length - 1; i++) for (const v of flipped ? [verts[0], verts[i + 1], verts[i]] : [verts[0], verts[i], verts[i + 1]]) { pos.push(v.x, v.y, v.z); uv.push(v.dot(eu), v.dot(ev)); nor.push(nn.x, nn.y, nn.z); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); return g;
    };
    const low = p.map(v => v.clone().addScaledVector(nrm, -thick));
    L.add(mat, sheet(p, false, nrm));
    if (under) L.add(under, sheet(low, true, nrm.clone().negate()));
    for (let i = 0; i < p.length; i++) {                                  // the edges
      const a = p[i], b2 = p[(i + 1) % p.length], c2 = low[(i + 1) % p.length], d = low[i], en = new THREE.Vector3().crossVectors(b2.clone().sub(a), nrm).normalize();
      L.add(o.edge ?? mat, sheet([a, d, c2, b2], false, en));
    }
  }
  const roof = {
    face,
    // A gable roof over the plan rectangle: eave height, pitch (rise over run), ridge along 'X' or 'Y'. over: the
    // overhang at the eaves; overG: at the gables. gable: the material of the two triangular end walls (null: none,
    // if the walls below are carried up by hand), gt their thickness.
    gable({ X0, X1, Y0, Y1, eave, pitch = 1, ridge = 'X', over = 1, overG = 0.6, mat = 'slate', gable = null, gt = 1.5, under, thick }) {
      const alongX = ridge === 'X', half = (alongX ? Y1 - Y0 : X1 - X0) / 2, top = eave + half * pitch, o = { under, thick };
      const pt = (u, w, h) => (alongX ? [u, w, h] : [w, u, h]);          // u along the ridge, w across
      const [u0, u1, w0, w1] = alongX ? [X0, X1, Y0, Y1] : [Y0, Y1, X0, X1], wm = (w0 + w1) / 2;
      face(mat, [pt(u0 - overG, w0 - over, eave - over * pitch), pt(u1 + overG, w0 - over, eave - over * pitch), pt(u1 + overG, wm, top), pt(u0 - overG, wm, top)], o);
      face(mat, [pt(u0 - overG, w1 + over, eave - over * pitch), pt(u1 + overG, w1 + over, eave - over * pitch), pt(u1 + overG, wm, top), pt(u0 - overG, wm, top)], o);
      if (gable) for (const [ua, ub] of [[u0, u0 + gt], [u1 - gt, u1]]) {
        const tri = [[w0, eave], [w1, eave], [wm, top - 0.05]];
        const g = new THREE.ExtrudeGeometry(new THREE.Shape(tri.map(([w, h]) => new THREE.Vector2(w, h))), { depth: ub - ua, bevelEnabled: false });
        if (alongX) { g.rotateY(Math.PI / 2); g.translate(ua, 0, 0); } else g.translate(0, 0, -ub);      // (the outline is drawn in (w, h); across the building w is Y, which is -z)
        L.add(gable, g);
      }
      return top;
    },
    // A hipped roof over the plan rectangle: the ridge runs along the longer side (a square gives a pyramid).
    hip({ X0, X1, Y0, Y1, eave, pitch = 1, over = 1, mat = 'slate', under, thick }) {
      const o = { under, thick }, lx = X1 - X0, ly = Y1 - Y0, half = Math.min(lx, ly) / 2, top = eave + half * pitch, e = eave - over * pitch;
      const A = [X0 - over, Y0 - over, e], Bq = [X1 + over, Y0 - over, e], C = [X1 + over, Y1 + over, e], Dq = [X0 - over, Y1 + over, e];
      if (lx >= ly) { const r0 = [X0 + half, (Y0 + Y1) / 2, top], r1 = [X1 - half, (Y0 + Y1) / 2, top];
        if (lx - ly < 0.01) { for (const [p, q] of [[A, Bq], [Bq, C], [C, Dq], [Dq, A]]) face(mat, [p, q, r0], o); }
        else { face(mat, [A, Bq, r1, r0], o); face(mat, [C, Dq, r0, r1], o); face(mat, [Dq, A, r0], o); face(mat, [Bq, C, r1], o); } }
      else { const r0 = [(X0 + X1) / 2, Y0 + half, top], r1 = [(X0 + X1) / 2, Y1 - half, top];
        face(mat, [Bq, C, r1, r0], o); face(mat, [Dq, A, r0, r1], o); face(mat, [A, Bq, r0], o); face(mat, [C, Dq, r1], o); }
      return top;
    },
    // A cone, or part of one, in n flat faces: over a round or polygonal end (from, to in degrees as arcWall: 0
    // along +X, 90 along +Y), or a whole turret (0 to 360). r is the radius at the eave line; the apex stands
    // `rise` above the eave at the centre.
    cone({ X, Y, r, eave, rise, n = 12, from = 0, to = 360, over = 0.8, mat = 'slate', under, thick }) {
      const a0 = (from * Math.PI) / 180, da = ((to - from) * Math.PI) / 180 / n, R = r + over, e = eave - (over * rise) / r;
      for (let i = 0; i < n; i++) { const a = a0 + i * da, b2 = a + da; face(mat, [[X + R * Math.cos(a), Y + R * Math.sin(a), e], [X + R * Math.cos(b2), Y + R * Math.sin(b2), e], [X, Y, eave + rise]], { under, thick }); }
      return eave + rise;
    },
  };

  // ---- the furnishing kit, in the building's own coordinates ------------------------------------------
  // b.kit is the house's furniture kit (src/kit/README.md) bound to this building: b.fr(X, Y, h, q) is a frame
  // here (q: quarter turns; 0 faces +Y, 1 faces -X, 2 faces -Y, 3 faces +X). What it lists is moved to the island
  // at the end (adopt, below).
  let kit = null;
  const getKit = () => (kit ??= makeKit(L));
  // (Called again after furnishing that was put off: only what the kit has listed since the last time is moved.)
  const adopted = {}; let kitListed = false;
  const since = name => { const l = kit[name] ?? [], from = adopted[name] ?? 0; adopted[name] = l.length; return from ? l.slice(from) : l; };
  function adopt() {
    if (!kit) return;
    const mv = o => { const v = new THREE.Vector3(o.x, o.y ?? 0, o.z).applyMatrix4(M); o.x = v.x; o.z = v.z; if (o.y !== undefined) o.y = v.y; return o; };
    for (const l of since('lamps')) mv(l);
    for (const l of since('candles')) mv(l);
    for (const l of since('steam')) mv(l);
    for (const l of since('seats')) { mv(l); l.yaw += th; }
    for (const l of since('models')) { mv(l); l.rotY = (l.rotY ?? 0) + th; }
    for (const l of since('extras')) { mv(l); if (l.rug && k % 2) [l.w, l.d] = [l.d, l.w]; else if (!l.rug) l.rotY = (l.rotY ?? 0) + th; }
    for (const l of since('books')) { mv(l); l.q = (l.q + k) % 4; if (k % 2) [l.sx, l.sz] = [l.sz, l.sx]; }
    for (const l of since('hinged')) { const y0 = l.y0, y1 = l.y1, c = mv({ x: l.cx, z: l.cz }); mv(l); l.cx = c.x; l.cz = c.z; l.y0 = y0 + g0; l.y1 = y1 + g0; l.closed += th; l.open += th; }
    if (!kitListed) { kitListed = true; lists.kits.push(kit); }
  }

  // ---- the end: walls are built, the outline is recorded, the kit's things are moved into place ---------------
  function finish() {
    for (const s of walls) buildWall(s);
    for (const q of slabs) laySlab(q); layBeams();
    if (bounds.X0 < bounds.X1) { const w = wbox(bounds.X0 - 0.1, bounds.X1 + 0.1, bounds.Y0 - 0.1, bounds.Y1 + 0.1, 0, 0); lists.footprints.push({ x0: w.x0, x1: w.x1, z0: w.z0, z1: w.z1, site: site.id }); }
    adopt();
  }

  const b = {
    site, G, B: L,
    box: (...a) => L.pbox(...a), cyl: (...a) => L.pcyl(...a), mesh: (mat, g) => L.add(mat, g), block: (...a) => L.block(...a), prism: (...a) => L.prism(...a),
    wall, arcWall, floor, floorArc, arcRects, room, roomArc, ceiling, finishes, stair, steps, rail, surface, surfacePolygon, ramp, interior, portal, lamp, fill, roof, world,
    get kit() { return getKit(); }, fr: (X, Y, h = 0, q = 0) => getKit().fr(X, Y, h, q),
    later: f => lists.later.push(f),
    finish, adopt,
  };
  return b;
}
