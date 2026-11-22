// The Courtyard (grounds.js): a paved terrace under the rock vault, its garden all in pots. Anna: "plants and life, but not
// like growing out of the ground. Pots, maybe hanging pots." The flags are spanya.js's; on them:
//
//   the pine      the old black pine, pruned into clouds, the one tree: in a great low stone bowl, off-centre toward the
//                 mouth of the vault, leaning out to the clouds
//   pots          four groups of clay and stone pots of different sizes against the wall between the doors and on the
//                 south-west shoulder (tall jars of fern, a jar of feathery grass, a bowl of moss with a stone in it, white
//                 foxgloves and anemones); two hanging baskets of trailing green on iron brackets beside the west and east
//                 doors; one ivy going up the rock from a pot beside the north doors
//   stones        two scanned mossy boulders set on the flags in the Japanese manner, the tall one lit from its foot at night
//   the brink     the timber hot tub with its stove and steam, the two mid-century loungers, a low table, the paper lantern,
//                 by the parapet; a candle lantern on the flags by each group of loungers and pots
// The walking lines between the three doors and from the north doors to the parapet are left wide open: a terrace to cross.
//
// Plan coordinates as spanya.js (X right, Y back into the rock, h up); the world is x = Y, z = X. Where the courtyard is
// comes from campus.js (COURT).

import * as THREE from 'three';
import { PAINT } from './tools.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng } from './cards.js';
import { limb } from './grounds_flora.js';
import { COURT } from '../campus.js';

const TAU = Math.PI * 2, CX = COURT.X, CY = COURT.Y, RIN = COURT.r - 0.75, PAVE = 0.34;      // RIN: the wall's inner face
export const FALL = { from: 233, to: 307, r: COURT.r + 0.9, top: PAVE + 0.76 };      // (the falling water's bearings: switched off, grounds.js FALLS_ON)
export const KERB = { X: CX, Y: CY - 34.5, r: 22.5 };      // (the old edge pool's kerb: no longer built)
const pw = (X, Y) => [Y, X];
const polar = (a, r) => [CX + r * Math.cos(a * Math.PI / 180), CY + r * Math.sin(a * Math.PI / 180)];
const S75 = (X, Y) => [CX + (X - 75) * 0.75, CY + (Y - 36) * 0.75];      // (the pine was drawn for the old, larger courtyard)
const CLAY = ['c#a8654a/0.9', 'c#b57a5a/0.9', 'c#9a5d45/0.9'], STONEP = ['c#8f8a80/0.95', 'c#7d786f/0.95'], GLAZE = 'c#2e3330/0.35';

export function layCourt(E) {
  const { K, F, Wd, B } = E, r = rng(3107);
  const put = (mat, g) => K.put(mat, g);
  const plant = (kind, x, y, z, s = 1, o) => { if (kind in E.WILD) Wd.add(kind, x, y, z, s, o); else F.add(kind, x, z, s, { y, ...o }); if (E.FLOWERS.has(kind)) E.flowers.court.push([x, y + 1.6 * s, z]); };
  const lookTo = (dX, dY) => Math.atan2(-dY, -dX), yawTo = (dX, dY) => Math.atan2(dY, dX);
  // A pot, turned: kinds 'jar' (tall, wide-shouldered), 'pot' (flowerpot), 'bowl' (low and wide), 'urn' (stone, a foot);
  // size: its height in ft. Returns the height of its soil.
  const pot = (x, z, kind, size, mat) => {
    const P = { jar: [[0.01, 0], [0.3, 0], [0.42, 0.2], [0.5, 0.55], [0.44, 0.85], [0.3, 0.95], [0.32, 1.0], [0.27, 1.0], [0.25, 0.94]],
      pot: [[0.01, 0], [0.32, 0], [0.36, 0.08], [0.46, 0.85], [0.5, 0.9], [0.5, 1.0], [0.44, 1.0], [0.42, 0.9]],
      bowl: [[0.01, 0], [0.4, 0], [0.62, 0.3], [0.78, 0.8], [0.8, 1.0], [0.74, 1.0], [0.7, 0.85]],
      urn: [[0.01, 0], [0.3, 0], [0.3, 0.12], [0.18, 0.2], [0.2, 0.32], [0.5, 0.5], [0.6, 0.85], [0.62, 1.0], [0.55, 1.0], [0.52, 0.9]] }[kind];
    K.lathe(mat, x, PAVE, z, P.map(([a, b]) => [a * size, b * size]), 20);
    const top = PAVE + size * (kind === 'jar' ? 0.93 : 0.9), rr = size * (kind === 'jar' ? 0.27 : kind === 'bowl' ? 0.72 : kind === 'urn' ? 0.54 : 0.44);
    K.cyl('soil', x, top - 0.04, top, z, rr, rr, 14);
    const rad = size * (kind === 'bowl' ? 0.8 : kind === 'urn' ? 0.62 : 0.5);
    K.collide(x - rad, x + rad, z - rad, z + rad, PAVE + size, PAVE - 0.5);
    E.perches.push([x + rr, top + 0.05, z]); (E.rims ??= []).push({ x, z, y: PAVE + size, r: size * { jar: 0.3, pot: 0.47, bowl: 0.77, urn: 0.585 }[kind], kind });
    return top;
  };

  E.pot = pot; E.plant = plant;

  // ---- the pine, in a great low stone bowl: the terrace's centrepiece, a ring of stone bench round it -----------------------
  const PINE = { X: CX + 1, Y: CY - 3 }, SH = [PINE.X - S75(92, 27)[0], PINE.Y - S75(92, 27)[1]];
  {
    const [bX, bY] = [PINE.X, PINE.Y], [x, z] = pw(bX, bY), LIFT = 1.55;
    K.lathe('c#8c867b/0.95', x, PAVE, z, [[0.01, 0], [2.3, 0], [2.4, 0.15], [2.85, 1.1], [3.0, 1.7], [2.98, 1.8], [2.75, 1.8], [2.6, 1.5]], 32);
    K.cyl('soil', x, PAVE + 1.45, PAVE + 1.5, z, 2.62, 2.62, 28);
    for (let i = 0; i < 14; i++) { const a = r() * TAU, d = 0.9 + r() * 1.5; Wd.add('moss', x + Math.cos(a) * d, PAVE + 1.52 + i * 0.002, z + Math.sin(a) * d, 0.9 + r() * 0.5, { tint: 0.6 + r() * 0.5 }); }
    K.collide(x - 3, x + 3, z - 3, z + 3, PAVE + 1.8, PAVE - 0.5);
    const P3 = (X, Y, h) => { const [a, b] = S75(X, Y); return [b + SH[1], PAVE + LIFT + h * 0.8, a + SH[0]]; };
    const trunk = [P3(92.3, 27.2, -0.6), P3(91.6, 26.8, 4), P3(90.2, 25.8, 8), P3(88.9, 24.3, 11.5), P3(87.0, 22.6, 14.5), P3(84.6, 20.6, 17.0), P3(82.2, 18.9, 19.2), P3(79.8, 17.8, 21.0)];
    const BARK = 'c#5a4636/0.9', tg = limb(trunk, 0.9, 0.24, 10, { flare: 0.4, gnarl: 0.08 }).geo; E.uplit.push({ geo: tg.index ? tg.toNonIndexed() : tg.clone(), fx: x - 1.4, fy: PAVE + 1.6, fz: z - 0.6, h: 9, k: 1.25 }); put(BARK, tg);      // (in the outdoors' paint, lit as the garden is: the builder's bark was lit as under a roof, and read black)
    put(BARK, limb([P3(87.0, 22.6, 14.5), P3(87.8, 23.4, 18), P3(87.0, 23.8, 21.5), P3(86.0, 23.2, 24.8)], 0.44, 0.14, 7).geo);
    const PADS = [[78.5, 17.2, 21.8, 4.3], [85.6, 21.5, 25.6, 3.6], [84.0, 25.6, 13.4, 3.2], [90.6, 19.5, 15.8, 3.3], [89.0, 28.2, 18.0, 2.9], [85.5, 15.6, 18.6, 3.2], [80.8, 23.4, 20.4, 3.0], [82.0, 13.8, 22.6, 2.6]];
    const along = [...trunk.slice(2), P3(87.8, 23.4, 18), P3(87.0, 23.8, 21.5)];
    for (const [X, Y, h, rad0] of PADS) {
      const rad = rad0 * 0.78, c = new THREE.Vector3(...P3(X, Y, h)), cost = p => Math.hypot(p[0] - c.x, p[2] - c.z) + Math.abs(p[1] - c.y) * 0.6;
      const s = new THREE.Vector3(...along.reduce((a, p) => (cost(p) < cost(a) ? p : a)));
      if (s.distanceTo(c) > 1.2) { const mid = s.clone().lerp(c, 0.5); mid.y += 0.7; put(BARK, limb([s.toArray(), mid.toArray(), [c.x, c.y - 0.5, c.z]], 0.26, 0.08, 6).geo); }
      for (let i = 0, n = Math.round(8 + rad * 3.2); i < n; i++) { const a = r() * TAU, d = Math.sqrt(r()); Wd.add('pine', c.x + Math.cos(a) * rad * d, c.y + (r() - 0.35) * rad * 0.42 * (1 - d * 0.5), c.z + Math.sin(a) * rad * d, (0.85 + r() * 0.45) * (rad / 3.4 + 0.3), { tint: 1.25 + r() * 0.35, tilt: (r() - 0.5) * 0.5, roll: (r() - 0.5) * 0.5 }); }
    }
    E.pineTree = { x, z, y: PAVE + LIFT, height: 18 };
    // the bench round it: a ring of dressed stone, open toward the four quarters
    const R0 = 4.3, R1 = 5.4, BH = 1.45, STONEB = 'c#b8ab96/0.95';
    // four curved segments of dressed stone, clean radial ends, the top's edges rounded; open on the diagonals
    const PROF = [[R0, 0], [R0, BH - 0.14], [R0 + 0.04, BH - 0.05], [R0 + 0.14, BH], [R1 - 0.14, BH], [R1 - 0.04, BH - 0.05], [R1, BH - 0.14], [R1, 0]];
    const CUSHM = 'linen#e6dcc6';
    for (const mid of [0, 90, 180, 270]) {
      const p0 = (mid - 33) * Math.PI / 180, p1 = (mid + 33) * Math.PI / 180;
      // an annular sector in plan, extruded up with rounded edges (plan bearing q: world offset (r sin q, r cos q))
      const ring = (ra, rb, q0, q1, n = 24) => { const sh = new THREE.Shape(); for (let i = 0; i <= n; i++) { const q = q0 + (q1 - q0) * i / n; i ? sh.lineTo(ra * Math.sin(q), -ra * Math.cos(q)) : sh.moveTo(ra * Math.sin(q), -ra * Math.cos(q)); } for (let i = n; i >= 0; i--) { const q = q0 + (q1 - q0) * i / n; sh.lineTo(rb * Math.sin(q), -rb * Math.cos(q)); } return sh; };
      const g = new THREE.ExtrudeGeometry(ring(R0 + 0.07, R1 - 0.07, p0, p1), { depth: BH - 0.14, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 3, curveSegments: 24 });
      g.rotateX(-Math.PI / 2); g.translate(x, PAVE + 0.07, z); put(STONEB, g);
      const ph0 = Math.PI / 2 - p1, len = p1 - p0;
      for (let a = mid - 30; a <= mid + 30; a += 10) { const [cx2, cz2] = pw(bX + (R0 + R1) / 2 * Math.cos(a * Math.PI / 180), bY + (R0 + R1) / 2 * Math.sin(a * Math.PI / 180)); K.collide(cx2 - 0.55, cx2 + 0.55, cz2 - 0.55, cz2 + 0.55, PAVE + BH, PAVE - 0.5); }
      if (mid === 90 || mid === 270) {      // a long seat cushion on two of them, in a light outdoor linen
        const cg = new THREE.ExtrudeGeometry(ring(R0 + 0.2, R1 - 0.2, p0 + 0.05, p1 - 0.05, 20), { depth: 0.12, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.08, bevelSegments: 3, curveSegments: 20 });
        cg.rotateX(-Math.PI / 2); cg.translate(x, PAVE + BH + 0.07, z); B.mesh(CUSHM, cg); void ph0; void len;
      }
    }
    for (const a of [90, 0, 180, 270]) { const [sx, sz] = pw(bX + 4.8 * Math.cos(a * Math.PI / 180), bY + 4.8 * Math.sin(a * Math.PI / 180)); K.seat(sx, PAVE + BH + 0.15, sz, lookTo(Math.cos(a * Math.PI / 180), Math.sin(a * Math.PI / 180)), 'sit on the bench round the pine'); }
    E.pools.push([x, z, 9, 0.5]);
  }

  // ---- a seating group out on the flags: a round rug of woven rush, a low walnut table, three deep outdoor chairs ------------
  {
    const GX = CX + 7.5, GY = CY + 13, [gx, gz] = pw(GX, GY), CUSHM2 = 'linen#ece4d2', TEAK = 'c#9a7656/0.8', CUSH = 'c#d8ccb2/0.95', SAGE = 'c#7d8a6c/0.95';
    K.cyl('c#b8a888/1', gx, PAVE, PAVE + 0.03, gz, 4.3, 4.3, 40); put('c#7f6d55/1', new THREE.TorusGeometry(4.15, 0.06, 3, 48).rotateX(Math.PI / 2).translate(gx, PAVE + 0.04, gz));
    K.cyl(TEAK, gx, PAVE + 1.1, PAVE + 1.2, gz, 1.25, 1.25, 28); K.cyl(TEAK, gx, PAVE + 0.2, PAVE + 0.3, gz, 1.0, 1.0, 24);
    for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.4; K.box(TEAK, gx + Math.cos(a) * 0.9 - 0.08, gx + Math.cos(a) * 0.9 + 0.08, PAVE, PAVE + 1.1, gz + Math.sin(a) * 0.9 - 0.08, gz + Math.sin(a) * 0.9 + 0.08); }
    K.collide(gx - 1.25, gx + 1.25, gz - 1.25, gz + 1.25, PAVE + 1.2, PAVE - 0.5);
    E.jar(gx + 0.3, PAVE + 1.2, gz - 0.2); E.jar(gx - 0.35, PAVE + 1.2, gz + 0.25);
    K.lathe('glass', gx + 0.1, PAVE + 1.2, gz + 0.5, [[0.01, 0], [0.2, 0], [0.24, 0.3], [0.12, 0.62], [0.08, 0.8], [0.09, 0.86]], 14);
    for (const [b, cush] of [[200, CUSH], [320, SAGE], [80, CUSH]]) {
      const a = b * Math.PI / 180, cX = GX + Math.cos(a) * 2.85, cY = GY + Math.sin(a) * 2.85, yaw = yawTo(-Math.cos(a), -Math.sin(a)), m = new THREE.Matrix4().makeRotationY(yaw).setPosition(...pw(cX, cY).flatMap((v, i) => (i ? [PAVE, v] : [v])));
      const box = (mat, x0, x1, y0, y1, z0, z1, rx = 0) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); if (rx) g.rotateX(rx); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); put(mat, g.applyMatrix4(m)); };
      const soft = (x0, x1, y0, y1, z0, z1, rx = 0) => { const g = new RoundedBoxGeometry(x1 - x0, y1 - y0, z1 - z0, 3, Math.min(0.14, (y1 - y0) / 2.2)); if (rx) g.rotateX(rx); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); B.mesh(CUSHM2, g.applyMatrix4(m)); };
      for (const sx of [-1, 1]) {      // an open timber side: two legs, an arm, a rail
        box(TEAK, sx * 1.22 - 0.08, sx * 1.22 + 0.08, 0, 1.95, 0.85, 1.0); box(TEAK, sx * 1.22 - 0.08, sx * 1.22 + 0.08, 0, 1.95, -1.05, -0.9);
        box(TEAK, sx * 1.22 - 0.13, sx * 1.22 + 0.13, 1.95, 2.05, -1.1, 1.1); box(TEAK, sx * 1.22 - 0.06, sx * 1.22 + 0.06, 0.4, 0.55, -0.95, 0.9);
      }
      box(TEAK, -1.14, 1.14, 0.4, 0.55, 0.88, 0.98); box(TEAK, -1.14, 1.14, 0.4, 0.55, -1.0, -0.9);      // the seat rails
      for (let k = 0; k < 5; k++) box(TEAK, -1.14 + 0.06, 1.14 - 0.06, 0.5, 0.56, -0.85 + k * 0.4, -0.85 + k * 0.4 + 0.28);
      box(TEAK, -1.14, 1.14, 0.6, 2.4, -1.12, -1.02, -0.16);      // the back's frame
      soft(-1.08, 1.08, 0.56, 1.12, -0.95, 1.08); soft(-1.0, 1.0, 1.05, 2.4, -0.98, -0.55, -0.18);      // seat cushion, back cushion
      if (cush === SAGE) soft(-0.5, 0.5, 1.12, 1.5, -0.5, -0.2, -0.3);      // and a scatter cushion
      const [sx2, sz2] = pw(cX, cY); K.collide(sx2 - 1.2, sx2 + 1.2, sz2 - 1.2, sz2 + 1.2, PAVE + 2.3, PAVE - 0.5); K.seat(sx2, PAVE + 1.05, sz2, lookTo(-Math.cos(a), -Math.sin(a)), 'sit in the chair');
    }
    for (const [dX, dY] of [[3.6, -1.6], [-3.4, 2.4]]) { const [lx, lz] = pw(GX + dX, GY + dY); E.lantern(lx, PAVE, lz, 0.95, 0); E.jar(lx + 0.6, PAVE, lz + 0.3); }
    E.pools.push([gx, gz, 7, 0.7]); E.perches.push([gx + 1.0, PAVE + 1.2, gz]);
  }

  // ---- the groups of pots, against the wall between the doors and on the south-west shoulder ---------------------------
  // each: [bearing, [[kind, height, material, along the wall (ft), out from the wall (ft), [[plant, scale], ...]], ...]]
  const FERN = s => [['fern', s]], GRASS = [['miscanthus', 0.62]], MOSSB = 'mossbowl';
  const GROUPS = [
    [135, [['jar', 2.6, CLAY[0], -2.2, 1.6, FERN(1.5)], ['jar', 1.9, CLAY[1], 0.0, 1.3, GRASS], ['bowl', 1.0, STONEP[0], 1.9, 1.9, MOSSB], ['pot', 1.3, CLAY[2], 3.3, 1.2, [['foxglove', 0.7], ['anemone', 0.5]]], ['jar', 1.7, CLAY[2], -0.8, 4.2, FERN(1.1)], ['pot', 1.1, STONEP[1], 1.2, 4.8, [['anemone', 0.6]]], ['bowl', 0.8, STONEP[0], 0.2, 6.0, MOSSB]]],
    [24, [['urn', 2.2, STONEP[1], -1.6, 1.6, FERN(1.2)], ['pot', 1.4, CLAY[1], 0.6, 1.2, [['anemone', 0.75]]], ['jar', 2.0, GLAZE, 2.3, 1.4, GRASS], ['bowl', 1.0, STONEP[0], -0.4, 3.6, MOSSB], ['jar', 1.6, CLAY[0], 1.4, 4.3, FERN(1.0)]]],
    [-24, [['jar', 2.5, CLAY[2], -1.8, 1.5, FERN(1.4)], ['bowl', 0.9, STONEP[0], 0.3, 1.9, MOSSB], ['pot', 1.2, CLAY[0], 1.8, 1.2, [['foxglove', 0.65]]]]],      // (it stands by the way to the east walk: it keeps to the wall)
  ];
  for (const [b, list] of GROUPS) {
    const a = b * Math.PI / 180, oX = Math.cos(a), oY = Math.sin(a), tX = -oY, tY = oX;
    for (const [kind, h, mat, along, out, plants] of list) {
      { const X = CX + oX * (RIN - out * 1.2) + tX * along * 1.25, Y = CY + oY * (RIN - out * 1.2) + tY * along * 1.25, [x, z] = pw(X, Y); E.pools.push([x, z, h * 1.6, 0.55]); }
      const X = CX + oX * (RIN - out * 1.2) + tX * along * 1.25, Y = CY + oY * (RIN - out * 1.2) + tY * along * 1.25, [x, z] = pw(X, Y), top = pot(x, z, kind, h * 1.25, mat);
      if (plants === MOSSB) {
        for (let i = 0; i < 6; i++) { const q = r() * TAU, d = r() * h * 0.45; Wd.add('moss', x + Math.cos(q) * d, top + 0.02 + i * 0.002, z + Math.sin(q) * d, 0.7 + r() * 0.4, { tint: 0.7 + r() * 0.4 }); }
        K.rock(PAINT.stone, x + 0.1, top + 0.12, z - 0.05, h * 0.32, h * 0.25, h * 0.26, r() * TAU, 1);
      } else for (const [p, s] of plants) for (let k = 0; k < (p === 'fern' ? 3 : 2); k++) plant(p, x + (r() - 0.5) * h * 0.25, top, z + (r() - 0.5) * h * 0.25, s * (0.8 + r() * 0.3), { tint: 0.8 + r() * 0.3 });
    }
    const [lx, lz] = pw(CX + oX * (RIN - 3.4) + tX * (list.length > 2 ? -3.6 : 2.6), CY + oY * (RIN - 3.4) + tY * (list.length > 2 ? -3.6 : 2.6));
    E.lantern(lx, PAVE, lz, 0.85, 0); E.jar(lx + 0.7, PAVE, lz + 0.4); E.jar(lx - 0.4, PAVE, lz + 0.8); E.pools.push([lx, lz, 3.2, 0.8]);      // candles in a group, in a pool of their light
    for (let i = 0; i < 5; i++) { const [fx, fz] = pw(CX + oX * (RIN - 2 - r() * 3) + tX * (r() - 0.5) * 6, CY + oY * (RIN - 2 - r() * 3) + tY * (r() - 0.5) * 6); E.fireflies.push([fx, PAVE + 1.2 + r() * 3, fz]); }
  }

  // ---- hanging baskets of trailing green, on iron brackets either side of the west and the east doors ---------------------
  {
    const NB = Math.sqrt(COURT.r ** 2 - 4.45 ** 2) - 0.75;      // the bays' inner faces, from the centre
    for (const [a, sd] of [[180, -1], [0, 1]]) {
      const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), tX = -s, tY = c, X0 = CX + c * NB + tX * sd * 3.75, Y0 = CY + s * NB + tY * sd * 3.75, [wx, wz] = pw(X0, Y0), [ox, oz] = pw(-c, -s), H = PAVE + 8.9;
      K.tube(PAINT.iron, [wx, H, wz], [wx + ox * 1.7, H, wz + oz * 1.7], 0.045, 6); K.tube(PAINT.iron, [wx, H - 0.9, wz], [wx + ox * 1.2, H, wz + oz * 1.2], 0.035, 6);
      const bx = wx + ox * 1.55, bz = wz + oz * 1.55, by = H - 1.9;
      K.tube(PAINT.iron, [bx, H, bz], [bx, by + 0.9, bz], 0.015, 4);
      K.lathe('c#6b5a44/0.95', bx, by, bz, [[0.01, 0], [0.4, 0.05], [0.72, 0.45], [0.78, 0.75], [0.72, 0.75]], 16);
      for (let k = 0; k < 6; k++) { const q = k * TAU / 6 + r() * 0.4; Wd.add('trailing', bx + Math.cos(q) * 0.55, by + 0.85, bz + Math.sin(q) * 0.55, 0.85 + r() * 0.35, { rot: q, tint: 0.8 + r() * 0.3 }); }
      for (let k = 0; k < 3; k++) Wd.add('hakone', bx + (r() - 0.5) * 0.6, by + 0.7, bz + (r() - 0.5) * 0.6, 0.5, { tint: 0.9 });
    }
    // one ivy going up the rock from a pot beside the north doors
    const a = 90, c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), X = CX + c * NB - 3.75, Y = CY + s * NB, [px, pz] = pw(X - 0.0, Y - 1.1);
    const top = pot(px, pz, 'pot', 1.5, CLAY[0]); plant('fern', px, top, pz, 0.6);
    const [ix, iz] = pw(X, Y - 0.12);
    for (let j = 0; j < 6; j++) Wd.add('ivy', ix + (r() - 0.5) * 0.3, PAVE + 1.2 + j * 2.5, iz + (r() - 0.5) * 0.5 * (j > 1 ? 2 : 1), 1, { w: 1.3 + (j > 1 && j < 5 ? 0.6 : 0) + r() * 0.3, h: 3.0, rot: Math.PI / 2 + Math.PI, tint: 0.75 + r() * 0.25 });
  }

  // ---- two scanned mossy boulders placed on the flags (notes/ASSETS.md), the tall one lit from its foot after dark -------------
  for (const [id, X, Y, sc, rot, lit] of [['mossy_rock_04', 45.5, 37.0, 0.36, 2.1, true]]) {
    const [x, z] = pw(X, Y); K.model(id, x, z, rot, { y: PAVE - 0.05, scale: sc, collide: true });
    E.perches.push([x, PAVE + (lit ? 2.0 : 1.0), z]);
    if (lit) { const dX = CX - X, dY = CY - Y, l = Math.hypot(dX, dY), [fx, fz] = pw(X + dX / l * 2.0, Y + dY / l * 2.0);
      K.cyl('c#3a3226/0.4/1', fx, PAVE, PAVE + 0.16, fz, 0.16, 0.14, 10); B.mesh('e#ffe2b4/1.6', new THREE.CylinderGeometry(0.09, 0.09, 0.03, 10).translate(fx, PAVE + 0.17, fz)); K.lamp(fx, PAVE + 1.3, fz, 0.9); }
  }

  // ---- at the brink by the parapet: the hot tub and its stove, the two loungers, a low table, the paper lantern ----------------
  const parY = X => CY - Math.sqrt(Math.max(0, RIN ** 2 - (X - CX) ** 2));      // the parapet's inner face at X
  {
    const TX = CX - 13.5, TY = CY - 8.3, TR = 2.8, [x, z] = pw(TX, TY), STEEL = 'c#9a9b97/0.35/1', IRONK = 'c#2b2a28/0.5/1';
    const lathe = (mat, prof, seg = 36) => { const g = new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a, b)), seg), uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 17.6, uv.getY(i) * 3); g.translate(x, PAVE + 0.25, z); B.mesh(mat, g); };
    lathe('oak_light#6f5238', [[0.01, 0], [TR - 0.18, 0], [TR - 0.12, 0.1], [TR, 2.6], [TR + 0.02, 2.68], [TR - 0.08, 2.72]]);
    lathe('oak_light#9a7a58', [[TR - 0.14, 2.7], [TR - 0.2, 2.5], [TR - 0.28, 0.3], [0.01, 0.28]]);
    for (const h of [0.55, 2.1]) put(IRONK, new THREE.TorusGeometry(TR - 0.11 + h * 0.042, 0.045, 5, 44).rotateX(Math.PI / 2).translate(x, PAVE + 0.25 + h, z));
    for (const d of [-1.1, 1.1]) K.box('c#4a3a2c/0.9', x + d - 0.2, x + d + 0.2, PAVE, PAVE + 0.27, z - 2.4, z + 2.4);
    B.mesh('water', new THREE.CircleGeometry(TR - 0.25, 36).rotateX(-Math.PI / 2).translate(x, PAVE + 2.45, z));
    E.tub = { x, z, water: PAVE + 2.45, r: TR - 0.3 };
    K.collide(x - TR, x + TR, z - TR, z + TR, PAVE + 3, PAVE - 0.5);
    const [sx, sz] = pw(TX - 1.2, TY + 3.9), sy = PAVE;
    K.cyl(STEEL, sx, sy + 0.25, sy + 2.4, sz, 0.6, 0.6, 16); K.cyl(IRONK, sx, sy + 2.4, sy + 2.52, sz, 0.64, 0.55, 16); K.cyl(IRONK, sx, sy, sy + 0.25, sz, 0.45, 0.5, 12);
    K.cyl(STEEL, sx, sy + 2.52, sy + 7.6, sz, 0.15, 0.15, 10); K.cyl(IRONK, sx, sy + 7.6, sy + 7.85, sz, 0.27, 0.2, 10);
    const toTub = new THREE.Vector2(x - sx, z - sz).normalize();
    for (const h of [0.9, 1.6]) K.tube(STEEL, [sx + toTub.x * 0.55, sy + h, sz + toTub.y * 0.55], [x - toTub.x * (TR - 0.05), sy + h + 0.5, z - toTub.y * (TR - 0.05)], 0.07, 8);
    E.stove = { x: sx + 0.61, y: sy + 1.0, z: sz };      // (its door looks north, into the terrace)
    K.box(IRONK, sx + 0.55, sx + 0.64, sy + 0.6, sy + 1.4, sz - 0.33, sz + 0.33);
    K.collide(sx - 0.75, sx + 0.75, sz - 0.75, sz + 0.75, sy + 7.5, sy - 0.5);
    // an oak step on the terrace side; the seat inside, looking out of the vault's mouth
    const yaw = yawTo(1, -0.15), m = new THREE.Matrix4().makeRotationY(yaw).setPosition(x, PAVE, z);
    for (const [y0, y1, z0, z1] of [[0, 0.85, TR, TR + 0.95], [0.85, 1.7, TR - 0.01, TR + 0.48]]) put('c#7a5c40/0.85', new THREE.BoxGeometry(1.7, y1 - y0, z1 - z0).translate(0, (y0 + y1) / 2, (z0 + z1) / 2).applyMatrix4(m));
    { const [sx2, sz2] = pw(TX + 0.3, TY + 0.3); K.seat(sx2, PAVE + 1.5, sz2, lookTo(0.3, -1), 'slip into the hot tub'); }
  }
  {
    const WAL = 'c#4e3424/0.7', CUSH = 'c#d3c29e/0.95', TOWEL = 'c#ece6d8/0.95';
    const PROF = [[3.15, 0.95], [1.9, 1.02], [0.5, 1.02], [-0.35, 1.1], [-1.05, 1.42], [-1.65, 1.95], [-2.15, 2.6]];
    for (const dX of [-8.2, -4.4]) {
      const X = CX + dX, Y = CY - 11.2, yaw = yawTo(0.1, -1), m = new THREE.Matrix4().makeRotationY(yaw).setPosition(...[Y, PAVE, X]), c = Math.cos(yaw), s = Math.sin(yaw), at = (lx, lz) => [Y + lx * c + lz * s, X - lx * s + lz * c], geo = (mat, g) => put(mat, g.applyMatrix4(m));
      for (let k = 0; k < PROF.length - 1; k++) {
        const [z0, y0] = PROF[k], [z1, y1] = PROF[k + 1], len = Math.hypot(z1 - z0, y1 - y0), ang = Math.atan2(y1 - y0, -(z1 - z0)), mz = (z0 + z1) / 2, my = (y0 + y1) / 2;
        const seg = (mat, w, t, dx, up) => { const g = new THREE.BoxGeometry(w, t, len + 0.04); g.rotateX(ang); g.translate(dx, my + up, mz); geo(mat, g); };
        for (const sd of [-1, 1]) seg(WAL, 0.13, 0.22, sd * 1.0, -0.11);
        seg(CUSH, 1.9, 0.3, 0, 0.16);
      }
      for (const [lz, ly] of [[2.7, 0.97], [-1.2, 1.5]]) for (const sd of [-1, 1]) { const [ax, az] = at(sd * 1.0, lz), [bx, bz] = at(sd * 1.22, lz + (lz > 0 ? 0.25 : -0.25)); K.beam(WAL, [ax, PAVE + ly - 0.15, az], [bx, PAVE, bz], 0.11); }
      for (let k = 0; k < 2; k++) geo(WAL, new THREE.BoxGeometry(2.0, 0.08, 0.1).translate(0, [0.82, 1.3][k], [1.9, -0.6][k]));
      geo(TOWEL, new THREE.CylinderGeometry(0.16, 0.16, 1.2, 10).rotateZ(Math.PI / 2).translate(0, 2.74, -2.0));
      for (const lz of [-1.8, 0, 2.2]) { const [bx, bz] = at(0, lz); K.collide(bx - 1.2, bx + 1.2, bz - 1.2, bz + 1.2, PAVE + 2.2, PAVE - 0.5); }
      K.seat(Y, PAVE + 1.25, X, lookTo(0, -1), 'lie back on the lounger');
    }
    const TX = CX - 6.3, TY = CY - 14.6, [tx, tz] = pw(TX, TY);
    K.cyl(WAL, tx, PAVE + 1.18, PAVE + 1.28, tz, 0.62, 0.62, 22);
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + 0.3; K.beam(WAL, [tx + Math.cos(a) * 0.32, PAVE + 1.18, tz + Math.sin(a) * 0.32], [tx + Math.cos(a) * 0.5, PAVE, tz + Math.sin(a) * 0.5], 0.07); }
    K.collide(tx - 0.62, tx + 0.62, tz - 0.62, tz + 0.62, PAVE + 1.3, PAVE - 0.5);
    K.lathe('glass', tx + 0.2, PAVE + 1.28, tz - 0.1, [[0.01, 0], [0.2, 0], [0.24, 0.3], [0.12, 0.62], [0.08, 0.8], [0.09, 0.86]], 14);
    K.lathe('glass', tx - 0.25, PAVE + 1.28, tz + 0.2, [[0.01, 0], [0.11, 0], [0.13, 0.36], [0.12, 0.36]], 12);
    // the paper lantern (Noguchi's Akari) behind the loungers, and a candle lantern on the flags beside the tub
    const [ax, az] = pw(CX - 10.3, CY - 13.0), y0 = PAVE + 0.5, y1 = PAVE + 3.4;
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3; K.tube(PAINT.iron, [ax + Math.cos(a) * 0.4, PAVE, az + Math.sin(a) * 0.4], [ax + Math.cos(a) * 0.3, y0, az + Math.sin(a) * 0.3], 0.02, 4); }
    B.mesh('e#ffe2b4/1.4', new THREE.CylinderGeometry(0.62, 0.55, y1 - y0, 20, 1, true).translate(ax, (y0 + y1) / 2, az));
    for (let h = y0 + 0.15; h < y1; h += 0.34) put('c#8a7a62/0.9', new THREE.TorusGeometry(0.55 + (h - y0) / (y1 - y0) * 0.075, 0.012, 3, 24).rotateX(Math.PI / 2).translate(ax, h, az));
    K.lamp(ax, (y0 + y1) / 2, az, 0.7);
    K.collide(ax - 0.6, ax + 0.6, az - 0.6, az + 0.6, y1, PAVE - 0.5);
    E.perches.push([Y_parapet(CX - 13.5), PAVE + 2.62, CX - 13.5], [Y_parapet(CX + 13.5), PAVE + 2.62, CX + 13.5], [9.8, PAVE + 2.62, 31], [9.8, PAVE + 2.62, 92]);      // (the parapet's top: the robin's)
  }

  // ---- the light: lit like a courtyard restaurant under the rock (warm, low, many small sources; three lamps that cast: the
  // paper lantern, the lit boulder's fitting, and the uplight under the pine) --------------------------------------------------
  {
    const GLOW = 'e#ffd9a0/2.0', IRON = PAINT.iron;      // (ffd9a0: lighting.js leaves a quarter of it by day: soft points in the shade)
    const wallPt = (a, h) => { const [X, Y] = polar(a, RIN - 0.05); const [x, z] = pw(X, Y); return new THREE.Vector3(x, h, z); };
    // festoons, properly made: a dark cable in a true catenary from an iron eye-bolt on the stone (above the ground-floor
    // window heads, below the upper sills: no string crosses glass) to an iron ring hung from the vault over the middle;
    // a bulb every foot on a short pigtail from its socket, a small glass globe with a warm filament and a soft halo.
    // Everything that hangs swings in the wind (grounds.js, swinging()).
    const HUB = { X: CX - 1, Y: CY + 7, h: PAVE + 20.5 }, [hx, hz] = pw(HUB.X, HUB.Y), hub = new THREE.Vector3(hx, HUB.h, hz);
    E.swayPart('iron', new THREE.TorusGeometry(0.9, 0.06, 6, 24).rotateX(Math.PI / 2).translate(hx, HUB.h, hz), 0.15, 0);
    E.swayPart('iron', new THREE.CylinderGeometry(0.03, 0.03, 26, 4).translate(hx, HUB.h + 13, hz), 0.05, 0);
    const globe = new THREE.SphereGeometry(0.11, 10, 8), sock = new THREE.CylinderGeometry(0.035, 0.045, 0.09, 6), pig = new THREE.CylinderGeometry(0.008, 0.008, 0.16, 3);
    const cosh = x => (Math.exp(x) + Math.exp(-x)) / 2;
    [-12, 18, 42, 66, 114, 138, 162, 194].forEach((brg, si) => {
      const [AX, AY] = polar(brg, RIN - 0.05), [ax, az] = pw(AX, AY), A = new THREE.Vector3(ax, PAVE + 12.3, az), C = hub.clone().add(new THREE.Vector3(Math.cos(brg * Math.PI / 180) * 0, 0, 0));
      const dx = A.x - hub.x, dz = A.z - hub.z, Lh = Math.hypot(dx, dz), ux = dx / Lh, uz = dz / Lh, Cp = new THREE.Vector3(hub.x + ux * 0.9, hub.y, hub.z + uz * 0.9);
      E.swayPart('iron', new THREE.CylinderGeometry(0.03, 0.03, 0.55, 6).rotateZ(Math.PI / 2).rotateY(-Math.atan2(uz, ux)).translate(A.x - ux * 0.25, A.y, A.z - uz * 0.25), 0, 0);      // the eye-bolt
      const span = Math.hypot(A.x - Cp.x, A.z - Cp.z), aC = span * 0.9, x0 = span / 2 + aC * Math.asinh((A.y - Cp.y) / (2 * aC * Math.sinh(span / (2 * aC)))) * 0, n = Math.round(span / 1.0);
      // a catenary between the two ends: y(s) = y lerp + sag shaped by cosh (sag about a tenth of the span)
      const sag = span * 0.11, yAt = t => Cp.y + (A.y - Cp.y) * t - sag * (1 - (cosh((t - 0.5) * 2.2) - 1) / (cosh(1.1) - 1));
      void x0;
      let prev = Cp.clone();
      for (let i = 1; i <= n; i++) {
        const t = i / n, P = new THREE.Vector3(Cp.x + (A.x - Cp.x) * t, yAt(t), Cp.z + (A.z - Cp.z) * t), amp = 0.6 * Math.sin(Math.PI * t), ph = si * 1.7;
        const d = P.clone().sub(prev), len = d.length(), seg = new THREE.CylinderGeometry(0.016, 0.016, len, 4); seg.translate(0, len / 2, 0); seg.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); seg.translate(prev.x, prev.y, prev.z);
        E.swayPart('iron', seg, 0.6 * Math.sin(Math.PI * (t - 0.5 / n)), ph); prev = P;
        if (i < n) {
          E.swayPart('iron', pig.clone().translate(P.x, P.y - 0.08, P.z), amp, ph); E.swayPart('iron', sock.clone().translate(P.x, P.y - 0.2, P.z), amp, ph);
          E.swayPart('bulb', globe.clone().scale(1, 1.15, 1).translate(P.x, P.y - 0.36, P.z), amp, ph);
          E.sway.halo.push([P.x, P.y - 0.36, P.z, amp, ph, 1.0]);
          if (i % 4 === 2) E.pools.push([P.x, P.z, 5.5, 0.2]);
        }
      }
    });
    // lanterns from the vault on chains of different lengths, in three sizes of one family (iron frame, glass, a candle):
    // high over the middle, lower over the pots and the seating; none lower than 7.6 ft where anyone walks
    const vaultAt = (X, Y) => PAVE + 30.6 + 24 * Math.sqrt(Math.max(0, 1 - (Math.hypot(X - CX, Y - CY) / 25) ** 2)) - 1.5;
    const hanger = (X, Y, bottom, s, ph) => {
      const [x, z] = pw(X, Y), top = vaultAt(X, Y), h = s * 1.5, w = s * 0.5, y0 = PAVE + bottom, amp = Math.min(1.1, (top - y0) * 0.035);
      E.swayPart('iron', new THREE.CylinderGeometry(0.02, 0.02, top - (y0 + h + s * 0.45), 4).translate(x, (top + y0 + h + s * 0.45) / 2, z), amp * 0.5, ph);
      for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) E.swayPart('iron', new THREE.BoxGeometry(0.05 * s, h, 0.05 * s).translate(x + dx * w, y0 + h / 2, z + dz * w), amp, ph);
      E.swayPart('iron', new THREE.BoxGeometry(w * 2.2, 0.08 * s, w * 2.2).translate(x, y0, z), amp, ph);
      E.swayPart('iron', new THREE.ConeGeometry(w * 1.5, s * 0.45, 4).rotateY(Math.PI / 4).translate(x, y0 + h + s * 0.22, z), amp, ph);
      E.swayPart('iron', new THREE.TorusGeometry(s * 0.12, 0.02, 4, 10).translate(x, y0 + h + s * 0.5, z), amp, ph);
      E.swayPart('glass', new THREE.BoxGeometry(w * 1.94, h * 0.94, w * 1.94).translate(x, y0 + h / 2, z), amp, ph);
      E.swayPart('candle', new THREE.CylinderGeometry(w * 0.3, w * 0.3, h * 0.35, 8).translate(x, y0 + 0.08 * s + h * 0.175, z), amp, ph);
      E.sway.halo.push([x, y0 + h * 0.45, z, amp, ph, 2.2 * s]);
      E.pools.push([x, z, 4 + bottom * 0.35, 0.42]);
    };
    [[CX - 6, CY + 2, 11.5, 1.6], [CX + 6, CY - 1, 13.0, 1.6], [CX + 1, CY + 13, 9.5, 1.2], [CX - 9, CY + 12, 12.0, 1.2], [CX + 12, CY + 7, 10.5, 1.2],
     [CX - 15.5, CY + 15.5, 7.8, 0.9], [CX + 17.5, CY + 8.5, 7.8, 0.9], [CX + 15.5, CY - 6.5, 8.0, 0.9], [CX - 17, CY - 3, 8.0, 0.9], [CX - 6.5, CY - 11.5, 8.6, 1.2], [CX + 7.5, CY + 13, 7.9, 0.9]]
      .forEach(([X, Y, b, s], i) => hanger(X, Y, b, s, 0.9 + i * 2.3));
    for (let i = 0; i < 4; i++) E.pools.push([...pw(CX + (i - 1.5) * 5, CY + (i % 2 ? 4 : -4)), 7, 0.25]);      // and the middle lit by all of it
    // wall lanterns on iron brackets beside each of the three doors
    const NB = Math.sqrt(COURT.r ** 2 - 4.45 ** 2) - 0.75;
    for (const a of [180, 90, 0]) for (const sd of [-1, 1]) {
      const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), X = CX + c * (NB - 0.05) - s * sd * 3.75, Y = CY + s * (NB - 0.05) + c * sd * 3.75, [x, z] = pw(X, Y), [ox, oz] = pw(-c, -s);
      if (a !== 90 && sd === (a === 180 ? -1 : 1)) continue;      // (the hanging baskets have that side of the west and east doors)
      const H = PAVE + 7.6; K.tube(IRON, [x, H, z], [x + ox * 0.7, H, z + oz * 0.7], 0.035, 5); E.lantern(x + ox * 0.75, H - 1.2, z + oz * 0.75, 0.7, 0, H);
      E.washes.push([x + ox * 0.08, z + oz * 0.08, Math.atan2(ox, oz), 3.2, 9, 0.7]);
    }
    // uplights at the foot of the wall washing the rock between the windows, and a glow under the parapet's coping
    const PIERS = [166, 146, 126, 108, 72, 54, 34, 14];
    for (const a of PIERS) { const p = wallPt(a, PAVE), c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180), [ox, oz] = pw(-c, -s);
      E.washes.push([p.x + ox * 0.06, p.z + oz * 0.06, Math.atan2(ox, oz), 3.4, 15, 1]); B.mesh(GLOW, new THREE.BoxGeometry(0.5, 0.06, 0.5).translate(p.x + ox * 0.45, PAVE + 0.06, p.z + oz * 0.45)); }
    { const a0 = 180 + 35, a1 = 360 - 35, n = 40;
      for (let i = 0; i < n; i++) { const q0 = (a0 + (a1 - a0) * i / n) * Math.PI / 180, q1 = (a0 + (a1 - a0) * (i + 1) / n) * Math.PI / 180, rr = COURT.r - 0.78, y = PAVE + 2.42;
        const [x0, z0] = pw(CX + rr * Math.cos(q0), CY + rr * Math.sin(q0)), [x1, z1] = pw(CX + rr * Math.cos(q1), CY + rr * Math.sin(q1));
        const g = new THREE.BoxGeometry(0.05, 0.05, Math.hypot(x1 - x0, z1 - z0)); g.lookAt(new THREE.Vector3(x1 - x0, 0, z1 - z0)); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2); B.mesh(GLOW, g);
        if (i % 2 === 0) { const qm = (q0 + q1) / 2, [px, pz] = pw(CX + (rr - 1.0) * Math.cos(qm), CY + (rr - 1.0) * Math.sin(qm)); E.pools.push([px, pz, 2.2, 0.35]); } }
    }
    // the pine lit from below (a lamp the engine lights), its bowl in a pool of light; the loungers and the tub in theirs
    { const [bX, bY] = [PINE.X, PINE.Y], [x, z] = pw(bX, bY); K.lamp(x - 1.2, PAVE + 3.2, z - 0.8, 1.4); E.pools.push([x, z, 5.5, 0.9]); for (let k = 0; k < 3; k++) { const q = k * TAU / 3 + 0.5; B.mesh(GLOW, new THREE.CylinderGeometry(0.07, 0.07, 0.03, 8).translate(x + Math.cos(q) * 1.3, PAVE + 1.54, z + Math.sin(q) * 1.3)); } }
    for (const dX of [-8.2, -4.4, -6.3]) { const [x, z] = pw(CX + dX, CY - 11.5); E.pools.push([x, z, 4.2, 0.7]); }
    { const [x, z] = pw(CX - 13.5, CY - 8.3); E.pools.push([x, z, 5, 0.6]); }
  }
}
function Y_parapet(X) { return CY - Math.sqrt(Math.max(0, COURT.r ** 2 - (X - CX) ** 2)); }
