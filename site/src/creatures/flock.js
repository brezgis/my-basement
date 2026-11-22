// A flock that flocks: Reynolds's boids (C. W. Reynolds, "Flocks, Herds, and Schools: A Distributed Behavioral Model",
// SIGGRAPH 1987). Nothing leads it and nothing is scripted but where it may go: every bird steers by three rules
// applied to the birds near it,
//
//   separation   away from any neighbour closer than S.near feet (weighted by how close)
//   alignment    toward the mean heading of the neighbours within S.sight feet
//   cohesion     toward the middle of those neighbours
//
// and the wheeling over the island is what comes of that. Three more forces keep it somewhere worth watching, as
// Reynolds's own flock had: a pull toward a point that wanders slowly round the sky over the green (his "migratory
// urge"), a push back inside the air it is allowed (a cylinder over the island: floor, ceiling, wall), and a push up
// and away from the buildings. Speed is held between two limits and the steering force is capped, so the turns are
// banked curves and not jumps.
//
// From time to time the whole flock goes down into a tree: each bird is given a perch in the crown and steers to it
// (still keeping apart from its neighbours), folds its wings, and sits; they go up again together after a while, or
// at once if the visitor comes under the tree.
//
// All the state is typed arrays made once; a step is one pass over the pairs (n = 120 is 7,140 pairs) and allocates
// nothing. The birds are one instanced mesh: one draw call, whatever n is. Wings are beaten in the vertex shader.
//
// S: { name, n, x, z, r: the air it keeps to (a cylinder over this disc), floor, ceil: heights (absolute),
//      avoid: [{ x0, x1, z0, z1, top }] buildings, roosts: [{ x, y, z, r }] crowns to settle in (centre and radius),
//      air: [lo, hi] seconds on the wing, rest: [lo, hi] seconds in the tree, settle(): true when it should go to
//      roost and stay there, speed: [min, max] ft/s, near, sight, span: a bird's wingspan in feet, colour, wing,
//      flush: how near the visitor may come to the tree, when }

import * as THREE from 'three';
import { TAU, rng, tris } from './kit.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export function flock(kit, S) {
  const { scene, tag, dist, add } = kit, r = rng(S.seed ?? 1987), N = S.n ?? 100;
  const F = k => new Float32Array(k);
  const px = F(N), py = F(N), pz = F(N), vx = F(N), vy = F(N), vz = F(N), ax = F(N), ay = F(N), az = F(N), bank = F(N), qx = F(N), qy = F(N), qz = F(N), flap = F(N);
  const hop = F(N), hx = F(N), hy = F(N), hz = F(N); let shuffleAt = 0, hopping = 0;
  const mode = new Int8Array(N);                                       // 0 on the wing, 1 going down to its perch, 2 perched
  const NEAR = S.near ?? 5, SIGHT = S.sight ?? 16, VMIN = S.speed?.[0] ?? 22, VMAX = S.speed?.[1] ?? 38, AMAX = S.force ?? 46;
  const W = { sep: 42, ali: 1.4, coh: 0.38, lure: 0.5, ...(S.weights ?? {}) };
  const roosts = S.roosts ?? [], avoid = S.avoid ?? [];
  let inst = null, uT = { value: 0 }, state = 'air', until = 0, roost = null, lx = S.x, ly = (S.floor + S.ceil) / 2, lz = S.z, ph = r() * 9, perched = 0, started = false, lastT = 0;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  const stats = { neighbours: 0, speed: 0 };

  const launch = t => {                                                // all up together
    hop.fill(0); hopping = 0;
    for (let i = 0; i < N; i++) { if (mode[i] === 0) continue; mode[i] = 0; const a = r() * TAU; vx[i] = Math.cos(a) * VMIN * 0.7; vz[i] = Math.sin(a) * VMIN * 0.7; vy[i] = VMIN * (0.5 + 0.4 * r()); }
    state = 'air'; until = t + S.air[0] + r() * (S.air[1] - S.air[0]); perched = 0;
  };
  const goDown = t => {                                                // the nearest crown to where they are, each to a perch of its own in it
    if (!roosts.length) { until = t + 20; return; }
    let cx = 0, cz = 0; for (let i = 0; i < N; i++) { cx += px[i]; cz += pz[i]; } cx /= N; cz /= N;
    const near = [...roosts].sort((a, b) => Math.hypot(a.x - cx, a.z - cz) - Math.hypot(b.x - cx, b.z - cz)).filter(k => dist(k.x, k.z) > (S.flush ?? 24) + 10).slice(0, 3);
    roost = near[Math.floor(r() * near.length)] ?? roosts[0];
    for (let i = 0; i < N; i++) { const a = r() * TAU, u = Math.acos(1 - r() * 1.1), d = roost.r * (0.75 + 0.3 * r()); qx[i] = roost.x + Math.cos(a) * Math.sin(u) * d; qy[i] = roost.y + Math.cos(u) * d * 0.6; qz[i] = roost.z + Math.sin(a) * Math.sin(u) * d; mode[i] = 1; }
    state = 'down'; until = t + 14;
  };

  // one step of the rules, for every bird on the wing
  const step = (t, dt) => {
    // the point the flock is drawn toward wanders round the sky
    const R = S.r * 0.62; lx = S.x + R * Math.sin(t * 0.21 + ph) + R * 0.3 * Math.sin(t * 0.53); lz = S.z + R * Math.cos(t * 0.17 + ph * 1.7) + R * 0.3 * Math.cos(t * 0.41); ly = (S.floor + S.ceil) / 2 + (S.ceil - S.floor) * 0.3 * Math.sin(t * 0.13 + ph);
    let nb = 0, sp = 0, flying = 0;
    for (let i = 0; i < N; i++) {
      if (mode[i] === 2) continue;
      let sx = 0, sy = 0, sz = 0, mx = 0, my = 0, mz = 0, cx = 0, cy = 0, cz = 0, k = 0;
      for (let j = 0; j < N; j++) {
        if (j === i || mode[j] === 2) continue;
        const dx = px[i] - px[j], dy = py[i] - py[j], dz = pz[i] - pz[j], d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > SIGHT * SIGHT) continue;
        k++; mx += vx[j]; my += vy[j]; mz += vz[j]; cx += px[j]; cy += py[j]; cz += pz[j];
        if (d2 < NEAR * NEAR && d2 > 1e-6) { const w = (NEAR - Math.sqrt(d2)) / (NEAR * d2 ** 0.5); sx += dx * w; sy += dy * w; sz += dz * w; }      // separation
      }
      let fx = sx * W.sep, fy = sy * W.sep, fz = sz * W.sep;
      if (mode[i] === 0) {
        if (k) { fx += (mx / k - vx[i]) * W.ali + (cx / k - px[i]) * W.coh; fy += (my / k - vy[i]) * W.ali + (cy / k - py[i]) * W.coh; fz += (mz / k - vz[i]) * W.ali + (cz / k - pz[i]) * W.coh; }      // alignment, cohesion
        fx += (lx - px[i]) * W.lure; fy += (ly - py[i]) * W.lure; fz += (lz - pz[i]) * W.lure;                                                                             // the migratory urge
        // the air it may have: a floor, a ceiling, a wall
        if (py[i] < S.floor) fy += (S.floor - py[i]) * 6; else if (py[i] > S.ceil) fy -= (py[i] - S.ceil) * 6;
        const ox = px[i] - S.x, oz = pz[i] - S.z, od = Math.hypot(ox, oz); if (od > S.r) { fx -= ox / od * (od - S.r) * 4; fz -= oz / od * (od - S.r) * 4; }
        for (let a = 0; a < avoid.length; a++) {                                                                       // up and over the buildings
          const b = avoid[a], pad = 16; if (py[i] > b.top + 10 || px[i] < b.x0 - pad || px[i] > b.x1 + pad || pz[i] < b.z0 - pad || pz[i] > b.z1 + pad) continue;
          fy += 60; const bx = px[i] - (b.x0 + b.x1) / 2, bz = pz[i] - (b.z0 + b.z1) / 2, bd = Math.hypot(bx, bz) || 1; fx += bx / bd * 24; fz += bz / bd * 24;
        }
        nb += k; flying++;
      } else {                                                                                                         // going down: straight for its perch, slowing as it comes
        const dx = qx[i] - px[i], dy = qy[i] - py[i], dz = qz[i] - pz[i], d = Math.hypot(dx, dy, dz);
        if (d < 1.2) { mode[i] = 2; px[i] = qx[i]; py[i] = qy[i]; pz[i] = qz[i]; vx[i] = vy[i] = vz[i] = 0; perched++; continue; }
        const want = Math.min(VMAX * 0.8, 4 + d * 1.6); fx = fx * 0.3 + (dx / d * want - vx[i]) * 5; fy = fy * 0.3 + (dy / d * want - vy[i]) * 5; fz = fz * 0.3 + (dz / d * want - vz[i]) * 5;
      }
      const f = Math.hypot(fx, fy, fz), cap = mode[i] === 1 ? AMAX * 3 : AMAX; if (f > cap) { fx *= cap / f; fy *= cap / f; fz *= cap / f; }
      ax[i] = fx; ay[i] = fy; az[i] = fz;
    }
    for (let i = 0; i < N; i++) {
      if (mode[i] === 2) continue;
      vx[i] += ax[i] * dt; vy[i] += ay[i] * dt; vz[i] += az[i] * dt;
      let v = Math.hypot(vx[i], vy[i], vz[i]) || 1e-3;
      if (mode[i] === 0) { const c = v < VMIN ? VMIN / v : v > VMAX ? VMAX / v : 1; vx[i] *= c; vy[i] *= c; vz[i] *= c; v *= c; if (Math.abs(vy[i]) > v * 0.5) vy[i] = Math.sign(vy[i]) * v * 0.5; }      // (never straight up or down)
      px[i] += vx[i] * dt; py[i] += vy[i] * dt; pz[i] += vz[i] * dt; sp += v;
      // it banks into its turns: by the sideways part of what it is steering by
      const h = Math.hypot(vx[i], vz[i]) || 1, side = (ax[i] * vz[i] - az[i] * vx[i]) / h; bank[i] += (Math.max(-1.1, Math.min(1.1, -side * 0.035)) - bank[i]) * Math.min(1, dt * 4);
    }
    stats.neighbours = flying ? nb / flying : 0; stats.speed = flying ? sp / flying : 0;
  };
  const draw = () => {
    const M = inst.instanceMatrix.array;
    for (let i = 0; i < N; i++) {
      const on = mode[i] !== 2 || hop[i] > 0;
      if (on) { const h = Math.hypot(vx[i], vz[i]); e.set(-Math.atan2(vy[i], h), Math.atan2(vx[i], vz[i]), bank[i], 'YXZ'); } else e.set(0, i * 2.4, 0, 'YXZ');
      q.setFromEuler(e); pv.set(px[i], py[i], pz[i]); m4.compose(pv, q, sv.setScalar(1)); m4.toArray(M, i * 16);
      const want = on ? 1 : 0; if (flap[i] !== want) { flap[i] = want; inst.geometry.attributes.aFlap.needsUpdate = true; }
    }
    inst.instanceMatrix.needsUpdate = true;
  };

  add({
    name: S.name ?? 'flock', x: S.x, z: S.z, load: S.load ?? 600, live: S.live ?? 600, when: S.when,
    init: async () => {
      // a bird, flying toward +z, its wings out along x (so the shader can beat them): a body, two wings, a tail
      const s = (S.span ?? 1.4) / 1.0, top = S.colour ?? 0x23252c, under = S.under ?? top, wing = S.wing ?? top;
      const body = tris([[[0, 0.035, 0.2], [-0.05, 0, 0.02], [0.05, 0, 0.02]], [[0, 0.035, 0.2], [0.05, 0, 0.02], [0, 0.03, -0.16]], [[0, 0.035, 0.2], [0, 0.03, -0.16], [-0.05, 0, 0.02]], [[-0.05, 0, 0.02], [0, 0.03, -0.16], [0.05, 0, 0.02]]], top);
      const belly = tris([[[0, -0.03, 0.18], [0.05, 0, 0.02], [-0.05, 0, 0.02]], [[0, -0.03, 0.18], [-0.05, 0, 0.02], [0, -0.012, -0.16]], [[0, -0.03, 0.18], [0, -0.012, -0.16], [0.05, 0, 0.02]]], under);
      const wings = tris([[[-0.04, 0.012, 0.1], [-0.04, 0.012, -0.06], [-0.5, 0.012, -0.08]], [[-0.04, 0.012, 0.1], [-0.5, 0.012, -0.08], [-0.3, 0.012, 0.08]], [[0.04, 0.012, 0.1], [0.5, 0.012, -0.08], [0.04, 0.012, -0.06]], [[0.04, 0.012, 0.1], [0.3, 0.012, 0.08], [0.5, 0.012, -0.08]]], wing);
      const tail = tris([[[-0.03, 0.02, -0.14], [-0.06, 0.02, -0.3], [0.06, 0.02, -0.3]], [[-0.03, 0.02, -0.14], [0.06, 0.02, -0.3], [0.03, 0.02, -0.14]]], top);
      const geo = mergeGeometries([body, belly, wings, tail]); geo.scale(s, s, s); geo.computeVertexNormals();
      geo.setAttribute('aFlap', new THREE.InstancedBufferAttribute(flap, 1));
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, flatShading: true, side: THREE.DoubleSide });
      mat.onBeforeCompile = sh => {                                     // wings beat when aFlap is 1, and lie folded along the body when it is 0
        sh.uniforms.uFlapT = uT;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uFlapT; attribute float aFlap;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
{ float id = float(gl_InstanceID), reach = smoothstep(0.0, 0.07, abs(transformed.x));
  float a = (0.15 + 0.8 * sin(uFlapT * ${(S.beat ?? 15).toFixed(1)} + id * 2.3)) * reach * aFlap, x = transformed.x * mix(0.22, 1.0, aFlap);
  transformed.x = x * cos(a); transformed.y += abs(x) * sin(a); }`);
      };
      mat.customProgramCacheKey = () => 'flock' + (S.beat ?? 15);
      inst = tag(new THREE.InstancedMesh(geo, mat, N)); inst.frustumCulled = false; inst.name = S.name ?? 'flock'; inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(inst);
    },
    show: on => { inst.visible = on; if (!on) started = false; },
    think: t => {
      if (!started) return;
      const settle = S.settle?.() ?? false;
      if (state === 'air' && (t > until || settle)) goDown(t);
      else if (state === 'down' && (perched >= N || t > until)) { for (let i = 0; i < N; i++) if (mode[i] === 1) { mode[i] = 2; px[i] = qx[i]; py[i] = qy[i]; pz[i] = qz[i]; } perched = N; state = 'roost'; until = t + S.rest[0] + r() * (S.rest[1] - S.rest[0]); }
      else if (state === 'roost' && ((t > until && !settle) || (roost && dist(roost.x, roost.z) < (S.flush ?? 24)))) launch(t);
    },
    tick: (t, dt) => {
      if (!started) {                                                   // they come in over the rim together, already a flock
        started = true; const a = r() * TAU, cx = S.x + Math.cos(a) * S.r * 0.7, cz = S.z + Math.sin(a) * S.r * 0.7, cy = (S.floor + S.ceil) / 2, h = a + Math.PI + 0.6;
        for (let i = 0; i < N; i++) { px[i] = cx + (r() - 0.5) * 30; py[i] = cy + (r() - 0.5) * 14; pz[i] = cz + (r() - 0.5) * 30; vx[i] = Math.cos(h) * VMIN; vy[i] = 0; vz[i] = Math.sin(h) * VMIN; mode[i] = 0; bank[i] = 0; }
        state = 'air'; until = t + S.air[0] + r() * (S.air[1] - S.air[0]); perched = 0; lastT = t;
        if (S.settle?.() && roosts.length) { goDown(t); for (let i = 0; i < N; i++) { mode[i] = 2; px[i] = qx[i]; py[i] = qy[i]; pz[i] = qz[i]; vx[i] = vy[i] = vz[i] = 0; } perched = N; state = 'roost'; until = t + 1e9; }      // found already at roost
      }
      uT.value = t; lastT = t;
      if (state !== 'roost') step(t, Math.min(dt, 0.05));
      else if (t > shuffleAt) {                                         // at roost they do not keep still: now one and now another flutters to a better twig
        shuffleAt = t + 0.25 + r() * 0.9; const i = Math.floor(r() * N);
        if (mode[i] === 2 && roost) { const a = r() * TAU, u = Math.acos(1 - r() * 1.1), d = roost.r * (0.75 + 0.3 * r()); qx[i] = roost.x + Math.cos(a) * Math.sin(u) * d; qy[i] = roost.y + Math.cos(u) * d * 0.6; qz[i] = roost.z + Math.sin(a) * Math.sin(u) * d; hop[i] = 1; stats.shuffles = (stats.shuffles ?? 0) + 1; hx[i] = px[i]; hy[i] = py[i]; hz[i] = pz[i]; hopping++; }
      }
      if (hopping) for (let i = 0; i < N; i++) { if (!hop[i]) continue; hop[i] = Math.max(0, hop[i] - dt / 0.7); const k = 1 - hop[i]; px[i] = hx[i] + (qx[i] - hx[i]) * k; py[i] = hy[i] + (qy[i] - hy[i]) * k + 1.4 * Math.sin(Math.PI * k); pz[i] = hz[i] + (qz[i] - hz[i]) * k; vx[i] = qx[i] - hx[i]; vz[i] = qz[i] - hz[i]; vy[i] = 0; if (!hop[i]) hopping--; }
      draw();
    },
    check: () => { let cx = 0, cy = 0, cz = 0, lo = 1e9, hi = -1e9, spread = 0; for (let i = 0; i < N; i++) { cx += px[i]; cy += py[i]; cz += pz[i]; lo = Math.min(lo, py[i]); hi = Math.max(hi, py[i]); } cx /= N; cy /= N; cz /= N; for (let i = 0; i < N; i++) spread += Math.hypot(px[i] - cx, py[i] - cy, pz[i] - cz); return { x: cx, y: cy, z: cz, state, n: N, perched, lowest: lo, highest: hi, spread: spread / N, neighbours: stats.neighbours, speed: stats.speed, shuffles: stats.shuffles ?? 0, all: Array.from({ length: Math.min(N, 12) }, (_, i) => ({ x: px[i], y: py[i], z: pz[i], hidden: mode[i] === 2 && !hop[i] })) }; },
  });
}
