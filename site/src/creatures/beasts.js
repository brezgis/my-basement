// Four-footed animals, each a way of behaving that is told where to live (the cast is in ../creatures.js).
// The rabbits, the hare, the hedgehog and the tortoise came from Vesper Street and the squirrel from the tree seat
// at Anna's House; here they stand on the land as it lies (kit.groundAt), choose only places that are free
// (kit.free: off the walks, out of the water, clear of benches and trunks, inside the rim), and are never still
// for long: each lives in short bouts, a second or two of one thing and then another.
//
//   rabbits    hop a few hops, nibble, sit up and look round, wash their faces, leap for nothing, chase one
//              another; thump and stare when you come in sight, bolt for cover if you come close, and are back soon
//   hare       nibbles, sits up, lopes from one of its places to another; off to the furthest if you come near
//   squirrel   lives at a tree (on the seat round it, if it has one): runs out over the grass in bounds, digs, sits
//              up with something in its paws, carries it off or buries it, runs back, scampers up the trunk for no
//              reason, flicks its tail; up the trunk if you come near, peers round at you, down again head first
//   hedgehog   trundles along the foot of a hedge from dusk, snuffling; curls up if you come close
//   tortoise   goes up and down its strip of grass without stopping for long; head in if you come close
//   fox        trots a beat along the island's edge after dark, stops to sniff, sit and eat, turns to look at you;
//              slips away along the beat if you come near, and is back in a while (Quaternius's fox, with its own walk)
//
// Models: Poly Pizza, CC-BY 3.0 (see assets/CREDITS.md).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FT, TAU, Walk, splitHead, turnTo, wrapA, clamp, clamp01, rng, vcMat } from './kit.js';

// ---- Rabbits ---------------------------------------------------------------------------------------------------
// S: { at: [[x, z], ...] where each begins, field: { x, z, r } the grass they keep to, hide: [x, z] the cover they
//      bolt into (they are not seen there), when, tints, glow: a little light of their own after dark (kit.glow), name }
export function rabbits(kit, S) {
  const { cam, scene, mesh, free, clear, groundAt, dist, nearest, add, feet, plant } = kit, r = rng(S.seed ?? 31337);
  const F = S.field, inField = (x, z) => Math.hypot(x - F.x, z - F.z) < F.r && free(x, z, 0.5);
  const spot = (fx, fz) => { for (let k = 0; k < 30; k++) { const a = r() * TAU, d = Math.sqrt(r()) * F.r, x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d; if (inField(x, z) && clear(fx, fz, x, z, 0.4)) return [x, z]; } return null; };
  const all = [];
  S.at.forEach(([sx, sz], n) => {
    let x0 = sx, z0 = sz; if (!inField(x0, z0)) for (let k = 0; k < 60; k++) { const a = r() * TAU, d = Math.sqrt(r()) * F.r, x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d; if (inField(x, z)) { x0 = x; z0 = z; break; } }      // (if something has been laid where it was to begin, it begins somewhere free)
    const me = { o: null, w: null, state: 'nibble', gone: false, until: 0 }; all.push(me);
    let o, w, fp, gy = 0, act = 0, back = 0, face = r() * TAU, look = face, look2 = face, thumped = -99, spin = 0;
    const set = (s, t, dur) => { me.state = s; act = t; me.until = t + dur; };
    // a few hops, one after another, roughly the way it is facing
    const bout = (t, speed = 2.6, hops = 1 + Math.floor(r() * 3)) => {
      const p = o.position, pts = []; let x = p.x, z = p.z, a = face + (r() - 0.5) * 1.6;
      for (let k = 0; k < hops; k++) {
        let nx = x + Math.sin(a) * 2.6, nz = z + Math.cos(a) * 2.6;
        if (!inField(nx, nz)) { a = Math.atan2(F.x - x, F.z - z) + (r() - 0.5) * 0.9; nx = x + Math.sin(a) * 2.6; nz = z + Math.cos(a) * 2.6; if (!inField(nx, nz)) break; }
        pts.push([nx, 0, nz]); x = nx; z = nz; a += (r() - 0.5) * 0.9;
      }
      if (!pts.length) return false;
      w.go(pts, speed, 0.24, 0.87, 7); me.state = 'hop'; act = t; return true;
    };
    me.runFrom = (t, fx, fz) => {                                                   // chased: off a little way, and round to look
      const p = o.position, a0 = Math.atan2(p.x - fx, p.z - fz);
      for (let k = 0; k < 8; k++) { const a = a0 + (r() - 0.5) * 1.4 * (k ? 1 : 0), d = 7 + r() * 4, x = p.x + Math.sin(a) * d, z = p.z + Math.cos(a) * d; if (inField(x, z)) { w.go([[x, 0, z]], 8.5, 0.34, 2.2, 10); me.state = 'flee'; act = t; return; } }
      bout(t, 6, 3);
    };
    add({
      name: (S.name ?? 'rabbit') + (n + 1), x: x0, z: z0, load: S.load ?? 300, live: S.live ?? 260, when: S.when,
      init: async () => { me.o = o = await mesh('v_rabbit', 1.0, (S.tints ?? [0xffffff, 0xd0c0a8, 0xb8a892])[n % 3]); fp = feet(o.geometry); if (S.glow) kit.glow(o, S.glow);      /* pale in the dark (and only in the dark) */ gy = groundAt(x0, z0); o.position.set(x0, gy, z0); o.rotation.y = face; plant(o, fp, gy); scene.add(o); me.w = w = new Walk(o); w.land = groundAt; w.base = gy; },
      show: on => { o.visible = on && !me.gone; },
      think: t => {
        const p = o.position, d = dist(p.x, p.z);
        if (me.gone) {                                                                 // in the long grass, until it has been quiet a little while
          back += 0.25;
          if (back > 12 && dist(x0, z0) > 26 && dist(S.hide[0], S.hide[1]) > 26) { const s = spot(S.hide[0], S.hide[1]); if (s) { me.gone = false; o.visible = true; o.position.set(S.hide[0], groundAt(S.hide[0], S.hide[1]), S.hide[1]); w.go([[s[0], 0, s[1]]], 3.4, 0.25, 1.1, 6); me.state = 'hop'; } }
          return;
        }
        if (d < 8 && me.state !== 'bolt') { w.go([[S.hide[0] + (r() - 0.5) * 3, 0, S.hide[1] + (r() - 0.5) * 3]], 9.5, 0.4, 2.6, 10); me.state = 'bolt'; return; }
        if (me.state === 'bolt') { if (!w.busy) { me.gone = true; back = 0; o.visible = false; } return; }
        if (w.busy || t < me.until) return;
        face = o.rotation.y;
        if (d < 30 && t - thumped > 9) { thumped = t; set('thump', t, 0.9); const who = nearest(p.x, p.z); look = Math.atan2(who.x - p.x, who.z - p.z); return; }      // she is in sight: a thump, and a stare
        if (me.state === 'thump') { set('up', t, 1.2 + r()); look2 = look; return; }
        const k = r();
        if (me.state === 'hop' || me.state === 'flee' || me.state === 'chase') { if (k < 0.7) set('nibble', t, 0.9 + r() * 1.4); else { look = face + (r() - 0.5) * 1.6; look2 = face + (r() - 0.5) * 2.4; set('up', t, 1.2 + r() * 0.8); } return; }
        if (k < 0.42) { if (!bout(t)) set('nibble', t, 0.8); }
        else if (k < 0.56) { look = face + (r() - 0.5) * 1.8; look2 = face + (r() - 0.5) * 2.6; set('up', t, 1.3 + r() * 0.9); }
        else if (k < 0.68) set('groom', t, 1.5 + r() * 0.9);
        else if (k < 0.78) {                                                           // after another one
          const it = all.find(q => q !== me && q.o && !q.gone && !q.w.busy && q.state !== 'bolt' && Math.hypot(q.o.position.x - p.x, q.o.position.z - p.z) < 16 && Math.hypot(q.o.position.x - p.x, q.o.position.z - p.z) > 3);
          if (it && clear(p.x, p.z, it.o.position.x, it.o.position.z, 0.4)) { const q = it.o.position, dd = Math.hypot(q.x - p.x, q.z - p.z); w.go([[p.x + (q.x - p.x) * (1 - 1.6 / dd), 0, p.z + (q.z - p.z) * (1 - 1.6 / dd)]], 8, 0.32, 2.0, 10); me.state = 'chase'; act = t; it.runFrom(t + 0.25, p.x, p.z); }
          else if (!bout(t)) set('nibble', t, 0.8);
        }
        else if (k < 0.85) { spin = (r() < 0.5 ? -1 : 1) * (1.2 + r() * 1.6); set('binky', t, 0.55); }      // a leap and a twist, for nothing
        else set('nibble', t, 0.9 + r() * 1.3);
      },
      tick: (t, dt) => {
        if (w.step(dt)) { gy = w.base; o.rotation.x = -0.12 * Math.sin(Math.PI * w.ph); o.rotation.z = 0; plant(o, fp, gy, w.lift); return; }
        const s = me.state, u = t - act; let pitch = 0.1, lift = 0, roll = 0, want = o.rotation.y;
        if (s === 'hop' || s === 'flee' || s === 'chase') { face = o.rotation.y; look = look2 = face; }
        else if (s === 'nibble') pitch = 0.2 + 0.07 * Math.sin(t * 15 + n);                                 // nose down, jaw going
        else if (s === 'up') { pitch = -0.36 * Math.min(1, u * 5); want = u < (me.until - act) * 0.5 ? look : look2; }
        else if (s === 'thump') { pitch = -0.1; lift = 0.16 * Math.abs(Math.sin(Math.PI * Math.min(1, u / 0.7) * 3)); want = look; }
        else if (s === 'groom') { pitch = -0.3 + 0.14 * Math.sin(t * 13); roll = 0.13 * Math.sin(t * 6.5); }      // sitting up, forepaws over its face
        else if (s === 'binky') { const k = Math.min(1, u / 0.5); lift = 1.0 * Math.sin(Math.PI * k); o.rotation.y += spin * dt * 4; want = o.rotation.y; pitch = -0.2 * Math.sin(Math.PI * k); }
        const ny = turnTo(o.rotation.y, want, dt * 3.2), turning = Math.abs(ny - o.rotation.y) > 1e-4; o.rotation.y = ny;
        o.rotation.x += (pitch - o.rotation.x) * Math.min(1, dt * 9); o.rotation.z += (roll - o.rotation.z) * Math.min(1, dt * 9);
        plant(o, fp, gy, lift + (turning ? 0.03 * Math.abs(Math.sin(t * 14 + n)) : 0));
      },
      check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y + o.rotation.z, ground: gy, state: me.state, hidden: me.gone }),
    });
  });
}

// ---- A hare ----------------------------------------------------------------------------------------------------
// S: { spots: [[x, z], ...] its places (those that are not free are left out; it runs only where the way is clear), glow, when }
export function hare(kit, S) {
  const { cam, scene, mesh, free, clear, groundAt, dist, nearest, add, feet, plant } = kit, r = rng(S.seed ?? 577);
  const spots = S.spots.filter(([x, z]) => free(x, z, 0.8));
  if (spots.length < 2) return;
  let o, w, fp, gy = 0, at = 0, state = 'nibble', until = 0, act = 0, look = 0, fled = 0, stared = -99, lope = 0;
  const set = (s, t, dur) => { state = s; act = t; until = t + dur; };
  add({
    name: S.name ?? 'hare', x: spots[0][0], z: spots[0][1], load: S.load ?? 300, live: S.live ?? 260, when: S.when,
    init: async () => { o = await mesh('v_hare', 0.8, 0xc9b8a0); if (S.glow) kit.glow(o, S.glow); fp = feet(o.geometry); gy = groundAt(spots[0][0], spots[0][1]); o.position.set(spots[0][0], gy, spots[0][1]); o.rotation.y = look = 0.4; plant(o, fp, gy); scene.add(o); w = new Walk(o); w.land = groundAt; w.base = gy; },
    show: on => { o.visible = on; },
    think: t => {
      const p = o.position, d = dist(p.x, p.z);
      if (w.busy) return;
      if (d < 14 && t > fled) {                                                    // too close: off, to the place furthest from her that it can run straight to
        let best = -1, far = -1; spots.forEach(([x, z], i) => { const dd = dist(x, z); if (i !== at && dd > far && clear(p.x, p.z, x, z, 0.5)) { far = dd; best = i; } });
        fled = t + 2; if (best >= 0) { at = best; w.go([[spots[at][0], 0, spots[at][1]]], 9, 0.45, 2.6, 10); state = 'run'; return; }
      }
      if (state === 'run') { set('alert', t, 1.6); stared = t; return; }
      if (d < 36 && t - stared > 7) { stared = t; set('alert', t, 1.4); return; }                           // a look at her, and on with it
      if (t < until) return;
      const k = r();
      if (state === 'hop' || state === 'lope') { set(k < 0.6 ? 'nibble' : 'up', t, 1 + r() * 1.4); look = o.rotation.y + (r() - 0.5) * 1.6; return; }
      if (k < 0.16) set('nibble', t, 0.9 + r() * 1.2);
      else if (k < 0.27) { set('up', t, 1.1 + r() * 0.8); look = o.rotation.y + (r() - 0.5) * 2; }
      else if (k < 0.35) set('groom', t, 1.3 + r() * 0.8);
      else if (k < 0.78 || t < lope) { const a = r() * TAU, dd = 2.5 + r() * 4, x = p.x + Math.sin(a) * dd, z = p.z + Math.cos(a) * dd; if (clear(p.x, p.z, x, z, 0.5) && dist(x, z) > 15) { w.go([[x, 0, z]], 2.6, 0.26, 1.0, 6); state = 'hop'; } else set('nibble', t, 0.8); }
      else {                                                                       // over to another of its places, at a lope
        const others = spots.map((s, i) => i).filter(i => i !== at && clear(p.x, p.z, spots[i][0], spots[i][1], 0.5) && dist(spots[i][0], spots[i][1]) > 16);
        if (others.length) { at = others[Math.floor(r() * others.length)]; w.go([[spots[at][0] + (r() - 0.5) * 3, 0, spots[at][1] + (r() - 0.5) * 3]], 5.5, 0.36, 2.0, 8); state = 'lope'; lope = t + 9; } else set('nibble', t, 0.8);
      }
    },
    tick: (t, dt) => {
      if (w.step(dt)) { gy = w.base; o.rotation.x = -0.1 * Math.sin(Math.PI * w.ph); o.rotation.z = 0; plant(o, fp, gy, w.lift); return; }
      if (state === 'alert' || state === 'run') { const who = nearest(o.position.x, o.position.z); look = Math.atan2(who.x - o.position.x, who.z - o.position.z); }
      const ny = turnTo(o.rotation.y, state === 'hop' || state === 'lope' ? o.rotation.y : look, dt * 2.6), turning = Math.abs(ny - o.rotation.y) > 1e-4; o.rotation.y = ny;
      const up = state === 'up' || state === 'alert' || state === 'run';
      const pitch = state === 'groom' ? -0.26 + 0.13 * Math.sin(t * 12) : up ? -0.3 : 0.16 + 0.06 * Math.sin(t * 14);
      o.rotation.x += (pitch - o.rotation.x) * Math.min(1, dt * 8); o.rotation.z += ((state === 'groom' ? 0.12 * Math.sin(t * 6) : 0) - o.rotation.z) * Math.min(1, dt * 8);
      plant(o, fp, gy, turning ? 0.03 * Math.abs(Math.sin(t * 14)) : 0);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y + o.rotation.z, ground: gy, state }),
  });
}

// ---- A red squirrel at a tree -----------------------------------------------------------------------------------
// With a seat round the tree (eight-sided, its corners at whole eighths of a turn) the squirrel's home is the middle
// of one plank; without one it is the grass at the tree's foot. From home it goes out over the grass and back, runs
// along the plank, and scampers up the trunk; if you come near it goes up the trunk and stays there.
// S: { x, z the tree, trunk: its radius, seat: { top, plank, inner, edge } (the height of the boards; the corner radii
//      of the plank it keeps to, of the innermost one, and of the seat's outer edge) or none, range: how far out over
//      the grass it goes, wood: the name of the meshes the trunk is drawn in, start: the angle it begins at, glow, when }
export function squirrel(kit, S) {
  const { cam, scene, mesh, tag, free, clear, groundAt, cast, dist, nearest, add, feet, plant } = kit, r = rng(S.seed ?? 31337);
  const ox = S.x, oz = S.z, seat = S.seat ?? null, PL = seat?.plank ?? 0, IN = seat?.inner ?? 0, Y0 = groundAt(ox, oz), seatY = seat?.top ?? 0, seatIn = seatY;
  const FOOT = seat ? seat.edge + 1.7 : (S.trunk ?? 2.4) * 1.5 + 1.3, RANGE = S.range ?? 24;      // where it stands on the grass at the tree's foot
  let o = null, nut = null, w = null, fp = null, s = 0, aim = 0, state = 'sit', until = 0, act = 0, flickAt = -9, safe = 0, lift = 0, ph = 0, h = 0, bark = null, rad = PL, wood = null;
  let gy = Y0, trips = 0, carry = false, whim = false, fleeing = false, hopA = 0, hopK = 0, homeA = S.start ?? 0.6;
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4();
  // a point on an octagonal plank at corner radius rr, by distance s along it (perimeter 8 * edge), and the way along it there
  const vx = (rr, k) => ox + Math.cos(k * Math.PI / 4) * rr, vz = (rr, k) => oz + Math.sin(k * Math.PI / 4) * rr;
  const per = rr => 8 * 2 * rr * Math.sin(Math.PI / 8);
  const onPlank = (rr, ss) => { const L = per(rr) / 8, u = ((ss % per(rr)) + per(rr)) % per(rr), k = Math.floor(u / L), f = u / L - k; o.position.x = vx(rr, k) + (vx(rr, k + 1) - vx(rr, k)) * f; o.position.z = vz(rr, k) + (vz(rr, k + 1) - vz(rr, k)) * f; return Math.atan2(vx(rr, k + 1) - vx(rr, k), vz(rr, k + 1) - vz(rr, k)); };
  const angleOf = () => Math.atan2(o.position.z - oz, o.position.x - ox);
  const oct = a => { const u = ((a % (Math.PI / 4)) + Math.PI / 4) % (Math.PI / 4); return Math.cos(Math.PI / 8) / Math.cos(u - Math.PI / 8); };   // a plank's middle at angle a, as a share of its corner radius
  const sOf = a => { const k = ((a / (Math.PI / 4)) % 8 + 8) % 8; return k * per(PL) / 8; };
  const barkAt = y => { const k = Math.max(0, Math.min(bark.length - 1, (y - Y0 - 2) / 0.5)), i = Math.floor(k), f = k - i; return bark[i] + ((bark[Math.min(i + 1, bark.length - 1)] ?? bark[i]) - bark[i]) * f; };
  const onBark = (y, down) => {                                                  // belly to the bark, nose up (or down)
    const a = angleOf(), cx = Math.cos(a), cz = Math.sin(a), rr = barkAt(y);
    o.position.set(ox + cx * rr, y, oz + cz * rr);
    Y.set(cx, 0, cz); Z.set(0, down ? -1 : 1, 0); X.crossVectors(Y, Z); o.quaternion.setFromRotationMatrix(M.makeBasis(X, Y, Z));
  };
  // the bark's radius on the squirrel's side, every half foot from 2 ft to 11 ft up (rays in toward the tree's axis)
  const measure = () => { const a = angleOf(), far = Math.max(PL, FOOT) + 2; bark = []; for (let y = 2; y <= 11.01; y += 0.5) { const dd = wood.length ? cast(wood, ox + Math.cos(a) * far, Y0 + y, oz + Math.sin(a) * far, -Math.cos(a), 0, -Math.sin(a), far) : Infinity; bark.push(Number.isFinite(dd) ? far - dd : S.trunk ?? 2.4); } };
  const foot = a => [ox + Math.cos(a) * FOOT, oz + Math.sin(a) * FOOT];
  // nothing solid in the straight way from a to b (a squirrel will cross a bed or a path, but not go through a bench)
  const open = (ax, az, bx, bz) => { const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 1.5)); for (let i = 1; i <= n; i++) { const x = ax + (bx - ax) * i / n, z = az + (bz - az) * i / n; if (kit.blocked(x, z, 0.3) || kit.inLot(x, z, 1) || !kit.onIsland(x, z, 5)) return false; } return true; };
  const set = (st, t, dur = 0) => { state = st; act = t; until = t + dur; };
  const up = (t, forFun) => { whim = forFun; fleeing = !forFun; measure(); if (seat) { state = 'in'; rad = Math.hypot(o.position.x - ox, o.position.z - oz); } else { state = 'leap'; h = 0; lift = 0; } };
  // out over the grass: a free place within reach, with a clear run to it
  const out = t => {
    const p = o.position;
    for (let k = 0; k < 10; k++) { const a = r() * TAU, d = FOOT + 2 + r() * (RANGE - FOOT - 2), x = ox + Math.cos(a) * d, z = oz + Math.sin(a) * d; if (free(x, z, 0.5) && open(p.x, p.z, x, z)) { w.go([[x, 0, z]], 7, 0.3, 1.5, 12); state = 'go'; act = t; return true; } }
    return false;
  };
  const homeward = t => { const p = o.position, a = seat ? angleOf() : homeA, [x, z] = foot(a); w.go([[x, 0, z]], fleeing ? 12 : 7.5, 0.32, 1.7, 14); state = 'back'; act = t; };
  add({
    name: S.name ?? 'squirrel', x: ox, z: oz, load: S.load ?? 300, live: S.live ?? 260, when: S.when,
    init: async () => {
      o = await mesh('v_squirrel', 1.0, S.tint ?? 0xd08a5a); if (S.glow) kit.glow(o, S.glow, 0x5a3a24); fp = feet(o.geometry);
      const bb = o.geometry.boundingBox; nut = tag(new THREE.Mesh(new THREE.SphereGeometry(0.075, 7, 5), new THREE.MeshStandardMaterial({ color: 0x6a4a26, roughness: 0.7 }))); nut.position.set(0, bb.min.y + (bb.max.y - bb.min.y) * 0.5, bb.max.z - 0.04); nut.visible = false; o.add(nut);
      if (seat) { s = sOf(homeA); onPlank(PL, s); o.rotation.set(0, 0, 0); plant(o, fp, seatY); }
      else { const [x, z] = foot(homeA); gy = groundAt(x, z); o.position.set(x, gy, z); o.rotation.set(0, homeA, 0); plant(o, fp, gy); }
      scene.add(o); w = new Walk(o); w.land = groundAt; w.base = gy;
      // the meshes the trunk is in (the trees' wood is merged by region: the ones whose box holds this tree)
      wood = []; const box = new THREE.Box3(), at = new THREE.Vector3(ox, Y0 + 5, oz);
      scene.traverse(n => { if (!n.isMesh || n.name !== (S.wood ?? 'tree wood')) return; if (!n.geometry.boundingBox) n.geometry.computeBoundingBox(); n.updateWorldMatrix(true, false); if (box.copy(n.geometry.boundingBox).applyMatrix4(n.matrixWorld).containsPoint(at)) wood.push(n); });
    },
    show: on => { o.visible = on; },
    think: t => {
      const p = o.position, near = dist(p.x, p.z) < 12, atHome = state === 'sit' || state === 'freeze' || state === 'groom' || state === 'run';
      if (state === 'up') { safe = near || dist(ox, oz) < 15 ? 0 : safe + 0.25; if (safe > (whim ? 1 : 5)) state = 'down'; return; }
      if (near && atHome) { up(t, false); return; }
      if (near && (state === 'go' || state === 'dig' || state === 'eat')) { fleeing = true; nut.visible = carry = false; homeward(t); return; }
      if (state === 'go') { if (!w.busy) set('dig', t, 1.1 + r() * 0.9); return; }
      if (state === 'back') {
        if (w.busy) return;
        nut.visible = carry = false; gy = w.base;
        if (fleeing) { if (seat) { hopA = angleOf(); hopK = 0; state = 'hopup'; } else up(t, false); }
        else if (seat) { hopA = angleOf(); hopK = 0; state = 'hopup'; } else { homeA = angleOf(); set('sit', t, 0.8 + r()); }
        return;
      }
      if (t < until) return;
      const k = r();
      if (state === 'dig') {
        if (!carry && k < 0.55) { carry = nut.visible = true; set('eat', t, 1.4 + r() * 1.2); }      // found one: sits up with it
        else { if (carry && k < 0.8) carry = nut.visible = false;      /* buried */ if (--trips > 0 && out(t)) return; homeward(t); }
        return;
      }
      if (state === 'eat') { if (r() < 0.5) carry = nut.visible = false;      /* eaten; else it carries it off */ if (--trips > 0 && out(t)) return; homeward(t); return; }
      if (!atHome) return;
      if (r() < 0.5) flickAt = t + r() * 0.8;
      if (k < 0.34) { trips = 2 + Math.floor(r() * 3); fleeing = false; if (seat) { hopA = angleOf(); hopK = 0; state = 'hopdown'; } else if (!out(t)) set('sit', t, 1); }
      else if (k < 0.5 && seat) { state = 'run'; aim = s + (r() < 0.5 ? -1 : 1) * (2 + r() * 5); const L8 = per(PL) / 8, f = ((aim % L8) + L8) % L8; if (f < 0.5) aim += 0.5 - f; else if (f > L8 - 0.5) aim -= f - (L8 - 0.5); }
      else if (k < 0.64) up(t, true);                                              // up the trunk and down again, for nothing
      else if (k < 0.8) set('groom', t, 1.3 + r() * 1.2);
      else if (k < 0.9) set('freeze', t, 1 + r() * 1.2);
      else set('sit', t, 0.8 + r() * 1.4);
    },
    tick: (t, dt) => {
      if (state === 'go' || state === 'back') { if (w.step(dt)) { gy = w.base; o.rotation.x = -0.14 * Math.sin(Math.PI * 2 * w.ph); o.rotation.z = 0; plant(o, fp, gy, w.lift); } return; }
      if (state === 'dig' || state === 'eat') {                                   // forepaws going at the turf, or sitting up with something in them
        const dig = state === 'dig'; o.rotation.x += ((dig ? 0.5 + 0.12 * Math.sin(t * 26) : -0.5 + 0.05 * Math.sin(t * 17)) - o.rotation.x) * Math.min(1, dt * 10);
        if (!dig) { const who = nearest(o.position.x, o.position.z); o.rotation.y = turnTo(o.rotation.y, Math.atan2(who.x - o.position.x, who.z - o.position.z) + 0.9, dt * 2); }
        const f = t - flickAt; o.rotation.z = f > 0 && f < 0.3 ? 0.08 * Math.sin(Math.PI * 2 * f / 0.3) : 0;
        plant(o, fp, gy, dig ? 0.03 * Math.abs(Math.sin(t * 13)) : 0); return;
      }
      if (state === 'hopdown' || state === 'hopup') {                              // between the plank and the grass, in one jump
        hopK = Math.min(1, hopK + dt / 0.42); const dn = state === 'hopdown', u = dn ? hopK : 1 - hopK, a = hopA, r0 = PL * oct(a), rr = r0 + (FOOT - r0) * u, [gx, gz] = foot(a), g = groundAt(gx, gz);
        o.position.x = ox + Math.cos(a) * rr; o.position.z = oz + Math.sin(a) * rr;
        o.rotation.set((dn ? 0.5 : -0.5) * Math.sin(Math.PI * hopK), turnTo(o.rotation.y, Math.atan2((dn ? 1 : -1) * Math.cos(a), (dn ? 1 : -1) * Math.sin(a)), dt * 16), 0);
        plant(o, fp, seatY + (g - seatY) * u, 0.75 * Math.sin(Math.PI * hopK));
        if (hopK >= 1) { o.rotation.x = 0; if (dn) { gy = g; w.base = g; plant(o, fp, g); if (!out(t)) homeward(t); } else { s = sOf(a); plant(o, fp, seatY); if (fleeing) up(t, false); else set('sit', t, 0.6 + r()); } }
        return;
      }
      if (state === 'run') {                                                     // a low bounding run along the plank
        const sp = 5 * dt, left = aim - s; s += Math.sign(left) * Math.min(Math.abs(left), sp); ph += sp / 0.55;
        const dir = onPlank(PL, s) + (left < 0 ? Math.PI : 0);
        o.rotation.set(-0.12 * Math.sin(Math.PI * 2 * ph), turnTo(o.rotation.y, dir, dt * 14), 0);
        lift = 0.1 * Math.abs(Math.sin(Math.PI * ph)); plant(o, fp, seatY, lift);
        if (Math.abs(aim - s) < 1e-3) { lift = 0; ph = 0; set('freeze', t, 0.8 + r()); o.rotation.x = 0; plant(o, fp, seatY); }
        return;
      }
      if (state === 'in' || state === 'out') {                                   // bound across the planks, in to the trunk or back out
        const a = angleOf(), sp = 4.5 * dt, inward = state === 'in', rin = IN * oct(a), rpl = PL * oct(a); rad = inward ? Math.max(rin, rad - sp) : Math.min(rpl, rad + sp); ph += sp / 0.4;
        o.position.x = ox + Math.cos(a) * rad; o.position.z = oz + Math.sin(a) * rad;
        o.rotation.set(-0.12 * Math.sin(Math.PI * 2 * ph), turnTo(o.rotation.y, Math.atan2((inward ? -1 : 1) * Math.cos(a), (inward ? -1 : 1) * Math.sin(a)), dt * 14), 0);
        lift = 0.1 * Math.abs(Math.sin(Math.PI * ph)); plant(o, fp, seatY, lift);
        if (inward && rad <= rin) { state = 'leap'; h = 0; lift = 0; }
        if (!inward && rad >= rpl) { lift = 0; ph = 0; s = sOf(a); onPlank(PL, s); set('freeze', t, 0.8); o.rotation.x = 0; plant(o, fp, seatY); }
        return;
      }
      if (state === 'leap' || state === 'drop') {                                // the jump between the inner plank (or the grass) and the bark
        h = Math.min(1, h + dt / 0.3); const a = angleOf(), u = state === 'leap' ? h : 1 - h, y0 = seat ? seatIn : gy, y1 = (seat ? seatIn : Y0) + 1.3;
        const r0 = seat ? IN * oct(a) : FOOT, r1 = barkAt(y1), rr = r0 + (r1 - r0) * u, y = y0 + (y1 - y0) * u + 0.35 * Math.sin(Math.PI * h);
        o.position.set(ox + Math.cos(a) * rr, y, oz + Math.sin(a) * rr);
        Y.set(0, 1, 0).lerp(Z.set(Math.cos(a), 0, Math.sin(a)), u); Y.normalize(); Z.set(-Math.cos(a), 0, -Math.sin(a)).lerp(X.set(0, state === 'drop' ? -1 : 1, 0), u).normalize();
        X.crossVectors(Y, Z); Z.crossVectors(X, Y); o.quaternion.setFromRotationMatrix(M.makeBasis(X, Y, Z));           // turning from the level to the bark in the air
        if (h >= 1) {
          if (state === 'leap') { state = 'climb'; h = y1; }
          else if (seat) { state = 'out'; rad = IN * oct(a); o.rotation.set(0, Math.atan2(Math.cos(a), Math.sin(a)), 0); plant(o, fp, seatIn); }
          else { o.rotation.set(0, Math.atan2(Math.cos(a), Math.sin(a)), 0); homeA = a; plant(o, fp, gy); set('sit', t, 0.8); }
        }
        return;
      }
      if (state === 'climb' || state === 'down') {                               // up the trunk in bounds; down head first
        ph += dt * 3.4; const go = Math.max(0, Math.sin(Math.PI * 2 * ph)) * 3.8 * dt;
        h += state === 'climb' ? go : -go;
        onBark(h, state === 'down');
        if (state === 'climb' && h >= Y0 + (whim ? 6.5 : 8.5)) { state = 'up'; safe = 0; }
        if (state === 'down' && h <= (seat ? seatIn : Y0) + 1.3) { state = 'drop'; h = 0; }
        return;
      }
      if (state === 'up') { onBark(h, false); o.rotateY(0.35 * Math.sin(t * 1.1)); const f = t - flickAt; if (f > 1.5) flickAt = t + r(); return; }       // clinging, peering round at her
      // at home: sitting, washing, or frozen and watching her; a flick of the tail now and then
      const f = t - flickAt, flick = f > 0 && f < 0.3 ? Math.sin(Math.PI * f / 0.3) : 0, here = seat ? seatY : gy;
      const pitch = state === 'groom' ? -0.42 + 0.12 * Math.sin(t * 14) : -0.1 * flick;
      o.rotation.x += (pitch - o.rotation.x) * Math.min(1, dt * 10); o.rotation.z = state === 'groom' ? 0.1 * Math.sin(t * 7) : 0.1 * flick;
      const who = nearest(o.position.x, o.position.z);
      if (state === 'freeze' && dist(o.position.x, o.position.z) < 40) o.rotation.y = turnTo(o.rotation.y, Math.atan2(who.x - o.position.x, who.z - o.position.z), dt * 4);
      plant(o, fp, here, 0.05 * flick);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y + o.rotation.z, state, carry, ground: ['go', 'back', 'dig', 'eat'].includes(state) ? gy : undefined, perch: ['climb', 'down', 'up', 'leap', 'drop'].includes(state) ? 'trunk' : ['go', 'back', 'dig', 'eat'].includes(state) ? 'grass' : seat ? 'seat' : 'grass' }),
  });
}

// A strip of ground from a to b, w wide: the point u feet along it and c across it.
const strip = (S) => { const [ax, az] = S.a, [bx, bz] = S.b, L = Math.hypot(bx - ax, bz - az), tx = (bx - ax) / L, tz = (bz - az) / L; return { L, at: (u, c = 0) => [ax + tx * u - tz * c, az + tz * u + tx * c], yaw: Math.atan2(tx, tz) }; };

// ---- A hedgehog along the foot of a hedge, from dusk ---------------------------------------------------------------
// S: { a: [x, z], b: [x, z] the two ends of its beat, w: how wide, glow: a little light of its own after dark, when }
export function hedgehog(kit, S) {
  const { scene, mesh, clear, groundAt, dist, add, feet, plant } = kit, r = rng(S.seed ?? 808), R = strip(S), HW = (S.w ?? 1.2) / 2;
  let o, w, fp, gy = 0, state = 'root', until = 0, curl = 0, safe = 0, u = R.L * 0.5, dir = 1;
  add({
    name: S.name ?? 'hedgehog', x: R.at(R.L / 2)[0], z: R.at(R.L / 2)[1], load: S.load ?? 220, live: S.live ?? 180, when: S.when,
    init: async () => {
      o = await mesh('v_hedgehog', 1.15, 0xffffff); o.material.color.setRGB(1.7, 1.55, 1.35); if (S.glow) kit.glow(o, S.glow, 0x5a5048);       /* paler spines and face, to read at dusk */ fp = feet(o.geometry);
      const [x, z] = R.at(u); gy = groundAt(x, z); o.position.set(x, gy, z); o.rotation.y = R.yaw; plant(o, fp, gy); scene.add(o); w = new Walk(o); w.land = groundAt; w.base = gy;
    },
    show: on => { o.visible = on; },
    think: t => {
      const p = o.position, d = dist(p.x, p.z);
      if (d < 6) { if (state !== 'curl') { state = 'curl'; w.stop(); } safe = 0; return; }
      if (state === 'curl') { safe = d > 9 ? safe + 0.25 : 0; if (safe >= 3) { state = 'root'; until = t + 1.5; } return; }
      if (w.busy || t < until) return;
      if (state === 'root' || r() < 0.75) {                                        // on along the hedge, a few feet at a time
        let nu = u + dir * (3 + r() * 6); if (nu < 0.5 || nu > R.L - 0.5) { dir = -dir; nu = clamp(u + dir * 4, 0.5, R.L - 0.5); }
        const [x, z] = R.at(nu, (r() - 0.5) * 2 * HW);
        if (clear(p.x, p.z, x, z, 0.3)) { u = nu; w.go([[x, 0, z]], 1.1, 0, 1, 2.2); state = 'walk'; } else { dir = -dir; until = t + 1; }
      } else { state = 'root'; until = t + 1 + r() * 1.6; }
    },
    tick: (t, dt) => {
      curl += ((state === 'curl' ? 1 : 0) - curl) * Math.min(1, dt * 3);
      let pitch = 0, roll = 0;
      if (state === 'walk') { if (w.step(dt)) { gy = w.base; roll = 0.06 * Math.sin(t * 9); pitch = 0.03 * Math.sin(t * 18); } else state = 'root'; }
      else if (state === 'root') { pitch = 0.1 + 0.06 * Math.sin(t * 13); o.rotation.y += 0.5 * dt * Math.sin(t * 1.7); }        // nose down, snuffling, casting about
      o.rotation.x = pitch * (1 - curl) + curl * 0.2; o.rotation.z = roll; o.scale.set(1, 1 - 0.15 * curl, 1 - 0.1 * curl);
      plant(o, fp, gy);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.x + o.rotation.y + o.rotation.z, ground: gy, state }),
  });
}

// ---- A tortoise on its strip of grass, by day ---------------------------------------------------------------------
// S: { a: [x, z], b: [x, z] the two ends of its walk, w: how wide, when }
export function tortoise(kit, S) {
  const { scene, mesh, tag, clear, groundAt, dist3, add, feet, plant } = kit, r = rng(S.seed ?? 1492), R = strip(S), HW = (S.w ?? 2.4) / 2, SC = 1.5;
  let o, head, fp, w, gy = 0, state = 'pause', until = 0, k = 1, shy = 0, headZ = 0, dir = 1, u = R.L * 0.4;
  add({
    name: S.name ?? 'tortoise', x: R.at(R.L / 2)[0], z: R.at(R.L / 2)[1], load: S.load ?? 220, live: S.live ?? 180, when: S.when,
    init: async () => {
      const src = await mesh('v_tortoise', SC, 0xe0bc7c), g = src.geometry, bb = g.boundingBox, L = bb.max.z - bb.min.z;
      headZ = bb.max.z - L * 0.24;
      const [bodyG, headG] = splitHead(g, (x, y, z) => z > headZ && Math.abs(x) < 0.12 * SC, [0, 0, headZ]);
      o = new THREE.Group(); const body = tag(new THREE.Mesh(bodyG, src.material)); head = tag(new THREE.Mesh(headG, src.material)); head.position.z = headZ; o.add(body, head);
      const [x, z] = R.at(u); gy = groundAt(x, z);
      fp = feet(bodyG); o.position.set(x, gy, z); o.rotation.y = R.yaw; plant(o, fp, gy); o.name = 'tortoise'; scene.add(o); w = new Walk(o); w.land = groundAt; w.base = gy;
    },
    show: on => { o.visible = on; },
    think: t => {
      const p = o.position;
      if (dist3(p.x, p.y, p.z) < 6.5) shy = t + 4;
      if (t < shy || w.busy || t < until) return;
      if (r() < 0.82) {                                                            // on along the strip, a few feet at a time
        let nu = u + dir * (2.5 + r() * 5); if (nu < 0.5 || nu > R.L - 0.5) { dir = -dir; nu = clamp(u + dir * 3, 0.5, R.L - 0.5); }
        const [x, z] = R.at(nu, (r() - 0.5) * 2 * HW);
        if (clear(p.x, p.z, x, z, 0.5)) { u = nu; w.go([[x, 0, z]], 0.42, 0, 1, 0.9); state = 'walk'; } else { dir = -dir; until = t + 1.5; }
      } else { state = 'pause'; until = t + 1.2 + r() * 1.8; }
    },
    tick: (t, dt) => {
      const hide = t < shy; k = hide ? Math.max(0, k - dt * 2) : Math.min(1, k + dt * 0.4);
      head.position.z = headZ - (1 - k) * 0.22 * SC; head.rotation.x = state === 'pause' ? -0.25 + 0.12 * Math.sin(t * 1.6) : 0.06 * Math.sin(t * 2.4); head.rotation.y = state === 'pause' ? 0.5 * Math.sin(t * 0.9) : 0.12 * Math.sin(t * 1.2);
      if (!hide && k > 0.95 && w.step(dt)) { gy = w.base; o.rotation.z = 0.05 * Math.sin(t * 3.2); o.rotation.x = 0.025 * Math.sin(t * 6.4); } else { o.rotation.z *= 0.9; if (!w.busy && state === 'walk') state = 'pause'; }
      plant(o, fp, gy);
    },
    check: () => ({ x: o.position.x, y: o.position.y, z: o.position.z, p: o.rotation.z + head.rotation.x + head.rotation.y + head.position.z, ground: gy, state }),
  });
}

// ---- A fox on its beat, from dusk ---------------------------------------------------------------------------------
// S: { route: [[x, z], ...] points a few feet apart along where it goes (the stretches of them that are free are its
//      beats; it uses the three longest), glow: a little light of its own, to be seen by at night, when }
export function fox(kit, S) {
  const { cam, scene, glb, tag, free, groundAt, dist, add } = kit, r = rng(S.seed ?? 1066);
  const pts = S.route.map(([x, z]) => ({ x, z, free: free(x, z, 1.2) })), runs = []; { let cur = null; for (const p of pts) { if (p.free) (cur ??= []).push(p); else if (cur) { runs.push(cur); cur = null; } } if (cur) runs.push(cur); }
  const long = runs.filter(q => q.length > 10).sort((a, b) => b.length - a.length).slice(0, 3);
  if (!long.length) return;
  const run0 = long[0], mid = run0[Math.floor(run0.length / 2)];
  let o, mixer, acts = {}, cur = null, prev = null, run = run0, idx = Math.floor(run0.length / 2), dir = 1, state = 'sit', until = 0, gone = false, back = 0, goal = idx, speed = 0, groundY = 0;
  const Y = p => (p.y ??= groundAt(p.x, p.z)), low = {};
  const lowOf = a => { const tab = low[a.getClip().name], f = (a.time / a.getClip().duration % 1) * 16, i = Math.floor(f); return tab ? tab[i] + (tab[Math.min(16, i + 1)] - tab[i]) * (f - i) : 0; };
  const paws = () => (!cur ? 0 : prev && prev.getEffectiveWeight() > 0.02 ? Math.min(lowOf(cur), lowOf(prev)) : lowOf(cur));      // while two clips blend, the lower
  const play = (n, ts = 1) => { const a = acts[n]; if (!a) return; a.timeScale = ts; if (cur === a) return; a.reset().fadeIn(0.35).play(); cur?.fadeOut(0.35); prev = cur; cur = a; };
  const idle = () => play(['Idle', 'Idle2', 'IdleHeadLow', 'Eat'][Math.floor(r() * 4)]);
  add({
    name: S.name ?? 'fox', x: mid.x, z: mid.z, load: S.load ?? 340, live: S.live ?? 300, when: S.when,
    init: async () => {
      const g = await glb('q_fox'); o = g.scene;
      // its five flat colours into one skinned mesh (vertex colours): one draw
      const parts = []; let skel = null, bindM = null, host = null;
      o.updateMatrixWorld(true);
      o.traverse(n => { if (n.isSkinnedMesh) { skel = n.skeleton; bindM = n.bindMatrix; host ??= n.parent; const geo = n.geometry.clone(); const c = n.material.color; const k = geo.attributes.position.count, col = new Float32Array(k * 3); for (let i = 0; i < k; i++) c.toArray(col, i * 3); geo.setAttribute('color', new THREE.BufferAttribute(col, 3)); for (const a of Object.keys(geo.attributes)) if (!['position', 'skinIndex', 'skinWeight', 'color'].includes(a)) geo.deleteAttribute(a); parts.push([n, geo]); } });
      if (parts.length > 1) {
        const mat = vcMat({ roughness: 0.9 }); if (S.glow) { mat.emissive = new THREE.Color(0x5a3418); mat.emissiveIntensity = S.glow; }
        const sm = new THREE.SkinnedMesh(mergeGeometries(parts.map(p => p[1])), mat);
        sm.bind(skel, bindM); tag(sm); sm.frustumCulled = false; host.add(sm);
        for (const [n] of parts) n.parent.remove(n);
      }
      o.scale.setScalar(FT); mixer = new THREE.AnimationMixer(o);
      for (const c of g.animations) acts[c.name] = mixer.clipAction(c);
      // how low its feet reach through each clip (17 poses a clip), so the paws, not the body, meet the ground
      { let sm = null; o.traverse(n => { if (n.isSkinnedMesh) sm = n; }); const pos = sm.geometry.attributes.position, v = new THREE.Vector3();
        o.updateMatrixWorld(true);
        for (const [name, act] of Object.entries(acts)) {
          const tab = new Float32Array(17); act.reset().play();
          for (let k = 0; k <= 16; k++) { act.time = act.getClip().duration * k / 16; mixer.update(0); o.updateMatrixWorld(true); sm.skeleton.update(); let lo = Infinity; for (let i = 0; i < pos.count; i += 2) { sm.getVertexPosition(i, v); v.applyMatrix4(sm.matrixWorld); if (v.y < lo) lo = v.y; } tab[k] = lo; }
          act.stop(); low[name] = tab;
        } }
      const p = run[idx]; groundY = Y(p); o.position.set(p.x, groundY, p.z); o.name = 'fox'; scene.add(o); play('Idle');
    },
    show: on => { o.visible = on && !gone; },
    think: t => {
      const p = o.position, d = dist(p.x, p.z);
      if (gone) { back += 0.25; if (back > 20) { const r2 = long[Math.floor(r() * long.length)], j = Math.floor(r() * r2.length), q2 = r2[j]; if (dist(q2.x, q2.z) > 55) { run = r2; idx = goal = j; gone = false; o.visible = true; groundY = Y(q2); o.position.set(q2.x, groundY, q2.z); state = 'sit'; play('Idle'); until = t + 1.5; } } return; }
      if (d < 20 && state !== 'flee') {                                         // off, away from her along its beat
        const ahead = run[clamp(idx + 8, 0, run.length - 1)], behind = run[clamp(idx - 8, 0, run.length - 1)];
        dir = dist(ahead.x, ahead.z) > dist(behind.x, behind.z) ? 1 : -1; goal = dir > 0 ? run.length - 1 : 0; state = 'flee'; speed = 12; play('Run', 1.1); return;
      }
      if (state === 'flee') return;
      if (state === 'trot' && idx === goal) { state = 'pause'; until = t + 1.5 + r() * 2.5; idle(); }
      if (state === 'pause' && d < 45 && Math.abs(wrapA(Math.atan2(cam.x - p.x, cam.z - p.z) - o.rotation.y)) > 0.7 && r() < 0.3) { state = 'turn'; play('Walk', 0.7); return; }      // it has seen her
      if (t < until || state === 'trot' || state === 'turn') return;
      if (r() < 0.75) { goal = clamp(idx + Math.round((r() - 0.5) * 2 * Math.min(40, run.length)), 0, run.length - 1); if (goal !== idx) { state = 'trot'; speed = 3.4; play('Walk', 1.3); } }
      else { state = 'pause'; until = t + 1.5 + r() * 2.5; idle(); }
    },
    tick: (t, dt) => {
      mixer.update(dt);
      if (state === 'trot' || state === 'flee') {
        const tgt = run[idx + Math.sign(goal - idx)] ?? run[idx], p = o.position, dx = tgt.x - p.x, dz = tgt.z - p.z, dd = Math.hypot(dx, dz), mv = speed * dt;
        if (dd <= mv || idx === goal) { p.set(tgt.x, Y(tgt), tgt.z); groundY = Y(tgt); idx = run.indexOf(tgt); if (idx === goal && state === 'flee') { gone = true; back = 0; o.visible = false; state = 'sit'; } }
        else { p.x += dx / dd * mv; p.z += dz / dd * mv; groundY = groundAt(p.x, p.z); o.rotation.y = turnTo(o.rotation.y, Math.atan2(dx, dz), dt * 6); }
      }
      if (state === 'turn') {                                            // turning round to look at her, stepping as it turns
        const want = Math.atan2(cam.x - o.position.x, cam.z - o.position.z); o.rotation.y = turnTo(o.rotation.y, want, dt * 1.8);
        if (Math.abs(wrapA(want - o.rotation.y)) < 0.05) { state = 'pause'; until = t + 1.5 + r() * 2; play('Idle'); }
      }
      o.position.y = groundY - paws();                                           // the lowest paw on the ground, whatever the stride
    },
    check: () => ({ x: o.position.x, y: groundY, z: o.position.z, p: o.rotation.y + (cur?.time ?? 0), ground: groundY, state, hidden: gone, beats: long.map(q => q.length).join(',') }),
  });
}
