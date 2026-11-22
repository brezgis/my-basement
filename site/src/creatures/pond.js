// What lives in a pond (the cast is in ../creatures.js): both from the koi pond at Anna's House.
//
//   koi     a few fish under the surface: they cruise, rest, dart, rise to kiss the surface; stand at the edge a
//           few seconds and the bold ones come over; E at the bank scatters food. How they swim is koi_school.js
//           and how they are drawn koi.js, both exactly as at the house; pond_shape.js and pond_water.js tell them
//           what this pond is like.
//   ducks   two mallards: paddle from place to place, dabble, up-end, preen; keep their distance from anyone at the
//           bank; asleep in the rushes after dark
//   frog    sits on a lily pad facing you, blinks, its throat going; hops from pad to pad now and then, and plops
//           into the water if you come close (or say hello), climbing out again later
//
// Models: the fish is a rudd by XaosXV, CC0; the frog is by AssetQuest, CC0 (see assets/CREDITS.md).

import * as THREE from 'three';
import { FT, TAU, rng, turnTo } from './kit.js';
import { POND, sAt, at as pondAt } from './pond_shape.js';
import { makeSchool } from './koi_school.js';
import { makeKoi } from './koi.js';
import { U } from './pond_water.js';

// ---- Koi -------------------------------------------------------------------------------------------------------
// S: { cast: [{ kind, len, bold, pace, seed, name }] (koi_school.CAST's terms), feed: [{ p: [x, y, z] where to look,
//      reach, to: [x, z] where it lands }], fed: [lines], watch: [lines], when }
export function koi(kit, S) {
  const { ctx, day, cam, scene, tag, add } = kit, cast = S.cast, NP = 12;
  let school = null, fish = null, pellets = null, clock = 0, fedShown = false, on = false, said = 0;
  const showPellets = () => {
    const m = pellets.instanceMatrix.array, Pl = school.pellets; let any = false;
    for (let k = 0; k < NP; k++) {
      const o = k * 16, fall = Pl.t[k] - clock, live = Pl.alive[k] && fall < 0.45, sc = live ? 1 : 0;
      m[o] = m[o + 5] = m[o + 10] = sc; m[o + 12] = Pl.x[k]; m[o + 13] = POND.y + 0.03 + (fall > 0 ? fall * fall * 16 : 0.006 * Math.sin(clock * 2 + k)); m[o + 14] = Pl.z[k]; if (live) any = true;
    }
    pellets.instanceMatrix.needsUpdate = true; pellets.visible = any && on; fedShown = any;
  };
  const light = () => { const L = day?.light ?? 1; U.uMurk.value.setRGB(0.2, 0.31, 0.33).multiplyScalar(0.16 + 0.84 * L); };
  const spots = (S.feed ?? []).map(f => ({ x: f.p[0], y: -500, z: f.p[2], at: f.p[1], reach: f.reach ?? 9, size: 2.2, label: () => (school?.feeding ? 'watch the koi' : 'feed the koi'),
    act: () => { if (!on) return; if (school.feeding) ctx.flash?.(S.watch[said++ % S.watch.length]); else { school.feed(f.to[0], f.to[1], clock); ctx.flash?.(S.fed[said++ % S.fed.length]); } } }));
  ctx.interact.push(...spots);
  add({
    name: 'koi', x: POND.x, z: POND.z, load: S.load ?? 170, live: S.live ?? 140, when: S.when,
    init: async () => {
      school = makeSchool(cast, { seed: 7, pellets: NP });
      for (let k = 0; k < 600; k++) { school.step(1 / 30, clock, NaN, NaN); clock += 1 / 30; }      // twenty seconds on their own first: they are found spread about the pond
      fish = await makeKoi(cast); tag(fish.mesh); fish.mesh.material.transparent = true; scene.add(fish.mesh); fish.update(school);      // (drawn over the water, after it: pond_water.js)
      pellets = tag(new THREE.InstancedMesh((() => { const g = new THREE.IcosahedronGeometry(0.05, 0); g.scale(1, 0.55, 1); return g; })(), new THREE.MeshStandardMaterial({ color: 0x7a5226, roughness: 0.9 }), NP));
      pellets.name = 'koi food'; pellets.frustumCulled = false; pellets.visible = false; pellets.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(pellets);
      { const m = pellets.instanceMatrix.array; m.fill(0); for (let k = 0; k < NP; k++) m[k * 16 + 15] = 1; }
      light();
      if (typeof window !== 'undefined') window.__pond = { school, feed: (x, z) => school.feed(x ?? S.feed[0].to[0], z ?? S.feed[0].to[1], clock), get clock() { return clock; } };
    },
    show: v => { on = v; fish.mesh.visible = v; pellets.visible = v && fedShown; for (const f of spots) f.y = v ? f.at : -500; },
    think: light,
    tick: (t, dt) => {
      dt = Math.min(dt, 0.05); clock += dt;
      school.step(dt, clock, cam.x, cam.z);
      fish.update(school);
      if (school.feeding || fedShown) showPellets();
    },
    check: () => ({ x: school.x[0], y: POND.y - school.d[0], z: school.z[0], feeding: school.feeding, dwell: school.dwell, all: cast.map((c, i) => ({ x: school.x[i], z: school.z[i], d: school.d[i], s: sAt(school.x[i], school.z[i]), mode: school.mode[i] })) }),
  });
}

// ---- The frog ----------------------------------------------------------------------------------------------------
// S: { pads(): [[x, z, radius], ...] the lily pads, the first its own (asked for once, when it is first wanted),
//      y: the height of a pad's top, when }
export function frog(kit, S) {
  const { ctx, cam, scene, glb, add } = kit, qf = rng(S.seed ?? 91), padY = S.y;
  let g = null, lids = null, sac = null, pads = [], pad = null, mode = 'sit', t0 = 0, turning = false, blinkAt = 2, croak = -9, nextHop = 6, ax = 0, az = 0, bx = 0, bz = 0, by = padY, greet = false, now = 0, on = false;
  const ent = { x: POND.x, y: -500, z: POND.z, reach: 12, label: () => (mode === 'swim' || mode === 'plop' ? 'the frog has gone for a swim' : 'say hello to the frog'), act: () => { if (mode === 'sit') greet = true; } };
  ctx.interact.push(ent);
  const hopTo = (x, z, y, m) => { ax = g.position.x; az = g.position.z; bx = x; bz = z; by = y; t0 = now; mode = m; g.rotation.y = Math.atan2(x - ax, z - az); };
  add({
    name: S.name ?? 'frog', x: POND.x, z: POND.z, load: S.load ?? 130, live: S.live ?? 100, when: S.when,
    init: async () => {
      pads = S.pads(); if (!pads.length) throw new Error('no lily pad for the frog');
      pad = pads[0];
      const src = await glb('v_frog'); g = src.scene.clone(true); g.scale.setScalar(FT * 1.3); g.name = 'frog';
      // eyelids and the throat, in the model's own metres (its eyes are the bumps at x +-0.011, y 0.044, z 0.027)
      const skin = new THREE.MeshStandardMaterial({ color: 0x6a8838, roughness: 0.55 }), throat = new THREE.MeshStandardMaterial({ color: 0xb8bc84, roughness: 0.5 });
      const lidG = new THREE.SphereGeometry(0.0092, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2);
      lids = [-1, 1].map(s => { const m = new THREE.Mesh(lidG, skin); m.position.set(s * 0.011, 0.0438, 0.027); m.scale.setScalar(0.001); g.add(m); return m; });
      sac = new THREE.Mesh(new THREE.SphereGeometry(0.011, 10, 8), throat); sac.position.set(0, 0.01, 0.03); g.add(sac);
      g.traverse(m => { if (m.isMesh) kit.tag(m); });
      g.position.set(pad[0], padY, pad[1]); g.rotation.y = Math.atan2(POND.x - pad[0], POND.z - pad[1]) + Math.PI; scene.add(g);
    },
    show: v => { on = v; g.visible = v && mode !== 'swim'; ent.y = v ? g.position.y + 0.3 : -500; },
    think: t => {
      const dc = Math.hypot(cam.x - g.position.x, cam.z - g.position.z);
      if (mode === 'sit' && (dc < 5 || greet)) {                                         // plop: into open water, away from her
        greet = false;
        let wx = POND.x, wz = POND.z;
        for (let k = 0; k < 16; k++) { const a = Math.atan2(g.position.z - cam.z, g.position.x - cam.x) + (qf() - 0.5) * 1.6, x = g.position.x + Math.cos(a) * 2.6, z = g.position.z + Math.sin(a) * 2.6; if (sAt(x, z) < 0.85 && !pads.some(([px, pz, pr]) => Math.hypot(px - x, pz - z) < pr + 0.2)) { wx = x; wz = z; break; } }
        hopTo(wx, wz, POND.y - 0.4, 'plop');
      } else if (mode === 'swim' && t - t0 > 8 && dc > 8) {                              // climbing out, on the pad furthest from her
        let best = pads[0], bd = -1; for (const p of pads) { const d = Math.hypot(p[0] - cam.x, p[1] - cam.z); if (d > bd) { bd = d; best = p; } }
        pad = best; const a = qf() * TAU; g.position.set(pad[0] + Math.cos(a) * pad[2] * 0.9, POND.y - 0.3, pad[1] + Math.sin(a) * pad[2] * 0.9); g.visible = on; hopTo(pad[0], pad[1], padY, 'climb');
      } else if (mode === 'sit' && t > nextHop && dc > 7) {                              // off to another pad nearby
        const near = pads.filter(p => p !== pad && Math.hypot(p[0] - pad[0], p[1] - pad[1]) < 6 && Math.hypot(p[0] - cam.x, p[1] - cam.z) > 6);
        if (near.length) { pad = near[Math.floor(qf() * near.length)]; hopTo(pad[0] + (qf() - 0.5) * pad[2] * 0.5, pad[1] + (qf() - 0.5) * pad[2] * 0.5, padY, 'hop'); }
        nextHop = t + 3 + qf() * 5;
      } else if (mode === 'sit' && t > croak + 2.6 && qf() < 0.18) { croak = t; if (dc < 60) ctx.sound?.chirp?.([40, 38, 40, 38], 0.012); }      // it calls: often, and loudest in the evening
    },
    tick: (t, dt) => {
      now = t; ent.x = g.position.x; ent.z = g.position.z; ent.y = g.position.y + 0.3;
      const u = t - t0;
      if (mode === 'hop' || mode === 'plop' || mode === 'climb') {
        const T = mode === 'climb' ? 0.7 : 0.5, k = Math.min(1, u / T);
        g.position.set(ax + (bx - ax) * k, (mode === 'climb' ? POND.y - 0.3 + (padY - POND.y + 0.3) * k : padY + (by - padY) * k) + Math.sin(Math.PI * k) * (mode === 'climb' ? 0.15 : 0.7), az + (bz - az) * k);
        if (k >= 1) { if (mode === 'plop') { mode = 'swim'; g.visible = false; } else mode = 'sit'; t0 = t; }
        return;
      }
      if (mode !== 'sit') return;
      // facing her when she is about, otherwise the open water; turning in small shuffles
      const dc = Math.hypot(cam.x - g.position.x, cam.z - g.position.z);
      const want = dc < 25 ? Math.atan2(cam.x - g.position.x, cam.z - g.position.z) : Math.atan2(POND.x - g.position.x, POND.z - g.position.z);
      const d = Math.atan2(Math.sin(want - g.rotation.y), Math.cos(want - g.rotation.y));
      if (Math.abs(d) > 0.3) turning = true; else if (Math.abs(d) < 0.05) turning = false;
      if (turning) g.rotation.y += Math.sign(d) * Math.min(Math.abs(d), dt * 3);
      if (t > blinkAt + 0.14) blinkAt = t + 2.5 + qf() * 4.5;
      const shut = t > blinkAt ? 1 : 0; for (const l of lids) l.scale.setScalar(shut ? 1.05 : 0.001);
      const c = t - croak, puff = c >= 0 && c < 1.6 ? Math.max(0, Math.sin(c * 12)) * 0.9 : 0;
      sac.scale.setScalar(0.42 + 0.07 * Math.sin(t * 11) + puff * 0.7);                        // the throat going, and now and then a croak
      g.scale.y = FT * 1.3 * (1 + 0.03 * Math.max(0, Math.sin(t * 4)) * (Math.sin(t * 0.6) > 0.4 ? 1 : 0));
    },
    check: () => ({ x: g.position.x, y: g.position.y, z: g.position.z, p: g.rotation.y + sac.scale.x * 3, mode, pads: pads.length, pad: pad.map(v => Math.round(v * 10) / 10).join(',') }),
  });
}

// ---- Two mallards -------------------------------------------------------------------------------------------------
// Each floats with the water a third of the way up its body and pivots about that waterline as it bobs, dabbles and
// up-ends, so its legs stay under water.
// S: { pads(): [[x, z, radius], ...] lily pads to keep clear of, roost: [a, s] where on the water they sleep (angle
//      round the pond, share of the way out), asleep(): true when they should be there, when }
export function ducks(kit, S) {
  const { scene, glb, tag, dist, nearest, add } = kit, qd = rng(S.seed ?? 77);
  const D = [{ x: POND.x - POND.rx * 0.4, z: POND.z - 1, yaw: 0.5 }, { x: POND.x - POND.rx * 0.25, z: POND.z + 2, yaw: 2.2 }];
  let pads = [], t = 0;
  const water = (x, z) => sAt(x, z) < 0.74 && !pads.some(([px, pz, pr]) => Math.hypot(px - x, pz - z) < pr + 0.7);
  const spot = (avoidX, avoidZ) => { let best = null, bd = -1; for (let k = 0; k < 24; k++) { const [x, z] = pondAt(qd() * TAU, 0.15 + qd() * 0.55); if (!water(x, z)) continue; const d = avoidX == null ? qd() : Math.hypot(x - avoidX, z - avoidZ); if (d > bd) { bd = d; best = [x, z]; } } return best ?? [POND.x, POND.z]; };
  const WL = [0.134 * FT * 1.0, 0.134 * FT * 0.95], wv = new THREE.Vector3();
  const place = (d, i) => {
    d.o.rotation.set(d.pitch + 0.03 * Math.sin(t * 1.3 + i), d.yaw, d.roll + 0.04 * Math.sin(t * 0.9 + i * 3), 'YXZ');     // the model faces +z
    wv.set(0, WL[i], 0).applyEuler(d.o.rotation);
    d.o.position.set(d.x - wv.x, POND.y + 0.012 * Math.sin(t * 1.7 + i * 2) - wv.y, d.z - wv.z);
  };
  add({
    name: S.name ?? 'ducks', x: POND.x, z: POND.z, load: S.load ?? 300, live: S.live ?? 260, when: S.when,
    init: async () => {
      pads = S.pads?.() ?? [];
      const src = (await glb('v_duck_mallard')).scene;
      D.forEach((d, i) => { const o = src.clone(true); o.scale.setScalar(FT * (i ? 0.95 : 1)); o.traverse(n => { if (n.isMesh) { tag(n); if (i) { n.material = n.material.clone(); n.material.color.multiply(new THREE.Color(0xb8a58a)); } } }); o.name = 'duck';
        Object.assign(d, { o, tx: d.x, tz: d.z, v: 0, mode: 'drift', until: 0, pitch: 0, roll: 0 }); scene.add(o); place(d, i); });
    },
    show: on => { for (const d of D) d.o.visible = on; },
    think: now => {
      const sleep = S.asleep?.() ?? false;
      D.forEach((d, i) => {
        const dc = dist(d.x, d.z);
        if (dc < 9 && d.mode !== 'away') { const who = nearest(d.x, d.z); [d.tx, d.tz] = spot(who.x, who.z); d.v = 1.3; d.mode = 'away'; d.until = now; d.give = now + 7; return; }
        if (sleep && d.mode !== 'roost' && d.mode !== 'home') { [d.tx, d.tz] = pondAt(S.roost[0] + i * 0.2, S.roost[1]); d.v = 0.5; d.mode = 'home'; return; }
        if (!sleep && (d.mode === 'roost' || d.mode === 'home')) { d.mode = 'drift'; d.until = now; }
        const there = Math.hypot(d.tx - d.x, d.tz - d.z) < 0.3;
        if (d.mode === 'home') { if (there) { d.mode = 'roost'; d.v = 0; } return; }
        if (d.mode === 'roost' || now < d.until || ((d.mode === 'paddle' || d.mode === 'away') && !there && now < d.give)) return;      // (it gives up on a place it cannot get to)
        const k = qd();
        if (k < 0.5) { d.mode = 'paddle'; [d.tx, d.tz] = spot(); d.v = 0.6 + qd() * 0.5; d.until = now; d.give = now + 9; }
        else if (k < 0.58) { d.mode = 'drift'; d.v = 0; d.until = now + 1 + qd() * 1.5; }
        else if (k < 0.76) { d.mode = 'dabble'; d.v = 0; d.until = now + 1.2 + qd() * 1.2; }
        else if (k < 0.89) { d.mode = 'upend'; d.v = 0; d.until = now + 1.8 + qd() * 1.2; }
        else { d.mode = 'preen'; d.v = 0; d.until = now + 1.8 + qd() * 1.4; }
      });
    },
    tick: (now, dt) => {
      t = now;
      D.forEach((d, i) => {
        const go = (d.mode === 'paddle' || d.mode === 'away' || d.mode === 'home') && Math.hypot(d.tx - d.x, d.tz - d.z) > 0.25;
        if (go) {
          const want = Math.atan2(d.tx - d.x, d.tz - d.z); d.yaw = turnTo(d.yaw, want, dt * 1.6);
          const sp = d.v * Math.max(0.15, Math.cos(want - d.yaw)), nx = d.x + Math.sin(d.yaw) * sp * dt, nz = d.z + Math.cos(d.yaw) * sp * dt;
          if (sAt(nx, nz) < 0.8) { d.x = nx; d.z = nz; }
        } else if (d.mode === 'drift' || d.mode === 'roost') d.yaw += dt * 0.12 * Math.sin(now * 0.5 + i * 2);
        const o = D[1 - i], sep = Math.hypot(d.x - o.x, d.z - o.z);                      // never inside each other
        if (sep < 1.3 && sep > 1e-3) { d.x += (d.x - o.x) / sep * (1.3 - sep) * 0.5; d.z += (d.z - o.z) / sep * (1.3 - sep) * 0.5; }
        const pt = d.mode === 'dabble' ? 0.45 + 0.08 * Math.sin(now * 9) : d.mode === 'upend' ? 1.35 : d.mode === 'roost' ? 0.12 : 0;
        d.pitch += (pt - d.pitch) * Math.min(1, dt * 4);
        d.roll = d.mode === 'preen' ? 0.22 * Math.sin(now * 2.3) : d.roll * (1 - Math.min(1, dt * 3));
        if (d.mode === 'preen') d.yaw += dt * 0.6 * Math.sin(now * 1.7);
        place(d, i);
      });
    },
    check: () => ({ x: D[0].x, y: POND.y, z: D[0].z, all: D.map(d => ({ x: d.x, y: POND.y + d.pitch + d.roll + d.yaw * 0.3, z: d.z, mode: d.mode, s: sAt(d.x, d.z) })) }),
  });
}
