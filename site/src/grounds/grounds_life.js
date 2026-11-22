// The animals of the terrace (grounds.js loads this once its planting is built). Most are the lab's and the house's own
// (creatures/: the crew in kit.js loads each only when the visitor is outdoors and near, at the right hour); the snails
// and the frog are made here after the house's (its garden/creatures.js snail; its frog's model).
//
//   by day        sparrows on the flags and the parapet, a robin on the pots' rims and the boulder, a blackbird turning
//                 over the moss in the pine's bowl and the flags (it flies up into the pine); butterflies over the pots'
//                 white flowers, some crossing to the parapet and out over the drop; a dragonfly over the brink at
//                 midday; three swallows hawking across the clouds outside the mouth of the grotto in the afternoon;
//                 two snails, one creeping round a pot's rim and one on the damp flags by the tub (a faint trail behind)
//   at dusk       a hedgehog crossing the south of the terrace; bats out over the drop, beyond the parapet
//   at night      fireflies among the pots, moths at the hanging lanterns, the frog by the tub (it sits under the fern
//                 pots from dusk; come close and it hops off to another)
// Nothing flies overhead at night inside the terrace (Anna found that creepy at the lab).

import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { creatureKit } from '../creatures/kit.js';
import { fireflies, butterflies, swallows, bats, moths, dragonflies } from '../creatures/swarms.js';
import { sparrows, robin, blackbird } from '../creatures/birds.js';
import { hedgehog } from '../creatures/beasts.js';
import { COURT } from '../campus.js';

const PAVE = 0.34;

export function animals(ctx, E, meadowOn = false) {
  const day = ctx.day, hour = () => day.hour ?? 12;
  const kit = creatureKit(ctx, { groundAt: (x, z) => E.level(x, z) + 0.05 });
  const sunny = () => day.light > 0.7 && hour() >= 8.5 && hour() < 18, afternoon = () => day.light > 0.7 && hour() >= 13.5, light = () => day.light > 0.45;
  const dusk = () => hour() >= 12 && day.light < 0.6 && day.light > 0.08, night = () => day.light < 0.35;
  const [cx, cz] = [COURT.Y, COURT.X], inCourt = ([x, , z]) => Math.hypot(x - cx, z - cz) < COURT.r;
  const court = E.fireflies.filter(inCourt);
  if (court.length) fireflies(kit, { name: 'court fireflies', spots: () => court, x: cx, z: cz, from: 0.4, when: () => day.night > 0.3 && ctx.mode !== 'orbit' });

  // butterflies: the pots' flowers, and a list that runs from the south-west pots along the parapet's top and out into
  // the air beyond it (they drift out through the mouth and come back)
  const flowers = E.flowers.court.slice().sort((a, b) => Math.atan2(a[0] - cx, a[2] - cz) - Math.atan2(b[0] - cx, b[2] - cz));
  const clumps = (list, n) => { const out = []; for (let k = 0; k < n; k++) { const c = list[Math.floor((k + 0.5) / n * list.length)]; if (c) out.push(list.filter(p => Math.hypot(p[0] - c[0], p[2] - c[2]) < 14).slice(0, 40)); } return out.filter(l => l.length > 2); };
  const out = []; for (let i = 0; i < 9; i++) { const a = (215 + i * 13) * Math.PI / 180, rr = COURT.r + (i % 3) * 6; out.push([cx + Math.sin(a) * rr, PAVE + 3 + (i % 4) * 1.5, cz + Math.cos(a) * rr]); }
  if (flowers.length > 3) butterflies(kit, { name: 'court butterflies', seed: 777, x: cx, z: cz, n: 7, load: 170, live: 150, flowers: () => [...clumps(flowers, 3), [...flowers.filter(f => f[0] < cx - 6).slice(0, 8), ...out]], when: sunny });

  // birds
  const pine = E.pineTree ? [E.pineTree] : [];
  sparrows(kit, { name: 'court sparrows', x: cx + 2, z: cz - 2, r: 13, n: 4, trees: pine, perches: E.perches.slice(-2), load: 170, live: 140, when: light });
  if (E.perches.length) robin(kit, { name: 'court robin', perches: E.perches, face: Math.PI, forage: { x: cx + 3, z: cz - 6, r: 7 }, load: 170, live: 140, when: light });
  if (E.pineTree) blackbird(kit, { name: 'court blackbird', field: { x: cx - 2, z: cz + 4, r: 10 }, hide: [E.pineTree.x - 4, E.pineTree.y + 13, E.pineTree.z - 3], load: 170, live: 140, when: () => day.light > 0.3 });
  // outside the mouth: swallows across the clouds by day, bats at dusk (the ground there is the meadow's height: the air
  // below the cliff is given as a negative height above it)
  swallows(kit, { name: 'mouth swallows', x: cx - 40, z: cz, rx: 30, rz: 45, y: -14, amp: 6, n: 3, load: 260, live: 240, when: afternoon });
  bats(kit, { name: 'mouth bats', beats: [[cx - 32, cz - 18, 9, -18, 0], [cx - 38, cz + 12, 11, -16, 2], [cx - 30, cz + 2, 8, -21, 4]], load: 220, live: 200, when: dusk });
  // a dragonfly over the brink at midday, between the loungers and the parapet
  dragonflies(kit, { name: 'brink dragonfly', x: cx - 16, z: cz - 3, y: PAVE + 0.2, at: (a, s) => [cx - 15 - Math.sin(a) * 4 * s, cz - 3 + Math.cos(a) * 8 * s], n: 1, when: () => day.light > 0.75 && hour() >= 10.5 && hour() < 16.5 });
  // moths at the hanging lanterns after dark
  const lamps = E.sway.halo.filter(h => h[5] > 1.5).map(h => [h[0], h[1], h[2]]);
  if (lamps.length) moths(kit, { name: 'lantern moths', lamps: lamps.slice(0, 6), per: 2, when: () => day.light < 0.4 });
  // a hedgehog crossing the south of the terrace from dusk, from the west pots to the east
  hedgehog(kit, { name: 'terrace hedgehog', a: [cx - 9, cz - 17], b: [cx - 7, cz + 17], w: 2, glow: 0.35, when: dusk });

  snails(kit, E);
  frog(kit, E, night);

  if (meadowOn) {
    const meadow = E.fireflies.filter(p => !inCourt(p));
    if (meadow.length) fireflies(kit, { name: 'meadow fireflies', seed: 4242, spots: () => meadow, x: 60, z: -20, load: 400, live: 400, from: 0.4, when: () => day.night > 0.3 && ctx.mode !== 'orbit' });
  }
}

// ---- Snails (after the house's: shell, foot and eye stalks apart, so it can pull in; head toward +x, foot on y = 0) ------
function partsGeo(parts) {
  return mergeGeometries(parts.map(([geo, color]) => { const g = (geo.index ? geo.toNonIndexed() : geo).clone(); for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k); const n = g.attributes.position.count, c = new Float32Array(n * 3), col = new THREE.Color(color); for (let i = 0; i < n; i++) col.toArray(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(c, 3)); return g; }));
}
const S_ = (r, w = 10, h = 8) => new THREE.SphereGeometry(r, w, h);
const at = (g, x, y, z, sx = 1, sy = 1, sz = 1) => { g.scale(sx, sy, sz); g.translate(x, y, z); return g; };
function snailBody(mat) {
  const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 5, rr = 0.12 * (1 - t * 0.85); pts.push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr + 0.14, t * 0.06 - 0.03)); }
  const shellG = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.05, 6).toNonIndexed(), sp = shellG.attributes.position, sc = new Float32Array(sp.count * 3);
  for (let i = 0; i < sp.count; i++) new THREE.Color(Math.sin(i * 0.05) > 0.6 ? 0x5a3a1e : 0xb0884a).toArray(sc, i * 3);
  shellG.deleteAttribute('uv'); shellG.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  const g = new THREE.Group(), shell = new THREE.Mesh(shellG, mat), body = new THREE.Mesh(partsGeo([[at(S_(0.06), 0.03, 0.03, 0, 3.4, 0.55, 1.0), 0x9a8a6a], [at(S_(0.04, 8, 6), 0.21, 0.045, 0, 1.2, 0.9, 0.9), 0x9a8a6a]]), mat);
  const stalks = new THREE.Mesh(partsGeo([-1, 1].flatMap(s => [[at(new THREE.CylinderGeometry(0.008, 0.011, 0.11, 5), 0, 0.055, 0).rotateX(s * 0.35).rotateZ(-0.45), 0x8a7a5a], [at(S_(0.016, 6, 4), 0, 0.11, 0).rotateX(s * 0.35).rotateZ(-0.45), 0x2a2420]]).map(([geo, c], i) => [geo.translate(0, 0, (i < 2 ? -1 : 1) * 0.022), c])), mat);
  stalks.position.set(0.23, 0.06, 0);
  for (const m of [shell, body, stalks]) { m.castShadow = false; m.receiveShadow = true; m.userData.creature = true; g.add(m); }
  g.userData = { body, stalks }; return g;
}
function snails(kit, E) {
  const { scene, add, dist3 } = kit, mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 });
  const rim = (E.rims ?? []).find(p => p.kind === 'pot' || p.kind === 'urn');
  // one round a pot's rim, slowly
  if (rim) {
    let g = null, th = 0.5, k = 1, shy = 0;
    const place = () => { const cx = Math.cos(th), cz = Math.sin(th); g.position.set(rim.x + cx * rim.r, rim.y + 0.005, rim.z + cz * rim.r); g.rotation.set(0, -th - Math.PI, 0); };
    add({ name: 'rim snail', x: rim.x, z: rim.z, load: 50, live: 40,
      init: async () => { g = snailBody(mat); g.scale.setScalar(0.8); place(); scene.add(g); },
      show: on => { g.visible = on; }, think: t => { if (dist3(g.position.x, g.position.y, g.position.z) < 3) shy = t + 4; },
      tick: (t, dt) => { k = t < shy ? Math.max(0, k - dt * 2.5) : Math.min(1, k + dt * 0.35); const { body, stalks } = g.userData; stalks.scale.setScalar(0.12 + 0.88 * k); body.scale.x = 0.45 + 0.55 * k; stalks.rotation.set(0.18 * Math.sin(t * 0.9), 0.15 * Math.sin(t * 0.6 + 1), 0); if (k > 0.97) { th += 0.025 * dt / rim.r; place(); } } });
  }
  // one on the damp flags by the tub, wandering, a faint silver trail behind it
  if (E.tub) {
    const ox = E.tub.x + 0.5, oz = E.tub.z + 3.6; let g = null, x = ox, z = oz, head = 0.3, k = 1, shy = 0, line = null; const N = 60, pts = new Float32Array(N * 3); let n = 0, lastX = x, lastZ = z;
    add({ name: 'flag snail', x: ox, z: oz, load: 50, live: 40,
      init: async () => {
        g = snailBody(mat); g.scale.setScalar(0.75); g.position.set(x, PAVE + 0.005, z); scene.add(g);
        for (let i = 0; i < N; i++) pts.set([x, PAVE + 0.012, z], i * 3);
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(pts, 3)); line = new THREE.Line(lg, new THREE.LineBasicMaterial({ color: 0xcfd6d8, transparent: true, opacity: 0.35 })); line.userData.creature = true; scene.add(line);
      },
      show: on => { g.visible = on; line.visible = on; }, think: t => { if (dist3(g.position.x, g.position.y, g.position.z) < 3) shy = t + 4; },
      tick: (t, dt) => {
        k = t < shy ? Math.max(0, k - dt * 2.5) : Math.min(1, k + dt * 0.35); const { body, stalks } = g.userData; stalks.scale.setScalar(0.12 + 0.88 * k); body.scale.x = 0.45 + 0.55 * k;
        if (k < 0.97) return;
        head += dt * (0.12 * Math.sin(t * 0.07) + 0.05 * Math.sin(t * 0.31)); if (Math.hypot(x - ox, z - oz) > 2.2) head += dt * 0.5;      // (it keeps near the tub)
        x += Math.cos(head) * 0.03 * dt; z += Math.sin(head) * 0.03 * dt; g.position.set(x, PAVE + 0.005, z); g.rotation.y = -head;
        if (Math.hypot(x - lastX, z - lastZ) > 0.02) { lastX = x; lastZ = z; if (n < N) n++; pts.copyWithin(3, 0, (N - 1) * 3); pts.set([x - Math.cos(head) * 0.08, PAVE + 0.012, z - Math.sin(head) * 0.08], 0); line.geometry.attributes.position.needsUpdate = true; line.geometry.setDrawRange(0, n); }
      } });
  }
}

// ---- The frog: sits in the shade of the fern pots and by the tub from dusk; come close and it hops to another -------------
function frog(kit, E, when) {
  const { scene, mesh, add, camDist } = kit, rims = (E.rims ?? []).filter(p => p.kind === 'jar');
  const spots = [...rims.slice(0, 4).map(p => [p.x + p.r + 0.9, p.z + 0.3]), ...(E.tub ? [[E.tub.x + 3.4, E.tub.z - 1.2]] : [])];
  if (spots.length < 2) return;
  let o = null, i = spots.length - 1, hop = null, t0 = 0, now = 0, breathe = 0;
  add({ name: 'terrace frog', x: spots[i][0], z: spots[i][1], load: 60, live: 50, when,
    init: async () => { o = await mesh('v_frog', 1.0); o.position.set(spots[i][0], PAVE, spots[i][1]); scene.add(o); },
    show: on => { o.visible = on; },
    think: t => { now = t; if (!hop && camDist(o.position.x, o.position.z) < 4.5) { const j = (i + 1 + Math.floor(Math.random() * (spots.length - 1))) % spots.length; hop = { a: [o.position.x, o.position.z], b: spots[j], j, n: Math.max(2, Math.round(Math.hypot(spots[j][0] - o.position.x, spots[j][1] - o.position.z) / 1.6)) }; t0 = t; o.rotation.y = Math.atan2(spots[j][0] - o.position.x, spots[j][1] - o.position.z); } },
    tick: (t, dt) => {
      breathe += dt; o.scale.set(1, 1 + 0.03 * Math.sin(breathe * 5), 1);
      if (!hop) return;
      const u = (t - t0) / (hop.n * 0.38); if (u >= 1) { o.position.set(hop.b[0], PAVE, hop.b[1]); i = hop.j; hop = null; return; }
      const k = u * hop.n, f = k - Math.floor(k);
      o.position.set(hop.a[0] + (hop.b[0] - hop.a[0]) * u, PAVE + Math.sin(f * Math.PI) * 0.45, hop.a[1] + (hop.b[1] - hop.a[1]) * u);
    } });
}
