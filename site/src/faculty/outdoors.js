// Out of doors: the robots who go about the grounds. The same world, the same manners and the same sleeping rule
// as the faculty indoors (manners.js, nav.js, agent.js), with one plan of the whole island instead of one a room.
// Nothing here knows this place: it is told the land (`place`) and who is about (`cast`) by src/outdoors_cast.js,
// and finds everything else in the scene as it was built:
//
//   the plan      a one-foot grid of the island (nav.js makePlan, out of doors). Walkable: the walks and the grass.
//                 Not: off the rim, in a building, on its steps, in the water, on anything planted (read back from
//                 the soil, mulch and hedge meshes and from every plant as drawn), on the oval where the airship
//                 sets down, or in anything solid (the live colliders). The walks are lanes (nobody stands about
//                 on one), the feet of the doors' steps and the gate are doorways.
//   the roads     the walks and the worn paths as a graph, for going a long way without searching the island
//   the doors     each walk that ends at a building: the foot of its steps, and the way up them to the door,
//                 walked off the plan (nobody stands on a stair; these only pass)
//   the work      beds, pots, benches, stretches of gravel, the potting bench: found, not listed (gardenSpots,
//                 after Anna's House, staff/gardeners.js)
//
// Who there is: the gardener (her jobs, the water from her rose, the petals, the leaves she rakes: after the
// house's Bramble and Thistle), the groundskeeper (a mower: stripes up and down the open lawn), the harbour
// master (keeps to the Landing), and the ordinary make (faculty/researchers.js), who cross from door to door,
// sit, stand talking, or keep the night watch: floating, as the house's staff do, with a ring of light under them (no
// legs out here). The ordinary are drawn as two meshes for all of them (their parts
// moved on the processor), so a walker costs no draw call of its own.
//
// Nothing runs while the visitor is indoors or the grounds are out of sight; a robot far from the eye is moved
// twice a second and not posed. window.__outdoors is for tests.

import { Polite, VR, makeWorld, attendVisitor, engageVisitor } from './manners.js';
import { makePlan } from './nav.js';
import { weighted } from './agent.js';
import { buildBody, useThreeBody } from './body.js';
import { byId } from './roster.js';
import { paint, merge, sph, cyl, xform as T } from './models.js';
import { makeBubbles } from './bubbles.js';
import { makeTalk } from './talk.js';
import { hireResearchers } from './researchers.js';
import { makeCandleFlame } from '../flame.js';

const TAU = Math.PI * 2;
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hyp = Math.hypot;
let THREE, V1, V2, M1, M2, M3;

// ---- the land, read back from what was built ------------------------------------------------------------
function survey(O) {
  const { ctx, place } = O, B = place.bounds, X0 = Math.floor(B.x0), Z0 = Math.floor(B.z0), NX = Math.ceil(B.x1 - X0), NZ = Math.ceil(B.z1 - Z0), N = NX * NZ;
  // keep: 1 the rim, a building, water; 2 planted; 3 a hedge; 4 the airship's oval; 5 steps, a porch, a bridge; 6 a rock
  const keep = new Uint8Array(N), path = new Uint8Array(N), nearPath = new Uint8Array(N), lane2 = new Uint8Array(N);
  const at = (x, z) => { const i = Math.floor(x - X0), k = Math.floor(z - Z0); return i < 0 || k < 0 || i >= NX || k >= NZ ? -1 : k * NX + i; };
  const disc = (arr, x, z, r, v, over = true) => { for (let k = Math.max(0, Math.floor(z - r - Z0)); k <= Math.min(NZ - 1, Math.floor(z + r - Z0)); k++) for (let i = Math.max(0, Math.floor(x - r - X0)); i <= Math.min(NX - 1, Math.floor(x + r - X0)); i++) if (hyp(X0 + i + 0.5 - x, Z0 + k + 0.5 - z) <= r && (over || !arr[k * NX + i])) arr[k * NX + i] = v; };
  const rect = (arr, x0, x1, z0, z1, v) => { for (let k = Math.max(0, Math.floor(z0 - Z0)); k <= Math.min(NZ - 1, Math.floor(z1 - Z0)); k++) for (let i = Math.max(0, Math.floor(x0 - X0)); i <= Math.min(NX - 1, Math.floor(x1 - X0)); i++) arr[k * NX + i] = v; };
  for (let c = 0; c < N; c++) { const x = X0 + (c % NX) + 0.5, z = Z0 + Math.floor(c / NX) + 0.5; if (place.edge(x, z) < 5 || place.water(x, z)) keep[c] = 1; else if (place.oval(x, z)) keep[c] = 4; }
  for (const f of ctx.house.footprints ?? []) rect(keep, f.x0 - 1, f.x1 + 1, f.z0 - 1, f.z1 + 1, 1);
  for (const s of ctx.walker?.surfaces ?? []) { const top = Math.max(s.h, s.h2 ?? s.h), g = place.ground((s.x0 + s.x1) / 2, (s.z0 + s.z1) / 2); if (top > g + 0.4) rect(keep, s.x0 - 0.4, s.x1 + 0.4, s.z0 - 0.4, s.z1 + 0.4, 5); }
  // what is laid as soil or clipped as a hedge: every triangle of those meshes, from above
  const tri = (ax, az, bx, bz, cx, cz, v) => {
    const i0 = Math.max(0, Math.floor(Math.min(ax, bx, cx) - 0.4 - X0)), i1 = Math.min(NX - 1, Math.floor(Math.max(ax, bx, cx) + 0.4 - X0)), k0 = Math.max(0, Math.floor(Math.min(az, bz, cz) - 0.4 - Z0)), k1 = Math.min(NZ - 1, Math.floor(Math.max(az, bz, cz) + 0.4 - Z0));
    const area = (bx - ax) * (cz - az) - (bz - az) * (cx - ax); if (Math.abs(area) < 0.02 || i1 < i0 || k1 < k0) return;
    const sg = Math.sign(area), l1 = hyp(bx - ax, bz - az) || 1, l2 = hyp(cx - bx, cz - bz) || 1, l3 = hyp(ax - cx, az - cz) || 1;
    for (let k = k0; k <= k1; k++) for (let i = i0; i <= i1; i++) {
      const x = X0 + i + 0.5, z = Z0 + k + 0.5;
      if (sg * ((bx - ax) * (z - az) - (bz - az) * (x - ax)) / l1 > -0.35 && sg * ((cx - bx) * (z - bz) - (cz - bz) * (x - bx)) / l2 > -0.35 && sg * ((ax - cx) * (z - cz) - (az - cz) * (x - cx)) / l3 > -0.35 && keep[k * NX + i] !== 1) keep[k * NX + i] = v;
    }
  };
  const plants = [], m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s3 = new THREE.Vector3();
  ctx.scene.traverse(n => {
    if (n.isInstancedMesh && n.name === 'plants') { for (let i = 0; i < n.count; i++) { n.getMatrixAt(i, m4); m4.decompose(p, q, s3); if (place.water(p.x, p.z)) continue; plants.push({ x: p.x, y: p.y, z: p.z, w: s3.x, h: s3.y, up: p.y - place.ground(p.x, p.z) }); } return; }
    const kind = n.isMesh && /^ground (soil|mulch|bark|boxwood|yew|rock|rockDark|rockMoss)$/.exec(n.name); if (!kind) return;
    const P = n.geometry.attributes.position, I = n.geometry.index, v = /soil|mulch|bark/.test(kind[1]) ? 2 : /rock/.test(kind[1]) ? 6 : 3, cnt = I ? I.count : P.count;
    for (let i = 0; i < cnt; i += 3) { const a = I ? I.getX(i) : i, b = I ? I.getX(i + 1) : i + 1, c = I ? I.getX(i + 2) : i + 2; tri(P.getX(a), P.getZ(a), P.getX(b), P.getZ(b), P.getX(c), P.getZ(c), v); }
  });
  for (const f of plants) disc(keep, f.x, f.z, Math.max(0.75, f.w * 0.4), 2, false);
  // the walks and the worn paths, as laid: a smooth curve through their points
  const curve = pts => { const c = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'); return c.getSpacedPoints(Math.max(2, Math.ceil(c.getLength()))).map(v => [v.x, v.z]); };
  const ways = [...place.walks.map((w, i) => ({ ...w, id: i, cut: false })), ...(place.cuts ?? []).map((w, i) => ({ ...w, id: 64 + i, cut: true }))];
  for (const w of ways) { w.line = curve(w.pts); for (const [x, z] of w.line) { disc(path, x, z, Math.max(1.5, w.w / 2), 1 + w.id, false); disc(nearPath, x, z, w.w / 2 + 2.5, 1); } }
  const ground = (x, z) => place.ground(x, z) + 0.04;
  const plan = makePlan({ colliders: ctx.colliders, ground }, { boxes: [{ x0: X0, x1: X0 + NX, z0: Z0, z1: Z0 + NZ }], y: 0, top: 4.6, open: true, cell: 1,
    ok: (x, z) => !keep[at(x, z)], lane: (x, z) => { const c = at(x, z); return lane2[c] ? 2 : path[c] && path[c] < 64 ? 4 : 0; } });
  return { X0, Z0, NX, NZ, N, keep, path, nearPath, lane2, at, disc, plants, ways, plan, ground };
}

// ---- the roads: the walks and worn paths as a graph -------------------------------------------------------
function roads(O) {
  const { ways, plan } = O.S, nodes = [];
  for (const w of ways) { w.nodes = []; const step = 6, n = Math.max(1, Math.round((w.line.length - 1) / step)); for (let i = 0; i <= n; i++) { const [x, z] = w.line[Math.min(w.line.length - 1, Math.round(i * (w.line.length - 1) / n))]; w.nodes.push(nodes.length); nodes.push({ x, z, w: w.w, way: w, e: [] }); } }
  const link = (a, b, cut) => { if (a === b || nodes[a].e.some(e => e[0] === b)) return; const d = hyp(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z); nodes[a].e.push([b, d, cut]); nodes[b].e.push([a, d, cut]); };
  let dropped = 0;
  for (const w of ways) for (let i = 0; i < w.nodes.length - 1; i++) { const a = nodes[w.nodes[i]], b = nodes[w.nodes[i + 1]]; if (plan.clearLine(a.x, a.z, b.x, b.z, 1.3, false)) link(w.nodes[i], w.nodes[i + 1], w.cut);
    else { const p = i > 0 && i < w.nodes.length - 2 ? plan.path(a.x, a.z, b.x, b.z, 1.3, false) : null; let L = 0; for (let j = 1; j < (p?.length ?? 0); j++) L += hyp(p[j].x - p[j - 1].x, p[j].z - p[j - 1].z);      // (something small stands on the walk: if there is a way round it, the stretch is still a way)
      if (p && L < 2.5 * hyp(b.x - a.x, b.z - a.z) && hyp(p.at(-1).x - b.x, p.at(-1).z - b.z) < 1) link(w.nodes[i], w.nodes[i + 1], w.cut); else { dropped++; (O.roadNotes ??= []).push([w.name, i, +a.x.toFixed(1), +a.z.toFixed(1), +b.x.toFixed(1), +b.z.toFixed(1)]); } } }
  // where one ends on another, or two share a point
  const nearestOn = (x, z, not) => { let best = -1, bd = 1e9; nodes.forEach((n, i) => { if (n.way === not) return; const d = hyp(n.x - x, n.z - z); if (d < bd) { bd = d; best = i; } }); return [best, bd]; };
  for (const w of ways) for (const id of [w.nodes[0], w.nodes.at(-1)]) { const n = nodes[id], [j, d] = nearestOn(n.x, n.z, w); if (j >= 0 && d < nodes[j].w / 2 + 5) { link(id, j, w.cut); n.joined = true; } }
  if (dropped) console.info(`outdoors: ${dropped} stretch(es) of walk are blocked and not used`);
  const nearest = (x, z, max = 80, cuts = true) => { let best = -1, bd = max; nodes.forEach((n, i) => { if (!n.e.length || (!cuts && n.way.cut)) return; const d = hyp(n.x - x, n.z - z); if (d < bd) { bd = d; best = i; } }); return best; };
  // the shortest way from node a to node b: [ids]; cuts: may it use the worn paths (and how much they are liked)
  const route = (a, b, cuts = 0) => {
    const dist = new Float32Array(nodes.length).fill(1e9), from = new Int32Array(nodes.length).fill(-1), done = new Uint8Array(nodes.length); dist[a] = 0;
    for (;;) { let u = -1, bd = 1e9; for (let i = 0; i < nodes.length; i++) if (!done[i] && dist[i] < bd) { bd = dist[i]; u = i; } if (u < 0 || u === b) break; done[u] = 1;
      for (const [v, d, cut] of nodes[u].e) { if (cut && !cuts) continue; const nd = dist[u] + d * (cut ? 1 / cuts : 1); if (nd < dist[v]) { dist[v] = nd; from[v] = u; } } }
    if (dist[b] >= 1e9) return null; const out = []; for (let n = b; n >= 0; n = from[n]) out.push(n); return out.reverse();
  };
  // the points to walk: each node set `side` feet to one hand of the way (so that two who meet pass)
  const points = (ids, side = 1) => ids.map((id, i) => {
    const n = nodes[id], a = nodes[ids[Math.max(0, i - 1)]], b = nodes[ids[Math.min(ids.length - 1, i + 1)]], dx = b.x - a.x, dz = b.z - a.z, L = hyp(dx, dz) || 1;
    const room = n.way.cut ? 0 : Math.max(0, n.w / 2 - 1.5), off = clamp(side * Math.min(1.25, room), -room - 0.9, room + 0.9), x = n.x - dz / L * off, z = n.z + dx / L * off;
    return plan.freeAt(x, z, 1.3, false) ? { x, z, id } : { x: n.x, z: n.z, id };
  });
  const length = ids => { let d = 0; for (let i = 1; i < ids.length; i++) d += hyp(nodes[ids[i]].x - nodes[ids[i - 1]].x, nodes[ids[i]].z - nodes[ids[i - 1]].z); return d; };
  return { nodes, nearest, route, points, length };
}

// ---- the doors: where a walk ends at a building, and the way up its steps ---------------------------------
function doorEnds(O) {
  const { ctx, place, S } = O, out = [], surfaces = ctx.walker?.surfaces ?? [], ext = (ctx.house.doors ?? []).filter(d => d.exterior);
  const floorAt = (x, z, y) => { let best = S.ground(x, z); for (const s of surfaces) { if (x < s.x0 || x > s.x1 || z < s.z0 || z > s.z1) continue; const h = s.ramp ? s.h + (s.h2 - s.h) * (s.ax === 'x' ? (s.x1 - x) / (s.x1 - s.x0) : (s.z1 - z) / (s.z1 - s.z0)) : s.h; if (h <= y + 1.1 && h > best) best = h; } return best; };
  const hit = (x, z, y, r) => { for (const c of ctx.colliders) { if (c.off || c.staff || c.y1 <= y + 1.4 || c.y0 >= y + 3.4 || x < c.x0 - r || x > c.x1 + r || z < c.z0 - r || z > c.z1 + r) continue; if (hyp(x - clamp(x, c.x0, c.x1), z - clamp(z, c.z0, c.z1)) < r) return c; } return null; };
  for (const w of S.ways) { if (w.cut) continue; for (const end of [0, 1]) {
    // (the very end of a walk is hard against the steps, where nobody can stand: the foot is the last of it that is open ground)
    const seq = end ? [...w.nodes].reverse() : w.nodes, k = seq.findIndex(i => O.roads.nodes[i].e.length), id = seq[k], e = O.roads.nodes[seq[0]]; if (k < 0 || k > 3) continue;
    const n = O.roads.nodes[id]; if (out.some(d => hyp(d.way.at(-1).x - e.x, d.way.at(-1).z - e.z) < 6 || hyp(d.foot.x - n.x, d.foot.z - n.z) < 3)) continue;
    const site = (place.sites ?? []).find(s => hyp(s.door[0] - e.x, s.door[1] - e.z) < 16), from = site ? { x: site.door[0], z: site.door[1] } : e;
    const d = ext.filter(e => !site || e.site === site.id).sort((a, b) => hyp(a.cx - from.x, a.cz - from.z) - hyp(b.cx - from.x, b.cz - from.z))[0];
    if (!site && !(d && hyp(d.cx - e.x, d.cz - e.z) < 18)) continue;
    const pts = [{ x: n.x, z: n.z }]; if (k > 0) pts.push({ x: e.x, z: e.z }); if (site && hyp(from.x - e.x, from.z - e.z) > 2) pts.push(from);
    if (d && hyp(d.cx - from.x, d.cz - from.z) < 30) { const l = pts.at(-1), L = hyp(d.cx - l.x, d.cz - l.z); if (L > 3.6) pts.push({ x: d.cx + (l.x - d.cx) / L * 1.6, z: d.cz + (l.z - d.cz) / L * 1.6 }); }
    // walked once, as the visitor would: up the steps, stopping at anything solid
    const way = []; let y = S.ground(n.x, n.z), stop = false;
    for (let i = 0; i < pts.length - 1 && !stop; i++) { const a = pts[i], b = pts[i + 1], L = hyp(b.x - a.x, b.z - a.z), k = Math.ceil(L / 0.25); for (let j = i ? 1 : 0; j <= k; j++) { const x = a.x + (b.x - a.x) * j / k, z = a.z + (b.z - a.z) * j / k, ny = floorAt(x, z, y); const h = way.length > 4 && hit(x, z, ny, 0.62); if (h) { stop = [h.x0, h.x1, h.z0, h.z1, h.y0, h.y1].map(v => +v.toFixed(1)); break; } y = ny; way.push({ x, z, y }); } }
    (O.doorNotes ??= []).push({ at: [+n.x.toFixed(1), +n.z.toFixed(1)], site: site?.id ?? null, door: d ? [d.cx, d.cz] : null, pts: pts.map(q => [+q.x.toFixed(1), +q.z.toFixed(1)]), steps: way.length, stop, top: way.at(-1) });
    // (a way that neither climbs to a porch nor reaches its door ends at a blank wall: not a door)
    if (way.length >= 10 && way.at(-1).y - way[0].y < 1 && hyp(way.at(-1).x - pts.at(-1).x, way.at(-1).z - pts.at(-1).z) > 3) continue;
    if (way.length < 10) { console.info('outdoors: no way up to the door at', n.x.toFixed(0), n.z.toFixed(0), '(' + way.length + ' steps)'); continue; }
    out.push({ name: (site?.id ?? d.site) + (site ? '' : ':side'), site: site?.id ?? d.site, node: id, foot: way[0], top: way.at(-1), way });
    S.disc(S.lane2, n.x, n.z, 5, 1);
  } }
  return out;
}

// ---- where the work is (after the house's gardenSpots): found on the plan, not listed ----------------------
function gardenSpots(O) {
  const { S, ctx, place } = O, plan = S.plan, G = { pots: [], tend: [], beds: [], sweeps: [], benches: [], hedges: [], under: [] };
  const snap = (x, z, r, min = 0, need = 1.6) => { const c = plan.nearest(x, z, need, r, false, c => !plan.lane[c] && hyp(plan.cx(c) - x, plan.cz(c) - z) >= min); return c < 0 ? null : { x: plan.cx(c), z: plan.cz(c) }; };
  // what grows above the ground stands in a pot, on a bench or in a frame: gathered where they are close together
  const raised = S.plants.filter(f => f.up > 0.35 && f.up < 4 && S.keep[S.at(f.x, f.z)] !== 1), used = new Set();
  raised.forEach((f, i) => { if (used.has(i)) return; const g = [f]; used.add(i); raised.forEach((o, j) => { if (!used.has(j) && hyp(o.x - f.x, o.z - f.z) < 2.2) { used.add(j); g.push(o); } });
    const x = g.reduce((a, o) => a + o.x, 0) / g.length, z = g.reduce((a, o) => a + o.z, 0) / g.length, y = Math.max(...g.map(o => o.y)), st = snap(x, z, 6, 1.9); if (!st) return;
    const atDoor = O.doors.some(d => hyp(d.foot.x - x, d.foot.z - z) < 40);
    (atDoor ? G.pots : G.tend).push({ ...st, fx: x, fz: z, y, top: y + 0.5, up: f.up }); });
  // the beds: one place to stand for each ten feet of planting that can be reached from the grass
  const cells = new Map();
  for (const f of S.plants) { if (f.up > 0.35 || f.h < 0.7 || S.keep[S.at(f.x, f.z)] !== 2) continue; const k = Math.floor(f.x / 10) * 4096 + Math.floor(f.z / 10); (cells.get(k) ?? cells.set(k, []).get(k)).push(f); }
  for (const list of cells.values()) { let best = null, bd = 4.2; for (const f of list.length > 12 ? list.filter((_, i) => i % 3 === 0) : list) { const st = snap(f.x, f.z, 4, 1.5); if (!st) continue; const d = hyp(st.x - f.x, st.z - f.z); if (d < bd) { bd = d; best = { ...st, fx: f.x, fz: f.z, y: f.y, top: f.y + f.h * 0.75 }; } } if (best) G.beds.push(best); }
  // stretches of the wider walks, away from the doors
  for (const w of S.ways) { if (w.cut || w.w < 5) continue; for (let i = 14; i + 10 < w.line.length - 14; i += 34) { const a = w.line[i], b = w.line[i + 9]; if (O.doors.some(d => hyp(d.foot.x - a[0], d.foot.z - a[1]) < 24) || !plan.clearLine(a[0], a[1], b[0], b[1], 1.6, false)) continue; G.sweeps.push({ x: a[0], z: a[1], fx: b[0], fz: b[1], a, b }); } }
  // seats out of doors: a place to stand before each, and the way it faces
  for (const s of ctx.items?.seats ?? []) {
    if ((ctx.house.footprints ?? []).some(f => s.x > f.x0 && s.x < f.x1 && s.z > f.z0 && s.z < f.z1)) continue;
    const g = S.ground(s.x, s.z), h = s.y - 2.45 - g; if (h < 0.9 || h > 2.2) continue;
    const fx = -Math.sin(s.yaw), fz = -Math.cos(s.yaw), c = plan.nearest(s.x + fx * 1.6, s.z + fz * 1.6, 1, 3.5, false, c => (plan.cx(c) - s.x) * fx + (plan.cz(c) - s.z) * fz > 0.6); if (c < 0) continue;
    G.benches.push({ seat: s, label: s.label ?? '', x: plan.cx(c), z: plan.cz(c), sx: s.x, sz: s.z, h, fx, fz, ax: fz, az: -fx });
  }
  // the hedges and clipped balls: one place to stand for each twelve feet of them
  { const seen = new Set(); for (let c = 0; c < S.N; c += 3) { if (S.keep[c] !== 3) continue; const x = S.X0 + (c % S.NX) + 0.5, z = S.Z0 + Math.floor(c / S.NX) + 0.5, k = Math.floor(x / 12) * 4096 + Math.floor(z / 12); if (seen.has(k)) continue; const st = snap(x, z, 4, 1.4); if (!st) continue; seen.add(k); G.hedges.push({ ...st, fx: x, fz: z, y: S.ground(x, z), top: S.ground(x, z) + 1.5 }); } }
  // under the trees: a stretch of grass beside each trunk, to rake
  for (const t of place.trees ?? []) for (const a0 of [0.6, 2.7, 4.6]) { const r = (t.trunk ?? 1.2) + 5.5, a = [t.x + Math.cos(a0) * r, t.z + Math.sin(a0) * r], b = [a[0] - Math.sin(a0) * 8, a[1] + Math.cos(a0) * 8]; if (plan.freeAt(a[0], a[1], 1.8, false) && !plan.laneAt(a[0], a[1]) && plan.clearLine(a[0], a[1], b[0], b[1], 1.6, false)) { G.under.push({ x: a[0], z: a[1], fx: b[0], fz: b[1], a, b }); break; } }
  G.snap = snap;
  return G;
}

// ---- small effects: water from the rose, a cut flower head, leaves, soil (the house's Fx, as it was) --------
const FX = { WATER: 1, PETAL: 4, LEAF: 5, CLOD: 6 }, FXG = [0, -26, 0, 0, -2.2, 0, -22];
const rgb = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255].map(c => c ** 2.2);
const COL = { water: rgb(0xd8ecf6), water2: rgb(0xa9cfe2), petal: [rgb(0xd8758e), rgb(0xb88cd8), rgb(0xe0b14a)], leaf: [rgb(0xb8742e), rgb(0xc99a3e), rgb(0x8f5a2a)], soil: rgb(0x4a3424), weed: rgb(0x6f8f3e) };
class Fx {
  constructor(group, n = 96) {
    this.n = n; this.next = 0; this.any = false;
    this.p = new Float32Array(n * 3).fill(-1e4); this.c = new Float32Array(n * 3); this.v = new Float32Array(n * 3); this.life = new Float32Array(n); this.kind = new Uint8Array(n); this.floor = new Float32Array(n);
    const g = new THREE.BufferGeometry(); this.pa = new THREE.BufferAttribute(this.p, 3).setUsage(THREE.DynamicDrawUsage); this.ca = new THREE.BufferAttribute(this.c, 3).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa); g.setAttribute('color', this.ca);
    const cv = document.createElement('canvas'); cv.width = cv.height = 32; const x = cv.getContext('2d'), gr = x.createRadialGradient(16, 16, 2, 16, 16, 15); gr.addColorStop(0, '#fff'); gr.addColorStop(0.7, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.beginPath(); x.arc(16, 16, 15, 0, 7); x.fill();
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ size: 0.11, vertexColors: true, map: new THREE.CanvasTexture(cv), alphaTest: 0.45, sizeAttenuation: true }));
    this.pts.frustumCulled = false; this.pts.visible = false; this.pts.name = 'gardener fx'; group.add(this.pts);
  }
  spawn(kind, x, y, z, vx, vy, vz, col, life, floor = 0.05) {
    let i = -1; for (let k = 0; k < this.n; k++) { const j = (this.next + k) % this.n; if (this.life[j] <= 0) { i = j; break; } } if (i < 0) i = this.next; this.next = (i + 1) % this.n;
    const a = i * 3; this.p[a] = x; this.p[a + 1] = y; this.p[a + 2] = z; this.v[a] = vx; this.v[a + 1] = vy; this.v[a + 2] = vz; this.c[a] = col[0]; this.c[a + 1] = col[1]; this.c[a + 2] = col[2]; this.ca.needsUpdate = true;
    this.life[i] = life; this.kind[i] = kind; this.floor[i] = floor; this.any = true; this.pts.visible = true; return i;
  }
  update(dt, t) {
    if (!this.any) return; let any = false;
    for (let i = 0; i < this.n; i++) {
      if (this.life[i] <= 0) continue; const a = i * 3, k = this.kind[i]; this.life[i] -= dt;
      if (this.life[i] <= 0) { this.p[a + 1] = -1e4; continue; } any = true; if (k === FX.LEAF) continue;
      const p = this.p, v = this.v;
      if (p[a + 1] <= this.floor[i]) { p[a + 1] = this.floor[i]; v[a] = v[a + 1] = v[a + 2] = 0; if (k === FX.WATER) { this.life[i] = 0; p[a + 1] = -1e4; } continue; }
      v[a + 1] += FXG[k] * dt; if (k === FX.PETAL) { v[a + 1] = Math.max(v[a + 1], -1.1); p[a] += Math.sin(t * 5 + i) * dt * 0.4; }
      p[a] += v[a] * dt; p[a + 1] += v[a + 1] * dt; p[a + 2] += v[a + 2] * dt;
    }
    this.pa.needsUpdate = true; if (!any) { this.any = false; this.pts.visible = false; }
  }
  clear() { this.life.fill(0); for (let i = 0; i < this.n; i++) this.p[i * 3 + 1] = -1e4; this.pa.needsUpdate = true; this.any = false; this.pts.visible = false; }
}

// ---- the ordinary make, drawn together: every part of every one in two meshes, moved on the processor -------
const PARTS = 6, P_TRUNK = 0, P_HEAD = 1, P_HL = 2, P_HR = 3, P_RING = 4, P_PROP = 5;
class Layer {
  constructor(group, slots, cap, glow) {
    this.cap = cap; this.pos = new Float32Array(slots * cap * 3); this.nrm = new Float32Array(slots * cap * 3); this.col = new Float32Array(slots * cap * 4); this.p0 = new Float32Array(slots * cap * 3); this.n0 = new Float32Array(slots * cap * 3);
    this.ranges = Array.from({ length: slots }, () => []);
    const g = new THREE.BufferGeometry(); this.pa = new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage); this.na = new THREE.BufferAttribute(this.nrm, 3).setUsage(THREE.DynamicDrawUsage); this.ca = new THREE.BufferAttribute(this.col, 4).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', this.pa); g.setAttribute('normal', this.na); g.setAttribute('color', this.ca);
    const mat = glow ? new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false, alphaHash: true }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.38, metalness: 0.12, envMapIntensity: 0.9, alphaHash: true });
    this.mesh = new THREE.Mesh(g, mat); this.mesh.frustumCulled = false; this.mesh.castShadow = false; this.mesh.receiveShadow = !glow; this.mesh.name = glow ? 'ordinary lights' : 'ordinary'; this.mesh.visible = false; group.add(this.mesh);
  }
  // parts: [[part number, geometry (painted, not indexed)], ...]
  dress(slot, parts) {
    const base = slot * this.cap; let n = 0; this.ranges[slot] = [];
    for (const [part, g] of parts) { const P = g.attributes.position, Nn = g.attributes.normal, C = g.attributes.color, k = P.count; if (n + k > this.cap) { console.warn('outdoors: a robot has too many parts for its place'); break; }
      this.p0.set(P.array.subarray(0, k * 3), (base + n) * 3); this.n0.set(Nn.array.subarray(0, k * 3), (base + n) * 3);
      for (let i = 0; i < k; i++) { const o = (base + n + i) * 4; this.col[o] = C.getX(i); this.col[o + 1] = C.getY(i); this.col[o + 2] = C.getZ(i); this.col[o + 3] = 0; }
      this.ranges[slot].push([part, base + n, k]); n += k; }
    this.pos.fill(0, (base + n) * 3, (base + this.cap) * 3); this.used = n; this.ca.needsUpdate = true; this.pa.needsUpdate = true;
  }
  pose(slot, mats) {
    const pos = this.pos, nrm = this.nrm, p0 = this.p0, n0 = this.n0;
    for (const [part, start, k] of this.ranges[slot]) { const e = mats[part].elements, e0 = e[0], e1 = e[1], e2 = e[2], e4 = e[4], e5 = e[5], e6 = e[6], e8 = e[8], e9 = e[9], e10 = e[10], tx = e[12], ty = e[13], tz = e[14];
      for (let i = start * 3, end = (start + k) * 3; i < end; i += 3) { const x = p0[i], y = p0[i + 1], z = p0[i + 2], a = n0[i], b = n0[i + 1], c = n0[i + 2];
        pos[i] = e0 * x + e4 * y + e8 * z + tx; pos[i + 1] = e1 * x + e5 * y + e9 * z + ty; pos[i + 2] = e2 * x + e6 * y + e10 * z + tz; nrm[i] = e0 * a + e4 * b + e8 * c; nrm[i + 1] = e1 * a + e5 * b + e9 * c; nrm[i + 2] = e2 * a + e6 * b + e10 * c; } }
    this.pa.needsUpdate = true; this.na.needsUpdate = true;
  }
  fade(slot, a) { for (const [, start, k] of this.ranges[slot]) for (let i = start; i < start + k; i++) this.col[i * 4 + 3] = a; this.ca.needsUpdate = true; }
  clear(slot) { this.ranges[slot] = []; this.pos.fill(0, slot * this.cap * 3, (slot + 1) * this.cap * 3); this.pa.needsUpdate = true; }
}

// ---- anybody out of doors -------------------------------------------------------------------------------------
class Out extends Polite {
  constructor(O, o) {
    super(O.W, { radius: o.radius, top: o.top, speed: o.speed ?? 2.6, plan: () => O.S.plan });
    this.O = O; this.name = o.name; this.spec = { id: o.id, name: o.name, field: o.field ?? '', lines: o.lines ?? {} };
    const m = this.m; m.plan = O.S.plan; m.need = this.r + 0.8; m.fit = this.r + 0.5;
    this.ghost = true; this.offPlan = false; this.yFix = 0; this.lift = 0; this.asked = 0; this.pauseUntil = 0; this.expr = 'neutral'; this.exprUntil = 0; this.posted = false; this.phase = Math.random() * 10; this.state = 'away'; this.acc = 0; this.minGap = Infinity;
    this.bubble = O.H.bubbles.make(o.name);
    this.item = { x: 0, y: -1e4, z: 0, reach: o.reach ?? 9, size: o.aim ?? 1.6, label: () => (O.H.talk.robot === this ? 'say the next thing' : `talk to ${this.name}`), act: () => this.spoken() };
    O.ctx.interact.push(this.item); O.all.push(this);
  }
  get plan() { return this.O.S.plan; }
  get talking() { return this.O.H.talk.robot === this; }
  mayStandHere() { return this.posted; }
  blocked(x, z) { if (super.blocked(x, z)) return true; const l = this.O.animals(); if (l) for (const q of l) if (q.slow && hyp(q.x - x, q.z - z) < this.r + (q.r ?? 0.5) + 0.4 && hyp(q.x - x, q.z - z) < hyp(q.x - this.x, q.z - this.z)) return true; return false; }
  put(x, z, yaw) { const m = this.m; m.stop(); m.x = x; m.z = z; m.y = this.O.S.ground(x, z); m.v = 0; if (yaw !== undefined) m.yaw = yaw; this.aside.phase = 0; this.offPlan = false; this.lift = 0; }
  say(text, expr = 'happy', secs) { if (!text) return; this.bubble.say(text, secs, this.W.now); this.expr = expr; this.exprUntil = this.W.now + 3.5; if (this.O.dist(this) < 60) this.O.ctx.sound?.chirp?.(this.chirp ?? [70 + (this.name.length % 5) * 2, 74 + (this.name.length % 4) * 2]); }
  line(kind, expr) { const l = this.spec.lines?.[kind]; if (l?.length) this.say(pick(l), expr ?? (kind === 'idle' ? 'neutral' : 'happy')); }
  spoken() { this.O.H.talk.press(this); }
  topics(list) { return list.slice(0, 4).map(t => ({ text: t.q, act: () => { const a = typeof t.a === 'function' ? t.a(this.O, this) : t.a; this.say(Array.isArray(a) ? pick(a) : a, t.expr ?? 'happy', 6.5); this.replyUntil = this.W.now + 6.5; this.asked++; return t.next ? this.topics(t.next) : null; } })); }
  dialogue() { const all = this.spec.lines?.topics ?? [], n = all.length, k = this.asked % Math.max(1, n), list = n <= 4 ? all : [...all.slice(0, 2), ...[0, 1].map(i => all[2 + ((k + i) % (n - 2))])]; this.expr = 'happy'; this.exprUntil = this.W.now + 2; return this.topics(list); }
  // a long way: by the walks, then across the grass to the place itself
  *trip(x, z, o = {}) {
    const R = this.O.roads, d = hyp(x - this.x, z - this.z);
    if (d > 60) { const a = R.nearest(this.x, this.z, 70, false), b = R.nearest(x, z, 70, false), r = a >= 0 && b >= 0 && a !== b ? R.route(a, b, 0) : null; if (r && R.length(r) < d * 2.2 + 40) yield* this.follow(R.points(r, 1), o); }
    return yield* this.travel(x, z, { patience: 25, ...o });
  }
  *follow(pts, o = {}) {
    for (let i = o.from ?? 0; i < pts.length; i++) {
      const p = pts[i], last = i === pts.length - 1; let ok = false;
      for (let tries = 0; tries < 3 && !ok; tries++) ok = yield* this.travel(p.x, p.z, { patience: 10, speed: typeof o.speed === 'function' ? o.speed(i) : o.speed, until: last ? null : () => hyp(p.x - this.x, p.z - this.z) < 2.4 });
      this.at = i; if (!ok && last) return false;
    }
    return true;
  }
  // off the plan (steps, a seat): straight from point to point, and still never a step nearer her than the rule allows
  *walkLine(pts, speed = 2.2, turn = true) {
    this.offPlan = true; this.yFix = this.m.y; let stuck = 0;
    for (const p of pts) for (;;) {
      const m = this.m, dx = p.x - m.x, dz = p.z - m.z, L = hyp(dx, dz), dt = this.W.dt; if (L < 0.05) { if (p.y !== undefined) this.yFix = p.y; break; }
      const st = Math.min(L, speed * dt), nx = m.x + dx / L * st, nz = m.z + dz / L * st;
      if (turn) m.face(Math.atan2(dx, dz), dt * 1.6);
      if (this.tooNear(nx, nz)) { m.v = 0; stuck += dt; if (stuck > 1.5) return false; yield; continue; }
      stuck = 0; m.x = nx; m.z = nz; m.v = speed; if (p.y !== undefined) this.yFix += (p.y - this.yFix) * (st / L); yield;
    }
    this.m.v = 0; return true;
  }
  // manners and the task in hand: every frame, for anyone awake
  frame(dt) {
    const W = this.W, m = this.m, now = W.now, v = W.visitor;
    // Engaged with her (robokit/attend.js engageVisitor): spoken to, or come up to, it stops, turns to her and waits,
    // whatever it was about held where it was, until the conversation is over and she has gone on
    const eng = this.eng = engageVisitor(this.eng ?? {}, this, v, dt, { talking: this.talking || now < (this.replyUntil ?? 0), level: this.about() });
    const hold = this.engaged = eng.on && (this.talking || !eng.give);      // (at a stride straight at it, she is passing: it gives way)
    if (!this.offPlan && now >= this.nextManners) { this.nextManners = now + 0.2; this.manners({ still: hold || this.still, back: true }); }
    if (this.aside.phase) this.stepAside(dt);
    else if (hold || now < this.pauseUntil) { m.v = 0; if (this.about() && !this.offPlan) m.faceTo(v.x, v.z, dt); }
    else { if (!this.task) this.think(); this.stepTask(); }
    if (this.offPlan) m.y = this.yFix; else { this.glide(dt); m.y = this.O.S.ground(m.x, m.z); }
    if (this.about()) { const g = hyp(v.x - m.x, v.z - m.z) - this.r - VR; if (g < this.minGap) this.minGap = g; if (g < this.O.minGap) { this.O.minGap = g; this.O.minWho = this.name; } }
    this.item.x = m.x; this.item.z = m.z; this.item.y = m.y + this.lift + (this.eyeY ?? 2.5);
  }
  away() { this.ghost = true; this.state = 'away'; this.item.y = -1e4; this.O.H.tmp.set(0, -1e4, 0); this.O.H.bubbles.place(this.bubble, this.O.H.tmp, this.W.now, false); if (this.task) { const t = this.task; this.task = null; try { t.return(); } catch { /* done */ } } this.m.stop(); this.aside.phase = 0; this.offPlan = false; }
}

// One with a body of its own (faculty/body.js): the gardener, the groundskeeper, the harbour master
class Named extends Out {
  constructor(O, spec) {
    const who = byId(spec.id), b = buildBody({ ...who.look });
    super(O, { id: spec.id, name: who.name, field: who.field, lines: spec.lines, radius: b.radius, top: b.top, speed: spec.speed ?? 2.4, reach: 10, aim: 1.7 });
    this.body = b; this.rest = who.rest ?? 'neutral'; this.eyeY = b.eye; this.cast = spec; b.root.visible = false; O.group.add(b.root); this.busy = false; this.nod = -9; this.lean = 0;
  }
  show() { this.ghost = false; this.body.root.visible = true; }
  away() { super.away(); this.body.root.visible = false; }
  draw(dt, vis, busy = this.busy) {
    const b = this.body, m = this.m, W = this.W, now = W.now, v = W.visitor;
    b.root.position.set(m.x, m.y + this.lift, m.z); b.root.rotation.y = m.yaw;
    if (!vis) return false;
    const t = now + this.phase, talking = this.talking; busy = busy && !talking && !this.aside.phase;
    // turning to her as she comes up (manners.js attendVisitor): the eyes, the head, then (when it is not at work) the body
    const at = this.attn = attendVisitor(this.attn, { x: m.x, z: m.z, yaw: m.yaw }, v, dt, { reach: 10, talking, hold: !!this.engaged, busy, keepWorking: busy || this.offPlan, level: this.about() });
    if (at.yaw !== null && m.v < 0.3 && !this.aside.phase && !this.offPlan && !talking) m.face(at.yaw, dt * at.rate);
    const speak = this.bubble.talking(now);
    b.animate({ t, dt, moving: m.v > 0.25, speed: m.v, busy, speak, nod: Math.max(0, 1 - Math.abs(now - this.nod - 0.5) / 0.5), head: talking ? 0 : at.head, yaw: m.yaw });
    const dv = this.about() ? hyp(v.x - m.x, v.z - m.z) : 1e9, expr = now < this.exprUntil ? this.expr : busy ? 'focus' : dv < 12 && this.rest === 'neutral' ? 'happy' : this.rest;
    b.faceTick({ t, dt, expr, look: at.looking ? at.eye : talking ? clamp((((Math.atan2(v.x - m.x, v.z - m.z) - m.yaw + Math.PI * 3) % TAU) - Math.PI) * 1.2, -1, 1) : Math.sin(t * 0.37) * 0.3, lookY: busy ? -0.6 : 0, speak });
    this.O.H.tmp.set(m.x, m.y + this.lift + b.top + 0.35, m.z); this.O.H.bubbles.place(this.bubble, this.O.H.tmp, now, this.O.dist(this) < 90);      // (nothing is called across the grounds)
    return busy;
  }
}

// Her lantern at night: a candle flame (flame.js) behind warm glass, a soft halo round it and a pool of warm light
// on the ground under her. No light of its own: a lamp-pool slot would be taken from the rooms, and a shadow-casting
// light costs too much, so the glow is drawn (additive, no depth write) and only once the day has gone.
// The pane, wick and halo are put in the hand that carries the lantern (body.js TOOLS.lantern: its glass at
// [0, -0.16, 0.12]); the pool is laid on the ground below it.
function lanternGlow(O, hand) {
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c), uT = { value: 0 }, add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, fog: false };
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.089, 0.089, 0.19, 8), new THREE.MeshBasicMaterial({ color: 0xffb35a, ...add }));
  const flame = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.24).translate(0, 0.108, 0), makeCandleFlame(THREE, uT)); flame.scale.setScalar(0.62);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: 0xffa040, ...add })); halo.scale.setScalar(1.3);
  glass.position.set(0, -0.16, 0.12); flame.position.set(0, -0.245, 0.12); halo.position.set(0, -0.16, 0.12);
  const parts = new THREE.Group(); parts.add(glass, flame, halo); hand.add(parts);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: tex, color: 0xff9a40, ...add })); pool.renderOrder = 2; O.group.add(pool);
  const at = new THREE.Vector3();
  return {
    update(now, on, k) {
      parts.visible = pool.visible = on && k > 0.01; if (!parts.visible) return;
      uT.value = now; const f = 0.9 + 0.1 * Math.sin(now * 9.1) * Math.sin(now * 3.7 + 1);      // (a candle's own unsteadiness)
      glass.material.opacity = 0.75 * k; halo.material.opacity = 0.55 * k * f; flame.visible = k > 0.3;
      hand.updateMatrixWorld(true); hand.localToWorld(at.set(0, -0.16, 0.12));
      const h = Math.max(0.5, at.y - O.S.ground(at.x, at.z)), r = 2.2 + h * 1.1;                       // a wider, fainter pool the higher it is carried
      pool.position.set(at.x, O.S.ground(at.x, at.z) + 0.06, at.z); pool.scale.set(r * 2, 1, r * 2); pool.material.opacity = Math.min(1, 1.6 / h) * 0.42 * k * f;
    },
  };
}

// ---- the gardener (after the house's Gardener: the jobs, the round of nearby places, the water and the petals) ----
const KEEP_OFF = 12;
class Gardener extends Named {
  constructor(O, spec) { super(O, spec); this.work = { kind: null, pour: 0, T: new THREE.Vector3(), cut: -1, t0: 0 }; this.pourK = 0; this.reach = 0; this.drop = 0; this.fx = new Fx(O.group); this.jobs = {}; this.job = null; this.site = null; this.rnd = Math.random; this.seen = new Map(); this.places = []; this.glow = lanternGlow(O, this.body.hands[0]); }
  // What to do next, and where. Jobs are weighted by the hour; places by how near they are (a round, not a
  // criss-cross of the island), and nothing is begun right beside the visitor.
  planWork() {
    const O = this.O, G = O.G, W = this.W, v = W.visitor, w = this.cast.jobs(O.hour, O.light), h = O.home(0), opts = [];
    const lists = { water: [...G.pots, ...G.beds.filter((_, i) => i % 3 === 0)], deadhead: G.beds, weed: G.beds, hedge: G.hedges, rake: G.sweeps, trees: G.under, tend: G.tend, shed: [{ x: h.x, z: h.z, fx: h.x - (h.dz ?? 0) * 4, fz: h.z + (h.dx ?? 1) * 4 }], bench: G.benches.filter(b => !O.seatTaken(b) && this.cast.bench(b)) };
    // she has the whole island to keep: a part of it she has not been to lately is liked best, the next job is a walk away and
    // not next door, and if the visitor has not seen her for a few minutes the work is found somewhere in her sight
    const due = v.present && W.now - (this.sawHer ?? W.now) > 120;
    for (const k in lists) { const list = lists[k], base = w[k] ?? 0; if (!base || !list.length) continue;
      for (const s of list) { const ds = hyp(s.x - this.x, s.z - this.z), last = this.seen.get(Math.floor(s.x / 50) * 64 + Math.floor(s.z / 50)) ?? -1e9;
        let qv = (ds < 8 || s === this.site ? 0.03 : ds < 30 ? 0.4 : ds < 120 ? 1 : ds < 200 ? 0.22 : 0.06) * (0.04 + 1 - Math.exp(-(W.now - last) / 420));
        if (v.present) { const dv = hyp(s.x - v.x, s.z - v.z); if (dv < KEEP_OFF) qv *= 0.05; else if (due && dv < 75) qv *= 12; }
        opts.push([{ k, s }, base * qv / list.length]); } }
    return weighted(opts, this.rnd);
  }
  think() {
    const O = this.O, sh = O.shift.gardener;
    void sh;                                                                             // (robots: she does not go home, whatever the hour)
    const p = this.planWork(); if (!p) return this.run('idle', this.wait(4));
    this.begin(p);
  }
  begin(p) { this.job = p.k; this.site = p.s; this.jobs[p.k] = (this.jobs[p.k] ?? 0) + 1; this.seen.set(Math.floor(p.s.x / 50) * 64 + Math.floor(p.s.z / 50), this.W.now); this.places.push([p.k, Math.round(p.s.x), Math.round(p.s.z), Math.round(this.W.now)]); if (this.places.length > 80) this.places.shift(); this.run(p.k, this[p.k](p.s)); }
  // (at night the trug is left on the path and the lantern taken up in that hand: she works by its light)
  away() { super.away(); this.glow.update(0, false, 0); }
  setTools(r, l) { const night = !!this.O.shift?.night; this.body.setTool(1, r); this.body.setTool(0, night && (l === 'trug' || !l) ? 'lantern' : l); }
  *goWork(s, side = false) {
    this.state = 'to ' + this.job; if (!(yield* this.trip(s.x, s.z, { patience: 20 }))) return false;
    // (watering, she stands side on: the spout is at her right hand)
    const dx = s.fx - this.x, dz = s.fz - this.z, yaw = side ? Math.atan2(-dz, dx) : Math.atan2(dx, dz); for (let t = 0; t < 1.1; t += this.W.dt) { this.m.face(yaw, this.W.dt * 1.5); yield; }
    this.state = this.job; this.posted = true; return true;
  }
  done() { const w = this.work; w.kind = null; w.pour = 0; this.busy = false; this.posted = false; this.lean = 0; this.drop = 0; this.setTools('trowel', 'trug'); }
  // where the work is: from where she stands toward the bed, a little way in and along it
  workPoint(s, inset, along, y) { const dx = s.fx - this.x, dz = s.fz - this.z, L = hyp(dx, dz) || 1, d = Math.min(L + inset, 3.4); return this.work.T.set(this.x + dx / L * d - dz / L * along, y ?? s.top ?? 1, this.z + dz / L * d + dx / L * along); }
  maybe(pool, chance) { if (this.rnd() < chance && this.O.dist(this) < 70 && !this.talking) this.line(pool, 'happy'); }
  // Watering: the rose over the plants, water falling from it onto them; she lifts between goes, and moves along
  *water(s) {
    const W = this.W, w = this.work;
    try { if (!(yield* this.goWork(s, true))) return; this.maybe('water', 0.5);
      let along = -0.5, dir = 1; w.kind = 'water'; w.t0 = W.now; const end = W.now + 16 + this.rnd() * 12;
      while (W.now < end) { const k = (W.now - w.t0) % 4.6; w.pour = k < 3.6 ? 1 : 0; if (w.pour) along += dir * W.dt * 0.3; if (Math.abs(along) > 0.7) dir = -dir; this.workPoint(s, 0, along, s.top - 0.3); yield; }
    } finally { this.done(); }
  }
  // Deadheading: the secateurs to a spent head, snip, the head falls; the next one
  *hedge(s) { yield* this.deadhead(s, [COL.weed, COL.weed, COL.leaf[1]], 'hedge'); }
  *trees(s) { yield* this.rake(s); }
  *shed(s) { yield* this.tend(s, 'shed', 6); }
  *deadhead(s, cols = COL.petal, say = 'deadhead') {
    const W = this.W, w = this.work;
    try { if (!(yield* this.goWork(s))) return; this.setTools('secateurs', 'trug'); this.maybe(say, 0.5); this.busy = true; w.kind = 'snip';
      for (let i = 0, n = 6 + Math.floor(this.rnd() * 5); i < n; i++) { this.workPoint(s, -0.2 + this.rnd() * 0.5, (this.rnd() - 0.5) * 1.6, (s.top ?? 1.4) - this.rnd() * 0.3); this.reach = 1; yield* this.wait(1.1);
        const T3 = w.T; this.fx.spawn(FX.PETAL, T3.x, T3.y, T3.z, (this.rnd() - 0.5) * 0.4, 0.4, (this.rnd() - 0.5) * 0.4, cols[i % 3], 4, this.O.S.ground(T3.x, T3.z) + 0.04); this.reach = 0.3; yield* this.wait(0.8); }
    } finally { this.reach = 0; this.done(); }
  }
  // Weeding: down to the soil with the trowel; what comes up goes in the trug
  *weed(s) {
    const W = this.W, w = this.work;
    try { if (!(yield* this.goWork(s))) return; this.maybe('weed', 0.4); this.busy = true; w.kind = 'dig'; this.drop = 0.55; this.lean = 0.2;
      for (let i = 0; i < 5; i++) { this.workPoint(s, -0.5, (this.rnd() - 0.5) * 1.4, (s.y ?? 0) + 0.1); this.reach = 1;
        const end = W.now + 2.6 + this.rnd(); while (W.now < end) { if (this.rnd() < W.dt * 5) { const T3 = w.T; this.fx.spawn(FX.CLOD, T3.x, T3.y + 0.1, T3.z, (this.rnd() - 0.5) * 2, 2 + this.rnd() * 2, (this.rnd() - 0.5) * 2, i % 2 ? COL.weed : COL.soil, 1.2, T3.y - 0.1); } yield; }
        this.reach = 0; yield* this.wait(0.7); }
    } finally { this.reach = 0; this.done(); }
  }
  // Raking the gravel: leaves lying along a stretch of walk, drawn stroke by stroke into a heap; the heap into the trug
  *rake(s) {
    const W = this.W, w = this.work, fx = this.fx, [ax, az] = s.a, [bx, bz] = s.b, L = hyp(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L, gy = (x, z) => this.O.S.ground(x, z) + 0.05, leaves = [];
    try { if (!(yield* this.goWork(s))) return; this.setTools('rake', 'trug'); this.maybe('rake', 0.5);
      for (let i = 0; i < 16; i++) { const t = this.rnd() * L, l = (this.rnd() - 0.5) * 4.5, x = ax + dx * t - dz * l, z = az + dz * t + dx * l; leaves.push(fx.spawn(FX.LEAF, x, gy(x, z), z, 0, 0, 0, COL.leaf[i % 3], 240)); }
      const px = bx, pz = bz;
      for (let t = 0; t <= L; t += 1.5) {
        const x = ax + dx * t, z = az + dz * t; this.posted = false; if (!(yield* this.travel(x, z, { patience: 6 }))) continue; this.posted = true; w.kind = 'rake'; this.busy = false;
        for (let k = 0; k < 2.4; k += W.dt) { this.m.face(Math.atan2(dx, dz), W.dt * 1.5); const hx = this.x + dx * 2.1, hz = this.z + dz * 2.1;
          for (const i of leaves) { const a = i * 3, p = fx.p; if (p[a + 1] < -100) continue; if (hyp(p[a] - hx, p[a + 2] - hz) < 2.6) { p[a] += (px - p[a]) * W.dt * 0.45; p[a + 2] += (pz - p[a + 2]) * W.dt * 0.45; p[a + 1] = gy(p[a], p[a + 2]); } }
          fx.pa.needsUpdate = true; yield; }
      }
      w.kind = 'dig'; this.busy = true; this.setTools('trowel', 'trug'); yield* this.wait(2.2); for (const i of leaves) fx.life[i] = 0.01;
    } finally { for (const i of leaves) if (fx.life[i] > 1) fx.life[i] = 1; this.done(); }
  }
  // The potting bench, the cold frames: hands busy among the pots
  *tend(s, say = 'tend', secs = 12) { try { if (!(yield* this.goWork(s))) return; this.maybe(say, 0.5); this.busy = true; this.work.kind = 'pot'; yield* this.wait(secs + this.rnd() * 8); } finally { this.done(); } }
  // A sit on a bench: up to it, round and back onto one end of the seat (the middle is left for the visitor)
  *bench(s) {
    const O = this.O, W = this.W;
    try { if (!(yield* this.goWork({ x: s.x, z: s.z, fx: s.x + s.fx * 6, fz: s.z + s.fz * 6 }))) return;
      O.sit(s, this); const e = O.seatSpot(s, 1.55);
      this.still = true; if (!(yield* this.walkLine([{ x: e.x, z: e.z }], 0.9, false))) return; this.state = 'resting'; this.work.kind = 'rest'; this.lift = s.h - 1.5 * this.body.root.scale.y + 0.06; this.maybe('bench', 0.5); if (O.shift.night) this.setTools('thermos', 'lantern');      // (a minute with a thermos, and on again)
      const until = W.now + (O.shift.night ? 40 + this.rnd() * 30 : 70 + this.rnd() * 80); while (W.now < until && O.shift.gardener === 'work' && (this.cast.jobs(O.hour, O.light).bench ?? 0) > 1) { this.m.face(Math.atan2(s.fx, s.fz), W.dt); yield; }
      this.lift = 0; yield* this.walkLine([{ x: s.x, z: s.z }], 0.9, false);
    } finally { this.lift = 0; this.still = false; this.offPlan = false; O.unsit(this); this.done(); }
  }
  update(dt, vis) {
    this.frame(dt); const b = this.body, w = this.work, W = this.W;
    this.dropK = (this.dropK ?? 0) + (this.drop - (this.dropK ?? 0)) * Math.min(1, dt * 2); const lift0 = this.lift; this.lift = lift0 - this.dropK * 1;
    const busy = this.draw(dt, vis); this.lift = lift0;
    this.glow.update(W.now, vis && !this.ghost && b.hands[0].userData.tool === 'lantern', Math.max(0, Math.min(1, (0.45 - this.O.light) / 0.3))); if (!vis) return;
    const on = !this.talking && !this.aside.phase; { const v = W.visitor; if (!v.present || hyp(v.x - this.x, v.z - this.z) < 70) this.sawHer = W.now; else this.sawHer ??= W.now; }
    this.pourK += ((on && w.kind === 'water' && w.pour ? 1 : 0) - this.pourK) * Math.min(1, dt * 3);
    b.bob.rotation.z -= this.pourK * 0.6; b.bob.rotation.x += this.lean * (busy ? 1 : 0);
    if (w.kind === 'rake' && on) { const h = b.hands[1], r = h.userData.rest; h.position.set(r[0] - 0.1, r[1] + 0.1, r[2] + 0.2 + 0.4 * Math.sin(W.now * 2.6)); }
    else if (this.reach > 0.01 && on && (w.kind === 'snip' || w.kind === 'dig')) { b.root.updateMatrixWorld(true); const h = b.hands[1], r = h.userData.rest; V1.copy(w.T); b.inner.worldToLocal(V1); V2.set(r[0], r[1], r[2]); V1.sub(V2); const L = V1.length(); if (L > 1.15) V1.multiplyScalar(1.15 / L); this.reachK = (this.reachK ?? 0) + (this.reach - (this.reachK ?? 0)) * Math.min(1, dt * 5); h.position.copy(V2).addScaledVector(V1, this.reachK); } else this.reachK = 0;
    if (this.pourK > 0.75 && b.spout) { b.root.updateMatrixWorld(true); for (let i = 0; i < 2; i++) { V1.set(b.spout[0], b.spout[1], b.spout[2]); b.inner.localToWorld(V1); const T3 = w.T, fall = Math.sqrt(Math.max(0.03, 2 * (V1.y - T3.y) / 26)), j = () => (Math.random() - 0.5) * 0.5; this.fx.spawn(FX.WATER, V1.x, V1.y, V1.z, (T3.x - V1.x) / fall + j(), 0, (T3.z - V1.z) / fall + j(), i ? COL.water2 : COL.water, 1.2, T3.y); } }
    this.fx.update(dt, W.now);
  }
}

// ---- the groundskeeper: a mower. Stripes up and down the open lawn, a turn at each end; home in the evening ----
class Mower extends Named {
  constructor(O, spec) { super(O, spec); this.fieldAt = 0; this.stripeAt = 0; this.runs = 0; }
  // (robots: he mows at every hour; with no lawn to mow he goes about the shed's end of the grounds and back, never parked)
  think() { const O = this.O; if (!O.fields.length) return this.run('round', this.round()); this.run('mow', this.mow()); }
  *round() { const O = this.O, h = O.home(1); this.state = 'about the shed'; yield* this.trip(h.x + (Math.random() - 0.5) * 20, h.z + (Math.random() - 0.5) * 20, { patience: 30 }); this.busy = true; try { yield* this.wait(6 + Math.random() * 6); } finally { this.busy = false; } }
  *mow() {
    const O = this.O, W = this.W, m = this.m;
    for (;;) {
      // a block of stripes on one lawn, then off to another: every lawn on the island is his, and he is seen on all of them
      if (!this.F || this.block <= 0) { const l = O.fields.filter(f => f !== this.F); this.F = l.length ? pick(l) : O.fields[0]; this.block = 6 + Math.floor(Math.random() * 5); if (this.runs && O.dist(this) < 80) this.line('field'); }
      const F = this.F; this.stripeAt = (F.next ?? 0) % F.stripes.length; F.next = this.stripeAt + 1; this.block--;
      const st = F.stripes[this.stripeAt], fwd = this.stripeAt % 2 === 0;
      for (const run of fwd ? st.runs : [...st.runs].reverse()) {
        const a = fwd ? run[0] : run[1], b = fwd ? run[1] : run[0], pa = F.at(a, st.q), pb = F.at(b, st.q);
        this.state = 'turning'; if (!(yield* this.trip(pa.x, pa.z, { patience: 30, must: true }))) continue;
        for (let t = 0; t < 1.2; t += W.dt) { m.face(Math.atan2(pb.x - pa.x, pb.z - pa.z), W.dt * 2); yield; }
        // down the line: it stops for anybody in the way and goes on when they have gone (no going round: the stripe is the point)
        this.state = 'mowing'; this.still = true; let last = { x: m.x, z: m.z }, tries = 0;
        try { for (;;) { if (!m.path && !m.goTo(pb.x, pb.z)) { if (++tries > 20) break; yield* this.wait(1); continue; }
          const s = m.update(W.dt, 0.62); if (hyp(m.x - last.x, m.z - last.z) > 3) { O.stripe(last, { x: m.x, z: m.z }, fwd); last = { x: m.x, z: m.z }; }
          if (s === 'arrived') break; if (s === 'failed' || s === 'idle') { yield* this.wait(1.2); if (++tries > 40) break; } if (O.shift.mower !== 'mow') break; yield; } }
        finally { this.still = false; m.stop(); O.stripe(last, { x: m.x, z: m.z }, fwd); }
        this.runs++; if (O.shift.mower !== 'mow') return;
      }
    }
  }
  update(dt, vis) { this.frame(dt); this.draw(dt, vis, false); if (vis) { const b = this.body; b.hands.forEach(h => { const r = h.userData.rest; h.position.set(r[0], r[1], r[2]); }); if (this.state === 'mowing') b.bob.rotation.z += Math.sin(this.W.now * 31) * 0.004; } }
}

// ---- the harbour master: keeps to the Landing ---------------------------------------------------------------
class Master extends Named {
  constructor(O, spec) { super(O, spec); this.greeted = false; this.scope = 0; this.up = 0; this.lamp = 0; }
  think() {
    const O = this.O, c = this.cast, night = O.shift.master === 'night', P = O.masterSpots;
    const opts = [['sock', night ? 1 : 3], ['sky', night ? 4 : 3], ['beat', 2], ['sit', P.seat && !O.seatTaken(P.seat) ? c.sit(O.hour, O.light) : 0]].filter(([k]) => k !== this.last && (k === 'sit' || k === 'beat' || P[k]));
    const k = weighted(opts, Math.random) ?? 'beat'; this.last = k; this.run(k, this[k]());
  }
  *greet() { const W = this.W, v = W.visitor; this.state = 'greeting'; for (let t = 0; t < 1.2; t += W.dt) { this.m.faceTo(v.x, v.z, W.dt * 2); yield; } this.nod = W.now; this.line(this.O.shift.master === 'night' ? 'greetNight' : 'greet'); yield* this.wait(4, () => { this.m.faceTo(v.x, v.z, W.dt); return false; }); }
  *look(p, secs, kind) { const W = this.W; this.state = kind; if (!(yield* this.travel(p.x, p.z, { patience: 15 }))) return; this.posted = true; try { const yaw = Math.atan2(p.fx - this.x, p.fz - this.z), end = W.now + secs; if (Math.random() < 0.35 && this.O.dist(this) < 70) this.line(kind);
    while (W.now < end) { const k = (W.now - (end - secs)) / secs; this.m.face(yaw + (kind === 'sky' ? Math.sin(W.now * 0.35) * 0.7 : 0), W.dt * 1.2); this.scope = kind === 'sky' && k > 0.1 && k < 0.7 ? 1 : 0; this.up = kind === 'sock' && k < 0.45 ? 1 : 0; this.busy = k > (kind === 'sock' ? 0.5 : 0.75); yield; } } finally { this.scope = 0; this.up = 0; this.busy = false; this.posted = false; } }
  *sock() { yield* this.look(this.O.masterSpots.sock, 14 + Math.random() * 8, 'sock'); }
  *sky() { yield* this.look(this.O.masterSpots.sky, 16 + Math.random() * 10, 'sky'); }
  *beat() { const P = this.O.masterSpots; this.state = 'beat'; for (const p of Math.random() < 0.5 ? P.beat : [...P.beat].reverse()) { if (!(yield* this.travel(p.x, p.z, { patience: 12 }))) break; yield* this.wait(2 + Math.random() * 3); } }
  // on the shelter's bench, at one end: a hop up, the logbook, a hop down
  *sit() {
    const O = this.O, W = this.W, s = O.masterSpots.seat;
    try { this.state = 'to the shelter'; if (!(yield* this.travel(s.x, s.z, { patience: 15 }))) return; O.sit(s, this); const e = O.seatSpot(s, 1.7);
      this.still = true; this.hop = { t0: W.now, from: 0, to: s.h }; if (!(yield* this.walkLine([{ x: e.x, z: e.z }], 1.6, false))) return; this.hop = null; this.lift = s.h; this.state = 'in the shelter';
      if (O.shift.master === 'night') this.body.setTool(0, 'thermos');                                  // the night watch for the airship: the logbook, and something hot
      if (Math.random() < 0.4 && O.dist(this) < 60) this.line('sit');
      const end = W.now + 50 + Math.random() * 60; while (W.now < end) { this.m.face(Math.atan2(s.fx, s.fz), W.dt * 1.5); this.busy = ((W.now * 0.08) % 1) < 0.6; yield; }
      this.busy = false; this.hop = { t0: W.now, from: s.h, to: 0 }; yield* this.walkLine([{ x: s.x, z: s.z }], 1.6, false);
    } finally { this.hop = null; this.lift = 0; this.busy = false; this.still = false; this.offPlan = false; O.unsit(this); this.body.setTool(0, 'spyglass'); }
  }
  update(dt, vis) {
    const b = this.body, W = this.W, O = this.O, v = W.visitor;
    // the visitor's arrival: greeted once, from wherever he is
    if (!this.greeted && v.present && this.about() && hyp(v.x - this.x, v.z - this.z) < 36 && O.since > 1.5 && !this.talking) { this.greeted = true; if (this.offPlan) { this.nod = W.now; this.line(O.shift.master === 'night' ? 'greetNight' : 'greet'); } else this.run('greet', this.greet(), false); }
    this.frame(dt);
    if (this.hop) { const k = clamp((W.now - this.hop.t0) / 0.7, 0, 1); this.lift = this.hop.from + (this.hop.to - this.hop.from) * k + Math.sin(k * Math.PI) * 0.7; }
    this.draw(dt, vis); if (!vis) return;
    this.scopeK = (this.scopeK ?? 0) + (this.scope - (this.scopeK ?? 0)) * Math.min(1, dt * 3); this.upK = (this.upK ?? 0) + (this.up - (this.upK ?? 0)) * Math.min(1, dt * 2);
    if (this.scopeK > 0.01) { const h = b.hands[0], r = h.userData.rest; h.position.set(r[0] + 0.3 * this.scopeK, r[1] + 0.85 * this.scopeK, r[2] + 0.2 * this.scopeK); h.rotation.x = -0.5 * this.scopeK; } else b.hands[0].rotation.x = 0;
    b.bob.rotation.x -= 0.16 * Math.max(this.upK, this.scopeK * 0.6);
    // the light: a glass by day, lit from dusk, turning
    const on = 1 - clamp((O.light - 0.42) / 0.55, 0, 1), k = 0.16 + on * (1.5 + 0.9 * Math.max(0, Math.sin(W.now * 1.3))); b.mover.material.color.setRGB(k, k * 0.86, k * 0.6);
  }
}

// ---- the ordinary make (faculty/researchers.js): crossing from door to door, sitting, talking, keeping watch ----
// How much larger than the indoor make (which was sized to sit at a kit table: 3 ft standing) one is out of doors, where it
// floats beside benches, lamps and the visitor: the top of the head about four feet up, as the house's staff are.
const OUT = 1.45;
const CARRY = {
  book: () => [paint(T(new THREE.BoxGeometry(0.3, 0.4, 0.07), { r: [0.2, 0, 0] }), '#7a2f2a'), paint(T(new THREE.BoxGeometry(0.27, 0.37, 0.075), { p: [0.012, 0, 0], r: [0.2, 0, 0] }), '#efe6d2')],
  books: () => [['#2f4a40', 0], ['#8f6a24', 0.075], ['#3d5873', 0.15]].map(([c, y]) => paint(new THREE.BoxGeometry(0.4, 0.07, 0.3).translate(0, y, 0), c)),
  cup: () => [paint(cyl(0.075, 0.06, 0.17, 8).translate(0, 0.05, 0), '#efe6d2'), paint(cyl(0.08, 0.08, 0.02, 8).translate(0, 0.14, 0), '#4a4d52')],
  laptop: () => [paint(T(new THREE.BoxGeometry(0.62, 0.04, 0.42), { r: [0, 0, 1.45] }), '#9aa0a4')],
  open: () => [paint(new THREE.BoxGeometry(0.66, 0.03, 0.44), '#b9bcc0'), paint(T(new THREE.BoxGeometry(0.66, 0.42, 0.025), { p: [0, 0.2, 0.26], r: [0.28, 0, 0] }), '#8f969b')],
  read: () => [-1, 1].flatMap(sx => [paint(T(new THREE.BoxGeometry(0.28, 0.03, 0.4), { p: [sx * 0.145, 0, 0], r: [0, 0, sx * 0.2] }), '#f1e9d6'), paint(T(new THREE.BoxGeometry(0.29, 0.012, 0.42), { p: [sx * 0.145, -0.02, 0], r: [0, 0, sx * 0.2] }), '#3d5873')]),
  lantern: () => [paint(cyl(0.1, 0.12, 0.04, 8).translate(0, -0.3, 0), '#2c2c34'), paint(cyl(0.05, 0.11, 0.07, 8).translate(0, -0.03, 0), '#2c2c34'), paint(T(new THREE.TorusGeometry(0.07, 0.012, 4, 10), { p: [0, 0.05, 0] }), '#2c2c34'), ...[0, 1, 2, 3].map(i => paint(new THREE.BoxGeometry(0.015, 0.24, 0.015).translate(Math.cos(i * TAU / 4) * 0.09, -0.16, Math.sin(i * TAU / 4) * 0.09), '#2c2c34'))],
};
const GLOW = {
  lantern: () => [paint(cyl(0.075, 0.085, 0.2, 8).translate(0, -0.17, 0), '#ffd08a')],
  open: () => [paint(T(new THREE.PlaneGeometry(0.6, 0.36), { p: [0, 0.2, 0.244], r: [0.28 + Math.PI, 0, 0] }), '#cfe0f4')],
};
class Ordinary extends Out {
  constructor(O, slot) {
    super(O, { name: '', radius: 0.62, top: 4.6, speed: 3.1, reach: 9, aim: 1.4 }); this.m.need = 1.32;
    this.slot = slot; this.alpha = 0; this.fadeTo = 0; this.sitK = 0; this.sitTo = 0; this.walk = 0; this.mats = Array.from({ length: PARTS }, () => new THREE.Matrix4()); this.who = null; this.errand = null; this.eyeY = 2.6; this.headYaw = 0;
    this.item.act = () => this.speak();
  }
  // which of the troupe, and what in the hand
  dress(who, carry, hat) {
    const O = this.O, K = O.kit, r = who.r, g = OUT * (hat ? 1.08 : 0.95 + ((r.seed * 37) % 11) / 11 * 0.13), s = r.size * g, hip = 1.25 * r.size, tint = new THREE.Color(r.shell);
    this.who = who; this.name = r.name; this.bubble = who.bubble ??= O.H.bubbles.make(r.name); this.spec.name = r.name; this.size = r.size; this.g = g; this.hip = 1.3; this.carry = carry; this.light = carry === 'lantern' || carry === 'open';
    const trunk = merge(K.statics({ ...r, seated: false, pose: 'walk', top: 0 }, true)).translate(0, -hip, 0).scale(g, g, g);
    const head = K.headGeo.clone(); { const C = head.attributes.color; for (let i = 0; i < C.count; i++) C.setXYZ(i, C.getX(i) * tint.r, C.getY(i) * tint.g, C.getZ(i) * tint.b); head.scale(s, s, s); }
    const hats = hat ? [paint(cyl(0.3 * s, 0.25 * s, 0.1 * s, 12).translate(0, 0.33 * s, 0), '#1f2a44'), paint(T(cyl(0.2 * s, 0.2 * s, 0.015, 10), { p: [0, 0.28 * s, 0.22 * s], r: [0.25, 0, 0] }), '#17140f')] : [];
    const hand = () => K.handGeo.clone().scale(s, s, s), cap = paint(T(new THREE.SphereGeometry(0.2 * s, 12, 5, 0, TAU, Math.PI / 2, Math.PI / 2), { p: [0, 0.06 * s, 0], s: [1, 0.5, 1] }), '#4a4d52');      // (it floats, as the staff of the house do: no legs out here)
    const parts = [[P_TRUNK, merge([trunk, cap])], [P_HEAD, merge([head, ...hats])], [P_HL, hand()], [P_HR, hand()]];
    if (CARRY[carry]) parts.push([P_PROP, merge(CARRY[carry]()).scale(g, g, g)]);
    O.bodies.dress(this.slot, parts.map(([k, g]) => [k, g.index ? g.toNonIndexed() : g]));
    const eyes = paint(K.eyeGeo.clone().scale(s, s * r.eyeH, s), r.eye), glow = [[P_HEAD, eyes], [P_RING, paint(T(new THREE.TorusGeometry(0.27 * s, 0.026, 5, 18), { r: [Math.PI / 2, 0, 0] }), r.eye)]]; if (GLOW[carry]) glow.push([P_PROP, merge(GLOW[carry]()).scale(g, g, g)]);
    O.lights.dress(this.slot, glow.map(([k, g]) => [k, g.index ? g.toNonIndexed() : g]));
    this.alpha = 0; this.fadeTo = 0; this.sitK = this.sitTo = 0; this.talk = null; this.seat = null;
  }
  appear() { this.ghost = false; this.fadeTo = 1; }
  *vanish() { this.fadeTo = 0; this.m.stop(); while (this.alpha > 0.02) yield; this.ghost = true; }
  gone() { this.away(); this.O.unsit(this); this.O.bodies.clear(this.slot); this.O.lights.clear(this.slot); this.errand = null; this.who.out = false; this.who = null; this.alpha = 0; }
  think() { if (this.errand) { const e = this.errand; this.run(e.kind, this.go(e)); } }
  *go(e) { try { yield* e.run(this); } finally { /* whatever happened, it is over */ } if (this.errand === e) { yield* this.vanish(); this.gone(); } }
  // out at a door: down its steps (or, set down part way along at the start, simply there)
  *leave(door) { const w = door.way; this.put(w.at(-1).x, w.at(-1).z, Math.atan2(w[0].x - w.at(-1).x, w[0].z - w.at(-1).z)); this.offPlan = true; this.yFix = w.at(-1).y; this.m.y = this.yFix; this.appear(); this.state = 'leaving ' + door.name; const ok = yield* this.walkLine([...w].reverse().filter((_, i) => i % 2 === 0 || i === w.length - 1), 2.3); this.offPlan = false; return ok; }
  *enter(door) { const O = this.O, v = this.W.visitor; this.state = 'to ' + door.name;
    for (let n = 0; n < 6 && O.onWay(door, v); n++) { const pt = this.roomSpot(5, door.foot.x, door.foot.z, 14); if (pt) yield* this.travel(pt.x, pt.z, { patience: 8 }); yield* this.wait(3); }      // she is on the steps: wait off the walk
    if (!(yield* this.travel(door.foot.x, door.foot.z, { patience: 15, must: true }))) return false;
    this.state = 'entering ' + door.name; yield* this.walkLine(door.way.filter((_, i) => i % 2 === 0 || i === door.way.length - 1), 2.3); return true; }
  speak() {
    const O = this.O, W = this.W, pool = [...(this.errand?.lines ?? []), ...(this.who.r.group ? O.kit.SAY[this.who.r.group] : [])], n = pool.length; if (!n) return;
    this.who.lineAt = ((this.who.lineAt ?? this.who.r.seed) + 1) % n; this.say(pool[this.who.lineAt], 'happy', 4.5); if (!this.offPlan && !this.seat) this.pauseUntil = W.now + 2.6;
  }
  update(dt, vis) {
    this.errand?.greet?.(this); this.frame(dt); const O = this.O, m = this.m, W = this.W, now = W.now, s = this.size, g = this.g, v = W.visitor; if (!this.who) return;
    if (this.alpha !== this.fadeTo) { this.alpha = this.fadeTo > this.alpha ? Math.min(this.fadeTo, this.alpha + dt * 1.4) : Math.max(this.fadeTo, this.alpha - dt * 1.4); O.bodies.fade(this.slot, this.alpha); O.lights.fade(this.slot, this.alpha); }
    this.sitK += clamp(this.sitTo - this.sitK, -dt * 1.6, dt * 1.6); 
    if (!vis) { if (this.talking0) this.talking0 = false; }
    // it floats: a soft bob, a lean into the way it goes, a ring of light under it; seated, it settles on the seat and the ring goes out
    const k = this.sitK, seatH = this.seat?.h ?? 1.4, sp = clamp(m.v / 2, 0, 1), ph = 0, t = now + this.phase, hipY = this.hip + (seatH + 0.03 - this.hip) * k + Math.sin(t * 1.7) * 0.06 * (1 - k);
    this.leanK = (this.leanK ?? 0) + (0.11 * sp - (this.leanK ?? 0)) * Math.min(1, dt * 5);
    const R = M1.makeRotationY(m.yaw).setPosition(m.x, m.y + this.lift, m.z).multiply(M3.makeTranslation(0, hipY, 0)).multiply(M2.makeRotationFromEuler(O.euler.set(this.leanK + Math.sin(t * 0.7) * 0.02, 0, Math.sin(t * 0.9) * 0.03 * (1 - k), 'YXZ'))).multiply(M3.makeTranslation(0, -hipY, 0));
    const mt = this.mats, set = (i, x, y, z, rx = 0, ry = 0, rz = 0) => mt[i].multiplyMatrices(R, M2.makeRotationFromEuler(O.euler.set(rx, ry, rz, 'YXZ')).setPosition(x, y, z));
    set(P_TRUNK, 0, hipY, -0.08 * k, this.pose === 'type' || this.pose === 'read' ? 0.06 * k : 0);
    { const q = (1 - k) * (1 + 0.08 * Math.sin(t * 5)); mt[P_RING].multiplyMatrices(R, M2.makeScale(q, q, q).setPosition(0, hipY - 0.22 * s * g, 0)); }
    // the head: to the one it is talking with, to her when she is near or it is speaking, else the way it goes (or down to the page)
    let hy = 0, hp = 0; const o = this.talk;
    if (o) { const a = Math.atan2(o.x - m.x, o.z - m.z) - m.yaw; hy = clamp(Math.atan2(Math.sin(a), Math.cos(a)), -1.2, 1.2) * (0.6 + 0.4 * Math.sin(t * 0.7)); hp = Math.sin(t * 2.3) * 0.05; }
    else if (this.about() && (hyp(v.x - m.x, v.z - m.z) < 7 || this.bubble.talking(now))) { const a = Math.atan2(v.x - m.x, v.z - m.z) - m.yaw; hy = clamp(Math.atan2(Math.sin(a), Math.cos(a)), -1.25, 1.25); hp = -0.12; }
    else if (k > 0.5) { hp = this.pose === 'read' ? 0.4 : this.pose === 'type' ? 0.22 : 0; hy = Math.sin(t * 0.3) * 0.1; }
    this.headYaw += (hy - this.headYaw) * Math.min(1, dt * 4); set(P_HEAD, 0, hipY + 1.5 * s * g, -0.08 * k, hp, this.headYaw);
    // the hands, and what is in them
    const c = this.carry, sw = Math.sin(t * 2.1) * 0.03, gest = o && ((t * 0.11) % 1) < 0.5 ? 0.22 + Math.sin(t * 4.3) * 0.1 : 0; let lx = -0.42 * s, ly = hipY + 0.46 * s, lz = 0.14, rx = 0.42 * s, ry = hipY + 0.46 * s + gest + sw, rz = 0.14 + gest, px = 0, py = -1e3, pz = 0, prx = 0, pry = 0;
    if (c === 'book') { rx = 0.34 * s; ry = hipY + 0.52 * s; rz = 0.22; px = rx - 0.04; py = ry + 0.12; pz = rz + 0.07; }
    else if (c === 'books') { lx = -0.2; rx = 0.2; ly = ry = hipY + 0.5 * s; lz = rz = 0.34; px = 0; py = ly + 0.06; pz = 0.36; }
    else if (c === 'cup') { const sip = ((t * 0.07) % 1) > 0.9 && sp < 0.2 ? 1 : 0; rx = 0.3 * s; ry = hipY + (0.62 + sip * 0.6) * s; rz = 0.3 - sip * 0.1; px = rx; py = ry + 0.03; pz = rz + 0.06; }
    else if (c === 'laptop') { lx = -0.4 * s; ly = hipY + 0.62 * s; lz = 0.12; px = lx - 0.02; py = ly + 0.05; pz = 0.02; }
    else if (c === 'lantern') { rx = 0.5 * s; ry = hipY + 1.62 * s; rz = 0.3; px = rx; py = ry - 0.06; pz = rz; prx = Math.sin(t * 1.7) * 0.05; }      // held up beside the face, so that it lights it from the side and not from below
    else if (c === 'open') { const tt = this.seat?.table ?? null, y = tt ? m.y + this.lift + 0 : 0, on = ((t * 0.21) % 1) < 0.72; py = tt ? tt.y - (m.y + this.lift) + 0.02 : hipY + 0.2; pz = tt ? tt.d : 0.42; px = 0; lx = -0.15; rx = 0.15; ly = py + 0.06 + (on ? Math.max(0, Math.sin(t * 17)) * 0.03 : 0); ry = py + 0.06 + (on ? Math.max(0, Math.sin(t * 19 + 2)) * 0.03 : 0); lz = rz = pz - 0.04; void y; }
    else if (c === 'read') { const turn = ((t * 0.09) % 1) > 0.93 ? 1 : 0; px = 0; py = hipY + 0.42 * s; pz = 0.42; prx = -0.5; lx = -0.26; rx = 0.26 - turn * 0.2; ly = ry = py - 0.02; lz = rz = pz - 0.02; }
    // (worked out at the indoor size about the hip, then as much larger as the body is; a laptop on a real table stays on it)
    const tbl = c === 'open' && this.seat?.table, gg = tbl ? 1 : g, up = y => hipY + (y - hipY) * gg;
    set(P_HL, lx * gg, up(ly), lz * gg); set(P_HR, rx * gg, up(ry), rz * gg); set(P_PROP, px * gg, up(py), pz * gg, prx, pry);
    if (this.alpha > 0 || this.fadeTo > 0) { O.bodies.pose(this.slot, mt); O.lights.pose(this.slot, mt); }
    O.H.tmp.set(m.x, m.y + this.lift + hipY + 2.25 * s * g, m.z); O.H.bubbles.place(this.bubble, O.H.tmp, now, this.alpha > 0.5 && O.dist(this) < 90);
    this.item.y = this.ghost ? -1e4 : m.y + this.lift + hipY + 1.4 * s * g;
  }
}

// ---- errands: what an ordinary one is out for -----------------------------------------------------------------
// from a door, by the walks, to another door (cuts: by the worn path if there is one that way)
function* crossing(a, e) {
  const O = a.O, R = O.roads, ids = R.route(e.from.node, e.to.node, e.cuts ?? 0); if (!ids) return;
  const pts = R.points(ids, e.side ?? 1); e.pts = pts;
  if (e.start > 0) { const i = Math.min(pts.length - 2, Math.floor(e.start * pts.length)), p = pts[i], q = pts[i + 1]; a.put(p.x, p.z, Math.atan2(q.x - p.x, q.z - p.z)); a.appear(); a.at = i; e.start = 0; a.state = 'walking'; if (!(yield* a.follow(pts, { from: i + 1, speed: e.pace }))) return; }
  else { if (!(yield* a.leave(e.from))) return; a.state = 'walking'; if (!(yield* a.follow(pts, { speed: e.pace }))) return; }
  if (e.stop) yield* e.stop(a);
  yield* a.enter(e.to);
}
// to a seat, a while on it, and away
function* sitting(a, e) {
  const O = a.O, s = e.seat, W = a.W; O.sit(s, a);
  const spot = O.seatSpot(s, e.off ?? 1.5), down = function* () { a.still = true; a.seat = s; a.pose = e.pose; if (!(yield* a.walkLine([{ x: spot.x, z: spot.z }], 1.2, false))) return false; for (let t = 0; t < 0.8; t += W.dt) { a.m.face(Math.atan2(s.fx, s.fz), W.dt * 4); yield; } a.sitTo = 1; return true; };
  if (e.start > 0) { a.put(s.x, s.z, Math.atan2(s.fx, s.fz)); a.appear(); e.start = 0; a.offPlan = true; a.yFix = a.m.y; a.m.x = spot.x; a.m.z = spot.z; a.still = true; a.seat = s; a.pose = e.pose; a.sitK = a.sitTo = 1; }
  else { if (!(yield* a.leave(e.from))) return; a.state = 'to a seat'; const n = O.roads.nearest(s.x, s.z, 90, false), ids = n >= 0 ? O.roads.route(e.from.node, n, 0) : null; if (ids) yield* a.follow(O.roads.points(ids, 1)); if (!(yield* a.travel(s.x, s.z, { patience: 20, must: true }))) return; if (!(yield* down())) return; }
  a.state = 'sitting'; const until = W.now + e.secs; while (W.now < until && !e.over?.()) yield;
  a.sitTo = 0; while (a.sitK > 0.05) yield; yield* a.walkLine([{ x: s.x, z: s.z }], 1.2, false); a.offPlan = false; a.still = false; a.seat = null; a.pose = null; O.unsit(a);
  const n = O.roads.nearest(a.x, a.z, 90, false), ids = n >= 0 ? O.roads.route(n, e.to.node, 0) : null; a.state = 'walking'; if (ids) yield* a.follow(O.roads.points(ids, 1));
  yield* a.enter(e.to);
}

// ---- the whole of it ---------------------------------------------------------------------------------------------
export function peopleOutdoors(ctx, place, cast) {
  ({ THREE } = ctx); useThreeBody(THREE); V1 = new THREE.Vector3(); V2 = new THREE.Vector3(); M1 = new THREE.Matrix4(); M2 = new THREE.Matrix4(); M3 = new THREE.Matrix4();
  const group = new THREE.Group(); group.name = 'people outdoors'; ctx.scene.add(group);
  const O = { ctx, place, cast, THREE, group, all: [], ready: false, minGap: Infinity, minWho: '', hour: 12, light: 1, since: 0, shift: {}, euler: new THREE.Euler(), seats: new Map(), log: [] };
  const cam = ctx.camera.position;
  O.dist = a => hyp(cam.x - a.m.x, cam.z - a.m.z);
  O.seatTaken = s => O.seats.has(s.seat ?? s) || (ctx.walker?.seated && hyp(ctx.walker.pos.x - s.sx, ctx.walker.pos.z - s.sz) < 3.2);
  O.sit = (s, a) => O.seats.set(s.seat ?? s, a); O.unsit = a => { for (const [k, v] of O.seats) if (v === a) O.seats.delete(k); };
  // one end of a seat (the middle is the visitor's): `off` feet along it, on whichever side is further from her
  O.seatSpot = (s, off) => { if (s.spot) return s.spot; const v = O.W.visitor, sd = v.present && (v.x - s.sx) * s.ax + (v.z - s.sz) * s.az > 0 ? -1 : 1; return { x: s.sx + s.ax * off * sd, z: s.sz + s.az * off * sd }; };
  O.onWay = (door, v) => v.present && Math.abs(v.y - door.foot.y) < 9 && door.way.some((p, i) => i % 4 === 0 && hyp(p.x - v.x, p.z - v.z) < 4.5);
  let own = false, waited = 0, hooked = false;
  // Everybody abroad, for the animals (creatures.js gives way to these as it does to the visitor): a live list on the context
  // main.js shares, the same objects moved each frame, empty when nobody is out. And the other way: if the animals publish
  // theirs (ctx.animals: [{ x, z, r, slow }]), nobody goes on into a slow one (Out.blocked): it waits, and finds another way.
  const shared = Object.getPrototypeOf(ctx) ?? ctx, walkers = shared.walkers = [], spare = [];
  O.animals = () => shared.animals ?? null;

  function init(H) {
    O.H = H; O.W = H.W; O.kit = H.researchers.kit;
    const t0 = performance.now();
    O.S = survey(O); O.roads = roads(O); O.doors = doorEnds(O); O.S.plan.rebuild(); O.G = gardenSpots(O); cast.prepare?.(O);
    O.lamps = (ctx.items?.lamps ?? []).filter(l => l.kind === 'lamp' && !(ctx.house.footprints ?? []).some(f => l.x > f.x0 - 2 && l.x < f.x1 + 2 && l.z > f.z0 - 2 && l.z < f.z1 + 2) && l.y - place.ground(l.x, l.z) > 5);
    const S = O.S, plan = S.plan;
    // home: the shed if the place has one, else where it says; two places to stand there
    O.home = i => { const h = place.home(), k = O.homeSpots ??= [0, 1].map(j => O.G.snap(h.x + (h.dx ?? 1) * (3 + j * 4.5), h.z + (h.dz ?? 0) * (3 + j * 4.5), 30, 0, 2) ?? O.G.snap(h.x, h.z, 60, 0, 2)); return { ...k[i], yaw: h.yaw }; };
    // the lawns the mower keeps: the widest open grass, in stripes
    O.fields = lawns(O);
    // the Landing's places
    const L = place.landing?.(O) ?? {}; O.masterSpots = L;
    O.bodies = new Layer(group, cast.slots, 3900, false); O.lights = new Layer(group, cast.slots, 900, true);
    O.gardener = cast.gardener ? new Gardener(O, cast.gardener) : null; O.mower = cast.mower ? new Mower(O, cast.mower) : null; O.master = cast.master && L.beat ? new Master(O, cast.master) : null;
    O.named = [O.gardener, O.mower, O.master].filter(Boolean);
    O.ord = Array.from({ length: cast.slots }, (_, i) => new Ordinary(O, i));
    O.troupe = cast.troupe.map((sp, i) => ({ r: O.kit.mint({ seed: sp.seed, group: sp.group, name: sp.name, pose: 'stand' }, 900 + i), sp, out: false }));
    O.stripes = stripes(O);
    O.ready = true; O.surveyMs = Math.round(performance.now() - t0);
    console.info(`outdoors: ${O.doors.length} doors (${O.doors.map(d => d.name).join(', ')}), ${O.G.beds.length} beds, ${O.G.pots.length} pots, ${O.G.tend.length} to tend, ${O.G.benches.length} seats, ${O.G.sweeps.length} stretches to rake, ${O.fields.length} lawns, ${O.roads.nodes.length} road nodes; surveyed in ${O.surveyMs} ms`);
  }
  // an errand for whoever is free
  O.free = () => O.ord.find(a => !a.who);
  O.someone = want => { const l = O.troupe.filter(w => !w.out && (want ? want(w) : !w.sp.watch)); return l.length ? pick(l) : null; };
  O.send = (errand, who, carry, hat) => { const a = O.free(); if (!a || !who) return null; who.out = true; a.dress(who, carry, hat); a.errand = errand; errand.who = a; a.task = null; a.state = 'setting out'; return a; };
  O.doorFor = (not, weights) => { const v = O.W.visitor, l = O.doors.filter(d => d !== not && !O.onWay(d, v) && !(v.present && hyp(v.x - d.top.x, v.z - d.top.z) < 9)).map(d => [d, weights?.[d.name] ?? 1]); return weighted(l, Math.random); };

  // who should be about, and sending them: looked at once a second
  let nextSend = 0, lastHour = null, paused = 0, tickAt = 0, lastT = null;
  function direct(t, fresh, force = null) {
    const sh = O.shift = cast.shift(O.hour, O.light), ord = O.ord.filter(a => a.who && !a.who.sp.watch), sitters = ord.filter(a => a.errand?.kind === 'sit').length;
    for (const a of O.named) if (a.ghost) { const h = O.home(a === O.mower ? 1 : 0), p = a === O.master ? O.masterSpots.beat[0] : h; a.put(p.x, p.z, p.yaw ?? 0); a.show(); a.task = null; }
    // the watch
    const watch = O.ord.find(a => a.who?.sp.watch);
    if (sh.watch && !watch) { const who = O.troupe.find(w => w.sp.watch && !w.out), d = O.doorFor(null); if (who && d) O.send(cast.watch(O, d, fresh), who, 'lantern', true); }
    else if (!sh.watch && watch && !watch.errand.over) watch.errand.over = true;
    const byName = n => O.doors.find(d => d.name === n);
    if (!force) { if (ord.length >= sh.ordinary || (!fresh && t < nextSend)) return; nextSend = t + (fresh ? 0 : 14 + Math.random() * 26); }
    const start = force?.start ?? (fresh ? 0.15 + Math.random() * 0.6 : 0), night = sh.night, carry = () => (night ? 'lantern' : pick(sh.carry ?? ['book', 'books', 'cup', 'laptop']));
    if (force ? force.kind === 'sit' : sitters < (sh.sitters ?? 0)) {
      const seats = O.G.benches.filter(b => !O.seatTaken(b) && (force?.seat ? force.seat.test(b.label) : cast.sitHere(b, sh, O))).map(b => [b, cast.sitHere(b, sh, O) || 1]), s = weighted(seats, Math.random), from = byName(force?.from) ?? O.doorFor(null, sh.from), to = byName(force?.to) ?? O.doorFor(null, sh.to), who = O.someone();
      if (s && from && to && who) { const table = /table/.test(s.label), pose = night || table ? 'type' : pick(['read', 'read', 'type']), e = { kind: 'sit', seat: table && !s.table ? Object.assign(s, { table: { y: O.S.ground(s.sx, s.sz) + 2.52, d: 1.3 } }) : s, pose, from, to, start, secs: 150 + Math.random() * 200, run: a => sitting(a, e), lines: cast.lines.sit, over: () => O.shift.night !== night };
        return [O.send(e, who, pose === 'type' ? 'open' : 'read')]; }
      if (force) return [];
    }
    const from = byName(force?.from) ?? O.doorFor(null, sh.from), to = byName(force?.to) ?? (from && O.doorFor(from, sh.to)); if (!from || !to) return [];
    const pair = (force ? force.kind === 'pair' : sh.ordinary - ord.length >= 2 && Math.random() < (sh.pairs ?? 0.3)) && O.ord.filter(a => !a.who).length >= 2;
    const mk = (side, pace) => ({ kind: pair ? 'pair' : 'cross', from, to, start, side, pace, cuts: force?.cuts ?? (!pair && Math.random() < (sh.cuts ?? 0.2) ? 1.6 : 0), lines: cast.lines[pair ? 'pair' : night ? 'night' : 'walk'] });
    if (!pair) { const e = mk(1); e.run = a => crossing(a, e); return [O.send(e, O.someone(), carry())]; }
    // two together: side by side on the same way, each keeping an eye on how far the other has got; at night they stop under a lamp to have it out
    const e1 = mk(1), e2 = mk(-0.75), lamp = force?.lamp ?? (night || Math.random() < 0.25) ? O.lampSpot(from, to) : null;
    const pace = (me, other) => () => { const a = me.who, b = other.who; if (!a || !b || !b.who || b.errand !== other) return 1; const d = (a.at ?? 0) - (b.at ?? 0); return d > 0 ? 0.62 : d < 0 ? 1.12 : 0.9; };
    e1.pace = pace(e1, e2); e2.pace = pace(e2, e1);
    const chat = function* (a, e, o, k) { if (!lamp) return; const p = lamp[k]; a.state = 'to a lamp'; if (!(yield* a.travel(p.x, p.z, { patience: 15 }))) return; a.posted = true; a.state = 'talking'; const end = a.W.now + 60 + Math.random() * 70; while (a.W.now < end && o.who?.errand === o) { const b = o.who; a.m.faceTo(b.x, b.z, a.W.dt * 2); yield; } a.posted = false; };
    e1.stop = a => chat(a, e1, e2, 0); e2.stop = a => chat(a, e2, e1, 1);
    e1.run = a => crossing(a, e1); e2.run = a => crossing(a, e2);
    const a1 = O.send(e1, O.someone(), carry()), a2 = a1 && O.send(e2, O.someone(), night ? null : carry()); if (a1 && a2) { a1.talk = a2; a2.talk = a1; }
    return [a1, a2];
  }
  // two places to stand and talk under a lamp near the way from one door to another
  O.lampSpot = (from, to) => { const ids = O.roads.route(from.node, to.node, 0); if (!ids) return null; const mid = O.roads.nodes[ids[Math.floor(ids.length * (0.35 + Math.random() * 0.3))]], l = [...O.lamps].sort((a, b) => hyp(a.x - mid.x, a.z - mid.z) - hyp(b.x - mid.x, b.z - mid.z))[0]; if (!l || hyp(l.x - mid.x, l.z - mid.z) > 70) return null;
    const p = O.G.snap(l.x, l.z, 8, 2.5, 1.6); if (!p) return null; const dx = p.x - l.x, dz = p.z - l.z, L = hyp(dx, dz) || 1, q = O.G.snap(p.x - dz / L * 3, p.z + dx / L * 3, 3, 0, 1.4); return q && hyp(q.x - p.x, q.z - p.z) > 2 ? [p, q] : null; };
  // everybody where the hour says, at once (on coming out of doors after a while, or when the hour is moved)
  function settle(t) {
    for (const a of O.ord) if (a.who) a.gone();
    O.seats.clear(); const sh = O.shift = cast.shift(O.hour, O.light);
    for (const a of O.named) { a.away(); a.show(); a.task = null; a.lift = 0; a.still = false; a.posted = false; }
    if (O.gardener) { const g = O.gardener, h = O.home(0); g.put(h.x, h.z, 0); g.done(); if (sh.gardener === 'work') { g.wide = true; const p = g.planWork(); g.wide = false; /* (wherever on the grounds the hour's work is: not only what is nearest home) */ if (p) { if (O.dist({ m: { x: p.s.x, z: p.s.z } }) > 30) g.put(p.s.x, p.s.z, 0); g.begin(p); } } }
    if (O.mower) { const mw = O.mower, h = O.home(1); mw.put(h.x, h.z, h.yaw ?? 0); O.stripes.clear(); if (sh.mower === 'mow' && O.fields.length) { for (const F of O.fields) { F.next = Math.floor(Math.random() * F.stripes.length); for (let i = 0; i < F.next; i++) O.stripes.whole(F, F.stripes[i], i % 2 === 0); } const F = mw.F = pick(O.fields), st = F.stripes[F.next % F.stripes.length], p = F.at(st.runs[0][0], st.q); mw.block = 6; mw.put(p.x, p.z, 0); } }
    if (O.master) { const p = pick(O.masterSpots.beat); O.master.put(p.x, p.z, 0); }
    nextSend = 0; for (let i = 0; i < cast.slots + 1; i++) direct(t, true);
  }
  O.settle = settle;

  ctx.animated.push((t, dt) => {
    if (!O.ready) {
      const H = Object.values(ctx.faculty ?? {})[0]?.H ?? window.__faculty?.H; waited += dt;
      if (H?.researchers && ctx.walker) init(H);
      else if (waited > 5 && ctx.walker && !own) {      // nobody indoors (?faculty=0, ?furnish=0): a world of our own
        own = true; const W = makeWorld({ colliders: ctx.colliders, doors: ctx.house.doors, portals: ctx.house.portals, surfaces: ctx.house.surfaces, ground: (x, z) => ctx.walker?.ground?.(x, z) ?? 0 });
        const g2 = new THREE.Group(); ctx.scene.add(g2); const H2 = { ctx, W, group: g2, room: null, tmp: new THREE.Vector3(), get now() { return W.now; }, get dt() { return W.dt; }, get visitor() { return W.visitor; }, get events() { return W.events; } };
        W.events.choices = 0; H2.bubbles = makeBubbles(THREE, ctx.camera); H2.talk = makeTalk(H2, false); hireResearchers(H2, []); init(H2);
      }
      return;
    }
    const W = O.W, H = O.H;
    if (own) { W.now = t; W.dt = dt; W.watch(ctx.walker, ctx.mode === 'walk', dt); if (!hooked && ctx.walker) { hooked = true; const w = ctx.walker, base = w.collide.bind(w); w.collide = p => { W.solid(p); base(p); }; } H.talk.update(); H.bubbles.update(t); }
    // indoors, or the grounds out of sight: nothing
    if (ctx.room || ctx.scene.visible === false || O.off) { if (!paused) paused = t; walkers.length = 0; return; }      // (she is indoors: the grounds are paused, not asleep)
    O.hour = ctx.day.hour ?? 12; O.light = ctx.day.light ?? 1; O.since = paused ? 0 : O.since + dt;
    const jumped = lastHour !== null && Math.abs(O.hour - lastHour) > 0.2 && Math.abs(O.hour - lastHour) < 23.8; lastHour = O.hour;
    if (lastT === null || jumped || (paused && t - paused > 45)) settle(t);
    paused = 0; lastT = t;
    O.frames = (O.frames ?? 0) + 1; const tk0 = performance.now();
    if (t - tickAt > 1) { tickAt = t; direct(t, false); }
    let any = false, nw = 0;
    for (const a of O.all) {
      if (a.ghost && !a.errand) continue;
      if (!a.ghost) { const w = walkers[nw] ?? (walkers[nw] = spare[nw] ??= { x: 0, z: 0, r: 0 }); w.x = a.m.x; w.z = a.m.z; w.r = a.r; nw++; }
      const d = O.dist(a), far = d > (cast.far ?? 230) && !a.talking;
      try {
        if (!far) { a.update(dt, true); a.acc = 0; }
        else { a.acc += dt; if (a.acc >= 0.5) { const keep = W.dt; W.dt = a.acc; a.update(a.acc, false); W.dt = keep; a.acc = 0; } }
      } catch (e) { if (!a.broken) { a.broken = true; console.error('outdoors', a.name, e.stack ?? e); } a.away(); }
      if (a instanceof Ordinary && a.who) any = true;
    }
    walkers.length = nw; O.bodies.mesh.visible = O.lights.mesh.visible = any;
    O.stripes.tick(O.light); O.ms = (O.ms ?? 0) + performance.now() - tk0;
  });

  // for tests: who is where, doing what; what they cost; is anybody where nobody should be
  window.__outdoors = { O,
    status: () => O.all.filter(a => !a.ghost).map(a => ({ name: a.name, x: +a.x.toFixed(1), y: +a.y.toFixed(2), z: +a.z.toFixed(1), state: a.state, task: a.taskName, aside: a.aside.phase, errand: a.errand?.kind ?? null, carry: a.carry ?? null })),
    count: () => ({ hour: +O.hour.toFixed(2), light: +O.light.toFixed(2), about: O.all.filter(a => !a.ghost && a.state !== 'asleep' && a.state !== 'parked').map(a => a.name), asleep: O.all.filter(a => !a.ghost && (a.state === 'asleep' || a.state === 'parked')).map(a => a.name) }),
    // what a place is: keep (0 open; 1 rim, building, water; 2 planted; 3 hedge; 4 oval; 5 steps), the walk it is on (0 none), how far from the nearest walk's middle less its half-width, the land's height
    where: (x, z) => { const S = O.S, c = S.at(x, z); let off = 1e9, name = null; for (const w of S.ways) for (const [px, pz] of w.line) { const d = hyp(px - x, pz - z) - w.w / 2; if (d < off) { off = d; name = w.name; } } return { keep: c < 0 ? 1 : S.keep[c], path: c < 0 ? 0 : S.path[c], off: +off.toFixed(2), way: name, ground: +S.ground(x, z).toFixed(2), free: S.plan.freeAt(x, z, 1, false) }; },
    cost: () => { const out = {}; for (const a of O.named) { let calls = 0, tris = 0; a.body.root.traverse(o => { if (o.isMesh && o.visible) { calls++; const g = o.geometry; tris += (g.index ? g.index.count : g.attributes.position.count) / 3; } }); out[a.name] = [calls, Math.round(tris)]; } out.ordinary = [O.bodies.mesh.visible ? 2 : 0, Math.round((O.ord.filter(a => a.who).length * (O.bodies.cap + O.lights.cap)) / 3)]; out.stripes = [O.stripes.mesh.visible ? 1 : 0, O.stripes.n * 2]; return out; },
    settle: () => settle(O.W.now), send: force => direct(O.W.now, false, force) };
  return O;
}

// ---- the lawns: the widest open grass, each in parallel stripes ------------------------------------------------
function lawns(O) {
  const { S, place, cast } = O, { NX, NZ, X0, Z0, plan } = S, N = NX * NZ, W = cast.mower?.width ?? 2, lawn = new Uint8Array(N), far = new Float32Array(N);
  if (!cast.mower) return [];
  for (let c = 0; c < N; c++) { const x = X0 + (c % NX) + 0.5, z = Z0 + Math.floor(c / NX) + 0.5; lawn[c] = plan.free(c, 2.4, false) && !S.nearPath[c] && !S.lane2[c] && (place.mow?.(x, z) ?? true) ? 1 : 0; }
  // how far each cell of lawn is from anything that is not (a rough measure: along the rows and columns)
  for (let c = 0; c < N; c++) far[c] = lawn[c] ? 1e6 : 0;
  for (let k = 0; k < NZ; k++) for (let i = 0; i < NX; i++) { const c = k * NX + i; if (!far[c]) continue; far[c] = Math.min(far[c], (i ? far[c - 1] : 0) + 1, (k ? far[c - NX] : 0) + 1); }
  for (let k = NZ - 1; k >= 0; k--) for (let i = NX - 1; i >= 0; i--) { const c = k * NX + i; if (!far[c]) continue; far[c] = Math.min(far[c], (i < NX - 1 ? far[c + 1] : 0) + 1, (k < NZ - 1 ? far[c + NX] : 0) + 1); }
  let tries = 0; const fields = [], is = (x, z) => { const c = S.at(x, z); return c >= 0 && lawn[c]; };
  for (let n = 0; n < (cast.mower.fields ?? 3); n++) {
    let best = -1, bd = 9; for (let c = 0; c < N; c++) if (far[c] > bd && fields.every(f => hyp(f.x - (X0 + c % NX), f.z - (Z0 + Math.floor(c / NX))) > (cast.mower.apart ?? 70))) { bd = far[c]; best = c; }
    if (best < 0) break;
    const x = X0 + (best % NX) + 0.5, z = Z0 + Math.floor(best / NX) + 0.5, th = cast.mower.heading?.(x, z) ?? 0, ux = Math.cos(th), uz = Math.sin(th), F = { x, z, at: (p, q) => ({ x: x + ux * p - uz * q, z: z + uz * p + ux * q }), stripes: [] };
    const half = cast.mower.half ?? 26, len = cast.mower.length ?? 44;
    for (let q = -half; q <= half; q += W) { const runs = []; let a = null; for (let p = -len; p <= len + 1; p += 1) { const pt = F.at(p, q), ok = p <= len && is(pt.x, pt.z); if (ok && a === null) a = p; if (!ok && a !== null) { if (p - 1 - a >= 9) runs.push([a, p - 1]); a = null; } } if (runs.length) F.stripes.push({ q, runs }); }
    if (F.stripes.length >= 6) fields.push(F); else { for (let c = 0; c < N; c++) if (hyp(x - (X0 + c % NX), z - (Z0 + Math.floor(c / NX))) < 24) far[c] = Math.min(far[c], 1); if (++tries < 10) n--; }
  }
  return fields;
}
// what the mower leaves: a faint band where it has been, light one way and dark the other (one mesh, laid on the grass)
function stripes(O) {
  const cap = 5000, pos = new Float32Array(cap * 18), col = new Float32Array(cap * 18), g = new THREE.BufferGeometry(), W = (O.cast.mower?.width ?? 2) * 0.5;
  const pa = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage), ca = new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage); g.setAttribute('position', pa); g.setAttribute('color', ca); g.setDrawRange(0, 0);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 }));
  mesh.frustumCulled = false; mesh.visible = false; mesh.name = 'mown stripes'; mesh.renderOrder = 1; O.group.add(mesh);
  const A = { mesh, n: 0 }, gy = (x, z) => O.place.ground(x, z) + 0.11;
  A.add = (a, b, fwd) => { const L = hyp(b.x - a.x, b.z - a.z); if (L < 0.3 || O.cast.mower?.stripes === false) return; if (A.n >= cap) A.n = 0; const nx = -(b.z - a.z) / L * W, nz = (b.x - a.x) / L * W, o = A.n * 18, c = fwd ? 1 : 0;
    const q = [[a.x + nx, a.z + nz], [a.x - nx, a.z - nz], [b.x + nx, b.z + nz], [b.x - nx, b.z - nz]], idx = [0, 2, 1, 1, 2, 3]; idx.forEach((j, i) => { pos[o + i * 3] = q[j][0]; pos[o + i * 3 + 1] = gy(q[j][0], q[j][1]); pos[o + i * 3 + 2] = q[j][1]; col[o + i * 3] = c; col[o + i * 3 + 1] = c; col[o + i * 3 + 2] = c * 0.8; });
    A.n++; g.setDrawRange(0, Math.min(cap, Math.max(A.n, g.drawRange.count / 6)) * 6); pa.needsUpdate = true; ca.needsUpdate = true; mesh.visible = true; };
  A.whole = (F, st, fwd) => { for (const [p0, p1] of st.runs) for (let p = p0; p < p1; p += 4) A.add(F.at(p, st.q), F.at(Math.min(p1, p + 4), st.q), fwd); };
  A.clear = () => { A.n = 0; g.setDrawRange(0, 0); mesh.visible = false; };
  A.tick = light => { mesh.material.opacity = 0.02 + 0.085 * clamp(light, 0, 1); };
  O.stripe = A.add;
  return A;
}
