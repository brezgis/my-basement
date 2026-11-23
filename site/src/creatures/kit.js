// The crew that keeps the animals (written first for the garden of Anna's House, carried to Vesper
// Street, and from there to the school). Every animal is a member of one crew: it loads its model
// only when the visitor is out of doors and within reach at the right hour, thinks four times a
// second, moves every frame only while she is near enough to see it, and is hidden (and costs
// nothing) otherwise. Nothing is allocated per frame.
//
// This file knows nothing of the place it is used in. What it needs to know of the land it is told
// (creatureKit(ctx, land)):
//
//   land.groundAt(x, z)   the height of the ground there
//   land.edge(x, z)       how many feet inside the island's rim that is (negative: off the island)
//   land.lots             [{ x0, x1, z0, z1 }]: the buildings' footprints; no animal stands in one
//   land.keepOff(x, z, pad)   optional: true where an animal should not stand or cross (a walk, a bed)
//   land.others()         optional: [{ x, z }, ...] whoever else is walking about (robots on the paths): the animals
//                         give way to them as they do to the visitor
//   land.plantKind(u, v, du, dv)   optional: the name of the plant whose picture is that cell of the planting's atlas
//
// Nothing casts rays at the scene (its meshes are merged into very large ones, and a ray against
// them is slow), except kit.cast, which takes the few meshes to try (a tree's wood, for the squirrel)
// and is only called when an animal makes up its mind, never per frame.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// (the animals load on a manager of their own: the threshold, main.js, waits on the default one, and should not wait for them)
const AWAY = new THREE.LoadingManager();

export const FT = 3.28084, TAU = Math.PI * 2;
export const wrapA = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
export const turnTo = (a, b, k) => { const d = wrapA(b - a); return Math.abs(d) <= k ? b : a + Math.sign(d) * k; };
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const clamp01 = v => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease = u => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
export function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

export function creatureKit(ctx, land = {}) {
  const { scene, animated, day } = ctx, cam = ctx.camera.position, loader = new GLTFLoader(AWAY);
  const files = new Map(), meshes = new Map(), crew = [];
  const tag = m => { m.castShadow = false; m.receiveShadow = true; m.userData.creature = true; m.userData.cat = 'creatures'; m.name ||= 'creature'; return m; };
  // a prepared animal (glb, metres, facing +z, feet at y = 0), fetched once
  const glb = id => {
    if (!files.has(id)) files.set(id, new Promise((ok, bad) => loader.load(`assets/models/${id}/${id}.glb`, g => { g.scene.traverse(n => { if (n.isMesh) tag(n); }); ok(g); }, undefined, bad)));
    return files.get(id);
  };
  // one plain mesh (geometry in feet) from a single-mesh model; geometry and material shared per (id, scale, tint)
  const mesh = async (id, s = 1, tint = null) => {
    const key = id + '|' + s + '|' + tint;
    if (!meshes.has(key)) meshes.set(key, glb(id).then(g => {
      let src = null; g.scene.updateMatrixWorld(true); g.scene.traverse(n => { if (n.isMesh && !src) src = n; });
      const geo = src.geometry.clone().applyMatrix4(src.matrixWorld); geo.scale(FT * s, FT * s, FT * s); geo.computeBoundingSphere(); geo.computeBoundingBox();
      let mat = src.material; if (tint != null) { mat = mat.clone(); mat.color.multiply(new THREE.Color(tint)); }
      mat.envMapIntensity = 0.6;
      return { geo, mat };
    }));
    const { geo, mat } = await meshes.get(key);
    return tag(new THREE.Mesh(geo, mat));
  };

  // ---- where things are -------------------------------------------------------------------------
  const lots = land.lots ?? [], keepOff = land.keepOff ?? (() => false);
  // the height of the ground
  const groundAt = land.groundAt ?? (() => 0.03);
  const inLot = (x, z, pad = 1) => lots.some(f => x > f.x0 - pad && x < f.x1 + pad && z > f.z0 - pad && z < f.z1 + pad);
  // inside the footprint of something the visitor bumps into (a planter, a bench, a bin, a post)?
  // (a collider counts if it reaches down to within `below` feet of the ground there: the land is not level)
  const blocked = (x, z, pad = 0.3, below = 3) => { const cs = ctx.colliders; let g = null; for (let i = 0; i < cs.length; i++) { const c = cs[i]; if (c.off || x <= c.x0 - pad || x >= c.x1 + pad || z <= c.z0 - pad || z >= c.z1 + pad) continue; g ??= groundAt(x, z); if ((c.y0 ?? 0) < g + below && (c.y1 ?? 1e9) > g) return true; } return false; };
  // on the island, at least `margin` feet inside its rim
  const onIsland = (x, z, margin = 6) => (land.edge ? land.edge(x, z) > margin : true);
  const free = (x, z, pad = 0.4) => !inLot(x, z, pad + 0.6) && !blocked(x, z, pad) && onIsland(x, z) && !keepOff(x, z, pad);
  // is the straight way from a to b free (sampled every two feet)?
  const clear = (ax, az, bx, bz, pad = 0.4) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 2)); for (let i = 0; i <= n; i++) if (!free(ax + (bx - ax) * i / n, az + (bz - az) * i / n, pad)) return false; return true; };
  // The first solid thing along a ray, among the meshes given: its distance, or Infinity. (For a trunk's side.)
  const ray = new THREE.Raycaster(), hits = [];
  const cast = (meshes, ox, oy, oz, dx, dy, dz, far = 20) => {
    ray.ray.origin.set(ox, oy, oz); ray.ray.direction.set(dx, dy, dz).normalize(); ray.far = far; let best = Infinity;
    for (const n of meshes) { n.updateWorldMatrix(true, false); hits.length = 0; n.raycast(ray, hits); for (const h of hits) best = Math.min(best, h.distance); }
    return best;
  };
  // What is planted where test(x, z) says: [{ x, y, z, w, h }], read back from the instanced cards the planting is
  // drawn with (meshes named 'plants'). For the butterflies' flowers and the frog's lily pads; called once, at init.
  const plantsIn = (test, name = 'plants') => {
    const out = [], m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
    scene.traverse(n => {
      if (!n.isInstancedMesh || n.name !== name) return; const cell = land.plantKind ? n.geometry.attributes.aCell : null;
      for (let i = 0; i < n.count; i++) { n.getMatrixAt(i, m); if (!test(m.elements[12], m.elements[14])) continue; m.decompose(p, q, s); out.push({ x: p.x, y: p.y, z: p.z, w: s.x, h: s.y, kind: cell ? land.plantKind(cell.getX(i), cell.getY(i), cell.getZ(i), cell.getW(i)) : null }); }
    });
    return out;
  };
  // Where something is laid on the ground (a walk, a paved place, a bed): a grid made once from the triangles of the
  // meshes that test() picks, so that it is whatever has really been built. Returns (x, z, pad) => true if any of it
  // is within pad feet.
  const laid = (test = n => /^ground /.test(n.name), cell = 1.5) => {
    const cells = new Set(), key = (i, j) => (i + 2048) * 4096 + (j + 2048);
    scene.traverse(n => {
      if (!n.isMesh || n.isInstancedMesh || !test(n)) return;
      const P = n.geometry.attributes.position, I = n.geometry.index; n.updateWorldMatrix(true, false); const e = n.matrixWorld.elements, T = (I ? I.count : P.count) / 3;
      const X = k => { const v = I ? I.getX(k) : k; return e[0] * P.getX(v) + e[4] * P.getY(v) + e[8] * P.getZ(v) + e[12]; }, Z = k => { const v = I ? I.getX(k) : k; return e[2] * P.getX(v) + e[6] * P.getY(v) + e[10] * P.getZ(v) + e[14]; };
      for (let t = 0; t < T; t++) {
        const ax = X(t * 3), az = Z(t * 3), bx = X(t * 3 + 1), bz = Z(t * 3 + 1), cx = X(t * 3 + 2), cz = Z(t * 3 + 2);
        const i0 = Math.floor(Math.min(ax, bx, cx) / cell), i1 = Math.floor(Math.max(ax, bx, cx) / cell), j0 = Math.floor(Math.min(az, bz, cz) / cell), j1 = Math.floor(Math.max(az, bz, cz) / cell);
        const d = (bx - ax) * (cz - az) - (bz - az) * (cx - ax); if (Math.abs(d) < 1e-9) continue;
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
          if (i1 - i0 < 2 && j1 - j0 < 2) { cells.add(key(i, j)); continue; }                    // (a small triangle: every cell its box touches)
          const x = (i + 0.5) * cell, z = (j + 0.5) * cell, u = ((x - ax) * (cz - az) - (z - az) * (cx - ax)) / d, v = ((bx - ax) * (z - az) - (bz - az) * (x - ax)) / d;
          if (u > -0.25 && v > -0.25 && u + v < 1.25) cells.add(key(i, j));
        }
      }
    });
    const at = (x, z, pad = 0) => { for (let i = Math.floor((x - pad) / cell); i <= Math.floor((x + pad) / cell); i++) for (let j = Math.floor((z - pad) / cell); j <= Math.floor((z + pad) / cell); j++) if (cells.has(key(i, j))) return true; return false; };
    at.size = cells.size; return at;
  };
  // how far the visitor is (for showing and hiding)
  const camDist = (x, z) => Math.hypot(cam.x - x, cam.z - z);
  // how far the nearest walker is, the visitor or anybody else on foot (for shying away)
  const dist = (x, z) => { let d = Math.hypot(cam.x - x, cam.z - z); const o = land.others?.(); if (o) for (let i = 0; i < o.length; i++) { const q = Math.hypot(o[i].x - x, o[i].z - z); if (q < d) d = q; } return d; };
  // the nearest walker himself: { x, z } (the camera's position if it is the visitor)
  const nearest = (x, z) => { let d = Math.hypot(cam.x - x, cam.z - z), who = cam; const o = land.others?.(); if (o) for (let i = 0; i < o.length; i++) { const q = Math.hypot(o[i].x - x, o[i].z - z); if (q < d) { d = q; who = o[i]; } } return who; };
  const dist3 = (x, y, z) => Math.hypot(cam.x - x, cam.y - y, cam.z - z);

  // ---- the crew -----------------------------------------------------------------------------------
  // A member: { name, x, z, load (ft), live (ft), when(), init() -> Promise, show(on), think(t, d), tick(t, dt) }
  const add = c => { Object.assign(c, { loaded: false, loading: false, on: false }); crew.push(c); return c; };
  // A little light of an animal's own after dark, so that it can be seen on the lawn at night: its own picture, lit in
  // proportion to the night (nothing by day). Each mesh's material is its own from then on.
  const glows = [];
  const glow = (o, k = 0.4, color = 0x6a6258) => { o.traverse(n => { if (!n.isMesh || n.userData.glows) return; n.userData.glows = true; const m = n.material = n.material.clone(); m.emissive = new THREE.Color(color); if (m.map) m.emissiveMap = m.map; m.emissiveIntensity = k * (day.night ?? 0); glows.push([m, k]); }); return o; };
  let next = 0;
  // An animal is first made when the visitor steps out of doors, and its shaders were compiled on the frame it was
  // first drawn: by day six new ones (instanced wings, a model's own material) on the two steps through a garden
  // door, a stall of most of a second. Now a new arrival stays hidden until the graphics card has its shaders ready
  // (compiled in the background where the browser can: KHR_parallel_shader_compile), and only then joins the crew.
  let warming = null;
  const warm = () => (warming ??= Promise.resolve().then(() => {
    warming = null;
    const r = ctx.renderer; if (!r?.compileAsync) return null;
    let root = scene; while (root.parent) root = root.parent;
    return r.compileAsync(scene, ctx.camera, root).catch(() => null);
  }));
  const all = new URLSearchParams(location.search).has('allcreatures');      // tests: load and run everything, everywhere
  animated.push((t, dt) => {
    // Indoors, or with the grounds out of sight, nothing runs: but the animals within reach are still made ready, one
    // at a time, so that the work (a model to read, a shader or two for the graphics card) is done in the first seconds
    // of a visit, a little at once, and not all together on the step out of a garden door.
    const away = !all && (ctx.room || scene.visible === false);
    dt = Math.min(dt, 0.1);
    if (t >= next || t < next - 1) {
      next = t + 0.25;
      if (!away) for (let i = 0; i < glows.length; i++) glows[i][0].emissiveIntensity = glows[i][1] * (day.night ?? 0);
      let busy = away && crew.some(c => c.loading);
      for (let i = 0; i < crew.length; i++) {
        const c = crew[i], d = camDist(c.x, c.z), want = c.when ? c.when() : true;
        if (!c.loaded && !c.loading && !c.failed && !busy && (all || (want && d < (c.load ?? 150)))) {
          c.loading = true; busy = away;
          Promise.resolve().then(() => c.init()).then(() => { c.show?.(false); return warm(); }).then(() => { c.loaded = true; c.loading = false; c.show?.(false); }).catch(e => { c.failed = true; c.loading = false; console.warn('creature', c.name, e?.message ?? e); });
        }
        if (away) continue;
        const on = c.loaded && want && (all || d < (c.live ?? 110));
        if (on !== c.on) { c.on = on; c.show?.(on); }
        if (on) c.think?.(t, d);
      }
    }
    if (away) return;
    for (let i = 0; i < crew.length; i++) if (crew[i].on) crew[i].tick?.(t, dt);
  });

  // An animal's feet: the lower part of the middle of its body (a long tail hanging below a perch is not a foot).
  const central = (geo, i) => { if (!geo.boundingBox) geo.computeBoundingBox(); const b = geo.boundingBox, p = geo.attributes.position, cx = (b.min.x + b.max.x) / 2, cz = (b.min.z + b.max.z) / 2;
    return Math.abs(p.getX(i) - cx) < 0.4 * (b.max.x - b.min.x) && Math.abs(p.getZ(i) - cz) < 0.3 * (b.max.z - b.min.z); };
  const feet = geo => {
    const p = geo.attributes.position; let lo = Infinity, hi = -Infinity; for (let i = 0; i < p.count; i++) if (central(geo, i)) { lo = Math.min(lo, p.getY(i)); hi = Math.max(hi, p.getY(i)); }
    const pick = []; for (let i = 0; i < p.count; i++) if (central(geo, i) && p.getY(i) < lo + 0.3 * (hi - lo)) pick.push(i);
    const step = Math.max(1, Math.ceil(pick.length / 200)), out = [];
    for (let k = 0; k < pick.length; k++) { const i = pick[k]; if (k % step === 0 || p.getY(i) < lo + 0.015) out.push(p.getX(i), p.getY(i), p.getZ(i)); }
    return new Float32Array(out.slice(0, 900));
  };
  // Stand o on a surface at height y (plus lift, in a hop): whatever its pose, its lowest foot ends exactly at y.
  const plant = (o, pts, y, lift = 0) => {
    o.position.y = 0; o.updateMatrix(); const e = o.matrix.elements; let lo = Infinity;
    for (let i = 0; i < pts.length; i += 3) { const v = e[1] * pts[i] + e[5] * pts[i + 1] + e[9] * pts[i + 2]; if (v < lo) lo = v; }
    o.position.y = y + lift - lo;
  };
  const kit = { ctx, land, day, cam, scene, glb, mesh, tag, inLot, blocked, onIsland, keepOff, free, clear, groundAt, cast, plantsIn, laid, dist, camDist, nearest, dist3, add, crew, feet, plant, all, glow,
    hour: () => day.hour ?? 12 };
  if (typeof window !== 'undefined') { window.__creatures = crew; window.__creatureKit = kit; }      // for tests
  // ?creaturelog=14000 writes, that many milliseconds in, who is loaded and showing, where they are, and what
  // the animals in the scene cost just then (draws and triangles of everything of theirs that is visible)
  const Q = new URLSearchParams(location.search);
  if (Q.has('creaturelog')) setTimeout(() => {
    let draws = 0, tri = 0;
    const seen = o => { for (let p = o; p; p = p.parent) if (p.visible === false) return false; return true; };
    scene.traverse(o => { if (!o.userData.creature || !(o.isMesh || o.isPoints) || !seen(o)) return; const g = o.geometry, n = g.index ? g.index.count : g.attributes.position.count; draws++; tri += (o.isPoints ? 0 : n / 3) * (o.isInstancedMesh ? o.count : g.instanceCount ?? 1); });
    const info = ctx.renderer.info.render;
    console.log(`CREW cost ${draws} draws ${Math.round(tri)} tris | frame ${info.calls} calls ${info.triangles} tris | light ${day.light.toFixed(2)} hour ${(day.hour ?? 0).toFixed(1)} room ${ctx.room?.name ?? '-'} | failed: ${crew.filter(c => c.failed).map(c => c.name).join(',') || 'none'} | not loaded: ${crew.filter(c => !c.loaded).map(c => c.name).join(',') || 'none'}`);
    const f = v => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
    const lines = crew.filter(c => c.on).map(c => { let k = {}; try { k = c.check?.() ?? {}; } catch (e) { k = { err: String(e) }; } return c.name + ' ' + JSON.stringify(k, (key, v) => (key === 'all' ? undefined : f(v))); });
    for (let i = 0; i < lines.length; i += 5) console.log('CREW on: ' + lines.slice(i, i + 5).join(' ; '));
  }, Number(Q.get('creaturelog')) || 14000);
  return kit;
}

// A walk along waypoints [[x, y, z], ...] at a speed, optionally in hops (stride, height): it
// moves its object every frame it is stepped and turns it to face the way it goes (+z forward).
// Where the land is not level, give it the land (walk.land = groundAt): its height is then taken
// from the ground under it at every step, and the waypoints' own heights are not used.
export class Walk {
  constructor(o) { this.o = o; this.pts = []; this.i = 0; this.speed = 1; this.hop = 0; this.stride = 1; this.ph = 0; this.turn = 7; this.sx = 0; this.sy = 0; this.sz = 0; this.seg = 1; this.face = true; this.lift = 0; }
  go(pts, speed, hop = 0, stride = 1, turn = 7, base) { if (base != null) this.base = base; this.pts = pts; this.i = 0; this.speed = speed; this.hop = hop; this.stride = stride; this.turn = turn; this.begin(); return this; }
  stop() { this.pts = []; this.i = 0; this.lift = 0; }
  begin() {
    const o = this.o.position; this.sx = o.x; this.sy = this.base ?? o.y; this.sz = o.z; this.ph = 0;
    const p = this.pts[this.i]; if (!p) return;
    const d = Math.hypot(p[0] - o.x, p[2] - o.z); this.seg = d;
    this.st = this.hop ? d / Math.max(1, Math.round(d / this.stride)) : 1;
  }
  get busy() { return this.i < this.pts.length; }
  step(dt) {
    if (!this.busy) return false;
    const p = this.pts[this.i], o = this.o.position, dx = p[0] - o.x, dz = p[2] - o.z, d = Math.hypot(dx, dz);
    let fwd = 1;
    if (this.face && d > 0.02) { const want = Math.atan2(dx, dz); this.o.rotation.y = turnTo(this.o.rotation.y, want, this.turn * dt); fwd = Math.max(0.2, Math.cos(wrapA(want - this.o.rotation.y))); }
    const mv = Math.min(d, this.speed * dt * fwd);                                // it goes the way its head points: turning first, never crabwise
    if (d > 1e-5) { o.x += dx / d * mv; o.z += dz / d * mv; }
    const f = this.seg > 1e-4 ? 1 - Math.max(0, d - mv) / this.seg : 1;
    this.ph += mv / this.st;
    this.base = this.land ? this.land(o.x, o.z) : this.sy + (p[1] - this.sy) * f; this.lift = this.hop ? this.hop * Math.abs(Math.sin(Math.PI * this.ph)) : 0;
    o.y = this.base + this.lift;
    if (d - mv < 1e-4) { o.y = this.base = this.land ? this.land(o.x, o.z) : p[1]; this.lift = 0; this.sy = this.base; this.i++; this.begin(); }
    return true;
  }
}

// A flight from where it is to (x, y, z) in a few seconds, rising over an arc; returns the progress 0..1.
export class Flight {
  constructor(o) { this.o = o; this.a = new THREE.Vector3(); this.b = new THREE.Vector3(); this.u = 1; this.T = 1; this.lift = 1; }
  go(x, y, z, T, lift = 1) { this.a.copy(this.o.position); this.b.set(x, y, z); this.u = 0; this.T = T; this.lift = lift; return this; }
  get busy() { return this.u < 1; }
  step(dt) {
    if (this.u >= 1) return 1;
    this.u = Math.min(1, this.u + dt / this.T);
    const k = ease(this.u), o = this.o, a = this.a, b = this.b;
    o.position.set(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k + this.lift * 4 * k * (1 - k), a.z + (b.z - a.z) * k);
    if (Math.hypot(b.x - a.x, b.z - a.z) > 0.3) o.rotation.y = turnTo(o.rotation.y, Math.atan2(b.x - a.x, b.z - a.z), dt * 9);
    o.rotation.x = this.u < 0.8 ? -0.12 * Math.sin(Math.PI * this.u / 0.8) * Math.sign(b.y - a.y || 1) : -0.35 * Math.sin(Math.PI * (this.u - 0.8) / 0.2);   // flared to land
    return this.u;
  }
}

// Two flat wings for a bird that otherwise has its wings folded: hidden when it sits, beating in flight.
export function wingPair(span, chord, color, tip, at = [0, 0, 0]) {
  const g = new THREE.BufferGeometry(), c0 = new THREE.Color(color), c1 = new THREE.Color(tip);
  const P = [0, 0, chord * 0.5, 0, 0, -chord * 0.5, span * 0.5, 0, -chord * 0.55, 0, 0, chord * 0.5, span * 0.5, 0, -chord * 0.55, span * 0.42, 0, chord * 0.05];
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute([...c0.toArray(), ...c0.toArray(), ...c1.toArray(), ...c0.toArray(), ...c1.toArray(), ...c1.toArray()], 3));
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide });
  const grp = new THREE.Group(); grp.position.set(...at); grp.visible = false;
  const L = new THREE.Mesh(g, mat), R = new THREE.Mesh(g, mat); R.scale.x = -1;
  for (const w of [L, R]) { w.castShadow = false; w.userData.creature = true; w.userData.cat = 'creatures'; grp.add(w); }
  grp.userData.flap = a => { L.rotation.z = a; R.rotation.z = -a; };      // a > 0: both tips up
  return grp;
}

// A material whose wings beat: each vertex is turned about the body's long axis (z) by an angle
// that grows with its distance from it; the phase differs per instance.
export function flapping(base, uT, amp, speed, glide = 0) {
  const m = base.clone();
  m.onBeforeCompile = sh => {
    sh.uniforms.uFlapT = uT;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFlapT;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  float id = float(gl_InstanceID);
  float beat = sin(uFlapT * ${speed.toFixed(2)} + id * 2.3);
  float on = ${glide > 0 ? 'mix(1.0, 0.15, smoothstep(0.2, 0.6, sin(uFlapT * 0.45 + id * 1.7)))' : '1.0'};
  float a = ${amp.toFixed(3)} * beat * on * smoothstep(0.0, 0.06, abs(transformed.x));
  float x = transformed.x;
  transformed.x = x * cos(a);
  transformed.y += abs(x) * sin(a);
}`);
  };
  m.customProgramCacheKey = () => 'flap' + amp + speed + glide;
  return m;
}

// Split a mesh's geometry into a part picked out by test (a head) and the rest; the head's
// geometry is moved so that its pivot is at its origin.
export function splitHead(geo, test, pivot) {
  const g = geo.index ? geo.toNonIndexed() : geo.clone(), names = Object.keys(g.attributes), n = g.attributes.position.count / 3;
  const parts = [{}, {}].map(() => Object.fromEntries(names.map(k => [k, []])));
  const P = g.attributes.position;
  for (let t = 0; t < n; t++) {
    const cx = (P.getX(t * 3) + P.getX(t * 3 + 1) + P.getX(t * 3 + 2)) / 3, cy = (P.getY(t * 3) + P.getY(t * 3 + 1) + P.getY(t * 3 + 2)) / 3, cz = (P.getZ(t * 3) + P.getZ(t * 3 + 1) + P.getZ(t * 3 + 2)) / 3;
    const dst = parts[test(cx, cy, cz) ? 1 : 0];
    for (const k of names) { const A = g.attributes[k]; for (let v = 0; v < 3; v++) for (let c = 0; c < A.itemSize; c++) dst[k].push(A.array[(t * 3 + v) * A.itemSize + c]); }
  }
  const out = parts.map(p => { const b = new THREE.BufferGeometry(); for (const k of names) { const A = g.attributes[k]; b.setAttribute(k, new THREE.BufferAttribute(new A.array.constructor(p[k]), A.itemSize, A.normalized)); } return b; });
  out[1].translate(-pivot[0], -pivot[1], -pivot[2]);
  for (const b of out) { b.computeBoundingSphere(); b.computeBoundingBox(); }
  return out;
}

export const vcMat = (o = {}) => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, flatShading: true, ...o });
export function coloured(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  for (const k of Object.keys(g.attributes)) if (k !== 'position') g.deleteAttribute(k);
  const n = g.attributes.position.count, c = new Float32Array(n * 3), col = typeof color === 'function' ? null : new THREE.Color(color), tmp = new THREE.Color();
  for (let i = 0; i < n; i++) (col ?? tmp.set(color(g.attributes.position.getX(i), g.attributes.position.getY(i), g.attributes.position.getZ(i)))).toArray(c, i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  return g;
}
export function tris(list, color) {           // [[x,y,z] x 3, ...] -> a coloured geometry
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(list.flat(2), 3));
  return coloured(g, color);
}
