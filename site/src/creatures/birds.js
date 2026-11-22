// Birds, each a way of behaving that is told where to live (the cast is in ../creatures.js). The robin and the
// barn owl are Vesper Street's; the sparrows, the blackbird and the jay are from the garden of Anna's House.
// None of them holds a pose for long.
//
//   robin       flies between its perches, bobs, sings, drops to the grass and pecks about; stand still near it and
//               it comes down to look at you. E: whistle to it.
//   sparrows    a small flock on the grass: hop and peck, squabble, move on together every few seconds, go up to
//               perch on something and come down again; all up into the trees if you come near
//   blackbird   on a lawn: runs, stops, cocks its head to listen, stabs and tugs; runs from you, flies if pressed
//   jay         at a bird bath: drinks, bathes, hops round the rim, flies up into a tree and back
//   barn owl    on a post at night: its head follows you; it preens, bobs, ruffles, and glides to another post
//
// Models: Poly Pizza, CC-BY 3.0 (see assets/CREDITS.md). The flight wings are built in code.

import * as THREE from 'three';
import { TAU, Walk, Flight, wingPair, splitHead, turnTo, wrapA, clamp, ease, rng } from './kit.js';

// ---- A robin -----------------------------------------------------------------------------------------------------
// S: { perches: [[x, y, z], ...] (y: the top of the thing it stands on), face: the way it looks when nobody is
//      about, forage: { x, z, r } the grass it drops to (or none), flit: how often it changes perch, when }
export function robin(kit, S) {
  const { ctx, cam, scene, mesh, free, groundAt, dist, camDist, add, feet, plant } = kit, r = rng(S.seed ?? 4242);
  const perches = S.perches, P0 = perches[0], G = S.forage;
  const FLIT = S.flit ?? 0.25;                                                     // how restless it is: how often it changes its perch
  let o, fp, wings, fl, state = 'perch', then = 'perch', standY = P0[1], until = 0, bobAt = -9, look = 0, pecks = 0, peckAt = 0, pi = 0, still = 0, lx = 0, lz = 0, visitT = 0, called = false, now = 0, singAt = -9, spots = 0;
  const item = { x: P0[0], y: -500, z: P0[2], reach: 13, size: 1.4, label: () => 'whistle to the robin', act: () => {
    ctx.sound?.chirp?.([67, 72, 71, 76], 0.05); called = true; bobAt = now + 0.5;
    ctx.flash?.('You whistle. The robin tilts its head, and answers.'); setTimeout(() => ctx.sound?.chirp?.([79, 84, 81, 88, 84], 0.04), 900);
  } };
  ctx.interact.push(item);
  const flyTo = (x, y, z, T, lift, next) => { fl.go(x, y, z, T, lift); then = next; state = 'fly'; standY = y; };
  const toPerch = (i = (pi + 1 + Math.floor(r() * (perches.length - 1))) % perches.length) => { pi = i; const p = perches[pi], d = Math.hypot(p[0] - o.position.x, p[2] - o.position.z); flyTo(p[0], p[1], p[2], 0.6 + d / 16, 0.6 + d * 0.04, 'perch'); };
  const ground = () => { for (let k = 0; k < 8; k++) { const a = r() * TAU, q = Math.sqrt(r()) * G.r, x = G.x + Math.cos(a) * q, z = G.z + Math.sin(a) * q; if (free(x, z, 0.4) && dist(x, z) > 9) return [x, z]; } return null; };
  // a free spot on the ground about five feet from her, on the robin's side
  const beside = () => {
    const d = Math.hypot(P0[0] - cam.x, P0[2] - cam.z) || 1;
    for (let k = 0; k < 8; k++) { const a = Math.atan2(P0[0] - cam.x, P0[2] - cam.z) + (k ? (r() - 0.5) * 2.2 : 0), x = cam.x + Math.sin(a) * Math.min(5, d * 0.6), z = cam.z + Math.cos(a) * Math.min(5, d * 0.6); if (free(x, z, 0.5)) return [x, z]; }
    return null;
  };
  add({
    name: S.name ?? 'robin', x: P0[0], z: P0[2], load: S.load ?? 300, live: S.live ?? 260, when: S.when,
    init: async () => {
      const body = await mesh('v_robin'); fp = feet(body.geometry); o = new THREE.Group(); o.add(body); wings = wingPair(0.72, 0.17, 0x6e5a42, 0x4a3a2a, [0, 0.2, 0]); o.add(wings);
      o.position.set(...P0); o.rotation.y = S.face ?? 0; plant(o, fp, P0[1]); scene.add(o); fl = new Flight(o); lx = cam.x; lz = cam.z;
    },
    show: on => { o.visible = on; item.y = on ? o.position.y + 0.3 : -500; },
    think: t => {
      now = t; const p = o.position, d = dist(p.x, p.z);
      item.x = p.x; item.y = p.y + 0.3; item.z = p.z;                                  // the prompt is on the bird, wherever it has got to
      still = Math.hypot(cam.x - lx, cam.z - lz) < 0.2 ? still + 0.25 : 0; lx = cam.x; lz = cam.z;
      if (state === 'fly') return;
      if (state === 'visit') { if (d < 2.6 || d > 16 || t > visitT) toPerch(); return; }
      if (state === 'forage') {
        if (d < 6) { toPerch(); return; }
        if (pecks > 0 || t < until) return;
        if (--spots > 0) { const s = ground(); if (s) { flyTo(s[0], groundAt(s[0], s[1]), s[1], 0.45, 0.25, 'forage'); return; } }      // a flutter on to the next place
        toPerch(); return;
      }
      // on its perch: she whistled, or has stood still close by for a while: down to have a look at her
      if ((called || still > 3.5) && camDist(p.x, p.z) < 24 && camDist(p.x, p.z) > 6) { const s = beside(); called = false; still = 0; if (s) { flyTo(s[0], groundAt(s[0], s[1]), s[1], 1.3, 1.0, 'visit'); visitT = t + 22; return; } }
      if (t < until) return;
      const k = r();
      if (G && k < 0.3) { const s = ground(); if (s) { spots = 2 + Math.floor(r() * 3); flyTo(s[0], groundAt(s[0], s[1]), s[1], 0.9, 0.5, 'forage'); return; } }
      if (k < 0.3 + FLIT && perches.length > 1) { toPerch(); return; }
      if (k < (G ? 0.75 : 0.85)) { singAt = t; until = t + 1.8; if (camDist(p.x, p.z) < 50) ctx.sound?.chirp?.([84, 88, 86, 91, 88].slice(0, 3 + Math.floor(r() * 3)), 0.012); return; }      // a phrase of song, head up
      if (r() < 0.5) bobAt = t; else look = (r() - 0.5) * 2.4;
      until = t + 0.6 + r() * 1.2;
    },
    tick: (t, dt) => {
      if (state === 'fly') {
        const u = fl.step(dt); wings.visible = true; wings.userData.flap(u > 0.8 ? 0.9 : 0.3 + 0.9 * Math.sin(t * 30));
        if (!fl.busy) { state = then; wings.visible = false; o.rotation.x = 0; if (state === 'forage') { pecks = 2 + Math.floor(r() * 3); peckAt = t; } until = t + 0.5; bobAt = t + 0.2; plant(o, fp, standY); }
        return;
      }
      if (state === 'forage') { const u = (t - peckAt) % 0.6; o.rotation.x = u < 0.25 ? 0.6 * Math.sin(Math.PI * u / 0.25) : 0; if (t - peckAt > 0.6) { pecks--; peckAt = t; o.rotation.y += (r() - 0.5) * 1.6; } plant(o, fp, standY, u > 0.3 && u < 0.5 ? 0.05 : 0); return; }
      const toHer = Math.atan2(cam.x - o.position.x, cam.z - o.position.z), close = camDist(o.position.x, o.position.z) < 14, sing = t - singAt;
      o.rotation.y = turnTo(o.rotation.y, state === 'visit' || close ? toHer + (state === 'visit' ? 0.5 * Math.sin(Math.floor(t * 0.7) * 2.1) : 0) : (S.face ?? 0) + look, dt * 7);
      const u = (state === 'visit' ? t % 2.3 : t - bobAt);
      o.rotation.x = sing >= 0 && sing < 1.6 ? -0.34 + 0.05 * Math.sin(t * 34) : u >= 0 && u < 0.3 ? -0.25 * Math.sin(Math.PI * u / 0.3) : 0;     // singing, head thrown back; or the robin's bob and tail flick
      plant(o, fp, standY);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y, state, perch: pi }),
  });
}

// ---- A barn owl on a post, at night ------------------------------------------------------------------------------
// S: { perches: [[x, y, z], ...] post tops (the first is where it begins), toward: [x, z] what it faces, when }
export function owl(kit, S) {
  const { cam, scene, mesh, tag, dist, add, feet, plant } = kit, r = rng(S.seed ?? 77);
  const perches = S.perches ?? [S.at], faceAt = p => Math.atan2(S.toward[0] - p[0], S.toward[1] - p[2]);
  let o, head, wings, fl, fp, pi = 0, yaw0 = faceAt(perches[0]), hy = 0, hp = 0, hr = 0, scanAt = 0, scan = 0, state = 'sit', act = 0, until = 6, glideAt = 14 + r() * 10;
  add({
    name: S.name ?? 'owl', x: perches[0][0], z: perches[0][2], load: S.load ?? 320, live: S.live ?? 280, when: S.when,
    init: async () => {
      const src = await mesh('v_owl_barn'), g = src.geometry; g.computeBoundingBox(); const neck = g.boundingBox.max.y * 0.66;
      const [bodyG, headG] = splitHead(g, (x, y) => y > neck, [0, neck, -0.02]);
      const mat = src.material.clone(); mat.emissive = new THREE.Color(0x2a2620); mat.emissiveMap = mat.map; mat.emissiveIntensity = 0.5;      // pale in the dark, as a barn owl is
      o = new THREE.Group(); const body = tag(new THREE.Mesh(bodyG, mat)); head = tag(new THREE.Mesh(headG, mat)); head.position.set(0, neck, -0.02); o.add(body, head);
      wings = wingPair(3.3, 0.8, 0xd8c8a4, 0xb89a6a, [0, neck * 0.8, 0]); wings.traverse(m => { if (m.isMesh) { m.material = m.material.clone(); m.material.emissive = new THREE.Color(0x3a3428); } }); o.add(wings);
      const P = perches[0]; fp = feet(bodyG); o.position.set(P[0], P[1], P[2]); o.rotation.y = yaw0; plant(o, fp, P[1]); o.name = 'owl'; scene.add(o); fl = new Flight(o);
    },
    show: on => { o.visible = on; },
    think: t => {
      if (state === 'glide') return;
      const p = o.position, near = dist(p.x, p.z) < 11;
      if (perches.length > 1 && (near || t > glideAt)) {                               // off without a sound to another post: the furthest from her if she is close
        let best = (pi + 1) % perches.length; if (near) { let far = -1; perches.forEach((q, i) => { const d = dist(q[0], q[2]); if (i !== pi && d > far) { far = d; best = i; } }); } else best = (pi + 1 + Math.floor(r() * (perches.length - 1))) % perches.length;
        pi = best; const q = perches[pi], d = Math.hypot(q[0] - p.x, q[2] - p.z); fl.go(q[0], q[1], q[2], 0.8 + d / 15, -Math.min(2.5, d * 0.05)); state = 'glide'; act = t; return;
      }
      if (t < until) return;
      const k = r(); act = t;
      if (k < 0.3) { state = 'preen'; until = t + 1.6 + r(); }
      else if (k < 0.55) { state = 'bob'; until = t + 1.4 + r() * 0.8; }
      else if (k < 0.7) { state = 'ruffle'; until = t + 0.9; }
      else { state = 'sit'; until = t + 1.5 + r() * 2; scan = (r() - 0.5) * 3.2; }
    },
    tick: (t, dt) => {
      if (state === 'glide') {
        const u = fl.step(dt); wings.visible = true; wings.userData.flap(u < 0.25 || u > 0.82 ? 0.25 + 0.75 * Math.sin(t * 11) : 0.12 + 0.05 * Math.sin(t * 2));      // a few beats, then a long glide, then braking
        head.rotation.set(0.1, 0, 0);
        if (!fl.busy) { state = 'sit'; wings.visible = false; yaw0 = faceAt(perches[pi]); o.rotation.set(0, o.rotation.y, 0); plant(o, fp, perches[pi][1]); until = t + 1.5; glideAt = t + 16 + r() * 14; hy = 0; }
        return;
      }
      o.rotation.y = turnTo(o.rotation.y, yaw0, dt * 1.5);
      const dx = cam.x - o.position.x, dz = cam.z - o.position.z, d = Math.hypot(dx, dz), u = t - act;
      let want = scan, pitch = 0.15, roll = 0.08 * Math.sin(t * 0.9), sc = 1;
      if (state === 'preen') { want = 1.9 * Math.sign(scan || 1); pitch = 0.75 + 0.15 * Math.sin(t * 9); roll = 0.3; }                    // beak down into the shoulder feathers
      else if (state === 'bob') { want = d < 70 ? clamp(wrapA(Math.atan2(dx, dz) - o.rotation.y), -2.2, 2.2) : scan; pitch = 0.1 + 0.22 * Math.sin(t * 5.5); roll = 0.45 * Math.sin(t * 2.75); }      // the head going round and up and down, taking a range
      else if (state === 'ruffle') sc = 1 + 0.14 * Math.sin(Math.PI * Math.min(1, u / 0.8)) * (0.7 + 0.3 * Math.sin(t * 40));
      else if (d < 70) { want = clamp(wrapA(Math.atan2(dx, dz) - o.rotation.y), -2.2, 2.2); pitch = clamp(Math.atan2(o.position.y + 1 - cam.y, d), -0.3, 0.7); }
      hy = turnTo(hy, want, dt * 3.4); hp += (pitch - hp) * Math.min(1, dt * 5); hr += (roll - hr) * Math.min(1, dt * 5);
      head.rotation.set(hp, hy, hr, 'YXZ'); o.scale.set(sc, 1, sc);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: hy + hp + hr + o.scale.x, state, perch: pi }),
  });
}

// ---- Sparrows on the grass ---------------------------------------------------------------------------------------
// S: { x, z, r: the grass they keep to (where it is free), n, trees: [{ x, z, y, height }] they fly up into,
//      perches: [[x, y, z], ...] things in reach to sit on in a row (a table top, a rail), when }
export function sparrows(kit, S) {
  const { scene, mesh, tag, free, groundAt, dist, add, feet } = kit, r = rng(S.seed ?? 4243);
  const C = S, N = S.n ?? 5, inArea = (x, z) => Math.hypot(x - C.x, z - C.z) < C.r && free(x, z, 0.4);
  const trees = S.trees ?? [], perches = S.perches ?? [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
  let inst, wingI, fp, scared = false, calm = 0, moveAt = 6, up = false, cx = C.x, cz = C.z; const B = [];
  const spot = (ax = C.x, az = C.z, rad = C.r) => { for (let k = 0; k < 60; k++) { const a = r() * TAU, d = Math.sqrt(r()) * rad, x = ax + Math.cos(a) * d, z = az + Math.sin(a) * d; if (inArea(x, z)) return [x, z]; } return null; };
  const fly = (b, x, y, z, t, then, T = 0.7) => { b.ax = b.x; b.ay = b.y; b.az = b.z; b.bx = x; b.by = y; b.bz = z; b.T = T + Math.hypot(x - b.x, z - b.z) / 22; b.t0 = t; b.mode = 'fly'; b.then = then; b.s = 1; };
  add({
    name: S.name ?? 'sparrows', x: C.x, z: C.z, load: S.load ?? 300, live: S.live ?? 240, when: S.when,
    init: async () => {
      const src = await mesh('v_sparrow'); fp = feet(src.geometry); inst = tag(new THREE.InstancedMesh(src.geometry, src.material, N)); inst.frustumCulled = false; inst.name = 'sparrows';
      // wings that open in flight (one instanced mesh, two per bird, hinged on the back)
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.09, 0, 0, -0.08, 0.36, 0, -0.1, 0, 0, 0.09, 0.36, 0, -0.1, 0.3, 0, 0.03], 3)); wg.computeVertexNormals(); wg.translate(0, 0.16, 0.02);
      wingI = tag(new THREE.InstancedMesh(wg, new THREE.MeshStandardMaterial({ color: 0x8a6a48, roughness: 0.9, side: THREE.DoubleSide }), N * 2)); wingI.frustumCulled = false; wingI.name = 'sparrow wings'; scene.add(wingI);
      const c = spot() ?? [C.x, C.z]; cx = c[0]; cz = c[1];
      for (let i = 0; i < N; i++) { const [x, z] = spot(cx, cz, 3.5) ?? c, y = groundAt(x, z); B.push({ x, y, z, yaw: r() * TAU, pitch: 0, mode: 'peck', t0: 0, until: r() * 2, ax: x, ay: y, az: z, bx: x, by: y, bz: z, T: 1, s: 1, then: 'peck' }); }
      scene.add(inst);
    },
    show: on => { inst.visible = wingI.visible = on; },
    think: t => {
      const near = dist(C.x, C.z) < 11 || B.some(b => b.s > 0 && dist(b.x, b.z) < 8);
      if (near && !scared) {                                                                // all up into the trees
        scared = true; calm = 0; up = false;
        B.forEach((b, i) => { const tr = trees[i % Math.max(1, trees.length)] ?? { x: C.x - 8, z: C.z, y: groundAt(C.x, C.z), height: 30 }; fly(b, tr.x + (r() - 0.5) * 6, (tr.y ?? 0) + (tr.height ?? 30) * 0.62, tr.z + (r() - 0.5) * 6, t + r() * 0.3, 'hidden', 1.1); });
        return;
      }
      if (scared) { calm = near ? 0 : calm + 0.25; if (calm > 5) { scared = false; moveAt = t + 6; const c = spot() ?? [C.x, C.z]; cx = c[0]; cz = c[1]; B.forEach(b => { const [x, z] = spot(cx, cz, 3.5) ?? c; fly(b, x, groundAt(x, z), z, t + r() * 2.5, 'peck', 1.3); }); } return; }
      if (t > moveAt) {                                                                     // the whole flock moves on: to another patch of the grass, or up onto something, or down off it
        moveAt = t + 5 + r() * 6;
        if (!up && perches.length && r() < 0.4) { up = true; const P = perches[Math.floor(r() * perches.length)]; B.forEach((b, i) => fly(b, P[0] + (P[3] ?? 0) * (i - (N - 1) / 2) * 0.55, P[1], P[2] + (P[4] ?? 0) * (i - (N - 1) / 2) * 0.55, t + r() * 1.2, 'look')); }
        else { up = false; const c = spot(); if (c) { cx = c[0]; cz = c[1]; B.forEach(b => { const [x, z] = spot(cx, cz, 3.5) ?? c; fly(b, x, groundAt(x, z), z, t + r() * 1.4, 'peck'); }); } }
        return;
      }
      for (let i = 0; i < N; i++) {
        const b = B[i]; if (b.mode === 'fly' || b.mode === 'spat' || t < b.until) continue;
        const k = r();
        if (up) { b.mode = k < 0.35 ? 'peck' : 'look'; b.until = t + 0.4 + r() * 0.8; b.yaw += (r() - 0.5) * 2.2; continue; }      // in a row on the table: looking about, shuffling
        if (k < 0.3) { b.mode = 'peck'; b.until = t + 0.6 + r() * 1.2; }
        else if (k < 0.42) { b.mode = 'look'; b.until = t + 0.3 + r() * 0.7; b.yaw += (r() - 0.5) * 1.8; }
        else if (k < 0.5) {                                                                 // a squabble: two go up breast to breast, and drop
          const o = B.find(q => q !== b && q.mode !== 'fly' && q.mode !== 'spat' && Math.hypot(q.x - b.x, q.z - b.z) < 2.6);
          if (o) for (const [p, w] of [[b, o], [o, b]]) { p.mode = 'spat'; p.t0 = t; p.until = t + 0.9; p.yaw = Math.atan2(w.x - p.x, w.z - p.z); }
          else { b.mode = 'peck'; b.until = t + 0.5; }
        }
        else { const a = b.yaw + (r() - 0.5) * 1.8, x = b.x + Math.sin(a) * 1.3, z = b.z + Math.cos(a) * 1.3; if (inArea(x, z) && Math.hypot(x - cx, z - cz) < 5) { b.mode = 'hop'; b.ax = b.x; b.az = b.z; b.bx = x; b.bz = z; b.ay = b.by; b.by = groundAt(x, z); b.t0 = t; b.until = t + 0.5; } else { b.yaw = Math.atan2(cx - b.x, cz - b.z); b.until = t + 0.2; } }
      }
    },
    tick: t => {
      for (let i = 0; i < N; i++) {
        const b = B[i]; let base = b.by, wing = false;
        if (b.mode === 'fly') {
          const u = clamp((t - b.t0) / b.T, 0, 1), k = ease(u);
          b.x = b.ax + (b.bx - b.ax) * k; b.z = b.az + (b.bz - b.az) * k; b.y = b.ay + (b.by - b.ay) * k + (0.6 + b.T) * Math.sin(Math.PI * u);
          if (u > 0) b.yaw = Math.atan2(b.bx - b.ax, b.bz - b.az); b.pitch = -0.2; wing = u > 0 && u < 1;
          if (u >= 1) { b.mode = b.then; b.pitch = 0; b.s = b.then === 'hidden' ? 0 : 1; b.until = t + r() * 0.8; b.y = b.by; }
        } else if (b.mode === 'hop') {
          const u = clamp((t - b.t0) / 0.45, 0, 1);                                      // three little hops, up or down the slope
          base = b.ay + (b.by - b.ay) * u;
          b.x = b.ax + (b.bx - b.ax) * u; b.z = b.az + (b.bz - b.az) * u; b.y = base + 0.12 * Math.abs(Math.sin(Math.PI * u * 3)); b.yaw = Math.atan2(b.bx - b.ax, b.bz - b.az);
          if (u >= 1) { b.mode = 'peck'; b.y = b.by; b.until = t + 0.3 + r() * 0.8; }
        } else if (b.mode === 'spat') { const u = clamp((t - b.t0) / 0.8, 0, 1); b.y = b.by + 1.1 * Math.sin(Math.PI * u); b.pitch = -0.5 * Math.sin(Math.PI * u); wing = true; if (u >= 1) { b.mode = 'look'; b.y = b.by; b.pitch = 0; } }
        else if (b.mode === 'peck') { const u = (t * 3 + i * 0.7) % 1; b.pitch = u < 0.3 ? 0.7 * Math.sin(Math.PI * u / 0.3) : 0; }
        else b.pitch = 0;
        e.set(b.pitch, b.yaw, 0, 'YXZ'); q.setFromEuler(e); pv.set(b.x, 0, b.z); sv.setScalar(b.s); m4.compose(pv, q, sv);
        if (b.mode !== 'fly' && b.mode !== 'spat') {                                  // feet on the ground: the lowest foot at the surface, plus the hop
          const el = m4.elements; let lo = Infinity; for (let j = 0; j < fp.length; j += 3) lo = Math.min(lo, el[1] * fp[j] + el[5] * fp[j + 1] + el[9] * fp[j + 2]);
          el[13] = base + (b.mode === 'hop' ? b.y - base : 0) - lo;
        } else m4.elements[13] = b.y;
        inst.setMatrixAt(i, m4);
        const beat = 0.2 + 1.0 * Math.sin(t * 28 + i);
        for (let side = 0; side < 2; side++) { e.set(b.pitch, b.yaw, side ? -beat : beat, 'YXZ'); q.setFromEuler(e); pv.set(b.x, b.y, b.z); sv.set(side ? -1 : 1, 1, 1).multiplyScalar(wing && b.s > 0 ? 1 : 0); wingI.setMatrixAt(i * 2 + side, m4.compose(pv, q, sv)); }
      }
      inst.instanceMatrix.needsUpdate = true; wingI.instanceMatrix.needsUpdate = true;
    },
    check: () => { const b = B.find(b => b.s > 0 && b.mode !== 'fly') ?? B[0]; return { x: b.x, y: b.y, z: b.z, ground: b.by, scared, up, all: B.map(b => ({ x: b.x, y: b.y, z: b.z, p: b.pitch + b.yaw, ground: b.by, hidden: b.s === 0, mode: up && b.mode !== 'fly' ? 'perched' : b.mode })) }; },
  });
}

// ---- A blackbird on a lawn -----------------------------------------------------------------------------------------
// S: { field: { x, z, r } the lawn, hide: [x, y, z] where it flies to if pressed (a crown), when }
export function blackbird(kit, S) {
  const { scene, mesh, free, groundAt, dist, nearest, add, feet, plant } = kit, r = rng(S.seed ?? 606), F = S.field;
  let o, fp, wings, w, fl, state = 'stop', until = 0, gy = 0, act = 0, gone = false, safe = 0;
  const ok = (x, z) => Math.hypot(x - F.x, z - F.z) < F.r && free(x, z, 0.4);
  const pick = (fx, fz, d0) => { for (let k = 0; k < 20; k++) { const a = r() * TAU, d = d0 * (0.6 + r() * 0.6), x = fx + Math.cos(a) * d, z = fz + Math.sin(a) * d; if (ok(x, z)) return [x, z]; } for (let k = 0; k < 20; k++) { const a = r() * TAU, d = Math.sqrt(r()) * F.r, x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d; if (ok(x, z)) return [x, z]; } return [fx, fz]; };
  add({
    name: S.name ?? 'blackbird', x: F.x, z: F.z, load: S.load ?? 300, live: S.live ?? 260, when: S.when,
    init: async () => { const body = await mesh('v_blackbird'); fp = feet(body.geometry); o = new THREE.Group(); o.add(body); wings = wingPair(1.25, 0.3, 0x1c1a18, 0x0c0b0a, [0, 0.36, 0]); o.add(wings); const [x, z] = pick(F.x, F.z, 2); gy = groundAt(x, z); o.position.set(x, gy, z); plant(o, fp, gy); scene.add(o); w = new Walk(o); w.land = groundAt; w.base = gy; fl = new Flight(o); },
    show: on => { o.visible = on && !gone; },
    think: t => {
      const p = o.position, d = dist(p.x, p.z);
      if (gone) { safe = d > 14 && dist(F.x, F.z) > 16 ? safe + 0.25 : 0; if (safe > 6 && !fl.busy) { gone = false; o.visible = true; const [x, z] = pick(F.x, F.z, 4); gy = groundAt(x, z); state = 'fly'; fl.go(x, gy, z, 1.6, 1.5); } return; }
      if (state === 'fly') return;
      if (d < 5) { gone = true; safe = 0; state = 'fly'; w.stop(); fl.go(S.hide[0], S.hide[1], S.hide[2], 1.6, 2); return; }
      if (d < 10 && state !== 'run') { const who = nearest(p.x, p.z), [x, z] = pick(p.x + (p.x - who.x) / d * 7, p.z + (p.z - who.z) / d * 7, 1.5); w.go([[x, 0, z]], 6.5, 0.06, 0.35, 14); state = 'run'; return; }
      if (w.busy || t < until) return;
      const k = r();
      if (state === 'run' ? k < 0.75 : k < 0.2) { state = 'listen'; until = t + 0.7 + r() * 0.8; act = t; }
      else if (k < 0.45) { state = 'stab'; until = t + 2.0; act = t; }
      else { const [x, z] = pick(p.x, p.z, 4.5); w.go([[x, 0, z]], 4.8, 0.05, 0.32, 14); state = 'run'; }
    },
    tick: (t, dt) => {
      if (state === 'fly') { const u = fl.step(dt); wings.visible = true; wings.userData.flap(u > 0.8 ? 0.9 : 0.3 + 0.9 * Math.sin(t * 22)); if (!fl.busy) { wings.visible = false; o.rotation.set(0, o.rotation.y, 0); state = 'stop'; if (gone) o.visible = false; else { w.base = gy; plant(o, fp, gy); } } return; }
      if (w.step(dt)) { gy = w.base; o.rotation.x = 0.08; o.rotation.z = 0; plant(o, fp, gy, w.lift); return; }
      const u = t - act;
      if (state === 'listen') { o.rotation.z = 0.32 * Math.sin(Math.min(1, u * 3) * Math.PI / 2); o.rotation.x = 0.1; }
      else if (state === 'stab') {                                                          // stab, then tug at the worm, leaning back
        o.rotation.z = 0; o.rotation.x = u < 0.2 ? 0.8 * u / 0.2 : u < 1.6 ? 0.8 - 0.25 * Math.abs(Math.sin((u - 0.2) * 6)) : Math.max(0, 0.8 - (u - 1.6) * 3);
      } else { o.rotation.x = 0; o.rotation.z = 0; }
      plant(o, fp, gy);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y + o.rotation.z, ground: gy, state, hidden: gone || state === 'fly' }),
  });
}

// ---- A jay at a bird bath ------------------------------------------------------------------------------------------
// S: { bath: { x, z, r, top } the rim (its radius, its height), perch: [x, y, z] where it flies up to (a crown), when }
export function jay(kit, S) {
  const { cam, scene, mesh, dist, add, feet, plant } = kit, r = rng(S.seed ?? 555), bx = S.bath.x, bz = S.bath.z, rimR = S.bath.r, rimY = S.bath.top, L = S.perch;
  let o = null, fp = null, wings = null, fl = null, a = r() * TAU, state = 'sit', until = 0, dipAt = 0, hopA = a, hopU = 1, gone = false, safe = 0, look = 0, perchY = rimY, away = 0;
  const sitRim = () => { o.position.x = bx + Math.cos(a) * rimR; o.position.z = bz + Math.sin(a) * rimR; };
  const T = () => 1 + Math.hypot(L[0] - bx, L[2] - bz) / 16;
  add({
    name: S.name ?? 'jay', x: bx, z: bz, load: S.load ?? 300, live: S.live ?? 240, when: S.when,
    init: async () => {
      const body = await mesh('v_kingfisher_bluejay', 1.0); fp = feet(body.geometry); o = new THREE.Group(); o.add(body);
      wings = wingPair(1.25, 0.32, 0x8a96a8, 0x2a3a6a, [0, 0.24, 0.02]); o.add(wings);
      sitRim(); o.rotation.y = Math.atan2(bx - o.position.x, bz - o.position.z); plant(o, fp, rimY); scene.add(o); fl = new Flight(o);
    },
    show: on => { o.visible = on; },
    think: t => {
      const near = dist(o.position.x, o.position.z) < 8;
      if (state === 'fly') return;
      if (gone) { safe = near || dist(bx, bz) < 12 ? 0 : safe + 0.25; if (safe > 3 && t > away) { gone = false; state = 'fly'; fl.go(bx + Math.cos(a) * rimR, rimY, bz + Math.sin(a) * rimR, T(), 2); } return; }
      if (near || (t > until && r() < 0.1)) { gone = true; safe = 0; away = t + 4 + r() * 4; state = 'fly'; wings.visible = true; fl.go(L[0] + (r() - 0.5) * 3, L[1], L[2] + (r() - 0.5) * 3, T(), 2.5); return; }
      if (t < until) return;
      const k = r();
      if (k < 0.3) { state = 'drink'; dipAt = t; until = t + (2 + Math.floor(r() * 2)) * 0.9 + 0.3; }
      else if (k < 0.5) { state = 'bathe'; dipAt = t; until = t + 1.6 + r(); }
      else if (k < 0.82) { state = 'hop'; hopA = a + (r() < 0.5 ? -1 : 1) * (0.3 + r() * 0.5); hopU = 0; until = t + 0.5; }
      else { state = 'look'; until = t + 0.8 + r() * 1.2; look = (r() - 0.5) * 2.4; }
    },
    tick: (t, dt) => {
      if (state === 'fly') {
        const u = fl.step(dt); wings.visible = u < 0.97; wings.userData.flap(u > 0.8 ? 0.9 : 0.25 + 0.9 * Math.sin(t * 24));
        if (!fl.busy) { state = gone ? 'perch' : 'sit'; perchY = gone ? o.position.y : rimY; wings.visible = false; o.rotation.x = 0; until = t + 0.6; if (!gone) plant(o, fp, rimY); }
        return;
      }
      if (state === 'perch') { o.rotation.y = turnTo(o.rotation.y, Math.atan2(cam.x - o.position.x, cam.z - o.position.z) + 0.8 * Math.sin(Math.floor(t * 0.8) * 1.9), dt * 5); o.rotation.x = 0.2 * Math.max(0, Math.sin(t * 3.1)); return; }
      if (state === 'hop') {                                                     // one hop along the rim
        hopU = Math.min(1, hopU + dt * 3.5); a = a + (hopA - a) * Math.min(1, dt * 9); sitRim();
        o.rotation.y = turnTo(o.rotation.y, Math.atan2(-Math.sin(a) * Math.sign(hopA - a || 1), Math.cos(a) * Math.sign(hopA - a || 1)), dt * 12);
        plant(o, fp, rimY, 0.15 * Math.sin(Math.PI * hopU)); if (hopU >= 1) { a = hopA; state = 'sit'; plant(o, fp, rimY); }
        return;
      }
      const inward = Math.atan2(bx - o.position.x, bz - o.position.z);
      wings.visible = false;
      if (state === 'drink') { o.rotation.y = turnTo(o.rotation.y, inward, dt * 6); const u = (t - dipAt) % 0.9; o.rotation.x = u < 0.35 ? 0.5 * Math.sin(Math.PI * u / 0.35) : -0.25 * Math.sin(Math.PI * (u - 0.35) / 0.55); }      // dips, and tips its head back to swallow
      else if (state === 'bathe') { o.rotation.y = turnTo(o.rotation.y, inward, dt * 6) + 0.12 * Math.sin(t * 31); o.rotation.x = 0.35 + 0.1 * Math.sin(t * 23); wings.visible = true; wings.userData.flap(0.1 + 0.5 * Math.abs(Math.sin(t * 26))); o.rotation.z = 0.15 * Math.sin(t * 19); }      // breast down in the water, wings shivering
      else { o.rotation.x = 0; o.rotation.z = 0; o.rotation.y = turnTo(o.rotation.y, inward + look, dt * 6); }      // looking about in quick turns
      if (state !== 'bathe') o.rotation.z = 0;
      plant(o, fp, rimY);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y + o.rotation.z, state, hidden: false, perch: state === 'fly' ? 'air' : gone ? 'tree' : 'bath rim' }),
  });
}
