// Getting about, for robots. From Anna's House (my_house/site/src/staff/nav.js), with everything that was the
// house's own taken out: nothing here knows a building, a floor number or a room name. A PLAN is a half-foot
// grid of one level patch of floor (a room, a floor of a house, a yard), made at run time from the same
// obstacles the visitor meets, so it follows the furniture wherever it was put. On it: who can stand where
// (clearance), which cells are a doorway (passable only while the door is open), and which are LANES, places
// people pass through and nobody should stand about in. A* over the grid, the path pulled taut; a flood fill
// that says what can be reached without squeezing past somebody; and a Mover that follows a path.
//
//   makePlan(world, area)
//     world   { colliders, doors, portals, surfaces, ground }     all optional but colliders
//             colliders  [{ x0, x1, y0, y1, z0, z1, off, staff }]  the live list (off: not there now; staff: a body, ignored)
//             doors      [{ cx, cz, y0, y1, stop: a collider, isOpen, fixed }]
//             portals    [{ x0, x1, y0, y1, z0, z1, kind: 'door' | 'stair' | ... }]  openings in walls and floors
//             surfaces   [{ x0, x1, z0, z1, h, ramp, h2 }]          floors; a ramp is a flight of stairs
//             ground     (x, z) => y                                the land, where there is no floor
//     area    { boxes: [{ x0, x1, z0, z1 }], y, top, hall, links } the patch: its rectangles (links: those of them that are
//                                                                 the doorways between its rooms), the height of its floor,
//                                                                 how tall the tallest body is, and whether it is a hall
//   -> plan   free, freeAt, nearest, flood, reachD, path, clearLine, see, randomSpot, laneAt, floorY, block, rebuild ...
//
// Lanes: 1 a hall, 2 a doorway and the 3 ft before it, 3 the foot or head of a stair, 4 an aisle (open floor
// under 5.5 ft across). Passing through is fine; these are for choosing where to wait.

export const CELL = 0.5;
const NB8 = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
const BAND_LO = 0.2;                 // anything from here above the floor up to the top of the body is in the way
const DOOR_R = 3.0, STAIR_R = 3.0, AISLE = 11;      // feet, feet, cells

export function makePlan(world, area) {
  // (out of doors a plan may be coarser, area.cell feet to a cell, and is told three more things: area.ok(x, z), false
  // where nobody may walk whatever stands there (water, a bed, the rim); area.lane(x, z), a lane number of its own; and
  // each obstacle is weighed against the height of the land where it stands, since the land is not level)
  const CELL = area.cell ?? 0.5, AISLE = Math.round(5.5 / CELL);
  const { colliders } = world, doors = (world.doors ?? []).filter(d => !d.fixed), fixed = (world.doors ?? []).filter(d => d.fixed);
  const y = area.y, top = area.top ?? 4.6, boxes = area.boxes;
  const X0 = Math.min(...boxes.map(b => b.x0)), Z0 = Math.min(...boxes.map(b => b.z0));
  const NX = Math.max(1, Math.ceil((Math.max(...boxes.map(b => b.x1)) - X0) / CELL)), NZ = Math.max(1, Math.ceil((Math.max(...boxes.map(b => b.z1)) - Z0) / CELL)), N = NX * NZ;
  const walk = new Uint8Array(N), clear = new Float32Array(N), wall = new Uint8Array(N), door = new Int16Array(N).fill(-1), lane = new Uint8Array(N), fy = new Float32Array(N);
  let cells = [], version = 0, myDoors = [], cores = [], corePts = [];

  const cellOf = (x, z) => { const i = Math.floor((x - X0) / CELL), k = Math.floor((z - Z0) / CELL); return i < 0 || k < 0 || i >= NX || k >= NZ ? -1 : k * NX + i; };
  const cx = c => X0 + ((c % NX) + 0.5) * CELL, cz = c => Z0 + (Math.floor(c / NX) + 0.5) * CELL;
  const inBoxes = (x, z) => boxes.some(b => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1);

  function rebuild() {
    walk.fill(0); wall.fill(0); door.fill(-1); lane.fill(0);
    const surfs = (world.surfaces ?? []).filter(s => s.x1 > X0 && s.x0 < X0 + NX * CELL && s.z1 > Z0 && s.z0 < Z0 + NZ * CELL);
    const flats = surfs.filter(s => !s.ramp && Math.abs(s.h - y) < 0.75), ramps = surfs.filter(s => s.ramp && Math.max(s.h, s.h2) > y - 0.3 && Math.min(s.h, s.h2) < y + top);
    for (let c = 0; c < N; c++) {
      const x = cx(c), z = cz(c); fy[c] = y;
      if (!inBoxes(x, z)) continue;
      if (ramps.some(s => x >= s.x0 - 0.1 && x <= s.x1 + 0.1 && z >= s.z0 - 0.1 && z <= s.z1 + 0.1)) continue;      // nobody stands on a stair
      if (area.links?.some(b => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1)) { walk[c] = 1; continue; }      // a doorway between two of its rooms: the threshold is floor
      if (area.open) { if (area.ok && !area.ok(x, z)) continue; fy[c] = world.ground ? world.ground(x, z) : y; walk[c] = 1; continue; }                  // out of doors: the land itself
      let h = -1e9; for (const s of flats) if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1 && s.h > h) h = s.h;
      if (h < -1e8 && world.ground) { const g = world.ground(x, z); if (Math.abs(g - y) < 0.75) h = g; }
      if (h < -1e8 && world.surfaces) continue;                                                                 // no floor here (a stair well)
      if (h > -1e8) fy[c] = h;
      walk[c] = 1;
    }
    const stamp = (b, isWall) => {
      const i0 = Math.max(0, Math.floor((b.x0 - X0) / CELL)), i1 = Math.min(NX - 1, Math.floor((b.x1 - X0) / CELL));
      const k0 = Math.max(0, Math.floor((b.z0 - Z0) / CELL)), k1 = Math.min(NZ - 1, Math.floor((b.z1 - Z0) / CELL));
      for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) { const c = k * NX + i; if (isWall) wall[c] = 1; else walk[c] = 0; }
    };
    const stops = new Set(doors.map(d => d.stop));
    for (const b of colliders) {
      if (b.staff || stops.has(b) || b.off) continue;
      const yb = area.open && world.ground ? world.ground((b.x0 + b.x1) / 2, (b.z0 + b.z1) / 2) : y;
      if (b.y0 >= yb + top || b.y1 <= yb + BAND_LO) continue;
      stamp(b, false);
      if (b.y1 >= yb + 6.4 && b.y0 <= yb + 1.5) stamp(b, true);                  // walls and tall cases block the view too
    }
    for (const d of fixed) if (d.stop && d.stop.y0 < y + 3 && d.stop.y1 > y + 1) { stamp(d.stop, false); stamp(d.stop, true); }
    // Door cells: the opening itself, a little either side of the leaf
    myDoors = doors.filter(d => d.stop && d.stop.y0 <= y + 1 && d.stop.y1 >= y + 1 && d.stop.x1 > X0 - 4 && d.stop.x0 < X0 + NX * CELL + 4 && d.stop.z1 > Z0 - 4 && d.stop.z0 < Z0 + NZ * CELL + 4);
    myDoors.forEach((d, n) => {
      const s = d.stop, thinX = s.x1 - s.x0 < s.z1 - s.z0, pad = 0.4;
      const b = thinX ? { x0: s.x0 - pad, x1: s.x1 + pad, z0: s.z0 + 0.05, z1: s.z1 - 0.05 } : { x0: s.x0 + 0.05, x1: s.x1 - 0.05, z0: s.z0 - pad, z1: s.z1 + pad };
      const i0 = Math.max(0, Math.floor((b.x0 - X0) / CELL)), i1 = Math.min(NX - 1, Math.floor((b.x1 - X0) / CELL)), k0 = Math.max(0, Math.floor((b.z0 - Z0) / CELL)), k1 = Math.min(NZ - 1, Math.floor((b.z1 - Z0) / CELL));
      for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) { const c = k * NX + i; if (walk[c]) door[c] = n; }
    });
    // Clearance: distance to the nearest unwalkable cell, in cells (3-4 chamfer). The edge of the plan is a wall.
    for (let c = 0; c < N; c++) clear[c] = walk[c] ? 1e6 : 0;
    const relax = (c, n, w) => { if (clear[n] + w < clear[c]) clear[c] = clear[n] + w; };
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) {
      const c = k * NX + i; if (!clear[c]) continue;
      if (i > 0) relax(c, c - 1, 3); else clear[c] = Math.min(clear[c], 3);
      if (k > 0) { relax(c, c - NX, 3); if (i > 0) relax(c, c - NX - 1, 4); if (i < NX - 1) relax(c, c - NX + 1, 4); } else clear[c] = Math.min(clear[c], 3);
    }
    for (let k = NZ - 1; k >= 0; k--) for (let i = NX - 1; i >= 0; i--) {
      const c = k * NX + i; if (!clear[c]) continue;
      if (i < NX - 1) relax(c, c + 1, 3); else clear[c] = Math.min(clear[c], 3);
      if (k < NZ - 1) { relax(c, c + NX, 3); if (i < NX - 1) relax(c, c + NX + 1, 4); if (i > 0) relax(c, c + NX - 1, 4); } else clear[c] = Math.min(clear[c], 3);
    }
    cells = [];
    for (let c = 0; c < N; c++) { clear[c] /= 3; if (walk[c]) cells.push(c); }
    // Lanes (see the head of the file)
    const doorPts = (world.doors ?? []).filter(d => (d.y0 ?? y) < y + 3 && (d.y1 ?? y + 7) > y + 1).map(d => [d.cx, d.cz]);
    // (the narrower openings only: an opening over 6.5 ft wide is part of the room, not a way through it)
    const narrow = (world.portals ?? []).filter(p => p.kind === 'door' && p.y0 < y + 3 && p.y1 > y + 1 && Math.max(p.x1 - p.x0, p.z1 - p.z0) < 6.5);
    const grow = (p, d) => { const ax = p.x1 - p.x0 > p.z1 - p.z0; return { x0: p.x0 - (ax ? 0.3 : d), x1: p.x1 + (ax ? 0.3 : d), z0: p.z0 - (ax ? d : 0.3), z1: p.z1 + (ax ? d : 0.3) }; };
    const gaps = narrow.map(p => grow(p, DOOR_R)); cores = narrow.map(p => grow(p, 1.3)); corePts = doorPts;
    const wells = [...(world.portals ?? []).filter(p => p.kind === 'stair' && p.y0 < y + 1.5 && p.y1 > y - 1.5), ...surfs.filter(s => s.ramp && Math.max(s.h, s.h2) > y - 0.5 && Math.min(s.h, s.h2) < y + 0.5)];
    for (const c of cells) {
      const x = cx(c), z = cz(c); let k = 0;
      for (const s of wells) if (x > s.x0 - STAIR_R && x < s.x1 + STAIR_R && z > s.z0 - STAIR_R && z < s.z1 + STAIR_R) { k = 3; break; }
      if (!k) for (const [dx, dz] of doorPts) if (Math.hypot(dx - x, dz - z) < DOOR_R) { k = 2; break; }
      if (!k) for (const g of gaps) if (x > g.x0 && x < g.x1 && z > g.z0 && z < g.z1) { k = 2; break; }
      if (!k && area.lane) k = area.lane(x, z) || 0;
      if (!k && area.hall) k = 1;
      lane[c] = k;
    }
    // 4: an aisle, a galley, the gap between a desk and the wall: open floor under 5.5 ft across
    for (let k = 0; k < NZ; k++) for (let i = 0; i < NX;) {
      if (!walk[k * NX + i]) { i++; continue; }
      let j = i; while (j < NX && walk[k * NX + j]) j++;
      if (j - i < AISLE) for (let q = i; q < j; q++) if (!lane[k * NX + q]) lane[k * NX + q] = 4;
      i = j;
    }
    for (let i = 0; i < NX; i++) for (let k = 0; k < NZ;) {
      if (!walk[k * NX + i]) { k++; continue; }
      let j = k; while (j < NZ && walk[j * NX + i]) j++;
      if (j - k < AISLE) for (let q = k; q < j; q++) if (!lane[q * NX + i]) lane[q * NX + i] = 4;
      k = j;
    }
    // ...and the corners where two such aisles meet: tight, and between aisles
    for (let pass = 0; pass < 3; pass++) for (const c of cells) {
      if (lane[c] || clear[c] >= 3.5) continue;
      const i = c % NX; let n = 0;
      for (const [di, dk] of NB8) { const ii = i + di, m = c + di + dk * NX; if (ii >= 0 && ii < NX && m >= 0 && m < N && lane[m] === 4) n++; }
      if (n >= 2) lane[c] = 4;
    }
    version++;
  }
  // in the opening itself (or within a step of it), as against the three feet kept clear before it
  const inDoorway = (x, z) => corePts.some(([dx, dz]) => Math.hypot(dx - x, dz - z) < 1.6) || cores.some(g => x > g.x0 && x < g.x1 && z > g.z0 && z < g.z1);
  const laneAt = (x, z) => { const c = cellOf(x, z); return c < 0 ? 0 : lane[c]; };
  const floorY = (x, z) => { const c = cellOf(x, z); return c < 0 ? y : fy[c]; };

  // Can a body needing `need` cells of clearance stand here?
  function free(c, need, opener) {
    if (c < 0 || !walk[c]) return false;
    const d = door[c];
    if (d >= 0 && !opener && !myDoors[d].isOpen) return false;
    return clear[c] >= need;
  }
  const freeAt = (x, z, need, opener) => free(cellOf(x, z), need, opener);

  // ---- How far it is to walk from (x, z) to the cells around, with someone's body (bx, bz, br) in the way: so
  // a robot can tell a spot it can reach without squeezing past them. reachD(c): feet, or Infinity.
  const fd = new Float32Array(N), fgen = new Uint32Array(N), fq = new Int32Array(N); let fg = 0;
  function flood(x, z, need, maxD, bx = 0, bz = 0, br = 0) {
    fg++; let c0 = cellOf(x, z); if (c0 < 0 || !walk[c0]) c0 = nearest(x, z, need, 2.5); if (c0 < 0) return 0;
    const R = maxD / CELL, br2 = br * br; let h = 0, t = 0;
    fd[c0] = 0; fgen[c0] = fg; fq[t++] = c0;
    while (h < t) {
      const c = fq[h++], d = fd[c]; if (d >= R) continue;
      const i = c % NX, k = (c - i) / NX;
      for (const [di, dk, w] of NB8) {
        const ii = i + di, kk = k + dk; if (ii < 0 || kk < 0 || ii >= NX || kk >= NZ) continue;
        const n = kk * NX + ii; if (fgen[n] === fg || !free(n, need, false)) continue;
        if (br && (cx(n) - bx) ** 2 + (cz(n) - bz) ** 2 < br2) continue;
        fgen[n] = fg; fd[n] = d + w; fq[t++] = n;
      }
    }
    return t;                                   // how many cells were reached
  }
  const reachD = c => (c >= 0 && fgen[c] === fg ? fd[c] * CELL : Infinity);
  const reached = i => fq[i];                   // the i-th cell of the last flood (nearest first)

  function nearest(x, z, need, maxR = 6, opener = false, ok = null) {
    const i0 = Math.max(0, Math.min(NX - 1, Math.floor((x - X0) / CELL))), k0 = Math.max(0, Math.min(NZ - 1, Math.floor((z - Z0) / CELL))), R = Math.ceil(maxR / CELL);
    let best = -1, bd = 1e9;
    for (let k = Math.max(0, k0 - R); k <= Math.min(NZ - 1, k0 + R); k++) for (let i = Math.max(0, i0 - R); i <= Math.min(NX - 1, i0 + R); i++) {
      const c = k * NX + i; if (!free(c, need, opener) || door[c] >= 0 || (ok && !ok(c))) continue;
      const d = (cx(c) - x) ** 2 + (cz(c) - z) ** 2;
      if (d < bd) { bd = d; best = c; }
    }
    return bd <= maxR * maxR ? best : -1;
  }

  // ---- A* ------------------------------------------------------------------------
  const g = new Float32Array(N), from = new Int32Array(N), seen = new Uint32Array(N), done = new Uint32Array(N);
  let gen = 0;
  const heap = [];
  const push = (n, f) => { heap.push([f, n]); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
  const pop = () => { const t = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return t; };
  function search(c0, c1, need, opener) {
    gen++; heap.length = 0;
    const tx = cx(c1), tz = cz(c1);
    g[c0] = 0; seen[c0] = gen; from[c0] = -1; push(c0, Math.hypot(cx(c0) - tx, cz(c0) - tz));
    while (heap.length) {
      const [, n] = pop();
      if (done[n] === gen) continue; done[n] = gen;
      if (n === c1) break;
      const i = n % NX, k = (n - i) / NX;
      for (const [di, dk, w] of NB8) {
        const ii = i + di, kk = k + dk; if (ii < 0 || kk < 0 || ii >= NX || kk >= NZ) continue;
        const m = kk * NX + ii;
        if (done[m] === gen || !free(m, need, opener)) continue;
        if (di && dk && (!free(k * NX + ii, need, opener) || !free(kk * NX + i, need, opener))) continue;
        const tight = door[m] >= 0 ? 0 : Math.max(0, 3 - clear[m]) * 0.35;      // keep off the furniture where there is room
        const ng = g[n] + w * CELL * (1 + tight);
        if (seen[m] !== gen || ng < g[m]) { seen[m] = gen; g[m] = ng; from[m] = n; push(m, ng + Math.hypot(cx(m) - tx, cz(m) - tz)); }
      }
    }
    if (done[c1] !== gen) return null;
    const out = [];
    for (let n = c1; n >= 0; n = from[n]) out.push(n);
    return out.reverse();
  }
  // Is the straight line clear for a body of this size?
  function clearLine(x0, z0, x1, z1, need, opener) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.2));
    for (let s = 0; s <= n; s++) { const u = s / n; if (!freeAt(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u, need, opener)) return false; }
    return true;
  }
  // Is there open floor all the way between two points (nothing standing between them, however low)? The ends
  // themselves are not looked at: either may be pressed against something.
  function openBetween(x0, z0, x1, z1) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.25));
    for (let s = 2; s < n - 1; s++) { const u = s / n, c = cellOf(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u); if (c < 0 || !walk[c]) return false; }
    return true;
  }
  // Can one see from here to there (walls and closed doors only)?
  function see(x0, z0, x1, z1) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / 0.35));
    for (let s = 1; s < n; s++) {
      const u = s / n, c = cellOf(x0 + (x1 - x0) * u, z0 + (z1 - z0) * u); if (c < 0) return false;
      if (wall[c]) return false;
      const d = door[c]; if (d >= 0 && !myDoors[d].isOpen) return false;
    }
    return true;
  }
  // A taut path: [{ x, z }]
  function path(x0, z0, x1, z1, need, opener) {
    let c0 = cellOf(x0, z0), moved = false;
    if (!free(c0, need, opener)) { c0 = nearest(x0, z0, need, 3, opener); moved = true; }
    let c1 = cellOf(x1, z1);
    if (!free(c1, need, opener) || door[c1] >= 0) c1 = nearest(x1, z1, need, 4, opener);
    if (c0 < 0 || c1 < 0) return null;
    const nodes = search(c0, c1, need, opener);
    if (!nodes) return null;
    const pts = nodes.map(c => ({ x: cx(c), z: cz(c) }));
    if (c1 === cellOf(x1, z1)) pts[pts.length - 1] = { x: x1, z: z1 };      // the very spot, not the middle of its cell
    const out = [{ x: x0, z: z0 }];
    if (moved && pts.length > 1) out.push(pts[0]);      // pressed against something: out to open floor first, not on through it
    let a = 0;
    while (a < pts.length - 1) {
      const fr = out[out.length - 1];
      let b = a + 1, misses = 0;
      for (let j = a + 2; j < pts.length; j++) {
        if (clearLine(fr.x, fr.z, pts[j].x, pts[j].z, need, opener)) { b = j; misses = 0; } else if (++misses > 8) break;
      }
      out.push(pts[b]); a = b;
    }
    if (out.length < 2) out.push(pts[pts.length - 1]);
    return out;
  }
  // A random place to stand, with room to spare
  function randomSpot(need, rnd = Math.random, minClear = need, ok = null) {
    for (let tries = 0; tries < 120; tries++) {
      const c = cells[Math.floor(rnd() * cells.length)];
      if (c === undefined) return null;
      if (door[c] >= 0 || clear[c] < minClear || (ok && !ok(c))) continue;
      return { x: cx(c), z: cz(c), c };
    }
    return null;
  }
  // Somebody's body marked as furniture for the length of one call (a way planned round them, not through them)
  const BC = new Int32Array(1024), BW = new Uint8Array(1024);
  function around(ox, oz, r, sx, sz, fn) {
    let n = 0;
    for (let dz = -r; dz <= r; dz += CELL) for (let dx = -r; dx <= r; dx += CELL) {
      if (dx * dx + dz * dz > r * r || n >= BC.length) continue;
      const c = cellOf(ox + dx, oz + dz); if (c < 0 || !walk[c] || Math.hypot(cx(c) - sx, cz(c) - sz) < 0.8) continue;
      BC[n] = c; BW[n] = walk[c]; walk[c] = 0; n++;
    }
    try { return fn(); } finally { for (let i = n - 1; i >= 0; i--) walk[BC[i]] = BW[i]; }
  }
  const nearDoor = (x, z, r) => myDoors.some(d => Math.hypot(d.cx - x, d.cz - z) < r) || [2, 3].includes(laneAt(x, z));

  rebuild();
  return { rebuild, free, freeAt, nearest, flood, reachD, reached, path, clearLine, openBetween, see, randomSpot, cellOf, cx, cz, laneAt, inDoorway, floorY, around, nearDoor, inBoxes,
    walk, clear, lane, door, y, top, NX, NZ, N, CELL, get doors() { return myDoors; }, get cells() { return cells; }, get version() { return version; } };
}

// ---- Following a path ----------------------------------------------------------------
// Shared by everyone who moves. Speeds in feet per second. `need` is clearance in cells (half feet).
export class Mover {
  constructor(plan, { need = 2, opener = false, speed = 3, turn = 5, ease = 3 } = {}) {
    this.plan = plan; this.ease = ease; this.need = need; this.opener = opener; this.speed = speed; this.turnRate = turn;
    this.x = 0; this.z = 0; this.y = plan?.y ?? 0; this.yaw = 0; this.v = 0;
    this.path = null; this.i = 0; this.goal = null; this.ver = -1; this.wait = 0; this.blockedFor = 0;
    this.avoid = null;            // (x, z) => true if someone is standing there
    this.onDoor = null;           // (door) => void, when an opener opens one
  }
  place(x, z) { this.x = x; this.z = z; this.y = this.plan.floorY(x, z); this.path = null; }
  goTo(x, z) {
    if (!this.plan) { this.goal = { x, z }; this.path = null; return false; }      // no plan of the floor yet: no way, for now
    const p = this.plan.path(this.x, this.z, x, z, this.need, this.opener);
    this.goal = { x, z }; this.ver = this.plan.version;
    if (!p) { this.path = null; return false; }
    this.path = p; this.i = 1; this.blockedFor = 0;
    return true;
  }
  stop() { this.path = null; this.goal = null; }
  get moving() { return !!this.path; }
  remaining() { if (!this.path) return 0; let d = 0, px = this.x, pz = this.z; for (let j = this.i; j < this.path.length; j++) { d += Math.hypot(this.path[j].x - px, this.path[j].z - pz); px = this.path[j].x; pz = this.path[j].z; } return d; }
  face(yaw, dt) { let d = yaw - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.yaw += d * Math.min(1, dt * this.turnRate); }
  faceTo(x, z, dt) { if (Math.hypot(x - this.x, z - this.z) > 0.05) this.face(Math.atan2(x - this.x, z - this.z), dt); }

  // -> 'idle' | 'moving' | 'arrived' | 'waiting' | 'failed'
  update(dt, speedScale = 1) {
    if (!this.path || !this.plan) { this.v = Math.max(0, this.v - dt * 4); return 'idle'; }
    const plan = this.plan;
    if (this.ver !== plan.version && this.goal) { if (!this.goTo(this.goal.x, this.goal.z)) return 'failed'; }
    if (this.wait > 0) { this.wait -= dt; this.v = 0; return 'waiting'; }
    const p = this.path[this.i];
    const dx = p.x - this.x, dz = p.z - this.z, L = Math.hypot(dx, dz);
    // Doors ahead
    if (L > 0.01) for (let s = 0.3, look = Math.min(L, 3.2); s <= look; s += 0.25) {
      const c = plan.cellOf(this.x + (dx / L) * s, this.z + (dz / L) * s), d = c >= 0 ? plan.door[c] : -1;
      if (d >= 0 && !plan.doors[d].isOpen) {
        if (this.opener) { this.onDoor?.(plan.doors[d]); this.wait = 0.7; return 'waiting'; }
        this.path = null; return 'failed';
      }
    }
    if (this.avoid && L > 0.01 && this.avoid(this.x + (dx / L) * Math.min(L, 1.1), this.z + (dz / L) * Math.min(L, 1.1))) {
      this.v = Math.max(0, this.v - dt * 6); this.blockedFor += dt;
      this.faceTo(p.x, p.z, dt);
      const inDoor = plan.nearDoor(this.x, this.z, 2.4);                                    // never stand waiting in a doorway
      if (this.blockedFor > (inDoor ? 0.6 : 2.5) && this.goal) { this.blockedFor = 0; return 'failed'; }
      return 'waiting';
    }
    // ease in and out
    const left = this.remaining();
    const target = Math.min(this.speed * speedScale, 0.3 + left * this.ease * 0.4);
    this.v += (target - this.v) * Math.min(1, dt * this.ease);
    const yawTo = Math.atan2(dx, dz);
    if (!this.strafe) this.face(yawTo, dt);                                                          // (shuffling sideways, it keeps its own heading)
    const off = this.strafe ? 0 : Math.abs(Math.atan2(Math.sin(yawTo - this.yaw), Math.cos(yawTo - this.yaw)));
    const step = this.v * dt * Math.max(0.12, Math.cos(Math.min(off, 1.45)));
    if (L <= step || L < 0.05) {
      if (this.hard?.(p.x, p.z)) { this.v = 0; this.blockedFor += dt; if (this.blockedFor > 2.5 && this.goal) { this.blockedFor = 0; return 'failed'; } return 'waiting'; }
      this.blockedFor = 0;
      this.x = p.x; this.z = p.z; this.i++; this.y = plan.floorY(this.x, this.z);
      if (this.i >= this.path.length) { this.path = null; return 'arrived'; }
      return 'moving';
    }
    const nx = this.x + (dx / L) * step, nz = this.z + (dz / L) * step, tight = this.fit ?? (this.need > 1.5 ? 1 : 0.6);
    // never step into anything solid, whatever the path says (a corner cut from an awkward start), nor into anybody
    if ((!plan.freeAt(nx, nz, tight, this.opener) && plan.freeAt(this.x, this.z, tight, this.opener)) || this.hard?.(nx, nz)) { this.v = 0; this.blockedFor += dt; if (this.blockedFor > 1 && this.goal) { this.blockedFor = 0; return 'failed'; } return 'waiting'; }
    this.blockedFor = 0;
    this.x = nx; this.z = nz; this.y = plan.floorY(nx, nz);
    return 'moving';
  }
}
